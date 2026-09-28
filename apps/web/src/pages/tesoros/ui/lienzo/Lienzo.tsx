import { moverPaso, type LiquidacionPorLaFila } from '@maun/domain';
import {
  Background,
  BackgroundVariant,
  getSmoothStepPath,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStore,
  useStoreApi,
  type AriaLabelConfig,
  type Connection,
  type ConnectionLineComponentProps,
  type IsValidConnection,
  type NodeChange,
} from '@xyflow/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import {
  deshacerElBorrador,
  editarLaFila,
  fichaDelEstante,
  moverUnLugar,
  queFichaEs,
  rehacerElBorrador,
  sacar,
  tesoroDe,
  type VistaDeLaFila,
} from '@/features/armar-la-fila';

import {
  armarElPlano,
  centrosDeLosPasos,
  huecoDelArrastre,
  type AristaDelPlano,
  type Arrastre,
  type NodoDelPlano,
} from '../../model/disposicion';
import {
  encuadreDe,
  entraEnLaVista,
  formaDelPlano,
  limitesDe,
  type Alineado,
  type Relleno,
} from '../../model/encuadre';
import {
  anuncioDelMovimiento,
  aplicarLaUnion,
  fraseDeLaUnion,
  unionDe,
  type LugarDelNuevo,
} from '../../model/uniones';
import { AristaDePlata } from './Aristas';
import { ContextoDeLasAristas, ContextoDeLasFichas } from './contextos';
import {
  NodoDiezmo,
  NodoEstante,
  NodoNuevoTesoro,
  NodoOrigen,
  NodoParte,
  NodoPaso,
  NodoReparto,
  NodoTitulo,
} from './Nodos';
import { RotuloConZoom, ZoomEnCss, ZoomFlotante } from './Zoom';

export type RellenoDelLienzo = Relleno;

export interface PedidoDeTesoroNuevo {
  despuesDe: string | null | undefined;
  lugar: LugarDelNuevo | 'estante';
}

export interface LienzoProps {
  vista: VistaDeLaFila;
  resultado: LiquidacionPorLaFila | null;
  elegido: string | null;
  alElegir: (id: string | null) => void;
  modo: 'editar' | 'mirar';
  pie: 'rotulo' | 'flotante';
  revision: number;
  rige: string;
  relleno: RellenoDelLienzo;
  alineado?: Alineado;
  alSumar?: (despuesDe: string | null, boton: HTMLElement) => void;
  alPedirNuevo?: (pedido: PedidoDeTesoroNuevo) => void;
  tapadoDesde?: () => number | null;
  flotaDesde?: () => number | null;
}

const MARGEN_AL_CORRER = 16;
const INTENTOS_DEL_FOCO = 3;

function enfocarLaFicha(id: string | null, intentos = INTENTOS_DEL_FOCO): void {
  if (id === null) return;
  const activo = document.activeElement;
  if (activo !== null && activo !== document.body && activo.isConnected) return;
  const ficha = [...document.querySelectorAll<HTMLElement>('.react-flow__node')].find(
    (nodo) => nodo.dataset.id === id,
  );
  if (ficha !== undefined) {
    ficha.focus({ preventScroll: true });
    return;
  }
  if (intentos > 0) {
    requestAnimationFrame(() => {
      enfocarLaFicha(id, intentos - 1);
    });
  }
}

const TIPOS_DE_NODO = {
  origen: NodoOrigen,
  diezmo: NodoDiezmo,
  paso: NodoPaso,
  reparto: NodoReparto,
  parte: NodoParte,
  estante: NodoEstante,
  nuevo: NodoNuevoTesoro,
  titulo: NodoTitulo,
};

const TIPOS_DE_ARISTA = { plata: AristaDePlata };

type Describir = (desde: string, hacia: string | null) => string;

const ContextoDeLaConexion = createContext<Describir>(() => '');

function LineaDeConexion({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
  fromNode,
  toNode,
}: ConnectionLineComponentProps<NodoDelPlano>) {
  const describir = useContext(ContextoDeLaConexion);
  const [camino] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
    borderRadius: 10,
  });
  const texto = describir(fromNode.id, toNode?.id ?? null);
  return (
    <g>
      <path
        d={camino}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth={1.5}
        strokeDasharray="12 3 2 3"
      />
      <circle cx={toX} cy={toY} r={4} fill="var(--color-ink)" />
      <foreignObject x={toX + 14} y={toY - 40} width={340} height={36} className="overflow-visible">
        <div
          role="status"
          className="inline-flex items-center gap-1.5 rounded-control bg-ink px-2 py-1 text-meta font-medium whitespace-nowrap text-paper shadow-float"
        >
          {texto}
        </div>
      </foreignObject>
    </g>
  );
}

function esCampo(destino: EventTarget): boolean {
  return (
    destino instanceof HTMLElement &&
    (destino.tagName === 'INPUT' || destino.tagName === 'TEXTAREA' || destino.isContentEditable)
  );
}

function LienzoInterno({
  vista,
  resultado,
  elegido,
  alElegir,
  modo,
  pie,
  revision,
  rige,
  relleno,
  alineado = 'centro',
  alSumar,
  alPedirNuevo,
  tapadoDesde,
  flotaDesde,
}: LienzoProps) {
  const store = useStoreApi<NodoDelPlano, AristaDelPlano>();
  const { zoomTo } = useReactFlow<NodoDelPlano, AristaDelPlano>();
  const editable = modo === 'editar';
  const armando = vista.armando && editable;
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [yDelArrastrado, setYDelArrastrado] = useState<number | null>(null);
  const conectando = useStore((estado) => estado.connection.inProgress);
  const vistaDelPlano = useMemo(
    () => (editable ? vista : { ...vista, armando: false }),
    [editable, vista],
  );

  const plano = useMemo(
    () => armarElPlano({ vista: vistaDelPlano, prueba: resultado, elegido, arrastre }),
    [vistaDelPlano, resultado, elegido, arrastre],
  );

  const actual = useRef({
    vista,
    elegido,
    nodos: plano.nodos,
    relleno,
    alineado,
    tapadoDesde,
    flotaDesde,
  });

  useLayoutEffect(() => {
    actual.current = {
      vista,
      elegido,
      nodos: plano.nodos,
      relleno,
      alineado,
      tapadoDesde,
      flotaDesde,
    };
  });

  const cubiertoAbajo = useCallback((): number => {
    const { flotaDesde: flota } = actual.current;
    const { domNode } = store.getState();
    const desde = flota?.() ?? null;
    if (desde === null || domNode === null) return 0;
    return Math.max(0, domNode.getBoundingClientRect().bottom - desde);
  }, [store]);

  const correr = useCallback(() => {
    const { elegido: laElegida, tapadoDesde: tapado, nodos: losNodos } = actual.current;
    if (laElegida === null || tapado === undefined) return;
    const desde = tapado();
    const nodo = losNodos.find((candidato) => candidato.id === laElegida);
    const { domNode, transform, panZoom } = store.getState();
    if (desde === null || nodo === undefined || domNode === null || panZoom === null) return;
    const [x, y, zoom] = transform;
    const caja = domNode.getBoundingClientRect();
    const limite = desde - caja.top - MARGEN_AL_CORRER;
    const arriba = y + nodo.position.y * zoom;
    const abajo = arriba + (nodo.height ?? 0) * zoom;
    let corrimiento = 0;
    if (abajo > limite) corrimiento = limite - abajo;
    if (arriba + corrimiento < MARGEN_AL_CORRER) corrimiento = MARGEN_AL_CORRER - arriba;
    if (corrimiento === 0) return;
    void panZoom.setViewport({ x, y: y + corrimiento, zoom }, { duration: 0 });
    store.setState({ transform: [x, y + corrimiento, zoom] });
  }, [store]);

  const encuadrar = useCallback(() => {
    const { nodos: losNodos, relleno: elRelleno, alineado: alineacion } = actual.current;
    const limites = limitesDe(losNodos);
    const { width, height, panZoom } = store.getState();
    if (limites === null || panZoom === null || width <= 0 || height <= 0) return;
    const abajo = Math.max(elRelleno.abajo, cubiertoAbajo() + MARGEN_AL_CORRER);
    const encuadre = encuadreDe(limites, width, height, { ...elRelleno, abajo }, alineacion);
    void panZoom.setViewport(encuadre, { duration: 0 });
    store.setState({ transform: [encuadre.x, encuadre.y, encuadre.zoom] });
    correr();
  }, [store, cubiertoAbajo, correr]);

  const [encuadrado, setEncuadrado] = useState(false);

  useLayoutEffect(() => {
    let hecho = false;
    const siEstaListo = () => {
      const { panZoom, width, height } = store.getState();
      if (hecho || panZoom === null || width <= 0 || height <= 0) return;
      hecho = true;
      encuadrar();
      setEncuadrado(true);
    };
    siEstaListo();
    return store.subscribe(siEstaListo);
  }, [store, encuadrar]);

  const forma = formaDelPlano(plano.nodos);
  const formaEncuadrada = useRef(forma);

  useEffect(() => {
    if (arrastre !== null || conectando || formaEncuadrada.current === forma) return;
    formaEncuadrada.current = forma;
    const limites = limitesDe(plano.nodos);
    const { transform, width, height } = store.getState();
    if (limites === null || width <= 0 || height <= 0) return;
    const [x, y, zoom] = transform;
    if (!entraEnLaVista(limites, { x, y, zoom }, width, height - cubiertoAbajo())) encuadrar();
  }, [forma, arrastre, conectando, plano.nodos, store, cubiertoAbajo, encuadrar]);

  useEffect(() => {
    correr();
  }, [elegido, plano.nodos, correr]);

  const centros = useMemo(() => centrosDeLosPasos(vistaDelPlano), [vistaDelPlano]);

  const nodos = useMemo(
    () =>
      plano.nodos.map((nodo) =>
        arrastre !== null && nodo.type === 'paso' && nodo.data.paso.tesoro === arrastre.tesoro
          ? yDelArrastrado === null
            ? nodo
            : { ...nodo, position: { x: nodo.position.x, y: yDelArrastrado }, dragging: true }
          : nodo,
      ),
    [plano.nodos, arrastre, yDelArrastrado],
  );

  const alCambiarNodos = useCallback(
    (cambios: NodeChange<NodoDelPlano>[]) => {
      let elegida: string | null | undefined;
      for (const cambio of cambios) {
        if (cambio.type === 'select') {
          if (cambio.selected) elegida = cambio.id;
          else if (cambio.id === actual.current.elegido && elegida === undefined) elegida = null;
        }
        if (cambio.type === 'position' && cambio.dragging === true && cambio.position) {
          const ficha = queFichaEs(cambio.id);
          if (ficha?.tipo !== 'paso') continue;
          const alto = plano.nodos.find((nodo) => nodo.id === cambio.id)?.height ?? 0;
          const hueco = huecoDelArrastre(centros, ficha.tesoro, cambio.position.y + alto / 2);
          setYDelArrastrado(cambio.position.y);
          setArrastre((previo) =>
            previo?.tesoro === ficha.tesoro && previo.hueco === hueco
              ? previo
              : { tesoro: ficha.tesoro, hueco },
          );
        }
      }
      if (elegida !== undefined) alElegir(elegida);
    },
    [plano.nodos, centros, alElegir],
  );

  const alSoltarLaFicha = useCallback(() => {
    if (arrastre === null) return;
    const { tesoro, hueco } = arrastre;
    editarLaFila(vista, (fila) => {
      const lugar = fila.pasos.findIndex((paso) => paso.tesoro === tesoro);
      if (lugar === -1 || lugar === hueco) return fila;
      return moverPaso(fila, tesoro, Math.min(hueco, fila.pasos.length - 1));
    });
    setArrastre(null);
    setYDelArrastrado(null);
  }, [arrastre, vista]);

  const esValida = useCallback<IsValidConnection>(
    (conexion) =>
      unionDe(
        actual.current.vista.fila,
        actual.current.vista.tesoros,
        conexion.source,
        conexion.target,
      ) !== null,
    [],
  );

  const alConectar = useCallback(
    (conexion: Connection) => {
      const { vista: laVista } = actual.current;
      const union = unionDe(laVista.fila, laVista.tesoros, conexion.source, conexion.target);
      if (union === null) return;
      if (union.tipo === 'nuevo') {
        alPedirNuevo?.({ despuesDe: union.despuesDe, lugar: union.lugar });
        return;
      }
      const aplicada = aplicarLaUnion(laVista.fila, laVista.tesoros, union);
      editarLaFila(laVista, () => aplicada.fila);
      alElegir(aplicada.elegir);
    },
    [alPedirNuevo, alElegir],
  );

  const describir = useCallback<Describir>((desde, hacia) => {
    const { vista: laVista } = actual.current;
    const union = hacia === null ? null : unionDe(laVista.fila, laVista.tesoros, desde, hacia);
    return fraseDeLaUnion(
      laVista.fila,
      (tesoro) => tesoroDe(laVista, tesoro).nombre,
      union,
      hacia !== null,
    );
  }, []);

  const anunciar = useCallback((direccion: string): string => {
    const { vista: laVista, elegido: laElegida } = actual.current;
    const ficha = laElegida === null ? null : queFichaEs(laElegida);
    if (ficha?.tipo !== 'paso') return 'Solo los pasos de la fila cambian de lugar.';
    return anuncioDelMovimiento(
      laVista.fila,
      ficha.tesoro,
      tesoroDe(laVista, ficha.tesoro).nombre,
      direccion === 'up' ? -1 : 1,
    );
  }, []);

  const etiquetas = useMemo<Partial<AriaLabelConfig>>(
    () => ({
      'node.a11yDescription.default': 'Enter o espacio elige la ficha y Escape la suelta.',
      'node.a11yDescription.keyboardDisabled':
        'Enter o espacio elige la ficha y Escape la suelta. Mientras editás la fila, Alt con las flechas de arriba y abajo cambia de lugar el paso elegido y Suprimir lo saca de la fila.',
      'node.a11yDescription.ariaLiveMessage': ({ direction }) => anunciar(direction),
      'edge.a11yDescription.default': 'Flecha por donde baja la plata.',
      'controls.ariaLabel': 'Controles del plano',
      'controls.zoomIn.ariaLabel': 'Acercar',
      'controls.zoomOut.ariaLabel': 'Alejar',
      'controls.fitView.ariaLabel': 'Ver toda la fila',
      'controls.interactive.ariaLabel': 'Dejar de mover el plano',
      'minimap.ariaLabel': 'Croquis de la fila',
      'handle.ariaLabel': 'Manija para unir con otro tesoro',
    }),
    [anunciar],
  );

  const enfocarLaElegidaDespues = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        enfocarLaFicha(actual.current.elegido);
      });
    });
  };

  const alTeclearAntes = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (esCampo(evento.target)) return;
    if (
      !(evento.target instanceof HTMLElement) ||
      evento.target.closest('.react-flow__node') === null
    ) {
      return;
    }
    if (evento.key === 'Escape') {
      evento.stopPropagation();
      evento.preventDefault();
      if (elegido !== null) alElegir(null);
      return;
    }
    if (!evento.key.startsWith('Arrow')) return;
    evento.stopPropagation();
    if (!armando || !evento.altKey || (evento.key !== 'ArrowUp' && evento.key !== 'ArrowDown')) {
      return;
    }
    evento.preventDefault();
    const ficha = elegido === null ? null : queFichaEs(elegido);
    const hacia = evento.key === 'ArrowUp' ? -1 : 1;
    store.setState({ ariaLiveMessage: anunciar(hacia === -1 ? 'up' : 'down') });
    if (ficha?.tipo !== 'paso') return;
    editarLaFila(vista, (fila) => moverUnLugar(fila, ficha.tesoro, hacia));
  };

  const alTeclear = (evento: KeyboardEvent<HTMLDivElement>) => {
    const comando = evento.metaKey || evento.ctrlKey;
    if (comando && evento.key.toLowerCase() === 'z') {
      if (!armando) return;
      evento.preventDefault();
      if (evento.shiftKey) rehacerElBorrador();
      else deshacerElBorrador();
      enfocarLaElegidaDespues();
      return;
    }
    if (esCampo(evento.target) || comando || evento.altKey) return;
    if (evento.key === '1') {
      encuadrar();
      return;
    }
    if (evento.key === '0') {
      void zoomTo(1, { duration: 0 });
      return;
    }
    if (evento.key === 'Escape' && elegido !== null) {
      alElegir(null);
      return;
    }
    if (evento.key === 'Delete' && armando && elegido !== null) {
      const ficha = queFichaEs(elegido);
      if (ficha?.tipo === 'paso' || ficha?.tipo === 'parte') {
        evento.preventDefault();
        const tesoro = ficha.tesoro;
        editarLaFila(vista, (fila) => sacar(fila, tesoro));
        alElegir(fichaDelEstante(tesoro));
        enfocarLaElegidaDespues();
      }
    }
  };

  const fichas = useMemo(
    () => ({
      editable,
      puedeCrear: vista.sincronizados,
      alNuevo: () => {
        alPedirNuevo?.({ despuesDe: undefined, lugar: 'estante' });
      },
    }),
    [editable, vista.sincronizados, alPedirNuevo],
  );

  const aristas = useMemo(
    () => ({ sumarDespuesDe: armando && alSumar !== undefined ? alSumar : null }),
    [armando, alSumar],
  );

  return (
    <ContextoDeLasFichas.Provider value={fichas}>
      <ContextoDeLasAristas.Provider value={aristas}>
        <ContextoDeLaConexion.Provider value={describir}>
          <div
            className="flex h-full w-full flex-col"
            onKeyDownCapture={alTeclearAntes}
            onKeyDown={alTeclear}
          >
            <div className="relative min-h-0 flex-1">
              <ReactFlow<NodoDelPlano, AristaDelPlano>
                className="plano"
                data-sin-encuadrar={encuadrado ? undefined : ''}
                aria-label="La fila de los tesoros"
                nodes={nodos}
                edges={plano.aristas}
                nodeTypes={TIPOS_DE_NODO}
                edgeTypes={TIPOS_DE_ARISTA}
                onNodesChange={alCambiarNodos}
                onNodeDragStop={alSoltarLaFicha}
                onPaneClick={() => {
                  store.setState({ connectionClickStartHandle: null });
                  alElegir(null);
                }}
                onConnect={alConectar}
                isValidConnection={esValida}
                connectionLineComponent={LineaDeConexion}
                connectionRadius={36}
                nodesDraggable={armando}
                nodesConnectable={armando}
                elementsSelectable={editable}
                nodesFocusable={editable}
                edgesFocusable={false}
                defaultMarkerColor={null}
                deleteKeyCode={null}
                selectionKeyCode={null}
                multiSelectionKeyCode={null}
                panOnScroll
                zoomOnScroll={false}
                zoomOnPinch
                zoomOnDoubleClick={false}
                nodeDragThreshold={8}
                minZoom={0.3}
                maxZoom={1.75}
                attributionPosition="bottom-left"
                ariaLabelConfig={etiquetas}
              >
                <Background
                  id="menor"
                  variant={BackgroundVariant.Lines}
                  gap={16}
                  lineWidth={1}
                  color="var(--cuadricula-menor)"
                  bgColor="var(--color-lamina)"
                />
                <Background
                  id="mayor"
                  variant={BackgroundVariant.Lines}
                  gap={80}
                  lineWidth={1}
                  color="var(--cuadricula-mayor)"
                  bgColor="transparent"
                />
                <ZoomEnCss />
                {pie === 'flotante' && (
                  <Panel position="bottom-right" className="m-4!">
                    <ZoomFlotante alVerTodo={encuadrar} />
                  </Panel>
                )}
              </ReactFlow>
            </div>
            {pie === 'rotulo' && (
              <RotuloConZoom revision={revision} rige={rige} alVerTodo={encuadrar} />
            )}
          </div>
        </ContextoDeLaConexion.Provider>
      </ContextoDeLasAristas.Provider>
    </ContextoDeLasFichas.Provider>
  );
}

export default function Lienzo(props: LienzoProps) {
  return (
    <ReactFlowProvider>
      <LienzoInterno {...props} />
    </ReactFlowProvider>
  );
}

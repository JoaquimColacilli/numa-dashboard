import { useCallback, useRef, useState, type KeyboardEvent } from 'react';

import { ChipDelTesoro } from '@/entities/tesoro';
import {
  BarraDeEdicion,
  BotonEditarTesoro,
  encabezadoDeLaFicha,
  FICHA_DE_LOS_INSUMOS,
  PanelDeDetalle,
  Probador,
  sePuedeEditar,
} from '@/features/armar-la-fila';
import { useMensajes } from '@/shared/idioma';
import { Button, Icono } from '@/shared/ui';

import type { PantallaDeTesoros } from '../model/pantalla';
import { rigeDesde } from '../model/rotulo';
import { Bienvenida } from './Bienvenida';
import type { RellenoDelLienzo } from './lienzo/Lienzo';
import { LienzoPerezoso } from './LienzoPerezoso';
import { MenuParaSumar, type PedidoDeSumar } from './MenuParaSumar';

const RELLENO_DE_LA_COMPU: RellenoDelLienzo = { arriba: 28, abajo: 28, izquierda: 40, derecha: 40 };
const RELLENO_DE_LA_TABLET: RellenoDelLienzo = {
  arriba: 32,
  abajo: 32,
  izquierda: 36,
  derecha: 36,
};

function Encabezado({ pantalla }: { pantalla: PantallaDeTesoros }) {
  const textos = useMensajes().paginaTesoros.compu;
  const { vista } = pantalla;
  if (vista.armando) {
    return (
      <BarraDeEdicion
        vista={vista}
        alGuardar={() => {
          pantalla.abrir({ tipo: 'guardar' });
        }}
      />
    );
  }
  return (
    <header className="flex h-18 flex-none items-center justify-between gap-4 px-5 md:px-7">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-label text-text-2">{textos.comoSeReparte}</span>
        <h1 className="font-display text-h1 leading-tight">{textos.tesoros}</h1>
      </div>
      <div className="flex flex-none items-center gap-2">
        <Button
          variant="secundario"
          disabled={!vista.sincronizados}
          onClick={() => {
            pantalla.abrir({ tipo: 'nuevo', lugar: 'estante', despuesDe: undefined });
          }}
        >
          <Icono nombre="plus" tamano={18} />
          {textos.nuevoTesoro}
        </Button>
        <Button disabled={!sePuedeEditar(vista)} onClick={pantalla.empezar}>
          <Icono nombre="pencil" tamano={17} />
          {textos.editarLaFila}
        </Button>
      </div>
    </header>
  );
}

function enfocarLaFicha(id: string): void {
  const ficha = [...document.querySelectorAll<HTMLElement>('.react-flow__node')].find(
    (nodo) => nodo.dataset.id === id,
  );
  ficha?.focus({ preventScroll: true });
}

function PanelDeAbajo({
  pantalla,
  panel,
}: {
  pantalla: PantallaDeTesoros;
  panel: (elemento: HTMLElement | null) => void;
}) {
  const textos = useMensajes().paginaTesoros.compu;
  const { vista, elegido } = pantalla;
  const encabezado = encabezadoDeLaFicha(vista, elegido);
  const tesoro = encabezado.tesoro;
  const editar = (id: string) => {
    pantalla.abrir({ tipo: 'editar', tesoro: id });
  };
  const cerrar = () => {
    const id = elegido;
    pantalla.elegir(null);
    if (id !== null) enfocarLaFicha(id);
  };
  const alTeclear = (evento: KeyboardEvent<HTMLElement>) => {
    if (evento.key !== 'Escape' || evento.defaultPrevented) return;
    evento.preventDefault();
    cerrar();
  };
  return (
    <section
      ref={panel}
      role="region"
      aria-label={encabezado.titulo}
      onKeyDown={alTeclear}
      className="fixed inset-x-0 bottom-0 z-20 flex h-[calc(52dvh+var(--holgura-inferior))] flex-col rounded-t-sheet border-t border-hairline bg-paper shadow-float"
    >
      <span aria-hidden className="mx-auto mt-2 h-1 w-9 flex-none rounded-pill bg-hairline" />
      <header className="flex flex-none items-center justify-between gap-3 border-b border-hairline py-2.5 pr-2.5 pl-5">
        <div className="flex min-w-0 items-center gap-3">
          {tesoro === null ? (
            <span
              aria-hidden
              className="flex size-7 flex-none items-center justify-center rounded-control bg-surface-2 text-ink"
            >
              <Icono
                nombre={elegido === FICHA_DE_LOS_INSUMOS ? 'hand-coins' : 'split'}
                tamano={16}
              />
            </span>
          ) : (
            <ChipDelTesoro tesoro={tesoro} />
          )}
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate text-body-lg leading-snug font-semibold">
              {encabezado.titulo}
            </h2>
            <span className="truncate text-label text-text-2">{encabezado.bajada}</span>
          </div>
        </div>
        <div className="flex flex-none items-center gap-1">
          {tesoro !== null && vista.sincronizados && (
            <BotonEditarTesoro tesoro={tesoro} alEditar={editar} />
          )}
          <button
            type="button"
            aria-label={textos.cerrarElDetalle}
            onClick={cerrar}
            className="flex size-11 flex-none items-center justify-center rounded-field text-text-2 hover:bg-surface"
          >
            <Icono nombre="x" tamano={20} />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5">
        <PanelDeDetalle
          vista={vista}
          elegido={elegido}
          prueba={pantalla.prueba}
          resultado={pantalla.resultado}
          alElegir={pantalla.elegir}
          alProbar={pantalla.probar}
          alCubrir={(paso) => {
            pantalla.abrir({ tipo: 'cubrir', paso });
          }}
          alEditarTesoro={editar}
          alRegistrarElPago={pantalla.registrarElPago}
          alCambiarDolares={pantalla.cambiarDolares}
          ultimoCambio={pantalla.ultimoCambio}
          insumos={pantalla.insumos}
          enHoja
        />
      </div>
      <footer className="flex-none border-t border-hairline px-5 pt-3 pb-[calc(0.75rem+var(--holgura-inferior))]">
        <Button className="w-full" onClick={cerrar}>
          {textos.listo}
        </Button>
      </footer>
    </section>
  );
}

export function TesorosEnLaCompu({
  pantalla,
  ancho,
}: {
  pantalla: PantallaDeTesoros;
  ancho: 'compu' | 'tablet-ancha' | 'tablet';
}) {
  const textos = useMensajes().paginaTesoros.compu;
  const { vista, elegido } = pantalla;
  const [pedido, setPedido] = useState<PedidoDeSumar | null>(null);
  const panelDeAbajo = useRef<HTMLElement | null>(null);
  const loQueFlota = useRef<HTMLDivElement | null>(null);
  const conPanel = ancho !== 'tablet';
  const abajo = ancho === 'tablet' && elegido !== null;

  const tapadoDesde = useCallback(
    () => panelDeAbajo.current?.getBoundingClientRect().top ?? null,
    [],
  );

  const flotaDesde = useCallback(() => loQueFlota.current?.getBoundingClientRect().top ?? null, []);

  const bienvenida = (apilada: boolean) =>
    pantalla.primeraVez ? (
      <Bienvenida
        puedeEditar={sePuedeEditar(vista)}
        alEditar={pantalla.empezar}
        alEntender={pantalla.entender}
        apilada={apilada}
      />
    ) : undefined;

  const panel = (
    <PanelDeDetalle
      vista={vista}
      elegido={elegido}
      prueba={pantalla.prueba}
      resultado={pantalla.resultado}
      alElegir={pantalla.elegir}
      alProbar={pantalla.probar}
      alCubrir={(paso) => {
        pantalla.abrir({ tipo: 'cubrir', paso });
      }}
      alEditarTesoro={(tesoro) => {
        pantalla.abrir({ tipo: 'editar', tesoro });
      }}
      alRegistrarElPago={pantalla.registrarElPago}
      alCambiarDolares={pantalla.cambiarDolares}
      ultimoCambio={pantalla.ultimoCambio}
      insumos={pantalla.insumos}
      arriba={bienvenida(true)}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Encabezado pantalla={pantalla} />
      <div className="flex min-h-0 flex-1 border-t border-hairline">
        <div className="relative min-w-0 flex-1">
          <LienzoPerezoso
            vista={vista}
            resultado={pantalla.resultado}
            elegido={elegido}
            alElegir={pantalla.elegir}
            modo="editar"
            pie="rotulo"
            revision={vista.delTaller.version}
            rige={rigeDesde(vista.delTaller.guardada, vista.delTaller.guardadaEn)}
            relleno={ancho === 'tablet' ? RELLENO_DE_LA_TABLET : RELLENO_DE_LA_COMPU}
            insumos={pantalla.insumosEnElPlano}
            alineado={ancho === 'tablet' ? 'arriba' : 'centro'}
            alSumar={(tramo, boton) => {
              setPedido({ tramo, boton });
            }}
            alPedirNuevo={({ despuesDe, lugar }) => {
              pantalla.abrir({ tipo: 'nuevo', lugar, despuesDe });
            }}
            tapadoDesde={ancho === 'tablet' ? tapadoDesde : undefined}
            flotaDesde={ancho === 'tablet' ? flotaDesde : undefined}
          />
          {ancho === 'tablet' && elegido === null && (
            <div
              ref={loQueFlota}
              className={`absolute bottom-15 left-4 z-10 flex flex-col ${
                pantalla.primeraVez ? 'right-4' : 'w-[340px] max-w-[calc(100%-32px)]'
              }`}
            >
              {bienvenida(false) ?? (
                <section
                  aria-label={textos.probarUnCobro}
                  className="rounded-panel border border-border bg-paper px-4 py-3.5 shadow-float"
                >
                  <Probador
                    vista={vista}
                    prueba={pantalla.prueba}
                    resultado={pantalla.resultado}
                    alProbar={pantalla.probar}
                    forma="flotante"
                  />
                </section>
              )}
            </div>
          )}
        </div>
        {conPanel && (
          <aside
            aria-label={textos.detalle}
            className={`flex-none overflow-y-auto border-l border-hairline bg-paper px-5 pt-5 pb-8 ${
              ancho === 'compu' ? 'w-[380px]' : 'w-[340px]'
            }`}
          >
            {panel}
          </aside>
        )}
      </div>
      {abajo && (
        <PanelDeAbajo
          pantalla={pantalla}
          panel={(elemento) => {
            panelDeAbajo.current = elemento;
          }}
        />
      )}
      <MenuParaSumar
        pedido={pedido}
        vista={vista}
        alCerrar={() => {
          setPedido(null);
        }}
        alElegir={pantalla.elegir}
        alPedirNuevo={(lugar, despuesDe) => {
          pantalla.abrir({ tipo: 'nuevo', lugar, despuesDe });
        }}
      />
    </div>
  );
}

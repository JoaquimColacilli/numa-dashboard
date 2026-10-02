import {
  centavos,
  completarHuecos,
  cuentasDelPresupuesto,
  LARGOS_DEL_DOCUMENTO,
  LARGOS_DEL_PRESUPUESTO,
  letraDeLaOpcion,
  sumarDias,
  textoDeLaForma,
  usaElHueco,
  valoresDelTrabajo,
  type BorradorDelPresupuesto,
  type Clausula,
  type FormaElegida,
  type Hueco,
  type Money,
  type PlantillaDelPresupuesto,
  type PuntosBasicos,
} from '@maun/domain';
import { useId, useState, type ReactNode } from 'react';

import { useMensajes } from '@/shared/idioma';
import {
  fechaLarga,
  formatearPesos,
  formatearPorcentaje,
  Ir,
  RUTA_DEL_PRESUPUESTO_EN_AJUSTES,
  uuidv7,
} from '@/shared/lib';
import {
  AdornoDePlata,
  BarraDeDeshacer,
  BotonDeLaFila,
  Button,
  Campo,
  CampoConUnidad,
  CamposJuntos,
  Casilla,
  DatoFijo,
  Globo,
  Icono,
  Interruptor,
  LineaDePuntos,
  MoneyInput,
  SeccionEnFila,
  TextoQueCrece,
} from '@/shared/ui';

import {
  conElHerrajeEditado,
  conElMuebleDeVuelta,
  conElMuebleEditado,
  conElMuebleMovido,
  conLaCasilla,
  conLaForma,
  conLaPropiaEditada,
  conLosHerrajesTraidos,
  conUnaPropiaMas,
  conUnHerrajeMas,
  conUnMuebleMas,
  sinElHerraje,
  sinElMueble,
  sinLaPropia,
  sinLosTraidos,
  type GrupoDeCasillas,
  type MuebleQuitado,
} from '../model/borrador';
import {
  conMasDeUnaOpcion,
  opcionesDelEditor,
  totalDelEditor,
  type ValoresDelEditor,
} from '../model/valores';

export interface ConElBorrador {
  borrador: BorradorDelPresupuesto;
  alCambiar: (siguiente: BorradorDelPresupuesto) => void;
}

function MontoPagado({ children }: { children: ReactNode }) {
  return (
    <span translate="no" className="font-semibold text-hogar tabular-nums">
      {children}
    </span>
  );
}

function Seccion({
  numero,
  id,
  titulo,
  bajada,
  cuenta,
  children,
}: {
  numero: number;
  id: string;
  titulo: string;
  bajada: ReactNode;
  cuenta?: string;
  children: ReactNode;
}) {
  return (
    <SeccionEnFila
      id={id}
      titulo={
        <>
          <span aria-hidden className="text-text-3 tabular-nums">
            {numero}.
          </span>{' '}
          {titulo}
        </>
      }
      bajada={
        <div className="flex flex-col gap-1.5">
          <p className="text-label leading-relaxed text-text-2">{bajada}</p>
          {cuenta !== undefined && (
            <p className="text-label font-semibold text-ink tabular-nums">{cuenta}</p>
          )}
        </div>
      }
    >
      {children}
    </SeccionEnFila>
  );
}

const VALIDECES = [7, 15, 30] as const;

const VALIDEZ_MAXIMA = 365;

function Validez({
  dias,
  deAjustes,
  hoy,
  alCambiar,
}: {
  dias: number | null;
  deAjustes: number;
  hoy: string;
  alCambiar: (dias: number | null) => void;
}) {
  const m = useMensajes().armarElPresupuesto.validez;
  const id = useId();
  const [otro, setOtro] = useState(
    dias !== null && !(VALIDECES as readonly number[]).includes(dias),
  );
  const elegido = dias === null ? 'sin' : otro ? 'otro' : String(dias);
  const opciones: { valor: string; etiqueta: string; alElegir: () => void; ancha?: boolean }[] = [
    ...VALIDECES.map((valor) => ({
      valor: String(valor),
      etiqueta: m.dias(valor),
      alElegir: () => {
        setOtro(false);
        alCambiar(valor);
      },
    })),
    {
      valor: 'otro',
      etiqueta: m.otro,
      alElegir: () => {
        setOtro(true);
        if (dias === null) alCambiar(deAjustes);
      },
    },
    {
      valor: 'sin',
      etiqueta: m.sinVencimiento,
      ancha: true,
      alElegir: () => {
        setOtro(false);
        alCambiar(null);
      },
    },
  ];

  return (
    <fieldset className="@container flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-label text-text-2">{m.titulo}</legend>
      <div
        role="radiogroup"
        aria-label={m.titulo}
        className="grid max-w-[38rem] grid-cols-3 gap-1 rounded-panel bg-ink/6 p-1 @min-[32rem]:grid-cols-5"
      >
        {opciones.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={elegido === opcion.valor}
            onClick={opcion.alElegir}
            className={`min-h-tap rounded-[16px] px-1 text-label leading-tight ${
              opcion.ancha === true ? 'col-span-2 @min-[32rem]:col-span-1' : ''
            } ${
              elegido === opcion.valor
                ? 'bg-elevado font-semibold text-ink shadow-float'
                : 'font-medium text-text-2'
            }`}
          >
            {opcion.etiqueta}
          </button>
        ))}
      </div>
      {otro && dias !== null && (
        <div className="mt-2">
          <CampoConUnidad
            id={`${id}-dias`}
            etiqueta={m.cuantosDias}
            unidad={m.diasCorridos}
            valor={String(dias)}
            alCambiar={(texto) => {
              const numero = Number(texto);
              if (texto !== '' && numero > 0) alCambiar(Math.min(numero, VALIDEZ_MAXIMA));
            }}
          />
        </div>
      )}
      <span className="text-meta text-text-3">
        {dias === null ? m.sinFechaLimite : m.valeHasta(fechaLarga(sumarDias(hoy, dias), hoy))}
        {dias === deAjustes && ` ${m.salenDeAjustes(deAjustes)}`}
      </span>
    </fieldset>
  );
}

export function EncabezadoDelBorrador({
  borrador,
  alCambiar,
  numero,
  revisionQueSeManda,
  cliente,
  hoy,
  diasDeAjustes,
}: ConElBorrador & {
  numero: string | null;
  revisionQueSeManda: number;
  cliente: string;
  hoy: string;
  diasDeAjustes: number;
}) {
  const m = useMensajes().armarElPresupuesto.encabezado;
  const id = useId();
  return (
    <Seccion numero={1} id="presupuesto-encabezado" titulo={m.titulo} bajada={m.bajada}>
      <div className="flex flex-col gap-5">
        <dl className="flex flex-col">
          <DatoFijo
            clave={m.numero}
            valor={
              numero === null ? m.seAsignaAlMandarlo : m.numeroYProxima(numero, revisionQueSeManda)
            }
            nota={
              numero === null ? m.llevaElDia(`${hoy.replaceAll('-', '')}-01`) : m.elNumeroNoCambia
            }
          />
          <DatoFijo
            clave={m.cliente}
            valor={cliente === '' ? m.sinCliente : <span translate="no">{cliente}</span>}
            nota={m.saleDeSuFicha}
          />
        </dl>
        <CamposJuntos separacion="gap-5">
          <Campo
            etiqueta={m.tituloDelTrabajo}
            data-campo="titulo"
            value={borrador.titulo}
            maxLength={LARGOS_DEL_PRESUPUESTO.titulo}
            placeholder={m.ejemploDelTitulo}
            onChange={(evento) => {
              alCambiar({ ...borrador, titulo: evento.target.value });
            }}
          />
          <Campo
            etiqueta={m.obra}
            value={borrador.obra}
            maxLength={LARGOS_DEL_PRESUPUESTO.obra}
            placeholder={m.ejemploDeLaObra}
            onChange={(evento) => {
              alCambiar({ ...borrador, obra: evento.target.value });
            }}
          />
        </CamposJuntos>
        <Validez
          dias={borrador.validezDias}
          deAjustes={diasDeAjustes}
          hoy={hoy}
          alCambiar={(dias) => {
            alCambiar({ ...borrador, validezDias: dias });
          }}
        />
        <CampoConUnidad
          id={`${id}-plazo`}
          etiqueta={m.plazo}
          unidad={m.diasHabiles}
          valor={String(borrador.plazoDeFabricacion)}
          alCambiar={(texto) => {
            const numero = Number(texto);
            if (texto !== '' && numero > 0) {
              alCambiar({ ...borrador, plazoDeFabricacion: Math.min(numero, 365) });
            }
          }}
          ayuda={m.ayudaDelPlazo}
        />
      </div>
    </Seccion>
  );
}

function FichaDelMueble({
  numero,
  nombre,
  descripcion,
  id,
  primero,
  ultimo,
  alCambiar,
  alMover,
  alQuitar,
}: {
  numero: number;
  nombre: string;
  descripcion: string;
  id: string;
  primero: boolean;
  ultimo: boolean;
  alCambiar: (cambios: { nombre?: string; descripcion?: string }) => void;
  alMover: (hacia: -1 | 1) => void;
  alQuitar: () => void;
}) {
  const m = useMensajes().armarElPresupuesto.detalle.mueble;
  const nombreVisible = nombre.trim();
  const etiquetas =
    nombreVisible === ''
      ? { subir: m.subir(numero), bajar: m.bajar(numero), quitar: m.quitar(numero) }
      : {
          subir: m.subirLlamado(nombreVisible),
          bajar: m.bajarLlamado(nombreVisible),
          quitar: m.quitarLlamado(nombreVisible),
        };
  return (
    <li
      data-mueble={id}
      className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2.5 rounded-field border border-hairline p-3 md:p-4"
    >
      <Globo numero={numero} />
      <input
        aria-label={m.nombre(numero)}
        value={nombre}
        maxLength={LARGOS_DEL_PRESUPUESTO.nombreDelMueble}
        placeholder={m.ejemploDelNombre}
        onChange={(evento) => {
          alCambiar({ nombre: evento.target.value });
        }}
        className="h-11 min-w-0 rounded-field border border-border bg-paper px-3 text-body-lg font-semibold text-ink placeholder:font-normal placeholder:text-text-3"
      />
      <div className="col-span-2 flex min-w-0 flex-col gap-1.5">
        <label htmlFor={`${id}-descripcion`} className="text-label text-text-2">
          {m.descripcionTecnica}
        </label>
        <TextoQueCrece
          id={`${id}-descripcion`}
          data-campo={`mueble-${id}`}
          valor={descripcion}
          filasMinimas={5}
          maxLength={LARGOS_DEL_PRESUPUESTO.descripcionDelMueble}
          placeholder={m.ejemploDeLaDescripcion}
          alCambiar={(texto) => {
            alCambiar({ descripcion: texto });
          }}
        />
        <span className="text-meta text-text-3">{m.queLleva}</span>
      </div>
      <div className="col-span-2 -my-1 flex items-center justify-between">
        <span className="-ml-2.5 flex">
          <BotonDeLaFila
            icono="arrow-up"
            etiqueta={etiquetas.subir}
            deshabilitado={primero}
            alTocar={() => {
              alMover(-1);
            }}
          />
          <BotonDeLaFila
            icono="arrow-down"
            etiqueta={etiquetas.bajar}
            deshabilitado={ultimo}
            alTocar={() => {
              alMover(1);
            }}
          />
        </span>
        <span className="-mr-2.5">
          <BotonDeLaFila icono="trash-2" etiqueta={etiquetas.quitar} peligro alTocar={alQuitar} />
        </span>
      </div>
    </li>
  );
}

export function DetalleDelBorrador({ borrador, alCambiar }: ConElBorrador) {
  const m = useMensajes().armarElPresupuesto.detalle;
  const id = useId();
  const [quitado, setQuitado] = useState<MuebleQuitado | null>(null);
  const muebles = borrador.muebles;
  const conDescripcion = muebles.filter(({ descripcion }) => descripcion.trim() !== '').length;
  const nombreDelQuitado = quitado?.mueble.nombre.trim() ?? '';

  return (
    <Seccion
      numero={2}
      id="presupuesto-detalle"
      titulo={m.titulo}
      bajada={m.bajada}
      cuenta={m.cuantos(muebles.length)}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-descripcion`} className="text-label text-text-2">
          {m.descripcionGeneral} <span className="text-text-3">{m.opcional}</span>
        </label>
        <TextoQueCrece
          id={`${id}-descripcion`}
          valor={borrador.descripcion}
          filasMinimas={2}
          maxLength={LARGOS_DEL_PRESUPUESTO.descripcion}
          placeholder={m.ejemploGeneral}
          alCambiar={(texto) => {
            alCambiar({ ...borrador, descripcion: texto });
          }}
        />
      </div>

      <div className="flex flex-col gap-2.5 border-t border-hairline-soft pt-3.5">
        <p className="flex items-baseline justify-between gap-3 text-label">
          <span className="font-semibold">{m.muebles}</span>
          {muebles.length > 0 && (
            <span className="text-text-2 tabular-nums">
              {conDescripcion === muebles.length
                ? m.todosConDescripcion
                : m.conDescripcion(conDescripcion, muebles.length)}
            </span>
          )}
        </p>
        {muebles.length === 0 ? (
          <p className="text-label text-text-2">{m.sinMuebles}</p>
        ) : (
          <ol className="flex list-none flex-col gap-2.5">
            {muebles.map((mueble, indice) => (
              <FichaDelMueble
                key={mueble.id}
                id={mueble.id}
                numero={indice + 1}
                nombre={mueble.nombre}
                descripcion={mueble.descripcion}
                primero={indice === 0}
                ultimo={indice === muebles.length - 1}
                alCambiar={(cambios) => {
                  alCambiar(conElMuebleEditado(borrador, mueble.id, cambios));
                }}
                alMover={(hacia) => {
                  alCambiar(conElMuebleMovido(borrador, mueble.id, hacia));
                }}
                alQuitar={() => {
                  const resultado = sinElMueble(borrador, mueble.id);
                  setQuitado(resultado.quitado);
                  alCambiar(resultado.borrador);
                }}
              />
            ))}
          </ol>
        )}
        {quitado !== null && (
          <BarraDeDeshacer
            texto={
              nombreDelQuitado === '' ? m.quiteElMueble : m.quiteElMuebleLlamado(nombreDelQuitado)
            }
            alDeshacer={() => {
              alCambiar(conElMuebleDeVuelta(borrador, quitado));
              setQuitado(null);
            }}
            alVencer={() => {
              setQuitado(null);
            }}
          />
        )}
        <Button
          variant="secundario"
          size="chico"
          data-campo="muebles"
          className="self-start border-dashed"
          onClick={() => {
            alCambiar(conUnMuebleMas(borrador, uuidv7()));
          }}
        >
          <Icono nombre="plus" tamano={16} />
          {m.agregarUnMueble}
        </Button>
      </div>
    </Seccion>
  );
}

function RenglonDeLaLista({
  texto,
  etiqueta,
  etiquetaDeSacar,
  placeholder,
  alCambiar,
  alQuitar,
  maximo,
}: {
  texto: string;
  etiqueta: string;
  etiquetaDeSacar: string;
  placeholder?: string;
  alCambiar: (texto: string) => void;
  alQuitar: () => void;
  maximo: number;
}) {
  return (
    <li className="flex items-start gap-1 border-t border-hairline-soft first:border-t-0">
      <span aria-hidden className="mt-[1.3rem] ml-1 size-1.5 flex-none rounded-pill bg-text-3" />
      <div className="min-w-0 flex-1">
        <TextoQueCrece
          variante="en-la-fila"
          aria-label={etiqueta}
          valor={texto}
          maxLength={maximo}
          placeholder={placeholder}
          alCambiar={alCambiar}
        />
      </div>
      <BotonDeLaFila icono="trash-2" etiqueta={etiquetaDeSacar} peligro alTocar={alQuitar} />
    </li>
  );
}

function AgregarRenglon({
  etiqueta,
  placeholder,
  maximo,
  alAgregar,
}: {
  etiqueta: string;
  placeholder: string;
  maximo: number;
  alAgregar: (texto: string) => void;
}) {
  const [texto, setTexto] = useState('');
  function agregar(): void {
    if (texto.trim() === '') return;
    alAgregar(texto.trim());
    setTexto('');
  }
  return (
    <div className="flex items-center gap-2">
      <input
        aria-label={etiqueta}
        value={texto}
        maxLength={maximo}
        placeholder={placeholder}
        onChange={(evento) => {
          setTexto(evento.target.value);
        }}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter') {
            evento.preventDefault();
            agregar();
          }
        }}
        className="h-11 min-w-0 flex-1 rounded-field border border-border bg-paper px-3 text-body-lg text-ink placeholder:text-text-3"
      />
      <button
        type="button"
        aria-label={etiqueta}
        disabled={texto.trim() === ''}
        onMouseDown={(toque) => {
          toque.preventDefault();
        }}
        onClick={agregar}
        className="flex size-11 flex-none items-center justify-center rounded-pill border border-border text-text-2 hover:bg-surface disabled:opacity-40"
      >
        <Icono nombre="plus" tamano={18} />
      </button>
    </div>
  );
}

export function HerrajesDelBorrador({
  borrador,
  alCambiar,
  deLoQueHaceFalta,
}: ConElBorrador & { deLoQueHaceFalta: readonly string[] }) {
  const m = useMensajes().armarElPresupuesto.herrajes;
  const [traidos, setTraidos] = useState<{ ids: { id: string; texto: string }[] } | null>(null);
  const [sinNuevos, setSinNuevos] = useState(false);
  const { mostrar, lista } = borrador.herrajes;

  return (
    <Seccion
      numero={3}
      id="presupuesto-herrajes"
      titulo={m.titulo}
      bajada={m.bajada}
      cuenta={
        lista.length === 0
          ? undefined
          : mostrar
            ? m.cuantos(lista.length)
            : m.cuantosSinMostrar(lista.length)
      }
    >
      <Interruptor
        activo={mostrar}
        alCambiar={(activo) => {
          alCambiar({ ...borrador, herrajes: { ...borrador.herrajes, mostrar: activo } });
        }}
        className="min-h-tap self-start rounded-pill pr-2"
      >
        <span className="text-body font-medium">{m.mostrarlos}</span>
      </Interruptor>
      {!mostrar && <p className="-mt-1.5 text-label leading-relaxed text-text-2">{m.noVan}</p>}

      {lista.length === 0 ? (
        <p className="border-t border-hairline-soft pt-3 text-label text-text-2">
          {m.todaviaNoHay}
        </p>
      ) : (
        <ul className={`list-none border-t border-hairline-soft ${mostrar ? '' : 'opacity-60'}`}>
          {lista.map((herraje, indice) => (
            <RenglonDeLaLista
              key={herraje.id}
              texto={herraje.texto}
              etiqueta={m.herraje(indice + 1)}
              etiquetaDeSacar={m.sacarElHerraje(indice + 1)}
              maximo={LARGOS_DEL_PRESUPUESTO.herraje}
              alCambiar={(texto) => {
                alCambiar(conElHerrajeEditado(borrador, herraje.id, texto));
              }}
              alQuitar={() => {
                alCambiar(sinElHerraje(borrador, herraje.id));
              }}
            />
          ))}
        </ul>
      )}

      {traidos !== null && (
        <BarraDeDeshacer
          texto={m.traje(traidos.ids.length)}
          alDeshacer={() => {
            alCambiar(sinLosTraidos(borrador, traidos.ids));
            setTraidos(null);
          }}
          alVencer={() => {
            setTraidos(null);
          }}
        />
      )}
      {sinNuevos && (
        <p role="status" className="text-label text-text-2">
          {m.yaEstanTodos}
        </p>
      )}

      <AgregarRenglon
        etiqueta={m.agregarUnHerraje}
        placeholder={m.ejemploDelHerraje}
        maximo={LARGOS_DEL_PRESUPUESTO.herraje}
        alAgregar={(texto) => {
          alCambiar(conUnHerrajeMas(borrador, { id: uuidv7(), texto }));
        }}
      />
      <Button
        variant="secundario"
        size="chico"
        className="self-start"
        disabled={deLoQueHaceFalta.length === 0}
        onClick={() => {
          const resultado = conLosHerrajesTraidos(borrador, deLoQueHaceFalta, uuidv7);
          setSinNuevos(resultado.traidos.length === 0);
          setTraidos(resultado.traidos.length === 0 ? null : { ids: resultado.traidos });
          alCambiar(resultado.borrador);
        }}
      >
        <Icono nombre="list-checks" tamano={16} />
        {m.traer}
      </Button>
    </Seccion>
  );
}

export interface HuecosDelEditor {
  valores: Readonly<Record<Hueco, string>>;
  abonado: Money;
}

function CasillaDeLaPlantilla({
  clausula,
  tildada,
  huecos,
  alCambiar,
}: {
  clausula: Clausula;
  tildada: boolean;
  huecos: HuecosDelEditor;
  alCambiar: (tildada: boolean) => void;
}) {
  const m = useMensajes().armarElPresupuesto.casillas;
  const esperaUnPago = usaElHueco(clausula.texto, 'relevamiento') && huecos.abonado <= 0;
  const texto = completarHuecos(clausula.texto, huecos.valores);
  const va = tildada && !esperaUnPago;
  return (
    <li className="border-t border-hairline-soft first:border-t-0">
      <label
        className={`flex items-start gap-3 py-2.5 ${esperaUnPago ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <Casilla tildada={va} deshabilitada={esperaUnPago} alCambiar={alCambiar} />
        <span
          className={`max-w-[38rem] min-w-0 text-body leading-relaxed ${va ? 'text-ink' : 'text-text-3'}`}
        >
          {clausula.titulo !== null && (
            <span translate="no" className="block font-semibold">
              {clausula.titulo}
            </span>
          )}
          <span translate="no">{texto}</span>
          {esperaUnPago && (
            <span className="mt-1 block text-meta text-text-3">{m.apareceCuandoPague}</span>
          )}
        </span>
      </label>
    </li>
  );
}

export function CasillasDelBorrador({
  borrador,
  alCambiar,
  numero,
  grupo,
  clausulas,
  huecos,
}: ConElBorrador & {
  numero: number;
  grupo: GrupoDeCasillas;
  clausulas: readonly Clausula[];
  huecos: HuecosDelEditor;
}) {
  const m = useMensajes().armarElPresupuesto.casillas;
  const textos = m[grupo];
  const seleccion = borrador[grupo];
  const tildadas = new Set(seleccion.tildadas);
  const van =
    clausulas.filter(
      (clausula) =>
        tildadas.has(clausula.id) &&
        !(usaElHueco(clausula.texto, 'relevamiento') && huecos.abonado <= 0),
    ).length + seleccion.propias.length;
  const total = clausulas.length + seleccion.propias.length;

  return (
    <Seccion
      numero={numero}
      id={`presupuesto-${grupo}`}
      titulo={textos.titulo}
      bajada={textos.bajada}
      cuenta={m.van(van, total)}
    >
      <ul className="list-none">
        {clausulas.map((clausula) => (
          <CasillaDeLaPlantilla
            key={clausula.id}
            clausula={clausula}
            tildada={tildadas.has(clausula.id)}
            huecos={huecos}
            alCambiar={(tildada) => {
              alCambiar(conLaCasilla(borrador, grupo, clausula.id, tildada));
            }}
          />
        ))}
      </ul>
      {seleccion.propias.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-hairline-soft pt-3">
          <p className="text-label font-semibold">{m.soloEnEste}</p>
          <ul className="list-none">
            {seleccion.propias.map((propia, indice) => (
              <RenglonDeLaLista
                key={propia.id}
                texto={propia.texto}
                etiqueta={textos.propia(indice + 1)}
                etiquetaDeSacar={textos.sacarLaPropia(indice + 1)}
                placeholder={textos.ejemplo}
                maximo={LARGOS_DEL_PRESUPUESTO.propia}
                alCambiar={(texto) => {
                  alCambiar(conLaPropiaEditada(borrador, grupo, propia.id, texto));
                }}
                alQuitar={() => {
                  alCambiar(sinLaPropia(borrador, grupo, propia.id));
                }}
              />
            ))}
          </ul>
        </div>
      )}
      <Button
        variant="secundario"
        size="chico"
        className="self-start border-dashed"
        onClick={() => {
          alCambiar(conUnaPropiaMas(borrador, grupo, uuidv7()));
        }}
      >
        <Icono nombre="plus" tamano={16} />
        {m.agregarOtra}
      </Button>
    </Seccion>
  );
}

function CuentaDeLaSena({
  valores,
  senaBp,
  senaPropia,
  abonado,
}: {
  valores: ValoresDelEditor;
  senaBp: PuntosBasicos;
  senaPropia: boolean;
  abonado: Money;
}) {
  const textos = useMensajes().armarElPresupuesto;
  const m = textos.sena;
  const conImporte = opcionesDelEditor(valores).filter((opcion) => opcion.monto > 0);
  const documentables = valoresDelTrabajo(totalDelEditor(valores), conImporte);
  const deQuien = senaPropia ? 'trabajo' : 'taller';
  const porcentaje = `${formatearPorcentaje(senaBp)}%`;
  if (documentables === null || (valores.opciones.length > 0 && conImporte.length === 0)) {
    return (
      <p className="max-w-[30rem] rounded-field bg-surface px-3.5 py-3 text-label leading-relaxed text-text-2">
        {abonado > 0
          ? m.conElTotalYLoPagado[deQuien](porcentaje, formatearPesos(abonado))
          : m.conElTotal[deQuien](porcentaje)}
      </p>
    );
  }
  const cuentas = cuentasDelPresupuesto(documentables, senaBp, abonado);
  if (documentables.tipo === 'total') {
    const [cuenta] = cuentas;
    if (cuenta === undefined) return null;
    return (
      <div className="flex max-w-[30rem] flex-col gap-2 rounded-field bg-surface px-3.5 py-3 text-body">
        <p className="text-label font-medium text-text-2">{m.laQueLeVasAPedir}</p>
        <LineaDePuntos
          izquierda={m.senaDel[deQuien](porcentaje)}
          derecha={
            <span translate="no" className="font-semibold">
              {formatearPesos(cuenta.sena)}
            </span>
          }
        />
        {abonado > 0 && (
          <>
            <LineaDePuntos
              izquierda={m.yaPago}
              derecha={
                <span translate="no" className="font-semibold text-hogar">
                  {formatearPesos(abonado)}
                </span>
              }
            />
            <div className="border-t border-ink pt-2">
              <LineaDePuntos
                className="font-semibold"
                izquierda={m.leFaltaParaLaSena}
                derecha={<span translate="no">{formatearPesos(cuenta.faltaParaLaSena)}</span>}
              />
            </div>
          </>
        )}
      </div>
    );
  }
  return (
    <div className="flex max-w-[30rem] flex-col gap-2 rounded-field bg-surface px-3.5 py-3 text-body">
      <p className="text-label font-medium text-text-2">{m.segunLaQueElija[deQuien](porcentaje)}</p>
      {cuentas.map((cuenta) => (
        <LineaDePuntos
          key={cuenta.id ?? cuenta.letra}
          izquierda={textos.opcion(cuenta.letra ?? '')}
          derecha={
            <span translate="no" className="font-semibold">
              {formatearPesos(cuenta.sena)}
            </span>
          }
        />
      ))}
      {abonado > 0 && (
        <p className="border-t border-hairline pt-2 text-label leading-relaxed text-text-2">
          {m.yaPagoSeDescuenta(MontoPagado, formatearPesos(abonado))}
        </p>
      )}
    </div>
  );
}

export function ValoresDelBorrador({
  valores,
  alCambiar,
  senaBp,
  senaPropia,
  abonado,
}: {
  valores: ValoresDelEditor;
  alCambiar: (valores: ValoresDelEditor) => void;
  senaBp: PuntosBasicos;
  senaPropia: boolean;
  abonado: Money;
}) {
  const m = useMensajes().armarElPresupuesto.valores;
  const id = useId();
  const conOpciones = valores.opciones.length > 0;

  return (
    <Seccion
      numero={6}
      id="presupuesto-valores"
      titulo={m.titulo}
      bajada={m.bajada}
      cuenta={conOpciones ? m.opciones(valores.opciones.length) : undefined}
    >
      {conOpciones ? (
        <div className="@container/valores flex flex-col gap-2.5">
          <ul className="flex list-none flex-col">
            {valores.opciones.map((opcion, indice) => {
              const letra = letraDeLaOpcion(indice);
              return (
                <li
                  key={opcion.id}
                  className="flex flex-wrap items-start gap-x-2 gap-y-2 border-t border-hairline-soft py-2.5 first:border-t-0 first:pt-0"
                >
                  <span className="flex min-w-0 flex-[1_1_16rem] items-start gap-2">
                    <span
                      translate="no"
                      className="mt-1.5 flex size-8 flex-none items-center justify-center rounded-field bg-surface text-label font-semibold text-ink"
                    >
                      {letra}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <TextoQueCrece
                        variante="renglon"
                        aria-label={m.queIncluye(letra)}
                        valor={opcion.descripcion}
                        maxLength={LARGOS_DEL_DOCUMENTO.descripcionDeLaOpcion}
                        placeholder={m.ejemploDeLaOpcion}
                        alCambiar={(texto) => {
                          alCambiar({
                            ...valores,
                            opciones: valores.opciones.map((otra) =>
                              otra.id === opcion.id ? { ...otra, descripcion: texto } : otra,
                            ),
                          });
                        }}
                      />
                      {opcion.aprobada && (
                        <span className="flex items-center gap-1 text-meta font-semibold text-hogar">
                          <Icono nombre="check" tamano={13} />
                          {m.laAprobo}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="ml-auto flex flex-none items-center gap-1">
                    <span className="flex h-11 w-40 items-center gap-1 rounded-field border border-border bg-paper px-2.5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink">
                      <AdornoDePlata className="text-text-3" />
                      <MoneyInput
                        data-campo={indice === 0 ? 'valores' : undefined}
                        value={opcion.monto}
                        aria-label={m.importe(letra)}
                        placeholder="0"
                        onChange={(monto) => {
                          alCambiar({
                            ...valores,
                            opciones: valores.opciones.map((otra) =>
                              otra.id === opcion.id
                                ? { ...otra, monto: monto === null ? null : centavos(monto) }
                                : otra,
                            ),
                          });
                        }}
                        className="min-w-0 flex-1 bg-transparent text-right text-body-lg font-semibold outline-none"
                      />
                    </span>
                    <BotonDeLaFila
                      icono="trash-2"
                      etiqueta={m.quitar(letra)}
                      peligro
                      alTocar={() => {
                        alCambiar({
                          ...valores,
                          opciones: valores.opciones.filter((otra) => otra.id !== opcion.id),
                        });
                      }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
          <Button
            variant="secundario"
            size="chico"
            className="self-start border-dashed"
            onClick={() => {
              alCambiar({
                ...valores,
                opciones: [
                  ...valores.opciones,
                  { id: uuidv7(), descripcion: '', monto: null, aprobada: false },
                ],
              });
            }}
          >
            <Icono nombre="plus" tamano={16} />
            {m.agregarUnaOpcion}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-total`} className="text-label text-text-2">
              {m.total}
            </label>
            <span className="flex h-15 max-w-(--campo-medio) items-center gap-1.5 rounded-field border border-border bg-paper px-3.5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink">
              <AdornoDePlata className="text-money-lg text-text-3" />
              <MoneyInput
                id={`${id}-total`}
                data-campo="valores"
                value={valores.total}
                placeholder="0"
                onChange={(total) => {
                  alCambiar({ ...valores, total: total === null ? null : centavos(total) });
                }}
                className="min-w-0 flex-1 bg-transparent text-money-lg font-semibold text-ink outline-none"
              />
            </span>
          </div>
          <Button
            variant="secundario"
            size="chico"
            className="self-start border-dashed"
            onClick={() => {
              alCambiar(conMasDeUnaOpcion(valores, [uuidv7(), uuidv7()]));
            }}
          >
            <Icono nombre="plus" tamano={16} />
            {m.masDeUnaOpcion}
          </Button>
        </div>
      )}
      <CuentaDeLaSena valores={valores} senaBp={senaBp} senaPropia={senaPropia} abonado={abonado} />
    </Seccion>
  );
}

export function FormaDePagoDelBorrador({
  borrador,
  alCambiar,
  plantilla,
  huecos,
}: ConElBorrador & { plantilla: PlantillaDelPresupuesto; huecos: HuecosDelEditor }) {
  const m = useMensajes().armarElPresupuesto.formaDePago;
  const id = useId();
  const elegida = borrador.formaDePago;
  const deLaPlantilla = (forma: FormaElegida) =>
    completarHuecos(
      plantilla.formasDePago.find(({ id: otra }) => otra === forma.plantillaId)?.texto ?? '',
      huecos.valores,
    );
  const texto =
    elegida === null
      ? ''
      : completarHuecos(textoDeLaForma(plantilla, elegida) ?? '', huecos.valores);
  const retocada = elegida !== null && elegida.texto !== null;
  const opciones = [
    ...plantilla.formasDePago.map((forma) => ({
      valor: forma.id,
      etiqueta: forma.nombre,
      dato: true,
    })),
    { valor: 'ninguna', etiqueta: m.noMostrarla, dato: false },
  ];

  return (
    <Seccion numero={7} id="presupuesto-forma-de-pago" titulo={m.titulo} bajada={m.bajada}>
      <fieldset className="@container flex min-w-0 flex-col gap-1.5">
        <legend className="sr-only">{m.titulo}</legend>
        <div
          role="radiogroup"
          aria-label={m.titulo}
          className="grid grid-cols-2 gap-1 rounded-panel bg-ink/6 p-1 @min-[36rem]:grid-cols-4"
        >
          {opciones.map((opcion) => {
            const esta =
              opcion.valor === 'ninguna' ? elegida === null : elegida?.plantillaId === opcion.valor;
            return (
              <button
                key={opcion.valor}
                type="button"
                role="radio"
                aria-checked={esta}
                translate={opcion.dato ? 'no' : undefined}
                onClick={() => {
                  alCambiar(
                    conLaForma(
                      borrador,
                      opcion.valor === 'ninguna'
                        ? null
                        : { plantillaId: opcion.valor, texto: null },
                    ),
                  );
                }}
                className={`min-h-tap rounded-[16px] px-2 text-label leading-tight ${
                  esta
                    ? 'bg-elevado font-semibold text-ink shadow-float'
                    : 'font-medium text-text-2'
                }`}
              >
                {opcion.etiqueta}
              </button>
            );
          })}
        </div>
      </fieldset>
      {elegida === null ? (
        <p className="text-label leading-relaxed text-text-2">{m.noVa}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-3">
            <label htmlFor={`${id}-texto`} className="text-label text-text-2">
              {m.loQueDice}
            </label>
            {retocada && (
              <button
                type="button"
                onClick={() => {
                  alCambiar(
                    conLaForma(borrador, { plantillaId: elegida.plantillaId, texto: null }),
                  );
                }}
                className="-my-3 min-h-tap px-1 text-label font-medium underline underline-offset-3"
              >
                {m.volverAlDeSiempre}
              </button>
            )}
          </span>
          <TextoQueCrece
            id={`${id}-texto`}
            valor={texto}
            filasMinimas={2}
            maxLength={LARGOS_DEL_PRESUPUESTO.textoDeClausula}
            alCambiar={(nuevo) => {
              alCambiar(
                conLaForma(borrador, {
                  plantillaId: elegida.plantillaId,
                  texto: nuevo === deLaPlantilla(elegida) ? null : nuevo,
                }),
              );
            }}
          />
          <span className="text-meta text-text-3">
            {retocada ? m.retocado : m.laSenaDeEsteTrabajo(huecos.valores.sena)}
          </span>
        </div>
      )}
    </Seccion>
  );
}

export function GarantiaDelBorrador({ texto, meses }: { texto: string; meses: number }) {
  const m = useMensajes().armarElPresupuesto.garantia;
  return (
    <Seccion
      numero={10}
      id="presupuesto-garantia"
      titulo={m.titulo}
      bajada={m.bajada}
      cuenta={m.meses(meses)}
    >
      <p
        translate="no"
        className="flex items-start gap-3 rounded-field bg-surface px-3.5 py-3 text-body leading-relaxed text-ink"
      >
        <Icono nombre="shield" tamano={18} className="mt-0.5 flex-none text-text-2" />
        {texto}
      </p>
      <Ir
        a={RUTA_DEL_PRESUPUESTO_EN_AJUSTES}
        className="inline-flex min-h-tap items-center gap-1.5 self-start rounded-field text-label font-semibold underline underline-offset-3"
      >
        <Icono nombre="settings" tamano={16} />
        {m.seCambiaEnAjustes}
      </Ir>
    </Seccion>
  );
}

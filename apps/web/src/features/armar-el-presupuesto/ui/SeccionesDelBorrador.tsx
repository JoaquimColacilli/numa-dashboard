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
  const id = useId();
  const [otro, setOtro] = useState(
    dias !== null && !(VALIDECES as readonly number[]).includes(dias),
  );
  const elegido = dias === null ? 'sin' : otro ? 'otro' : String(dias);
  const opciones: { valor: string; etiqueta: string; alElegir: () => void; ancha?: boolean }[] = [
    ...VALIDECES.map((valor) => ({
      valor: String(valor),
      etiqueta: `${String(valor)} días`,
      alElegir: () => {
        setOtro(false);
        alCambiar(valor);
      },
    })),
    {
      valor: 'otro',
      etiqueta: 'Otro',
      alElegir: () => {
        setOtro(true);
        if (dias === null) alCambiar(deAjustes);
      },
    },
    {
      valor: 'sin',
      etiqueta: 'Sin vencimiento',
      ancha: true,
      alElegir: () => {
        setOtro(false);
        alCambiar(null);
      },
    },
  ];

  return (
    <fieldset className="@container flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-label text-text-2">Validez</legend>
      <div
        role="radiogroup"
        aria-label="Validez"
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
            etiqueta="Cuántos días vale"
            unidad="días corridos"
            valor={String(dias)}
            alCambiar={(texto) => {
              const numero = Number(texto);
              if (texto !== '' && numero > 0) alCambiar(Math.min(numero, VALIDEZ_MAXIMA));
            }}
          />
        </div>
      )}
      <span className="text-meta text-text-3">
        {dias === null
          ? 'Tu cliente no ve una fecha límite.'
          : `Si lo mandás hoy, vale hasta el ${fechaLarga(sumarDias(hoy, dias), hoy)}.`}
        {dias === deAjustes && ` Los ${String(deAjustes)} días salen de Ajustes.`}
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
  const id = useId();
  return (
    <Seccion
      numero={1}
      id="presupuesto-encabezado"
      titulo="Encabezado"
      bajada="El número, la fecha y tu cliente salen solos. El título y la obra van arriba de todo."
    >
      <div className="flex flex-col gap-5">
        <dl className="flex flex-col">
          <DatoFijo
            clave="Número"
            valor={
              numero === null
                ? 'Se asigna al mandarlo'
                : `Nº ${numero} · próxima: Rev. ${String(revisionQueSeManda)}`
            }
            nota={
              numero === null
                ? `Lleva el día en que lo mandes, como ${hoy.replaceAll('-', '')}-01.`
                : 'El número no cambia: cada vez que lo mandás, sube la revisión.'
            }
          />
          <DatoFijo
            clave="Cliente"
            valor={cliente === '' ? 'Sin cliente' : cliente}
            nota="Sale de su ficha."
          />
        </dl>
        <CamposJuntos separacion="gap-5">
          <Campo
            etiqueta="Título"
            data-campo="titulo"
            value={borrador.titulo}
            maxLength={LARGOS_DEL_PRESUPUESTO.titulo}
            placeholder="Cocina, placard del dormitorio…"
            onChange={(evento) => {
              alCambiar({ ...borrador, titulo: evento.target.value });
            }}
          />
          <Campo
            etiqueta="Obra"
            value={borrador.obra}
            maxLength={LARGOS_DEL_PRESUPUESTO.obra}
            placeholder="Calle y número, barrio"
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
          etiqueta="Plazo de fabricación"
          unidad="días hábiles"
          valor={String(borrador.plazoDeFabricacion)}
          alCambiar={(texto) => {
            const numero = Number(texto);
            if (texto !== '' && numero > 0) {
              alCambiar({ ...borrador, plazoDeFabricacion: Math.min(numero, 365) });
            }
          }}
          ayuda="Desde que se acredita la seña. Lo usan el aviso del plazo y la entrega estimada."
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
  const nombreVisible = nombre.trim() === '' ? `el mueble ${String(numero)}` : `«${nombre.trim()}»`;
  return (
    <li
      data-mueble={id}
      className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2.5 rounded-field border border-hairline p-3 md:p-4"
    >
      <Globo numero={numero} />
      <input
        aria-label={`Nombre del mueble ${String(numero)}`}
        value={nombre}
        maxLength={LARGOS_DEL_PRESUPUESTO.nombreDelMueble}
        placeholder="Bajomesada, alacena, placard…"
        onChange={(evento) => {
          alCambiar({ nombre: evento.target.value });
        }}
        className="h-11 min-w-0 rounded-field border border-border bg-paper px-3 text-body-lg font-semibold text-ink placeholder:font-normal placeholder:text-text-3"
      />
      <div className="col-span-2 flex min-w-0 flex-col gap-1.5">
        <label htmlFor={`${id}-descripcion`} className="text-label text-text-2">
          Descripción técnica
        </label>
        <TextoQueCrece
          id={`${id}-descripcion`}
          data-campo={`mueble-${id}`}
          valor={descripcion}
          filasMinimas={5}
          maxLength={LARGOS_DEL_PRESUPUESTO.descripcionDelMueble}
          placeholder="Bajomesada en L 2.07 x 1.83, altura 880 mm, en Melamina sobre Aglomerado de 18 mm Blanco…"
          alCambiar={(texto) => {
            alCambiar({ descripcion: texto });
          }}
        />
        <span className="text-meta text-text-3">
          Medidas, material y espesor, color y marca de la placa.
        </span>
      </div>
      <div className="col-span-2 -my-1 flex items-center justify-between">
        <span className="-ml-2.5 flex">
          <BotonDeLaFila
            icono="arrow-up"
            etiqueta={`Subir ${nombreVisible}`}
            deshabilitado={primero}
            alTocar={() => {
              alMover(-1);
            }}
          />
          <BotonDeLaFila
            icono="arrow-down"
            etiqueta={`Bajar ${nombreVisible}`}
            deshabilitado={ultimo}
            alTocar={() => {
              alMover(1);
            }}
          />
        </span>
        <span className="-mr-2.5">
          <BotonDeLaFila
            icono="trash-2"
            etiqueta={`Quitar ${nombreVisible}`}
            peligro
            alTocar={alQuitar}
          />
        </span>
      </div>
    </li>
  );
}

export function DetalleDelBorrador({ borrador, alCambiar }: ConElBorrador) {
  const id = useId();
  const [quitado, setQuitado] = useState<MuebleQuitado | null>(null);
  const muebles = borrador.muebles;
  const conDescripcion = muebles.filter(({ descripcion }) => descripcion.trim() !== '').length;

  return (
    <Seccion
      numero={2}
      id="presupuesto-detalle"
      titulo="Detalle"
      bajada="Cada mueble con su nombre y su descripción técnica, en el orden en que los va a leer tu cliente."
      cuenta={muebles.length === 1 ? '1 mueble' : `${String(muebles.length)} muebles`}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-descripcion`} className="text-label text-text-2">
          Descripción general <span className="text-text-3">(opcional)</span>
        </label>
        <TextoQueCrece
          id={`${id}-descripcion`}
          valor={borrador.descripcion}
          filasMinimas={2}
          maxLength={LARGOS_DEL_PRESUPUESTO.descripcion}
          placeholder="Lo que vale para todo el trabajo: la línea, los materiales, cómo abren los frentes…"
          alCambiar={(texto) => {
            alCambiar({ ...borrador, descripcion: texto });
          }}
        />
      </div>

      <div className="flex flex-col gap-2.5 border-t border-hairline-soft pt-3.5">
        <p className="flex items-baseline justify-between gap-3 text-label">
          <span className="font-semibold">Muebles</span>
          {muebles.length > 0 && (
            <span className="text-text-2 tabular-nums">
              {conDescripcion === muebles.length
                ? 'todos con su descripción'
                : `${String(conDescripcion)} de ${String(muebles.length)} con descripción`}
            </span>
          )}
        </p>
        {muebles.length === 0 ? (
          <p className="text-label text-text-2">
            Sin muebles. Agregá por lo menos uno con su descripción para poder mandarlo.
          </p>
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
            texto={`Quité ${
              quitado.mueble.nombre.trim() === ''
                ? 'el mueble'
                : `«${quitado.mueble.nombre.trim()}»`
            }.`}
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
          Agregar un mueble
        </Button>
      </div>
    </Seccion>
  );
}

function RenglonDeLaLista({
  texto,
  etiqueta,
  placeholder,
  alCambiar,
  alQuitar,
  maximo,
}: {
  texto: string;
  etiqueta: string;
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
      <BotonDeLaFila icono="trash-2" etiqueta={`Sacar ${etiqueta}`} peligro alTocar={alQuitar} />
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
  const [traidos, setTraidos] = useState<{ ids: { id: string; texto: string }[] } | null>(null);
  const [sinNuevos, setSinNuevos] = useState(false);
  const { mostrar, lista } = borrador.herrajes;

  return (
    <Seccion
      numero={3}
      id="presupuesto-herrajes"
      titulo="Herrajes"
      bajada="Uno por renglón, con sus propiedades. Podés traer los de «Lo que hace falta»: vienen sin las cantidades."
      cuenta={
        lista.length === 0
          ? undefined
          : `${String(lista.length)} ${lista.length === 1 ? 'herraje' : 'herrajes'}${mostrar ? '' : ' · no se muestran'}`
      }
    >
      <Interruptor
        activo={mostrar}
        alCambiar={(activo) => {
          alCambiar({ ...borrador, herrajes: { ...borrador.herrajes, mostrar: activo } });
        }}
        className="min-h-tap self-start rounded-pill pr-2"
      >
        <span className="text-body font-medium">Mostrarlos en el presupuesto</span>
      </Interruptor>
      {!mostrar && (
        <p className="-mt-1.5 text-label leading-relaxed text-text-2">
          No van en el presupuesto. La lista queda guardada por si los volvés a mostrar.
        </p>
      )}

      {lista.length === 0 ? (
        <p className="border-t border-hairline-soft pt-3 text-label text-text-2">
          Todavía no hay herrajes. Traelos de «Lo que hace falta» o escribilos acá abajo.
        </p>
      ) : (
        <ul className={`list-none border-t border-hairline-soft ${mostrar ? '' : 'opacity-60'}`}>
          {lista.map((herraje, indice) => (
            <RenglonDeLaLista
              key={herraje.id}
              texto={herraje.texto}
              etiqueta={`Herraje ${String(indice + 1)}`}
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
          texto={`Traje ${String(traidos.ids.length)} ${
            traidos.ids.length === 1 ? 'herraje' : 'herrajes'
          } de «Lo que hace falta».`}
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
          Ya están todos los herrajes de «Lo que hace falta».
        </p>
      )}

      <AgregarRenglon
        etiqueta="Agregar un herraje"
        placeholder="Correderas, bisagras, pistones…"
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
        Traer de «Lo que hace falta»
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
            <span className="block font-semibold">{clausula.titulo}</span>
          )}
          {texto}
          {esperaUnPago && (
            <span className="mt-1 block text-meta text-text-3">
              Aparece cuando tu cliente pague algo: dice cuánto ya pagó.
            </span>
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
  titulo,
  bajada,
  clausulas,
  huecos,
  placeholder,
}: ConElBorrador & {
  numero: number;
  grupo: GrupoDeCasillas;
  titulo: string;
  bajada: string;
  clausulas: readonly Clausula[];
  huecos: HuecosDelEditor;
  placeholder: string;
}) {
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
      titulo={titulo}
      bajada={bajada}
      cuenta={`Van ${String(van)} de ${String(total)}`}
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
          <p className="text-label font-semibold">Solo en este presupuesto</p>
          <ul className="list-none">
            {seleccion.propias.map((propia, indice) => (
              <RenglonDeLaLista
                key={propia.id}
                texto={propia.texto}
                etiqueta={`${titulo}: propia ${String(indice + 1)}`}
                placeholder={placeholder}
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
        Agregar otra
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
  const conImporte = opcionesDelEditor(valores).filter((opcion) => opcion.monto > 0);
  const documentables = valoresDelTrabajo(totalDelEditor(valores), conImporte);
  const deQuien = senaPropia ? 'de este trabajo' : 'del taller';
  const porcentaje = `${formatearPorcentaje(senaBp)}%`;
  if (documentables === null || (valores.opciones.length > 0 && conImporte.length === 0)) {
    return (
      <p className="max-w-[30rem] rounded-field bg-surface px-3.5 py-3 text-label leading-relaxed text-text-2">
        Con el total, acá se ve la seña del {porcentaje} {deQuien}
        {abonado > 0 ? ` y lo que ya pagó (${formatearPesos(abonado)}).` : '.'}
      </p>
    );
  }
  const cuentas = cuentasDelPresupuesto(documentables, senaBp, abonado);
  if (documentables.tipo === 'total') {
    const [cuenta] = cuentas;
    if (cuenta === undefined) return null;
    return (
      <div className="flex max-w-[30rem] flex-col gap-2 rounded-field bg-surface px-3.5 py-3 text-body">
        <p className="text-label font-medium text-text-2">La seña que le vas a pedir</p>
        <LineaDePuntos
          izquierda={`Seña del ${porcentaje} ${deQuien}`}
          derecha={<span className="font-semibold">{formatearPesos(cuenta.sena)}</span>}
        />
        {abonado > 0 && (
          <>
            <LineaDePuntos
              izquierda="Ya pagó"
              derecha={<span className="font-semibold text-hogar">{formatearPesos(abonado)}</span>}
            />
            <div className="border-t border-ink pt-2">
              <LineaDePuntos
                className="font-semibold"
                izquierda="Le falta para la seña"
                derecha={formatearPesos(cuenta.faltaParaLaSena)}
              />
            </div>
          </>
        )}
      </div>
    );
  }
  return (
    <div className="flex max-w-[30rem] flex-col gap-2 rounded-field bg-surface px-3.5 py-3 text-body">
      <p className="text-label font-medium text-text-2">
        La seña del {porcentaje} {deQuien}, según la que elija
      </p>
      {cuentas.map((cuenta) => (
        <LineaDePuntos
          key={cuenta.id ?? cuenta.letra}
          izquierda={`Opción ${cuenta.letra ?? ''}`}
          derecha={<span className="font-semibold">{formatearPesos(cuenta.sena)}</span>}
        />
      ))}
      {abonado > 0 && (
        <p className="border-t border-hairline pt-2 text-label leading-relaxed text-text-2">
          Ya pagó{' '}
          <span className="font-semibold text-hogar tabular-nums">{formatearPesos(abonado)}</span>:
          se descuenta de la seña de la que elija.
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
  const id = useId();
  const conOpciones = valores.opciones.length > 0;

  return (
    <Seccion
      numero={6}
      id="presupuesto-valores"
      titulo="Valores"
      bajada="Es el presupuesto del trabajo: si lo cambiás acá, cambia también en la ficha. La seña la calcula la app."
      cuenta={conOpciones ? `${String(valores.opciones.length)} opciones` : undefined}
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
                    <span className="mt-1.5 flex size-8 flex-none items-center justify-center rounded-field bg-surface text-label font-semibold text-ink">
                      {letra}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <TextoQueCrece
                        variante="renglon"
                        aria-label={`Qué incluye la opción ${letra}`}
                        valor={opcion.descripcion}
                        maxLength={LARGOS_DEL_DOCUMENTO.descripcionDeLaOpcion}
                        placeholder="Qué la hace distinta: frentes, material, un mueble más…"
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
                          La aprobó
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
                        aria-label={`Importe de la opción ${letra}`}
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
                      etiqueta={`Quitar la opción ${letra}`}
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
            Agregar una opción
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-total`} className="text-label text-text-2">
              Total del presupuesto
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
            Ofrecerle más de una opción
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
    ...plantilla.formasDePago.map((forma) => ({ valor: forma.id, etiqueta: forma.nombre })),
    { valor: 'ninguna', etiqueta: 'No mostrarla' },
  ];

  return (
    <Seccion
      numero={7}
      id="presupuesto-forma-de-pago"
      titulo="Forma de pago"
      bajada="Elegí una de tus formas de siempre y retocá el texto para este trabajo. No cambia cómo te paga en su página."
    >
      <fieldset className="@container flex min-w-0 flex-col gap-1.5">
        <legend className="sr-only">Forma de pago</legend>
        <div
          role="radiogroup"
          aria-label="Forma de pago"
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
        <p className="text-label leading-relaxed text-text-2">
          La forma de pago no va en este presupuesto. Tu cliente igual ve en su página cómo pagarte
          la seña.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-3">
            <label htmlFor={`${id}-texto`} className="text-label text-text-2">
              Lo que dice, para este trabajo
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
                Volver al de siempre
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
            {retocada
              ? 'Retocado para este trabajo. La de siempre sigue igual en Ajustes.'
              : `El ${huecos.valores.sena} es la seña de este trabajo.`}
          </span>
        </div>
      )}
    </Seccion>
  );
}

export function GarantiaDelBorrador({ texto, meses }: { texto: string; meses: number }) {
  return (
    <Seccion
      numero={10}
      id="presupuesto-garantia"
      titulo="Garantía"
      bajada="Va siempre: la ley pide por lo menos 6 meses para un mueble nuevo."
      cuenta={`${String(meses)} ${meses === 1 ? 'mes' : 'meses'}`}
    >
      <p className="flex items-start gap-3 rounded-field bg-surface px-3.5 py-3 text-body leading-relaxed text-ink">
        <Icono nombre="shield" tamano={18} className="mt-0.5 flex-none text-text-2" />
        {texto}
      </p>
      <Ir
        a={RUTA_DEL_PRESUPUESTO_EN_AJUSTES}
        className="inline-flex min-h-tap items-center gap-1.5 self-start rounded-field text-label font-semibold underline underline-offset-3"
      >
        <Icono nombre="settings" tamano={16} />
        Se cambia en Ajustes
      </Ir>
    </Seccion>
  );
}

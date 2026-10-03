import {
  modoDeMostrar,
  PUNTOS_DE_LA_TASA,
  UMBRAL_BARRAS,
  UMBRAL_EVOLUCION,
  type Comentario,
  type Conteo,
  type FilaDeTrabajo,
  type ModoDeMostrar,
  type ResultadoDePregunta,
  type ResumenDeOpiniones,
  type TipoDePregunta,
  type VersionAnterior,
} from '@maun/domain';
import { useId, useState, type ReactNode } from 'react';

import { iniciales } from '@/entities/cliente';
import {
  BarraDivergente,
  BORDE_DEL_POLO,
  Carita,
  cuantasRespuestas,
  PuntosPorPersona,
} from '@/entities/opinion';
import { useMensajes, type Mensajes } from '@/shared/idioma';
import { diaYMes, haceCuanto, rutaDelProyecto, Ir } from '@/shared/lib';
import { Icono, Tablero } from '@/shared/ui';

import { porcentajeConLaCuenta, promedioLegible } from '../model/numeros';
import { PuntosDeLaTasa, TablaDeNumeros, TiraEnElTiempo } from './Graficos';

type AlAbrir = (respuestaId: string) => void;

const TITULO_DE_SECCION = 'text-subtitulo font-semibold';

export function Titular({ resumen }: { resumen: ResumenDeOpiniones }) {
  const textos = useMensajes().paginaOpiniones.titular;
  const promedio = resumen.titular?.promedio ?? null;
  const { enviadas, contestadas } = resumen;

  return (
    <section
      aria-label={textos.region}
      className="@container rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <div className="grid grid-cols-1 items-end gap-4.5 @xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] @xl:gap-x-10 @xl:gap-y-0">
        <div className="min-w-0">
          <div className="text-body-sm text-text-2">{textos.queTanConformes}</div>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-2.5">
            <span
              translate="no"
              className="text-cifra leading-none font-semibold tracking-[-0.02em] tabular-nums @xl:text-cifra-lg"
            >
              {promedio === null ? '—' : promedioLegible(promedio.decimas)}
            </span>
            <span className="text-subtitulo text-text-2">{textos.deCinco}</span>
          </div>
          <div className="mt-1.5 text-body text-text-2">
            {promedio === null ? textos.nadieContesto : textos.promedioDe(promedio.n)}
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-1.75 pb-1">
          <div className="text-body-sm text-text-2">
            {textos.contestaron(porcentajeConLaCuenta(contestadas, enviadas))}
          </div>
          <PuntosDeLaTasa enviadas={enviadas} contestadas={contestadas} />
          <div className="text-label leading-snug text-text-3">
            {contestadas === 1
              ? textos.unPunto
              : enviadas > PUNTOS_DE_LA_TASA
                ? textos.variosPuntosConTope(PUNTOS_DE_LA_TASA)
                : textos.variosPuntos}
          </div>
        </div>
      </div>
    </section>
  );
}

function UnComentario({
  comentario,
  hoy,
  alAbrir,
}: {
  comentario: Comentario;
  hoy: string;
  alAbrir: AlAbrir;
}) {
  const textos = useMensajes().paginaOpiniones.comentarios;
  const { titular, trabajo } = comentario;
  const filo = titular?.polo ? BORDE_DEL_POLO[titular.polo] : '';

  return (
    <li
      className={`flex min-w-0 flex-col gap-2.5 rounded-panel border border-t-2 border-hairline bg-paper px-4 pt-3.5 pb-4 md:px-5 ${filo}`}
    >
      <p
        translate="no"
        className="max-w-[42rem] text-body-lg leading-relaxed whitespace-pre-line text-pretty @lg:text-subtitulo"
      >
        {comentario.texto}
      </p>
      <div className="flex flex-wrap items-center gap-2.5 text-label">
        {titular !== null && (
          <span className="flex items-center gap-1.75">
            <Carita paso={titular} tamano={17} />
            <span className="font-semibold text-ink">{titular.etiqueta}</span>
          </span>
        )}
        {titular !== null && (
          <span aria-hidden className="text-text-2">
            ·
          </span>
        )}
        <button
          type="button"
          translate={trabajo.cliente === '' ? undefined : 'no'}
          onClick={() => {
            alAbrir(comentario.respuestaId);
          }}
          className="font-medium underline underline-offset-3"
        >
          {trabajo.cliente === '' ? textos.verLaRespuesta : trabajo.cliente}
        </button>
        <span translate="no" className="min-w-0 truncate text-text-3">
          {trabajo.trabajo}
        </span>
        <span translate="no" className="text-text-3">
          {haceCuanto(comentario.dia, hoy)}
        </span>
      </div>
    </li>
  );
}

export function LoQueEscribieron({
  resumen,
  hoy,
  alAbrir,
}: {
  resumen: ResumenDeOpiniones;
  hoy: string;
  alAbrir: AlAbrir;
}) {
  const textos = useMensajes().paginaOpiniones.comentarios;
  const idDelTitulo = useId();
  const { comentarios, contestadas } = resumen;
  const escribieron = new Set(comentarios.map((comentario) => comentario.respuestaId)).size;

  return (
    <section aria-labelledby={idDelTitulo} className="@container flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2.5 px-1">
        <h2 id={idDelTitulo} className={TITULO_DE_SECCION}>
          {textos.titulo}
        </h2>
        {escribieron > 0 && (
          <span className="text-label text-text-3">
            {textos.escribieronAlgo(escribieron, contestadas)}
          </span>
        )}
      </div>
      {comentarios.length === 0 ? (
        <p className="rounded-panel border border-hairline bg-paper px-4 py-4 text-body-sm leading-relaxed text-text-2 md:px-5">
          {textos.nadieEscribio}
        </p>
      ) : (
        <Tablero
          tarjetaMinima="27rem"
          completar
          como="ul"
          className="list-none grid-cols-1 gap-3 p-0 md:gap-4"
        >
          {comentarios.map((comentario) => (
            <UnComentario
              key={`${comentario.respuestaId}-${comentario.pregunta}`}
              comentario={comentario}
              hoy={hoy}
              alAbrir={alAbrir}
            />
          ))}
        </Tablero>
      )}
    </section>
  );
}

function Distribucion({
  modo,
  conteos,
  tipo,
}: {
  modo: ModoDeMostrar;
  conteos: readonly Conteo[];
  tipo: TipoDePregunta;
}) {
  return modo === 'barras' ? (
    <BarraDivergente conteos={conteos} />
  ) : (
    <PuntosPorPersona conteos={conteos} tipo={tipo} />
  );
}

function Cita({ children }: { children: ReactNode }) {
  return (
    <span translate="no" className="text-ink">
      {children}
    </span>
  );
}

function LaDeAntes({
  anterior,
  hoy,
  conNumeros,
}: {
  anterior: VersionAnterior;
  hoy: string;
  conNumeros: boolean;
}) {
  const textos = useMensajes().paginaOpiniones.preguntas;
  const [abierta, setAbierta] = useState(false);
  const idDeLasViejas = useId();
  const { pregunta, n } = anterior;

  return (
    <div className="mt-3 border-l-2 border-border px-3.25 py-2.75 text-label leading-relaxed text-text-2">
      {textos.antesDecia(Cita, pregunta.texto, n, diaYMes(anterior.hasta, hoy))}
      <button
        type="button"
        aria-expanded={abierta}
        aria-controls={idDeLasViejas}
        onClick={() => {
          setAbierta((actual) => !actual);
        }}
        className="mt-1.5 block font-medium text-ink underline underline-offset-3"
      >
        {abierta ? textos.ocultarLasDeAntes : textos.verLasDeAntes}
      </button>
      {abierta && (
        <div id={idDeLasViejas} className="mt-3">
          <Distribucion
            modo={modoDeMostrar(pregunta, n)}
            conteos={anterior.conteos}
            tipo={pregunta.tipo}
          />
          {conNumeros && <TablaDeNumeros conteos={anterior.conteos} total={n} />}
        </div>
      )}
    </div>
  );
}

function UnaPregunta({
  resultado,
  hoy,
  conNumeros,
}: {
  resultado: ResultadoDePregunta;
  hoy: string;
  conNumeros: boolean;
}) {
  const { pregunta, n } = resultado;

  return (
    <div
      id={`pregunta-${pregunta.id}`}
      className="scroll-mt-4 border-t border-hairline-soft py-4.5 first:border-t-0"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <h3 translate="no" className="text-body leading-snug font-medium text-pretty">
          {pregunta.texto}
        </h3>
        <span className="text-label whitespace-nowrap text-text-3">{cuantasRespuestas(n)}</span>
      </div>
      <Distribucion modo={resultado.modo} conteos={resultado.conteos} tipo={pregunta.tipo} />
      {conNumeros && <TablaDeNumeros conteos={resultado.conteos} total={n} />}
      {resultado.anteriores.map((anterior) => (
        <LaDeAntes
          key={anterior.pregunta.id}
          anterior={anterior}
          hoy={hoy}
          conNumeros={conNumeros}
        />
      ))}
    </div>
  );
}

export function PreguntaPorPregunta({
  resumen,
  hoy,
}: {
  resumen: ResumenDeOpiniones;
  hoy: string;
}) {
  const textos = useMensajes().paginaOpiniones.preguntas;
  const [conNumeros, setConNumeros] = useState(false);
  const idDelTitulo = useId();
  const idDeLasArchivadas = useId();
  const conPolos = [...resumen.preguntas, ...resumen.archivadas].filter(
    ({ pregunta }) => pregunta.tipo === 'escala5' || pregunta.tipo === 'sitalvezno',
  );
  const enBarras = conPolos.filter(({ modo }) => modo === 'barras').length;
  const nota =
    enBarras === 0
      ? textos.deAUna(UMBRAL_BARRAS)
      : enBarras === conPolos.length
        ? textos.repartidas
        : textos.mezcladas(UMBRAL_BARRAS);

  return (
    <section aria-labelledby={idDelTitulo} className="flex flex-col gap-3 md:gap-4">
      <div className="flex flex-col gap-2">
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2.5 pl-1">
            <h2 id={idDelTitulo} className={TITULO_DE_SECCION}>
              {textos.titulo}
            </h2>
            <button
              type="button"
              aria-pressed={conNumeros}
              onClick={() => {
                setConNumeros((actual) => !actual);
              }}
              className="apretable flex h-8.5 items-center gap-1.75 rounded-pill border border-border bg-paper px-2.75 text-label font-medium hover:bg-ink/5"
            >
              <Icono nombre="table" tamano={15} />
              {conNumeros ? textos.ocultarLosNumeros : textos.verLosNumeros}
            </button>
          </div>
          <p className="mt-1 px-1 text-label leading-relaxed text-text-3">{nota}</p>
        </div>
        {resumen.preguntas.length > 0 && (
          <div className="rounded-panel border border-hairline bg-paper px-4">
            {resumen.preguntas.map((resultado) => (
              <UnaPregunta
                key={resultado.pregunta.id}
                resultado={resultado}
                hoy={hoy}
                conNumeros={conNumeros}
              />
            ))}
          </div>
        )}
      </div>
      {resumen.archivadas.length > 0 && (
        <div aria-labelledby={idDeLasArchivadas} role="group" className="flex flex-col gap-2">
          <div className="px-1">
            <h3 id={idDeLasArchivadas} className="text-body font-semibold">
              {textos.lasQueYaNo}
            </h3>
            <p className="mt-0.5 text-label leading-relaxed text-text-3">
              {textos.noSePreguntanMas}
            </p>
          </div>
          <div className="rounded-panel border border-hairline bg-paper px-4">
            {resumen.archivadas.map((resultado) => (
              <UnaPregunta
                key={resultado.pregunta.id}
                resultado={resultado}
                hoy={hoy}
                conNumeros={conNumeros}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function EnElTiempo({ resumen }: { resumen: ResumenDeOpiniones }) {
  const textos = useMensajes().paginaOpiniones.enElTiempo;
  const idDelTitulo = useId();
  const { conEvolucion, puntos } = resumen.evolucion;

  return (
    <section
      aria-labelledby={idDelTitulo}
      className="rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <h2 id={idDelTitulo} className={`mb-1 ${TITULO_DE_SECCION}`}>
        {textos.titulo}
      </h2>
      <p className="mb-3.5 text-label leading-relaxed text-text-3">
        {conEvolucion ? textos.conEvolucion : textos.sinEvolucion(UMBRAL_EVOLUCION)}
      </p>
      <TiraEnElTiempo puntos={puntos} conEvolucion={conEvolucion} />
    </section>
  );
}

function estadoDeLaFila(
  textos: Mensajes['paginaOpiniones']['trabajos'],
  fila: FilaDeTrabajo,
  hoy: string,
): string {
  const { pedido } = fila;
  if (pedido.estado === 'contestada') {
    return textos.contesto(haceCuanto(pedido.envio.contestadaEl ?? pedido.envio.enviadaEl, hoy));
  }
  if (pedido.estado === 'recordada') return textos.recordada;
  return textos.leMandaste(haceCuanto(pedido.envio.enviadaEl, hoy));
}

function ContenidoDeLaFila({ fila, hoy }: { fila: FilaDeTrabajo; hoy: string }) {
  const textos = useMensajes().paginaOpiniones.trabajos;
  const contesto = fila.pedido.estado === 'contestada';
  const { trabajo } = fila;
  return (
    <>
      <span
        aria-hidden
        translate="no"
        className={`flex size-8.5 flex-none items-center justify-center rounded-pill text-label font-semibold ${
          contesto ? 'bg-surface text-ink' : 'text-text-3'
        }`}
      >
        {iniciales(trabajo.cliente)}
      </span>
      <span className="min-w-0 flex-1">
        <span
          translate={trabajo.cliente === '' ? undefined : 'no'}
          className="block truncate text-body font-medium"
        >
          {trabajo.cliente === '' ? textos.sinCliente : trabajo.cliente}
        </span>
        <span translate="no" className="block truncate text-label text-text-3">
          {trabajo.trabajo}
        </span>
      </span>
      {fila.propias > 0 && (
        <span className="flex-none rounded-pill border border-border px-2 py-0.5 text-badge font-semibold text-text-2">
          {textos.propias(fila.propias)}
        </span>
      )}
      <span className="flex min-w-0 items-center gap-2">
        {contesto && <Carita paso={fila.titular} tamano={18} />}
        <span
          className={`text-right text-label ${contesto ? 'font-medium text-ink' : 'text-text-3'}`}
        >
          {estadoDeLaFila(textos, fila, hoy)}
        </span>
      </span>
    </>
  );
}

const FILA =
  'flex min-h-15 w-full items-center gap-3 py-2.75 text-left text-ink no-underline hover:bg-surface';

export function TrabajoPorTrabajo({
  trabajos,
  hoy,
  alAbrir,
  id,
}: {
  trabajos: readonly FilaDeTrabajo[];
  hoy: string;
  alAbrir: AlAbrir;
  id?: string;
}) {
  const textos = useMensajes().paginaOpiniones.trabajos;
  const idDelTitulo = useId();

  return (
    <section id={id} aria-labelledby={idDelTitulo} className="flex flex-col gap-2">
      <h2 id={idDelTitulo} className={`px-1 ${TITULO_DE_SECCION}`}>
        {textos.titulo}
      </h2>
      <ul className="list-none rounded-panel border border-hairline bg-paper px-4">
        {trabajos.map((fila) => {
          const respuestaId = fila.pedido.envio.respuestaId;
          return (
            <li
              key={fila.trabajo.proyectoId}
              className="border-t border-hairline-soft first:border-t-0"
            >
              {respuestaId === null ? (
                <Ir a={rutaDelProyecto(fila.trabajo.proyectoId)} className={FILA}>
                  <ContenidoDeLaFila fila={fila} hoy={hoy} />
                </Ir>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    alAbrir(respuestaId);
                  }}
                  className={FILA}
                >
                  <ContenidoDeLaFila fila={fila} hoy={hoy} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

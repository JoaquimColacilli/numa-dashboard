import {
  LARGOS_DEL_PRESUPUESTO,
  problemasParaMandar,
  type CampoQueFalta,
  type DocumentoDelPresupuesto,
} from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useId, useState, type MouseEvent, type ReactNode } from 'react';

import { MUTACION_DEL_ENVIO, type EnvioDelPresupuesto } from '@/entities/presupuesto';
import { EstadoBadge } from '@/entities/proyecto';
import { mensajeDeSincronizacion, traducirRechazo } from '@/shared/api';
import {
  fechaLarga,
  mensajeParaElCliente,
  metaDeAvisos,
  useAnchoDePantalla,
  whatsappCon,
} from '@/shared/lib';
import { PREPARANDO_EL_PDF, usePdfDelPresupuesto } from '@/shared/pdf';
import {
  Button,
  FilaDeAcciones,
  Hoja,
  Icono,
  MarcaDeRevision,
  RotuloDelPresupuesto,
  TextoQueCrece,
  type NombreDeIcono,
} from '@/shared/ui';

function Renglon({ icono, children }: { icono: NombreDeIcono; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-px flex size-7 flex-none items-center justify-center rounded-control bg-surface-2 text-ink"
      >
        <Icono nombre={icono} tamano={15} />
      </span>
      <span className="min-w-0 text-body leading-relaxed">{children}</span>
    </li>
  );
}

const NOMBRE_DEL_CAMPO: Readonly<Record<CampoQueFalta, string>> = {
  titulo: 'Título',
  muebles: 'Detalle',
  valores: 'Valores',
  queCambio: 'Qué cambió',
};

export interface EnlaceParaMandar {
  url: string | null;
  crear: () => string | null;
}

export interface HojaDeMandarProps {
  revision: number;
  numero: string | null;
  documento: DocumentoDelPresupuesto;
  hoy: string;
  valeHasta: string | null;
  pasaAPresupuestoEnviado: boolean;
  tildaLaTarea: boolean;
  todoGuardado: boolean;
  cliente: string;
  trabajo: string;
  telefono: string;
  enlace: EnlaceParaMandar;
  armarElEnvio: (queCambio: string) => EnvioDelPresupuesto | null;
  alIrAlCampo: (campo: CampoQueFalta) => void;
  alCerrar: () => void;
}

function primerNombre(cliente: string): string {
  const nombre = cliente.trim().split(/\s+/)[0] ?? '';
  return nombre === '' ? 'Tu cliente' : nombre;
}

function Listo({
  numero,
  revision,
  hoy,
  valeHasta,
  documento,
  cliente,
  trabajo,
  telefono,
  enlace,
  queCambio,
  alCerrar,
}: {
  numero: string;
  revision: number;
  hoy: string;
  valeHasta: string | null;
  documento: DocumentoDelPresupuesto;
  cliente: string;
  trabajo: string;
  telefono: string;
  enlace: EnlaceParaMandar;
  queCambio: string | null;
  alCerrar: () => void;
}) {
  const id = useId();
  const enCelular = useAnchoDePantalla() === 'movil';
  const esLaPrimera = revision <= 1;
  const [url, setUrl] = useState(enlace.url);
  const pdf = usePdfDelPresupuesto(
    {
      documento,
      numero,
      revision,
      mandadoEl: hoy,
      valeHasta,
      queCambio,
      aceptado: null,
      borrador: false,
    },
    { alAbrir: true },
  );
  const mensaje = mensajeParaElCliente(cliente, trabajo, url ?? '', true);

  function alTocarWhatsapp(evento: MouseEvent<HTMLAnchorElement>): void {
    if (url !== null) return;
    const nueva = enlace.crear();
    if (nueva === null) {
      evento.preventDefault();
      return;
    }
    setUrl(nueva);
    evento.currentTarget.href = whatsappCon(
      telefono,
      mensajeParaElCliente(cliente, trabajo, nueva, true),
    );
  }

  return (
    <Hoja
      titulo="Listo"
      bajada={esLaPrimera ? `Nº ${numero}` : `Nº ${numero} · Rev. ${String(revision)}`}
      alCerrar={alCerrar}
      desdeAbajo={enCelular}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
          <p className="flex items-start gap-3 text-body-lg leading-snug font-semibold">
            <span
              aria-hidden
              className="flex size-7 flex-none items-center justify-center rounded-pill bg-hogar-tint text-hogar"
            >
              <Icono nombre="check" tamano={16} grosor={2.25} />
            </span>
            {esLaPrimera
              ? `${primerNombre(cliente)} ya lo puede ver en su página.`
              : `${primerNombre(cliente)} ya ve la revisión ${String(revision)} en su página.`}
          </p>
          <RotuloDelPresupuesto
            numero={numero}
            revision={revision}
            emitido={hoy}
            valeHasta={valeHasta}
          />
          <section aria-labelledby={`${id}-aviso`} className="flex flex-col gap-2">
            <h3 id={`${id}-aviso`} className="text-label font-medium text-text-2">
              Avisale por WhatsApp
            </h3>
            <p className="rounded-field border border-hairline bg-surface-3 px-3.5 py-3 text-body leading-relaxed text-ink">
              «{mensajeParaElCliente(cliente, trabajo, '', true).replace(/: $/, '')}», con el enlace
              a su página.
            </p>
            {url === null && (
              <p className="text-meta text-text-3">
                Todavía no tiene enlace: al tocar, se crea y va en el mensaje.
              </p>
            )}
          </section>
        </div>
        <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
          <div className="flex flex-col gap-2">
            <a
              href={url === null ? '#' : whatsappCon(telefono, mensaje)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={alTocarWhatsapp}
              className="apretable inline-flex min-h-button items-center justify-center gap-2 rounded-pill bg-ink px-[18px] py-1.5 text-center text-body font-medium text-paper hover:bg-ink-hover"
            >
              <Icono nombre="message-circle" tamano={18} />
              Mandarle el link por WhatsApp
            </a>
            <Button variant="secundario" onClick={pdf.descargar}>
              <Icono nombre="download" tamano={16} />
              {pdf.estado === 'preparando' && pdf.esperando === 'descargar'
                ? PREPARANDO_EL_PDF
                : 'Descargar el PDF'}
            </Button>
          </div>
        </footer>
      </div>
    </Hoja>
  );
}

function Anotado({
  revision,
  cliente,
  alCerrar,
}: {
  revision: number;
  cliente: string;
  alCerrar: () => void;
}) {
  const enCelular = useAnchoDePantalla() === 'movil';
  return (
    <Hoja
      titulo="Anotado sin señal"
      bajada={revision <= 1 ? 'El presupuesto' : `La revisión ${String(revision)}`}
      alCerrar={alCerrar}
      desdeAbajo={enCelular}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
          <p className="flex items-start gap-3 text-body-lg leading-snug font-semibold">
            <span
              aria-hidden
              className="flex size-7 flex-none items-center justify-center rounded-pill bg-surface-2 text-text-2"
            >
              <Icono nombre="cloud-off" tamano={16} />
            </span>
            Se numera cuando vuelva la señal.
          </p>
          <p className="text-body leading-relaxed text-text-2">
            Quedó en la cola: apenas haya señal se manda solo, con su número, y{' '}
            {primerNombre(cliente)} lo ve en su página. El link por WhatsApp lo vas a tener en la
            tarjeta del presupuesto cuando se mande.
          </p>
        </div>
        <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
          <Button className="w-full" onClick={alCerrar}>
            Listo
          </Button>
        </footer>
      </div>
    </Hoja>
  );
}

export function HojaDeMandar({
  revision,
  numero,
  documento,
  hoy,
  valeHasta,
  pasaAPresupuestoEnviado,
  tildaLaTarea,
  todoGuardado,
  cliente,
  trabajo,
  telefono,
  enlace,
  armarElEnvio,
  alIrAlCampo,
  alCerrar,
}: HojaDeMandarProps) {
  const id = useId();
  const enCelular = useAnchoDePantalla() === 'movil';
  const [queCambio, setQueCambio] = useState('');
  const mandar = useMutation({
    ...MUTACION_DEL_ENVIO,
    meta: metaDeAvisos('presupuestoMandado', { errorEnPantalla: true, sujeto: trabajo }),
  });
  const problemas = problemasParaMandar(documento, revision, queCambio);
  const faltaAlgoDelBorrador = problemas.some(({ campo }) => campo !== 'queCambio');
  const esLaPrimera = revision <= 1;

  if (mandar.isSuccess) {
    return (
      <Listo
        numero={mandar.data.revision.numero}
        revision={mandar.data.revision.revision}
        hoy={mandar.data.revision.mandado_el}
        valeHasta={mandar.data.revision.vale_hasta}
        documento={documento}
        cliente={cliente}
        trabajo={trabajo}
        telefono={telefono}
        enlace={enlace}
        queCambio={mandar.data.revision.que_cambio}
        alCerrar={alCerrar}
      />
    );
  }

  if (mandar.isPaused) {
    return <Anotado revision={revision} cliente={cliente} alCerrar={alCerrar} />;
  }

  const rechazo = mandar.isError
    ? (traducirRechazo(mandar.error, { operacion: 'presupuesto', sujeto: trabajo }) ?? {
        titulo: 'No se pudo mandar el presupuesto.',
        queHacer: mensajeDeSincronizacion(mandar.error),
      })
    : null;
  const titulo = esLaPrimera ? 'Mandar el presupuesto' : `Mandar la revisión ${String(revision)}`;
  const delPresupuesto = documento.titulo.trim();

  return (
    <Hoja
      titulo={titulo}
      bajada={
        numero !== null
          ? `Nº ${numero} · ${cliente}`
          : delPresupuesto === ''
            ? cliente
            : `${delPresupuesto} · ${cliente}`
      }
      alCerrar={alCerrar}
      desdeAbajo={enCelular}
      conCambios={queCambio.trim() !== ''}
    >
      {(pedirCierre) => (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
            {faltaAlgoDelBorrador && (
              <section
                aria-labelledby={`${id}-falta`}
                className="flex flex-col gap-0.5 rounded-field bg-atencion-tint px-3.5 pt-3 pb-1.5"
              >
                <h3
                  id={`${id}-falta`}
                  className="flex items-center gap-2 text-body font-semibold text-atencion"
                >
                  <Icono nombre="triangle-alert" tamano={16} />
                  Le falta algo para mandarlo
                </h3>
                <ul className="flex flex-col">
                  {problemas
                    .filter(({ campo }) => campo !== 'queCambio')
                    .map((problema) => (
                      <li key={problema.campo}>
                        <button
                          type="button"
                          onClick={() => {
                            alIrAlCampo(problema.campo);
                          }}
                          className="flex min-h-tap w-full items-center gap-3 text-left text-body text-ink"
                        >
                          <span className="min-w-0 flex-1">{problema.texto}</span>
                          <span className="flex flex-none items-center gap-1 text-label font-semibold underline underline-offset-3">
                            {NOMBRE_DEL_CAMPO[problema.campo]}
                            <Icono nombre="chevron-right" tamano={16} />
                          </span>
                        </button>
                      </li>
                    ))}
                </ul>
              </section>
            )}

            {rechazo !== null && (
              <p
                role="alert"
                className="flex items-start gap-2.5 rounded-field bg-alerta-tint px-3.5 py-3 text-body leading-relaxed"
              >
                <Icono nombre="circle-alert" tamano={18} className="mt-0.5 flex-none text-alerta" />
                <span>
                  <span className="block font-semibold">{rechazo.titulo}</span>
                  {rechazo.queHacer}
                </span>
              </p>
            )}

            <section aria-labelledby={`${id}-que-pasa`} className="flex flex-col gap-2.5">
              <h3 id={`${id}-que-pasa`} className="text-label font-medium text-text-2">
                Qué pasa al mandarlo
              </h3>
              <ul className="flex flex-col gap-2">
                <Renglon icono="eye">
                  Tu cliente lo ve en su página con el número y la fecha de hoy
                  {esLaPrimera ? ', y lo puede bajar en PDF.' : ', arriba de todo lo que cambió.'}
                </Renglon>
                <Renglon icono="calendar">
                  {valeHasta === null
                    ? 'No vence: no le mostramos una fecha límite.'
                    : `Vale hasta el ${fechaLarga(valeHasta, hoy)}.`}
                </Renglon>
                {pasaAPresupuestoEnviado && (
                  <Renglon icono="arrow-right">
                    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                      Pasa a <EstadoBadge estado="presupuesto_enviado" />
                    </span>
                  </Renglon>
                )}
                {tildaLaTarea && (
                  <Renglon icono="list-checks">
                    Se tilda «Armar el presupuesto» en Qué falta.
                  </Renglon>
                )}
                {!esLaPrimera && (
                  <Renglon icono="history">
                    La revisión {revision - 1} queda guardada en la ficha, con su PDF.
                  </Renglon>
                )}
              </ul>
            </section>

            {!esLaPrimera && (
              <section className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between gap-3">
                  <label
                    htmlFor={`${id}-que-cambio`}
                    className="flex items-center gap-2 text-body font-semibold"
                  >
                    <MarcaDeRevision numero={revision} suelta />
                    Qué cambió
                  </label>
                  <span className="text-meta text-text-3 tabular-nums">
                    {queCambio.length} de {LARGOS_DEL_PRESUPUESTO.queCambio}
                  </span>
                </span>
                <TextoQueCrece
                  id={`${id}-que-cambio`}
                  valor={queCambio}
                  filasMinimas={3}
                  maxLength={LARGOS_DEL_PRESUPUESTO.queCambio}
                  placeholder="Pasamos la alacena a Gris Grafito y sumamos…"
                  alCambiar={setQueCambio}
                />
                <span className="text-meta text-text-3">
                  Lo lee tu cliente arriba del presupuesto. Hace falta para mandar una revisión.
                </span>
              </section>
            )}
          </div>

          <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
            <FilaDeAcciones>
              <Button variant="secundario" onClick={pedirCierre}>
                Cancelar
              </Button>
              <Button
                disabled={problemas.length > 0 || !todoGuardado || mandar.isPending}
                onClick={() => {
                  const envio = armarElEnvio(queCambio);
                  if (envio !== null) mandar.mutate(envio);
                }}
              >
                <Icono nombre="send" tamano={16} />
                {mandar.isPending ? 'Mandando…' : todoGuardado ? 'Mandar' : 'Guardando…'}
              </Button>
            </FilaDeAcciones>
          </footer>
        </div>
      )}
    </Hoja>
  );
}

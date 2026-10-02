import {
  cotizacionLeida,
  idiomaLeido,
  LARGOS_DEL_PRESUPUESTO,
  problemasParaMandar,
  type CampoQueFalta,
  type DocumentoDelPresupuesto,
  type Idioma,
  type ReferenciaEnPesos,
} from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useId, useState, type MouseEvent, type ReactNode } from 'react';

import { MUTACION_DEL_ENVIO, type EnvioDelPresupuesto } from '@/entities/presupuesto';
import { EstadoBadge } from '@/entities/proyecto';
import { idiomaDeLosClientes, MUTACION_DE_AJUSTES, useReplicaDelTaller } from '@/entities/replica';
import { ajustesDe, mensajeDeSincronizacion, traducirRechazo, type FilaDe } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { useMensajesDelClienteEn } from '@/shared/idioma-del-cliente';
import {
  fechaLarga,
  formatearPesos,
  mensajeParaElCliente,
  metaDeAvisos,
  useAnchoDePantalla,
  whatsappCon,
  type TextosDelMensajeAlCliente,
} from '@/shared/lib';
import { usePdfDelPresupuesto, useTextosDelPdf } from '@/shared/pdf';
import {
  Button,
  CampoDelDolar,
  errorDelDolar,
  FilaDeAcciones,
  Hoja,
  Icono,
  MarcaDeRevision,
  RotuloDelPresupuesto,
  TextoQueCrece,
  type NombreDeIcono,
} from '@/shared/ui';

import { dolarDeHoy } from '../model/documento';

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

function MensajeAlCliente({ children }: { children: ReactNode }) {
  return <span translate="no">{children}</span>;
}

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
  armarElEnvio: (
    queCambio: string,
    referencia: ReferenciaEnPesos | null,
  ) => EnvioDelPresupuesto | null;
  alIrAlCampo: (campo: CampoQueFalta) => void;
  alCerrar: () => void;
}

type DolarDelTaller = Pick<FilaDe<'ajustes'>, 'dolar_del_dia_centavos' | 'dolar_del_dia_el'>;

function dolarGuardado(ajustes: Partial<DolarDelTaller>): DolarDelTaller {
  return {
    dolar_del_dia_centavos: ajustes.dolar_del_dia_centavos ?? null,
    dolar_del_dia_el: ajustes.dolar_del_dia_el ?? null,
  };
}

function primerNombre(cliente: string): string {
  return cliente.trim().split(/\s+/)[0] ?? '';
}

function Listo({
  numero,
  revision,
  hoy,
  valeHasta,
  documento,
  idioma,
  cliente,
  trabajo,
  telefono,
  enlace,
  queCambio,
  whatsapp,
  alCerrar,
}: {
  numero: string;
  revision: number;
  hoy: string;
  valeHasta: string | null;
  documento: DocumentoDelPresupuesto;
  idioma: Idioma;
  cliente: string;
  trabajo: string;
  telefono: string;
  enlace: EnlaceParaMandar;
  queCambio: string | null;
  whatsapp: TextosDelMensajeAlCliente | undefined;
  alCerrar: () => void;
}) {
  const m = useMensajes().armarElPresupuesto.mandar.listo;
  const textosDelPdf = useTextosDelPdf();
  const id = useId();
  const enCelular = useAnchoDePantalla() === 'movil';
  const esLaPrimera = revision <= 1;
  const [url, setUrl] = useState(enlace.url);
  const pdf = usePdfDelPresupuesto(
    {
      documento,
      idioma,
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
  const paraElCliente = (direccion: string) =>
    whatsapp === undefined ? '' : mensajeParaElCliente(whatsapp, cliente, trabajo, direccion, true);
  const mensaje = paraElCliente(url ?? '');
  const nombre = primerNombre(cliente);
  const yaLoVe = esLaPrimera
    ? nombre === ''
      ? m.tuClienteYaLoPuedeVer
      : m.yaLoPuedeVer(nombre)
    : nombre === ''
      ? m.tuClienteYaVeLaRevision(revision)
      : m.yaVeLaRevision(nombre, revision);

  function alTocarWhatsapp(evento: MouseEvent<HTMLAnchorElement>): void {
    if (url !== null) return;
    const nueva = enlace.crear();
    if (nueva === null) {
      evento.preventDefault();
      return;
    }
    setUrl(nueva);
    evento.currentTarget.href = whatsappCon(telefono, paraElCliente(nueva));
  }

  return (
    <Hoja
      titulo={m.titulo}
      bajada={esLaPrimera ? m.numero(numero) : m.numeroYRevision(numero, revision)}
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
            {yaLoVe}
          </p>
          <RotuloDelPresupuesto
            numero={numero}
            revision={revision}
            emitido={hoy}
            valeHasta={valeHasta}
          />
          <section aria-labelledby={`${id}-aviso`} className="flex flex-col gap-2">
            <h3 id={`${id}-aviso`} className="text-label font-medium text-text-2">
              {m.avisale}
            </h3>
            <p className="rounded-field border border-hairline bg-surface-3 px-3.5 py-3 text-body leading-relaxed text-ink">
              {m.conElEnlace(MensajeAlCliente, paraElCliente('').replace(/: $/, ''))}
            </p>
            {url === null && <p className="text-meta text-text-3">{m.sinEnlace}</p>}
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
              {m.mandarleElLink}
            </a>
            <Button variant="secundario" onClick={pdf.descargar}>
              <Icono nombre="download" tamano={16} />
              {pdf.estado === 'preparando' && pdf.esperando === 'descargar'
                ? textosDelPdf.preparando
                : m.descargarElPdf}
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
  const textos = useMensajes().armarElPresupuesto;
  const m = textos.mandar.anotado;
  const enCelular = useAnchoDePantalla() === 'movil';
  const nombre = primerNombre(cliente);
  return (
    <Hoja
      titulo={m.titulo}
      bajada={revision <= 1 ? m.elPresupuesto : m.laRevision(revision)}
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
            {textos.seNumeraCuandoVuelvaLaSenal}
          </p>
          <p className="text-body leading-relaxed text-text-2">
            {nombre === '' ? m.quedoEnLaColaTuCliente : m.quedoEnLaCola(nombre)}
          </p>
        </div>
        <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
          <Button className="w-full" onClick={alCerrar}>
            {m.listo}
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
  const textos = useMensajes().armarElPresupuesto;
  const m = textos.mandar;
  const replica = useReplicaDelTaller();
  const delCliente = useMensajesDelClienteEn(idiomaDeLosClientes(replica));
  const id = useId();
  const enCelular = useAnchoDePantalla() === 'movil';
  const [queCambio, setQueCambio] = useState('');
  const [dolarEscrito, setDolarEscrito] = useState<number | null>(null);
  const mandar = useMutation({
    ...MUTACION_DEL_ENVIO,
    meta: metaDeAvisos('presupuestoMandado', { errorEnPantalla: true, sujeto: trabajo }),
  });
  const guardarElDolar = useMutation(MUTACION_DE_AJUSTES);
  const problemas = problemasParaMandar(documento, revision, queCambio);
  const faltaAlgoDelBorrador = problemas.some(({ campo }) => campo !== 'queCambio');
  const esLaPrimera = revision <= 1;
  const enDolares = documento.forma === 2;
  const delDia = enDolares ? dolarDeHoy(replica, hoy) : null;
  const pideElDolar = enDolares && delDia === null;
  const dolar = delDia ?? cotizacionLeida(dolarEscrito);
  const referencia: ReferenciaEnPesos | null =
    !enDolares || dolar === null ? null : { cotizacion: dolar, fecha: hoy };
  const faltaElDolar = enDolares && referencia === null;

  function mandarlo(): void {
    const envio = armarElEnvio(queCambio, referencia);
    if (envio === null) return;
    const ajustes = ajustesDe(replica);
    if (pideElDolar && referencia !== null && ajustes !== undefined) {
      guardarElDolar.mutate({
        id: ajustes.id,
        cambios: { dolar_del_dia_centavos: referencia.cotizacion, dolar_del_dia_el: hoy },
        previos: dolarGuardado(ajustes),
      });
    }
    mandar.mutate(envio);
  }

  if (mandar.isSuccess) {
    return (
      <Listo
        numero={mandar.data.revision.numero}
        revision={mandar.data.revision.revision}
        hoy={mandar.data.revision.mandado_el}
        valeHasta={mandar.data.revision.vale_hasta}
        documento={mandar.variables.pedido.documento}
        idioma={idiomaLeido(mandar.data.revision.idioma)}
        cliente={cliente}
        trabajo={trabajo}
        telefono={telefono}
        enlace={enlace}
        queCambio={mandar.data.revision.que_cambio}
        whatsapp={delCliente?.whatsapp}
        alCerrar={alCerrar}
      />
    );
  }

  if (mandar.isPaused) {
    return <Anotado revision={revision} cliente={cliente} alCerrar={alCerrar} />;
  }

  const rechazo = mandar.isError
    ? (traducirRechazo(mandar.error, { operacion: 'presupuesto', sujeto: trabajo }) ?? {
        titulo: m.noSePudoMandar,
        queHacer: mensajeDeSincronizacion(mandar.error),
      })
    : null;
  const titulo = esLaPrimera ? textos.mandarElPresupuesto : textos.mandarLaRevision(revision);
  const delPresupuesto = documento.titulo.trim();

  return (
    <Hoja
      titulo={titulo}
      bajada={
        numero !== null ? (
          m.numeroYCliente(numero, cliente)
        ) : (
          <span translate="no" className="truncate text-label text-text-2">
            {delPresupuesto === '' ? cliente : `${delPresupuesto} · ${cliente}`}
          </span>
        )
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
                  {m.leFaltaAlgo}
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
                          <span className="min-w-0 flex-1">{m.loQueFalta[problema.motivo]}</span>
                          <span className="flex flex-none items-center gap-1 text-label font-semibold underline underline-offset-3">
                            {m.campos[problema.campo]}
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

            {pideElDolar && (
              <CampoDelDolar
                etiqueta={m.dolar.pregunta}
                value={dolarEscrito}
                onChange={setDolarEscrito}
                error={dolarEscrito === null ? undefined : errorDelDolar(dolarEscrito, false)}
                ayuda={m.dolar.ayuda}
              />
            )}

            <section aria-labelledby={`${id}-que-pasa`} className="flex flex-col gap-2.5">
              <h3 id={`${id}-que-pasa`} className="text-label font-medium text-text-2">
                {m.quePasa}
              </h3>
              <ul className="flex flex-col gap-2">
                <Renglon icono="eye">
                  {esLaPrimera ? m.loVeYLoPuedeBajar : m.loVeArribaDeLoQueCambio}
                </Renglon>
                <Renglon icono="calendar">
                  {valeHasta === null ? m.noVence : m.valeHasta(fechaLarga(valeHasta, hoy))}
                </Renglon>
                {pasaAPresupuestoEnviado && (
                  <Renglon icono="arrow-right">
                    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                      {m.pasaA(<EstadoBadge estado="presupuesto_enviado" />)}
                    </span>
                  </Renglon>
                )}
                {tildaLaTarea && <Renglon icono="list-checks">{m.seTilda}</Renglon>}
                {!esLaPrimera && <Renglon icono="history">{m.quedaGuardada(revision - 1)}</Renglon>}
                {enDolares && (
                  <Renglon icono="coins">
                    {referencia === null
                      ? m.conElDolarDeHoy
                      : m.conLaReferencia(formatearPesos(referencia.cotizacion))}
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
                    {m.queCambio}
                  </label>
                  <span className="text-meta text-text-3 tabular-nums">
                    {m.contador(queCambio.length, LARGOS_DEL_PRESUPUESTO.queCambio)}
                  </span>
                </span>
                <TextoQueCrece
                  id={`${id}-que-cambio`}
                  valor={queCambio}
                  filasMinimas={3}
                  maxLength={LARGOS_DEL_PRESUPUESTO.queCambio}
                  placeholder={m.ejemploDeQueCambio}
                  alCambiar={setQueCambio}
                />
                <span className="text-meta text-text-3">{m.loLeeTuCliente}</span>
              </section>
            )}
          </div>

          <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
            <FilaDeAcciones>
              <Button variant="secundario" onClick={pedirCierre}>
                {m.cancelar}
              </Button>
              <Button
                disabled={problemas.length > 0 || faltaElDolar || !todoGuardado || mandar.isPending}
                onClick={mandarlo}
              >
                <Icono nombre="send" tamano={16} />
                {mandar.isPending ? m.mandando : todoGuardado ? m.mandar : m.guardando}
              </Button>
            </FilaDeAcciones>
          </footer>
        </div>
      )}
    </Hoja>
  );
}

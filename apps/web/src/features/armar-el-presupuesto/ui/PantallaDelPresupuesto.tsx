import {
  huecosDelPresupuesto,
  leerBorrador,
  puedeCambiarEstado,
  textoDeLaGarantia,
  type BorradorDelPresupuesto,
  type CampoQueFalta,
} from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { enlaceActivo, MUTACION_DE_ENLACE } from '@/entities/enlace';
import {
  MUTACION_DEL_BORRADOR,
  presupuestoDelTrabajo,
  revisionesDelPresupuesto,
  type EnvioDelPresupuesto,
} from '@/entities/presupuesto';
import {
  diasQueValeElPresupuesto,
  hijosDelProyecto,
  MUTACION_DE_PROYECTO,
  necesidadesDelProyecto,
  opcionesDelProyecto,
  tareaHecha,
  type Proyecto,
} from '@/entities/proyecto';
import { idiomaDeLosClientes, useReplicaDelTaller } from '@/entities/replica';
import { ElPresupuesto } from '@/entities/vista-cliente';
import { ajustesDe, filaPorId, mensajeDeSincronizacion } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import {
  enlaceDelCliente,
  fechaLarga,
  hashDelToken,
  hoyEnElTaller,
  metaDeAvisos,
  olvidarToken,
  recordarToken,
  rutaDelProyecto,
  tokenDelEnlace,
  tokenNuevo,
  useAlgoEnCurso,
  useAltoVisible,
  useAnchoDePantalla,
  useSenalDeUnaVez,
  useVolver,
  uuidv7,
} from '@/shared/lib';
import { usePdfDelPresupuesto, useTextosDelPdf } from '@/shared/pdf';
import {
  Button,
  ConSalida,
  EstadoDeGuardado,
  FondoDelElegido,
  Icono,
  SeccionesEnFilas,
} from '@/shared/ui';

import {
  abonadoDeHoy,
  borradorGuardado,
  documentoDeHoy,
  formatosDeLaReplica,
  nombreDelCliente,
  plantillaDeLaReplica,
  senaDeHoy,
  senaEsPropia,
} from '../model/documento';
import { envioDelPresupuesto, revisionQueSeManda, valeHastaAlMandar } from '../model/envio';
import { pdfDelBorrador } from '../model/pdf';
import {
  enElOrdenDelDocumento,
  guardadoDeLosValores,
  mismosValores,
  opcionesDelEditor,
  totalDelEditor,
  valoresDelProyecto,
  type ValoresDelEditor,
} from '../model/valores';
import { comoLoVeElCliente } from '../model/vistaPrevia';
import { HojaDeMandar } from './HojaDeMandar';
import {
  CasillasDelBorrador,
  DetalleDelBorrador,
  EncabezadoDelBorrador,
  FormaDePagoDelBorrador,
  GarantiaDelBorrador,
  HerrajesDelBorrador,
  ValoresDelBorrador,
} from './SeccionesDelBorrador';

export const DEMORA_DEL_GUARDADO_MS = 900;

const DEMORA_PARA_IR_AL_CAMPO_MS = 420;

type Pestana = 'armarlo' | 'cliente';

function Pestanas({
  elegida,
  alElegir,
  className = '',
}: {
  elegida: Pestana;
  alElegir: (pestana: Pestana) => void;
  className?: string;
}) {
  const m = useMensajes().armarElPresupuesto.pestanas;
  const pestanas: readonly { id: Pestana; etiqueta: string }[] = [
    { id: 'armarlo', etiqueta: m.armarlo },
    { id: 'cliente', etiqueta: m.comoLoVe },
  ];
  return (
    <div
      role="tablist"
      aria-label={m.queMirar}
      className={`relative grid grid-cols-2 gap-0.5 rounded-pill bg-ink/6 p-1 ${className}`}
    >
      <FondoDelElegido elegido={elegida} />
      {pestanas.map((pestana) => (
        <button
          key={pestana.id}
          type="button"
          role="tab"
          id={`pestana-${pestana.id}`}
          aria-selected={elegida === pestana.id}
          aria-controls={`panel-${pestana.id}`}
          data-opcion={pestana.id}
          onClick={() => {
            alElegir(pestana.id);
          }}
          className={`relative min-h-tap rounded-pill px-3 text-label leading-tight ${
            elegida === pestana.id ? 'font-semibold text-ink' : 'font-medium text-text-2'
          }`}
        >
          {pestana.etiqueta}
        </button>
      ))}
    </div>
  );
}

function EstadoDelBorrador({
  sinGuardar,
  enPausa,
  enVuelo,
  conError,
  guardado,
  guardadoEl,
  hoy,
}: {
  sinGuardar: boolean;
  enPausa: boolean;
  enVuelo: boolean;
  conError: boolean;
  guardado: boolean;
  guardadoEl: string | null;
  hoy: string;
}) {
  const m = useMensajes().armarElPresupuesto.guardado;
  if (sinGuardar || enPausa || enVuelo || conError || guardado) {
    return (
      <EstadoDeGuardado
        sinGuardar={sinGuardar}
        enPausa={enPausa}
        enVuelo={enVuelo}
        conError={conError}
        guardado={guardado}
      />
    );
  }
  return (
    <span role="status" className="flex items-center gap-1.5 text-meta text-text-2">
      <Icono nombre={guardadoEl === null ? 'pencil-line' : 'check'} tamano={13} />
      {guardadoEl === null
        ? m.seGuardaSolo
        : guardadoEl === hoy
          ? m.hoy
          : m.el(fechaLarga(guardadoEl, hoy))}
    </span>
  );
}

function campoDelProblema(campo: CampoQueFalta, borrador: BorradorDelPresupuesto): string {
  if (campo !== 'muebles') return campo;
  const sinDescribir = borrador.muebles.find(({ descripcion }) => descripcion.trim() === '');
  return sinDescribir === undefined ? 'muebles' : `mueble-${sinDescribir.id}`;
}

function irAlCampo(campo: string): void {
  const elemento = document.querySelector<HTMLElement>(`[data-campo="${campo}"]`);
  if (elemento === null) return;
  elemento.scrollIntoView({ block: 'center' });
  elemento.focus({ preventScroll: true });
}

export interface PantallaDelPresupuestoProps {
  proyecto: Proyecto;
}

export function PantallaDelPresupuesto({ proyecto }: PantallaDelPresupuestoProps) {
  const textos = useMensajes().armarElPresupuesto;
  const textosDelPdf = useTextosDelPdf();
  const replica = useReplicaDelTaller();
  const idioma = idiomaDeLosClientes(replica);
  const formatos = formatosDeLaReplica(replica);
  const cerrar = useVolver(rutaDelProyecto(proyecto.id), textos.cerrar, { fija: true });
  const ancho = useAnchoDePantalla();
  const altoVisible = useAltoVisible();
  const hoy = hoyEnElTaller();
  const mandarAlAbrir = useSenalDeUnaVez('mandarElPresupuesto');

  const plantilla = plantillaDeLaReplica(replica);
  const cliente = nombreDelCliente(replica, proyecto);
  const telefono = filaPorId(replica, 'clientes', proyecto.cliente_id)?.telefono ?? '';
  const guardado = presupuestoDelTrabajo(replica, proyecto.id);
  const revisiones = guardado === null ? [] : revisionesDelPresupuesto(replica, guardado.id);
  const revision = revisionQueSeManda(revisiones);
  const numero = guardado?.numero ?? null;
  const abonado = abonadoDeHoy(replica, proyecto.id);
  const senaBp = senaDeHoy(replica, proyecto);
  const diasDeAjustes = diasQueValeElPresupuesto(ajustesDe(replica));
  const herrajesDelTrabajo = necesidadesDelProyecto(replica, proyecto.id)
    .filter((necesidad) => necesidad.tipo === 'herraje')
    .map((necesidad) => necesidad.nombre);

  const [idDelPresupuesto] = useState(() => guardado?.id ?? uuidv7());
  const [borrador, setBorrador] = useState<BorradorDelPresupuesto>(() =>
    borradorGuardado(replica, proyecto, guardado),
  );
  const [valores, setValores] = useState<ValoresDelEditor>(() =>
    valoresDelProyecto(proyecto, opcionesDelProyecto(replica, proyecto.id)),
  );
  const [pestana, setPestana] = useState<Pestana>('armarlo');
  const [mandando, setMandando] = useState(mandarAlAbrir);
  const [borradorSinGuardar, setBorradorSinGuardar] = useState(false);
  const [valoresSinGuardar, setValoresSinGuardar] = useState(false);
  useAlgoEnCurso(borradorSinGuardar || valoresSinGuardar);

  const guardarElBorrador = useMutation({
    ...MUTACION_DEL_BORRADOR,
    meta: metaDeAvisos('borradorDelPresupuesto', { silencioso: true }),
  });
  const guardarLosValores = useMutation({
    ...MUTACION_DE_PROYECTO,
    meta: metaDeAvisos('proyectoGuardado', { silencioso: true, sujeto: proyecto.titulo }),
  });
  const crearElEnlace = useMutation({
    ...MUTACION_DE_ENLACE,
    meta: metaDeAvisos('enlaceDelCliente'),
  });

  const ultimo = useRef({ replica, borrador, valores });
  useEffect(() => {
    ultimo.current = { replica, borrador, valores };
  });
  const relojDelBorrador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const relojDeLosValores = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function mandarElBorrador(contenido: BorradorDelPresupuesto): void {
    clearTimeout(relojDelBorrador.current);
    relojDelBorrador.current = undefined;
    setBorradorSinGuardar(false);
    const previo = presupuestoDelTrabajo(ultimo.current.replica, proyecto.id);
    guardarElBorrador.mutate({
      pedido: {
        id: previo?.id ?? idDelPresupuesto,
        proyectoId: proyecto.id,
        version: previo?.borrador_version ?? 0,
        contenido,
      },
      previo,
      momento: new Date().toISOString(),
    });
  }

  function mandarLosValores(siguientes: ValoresDelEditor): void {
    clearTimeout(relojDeLosValores.current);
    relojDeLosValores.current = undefined;
    setValoresSinGuardar(false);
    const actual = filaPorId(ultimo.current.replica, 'proyectos', proyecto.id);
    if (actual === undefined) return;
    guardarLosValores.mutate(
      guardadoDeLosValores(
        actual,
        opcionesDelProyecto(ultimo.current.replica, proyecto.id),
        siguientes,
      ),
    );
  }

  const guardarAhora = useRef(() => {
    if (relojDelBorrador.current !== undefined) mandarElBorrador(ultimo.current.borrador);
    if (relojDeLosValores.current !== undefined) mandarLosValores(ultimo.current.valores);
  });
  useEffect(() => {
    guardarAhora.current = () => {
      if (relojDelBorrador.current !== undefined) mandarElBorrador(ultimo.current.borrador);
      if (relojDeLosValores.current !== undefined) mandarLosValores(ultimo.current.valores);
    };
  });
  useEffect(
    () => () => {
      guardarAhora.current();
    },
    [],
  );

  function cambiar(siguiente: BorradorDelPresupuesto): void {
    setBorrador(siguiente);
    setBorradorSinGuardar(true);
    clearTimeout(relojDelBorrador.current);
    relojDelBorrador.current = setTimeout(() => {
      mandarElBorrador(siguiente);
    }, DEMORA_DEL_GUARDADO_MS);
  }

  function cambiarLosValores(cambiados: ValoresDelEditor): void {
    const siguientes = enElOrdenDelDocumento(cambiados);
    setValores(siguientes);
    setValoresSinGuardar(true);
    clearTimeout(relojDeLosValores.current);
    relojDeLosValores.current = setTimeout(() => {
      mandarLosValores(siguientes);
    }, DEMORA_DEL_GUARDADO_MS);
  }

  function abrirLaHojaDeMandar(): void {
    guardarAhora.current();
    if (presupuestoDelTrabajo(ultimo.current.replica, proyecto.id) === null) {
      mandarElBorrador(ultimo.current.borrador);
    }
    setMandando(true);
  }

  useEffect(() => {
    if (!mandarAlAbrir) return;
    guardarAhora.current();
  }, [mandarAlAbrir]);

  const huecos = {
    valores: huecosDelPresupuesto(
      {
        plazoDeFabricacion: borrador.plazoDeFabricacion,
        plantilla,
        modificacion: borrador.modificacion,
        abonado,
        monedaDeLoAbonado: 'ARS',
        senaBp,
      },
      formatos,
    ),
    abonado,
  };

  const documento = documentoDeHoy({
    replica,
    proyecto,
    borrador,
    total: totalDelEditor(valores),
    opciones: opcionesDelEditor(valores),
    abonado,
  });

  const pdf = usePdfDelPresupuesto(pdfDelBorrador(documento, numero, revision, idioma), {
    alAbrir: true,
  });

  const borradorEnLaReplica =
    guardado === null ? null : leerBorrador(guardado.contenido, plantilla);
  const todoGuardado =
    !borradorSinGuardar &&
    !valoresSinGuardar &&
    borradorEnLaReplica !== null &&
    JSON.stringify(borradorEnLaReplica) === JSON.stringify(leerBorrador(borrador, plantilla)) &&
    mismosValores(valoresDelProyecto(proyecto, opcionesDelProyecto(replica, proyecto.id)), valores);

  function armarElEnvio(queCambio: string): EnvioDelPresupuesto | null {
    const { replica: deAhora } = ultimo.current;
    const presupuesto = presupuestoDelTrabajo(deAhora, proyecto.id);
    const fila = filaPorId(deAhora, 'proyectos', proyecto.id);
    if (presupuesto === null || fila === undefined) return null;
    return envioDelPresupuesto({
      proyecto: fila,
      proximos: hijosDelProyecto(deAhora, proyecto.id).proximos,
      presupuesto,
      revisiones: revisionesDelPresupuesto(deAhora, presupuesto.id),
      documento,
      idioma,
      queCambio,
      hoy,
      validezDias: borrador.validezDias,
      revisionId: uuidv7(),
      momento: new Date().toISOString(),
    });
  }

  const enlace = enlaceActivo(replica, proyecto.id);
  const tokenConocido =
    enlace === undefined ? undefined : (enlace.token ?? tokenDelEnlace(enlace.id));

  function crearUnEnlace(): string | null {
    const token = tokenNuevo();
    const id = uuidv7();
    recordarToken(id, token);
    void hashDelToken(token).then((tokenHash) => {
      crearElEnlace.mutate(
        {
          nuevo: { id, proyecto_id: proyecto.id, token_hash: tokenHash, token },
          revocar: enlace ?? null,
          momento: new Date().toISOString(),
        },
        {
          onError: () => {
            olvidarToken(id);
          },
        },
      );
    });
    return enlaceDelCliente(token);
  }

  const enCelular = ancho === 'movil';
  const etiquetaDeMandar =
    revision <= 1 ? textos.mandarElPresupuesto : textos.mandarLaRevision(revision);
  const guardadoEl = guardado === null ? null : hoyEnElTaller(new Date(guardado.updated_at));

  return (
    <div
      style={enCelular && altoVisible !== undefined ? { height: altoVisible } : undefined}
      className={
        enCelular
          ? 'fixed inset-x-0 top-0 z-30 flex h-[100dvh] flex-col bg-mesa'
          : 'flex min-h-full flex-col'
      }
    >
      <header className="flex-none border-b border-hairline bg-mesa md:sticky md:top-0 md:z-20">
        <div className="mx-auto grid w-full max-w-content grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-2 px-3 pt-2 pb-3 md:min-h-17 md:px-(--page-pad-tablet) md:py-2.5 lg:px-(--page-pad-desktop)">
          <Button variant="terciario" className="justify-self-start" onClick={cerrar.volver}>
            <Icono nombre="x" tamano={20} />
            {textos.cerrar}
          </Button>
          <div className="flex max-w-[min(26rem,calc(100vw-13rem))] min-w-0 flex-col items-center text-center">
            <h1 className="truncate text-body-lg leading-snug font-semibold">{textos.titulo}</h1>
            <p translate="no" className="max-w-full truncate text-label text-text-2">
              {proyecto.titulo}
              {cliente === '' ? '' : ` · ${cliente}`}
            </p>
          </div>
          <Pestanas
            elegida={pestana}
            alElegir={setPestana}
            className="col-span-3 md:col-span-1 md:w-[23rem] md:justify-self-end"
          />
        </div>
      </header>

      <div
        data-pagina=""
        className={`mx-auto min-h-0 w-full max-w-content flex-1 px-(--page-pad-mobile) py-4 md:px-(--page-pad-tablet) md:py-6 lg:px-(--page-pad-desktop) lg:py-7 ${
          enCelular
            ? 'overflow-y-auto'
            : '[&_:is(input,select,textarea,button)]:scroll-mt-40 [&_:is(input,select,textarea,button)]:scroll-mb-28'
        }`}
      >
        {pestana === 'cliente' ? (
          <section
            id="panel-cliente"
            role="tabpanel"
            aria-labelledby="pestana-cliente"
            className="mx-auto flex max-w-[52rem] flex-col gap-3"
          >
            <p className="px-1 text-label leading-relaxed text-text-2">{textos.asiLoVeria}</p>
            <ElPresupuesto
              presupuesto={comoLoVeElCliente(documento, numero, revision, hoy, abonado, idioma)}
              hoy={hoy}
              hayComoPagar={false}
              borrador
            />
          </section>
        ) : (
          <div id="panel-armarlo" role="tabpanel" aria-labelledby="pestana-armarlo">
            <SeccionesEnFilas>
              <EncabezadoDelBorrador
                borrador={borrador}
                alCambiar={cambiar}
                numero={numero}
                revisionQueSeManda={revision}
                cliente={cliente}
                hoy={hoy}
                diasDeAjustes={diasDeAjustes}
              />
              <DetalleDelBorrador borrador={borrador} alCambiar={cambiar} />
              <HerrajesDelBorrador
                borrador={borrador}
                alCambiar={cambiar}
                deLoQueHaceFalta={herrajesDelTrabajo}
              />
              <CasillasDelBorrador
                borrador={borrador}
                alCambiar={cambiar}
                numero={4}
                grupo="aTenerEnCuenta"
                clausulas={plantilla.aTenerEnCuenta}
                huecos={huecos}
              />
              <CasillasDelBorrador
                borrador={borrador}
                alCambiar={cambiar}
                numero={5}
                grupo="incluye"
                clausulas={plantilla.incluye}
                huecos={huecos}
              />
              <ValoresDelBorrador
                valores={valores}
                alCambiar={cambiarLosValores}
                senaBp={senaBp}
                senaPropia={senaEsPropia(proyecto)}
                abonado={abonado}
              />
              <FormaDePagoDelBorrador
                borrador={borrador}
                alCambiar={cambiar}
                plantilla={plantilla}
                huecos={huecos}
              />
              <CasillasDelBorrador
                borrador={borrador}
                alCambiar={cambiar}
                numero={8}
                grupo="avisos"
                clausulas={plantilla.avisos}
                huecos={huecos}
              />
              <CasillasDelBorrador
                borrador={borrador}
                alCambiar={cambiar}
                numero={9}
                grupo="condiciones"
                clausulas={plantilla.condiciones}
                huecos={huecos}
              />
              <GarantiaDelBorrador
                texto={textoDeLaGarantia(plantilla, formatos)}
                meses={plantilla.garantiaMeses}
              />
            </SeccionesEnFilas>
          </div>
        )}
      </div>

      <footer className="flex-none border-t border-hairline bg-mesa md:sticky md:bottom-0 md:z-20">
        <div className="mx-auto flex w-full max-w-content flex-wrap items-center gap-x-2 gap-y-2 px-(--page-pad-mobile) pt-2 pb-[calc(0.625rem+env(safe-area-inset-bottom))] md:flex-nowrap md:gap-x-3 md:px-(--page-pad-tablet) md:py-3.5 lg:px-(--page-pad-desktop)">
          <div className="min-w-0 basis-full md:flex-1 md:basis-auto">
            <EstadoDelBorrador
              sinGuardar={borradorSinGuardar || valoresSinGuardar}
              enPausa={guardarElBorrador.isPaused || guardarLosValores.isPaused}
              enVuelo={
                (guardarElBorrador.isPending && !guardarElBorrador.isPaused) ||
                (guardarLosValores.isPending && !guardarLosValores.isPaused)
              }
              conError={guardarElBorrador.isError || guardarLosValores.isError}
              guardado={guardarElBorrador.isSuccess || guardarLosValores.isSuccess}
              guardadoEl={guardadoEl}
              hoy={hoy}
            />
            {(guardarElBorrador.isError || guardarLosValores.isError) && (
              <p role="alert" className="mt-1 text-label font-medium text-alerta">
                {mensajeDeSincronizacion(guardarElBorrador.error ?? guardarLosValores.error)}
              </p>
            )}
          </div>
          <Button
            variant="herramienta"
            size="herramienta"
            className="px-3.5 sm:px-4"
            aria-label={textos.verElPdf}
            onClick={pdf.descargar}
          >
            <Icono nombre="file-text" tamano={16} />
            <span className="sm:hidden">
              {pdf.estado === 'preparando' && pdf.esperando === 'descargar' ? '…' : textos.pdf}
            </span>
            <span className="hidden sm:inline">
              {pdf.estado === 'preparando' && pdf.esperando === 'descargar'
                ? textosDelPdf.preparando
                : textos.verElPdf}
            </span>
          </Button>
          <Button
            className="min-w-0 flex-1 md:min-w-[15rem] md:flex-none"
            onClick={abrirLaHojaDeMandar}
          >
            <Icono nombre="send" tamano={16} />
            {etiquetaDeMandar}
          </Button>
        </div>
      </footer>

      <ConSalida valor={mandando}>
        {() => (
          <HojaDeMandar
            revision={revision}
            numero={numero}
            documento={documento}
            hoy={hoy}
            valeHasta={valeHastaAlMandar(hoy, borrador.validezDias)}
            pasaAPresupuestoEnviado={
              proyecto.estado !== 'presupuesto_enviado' &&
              puedeCambiarEstado(proyecto.estado, 'presupuesto_enviado')
            }
            tildaLaTarea={revision <= 1 && !tareaHecha(proyecto, 'presupuesto_pdf')}
            todoGuardado={todoGuardado}
            cliente={cliente}
            trabajo={proyecto.titulo}
            telefono={telefono}
            enlace={{
              url: tokenConocido === undefined ? null : enlaceDelCliente(tokenConocido),
              crear: crearUnEnlace,
            }}
            armarElEnvio={armarElEnvio}
            alIrAlCampo={(campo) => {
              setMandando(false);
              setPestana('armarlo');
              const destino = campoDelProblema(campo, borrador);
              setTimeout(() => {
                irAlCampo(destino);
              }, DEMORA_PARA_IR_AL_CAMPO_MS);
            }}
            alCerrar={() => {
              setMandando(false);
            }}
          />
        )}
      </ConSalida>
    </div>
  );
}

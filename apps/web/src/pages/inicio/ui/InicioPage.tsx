import {
  asientosDelLibro,
  CERO,
  centavos,
  estadoDelDiezmo,
  proyeccionCocos,
  restar,
  type FilaDelMes,
  type Money,
} from '@maun/domain';
import { useMemo, useState } from 'react';

import { vencimientosDeLaReplica } from '@/entities/agenda';
import { avisosDeEntregas } from '@/entities/entrega';
import { filaDelMesDelTaller } from '@/entities/fila';
import {
  fraseDelDiezmo,
  resumenMensual,
  type FraseDelDiezmo,
  type ResumenMensual,
} from '@/entities/movimiento';
import { novedadesDeOpiniones } from '@/entities/opinion';
import { useReplicaDelTaller } from '@/entities/replica';
import {
  corteDelMes,
  entregaDelResumen,
  insumosDeLosTrabajos,
  LiquidacionesSinConfirmar,
} from '@/entities/proyecto';
import { useNombreDeLaPersona, useSesionActiva } from '@/entities/sesion';
import {
  tesoroDeLaClave,
  tesoroPorId,
  tesorosDelTaller,
  tesorosSincronizados,
  tesorosVivos,
} from '@/entities/tesoro';
import { rangoDelFaltante } from '@/features/cubrir-el-faltante';
import {
  ajustesDe,
  datosDelLibro,
  faltaConfigurar,
  filaDelTaller,
  filasDe,
  saldosDeLaReplica,
  sistemaDeLaReplica,
  type FilaDe,
  type Replica,
} from '@/shared/api';
import {
  diaDelMes,
  diasDelMes,
  fechaLarga,
  formatearPesos,
  hoyLocal,
  mesAnterior,
  mesDeLaFecha,
  nombreDelMes,
  relativa,
  RUTA_DE_DIEZMO,
  rutaDelProyecto,
  useAnchoDePantalla,
  Ir,
  useIr,
} from '@/shared/lib';
import { Avatar, ConSalida, Icono, Pagina, PrincipalYApoyo, type NombreDeIcono } from '@/shared/ui';

import { faltaParaLosTopes, faltantesEnInicio } from '../model/la-fila';
import { panoramaDelTaller } from '../model/panorama';
import { conLaMetaDeCocos, tiposEnLasTarjetas } from '../model/tesoros';
import { FaltanteDelMes } from './FaltanteDelMes';
import { HojaDelPerfil } from './HojaDelPerfil';
import { HoyEnLaAgenda } from './HoyEnLaAgenda';
import { LaFilaDelMes } from './LaFilaDelMes';
import { Metas } from './Metas';
import { Panorama } from './Panorama';
import { PortadaDeInicio } from './PortadaDeInicio';
import { RespuestasDeEntrega } from './RespuestasDeEntrega';
import { TarjetasDeLosTesoros } from './TarjetasDeLosTesoros';
import { UltimaOpinion } from './UltimaOpinion';

const DIAS_DE_PROYECCION = 365;

function encabezado(frase: FraseDelDiezmo): string {
  return frase.despues === '' ? frase.antes : `${frase.antes} ${frase.despues}`;
}

function comparacion(valor: Money, previo: Money, mes: string): string {
  if (previo <= 0) return '';
  const variacion = Math.round(((valor - previo) / previo) * 100);
  const signo = variacion >= 0 ? '+' : '−';
  return `${signo}${String(Math.abs(variacion))}% vs. ${nombreDelMes(mesAnterior(mes)).toLowerCase()}`;
}

export interface MensajeDelMes {
  texto: string;
  alerta: boolean;
}

function mensajeDelMes(
  mes: string,
  saldoHogar: Money,
  del: ResumenMensual,
  delMes: FilaDelMes,
): MensajeDelMes {
  const nombre = nombreDelMes(mes).toLowerCase();

  if (saldoHogar < 0) {
    return {
      texto: `El hogar está en negativo: ${formatearPesos(restar(CERO, saldoHogar))}. Los gastos pasaron a lo que entró.`,
      alerta: true,
    };
  }
  if (del.entroHogar === 0 && del.facturoTaller === 0) {
    return { texto: `${nombreDelMes(mes)} todavía no tiene movimiento.`, alerta: true };
  }

  const sueldo = delMes.pasos.find((paso) => paso.clase === 'sueldo');
  if (sueldo === undefined) {
    const falta = faltaParaLosTopes(delMes);
    return falta <= 0
      ? { texto: `Los compromisos y los ahorros de ${nombre} ya están cubiertos.`, alerta: false }
      : {
          texto: `Faltan ${formatearPesos(falta)} para llenar los compromisos y los ahorros de ${nombre}.`,
          alerta: true,
        };
  }
  const faltaDelSueldo = sueldo.falta ?? CERO;
  if (faltaDelSueldo <= 0) {
    return { texto: `El sueldo de ${nombre} ya está cubierto.`, alerta: false };
  }
  if (del.entroHogar === 0) {
    return {
      texto: `El taller facturó ${formatearPesos(del.facturoTaller)} en ${nombre} y al hogar todavía no entró nada: el sueldo se transfiere cuando cobrás un trabajo.`,
      alerta: true,
    };
  }
  return {
    texto: `Faltan ${formatearPesos(faltaDelSueldo)} para cubrir el sueldo de ${nombre}.`,
    alerta: true,
  };
}

function saldoPendiente(replica: Replica, pendientes: readonly FilaDe<'proyectos'>[]): Money {
  const pagos = filasDe(replica, 'pagos');
  let total = 0;
  for (const proyecto of pendientes) {
    const cobrado = pagos
      .filter((pago) => pago.proyecto_id === proyecto.id)
      .reduce((suma, pago) => suma + pago.monto_centavos, 0);
    const falta = (proyecto.presupuesto_centavos ?? 0) - cobrado;
    if (falta > 0) total += falta;
  }
  return centavos(total);
}

function Acceso({
  icono,
  etiqueta,
  titulo,
  valor,
  tono,
  fondo,
  alElegir,
}: {
  icono: NombreDeIcono;
  etiqueta: string;
  titulo: string;
  valor: string;
  tono?: string;
  fondo?: string;
  alElegir: () => void;
}) {
  return (
    <button
      type="button"
      onClick={alElegir}
      className="flex w-full items-center gap-3 border-t border-hairline-soft py-3.5 text-left first:border-t-0 @min-[52rem]/apoyo:gap-4"
    >
      <span
        className={`flex size-9 flex-none items-center justify-center rounded-field ${fondo ?? 'bg-surface'} ${tono ?? ''}`}
      >
        <Icono nombre={icono} tamano={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-meta text-text-2">{etiqueta}</span>
        <span className="block truncate text-body font-medium @min-[52rem]/apoyo:line-clamp-2 @min-[52rem]/apoyo:whitespace-normal">
          {titulo}
        </span>
      </span>
      <span className={`flex-none text-body font-semibold tabular-nums ${tono ?? ''}`}>
        {valor}
      </span>
    </button>
  );
}

function BotonDeLaCuenta({
  abierta,
  sinLeer,
  alAbrir,
}: {
  abierta: boolean;
  sinLeer: number;
  alAbrir: () => void;
}) {
  const { email, foto } = useSesionActiva();
  const nombre = useNombreDeLaPersona();
  const nuevas = sinLeer === 1 ? '1 opinión nueva' : `${String(sinLeer)} opiniones nuevas`;

  return (
    <button
      type="button"
      aria-label={sinLeer > 0 ? `Tu cuenta. ${nuevas}` : 'Tu cuenta'}
      aria-haspopup="dialog"
      aria-expanded={abierta}
      onClick={alAbrir}
      className="relative -mr-1 flex size-tap flex-none items-center justify-center rounded-pill"
    >
      <Avatar
        nombre={nombre.trim() === '' ? email : nombre}
        foto={foto}
        className={abierta ? 'ring-2 ring-ink' : ''}
      />
      {sinLeer > 0 && (
        <span
          aria-hidden
          className="absolute top-1 right-1 size-2.5 rounded-pill border-2 border-paper bg-op-mal"
        />
      )}
    </button>
  );
}

function AccesoALaAgenda() {
  return (
    <Ir
      a="/agenda"
      aria-label="Agenda"
      className="flex size-tap flex-none items-center justify-center rounded-pill border border-hairline bg-paper text-ink hover:bg-ink/5"
    >
      <Icono nombre="calendar-days" tamano={22} />
    </Ir>
  );
}

export function InicioPage() {
  const replica = useReplicaDelTaller();
  const ir = useIr();
  const ancho = useAnchoDePantalla();
  const sesion = useSesionActiva();
  const nombreDeLaPersona = useNombreDeLaPersona();
  const [perfil, setPerfil] = useState(false);

  const hoy = hoyLocal();
  const novedades = useMemo(() => novedadesDeOpiniones(replica, hoy), [replica, hoy]);
  const mes = mesDeLaFecha(hoy);
  const ajustes = ajustesDe(replica);
  const arranque = faltaConfigurar(ajustes);
  const corte = useMemo(() => corteDelMes(replica, mes), [replica, mes]);
  const saldos = saldosDeLaReplica(replica);
  const metaCocos = centavos(ajustes?.meta_cocos_centavos ?? 0);

  const todos = tesorosDelTaller(replica);
  const tesoros = conLaMetaDeCocos(tesorosVivos(todos), metaCocos);
  const tintaDelDiezmo = tesoroDeLaClave(todos, 'diezmo')?.tinta ?? 'diezmo';
  const { fila } = filaDelTaller(replica);
  const delMes = filaDelMesDelTaller(replica, mes, fila);
  const faltantes = faltantesEnInicio(
    delMes,
    todos,
    vencimientosDeLaReplica(replica, rangoDelFaltante(hoy)),
    hoy,
  );
  const libro = datosDelLibro(replica);
  const insumos = insumosDeLosTrabajos(replica);
  const panorama = panoramaDelTaller({
    fila,
    delMes,
    sistema: sistemaDeLaReplica(replica),
    tesoros: todos,
    movimientos: libro.movimientos,
    insumos: insumos.total,
    trabajosConInsumos: insumos.trabajos.length,
  });
  const nombreDelSuperavit = tesoroPorId(todos, fila.superavit)?.nombre ?? 'Maun';

  const asientos = asientosDelLibro(libro);
  const del = resumenMensual(asientos, mes);
  const delPrevio = resumenMensual(asientos, mesAnterior(mes));
  const diezmo = estadoDelDiezmo(asientos);
  const frase = fraseDelDiezmo(diezmo);
  const mensaje = mensajeDelMes(mes, saldos.hogar, del, delMes);

  const proyectos = filasDe(replica, 'proyectos');
  const pendientes = proyectos.filter(
    (proyecto) => proyecto.estado === 'en_curso' || proyecto.estado === 'entregado',
  );
  const proximaEntrega = proyectos
    .filter((proyecto) => proyecto.estado === 'en_curso')
    .flatMap((proyecto) => {
      const { fecha, comprometida } = entregaDelResumen(proyecto);
      return fecha === null ? [] : [{ proyecto, fecha, comprometida }];
    })
    .sort((una, otra) => una.fecha.localeCompare(otra.fecha))[0];
  const respuestasDeEntrega = useMemo(() => avisosDeEntregas(replica), [replica]);

  const irA = (ruta: string) => () => {
    ir(ruta);
  };

  const estadisticas = [
    { etiqueta: 'Entró al hogar', valor: del.entroHogar, previo: delPrevio.entroHogar },
    { etiqueta: 'Gastó el hogar', valor: del.gastoHogar, previo: delPrevio.gastoHogar },
    { etiqueta: 'Facturó el taller', valor: del.facturoTaller, previo: delPrevio.facturoTaller },
  ];

  const conFaltante = !arranque && faltantes.length > 0;

  return (
    <Pagina className="gap-3 md:gap-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-label text-text-2">{fechaLarga(hoy, hoy)}</span>
          <h1 className="font-display text-h1 leading-tight lg:text-h1-lg">Inicio</h1>
        </div>
        {ancho === 'movil' && (
          <div className="flex flex-none items-center gap-2">
            <AccesoALaAgenda />
            <BotonDeLaCuenta
              abierta={perfil}
              sinLeer={novedades.sinLeer}
              alAbrir={() => {
                setPerfil(true);
              }}
            />
          </div>
        )}
      </header>

      <PortadaDeInicio hoy={hoy} corte={corte} arranque={arranque} />

      {!arranque && <Panorama panorama={panorama} nombreDelSuperavit={nombreDelSuperavit} />}

      <TarjetasDeLosTesoros
        tesoros={tesoros}
        diezmo={frase}
        tipos={tiposEnLasTarjetas(fila, tesoros)}
        insumos={insumos.total}
      />

      <FaltanteDelMes
        faltantes={conFaltante ? faltantes : []}
        mes={mes}
        hoy={hoy}
        sePuedeCubrir={tesorosSincronizados(replica)}
      />

      <RespuestasDeEntrega avisos={respuestasDeEntrega} hoy={hoy} />

      {novedades.ultima !== null && <UltimaOpinion ultima={novedades.ultima} />}

      {ancho === 'movil' && <HoyEnLaAgenda replica={replica} hoy={hoy} />}

      <LiquidacionesSinConfirmar replica={replica} />

      {!arranque && (
        <PrincipalYApoyo
          amplio
          separacion="gap-y-3 @min-[40rem]/apoyo:gap-y-4"
          apoyo={
            <div className="flex flex-col gap-3 md:gap-4">
              <section
                aria-label="Accesos"
                className="rounded-panel border border-hairline bg-paper px-4"
              >
                <Acceso
                  icono="truck"
                  etiqueta="Entrega más próxima"
                  titulo={proximaEntrega?.proyecto.titulo ?? 'Sin entregas programadas'}
                  valor={
                    proximaEntrega === undefined
                      ? ''
                      : `${relativa(proximaEntrega.fecha, hoy)}${proximaEntrega.comprometida ? ', comprometida' : ''}`
                  }
                  alElegir={irA(
                    proximaEntrega === undefined
                      ? '/proyectos'
                      : rutaDelProyecto(proximaEntrega.proyecto.id),
                  )}
                />
                <Acceso
                  icono="hand-coins"
                  etiqueta="Pendiente de cobro"
                  titulo={`${String(pendientes.length)} proyectos en curso`}
                  valor={formatearPesos(saldoPendiente(replica, pendientes))}
                  alElegir={irA('/proyectos')}
                />
                <Acceso
                  icono="church"
                  etiqueta="Diezmo"
                  titulo={encabezado(frase)}
                  valor={frase.importe ?? ''}
                  tono="text-diezmo"
                  fondo="bg-diezmo-tint"
                  alElegir={irA(RUTA_DE_DIEZMO)}
                />
              </section>

              <section
                aria-label="Proyección de Cocos"
                className="@container rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
              >
                <div className="flex flex-col gap-2.5 @min-[24rem]:flex-row @min-[24rem]:items-center @min-[24rem]:gap-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-label text-text-2">Cocos en un año</div>
                    <div className="mt-0.5 text-money-lg font-semibold whitespace-nowrap text-cocos tabular-nums">
                      {formatearPesos(
                        proyeccionCocos(
                          saldos.cocos,
                          ajustes?.tasa_cocos_anual_bp ?? 0,
                          DIAS_DE_PROYECCION,
                        ),
                      )}
                    </div>
                    <div className="mt-0.5 text-meta text-text-3">
                      con la tasa que cargaste, sin aportes nuevos
                    </div>
                  </div>
                  <div className="min-w-0 @min-[24rem]:flex-none @min-[24rem]:text-right">
                    <div className="text-meta text-text-2">falta para la meta</div>
                    <div className="text-body font-semibold whitespace-nowrap tabular-nums">
                      {formatearPesos(Math.max(0, metaCocos - saldos.cocos))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          }
        >
          <div className="flex flex-col gap-3 md:gap-4">
            {!conFaltante && (
              <p className="flex items-start gap-2.5 rounded-panel border border-hairline bg-paper px-4 py-4 text-body-lg leading-normal md:px-5">
                <span
                  aria-hidden
                  className={`mt-2 size-2 flex-none rounded-pill ${
                    mensaje.alerta ? 'bg-atencion' : 'bg-hogar'
                  }`}
                />
                <span>{mensaje.texto}</span>
              </p>
            )}

            <LaFilaDelMes delMes={delMes} tesoros={todos} hoy={hoy} />

            <section
              aria-label={nombreDelMes(mes)}
              className="@container rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
            >
              <div className="mb-2.5 flex items-baseline justify-between">
                <span className="text-label font-semibold">{nombreDelMes(mes)}</span>
                <span className="text-meta text-text-2">
                  día {diaDelMes(hoy)} de {diasDelMes(mes)}
                </span>
              </div>
              <dl className="grid grid-cols-1 gap-2 @min-[28rem]:grid-cols-3 @min-[28rem]:gap-3">
                {estadisticas.map((estadistica) => {
                  const vs = comparacion(estadistica.valor, estadistica.previo, mes);
                  return (
                    <div
                      key={estadistica.etiqueta}
                      className="flex min-w-0 items-baseline justify-between gap-3 @min-[28rem]:block"
                    >
                      <dt className="text-meta leading-tight text-text-2">
                        {estadistica.etiqueta}
                      </dt>
                      <dd className="text-right @min-[28rem]:mt-0.5 @min-[28rem]:text-left">
                        <span className="block text-body-lg font-semibold whitespace-nowrap tabular-nums lg:text-money-lg">
                          {formatearPesos(estadistica.valor)}
                        </span>
                        {vs !== '' && (
                          <span className="mt-0.5 block text-badge text-text-3">{vs}</span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>

            <Metas tesoros={tesoros} diezmo={diezmo} tintaDelDiezmo={tintaDelDiezmo} />
          </div>
        </PrincipalYApoyo>
      )}

      <ConSalida valor={perfil}>
        {() => (
          <HojaDelPerfil
            replica={replica}
            hoy={hoy}
            nombre={nombreDeLaPersona.trim()}
            email={sesion.email}
            foto={sesion.foto}
            novedades={novedades}
            alCerrar={() => {
              setPerfil(false);
            }}
          />
        )}
      </ConSalida>
    </Pagina>
  );
}

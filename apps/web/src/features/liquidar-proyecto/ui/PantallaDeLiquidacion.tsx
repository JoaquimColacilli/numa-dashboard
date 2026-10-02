import {
  centavos,
  esAnteriorALaApertura,
  planDeLaLiquidacion,
  type EstadoLiquidado,
} from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { EnlaceACliente } from '@/entities/cliente';
import { CasillaDeLaApertura } from '@/entities/movimiento';
import {
  ajustesDeLaReplica,
  cobroPorLaFila,
  cuantosRepartos,
  datosActualesDelProyecto,
  despieceDelCobro,
  DistribucionDespiece,
  fechaDelCobroPropuesta,
  loQueRecibeCadaTesoro,
  MUTACION_DE_LIQUIDACION,
  MUTACION_DE_PROYECTO,
  pedidoPorLaFila,
  proyectoLiquidadoPorLaFila,
  repartoEnLaAperturaPropuesto,
  repartosLiquidados,
  rutaDelProyecto,
  type MontoDelTesoro,
  type ResumenDeProyecto,
} from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { tesorosSincronizados } from '@/entities/tesoro';
import {
  aperturaDeLaReplica,
  mensajeDeSincronizacion,
  type ProyectoParaGuardar,
} from '@/shared/api';
import { mensajes, useMensajes } from '@/shared/idioma';
import {
  errorDeLaFechaDeLaPlata,
  etiquetaActual,
  formatearPesos,
  hoyEnElTaller,
  mesDeLaFecha,
  mesEnUnaFrase,
  uuidv7,
  Ir,
  useIr,
  useVolver,
} from '@/shared/lib';
import { Button, Campo, Icono, MoneyInput, Pagina } from '@/shared/ui';

function enLista(partes: readonly string[]): string {
  return new Intl.ListFormat(etiquetaActual(), { style: 'long', type: 'conjunction' }).format(
    partes,
  );
}

function ayudaDelDia(destino: EstadoLiquidado, fecha: string): string {
  return mensajes().liquidarProyecto.pantalla[destino].ayudaDelDia(
    mesEnUnaFrase(mesDeLaFecha(fecha)),
    fecha.slice(0, 4),
  );
}

function aCadaTesoro(montos: readonly Pick<MontoDelTesoro, 'monto' | 'nombre'>[]): string {
  const { montoATesoro } = mensajes().liquidarProyecto.pantalla;
  return enLista(montos.map((tesoro) => montoATesoro(formatearPesos(tesoro.monto), tesoro.nombre)));
}

function idsDelCobro(cantidad: number): string[] {
  return Array.from({ length: cantidad }, () => uuidv7());
}

function Trio({ resumen }: { resumen: ResumenDeProyecto }) {
  const textos = useMensajes().liquidarProyecto.pantalla.trio;
  const celdas = [
    {
      clave: textos.presupuesto,
      valor:
        resumen.proyecto.presupuesto_centavos === null ? '—' : formatearPesos(resumen.presupuesto),
      esDato: true,
      tono: '',
    },
    {
      clave: textos.cobrado,
      valor: formatearPesos(resumen.cobrado),
      esDato: true,
      tono: 'text-hogar',
    },
    {
      clave: textos.saldo,
      valor:
        resumen.saldo === null
          ? '—'
          : resumen.saldo > 0
            ? formatearPesos(resumen.saldo)
            : textos.sinSaldo,
      esDato: resumen.saldo === null || resumen.saldo > 0,
      tono:
        resumen.saldo === null ? 'text-text-3' : resumen.saldo > 0 ? 'text-atencion' : 'text-hogar',
    },
  ];

  return (
    <div className="@container">
      <dl className="grid grid-cols-1 rounded-panel border border-hairline bg-paper px-4 @lg:grid-cols-3 @lg:px-0">
        {celdas.map((celda, indice) => (
          <div
            key={celda.clave}
            className={
              indice === 0
                ? 'flex items-baseline justify-between gap-2 py-3 @lg:block @lg:px-4 @lg:py-3.5'
                : 'flex items-baseline justify-between gap-2 border-t border-hairline-soft py-3 @lg:block @lg:border-t-0 @lg:border-l @lg:px-4 @lg:py-3.5'
            }
          >
            <dt className="text-meta text-text-2">{celda.clave}</dt>
            <dd
              translate={celda.esDato ? 'no' : undefined}
              className={`text-money-lg font-semibold tabular-nums whitespace-nowrap ${celda.tono}`}
            >
              {celda.valor}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export interface PantallaDeLiquidacionProps {
  resumen: ResumenDeProyecto;
  destino: EstadoLiquidado;
}

export function PantallaDeLiquidacion({ resumen, destino }: PantallaDeLiquidacionProps) {
  const { pantalla } = useMensajes().liquidarProyecto;
  const replica = useReplicaDelTaller();
  const ir = useIr();
  const { proyecto } = resumen;
  const textos = pantalla[destino];
  const vuelta = useVolver(rutaDelProyecto(proyecto.id), textos.volver, { fija: true });

  const guardar = useMutation(MUTACION_DE_PROYECTO);
  const liquidar = useMutation(MUTACION_DE_LIQUIDACION);

  const hoy = hoyEnElTaller();
  const apertura = aperturaDeLaReplica(replica);

  const faltaCobrar = destino === 'cobrado' && resumen.saldo !== null && resumen.saldo > 0;
  const [conPagoFinal, setConPagoFinal] = useState(faltaCobrar);
  const [monto, setMonto] = useState<number | null>(resumen.saldo);
  const [fechaDelPago, setFechaDelPago] = useState(hoy);
  const [concepto, setConcepto] = useState(pantalla.conceptoDelPagoFinal);
  const [fechaElegida, setFechaElegida] = useState<string | null>(null);
  const [aperturaElegida, setAperturaElegida] = useState<boolean | null>(null);

  const hayPagoFinal = conPagoFinal && faltaCobrar;
  const pagoExtra = centavos(hayPagoFinal ? (monto ?? 0) : 0);
  const errorDelPago = hayPagoFinal ? errorDeLaFechaDeLaPlata(fechaDelPago, hoy) : undefined;

  const fecha =
    fechaElegida ??
    (destino === 'cobrado'
      ? fechaDelCobroPropuesta(replica, proyecto, hoy, hayPagoFinal ? fechaDelPago : null)
      : hoy);
  const errorDelDia = errorDeLaFechaDeLaPlata(fecha, hoy);
  const fechaValida = errorDelDia === undefined ? fecha : hoy;

  const pagoAntes =
    hayPagoFinal && errorDelPago === undefined && esAnteriorALaApertura(fechaDelPago, apertura);
  const repartoAntes = esAnteriorALaApertura(fechaValida, apertura);
  const enLaApertura =
    (pagoAntes || repartoAntes) &&
    (aperturaElegida ??
      (repartoAntes ? repartoEnLaAperturaPropuesto(proyecto, fechaValida, apertura) : true));
  const pagoEnLaApertura = pagoAntes && enLaApertura;
  const repartoEnLaApertura = repartoAntes && enLaApertura;

  const cobro = cobroPorLaFila(replica, proyecto, fechaValida, { destino, pagoExtra });
  const { liquidacion } = cobro;
  const despiece = despieceDelCobro(replica, cobro);
  const ajustes = ajustesDeLaReplica(replica);
  const conTesoros = tesorosSincronizados(replica);

  const enCurso = liquidar.isPending && !liquidar.isPaused;
  const listo = errorDelPago === undefined && errorDelDia === undefined && conTesoros;

  function confirmar(): void {
    if (!listo) return;

    if (pagoExtra > 0) {
      const pedidoDelPago: ProyectoParaGuardar = {
        id: proyecto.id,
        version: proyecto.version,
        datos: datosActualesDelProyecto(proyecto),
        pagos: [
          {
            id: uuidv7(),
            fecha: fechaDelPago,
            concepto: concepto.trim(),
            monto_centavos: pagoExtra,
            ya_en_la_apertura: pagoEnLaApertura,
          },
        ],
        gastos: [],
      };
      guardar.mutate({
        pedido: pedidoDelPago,
        previos: { proyecto, pagos: [], gastos: [], opciones: [], necesidades: [] },
      });
    }

    const ids = idsDelCobro(cuantosRepartos(liquidacion));
    const pedido = pedidoPorLaFila(proyecto, cobro, ids, repartoEnLaApertura);
    const liquidadaEn = new Date().toISOString();
    liquidar.mutate({
      pedido,
      optimista: proyectoLiquidadoPorLaFila(proyecto, cobro, liquidadaEn, repartoEnLaApertura),
      previo: proyecto,
      titulo: proyecto.titulo,
      repartos: repartosLiquidados(replica, proyecto, cobro, pedido, liquidadaEn),
      plan: planDeLaLiquidacion(liquidacion),
    });

    ir(rutaDelProyecto(proyecto.id), { como: 'terminar', senal: 'recienLiquidado' });
  }

  const aRepartir = loQueRecibeCadaTesoro(despiece);
  const superavit = despiece.piezas.find((pieza) => pieza.tipo === 'resto');
  const otrasObligaciones = despiece.piezas.filter(
    (pieza) => pieza.tipo === 'obligacion' && pieza.monto > 0,
  );
  const { sena } = pantalla;
  const loQueRetiene = [
    sena.retenida(formatearPesos(resumen.cobrado)),
    ajustes.perdidoConDiezmo ? sena.diezmo(formatearPesos(liquidacion.diezmo)) : sena.sinDiezmo,
    ...(otrasObligaciones.length > 0
      ? [sena.otrasObligaciones(aCadaTesoro(otrasObligaciones))]
      : []),
    ajustes.perdidoConSueldo ? sena.conSueldo : sena.sinSueldo,
    liquidacion.superavit === null || superavit === undefined
      ? sena.loQueSobraQuedaEnElTaller
      : sena.loQueSobraVaA(superavit.nombre),
  ].join(' ');
  const sinSenaRetenida = [
    sena.sinSenaRetenida,
    ...(resumen.gastos > 0 ? [sena.gastosComoPerdida(formatearPesos(resumen.gastos))] : []),
  ].join(' ');
  const comoSeReparte = [
    ...(despiece.neta > 0
      ? [
          pantalla.seReparteElIngreso(formatearPesos(despiece.neta)),
          ...(aRepartir.length > 0
            ? [pantalla.vanACadaTesoro(aCadaTesoro(aRepartir), aRepartir.length)]
            : []),
          repartoEnLaApertura ? pantalla.quedaEnElLibro : pantalla.seMuevenLosSaldos,
        ]
      : [pantalla.noHayIngreso]),
    textos.siTeEquivocaste,
  ].join(' ');

  return (
    <Pagina className="gap-3 md:gap-4">
      <Ir
        a={rutaDelProyecto(proyecto.id)}
        alTocar={vuelta.volver}
        className="-ml-1 flex min-h-tap w-fit items-center gap-1 rounded-pill pr-3 pl-1 text-body font-medium text-text-2 hover:bg-ink/5"
      >
        <Icono nombre="chevron-left" tamano={20} />
        {textos.volver}
      </Ir>

      <header>
        <p className="text-label text-text-2">
          {resumen.cliente === undefined ? (
            resumen.nombreDelCliente
          ) : (
            <EnlaceACliente id={resumen.cliente.id} nombre={resumen.cliente.nombre} />
          )}
        </p>
        <h1 className="mt-0.5 font-display text-h1 leading-tight lg:text-h1-lg">
          {textos.titulo(proyecto.titulo)}
        </h1>
      </header>

      <Trio resumen={resumen} />

      <div className="flex flex-col gap-5 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5">
        {faltaCobrar && (
          <section aria-label={pantalla.pagoFinal} className="@container">
            <label className="flex min-h-tap items-center gap-2.5 text-body font-medium">
              <input
                type="checkbox"
                checked={conPagoFinal}
                onChange={(evento) => {
                  setConPagoFinal(evento.target.checked);
                }}
                className="size-4 accent-ink"
              />
              {pantalla.registrarElPagoFinalDe(formatearPesos(centavos(resumen.saldo ?? 0)))}
            </label>
            <p className="mt-1 text-meta leading-normal text-text-3">
              {pantalla.ayudaDelPagoFinal}
            </p>

            {conPagoFinal && (
              <div className="mt-3 grid gap-3 @xl:grid-cols-[minmax(0,1fr)_9rem_11.5rem]">
                <Campo
                  etiqueta={pantalla.concepto}
                  value={concepto}
                  onChange={(evento) => {
                    setConcepto(evento.target.value);
                  }}
                />
                <MoneyInput etiqueta={pantalla.monto} value={monto} onChange={setMonto} />
                <Campo
                  etiqueta={pantalla.fechaDelPago}
                  type="date"
                  max={hoy}
                  value={fechaDelPago}
                  error={errorDelPago}
                  onChange={(evento) => {
                    setFechaDelPago(evento.target.value);
                  }}
                />
              </div>
            )}
          </section>
        )}

        <div className="max-w-[32rem]">
          <Campo
            etiqueta={textos.dia}
            type="date"
            max={hoy}
            value={fecha}
            error={errorDelDia}
            ayuda={errorDelDia === undefined ? ayudaDelDia(destino, fecha) : undefined}
            onChange={(evento) => {
              setFechaElegida(evento.target.value);
            }}
          />
          <CasillaDeLaApertura
            className="mt-2"
            fecha={repartoAntes ? fechaValida : fechaDelPago}
            apertura={pagoAntes || repartoAntes ? apertura : null}
            marcada={enLaApertura}
            alCambiar={setAperturaElegida}
          />
        </div>
      </div>

      {destino === 'perdido' && (
        <section
          aria-label={sena.queLePasa}
          className="rounded-panel bg-atencion-tint px-4 py-3.5 text-label leading-relaxed text-atencion"
        >
          <h2 className="font-semibold">{sena.titulo}</h2>
          <p className="mt-1.5 max-w-[48rem]">
            {resumen.cobrado > 0 ? loQueRetiene : sinSenaRetenida}
          </p>
          <p className="mt-1.5 max-w-[48rem]">{sena.sePuedeDeshacer}</p>
        </section>
      )}

      <DistribucionDespiece despiece={despiece} />

      <div>
        <Button
          className="w-full sm:w-auto"
          cargando={enCurso}
          disabled={!listo}
          aria-describedby={conTesoros ? undefined : 'trayendo-los-tesoros'}
          onClick={confirmar}
        >
          <Icono nombre="hand-coins" tamano={18} />
          {despiece.neta > 0 ? textos.verboConMonto(formatearPesos(despiece.neta)) : textos.verbo}
        </Button>

        {!conTesoros && (
          <p
            id="trayendo-los-tesoros"
            className="mt-2 max-w-[520px] text-label font-medium text-atencion"
          >
            {pantalla.trayendoLosTesoros}
          </p>
        )}

        <p className="mt-2 max-w-[520px] text-meta leading-relaxed text-text-3">{comoSeReparte}</p>

        {liquidar.isError && (
          <p role="alert" className="mt-2 max-w-[520px] text-label font-medium text-alerta">
            {mensajeDeSincronizacion(liquidar.error, {
              operacion: destino === 'cobrado' ? 'cobro' : 'cierre',
              sujeto: proyecto.titulo,
              estado: destino,
            })}
          </p>
        )}
      </div>
    </Pagina>
  );
}

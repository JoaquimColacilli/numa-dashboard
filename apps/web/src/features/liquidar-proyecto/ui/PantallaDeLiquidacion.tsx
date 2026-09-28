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
import {
  errorDeLaFechaDeLaPlata,
  formatearPesos,
  hoyEnElTaller,
  mesDeLaFecha,
  nombreDelMes,
  uuidv7,
  Ir,
  useIr,
  useVolver,
} from '@/shared/lib';
import { Button, Campo, Icono, MoneyInput, Pagina } from '@/shared/ui';

const TEXTOS = {
  cobrado: {
    titulo: 'Cobrar',
    verbo: 'Cobrar y repartir',
    volver: 'Volver sin cobrar',
    dia: 'Día del cobro',
  },
  perdido: {
    titulo: 'Dar por perdido',
    verbo: 'Dar por perdido y liquidar la seña',
    volver: 'Volver sin cerrarlo',
    dia: 'Día del cierre',
  },
} as const;

const COMO_LISTA = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' });

function ayudaDelDia(destino: EstadoLiquidado, fecha: string): string {
  const mes = `${nombreDelMes(mesDeLaFecha(fecha)).toLowerCase()} de ${fecha.slice(0, 4)}`;
  return destino === 'cobrado'
    ? `El día en que terminó de entrar la plata. Los topes de la fila se cuentan en ${mes}.`
    : `El día en que la seña pasa a ser del taller. El reparto se cuenta en ${mes}.`;
}

function aCadaTesoro(montos: readonly Pick<MontoDelTesoro, 'monto' | 'nombre'>[]): string {
  return COMO_LISTA.format(
    montos.map((tesoro) => `${formatearPesos(tesoro.monto)} a ${tesoro.nombre}`),
  );
}

function comoSeReparte(montos: readonly MontoDelTesoro[]): string {
  if (montos.length === 0) return '';
  return ` ${montos.length === 1 ? 'Va' : 'Van'} ${aCadaTesoro(montos)}.`;
}

function idsDelCobro(cantidad: number): string[] {
  return Array.from({ length: cantidad }, () => uuidv7());
}

function Trio({ resumen }: { resumen: ResumenDeProyecto }) {
  const celdas = [
    {
      clave: 'Presupuesto',
      valor:
        resumen.proyecto.presupuesto_centavos === null ? '—' : formatearPesos(resumen.presupuesto),
      tono: '',
    },
    { clave: 'Cobrado', valor: formatearPesos(resumen.cobrado), tono: 'text-hogar' },
    {
      clave: 'Saldo',
      valor:
        resumen.saldo === null
          ? '—'
          : resumen.saldo > 0
            ? formatearPesos(resumen.saldo)
            : 'Sin saldo',
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
  const replica = useReplicaDelTaller();
  const ir = useIr();
  const { proyecto } = resumen;
  const textos = TEXTOS[destino];
  const vuelta = useVolver(rutaDelProyecto(proyecto.id), textos.volver, { fija: true });

  const guardar = useMutation(MUTACION_DE_PROYECTO);
  const liquidar = useMutation(MUTACION_DE_LIQUIDACION);

  const hoy = hoyEnElTaller();
  const apertura = aperturaDeLaReplica(replica);

  const faltaCobrar = destino === 'cobrado' && resumen.saldo !== null && resumen.saldo > 0;
  const [conPagoFinal, setConPagoFinal] = useState(faltaCobrar);
  const [monto, setMonto] = useState<number | null>(resumen.saldo);
  const [fechaDelPago, setFechaDelPago] = useState(hoy);
  const [concepto, setConcepto] = useState('Saldo final en la entrega');
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
  const loQueSobra =
    liquidacion.superavit === null || superavit === undefined
      ? 'queda en el taller'
      : `va a ${superavit.nombre}`;
  const otrasObligaciones = despiece.piezas.filter(
    (pieza) => pieza.tipo === 'obligacion' && pieza.monto > 0,
  );

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
          {textos.titulo} «{proyecto.titulo}»
        </h1>
      </header>

      <Trio resumen={resumen} />

      <div className="flex flex-col gap-5 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5">
        {faltaCobrar && (
          <section aria-label="Pago final" className="@container">
            <label className="flex min-h-tap items-center gap-2.5 text-body font-medium">
              <input
                type="checkbox"
                checked={conPagoFinal}
                onChange={(evento) => {
                  setConPagoFinal(evento.target.checked);
                }}
                className="size-4 accent-ink"
              />
              Registrar el pago final de {formatearPesos(centavos(resumen.saldo ?? 0))}
            </label>
            <p className="mt-1 text-meta leading-normal text-text-3">
              Queda cargado como un pago más del proyecto, y entra en la cuenta de abajo. Si el
              cliente te quedó debiendo, destildalo y cobrá lo que entró.
            </p>

            {conPagoFinal && (
              <div className="mt-3 grid gap-3 @xl:grid-cols-[minmax(0,1fr)_9rem_11.5rem]">
                <Campo
                  etiqueta="Concepto"
                  value={concepto}
                  onChange={(evento) => {
                    setConcepto(evento.target.value);
                  }}
                />
                <MoneyInput etiqueta="Monto" value={monto} onChange={setMonto} />
                <Campo
                  etiqueta="Fecha del pago"
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
          aria-label="Qué pasa con la seña"
          className="rounded-panel bg-atencion-tint px-4 py-3.5 text-label leading-relaxed text-atencion"
        >
          <h2 className="font-semibold">
            Esto mueve plata, aunque sea un presupuesto que no salió
          </h2>
          {resumen.cobrado > 0 ? (
            <p className="mt-1.5 max-w-[48rem]">
              Los {formatearPesos(resumen.cobrado)} de seña que retenés dejan de ser un anticipo y
              pasan a ser ingreso del taller.{' '}
              {ajustes.perdidoConDiezmo
                ? `De ahí sale el diezmo: ${formatearPesos(liquidacion.diezmo)}.`
                : 'Esta seña no paga diezmo, según está configurado el taller.'}{' '}
              {otrasObligaciones.length > 0 &&
                `Las demás obligaciones salen igual: ${aCadaTesoro(otrasObligaciones)}. `}
              {ajustes.perdidoConSueldo
                ? 'Y también paga sueldo, según está configurado el taller.'
                : 'No paga sueldo: un presupuesto que no prosperó no es un trabajo.'}{' '}
              Lo demás baja por la fila como en cualquier cobro, y lo que sobra {loQueSobra}.
            </p>
          ) : (
            <p className="mt-1.5 max-w-[48rem]">
              No hay seña retenida, así que no se mueve plata de los tesoros.
              {resumen.gastos > 0
                ? ` Los ${formatearPesos(resumen.gastos)} de gastos que cargaste quedan como pérdida del taller.`
                : ''}
            </p>
          )}
          <p className="mt-1.5 max-w-[48rem]">
            Se puede deshacer: reactivando el presupuesto vuelve a las consultas y la plata se
            descuenta de los tesoros.
          </p>
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
          {textos.verbo}
          {despiece.neta > 0 ? ` ${formatearPesos(despiece.neta)}` : ''}
        </Button>

        {!conTesoros && (
          <p
            id="trayendo-los-tesoros"
            className="mt-2 max-w-[520px] text-label font-medium text-atencion"
          >
            Estamos trayendo los tesoros del taller. Sin ellos el reparto no puede salir: el botón
            se habilita apenas lleguen.
          </p>
        )}

        <p className="mt-2 max-w-[520px] text-meta leading-relaxed text-text-3">
          {despiece.neta > 0 ? (
            <>
              Se reparte el ingreso de este trabajo: {formatearPesos(despiece.neta)} (lo cobrado
              menos los gastos).{comoSeReparte(aRepartir)}{' '}
              {repartoEnLaApertura
                ? 'Queda en el libro con su fecha, pero no mueve los tesoros: ya estaba en tus saldos.'
                : 'Los saldos de los tesoros se mueven con esto.'}
            </>
          ) : (
            <>
              No hay ingreso que repartir: no se mueve ningún tesoro y la pérdida queda anotada en
              la caja del taller.
            </>
          )}{' '}
          {destino === 'cobrado'
            ? 'Si te equivocaste, se reabre desde la ficha y el reparto se deshace.'
            : 'Si te equivocaste, se reactiva desde la ficha y el reparto se deshace.'}
        </p>

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

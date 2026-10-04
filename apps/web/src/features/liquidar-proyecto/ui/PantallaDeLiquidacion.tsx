import {
  centavos,
  conceptoParaGuardar,
  detalleDeLaFactura,
  esAnteriorALaApertura,
  MONEDA_DEL_TALLER,
  nombreDelReceptor,
  planDeLaLiquidacion,
  plata,
  type EstadoLiquidado,
} from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { EnlaceACliente } from '@/entities/cliente';
import {
  clienteDeLaFactura,
  facturacionDelTaller,
  faltasParaFacturar,
  LoQueFaltaParaFacturar,
  MUTACION_DE_LA_FACTURA,
} from '@/entities/factura';
import { CasillaDeLaApertura, rutaParaVenderDolaresA } from '@/entities/movimiento';
import {
  ajustesDeLaReplica,
  CamposDelPago,
  cobroPorLaFila,
  conOtraMoneda,
  cuantosRepartos,
  datosActualesDelProyecto,
  despieceDelCobro,
  DistribucionDespiece,
  dolarDelDiaDelTaller,
  dolarDelDiaParaUnPago,
  erroresDelValorDelPago,
  fechaDelCobroPropuesta,
  importeDelValor,
  importeParaElSaldo,
  loQueRecibeCadaTesoro,
  monedaDeUnPagoNuevo,
  MUTACION_DE_LIQUIDACION,
  MUTACION_DE_PROYECTO,
  pedidoPorLaFila,
  proyectoLiquidadoPorLaFila,
  repartoEnLaAperturaPropuesto,
  repartosLiquidados,
  rutaDelProyecto,
  tesorosQueRecibenDolares,
  type MontoDelTesoro,
  type ResumenDeProyecto,
  type ValorDelPago,
} from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { tesorosSincronizados } from '@/entities/tesoro';
import {
  ajustesDe,
  aperturaDeLaReplica,
  mensajeDeSincronizacion,
  tesorosDeLaReplica,
  valorEnPesosDelPago,
  type ProyectoParaGuardar,
} from '@/shared/api';
import { mensajes, useMensajes } from '@/shared/idioma';
import {
  errorDeLaFechaDeLaPlata,
  etiquetaActual,
  formatearLaPlata,
  formatearPesos,
  hoyEnElTaller,
  mesDeLaFecha,
  mesEnUnaFrase,
  metaDeAvisos,
  uuidv7,
  Ir,
  useIr,
  useVolver,
} from '@/shared/lib';
import { Button, Campo, Icono, Pagina } from '@/shared/ui';

import { dolaresDelTrabajo, maunDespuesDelCobro } from '../model/maun';

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
        resumen.proyecto.presupuesto_centavos === null ? '—' : formatearLaPlata(resumen.precio),
      esDato: true,
      tono: '',
    },
    {
      clave: textos.cobrado,
      valor: formatearLaPlata(resumen.cobradoEnSuMoneda),
      esDato: true,
      tono: 'text-hogar',
    },
    {
      clave: textos.saldo,
      valor:
        resumen.saldo === null
          ? '—'
          : resumen.saldo.importe > 0
            ? formatearLaPlata(resumen.saldo)
            : textos.sinSaldo,
      esDato: resumen.saldo === null || resumen.saldo.importe > 0,
      tono:
        resumen.saldo === null
          ? 'text-text-3'
          : resumen.saldo.importe > 0
            ? 'text-atencion'
            : 'text-hogar',
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
  alEditarElCliente?: ((clienteId: string) => void) | undefined;
}

export function PantallaDeLiquidacion({
  resumen,
  destino,
  alEditarElCliente,
}: PantallaDeLiquidacionProps) {
  const m = useMensajes();
  const { pantalla } = m.liquidarProyecto;
  const conceptos = m.proyecto.conceptosDeSiempre;
  const replica = useReplicaDelTaller();
  const ir = useIr();
  const { proyecto } = resumen;
  const textos = pantalla[destino];
  const vuelta = useVolver(rutaDelProyecto(proyecto.id), textos.volver, { fija: true });
  const clienteQueRecibe = clienteDeLaFactura(resumen.cliente);
  const receptor = nombreDelReceptor(clienteQueRecibe);

  const guardar = useMutation(MUTACION_DE_PROYECTO);
  const liquidar = useMutation(MUTACION_DE_LIQUIDACION);
  const pedirLaFactura = useMutation({
    ...MUTACION_DE_LA_FACTURA,
    meta: metaDeAvisos('facturaPedida', { sujeto: receptor }),
  });
  const [facturar, setFacturar] = useState(true);

  const hoy = hoyEnElTaller();
  const apertura = aperturaDeLaReplica(replica);

  const faltaCobrar = destino === 'cobrado' && resumen.saldo !== null && resumen.saldo.importe > 0;
  const tesorosEnDolares = tesorosQueRecibenDolares(replica);
  const dolarDelDia = dolarDelDiaDelTaller(replica);
  const [conPagoFinal, setConPagoFinal] = useState(faltaCobrar);
  const [pagoFinal, setPagoFinal] = useState<ValorDelPago>(() => {
    const moneda = monedaDeUnPagoNuevo(proyecto, resumen.moneda);
    const cotizacion = dolarDelDiaParaUnPago({ moneda, fecha: hoy }, resumen.moneda, dolarDelDia);
    return conOtraMoneda(
      {
        moneda,
        monto: importeParaElSaldo(resumen.saldo, moneda, cotizacion),
        cotizacion,
        tesoroId: null,
      },
      moneda,
      tesorosEnDolares,
    );
  });
  const [fechaDelPago, setFechaDelPago] = useState(hoy);
  const [concepto, setConcepto] = useState<string>(conceptos.saldoFinal);
  const [fechaElegida, setFechaElegida] = useState<string | null>(null);
  const [aperturaElegida, setAperturaElegida] = useState<boolean | null>(null);

  const hayPagoFinal = conPagoFinal && faltaCobrar;
  const importeDelPagoFinal = hayPagoFinal ? importeDelValor(pagoFinal) : null;
  const pagoExtra =
    importeDelPagoFinal === null ? centavos(0) : valorEnPesosDelPago(importeDelPagoFinal);
  const erroresDelPagoFinal = hayPagoFinal
    ? erroresDelValorDelPago(pagoFinal, resumen.moneda, tesorosEnDolares)
    : {};
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

  const ajustesDelTaller = ajustesDe(replica);
  const ofreceFacturar =
    hayPagoFinal &&
    facturacionDelTaller(ajustesDelTaller).conectado &&
    pagoFinal.moneda === MONEDA_DEL_TALLER &&
    resumen.moneda === MONEDA_DEL_TALLER;
  const faltasDeLaFactura = ofreceFacturar
    ? faltasParaFacturar({
        ajustes: ajustesDelTaller,
        proyecto,
        cliente: clienteQueRecibe,
        pago: { moneda: pagoFinal.moneda, borrado: false, yaEnLaApertura: pagoEnLaApertura },
        cobrado: centavos(resumen.cobradoEnSuMoneda.importe + (pagoFinal.monto ?? 0)),
      })
    : [];
  const facturaElPagoFinal = ofreceFacturar && facturar && faltasDeLaFactura.length === 0;

  const cobro = cobroPorLaFila(replica, proyecto, fechaValida, { destino, pagoExtra });
  const { liquidacion } = cobro;
  const despiece = despieceDelCobro(replica, cobro);
  const ajustes = ajustesDeLaReplica(replica);
  const conTesoros = tesorosSincronizados(replica);

  const enCurso = liquidar.isPending && !liquidar.isPaused;
  const listo =
    errorDelPago === undefined &&
    errorDelDia === undefined &&
    erroresDelPagoFinal.cotizacion === undefined &&
    erroresDelPagoFinal.tesoro === undefined &&
    conTesoros;

  const entraAMaun =
    hayPagoFinal && !pagoEnLaApertura && pagoFinal.moneda === MONEDA_DEL_TALLER
      ? (pagoFinal.monto ?? 0)
      : 0;
  const maunDespues = maunDespuesDelCobro(replica, despiece, entraAMaun);
  const dolares = dolaresDelTrabajo(resumen.enDolares, hayPagoFinal ? pagoFinal : null);
  const nombresDeLosTesoros = new Map(tesorosEnDolares.map((tesoro) => [tesoro.id, tesoro.nombre]));
  const nombreDeMaun =
    tesorosDeLaReplica(replica).find((tesoro) => tesoro.id === maunDespues.maun)?.nombre ?? '';
  const maunEnNegativo =
    destino === 'cobrado' && !repartoEnLaApertura && maunDespues.saldo < 0 && dolares.length > 0;

  function confirmar(): void {
    if (!listo) return;

    const idDelPago = uuidv7();
    const conceptoDelPago = conceptoParaGuardar(concepto, conceptos);
    const conPago = pagoExtra > 0 && importeDelPagoFinal !== null;
    if (conPago) {
      const pedidoDelPago: ProyectoParaGuardar = {
        id: proyecto.id,
        version: proyecto.version,
        datos: datosActualesDelProyecto(proyecto),
        pagos: [
          {
            id: idDelPago,
            fecha: fechaDelPago,
            concepto: conceptoDelPago,
            monto_centavos: importeDelPagoFinal.monto,
            ya_en_la_apertura: pagoEnLaApertura,
            moneda: pagoFinal.moneda,
            cotizacion_centavos: pagoFinal.cotizacion,
            tesoro_id: pagoFinal.moneda === MONEDA_DEL_TALLER ? null : pagoFinal.tesoroId,
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

    if (conPago && facturaElPagoFinal) {
      pedirLaFactura.mutate({
        pedido: {
          id: uuidv7(),
          pagoId: idDelPago,
          detalle: detalleDeLaFactura(conceptoDelPago, proyecto.titulo),
        },
        proyectoId: proyecto.id,
      });
    }

    ir(rutaDelProyecto(proyecto.id), { como: 'terminar', senal: 'recienLiquidado' });
  }

  const aRepartir = loQueRecibeCadaTesoro(despiece);
  const superavit = despiece.piezas.find((pieza) => pieza.tipo === 'resto');
  const otrasObligaciones = despiece.piezas.filter(
    (pieza) => pieza.tipo === 'obligacion' && pieza.monto > 0,
  );
  const { sena } = pantalla;
  const loQueRetiene = [
    sena.retenida(formatearPesos(resumen.cobradoEnPesos)),
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
            <span translate="no">{resumen.nombreDelCliente}</span>
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
              {pantalla.registrarElPagoFinalDe(
                formatearLaPlata(resumen.saldo ?? plata(resumen.moneda, 0)),
              )}
            </label>
            <p className="mt-1 text-meta leading-normal text-text-3">
              {pantalla.ayudaDelPagoFinal}
            </p>

            {conPagoFinal && (
              <div className="mt-3 grid gap-3 @xl:grid-cols-[minmax(0,1fr)_11.5rem]">
                <Campo
                  etiqueta={pantalla.concepto}
                  value={concepto}
                  onChange={(evento) => {
                    setConcepto(evento.target.value);
                  }}
                />
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
                <div className="@xl:col-span-2">
                  <CamposDelPago
                    etiqueta={pantalla.monto}
                    valor={pagoFinal}
                    alCambiar={setPagoFinal}
                    monedaDelTrabajo={resumen.moneda}
                    tesorosEnDolares={tesorosEnDolares}
                    dolarDelDia={dolarDelDiaParaUnPago(
                      { moneda: pagoFinal.moneda, fecha: fechaDelPago },
                      resumen.moneda,
                      dolarDelDia,
                    )}
                    errores={erroresDelPagoFinal}
                  />
                </div>
              </div>
            )}

            {ofreceFacturar && (
              <div className="mt-3 flex flex-col gap-1.5 border-t border-hairline-soft pt-3">
                <label className="flex min-h-tap items-start gap-2.5 text-body">
                  <input
                    type="checkbox"
                    checked={facturaElPagoFinal}
                    disabled={faltasDeLaFactura.length > 0}
                    onChange={(evento) => {
                      setFacturar(evento.target.checked);
                    }}
                    className="mt-1 size-4 flex-none accent-ink"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">{m.facturacion.cobro.facturarElPagoFinal}</span>
                    {faltasDeLaFactura.length === 0 && (
                      <span className="text-meta leading-normal text-text-3">
                        {m.facturacion.cobro.aNombreDe(
                          receptor,
                          m.cliente.condiciones[
                            clienteQueRecibe.condicion
                          ].etiqueta.toLocaleLowerCase(etiquetaActual()),
                        )}
                      </span>
                    )}
                  </span>
                </label>
                {faltasDeLaFactura.length > 0 && (
                  <div className="pl-6.5">
                    <LoQueFaltaParaFacturar
                      faltas={faltasDeLaFactura}
                      cliente={{ id: resumen.cliente?.id ?? null, nombre: receptor }}
                      alEditarElCliente={alEditarElCliente}
                      soloLaPrimera
                    />
                  </div>
                )}
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
            {resumen.cobradoEnPesos > 0 ? loQueRetiene : sinSenaRetenida}
          </p>
          <p className="mt-1.5 max-w-[48rem]">{sena.sePuedeDeshacer}</p>
        </section>
      )}

      {maunEnNegativo && (
        <div className="flex flex-col items-start gap-2 rounded-panel bg-atencion-tint px-4 py-3.5 text-label leading-relaxed text-atencion">
          <p className="max-w-[48rem]">
            {pantalla.maunEnNegativo(
              nombreDeMaun,
              formatearPesos(maunDespues.saldo),
              enLista(
                dolares.map((uno) =>
                  pantalla.entreComillas(nombresDeLosTesoros.get(uno.tesoroId) ?? ''),
                ),
              ),
            )}
          </p>
          {dolares[0] !== undefined && (
            <Ir
              a={rutaParaVenderDolaresA(dolares[0].tesoroId, maunDespues.maun, dolares[0].monto)}
              className="flex min-h-tap items-center gap-1.5 rounded-pill border border-atencion px-3.5 font-semibold"
            >
              <Icono nombre="arrow-left-right" tamano={16} />
              {pantalla.venderDolares}
            </Ir>
          )}
        </div>
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

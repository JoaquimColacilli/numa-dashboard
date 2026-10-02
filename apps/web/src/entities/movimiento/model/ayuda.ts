import {
  CERO,
  centavos,
  plata,
  restar,
  sumar,
  type Money,
  type Plata,
  type SaldosPorTesoro,
} from '@maun/domain';

import { mensajes } from '@/shared/idioma';
import { formatearLaPlata, formatearPesos } from '@/shared/lib';

import type { ClaseDeCambio, ClaseDeMovimiento } from './clases';

export interface LadoDeLaAyuda {
  nombre: string;
  saldo: Plata;
}

export interface ContextoDeAyuda {
  saldos: SaldosPorTesoro;
  metaCocos: Money;
  monto: number;
  montoDestino?: number;
  lados?: { desde: LadoDeLaAyuda; hacia: LadoDeLaAyuda };
  tesoro?: LadoDeLaAyuda;
}

type DecirComoQueda = (saldo: string) => string;

function movida(saldo: Plata, cuanto: number): Plata {
  return plata(saldo.moneda, saldo.importe + cuanto);
}

function comoQueda(saldo: Money, queda: DecirComoQueda, enNegativo: DecirComoQueda): string {
  return saldo < 0 ? enNegativo(formatearPesos(saldo)) : queda(formatearPesos(saldo));
}

function comoQuedaElLado(lado: LadoDeLaAyuda, cuanto: number): string {
  const { ayuda } = mensajes().movimiento;
  const queda = movida(lado.saldo, cuanto);
  const decir = queda.importe < 0 ? ayuda.quedaEnNegativo : ayuda.queda;
  return decir(lado.nombre, formatearLaPlata(queda));
}

function despuesDelPago(saldo: Money): string {
  const { ayuda } = mensajes().movimiento;
  if (saldo > 0) return ayuda.teVanAQuedarPorPagar(formatearPesos(saldo));
  if (saldo < 0) return ayuda.tePasas(formatearPesos(restar(CERO, saldo)));
  return ayuda.quedasAlDia;
}

function entreTesoros(monto: number, lados: ContextoDeAyuda['lados']): string {
  const { ayuda } = mensajes().movimiento;
  if (!lados) return ayuda.entreTesorosSinElegir;
  const { desde, hacia } = lados;
  const quedaDesde = movida(desde.saldo, -monto);
  const decir = quedaDesde.importe < 0 ? ayuda.quedanConElPrimeroEnNegativo : ayuda.quedan;
  return `${ayuda.entreTesoros(desde.nombre, hacia.nombre)} ${decir(
    desde.nombre,
    formatearLaPlata(quedaDesde),
    hacia.nombre,
    formatearLaPlata(movida(hacia.saldo, monto)),
  )}`;
}

function delCambio(clase: ClaseDeCambio, contexto: ContextoDeAyuda): string {
  const { ayuda } = mensajes().movimiento;
  const presentacion = clase === 'compra_de_dolares' ? ayuda.compra : ayuda.venta;
  const { lados } = contexto;
  if (!lados) return presentacion;
  const quedaDesde = movida(lados.desde.saldo, -contexto.monto);
  const quedaHacia = movida(lados.hacia.saldo, contexto.montoDestino ?? 0);
  const decir = quedaDesde.importe < 0 ? ayuda.quedanConElPrimeroEnNegativo : ayuda.quedan;
  return `${presentacion} ${decir(
    lados.desde.nombre,
    formatearLaPlata(quedaDesde),
    lados.hacia.nombre,
    formatearLaPlata(quedaHacia),
  )}`;
}

function delIngresoEnDolares(contexto: ContextoDeAyuda): string {
  const { ayuda } = mensajes().movimiento;
  const { tesoro } = contexto;
  if (tesoro === undefined) return ayuda.ingresoEnDolares;
  return `${ayuda.entraA(tesoro.nombre)} ${comoQuedaElLado(tesoro, contexto.monto)}`;
}

function delGastoDeUnTesoro(contexto: ContextoDeAyuda): string {
  const { ayuda } = mensajes().movimiento;
  const { tesoro } = contexto;
  if (tesoro === undefined) return ayuda.gastoTesoroSinElegir;
  return `${ayuda.gastoTesoro(tesoro.nombre)} ${comoQuedaElLado(tesoro, -contexto.monto)}`;
}

export function ayudaDelMovimiento(clase: ClaseDeMovimiento, contexto: ContextoDeAyuda): string {
  const { ayuda } = mensajes().movimiento;
  const { saldos, metaCocos } = contexto;
  const monto = centavos(contexto.monto);
  const delHogar = (saldo: Money) =>
    comoQueda(saldo, ayuda.elHogarQueda, ayuda.elHogarQuedaEnNegativo);
  const delTaller = (saldo: Money) =>
    comoQueda(saldo, ayuda.elTallerQueda, ayuda.elTallerQuedaEnNegativo);

  switch (clase) {
    case 'ingreso_hogar':
      return `${ayuda.ingresoHogar} ${delHogar(sumar(saldos.hogar, monto))}`;
    case 'ingreso_maun':
      return `${ayuda.ingresoMaun} ${delTaller(sumar(saldos.maun, monto))}`;
    case 'gasto_hogar':
      return `${ayuda.gastoHogar} ${delHogar(restar(saldos.hogar, monto))}`;
    case 'gasto_maun':
      return `${ayuda.gastoMaun} ${delTaller(restar(saldos.maun, monto))}`;
    case 'pago_diezmo':
      return `${ayuda.pagoDiezmo} ${despuesDelPago(restar(saldos.diezmo, monto))}`;
    case 'aporte_cocos':
      return `${ayuda.aporteCocos} ${ayuda.cocosQuedaDeLaMeta(
        formatearPesos(sumar(saldos.cocos, monto)),
        formatearPesos(metaCocos),
      )}`;
    case 'retiro_cocos':
      return `${ayuda.retiroCocos} ${ayuda.cocosQueda(formatearPesos(restar(saldos.cocos, monto)))}`;
    case 'gasto_cocos':
      return `${ayuda.gastoCocos} ${comoQueda(
        restar(saldos.cocos, monto),
        ayuda.cocosQueda,
        ayuda.cocosQuedaEnNegativo,
      )}`;
    case 'gasto_tesoro':
      return delGastoDeUnTesoro(contexto);
    case 'entre_tesoros':
      return entreTesoros(monto, contexto.lados);
    case 'compra_de_dolares':
    case 'venta_de_dolares':
      return delCambio(clase, contexto);
    case 'ingreso_en_dolares':
      return delIngresoEnDolares(contexto);
  }
}

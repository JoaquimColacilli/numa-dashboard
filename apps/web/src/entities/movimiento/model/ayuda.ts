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

function movida(saldo: Plata, cuanto: number): Plata {
  return plata(saldo.moneda, saldo.importe + cuanto);
}

function comoQueda(saldo: Money, nombre: string): string {
  return saldo < 0
    ? `${nombre} queda en ${formatearPesos(saldo)}, o sea en negativo`
    : `${nombre} queda en ${formatearPesos(saldo)}`;
}

function comoQuedaElLado(saldo: Plata, nombre: string): string {
  return saldo.importe < 0
    ? `${nombre} queda en ${formatearLaPlata(saldo)}, o sea en negativo`
    : `${nombre} queda en ${formatearLaPlata(saldo)}`;
}

function despuesDelPago(saldo: Money): string {
  if (saldo > 0) return `Después de este pago te van a quedar ${formatearPesos(saldo)} por pagar`;
  if (saldo < 0) return `Con este pago te pasás ${formatearPesos(restar(CERO, saldo))}`;
  return 'Con este pago quedás al día';
}

function entreTesoros(monto: number, lados: ContextoDeAyuda['lados']): string {
  if (!lados) return 'Pasa de un tesoro a otro: la plata no se va, cambia de bolsillo.';
  const { desde, hacia } = lados;
  return `Pasa de ${desde.nombre} a ${hacia.nombre}: la plata no se va, cambia de bolsillo. ${comoQuedaElLado(movida(desde.saldo, -monto), desde.nombre)}, y ${hacia.nombre} en ${formatearLaPlata(movida(hacia.saldo, monto))}.`;
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
  const queda = movida(tesoro.saldo, contexto.monto);
  const decir = queda.importe < 0 ? ayuda.quedaEnNegativo : ayuda.queda;
  return `${ayuda.entraA(tesoro.nombre)} ${decir(tesoro.nombre, formatearLaPlata(queda))}`;
}

export function ayudaDelMovimiento(clase: ClaseDeMovimiento, contexto: ContextoDeAyuda): string {
  const { saldos, metaCocos } = contexto;
  const monto = centavos(contexto.monto);

  switch (clase) {
    case 'ingreso_hogar':
      return `Entra al hogar y no pasa por el taller ni por el diezmo. ${comoQueda(sumar(saldos.hogar, monto), 'El hogar')}.`;
    case 'ingreso_maun':
      return `Entra a la caja del taller. Esto es para un cobro suelto: lo que viene de un trabajo cargado se anota en el trabajo, así queda atado a su reparto. ${comoQueda(sumar(saldos.maun, monto), 'El taller')}.`;
    case 'gasto_hogar':
      return `Sale del hogar. ${comoQueda(restar(saldos.hogar, monto), 'El hogar')}.`;
    case 'gasto_maun':
      return `Sale de la caja del taller. Si es de un mueble puntual conviene cargarlo como gasto del trabajo, así se descuenta del ingreso de ese trabajo. ${comoQueda(restar(saldos.maun, monto), 'El taller')}.`;
    case 'pago_diezmo':
      return `Sale de lo que el diezmo tiene apartado. ${despuesDelPago(restar(saldos.diezmo, monto))}.`;
    case 'aporte_cocos':
      return `Pasa de la caja del taller al fondo de Cocos. Cocos queda en ${formatearPesos(sumar(saldos.cocos, monto))} de la meta de ${formatearPesos(metaCocos)}.`;
    case 'retiro_cocos':
      return `Sale de Cocos y vuelve a la caja del taller: no se va del taller, cambia de bolsillo. Cocos queda en ${formatearPesos(restar(saldos.cocos, monto))}.`;
    case 'gasto_cocos':
      return `Sale de Cocos y se va. ${comoQueda(restar(saldos.cocos, monto), 'Cocos')}.`;
    case 'gasto_tesoro':
      return contexto.tesoro === undefined
        ? 'Sale del tesoro que elijas y se va.'
        : `Sale de ${contexto.tesoro.nombre} y se va. ${comoQuedaElLado(movida(contexto.tesoro.saldo, -contexto.monto), contexto.tesoro.nombre)}.`;
    case 'entre_tesoros':
      return entreTesoros(monto, contexto.lados);
    case 'compra_de_dolares':
    case 'venta_de_dolares':
      return delCambio(clase, contexto);
    case 'ingreso_en_dolares':
      return delIngresoEnDolares(contexto);
  }
}

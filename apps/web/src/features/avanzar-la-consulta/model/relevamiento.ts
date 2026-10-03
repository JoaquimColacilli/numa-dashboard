import {
  esAnteriorALaApertura,
  MONEDA_DEL_TALLER,
  vencimientoDelPresupuesto,
  type Moneda,
} from '@maun/domain';

import type {
  ErroresDelPago,
  Proyecto,
  TesoroQueRecibeDolares,
  ValorDelPago,
} from '@/entities/proyecto';
import type { CambiosDeProyecto, PagoParaGuardar } from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import { fechaDelEnlace } from '@/shared/lib';

import { conceptoDeLaSena } from './contacto';
import {
  clavesDelPago,
  erroresDelPago,
  pagoNuevo,
  SIN_DOLARES,
  type ParaLosPagos,
} from './pagoDeLaConsulta';

export interface ValoresDelRelevamiento {
  dia: string;
  vencimiento: string;
  vencimientoAMano: boolean;
  pago: number | null;
  monedaDelPago: Moneda;
  cotizacionDelPago: number | null;
  tesoroDelPago: string | null;
  pagoEnLaApertura: boolean;
}

export function valoresDelRelevamiento(
  proyecto: Proyecto,
  hoy: string,
  para: ParaLosPagos = SIN_DOLARES,
): ValoresDelRelevamiento {
  const visita = proyecto.fecha_visita;
  const dia = visita !== null && visita <= hoy ? visita : hoy;
  const pago = pagoNuevo(proyecto, dia, para);
  return {
    dia,
    vencimiento: vencimientoDelPresupuesto(dia),
    vencimientoAMano: false,
    pago: null,
    monedaDelPago: pago.moneda,
    cotizacionDelPago: pago.cotizacion,
    tesoroDelPago: pago.tesoroId,
    pagoEnLaApertura: true,
  };
}

export function valorDelPagoDeLaVisita(valores: ValoresDelRelevamiento): ValorDelPago {
  return {
    moneda: valores.monedaDelPago,
    monto: valores.pago,
    cotizacion: valores.cotizacionDelPago,
    tesoroId: valores.tesoroDelPago,
  };
}

export function conElPagoDeLaVisita(
  valores: ValoresDelRelevamiento,
  valor: ValorDelPago,
): ValoresDelRelevamiento {
  return {
    ...valores,
    pago: valor.monto,
    monedaDelPago: valor.moneda,
    cotizacionDelPago: valor.cotizacion,
    tesoroDelPago: valor.tesoroId,
  };
}

export function conOtroDia(
  valores: ValoresDelRelevamiento,
  dia: string,
  hoy: string,
): ValoresDelRelevamiento {
  const fecha = fechaDelEnlace(dia);
  if (valores.vencimientoAMano || fecha === undefined || fecha > hoy) return { ...valores, dia };
  return { ...valores, dia, vencimiento: vencimientoDelPresupuesto(fecha) };
}

export function conOtroVencimiento(
  valores: ValoresDelRelevamiento,
  vencimiento: string,
): ValoresDelRelevamiento {
  return { ...valores, vencimiento, vencimientoAMano: true };
}

export function errorDelDia(valores: ValoresDelRelevamiento, hoy: string): string | undefined {
  const fecha = fechaDelEnlace(valores.dia);
  const { errores } = mensajes().avanzarLaConsulta.paso;
  if (fecha === undefined) return errores.sinDia;
  if (fecha > hoy) return errores.diaQueNoLlego;
  return undefined;
}

export function erroresDelPagoDeLaVisita(
  valores: ValoresDelRelevamiento,
  delTrabajo: Moneda,
  tesorosEnDolares: readonly TesoroQueRecibeDolares[],
): ErroresDelPago {
  return erroresDelPago(valorDelPagoDeLaVisita(valores), delTrabajo, tesorosEnDolares);
}

function pagoDeLaVisita(
  valor: ValorDelPago,
  id: string,
  fecha: string,
  yaEnLaApertura: boolean,
  delTrabajo: Moneda,
): PagoParaGuardar[] {
  if (valor.monto === null || valor.monto <= 0) return [];
  return [
    {
      id,
      fecha,
      concepto: conceptoDeLaSena(),
      monto_centavos: valor.monto,
      ya_en_la_apertura: yaEnLaApertura,
      ...clavesDelPago(valor, delTrabajo),
    },
  ];
}

export interface PasoDelRelevamiento {
  cambios: CambiosDeProyecto;
  pagos: PagoParaGuardar[];
}

export function pasoDelRelevamiento(
  valores: ValoresDelRelevamiento,
  idDelPago: string,
  apertura: string | null = null,
  delTrabajo: Moneda = MONEDA_DEL_TALLER,
): PasoDelRelevamiento {
  return {
    cambios: {
      estado: 'a_presupuestar',
      fecha_visita: valores.dia,
      visita_hecha: true,
      vencimiento_presupuesto: fechaDelEnlace(valores.vencimiento) ?? null,
    },
    pagos: pagoDeLaVisita(
      valorDelPagoDeLaVisita(valores),
      idDelPago,
      valores.dia,
      valores.pagoEnLaApertura && esAnteriorALaApertura(valores.dia, apertura),
      delTrabajo,
    ),
  };
}

export function cambiosAlPasarAPresupuestar(proyecto: Proyecto, hoy: string): CambiosDeProyecto {
  const visita = proyecto.fecha_visita;
  if (visita === null || visita > hoy) return { estado: 'a_presupuestar' };
  return { estado: 'a_presupuestar', visita_hecha: true };
}

export function pagoAntesDePresupuestar(
  pago: ValorDelPago,
  idDelPago: string,
  dia: string,
  yaEnLaApertura = false,
  delTrabajo: Moneda = MONEDA_DEL_TALLER,
): PagoParaGuardar[] {
  return pagoDeLaVisita(pago, idDelPago, dia, yaEnLaApertura, delTrabajo);
}

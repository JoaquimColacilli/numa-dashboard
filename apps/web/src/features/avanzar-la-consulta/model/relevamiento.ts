import { esAnteriorALaApertura, vencimientoDelPresupuesto } from '@maun/domain';

import type { Proyecto } from '@/entities/proyecto';
import type { CambiosDeProyecto, PagoParaGuardar } from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import { fechaDelEnlace } from '@/shared/lib';

import { conceptoDeLaSena } from './contacto';

export interface ValoresDelRelevamiento {
  dia: string;
  vencimiento: string;
  vencimientoAMano: boolean;
  pago: number | null;
  pagoEnLaApertura: boolean;
}

export function valoresDelRelevamiento(proyecto: Proyecto, hoy: string): ValoresDelRelevamiento {
  const visita = proyecto.fecha_visita;
  const dia = visita !== null && visita <= hoy ? visita : hoy;
  return {
    dia,
    vencimiento: vencimientoDelPresupuesto(dia),
    vencimientoAMano: false,
    pago: null,
    pagoEnLaApertura: true,
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

function pagoDeLaVisita(
  monto: number | null,
  id: string,
  fecha: string,
  yaEnLaApertura: boolean,
): PagoParaGuardar[] {
  if (monto === null || monto <= 0) return [];
  return [
    {
      id,
      fecha,
      concepto: conceptoDeLaSena(),
      monto_centavos: monto,
      ya_en_la_apertura: yaEnLaApertura,
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
): PasoDelRelevamiento {
  return {
    cambios: {
      estado: 'a_presupuestar',
      fecha_visita: valores.dia,
      visita_hecha: true,
      vencimiento_presupuesto: fechaDelEnlace(valores.vencimiento) ?? null,
    },
    pagos: pagoDeLaVisita(
      valores.pago,
      idDelPago,
      valores.dia,
      valores.pagoEnLaApertura && esAnteriorALaApertura(valores.dia, apertura),
    ),
  };
}

export function cambiosAlPasarAPresupuestar(proyecto: Proyecto, hoy: string): CambiosDeProyecto {
  const visita = proyecto.fecha_visita;
  if (visita === null || visita > hoy) return { estado: 'a_presupuestar' };
  return { estado: 'a_presupuestar', visita_hecha: true };
}

export function pagoAntesDePresupuestar(
  monto: number | null,
  idDelPago: string,
  dia: string,
  yaEnLaApertura = false,
): PagoParaGuardar[] {
  return pagoDeLaVisita(monto, idDelPago, dia, yaEnLaApertura);
}

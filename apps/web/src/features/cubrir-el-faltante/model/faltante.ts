import {
  sumarDias,
  type FilaDelMes,
  type ModoDePaso,
  type Money,
  type RangoDeLaAgenda,
  type VencimientoDeLaAgenda,
} from '@maun/domain';

import { mensajes } from '@/shared/idioma';
import { formatearPesos, mesEnUnaFrase } from '@/shared/lib';

export const DIAS_QUE_MIRA_EL_FALTANTE = 7;

export interface FaltanteDelCompromiso {
  tesoro: string;
  modo: ModoDePaso;
  falta: Money;
  vence: VencimientoDeLaAgenda | null;
}

export function rangoDelFaltante(hoy: string): RangoDeLaAgenda {
  return { desde: hoy, hasta: sumarDias(hoy, DIAS_QUE_MIRA_EL_FALTANTE) };
}

function primerVencimiento(
  vencimientos: readonly VencimientoDeLaAgenda[],
  tesoro: string,
  rango: RangoDeLaAgenda,
): VencimientoDeLaAgenda | null {
  const proximos = vencimientos
    .filter(
      (vencimiento) =>
        vencimiento.tesoro === tesoro &&
        !vencimiento.pagado &&
        vencimiento.fecha >= rango.desde &&
        vencimiento.fecha <= rango.hasta,
    )
    .sort((uno, otro) => uno.fecha.localeCompare(otro.fecha));
  return proximos[0] ?? null;
}

export function faltantesDeLosCompromisos(
  delMes: FilaDelMes,
  vencimientos: readonly VencimientoDeLaAgenda[],
  hoy: string,
): FaltanteDelCompromiso[] {
  const rango = rangoDelFaltante(hoy);
  const faltantes: FaltanteDelCompromiso[] = [];
  for (const paso of delMes.pasos) {
    if (paso.clase !== 'fijos' || paso.falta === null || paso.falta <= 0) continue;
    faltantes.push({
      tesoro: paso.tesoro,
      modo: paso.modo,
      falta: paso.falta,
      vence: primerVencimiento(vencimientos, paso.tesoro, rango),
    });
  }
  return faltantes;
}

export interface FaltanteEnPalabras {
  nombre: string;
  modo: ModoDePaso;
  falta: Money;
  vence: Pick<VencimientoDeLaAgenda, 'renglon' | 'fecha'> | null;
}

export function fraseDelFaltante(faltante: FaltanteEnPalabras, mes: string): string {
  const textos = mensajes().cubrirElFaltante;
  const falta = formatearPesos(faltante.falta);
  if (faltante.vence !== null) {
    const dia = Number(faltante.vence.fecha.slice(8, 10));
    return textos.vence(faltante.vence.renglon, dia, falta);
  }
  if (faltante.modo === 'saldo') return textos.faltanParaElSaldo(falta, faltante.nombre);
  return textos.faltanParaElMes(falta, faltante.nombre, mesEnUnaFrase(mes));
}

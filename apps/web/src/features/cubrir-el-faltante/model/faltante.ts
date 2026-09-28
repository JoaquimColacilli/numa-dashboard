import {
  sumarDias,
  type FilaDelMes,
  type ModoDePaso,
  type Money,
  type RangoDeLaAgenda,
  type VencimientoDeLaAgenda,
} from '@maun/domain';

import { formatearPesos, nombreDelMes } from '@/shared/lib';

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

const EXCEPCIONES_MASCULINAS: ReadonlySet<string> = new Set([
  'gas',
  'mes',
  'agua',
  'dia',
  'mapa',
  'sistema',
  'tema',
  'programa',
  'clima',
]);

function sinTildes(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function articuloDe(palabra: string): string {
  const base = sinTildes(palabra.toLowerCase());
  if (EXCEPCIONES_MASCULINAS.has(base)) return 'el';
  if (/(ion|dad|tad|tud)es$/.test(base) || base.endsWith('as')) return 'las';
  if (base.endsWith('os') || base.endsWith('es')) return 'los';
  if (/(a|ion|dad|tad|tud|z)$/.test(base)) return 'la';
  return 'el';
}

export function conArticulo(nombre: string): string {
  const limpio = nombre.trim();
  const [primera = ''] = limpio.split(/\s+/);
  const segunda = limpio.charAt(1);
  const enMinuscula =
    segunda !== '' && segunda !== segunda.toLowerCase()
      ? limpio
      : `${limpio.charAt(0).toLowerCase()}${limpio.slice(1)}`;
  return `${articuloDe(primera)} ${enMinuscula}`;
}

export interface FaltanteEnPalabras {
  nombre: string;
  modo: ModoDePaso;
  falta: Money;
  vence: Pick<VencimientoDeLaAgenda, 'renglon' | 'fecha'> | null;
}

export function fraseDelFaltante(faltante: FaltanteEnPalabras, mes: string): string {
  const falta = formatearPesos(faltante.falta);
  if (faltante.vence !== null) {
    const dia = Number(faltante.vence.fecha.slice(8, 10));
    return `Vence ${conArticulo(faltante.vence.renglon)} el ${String(dia)} y faltan ${falta}.`;
  }
  if (faltante.modo === 'saldo') return `Faltan ${falta} para ${faltante.nombre}.`;
  return `Faltan ${falta} para ${faltante.nombre} de ${nombreDelMes(mes).toLowerCase()}.`;
}

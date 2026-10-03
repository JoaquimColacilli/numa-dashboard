import { ETIQUETAS_DE_IDIOMA, type Idioma } from '@maun/domain';

import { idiomaActual } from './idioma';

const FORMATOS = new Map<Idioma, Intl.NumberFormat>();

function formato(idioma: Idioma): Intl.NumberFormat {
  let hallado = FORMATOS.get(idioma);
  if (hallado === undefined) {
    hallado = new Intl.NumberFormat(ETIQUETAS_DE_IDIOMA[idioma], { maximumFractionDigits: 2 });
    FORMATOS.set(idioma, hallado);
  }
  return hallado;
}

const MAXIMO_BP = 100_000;

export const SENA_MAXIMA_BP = 10_000;

export function formatearPorcentaje(bp: number, idioma: Idioma = idiomaActual()): string {
  return formato(idioma).format(bp / 100);
}

export function parsearPorcentaje(texto: string, maximo: number = MAXIMO_BP): number | undefined {
  const limpio = texto.replace(/[%\s]/g, '').replace(',', '.');
  if (limpio === '' || !/^\d+(\.\d{1,2})?$/.test(limpio)) return undefined;

  const bp = Math.round(Number(limpio) * 100);
  if (!Number.isFinite(bp) || bp < 0 || bp > maximo) return undefined;
  return bp;
}

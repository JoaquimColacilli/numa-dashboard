import {
  ETIQUETAS_DE_IDIOMA,
  MONEDA_DEL_TALLER,
  totalesPorMoneda,
  type Idioma,
  type Moneda,
  type Plata,
} from '@maun/domain';

import { idiomaActual } from './idioma';

export interface AdornosDelCampo {
  antes: string;
  despues: string;
}

export interface SeparadoresDelCampo {
  miles: string;
  decimal: string;
  abrenLosDecimales: readonly string[];
}

const FORMATOS = new Map<string, Intl.NumberFormat>();

function formato(idioma: Idioma, moneda: Moneda, conCentavos: boolean): Intl.NumberFormat {
  const clave = `${idioma}|${moneda}|${String(conCentavos)}`;
  const hallado = FORMATOS.get(clave);
  if (hallado !== undefined) return hallado;
  const nuevo = new Intl.NumberFormat(ETIQUETAS_DE_IDIOMA[idioma], {
    style: 'currency',
    currency: moneda,
    ...(conCentavos ? { minimumFractionDigits: 2 } : { maximumFractionDigits: 0 }),
  });
  FORMATOS.set(clave, nuevo);
  return nuevo;
}

function marca(moneda: Moneda, simbolo: string): string {
  return moneda === 'USD' && simbolo === '$' ? 'US$' : simbolo;
}

function comoDecimal(centavos: number): `${number}` {
  const absoluto = Math.abs(centavos);
  const enteros = Math.trunc(absoluto / 100);
  const resto = String(absoluto % 100).padStart(2, '0');
  return `${centavos < 0 ? '-' : ''}${String(enteros)}.${resto}` as `${number}`;
}

function partes(centavos: number, moneda: Moneda, idioma: Idioma): Intl.NumberFormatPart[] {
  return formato(idioma, moneda, centavos % 100 !== 0).formatToParts(comoDecimal(centavos));
}

export function formatearPlata(
  centavos: number,
  moneda: Moneda,
  idioma: Idioma = idiomaActual(),
): string {
  return partes(centavos, moneda, idioma)
    .map((parte) => (parte.type === 'currency' ? marca(moneda, parte.value) : parte.value))
    .join('');
}

export function formatearPesos(centavos: number): string {
  return formatearPlata(centavos, MONEDA_DEL_TALLER);
}

export function formatearLaPlata(una: Plata, idioma: Idioma = idiomaActual()): string {
  return formatearPlata(una.importe, una.moneda, idioma);
}

export function porMoneda(platas: Iterable<Plata>): Plata[] {
  return totalesPorMoneda(platas)
    .map(({ total }) => total)
    .filter((total) => total.importe !== 0);
}

export function formatearPorMoneda(
  platas: Iterable<Plata>,
  idioma: Idioma = idiomaActual(),
): string {
  const totales = porMoneda(platas);
  if (totales.length === 0) return formatearPlata(0, MONEDA_DEL_TALLER, idioma);
  return totales.map((total) => formatearLaPlata(total, idioma)).join(' · ');
}

export function adornosDelCampo(moneda: Moneda, idioma: Idioma = idiomaActual()): AdornosDelCampo {
  const piezas = formato(idioma, moneda, true).formatToParts(1);
  const primera = piezas.findIndex((parte) => parte.type === 'integer');
  const ultima = piezas.findLastIndex(
    (parte) => parte.type === 'integer' || parte.type === 'fraction',
  );
  const unir = (desde: number, hasta: number) =>
    piezas
      .slice(desde, hasta)
      .map((parte) => (parte.type === 'currency' ? marca(moneda, parte.value) : parte.value))
      .join('')
      .trim();
  return { antes: unir(0, primera), despues: unir(ultima + 1, piezas.length) };
}

export function marcadorDelCampo(moneda: Moneda, idioma: Idioma = idiomaActual()): string {
  const { antes, despues } = adornosDelCampo(moneda, idioma);
  return [antes, '0', despues].filter((parte) => parte !== '').join(' ');
}

export function separadoresDelCampo(idioma: Idioma = idiomaActual()): SeparadoresDelCampo {
  return idioma === 'en'
    ? { miles: ',', decimal: '.', abrenLosDecimales: ['.'] }
    : { miles: '.', decimal: ',', abrenLosDecimales: [',', '.'] };
}

import { isValidElement, type ReactNode } from 'react';

const ACENTOS: Readonly<Record<string, string>> = {
  a: 'á',
  b: 'ƀ',
  c: 'ç',
  d: 'ð',
  e: 'é',
  f: 'ƒ',
  g: 'ĝ',
  h: 'ĥ',
  i: 'î',
  j: 'ĵ',
  k: 'ķ',
  l: 'ļ',
  m: 'ɱ',
  n: 'ñ',
  o: 'ö',
  p: 'þ',
  q: 'ǫ',
  r: 'ŕ',
  s: 'š',
  t: 'ţ',
  u: 'û',
  v: 'ṽ',
  w: 'ŵ',
  x: 'ẋ',
  y: 'ý',
  z: 'ž',
  A: 'Å',
  B: 'Ɓ',
  C: 'Ç',
  D: 'Đ',
  E: 'É',
  F: 'Ƒ',
  G: 'Ĝ',
  H: 'Ĥ',
  I: 'Î',
  J: 'Ĵ',
  K: 'Ķ',
  L: 'Ļ',
  M: 'Ṁ',
  N: 'Ñ',
  O: 'Ö',
  P: 'Þ',
  Q: 'Ǫ',
  R: 'Ŕ',
  S: 'Š',
  T: 'Ţ',
  U: 'Û',
  V: 'Ṽ',
  W: 'Ŵ',
  X: 'Ẋ',
  Y: 'Ý',
  Z: 'Ž',
};

export const ABRE_EL_SEUDOIDIOMA = '⟦';
export const CIERRA_EL_SEUDOIDIOMA = '⟧';

export function seudoTexto(texto: string): string {
  const acentuado = Array.from(texto, (letra) => ACENTOS[letra] ?? letra).join('');
  const relleno = '~'.repeat(Math.max(2, Math.ceil(texto.length * 0.4)));
  return `${ABRE_EL_SEUDOIDIOMA}${acentuado}${relleno}${CIERRA_EL_SEUDOIDIOMA}`;
}

function envolver(resultado: unknown): unknown {
  if (typeof resultado === 'string') return seudoTexto(resultado);
  if (!isValidElement(resultado) && typeof resultado !== 'object') return resultado;
  return (
    <span data-seudo="">
      {ABRE_EL_SEUDOIDIOMA}
      {resultado as ReactNode}
      {CIERRA_EL_SEUDOIDIOMA}
    </span>
  );
}

function transformar(valor: unknown): unknown {
  if (typeof valor === 'string') return seudoTexto(valor);
  if (typeof valor === 'function') {
    const original = valor as (...argumentos: unknown[]) => unknown;
    return (...argumentos: unknown[]) => envolver(original(...argumentos));
  }
  if (Array.isArray(valor)) return valor.map(transformar);
  if (typeof valor === 'object' && valor !== null) {
    return Object.fromEntries(
      Object.entries(valor).map(([clave, adentro]) => [clave, transformar(adentro)]),
    );
  }
  return valor;
}

export function seudoCatalogo<T>(mensajes: T): T {
  return transformar(mensajes) as T;
}

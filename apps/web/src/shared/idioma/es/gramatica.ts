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

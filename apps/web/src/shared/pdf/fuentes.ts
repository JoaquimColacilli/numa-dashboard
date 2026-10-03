import type { Idioma } from '@maun/domain';
import { syllables as enIngles } from '@react-pdf/hyphenate/en-us';
import { syllables as enCastellano } from '@react-pdf/hyphenate/es';
import { syllables as enPortugues } from '@react-pdf/hyphenate/pt';
import { Font } from '@react-pdf/renderer';

export const FAMILIA_SANS = 'IBM Plex Sans';

export const FAMILIA_SERIF = 'Young Serif';

const SILABAS: Readonly<Record<Idioma, (palabra: string) => string[]>> = {
  es: enCastellano,
  en: enIngles,
  'pt-BR': enPortugues,
};

export function partirEnSilabas(idioma: Idioma): (palabra: string) => string[] {
  const silabas = SILABAS[idioma];
  return (palabra) => (/^[^\p{L}\p{N}]*\p{Lu}/u.test(palabra) ? [palabra] : silabas(palabra));
}

export function partirEnElIdioma(idioma: Idioma): void {
  Font.registerHyphenationCallback(partirEnSilabas(idioma));
}

export interface ArchivosDeLasFuentes {
  plex400: string;
  plex600: string;
  youngSerif: string;
}

export function registrarLasFuentes({ plex400, plex600, youngSerif }: ArchivosDeLasFuentes): void {
  Font.register({
    family: FAMILIA_SANS,
    fonts: [
      { src: plex400, fontWeight: 400 },
      { src: plex600, fontWeight: 600 },
    ],
  });
  Font.register({ family: FAMILIA_SERIF, src: youngSerif });
}

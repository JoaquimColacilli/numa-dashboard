import { syllables } from '@react-pdf/hyphenate/es';
import { Font } from '@react-pdf/renderer';

export const FAMILIA_SANS = 'IBM Plex Sans';

export const FAMILIA_SERIF = 'Young Serif';

export function partirEnSilabas(palabra: string): string[] {
  return /^[^\p{L}\p{N}]*\p{Lu}/u.test(palabra) ? [palabra] : syllables(palabra);
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
  Font.registerHyphenationCallback(partirEnSilabas);
}

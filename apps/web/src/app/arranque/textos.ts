import { useIdiomaQueSeVe } from '@/shared/idioma';
import { seudoCatalogo } from '@/shared/lib';

import { TEXTOS_DEL_ARRANQUE, type QueDiceElArranque } from './esqueleto';

export function useTextosDelArranque(): Readonly<Record<QueDiceElArranque, string>> {
  const { idioma, seudo } = useIdiomaQueSeVe();
  const textos = TEXTOS_DEL_ARRANQUE[idioma];
  return seudo ? seudoCatalogo(textos) : textos;
}

import { fechaConAnio } from '@/shared/lib';

import type { Mensajes } from '../es';

export const verNovedades = {
  titulo: 'Novidades do app',
  cerrar: 'Fechar as novidades',
  verLasNovedades: 'Ver as novidades',
  sinFecha: 'Versão sem data',
  version: (fecha, vez) =>
    `Versão de ${fechaConAnio(fecha, 'pt-BR')}${vez > 1 ? ` (${String(vez)})` : ''}`,
} satisfies Mensajes['verNovedades'];

import type { Mensajes } from '../es';

import { plural } from './plural';

export const enlace = {
  vecesQueLoAbrio: (veces) =>
    plural(veces, {
      '=0': 'Ainda não foi aberto',
      one: 'Foi aberto uma vez',
      other: 'Foi aberto # vezes',
    }),
} satisfies Mensajes['enlace'];

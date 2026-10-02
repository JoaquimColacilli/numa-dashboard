import type { Mensajes } from '../es';

import { plural } from './plural';

export const enlace = {
  vecesQueLoAbrio: (veces) =>
    plural(veces, { '=0': 'Not opened yet', one: 'Opened once', other: 'Opened # times' }),
} satisfies Mensajes['enlace'];

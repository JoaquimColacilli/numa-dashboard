import type { MensajesDelCliente } from '../es';
import { plural } from './plural';

export const documento = {
  modificaciones: (cantidad) =>
    plural(cantidad, { one: '# modification', other: '# modifications' }),
  meses: (cantidad) => plural(cantidad, { one: '# month', other: '# months' }),
  lema: 'Custom furniture',
  leyendaDeArca: {
    aclarar: true,
    aclaracion: 'Not valid as an invoice.',
  },
} satisfies MensajesDelCliente['documento'];

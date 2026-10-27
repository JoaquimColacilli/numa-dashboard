import type { MensajesDelCliente } from '../es';
import { plural } from './plural';

export const documento = {
  modificaciones: (cantidad) =>
    plural(cantidad, { one: '# modification', other: '# modifications' }),
  meses: (cantidad) => plural(cantidad, { one: '# month', other: '# months' }),
  senaAcordada: (porcentaje, monto) =>
    monto === null ? `of ${porcentaje} of the option you choose` : `of ${porcentaje} (${monto})`,
  lema: 'Custom furniture',
  leyendaDeArca: {
    aclarar: true,
    aclaracion: 'Not valid as an invoice.',
  },
} satisfies MensajesDelCliente['documento'];

import type { MensajesDelCliente } from '../es';
import { plural } from './plural';

export const documento = {
  modificaciones: (cantidad) =>
    plural(cantidad, {
      '=0': '0 modificações',
      one: '# modificação',
      other: '# modificações',
    }),
  meses: (cantidad) => plural(cantidad, { one: '# mês', other: '# meses' }),
  lema: 'Móveis sob medida',
  leyendaDeArca: {
    aclarar: true,
    aclaracion: 'Não é válido como nota fiscal.',
  },
} satisfies MensajesDelCliente['documento'];

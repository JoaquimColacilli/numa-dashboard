import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'vistaCliente.loQueVeConElDiaAceptado': {
    llamar: (m) => m.vistaCliente.loQueVeConElDiaAceptado('«BOTÓN»', '«TITULAR»'),
    tieneQueDecir: ['«BOTÓN»', '«TITULAR»'],
  },
  'vistaCliente.ayuda.lamina': {
    llamar: (m) => m.vistaCliente.ayuda.lamina(7, 9),
    tieneQueDecir: ['7', '9'],
  },
};

import type { Mensajes } from '../es';

export const leerLasOpiniones = {
  yaNoEsta: 'This answer is no longer here',
  yaNoEstaDetalle:
    "The job may have been deleted somewhere else. Everyone else's answers are still in Results.",
  unCliente: 'A client',
  contestoEl: (dia) => `Answered on ${dia}`,
  abrirElTrabajo: 'Open the job',
  escribirle: 'Send a message',
} satisfies Mensajes['leerLasOpiniones'];

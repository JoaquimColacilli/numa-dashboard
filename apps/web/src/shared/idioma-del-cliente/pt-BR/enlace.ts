import type { MensajesDelCliente } from '../es';

export const enlace = {
  descripcionDeLaVista:
    'Acompanhe o andamento do seu móvel: em que etapa está, o que você já pagou e o que falta.',
  descripcionDeLaEncuesta:
    'Conte para a gente como foi o projeto. Leva só alguns minutos, e quem lê é o dono da marcenaria.',
  encuestaDe: (taller) => `Pesquisa de satisfação de ${taller}`,
  unaEncuestaDelTaller: 'Uma pesquisa de satisfação da marcenaria',
} satisfies MensajesDelCliente['enlace'];

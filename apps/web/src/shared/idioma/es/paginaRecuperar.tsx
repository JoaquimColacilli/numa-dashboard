import type { Envoltorio } from '@/shared/lib';

export const paginaRecuperar = {
  revisaTuCorreo: 'Revisá tu correo',
  elEnlaceTeLleva: 'El enlace te lleva a poner una contraseña nueva.',
  pocosMailsPorHora:
    'El servidor de mails manda pocos por hora. Si pediste varios seguidos, esperá un rato antes de volver a intentar.',
  recuperaElAcceso: 'Recuperá el acceso',
  teMandamosUnEnlace: 'Te mandamos un enlace para poner una contraseña nueva.',
  teAcordaste: ({ Enlace }: { Enlace: Envoltorio }) => (
    <>
      ¿Te acordaste? <Enlace>Entrá</Enlace>
    </>
  ),
} as const;

import type { Mensajes } from '../es';

export const paginaRecuperar = {
  revisaTuCorreo: 'Check your email',
  elEnlaceTeLleva: 'The link takes you to set a new password.',
  pocosMailsPorHora:
    'The email server only sends a few per hour. If you asked for several in a row, wait a while before trying again.',
  recuperaElAcceso: 'Get back in',
  teMandamosUnEnlace: "We'll send you a link to set a new password.",
  teAcordaste: ({ Enlace }) => (
    <>
      Remembered it? <Enlace>Log in</Enlace>
    </>
  ),
} satisfies Mensajes['paginaRecuperar'];

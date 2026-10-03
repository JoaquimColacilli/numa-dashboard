import type { Mensajes } from '../es';

export const paginaCrearCuenta = {
  revisaTuCorreo: 'Check your email',
  faltaUnPaso: 'One more step: confirm the email is yours.',
  pocosMailsPorHora:
    'The email server only sends a few per hour. If you asked for several in a row, wait a while before trying again.',
  creaTuCuenta: 'Create your account',
  confirmasElMail:
    'Confirm your email and your shop is created automatically, empty and ready for you to fill in.',
  unaVezAdentro: "Once you're in, the app works even without a connection.",
  yaTenesCuenta: ({ Enlace }) => (
    <>
      Already have an account? <Enlace>Log in</Enlace>
    </>
  ),
} satisfies Mensajes['paginaCrearCuenta'];

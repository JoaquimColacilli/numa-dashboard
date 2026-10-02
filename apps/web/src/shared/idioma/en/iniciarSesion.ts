import type { Mensajes } from '../es';

export const iniciarSesion = {
  sinSenalParaEntrar:
    "You can't log in offline: your account is checked against the server. Once you're in, the app works even without a connection.",
  teMandamosElEnlaceDeNuevo: ({ email }) => `We sent the link to ${email} again.`,
  mandandolo: 'Sending…',
  mandarmeElEnlaceDeNuevo: 'Send me the link again',
  escribiUnMailValido: 'Enter a valid email.',
  escribiTuContrasena: 'Enter your password.',
  email: 'Email',
  ejemploDeMail: 'you@yourshop.com',
  contrasena: 'Password',
  entrando: 'Logging in…',
  entrar: 'Log in',
} satisfies Mensajes['iniciarSesion'];

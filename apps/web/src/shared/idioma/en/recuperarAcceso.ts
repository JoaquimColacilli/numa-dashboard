import type { Mensajes } from '../es';
import { plural } from './plural';

export const recuperarAcceso = {
  siHayUnaCuenta:
    "If there's an account with that email, you'll get a link to set a new password. Open it on this same device. If it hasn't arrived in a few minutes, check your spam folder.",
  contrasenaCorta: ({ minimo }) =>
    plural(minimo, {
      one: 'Your password needs at least # character.',
      other: 'Your password needs at least # characters.',
    }),
  contrasenaNueva: 'New password',
  alMenos: ({ minimo }) =>
    plural(minimo, {
      one: 'At least # character. Tap the eye to see what you typed.',
      other: 'At least # characters. Tap the eye to see what you typed.',
    }),
  guardando: 'Saving…',
  guardarLaContrasena: 'Save password',
  escribiUnMailValido: 'Enter a valid email.',
  email: 'Email',
  ejemploDeMail: 'you@yourshop.com',
  mandandoElEnlace: 'Sending link…',
  mandarmeElEnlace: 'Send me the link',
} satisfies Mensajes['recuperarAcceso'];

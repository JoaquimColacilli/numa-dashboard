import type { Mensajes } from '../es';
import { plural } from './plural';

export const crearCuenta = {
  abriElEnlace:
    "Open the link on this same device: confirming creates your shop and logs you in. If it hasn't arrived in a few minutes, check your spam folder.",
  escribiUnMailValido: "Enter a valid email: that's where the confirmation link goes.",
  contrasenaCorta: ({ minimo }) =>
    plural(minimo, {
      one: 'Your password needs at least # character.',
      other: 'Your password needs at least # characters.',
    }),
  email: 'Email',
  ejemploDeMail: 'you@yourshop.com',
  contrasena: 'Password',
  alMenos: ({ minimo }) =>
    plural(minimo, {
      one: 'At least # character. Tap the eye to see what you typed.',
      other: 'At least # characters. Tap the eye to see what you typed.',
    }),
  creandoLaCuenta: 'Creating your account…',
  crearLaCuenta: 'Create account',
} satisfies Mensajes['crearCuenta'];

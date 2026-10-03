export const recuperarAcceso = {
  siHayUnaCuenta:
    'Si hay una cuenta con ese mail, te llega un enlace para poner una contraseña nueva. Abrilo desde este mismo dispositivo. Si en unos minutos no llegó, fijate en el correo no deseado.',
  contrasenaCorta: ({ minimo }: { minimo: number }) =>
    `La contraseña tiene que tener al menos ${String(minimo)} caracteres.`,
  contrasenaNueva: 'Contraseña nueva',
  alMenos: ({ minimo }: { minimo: number }) =>
    `Al menos ${String(minimo)} caracteres. Con el ojo ves lo que escribiste.`,
  guardando: 'Guardando…',
  guardarLaContrasena: 'Guardar la contraseña',
  escribiUnMailValido: 'Escribí un mail válido.',
  email: 'Email',
  ejemploDeMail: 'vos@taller.com.ar',
  mandandoElEnlace: 'Mandando el enlace…',
  mandarmeElEnlace: 'Mandarme el enlace',
} as const;

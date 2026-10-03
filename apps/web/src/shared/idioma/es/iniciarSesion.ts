export const iniciarSesion = {
  sinSenalParaEntrar:
    'Sin señal no se puede entrar: la cuenta se verifica contra el servidor. Una vez adentro, la app anda aunque no haya señal.',
  teMandamosElEnlaceDeNuevo: ({ email }: { email: string }) =>
    `Te mandamos el enlace de nuevo a ${email}.`,
  mandandolo: 'Mandándolo…',
  mandarmeElEnlaceDeNuevo: 'Mandarme el enlace de nuevo',
  escribiUnMailValido: 'Escribí un mail válido.',
  escribiTuContrasena: 'Escribí tu contraseña.',
  email: 'Email',
  ejemploDeMail: 'vos@taller.com.ar',
  contrasena: 'Contraseña',
  entrando: 'Entrando…',
  entrar: 'Entrar',
} as const;

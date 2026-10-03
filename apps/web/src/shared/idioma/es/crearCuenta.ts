export const crearCuenta = {
  abriElEnlace:
    'Abrí el enlace desde este mismo dispositivo: al confirmar se crea tu taller y entrás. Si en unos minutos no llegó, fijate en el correo no deseado.',
  escribiUnMailValido: 'Escribí un mail válido: ahí te llega el enlace de confirmación.',
  contrasenaCorta: ({ minimo }: { minimo: number }) =>
    `La contraseña tiene que tener al menos ${String(minimo)} caracteres.`,
  email: 'Email',
  ejemploDeMail: 'vos@taller.com.ar',
  contrasena: 'Contraseña',
  alMenos: ({ minimo }: { minimo: number }) =>
    `Al menos ${String(minimo)} caracteres. Con el ojo ves lo que escribiste.`,
  creandoLaCuenta: 'Creando la cuenta…',
  crearLaCuenta: 'Crear la cuenta',
} as const;

export const desbloquearLaApp = {
  laAppEstaBloqueada: 'La app está bloqueada',
  nota: 'La app se abre pidiendo la huella porque lo activaste en este teléfono. Se cambia en Ajustes.',
  sinSenalParaLaContrasena:
    'Sin señal no se puede entrar con la contraseña: se verifica contra el servidor. Probá con la huella.',
  bajada: {
    'eligio-la-contrasena': 'Entrá con tu contraseña, o probá otra vez con la huella.',
    'no-se-confirmo': 'La huella no se confirmó. Probala otra vez o entrá con tu contraseña.',
    'sin-respuesta':
      'El pedido de la huella no respondió. Probala otra vez o entrá con tu contraseña.',
    'no-disponible': 'No pudimos usar la huella en este teléfono.',
    interrumpida: 'Probá otra vez con la huella o entrá con tu contraseña.',
  },
  hola: 'Hola',
  holaConNombre: ({ nombre }: { nombre: string }) => `Hola, ${nombre}`,
  esperandoLaHuella: 'Esperando la huella…',
  probarConLaHuella: 'Probar con la huella',
  escribiTuContrasena: 'Escribí tu contraseña.',
  teMandamosUnEnlace: ({ email }: { email: string }) =>
    `Te mandamos un enlace a ${email} para poner una contraseña nueva. Abrilo desde este teléfono.`,
  contrasena: 'Contraseña',
  laOlvidaste: '¿La olvidaste?',
  entrando: 'Entrando…',
  entrar: 'Entrar',
  tocaElSensor: 'Tocá el sensor de huella para abrir el taller.',
  usarLaHuella: 'Usar la huella',
  entrarConLaContrasena: 'Entrar con la contraseña',
  sinSenalSoloConLaHuella: 'Sin señal solo podés entrar con la huella.',
  laHuellaNoRespondio:
    'La huella de este teléfono no respondió. Cuando vuelva la señal vas a poder entrar con tu contraseña.',
  cuandoVuelvaLaSenal: 'Cuando vuelva la señal también vas a poder entrar con tu contraseña.',
} as const;

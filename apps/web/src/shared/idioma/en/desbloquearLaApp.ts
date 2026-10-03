import type { Mensajes } from '../es';

export const desbloquearLaApp = {
  laAppEstaBloqueada: 'The app is locked',
  nota: 'The app asks for your fingerprint when it opens because you turned that on for this phone. You can change it in Settings.',
  sinSenalParaLaContrasena:
    "You can't log in with your password offline: it's checked against the server. Try your fingerprint.",
  bajada: {
    'eligio-la-contrasena': 'Log in with your password, or try your fingerprint again.',
    'no-se-confirmo': "Your fingerprint wasn't confirmed. Try again or log in with your password.",
    'sin-respuesta':
      "The fingerprint request didn't respond. Try again or log in with your password.",
    'no-disponible': "Couldn't use the fingerprint on this phone.",
    interrumpida: 'Try your fingerprint again or log in with your password.',
  },
  hola: 'Hi',
  holaConNombre: ({ nombre }) => `Hi, ${nombre}`,
  esperandoLaHuella: 'Waiting for fingerprint…',
  probarConLaHuella: 'Try fingerprint',
  escribiTuContrasena: 'Enter your password.',
  teMandamosUnEnlace: ({ email }) =>
    `We sent a link to ${email} to set a new password. Open it on this phone.`,
  contrasena: 'Password',
  laOlvidaste: 'Forgot it?',
  entrando: 'Logging in…',
  entrar: 'Log in',
  tocaElSensor: 'Touch the fingerprint sensor to open your shop.',
  usarLaHuella: 'Use fingerprint',
  entrarConLaContrasena: 'Log in with password',
  sinSenalSoloConLaHuella: 'Offline, you can only log in with your fingerprint.',
  laHuellaNoRespondio:
    "This phone's fingerprint sensor didn't respond. Once you're back online, you'll be able to log in with your password.",
  cuandoVuelvaLaSenal: "Once you're back online, you'll also be able to log in with your password.",
} satisfies Mensajes['desbloquearLaApp'];

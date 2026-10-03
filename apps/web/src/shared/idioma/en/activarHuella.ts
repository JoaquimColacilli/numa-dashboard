import type { Mensajes } from '../es';

export const activarHuella = {
  sinSenalParaActivar:
    "You need to be online to turn on fingerprint login: it's registered on the server. Try again when you're back online.",
  elRegistroNoRespondio: "The fingerprint setup didn't respond. Try again.",
  noSeConfirmo: "Your fingerprint wasn't confirmed. Try again.",
  listo: "Done: next time you open the app, it'll ask for your fingerprint.",
  yaNoLaPide: "The app won't ask for your fingerprint on this phone anymore.",
  seAbreSinPedirNada:
    "The app opens without asking for anything. You can have it ask for your fingerprint, like your bank's app.",
  fijandonos: 'Checking if this phone has a fingerprint sensor…',
  sinHuella:
    "This phone doesn't have a fingerprint or screen lock set up, so the app can't ask for it.",
  conElBloqueo:
    'This phone has fingerprint login on: the app asks for it every time you open it, even offline.',
  dejarDePedirla: 'Stop asking for fingerprint',
  registrando: 'Setting up fingerprint…',
  pedirlaAlAbrir: 'Ask for fingerprint on open',
  queresEntrarConLaHuella: 'Want to log in with your fingerprint next time?',
  laAppSeAbrePidiendola:
    "The app will ask for your fingerprint when it opens, like your bank's app, and it works offline too. If your fingerprint ever doesn't respond, you can log in with your password.",
  siUsarLaHuella: 'Yes, use fingerprint',
  ahoraNo: 'Not now',
  loPodesCambiar: 'You can change this anytime in Settings.',
} satisfies Mensajes['activarHuella'];

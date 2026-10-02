import type { Mensajes } from '../es';

export const paginaAcceso = {
  entraAlTaller: 'Log in to your shop',
  unaVezAdentro: "Once you're in, the app works even without a connection.",
  noTenesCuenta: ({ Enlace }) => (
    <>
      Don't have an account? <Enlace>Create one</Enlace>
    </>
  ),
  laSesionSeCerro: "This phone's session ended: it expired or was closed from somewhere else.",
  entraDeNuevo:
    'Log in again with your email and password. If you used your fingerprint, turn it on again in Settings.',
  siYaHabiasConfirmado:
    "If you'd already confirmed your account, log in with your email and password.",
  laOlvidaste: 'Forgot it?',
} satisfies Mensajes['paginaAcceso'];

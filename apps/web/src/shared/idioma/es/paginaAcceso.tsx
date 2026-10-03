import type { Envoltorio } from '@/shared/lib';

export const paginaAcceso = {
  entraAlTaller: 'Entrá al taller',
  unaVezAdentro: 'Una vez adentro, la app anda aunque no haya señal.',
  noTenesCuenta: ({ Enlace }: { Enlace: Envoltorio }) => (
    <>
      ¿No tenés cuenta? <Enlace>Creá una</Enlace>
    </>
  ),
  laSesionSeCerro: 'La sesión de este teléfono se cerró: venció o se cerró desde otro lado.',
  entraDeNuevo:
    'Entrá de nuevo con tu mail y tu contraseña. Si usabas la huella, activala otra vez en Ajustes.',
  siYaHabiasConfirmado: 'Si ya habías confirmado la cuenta, entrá con tu mail y tu contraseña.',
  laOlvidaste: '¿La olvidaste?',
} as const;

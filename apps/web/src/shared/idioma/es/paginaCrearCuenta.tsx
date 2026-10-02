import type { Envoltorio } from '@/shared/lib';

export const paginaCrearCuenta = {
  revisaTuCorreo: 'Revisá tu correo',
  faltaUnPaso: 'Falta un paso: confirmar que el mail es tuyo.',
  pocosMailsPorHora:
    'El servidor de mails manda pocos por hora. Si pediste varios seguidos, esperá un rato antes de volver a intentar.',
  creaTuCuenta: 'Creá tu cuenta',
  confirmasElMail: 'Confirmás el mail y tu taller se crea solo, vacío y listo para cargar.',
  unaVezAdentro: 'Una vez adentro, la app anda aunque no haya señal.',
  yaTenesCuenta: ({ Enlace }: { Enlace: Envoltorio }) => (
    <>
      ¿Ya tenés cuenta? <Enlace>Entrá</Enlace>
    </>
  ),
} as const;

import type { Mensajes } from '../es';

export const paginaAcceso = {
  entraAlTaller: 'Entre na marcenaria',
  unaVezAdentro: 'Depois de entrar, o app funciona mesmo sem internet.',
  noTenesCuenta: ({ Enlace }) => (
    <>
      Não tem conta? <Enlace>Crie uma</Enlace>
    </>
  ),
  laSesionSeCerro: 'A sessão deste celular foi encerrada: expirou ou foi fechada em outro lugar.',
  entraDeNuevo:
    'Entre de novo com seu e-mail e sua senha. Se você usava a digital, ative de novo em Configurações.',
  siYaHabiasConfirmado: 'Se você já tinha confirmado a conta, entre com seu e-mail e sua senha.',
  laOlvidaste: 'Esqueceu?',
} satisfies Mensajes['paginaAcceso'];

import type { Mensajes } from '../es';

export const paginaCrearCuenta = {
  revisaTuCorreo: 'Confira seu e-mail',
  faltaUnPaso: 'Falta um passo: confirmar que o e-mail é seu.',
  pocosMailsPorHora:
    'O servidor de e-mails envia poucos por hora. Se você pediu vários seguidos, espere um pouco antes de tentar de novo.',
  creaTuCuenta: 'Crie sua conta',
  confirmasElMail:
    'Você confirma o e-mail e sua marcenaria é criada automaticamente, vazia e pronta para começar.',
  unaVezAdentro: 'Depois de entrar, o app funciona mesmo sem internet.',
  yaTenesCuenta: ({ Enlace }) => (
    <>
      Já tem conta? <Enlace>Entre</Enlace>
    </>
  ),
} satisfies Mensajes['paginaCrearCuenta'];

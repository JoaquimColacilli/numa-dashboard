import type { Mensajes } from '../es';

export const paginaRecuperar = {
  revisaTuCorreo: 'Confira seu e-mail',
  elEnlaceTeLleva: 'O link leva você a criar uma senha nova.',
  pocosMailsPorHora:
    'O servidor de e-mails envia poucos por hora. Se você pediu vários seguidos, espere um pouco antes de tentar de novo.',
  recuperaElAcceso: 'Recupere o acesso',
  teMandamosUnEnlace: 'Vamos enviar um link para você criar uma senha nova.',
  teAcordaste: ({ Enlace }) => (
    <>
      Lembrou? <Enlace>Entre</Enlace>
    </>
  ),
} satisfies Mensajes['paginaRecuperar'];

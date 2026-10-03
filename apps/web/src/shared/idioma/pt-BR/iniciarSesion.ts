import type { Mensajes } from '../es';

export const iniciarSesion = {
  sinSenalParaEntrar:
    'Sem internet não é possível entrar: a conta é verificada no servidor. Depois de entrar, o app funciona mesmo sem internet.',
  teMandamosElEnlaceDeNuevo: ({ email }) => `Enviamos o link de novo para ${email}.`,
  mandandolo: 'Enviando…',
  mandarmeElEnlaceDeNuevo: 'Enviar o link de novo',
  escribiUnMailValido: 'Digite um e-mail válido.',
  escribiTuContrasena: 'Digite sua senha.',
  email: 'E-mail',
  ejemploDeMail: 'voce@suamarcenaria.com.br',
  contrasena: 'Senha',
  entrando: 'Entrando…',
  entrar: 'Entrar',
} satisfies Mensajes['iniciarSesion'];

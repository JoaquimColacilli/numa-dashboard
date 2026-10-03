import type { Mensajes } from '../es';

export const activarHuella = {
  sinSenalParaActivar:
    'Para ativar a digital é preciso internet: ela é registrada no servidor. Tente quando a conexão voltar.',
  elRegistroNoRespondio: 'O registro da digital não respondeu. Tente de novo.',
  noSeConfirmo: 'A digital não foi confirmada. Tente de novo.',
  listo: 'Pronto: da próxima vez que você abrir o app, ele vai pedir a digital.',
  yaNoLaPide: 'O app não pede mais a digital neste celular.',
  seAbreSinPedirNada:
    'O app abre sem pedir nada. Você pode fazer ele pedir a digital, como o app do banco.',
  fijandonos: 'Verificando se este celular tem digital…',
  sinHuella:
    'Este celular não tem digital nem bloqueio de tela configurado, então o app não pode pedir a digital.',
  conElBloqueo:
    'Este celular tem o bloqueio com digital: o app pede sempre que você abre, mesmo sem internet.',
  dejarDePedirla: 'Parar de pedir a digital',
  registrando: 'Registrando a digital…',
  pedirlaAlAbrir: 'Pedir a digital ao abrir',
  queresEntrarConLaHuella: 'Quer entrar com a digital da próxima vez?',
  laAppSeAbrePidiendola:
    'O app abre pedindo a sua digital, como o do banco, e funciona também sem internet. Se algum dia a digital não responder, você entra com a sua senha.',
  siUsarLaHuella: 'Sim, usar a digital',
  ahoraNo: 'Agora não',
  loPodesCambiar: 'Dá para mudar quando quiser em Configurações.',
} satisfies Mensajes['activarHuella'];

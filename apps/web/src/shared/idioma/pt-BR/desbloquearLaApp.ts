import type { Mensajes } from '../es';

export const desbloquearLaApp = {
  laAppEstaBloqueada: 'O app está bloqueado',
  nota: 'O app pede a digital ao abrir porque você ativou isso neste celular. Dá para mudar em Configurações.',
  sinSenalParaLaContrasena:
    'Sem internet não é possível entrar com a senha: ela é verificada no servidor. Tente com a digital.',
  bajada: {
    'eligio-la-contrasena': 'Entre com sua senha ou tente de novo com a digital.',
    'no-se-confirmo': 'A digital não foi confirmada. Tente de novo ou entre com sua senha.',
    'sin-respuesta': 'O pedido da digital não respondeu. Tente de novo ou entre com sua senha.',
    'no-disponible': 'Não foi possível usar a digital neste celular.',
    interrumpida: 'Tente de novo com a digital ou entre com sua senha.',
  },
  hola: 'Olá',
  holaConNombre: ({ nombre }) => `Olá, ${nombre}`,
  esperandoLaHuella: 'Aguardando a digital…',
  probarConLaHuella: 'Tentar com a digital',
  escribiTuContrasena: 'Digite sua senha.',
  teMandamosUnEnlace: ({ email }) =>
    `Enviamos um link para ${email} para você criar uma senha nova. Abra neste celular.`,
  contrasena: 'Senha',
  laOlvidaste: 'Esqueceu?',
  entrando: 'Entrando…',
  entrar: 'Entrar',
  tocaElSensor: 'Toque no sensor de digital para abrir a marcenaria.',
  usarLaHuella: 'Usar a digital',
  entrarConLaContrasena: 'Entrar com a senha',
  sinSenalSoloConLaHuella: 'Sem internet, só dá para entrar com a digital.',
  laHuellaNoRespondio:
    'A digital deste celular não respondeu. Quando a conexão voltar, você vai poder entrar com sua senha.',
  cuandoVuelvaLaSenal: 'Quando a conexão voltar, você também vai poder entrar com sua senha.',
} satisfies Mensajes['desbloquearLaApp'];

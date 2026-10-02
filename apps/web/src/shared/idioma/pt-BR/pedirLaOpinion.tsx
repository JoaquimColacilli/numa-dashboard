import type { Mensajes } from '../es';
import { plural } from './plural';

function oQueTem(preguntas: number, comentarios: number): string {
  if (preguntas > 0 && comentarios > 0) {
    return `São ${plural(preguntas, { one: 'uma pergunta', other: '# perguntas' })} e ${plural(comentarios, { one: 'um comentário', other: '# comentários' })}`;
  }
  if (preguntas > 0) return plural(preguntas, { one: 'É uma pergunta', other: 'São # perguntas' });
  if (comentarios > 0) {
    return plural(comentarios, { one: 'É um comentário', other: 'São # comentários' });
  }
  return 'Não tem perguntas';
}

export const pedirLaOpinion = {
  sinSenal:
    'Para criar o link da pesquisa de satisfação, é preciso estar com internet. Quando a conexão voltar, toque de novo.',
  enlaceCopiado: 'Link copiado.',
  copiado: 'Copiado',
  copiarElEnlace: 'Copiar link',
  darDeBaja: {
    abrir: 'Desativar este link',
    titulo: 'Desativar o link?',
    texto: (nombre) =>
      nombre === null
        ? 'O link que você enviou para o cliente vai parar de funcionar: ao abrir, vai aparecer que ele não funciona mais. Depois você pode enviar um novo daqui.'
        : `O link que você enviou para ${nombre} vai parar de funcionar: ao abrir, vai aparecer que ele não funciona mais. Depois você pode enviar um novo daqui.`,
    sinSenal: 'Para desativar o link, é preciso estar com internet.',
    confirmar: 'Desativar',
    cancelar: 'Cancelar',
  },
  pie: (Enlace) => (
    <>
      A pesquisa de satisfação que o cliente recebe vem de <Enlace>Opiniões › Perguntas</Enlace>,
      mais o que você adicionar aqui.
    </>
  ),
  contestada: {
    titulo: (nombre) => (nombre === null ? 'O cliente já respondeu' : `${nombre} já respondeu`),
    chip: 'respondida',
    contestoLaEncuesta: 'Respondeu à pesquisa de satisfação.',
    contestoEl: (dia, diasDespues) => {
      if (diasDespues === null) return `Respondeu em ${dia}.`;
      if (diasDespues === 0) return `Respondeu em ${dia}, no mesmo dia da entrega.`;
      return `Respondeu em ${dia}, ${plural(diasDespues, { one: 'um dia', other: '# dias' })} depois da entrega.`;
    },
    verLoQueContesto: 'Ver o que respondeu',
    comentario: (texto) => `“${texto}”`,
    verTodas: 'Ver todas as opiniões',
  },
  mandada: {
    titulo: 'Você pediu a opinião',
    chip: 'sem resposta',
    bajada:
      'O link chegou pelo WhatsApp. Quando o cliente responder, a resposta aparece aqui e em Opiniões.',
    leLlego: (cuando) => `Recebeu ${cuando} e ainda não respondeu`,
    recordarselo: 'Lembrar uma vez',
    yaLeRecordaste: (dia) =>
      `Você já lembrou uma vez, em ${dia}. Não existe um segundo lembrete: com um cliente que já pagou, insistir de novo incomoda mais do que ajuda.`,
    unRecordatorio:
      'Um lembrete e mais nada. Se depois disso não responder, fica assim, e tudo bem.',
  },
  sinMandar: {
    titulo: (nombre) =>
      nombre === null ? 'Peça a opinião do cliente' : `Peça a opinião de ${nombre}`,
    sinPreguntas:
      'A pesquisa de satisfação ainda não tem nenhuma pergunta. Adicione alguma em Opiniões › Perguntas antes de pedir.',
    queTiene: (preguntas, comentarios, minutos) =>
      `${oQueTem(preguntas, comentarios)}. O cliente recebe um link, abre sem precisar de conta e responde em menos de ${plural(minutos, { one: 'um minuto', other: '# minutos' })}.`,
    pedirsela: 'Pedir pelo WhatsApp',
    noSeCreo: (motivo) =>
      `Não foi possível criar o link. ${motivo} Se você já enviou a mensagem, toque em Tentar de novo: o link que o cliente recebeu passa a funcionar sem precisar enviar nada de novo.`,
    reintentar: 'Tentar de novo',
    elMismoDia:
      'Pedir no mesmo dia da entrega rende bem mais respostas do que pedir uma semana depois. Se puder, envie agora.',
  },
  propias: {
    titulo: 'Algo específico deste projeto',
    cuantas: (propias, tope) =>
      propias === 0 ? 'nenhuma ainda' : `${String(propias)} de ${String(tope)}`,
    detalle: 'Entra só na pesquisa de satisfação deste cliente. Não conta na média geral.',
    sacar: (texto) => `Tirar a pergunta “${texto}”`,
    queLePreguntas: (nombre) =>
      nombre === null
        ? 'O que você quer perguntar para o cliente'
        : `O que você quer perguntar para ${nombre}`,
    ejemplo: 'A altura do armário aéreo ficou confortável?',
    comoContesta: 'Como responde',
    agregarla: 'Adicionar a esta pesquisa de satisfação',
    cancelar: 'Cancelar',
    agregarUna: 'Adicionar uma pergunta para este projeto',
    yaContesto: (nombre) =>
      nombre === null
        ? 'O cliente já respondeu, então estas perguntas ficam como estão. Para perguntar algo novo, mande uma mensagem.'
        : `${nombre} já respondeu, então estas perguntas ficam como estão. Para perguntar algo novo, mande uma mensagem.`,
    problemas: {
      'sin-texto': 'Escreva a pergunta.',
      'texto-largo': 'A pergunta está longa demais: precisa caber em 300 letras.',
    },
  },
  avisos: {
    laSumamos: 'Adicionada à pesquisa de satisfação deste projeto.',
    sacaste: 'Você tirou a pergunta.',
    deshacer: 'Desfazer',
  },
} satisfies Mensajes['pedirLaOpinion'];

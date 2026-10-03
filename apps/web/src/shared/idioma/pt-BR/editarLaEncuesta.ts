import type { Mensajes } from '../es';
import { plural } from './plural';

export const editarLaEncuesta = {
  intro:
    'Isto é o que se pergunta a todos os clientes quando você termina um projeto. Já está escrita: mude o que quiser ou deixe como está.',
  notasDelLargo: {
    ok: 'Está num tamanho que as pessoas respondem sem pensar.',
    atencion: 'Está ficando longa. Acima de três minutos, começam a abandonar.',
    alerta: 'Longa demais. Nesse tamanho, metade desiste no meio.',
  },
  deTantas: (preguntas, tope) => `${String(preguntas)} de ${String(tope)}`,
  loQueSePregunta: 'O que se pergunta',
  subir: 'Subir',
  bajar: 'Descer',
  editar: 'Editar',
  dejarDePreguntarla: 'Parar de perguntar',
  obligatoria: 'Obrigatória',
  version: (numero) => `versão ${String(numero)}`,
  sinRespuestas: 'sem respostas',
  dejasteDePreguntarla: (cuando) => `você parou de perguntar ${cuando}`,
  verRespuestas: 'Ver respostas',
  volverAPreguntarla: 'Voltar a perguntar',
  yaPreguntasElTope: (tope) =>
    `Você já pergunta ${String(tope)}: para voltar a perguntar esta, tire outra.`,
  preguntaNueva: 'Pergunta nova, ainda sem texto',
  noPreguntasNada:
    'Por enquanto você não pergunta nada a ninguém. Adicione uma pergunta ou volte a perguntar uma das de baixo.',
  agregarUnaPregunta: 'Adicionar uma pergunta',
  verlaComoElCliente: 'Ver como o cliente vê',
  llegasteAlTope: (tope) =>
    `Você chegou a ${String(tope)} perguntas. É o tamanho até onde as pessoas respondem sem desistir: para adicionar uma, tire outra.`,
  lasQueYaNo: 'As que você não pergunta mais',
  lasQueYaNoDetalle:
    'Não são mais perguntadas, mas as respostas ficam guardadas e dá para ver em Resultados.',
  deUnTrabajo: 'Perguntas de um projeto específico',
  deUnTrabajoDetalle:
    'São adicionadas a partir do projeto, não daqui, e entram só nessa pesquisa de satisfação. Não entram na média geral: uma pergunta que uma pessoa respondeu não é uma estatística.',
  editor: {
    queSePregunta: 'O que perguntar',
    comoContesta: 'Como responde',
    lasOpciones: 'As opções',
    opcion: (numero) => `Opção ${String(numero)}`,
    borrarLaOpcion: (numero) => `Excluir a opção ${String(numero)}`,
    agregarUnaOpcion: 'Adicionar uma opção',
    queTengaQueContestarla: 'Resposta obrigatória',
    siNoPuedeSaltearla: 'Se não, dá para pular',
    yaLaContestaron: (personas) =>
      plural(personas, {
        '=0': '# pessoas já responderam esta pergunta',
        one: '# pessoa já respondeu esta pergunta',
        other: '# pessoas já responderam esta pergunta',
      }),
    cambiasteComoSeContesta:
      'Você mudou o jeito de responder, então essas respostas não podem ser somadas às novas. Elas ficam guardadas à parte, com o texto que tinham, e a contagem começa do zero.',
    siLeCambiasElSentido:
      'Se você mudar o sentido, essas respostas respondiam outra coisa e não podem ser somadas às novas. Podemos guardar as antigas à parte e começar a contar do zero com o texto novo.',
    queHacemos: 'O que fazer com as respostas antigas',
    empezarDeCero: 'Começar a contar do zero',
    empezarDeCeroDetalle: (respuestas) =>
      plural(respuestas, {
        '=0': 'As # respostas antigas ficam guardadas à parte, com o texto que tinham. Em Resultados elas aparecem separadas.',
        one: 'A resposta antiga fica guardada à parte, com o texto que tinha. Em Resultados ela aparece separada.',
        other:
          'As # respostas antigas ficam guardadas à parte, com o texto que tinham. Em Resultados elas aparecem separadas.',
      }),
    esLaMisma: 'É a mesma pergunta, só escrevi melhor',
    esLaMismaDetalle: 'As respostas antigas continuam somando com as novas.',
    guardar: 'Salvar pergunta',
    cancelar: 'Cancelar',
    problemas: {
      'sin-texto': 'Escreva a pergunta.',
      'texto-largo': 'A pergunta está longa demais: precisa caber em 300 letras.',
      'opcion-vacia': 'Há uma opção vazia: preencha ou tire.',
      'pocas-opciones': 'Precisa ter pelo menos duas opções.',
      'muchas-opciones': 'Pode ter no máximo oito opções.',
      'opcion-larga': 'Uma opção está longa demais: precisa caber em 120 letras.',
      'opciones-repetidas': 'Há duas opções iguais.',
    },
  },
  vistaPrevia: {
    titulo: 'Como o cliente vê',
    bajada: 'Nada do que você mexer aqui é salvo',
  },
  avisos: {
    deshacer: 'Desfazer',
    guardada: 'Pergunta salva.',
    versionNueva: 'Salva como versão nova. As respostas antigas ficam à parte.',
    dejasteDePreguntar: (texto) => `Você parou de perguntar “${texto}”.`,
    volvisteAPreguntarla: 'Você voltou a perguntar.',
  },
} satisfies Mensajes['editarLaEncuesta'];

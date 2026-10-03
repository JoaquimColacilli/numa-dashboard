import type { Mensajes } from '../es';
import { plural } from './plural';

export const paginaOpiniones = {
  opiniones: 'Opiniões',
  secciones: {
    resultados: 'Resultados',
    preguntas: 'Perguntas',
  },
  sinConexion: 'Sem internet. Você está vendo o que foi sincronizado por último.',
  sinEnviar: {
    titulo: 'Você ainda não perguntou a ninguém',
    detalle:
      'Quando você marcar um projeto como entregue, o botão para pedir a opinião do cliente vai aparecer ali mesmo. As respostas ficam reunidas aqui.',
    detalleConTerminados: (terminados) =>
      plural(terminados, {
        '=0': 'Você tem # projetos terminados. Quando marcar um como entregue, o botão para pedir a opinião do cliente vai aparecer ali mesmo. As respostas ficam reunidas aqui.',
        one: 'Você tem # projeto terminado. Quando marcar um como entregue, o botão para pedir a opinião do cliente vai aparecer ali mesmo. As respostas ficam reunidas aqui.',
        other:
          'Você tem # projetos terminados. Quando marcar um como entregue, o botão para pedir a opinião do cliente vai aparecer ali mesmo. As respostas ficam reunidas aqui.',
      }),
    pedirle: 'Pedir a opinião de um cliente',
    verQueSePregunta: 'Ver o que se pergunta',
  },
  sinRespuestas: {
    preguntaste: (enviadas, cuando) =>
      plural(enviadas, {
        '=0': `Você perguntou a # clientes ${cuando}`,
        one: `Você perguntou a um cliente ${cuando}`,
        other: `Você perguntou a # clientes, o primeiro ${cuando}`,
      }),
    titulo: 'Ninguém respondeu ainda',
    esNormal:
      'É normal nos primeiros dias. De cada dez pessoas a quem se pede, costumam responder entre três e cinco, quase sempre na primeira semana.',
    verAQuien: 'Ver para quem você enviou',
  },
  titular: {
    region: 'Destaque',
    queTanConformes: 'Nível de satisfação',
    deCinco: 'de 5',
    nadieContesto: 'Ninguém respondeu esta pergunta ainda.',
    promedioDe: (respuestas) =>
      plural(respuestas, {
        '=0': 'É a média de # respostas',
        one: 'É a média de # resposta',
        other: 'É a média de # respostas, uma por pessoa',
      }),
    contestaron: (tasa) => `Responderam ${tasa}`,
    unPunto: 'Cada ponto é um cliente a quem você perguntou. O preenchido respondeu.',
    variosPuntos: 'Cada ponto é um cliente. Os preenchidos responderam.',
    variosPuntosConTope: (tope) =>
      `Cada ponto é um cliente. Os preenchidos responderam. Aparecem os primeiros ${String(tope)}.`,
  },
  porcentaje: (porcentaje, parte, total) =>
    `${String(porcentaje)}% (${String(parte)} de ${String(total)})`,
  comentarios: {
    titulo: 'O que escreveram',
    escribieronAlgo: (escribieron, contestadas) =>
      `${String(escribieron)} de ${String(contestadas)} escreveram algo`,
    nadieEscribio:
      'Ninguém escreveu nada ainda. O comentário é opcional, então muitos respondem só as escalas e pronto.',
    verLaRespuesta: 'Ver a resposta',
  },
  preguntas: {
    titulo: 'Pergunta por pergunta',
    ocultarLosNumeros: 'Ocultar os números',
    verLosNumeros: 'Ver os números',
    repartidas:
      'Com essa quantidade de respostas já faz sentido ver a distribuição. O corte do meio é “nem bem nem mal”.',
    deAUna: (umbral) =>
      `Cada ponto é uma pessoa. Com menos de ${String(umbral)} respostas não mostramos porcentagens distribuídas: elas se leem melhor uma a uma.`,
    mezcladas: (umbral) =>
      `Com essa quantidade de respostas já faz sentido ver a distribuição. O corte do meio é “nem bem nem mal”. As que têm menos de ${String(umbral)} respostas aparecem uma a uma: cada ponto é uma pessoa.`,
    lasQueYaNo: 'As que você não pergunta mais',
    noSePreguntanMas: 'Não são mais perguntadas, mas as respostas ficam aqui.',
    antesDecia: (Cita, texto, contestaron, hasta) => (
      <>
        Antes esta pergunta dizia <Cita>“{texto}”</Cita>, e{' '}
        {plural(contestaron, {
          '=0': '# pessoas responderam',
          one: '# pessoa respondeu',
          other: '# pessoas responderam',
        })}{' '}
        até {hasta}. Essas respostas não entram aqui, porque respondiam outra coisa.
      </>
    ),
    ocultarLasDeAntes: 'Ocultar as anteriores',
    verLasDeAntes: 'Ver as anteriores',
  },
  enElTiempo: {
    titulo: 'Ao longo do tempo',
    conEvolucion:
      'Cada barra é uma resposta, da mais antiga à mais nova. A altura mostra o nível de satisfação.',
    sinEvolucion: (umbral) =>
      `Cada barra é uma resposta, em ordem. Com ${String(umbral)} respostas e seis meses de histórico vamos poder mostrar se está melhorando ou piorando; com menos seria inventar uma tendência.`,
    tira: (respuestas, desde, hasta) =>
      plural(respuestas, {
        '=0': `# respostas, de ${desde} a ${hasta}`,
        one: `# resposta, de ${desde} a ${hasta}`,
        other: `# respostas, de ${desde} a ${hasta}`,
      }),
    sinRespuestas: 'Sem respostas',
  },
  trabajos: {
    titulo: 'Projeto por projeto',
    contesto: (cuando) => `Respondeu ${cuando}`,
    recordada: 'Sem resposta, lembrete enviado',
    leMandaste: (cuando) => `Enviada ${cuando}`,
    sinCliente: 'Sem cliente',
    propias: (propias) =>
      plural(propias, { '=0': '+# próprias', one: '+# própria', other: '+# próprias' }),
  },
} satisfies Mensajes['paginaOpiniones'];

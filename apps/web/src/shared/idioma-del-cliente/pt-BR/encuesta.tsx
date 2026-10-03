import type { MensajesDelCliente } from '../es';
import { plural } from './plural';

function emMenosDe(minutos: number): string {
  return plural(minutos, { one: 'menos de um minuto', other: 'menos de # minutos' });
}

export const encuesta = {
  pestana: 'Pesquisa de satisfação',
  pestanaDe: (taller) => `Pesquisa de satisfação · ${taller}`,
  abriendo: 'Carregando a pesquisa de satisfação',
  sinSenal: {
    titulo: 'Sem internet',
    texto:
      'Você precisa de internet para abrir a pesquisa de satisfação. Tente de novo quando a conexão voltar.',
  },
  error: {
    titulo: 'Não foi possível abrir a pesquisa de satisfação',
    texto: 'A conexão caiu. O link continua valendo, tente de novo.',
    reintentar: 'Tentar de novo',
  },
  muerto: {
    titulo: 'Este link não funciona mais',
    texto:
      'Os links que a marcenaria envia valem por um tempo e depois são desativados. Se quiser deixar sua opinião, peça um novo a quem enviou.',
  },
  alMandar: {
    sinSenal:
      'Não foi possível enviar: a conexão caiu. O que você marcou continua aqui; tente de novo quando a internet voltar.',
    noSeGuardo: 'Não foi possível salvar sua opinião. Tente de novo daqui a pouco.',
    cambioLaEncuesta:
      'Enquanto você respondia, mudamos uma das perguntas. Já está atualizada: revise o que marcou e envie de novo.',
    motivos: {
      forma: 'A resposta não está no formato que a pesquisa de satisfação espera',
      ajena: 'Chegou uma resposta a uma pergunta que não é desta pesquisa de satisfação',
      repetida: 'A mesma pergunta foi respondida duas vezes',
      tipo: 'Uma resposta não é do tipo que a pergunta pede',
      rango: 'Uma resposta está fora das opções da pergunta',
      vacio: 'Chegou uma resposta vazia',
      largo: 'Um texto passa dos 2.000 caracteres que a pesquisa de satisfação aceita',
      obligatoria: 'Falta responder uma pergunta obrigatória',
    },
  },
  formulario: {
    lema: 'Móveis sob medida',
    titulo: (Trabajo, trabajo) =>
      trabajo.trim() === '' ? (
        'Como foi a experiência com o seu móvel?'
      ) : (
        <>
          Como foi a experiência com “<Trabajo>{trabajo}</Trabajo>”?
        </>
      ),
    bajada: (preguntas, comentarios, minutos) => {
      if (preguntas > 0) {
        return `${plural(preguntas, { one: 'É uma pergunta', other: 'São # perguntas' })} e leva ${emMenosDe(minutos)}. Quem lê é o dono da marcenaria.`;
      }
      if (comentarios > 0) {
        return `${plural(comentarios, { one: 'É um comentário', other: 'São # comentários' })} e leva ${emMenosDe(minutos)}. Quem lê é o dono da marcenaria.`;
      }
      return `Não tem perguntas e leva ${emMenosDe(minutos)}. Quem lê é o dono da marcenaria.`;
    },
    avisoDeFirma:
      'Como o link é do seu projeto, vamos saber que foi você quem respondeu. Conte o que você pensa mesmo assim: é para isso que enviamos.',
    ayudaDelComentario: 'É opcional, mas é o que mais nos ajuda.',
    loQueSeTeOcurra: 'O que vier à cabeça. Se não, deixe em branco e envie assim mesmo.',
    faltaEscribir: 'Falta esta. Escreva algo para continuar.',
    faltaElegir: 'Falta esta. Toque em uma opção para continuar.',
    faltan: (preguntas) =>
      plural(preguntas, {
        one: 'Falta uma pergunta, ela está marcada acima.',
        other: 'Faltam # perguntas, elas estão marcadas acima.',
      }),
    nombre: 'Pesquisa de satisfação',
    mandando: 'Enviando…',
    mandar: 'Enviar minha opinião',
    unaSolaVez: 'É enviada uma única vez e não pode ser editada depois.',
  },
  gracias: {
    titulo: 'Obrigado',
    conElNombre: (Nombre, nombre) => (
      <>
        Obrigado, <Nombre>{nombre}</Nombre>
      </>
    ),
    texto: 'Quem lê somos nós, não um sistema. O que você nos contou ajuda no próximo móvel.',
    resena: {
      pregunta: 'Pode deixar a mesma avaliação no Google?',
      texto:
        'Pedimos a todos os clientes, seja qual for a resposta. Para uma marcenaria pequena, faz muita diferença.',
      dejarla: 'Deixar uma avaliação',
    },
  },
  yaContestaste: {
    titulo: 'Você já nos contou, obrigado',
    texto: (fecha) =>
      `Você respondeu em ${fecha}. Isto é o que você disse. Não dá para mudar, mas se ficou alguma coisa de fora, fale com a gente.`,
  },
  escalas: {
    conformidad: {
      1: { etiqueta: 'Não gostei nada', corta: 'Nada' },
      2: { etiqueta: 'Gostei pouco', corta: 'Pouco' },
      3: { etiqueta: 'Nem bem nem mal', corta: 'Mais ou menos' },
      4: { etiqueta: 'Gostei', corta: 'Gostei' },
      5: { etiqueta: 'Gostei muito', corta: 'Gostei muito' },
    },
    tiempos: {
      1: { etiqueta: 'Chegou com muito atraso', corta: 'Muito atraso' },
      2: { etiqueta: 'Atrasou', corta: 'Atrasou' },
      3: { etiqueta: 'Mais ou menos no prazo', corta: 'Mais ou menos' },
      4: { etiqueta: 'Chegou no prazo combinado', corta: 'No prazo' },
      5: { etiqueta: 'Chegou antes do combinado', corta: 'Antes' },
    },
    trato: {
      1: { etiqueta: 'Foi muito difícil', corta: 'Difícil' },
      2: { etiqueta: 'Foi um pouco difícil', corta: 'Um pouco' },
      3: { etiqueta: 'Nem bem nem mal', corta: 'Nem bem nem mal' },
      4: { etiqueta: 'Fácil', corta: 'Fácil' },
      5: { etiqueta: 'Muito fácil', corta: 'Muito fácil' },
    },
    sitalvezno: {
      1: { etiqueta: 'Não', corta: 'Não' },
      2: { etiqueta: 'Talvez', corta: 'Talvez' },
      3: { etiqueta: 'Sim, com certeza', corta: 'Sim' },
    },
  },
} satisfies MensajesDelCliente['encuesta'];

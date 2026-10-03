import type { Mensajes } from '../es';
import { plural } from './plural';

export const opinion = {
  tipos: {
    escala5: {
      etiqueta: 'Escala de cinco',
      descripcion: 'Cinco carinhas, cada uma com sua palavra',
    },
    sitalvezno: { etiqueta: 'Sim / talvez / não', descripcion: 'Três botões' },
    una: { etiqueta: 'Uma opção só', descripcion: 'Escolhe uma entre várias' },
    varias: { etiqueta: 'Várias opções', descripcion: 'Pode escolher mais de uma' },
    texto: { etiqueta: 'Texto livre', descripcion: 'Escreve o que quiser' },
  },
  cuantasRespuestas: (cantidad) =>
    plural(cantidad, { '=0': '# respostas', one: '# resposta', other: '# respostas' }),
  preguntaPropia: 'Pergunta própria deste projeto',
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
} satisfies Mensajes['opinion'];

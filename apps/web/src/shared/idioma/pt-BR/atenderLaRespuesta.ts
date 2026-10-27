import type { Mensajes } from '../es';

export const atenderLaRespuesta = {
  titulo: 'A resposta do cliente',
  aproboLaOpcion: (nombre, letra) => `${nombre} aprovou a opção ${letra}`,
  aproboElEstimativo: (nombre) => `${nombre} aprovou a estimativa`,
  aproboElPresupuesto: (nombre) => `${nombre} aprovou o orçamento`,
  tuCliente: 'O cliente',
  respondioEl: (fecha) => `Aprovou pela página dele em ${fecha}.`,
  propone: {
    manana: (dia) => `Sugere ${dia}, de manhã, para a medição.`,
    tarde: (dia) => `Sugere ${dia}, à tarde, para a medição.`,
    me_da_igual: (dia) => `Sugere ${dia} para a medição. Qualquer horário serve.`,
  },
  nota: 'O que ele deixou',
  agendarElRelevamiento: 'Agendar a visita técnica',
  aprobarConLaSena: 'Aprovar com o sinal',
  reactivar: 'Reativar',
  escribirle: 'Escrever',
  listo: 'Pronto, já conversamos',
} satisfies Mensajes['atenderLaRespuesta'];

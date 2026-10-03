import type { Mensajes } from '../es';
import { plural } from './plural';

export const llevarLaAgenda = {
  deshacer: 'Desfazer',
  marcada: 'Marcado como importante.',
  desmarcada: 'Você tirou a marca.',
  anotado: (dia) => `Anotado para ${dia}.`,
  listo: (texto) => `Concluído: ${texto}.`,
  borraste: (texto) => `Você excluiu “${texto}”.`,
  movida: {
    entrega: (nombre, dia) =>
      `${nombre}: passou para ${dia}. Você mudou a previsão de entrega do projeto.`,
    visita: (nombre, dia) => `${nombre}: passou para ${dia}. Você mudou a data da visita técnica.`,
    presupuesto: (nombre, dia) => `${nombre}: passou para ${dia}. Você mudou o prazo do orçamento.`,
    seguimiento: (nombre, dia) =>
      `${nombre}: passou para ${dia}. Você mudou o dia de retomar o contato.`,
  },
  pasoAl: (nombre, dia) => `${nombre} passou para ${dia}.`,
  errores: {
    faltaElTexto: 'Escreva o que precisa ser feito.',
    largoMaximo: (maximo) =>
      plural(maximo, {
        one: 'Não pode passar de # caractere.',
        other: 'Não pode passar de # caracteres.',
      }),
    faltaElDia: 'Escolha o dia.',
  },
  hoja: {
    titulo: 'Anotar algo',
    queHayQueHacer: 'O que precisa fazer',
    ejemplo: 'Comprar MDF, buscar as ferragens, pintar o gaveteiro…',
    queEs: 'O que é',
    cuando: 'Quando',
    hoy: 'Hoje',
    manana: 'Amanhã',
    elDiaElegido: 'O dia escolhido',
    otroDia: 'Outro dia',
    hora: 'Horário',
    horaOpcional: 'Opcional: o que vale é o dia.',
    trabajo: 'Projeto',
    sinTrabajo: 'Sem projeto',
    opcional: 'Opcional.',
    marcarlo: 'Marcar como importante',
    comoElCirculo: 'Como o círculo no caderno: o que importa na semana.',
    anotarlo: 'Anotar',
  },
} satisfies Mensajes['llevarLaAgenda'];

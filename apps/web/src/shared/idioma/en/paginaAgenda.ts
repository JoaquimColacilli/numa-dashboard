import type { Mensajes } from '../es';

export const paginaAgenda = {
  titulo: 'Calendar',
  hoyEs: (dia) => `today is ${dia}`,
  hoy: 'Today',
  mesAnterior: 'Previous month',
  mesSiguiente: 'Next month',
  anotarAlgo: 'Add something',
  queMostrar: 'What to show',
  todo: 'All',
  marcado: 'Marked',
  marcadoAMano: 'marked by hand',
  mesVacio:
    'Site measures and deliveries show up on their own when you add an inquiry or a job, and due dates when you set a payment day for a bill in Buckets. Whatever you buy or do at the shop, you add yourself.',
  elMesEstaVacio: 'The month is empty',
  nadaEnElMes: 'Nothing in this month yet',
  anotarLoPrimero: 'Add the first thing',
  diasAnteriores: 'Earlier days',
  anotarAlgoPara: (dia) => `Add something for ${dia}`,
  anotar: 'Add',
  verElDia: (dia) => `See ${dia}`,
  nadaAnotado: 'Nothing added for this day',
  hastaAca: (mes) => `That's all for ${mes}. Use the arrows above to go to the next month.`,
  elDia: (dia) => dia,
} satisfies Mensajes['paginaAgenda'];

import type { Mensajes } from '../es';

export const paginaAgenda = {
  titulo: 'Agenda',
  hoyEs: (dia) => `hoje é ${dia}`,
  hoy: 'Hoje',
  mesAnterior: 'Mês anterior',
  mesSiguiente: 'Próximo mês',
  anotarAlgo: 'Anotar algo',
  queMostrar: 'O que mostrar',
  todo: 'Tudo',
  marcado: 'Marcados',
  marcadoAMano: 'marcado à mão',
  mesVacio:
    'As visitas técnicas e as entregas aparecem sozinhas quando você registra uma consulta ou um projeto, e os vencimentos quando você define o dia de pagamento de uma conta em Caixinhas. O que você compra ou faz na marcenaria é você quem anota.',
  elMesEstaVacio: 'O mês está vazio',
  nadaEnElMes: 'Ainda não há nada no mês',
  anotarLoPrimero: 'Anotar a primeira coisa',
  diasAnteriores: 'Dias anteriores',
  anotarAlgoPara: (dia) => `Anotar algo para ${dia}`,
  anotar: 'Anotar',
  verElDia: (dia) => `Ver ${dia}`,
  nadaAnotado: 'Nada anotado para este dia',
  hastaAca: (mes) =>
    `Isso é tudo de ${mes}. Com as setas lá em cima você passa para o próximo mês.`,
  elDia: (dia) => dia,
} satisfies Mensajes['paginaAgenda'];

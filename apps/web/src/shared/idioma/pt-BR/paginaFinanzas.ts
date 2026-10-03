import type { Mensajes } from '../es';

export const paginaFinanzas = {
  titulo: 'Finanças',
  cargarMovimiento: 'Registrar movimentação',
  contra: (actual, previo) => `${actual} vs. ${previo}`,
  verMasEnEstadisticas: 'Ver mais em Estatísticas',
  todos: 'Todas',
  sentidos: {
    todos: 'Tudo',
    entra: 'Entradas',
    sale: 'Saídas',
    mueve: 'Entre caixinhas',
  },
  buscarEnElLibro: 'Buscar nas movimentações',
  buscarPorLoQueAnotaste: 'Busque pelo que você anotou',
  mes: 'Mês',
  mesYAnio: (mes, anio) => `${mes} de ${anio}`,
  todosLosMeses: 'Todos os meses',
  nadaConEsosFiltros: 'Nada com esses filtros',
  probaConOtroMes: 'Tente outro mês ou limpe os filtros.',
  limpiarLosFiltros: 'Limpar filtros',
  todaviaNoHayMovimientos: 'Ainda não há movimentações',
  cargaElPrimerGasto:
    'Registre a primeira despesa ou receita. Os recebimentos e as compras de cada projeto são registrados automaticamente pelo projeto.',
  cargarElPrimero: 'Registrar a primeira',
} satisfies Mensajes['paginaFinanzas'];

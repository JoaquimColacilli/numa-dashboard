import type { Mensajes } from '../es';

export const paginaFinanzas = {
  titulo: 'Finances',
  cargarMovimiento: 'Add transaction',
  contra: (actual, previo) => `${actual} vs. ${previo}`,
  verMasEnEstadisticas: 'See more in Stats',
  todos: 'All',
  sentidos: {
    todos: 'Everything',
    entra: 'Money in',
    sale: 'Money out',
    mueve: 'Between buckets',
  },
  buscarEnElLibro: 'Search transactions',
  buscarPorLoQueAnotaste: 'Search what you wrote down',
  mes: 'Month',
  mesYAnio: (mes, anio) => `${mes} ${anio}`,
  todosLosMeses: 'All months',
  nadaConEsosFiltros: 'Nothing matches these filters',
  probaConOtroMes: 'Try another month or clear the filters.',
  limpiarLosFiltros: 'Clear filters',
  todaviaNoHayMovimientos: 'No transactions yet',
  cargaElPrimerGasto:
    'Add your first expense or income. Payments and purchases for each job are recorded automatically from the job.',
  cargarElPrimero: 'Add the first one',
} satisfies Mensajes['paginaFinanzas'];

function dias(valor: number, numero: string): string {
  return Math.abs(valor) === 1 ? `${numero} día` : `${numero} días`;
}

function trabajos(cantidad: number): string {
  return cantidad === 1 ? '1 trabajo' : `${String(cantidad)} trabajos`;
}

export const paginaAnalitico = {
  volver: 'Historial',
  titulo: 'Analítico de entregas',
  bajada:
    'Qué tan cerca quedás de la fecha que estimás y cuánto tardás en cada tipo de mueble. No te muestra cuentas que los datos todavía no sostienen.',
  vacio: {
    titulo: 'Todavía no hay entregas para comparar',
    detalle:
      'Cuando entregues un trabajo con su fecha estimada, acá vas a ver qué tan cerca quedaste y cuánto tardás en cada tipo de proyecto.',
  },
  dias,
  diasDespues: (valor: number, numero: string) => `${dias(valor, numero)} después`,
  diasAntes: (valor: number, numero: string) => `${dias(valor, numero)} antes`,
  elMismoDia: 'el mismo día',
  trabajos,
  sinDatos: 'Sin datos todavía',
  sinFechaEstimada: 'Sin fecha estimada para comparar',
  enLaMediana: (desvio: string) => `${desvio} en la mediana`,
  medianaDeLosDias: (mediana: string, minimo: string, maximo: string) =>
    `${mediana} en la mediana, de ${minimo} a ${maximo}`,
  variosDias: (lista: string) => `${lista} días`,
  precision: {
    titulo: 'Qué tan preciso sos estimando',
    bajada: 'La primera fecha estimada de cada trabajo contra el día en que lo entregaste.',
    sinEntregas: 'Todavía no entregaste ningún trabajo con una fecha estimada para comparar.',
    pocos: (cantidad: number) =>
      cantidad === 1
        ? 'Con un trabajo todavía son pocos para sacar una cuenta: miralos uno por uno.'
        : `Con ${String(cantidad)} trabajos todavía son pocos para sacar una cuenta: miralos uno por uno.`,
    elMismoDia: 'Entregás, en la mediana, el mismo día que estimaste.',
    despues: (valor: number, numero: string) =>
      `Entregás, en la mediana, ${dias(valor, numero)} después de lo estimado.`,
    antes: (valor: number, numero: string) =>
      `Entregás, en la mediana, ${dias(valor, numero)} antes de lo estimado.`,
    extremos: (adelantado: string, atrasado: string) =>
      `El más adelantado, ${adelantado}; el más atrasado, ${atrasado}.`,
    aciertos: (acertados: string, total: string) => `Acertaste ${acertados} de ${total}.`,
    aciertosConPorcentaje: (acertados: string, total: string, porcentaje: string) =>
      `Acertaste ${acertados} de ${total} (${porcentaje}%).`,
    acertarEs: (margen: number) =>
      `Acertar es entregar hasta ${String(margen)} días antes o después.`,
    cumplidas: (cumplidas: string, total: string) =>
      `Cumpliste ${cumplidas} de ${total} fechas comprometidas.`,
    cumplidasConPorcentaje: (cumplidas: string, total: string, porcentaje: string) =>
      `Cumpliste ${cumplidas} de ${total} fechas comprometidas (${porcentaje}%).`,
    importadas: (cantidad: number) =>
      `En ${trabajos(cantidad)} la estimada es la que tenían cargada el día en que la app empezó a guardar la historia de las fechas, no necesariamente la primera que diste.`,
  },
  porTipo: {
    titulo: 'Cuánto tardás por tipo de proyecto',
    bajada: (umbral: number) =>
      `Con menos de ${String(umbral)} trabajos de un tipo ves cada caso; desde ahí, la mediana.`,
    ninguno:
      'Ningún trabajo entregado tiene el tipo de proyecto. Ponéselo en la ficha, con «Editar», y acá los vas a ver agrupados.',
    sinTipo: (cantidad: number) =>
      `${trabajos(cantidad)} sin tipo: ponéselo en su ficha para que cuenten acá.`,
    delArranqueALaEntrega: 'Del arranque a la entrega',
    delArranqueAListo: 'Del arranque a listo',
    contraLoEstimado: 'Contra lo estimado',
  },
  porCarga: {
    titulo: 'Según cuántos trabajos tenías en curso',
    bajada:
      'Del arranque a la entrega, según cuántos otros trabajos había en el taller cuando lo aprobaste.',
    entre: (desde: string, hasta: string) => `${desde} o ${hasta} en curso`,
    oMas: (desde: string) => `${desde} o más en curso`,
  },
  trabajoPorTrabajo: {
    titulo: 'Trabajo por trabajo',
    bajada: (cantidad: number) => `${trabajos(cantidad)} entregados, del más nuevo al más viejo.`,
    esconder: 'Esconder los números',
    ver: 'Ver los números',
    sinTipo: 'Sin tipo',
    estimada: 'Estimada',
    sinFecha: 'Sin fecha',
    entregado: 'Entregado',
    entregadoConDesvio: (fecha: string, desvio: string) => `${fecha}, ${desvio}`,
    comprometida: 'Comprometida',
    cumplida: (fecha: string) => `${fecha}, cumplida`,
    noCumplida: (fecha: string) => `${fecha}, no`,
    tardo: 'Tardó',
    sinDiaDeEntrega: (cantidad: number) =>
      `${trabajos(cantidad)} entregados sin el día de la entrega cargado no entran en la cuenta.`,
  },
} as const;

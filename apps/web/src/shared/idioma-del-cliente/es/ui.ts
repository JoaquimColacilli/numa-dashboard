export const ui = {
  hoja: {
    cerrar: 'Cerrar',
    cerrarSinGuardar: '¿Cerrar sin guardar?',
    seVaAPerder: 'Lo que cargaste todavía no se guardó, y si cerrás se pierde.',
    seguirEditando: 'Seguir editando',
    descartar: 'Descartar',
  },
  copiar: {
    copiar: 'Copiar',
    copiado: 'Copiado',
    seleccionado: 'Quedó seleccionado: mantené apretado y elegí Copiar',
    noSePudo: 'No se pudo copiar. Marcalo con el dedo y copialo desde el menú del teléfono.',
  },
  rotulo: {
    etiqueta: 'Rótulo del presupuesto',
    presupuesto: 'Presupuesto',
    numero: (numero: string) => `Nº ${numero}`,
    sinNumero: 'Sin número todavía',
    revision: 'Rev.',
    emitido: 'Emitido',
    opcion: 'Opción',
    aceptado: 'Aceptado',
    valeHasta: 'Vale hasta',
    sinVencimiento: 'Sin vencimiento',
    vencio: 'Venció',
  },
  visor: {
    anterior: 'Anterior',
    siguiente: 'Siguiente',
    abrirAparte: 'Abrir en otra pestaña',
    cuenta: (actual: string, total: string) => `${actual} de ${total}`,
  },
} as const;

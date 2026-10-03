export const presupuesto = {
  titulo: 'El presupuesto',
  elQueAceptaste: 'El presupuesto que aceptaste',
  borrador: 'Borrador',
  verElDetalle: 'Ver el detalle',
  vencido: {
    cuando: (fecha: string) => `Venció el ${fecha}.`,
    queHacer: 'Escribile al taller para actualizarlo.',
  },
  queCambio: (revision: number) => `Qué cambió en la revisión ${String(revision)}`,
  secciones: {
    detalle: 'Detalle',
    herrajes: 'Herrajes',
    aTenerEnCuenta: 'A tener en cuenta',
    incluye: 'Incluye',
    valores: 'Valores',
    avisos: 'Avisos',
    condiciones: 'Condiciones',
    garantia: 'Garantía',
  },
  valores: {
    total: 'Total',
    opcion: (letra: string) => `Opción ${letra}`,
    sena: (porcentaje: string) => `Seña (${porcentaje}%)`,
    acordado: (monto: string) => `Acordado al aprobar: ${monto}`,
    yaPagaste: 'Ya pagaste',
    teFaltaParaLaSena: 'Te falta para la seña',
    laSenaEstaCubierta: 'La seña está cubierta',
    despuesElSaldo: 'Después, el saldo',
    elegiLaOpcion: 'Elegí la opción que prefieras y avisale al taller.',
    referencia: (pesos: string, dolar: string, fecha: string) =>
      `Son ${pesos} con el dólar a ${dolar}, el que vale para pagos del ${fecha}.`,
    referenciaConLaSena: (pesos: string, sena: string, dolar: string, fecha: string) =>
      `Son ${pesos}, y la seña ${sena}, con el dólar a ${dolar}, el que vale para pagos del ${fecha}.`,
  },
  definiciones: {
    formaDePago: 'Forma de pago',
    moneda: 'Moneda',
    plazo: 'Plazo de fabricación',
    validez: 'Validez',
  },
  diasHabiles: (dias: number) => (dias === 1 ? '1 día hábil' : `${String(dias)} días hábiles`),
  validez: {
    vencio: (fecha: string) => `Venció el ${fecha}`,
    sinVencimiento: 'Sin vencimiento',
    hasta: (fecha: string) => `Hasta el ${fecha}`,
  },
  meses: (meses: number) => (meses === 1 ? '1 mes' : `${String(meses)} meses`),
  acciones: {
    descargar: 'Descargar el PDF',
    compartir: 'Compartir',
    compartirElPdf: 'Compartir el PDF',
    escribirle: 'Escribirle al taller',
    comoDejarLaSena: 'Cómo dejar la seña',
  },
  pdf: {
    preparando: 'Preparando el PDF…',
    listo: 'El PDF está listo.',
    noSePudo: 'No pudimos armar el PDF. Tocá de nuevo para probar otra vez.',
  },
  mensajeAlTaller: {
    numero: (numero: string) => `Hola, te escribo por el presupuesto Nº ${numero}.`,
    conRevision: (numero: string, revision: number) =>
      `Hola, te escribo por el presupuesto Nº ${numero} Rev. ${String(revision)}.`,
  },
} as const;

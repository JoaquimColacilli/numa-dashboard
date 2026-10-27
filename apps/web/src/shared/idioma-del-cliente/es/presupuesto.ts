export const presupuesto = {
  titulo: 'El presupuesto',
  tituloDelEstimativo: 'Presupuesto estimativo',
  esUnNumeroEstimado:
    'Es un número estimado: el presupuesto final sale después del relevamiento técnico.',
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
    entrega: 'Entrega estimada',
    senaAntesDel: 'Seña antes del',
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
  aprobar: {
    aprobarEstaOpcion: 'Aprobar esta opción',
    aprobar: 'Aprobar',
    tituloDeLaOpcion: (letra: string) => `Aprobar la opción ${letra}`,
    tituloDelPresupuesto: 'Aprobar el presupuesto',
    tituloDelEstimativo: 'Aprobar el estimativo',
    loQueAprobas: 'Lo que aprobás',
    queDia: '¿Qué día te queda bien para que vayamos a medir?',
    queHorario: '¿En qué horario?',
    franjas: {
      manana: 'A la mañana',
      tarde: 'A la tarde',
      me_da_igual: 'Me da igual',
    },
    algoQueTengamosQueSaber: 'Algo que tengamos que saber',
    opcional: '(opcional)',
    loLee: (taller: string) => `Lo que escribas acá lo lee ${taller} para coordinar la visita.`,
    contador: (usados: number, maximo: number) => `${String(usados)} de ${String(maximo)}`,
    cancelar: 'Cancelar',
    mandando: 'Mandando…',
    aprobasteLaOpcion: (letra: string, fecha: string) =>
      `Aprobaste la opción ${letra} el ${fecha}.`,
    loAprobaste: (fecha: string) => `Lo aprobaste el ${fecha}.`,
    propusiste: {
      manana: (dia: string, taller: string) =>
        `Propusiste el ${dia}, a la mañana, para medir. ${taller} te va a escribir para confirmarlo.`,
      tarde: (dia: string, taller: string) =>
        `Propusiste el ${dia}, a la tarde, para medir. ${taller} te va a escribir para confirmarlo.`,
      me_da_igual: (dia: string, taller: string) =>
        `Propusiste el ${dia} para medir. ${taller} te va a escribir para confirmarlo.`,
    },
    laSenaVaAntesDel: (fecha: string) =>
      `Para confirmar los plazos, la seña va antes del ${fecha}.`,
    comoPagar: 'Cómo pagar',
    estoLeAvisa:
      'Esto le avisa al taller lo que elegiste. El presupuesto queda confirmado con la seña.',
    estoLeAvisaDelEstimativo: 'Esto le avisa al taller lo que elegiste.',
    teEquivocaste: (taller: string) => `¿Te equivocaste? Escribile a ${taller}`,
    motivos: {
      forma: 'La página mandó algo que no esperábamos. Recargala y probá de nuevo.',
      opcion: 'Esa opción ya no está en el presupuesto. Recargá la página.',
      dia: 'Elegí el día que te queda bien para que vayamos a medir.',
      fuera: 'Ese día ya no se puede elegir. Elegí otro.',
      franja: 'Elegí a la mañana, a la tarde o me da igual.',
      largo: 'Lo que escribiste pasa de los 300 caracteres.',
      revision: 'El taller te mandó una revisión nueva. Recargá la página para verla.',
      respondida: 'Este presupuesto ya tiene tu respuesta. Recargá la página.',
      'sin-senal':
        'No se pudo mandar: se cortó la conexión. Lo que elegiste sigue acá; probá de nuevo cuando vuelva la señal.',
      'no-se-pudo': 'No pudimos mandarlo. Probá de nuevo en un rato.',
    },
  },
  mensajeAlTaller: {
    numero: (numero: string) => `Hola, te escribo por el presupuesto Nº ${numero}.`,
    conRevision: (numero: string, revision: number) =>
      `Hola, te escribo por el presupuesto Nº ${numero} Rev. ${String(revision)}.`,
  },
} as const;

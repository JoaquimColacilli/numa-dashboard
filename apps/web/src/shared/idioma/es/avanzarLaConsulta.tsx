import type { Envoltorio } from '@/shared/lib';

export const avanzarLaConsulta = {
  conceptos: {
    senaDeLaVisita: 'Seña de la visita',
    senaAlAprobar: 'Seña',
  },
  avance: {
    queFalta: 'Qué falta',
    etapa: 'Etapa',
  },
  tareas: {
    paraElPresupuesto: 'Para el presupuesto',
    hechasDe: (hechas: string, total: string) => `${hechas} de ${total}`,
  },
  paso: {
    queDiaFuiste: 'Qué día fuiste',
    entregarElPresupuestoAntesDel: 'Entregar el presupuesto antes del',
    ayudaDelVencimiento:
      'Una semana de trabajo desde la visita. Cambiala si lo prometiste para otro día.',
    cuantoTePagoLaVisita: 'Cuánto te pagó la visita',
    opcional: 'Opcional',
    ayudaDelPagoDeLaVisita:
      'Si no te la pagó, lo que sigue es un estimativo. Igual podés presupuestar.',
    anotarElRelevamiento: 'Anotar el relevamiento',
    todaviaNo: 'Todavía no',
    cuantoPresupuestaste: 'Cuánto presupuestaste',
    ayudaDelPresupuesto: 'Si lo dejás vacío, lo cargás cuando lo apruebe.',
    marcarComoEnviado: 'Marcar como enviado',
    cuantoTePago: 'Cuánto te pagó',
    ayudaDelPago: 'Si todavía no te pagó y vas a presupuestar igual, dejalo vacío.',
    queDiaTePago: 'Qué día te pagó',
    pasarAPresupuestar: 'Pasar a presupuestar',
    errores: {
      sinDia: 'Poné el día que fuiste a relevar.',
      diaQueNoLlego:
        'Ese día todavía no llegó. Si la visita es más adelante, cambiá la fecha con Editar.',
    },
  },
  contacto: {
    titulo: {
      nuevo: 'Cargar contacto',
      editar: 'Editar el contacto',
    },
    telefono: 'Teléfono',
    ayudaDelTelefono: 'Queda en el cliente: es el que usan Llamar y WhatsApp.',
    quePide: 'Qué pide',
    ejemploDeQuePide: 'Placard, cocina, biblioteca…',
    visita: {
      relevada: 'Día que fuiste a relevar',
      agendada: 'Visita',
    },
    ayudaDeLaVisita: 'Si ya fuiste, queda a presupuestar; si es más adelante, queda agendada.',
    horaDeLaVisita: 'Hora de la visita',
    ayudaDeLaHora: 'Opcional. Con hora, la visita cae en su renglón del día en la agenda.',
    senaCobrada: 'Seña cobrada',
    variosPagos: (cantidad: number) =>
      `Son ${String(cantidad)} pagos: se corrigen desde el detalle del trabajo.`,
    ayudaDeLaSena: 'Lo que te dejó en la visita. Entra a la caja del taller.',
    ayudaDeLaSenaEnDolares: 'Lo que te dejó en la visita.',
    diaDeLaSena: 'Día de la seña',
    ayudaDelDiaDeLaSena: 'El de la visita si ya fue, y si no, hoy. Cambialo si te la dio otro día.',
    yaFuiARelevar: 'Ya fui a relevar',
    ayudaDeYaFui:
      'En la agenda la visita queda tachada. Si no fuiste, destildala y vuelve a quedar pendiente.',
    entregarElPresupuestoAntesDel: 'Entregar el presupuesto antes del',
    ayudaDelVencimientoAPresupuestar:
      'Sale en la agenda hasta que lo mandes. Si cambiás el día del relevamiento se corre sola, salvo que la hayas puesto a mano.',
    ayudaDelVencimiento: 'Sale en la agenda hasta que marques que lo mandaste.',
    valeHasta: 'El presupuesto vale hasta',
    ayudaDeValeHasta:
      'Tu cliente lo ve en su página: si deja la seña antes de ese día, le dice para cuándo podría estar listo. Pasado el día, le dice que venció. Sin fecha, no le promete ninguna.',
    notas: 'Notas',
    ejemploDeNotas: 'Lo que te dijo por teléfono, medidas, cómo llegar…',
    cancelar: 'Cancelar',
    guardar: {
      nuevo: 'Guardar contacto',
      editar: 'Guardar los cambios',
    },
    errores: {
      cliente: 'Elegí un cliente, o escribí su nombre para crearlo.',
      titulo: 'Contá qué pide, aunque sea en dos palabras.',
      largo: (caracteres: number) => `No puede pasar de ${String(caracteres)} caracteres.`,
      notas: 'Las notas son demasiado largas.',
    },
  },
  pasaje: {
    volverSinAprobar: 'Volver sin aprobar',
    consultas: 'Consultas',
    activos: 'Activos',
    titulo: (trabajo: string) => `Pasar «${trabajo}» a Proyectos`,
    bajada:
      'Lo aprobó: ahora sí van los datos de la obra. Lo que ya cobraste no se vuelve a cargar, sigue siendo el mismo pago.',
    queOpcionAprobo: 'Qué opción aprobó',
    opcionSinDetalle: 'Opción sin detalle',
    corregirLaOpcion: (Enlace: Envoltorio) => (
      <>
        El presupuesto del trabajo es el importe de la que elijas. Si aprobó otro importe,{' '}
        <Enlace>corregí la opción</Enlace> antes de pasarlo.
      </>
    ),
    presupuestoAprobado: 'Presupuesto aprobado',
    senaQueCobrasAhora: 'Seña que cobrás ahora',
    porcentajeDelPresupuesto: (porcentaje: string) => `${porcentaje}% del presupuesto`,
    senaCubierta:
      'Con lo que ya cobraste la seña está cubierta. Dejalo en blanco si hoy no cobrás nada más.',
    senaComoPago:
      'Entra como un pago del trabajo, con el día en que te la dieron y la forma de pago de acá. Si todavía no cobraste, dejalo en blanco.',
    diaEnQueEntroLaSena: 'Día en que entró la seña',
    yaCobradoAntes: 'Ya cobrado antes',
    cobradoEnTotal: 'Cobrado en total',
    saldoACobrar: 'Saldo a cobrar',
    gastosYaCargados: 'Gastos ya cargados',
    formaDePago: 'Forma de pago',
    fechaDeInicio: 'Fecha de inicio',
    entregaEstimada: 'Entrega estimada',
    ayudaDeLaEntrega: (dias: number) => `Calculada a ${String(dias)} días hábiles del inicio.`,
    ayudaDeLaEntregaDelPresupuesto: (dias: number) =>
      `Calculada a ${String(dias)} días hábiles del inicio, el plazo del presupuesto.`,
    direccionDeEntrega: 'Dirección de entrega',
    ejemploDeDireccion: 'Calle y número, localidad',
    comprobanteAEmitir: 'Comprobante a emitir',
    pasarAProyectos: 'Pasar a Proyectos',
    errores: {
      opcion: 'Elegí la opción que aprobó.',
      presupuesto: 'Poné el presupuesto que aprobó, en pesos.',
      presupuestoEnDolares: 'Poné el presupuesto que aprobó, en dólares.',
    },
    acordado: {
      noEstaEnElQueLeMandaste: 'Ese importe no está en el presupuesto que le mandaste.',
      noEstaEn: (numero: string) => `Ese importe no está en el presupuesto ${numero}.`,
      elQueLeMandasteDice: (importe: string) =>
        `En el presupuesto que le mandaste dice ${importe}.`,
      dice: (numero: string, importe: string) => `En el presupuesto ${numero} dice ${importe}.`,
      siLoApruebasAsi: (acordado: string) =>
        `Si lo aprobás así, su página, la ficha y el PDF suman «Acordado al aprobar: ${acordado}».`,
    },
  },
} as const;

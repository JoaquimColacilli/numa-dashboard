export const proyecto = {
  estados: {
    contacto: 'Contacto',
    presupuesto_estimativo: 'Estimativo enviado',
    relevamiento: 'Relevamiento',
    a_presupuestar: 'A presupuestar',
    presupuesto_enviado: 'Presupuesto enviado',
    en_seguimiento: 'En seguimiento',
    perdido: 'Perdido',
    en_curso: 'En curso',
    entregado: 'Entregado',
    cobrado: 'Cobrado',
  },
  formasDePago: {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    cuotas: 'En cuotas',
    mixto: 'Mixto',
  },
  comprobantes: {
    factura_a: 'Factura A',
    factura_b: 'Factura B',
    factura_c: 'Factura C',
    remito: 'Remito',
    sin_comprobante: 'Sin comprobante',
  },
  etapas: {
    consultas: 'Consultas',
    seguimiento: 'Seguimiento',
    activos: 'Activos',
    historial: 'Historial',
  },
  orden: {
    cliente: 'Cliente',
    trabajo: 'Trabajo',
    presupuesto: 'Presupuesto',
    cobrado: 'Cobrado',
    saldo: 'Saldo',
    entrega: 'Entrega',
    estado: 'Estado',
  },
  cambios: {
    volverAContacto: 'Volver a contacto',
    mandeUnEstimativo: 'Mandé un estimativo',
    pasarARelevamiento: 'Pasar a relevamiento',
    pasarAPresupuestar: 'Pasar a presupuestar',
    mandeElPresupuesto: 'Mandé el presupuesto',
    volvioAPresupuesto: 'Volvió a presupuesto',
    yaLoAprobo: 'Ya lo aprobó',
    volvioAlTaller: 'Volvió al taller',
    porAhoraNo: 'Por ahora no',
    yaLoEntregue: 'Ya lo entregué',
  },
  cobro: {
    instancias: {
      sena: 'La seña',
      saldo: 'El saldo',
    },
    formas: {
      transferencia: 'Transferencia',
      efectivo: 'Efectivo',
    },
  },
  consultas: {
    irARelevarEl: (fecha: string) => `Ir a relevar el ${fecha}`,
    visitaDentroDe: (cuando: string) => `Visita ${cuando}`,
    irARelevarHoy: 'Ir a relevar hoy',
    laVisitaEsHoy: 'La visita es hoy',
    estimativoEnviadoHoy: 'Estimativo enviado hoy',
    estimativoSinRespuesta: (cuando: string) => `Estimativo enviado ${cuando}, sin respuesta`,
    siAvanzaFaltaAgendar: 'Si avanza, falta agendar la visita',
    yaPagoLaVisita: 'Ya pagó la visita: falta presupuestar',
    faltaQueApruebeElEstimativo: 'Falta que apruebe el estimativo y pague la visita',
    faltaPonerleFecha: 'Falta ponerle fecha a la visita',
    relevamientoSinFecha: (cuando: string) => `Relevamiento desde ${cuando}, sin fecha de visita`,
    faltaPasarLoRelevado: 'Falta pasar lo relevado a presupuestar',
    laVisitaFue: (cuando: string) => `La visita fue ${cuando}`,
    aPresupuestarDesde: (cuando: string) => `A presupuestar desde ${cuando}`,
    yaEstaArmado: 'Ya está armado: falta mandar el presupuesto',
    faltaPresupuestarConTareas: (hechas: number, total: number) =>
      `Falta presupuestar: ${String(hechas)} de ${String(total)} tareas hechas`,
    faltaPresupuestar: 'Falta presupuestar',
    faltaElEstimativo: 'Falta el estimativo: la visita no está cobrada',
    vencioElPresupuesto: 'Venció el presupuesto: actualizalo o cambiale la fecha',
    valiaHasta: (fecha: string) => `Valía hasta el ${fecha}`,
    faltaLlamar: 'Falta llamar para saber',
    presupuestoEnviadoHoy: 'Presupuesto enviado hoy',
    presupuestoSinRespuesta: (cuando: string) => `Presupuesto enviado ${cuando}, sin respuesta`,
    faltaAgendarLaVisita: 'Falta agendar la visita',
    contactoSinVisita: (cuando: string) => `Contacto desde ${cuando}, sin visita agendada`,
    pasos: {
      yaLoAprobo: 'Ya lo aprobó',
      yaFuiARelevar: 'Ya fui a relevar',
      mandeElPresupuesto: 'Mandé el presupuesto',
      agendarLaVisita: 'Agendar la visita',
      mandeUnEstimativo: 'Mandé un estimativo',
      mandeElEstimativo: 'Mandé el estimativo',
      pasarAPresupuestar: 'Pasar a presupuestar',
      loAproboPasarAProyectos: 'Lo aprobó: pasar a Proyectos',
      seguirArmandolo: 'Seguir armándolo',
      armarElPresupuesto: 'Armar el presupuesto',
    },
  },
  corte: {
    sinCorte: (mes: string) =>
      `${mes} todavía no se cortó. Cuando cierres un trabajo, acá vas a ver a dónde va cada peso.`,
    sinNadaCobrado: (trabajos: number, mes: string) =>
      trabajos === 1
        ? `Un trabajo cerrado en ${mes}, sin nada cobrado: no hubo nada para repartir.`
        : `${String(trabajos)} trabajos cerrados en ${mes}, sin nada cobrado: no hubo nada para repartir.`,
    sinIngreso: (trabajos: number, mes: string) =>
      trabajos === 1
        ? `Un trabajo cerrado en ${mes}, y los gastos se comieron lo cobrado: no quedó ingreso para repartir.`
        : `${String(trabajos)} trabajos cerrados en ${mes}, y los gastos se comieron lo cobrado: no quedó ingreso para repartir.`,
    repartido: (trabajos: number, mes: string, partes: string) =>
      trabajos === 1
        ? `Un trabajo cerrado en ${mes}: ${partes}.`
        : `${String(trabajos)} trabajos cerrados en ${mes}: ${partes}.`,
    repartidoConGastos: (trabajos: number, mes: string, partes: string) =>
      trabajos === 1
        ? `Un trabajo cerrado en ${mes}: ${partes}. Lo demás fueron gastos.`
        : `${String(trabajos)} trabajos cerrados en ${mes}: ${partes}. Lo demás fueron gastos.`,
    alHogar: (parte: string) => `${parte} al hogar`,
    alTaller: (parte: string) => `${parte} al taller`,
    alDiezmo: (parte: string) => `${parte} al diezmo`,
    aOtroTesoro: (parte: string, tesoro: string) => `${parte} a ${tesoro}`,
    menosDelUno: 'menos del 1%',
    gastos: 'Gastos',
  },
  tesoroSinNombre: 'Tesoro',
  costos: {
    madera: 'Madera',
    herrajes: 'Herrajes',
    flete: 'Flete',
    ayudante: 'Ayudante',
  },
  despiece: {
    clases: {
      sueldo: 'Sueldo',
      fijos: 'Gastos fijos',
      prioridad: 'Ahorro fijo',
    },
    topeDelMes: 'Tope del mes',
    diezmo: (porcentaje: string) => `Diezmo ${porcentaje}%`,
    diezmoSobreLoCobrado: (porcentaje: string) => `Diezmo ${porcentaje}% sobre lo que cobrás`,
    diezmoSobreElIngreso: (porcentaje: string) => `Diezmo ${porcentaje}% sobre el ingreso`,
    obligacion: (tesoro: string, porcentaje: string) => `${tesoro} ${porcentaje}%`,
    obligacionSobreLoCobrado: (tesoro: string, porcentaje: string) =>
      `${tesoro} ${porcentaje}% sobre lo que cobrás`,
    obligacionSobreElIngreso: (tesoro: string, porcentaje: string) =>
      `${tesoro} ${porcentaje}% sobre el ingreso`,
    deLoQueSobra: (porcentaje: string) => `${porcentaje}% de lo que sobra`,
    elResto: 'El resto',
  },
  distribucion: {
    titulo: 'Distribución del ingreso',
    grupos: {
      obligacion: 'Obligaciones',
      compromiso: 'Compromisos',
      ahorro: 'Ahorros',
      superavit: 'Superávit',
    },
    resto: 'Resto',
    aTesoro: (tesoro: string) => `a ${tesoro}`,
    detalle: (etiqueta: string, monto: string) => `${etiqueta}: ${monto}`,
    detalleATesoro: (etiqueta: string, tesoro: string, monto: string) =>
      `${etiqueta} a ${tesoro}: ${monto}`,
    faltan: (monto: string) => `faltan ${monto}`,
    cubierto: 'ya lo cubrieron otros cobros del mes',
    conSuSaldo: 'ya tiene su monto',
    llegaALaMeta: 'llegó a la meta',
    cobradosMenosGastos: (cobrado: string, gastos: string) =>
      `${cobrado} cobrados menos ${gastos} de gastos`,
    ingreso: 'Ingreso',
    sinCobrar:
      'Todavía no entró plata de este trabajo. Cuando se cobre, acá se ve cómo baja el ingreso por la fila de los tesoros.',
    sinIngreso:
      'Los gastos se comieron lo cobrado: no hay ingreso que repartir y la pérdida queda en la caja del taller.',
    proyeccion:
      'Proyección sobre lo cobrado hasta hoy, con la fila de los tesoros. El corte se hace efectivo cuando el proyecto se cobre.',
    provisoria:
      'Este reparto todavía no lo confirmó el servidor: es el que va a quedar si nada cambió del otro lado. Se confirma solo cuando vuelva la señal.',
  },
  entrega: {
    franjas: {
      manana: 'a la mañana',
      tarde: 'a la tarde',
    },
    conFranja: {
      manana: (dia: string) => `${dia}, a la mañana`,
      tarde: (dia: string) => `${dia}, a la tarde`,
    },
    vencida: (cuando: string) => `vencida ${cuando}`,
    venceHoy: 'vence hoy',
    venceManana: 'vence mañana',
    enDias: (dias: number) => `en ${String(dias)} días`,
    comprometida: 'comprometida',
    sinFecha: 'Sin fecha',
    conFranjaComprometida: (fecha: string) => `${fecha} · comprometida`,
  },
  formulario: {
    sinMonto: 'Poné cuánto, en pesos.',
    demasiadoLargo: (maximo: number) => `No puede pasar de ${String(maximo)} caracteres.`,
    sinFecha: 'Poné la fecha.',
    sinCliente: 'Elegí un cliente, o creá uno nuevo desde acá.',
    sinTitulo: 'Contá qué mueble es.',
    presupuestoNegativo: 'Revisá el presupuesto: va en pesos.',
    senaFueraDeRango: 'La seña va entre 0 y 100.',
  },
  insumos: {
    tallerPuso: (monto: string) => `El taller puso ${monto}.`,
  },
  liquidacion: {
    operaciones: {
      cobro: 'Cobro',
      cierre: 'Cierre como perdido',
      reapertura: 'Reapertura del cobro',
      reactivacion: 'Reactivación del presupuesto',
    },
    elRepartoSalioDistinto: 'El reparto salió distinto del que viste.',
    diferencia: (tesoro: string, esperado: string, quedo: string) =>
      `${tesoro}: esperabas ${esperado} y quedó en ${quedo}.`,
    diferenciaPorLoQueTenia: (tesoro: string, esperado: string, quedo: string, tenia: string) =>
      `${tesoro}: esperabas ${esperado} y quedó en ${quedo}, porque ya tenía ${tenia}.`,
    diferenciaPorElMes: (tesoro: string, esperado: string, quedo: string, llevaba: string) =>
      `${tesoro}: esperabas ${esperado} y quedó en ${quedo}, porque el mes ya llevaba ${llevaba} de otra liquidación.`,
    quedoEnElTaller: (quedo: string, esperado: string) =>
      `La diferencia quedó en el taller: ${quedo} en vez de ${esperado}.`,
    quedoEnElRemanente: (quedo: string, esperado: string) =>
      `La diferencia quedó en el remanente del taller: ${quedo} en vez de ${esperado}.`,
    escalones: {
      sueldo: 'Sueldo',
      fijos: 'Costos fijos',
    },
  },
  marca: {
    enPausa: {
      cobro: 'Cobrado, sin confirmar',
      cierre: 'Cerrado, sin confirmar',
      reapertura: 'Reabierto, sin confirmar',
      reactivacion: 'Reactivado, sin confirmar',
    },
    confirmando: {
      cobro: 'Confirmando el cobro…',
      cierre: 'Confirmando el cierre…',
      reapertura: 'Confirmando la reapertura…',
      reactivacion: 'Confirmando la reactivación…',
    },
    rechazado: 'El servidor lo rechazó',
  },
  listo: 'Listo',
  necesidades: {
    material: {
      titulo: 'Materiales necesarios',
      agregar: 'Agregar el material',
      campo: 'Qué material hace falta',
      cuantos: 'Cuántos materiales',
      placeholder: 'Placas de melamina, tablón, laca…',
      ayuda:
        'Lo que hay que comprar o encargar: cortes, tablones, pintura. La medida va en el nombre.',
      casilla: (necesidad: string) => `Listo: ${necesidad}`,
      cuantosListos: (listos: number, total: number) =>
        `${String(listos)} de ${String(total)} listos`,
    },
    herraje: {
      titulo: 'Herrajes necesarios',
      agregar: 'Agregar el herraje',
      campo: 'Qué herraje hace falta',
      cuantos: 'Cuántos herrajes',
      placeholder: 'Bisagras, pistones, tiradores…',
      ayuda: 'Lo que hay que pedir para este trabajo. La cantidad es opcional.',
      casilla: (necesidad: string) => `Listo: ${necesidad}`,
      cuantosListos: (listos: number, total: number) =>
        `${String(listos)} de ${String(total)} listos`,
    },
    herramienta: {
      titulo: 'Herramientas necesarias',
      agregar: 'Agregar la herramienta',
      campo: 'Qué herramienta hace falta',
      cuantos: 'Cuántas herramientas',
      placeholder: 'Sierra circular, lijadora de banda…',
      ayuda: 'Lo que hay que tener a mano el día que lo hagas. La cantidad es opcional.',
      casilla: (necesidad: string) => `Lista: ${necesidad}`,
      cuantosListos: (listos: number, total: number) =>
        `${String(listos)} de ${String(total)} listas`,
    },
  },
  obra: {
    faltaEntregarlo: 'Falta entregarlo',
    entregaComprometida: (fecha: string, cuando: string) =>
      `Entrega comprometida: ${fecha} (${cuando})`,
    faltaAcordarLaEntrega: 'Falta acordar la entrega',
    listoDesde: (fecha: string) => `Está listo desde el ${fecha}`,
    sinEntregaEstimada: 'Sin fecha de entrega estimada',
    entregaEstimada: (cuando: string) => `Entrega estimada: ${cuando}`,
    faltaCobrar: (saldo: string) => `Falta cobrar ${saldo}`,
    faltaCobrarloYRepartir: 'Falta cobrarlo y repartir',
    entregadoSinFecha: 'Entregado, sin fecha de entrega',
    entregadoEl: (fecha: string) => `Entregado el ${fecha}`,
  },
  clienteBorrado: 'Cliente borrado',
  resultadosDelContacto: {
    reactivado: 'Volvió a las consultas',
    perdido: 'Se dio por perdido',
    otra_fecha: 'Siguió en seguimiento con otra fecha',
  },
  tareas: {
    etiquetas: {
      presupuesto_diseno: 'Diseñar',
      presupuesto_despiece: 'Despiezar',
      presupuesto_cotizacion: 'Cotizar',
      presupuesto_pdf: 'Armar el presupuesto',
    },
    detalleDeCotizar: 'Madera y herrajes, flete, ayudante',
  },
  tiposDeArranque: {
    cocina: 'Cocina',
    placard: 'Placard',
    vestidor: 'Vestidor',
    vanitory: 'Vanitory',
    muebleDeTv: 'Mueble de TV',
    biblioteca: 'Biblioteca',
    escritorio: 'Escritorio',
  },
  sena: {
    titulo: 'Seña para confirmar',
    sinPresupuesto:
      'Todavía no hay presupuesto, así que no hay seña que calcular. Cargalo, o tildá la opción que te aprobaron.',
    delTrabajo: (porcentaje: string) => `${porcentaje}% del presupuesto, de este trabajo`,
    delTaller: (porcentaje: string) => `${porcentaje}% del presupuesto, del taller`,
    sena: 'Seña',
    cobrado: 'Cobrado',
    falta: 'Falta',
    nada: 'Nada',
    cubiertaDeMas: (deMas: string) => `La seña ya está cubierta, y cobraste ${deMas} de más.`,
    cubierta: 'La seña ya está cubierta.',
  },
  costosDeCotizar: {
    titulo: 'Costos estimados',
    ayuda:
      'Lo que calculás que vas a gastar. No toca el presupuesto: ese lo ponés vos, con el ingreso que querés que te deje.',
    cargadas: (cargadas: number, total: number) => `${String(cargadas)} de ${String(total)}`,
    sinEstimar: 'Sin estimar',
    costoEstimado: 'Costo estimado',
    sinPresupuesto: 'Cuando el trabajo tenga presupuesto, acá va lo que te queda.',
    presupuesto: 'Presupuesto',
    teQuedaSiTeLoAprueban: 'Te queda, si te lo aprueban',
    teQueda: 'Te queda',
    enContra: 'Estás estimando más gasto que presupuesto.',
  },
  liquidacionesSinConfirmar: {
    unProyecto: 'Un proyecto',
    cuentan: (liquidaciones: number) =>
      liquidaciones === 1
        ? 'Estos saldos cuentan una liquidación que el servidor todavía no confirmó:'
        : `Estos saldos cuentan ${String(liquidaciones)} liquidaciones que el servidor todavía no confirmó:`,
  },
} as const;

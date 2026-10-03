const cuenta = (cantidad: number, singular: string, varios: string): string =>
  `${String(cantidad)} ${cantidad === 1 ? singular : varios}`;

export const agenda = {
  categorias: {
    entrega: 'Entrega',
    presupuesto: 'Presupuesto',
    visita: 'Visita',
    seguimiento: 'Seguimiento',
    vencimiento: 'Vencimiento',
    materiales: 'Materiales',
    taller: 'Taller',
  },
  ayudaDeLaPropia: {
    materiales: 'comprar, encargar, retirar',
    taller: 'trabajo, mandados, cobros',
  },
  derivadas: {
    entrega: {
      accion: 'Entregar',
      nombre: (titulo: string): string => `Entregar: ${titulo}`,
      corto: (titulo: string): string => `Entrega: ${titulo}`,
      origen: 'Sale de la entrega estimada del proyecto.',
      abrir: 'Abrir el proyecto',
      abrirUno: (titulo: string): string => `Abrir el proyecto: ${titulo}`,
      hecha: 'entregada',
    },
    visita: {
      accion: 'Relevamiento',
      nombre: (titulo: string): string => `Relevamiento: ${titulo}`,
      corto: (titulo: string): string => `Relevamiento: ${titulo}`,
      origen: 'Sale de la fecha de visita del contacto.',
      abrir: 'Abrir el contacto',
      abrirUno: (titulo: string): string => `Abrir el contacto: ${titulo}`,
      hecha: 'ya fuiste',
    },
    presupuesto: {
      accion: 'Entregar presupuesto',
      nombre: (titulo: string): string => `Entregar presupuesto: ${titulo}`,
      corto: (titulo: string): string => `Presupuesto: ${titulo}`,
      origen: 'Sale de la fecha límite del presupuesto del contacto.',
      abrir: 'Abrir el contacto',
      abrirUno: (titulo: string): string => `Abrir el contacto: ${titulo}`,
      hecha: 'enviado',
    },
    seguimiento: {
      accion: 'Volver a escribirle a',
      nombre: (nombre: string): string => `Volver a escribirle a ${nombre}`,
      corto: (nombre: string): string => `Escribirle a ${nombre}`,
      origen: 'Sale del seguimiento del trabajo.',
      abrir: 'Abrir el seguimiento',
      abrirUno: (nombre: string): string => `Abrir el seguimiento: ${nombre}`,
      hecha: 'ya le escribiste',
    },
  },
  vencimiento: {
    accion: 'Vence',
    nombre: (renglon: string): string => `Vence: ${renglon}`,
    corto: (renglon: string): string => `Vence: ${renglon}`,
    origen: 'Sale del día de pago de un compromiso de la fila.',
    masAdelante: 'El pago se registra desde el mes en que vence.',
    hecha: 'pagado',
    pagado: 'Pagado',
    registrar: 'Registrar el pago',
    verEnTesoros: 'Ver en Tesoros',
    monto: (monto: string, tesoro: string): string => `${monto} de ${tesoro}`,
  },
  propiaHecha: 'hecha',
  estaComprometida: 'Está comprometida con el cliente. Para cambiarla, abrí el proyecto.',
  comoSeMueve: {
    seguimiento:
      'Cuando le escribas, registralo: ahí elegís si vuelve, si sigue con otra fecha o si no va.',
    arrastrando: 'Arrastrala en el mes para moverla, o cambiá la fecha ahí.',
    conLaFecha: 'Para moverla, cambiá la fecha ahí.',
  },
  franjas: {
    manana: 'a la mañana',
    tarde: 'a la tarde',
  },
  registrarElContacto: 'Registrar el contacto',
  marcarComoImportante: 'Marcar como importante',
  sacarLaMarca: 'Sacarle la marca de importante',
  borrar: (texto: string): string => `Borrar «${texto}»`,
  urgencia: {
    vencio: (cuando: string): string => `venció ${cuando}`,
    atrasada: (cuando: string): string => `atrasada, era ${cuando}`,
    hoy: 'es hoy',
    manana: 'es mañana',
  },
  etiquetasDelDia: {
    hoy: 'hoy',
    manana: 'mañana',
    ayer: 'ayer',
  },
  mesConAnio: (mes: string, anio: string): string => `${mes} ${anio}`,
  cuentas: {
    citas: (cantidad: number): string => cuenta(cantidad, 'cita', 'citas'),
    vencimientos: (cantidad: number): string => cuenta(cantidad, 'vencimiento', 'vencimientos'),
    anotaciones: (cantidad: number): string => cuenta(cantidad, 'anotación', 'anotaciones'),
    cosasAnotadas: (cantidad: number): string => cuenta(cantidad, 'cosa anotada', 'cosas anotadas'),
    hechas: (cantidad: number): string => cuenta(cantidad, 'hecha', 'hechas'),
    cosas: (cantidad: number): string => cuenta(cantidad, 'cosa', 'cosas'),
    cosasYHechas: (cosas: number, hechas: number): string =>
      `${cuenta(cosas, 'cosa', 'cosas')} y ${cuenta(hechas, 'hecha', 'hechas')}`,
  },
  nadaEnElMes: 'sin nada agendado',
  nadaEnElDia: 'Nada agendado',
  nadaAgendado: 'nada agendado',
  caminos: {
    explicacion:
      'Las visitas y las entregas no se anotan: salen del contacto y del proyecto, y aparecen solas en la agenda.',
    cargarUnaConsulta: 'Cargar una consulta',
    conLaVisita: 'con la visita ese día',
    cargarUnProyecto: 'Cargar un proyecto',
    conLaEntrega: 'con la entrega estimada ese día',
  },
  dia: {
    cerrar: 'Cerrar el día',
    libre: 'Este día está libre',
    libreDetalle:
      'No hay entregas ni visitas, y todavía no anotaste nada. Si tenés que comprar algo o dejar algo listo, anotalo.',
    anotar: 'Anotar algo para este día',
    todoElDia: 'Todo el día',
    nadaPendiente: 'No queda nada pendiente para este día.',
    pendienteDel: (dia: string): string => `Lo pendiente del ${dia}`,
    hecho: 'Hecho',
    nadaSinHora: 'Nada sin hora para este día.',
    soloElHorario: 'Ver solo el horario del taller',
    lasDemasHoras: 'Ver las demás horas',
  },
  grilla: {
    ayudaDelArrastre:
      'Se mueve a otro día arrastrándolo, o agarrándolo con la barra espaciadora, moviéndolo con las flechas y soltándolo con Enter. Escape lo deja donde estaba. También se cambia la fecha abriéndolo.',
    celda: (dia: string, cuenta: string): string => `${dia}: ${cuenta}`,
    celdaDeHoy: (dia: string, cuenta: string): string => `${dia}, hoy: ${cuenta}`,
    celdaMarcada: (dia: string, cuenta: string): string => `${dia}: ${cuenta}, con algo marcado`,
    celdaDeHoyMarcada: (dia: string, cuenta: string): string =>
      `${dia}, hoy: ${cuenta}, con algo marcado`,
    verTodas: (cantidad: number, dia: string): string =>
      `Ver las ${String(cantidad)} cosas del ${dia}`,
    mas: (cantidad: number): string => `+${String(cantidad)} más`,
  },
  tira: {
    diasDelMes: 'Días del mes',
    dia: (dia: string, cuenta: string): string => `${dia}, ${cuenta}`,
    diaMarcado: (dia: string, cuenta: string): string => `${dia}, ${cuenta}, con algo marcado`,
  },
  arrastre: {
    loDejaste: (dia: string): string => `Lo dejaste donde estaba, el ${dia}.`,
    moviste: (nombre: string, dia: string): string =>
      `Moviste ${nombre} al ${dia}. El aviso tiene Deshacer.`,
    agarrasteConTeclado: (nombre: string, dia: string): string =>
      `Agarraste ${nombre}, del ${dia}. Movelo con las flechas, soltalo con Enter y cancelá con Escape.`,
    agarraste: (nombre: string, dia: string): string => `Agarraste ${nombre}, del ${dia}.`,
    sobre: (nombre: string, dia: string): string => `${nombre}, sobre el ${dia}.`,
    sinDia: 'No hay día para ese lado.',
  },
} as const;

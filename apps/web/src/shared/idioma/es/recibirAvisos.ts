export const recibirAvisos = {
  noElegisteNada: 'No elegiste nada en el aviso del sistema. Cuando quieras, tocá de nuevo.',
  elNavegadorNoDejoPedir: 'El navegador no dejó pedir el permiso. Probá de nuevo.',
  elNavegadorNoPudoAnotarse:
    'El navegador no pudo anotarse en su servicio de avisos. Si estás sin señal, probá cuando vuelva.',
  sinSenalParaActivar: 'Sin señal no se pueden activar los avisos. Probá cuando vuelva.',
  sinSenalParaApagar:
    'Sin señal no se pueden apagar los avisos: este dispositivo los sigue recibiendo. Probá cuando vuelva.',
  queAvisa: {
    entregas: {
      etiqueta: 'Entregas',
      detalle: 'La entrega de cada proyecto en curso: la comprometida, o si no hay, la estimada',
    },
    visitas: {
      etiqueta: 'Visitas y relevamientos',
      detalle: 'Las visitas que tenés agendadas en las consultas',
    },
    presupuestos: {
      etiqueta: 'Presupuestos por vencer',
      detalle: 'La fecha límite para entregar un presupuesto',
    },
    seguimientos: {
      etiqueta: 'Volver a escribirle',
      detalle: 'A quién de los que están en seguimiento le toca un mensaje tuyo',
    },
    vencimientos: {
      etiqueta: 'Vencimientos',
      detalle: 'El día de pago de cada compromiso que todavía no pagaste',
    },
    anotaciones: {
      etiqueta: 'Mis anotaciones',
      detalle: 'Lo que anotás vos: materiales, trabajo de taller',
    },
  },
  laMananaDelDia: 'la mañana del día',
  elDiaAnterior: 'el día anterior',
  diasAntes: ({ dias }: { dias: number }) => `${String(dias)} días antes`,
  todaviaNoSalioNinguno: 'Todavía no salió ninguno.',
  salioHoy: ({ hora }: { hora: string }) => `El último salió hoy a las ${hora}.`,
  salioAyer: ({ hora }: { hora: string }) => `El último salió ayer a las ${hora}.`,
  salioElDia: ({ fecha, hora }: { fecha: string; hora: string }) =>
    `El último salió el ${fecha} a las ${hora}.`,
  tambienLlegan: ({ otros }: { otros: number }): string =>
    otros === 1
      ? 'También llegan a otro dispositivo tuyo.'
      : `También llegan a otros ${String(otros)} dispositivos tuyos.`,
  elServidorTodaviaNoPuede: 'El servidor todavía no puede mandar avisos.',
  teMandamosUnaPrueba: 'Te mandamos un aviso de prueba: tiene que llegar en unos segundos.',
  loSacamosDeLaLista:
    'Este dispositivo ya no recibía avisos y lo sacamos de la lista. Activalos de nuevo.',
  elServicioNoRespondio: 'El servicio de avisos no respondió. Probá de nuevo en un rato.',
  pasosEnElIphone: {
    compartir: 'Tocá el botón de compartir, abajo en el medio.',
    agregarAInicio: 'Elegí «Agregar a inicio».',
    abrirDesdeElIcono: 'Abrí NUMA desde el ícono nuevo.',
  },
  pasosEnLaApp: {
    abrirLosAjustes: 'Abrí los ajustes del teléfono.',
    buscarNuma: 'Buscá NUMA en la lista de apps.',
    permitir: 'Activá «Permitir notificaciones» y volvé acá.',
  },
  pasosEnElNavegador: {
    tocarElIcono: 'Tocá el ícono que está a la izquierda de la dirección de la página.',
    buscarNotificaciones: 'Buscá «Notificaciones» y ponelo en permitir.',
    volver: 'Volvé acá y tocá «Ya lo habilité».',
  },
  eligeDondeVivis: 'Elegí dónde vivís para activar los avisos.',
  todaviaFiguraBloqueado: 'Todavía figura bloqueado. Revisá los pasos y volvé a tocar.',
  zonas: {
    argentina: 'Argentina',
    cordoba: 'Córdoba',
    uruguay: 'Uruguay',
    chile: 'Chile',
    bolivia: 'Bolivia',
    espana: 'España',
  },
  zonaConDesfase: ({ lugar, desfase }: { lugar: string; desfase: string }) =>
    `${lugar} (${desfase})`,
  activados: 'Avisos activados en este dispositivo.',
  yaNoRecibe: 'Este dispositivo ya no recibe avisos.',
  cambiosGuardados: 'Cambios de los avisos guardados.',
  sinSenalNoSeGuardan:
    'Sin señal no se guardan los avisos: el cambio no quedó. Probá cuando vuelva.',
  noSeGuardoElCambio: 'No se guardó el cambio de los avisos. Probá de nuevo.',
  sinSenalParaLaPrueba: 'Sin señal no se puede mandar la prueba.',
  noSePudoMandarLaPrueba: 'No se pudo mandar la prueba. Probá de nuevo en un rato.',
  queTeAviseALaManana: 'Que te avise a la mañana',
  aLasTeLlega: ({ hora }: { hora: string }) =>
    `A las ${hora} te llega un aviso con las entregas, las visitas y los presupuestos que vencen. Podés elegir qué te avisa y con cuánta anticipación después de activarlo.`,
  dondeVivis: '¿Dónde vivís?',
  elAvisoLoMandaUnServidor:
    'El aviso lo manda un servidor, no tu teléfono, así que necesita saber en qué zona horaria estás para mandarlo a la hora que elegiste.',
  eligeTuZonaHoraria: 'Elegí tu zona horaria',
  activando: 'Activando…',
  activarLosAvisos: 'Activar los avisos',
  elSistemaTeVaAPreguntar:
    'El sistema te va a preguntar si los permitís. Si decís que no, después hay que habilitarlo a mano.',
  leyendoTusAvisos: 'Leyendo tus avisos…',
  sinSenalNoPodemosLeer: 'Sin señal no podemos leer tus avisos',
  noPudimosLeerTuConfiguracion: 'No pudimos leer tu configuración de avisos',
  losActivosSiguenAndando:
    'Los avisos que ya estaban activos siguen andando. Lo que no pudimos traer son tus preferencias para mostrarlas acá.',
  reintentar: 'Reintentar',
  todaviaNoEstanListos: 'Los avisos todavía no están listos',
  faltanLasClaves:
    'El servidor no tiene cargadas las claves para mandar avisos, así que por ahora no se pueden activar en ningún dispositivo. No es algo que se arregle desde esta pantalla.',
  mientrasTanto: 'Mientras tanto, la agenda sigue mostrando todo.',
  primeroAgregaNuma: 'Primero agregá NUMA a la pantalla de inicio',
  enElIphoneSoloLlegan:
    'En el iPhone, los avisos solo llegan si la app está agregada a la pantalla de inicio. No es un paso nuestro: es un requisito del sistema. Son treinta segundos y además abre más rápido.',
  iphoneEnSafari: 'iPhone, en Safari',
  cuandoLaAbras: 'Cuando la abras desde el ícono, volvé acá y vas a poder activar los avisos.',
  esteNavegadorNoPuede: 'Este navegador no puede recibir avisos',
  paraRecibirlos:
    'Para recibirlos, abrí NUMA en Chrome, Edge o Firefox. Mientras tanto, la agenda sigue mostrando todo.',
  estanBloqueados: 'Los avisos están bloqueados',
  leDijisteQueNo:
    'Le dijiste que no al permiso, y desde la app no se puede volver a preguntar: lo decide el sistema. Se habilita a mano en dos toques.',
  yaLoHabilite: 'Ya lo habilité',
  esUnRecordatorio:
    'Es un recordatorio, no una alarma. El servicio que los manda puede saltear un aviso sin decirte nada, sobre todo si el teléfono está sin señal, y si la app pasa una semana sin usarse el servidor se pausa y los avisos dejan de salir. Para lo que no se puede perder, abrí la agenda: ahí está todo, siempre.',
  activosEnEsteDispositivo: 'Avisos activos en este dispositivo.',
  probar: 'Probar',
  queTeAvisa: 'Qué te avisa',
  anticipacionDe: ({ aviso }: { aviso: string }) => `Anticipación de ${aviso}`,
  aQueHora: 'A qué hora',
  otraHora: 'Otra hora',
  enEsteDispositivo: 'En este dispositivo',
  apagarlosAca: 'Apagarlos acá no cambia lo que llega a tus otros dispositivos.',
  apagarLosAvisos: 'Apagar los avisos en este dispositivo',
} as const;

export const hacerElSeguimiento = {
  plazos: {
    una_semana: 'En una semana',
    un_mes: 'En un mes',
    tres_meses: 'En tres meses',
  },
  cuandoLeVolvesAEscribir: '¿Cuándo le volvés a escribir?',
  otroDia: 'Otro día',
  errores: {
    sinProximoContacto: 'Elegí el día en que le volvés a escribir.',
    proximoContactoQuePaso: 'Ese día ya pasó: elegí hoy o más adelante.',
    sinDiaQueLeEscribiste: 'Poné el día en que le escribiste.',
    diaQueNoLlego: 'Ese día todavía no llegó: tiene que ser hoy o antes.',
    notaLarga: (caracteres: number) => `No puede pasar de ${String(caracteres)} caracteres.`,
    queSigue: 'Elegí qué pasó.',
  },
  ponerEnSeguimiento: {
    titulo: 'Por ahora no',
    explicacion:
      'No dijo que no: dijo que ahora no. Pasa a Seguimiento, sale de tus consultas y la agenda te avisa el día en que le volvés a escribir.',
    nota: 'Nota',
    ejemploDeNota: 'Después de las vacaciones, cuando cobre el aguinaldo…',
    opcional: 'Opcional.',
    cancelar: 'Cancelar',
    pasarASeguimiento: 'Pasar a seguimiento',
  },
  registrarElContacto: {
    titulo: 'Registrar el contacto',
    contactarA: (nombre: string) => `Contactar a ${nombre}`,
    leTocabaEl: (fecha: string) => `Le tocaba el ${fecha}.`,
    leTocabaElConNota: (fecha: string, nota: string) => `Le tocaba el ${fecha}. ${nota}.`,
    queDiaLeEscribiste: 'Qué día le escribiste',
    queTeContesto: 'Qué te contestó',
    ejemploDeRespuesta: 'Que le escriba después de fin de mes, que consiguió más barato…',
    opcional: 'Opcional.',
    yAhora: '¿Y ahora?',
    opciones: {
      vuelve: {
        titulo: 'Vuelve',
        detalle: 'Le interesa otra vez: vuelve a las consultas.',
      },
      otra_fecha: {
        titulo: 'Todavía no',
        detalle: 'Sigue en seguimiento: le volvés a escribir otro día.',
      },
      no_va: {
        titulo: 'No va',
        detalle: 'Se da por perdido, por el cierre de siempre.',
      },
    },
    vuelveA: 'Vuelve a',
    ayudaDeLaEtapa:
      'La etapa en la que estaba cuando le dijiste que sí a esperar. Cambiala si corresponde otra.',
    notaParaLaProxima: 'Nota para la próxima',
    elCierre:
      'Se abre el cierre, el mismo de siempre: si dejó seña, se liquida como ingreso del taller, y el trabajo pasa al historial. Se puede reactivar.',
    cancelar: 'Cancelar',
    registrar: 'Registrar',
    botones: {
      vuelve: 'Volver a las consultas',
      otra_fecha: 'Guardar la fecha nueva',
      no_va: 'Seguir al cierre',
    },
  },
} as const;

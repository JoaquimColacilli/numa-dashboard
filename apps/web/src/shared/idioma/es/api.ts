export const api = {
  acceso: {
    enlaceEnOtroNavegador:
      'El enlace se abrió en otro navegador o en otra app, y solo sirve en el mismo desde el que lo pediste. Pedí uno nuevo desde este dispositivo y abrilo acá mismo.',
    enlaceVencido:
      'El enlace venció o ya se usó: cada enlace sirve una sola vez y por un rato. Pedí uno nuevo.',
    sesionTerminada: 'Tu sesión se cerró. Entrá de nuevo con tu mail y tu contraseña.',
    cuentaRepetida:
      'Ya hay una cuenta con ese mail. Entrá con tu contraseña, o pedí una nueva si no te la acordás.',
    huellaRepetida: 'Este dispositivo ya tiene la huella registrada para tu cuenta.',
    huellaCancelada:
      'La huella se canceló o tardó demasiado. Probá de nuevo, o entrá con tu contraseña.',
    huellaEnOtraDireccion:
      'La huella no se puede usar desde esta dirección de la app. Abrila desde la dirección de siempre.',
    sinHuellaEnElDispositivo:
      'Este dispositivo no tiene huella ni bloqueo de pantalla para confirmar que sos vos.',
    huellaVencida: 'Pasó demasiado tiempo antes de confirmar la huella. Probá de nuevo.',
    generico: 'No pudimos completar la operación. Probá de nuevo.',
    credencialesInvalidas:
      'El mail o la contraseña no coinciden. Revisalos; si no te acordás la contraseña, pedí una nueva.',
    mailSinConfirmar:
      'Todavía no confirmaste el mail. Abrí el enlace que te mandamos al crear la cuenta, o pedí que te lo mandemos de nuevo.',
    contrasenaDebil: 'La contraseña es muy débil: usá al menos 6 caracteres.',
    mismaContrasena: 'La contraseña nueva es igual a la que ya tenías. Elegí otra.',
    demasiadosMails:
      'El servidor ya mandó todos los mails que permite por hora. Esperá un rato y volvé a pedirlo; mientras, fijate en el correo no deseado.',
    demasiadosIntentos: 'Hubo demasiados intentos seguidos. Esperá unos minutos y volvé a probar.',
    formatoInvalido:
      'Revisá el mail y la contraseña: alguno de los dos no tiene un formato válido.',
    mailInvalido: 'Ese mail no parece válido. Revisá que esté bien escrito.',
    mailNoAutorizado: 'El servidor no manda mails a esa dirección. Probá con otro mail.',
    altasCerradas: 'Por ahora no se pueden crear cuentas nuevas.',
    accesoConMailCerrado: 'Por ahora no se puede entrar con mail y contraseña.',
    cuentaSuspendida: 'Esta cuenta está suspendida y no puede entrar.',
    cuentaInexistente: 'No encontramos esa cuenta. Revisá el mail.',
    hayQueConfirmar:
      'Para cambiar la contraseña hay que confirmar que sos vos: pedí el enlace de recuperación y abrilo desde el correo.',
    servidorLento: 'El servidor tardó demasiado en contestar. Probá de nuevo.',
    servidorConProblemas: 'El servidor tuvo un problema. Probá de nuevo en un rato.',
    huellaDeshabilitada:
      'La huella todavía no está habilitada en el servidor. Mientras tanto, entrá con tu contraseña.',
    demasiadasHuellas: 'Tu cuenta ya tiene el máximo de huellas registradas.',
    huellaSinVerificar:
      'El servidor no pudo verificar la huella. Probá de nuevo, o entrá con tu contraseña.',
    sensorConProblemas:
      'El sensor de huella tuvo un problema. Probá de nuevo, o entrá con tu contraseña.',
    respuestaInesperada: 'El servidor contestó algo que no esperábamos. Probá de nuevo.',
    sinRed: 'No hay conexión con el servidor. Probá de nuevo cuando vuelva la señal.',
    navegadorSinHuella: 'Este navegador no puede usar la huella. Entrá con tu contraseña.',
    enlaceDelCorreo: 'El enlace del correo no sirvió. Pedí uno nuevo desde este dispositivo.',
  },
  accesoConCodigo: (codigo: string) =>
    `No pudimos completar la operación (${codigo}). Probá de nuevo.`,
  rechazos: {
    esteTrabajo: 'Este trabajo',
    trabajo: (titulo: string) => `«${titulo}»`,
    siSigueIgual: 'Volvé a intentarlo, y si sigue igual avisá.',
    sinPermiso: {
      titulo: 'Tu cuenta no tiene acceso a esto.',
      queHacer:
        'Puede que el trabajo sea de otro taller, o que tu cuenta haya quedado sin taller. Cerrá sesión y volvé a entrar.',
    },
    MN001: {
      cobro: {
        cobrado: (trabajo: string) => `${trabajo} ya estaba cobrado.`,
        perdido: (trabajo: string) => `${trabajo} ya estaba cerrado como perdido.`,
        queHacer:
          'Puede que lo hayas cerrado desde el celular o desde la PC. Fijate cómo quedó el reparto: si no es el que esperabas, reabrilo.',
      },
      baja: {
        cobrado: (trabajo: string) =>
          `${trabajo} tiene pagos o gastos y está cobrado: no se puede borrar.`,
        perdido: (trabajo: string) =>
          `${trabajo} tiene pagos o gastos y está cerrado como perdido: no se puede borrar.`,
        queHacer:
          'Borrar esta plata la sacaría del libro. Si el reparto está mal, corregilo reabriéndolo.',
      },
      otro: {
        cobrado: (trabajo: string) => `${trabajo} está cobrado y sus números quedaron cerrados.`,
        perdido: (trabajo: string) =>
          `${trabajo} está cerrado como perdido y sus números quedaron cerrados.`,
      },
      salida: {
        cobrado:
          'Reabrí el cobro, corregí lo que haga falta y volvé a cobrarlo: el reparto se hace de nuevo con los números corregidos.',
        perdido:
          'Reactivá el presupuesto, cargá lo que falte y volvé a cerrarlo: el reparto de la seña se hace de nuevo.',
      },
    },
    MN002: {
      titulo: (trabajo: string) => `${trabajo} está borrado.`,
      queHacer:
        'Puede que lo hayas borrado desde otro dispositivo. Si lo necesitás, cargalo de nuevo.',
    },
    MN003: {
      titulo: (cliente: string) => `«${cliente}» tiene trabajos cargados.`,
      sinCliente: 'Este trabajo tiene trabajos cargados.',
      queHacer: 'Borrá esos trabajos, o pasalos a otro cliente, y después borrá el cliente.',
    },
    MN004: {
      titulo: 'La base no aceptó ese cambio.',
      queHacer: 'Es algo que no tendría que pasar. Volvé a cargarlo, y si sigue igual avisá.',
    },
    MN005: {
      titulo: 'El cliente de este trabajo está borrado.',
      queHacer: 'Elegí otro cliente para el trabajo, o volvé a cargar el cliente que borraste.',
    },
    MN006: {
      cobro: {
        titulo: 'Los números cambiaron desde que viste el reparto.',
        queHacer:
          'Se cargó un pago o un gasto, cambiaron el sueldo o los costos fijos, o cambió la fila. Abrí el cobro otra vez: el reparto se calcula de nuevo con lo que hay ahora, y lo revisás antes de confirmar.',
      },
      fila: {
        titulo: 'La fila cambió mientras la editabas.',
        queHacer:
          'Se guardó en otro dispositivo o cambiaron los Ajustes. Mirá cómo quedó y volvé a hacer tus cambios.',
      },
      cambio: (trabajo: string) => `${trabajo} cambió desde que lo abriste.`,
      desdeLaFicha: 'Abrí la ficha de nuevo para ver cómo quedó, y probá otra vez desde ahí.',
      desdeOtroLado:
        'Se guardó algo desde otro lado. Abrilo de nuevo para ver lo que hay ahora y volvé a cargar lo que te falte.',
    },
    MN007: {
      cobro: {
        titulo: (trabajo: string) => `${trabajo} todavía no está entregado.`,
        queHacer: 'Se cobra lo que ya entregaste. Marcalo como entregado y después cobralo.',
      },
      cierre: {
        titulo: (trabajo: string) => `${trabajo} ya está entregado: no se da por perdido.`,
        queHacer: 'Un mueble entregado se cobra, aunque el cliente tarde. Cobralo desde la ficha.',
      },
      reapertura: (trabajo: string) => `${trabajo} no está cobrado.`,
      reactivacion: (trabajo: string) => `${trabajo} no está cerrado como perdido.`,
      verLaFicha: 'Abrí la ficha de nuevo para ver cómo quedó.',
      formulario: {
        titulo: 'Ese cambio de estado no se puede hacer desde el formulario.',
        queHacer:
          'Cobrar y dar por perdido son botones propios de la ficha, porque reparten plata. Volvé a la ficha y usá el botón.',
      },
    },
    MN008: {
      titulo: 'Esta app quedó vieja y no saca la misma cuenta que el servidor.',
      alCobrar:
        'No se guardó nada: el trabajo quedó como estaba. Puede ser el corte de la ganancia, o lo que el mes ya lleva cubierto. Cerrá la app, volvé a abrirla para que se actualice, y hacelo de nuevo.',
      queHacer: 'Cerrá la app y volvé a abrirla para que se actualice, y probá otra vez.',
    },
    MN009: {
      titulo: 'El presupuesto de este trabajo sale de la opción que tildes.',
      queHacer:
        'Tildá la que te aprobaron, y si querés escribir el presupuesto a mano, sacá las opciones primero. Solo se puede tildar una.',
    },
    MN012: {
      encuesta: 'Ese cliente ya contestó',
      preguntas: {
        titulo: 'Ese cliente ya contestó: sus preguntas quedan como están',
        queHacer: 'Para preguntarle algo más, escribile.',
      },
    },
    MN013: {
      titulo: 'Esa pregunta ya salió en una encuesta: cómo se contesta no cambia',
      queHacer: 'Guardala como pregunta nueva: lo que ya contestaron queda aparte, con su texto.',
    },
    MN014: {
      titulo: 'La pregunta cambió desde otro lado',
      queHacer:
        'Ya hay una versión más nueva de esta pregunta. Volvé a abrir Preguntas y cambiala ahí.',
    },
    MN015: {
      sinEntregar: {
        titulo: 'La opinión se le pide al cliente cuando el trabajo está entregado',
        queHacer: 'Marcá el trabajo como entregado y pedísela desde ahí.',
      },
      sinPreguntas: {
        titulo: 'La encuesta no tiene preguntas',
        queHacer: 'Volvé a preguntar al menos una en Opiniones › Preguntas.',
      },
    },
    MN016: {
      delCobro: 'Falta el día del cobro.',
      deUnPago: 'A un pago le falta el día.',
      queHacer:
        'No se guardó nada. Poné el día en que entró la plata y volvé a guardarlo: la fecha no se inventa.',
    },
    MN017: {
      titulo: 'Esa fecha todavía no llegó.',
      queHacer:
        'No se guardó nada. Poné el día en que entró la plata, que tiene que ser hoy o antes, y volvé a guardarlo.',
    },
    MN018: {
      titulo: 'Esa plata no es de antes de que empezaras con la app.',
      queHacer:
        'Solo lo que entró antes de la apertura puede estar en tus saldos de arranque. Destildá esa opción, o revisá la fecha, y volvé a guardarlo.',
    },
    MN019: {
      titulo: 'El seguimiento de este trabajo quedó a medias.',
      queHacer:
        'No se guardó nada. Pasa si lo cambiaste desde otro lado al mismo tiempo. Abrilo de nuevo: si está en seguimiento, registrá el contacto desde ahí; si no, ponelo en seguimiento con su fecha.',
    },
    MN021: {
      sinListo: {
        titulo: 'La entrega se coordina con el mueble listo.',
        queHacer: 'Marcá en la ficha que ya está listo y proponele el día. No se guardó nada.',
      },
      comprometida: {
        titulo: 'La entrega ya está comprometida.',
        queHacer: 'Para cambiarla, cambiá la fecha comprometida en la ficha. No se guardó nada.',
      },
      fecha: {
        titulo: 'El día que le proponés tiene que ser desde mañana.',
        queHacer: 'Elegí un día desde mañana. No se guardó nada.',
      },
      noSeGuardoNada: (salida: string) => `${salida} No se guardó nada.`,
    },
    MN022: {
      titulo: 'Tu vidriera ya tiene 12 fotos.',
      queHacer:
        'No se sumó la foto. Pasa si sumaste fotos desde otro aparato al mismo tiempo. Sacá una de tu vidriera en Ajustes y volvé a sumarla.',
    },
    MN023: {
      titulo: 'La fila no se pudo guardar.',
      queHacer: 'Revisala y probá de nuevo.',
    },
    MN024: {
      titulo: (tesoro: string) => `No se pudo archivar ${tesoro}.`,
      sinTesoro: 'No se pudo archivar el tesoro.',
      queHacer:
        'Sacalo de la fila, cobrá el trabajo reabierto que lo usa y pasá su plata a otro tesoro. Después archivalo.',
    },
    MN025: {
      titulo: 'Este cobro quedó de antes de actualizar la app.',
      queHacer:
        'Abrí el cobro otra vez: el reparto se calcula con tu fila y lo revisás antes de confirmar.',
    },
    MN026: {
      titulo: 'Este presupuesto se cambió en otro aparato.',
      queHacer: 'Abrilo de nuevo para ver la última versión y seguí desde ahí.',
    },
    MN027: {
      titulo: 'Al presupuesto le falta algo para mandarlo.',
      queHacer: 'Revisá que tenga título, por lo menos un mueble con su detalle y un total.',
    },
    MN028: {
      titulo: 'Ya lo aprobó: el presupuesto no se cambia.',
      queHacer: 'Un cambio después de la seña se arregla aparte con tu cliente.',
    },
    MN029: {
      titulo: 'Cambiaron los importes desde que lo armaste.',
      queHacer: 'Revisá los valores y volvé a mandarlo.',
    },
    MN030: {
      titulo: 'Los textos del presupuesto se cambiaron en otro aparato.',
      queHacer: 'Abrí la pantalla de nuevo y volvé a guardar.',
    },
    MN031: {
      plantilla: 'Tus textos del presupuesto no se pudieron guardar.',
      presupuesto: 'El presupuesto no se pudo guardar.',
      queHacer:
        'Revisalo y probá de nuevo. Si vuelve a pasar, cerrá la app y abrila otra vez para que se actualice.',
    },
    MN032: {
      titulo: 'Este trabajo está perdido: su presupuesto no se cambia ni se manda.',
      queHacer: 'Si el cliente volvió, reactivalo desde la ficha y seguí desde ahí.',
    },
    MN033: {
      titulo: 'El día del envío todavía no llegó.',
      queHacer: 'Revisá la fecha y la hora de tu aparato, y volvé a mandarlo.',
    },
    MN034: {
      titulo: 'Ese tesoro sigue en su moneda.',
      queHacer:
        'La moneda de un tesoro no se cambia. Si lo necesitás en la otra moneda, creá uno nuevo y pasá la plata con una compra o una venta.',
    },
    MN035: {
      titulo: 'Entre pesos y dólares es una compra o una venta.',
      queHacer:
        'Un pase entre tesoros va en la misma moneda. Para pasar de pesos a dólares, cargalo como compra o venta de dólares.',
    },
    MN036: {
      titulo: 'La moneda ya no se cambia.',
      queHacer: 'Un trabajo elige su moneda mientras es una consulta.',
    },
    MN037: {
      titulo: 'Ese tesoro no recibe este pago.',
      queHacer: 'Elegí un tesoro en dólares que no esté archivado.',
    },
    MN038: {
      titulo: 'Esto se armó con la app sin actualizar.',
      queHacer: 'Volvé a cargarlo.',
    },
    MN039: {
      titulo: 'Falta el dólar de un pago.',
      queHacer:
        'Un pago en pesos de un trabajo en dólares necesita a qué dólar se tomó. Abrí el trabajo y completalo.',
    },
  },
} as const;

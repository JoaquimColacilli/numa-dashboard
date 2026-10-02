export const editarLaEncuesta = {
  intro:
    'Esto es lo que se le pregunta a todos los clientes cuando terminás un trabajo. Ya está escrita: cambiá lo que quieras o dejala como está.',
  notasDelLargo: {
    ok: 'Está en el largo que la gente contesta sin pensarlo.',
    atencion: 'Se está poniendo larga. Arriba de tres minutos empiezan a abandonarla.',
    alerta: 'Demasiado larga. A este largo la mitad la deja por la mitad.',
  },
  deTantas: (preguntas: number, tope: number): string => `${String(preguntas)} de ${String(tope)}`,
  loQueSePregunta: 'Lo que se pregunta',
  subir: 'Subir',
  bajar: 'Bajar',
  editar: 'Editar',
  dejarDePreguntarla: 'Dejar de preguntarla',
  obligatoria: 'Obligatoria',
  version: (numero: number): string => `versión ${String(numero)}`,
  sinRespuestas: 'sin respuestas',
  dejasteDePreguntarla: (cuando: string): string => `dejaste de preguntarla ${cuando}`,
  verRespuestas: 'Ver respuestas',
  volverAPreguntarla: 'Volver a preguntarla',
  yaPreguntasElTope: (tope: number): string =>
    `Ya preguntás ${String(tope)}: para volver a preguntarla, sacá otra.`,
  preguntaNueva: 'Pregunta nueva, sin escribir',
  noPreguntasNada:
    'Por ahora no le preguntás nada a nadie. Agregá una pregunta o volvé a preguntar una de las de abajo.',
  agregarUnaPregunta: 'Agregar una pregunta',
  verlaComoElCliente: 'Verla como la ve el cliente',
  llegasteAlTope: (tope: number): string =>
    `Llegaste a ${String(tope)} preguntas. Es el largo hasta donde la gente contesta sin abandonar: para agregar una, sacá otra.`,
  lasQueYaNo: 'Las que ya no preguntás',
  lasQueYaNoDetalle:
    'No se preguntan más, pero lo que contestaron queda guardado y se puede ver en Resultados.',
  deUnTrabajo: 'Preguntas de un trabajo puntual',
  deUnTrabajoDetalle:
    'Se agregan desde el trabajo, no desde acá, y se suman solo a esa encuesta. No entran en el promedio general: una pregunta que contestó una persona no es una estadística.',
  editor: {
    queSePregunta: 'Qué se pregunta',
    comoContesta: 'Cómo contesta',
    lasOpciones: 'Las opciones',
    opcion: (numero: number): string => `Opción ${String(numero)}`,
    borrarLaOpcion: (numero: number): string => `Borrar la opción ${String(numero)}`,
    agregarUnaOpcion: 'Agregar una opción',
    queTengaQueContestarla: 'Que tenga que contestarla',
    siNoPuedeSaltearla: 'Si no, puede saltearla',
    yaLaContestaron: (personas: number): string =>
      personas === 1
        ? 'Esta pregunta ya la contestó 1 persona'
        : `Esta pregunta ya la contestaron ${String(personas)} personas`,
    cambiasteComoSeContesta:
      'Le cambiaste cómo se contesta, así que esas respuestas no se pueden sumar con las nuevas. Quedan guardadas aparte, con el texto que tenían, y se empieza a contar de cero.',
    siLeCambiasElSentido:
      'Si le cambiás el sentido, esas respuestas contestaban otra cosa y no se pueden sumar con las nuevas. Podemos guardar las viejas aparte y empezar a contar de cero con el texto nuevo.',
    queHacemos: 'Qué hacemos con las respuestas viejas',
    empezarDeCero: 'Empezar a contar de cero',
    empezarDeCeroDetalle: (respuestas: number): string =>
      `Las ${String(respuestas)} respuestas viejas quedan guardadas aparte, con el texto que tenían. En Resultados se ven separadas.`,
    esLaMisma: 'Es la misma pregunta, solo la redacté mejor',
    esLaMismaDetalle: 'Las respuestas viejas se siguen sumando con las nuevas.',
    guardar: 'Guardar la pregunta',
    cancelar: 'Cancelar',
    problemas: {
      'sin-texto': 'Escribí la pregunta.',
      'texto-largo': 'La pregunta es muy larga: tiene que entrar en 300 letras.',
      'opcion-vacia': 'Hay una opción vacía: escribila o sacala.',
      'pocas-opciones': 'Tiene que tener al menos dos opciones.',
      'muchas-opciones': 'Tiene que tener ocho opciones como mucho.',
      'opcion-larga': 'Una opción es muy larga: tiene que entrar en 120 letras.',
      'opciones-repetidas': 'Hay dos opciones iguales.',
    },
  },
  vistaPrevia: {
    titulo: 'Así la ve tu cliente',
    bajada: 'No se guarda nada de lo que toques acá',
  },
  avisos: {
    deshacer: 'Deshacer',
    guardada: 'Pregunta guardada.',
    versionNueva: 'Guardada como versión nueva. Las respuestas viejas quedan aparte.',
    dejasteDePreguntar: (texto: string): string => `Dejaste de preguntar «${texto}».`,
    volvisteAPreguntarla: 'Volviste a preguntarla.',
  },
} as const;

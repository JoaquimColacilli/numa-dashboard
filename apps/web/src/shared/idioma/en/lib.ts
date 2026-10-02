import type { Mensajes } from '../es';
import { plural } from './plural';

const VUELVE_SOLO = "it'll save automatically when you're back online.";
const VUELVEN_SOLOS = "they'll save automatically when you're back online.";
const BORRADO_EN_COLA =
  "Deletion queued while offline: it'll go through automatically when you're back online.";
const ANOTADO_EN_COLA = `Queued while offline: ${VUELVE_SOLO}`;

export const lib = {
  avisos: {
    movimientoNuevo: {
      hecho: 'Transaction saved.',
      enCola: `Transaction queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the transaction.",
    },
    movimientoEditado: {
      hecho: 'Transaction changes saved.',
      enCola: `Transaction changes queued while offline: ${VUELVEN_SOLOS}`,
      error: "Couldn't save the transaction changes.",
    },
    movimientoBorrado: {
      hecho: 'Transaction deleted.',
      enCola: BORRADO_EN_COLA,
      error: "Couldn't delete the transaction.",
    },
    tesoroNuevo: {
      hecho: 'Bucket created.',
      enCola:
        "Bucket queued while offline: it'll be created automatically when you're back online.",
      error: "Couldn't create the bucket.",
    },
    tesoroEditado: {
      hecho: 'Bucket changes saved.',
      enCola: `Bucket changes queued while offline: ${VUELVEN_SOLOS}`,
      error: "Couldn't save the bucket changes.",
    },
    tesoroArchivado: {
      hecho: 'Bucket archived.',
      enCola:
        "Archiving queued while offline: it'll go through automatically when you're back online.",
      error: "Couldn't archive the bucket.",
    },
    filaGuardada: {
      hecho: 'Waterfall saved: it applies from the next payment.',
      enCola: `Waterfall queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the waterfall.",
    },
    faltanteCubierto: {
      hecho: "Done: the money moved and counts toward this month's cap.",
      enCola: "Queued while offline: the money will move automatically when you're back online.",
      error: "Couldn't move the money to cover the month.",
    },
    clienteNuevo: {
      hecho: 'Client saved.',
      enCola: `Client queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the client.",
    },
    clienteEditado: {
      hecho: 'Client changes saved.',
      enCola: `Client changes queued while offline: ${VUELVEN_SOLOS}`,
      error: "Couldn't save the client changes.",
    },
    clienteBorrado: {
      hecho: 'Client deleted.',
      enCola: BORRADO_EN_COLA,
      error: "Couldn't delete the client.",
    },
    proyectoGuardado: {
      hecho: 'Job saved.',
      enCola: `Job queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the job.",
    },
    proyectoBorrado: {
      hecho: 'Job deleted.',
      enCola: BORRADO_EN_COLA,
      error: "Couldn't delete the job.",
    },
    proyectoAvanzado: {
      hecho: 'Status change saved.',
      enCola: `Status change queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the status change.",
    },
    contactoGuardado: {
      hecho: 'Inquiry saved.',
      enCola: `Inquiry queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the inquiry.",
    },
    contactoAvanzado: {
      hecho: 'Inquiry step saved.',
      enCola: `Inquiry step queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the inquiry step.",
    },
    pasoASeguimiento: {
      hecho: 'Moved to follow-up: the calendar will remind you when to reach out again.',
      enCola: `Moved to follow-up while offline: ${VUELVE_SOLO}`,
      error: "Couldn't move it to follow-up.",
    },
    contactoRegistrado: {
      hecho: 'Follow-up logged.',
      enCola: `Follow-up logged while offline: ${VUELVE_SOLO}`,
      error: "Couldn't log the follow-up.",
    },
    borradorDelPresupuesto: {
      hecho: 'Quote saved.',
      enCola: `Quote queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the quote.",
    },
    presupuestoMandado: {
      hecho: 'Quote sent: your client can see it on their page now.',
      enCola:
        "Quote queued while offline: it'll get its number and reach your client when you're back online.",
      error: "Couldn't send the quote.",
    },
    presupuestoDelTaller: {
      hecho: 'Your quote is saved.',
      enCola: `Your quote is queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save your quote.",
    },
    tareaDelPresupuesto: {
      hecho: 'Quote task saved.',
      enCola: `Quote task queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the quote task.",
    },
    marcaDeLaAgenda: {
      hecho: 'Flag saved.',
      enCola: `Flag queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the important flag.",
    },
    contactoBorrado: {
      hecho: 'Inquiry deleted.',
      enCola: BORRADO_EN_COLA,
      error: "Couldn't delete the inquiry.",
    },
    perfil: {
      hecho: 'Profile saved.',
      enCola: `Profile queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the profile.",
    },
    anotacion: {
      hecho: 'Note saved.',
      enCola: `Note added while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the note.",
    },
    anotacionBorrada: {
      hecho: 'Note deleted.',
      enCola: BORRADO_EN_COLA,
      error: "Couldn't delete the note.",
    },
    archivo: {
      hecho: 'File saved.',
      enCola: `File queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the file.",
    },
    archivoBorrado: {
      hecho: 'File deleted.',
      enCola: BORRADO_EN_COLA,
      error: "Couldn't delete the file.",
    },
    eventoMovido: {
      hecho: 'Moved in the calendar.',
      enCola: `Moved while offline: ${VUELVE_SOLO}`,
      error: "Couldn't move it.",
    },
    costosEstimados: {
      hecho: 'Estimated costs saved.',
      enCola: `Estimated costs queued while offline: ${VUELVEN_SOLOS}`,
      error: "Couldn't save the estimated costs.",
    },
    loQueHaceFalta: {
      hecho: "What's needed is saved.",
      enCola: ANOTADO_EN_COLA,
      error: "Couldn't save what's needed.",
    },
    enlaceDelCliente: {
      hecho: 'Link created.',
      enCola: 'You need to be online to create the link.',
      error: "Couldn't create the link.",
    },
    bajaDelEnlace: {
      hecho: 'The link no longer works.',
      enCola: 'You need to be online to turn it off.',
      error: "Couldn't turn off the link.",
    },
    formasDeCobro: {
      hecho: 'Done: your client now knows how to pay you.',
      enCola: ANOTADO_EN_COLA,
      error: "Couldn't change how your client pays you.",
    },
    idiomaDeLosClientes: {
      hecho: 'Done: your clients now read in the language you picked.',
      enCola: ANOTADO_EN_COLA,
      error: "Couldn't change your clients' language.",
    },
    archivoCompartido: {
      hecho: 'Done: your client can see it now.',
      enCola: ANOTADO_EN_COLA,
      error: "Couldn't change what your client sees.",
    },
    archivoNoCompartido: {
      hecho: "Done: your client can't see it anymore.",
      enCola: ANOTADO_EN_COLA,
      error: "Couldn't change what your client sees.",
    },
    pregunta: {
      hecho: 'Question saved.',
      enCola: `Question queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the question.",
    },
    preguntaPropia: {
      hecho: "Added to this job's survey.",
      enCola: `Question queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save this job's question.",
    },
    opinionLeida: {
      hecho: 'Feedback marked as read.',
      enCola: ANOTADO_EN_COLA,
      error: "Couldn't mark the feedback as read.",
    },
    encuesta: {
      hecho: 'The survey link is ready.',
      enCola: 'You need to be online to create the survey link.',
      error: "Couldn't create the survey link.",
    },
    bajaDeLaEncuesta: {
      hecho: 'The survey link no longer works.',
      enCola: 'You need to be online to turn it off.',
      error: "Couldn't turn off the survey link.",
    },
    recordatorio: {
      hecho: 'Noted that you reminded them.',
      enCola: `Reminder queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't log the reminder.",
    },
    yaEstaListo: {
      hecho: "Done: your client can now see it's finished.",
      enCola: ANOTADO_EN_COLA,
      error: "Couldn't mark it as ready.",
    },
    todaviaNoEstaListo: {
      hecho: 'Back in production.',
      enCola: ANOTADO_EN_COLA,
      error: "Couldn't remove the ready mark.",
    },
    entregaEstimada: {
      hecho: 'Estimated delivery saved.',
      enCola: `Estimated delivery queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the estimated delivery.",
    },
    entregaComprometida: {
      hecho: 'Delivery confirmed: your client can see it now.',
      enCola: `Confirmed delivery queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save the confirmed delivery.",
    },
    sinEntregaComprometida: {
      hecho: "There's no confirmed delivery anymore.",
      enCola: ANOTADO_EN_COLA,
      error: "Couldn't remove the confirmed delivery.",
    },
    pedidoDeEntrega: {
      hecho: 'Done: your client can see it on their link now.',
      enCola: 'You need to be online to ask your client.',
      error: "Couldn't send the delivery request.",
    },
    respuestaDeEntregaLeida: {
      hecho: 'Reply marked as read.',
      enCola: ANOTADO_EN_COLA,
      error: "Couldn't mark the reply as read.",
    },
    fotoDeLaVidriera: {
      hecho: 'The photo is in your showcase.',
      enCola:
        "Photo queued while offline: it'll be added to your showcase automatically when you're back online.",
      error: "Couldn't add the photo to your showcase.",
    },
    fotoDeLaVidrieraMovida: {
      hecho: 'Your showcase is in the new order.',
      enCola: `New order queued while offline: ${VUELVE_SOLO}`,
      error: "Couldn't save your showcase order.",
    },
    fotoDeLaVidrieraSacada: {
      hecho: 'The photo was removed from your showcase.',
      enCola: "Queued while offline: it'll leave your showcase when you're back online.",
      error: "Couldn't remove the photo from your showcase.",
    },
  },
  fechaDeLaPlata: {
    falta: 'Enter the day the money came in.',
    futura: "That date hasn't come yet: it has to be today or earlier.",
  },
  semana: {
    dias: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    iniciales: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  },
  tintas: {
    hogar: 'Green',
    maun: 'Wood',
    diezmo: 'Violet',
    cocos: 'Blue',
    grana: 'Crimson',
    mostaza: 'Mustard',
    petroleo: 'Teal',
    ciruela: 'Plum',
  },
  sync: {
    sinConexion: (pendientes) =>
      plural(pendientes, {
        '=0': "Offline. You're seeing what was last synced.",
        one: "Offline. # change will sync when you're back online.",
        other: "Offline. # changes will sync when you're back online.",
      }),
    sincronizando: (pendientes) =>
      plural(pendientes, { one: 'Syncing # change…', other: 'Syncing # changes…' }),
    rechazados: (rechazados) =>
      plural(rechazados, {
        one: "# change couldn't be saved.",
        other: "# changes couldn't be saved.",
      }),
    sincronizado: 'All synced.',
  },
  imagenIlegible: "Couldn't read that image. Try a JPEG, PNG or WebP photo.",
} satisfies Mensajes['lib'];

import type { Mensajes } from '../es';
import { plural } from './plural';

export const recibirAvisos = {
  noElegisteNada:
    "You didn't choose anything in the system prompt. Tap again whenever you're ready.",
  elNavegadorNoDejoPedir: 'The browser blocked the permission request. Try again.',
  elNavegadorNoPudoAnotarse:
    "The browser couldn't sign up for its notification service. If you're offline, try again when you're back online.",
  sinSenalParaActivar:
    "You can't turn on notifications offline. Try again when you're back online.",
  sinSenalParaApagar:
    "You can't turn off notifications offline: this device will keep getting them. Try again when you're back online.",
  queAvisa: {
    entregas: {
      etiqueta: 'Deliveries',
      detalle:
        "The delivery of each job in progress: the confirmed date, or the estimated one if there isn't one",
    },
    visitas: {
      etiqueta: 'Visits and site measures',
      detalle: "The visits you've scheduled for your inquiries",
    },
    presupuestos: {
      etiqueta: 'Quotes coming due',
      detalle: 'The deadline to deliver a quote',
    },
    seguimientos: {
      etiqueta: 'Reach out again',
      detalle: 'Which of your follow-ups is due for a message from you',
    },
    vencimientos: {
      etiqueta: 'Bills due',
      detalle: "The payment day of each bill you haven't paid yet",
    },
    anotaciones: {
      etiqueta: 'My notes',
      detalle: 'What you jot down: materials, shop work',
    },
  },
  laMananaDelDia: 'that morning',
  elDiaAnterior: 'the day before',
  diasAntes: ({ dias }) => plural(dias, { one: '# day before', other: '# days before' }),
  todaviaNoSalioNinguno: 'None sent yet.',
  salioHoy: ({ hora }) => `The last one went out today at ${hora}.`,
  salioAyer: ({ hora }) => `The last one went out yesterday at ${hora}.`,
  salioElDia: ({ fecha, hora }) => `The last one went out on ${fecha} at ${hora}.`,
  tambienLlegan: ({ otros }) =>
    plural(otros, {
      one: 'They also go to your other device.',
      other: 'They also go to your # other devices.',
    }),
  elServidorTodaviaNoPuede: "The server can't send notifications yet.",
  teMandamosUnaPrueba: 'Test notification sent: it should arrive in a few seconds.',
  loSacamosDeLaLista:
    'This device had stopped getting notifications, so it was removed from the list. Turn them on again.',
  elServicioNoRespondio: "The notification service didn't respond. Try again in a bit.",
  pasosEnElIphone: {
    compartir: 'Tap the Share button, at the bottom in the middle.',
    agregarAInicio: 'Choose “Add to Home Screen.”',
    abrirDesdeElIcono: 'Open NUMA from the new icon.',
  },
  pasosEnLaApp: {
    abrirLosAjustes: "Open your phone's settings.",
    buscarNuma: 'Find NUMA in the list of apps.',
    permitir: 'Turn on “Allow Notifications” and come back here.',
  },
  pasosEnElNavegador: {
    tocarElIcono: 'Tap the icon to the left of the page address.',
    buscarNotificaciones: 'Find “Notifications” and set it to allow.',
    volver: "Come back here and tap “I've allowed it.”",
  },
  eligeDondeVivis: 'Choose where you live to turn on notifications.',
  todaviaFiguraBloqueado: 'It still shows as blocked. Check the steps and tap again.',
  zonas: {
    argentina: 'Argentina',
    cordoba: 'Córdoba',
    uruguay: 'Uruguay',
    chile: 'Chile',
    bolivia: 'Bolivia',
    espana: 'Spain',
  },
  zonaConDesfase: ({ lugar, desfase }) => `${lugar} (${desfase})`,
  activados: 'Notifications turned on for this device.',
  yaNoRecibe: "This device won't get notifications anymore.",
  cambiosGuardados: 'Notification changes saved.',
  sinSenalNoSeGuardan:
    "Notification settings can't be saved offline: the change didn't go through. Try again when you're back online.",
  noSeGuardoElCambio: "Couldn't save the notification change. Try again.",
  sinSenalParaLaPrueba: "Can't send the test while offline.",
  noSePudoMandarLaPrueba: "Couldn't send the test. Try again in a bit.",
  queTeAviseALaManana: 'Get notified in the morning',
  aLasTeLlega: ({ hora }) =>
    `At ${hora} you'll get a notification with the deliveries, visits, and quotes coming due. After you turn it on, you can choose what it tells you about and how far ahead.`,
  dondeVivis: 'Where do you live?',
  elAvisoLoMandaUnServidor:
    'The notification is sent by a server, not your phone, so it needs to know your time zone to send it at the time you chose.',
  eligeTuZonaHoraria: 'Choose your time zone',
  activando: 'Turning on…',
  activarLosAvisos: 'Turn on notifications',
  elSistemaTeVaAPreguntar:
    "Your device will ask if you want to allow them. If you say no, you'll have to allow them manually later.",
  leyendoTusAvisos: 'Loading your notifications…',
  sinSenalNoPodemosLeer: "Can't load your notifications offline",
  noPudimosLeerTuConfiguracion: "Couldn't load your notification settings",
  losActivosSiguenAndando:
    "Notifications that were already on keep working. Only your preferences couldn't be loaded to show them here.",
  reintentar: 'Try again',
  todaviaNoEstanListos: "Notifications aren't ready yet",
  faltanLasClaves:
    "The server doesn't have the keys it needs to send notifications, so for now they can't be turned on on any device. It's not something you can fix from this screen.",
  mientrasTanto: 'Meanwhile, the calendar still shows everything.',
  primeroAgregaNuma: 'First, add NUMA to your Home Screen',
  enElIphoneSoloLlegan:
    "On iPhone, notifications only arrive if the app is on your Home Screen. That's not our rule: the system requires it. It takes thirty seconds, and the app opens faster too.",
  iphoneEnSafari: 'iPhone, in Safari',
  cuandoLaAbras:
    "Once you open it from the icon, come back here and you'll be able to turn on notifications.",
  esteNavegadorNoPuede: "This browser can't get notifications",
  paraRecibirlos:
    'To get them, open NUMA in Chrome, Edge, or Firefox. Meanwhile, the calendar still shows everything.',
  estanBloqueados: 'Notifications are blocked',
  leDijisteQueNo:
    "You said no to the permission, and the app can't ask again: the system decides that. You can allow it manually in two taps.",
  yaLoHabilite: "I've allowed it",
  esUnRecordatorio:
    "It's a reminder, not an alarm. The service that sends them can skip a notification without telling you, especially if your phone is offline, and if the app goes a week without being used, the server pauses and notifications stop going out. For anything you can't miss, open the calendar: everything's there, always.",
  activosEnEsteDispositivo: 'Notifications are on for this device.',
  probar: 'Test',
  queTeAvisa: 'What to notify you about',
  anticipacionDe: ({ aviso }) => `Advance notice: ${aviso}`,
  aQueHora: 'What time',
  otraHora: 'Other time',
  enEsteDispositivo: 'On this device',
  apagarlosAca: "Turning them off here doesn't change what your other devices get.",
  apagarLosAvisos: 'Turn off notifications on this device',
} satisfies Mensajes['recibirAvisos'];

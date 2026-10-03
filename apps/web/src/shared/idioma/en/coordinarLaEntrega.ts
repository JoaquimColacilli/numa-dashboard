import type { Mensajes } from '../es';

export const coordinarLaEntrega = {
  franjas: {
    manana: 'Morning',
    tarde: 'Afternoon',
  },
  sinHorario: 'Any time',
  dia: 'Day',
  horario: 'Time of day',
  cancelar: 'Cancel',
  errores: {
    sinDia: 'Choose the day.',
    propuestaDesdeManana: 'The day you propose has to be tomorrow or later.',
    fechaQuePaso: "That date has passed and your client wouldn't see it: choose one from today on.",
  },
  laEntrega: 'Delivery',
  estimada: 'Estimated',
  sinFecha: 'No date',
  ponerleFecha: 'Set a date',
  cambiar: 'Change',
  comprometidaConElCliente: 'Confirmed with the client',
  todaviaNo: 'Not yet',
  laAceptoTuCliente: 'Your client accepted it',
  laAcepto: (cliente) => `${cliente} accepted it`,
  comprometerUnDia: 'Confirm a day',
  sacar: 'Remove',
  yaPaso: {
    estimada:
      "The estimated delivery has passed: your client can't see it. Move it to an upcoming day.",
    comprometida:
      "The confirmed delivery has passed: your client can't see it. Change it, or mark it as delivered in To do.",
  },
  mientrasLoFabricas:
    "Your client sees the estimated date as “Estimated delivery.” When it's done, tap Mark as ready and you'll set the day with them.",
  proponeleUnDia: 'Propose a day, or ask them to mark the days and times that work for them.',
  lePropusisteEl: (fecha) => `You proposed ${fecha}. No reply yet.`,
  lePedisteSusDias: 'You asked for their days. No reply yet.',
  proponerleOtroDia: 'Propose another day',
  proponerleUnDia: 'Propose a day',
  pedirleOtrosDias: 'Ask for other days',
  pedirleSusDias: 'Ask for their days',
  sinSenal: 'You need to be online to ask for the day: your client only sees it once it arrives.',
  verComoLoVeTuCliente: 'See what your client sees',
  verComoLoVe: (cliente) => `See what ${cliente} sees`,
  respuesta: {
    tuClienteTeDejoUnaNota: 'Your client left you a note',
    teDejoUnaNota: (cliente) => `${cliente} left you a note`,
    tuClienteTePasoSusDias: 'Your client sent their days. Confirm one:',
    tePasoSusDias: (cliente) => `${cliente} sent their days. Confirm one:`,
    yaPaso: 'already passed',
    confirmarEl: (fecha) => `Confirm ${fecha}`,
  },
  hojas: {
    estimada: {
      titulo: 'Estimated delivery',
      ayuda: 'Your client sees it as “Estimated delivery” while you build it.',
      boton: 'Save',
    },
    comprometida: {
      titulo: 'Confirmed delivery',
      ayuda: "It's the day you agreed on with your client. They see it as good news on their link.",
      boton: 'Confirm',
    },
    propuesta: {
      titulo: 'Propose a day',
      ayuda:
        'They see it on their link with a Works for me button. If they accept, the delivery is confirmed on its own.',
      boton: 'Propose it',
      tuCliente: (trabajo) => `Your client · ${trabajo}`,
    },
  },
} satisfies Mensajes['coordinarLaEntrega'];

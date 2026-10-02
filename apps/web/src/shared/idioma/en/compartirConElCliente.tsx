import type { Mensajes } from '../es';

import { plural } from './plural';

export const compartirConElCliente = {
  volverAlTrabajo: 'Back to the job',
  titulo: 'Share with the client',
  queVe:
    "They see the price, what they've paid, what's left, how to pay you and how the furniture is coming along. They don't see your costs, your profit, the tithe or the breakdown. The QR code opens the same link: whoever scans it sees exactly the same thing, and turning it off shuts off both.",
  verComoLoVeEl: 'See what your client sees',
  sinEnlace: {
    titulo: "You haven't shared this job yet",
    texto:
      'This creates a link just for this job. Anyone who has it can open it without an account or password, so only send it to your client. You can turn it off whenever you want.',
    crear: 'Create link',
  },
  deBaja: {
    titulo: 'The link is turned off',
    texto:
      "If your client opens it, they see a notice that it no longer works and nothing about the job. You can create a new one whenever you want; the old one won't come back.",
    crear: 'Create a new link',
  },
  activo: {
    elEnlace: 'The link',
    enlaceActivo: 'Active link',
    creadoEl: (fecha) => `created ${fecha} · doesn't expire`,
    copiar: 'Copy',
    copiado: 'Copied',
    enWhatsappVaADecir: "On WhatsApp it'll say:",
    mandarseloPorWhatsapp: 'Send it on WhatsApp',
    darDeBaja: 'Turn off',
    sinLaDireccion:
      'This link was created before its address was saved to your shop, so the address stayed only in the old app. The one your client has no longer works: create a new one and send it to them.',
    crearUnoNuevo: 'Create a new one',
    noVeNingunArchivo: (total) =>
      plural(total, {
        one: 'With this link, your client sees 0 of # file: choose below what to show them.',
        other:
          'With this link, your client sees 0 of # files: choose below which ones to show them.',
      }),
    archivosQueVe: (compartidos, total) =>
      plural(total, {
        one: `With this link, your client sees ${String(compartidos)} of # file.`,
        other: `With this link, your client sees ${String(compartidos)} of # files.`,
      }),
    visitas: (veces) => `${veces}.`,
    visitasYLaUltima: (veces, fecha) => `${veces}. Last opened ${fecha}.`,
  },
  sinSenal:
    "You need to be online to create the link: it's saved on the spot and only works from then on.",
  baja: {
    titulo: 'Turn off the link?',
    texto:
      'Your client will stop seeing the job from the link you sent them. If you need it later, create a new one.',
    dejarloComoEsta: 'Keep it as is',
    darloDeBaja: 'Turn it off',
  },
  comoTePaga: {
    titulo: 'How your client pays',
    elegi:
      "Choose how you'll collect each payment. Your client sees it on their page, next to how much they need to pay you. Bank transfers don't cost you a fee.",
    nadaQueCobrar: "This job is paid in full: there's nothing left to collect.",
    alMenosUna: "Leave at least one: otherwise your client won't know how to pay you.",
    sinDatosParaTransferir:
      "You haven't added an alias or CBU yet, so for now you can only collect in cash.",
    cargalosEnAjustes: 'Add them in Settings',
    comoTeLaPaga: {
      sena: 'Deposit: how your client pays it',
      saldo: 'Balance: how your client pays it',
    },
    tePagaEn: 'Client pays in',
    monedas: {
      pesos: 'Pesos',
      dolares: 'Dollars',
      pesosODolares: 'Pesos or dollars',
    },
    dolarDelDia: "Today's dollar rate (for all your jobs)",
    valeParaHoy: 'Valid for today.',
    valeParaElDia: (dia) => `Valid for ${dia}.`,
    ayudaDelDolarDelDia:
      'Set it using the rule in your quote. Your clients only see how many pesos it comes to today if you set it today.',
    sinCuentaEnDolares: (Enlace) => (
      <>
        To get paid in dollars by bank transfer,{' '}
        <Enlace>add your US dollar account in Settings</Enlace>.
      </>
    ),
  },
  archivos: {
    titulo: 'Which files they see',
    cuantosVe: (compartidos, total) => `${String(compartidos)} of ${String(total)} shared`,
    marcaUnoPorUno: "Turn them on one by one. Anything you don't turn on doesn't exist for them.",
    noVeNinguno: (total) =>
      plural(total, {
        one: "You have one file and your client can't see it.",
        other: "You have # files and your client can't see any of them.",
      }),
    prendeAbajo: 'Turn on the ones you want to show them below.',
    sinArchivos: 'This job has no files yet. Upload them from the job page.',
    compartir: (nombre) => `Share ${nombre}`,
  },
  qr: {
    mostrarElQr: 'Show them the QR code',
    titulo: 'Show them the code',
    escanealo: "Scan it with your phone's camera",
    dibujando: 'Drawing the code',
    codigoDelEnlace: (trabajo) => `QR code for the link to ${trabajo}`,
    copiado: 'Copied',
    copiarElEnlace: 'Copy link',
    listo: 'Done',
    esElMismoEnlace:
      "It's the same link you send on WhatsApp: if you turn it off, this code stops working.",
  },
} satisfies Mensajes['compartirConElCliente'];

import type { Mensajes } from '../es';
import { plural } from './plural';

export const cliente = {
  origenes: {
    referido: {
      etiqueta: 'Referral',
      detalle: 'Recommended by someone who already worked with the shop.',
    },
    volvio: {
      etiqueta: 'Returning client',
      detalle: 'They had a job done before and came back for another.',
    },
    redes: {
      etiqueta: 'Instagram',
      detalle: "Wrote to the shop's social media.",
    },
    cartel: {
      etiqueta: 'Shop sign',
      detalle: 'Walked by and saw the sign.',
    },
    otro: {
      etiqueta: 'Other',
      detalle: 'Came some other way.',
    },
  },
  condiciones: {
    consumidor_final: {
      etiqueta: 'Final consumer',
      comprobante: 'delivery note or type B invoice',
    },
    monotributo: { etiqueta: 'Monotributo', comprobante: 'type C invoice' },
    responsable_inscripto: { etiqueta: 'Registered VAT taxpayer', comprobante: 'type A invoice' },
    exento: { etiqueta: 'VAT-exempt', comprobante: 'type B invoice' },
  },
  cuit: 'CUIT',
  cuitOCuil: 'CUIT or CUIL',
  ordenes: {
    nombre: 'Name',
    ultimo: 'Last job',
    facturado: 'Total billed',
  },
  formulario: {
    largoMaximo: (maximo) =>
      plural(maximo, {
        one: "Can't be longer than # character.",
        other: "Can't be longer than # characters.",
      }),
    faltaElNombre: "The name is the only thing you can't leave out.",
    revisaElMail: "Check the email: it's missing the @ or the dot.",
    cuitIncompleto: (digitos) =>
      `A CUIT has ${String(digitos)} digits. Leave it blank if you don't have it handy.`,
    cuitAmbiguo:
      "This CUIT's check digit falls in the case with no single convention. Save it anyway if you copied it right.",
    cuitConOtroPrefijo:
      "CUITs start with 20, 23, 24, 27, 30, 33 or 34. Save it anyway if it's the one you were given.",
    cuitQueNoCierra: "The check digit doesn't match. Check it, but you can still save it.",
  },
  contacto: {
    llamar: 'Call',
    whatsapp: 'WhatsApp',
    llamarA: (nombre) => `Call ${nombre}`,
    escribirleA: (nombre) => `Message ${nombre} on WhatsApp`,
    llamarASinTelefono: (nombre) => `Call ${nombre}: no phone number added`,
    escribirleASinTelefono: (nombre) => `Message ${nombre} on WhatsApp: no phone number added`,
    sinTelefono: 'No phone number added',
    agregaloDesdeEditar: 'No phone number added: add one from Edit to call or message.',
  },
  combobox: {
    cliente: 'Client',
    sinDatos: 'No contact details yet',
    cambiar: (nombre) => `Change the client, now ${nombre}`,
    buscar: 'Search by name, or type a new one',
    crear: (nombre) => `Create “${nombre}”`,
    quedaCargado: "It's saved with the name; you can fill in the rest later",
  },
} satisfies Mensajes['cliente'];

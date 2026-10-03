import type { MensajesDelCliente } from '../es';
import { plural } from './plural';

export const pdf = {
  titulo: {
    sinNumero: 'Quote (draft)',
    numero: (numero) => `Quote ${numero}`,
    conRevision: (numero, revision) => `Quote ${numero} · Rev. ${String(revision)}`,
    enBorrador: (titulo) => `${titulo} (draft)`,
  },
  archivo: {
    sinNumero: 'Quote (draft)',
    numero: (numero) => `Quote ${numero}`,
    conRevision: (numero, revision) => `Quote ${numero} Rev ${String(revision)}`,
  },
  pagina: (titulo, pagina, total) => `${titulo} · Page ${String(pagina)} of ${String(total)}`,
  palabrasClave: {
    presupuesto: 'Quote',
    borrador: 'draft',
  },
  marcaDeAgua: 'DRAFT',
  datos: {
    cliente: 'Client',
    obra: 'Job site',
    trabajo: 'Job',
  },
  rotulo: {
    validez: 'Valid for',
    sinVencimiento: 'No expiry',
    dias: (dias) => plural(dias, { one: '# day', other: '# days' }),
  },
  valores: {
    relevamientoAbonado: 'Site measure and 3D design already paid',
    senaAAbonar: 'Deposit due',
    cubierta: 'Covered',
    saldo: 'Balance',
    elegiConLoAbonado: (monto) =>
      `The ${monto} paid for the site measure and 3D design is already deducted from the deposit due. Choose the option you prefer and let the shop know.`,
  },
  plazo: (dias) =>
    plural(dias, {
      one: '# business day from the deposit.',
      other: '# business days from the deposit.',
    }),
  validez: {
    sinVencimiento: 'No expiration.',
    dias: (dias) =>
      plural(dias, { one: "# day from when it's sent.", other: "# days from when it's sent." }),
    hasta: (fecha) => `Until ${fecha}.`,
  },
  aceptado: {
    sinFecha: 'Accepted',
    sinFechaConOpcion: (letra) => `Accepted · Option ${letra}`,
    el: (fecha) => `Accepted on ${fecha}`,
    elConOpcion: (fecha, letra) => `Accepted on ${fecha} · Option ${letra}`,
  },
} satisfies MensajesDelCliente['pdf'];

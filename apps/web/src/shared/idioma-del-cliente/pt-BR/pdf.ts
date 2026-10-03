import type { MensajesDelCliente } from '../es';
import { plural } from './plural';

export const pdf = {
  titulo: {
    sinNumero: 'Orçamento (rascunho)',
    numero: (numero) => `Orçamento ${numero}`,
    conRevision: (numero, revision) => `Orçamento ${numero} · Rev. ${String(revision)}`,
    enBorrador: (titulo) => `${titulo} (rascunho)`,
  },
  archivo: {
    sinNumero: 'Orçamento (rascunho)',
    numero: (numero) => `Orçamento ${numero}`,
    conRevision: (numero, revision) => `Orçamento ${numero} Rev ${String(revision)}`,
  },
  pagina: (titulo, pagina, total) => `${titulo} · Página ${String(pagina)} de ${String(total)}`,
  palabrasClave: {
    presupuesto: 'Orçamento',
    borrador: 'rascunho',
  },
  marcaDeAgua: 'RASCUNHO',
  datos: {
    cliente: 'Cliente',
    obra: 'Obra',
    trabajo: 'Projeto',
  },
  rotulo: {
    validez: 'Validade',
    sinVencimiento: 'Sem venc.',
    dias: (dias) => plural(dias, { one: '# dia', other: '# dias' }),
  },
  valores: {
    relevamientoAbonado: 'Visita técnica e projeto 3D já pagos',
    senaAAbonar: 'Sinal a pagar',
    cubierta: 'Coberto',
    saldo: 'Saldo',
    elegiConLoAbonado: (monto) =>
      `O sinal a pagar já abate os ${monto} pagos pela visita técnica e pelo projeto 3D. Escolha a opção que preferir e avise a marcenaria.`,
  },
  plazo: (dias) =>
    plural(dias, {
      one: '# dia útil a partir do sinal.',
      other: '# dias úteis a partir do sinal.',
    }),
  validez: {
    sinVencimiento: 'Sem vencimento.',
    dias: (dias) =>
      plural(dias, { one: '# dia a partir do envio.', other: '# dias a partir do envio.' }),
    hasta: (fecha) => `Até ${fecha}.`,
  },
  aceptado: {
    sinFecha: 'Aceito',
    sinFechaConOpcion: (letra) => `Aceito · Opção ${letra}`,
    el: (fecha) => `Aceito em ${fecha}`,
    elConOpcion: (fecha, letra) => `Aceito em ${fecha} · Opção ${letra}`,
  },
} satisfies MensajesDelCliente['pdf'];

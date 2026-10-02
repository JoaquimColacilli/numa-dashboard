import type { Mensajes } from '../es';

import { ordinal } from './gramatica';

export const cubrirElFaltante = {
  notaDeCocos: "It's the invested savings: if you use it, the goal gets pushed back.",
  notaDelHogar: "It's the family's money.",
  paraCubrir: (nombre, mes) => `To cover ${nombre} for ${mes}`,
  vence: (renglon, dia, falta) =>
    `${renglon} is due on the ${ordinal(dia)} and you still need ${falta}.`,
  faltanParaElSaldo: (falta, nombre) => `You still need ${falta} for ${nombre}.`,
  faltanParaElMes: (falta, nombre, mes) => `You still need ${falta} for ${nombre} in ${mes}.`,
  titulo: 'Cover fixed costs',
  bajadaDelSaldo: (falta) => `You still need ${falta} to complete its amount`,
  bajadaDelMes: (falta, mes) => `You still need ${falta} in ${mes}`,
  eligeDelSaldo:
    "Choose which bucket covers what's missing. What you move stays in the bucket: the next payment only collects what's still missing.",
  eligeDelMes: (mes) =>
    `Choose which bucket covers what's missing. What you move counts toward the cap for ${mes}: the next payment won't fill it again.`,
  deQueTesoroSale: 'Which bucket it comes from',
  tiene: (saldo) => `has ${saldo}`,
  cuantoSaleDe: (nombre) => `How much comes from ${nombre}`,
  noAlcanza: (nombre, saldo) => `Not enough: ${nombre} has ${saldo}.`,
  quedaEn: (nombre, saldo) => `${nombre} will be at ${saldo}`,
  cubris: 'Covered',
  cubiertoDe: (cubierto, falta) => `${cubierto} of ${falta}`,
  tePasas: (deMas, falta) => `That's ${deMas} too much: only ${falta} is missing.`,
  pasar: (monto, nombre) => `Move ${monto} to ${nombre}`,
} satisfies Mensajes['cubrirElFaltante'];

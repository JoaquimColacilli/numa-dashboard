import { conArticulo } from './gramatica';

export const cubrirElFaltante = {
  notaDeCocos: 'Es el ahorro invertido: si lo usás, la meta se atrasa.',
  notaDelHogar: 'Es la plata de la familia.',
  paraCubrir: (nombre: string, mes: string) => `Para cubrir ${nombre} de ${mes}`,
  vence: (renglon: string, dia: number, falta: string) =>
    `Vence ${conArticulo(renglon)} el ${String(dia)} y faltan ${falta}.`,
  faltanParaElSaldo: (falta: string, nombre: string) => `Faltan ${falta} para ${nombre}.`,
  faltanParaElMes: (falta: string, nombre: string, mes: string) =>
    `Faltan ${falta} para ${nombre} de ${mes}.`,
  titulo: 'Cubrir los gastos fijos',
  bajadaDelSaldo: (falta: string) => `Faltan ${falta} para completar su monto`,
  bajadaDelMes: (falta: string, mes: string) => `Faltan ${falta} en ${mes}`,
  eligeDelSaldo:
    'Elegí de qué tesoro sale lo que falta. Lo que pases queda en el tesoro: el próximo cobro solo junta lo que siga faltando.',
  eligeDelMes: (mes: string) =>
    `Elegí de qué tesoro sale lo que falta. Lo que pases cuenta para el tope de ${mes}: el próximo cobro no lo vuelve a llenar.`,
  deQueTesoroSale: 'De qué tesoro sale',
  tiene: (saldo: string) => `tiene ${saldo}`,
  cuantoSaleDe: (nombre: string) => `Cuánto sale de ${nombre}`,
  noAlcanza: (nombre: string, saldo: string) => `No alcanza: ${nombre} tiene ${saldo}.`,
  quedaEn: (nombre: string, saldo: string) => `${nombre} queda en ${saldo}`,
  cubris: 'Cubrís',
  cubiertoDe: (cubierto: string, falta: string) => `${cubierto} de ${falta}`,
  tePasas: (deMas: string, falta: string) => `Te pasás por ${deMas}: faltan ${falta}.`,
  pasar: (monto: string, nombre: string) => `Pasar ${monto} a ${nombre}`,
} as const;

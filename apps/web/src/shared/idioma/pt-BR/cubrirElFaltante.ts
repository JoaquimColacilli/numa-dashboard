import type { Mensajes } from '../es';

export const cubrirElFaltante = {
  notaDeCocos: 'É a reserva investida: se você usar, a meta atrasa.',
  notaDelHogar: 'É o dinheiro da família.',
  paraCubrir: (nombre, mes) => `Para cobrir ${nombre} de ${mes}`,
  vence: (renglon, dia, falta) => `${renglon} vence no dia ${String(dia)} e ainda faltam ${falta}.`,
  faltanParaElSaldo: (falta, nombre) => `Ainda faltam ${falta} para ${nombre}.`,
  faltanParaElMes: (falta, nombre, mes) => `Ainda faltam ${falta} para ${nombre} de ${mes}.`,
  titulo: 'Cobrir os custos fixos',
  bajadaDelSaldo: (falta) => `Ainda faltam ${falta} para completar o valor`,
  bajadaDelMes: (falta, mes) => `Ainda faltam ${falta} em ${mes}`,
  eligeDelSaldo:
    'Escolha de qual caixinha sai o que falta. O que você passar fica na caixinha: o próximo recebimento só junta o que ainda faltar.',
  eligeDelMes: (mes) =>
    `Escolha de qual caixinha sai o que falta. O que você passar conta para o teto de ${mes}: o próximo recebimento não completa de novo.`,
  deQueTesoroSale: 'De qual caixinha sai',
  tiene: (saldo) => `tem ${saldo}`,
  cuantoSaleDe: (nombre) => `Quanto sai de ${nombre}`,
  noAlcanza: (nombre, saldo) => `Não é suficiente: ${nombre} tem ${saldo}.`,
  quedaEn: (nombre, saldo) => `${nombre} fica com ${saldo}`,
  cubris: 'Coberto',
  cubiertoDe: (cubierto, falta) => `${cubierto} de ${falta}`,
  tePasas: (deMas, falta) => `Passou ${deMas} do necessário: faltam só ${falta}.`,
  pasar: (monto, nombre) => `Passar ${monto} para ${nombre}`,
} satisfies Mensajes['cubrirElFaltante'];

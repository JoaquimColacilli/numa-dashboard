import type { FilaDe } from '@/shared/api';
import { mensajes } from '@/shared/idioma';

export type Cliente = FilaDe<'clientes'>;
export type OrigenDeContacto = NonNullable<Cliente['origen_contacto']>;
export type CondicionFiscal = Cliente['condicion_fiscal'];

export interface DatosDelOrigen {
  id: OrigenDeContacto;
  etiqueta: string;
  detalle: string;
  color: string;
}

export const ORIGENES_EN_ORDEN = [
  'referido',
  'volvio',
  'redes',
  'cartel',
  'otro',
] as const satisfies readonly OrigenDeContacto[];

function delOrigen(id: OrigenDeContacto, color: string): DatosDelOrigen {
  return {
    id,
    get etiqueta() {
      return mensajes().cliente.origenes[id].etiqueta;
    },
    get detalle() {
      return mensajes().cliente.origenes[id].detalle;
    },
    color,
  };
}

export const ORIGEN: Readonly<Record<OrigenDeContacto, DatosDelOrigen>> = {
  referido: delOrigen('referido', 'bg-ink'),
  volvio: delOrigen('volvio', 'bg-hogar'),
  redes: delOrigen('redes', 'bg-text-3'),
  cartel: delOrigen('cartel', 'bg-border'),
  otro: delOrigen('otro', 'bg-hairline'),
};

export interface DatosDeLaCondicion {
  id: CondicionFiscal;
  etiqueta: string;
  corto: string;
  comprobante: string;
}

export const CONDICIONES_EN_ORDEN = [
  'consumidor_final',
  'monotributo',
  'responsable_inscripto',
  'exento',
] as const satisfies readonly CondicionFiscal[];

function deLaCondicion(id: CondicionFiscal, corto: string): DatosDeLaCondicion {
  return {
    id,
    get etiqueta() {
      return mensajes().cliente.condiciones[id].etiqueta;
    },
    corto,
    get comprobante() {
      return mensajes().cliente.condiciones[id].comprobante;
    },
  };
}

export const CONDICION: Readonly<Record<CondicionFiscal, DatosDeLaCondicion>> = {
  consumidor_final: deLaCondicion('consumidor_final', 'CF'),
  monotributo: deLaCondicion('monotributo', 'MT'),
  responsable_inscripto: deLaCondicion('responsable_inscripto', 'RI'),
  exento: deLaCondicion('exento', 'EX'),
};

export function etiquetaDeCuit(condicion: CondicionFiscal): string {
  const { cliente } = mensajes();
  return condicion === 'monotributo' ? cliente.cuitOCuil : cliente.cuit;
}

export function pideDatosFiscales(condicion: CondicionFiscal): boolean {
  return condicion !== 'consumidor_final';
}

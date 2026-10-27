import {
  centavos,
  DIA_DE_PAGO_PROPUESTO,
  esDiaDePago,
  lugarLibreDelReparto,
  MONEDA_DEL_TALLER,
  MONTO_MAXIMO_DE_LA_FILA,
  puntosBasicos,
  TOPE_DE_OBLIGACIONES,
  TOPE_DE_PARTES,
  TOPE_DE_PASOS,
  type BaseDeLaObligacion,
  type Fila,
  type Moneda,
  type Money,
  type PuntosBasicos,
  type QueEsElTesoro,
} from '@maun/domain';

import { lugaresParaSumar, type LugarEnLaFila } from '@/entities/fila';
import { TESORO } from '@/entities/tesoro';
import { mensajes, textosDelIdioma } from '@/shared/idioma';
import { formatearPorcentaje, parsearPorcentaje } from '@/shared/lib';
import type { NombreDeIcono } from '@/shared/ui';

export type LugarDelTesoro = 'estante' | LugarEnLaFila;

export type DondeVa =
  | { lugar: 'estante' }
  | {
      lugar: 'obligacion';
      porcentaje: PuntosBasicos;
      base: BaseDeLaObligacion;
      antesDelDiezmo: boolean;
      montoFijo: Money | null;
    }
  | { lugar: 'compromiso'; monto: Money; dia: number; pagaSola: boolean }
  | { lugar: 'ahorro-fijo'; monto: Money }
  | { lugar: 'reparto'; porcentaje: PuntosBasicos }
  | { lugar: 'superavit' };

export const LUGARES_DEL_TIPO: Readonly<Record<QueEsElTesoro, readonly LugarDelTesoro[]>> = {
  caja: ['estante', 'ahorro-fijo', 'reparto', 'superavit'],
  meta: ['estante', 'ahorro-fijo', 'reparto'],
  'deuda-destinada': ['obligacion'],
  'deuda-obligatoria': ['compromiso'],
};

export function tipoDelLugar(lugar: LugarDelTesoro): QueEsElTesoro | null {
  if (lugar === 'obligacion') return 'deuda-destinada';
  if (lugar === 'compromiso') return 'deuda-obligatoria';
  return null;
}

export function lugarDelTipo(tipo: QueEsElTesoro, inicial: LugarDelTesoro): LugarDelTesoro {
  const lugares = LUGARES_DEL_TIPO[tipo];
  return lugares.includes(inicial) ? inicial : (lugares[0] ?? 'estante');
}

export function tiposPosibles(moneda: Moneda): readonly QueEsElTesoro[] {
  return moneda === MONEDA_DEL_TALLER
    ? ['caja', 'deuda-destinada', 'deuda-obligatoria', 'meta']
    : ['caja', 'meta'];
}

export interface OpcionDeLugar {
  id: LugarDelTesoro;
  titulo: string;
  detalle: string;
  sePuede: boolean;
}

const PORCENTAJE_SUGERIDO = 1000;

const PORCENTAJE_MINIMO = 1;

const PORCENTAJE_MAXIMO = 10_000;

const UN_TESORO_NUEVO = '00000000-0000-0000-0000-000000000000';

export function libreEnElReparto(fila: Pick<Fila, 'reparto'>): PuntosBasicos {
  return lugarLibreDelReparto(fila);
}

function detalleDelLugar(
  fila: Fila,
  lugar: LugarEnLaFila,
  sePuede: boolean,
  nombreDelSuperavit: string,
): string {
  const textos = mensajes().editarTesoro.lugar;
  switch (lugar) {
    case 'obligacion':
      return sePuede ? textos.obligacion : textos.obligacionesLlenas(TOPE_DE_OBLIGACIONES);
    case 'compromiso':
      return sePuede ? textos.compromiso : textos.pasosLlenos(TOPE_DE_PASOS);
    case 'ahorro-fijo':
      return sePuede ? textos.ahorroFijo : textos.pasosLlenos(TOPE_DE_PASOS);
    case 'reparto':
      if (fila.reparto.length >= TOPE_DE_PARTES) return textos.repartoLleno(TOPE_DE_PARTES);
      return libreEnElReparto(fila) <= 0 ? textos.repartoEnCien : textos.reparto;
    case 'superavit':
      return textos.superavit(nombreDelSuperavit);
  }
}

export function dondeEntra(
  lugar: LugarDelTesoro,
  despuesDe: string | null | undefined,
  nombreDe: (tesoro: string) => string,
): string | null {
  const textos = mensajes().editarTesoro.lugar;
  if (lugar === 'estante' || lugar === 'reparto' || lugar === 'superavit') return null;
  if (despuesDe === undefined) return textos.alFinal;
  if (despuesDe === null) return textos.alPrincipio;
  return textos.despuesDe(nombreDe(despuesDe));
}

export function opcionesDeLugar(
  fila: Fila,
  nombreDelSuperavit: string = TESORO.maun.nombre,
  moneda: Moneda = MONEDA_DEL_TALLER,
): OpcionDeLugar[] {
  const m = mensajes();
  if (moneda !== MONEDA_DEL_TALLER) {
    return [
      {
        id: 'estante',
        titulo: m.editarTesoro.lugar.alEstante,
        detalle: m.fila.laFilaRepartePesos,
        sePuede: true,
      },
    ];
  }
  return [
    {
      id: 'estante',
      titulo: m.editarTesoro.lugar.alEstante,
      detalle: m.editarTesoro.lugar.estante,
      sePuede: true,
    },
    ...lugaresParaSumar(fila, UN_TESORO_NUEVO, null).map(({ lugar, titulo, sePuede }) => ({
      id: lugar,
      titulo,
      detalle: detalleDelLugar(fila, lugar, sePuede, nombreDelSuperavit),
      sePuede,
    })),
  ];
}

export function porcentajeSugerido(libre: number): string {
  return formatearPorcentaje(Math.min(PORCENTAJE_SUGERIDO, Math.max(0, libre)));
}

export function fraseDelLibre(
  libre: number,
  texto: string,
  nombreDelSuperavit: string = TESORO.maun.nombre,
): string {
  const textos = mensajes().editarTesoro.lugar;
  const queda = formatearPorcentaje(libre);
  const porcentaje = parsearPorcentaje(texto, libre);
  if (porcentaje === undefined || porcentaje <= 0) return textos.libre(queda);
  const resto = libre - porcentaje;
  if (resto <= 0) return textos.libreHastaCien(queda, formatearPorcentaje(porcentaje));
  return textos.libreConResto(
    queda,
    formatearPorcentaje(porcentaje),
    nombreDelSuperavit,
    formatearPorcentaje(resto),
  );
}

export interface SugerenciaDeNombre {
  nombre: string;
  icono: NombreDeIcono;
  base?: BaseDeLaObligacion;
  antesDelDiezmo?: boolean;
}

function sugerenciasDelLugar(): Readonly<Record<LugarDelTesoro, readonly SugerenciaDeNombre[]>> {
  const nombres = mensajes().editarTesoro.sugerencias;
  const deAhorro: readonly SugerenciaDeNombre[] = [
    { nombre: nombres.stockDelTaller, icono: 'package' },
    { nombre: nombres.maquinaria, icono: 'wrench' },
    { nombre: nombres.vehiculo, icono: 'car' },
    { nombre: nombres.inmueble, icono: 'building-2' },
  ];
  return {
    estante: [],
    obligacion: [
      { nombre: nombres.ingresosBrutos, icono: 'landmark', base: 'cobrado', antesDelDiezmo: true },
    ],
    compromiso: [
      { nombre: nombres.gastosFijos, icono: 'receipt' },
      { nombre: nombres.sueldos, icono: 'coins' },
      { nombre: nombres.alquiler, icono: 'building-2' },
      { nombre: nombres.cuotas, icono: 'landmark' },
    ],
    'ahorro-fijo': deAhorro,
    reparto: deAhorro,
    superavit: [{ nombre: nombres.superavit, icono: 'piggy-bank' }],
  };
}

export const SUGERENCIAS_DEL_LUGAR: Readonly<
  Record<LugarDelTesoro, readonly SugerenciaDeNombre[]>
> = textosDelIdioma(sugerenciasDelLugar);

export interface ErroresDelLugar {
  monto?: string;
  porcentaje?: string;
  montoFijo?: string;
  dia?: string;
}

export interface LoQueSePide {
  monto: number | null;
  porcentaje: string;
  base: BaseDeLaObligacion;
  antesDelDiezmo: boolean;
  conMontoFijo?: boolean;
  montoFijo?: number | null;
  dia?: string;
  pagaSola?: boolean;
}

export const DIA_DE_PAGO_INICIAL = String(DIA_DE_PAGO_PROPUESTO);

const PORCENTAJE_CON_MONTO_FIJO = 100;

export type LugarRevisado =
  { dondeVa: DondeVa; errores?: undefined } | { dondeVa?: undefined; errores: ErroresDelLugar };

function montoRevisado(monto: number | null): Money | string {
  const errores = mensajes().editarTesoro.errores;
  if (monto === null || monto <= 0) return errores.monto;
  if (monto > MONTO_MAXIMO_DE_LA_FILA) return errores.montoGrande;
  return centavos(monto);
}

export function revisarElLugar(
  lugar: LugarDelTesoro,
  {
    monto,
    porcentaje,
    base,
    antesDelDiezmo,
    conMontoFijo = false,
    montoFijo = null,
    dia = DIA_DE_PAGO_INICIAL,
    pagaSola = true,
  }: LoQueSePide,
  fila: Pick<Fila, 'reparto'>,
): LugarRevisado {
  switch (lugar) {
    case 'estante':
      return { dondeVa: { lugar: 'estante' } };
    case 'superavit':
      return { dondeVa: { lugar: 'superavit' } };
    case 'ahorro-fijo': {
      const revisado = montoRevisado(monto);
      return typeof revisado === 'string'
        ? { errores: { monto: revisado } }
        : { dondeVa: { lugar, monto: revisado } };
    }
    case 'compromiso': {
      const revisado = montoRevisado(monto);
      const numero = Number(dia.trim());
      const diaValido = /^\d{1,2}$/.test(dia.trim()) && esDiaDePago(numero);
      const errores: ErroresDelLugar = {
        ...(typeof revisado === 'string' ? { monto: revisado } : {}),
        ...(diaValido ? {} : { dia: mensajes().editarTesoro.errores.diaDePago }),
      };
      if (typeof revisado === 'string' || !diaValido) return { errores };
      return { dondeVa: { lugar, monto: revisado, dia: numero, pagaSola } };
    }
    case 'obligacion': {
      if (conMontoFijo) {
        const revisado = montoRevisado(montoFijo);
        return typeof revisado === 'string'
          ? { errores: { montoFijo: revisado } }
          : {
              dondeVa: {
                lugar,
                porcentaje: puntosBasicos(PORCENTAJE_CON_MONTO_FIJO),
                base,
                antesDelDiezmo,
                montoFijo: revisado,
              },
            };
      }
      const bp = parsearPorcentaje(porcentaje, PORCENTAJE_MAXIMO);
      if (bp === undefined || bp <= 0) {
        return {
          errores: {
            porcentaje: mensajes().editarTesoro.errores.porcentajeDeLaObligacion(
              formatearPorcentaje(PORCENTAJE_MINIMO),
              formatearPorcentaje(PORCENTAJE_MAXIMO),
            ),
          },
        };
      }
      return {
        dondeVa: { lugar, porcentaje: puntosBasicos(bp), base, antesDelDiezmo, montoFijo: null },
      };
    }
    case 'reparto': {
      const libre = libreEnElReparto(fila);
      const bp = parsearPorcentaje(porcentaje, libre);
      if (bp === undefined || bp <= 0) {
        return {
          errores: {
            porcentaje: mensajes().editarTesoro.errores.porcentajeDelReparto(
              formatearPorcentaje(PORCENTAJE_MINIMO),
              formatearPorcentaje(libre),
            ),
          },
        };
      }
      return { dondeVa: { lugar, porcentaje: puntosBasicos(bp) } };
    }
  }
}

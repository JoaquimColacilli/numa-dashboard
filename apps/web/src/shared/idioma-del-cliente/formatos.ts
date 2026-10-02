import { IDIOMA_BASE, MONEDA_DEL_TALLER, type Idioma, type Moneda } from '@maun/domain';

import {
  diaYMes,
  diaYMesCorto,
  fechaConAnio,
  fechaEnUnaFrase,
  fechaLarga,
  formatearPlata,
  formatearPorcentaje,
  nombreDelMes,
} from '@/shared/lib';

export interface FormatosDelCliente {
  idioma: Idioma;
  plata: (centavos: number, moneda: Moneda) => string;
  pesos: (centavos: number) => string;
  pesosParaElBanco: (centavos: number) => string;
  porcentaje: (puntos: number) => string;
  fechaLarga: (fecha: string, hoy: string) => string;
  fechaEnUnaFrase: (fecha: string, hoy: string) => string;
  diaYMes: (fecha: string, hoy: string) => string;
  diaYMesCorto: (fecha: string) => string;
  fechaConAnio: (fecha: string) => string;
  nombreDelMes: (mes: string) => string;
}

export function formatosDelCliente(idioma: Idioma): FormatosDelCliente {
  return {
    idioma,
    plata: (centavos, moneda) => formatearPlata(centavos, moneda, idioma),
    pesos: (centavos) => formatearPlata(centavos, MONEDA_DEL_TALLER, idioma),
    pesosParaElBanco: (centavos) => formatearPlata(centavos, MONEDA_DEL_TALLER, IDIOMA_BASE),
    porcentaje: (puntos) => formatearPorcentaje(puntos, idioma),
    fechaLarga: (fecha, hoy) => fechaLarga(fecha, hoy, idioma),
    fechaEnUnaFrase: (fecha, hoy) => fechaEnUnaFrase(fecha, hoy, idioma),
    diaYMes: (fecha, hoy) => diaYMes(fecha, hoy, idioma),
    diaYMesCorto: (fecha) => diaYMesCorto(fecha, idioma),
    fechaConAnio: (fecha) => fechaConAnio(fecha, idioma),
    nombreDelMes: (mes) => nombreDelMes(mes, idioma),
  };
}

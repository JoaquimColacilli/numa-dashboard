import {
  IDIOMA_BASE,
  MONEDA_DEL_TALLER,
  type Formatos,
  type Idioma,
  type Moneda,
} from '@maun/domain';

import {
  diaYMes,
  diaYMesCorto,
  fechaConAnio,
  fechaDelRotulo,
  fechaEnUnaFrase,
  fechaLarga,
  formatearPlata,
  formatearPorcentaje,
  idiomaEnUso,
  nombreDelMes,
  seudoTexto,
} from '@/shared/lib';

import { textosDelDocumento } from './documento';
import { conElSeudoidioma } from './mensajes';

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
  fechaDelRotulo: (fecha: string) => string;
  nombreDelMes: (mes: string) => string;
}

function enLaPagina(texto: string): string {
  return conElSeudoidioma() && !idiomaEnUso().seudo ? seudoTexto(texto) : texto;
}

export function formatosDelCliente(idioma: Idioma): FormatosDelCliente {
  return {
    idioma,
    plata: (centavos, moneda) => formatearPlata(centavos, moneda, idioma),
    pesos: (centavos) => formatearPlata(centavos, MONEDA_DEL_TALLER, idioma),
    pesosParaElBanco: (centavos) => formatearPlata(centavos, MONEDA_DEL_TALLER, IDIOMA_BASE),
    porcentaje: (puntos) => formatearPorcentaje(puntos, idioma),
    fechaLarga: (fecha, hoy) => enLaPagina(fechaLarga(fecha, hoy, idioma)),
    fechaEnUnaFrase: (fecha, hoy) => enLaPagina(fechaEnUnaFrase(fecha, hoy, idioma)),
    diaYMes: (fecha, hoy) => enLaPagina(diaYMes(fecha, hoy, idioma)),
    diaYMesCorto: (fecha) => enLaPagina(diaYMesCorto(fecha, idioma)),
    fechaConAnio: (fecha) => enLaPagina(fechaConAnio(fecha, idioma)),
    fechaDelRotulo: (fecha) => enLaPagina(fechaDelRotulo(fecha, idioma)),
    nombreDelMes: (mes) => enLaPagina(nombreDelMes(mes, idioma)),
  };
}

export function plataParaElBanco(centavos: number, moneda: Moneda): string {
  return formatearPlata(centavos, moneda, IDIOMA_BASE);
}

export function formatosDelDocumento(idioma: Idioma): Formatos {
  const f = formatosDelCliente(idioma);
  const textos = textosDelDocumento(idioma);
  return {
    plata: (centavos, moneda) => f.plata(centavos, moneda),
    porcentaje: f.porcentaje,
    modificaciones: textos.modificaciones,
    meses: textos.meses,
  };
}

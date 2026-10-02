import type { Idioma } from '@maun/domain';

import {
  formatosDelCliente,
  type ElIdiomaDelCliente,
  type FormatosDelCliente,
  type MensajesDelCliente,
} from '@/shared/idioma-del-cliente';

export type LenguaDelPdf = ElIdiomaDelCliente;

const ESPACIO_FINO = /\u202f/g;

export function sinEspaciosFinos(texto: string): string {
  return texto.replace(ESPACIO_FINO, '\u00a0');
}

export function sinEspaciosFinosEn<T>(valor: T): T {
  return JSON.parse(sinEspaciosFinos(JSON.stringify(valor))) as T;
}

export function formatosDelPdf(idioma: Idioma): FormatosDelCliente {
  const f = formatosDelCliente(idioma);
  return {
    idioma,
    plata: (centavos, moneda) => sinEspaciosFinos(f.plata(centavos, moneda)),
    pesos: (centavos) => sinEspaciosFinos(f.pesos(centavos)),
    pesosParaElBanco: (centavos) => sinEspaciosFinos(f.pesosParaElBanco(centavos)),
    porcentaje: (puntos) => sinEspaciosFinos(f.porcentaje(puntos)),
    fechaLarga: (fecha, hoy) => sinEspaciosFinos(f.fechaLarga(fecha, hoy)),
    fechaEnUnaFrase: (fecha, hoy) => sinEspaciosFinos(f.fechaEnUnaFrase(fecha, hoy)),
    diaYMes: (fecha, hoy) => sinEspaciosFinos(f.diaYMes(fecha, hoy)),
    diaYMesCorto: (fecha) => sinEspaciosFinos(f.diaYMesCorto(fecha)),
    fechaConAnio: (fecha) => sinEspaciosFinos(f.fechaConAnio(fecha)),
    fechaDelRotulo: (fecha) => sinEspaciosFinos(f.fechaDelRotulo(fecha)),
    nombreDelMes: (mes) => sinEspaciosFinos(f.nombreDelMes(mes)),
  };
}

export function lenguaDelPdf(idioma: Idioma, m: MensajesDelCliente): LenguaDelPdf {
  return { idioma, m, f: formatosDelPdf(idioma) };
}

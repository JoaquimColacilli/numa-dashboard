import type { Cuenta, GrupoPorCarga, ResumenDeDias } from '@maun/domain';

import { mensajes } from '@/shared/idioma';
import { etiquetaActual, formatearPorcentaje } from '@/shared/lib';

const NUMEROS = new Map<string, Intl.NumberFormat>();

function redondeado(valor: number): number {
  return Math.round(valor * 10) / 10 + 0;
}

function numero(valor: number): string {
  const etiqueta = etiquetaActual();
  let formato = NUMEROS.get(etiqueta);
  if (formato === undefined) {
    formato = new Intl.NumberFormat(etiqueta, { maximumFractionDigits: 1, useGrouping: false });
    NUMEROS.set(etiqueta, formato);
  }
  return formato.format(redondeado(valor));
}

function enLista(valores: readonly string[]): string {
  return new Intl.ListFormat(etiquetaActual(), { style: 'long', type: 'conjunction' }).format(
    valores,
  );
}

export function enDias(valor: number): string {
  return mensajes().paginaAnalitico.dias(redondeado(valor), numero(valor));
}

export function desvioEnPalabras(desvio: number): string {
  const textos = mensajes().paginaAnalitico;
  if (desvio === 0) return textos.elMismoDia;
  return desvio > 0
    ? textos.diasDespues(redondeado(desvio), numero(desvio))
    : textos.diasAntes(redondeado(-desvio), numero(-desvio));
}

export function resumenDeLosDias(resumen: ResumenDeDias): string {
  const textos = mensajes().paginaAnalitico;
  if (resumen.n === 0) return textos.sinDatos;
  if (resumen.modo === 'mediana') {
    return textos.medianaDeLosDias(
      enDias(resumen.mediana),
      numero(resumen.minimo),
      numero(resumen.maximo),
    );
  }
  const [solo] = resumen.valores;
  if (resumen.valores.length === 1 && solo !== undefined) return enDias(solo);
  return textos.variosDias(enLista(resumen.valores.map(numero)));
}

export function resumenDelDesvio(resumen: ResumenDeDias): string {
  const textos = mensajes().paginaAnalitico;
  if (resumen.n === 0) return textos.sinFechaEstimada;
  if (resumen.modo === 'casos') return enLista(resumen.valores.map(desvioEnPalabras));
  return textos.enLaMediana(desvioEnPalabras(resumen.mediana));
}

export function cuantosTrabajos(n: number): string {
  return mensajes().paginaAnalitico.trabajos(n);
}

export function hayAlgoPorCarga(porCarga: readonly GrupoPorCarga[]): boolean {
  return porCarga.some((grupo) => grupo.demora.n > 0);
}

export function fraseDelDesvio(desvio: ResumenDeDias): string {
  const { precision } = mensajes().paginaAnalitico;
  if (desvio.n === 0) return precision.sinEntregas;
  if (desvio.modo === 'casos') return precision.pocos(desvio.n);
  if (desvio.mediana === 0) return precision.elMismoDia;
  const dias = Math.abs(desvio.mediana);
  return desvio.mediana > 0
    ? precision.despues(redondeado(dias), numero(dias))
    : precision.antes(redondeado(dias), numero(dias));
}

export function fraseDeLosAciertos(cuenta: Cuenta): string {
  const { precision } = mensajes().paginaAnalitico;
  const acertados = String(cuenta.k);
  const total = String(cuenta.n);
  return cuenta.porcentaje === null
    ? precision.aciertos(acertados, total)
    : precision.aciertosConPorcentaje(
        acertados,
        total,
        formatearPorcentaje(cuenta.porcentaje * 100),
      );
}

export function fraseDeLasCumplidas(cuenta: Cuenta): string {
  const { precision } = mensajes().paginaAnalitico;
  const cumplidas = String(cuenta.k);
  const total = String(cuenta.n);
  return cuenta.porcentaje === null
    ? precision.cumplidas(cumplidas, total)
    : precision.cumplidasConPorcentaje(
        cumplidas,
        total,
        formatearPorcentaje(cuenta.porcentaje * 100),
      );
}

export function nombreDeLaCarga(grupo: GrupoPorCarga): string {
  const { porCarga } = mensajes().paginaAnalitico;
  return grupo.hasta === null
    ? porCarga.oMas(String(grupo.desde))
    : porCarga.entre(String(grupo.desde), String(grupo.hasta));
}

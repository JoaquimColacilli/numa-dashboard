import type {
  ColumnaDelPeriodo,
  FechaPrometida,
  LargoDelPeriodo,
  PeriodoResuelto,
} from '@maun/domain';

import { mensajes } from '@/shared/idioma';
import {
  diasHasta,
  diaYMes,
  formatearPesos,
  formatearPorcentaje,
  mesEnUnaFrase,
  nombreDelMes,
} from '@/shared/lib';

const CLAVES_DE_LOS_MESES = [
  'm01',
  'm02',
  'm03',
  'm04',
  'm05',
  'm06',
  'm07',
  'm08',
  'm09',
  'm10',
  'm11',
  'm12',
] as const;

function anioDe(mes: string): string {
  return mes.slice(0, 4);
}

export function conMayuscula(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase() + texto.slice(1);
}

export function pesos(centavos: number): string {
  return formatearPesos(centavos).replace('-', '−');
}

export function porcentaje(entero: number): string {
  return formatearPorcentaje(entero * 100);
}

export function mesCorto(mes: string): string {
  const clave = CLAVES_DE_LOS_MESES[Number(mes.slice(5, 7)) - 1] ?? 'm01';
  return mensajes().paginaEstadisticas.meses[clave];
}

export function mesCortoConAnio(mes: string): string {
  return mensajes().paginaEstadisticas.periodo.mesYAnio(mesCorto(mes), anioDe(mes));
}

export function mesConAnio(mes: string): string {
  return mensajes().paginaEstadisticas.periodo.mesDeOtroAnio(mesEnUnaFrase(mes), anioDe(mes));
}

export function rangoDeMeses(desde: string, hasta: string, conAnio: boolean): string {
  const textos = mensajes().paginaEstadisticas.periodo;
  if (anioDe(desde) !== anioDe(hasta)) {
    return textos.entre(mesCortoConAnio(desde), mesCortoConAnio(hasta));
  }
  const rango = desde === hasta ? mesCorto(desde) : textos.entre(mesCorto(desde), mesCorto(hasta));
  return conAnio ? textos.mesYAnio(rango, anioDe(hasta)) : rango;
}

export function rangoDelPeriodo(resuelto: PeriodoResuelto): string {
  return resuelto.largo === 'todo'
    ? mensajes().paginaEstadisticas.periodo.desde(mesCortoConAnio(resuelto.desde))
    : rangoDeMeses(resuelto.desde, resuelto.hasta, true);
}

export function rangoDelAnterior(resuelto: PeriodoResuelto): string {
  const { anterior } = resuelto;
  if (anterior === null) return '';
  return rangoDeMeses(
    anterior.desde,
    anterior.hasta,
    anioDe(anterior.hasta) !== anioDe(resuelto.hasta),
  );
}

export function comparacionDelPeriodo(resuelto: PeriodoResuelto): string | null {
  if (resuelto.anterior === null) return null;
  const textos = mensajes().paginaEstadisticas.periodo;
  const rango = rangoDelAnterior(resuelto);
  return resuelto.anterior.hastaElMismoDia
    ? textos.contraHastaElMismoDia(rango)
    : textos.contra(rango);
}

export function rangoEnElTexto(resuelto: PeriodoResuelto, hoy: string): string {
  return rangoDeMeses(resuelto.desde, resuelto.hasta, anioDe(resuelto.hasta) !== anioDe(hoy));
}

export function cuandoEnLaFrase(resuelto: PeriodoResuelto, hoy: string): string {
  const textos = mensajes().paginaEstadisticas.periodo;
  if (resuelto.largo === 'todo') return textos.desdeEnLaFrase(mesCortoConAnio(resuelto.desde));
  if (anioDe(resuelto.desde) !== anioDe(resuelto.hasta)) {
    return textos.enLaFrase(mesCortoConAnio(resuelto.desde), mesCortoConAnio(resuelto.hasta));
  }
  const hasta =
    anioDe(resuelto.hasta) === anioDe(hoy)
      ? mesCorto(resuelto.hasta)
      : mesCortoConAnio(resuelto.hasta);
  return textos.enLaFrase(mesCorto(resuelto.desde), hasta);
}

export function probarCon(largo: LargoDelPeriodo): string | null {
  const textos = mensajes().paginaEstadisticas.probaCon;
  if (largo === 'todo') return null;
  return largo === 3 ? textos.tres : largo === 6 ? textos.seis : textos.doce;
}

function primerMes(columna: ColumnaDelPeriodo): string {
  return columna.meses[0] ?? columna.clave;
}

function ultimoMes(columna: ColumnaDelPeriodo): string {
  return columna.meses[columna.meses.length - 1] ?? columna.clave;
}

export function etiquetaDeLaColumna(columna: ColumnaDelPeriodo): string {
  if (columna.agrupado === 'mes') return mesCorto(columna.clave);
  if (columna.agrupado === 'anio') return columna.clave;
  return mensajes().paginaEstadisticas.periodo.trimestre(Number(columna.clave.slice(-1)));
}

export function anioDeLaColumna(columna: ColumnaDelPeriodo): string | null {
  return columna.agrupado === 'anio' ? null : anioDe(primerMes(columna));
}

export function columnaEnLaFrase(columna: ColumnaDelPeriodo, hoy: string): string {
  if (columna.agrupado === 'anio') return columna.clave;
  if (columna.agrupado === 'trimestre') {
    return rangoDeMeses(primerMes(columna), ultimoMes(columna), true);
  }
  return anioDe(columna.clave) === anioDe(hoy)
    ? mesEnUnaFrase(columna.clave)
    : mesConAnio(columna.clave);
}

export function columnaConSuAnio(columna: ColumnaDelPeriodo): string {
  if (columna.agrupado === 'anio') return columna.clave;
  if (columna.agrupado === 'trimestre') {
    return rangoDeMeses(primerMes(columna), ultimoMes(columna), true);
  }
  return mensajes().paginaEstadisticas.periodo.mesYAnio(
    mesEnUnaFrase(columna.clave),
    anioDe(columna.clave),
  );
}

export function columnaEnLaTabla(columna: ColumnaDelPeriodo): string {
  if (columna.agrupado === 'mes') return mesCortoConAnio(columna.clave);
  return columnaConSuAnio(columna);
}

export function columnaAlEmpezar(columna: ColumnaDelPeriodo): string {
  return columna.agrupado === 'mes' ? nombreDelMes(columna.clave) : columnaConSuAnio(columna);
}

export function cuandoSePrometio(prometido: FechaPrometida | null, hoy: string): string {
  const textos = mensajes().paginaEstadisticas.viene;
  if (prometido === null) return textos.sinFechaPrometida;
  const comprometida = prometido.cual === 'comprometida';
  const faltan = diasHasta(prometido.fecha, hoy);
  if (faltan === 0) return comprometida ? textos.prometidoParaHoy : textos.estimadoParaHoy;
  if (faltan > 0 && faltan < 7) {
    return comprometida
      ? textos.prometidoParaElDia(prometido.fecha)
      : textos.estimadoParaElDia(prometido.fecha);
  }
  const dia = diaYMes(prometido.fecha, hoy);
  return comprometida ? textos.prometidoPara(dia) : textos.estimadoPara(dia);
}

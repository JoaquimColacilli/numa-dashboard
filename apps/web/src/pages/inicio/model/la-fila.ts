import {
  BASE_PUNTOS_BASICOS,
  CERO,
  maximo,
  sumarTodos,
  type FilaDelMes,
  type ModoDePaso,
  type Money,
  type PasoDelMes,
  type TipoDelPaso,
  type VencimientoDeLaAgenda,
} from '@maun/domain';

import { modoEnPalabras } from '@/entities/fila';
import { tesoroPorId, type TesoroDelTaller } from '@/entities/tesoro';
import { faltantesDeLosCompromisos } from '@/features/cubrir-el-faltante';
import { mensajes } from '@/shared/idioma';
import {
  diaDelMes,
  diasDelMes,
  formatearPesos,
  formatearPorcentaje,
  mesDeLaFecha,
  type TintaDeTesoro,
} from '@/shared/lib';

const ULTIMO_DIA_DE_LA_PRIMERA_QUINCENA = 15;

type TesoroQueSeMuestra = Pick<TesoroDelTaller, 'id' | 'clave' | 'nombre' | 'tinta'>;

type PasosQueSeLlenan = 'ambos' | 'compromisos' | 'ahorros';

type AdondeVaLoQueSobra = 'queda' | 'va';

function tesoroQueSeMuestra(tesoros: readonly TesoroDelTaller[], id: string): TesoroQueSeMuestra {
  return (
    tesoroPorId(tesoros, id) ?? {
      id,
      clave: null,
      nombre: mensajes().paginaInicio.laFila.tesoro,
      tinta: 'maun',
    }
  );
}

export interface ObligacionEnInicio {
  numero: number;
  tesoro: string;
  nombre: string;
  tinta: TintaDeTesoro;
  regla: string;
  apartado: Money;
  aPagar: Money;
}

export function obligacionesEnInicio(
  delMes: FilaDelMes,
  tesoros: readonly TesoroDelTaller[],
): ObligacionEnInicio[] {
  const { regla } = mensajes().paginaInicio.laFila;
  return delMes.obligaciones.map((obligacion, indice) => {
    const tesoro = tesoroQueSeMuestra(tesoros, obligacion.tesoro);
    return {
      numero: indice + 1,
      tesoro: obligacion.tesoro,
      nombre: tesoro.nombre,
      tinta: tesoro.tinta,
      regla: regla[obligacion.base](formatearPorcentaje(obligacion.porcentaje)),
      apartado: obligacion.apartado,
      aPagar: obligacion.aPagar,
    };
  });
}

export function textoDeLaObligacion(obligacion: Pick<ObligacionEnInicio, 'aPagar'>): string {
  const textos = mensajes().paginaInicio.laFila;
  return obligacion.aPagar > 0 ? textos.aPagar(formatearPesos(obligacion.aPagar)) : textos.alDia;
}

export type EstadoDelPaso = 'cubierto' | 'falta' | 'espera' | 'meta' | 'por-trabajo';

export interface PasoEnInicio {
  numero: number;
  tesoro: string;
  tipo: TipoDelPaso;
  nombre: string;
  clase: string | null;
  tinta: TintaDeTesoro;
  lleva: Money;
  tope: Money;
  falta: Money;
  recibido: Money;
  estado: EstadoDelPaso;
}

function detalleDelPaso(paso: PasoDelMes, tesoro: TesoroQueSeMuestra): string {
  const textos = mensajes().paginaInicio.laFila;
  if (paso.clase === 'sueldo') return textos.sueldo;
  if (paso.clase === 'fijos' && tesoro.clave === 'maun') return textos.costosFijos;
  const modo = modoEnPalabras(paso.modo, paso.tipo);
  return paso.meta !== null && paso.meta.hastaLaMeta ? textos.hastaLaMeta(modo) : modo;
}

function estadoDelPaso(paso: PasoDelMes): EstadoDelPaso {
  if (paso.falta === null) return 'por-trabajo';
  if (paso.meta !== null && paso.meta.hastaLaMeta && paso.meta.llego) return 'meta';
  if (paso.falta <= 0) return 'cubierto';
  return paso.lleva <= 0 ? 'espera' : 'falta';
}

export function pasosEnInicio(
  delMes: FilaDelMes,
  tesoros: readonly TesoroDelTaller[],
  desde: number = delMes.obligaciones.length,
): PasoEnInicio[] {
  return delMes.pasos.map((paso, indice) => {
    const tesoro = tesoroQueSeMuestra(tesoros, paso.tesoro);
    return {
      numero: desde + indice + 1,
      tesoro: paso.tesoro,
      tipo: paso.tipo,
      nombre: tesoro.nombre,
      clase: detalleDelPaso(paso, tesoro),
      tinta: tesoro.tinta,
      lleva: paso.lleva,
      tope: paso.objetivo,
      falta: paso.falta ?? CERO,
      recibido: paso.recibido,
      estado: estadoDelPaso(paso),
    };
  });
}

export function cuantoLleva(paso: Pick<PasoEnInicio, 'estado' | 'lleva' | 'tope'>): string {
  const textos = mensajes().paginaInicio.laFila;
  if (paso.estado === 'por-trabajo') return textos.porCobro(formatearPesos(paso.tope));
  return textos.deTope(formatearPesos(paso.lleva), formatearPesos(paso.tope));
}

export function textoDelEstado(paso: Pick<PasoEnInicio, 'estado' | 'falta' | 'recibido'>): string {
  const textos = mensajes().paginaInicio.laFila;
  switch (paso.estado) {
    case 'cubierto':
      return textos.cubierto;
    case 'espera':
      return textos.esperaSuTurno;
    case 'meta':
      return textos.llegoALaMeta;
    case 'por-trabajo':
      return paso.recibido > 0
        ? textos.recibioEsteMes(formatearPesos(paso.recibido))
        : textos.recibeEnCadaCobro;
    case 'falta':
      return textos.faltan(formatearPesos(paso.falta));
  }
}

export function faltaParaLosTopes(delMes: FilaDelMes): Money {
  return sumarTodos(delMes.pasos.map((paso) => paso.falta ?? CERO));
}

export function ingresoDelMes(delMes: FilaDelMes): string {
  const textos = mensajes().paginaInicio.laFila;
  if (delMes.cobros === 0) return textos.sinCobros;
  return textos.ingresoEnCobros(formatearPesos(delMes.ingreso), delMes.cobros);
}

function losPasos(delMes: FilaDelMes): PasosQueSeLlenan | null {
  const compromisos = delMes.pasos.some((paso) => paso.tipo === 'compromiso');
  const ahorros = delMes.pasos.some((paso) => paso.tipo === 'ahorro-fijo');
  if (compromisos && ahorros) return 'ambos';
  if (compromisos) return 'compromisos';
  return ahorros ? 'ahorros' : null;
}

export function fraseDeLoQueSobra(delMes: FilaDelMes, tesoros: readonly TesoroDelTaller[]): string {
  const { lista, laFila } = mensajes().paginaInicio;
  const { sobra } = laFila;
  const falta = faltaParaLosTopes(delMes);
  const partes = delMes.reparto;
  const pasos = losPasos(delMes);
  const superavit = tesoroQueSeMuestra(tesoros, delMes.superavit.tesoro);
  const adonde: AdondeVaLoQueSobra = superavit.clave === 'maun' ? 'queda' : 'va';
  const faltan = pasos !== null && falta > 0;

  if (partes.length === 0) {
    if (pasos === null) return sobra.deCadaCobro[adonde](superavit.nombre);
    return faltan
      ? sobra.cuandoSeLlenan[adonde][pasos](superavit.nombre, formatearPesos(falta))
      : sobra.yaLlenos[adonde][pasos](superavit.nombre);
  }

  const nombre = (id: string) => tesoroQueSeMuestra(tesoros, id).nombre;

  if (delMes.repartoEmpezo) {
    const recibieron = partes.filter((parte) => parte.recibido > 0);
    const repartido = sumarTodos(recibieron.map((parte) => parte.recibido));
    return sobra.yaSeRepartieron[adonde](
      formatearPesos(repartido),
      lista(
        recibieron.map((parte) =>
          sobra.recibio(nombre(parte.tesoro), formatearPesos(parte.recibido)),
        ),
      ),
      superavit.nombre,
    );
  }

  const suma = partes.reduce((total, parte) => total + parte.porcentaje, 0);
  const porcentajes = partes.map((parte) =>
    parte.hastaLaMeta && parte.meta !== null
      ? sobra.parteHastaSuMeta(nombre(parte.tesoro), formatearPorcentaje(parte.porcentaje))
      : sobra.parte(nombre(parte.tesoro), formatearPorcentaje(parte.porcentaje)),
  );
  const reparto = sobra.reparto(
    lista(
      suma >= BASE_PUNTOS_BASICOS ? porcentajes : [...porcentajes, sobra.elResto(superavit.nombre)],
    ),
  );

  const cuando =
    pasos === null
      ? sobra.elProximoCobroSeReparte
      : faltan
        ? sobra.seReparteCuandoSeLlenan[pasos](formatearPesos(falta))
        : sobra.yaLlenosYSeReparte[pasos];
  return `${cuando} ${reparto}`;
}

export interface FaltanteEnInicio {
  tesoro: string;
  nombre: string;
  modo: ModoDePaso;
  falta: Money;
  vence: VencimientoDeLaAgenda | null;
}

export function nombreEnLaFrase(tesoro: Pick<TesoroQueSeMuestra, 'clave' | 'nombre'>): string {
  const textos = mensajes().paginaInicio.laFila;
  if (tesoro.clave === 'maun') return textos.losCostosFijos;
  if (tesoro.clave !== null) return tesoro.nombre;
  return textos.tesoroEnLaFrase(tesoro.nombre);
}

export function faltantesEnInicio(
  delMes: FilaDelMes,
  tesoros: readonly TesoroDelTaller[],
  vencimientos: readonly VencimientoDeLaAgenda[],
  hoy: string,
): FaltanteEnInicio[] {
  return faltantesDeLosCompromisos(delMes, vencimientos, hoy).map((faltante) => ({
    tesoro: faltante.tesoro,
    nombre: nombreEnLaFrase(tesoroQueSeMuestra(tesoros, faltante.tesoro)),
    modo: faltante.modo,
    falta: maximo(faltante.falta, CERO),
    vence: faltante.vence,
  }));
}

export function diasQueQuedan(hoy: string): number {
  return diasDelMes(mesDeLaFecha(hoy)) - diaDelMes(hoy);
}

export function fraseDeLosDiasQueQuedan(hoy: string): string | null {
  if (diaDelMes(hoy) <= ULTIMO_DIA_DE_LA_PRIMERA_QUINCENA) return null;
  const textos = mensajes().paginaInicio.laFila;
  return `${textos.diasQueQuedan(diasQueQuedan(hoy))} ${textos.elProximoCobroLosLlena}`;
}

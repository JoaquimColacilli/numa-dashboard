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

import { BASE_EN_PALABRAS, modoEnPalabras } from '@/entities/fila';
import { tesoroPorId, type TesoroDelTaller } from '@/entities/tesoro';
import { faltantesDeLosCompromisos } from '@/features/cubrir-el-faltante';
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

function tesoroQueSeMuestra(tesoros: readonly TesoroDelTaller[], id: string): TesoroQueSeMuestra {
  return tesoroPorId(tesoros, id) ?? { id, clave: null, nombre: 'Tesoro', tinta: 'maun' };
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
  return delMes.obligaciones.map((obligacion, indice) => {
    const tesoro = tesoroQueSeMuestra(tesoros, obligacion.tesoro);
    return {
      numero: indice + 1,
      tesoro: obligacion.tesoro,
      nombre: tesoro.nombre,
      tinta: tesoro.tinta,
      regla: `${formatearPorcentaje(obligacion.porcentaje)}% ${BASE_EN_PALABRAS[obligacion.base]}`,
      apartado: obligacion.apartado,
      aPagar: obligacion.aPagar,
    };
  });
}

export function textoDeLaObligacion(obligacion: Pick<ObligacionEnInicio, 'aPagar'>): string {
  return obligacion.aPagar > 0 ? `A pagar ${formatearPesos(obligacion.aPagar)}` : 'Al día';
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
  if (paso.clase === 'sueldo') return 'sueldo';
  if (paso.clase === 'fijos' && tesoro.clave === 'maun') return 'costos fijos';
  const modo = modoEnPalabras(paso.modo, paso.tipo);
  return paso.meta !== null && paso.meta.hastaLaMeta ? `${modo} · hasta la meta` : modo;
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
  if (paso.estado === 'por-trabajo') return `${formatearPesos(paso.tope)} por cobro`;
  return `${formatearPesos(paso.lleva)} de ${formatearPesos(paso.tope)}`;
}

export function textoDelEstado(paso: Pick<PasoEnInicio, 'estado' | 'falta' | 'recibido'>): string {
  switch (paso.estado) {
    case 'cubierto':
      return 'Cubierto';
    case 'espera':
      return 'Espera su turno';
    case 'meta':
      return 'Llegó a la meta';
    case 'por-trabajo':
      return paso.recibido > 0
        ? `Recibió ${formatearPesos(paso.recibido)} este mes`
        : 'Recibe su monto en cada cobro';
    case 'falta':
      return `Faltan ${formatearPesos(paso.falta)}`;
  }
}

export function faltaParaLosTopes(delMes: FilaDelMes): Money {
  return sumarTodos(delMes.pasos.map((paso) => paso.falta ?? CERO));
}

export function ingresoDelMes(delMes: FilaDelMes): string {
  if (delMes.cobros === 0) return 'Todavía no hubo cobros este mes';
  const cobros = delMes.cobros === 1 ? 'un cobro' : `${String(delMes.cobros)} cobros`;
  return `${formatearPesos(delMes.ingreso)} de ingreso en ${cobros}`;
}

function enLista(partes: readonly string[]): string {
  const ultima = partes.at(-1) ?? '';
  if (partes.length < 2) return ultima;
  return `${partes.slice(0, -1).join(', ')} y ${ultima}`;
}

function losPasos(delMes: FilaDelMes): string | null {
  const compromisos = delMes.pasos.some((paso) => paso.tipo === 'compromiso');
  const ahorros = delMes.pasos.some((paso) => paso.tipo === 'ahorro-fijo');
  if (compromisos && ahorros) return 'los compromisos y los ahorros fijos';
  if (compromisos) return 'los compromisos';
  return ahorros ? 'los ahorros fijos' : null;
}

function conMayuscula(texto: string): string {
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}`;
}

export function fraseDeLoQueSobra(delMes: FilaDelMes, tesoros: readonly TesoroDelTaller[]): string {
  const falta = faltaParaLosTopes(delMes);
  const partes = delMes.reparto;
  const pasos = losPasos(delMes);
  const superavit = tesoroQueSeMuestra(tesoros, delMes.superavit.tesoro);
  const enElTaller = superavit.clave === 'maun';
  const queda = enElTaller ? `queda en ${superavit.nombre}` : `va a ${superavit.nombre}`;
  const llenos = pasos === null ? '' : `${conMayuscula(pasos)} ya están llenos: `;

  if (partes.length === 0) {
    if (pasos !== null && falta > 0) {
      return `Cuando se llenan ${pasos}, lo que sobra ${queda}: faltan ${formatearPesos(falta)}.`;
    }
    return conMayuscula(`${llenos}lo que sobra de cada cobro ${queda}.`);
  }

  const nombre = (id: string) => tesoroQueSeMuestra(tesoros, id).nombre;

  if (delMes.repartoEmpezo) {
    const recibieron = partes.filter((parte) => parte.recibido > 0);
    const repartido = sumarTodos(recibieron.map((parte) => parte.recibido));
    const lista = enLista(
      recibieron.map((parte) => `${nombre(parte.tesoro)} ${formatearPesos(parte.recibido)}`),
    );
    const quedo = enElTaller ? `quedó en ${superavit.nombre}` : `fue a ${superavit.nombre}`;
    return `Ya se repartieron ${formatearPesos(repartido)}: ${lista}. El resto ${quedo}.`;
  }

  const suma = partes.reduce((total, parte) => total + parte.porcentaje, 0);
  const porcentajes = partes.map(
    (parte) =>
      `${nombre(parte.tesoro)} ${formatearPorcentaje(parte.porcentaje)}%${
        parte.hastaLaMeta && parte.meta !== null ? ' hasta su meta' : ''
      }`,
  );
  const reparto =
    suma >= BASE_PUNTOS_BASICOS
      ? `${enLista(porcentajes)}.`
      : `${porcentajes.join(', ')} y ${superavit.nombre} el resto.`;

  if (pasos !== null && falta > 0) {
    return `Se reparte cuando se llenan ${pasos}: faltan ${formatearPesos(falta)}. ${reparto}`;
  }
  return conMayuscula(`${llenos}lo que deje el próximo cobro se reparte. ${reparto}`);
}

export interface FaltanteEnInicio {
  tesoro: string;
  nombre: string;
  modo: ModoDePaso;
  falta: Money;
  vence: VencimientoDeLaAgenda | null;
}

function enMinuscula(nombre: string): string {
  const [primera = '', segunda = ''] = nombre;
  if (segunda !== segunda.toLowerCase()) return nombre;
  return `${primera.toLowerCase()}${nombre.slice(1)}`;
}

export function nombreEnLaFrase(tesoro: Pick<TesoroQueSeMuestra, 'clave' | 'nombre'>): string {
  if (tesoro.clave === 'maun') return 'los costos fijos';
  if (tesoro.clave !== null) return tesoro.nombre;
  return enMinuscula(tesoro.nombre);
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
  const quedan = diasQueQuedan(hoy);
  const cuantos =
    quedan === 0
      ? 'Hoy es el último día del mes.'
      : quedan === 1
        ? 'Queda un día del mes.'
        : `Quedan ${String(quedan)} días del mes.`;
  return `${cuantos} El próximo cobro los llena primero, o cubrilos ahora con otro tesoro.`;
}

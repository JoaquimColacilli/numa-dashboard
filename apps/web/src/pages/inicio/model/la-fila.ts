import {
  BASE_PUNTOS_BASICOS,
  CERO,
  maximo,
  sumarTodos,
  type ClaseDePaso,
  type FilaDelMes,
  type Money,
} from '@maun/domain';

import { faltantesDeGastosFijos } from '@/entities/fila';
import { tesoroPorId, type TesoroDelTaller } from '@/entities/tesoro';
import {
  diaDelMes,
  diasDelMes,
  formatearPesos,
  formatearPorcentaje,
  mesDeLaFecha,
  type TintaDeTesoro,
} from '@/shared/lib';

const ULTIMO_DIA_DE_LA_PRIMERA_QUINCENA = 15;

const NOMBRE_DE_LA_CLASE: Readonly<Record<ClaseDePaso, string>> = {
  sueldo: 'sueldo',
  fijos: 'gastos fijos',
  prioridad: 'prioridad',
};

type TesoroQueSeMuestra = Pick<TesoroDelTaller, 'id' | 'clave' | 'nombre' | 'tinta'>;

function tesoroQueSeMuestra(tesoros: readonly TesoroDelTaller[], id: string): TesoroQueSeMuestra {
  return tesoroPorId(tesoros, id) ?? { id, clave: null, nombre: 'Tesoro', tinta: 'maun' };
}

export type EstadoDelPaso = 'cubierto' | 'falta' | 'espera';

export interface PasoEnInicio {
  numero: number;
  tesoro: string;
  nombre: string;
  clase: string | null;
  tinta: TintaDeTesoro;
  lleva: Money;
  tope: Money;
  falta: Money;
  estado: EstadoDelPaso;
}

export function pasosEnInicio(
  delMes: FilaDelMes,
  tesoros: readonly TesoroDelTaller[],
): PasoEnInicio[] {
  return delMes.pasos.map((paso, indice) => {
    const tesoro = tesoroQueSeMuestra(tesoros, paso.tesoro);
    const clase = NOMBRE_DE_LA_CLASE[paso.clase];
    const lleva = sumarTodos([paso.recibido, paso.cubierto]);
    return {
      numero: indice + 1,
      tesoro: paso.tesoro,
      nombre: tesoro.nombre,
      clase: clase === tesoro.nombre.toLowerCase() ? null : clase,
      tinta: tesoro.tinta,
      lleva,
      tope: paso.objetivo,
      falta: paso.falta,
      estado: paso.falta <= 0 ? 'cubierto' : lleva <= 0 ? 'espera' : 'falta',
    };
  });
}

export function textoDelEstado(paso: Pick<PasoEnInicio, 'estado' | 'falta'>): string {
  if (paso.estado === 'cubierto') return 'Cubierto';
  if (paso.estado === 'espera') return 'Espera su turno';
  return `Faltan ${formatearPesos(paso.falta)}`;
}

export function faltaParaLosTopes(delMes: FilaDelMes): Money {
  return sumarTodos(delMes.pasos.map((paso) => paso.falta));
}

export function gananciaDelMes(delMes: FilaDelMes): string {
  if (delMes.cobros === 0) return 'Todavía no hubo cobros este mes';
  const cobros = delMes.cobros === 1 ? 'un cobro' : `${String(delMes.cobros)} cobros`;
  return `${formatearPesos(delMes.ganancia)} de ganancia en ${cobros}`;
}

function enLista(partes: readonly string[]): string {
  const ultima = partes.at(-1) ?? '';
  if (partes.length < 2) return ultima;
  return `${partes.slice(0, -1).join(', ')} y ${ultima}`;
}

export function fraseDeLoQueSobra(delMes: FilaDelMes, tesoros: readonly TesoroDelTaller[]): string {
  const falta = faltaParaLosTopes(delMes);
  const partes = delMes.reparto;

  if (partes.length === 0) {
    return falta > 0
      ? `Cuando se llenan los topes, lo que sobra queda en Maun: faltan ${formatearPesos(falta)}.`
      : 'Los topes ya están llenos: lo que sobra de cada cobro queda en Maun.';
  }

  const nombre = (id: string) => tesoroQueSeMuestra(tesoros, id).nombre;

  if (delMes.repartoEmpezo) {
    const recibieron = partes.filter((parte) => parte.recibido > 0);
    const repartido = sumarTodos(recibieron.map((parte) => parte.recibido));
    const lista = enLista(
      recibieron.map((parte) => `${nombre(parte.tesoro)} ${formatearPesos(parte.recibido)}`),
    );
    return `Ya se repartieron ${formatearPesos(repartido)}: ${lista}. El resto quedó en Maun.`;
  }

  const suma = partes.reduce((total, parte) => total + parte.porcentaje, 0);
  const porcentajes = partes.map(
    (parte) => `${nombre(parte.tesoro)} ${formatearPorcentaje(parte.porcentaje)}%`,
  );
  const reparto =
    suma >= BASE_PUNTOS_BASICOS
      ? `${enLista(porcentajes)}.`
      : `${porcentajes.join(', ')} y Maun el resto.`;

  return falta > 0
    ? `Se reparte cuando se llenan los topes: faltan ${formatearPesos(falta)}. ${reparto}`
    : `Los topes ya están llenos: lo que deje el próximo cobro se reparte. ${reparto}`;
}

export interface FaltanteEnInicio {
  tesoro: string;
  nombre: string;
  falta: Money;
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
): FaltanteEnInicio[] {
  return faltantesDeGastosFijos(delMes).map((paso) => ({
    tesoro: paso.tesoro,
    nombre: nombreEnLaFrase(tesoroQueSeMuestra(tesoros, paso.tesoro)),
    falta: maximo(paso.falta, CERO),
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

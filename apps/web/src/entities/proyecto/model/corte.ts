import { CERO, maximo, mesDe, restar, sumar, sumarTodos, type Money } from '@maun/domain';

import {
  filasDe,
  idDeLaClave,
  liquidacionesDelMesDeLaReplica,
  tesorosDeLaReplica,
  type Replica,
  type Tesoro,
} from '@/shared/api';
import {
  nombreDelMes,
  TESORO,
  TESOROS_EN_ORDEN,
  tintaDelTesoro,
  type TintaDeTesoro,
} from '@/shared/lib';
import type { PiezaDelTablero } from '@/shared/ui';

import { distribucionCongelada } from './despiece';
import { porcentaje } from './porcentaje';

export interface ParteDelCorte {
  tesoro: string;
  clave: Tesoro | null;
  nombre: string;
  tinta: TintaDeTesoro;
  monto: Money;
}

export interface CorteDelMes {
  trabajos: number;
  tablero: Money;
  partes: readonly ParteDelCorte[];
  gastos: Money;
}

const A_DONDE_VA: Readonly<Partial<Record<Tesoro, string>>> = {
  hogar: 'al hogar',
  maun: 'al taller',
  diezmo: 'al diezmo',
};

interface DatosDeLaParte {
  clave: Tesoro | null;
  nombre: string;
  tinta: TintaDeTesoro;
  lugar: number;
}

function datosDeLasPartes(replica: Replica): (id: string) => DatosDeLaParte {
  const tesoros = tesorosDeLaReplica(replica);
  return (id) => {
    const lugar = tesoros.findIndex((tesoro) => tesoro.id === id);
    const tesoro = tesoros[lugar];
    if (tesoro !== undefined) {
      return {
        clave: tesoro.clave,
        nombre: tesoro.nombre,
        tinta: tintaDelTesoro(tesoro.tinta),
        lugar,
      };
    }
    const clave = TESOROS_EN_ORDEN.find((una) => una === id);
    if (clave !== undefined) {
      return {
        clave,
        nombre: TESORO[clave].nombre,
        tinta: clave,
        lugar: TESOROS_EN_ORDEN.indexOf(clave),
      };
    }
    return { clave: null, nombre: 'Tesoro', tinta: 'maun', lugar: Number.MAX_SAFE_INTEGER };
  };
}

function loQueRecibioCadaTesoro(replica: Replica, mes: string): Map<string, Money> {
  const diezmo = idDeLaClave(replica, 'diezmo');
  const maun = idDeLaClave(replica, 'maun');
  const recibido = new Map<string, Money>();
  const sumarAl = (tesoro: string, monto: Money) => {
    if (monto <= 0) return;
    recibido.set(tesoro, sumar(recibido.get(tesoro) ?? CERO, monto));
  };

  for (const liquidacion of liquidacionesDelMesDeLaReplica(replica)) {
    if (mesDe(liquidacion.fecha) !== mes) continue;
    sumarAl(diezmo, liquidacion.diezmo);
    for (const aporte of liquidacion.aportes) sumarAl(aporte.tesoro, aporte.monto);
    sumarAl(maun, maximo(liquidacion.remanente, CERO));
  }
  return recibido;
}

export function corteDelMes(replica: Replica, mes: string): CorteDelMes | null {
  let trabajos = 0;
  let tablero = CERO;
  for (const proyecto of filasDe(replica, 'proyectos')) {
    if (proyecto.fecha_cobro === null || mesDe(proyecto.fecha_cobro) !== mes) continue;
    const distribucion = distribucionCongelada(proyecto);
    if (distribucion === null) continue;
    trabajos += 1;
    tablero = sumar(tablero, distribucion.cobrado);
  }
  if (trabajos === 0) return null;

  const datosDe = datosDeLasPartes(replica);
  const partes = [...loQueRecibioCadaTesoro(replica, mes)]
    .map(([tesoro, monto]) => ({ tesoro, monto, datos: datosDe(tesoro) }))
    .sort((una, otra) => otra.monto - una.monto || una.datos.lugar - otra.datos.lugar)
    .map(({ tesoro, monto, datos: { clave, nombre, tinta } }) => ({
      tesoro,
      clave,
      nombre,
      tinta,
      monto,
    }));

  return {
    trabajos,
    tablero,
    partes,
    gastos: restar(tablero, sumarTodos(partes.map((parte) => parte.monto))),
  };
}

export function piezasDelCorte(corte: CorteDelMes): PiezaDelTablero[] {
  if (corte.tablero === 0) return [];
  const piezas: { id: string; tono: PiezaDelTablero['tono']; nombre: string; monto: Money }[] = [
    ...corte.partes.map((parte) => ({
      id: parte.clave ?? parte.tesoro,
      tono: parte.tinta,
      nombre: parte.nombre,
      monto: parte.monto,
    })),
    { id: 'gastos', tono: 'sobrante', nombre: 'Gastos', monto: corte.gastos },
  ];

  return piezas
    .filter((pieza) => pieza.monto > 0)
    .map(({ monto, ...pieza }) => {
      const parte = monto / corte.tablero;
      return { ...pieza, parte, porcentaje: porcentaje(parte) };
    });
}

function enLista(partes: readonly string[]): string {
  const ultima = partes.at(-1) ?? '';
  if (partes.length < 2) return ultima;
  return `${partes.slice(0, -1).join(', ')} y ${ultima}`;
}

function parteDelTablero(monto: Money, tablero: Money): string {
  const texto = porcentaje(monto / tablero);
  return texto === '0%' ? 'menos del 1%' : texto;
}

function aDondeVa(parte: ParteDelCorte): string {
  return (parte.clave === null ? undefined : A_DONDE_VA[parte.clave]) ?? `a ${parte.nombre}`;
}

export function fraseDelCorte(corte: CorteDelMes | null, mes: string): string {
  const nombre = nombreDelMes(mes);
  if (corte === null) {
    return `${nombre} todavía no se cortó. Cuando cierres un trabajo, acá vas a ver a dónde va cada peso.`;
  }

  const enElMes = nombre.toLowerCase();
  const cerrados =
    corte.trabajos === 1
      ? `Un trabajo cerrado en ${enElMes}`
      : `${String(corte.trabajos)} trabajos cerrados en ${enElMes}`;
  if (corte.tablero === 0) return `${cerrados}, sin nada cobrado: no hubo nada para repartir.`;

  const partes = corte.partes
    .filter((parte) => parte.monto > 0)
    .map((parte) => `${parteDelTablero(parte.monto, corte.tablero)} ${aDondeVa(parte)}`);
  if (partes.length === 0) {
    return `${cerrados}, y los gastos se comieron lo cobrado: no quedó ingreso para repartir.`;
  }

  const gastos = corte.gastos > 0 ? ' Lo demás fueron gastos.' : '';
  return `${cerrados}: ${enLista(partes)}.${gastos}`;
}

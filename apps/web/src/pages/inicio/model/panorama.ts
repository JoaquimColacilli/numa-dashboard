import {
  CERO,
  claveDelNombre,
  maximo,
  restar,
  sumarTodos,
  tipoDelPaso,
  type Fila,
  type FilaDelMes,
  type Money,
  type MovimientoDelLibro,
  type TesorosDelSistema,
} from '@maun/domain';

import { loQueHayQuePagar, tiposDelTesoro } from '@/entities/fila';
import type { TesoroDelTaller } from '@/entities/tesoro';

export const AYUDA_DEL_PANORAMA = 'Dónde está la plata y para qué la podés usar.';

export interface EntradaDelPanorama {
  fila: Fila;
  delMes: FilaDelMes;
  sistema: TesorosDelSistema;
  tesoros: readonly TesoroDelTaller[];
  movimientos: readonly MovimientoDelLibro[];
  insumos: Money;
  trabajosConInsumos: number;
}

export interface PanoramaDelTaller {
  paraPagar: Money;
  ahorros: Money;
  superavit: Money;
  insumos: Money;
  compromisoDeMaun: Money;
  tesorosParaPagar: number;
  tesorosDeAhorro: number;
  tesoroDelSuperavit: string;
  trabajosConInsumos: number;
}

export function gastadoEnLosRenglones(
  movimientos: readonly MovimientoDelLibro[],
  tesoro: string,
  renglones: readonly string[],
  mes: string,
): Money {
  const claves = new Set(
    renglones.map((renglon) => claveDelNombre(renglon)).filter((clave) => clave !== ''),
  );
  return sumarTodos(
    movimientos
      .filter(
        (movimiento) =>
          movimiento.tipo === 'gasto' &&
          movimiento.desdeId === tesoro &&
          movimiento.fecha.startsWith(`${mes}-`) &&
          claves.has(claveDelNombre(movimiento.categoria)),
      )
      .map((movimiento) => movimiento.monto),
  );
}

export function compromisoDeMaun({
  fila,
  delMes,
  sistema,
  movimientos,
}: Pick<EntradaDelPanorama, 'fila' | 'delMes' | 'sistema' | 'movimientos'>): Money {
  const paso = fila.pasos.find(
    (candidato) =>
      candidato.tesoro === sistema.maun && tipoDelPaso(candidato.clase) === 'compromiso',
  );
  const delPaso = delMes.pasos.find((candidato) => candidato.tesoro === sistema.maun);
  if (paso === undefined || delPaso === undefined) return CERO;
  const gastado = gastadoEnLosRenglones(
    movimientos,
    sistema.maun,
    paso.renglones.map((renglon) => renglon.nombre),
    delMes.mes,
  );
  return maximo(CERO, restar(delPaso.lleva, gastado));
}

function esDeAhorro(
  fila: Fila,
  sistema: TesorosDelSistema,
  tesoro: Pick<TesoroDelTaller, 'id'>,
): boolean {
  if (tesoro.id === fila.superavit) return false;
  if (tesoro.id === sistema.hogar || tesoro.id === sistema.maun) return false;
  if (tesoro.id === sistema.diezmo) return false;
  const tipos = tiposDelTesoro(fila, tesoro.id);
  if (tipos.includes('obligacion') || tipos.includes('compromiso')) return false;
  return true;
}

export function panoramaDelTaller(entrada: EntradaDelPanorama): PanoramaDelTaller {
  const { fila, delMes, sistema, tesoros, insumos } = entrada;
  const deMaun = compromisoDeMaun(entrada);
  const aPagar = loQueHayQuePagar(delMes).map((renglon) => renglon.aPagar);
  const ahorros = tesoros.filter(
    (tesoro) => !tesoro.archivado && esDeAhorro(fila, sistema, tesoro),
  );

  const delSuperavit = tesoros.find((tesoro) => tesoro.id === fila.superavit)?.saldo ?? CERO;
  const superavit =
    fila.superavit === sistema.maun ? restar(restar(delSuperavit, insumos), deMaun) : delSuperavit;

  return {
    paraPagar: sumarTodos([...aPagar, deMaun]),
    ahorros: sumarTodos(ahorros.map((tesoro) => tesoro.saldo)),
    superavit,
    insumos,
    compromisoDeMaun: deMaun,
    tesorosParaPagar: [...aPagar, deMaun].filter((monto) => monto > 0).length,
    tesorosDeAhorro: ahorros.length,
    tesoroDelSuperavit: fila.superavit,
    trabajosConInsumos: entrada.trabajosConInsumos,
  };
}

function enTesoros(cuantos: number): string {
  return cuantos === 1 ? 'en un tesoro' : `en ${String(cuantos)} tesoros`;
}

export interface CifraDelPanorama {
  id: 'para-pagar' | 'ahorros' | 'superavit' | 'insumos';
  etiqueta: string;
  monto: Money;
  detalle: string;
}

export function cifrasDelPanorama(
  panorama: PanoramaDelTaller,
  nombreDelSuperavit: string,
): CifraDelPanorama[] {
  const trabajos = panorama.trabajosConInsumos;
  return [
    {
      id: 'para-pagar',
      etiqueta: 'Para pagar',
      monto: panorama.paraPagar,
      detalle:
        panorama.tesorosParaPagar === 0 ? 'nada pendiente' : enTesoros(panorama.tesorosParaPagar),
    },
    {
      id: 'ahorros',
      etiqueta: 'Ahorros',
      monto: panorama.ahorros,
      detalle:
        panorama.tesorosDeAhorro === 0
          ? 'todavía sin ahorros'
          : enTesoros(panorama.tesorosDeAhorro),
    },
    {
      id: 'superavit',
      etiqueta: 'Superávit',
      monto: panorama.superavit,
      detalle:
        panorama.superavit < 0
          ? `en ${nombreDelSuperavit}, que no alcanza`
          : `en ${nombreDelSuperavit}`,
    },
    {
      id: 'insumos',
      etiqueta: 'Insumos de los trabajos',
      monto: panorama.insumos,
      detalle:
        trabajos === 0
          ? 'sin trabajos en curso'
          : trabajos === 1
            ? 'de un trabajo'
            : `de ${String(trabajos)} trabajos`,
    },
  ];
}

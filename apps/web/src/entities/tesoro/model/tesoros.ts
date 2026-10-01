import { CERO, type Money } from '@maun/domain';

import {
  saldosEnLaMonedaDelTaller,
  tesorosDeLaReplica,
  type Replica,
  type Tesoro,
  type TesoroDeLaReplica,
} from '@/shared/api';
import {
  iconoDelTesoro,
  TESORO,
  TESOROS_EN_ORDEN,
  tintaDelTesoro,
  type TintaDeTesoro,
} from '@/shared/lib';
import type { NombreDeIcono } from '@/shared/ui';

export interface TesoroDelTaller extends Omit<TesoroDeLaReplica, 'tinta' | 'icono'> {
  tinta: TintaDeTesoro;
  icono: NombreDeIcono;
  saldo: Money;
}

function deSiempre(clave: Tesoro): TesoroDeLaReplica {
  const datos = TESORO[clave];
  return {
    id: clave,
    clave,
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    tinta: clave,
    icono: datos.icono,
    meta: null,
    rindeAnualBp: null,
    orden: TESOROS_EN_ORDEN.indexOf(clave),
    archivado: false,
  };
}

export function tesorosSincronizados(replica: Replica): boolean {
  return tesorosDeLaReplica(replica).length > 0;
}

export function tesorosDelTaller(replica: Replica): TesoroDelTaller[] {
  const replicados = tesorosDeLaReplica(replica);
  const tesoros = replicados.length > 0 ? replicados : TESOROS_EN_ORDEN.map(deSiempre);
  const saldos = saldosEnLaMonedaDelTaller(replica);
  return tesoros.map((tesoro) => ({
    ...tesoro,
    tinta: tintaDelTesoro(tesoro.tinta),
    icono: iconoDelTesoro(tesoro.icono),
    saldo: saldos.get(tesoro.id) ?? CERO,
  }));
}

export function tesorosVivos(tesoros: readonly TesoroDelTaller[]): TesoroDelTaller[] {
  return tesoros.filter((tesoro) => !tesoro.archivado);
}

export function tesoroPorId(
  tesoros: readonly TesoroDelTaller[],
  id: string,
): TesoroDelTaller | undefined {
  return tesoros.find((tesoro) => tesoro.id === id);
}

export function tesoroDeLaClave(
  tesoros: readonly TesoroDelTaller[],
  clave: Tesoro,
): TesoroDelTaller | undefined {
  return tesoros.find((tesoro) => tesoro.clave === clave);
}

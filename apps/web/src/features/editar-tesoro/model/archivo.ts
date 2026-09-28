import { tesorosDeLaFila } from '@maun/domain';

import type { TesoroDelTaller } from '@/entities/tesoro';
import {
  filaDelTaller,
  filasDe,
  reaperturaDeLaFila,
  type MovimientoNuevo,
  type Replica,
} from '@/shared/api';

export type PorQueNoSeArchiva =
  | { motivo: 'de-siempre' }
  | { motivo: 'en-la-fila' }
  | { motivo: 'en-un-cobro-reabierto'; trabajo: string };

export const QUE_HACER_PARA_ARCHIVAR =
  'Sacalo de la fila, cobrá el trabajo reabierto que lo usa y pasá su plata a otro tesoro. Después archivalo.';

export function porQueNoSeArchiva(
  replica: Replica,
  tesoro: Pick<TesoroDelTaller, 'id' | 'clave'>,
): PorQueNoSeArchiva | null {
  if (tesoro.clave !== null) return { motivo: 'de-siempre' };

  const { fila, guardada } = filaDelTaller(replica);
  if (guardada && tesorosDeLaFila(fila).includes(tesoro.id)) return { motivo: 'en-la-fila' };

  for (const proyecto of filasDe(replica, 'proyectos')) {
    const reapertura = reaperturaDeLaFila(replica, proyecto);
    if (reapertura !== null && tesorosDeLaFila(reapertura.fila).includes(tesoro.id)) {
      return { motivo: 'en-un-cobro-reabierto', trabajo: proyecto.titulo };
    }
  }
  return null;
}

export function porQueEnPalabras(nombre: string, razon: PorQueNoSeArchiva): string {
  switch (razon.motivo) {
    case 'de-siempre':
      return `${nombre} es uno de los tesoros de siempre: no se archiva.`;
    case 'en-la-fila':
      return `${nombre} está en la fila: cada cobro le pasa plata.`;
    case 'en-un-cobro-reabierto':
      return `${nombre} está en el reparto de «${razon.trabajo}», que reabriste: al volver a cobrarlo le pasa plata.`;
  }
}

export function destinosDelArchivo(
  tesoros: readonly TesoroDelTaller[],
  archivado: Pick<TesoroDelTaller, 'id'>,
): TesoroDelTaller[] {
  const posibles = tesoros.filter(
    (tesoro) => !tesoro.archivado && tesoro.id !== archivado.id && tesoro.clave !== 'diezmo',
  );
  return [
    ...posibles.filter((tesoro) => tesoro.clave === 'maun'),
    ...posibles.filter((tesoro) => tesoro.clave !== 'maun'),
  ];
}

function idParaLaBase(tesoro: Pick<TesoroDelTaller, 'id' | 'clave'>): string | null {
  return tesoro.id === tesoro.clave ? null : tesoro.id;
}

export const CATEGORIA_DEL_ARCHIVO = 'Archivo de un tesoro';

export function transferenciaDelArchivo({
  id,
  archivado,
  destino,
  hoy,
}: {
  id: string;
  archivado: TesoroDelTaller;
  destino: TesoroDelTaller;
  hoy: string;
}): MovimientoNuevo | null {
  if (archivado.saldo === 0) return null;
  const tienePlata = archivado.saldo > 0;
  const desde = tienePlata ? archivado : destino;
  const hacia = tienePlata ? destino : archivado;
  return {
    id,
    fecha: hoy,
    tipo: 'transferencia',
    tesoro_origen: desde.clave,
    tesoro_destino: hacia.clave,
    desde_id: idParaLaBase(desde),
    hacia_id: idParaLaBase(hacia),
    cubre_el_mes: null,
    monto_centavos: Math.abs(archivado.saldo),
    categoria: CATEGORIA_DEL_ARCHIVO,
    descripcion: tienePlata
      ? `Lo que tenía ${archivado.nombre} al archivarlo`
      : `Lo que le faltaba a ${archivado.nombre} para archivarlo`,
  };
}

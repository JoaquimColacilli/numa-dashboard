import { tesorosDeLaFila, type Plata } from '@maun/domain';

import {
  esDeLaMonedaDelTaller,
  sumaEnLaMismaMoneda,
  type TesoroDelTaller,
} from '@/entities/tesoro';
import {
  filaDelTaller,
  filasDe,
  reaperturaDeLaFila,
  type MovimientoNuevo,
  type Replica,
} from '@/shared/api';
import { mensajes } from '@/shared/idioma';

export type PorQueNoSeArchiva =
  | { motivo: 'de-siempre' }
  | { motivo: 'en-la-fila' }
  | { motivo: 'en-un-cobro-reabierto'; trabajo: string };

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
  const textos = mensajes().editarTesoro.archivar;
  switch (razon.motivo) {
    case 'de-siempre':
      return textos.deSiempre(nombre);
    case 'en-la-fila':
      return textos.enLaFila(nombre);
    case 'en-un-cobro-reabierto':
      return textos.enUnCobroReabierto(nombre, razon.trabajo);
  }
}

export function destinosDelArchivo(
  tesoros: readonly TesoroDelTaller[],
  archivado: Pick<TesoroDelTaller, 'id' | 'moneda'>,
): TesoroDelTaller[] {
  const posibles = tesoros.filter(
    (tesoro) =>
      !tesoro.archivado &&
      tesoro.id !== archivado.id &&
      tesoro.clave !== 'diezmo' &&
      tesoro.moneda === archivado.moneda,
  );
  return [
    ...posibles.filter((tesoro) => tesoro.clave === 'maun'),
    ...posibles.filter((tesoro) => tesoro.clave !== 'maun'),
  ];
}

export type CambioParaArchivar = 'vender' | 'comprar';

export function cambioParaArchivar(
  archivado: Pick<TesoroDelTaller, 'moneda' | 'saldo'>,
  destinos: readonly unknown[],
): CambioParaArchivar | null {
  if (esDeLaMonedaDelTaller(archivado) || destinos.length > 0) return null;
  if (archivado.saldo.importe === 0) return null;
  return archivado.saldo.importe > 0 ? 'vender' : 'comprar';
}

export function comoQuedaElDestino(
  destino: Pick<TesoroDelTaller, 'saldo'>,
  archivado: Pick<TesoroDelTaller, 'saldo'>,
): Plata | null {
  return sumaEnLaMismaMoneda(destino.saldo, archivado.saldo);
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
  if (archivado.saldo.importe === 0 || destino.moneda !== archivado.moneda) return null;
  const tienePlata = archivado.saldo.importe > 0;
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
    monto_centavos: Math.abs(archivado.saldo.importe),
    categoria: CATEGORIA_DEL_ARCHIVO,
    descripcion: tienePlata
      ? mensajes().editarTesoro.archivar.loQueTenia(archivado.nombre)
      : mensajes().editarTesoro.archivar.loQueLeFaltaba(archivado.nombre),
  };
}

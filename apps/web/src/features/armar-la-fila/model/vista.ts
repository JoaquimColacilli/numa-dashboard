import {
  CERO,
  lugarLibreDelReparto,
  problemasDeLaFila,
  tipoDelPaso,
  type CambioDeLaFila,
  type Fila,
  type FilaDelMes,
  type LiquidacionPorLaFila,
  type Money,
  type ProblemaEnLaFila,
} from '@maun/domain';

import {
  estanteDe,
  filaDelMesDelTaller,
  NOMBRE_DEL_TIPO,
  pruebaDeUnCobro,
  type ParteDeLaEscala,
} from '@/entities/fila';
import {
  tesoroDeLaClave,
  tesorosDelTaller,
  tesorosSincronizados,
  type TesoroDelTaller,
} from '@/entities/tesoro';
import {
  ajustesDe,
  filaDelTaller,
  type FilaDe,
  type FilaDelTaller,
  type Replica,
  type Tesoro,
} from '@/shared/api';
import { mesDeLaFecha } from '@/shared/lib';

import { cambiosDelBorrador, cuantosCambios, type BorradorDeLaFila } from './borrador';
import {
  FICHA_DEL_DIEZMO,
  FICHA_DEL_RESTO,
  fichaDeLaObligacion,
  fichaDeLaParte,
  fichaDelEstante,
  fichaDelPaso,
  queFichaEs,
} from './fichas';

export interface TesorosDelSistema {
  hogar: string;
  maun: string;
  diezmo: string;
}

export interface VistaDeLaFila {
  ajustesId: string | null;
  delTaller: FilaDelTaller;
  borrador: BorradorDeLaFila | null;
  armando: boolean;
  fila: Fila;
  base: Fila;
  cambios: CambioDeLaFila[];
  cuantos: number;
  problemas: ProblemaEnLaFila[];
  revision: number;
  hoy: string;
  mes: string;
  delMes: FilaDelMes;
  tesoros: TesoroDelTaller[];
  estante: TesoroDelTaller[];
  sistema: TesorosDelSistema;
  sincronizados: boolean;
}

function idDelSistema(tesoros: readonly TesoroDelTaller[], clave: Tesoro): string {
  return tesoroDeLaClave(tesoros, clave)?.id ?? clave;
}

export function vistaDeLaFila(
  replica: Replica,
  borrador: BorradorDeLaFila | null,
  hoy: string,
): VistaDeLaFila {
  const delTaller = filaDelTaller(replica);
  const tesoros = tesorosDelTaller(replica);
  const armando = borrador !== null;
  const fila = borrador?.fila ?? delTaller.fila;
  const mes = mesDeLaFecha(hoy);
  const cambios = borrador === null ? [] : cambiosDelBorrador(borrador);
  return {
    ajustesId: ajustesDe(replica)?.id ?? null,
    delTaller,
    borrador,
    armando,
    fila,
    base: borrador?.base ?? delTaller.fila,
    cambios,
    cuantos: cuantosCambios(borrador),
    problemas: armando
      ? problemasDeLaFila(
          fila,
          tesoros.map(({ id, clave, archivado, meta }) => ({ id, clave, archivado, meta })),
        )
      : [],
    revision: (borrador?.version ?? delTaller.version) + 1,
    hoy,
    mes,
    delMes: filaDelMesDelTaller(replica, mes, fila),
    tesoros,
    estante: estanteDe(fila, tesoros),
    sistema: {
      hogar: idDelSistema(tesoros, 'hogar'),
      maun: idDelSistema(tesoros, 'maun'),
      diezmo: idDelSistema(tesoros, 'diezmo'),
    },
    sincronizados: tesorosSincronizados(replica),
  };
}

export interface PruebaEnPantalla {
  monto: Money | null;
  cobrado: Money | null;
  enCero: boolean;
}

export const SIN_PRUEBA: PruebaEnPantalla = { monto: null, cobrado: null, enCero: false };

export function pideLoCobrado(fila: Pick<Fila, 'obligaciones'>): boolean {
  return fila.obligaciones.some((obligacion) => obligacion.base === 'cobrado');
}

export function probarLaFila(
  replica: Replica,
  fila: Fila,
  prueba: PruebaEnPantalla,
  hoy: string,
): LiquidacionPorLaFila | null {
  if (prueba.monto === null || prueba.monto <= 0) return null;
  try {
    return pruebaDeUnCobro(replica, fila, {
      monto: prueba.monto,
      cobrado: pideLoCobrado(fila) ? prueba.cobrado : null,
      enCero: prueba.enCero,
      hoy,
    });
  } catch {
    return null;
  }
}

export function tesoroDe(vista: Pick<VistaDeLaFila, 'tesoros'>, id: string): TesoroDelTaller {
  return (
    vista.tesoros.find((tesoro) => tesoro.id === id) ?? {
      id,
      clave: null,
      nombre: 'Un tesoro que ya no está',
      descripcion: '',
      tinta: 'maun',
      icono: 'vault',
      meta: null,
      rindeAnualBp: null,
      orden: 0,
      archivado: true,
      saldo: CERO,
    }
  );
}

export interface LoQueEstabaGuardado {
  fila: FilaDe<'ajustes'>['fila'];
  fila_version: number;
  fila_guardada_at: string | null;
}

export function loQueEstabaGuardado(replica: Replica): LoQueEstabaGuardado {
  const ajustes = ajustesDe(replica) as Partial<FilaDe<'ajustes'>> | undefined;
  return {
    fila: ajustes?.fila ?? null,
    fila_version: ajustes?.fila_version ?? 0,
    fila_guardada_at: ajustes?.fila_guardada_at ?? null,
  };
}

export function escalaDe(
  vista: Pick<VistaDeLaFila, 'fila' | 'tesoros' | 'sistema'>,
): ParteDeLaEscala[] {
  const superavit = tesoroDe(vista, vista.fila.superavit);
  return [
    ...vista.fila.reparto.map((parte) => ({
      tesoro: parte.tesoro,
      tinta: tesoroDe(vista, parte.tesoro).tinta,
      porcentaje: parte.porcentaje,
      resto: false,
    })),
    {
      tesoro: superavit.id,
      tinta: superavit.tinta,
      porcentaje: lugarLibreDelReparto(vista.fila),
      resto: true,
    },
  ];
}

export function fichaVigente(
  vista: Pick<VistaDeLaFila, 'fila' | 'estante' | 'sistema'>,
  id: string | null,
): string | null {
  if (id === null) return null;
  const ficha = queFichaEs(id);
  if (ficha === null) return null;
  if (
    ficha.tipo === 'diezmo' ||
    ficha.tipo === 'reparto' ||
    ficha.tipo === 'resto' ||
    ficha.tipo === 'insumos'
  ) {
    return id;
  }
  if (ficha.tesoro === null) return null;
  const tesoro = ficha.tesoro;
  if (vista.fila.obligaciones.some((obligacion) => obligacion.tesoro === tesoro)) {
    return tesoro === vista.sistema.diezmo ? FICHA_DEL_DIEZMO : fichaDeLaObligacion(tesoro);
  }
  if (vista.fila.pasos.some((paso) => paso.tesoro === tesoro)) return fichaDelPaso(tesoro);
  if (vista.fila.reparto.some((parte) => parte.tesoro === tesoro)) return fichaDeLaParte(tesoro);
  if (vista.estante.some((suelto) => suelto.id === tesoro)) return fichaDelEstante(tesoro);
  if (tesoro === vista.fila.superavit) return FICHA_DEL_RESTO;
  return null;
}

export function fichaDelTesoro(
  vista: Pick<VistaDeLaFila, 'fila' | 'estante' | 'sistema'>,
  tesoro: string,
): string | null {
  return fichaVigente(vista, fichaDelEstante(tesoro));
}

export function numeroEnLaFila(fila: Pick<Fila, 'obligaciones' | 'pasos'>, tesoro: string): number {
  const obligacion = fila.obligaciones.findIndex((una) => una.tesoro === tesoro);
  if (obligacion !== -1) return obligacion + 1;
  const paso = fila.pasos.findIndex((uno) => uno.tesoro === tesoro);
  return paso === -1 ? 0 : fila.obligaciones.length + paso + 1;
}

export function cuantosEnLaFila(fila: Pick<Fila, 'obligaciones' | 'pasos'>): number {
  return fila.obligaciones.length + fila.pasos.length;
}

export function lugarEnLaFila(fila: Pick<Fila, 'obligaciones' | 'pasos'>, tesoro: string): string {
  return `${String(numeroEnLaFila(fila, tesoro))} de ${String(cuantosEnLaFila(fila))}`;
}

export interface EncabezadoDeLaFicha {
  titulo: string;
  bajada: string;
  tesoro: TesoroDelTaller | null;
}

export function encabezadoDeLaFicha(
  vista: Pick<VistaDeLaFila, 'fila' | 'tesoros' | 'sistema'>,
  elegido: string | null,
  conClase = true,
): EncabezadoDeLaFicha {
  const ficha = elegido === null ? null : queFichaEs(elegido);
  if (ficha === null)
    return { titulo: 'La fila', bajada: 'Cómo se reparte cada cobro', tesoro: null };
  if (ficha.tipo === 'paso') {
    const paso = vista.fila.pasos.find((uno) => uno.tesoro === ficha.tesoro);
    const tesoro = tesoroDe(vista, ficha.tesoro);
    if (paso === undefined) return { titulo: tesoro.nombre, bajada: 'En la fila', tesoro };
    const tipo = NOMBRE_DEL_TIPO[tipoDelPaso(paso.clase)];
    const donde = `${tipo} · ${lugarEnLaFila(vista.fila, paso.tesoro)}`;
    return {
      titulo: tesoro.nombre,
      bajada: conClase && paso.clase === 'sueldo' ? `${donde} · Sueldo` : donde,
      tesoro,
    };
  }
  if (ficha.tipo === 'parte' || ficha.tipo === 'reparto') {
    return { titulo: 'Lo que sobra', bajada: 'Ahorros por porcentaje', tesoro: null };
  }
  if (ficha.tipo === 'resto') {
    const superavit = tesoroDe(vista, vista.fila.superavit);
    return { titulo: superavit.nombre, bajada: 'Superávit · El resto', tesoro: superavit };
  }
  if (ficha.tipo === 'estante') {
    return {
      titulo: tesoroDe(vista, ficha.tesoro).nombre,
      bajada: 'En el estante',
      tesoro: tesoroDe(vista, ficha.tesoro),
    };
  }
  if (ficha.tipo === 'obligacion' || ficha.tipo === 'diezmo') {
    const id = ficha.tesoro ?? vista.sistema.diezmo;
    const tesoro = tesoroDe(vista, id);
    return {
      titulo: tesoro.nombre,
      bajada: `Obligación · ${lugarEnLaFila(vista.fila, id)}`,
      tesoro,
    };
  }
  if (ficha.tipo === 'insumos') {
    return { titulo: 'Insumos', bajada: 'Lo que queda de cada seña', tesoro: null };
  }
  return { titulo: 'La fila', bajada: 'Cómo se reparte cada cobro', tesoro: null };
}

import {
  CERO,
  lugarLibreDelReparto,
  problemasDeLaFila,
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
import { NOMBRE_DE_LA_CLASE } from './edicion';
import {
  FICHA_DEL_RESTO,
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
          tesoros.map(({ id, clave, archivado }) => ({ id, clave, archivado })),
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
  mesEnCero: boolean;
}

export const SIN_PRUEBA: PruebaEnPantalla = { monto: null, mesEnCero: false };

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
      mesEnCero: prueba.mesEnCero,
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
  const maun = tesoroDe(vista, vista.sistema.maun);
  return [
    ...vista.fila.reparto.map((parte) => ({
      tesoro: parte.tesoro,
      tinta: tesoroDe(vista, parte.tesoro).tinta,
      porcentaje: parte.porcentaje,
      resto: false,
    })),
    {
      tesoro: maun.id,
      tinta: maun.tinta,
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
  if (ficha.tipo === 'diezmo' || ficha.tipo === 'reparto' || ficha.tipo === 'resto') return id;
  if (ficha.tesoro === null) return null;
  const tesoro = ficha.tesoro;
  if (vista.fila.pasos.some((paso) => paso.tesoro === tesoro)) return fichaDelPaso(tesoro);
  if (vista.fila.reparto.some((parte) => parte.tesoro === tesoro)) return fichaDeLaParte(tesoro);
  if (vista.estante.some((suelto) => suelto.id === tesoro)) return fichaDelEstante(tesoro);
  if (tesoro === vista.sistema.maun) return FICHA_DEL_RESTO;
  return null;
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
    const lugar = vista.fila.pasos.findIndex((paso) => paso.tesoro === ficha.tesoro);
    const paso = vista.fila.pasos[lugar];
    const donde = `Paso ${String(lugar + 1)} de ${String(vista.fila.pasos.length)}`;
    return {
      titulo: tesoroDe(vista, ficha.tesoro).nombre,
      bajada:
        paso === undefined
          ? 'Paso de la fila'
          : conClase
            ? `${donde} · ${NOMBRE_DE_LA_CLASE[paso.clase]}`
            : donde,
      tesoro: tesoroDe(vista, ficha.tesoro),
    };
  }
  if (ficha.tipo === 'parte' || ficha.tipo === 'reparto' || ficha.tipo === 'resto') {
    return { titulo: 'Lo que sobra', bajada: 'Se reparte por porcentaje', tesoro: null };
  }
  if (ficha.tipo === 'estante') {
    return {
      titulo: tesoroDe(vista, ficha.tesoro).nombre,
      bajada: 'En el estante',
      tesoro: tesoroDe(vista, ficha.tesoro),
    };
  }
  if (ficha.tipo === 'diezmo') {
    const diezmo = tesoroDe(vista, vista.sistema.diezmo);
    return { titulo: diezmo.nombre, bajada: 'Primero, siempre', tesoro: diezmo };
  }
  return { titulo: 'La fila', bajada: 'Cómo se reparte cada cobro', tesoro: null };
}

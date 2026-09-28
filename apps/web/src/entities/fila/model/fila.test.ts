import { centavos, type Fila } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type FilaDe,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import {
  ajustesDelReparto,
  estanteDe,
  faltantesDeGastosFijos,
  filaDelMesDelTaller,
  pruebaDeUnCobro,
} from './fila';

const HOGAR = '00000000-0000-7000-8000-000000000001';
const MAUN = '00000000-0000-7000-8000-000000000002';
const FIJOS = '00000000-0000-7000-8000-000000000010';
const COCOS = '00000000-0000-7000-8000-000000000004';

function replicaVacia(_usuario: string): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

const FILA: Fila = {
  pasos: [
    { tesoro: HOGAR, clase: 'sueldo', tope: centavos(1_000), renglones: [], desde: null },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(500),
      renglones: [{ nombre: 'Alquiler', monto: centavos(500) }],
      desde: null,
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: 5000 as never }],
  sueldoPorTrabajo: false,
};

function replicaDelMes(): Replica {
  let replica = replicaVacia('u');
  replica = aplicarFilaLocal(replica, 'ajustes', {
    ...METADATOS,
    id: 'a1',
    perdido_con_sueldo: false,
    perdido_con_diezmo: true,
    fila: FILA as unknown as FilaDe<'ajustes'>['fila'],
    fila_version: 2,
  } as unknown as FilaDe<'ajustes'>);
  replica = aplicarFilaLocal(replica, 'proyectos', {
    ...METADATOS,
    id: 'p1',
    estado: 'cobrado',
    fecha_cobro: '2026-09-10',
    dist_cobrado_centavos: 2_000,
    dist_gastos_centavos: 0,
    dist_diezmo_centavos: 200,
    dist_sueldo_centavos: 0,
    dist_fijos_centavos: 0,
    dist_remanente_centavos: 1_800,
    dist_fila_version: 2,
  } as unknown as FilaDe<'proyectos'>);
  replica = aplicarFilaLocal(replica, 'repartos', {
    ...METADATOS,
    id: 'r1',
    proyecto_id: 'p1',
    posicion: 1,
    tesoro_id: HOGAR,
    nombre: 'Hogar',
    tipo: 'paso',
    clase: 'sueldo',
    objetivo_centavos: 1_000,
    previo_centavos: 0,
    tope_centavos: 1_000,
    por_mes: true,
    porcentaje_bp: null,
    monto_centavos: 1_000,
    fecha: '2026-09-10',
    ya_en_la_apertura: false,
  });
  replica = aplicarFilaLocal(replica, 'repartos', {
    ...METADATOS,
    id: 'r2',
    proyecto_id: 'p1',
    posicion: 2,
    tesoro_id: FIJOS,
    nombre: 'Gastos fijos',
    tipo: 'paso',
    clase: 'fijos',
    objetivo_centavos: 500,
    previo_centavos: 0,
    tope_centavos: 500,
    por_mes: true,
    porcentaje_bp: null,
    monto_centavos: 300,
    fecha: '2026-09-10',
    ya_en_la_apertura: false,
  });
  return replica;
}

describe('lo del mes de la fila del taller', () => {
  it('suma lo que cada paso recibió en el mes y dice qué falta', () => {
    const mes = filaDelMesDelTaller(replicaDelMes(), '2026-09');
    expect(
      mes.pasos.map((paso) => [paso.tesoro, paso.recibido, paso.falta, paso.completo]),
    ).toEqual([
      [HOGAR, 1_000, 0, true],
      [FIJOS, 300, 200, false],
    ]);
    expect(mes.cobros).toBe(1);
    expect(faltantesDeGastosFijos(mes).map((paso) => paso.tesoro)).toEqual([FIJOS]);
  });

  it('el faltante es solo de los gastos fijos: la prioridad incompleta espera su turno', () => {
    const mes = filaDelMesDelTaller(replicaDelMes(), '2026-10');
    expect(faltantesDeGastosFijos(mes).map((paso) => paso.tesoro)).toEqual([FIJOS]);
    expect(mes.pasos.every((paso) => paso.recibido === 0)).toBe(true);
  });

  it('la prueba de un cobro usa lo del mes, o el mes en cero', () => {
    const replica = replicaDelMes();
    const conElMes = pruebaDeUnCobro(replica, FILA, {
      monto: centavos(10_000),
      mesEnCero: false,
      hoy: '2026-09-27',
    });
    const enCero = pruebaDeUnCobro(replica, FILA, {
      monto: centavos(10_000),
      mesEnCero: true,
      hoy: '2026-09-27',
    });
    expect(conElMes.pasos.map((paso) => paso.monto)).toEqual([0, 200]);
    expect(enCero.pasos.map((paso) => paso.monto)).toEqual([1_000, 500]);
    expect(ajustesDelReparto(replica)).toEqual({ perdidoConSueldo: false, perdidoConDiezmo: true });
    expect(ajustesDelReparto(replicaVacia('u'))).toEqual({
      perdidoConSueldo: false,
      perdidoConDiezmo: true,
    });
  });
});

describe('el estante', () => {
  it('son los vivos que no están en la fila, sin el diezmo ni Maun', () => {
    const tesoros = [
      { id: HOGAR, clave: 'hogar', archivado: false },
      { id: MAUN, clave: 'maun', archivado: false },
      { id: 'd', clave: 'diezmo', archivado: false },
      { id: COCOS, clave: 'cocos', archivado: false },
      { id: FIJOS, clave: null, archivado: false },
      { id: 'herramientas', clave: null, archivado: false },
      { id: 'viejo', clave: null, archivado: true },
    ] as const;
    expect(estanteDe(FILA, tesoros).map((tesoro) => tesoro.id)).toEqual(['herramientas']);
  });
});

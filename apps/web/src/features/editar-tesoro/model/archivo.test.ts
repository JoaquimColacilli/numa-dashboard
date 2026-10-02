import { centavos } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { TesoroDelTaller } from '@/entities/tesoro';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import {
  destinosDelArchivo,
  porQueEnPalabras,
  porQueNoSeArchiva,
  transferenciaDelArchivo,
} from './archivo';

const HERRAMIENTAS = '01900000-0000-7000-8000-000000000006';
const MATERIALES = '01900000-0000-7000-8000-000000000007';

function tesoro(parcial: Partial<TesoroDelTaller> & Pick<TesoroDelTaller, 'id'>): TesoroDelTaller {
  return {
    clave: null,
    moneda: 'ARS',
    nombre: 'Herramientas',
    descripcion: '',
    tinta: 'petroleo',
    icono: 'wrench',
    meta: null,
    rindeAnualBp: null,
    orden: 0,
    archivado: false,
    saldo: centavos(0),
    ...parcial,
  };
}

function fila(pasos: string[]) {
  return {
    pasos: pasos.map((id) => ({
      tesoro: id,
      clase: 'prioridad',
      tope: 100,
      renglones: [],
      desde: null,
    })),
    reparto: [],
    sueldoPorTrabajo: false,
  };
}

function replicaCon({
  guardada = null,
  reabierta = null,
}: {
  guardada?: unknown;
  reabierta?: unknown;
}): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.ajustes = { a: { id: 'a', fila: guardada, fila_version: 3 } };
  tablas.proyectos = {
    p: { id: 'p', titulo: 'Placard del dormitorio', reapertura_fila: reabierta },
  };
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

describe('cuándo no se archiva', () => {
  const herramientas = { id: HERRAMIENTAS, clave: null };

  it('los de siempre no se archivan', () => {
    expect(porQueNoSeArchiva(replicaCon({}), { id: 'x', clave: 'cocos' })).toEqual({
      motivo: 'de-siempre',
    });
  });

  it('uno que está en la fila guardada, no; en la fila de siempre no hay tesoros del dueño', () => {
    expect(porQueNoSeArchiva(replicaCon({ guardada: fila([HERRAMIENTAS]) }), herramientas)).toEqual(
      { motivo: 'en-la-fila' },
    );
    expect(
      porQueNoSeArchiva(replicaCon({ guardada: fila([MATERIALES]) }), herramientas),
    ).toBeNull();
    expect(porQueNoSeArchiva(replicaCon({}), herramientas)).toBeNull();
  });

  it('uno que está en la foto de un cobro reabierto, tampoco', () => {
    const reabierta = { version: 2, fila: fila([HERRAMIENTAS]) };
    const razon = porQueNoSeArchiva(replicaCon({ reabierta }), herramientas);
    expect(razon).toEqual({ motivo: 'en-un-cobro-reabierto', trabajo: 'Placard del dormitorio' });
    expect(porQueEnPalabras('Herramientas', razon ?? { motivo: 'de-siempre' })).toBe(
      'Herramientas está en el reparto de «Placard del dormitorio», que reabriste: al volver a cobrarlo le pasa plata.',
    );
    expect(porQueNoSeArchiva(replicaCon({ reabierta: 'cualquier cosa' }), herramientas)).toBeNull();
  });
});

describe('a dónde va la plata del archivado', () => {
  const maun = tesoro({ id: 'maun', clave: 'maun', nombre: 'Maun', saldo: centavos(124_800_000) });
  const hogar = tesoro({ id: 'hogar', clave: 'hogar', nombre: 'Hogar' });
  const diezmo = tesoro({ id: 'diezmo', clave: 'diezmo', nombre: 'Diezmo' });
  const herramientas = tesoro({ id: HERRAMIENTAS, saldo: centavos(15_000_000) });
  const viejo = tesoro({ id: 'v', nombre: 'Viejo', archivado: true });

  it('Maun primero, sin el diezmo, sin él y sin los archivados', () => {
    expect(
      destinosDelArchivo([hogar, maun, diezmo, herramientas, viejo], herramientas).map(
        (uno) => uno.id,
      ),
    ).toEqual(['maun', 'hogar']);
  });

  it('pasa lo que tiene al destino, y si debe, lo trae del destino', () => {
    expect(
      transferenciaDelArchivo({
        id: 't',
        archivado: herramientas,
        destino: maun,
        hoy: '2026-09-27',
      }),
    ).toEqual({
      id: 't',
      fecha: '2026-09-27',
      tipo: 'transferencia',
      tesoro_origen: null,
      tesoro_destino: 'maun',
      desde_id: HERRAMIENTAS,
      hacia_id: null,
      cubre_el_mes: null,
      monto_centavos: 15_000_000,
      categoria: 'Archivo de un tesoro',
      descripcion: 'Lo que tenía Herramientas al archivarlo',
    });

    const debe = { ...herramientas, saldo: centavos(-500_000) };
    expect(
      transferenciaDelArchivo({ id: 't', archivado: debe, destino: maun, hoy: '2026-09-27' }),
    ).toMatchObject({
      tesoro_origen: 'maun',
      desde_id: null,
      hacia_id: HERRAMIENTAS,
      monto_centavos: 500_000,
      descripcion: 'Lo que le faltaba a Herramientas para archivarlo',
    });

    const sinPlata = { ...herramientas, saldo: centavos(0) };
    expect(
      transferenciaDelArchivo({ id: 't', archivado: sinPlata, destino: maun, hoy: '2026-09-27' }),
    ).toBeNull();
  });

  it('manda el id de los de siempre cuando la réplica ya los trae', () => {
    const maunConId = { ...maun, id: '01900000-0000-7000-8000-000000000002' };
    expect(
      transferenciaDelArchivo({
        id: 't',
        archivado: herramientas,
        destino: maunConId,
        hoy: '2026-09-27',
      }),
    ).toMatchObject({ tesoro_destino: 'maun', hacia_id: '01900000-0000-7000-8000-000000000002' });
  });
});

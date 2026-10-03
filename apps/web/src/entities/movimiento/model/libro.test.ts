import { centavos, enPesos, type LineaDelLibro } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { Replica } from '@/shared/api';

import {
  agruparPorDia,
  efectoDeLaLinea,
  filtrarLineas,
  filtroInicial,
  lineasDelTaller,
  tesorosConMovimientoEn,
  TODOS_LOS_TESOROS,
  type LineaDelTaller,
  type TesoroDeLaLinea,
} from './libro';

const HOGAR_ID = '0192aaaa-0000-7000-8000-000000000001';
const MAUN_ID = '0192aaaa-0000-7000-8000-000000000002';
const DIEZMO_ID = '0192aaaa-0000-7000-8000-000000000003';
const COCOS_ID = '0192aaaa-0000-7000-8000-000000000004';
const MATERIALES_ID = '0192aaaa-0000-7000-8000-000000000005';
const HERRAMIENTAS_ID = '0192aaaa-0000-7000-8000-000000000006';

const HOGAR: TesoroDeLaLinea = {
  id: HOGAR_ID,
  clave: 'hogar',
  moneda: 'ARS',
  nombre: 'Hogar',
  tinta: 'hogar',
  icono: 'house',
};
const MAUN: TesoroDeLaLinea = {
  id: MAUN_ID,
  clave: 'maun',
  moneda: 'ARS',
  nombre: 'Maun',
  tinta: 'maun',
  icono: 'hammer',
};
const TESOROS: readonly TesoroDeLaLinea[] = [
  HOGAR,
  MAUN,
  {
    id: DIEZMO_ID,
    clave: 'diezmo',
    moneda: 'ARS',
    nombre: 'Diezmo',
    tinta: 'diezmo',
    icono: 'church',
  },
  {
    id: COCOS_ID,
    clave: 'cocos',
    moneda: 'ARS',
    nombre: 'Cocos',
    tinta: 'cocos',
    icono: 'piggy-bank',
  },
  {
    id: MATERIALES_ID,
    clave: null,
    moneda: 'ARS',
    nombre: 'Materiales',
    tinta: 'mostaza',
    icono: 'package',
  },
  {
    id: HERRAMIENTAS_ID,
    clave: null,
    moneda: 'ARS',
    nombre: 'Herramientas',
    tinta: 'grana',
    icono: 'wrench',
  },
];

function linea(extra: Partial<LineaDelTaller> = {}): LineaDelTaller {
  const base: LineaDelLibro = {
    origen: 'distribucion',
    asientoId: 'p',
    fecha: '2026-07-10',
    concepto: 'sueldo',
    desde: 'maun',
    hacia: 'hogar',
    desdeId: MAUN_ID,
    haciaId: HOGAR_ID,
    monto: centavos(50_000_000),
    montoHacia: centavos(50_000_000),
    categoria: '',
    descripcion: '',
    proyectoId: 'p',
    yaEnLaApertura: false,
  };
  return {
    ...base,
    clave: 'distribucion:p:sueldo',
    etiqueta: 'Sueldo del reparto',
    detalle: '',
    proyectoTitulo: 'Placard',
    sentido: 'mueve',
    tesoroDesde: MAUN,
    tesoroHacia: HOGAR,
    tesoroPrincipal: HOGAR,
    bloqueo: 'del-proyecto',
    cotizacionDelPago: null,
    ...extra,
    montoHacia: extra.montoHacia ?? extra.monto ?? base.montoHacia,
  };
}

interface MovimientoDePrueba {
  id: string;
  fecha?: string;
  tipo: string;
  tesoro_origen?: string | null;
  tesoro_destino?: string | null;
  desde_id?: string | null;
  hacia_id?: string | null;
  monto_centavos?: number;
  descripcion?: string;
}

function replicaCon(movimientos: MovimientoDePrueba[], conTesoros = true): Replica {
  const tesoros = conTesoros
    ? Object.fromEntries(
        TESOROS.map((tesoro, orden) => [
          tesoro.id,
          {
            id: tesoro.id,
            clave: tesoro.clave,
            nombre: tesoro.nombre,
            descripcion: '',
            tinta: tesoro.tinta,
            icono: tesoro.icono,
            meta_centavos: null,
            rinde_anual_bp: null,
            orden,
            archivado_at: null,
            created_at: '2026-09-27T10:00:00Z',
          },
        ]),
      )
    : {};
  return {
    usuarioId: 'u',
    cursor: '',
    reconciliadoEn: '',
    tablas: {
      tesoros,
      movimientos: Object.fromEntries(
        movimientos.map((movimiento) => [
          movimiento.id,
          {
            fecha: '2026-09-20',
            tesoro_origen: null,
            tesoro_destino: null,
            monto_centavos: 1_000_000,
            categoria: '',
            descripcion: '',
            proyecto_id: null,
            ...movimiento,
          },
        ]),
      ),
    },
  } as unknown as Replica;
}

describe('efectoDeLaLinea', () => {
  it('una línea que ya estaba en los saldos de la apertura no mueve ningún tesoro', () => {
    const marcada = linea({ yaEnLaApertura: true });
    expect(efectoDeLaLinea(marcada, HOGAR_ID)).toBe(0);
    expect(efectoDeLaLinea(marcada, MAUN_ID)).toBe(0);
    expect(efectoDeLaLinea(marcada, TODOS_LOS_TESOROS)).toBe(0);
  });

  it('la misma línea sin marcar sí los mueve, por el id de cada tesoro', () => {
    const comun = linea();
    expect(efectoDeLaLinea(comun, HOGAR_ID)).toBe(50_000_000);
    expect(efectoDeLaLinea(comun, MAUN_ID)).toBe(-50_000_000);
    expect(efectoDeLaLinea(comun, COCOS_ID)).toBe(0);
    expect(efectoDeLaLinea(comun, TODOS_LOS_TESOROS)).toBe(0);
  });

  it('el neto del día no cuenta lo que ya estaba en los saldos', () => {
    const [dia] = agruparPorDia(
      [linea({ yaEnLaApertura: true }), linea({ clave: 'otra', monto: centavos(1_000) })],
      HOGAR_ID,
    );
    expect(dia?.netos).toEqual([enPesos(centavos(1_000))]);
  });
});

describe('las líneas del taller con los tesoros del dueño', () => {
  it('un pase entre dos tesoros del dueño es una línea entre tesoros, con sus nombres y sus tintas', () => {
    const [pase] = lineasDelTaller(
      replicaCon([
        {
          id: 'm1',
          tipo: 'transferencia',
          desde_id: MATERIALES_ID,
          hacia_id: HERRAMIENTAS_ID,
        },
      ]),
      TESOROS,
    );
    expect(pase).toMatchObject({
      sentido: 'mueve',
      etiqueta: 'Entre tesoros',
      desde: null,
      hacia: null,
      desdeId: MATERIALES_ID,
      haciaId: HERRAMIENTAS_ID,
      bloqueo: null,
    });
    expect(pase?.tesoroDesde).toMatchObject({ nombre: 'Materiales', tinta: 'mostaza' });
    expect(pase?.tesoroHacia).toMatchObject({ nombre: 'Herramientas', tinta: 'grana' });
    expect(pase?.tesoroPrincipal.nombre).toBe('Herramientas');
  });

  it('una fila guardada antes de los ids se nombra por su clave', () => {
    const [gasto] = lineasDelTaller(
      replicaCon([{ id: 'm1', tipo: 'gasto', tesoro_origen: 'hogar' }]),
      TESOROS,
    );
    expect(gasto).toMatchObject({
      sentido: 'sale',
      etiqueta: 'Gasto del hogar',
      desdeId: HOGAR_ID,
    });
    expect(gasto?.tesoroDesde).toBe(HOGAR);
    expect(gasto?.tesoroHacia).toBeNull();
    expect(gasto?.tesoroPrincipal).toBe(HOGAR);
  });

  it('sin los tesoros en la réplica, los cuatro de siempre salen del catálogo', () => {
    const [ingreso] = lineasDelTaller(
      replicaCon([{ id: 'm1', tipo: 'ingreso', tesoro_destino: 'maun' }], false),
      [],
    );
    expect(ingreso?.tesoroHacia).toMatchObject({
      id: 'maun',
      clave: 'maun',
      nombre: 'Maun',
      tinta: 'maun',
    });
    expect(ingreso?.etiqueta).toBe('Ingreso al taller');
  });

  it('un pago en dólares es una línea de su tesoro en dólares, con su dólar; uno en pesos entra a Maun', () => {
    const DOLARES_ID = '0192aaaa-0000-7000-8000-000000000007';
    const DOLARES: TesoroDeLaLinea = {
      id: DOLARES_ID,
      clave: null,
      moneda: 'USD',
      nombre: 'Dólares',
      tinta: 'cocos',
      icono: 'vault',
    };
    const replica = replicaCon([]);
    const pago = {
      proyecto_id: 'p',
      fecha: '2026-09-20',
      concepto: 'Seña',
      ya_en_la_apertura: false,
    };
    const conPagos = {
      ...replica,
      tablas: {
        ...replica.tablas,
        proyectos: { p: { id: 'p', titulo: 'Placard', estado: 'en_curso' } },
        pagos: {
          dolares: {
            ...pago,
            id: 'dolares',
            monto_centavos: 100_000,
            moneda: 'USD',
            cotizacion_centavos: 154_000,
            tesoro_id: DOLARES_ID,
          },
          pesos: {
            ...pago,
            id: 'pesos',
            monto_centavos: 5_000_000,
            moneda: 'ARS',
            cotizacion_centavos: null,
            tesoro_id: null,
          },
        },
      },
    } as unknown as Replica;

    const lineas = lineasDelTaller(conPagos, [...TESOROS, DOLARES]);
    expect(lineas.find((una) => una.asientoId === 'dolares')).toMatchObject({
      sentido: 'entra',
      tesoroHacia: DOLARES,
      monto: 100_000,
      cotizacionDelPago: 154_000,
    });
    expect(lineas.find((una) => una.asientoId === 'pesos')).toMatchObject({
      tesoroHacia: MAUN,
      monto: 5_000_000,
      cotizacionDelPago: null,
    });
  });

  it('un tesoro que la réplica no conoce igual tiene un nombre', () => {
    const [pase] = lineasDelTaller(
      replicaCon([
        { id: 'm1', tipo: 'transferencia', tesoro_origen: 'maun', hacia_id: 'desconocido' },
      ]),
      TESOROS,
    );
    expect(pase?.tesoroHacia).toMatchObject({ id: 'desconocido', nombre: 'Otro tesoro' });
  });

  it('el filtro por tesoro toma el id, y cada lado cuenta', () => {
    const lineas = lineasDelTaller(
      replicaCon([
        { id: 'm1', tipo: 'transferencia', desde_id: MAUN_ID, hacia_id: MATERIALES_ID },
        { id: 'm2', tipo: 'gasto', tesoro_origen: 'hogar' },
        {
          id: 'm3',
          tipo: 'transferencia',
          desde_id: MATERIALES_ID,
          hacia_id: HERRAMIENTAS_ID,
          fecha: '2026-08-02',
        },
      ]),
      TESOROS,
    );
    const filtro = { ...filtroInicial('2026-09'), mes: 'todos' };
    expect(
      filtrarLineas(lineas, { ...filtro, tesoro: MATERIALES_ID }).map((una) => una.asientoId),
    ).toEqual(['m1', 'm3']);
    expect(
      filtrarLineas(lineas, { ...filtro, tesoro: MAUN_ID }).map((una) => una.asientoId),
    ).toEqual(['m1']);
    expect(filtrarLineas(lineas, filtro)).toHaveLength(3);

    const [dia] = agruparPorDia(
      filtrarLineas(lineas, { ...filtro, tesoro: MATERIALES_ID }),
      MATERIALES_ID,
    );
    expect(dia?.netos).toEqual([enPesos(centavos(1_000_000))]);
  });

  it('los tesoros con movimiento en el período son los de los dos lados de cada línea del mes', () => {
    const lineas = lineasDelTaller(
      replicaCon([
        { id: 'm1', tipo: 'transferencia', desde_id: MAUN_ID, hacia_id: MATERIALES_ID },
        {
          id: 'm2',
          tipo: 'transferencia',
          desde_id: MATERIALES_ID,
          hacia_id: HERRAMIENTAS_ID,
          fecha: '2026-08-02',
        },
      ]),
      TESOROS,
    );
    expect([...tesorosConMovimientoEn(lineas, '2026-09')].sort()).toEqual(
      [MAUN_ID, MATERIALES_ID].sort(),
    );
    expect(tesorosConMovimientoEn(lineas, 'todos').has(HERRAMIENTAS_ID)).toBe(true);
    expect(tesorosConMovimientoEn(lineas, '2026-07').size).toBe(0);
  });
});

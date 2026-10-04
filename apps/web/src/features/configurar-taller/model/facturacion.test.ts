import { describe, expect, it } from 'vitest';

import type { FilaDe } from '@/shared/api';

import {
  cambiosDeLaFacturacion,
  conexionDelTaller,
  datosDeLaFacturacion,
  enPesosEnteros,
  problemaDeLaFacturacion,
  puntoDeVentaEscrito,
} from './facturacion';

const AJUSTES = {
  facturacion_ambiente: 'produccion',
  facturacion_cuit: '20-11111111-2',
  facturacion_punto_de_venta: 3,
  facturacion_desde: '2026-09-03',
  facturacion_concepto: 2,
  facturacion_categoria: 'D',
  facturacion_ingresos_brutos: '901-123456-7',
  facturacion_inicio_de_actividades: '2019-03-01',
} as Partial<FilaDe<'ajustes'>>;

describe('lo que la pantalla lee de los ajustes', () => {
  it('la conexión y los datos', () => {
    expect(conexionDelTaller(AJUSTES)).toEqual({
      ambiente: 'produccion',
      cuit: '20-11111111-2',
      puntoDeVenta: 3,
      desde: '2026-09-03',
    });
    expect(datosDeLaFacturacion(AJUSTES)).toEqual({
      ingresosBrutos: '901-123456-7',
      inicioDeActividades: '2019-03-01',
      concepto: 2,
      categoria: 'D',
    });
  });

  it('sin ajustes, o con valores que no son, queda sin conectar y con lo de siempre', () => {
    expect(conexionDelTaller(undefined)).toEqual({
      ambiente: null,
      cuit: '',
      puntoDeVenta: null,
      desde: null,
    });
    expect(datosDeLaFacturacion({ facturacion_concepto: 7, facturacion_categoria: 'Z' })).toEqual({
      ingresosBrutos: '',
      inicioDeActividades: '',
      concepto: 1,
      categoria: null,
    });
    expect(conexionDelTaller({ facturacion_ambiente: 'otro' }).ambiente).toBeNull();
  });

  it('el punto de venta con sus cinco cifras', () => {
    expect(puntoDeVentaEscrito(3)).toBe('00003');
    expect(puntoDeVentaEscrito(null)).toBe('');
  });
});

describe('los cambios para guardar', () => {
  const guardados = datosDeLaFacturacion(AJUSTES);

  it('sin cambios, nada', () => {
    expect(cambiosDeLaFacturacion(guardados, { ...guardados })).toEqual({
      campos: [],
      cambios: {},
      previos: {},
    });
  });

  it('Ingresos Brutos va sin espacios de más, y el inicio vacío va como nulo', () => {
    expect(
      cambiosDeLaFacturacion(guardados, {
        ...guardados,
        ingresosBrutos: ' 901-999999-9  ',
        inicioDeActividades: '',
      }),
    ).toEqual({
      campos: ['ingresosBrutos', 'inicioDeActividades'],
      cambios: {
        facturacion_ingresos_brutos: '901-999999-9',
        facturacion_inicio_de_actividades: null,
      },
      previos: {
        facturacion_ingresos_brutos: '901-123456-7',
        facturacion_inicio_de_actividades: '2019-03-01',
      },
    });
  });

  it('solo espacios agregados no es un cambio', () => {
    expect(
      cambiosDeLaFacturacion(guardados, { ...guardados, ingresosBrutos: ' 901-123456-7 ' }).campos,
    ).toEqual([]);
  });

  it('Ingresos Brutos de más de 40 caracteres no se guarda', () => {
    expect(problemaDeLaFacturacion({ ...guardados, ingresosBrutos: 'x'.repeat(40) })).toBeNull();
    expect(
      problemaDeLaFacturacion({ ...guardados, ingresosBrutos: ` ${'x'.repeat(40)} ` }),
    ).toBeNull();
    expect(problemaDeLaFacturacion({ ...guardados, ingresosBrutos: 'x'.repeat(41) })).toBe(
      'ingresos-brutos-largo',
    );
  });
});

describe('el tope en pesos enteros', () => {
  it('le saca los centavos', () => {
    expect(enPesosEnteros(3_062_865_155)).toBe(3_062_865_100);
    expect(enPesosEnteros(3_062_865_100)).toBe(3_062_865_100);
  });
});

import { centavos, puntosBasicos, type Fila } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  CLASE,
  CLASES_EN_ORDEN,
  categoriasDeLaClase,
  claseDe,
  claseParaPagar,
  clasesDelGrupo,
  gastaDesdeElTesoro,
  GRUPOS,
  renglonesPorTesoro,
  rutaParaRegistrarElPago,
  vaEntreTesoros,
} from './clases';

const ALQUILER = '0192aaaa-0000-7000-8000-000000000007';
const STOCK = '0192aaaa-0000-7000-8000-000000000008';

describe('las clases de movimiento', () => {
  it('las ocho de siempre fijan su tipo y sus dos lados, y no cambiaron', () => {
    expect(
      CLASES_EN_ORDEN.filter((id) => !CLASE[id].eligeLosLados && !CLASE[id].eligeElTesoro).map(
        (id) => [id, CLASE[id].tipo, CLASE[id].desde, CLASE[id].hacia],
      ),
    ).toEqual([
      ['ingreso_hogar', 'ingreso', null, 'hogar'],
      ['ingreso_maun', 'ingreso', null, 'maun'],
      ['gasto_hogar', 'gasto', 'hogar', null],
      ['gasto_maun', 'gasto', 'maun', null],
      ['pago_diezmo', 'pago_diezmo', 'diezmo', null],
      ['aporte_cocos', 'aporte_cocos', 'maun', 'cocos'],
      ['retiro_cocos', 'transferencia', 'cocos', 'maun'],
      ['gasto_cocos', 'gasto', 'cocos', null],
    ]);
  });

  it('la novena es «Entre tesoros»: una transferencia con los dos lados para elegir', () => {
    expect(CLASES_EN_ORDEN.at(-1)).toBe('entre_tesoros');
    expect(CLASE.entre_tesoros).toMatchObject({
      grupo: 'entre',
      etiqueta: 'Entre tesoros',
      tipo: 'transferencia',
      eligeLosLados: true,
      eligeElTesoro: false,
      tesoro: null,
    });
    expect(GRUPOS.map((grupo) => grupo.etiqueta)).toEqual([
      'Ingreso',
      'Gasto',
      'Diezmo',
      'Cocos',
      'Entre tesoros',
    ]);
    expect(clasesDelGrupo('entre').map((clase) => clase.id)).toEqual(['entre_tesoros']);
  });

  it('la décima es «Gasto de un tesoro»: un gasto desde un tesoro del dueño, con los gastos', () => {
    expect(CLASES_EN_ORDEN).toHaveLength(10);
    expect(CLASE.gasto_tesoro).toMatchObject({
      grupo: 'gasto',
      etiqueta: 'Gasto de un tesoro',
      tipo: 'gasto',
      desde: null,
      hacia: null,
      eligeLosLados: false,
      eligeElTesoro: true,
    });
    expect(clasesDelGrupo('gasto').map((clase) => clase.id)).toEqual([
      'gasto_hogar',
      'gasto_maun',
      'gasto_tesoro',
    ]);
    expect(gastaDesdeElTesoro({ clave: null, archivado: false })).toBe(true);
    expect(gastaDesdeElTesoro({ clave: null, archivado: true })).toBe(false);
    expect(gastaDesdeElTesoro({ clave: 'maun', archivado: false })).toBe(false);
  });

  it('una fila se reconoce por su tipo y sus claves, y cualquier otra transferencia es entre tesoros', () => {
    expect(claseDe('gasto', 'hogar', null)?.id).toBe('gasto_hogar');
    expect(claseDe('transferencia', 'cocos', 'maun')?.id).toBe('retiro_cocos');
    expect(claseDe('aporte_cocos', 'maun', 'cocos')?.id).toBe('aporte_cocos');
    expect(claseDe('transferencia', 'maun', 'cocos')?.id).toBe('entre_tesoros');
    expect(claseDe('transferencia', 'hogar', null)?.id).toBe('entre_tesoros');
    expect(claseDe('transferencia', null, null)?.id).toBe('entre_tesoros');
    expect(claseDe('gasto', null, null)?.id).toBe('gasto_tesoro');
    expect(claseDe('ajuste', null, 'cocos')).toBeUndefined();
  });

  it('el diezmo no entra en un pase entre tesoros: sale solo por el pago', () => {
    expect(vaEntreTesoros({ clave: 'diezmo' })).toBe(false);
    expect(vaEntreTesoros({ clave: 'maun' })).toBe(true);
    expect(vaEntreTesoros({ clave: null })).toBe(true);
  });
});

describe('las categorías de un gasto de un tesoro', () => {
  const FILA: Fila = {
    obligaciones: [
      {
        tesoro: '0192aaaa-0000-7000-8000-000000000003',
        porcentaje: puntosBasicos(1000),
        base: 'ingreso',
      },
    ],
    pasos: [
      {
        tesoro: ALQUILER,
        clase: 'fijos',
        tope: centavos(60_000_000),
        renglones: [
          { nombre: 'Alquiler del taller', monto: centavos(50_000_000), dia: 10 },
          { nombre: ' Luz ', monto: centavos(10_000_000), dia: null },
        ],
        desde: null,
        modo: 'saldo',
        hastaLaMeta: false,
      },
      {
        tesoro: STOCK,
        clase: 'prioridad',
        tope: centavos(10_000_000),
        renglones: [],
        desde: null,
        modo: 'mes',
        hastaLaMeta: false,
      },
    ],
    reparto: [],
    superavit: '0192aaaa-0000-7000-8000-000000000002',
    sueldoPorTrabajo: false,
  };

  it('un compromiso ofrece sus renglones; los demás, las de la clase', () => {
    const renglones = renglonesPorTesoro(FILA);
    expect(renglones.get(ALQUILER)).toEqual(['Alquiler del taller', 'Luz']);
    expect(renglones.has(STOCK)).toBe(false);
    expect(categoriasDeLaClase('gasto_tesoro', renglones.get(ALQUILER))).toEqual([
      'Alquiler del taller',
      'Luz',
      'Otro',
    ]);
    expect(categoriasDeLaClase('gasto_tesoro')).toEqual(CLASE.gasto_tesoro.categorias);
    expect(categoriasDeLaClase('gasto_maun', ['Alquiler'])).toEqual(CLASE.gasto_maun.categorias);
  });
});

describe('registrar el pago', () => {
  it('cada tesoro paga con su clase: Maun con el gasto del taller y el diezmo con su pago', () => {
    expect(claseParaPagar({ clave: 'maun' })).toBe('gasto_maun');
    expect(claseParaPagar({ clave: 'diezmo' })).toBe('pago_diezmo');
    expect(claseParaPagar({ clave: 'hogar' })).toBe('gasto_hogar');
    expect(claseParaPagar({ clave: 'cocos' })).toBe('gasto_cocos');
    expect(claseParaPagar({ clave: null })).toBe('gasto_tesoro');
  });

  it('abre la hoja con la clase, el tesoro, el monto y la categoría puestos', () => {
    expect(
      rutaParaRegistrarElPago({
        tesoro: { id: ALQUILER, clave: null },
        monto: centavos(50_000_000),
        categoria: 'Alquiler del taller',
      }),
    ).toBe(
      `/finanzas/nuevo?clase=gasto_tesoro&tesoro=${ALQUILER}&monto=50000000&categoria=Alquiler+del+taller`,
    );
    expect(
      rutaParaRegistrarElPago({
        tesoro: { id: 'x', clave: 'maun' },
        monto: centavos(10_000),
        categoria: 'Costos fijos',
      }),
    ).toBe('/finanzas/nuevo?clase=gasto_maun&monto=10000&categoria=Costos+fijos');
    expect(
      rutaParaRegistrarElPago({
        tesoro: { id: 'x', clave: 'diezmo' },
        monto: centavos(0),
        categoria: 'Diezmo',
      }),
    ).toBe('/finanzas/nuevo?clase=pago_diezmo');
  });

  it('el pago de un mes que ya pasó lleva su día, para que quede pagado en ese mes', () => {
    expect(
      rutaParaRegistrarElPago({
        tesoro: { id: ALQUILER, clave: null },
        monto: centavos(50_000_000),
        categoria: 'Alquiler',
        fecha: '2026-08-10',
      }),
    ).toBe(
      `/finanzas/nuevo?clase=gasto_tesoro&tesoro=${ALQUILER}&monto=50000000&categoria=Alquiler&fecha=2026-08-10`,
    );
  });
});

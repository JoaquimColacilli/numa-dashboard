import { centavos, enPesos, plata, puntosBasicos, type Fila, type Moneda } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { usarIdioma } from '@/shared/idioma';

import {
  CLASE,
  CLASES_EN_ORDEN,
  categoriaEnPantalla,
  categoriasDeLaClase,
  claseDe,
  claseParaPagar,
  clasesDelGrupo,
  destinosDeLaClase,
  esUnCambio,
  gastaDesdeElTesoro,
  GRUPOS,
  hayDolaresParaCargar,
  origenesDeLaClase,
  renglonesPorTesoro,
  rutaParaComprarDolares,
  rutaParaComprarDolaresPara,
  rutaParaRegistrarElPago,
  rutaParaVenderDolares,
  tesorosParaElegir,
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
    expect(CLASES_EN_ORDEN.indexOf('entre_tesoros')).toBe(9);
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
      'Dólares',
    ]);
    expect(clasesDelGrupo('entre').map((clase) => clase.id)).toEqual(['entre_tesoros']);
  });

  it('la décima es «Gasto de un tesoro»: un gasto desde un tesoro del dueño, con los gastos', () => {
    expect(CLASES_EN_ORDEN.indexOf('gasto_tesoro')).toBe(4);
    expect(CLASES_EN_ORDEN).toHaveLength(13);
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

describe('las clases de los dólares', () => {
  function tesoro(id: string, clave: 'maun' | 'diezmo' | null, moneda: Moneda, archivado = false) {
    return { id, clave, moneda, archivado };
  }
  const MAUN = tesoro('maun', 'maun', 'ARS');
  const DIEZMO = tesoro('diezmo', 'diezmo', 'ARS');
  const MATERIALES = tesoro('materiales', null, 'ARS');
  const DOLARES = tesoro('dolares', null, 'USD');
  const AHORRO = tesoro('ahorro', null, 'USD');
  const VIEJO = tesoro('viejo', null, 'USD', true);
  const TESOROS = [MAUN, DIEZMO, MATERIALES, DOLARES, AHORRO, VIEJO];
  const ids = (lista: readonly { id: string }[]) => lista.map((uno) => uno.id);

  it('el grupo «Dólares» trae la compra, la venta y el ingreso, con «Qué dólar» de categorías', () => {
    expect(
      clasesDelGrupo('dolares').map((clase) => [clase.id, clase.tipo, clase.etiqueta, clase.corta]),
    ).toEqual([
      ['compra_de_dolares', 'cambio', 'Compra de dólares', 'Compra'],
      ['venta_de_dolares', 'cambio', 'Venta de dólares', 'Venta'],
      ['ingreso_en_dolares', 'ingreso', 'Ingreso en dólares', 'Ingreso'],
    ]);
    expect(CLASE.compra_de_dolares.categorias).toEqual([
      'Oficial',
      'MEP',
      'Blue',
      'Cripto',
      'Otro',
    ]);
    expect(CLASE.venta_de_dolares.categorias).toEqual(CLASE.compra_de_dolares.categorias);
    expect(esUnCambio('compra_de_dolares')).toBe(true);
    expect(esUnCambio('entre_tesoros')).toBe(false);
  });

  it('un cambio es compra o venta según la moneda de su origen', () => {
    expect(claseDe('cambio', 'maun', null, { desde: 'ARS', hacia: 'USD' })?.id).toBe(
      'compra_de_dolares',
    );
    expect(claseDe('cambio', null, 'maun', { desde: 'USD', hacia: 'ARS' })?.id).toBe(
      'venta_de_dolares',
    );
  });

  it('un ingreso a un tesoro en dólares es un ingreso en dólares, y a uno en pesos sigue sin clase', () => {
    expect(claseDe('ingreso', null, null, { hacia: 'USD' })?.id).toBe('ingreso_en_dolares');
    expect(claseDe('ingreso', null, null, { hacia: 'ARS' })).toBeUndefined();
    expect(claseDe('ingreso', null, null)).toBeUndefined();
    expect(claseDe('ingreso', null, 'maun', { hacia: 'ARS' })?.id).toBe('ingreso_maun');
  });

  it('cada clase ofrece los lados de su moneda, sin el diezmo ni los archivados', () => {
    expect(ids(origenesDeLaClase('compra_de_dolares', TESOROS))).toEqual(['maun', 'materiales']);
    expect(ids(destinosDeLaClase('compra_de_dolares', TESOROS, MAUN))).toEqual([
      'dolares',
      'ahorro',
    ]);
    expect(ids(origenesDeLaClase('venta_de_dolares', TESOROS))).toEqual(['dolares', 'ahorro']);
    expect(ids(destinosDeLaClase('venta_de_dolares', TESOROS, DOLARES))).toEqual([
      'maun',
      'materiales',
    ]);
    expect(ids(destinosDeLaClase('entre_tesoros', TESOROS, DOLARES))).toEqual(['ahorro']);
    expect(ids(destinosDeLaClase('entre_tesoros', TESOROS, MAUN))).toEqual(['materiales']);
    expect(ids(tesorosParaElegir('ingreso_en_dolares', TESOROS))).toEqual(['dolares', 'ahorro']);
    expect(ids(tesorosParaElegir('gasto_tesoro', TESOROS))).toEqual([
      'materiales',
      'dolares',
      'ahorro',
    ]);
    expect(hayDolaresParaCargar(TESOROS)).toBe(true);
    expect(hayDolaresParaCargar([MAUN, VIEJO])).toBe(false);
  });

  it('la compra sale del tesoro en pesos con su saldo; la venta, del de dólares con el suyo', () => {
    expect(rutaParaComprarDolares({ id: 'maun-id', saldo: enPesos(centavos(72_500_000)) })).toBe(
      '/finanzas/nuevo?clase=compra_de_dolares&tesoro=maun-id&monto=72500000',
    );
    expect(rutaParaComprarDolares({ id: 'maun-id', saldo: enPesos(centavos(-1)) })).toBe(
      '/finanzas/nuevo?clase=compra_de_dolares&tesoro=maun-id',
    );
    expect(rutaParaVenderDolares({ id: 'dolares-id', saldo: plata('USD', 50_000) })).toBe(
      '/finanzas/nuevo?clase=venta_de_dolares&tesoro=dolares-id&monto=50000',
    );
    expect(rutaParaComprarDolaresPara({ id: 'dolares-id' })).toBe(
      '/finanzas/nuevo?clase=compra_de_dolares&hacia=dolares-id',
    );
  });

  it('«Qué dólar» se guarda en castellano y se muestra en el idioma de quien mira', async () => {
    expect(categoriaEnPantalla('Cripto')).toBe('Cripto');
    expect(categoriaEnPantalla('Una que escribí yo')).toBe('Una que escribí yo');
    try {
      await usarIdioma('en');
      expect(categoriaEnPantalla('Cripto')).toBe('Crypto');
      expect(categoriaEnPantalla('Oficial')).toBe('Official');
      expect(CLASE.venta_de_dolares.etiqueta).toBe('Dollar sale');
      expect(categoriaEnPantalla('Una que escribí yo')).toBe('Una que escribí yo');
      await usarIdioma('pt-BR');
      expect(categoriaEnPantalla('Otro')).toBe('Outro');
      expect(GRUPOS.at(-1)?.etiqueta).toBe('Dólares');
    } finally {
      await usarIdioma('es');
    }
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

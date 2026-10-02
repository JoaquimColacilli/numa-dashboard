import { centavos, enPesos, plata } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { TesoroDelTaller } from '@/entities/tesoro';
import { ICONOS_DE_TESORO } from '@/shared/lib';

import {
  borradorDe,
  borradorNuevo,
  cambiosDeCocos,
  cambiosDelTesoro,
  datosQueSeEditan,
  hayDiferencias,
  iconosParaElegir,
  ordenAlFinal,
  quienUsaLaTinta,
  revisarElTesoro,
  tesoroNuevo,
  tintaSugerida,
  type BorradorDelTesoro,
} from './tesoro';

function tesoro(parcial: Partial<TesoroDelTaller> & Pick<TesoroDelTaller, 'id'>): TesoroDelTaller {
  return {
    clave: null,
    moneda: 'ARS',
    nombre: 'Herramientas',
    descripcion: 'Para la sierra nueva',
    tinta: 'petroleo',
    icono: 'wrench',
    meta: enPesos(centavos(90_000_000)),
    rindeAnualBp: null,
    orden: 0,
    archivado: false,
    saldo: enPesos(centavos(0)),
    ...parcial,
  };
}

const HOGAR = tesoro({
  id: 'h',
  clave: 'hogar',
  nombre: 'Hogar',
  tinta: 'hogar',
  icono: 'house',
  meta: null,
});
const MAUN = tesoro({
  id: 'm',
  clave: 'maun',
  nombre: 'Maun',
  tinta: 'maun',
  icono: 'hammer',
  meta: null,
});

describe('el borrador de un tesoro', () => {
  it('sugiere la primera tinta que nadie usa, empezando por las nuevas', () => {
    expect(tintaSugerida([HOGAR, MAUN])).toBe('grana');
    expect(
      tintaSugerida([
        HOGAR,
        tesoro({ id: 'a', tinta: 'grana' }),
        tesoro({ id: 'b', tinta: 'mostaza', archivado: true }),
      ]),
    ).toBe('mostaza');
    expect(borradorNuevo([HOGAR]).tinta).toBe('grana');
  });

  it('dice quién más usa la tinta, sin contarse a sí mismo ni a los archivados', () => {
    const herramientas = tesoro({ id: 'x' });
    const archivado = tesoro({ id: 'y', nombre: 'Viejo', archivado: true });
    expect(quienUsaLaTinta([herramientas, archivado], 'petroleo', null)?.nombre).toBe(
      'Herramientas',
    );
    expect(quienUsaLaTinta([herramientas, archivado], 'petroleo', 'x')).toBeUndefined();
  });

  it('ofrece los 16 íconos, y suma el que ya tiene si no está entre ellos', () => {
    expect(iconosParaElegir('wrench')).toEqual(ICONOS_DE_TESORO);
    expect(iconosParaElegir('house')).toEqual(['house', ...ICONOS_DE_TESORO]);
  });

  it('pide un nombre de 1 a 24 letras y un rinde que se pueda leer', () => {
    const base = borradorNuevo([]);
    expect(revisarElTesoro({ ...base, nombre: '   ' }, { conRinde: false }).nombre).toMatch(
      /Ponele un nombre/,
    );
    expect(revisarElTesoro({ ...base, nombre: 'a'.repeat(25) }, { conRinde: false }).nombre).toBe(
      'Ponele un nombre, de hasta 24 letras.',
    );
    expect(revisarElTesoro({ ...base, nombre: 'Viaje' }, { conRinde: false })).toEqual({});
    expect(
      revisarElTesoro({ ...base, nombre: 'Cocos', rinde: 'mucho' }, { conRinde: true }).rinde,
    ).toMatch(/porcentaje/);
  });
});

describe('un tesoro nuevo', () => {
  it('va al final de los del dueño', () => {
    expect(ordenAlFinal([HOGAR, MAUN])).toBe(0);
    expect(
      ordenAlFinal([HOGAR, tesoro({ id: 'a', orden: 2 }), tesoro({ id: 'b', orden: 5 })]),
    ).toBe(6);
  });

  it('se arma recortado, con la meta en null si no tiene', () => {
    const borrador: BorradorDelTesoro = {
      nombre: '  Vacaciones ',
      descripcion: ' El viaje de enero ',
      moneda: 'ARS',
      tinta: 'petroleo',
      icono: 'plane',
      meta: 250_000_000,
      rinde: '0',
    };
    expect(tesoroNuevo(borrador, 'id-1', 3)).toEqual({
      id: 'id-1',
      nombre: 'Vacaciones',
      descripcion: 'El viaje de enero',
      tinta: 'petroleo',
      icono: 'plane',
      meta_centavos: 250_000_000,
      rinde_anual_bp: null,
      orden: 3,
      moneda: 'ARS',
    });
    expect(tesoroNuevo({ ...borrador, meta: 0 }, 'id-1', 3).meta_centavos).toBeNull();
    expect(tesoroNuevo({ ...borrador, meta: null }, 'id-1', 3).meta_centavos).toBeNull();
  });

  it('nace en pesos, y en dólares si se elige, con la meta en su moneda', () => {
    expect(borradorNuevo([]).moneda).toBe('ARS');
    const enDolares = { ...borradorNuevo([]), nombre: 'Dólares', moneda: 'USD' as const };
    expect(tesoroNuevo({ ...enDolares, meta: 100_000 }, 'id-2', 4)).toMatchObject({
      moneda: 'USD',
      meta_centavos: 100_000,
    });
  });

  it('el borrador de uno en dólares lleva su moneda y su meta en centavos de dólar', () => {
    const dolares = tesoro({
      id: 'usd',
      moneda: 'USD',
      meta: plata('USD', 500_000),
      saldo: plata('USD', 0),
    });
    expect(borradorDe(dolares)).toMatchObject({ moneda: 'USD', meta: 500_000 });
    expect(datosQueSeEditan(dolares, undefined).meta_centavos).toBe(500_000);
  });
});

describe('editar un tesoro', () => {
  it('manda solo lo que cambió, con lo de antes para volver atrás', () => {
    const herramientas = tesoro({ id: 'x' });
    const actual = datosQueSeEditan(herramientas, undefined);
    const diferencias = cambiosDelTesoro(actual, null, {
      ...borradorDe(herramientas),
      nombre: 'Herramientas nuevas ',
      meta: 120_000_000,
    });
    expect(diferencias).toEqual({
      cambios: { nombre: 'Herramientas nuevas', meta_centavos: 120_000_000 },
      previos: { nombre: 'Herramientas', meta_centavos: 90_000_000 },
    });
    expect(hayDiferencias(cambiosDelTesoro(actual, null, borradorDe(herramientas)))).toBe(false);
  });

  it('en los de siempre no toca la meta, que no va en tesoros', () => {
    const cocos = tesoro({
      id: 'c',
      clave: 'cocos',
      nombre: 'Cocos',
      tinta: 'cocos',
      icono: 'piggy-bank',
      meta: enPesos(centavos(1_000_000_000)),
      rindeAnualBp: 4000,
    });
    const diferencias = cambiosDelTesoro(datosQueSeEditan(cocos, undefined), 'cocos', {
      ...borradorDe(cocos),
      meta: 2_000_000_000,
    });
    expect(diferencias.cambios).toEqual({});
  });

  it('la meta y el rinde de Cocos salen como cambios de los ajustes', () => {
    const ajustes = { meta_cocos_centavos: 1_000_000_000, tasa_cocos_anual_bp: 4000 };
    const borrador = { ...borradorNuevo([]), meta: 1_500_000_000, rinde: '40' };
    expect(cambiosDeCocos(ajustes, borrador)).toEqual({
      cambios: { meta_cocos_centavos: 1_500_000_000 },
      previos: { meta_cocos_centavos: 1_000_000_000 },
    });
    expect(cambiosDeCocos(ajustes, { ...borrador, meta: null, rinde: '45,5' })).toEqual({
      cambios: { meta_cocos_centavos: 0, tasa_cocos_anual_bp: 4550 },
      previos: { meta_cocos_centavos: 1_000_000_000, tasa_cocos_anual_bp: 4000 },
    });
  });

  it('lee lo que está en la réplica si la fila está, para volver atrás con lo mismo', () => {
    const herramientas = tesoro({ id: 'x' });
    const fila = {
      id: 'x',
      household_id: 'h',
      clave: null,
      nombre: 'Herramientas',
      descripcion: '',
      tinta: 'tinta-que-no-existe',
      icono: 'wrench',
      meta_centavos: null,
      rinde_anual_bp: null,
      orden: 0,
      archivado_at: null,
      moneda: 'ARS',
      created_at: '',
      updated_at: '',
      deleted_at: null,
      version: 1,
    };
    expect(datosQueSeEditan(herramientas, fila).tinta).toBe('tinta-que-no-existe');
  });
});

import { centavos, enPesos, plata } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { TesoroDelTaller } from '@/entities/tesoro';
import { ICONOS_DE_TESORO } from '@/shared/lib';

import {
  admiteMeta,
  bajadaDeLaEdicion,
  borradorDe,
  borradorNuevo,
  cambiosDelTesoro,
  conLaMoneda,
  datosQueSeEditan,
  hayDiferencias,
  iconosParaElegir,
  metaQueVieneDeLosAjustes,
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
    metaFecha: null,
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

  it('ofrece los 17 íconos, y suma el que ya tiene si no está entre ellos', () => {
    expect(iconosParaElegir('wrench')).toEqual(ICONOS_DE_TESORO);
    expect(iconosParaElegir('house')).toEqual(['house', ...ICONOS_DE_TESORO]);
  });

  it('pide un nombre de 1 a 24 letras', () => {
    const base = borradorNuevo([]);
    expect(revisarElTesoro({ ...base, nombre: '   ' }).nombre).toMatch(/Ponele un nombre/);
    expect(revisarElTesoro({ ...base, nombre: 'a'.repeat(25) }).nombre).toBe(
      'Ponele un nombre, de hasta 24 letras.',
    );
    expect(revisarElTesoro({ ...base, nombre: 'Viaje' })).toEqual({});
  });

  it('una meta pide su objetivo, y la fecha va con objetivo y de hoy en adelante', () => {
    const viaje = { ...borradorNuevo([]), nombre: 'Viaje' };
    const hoy = '2026-10-26';
    expect(revisarElTesoro(viaje, { pideMeta: true, hoy }).meta).toBe(
      'Poné el objetivo: hasta cuánto junta.',
    );
    expect(revisarElTesoro({ ...viaje, meta: 0 }, { pideMeta: true, hoy }).meta).toBeDefined();
    expect(revisarElTesoro({ ...viaje, meta: 100_000 }, { pideMeta: true, hoy })).toEqual({});
    expect(revisarElTesoro({ ...viaje, metaFecha: '2027-01-15' }, { hoy }).metaFecha).toBe(
      'Para poner una fecha, poné primero el objetivo.',
    );
    const conObjetivo = { ...viaje, meta: 100_000 };
    expect(revisarElTesoro({ ...conObjetivo, metaFecha: '2026-10-25' }, { hoy }).metaFecha).toBe(
      'La fecha va de hoy en adelante.',
    );
    expect(
      revisarElTesoro({ ...conObjetivo, metaFecha: '15/01/2027' }, { hoy }).metaFecha,
    ).toBeDefined();
    expect(revisarElTesoro({ ...conObjetivo, metaFecha: hoy }, { hoy })).toEqual({});
    expect(revisarElTesoro({ ...conObjetivo, metaFecha: '2027-01-15' }, { hoy })).toEqual({});
  });
});

describe('un tesoro nuevo', () => {
  it('va al final de los del dueño', () => {
    expect(ordenAlFinal([HOGAR, MAUN])).toBe(0);
    expect(
      ordenAlFinal([HOGAR, tesoro({ id: 'a', orden: 2 }), tesoro({ id: 'b', orden: 5 })]),
    ).toBe(6);
  });

  it('se arma recortado, con la meta y su fecha en null si no tiene', () => {
    const borrador: BorradorDelTesoro = {
      nombre: '  Vacaciones ',
      descripcion: ' El viaje de enero ',
      moneda: 'ARS',
      tinta: 'petroleo',
      icono: 'plane',
      meta: 250_000_000,
      metaFecha: '2027-01-15',
    };
    expect(tesoroNuevo(borrador, 'id-1', 3)).toEqual({
      id: 'id-1',
      nombre: 'Vacaciones',
      descripcion: 'El viaje de enero',
      tinta: 'petroleo',
      icono: 'plane',
      meta_centavos: 250_000_000,
      meta_fecha: '2027-01-15',
      orden: 3,
      moneda: 'ARS',
    });
    expect(tesoroNuevo({ ...borrador, metaFecha: '' }, 'id-1', 3).meta_fecha).toBeNull();
    expect(tesoroNuevo({ ...borrador, meta: 0 }, 'id-1', 3)).toMatchObject({
      meta_centavos: null,
      meta_fecha: null,
    });
    expect(tesoroNuevo({ ...borrador, meta: null }, 'id-1', 3)).toMatchObject({
      meta_centavos: null,
      meta_fecha: null,
    });
  });

  it('en pesos nace con la caja fuerte y en dólares con los billetes, salvo que se haya elegido otro', () => {
    expect(borradorNuevo([])).toMatchObject({ moneda: 'ARS', icono: 'vault' });
    expect(borradorNuevo([], 'USD')).toMatchObject({ moneda: 'USD', icono: 'banknote' });
    expect(conLaMoneda(borradorNuevo([]), 'USD').icono).toBe('banknote');
    expect(conLaMoneda(borradorNuevo([], 'USD'), 'ARS').icono).toBe('vault');
    expect(conLaMoneda({ ...borradorNuevo([]), icono: 'plane' }, 'USD').icono).toBe('plane');
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
    const diferencias = cambiosDelTesoro(actual, true, {
      ...borradorDe(herramientas),
      nombre: 'Herramientas nuevas ',
      meta: 120_000_000,
    });
    expect(diferencias).toEqual({
      cambios: { nombre: 'Herramientas nuevas', meta_centavos: 120_000_000 },
      previos: { nombre: 'Herramientas', meta_centavos: 90_000_000 },
    });
    expect(hayDiferencias(cambiosDelTesoro(actual, true, borradorDe(herramientas)))).toBe(false);
  });

  it('la fecha de la meta va con la meta: sin meta, la fecha se va con ella', () => {
    const herramientas = tesoro({ id: 'x', metaFecha: '2027-01-15' });
    const actual = datosQueSeEditan(herramientas, undefined);
    expect(borradorDe(herramientas).metaFecha).toBe('2027-01-15');
    expect(
      cambiosDelTesoro(actual, true, { ...borradorDe(herramientas), metaFecha: '2027-03-01' }),
    ).toEqual({ cambios: { meta_fecha: '2027-03-01' }, previos: { meta_fecha: '2027-01-15' } });
    expect(cambiosDelTesoro(actual, true, { ...borradorDe(herramientas), meta: null })).toEqual({
      cambios: { meta_centavos: null, meta_fecha: null },
      previos: { meta_centavos: 90_000_000, meta_fecha: '2027-01-15' },
    });
  });

  it('la meta de Cocos va en el tesoro, como la de cualquiera; los otros de siempre no la llevan', () => {
    const cocos = tesoro({
      id: 'c',
      clave: 'cocos',
      nombre: 'Cocos',
      tinta: 'cocos',
      icono: 'piggy-bank',
      meta: enPesos(centavos(1_000_000_000)),
    });
    expect(admiteMeta('cocos')).toBe(true);
    expect(admiteMeta(null)).toBe(true);
    expect(admiteMeta('hogar')).toBe(false);
    expect(admiteMeta('maun')).toBe(false);
    expect(
      cambiosDelTesoro(datosQueSeEditan(cocos, undefined), true, {
        ...borradorDe(cocos),
        meta: 2_000_000_000,
      }),
    ).toEqual({
      cambios: { meta_centavos: 2_000_000_000 },
      previos: { meta_centavos: 1_000_000_000 },
    });

    const actualDelHogar = datosQueSeEditan(HOGAR, undefined);
    expect(actualDelHogar).toMatchObject({ meta_centavos: null, meta_fecha: null });
    expect(
      cambiosDelTesoro(actualDelHogar, false, { ...borradorDe(HOGAR), meta: 2_000_000_000 })
        .cambios,
    ).toEqual({});
    expect(bajadaDeLaEdicion(true)).toBe('Nombre, color, ícono y meta');
    expect(bajadaDeLaEdicion(false)).toBe('Nombre, color e ícono');
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
      meta_fecha: '2027-01-15',
      rinde_anual_bp: null,
      orden: 0,
      archivado_at: null,
      moneda: 'ARS',
      created_at: '',
      updated_at: '',
      deleted_at: null,
      version: 1,
    };
    expect(datosQueSeEditan(herramientas, fila)).toMatchObject({
      tinta: 'tinta-que-no-existe',
      meta_fecha: '2027-01-15',
    });
  });

  it('Cocos con la meta todavía en Ajustes: sin tocar nada no hay cambios, y vaciarla la deja en cero', () => {
    const cocos = tesoro({
      id: 'c',
      clave: 'cocos',
      nombre: 'GALPON',
      descripcion: '',
      tinta: 'cocos',
      icono: 'piggy-bank',
      meta: enPesos(centavos(7_000_000_000)),
    });
    const fila = {
      id: 'c',
      household_id: 'h',
      clave: 'cocos' as const,
      nombre: 'GALPON',
      descripcion: '',
      tinta: 'cocos',
      icono: 'piggy-bank',
      meta_centavos: null,
      meta_fecha: null,
      rinde_anual_bp: null,
      orden: 0,
      archivado_at: null,
      moneda: 'ARS',
      created_at: '',
      updated_at: '',
      deleted_at: null,
      version: 1,
    };
    const actual = datosQueSeEditan(cocos, fila);
    const deLosAjustes = metaQueVieneDeLosAjustes(cocos, fila);
    expect(actual.meta_centavos).toBeNull();
    expect(deLosAjustes).toBe(7_000_000_000);
    expect(hayDiferencias(cambiosDelTesoro(actual, true, borradorDe(cocos), deLosAjustes))).toBe(
      false,
    );
    expect(
      cambiosDelTesoro(actual, true, { ...borradorDe(cocos), meta: 8_000_000_000 }, deLosAjustes),
    ).toEqual({
      cambios: { meta_centavos: 8_000_000_000 },
      previos: { meta_centavos: null },
    });
    expect(
      cambiosDelTesoro(actual, true, { ...borradorDe(cocos), meta: null }, deLosAjustes),
    ).toEqual({
      cambios: { meta_centavos: 0 },
      previos: { meta_centavos: null },
    });

    const vaciada = { ...fila, meta_centavos: 0 };
    const sinMeta = { ...cocos, meta: null };
    expect(metaQueVieneDeLosAjustes(sinMeta, vaciada)).toBeNull();
    expect(
      hayDiferencias(
        cambiosDelTesoro(datosQueSeEditan(sinMeta, vaciada), true, borradorDe(sinMeta), null),
      ),
    ).toBe(false);
    expect(metaQueVieneDeLosAjustes(cocos, undefined)).toBeNull();
    expect(metaQueVieneDeLosAjustes(HOGAR, fila)).toBeNull();
  });
});

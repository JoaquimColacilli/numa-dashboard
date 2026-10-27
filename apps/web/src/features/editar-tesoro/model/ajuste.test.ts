import { centavos } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { categoriaDelAjuste, diferenciaDelAjuste, movimientoDelAjuste, SIN_MOTIVO } from './ajuste';

const HERRAMIENTAS = '01900000-0000-7000-8000-000000000006';

describe('la diferencia del ajuste', () => {
  it('es lo que hay que sumar o restar para que quede con lo que tiene ahora', () => {
    expect(diferenciaDelAjuste(centavos(15_000_000), centavos(20_000_000))).toEqual({
      sentido: 'suma',
      monto: 5_000_000,
    });
    expect(diferenciaDelAjuste(centavos(15_000_000), centavos(12_000_000))).toEqual({
      sentido: 'resta',
      monto: 3_000_000,
    });
    expect(diferenciaDelAjuste(centavos(-500_000), centavos(0))).toEqual({
      sentido: 'suma',
      monto: 500_000,
    });
  });

  it('si queda igual, o todavía no dijo cuánto tiene, no hay ajuste', () => {
    expect(diferenciaDelAjuste(centavos(15_000_000), centavos(15_000_000))).toBeNull();
    expect(diferenciaDelAjuste(centavos(15_000_000), null)).toBeNull();
  });
});

describe('el movimiento del ajuste', () => {
  function ajuste(saldo: number, tieneAhora: number) {
    const diferencia = diferenciaDelAjuste(centavos(saldo), centavos(tieneAhora));
    if (diferencia === null) throw new Error('No hay ajuste');
    return diferencia;
  }

  it('lo que se suma entra al tesoro, y lo que se resta sale de él', () => {
    expect(
      movimientoDelAjuste({
        id: 'm1',
        tesoro: HERRAMIENTAS,
        ajuste: ajuste(15_000_000, 20_000_000),
        motivo: { de: 'lista', motivo: 'Intereses' },
        fecha: '2026-10-26',
      }),
    ).toEqual({
      id: 'm1',
      fecha: '2026-10-26',
      tipo: 'ajuste',
      desde_id: null,
      hacia_id: HERRAMIENTAS,
      monto_centavos: 5_000_000,
      categoria: 'Intereses',
      descripcion: '',
    });
    expect(
      movimientoDelAjuste({
        id: 'm2',
        tesoro: HERRAMIENTAS,
        ajuste: ajuste(15_000_000, 12_000_000),
        motivo: { de: 'lista', motivo: 'Venta' },
        fecha: '2026-10-20',
      }),
    ).toEqual({
      id: 'm2',
      fecha: '2026-10-20',
      tipo: 'ajuste',
      desde_id: HERRAMIENTAS,
      hacia_id: null,
      monto_centavos: 3_000_000,
      categoria: 'Venta',
      descripcion: '',
    });
  });

  it('el motivo sale de la lista o se escribe; sin motivo, o con «Apertura», va sin categoría', () => {
    expect(categoriaDelAjuste({ de: 'lista', motivo: 'Corrección' })).toBe('Corrección');
    expect(categoriaDelAjuste({ de: 'libre', texto: '  Me olvidé   de anotarlo ' })).toBe(
      'Me olvidé de anotarlo',
    );
    expect(categoriaDelAjuste(SIN_MOTIVO)).toBe('');
    expect(categoriaDelAjuste({ de: 'libre', texto: 'Apertura' })).toBe('');
    expect(categoriaDelAjuste({ de: 'libre', texto: ' apertura ' })).toBe('');
    expect(
      movimientoDelAjuste({
        id: 'm3',
        tesoro: HERRAMIENTAS,
        ajuste: ajuste(15_000_000, 15_000_100),
        motivo: { de: 'libre', texto: 'Apertura' },
        fecha: '2026-10-26',
      }).categoria,
    ).toBe('');
  });
});

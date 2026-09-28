import { centavos, type Asiento } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { resumenMensual } from './mes';

function asiento(partes: Partial<Asiento> & Pick<Asiento, 'monto' | 'concepto'>): Asiento {
  return {
    origen: 'manual',
    asientoId: crypto.randomUUID(),
    fecha: '2026-09-01',
    tesoro: 'hogar',
    contrapartida: null,
    tesoroId: 'hogar',
    contrapartidaId: null,
    categoria: '',
    descripcion: '',
    proyectoId: null,
    yaEnLaApertura: false,
    ...partes,
  };
}

describe('resumenMensual', () => {
  it('la apertura de la migración acomoda el saldo pero no cuenta como lo que entró o gastó el hogar en el mes', () => {
    const asientos = [
      asiento({ concepto: 'ajuste', categoria: 'Apertura', monto: centavos(250_000_000) }),
      asiento({
        concepto: 'ajuste',
        categoria: 'Apertura',
        tesoro: 'maun',
        monto: centavos(-80_000_000),
      }),
      asiento({ concepto: 'ingreso', monto: centavos(10_000_000) }),
      asiento({ concepto: 'gasto', monto: centavos(-4_000_000) }),
      asiento({ concepto: 'cobro', origen: 'pago', tesoro: 'maun', monto: centavos(30_000_000) }),
    ];

    expect(resumenMensual(asientos, '2026-09')).toEqual({
      entroHogar: 10_000_000,
      gastoHogar: 4_000_000,
      facturoTaller: 30_000_000,
    });
  });

  it('un pase entre tesoros no es lo que entró ni lo que gastó el hogar, y el sueldo del reparto sí entra', () => {
    const asientos = [
      asiento({
        concepto: 'transferencia',
        contrapartida: null,
        contrapartidaId: 'materiales',
        monto: centavos(-3_000_000),
      }),
      asiento({
        concepto: 'transferencia',
        contrapartida: 'maun',
        contrapartidaId: 'maun',
        monto: centavos(2_000_000),
      }),
      asiento({
        concepto: 'sueldo',
        origen: 'reparto',
        contrapartida: 'maun',
        contrapartidaId: 'maun',
        monto: centavos(180_000_000),
      }),
      asiento({ concepto: 'gasto', monto: centavos(-1_000_000) }),
    ];

    expect(resumenMensual(asientos, '2026-09')).toEqual({
      entroHogar: 180_000_000,
      gastoHogar: 1_000_000,
      facturoTaller: 0,
    });
  });

  it('un ajuste negativo del hogar tampoco suma a lo gastado', () => {
    const asientos = [
      asiento({ concepto: 'ajuste', monto: centavos(-5_000_000) }),
      asiento({ concepto: 'gasto', monto: centavos(-1_000_000) }),
    ];

    expect(resumenMensual(asientos, '2026-09').gastoHogar).toBe(1_000_000);
  });
});

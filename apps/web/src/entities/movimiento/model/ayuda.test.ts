import { centavos } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { formatearPesos } from '@/shared/lib';

import { ayudaDelMovimiento } from './ayuda';

const SALDOS = {
  hogar: centavos(10_000_000),
  maun: centavos(50_000_000),
  diezmo: centavos(0),
  cocos: centavos(20_000_000),
};

describe('la ayuda de un pase entre tesoros', () => {
  it('nombra los dos tesoros y dice cómo queda cada uno', () => {
    const texto = ayudaDelMovimiento('entre_tesoros', {
      saldos: SALDOS,
      metaCocos: centavos(0),
      monto: centavos(15_000_000),
      lados: {
        desde: { nombre: 'Maun', saldo: centavos(50_000_000) },
        hacia: { nombre: 'Materiales', saldo: centavos(5_000_000) },
      },
    });
    expect(texto).toContain('Pasa de Maun a Materiales');
    expect(texto).toContain(`Maun queda en ${formatearPesos(centavos(35_000_000))}`);
    expect(texto).toContain(`Materiales en ${formatearPesos(centavos(20_000_000))}`);
  });

  it('avisa si el que da queda en negativo', () => {
    const texto = ayudaDelMovimiento('entre_tesoros', {
      saldos: SALDOS,
      metaCocos: centavos(0),
      monto: centavos(8_000_000),
      lados: {
        desde: { nombre: 'Herramientas', saldo: centavos(5_000_000) },
        hacia: { nombre: 'Maun', saldo: centavos(0) },
      },
    });
    expect(texto).toContain('o sea en negativo');
  });

  it('sin los lados elegidos explica qué es', () => {
    expect(
      ayudaDelMovimiento('entre_tesoros', {
        saldos: SALDOS,
        metaCocos: centavos(0),
        monto: centavos(0),
      }),
    ).toBe('Pasa de un tesoro a otro: la plata no se va, cambia de bolsillo.');
  });

  it('las ocho de siempre siguen leyendo los saldos por su clave', () => {
    expect(
      ayudaDelMovimiento('gasto_hogar', {
        saldos: SALDOS,
        metaCocos: centavos(0),
        monto: centavos(1_000_000),
      }),
    ).toBe(`Sale del hogar. El hogar queda en ${formatearPesos(centavos(9_000_000))}.`);
  });
});

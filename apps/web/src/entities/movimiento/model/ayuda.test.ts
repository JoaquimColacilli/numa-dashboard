import { centavos, enPesos, plata } from '@maun/domain';
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
        desde: { nombre: 'Maun', saldo: enPesos(centavos(50_000_000)) },
        hacia: { nombre: 'Materiales', saldo: enPesos(centavos(5_000_000)) },
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
        desde: { nombre: 'Herramientas', saldo: enPesos(centavos(5_000_000)) },
        hacia: { nombre: 'Maun', saldo: enPesos(centavos(0)) },
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

  it('un gasto de un tesoro nombra el tesoro y dice cómo queda', () => {
    expect(
      ayudaDelMovimiento('gasto_tesoro', {
        saldos: SALDOS,
        metaCocos: centavos(0),
        monto: centavos(50_000_000),
        tesoro: { nombre: 'Alquiler', saldo: enPesos(centavos(63_000_000)) },
      }),
    ).toBe(`Sale de Alquiler y se va. Alquiler queda en ${formatearPesos(centavos(13_000_000))}.`);
    expect(
      ayudaDelMovimiento('gasto_tesoro', {
        saldos: SALDOS,
        metaCocos: centavos(0),
        monto: centavos(0),
      }),
    ).toBe('Sale del tesoro que elijas y se va.');
  });

  it('un gasto de un tesoro en dólares dice cómo queda en dólares', () => {
    expect(
      ayudaDelMovimiento('gasto_tesoro', {
        saldos: SALDOS,
        metaCocos: centavos(0),
        monto: 20_000,
        tesoro: { nombre: 'Dólares', saldo: plata('USD', 50_000) },
      }).replace(/\s/g, ' '),
    ).toBe('Sale de Dólares y se va. Dólares queda en US$ 300.');
  });

  it('una compra y una venta dicen cómo queda cada lado, cada uno con su importe', () => {
    const lados = {
      desde: { nombre: 'Maun', saldo: enPesos(centavos(100_000_000)) },
      hacia: { nombre: 'Dólares', saldo: plata('USD', 10_000) },
    };
    expect(
      ayudaDelMovimiento('compra_de_dolares', {
        saldos: SALDOS,
        metaCocos: centavos(0),
        monto: 72_500_000,
        montoDestino: 50_000,
        lados,
      }).replace(/\s/g, ' '),
    ).toBe(
      'Cambia pesos por dólares: la plata no se va, cambia de moneda. Maun queda en $ 275.000, y Dólares en US$ 600.',
    );
    expect(
      ayudaDelMovimiento('compra_de_dolares', {
        saldos: SALDOS,
        metaCocos: centavos(0),
        monto: 150_000_000,
        montoDestino: 100_000,
        lados,
      }),
    ).toContain('o sea en negativo, y Dólares en');
    expect(
      ayudaDelMovimiento('venta_de_dolares', {
        saldos: SALDOS,
        metaCocos: centavos(0),
        monto: 0,
      }),
    ).toBe('Cambia dólares por pesos: la plata no se va, cambia de moneda.');
  });

  it('un ingreso en dólares no pasa por el taller ni por el diezmo', () => {
    expect(
      ayudaDelMovimiento('ingreso_en_dolares', {
        saldos: SALDOS,
        metaCocos: centavos(0),
        monto: 5_000,
        tesoro: { nombre: 'Dólares', saldo: plata('USD', 50_000) },
      }).replace(/\s/g, ' '),
    ).toBe('Entra a Dólares y no pasa por el taller ni por el diezmo. Dólares queda en US$ 550.');
    expect(
      ayudaDelMovimiento('ingreso_en_dolares', {
        saldos: SALDOS,
        metaCocos: centavos(0),
        monto: 0,
      }),
    ).toBe('Entra al tesoro en dólares que elijas y no pasa por el taller ni por el diezmo.');
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

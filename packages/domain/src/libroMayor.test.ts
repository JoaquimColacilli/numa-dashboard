import { describe, expect, it } from 'vitest';

import {
  asientosDeLaLinea,
  asientosDelLibro,
  asientosDelMes,
  entradasYSalidas,
  entradasYSalidasPorId,
  esAnteriorALaApertura,
  estadoDelDiezmo,
  fechaDeApertura,
  lineasDelLibro,
  mueveLosTesoros,
  proyeccionCocos,
  saldosDelLibro,
  saldosDelLibroPorId,
  saldosPorId,
  saldosPorTesoro,
  type Asiento,
  type DatosDelLibro,
  type GastoDelLibro,
  type MovimientoDelLibro,
  type PagoDelLibro,
  type ProyectoDelLibro,
  type RepartoDelLibro,
  type Tesoro,
} from './libroMayor.ts';
import { centavos, type Money } from './money.ts';

const $ = (valor: number): Money => centavos(valor);

function datos(partes: Partial<DatosDelLibro>): DatosDelLibro {
  return {
    tesoros: [],
    movimientos: [],
    pagos: [],
    gastos: [],
    proyectos: [],
    repartos: [],
    ...partes,
  };
}

function movimiento(partes: Partial<MovimientoDelLibro>): MovimientoDelLibro {
  return {
    id: 'm1',
    fecha: '2026-09-01',
    tipo: 'ingreso',
    tesoroOrigen: null,
    tesoroDestino: 'hogar',
    desdeId: null,
    haciaId: null,
    monto: $(1000),
    categoria: '',
    descripcion: '',
    proyectoId: null,
    ...partes,
  };
}

function pago(partes: Partial<PagoDelLibro>): PagoDelLibro {
  return {
    id: 'g1',
    proyectoId: 'p1',
    fecha: '2026-09-01',
    concepto: 'Seña',
    monto: $(500),
    yaEnLaApertura: false,
    ...partes,
  };
}

function gasto(partes: Partial<GastoDelLibro>): GastoDelLibro {
  return {
    id: 'x1',
    proyectoId: 'p1',
    fecha: '2026-09-01',
    descripcion: 'Melamina',
    monto: $(200),
    ...partes,
  };
}

function proyecto(partes: Partial<ProyectoDelLibro>): ProyectoDelLibro {
  return {
    id: 'p1',
    titulo: 'Placard',
    estado: 'en_curso',
    fechaCobro: null,
    diezmo: $(0),
    sueldo: $(0),
    repartoYaEnLaApertura: false,
    ...partes,
  };
}

function porTesoro(asientos: readonly Asiento[], tesoro: Tesoro): Asiento[] {
  return asientos.filter((asiento) => asiento.tesoro === tesoro);
}

describe('movimientos manuales', () => {
  it('un ingreso entra a su tesoro y no genera contrapartida', () => {
    const asientos = asientosDelLibro(datos({ movimientos: [movimiento({})] }));

    expect(asientos).toHaveLength(1);
    expect(asientos[0]).toMatchObject({
      origen: 'manual',
      tesoro: 'hogar',
      contrapartida: null,
      monto: 1000,
      concepto: 'ingreso',
    });
  });

  it('un gasto sale de su tesoro con el signo cambiado', () => {
    const asientos = asientosDelLibro(
      datos({
        movimientos: [
          movimiento({ tipo: 'gasto', tesoroOrigen: 'maun', tesoroDestino: null, monto: $(700) }),
        ],
      }),
    );

    expect(asientos).toHaveLength(1);
    expect(asientos[0]).toMatchObject({ tesoro: 'maun', contrapartida: null, monto: -700 });
  });

  it('una transferencia genera los dos lados, y cada uno apunta al otro', () => {
    const asientos = asientosDelLibro(
      datos({
        movimientos: [
          movimiento({
            tipo: 'transferencia',
            tesoroOrigen: 'maun',
            tesoroDestino: 'cocos',
            monto: $(2500),
          }),
        ],
      }),
    );

    expect(asientos).toHaveLength(2);
    expect(asientos[0]).toMatchObject({ tesoro: 'cocos', contrapartida: 'maun', monto: 2500 });
    expect(asientos[1]).toMatchObject({ tesoro: 'maun', contrapartida: 'cocos', monto: -2500 });
  });
});

describe('pagos y gastos de un proyecto', () => {
  it('el pago entra a maun y el gasto sale de maun', () => {
    const asientos = asientosDelLibro(
      datos({ pagos: [pago({})], gastos: [gasto({})], proyectos: [proyecto({})] }),
    );

    expect(asientos).toHaveLength(2);
    expect(asientos[0]).toMatchObject({
      origen: 'pago',
      tesoro: 'maun',
      monto: 500,
      concepto: 'cobro',
      categoria: 'Cobro',
      descripcion: 'Seña',
    });
    expect(asientos[1]).toMatchObject({
      origen: 'gasto_proyecto',
      tesoro: 'maun',
      monto: -200,
      concepto: 'gasto',
      categoria: 'Materiales',
    });
  });

  it('los de un proyecto que no está no entran: es el join de la vista', () => {
    const asientos = asientosDelLibro(
      datos({
        pagos: [pago({ proyectoId: 'borrado' })],
        gastos: [gasto({ proyectoId: 'borrado' })],
      }),
    );

    expect(asientos).toEqual([]);
  });
});

describe('la distribución congelada', () => {
  it('un cobrado mueve el diezmo de maun a diezmo y el sueldo de maun a hogar', () => {
    const asientos = asientosDelLibro(
      datos({
        proyectos: [
          proyecto({
            estado: 'cobrado',
            fechaCobro: '2026-08-28',
            diezmo: $(88_670),
            sueldo: $(798_030),
          }),
        ],
      }),
    );

    expect(asientos).toHaveLength(4);
    expect(porTesoro(asientos, 'diezmo')[0]).toMatchObject({
      monto: 88_670,
      contrapartida: 'maun',
    });
    expect(porTesoro(asientos, 'hogar')[0]).toMatchObject({
      monto: 798_030,
      contrapartida: 'maun',
    });
    expect(porTesoro(asientos, 'maun').map((asiento) => asiento.monto)).toEqual([
      -88_670, -798_030,
    ]);
    expect(asientos[0]).toMatchObject({
      origen: 'distribucion',
      fecha: '2026-08-28',
      categoria: 'Distribución',
      descripcion: 'Placard',
      proyectoId: 'p1',
    });
  });

  it('un perdido con seña retenida también mueve el diezmo', () => {
    const asientos = asientosDelLibro(
      datos({
        proyectos: [
          proyecto({
            estado: 'perdido',
            fechaCobro: '2026-08-14',
            diezmo: $(320_000),
            sueldo: $(0),
          }),
        ],
      }),
    );

    expect(asientos).toHaveLength(2);
    expect(porTesoro(asientos, 'diezmo')[0]?.monto).toBe(320_000);
    expect(porTesoro(asientos, 'maun')[0]?.monto).toBe(-320_000);
  });

  it('los escalones en cero no generan asientos', () => {
    const asientos = asientosDelLibro(
      datos({
        proyectos: [
          proyecto({ estado: 'perdido', fechaCobro: '2026-07-10', diezmo: $(0), sueldo: $(0) }),
        ],
      }),
    );

    expect(asientos).toEqual([]);
  });

  it('un proyecto que no está liquidado no distribuye nada', () => {
    const asientos = asientosDelLibro(
      datos({ proyectos: [proyecto({ estado: 'en_curso', diezmo: $(999), sueldo: $(999) })] }),
    );

    expect(asientos).toEqual([]);
  });

  it('sin fecha de cobro tampoco, aunque el estado diga liquidado', () => {
    const asientos = asientosDelLibro(
      datos({
        proyectos: [
          proyecto({ estado: 'cobrado', fechaCobro: null, diezmo: $(10), sueldo: $(10) }),
        ],
      }),
    );

    expect(asientos).toEqual([]);
  });
});

describe('saldos', () => {
  it('el saldo de un tesoro es la suma de sus asientos, y los tesoros sin movimiento quedan en cero', () => {
    const completo = datos({
      movimientos: [
        movimiento({ id: 'm1', tesoroDestino: 'hogar', monto: $(420_000) }),
        movimiento({
          id: 'm2',
          tipo: 'gasto',
          tesoroOrigen: 'hogar',
          tesoroDestino: null,
          monto: $(86_400),
        }),
      ],
      pagos: [pago({ monto: $(1_000_000) })],
      gastos: [gasto({ monto: $(492_000) })],
      proyectos: [
        proyecto({
          estado: 'cobrado',
          fechaCobro: '2026-08-28',
          diezmo: $(50_000),
          sueldo: $(30_000),
        }),
      ],
    });

    expect(saldosDelLibro(completo)).toEqual({
      hogar: 420_000 - 86_400 + 30_000,
      maun: 1_000_000 - 492_000 - 50_000 - 30_000,
      diezmo: 50_000,
      cocos: 0,
    });
  });

  it('sin asientos, los cuatro tesoros están en cero', () => {
    expect(saldosPorTesoro([])).toEqual({ hogar: 0, maun: 0, diezmo: 0, cocos: 0 });
  });
});

describe('agregados del mes', () => {
  const asientos = asientosDelLibro(
    datos({
      movimientos: [
        movimiento({ id: 'm1', fecha: '2026-09-05', tesoroDestino: 'hogar', monto: $(420_000) }),
        movimiento({
          id: 'm2',
          fecha: '2026-09-09',
          tipo: 'gasto',
          tesoroOrigen: 'hogar',
          tesoroDestino: null,
          monto: $(86_400),
        }),
        movimiento({ id: 'm3', fecha: '2026-08-31', tesoroDestino: 'hogar', monto: $(999) }),
      ],
    }),
  );

  it('separa el mes pedido del resto', () => {
    expect(asientosDelMes(asientos, '2026-09')).toHaveLength(2);
    expect(asientosDelMes(asientos, '2026-08')).toHaveLength(1);
    expect(asientosDelMes(asientos, '2026-07')).toEqual([]);
  });

  it('lo que entró y lo que salió de un tesoro son dos números positivos', () => {
    expect(entradasYSalidas(asientosDelMes(asientos, '2026-09'), 'hogar')).toEqual({
      entro: 420_000,
      salio: 86_400,
    });
  });

  it('un tesoro sin asientos queda en cero de los dos lados', () => {
    expect(entradasYSalidas(asientos, 'cocos')).toEqual({ entro: 0, salio: 0 });
  });
});

describe('proyeccionCocos', () => {
  it('capitaliza el saldo por los días que faltan', () => {
    expect(proyeccionCocos($(10_000_000), 4_000, 365)).toBe(14_000_000);
  });

  it('sin días por delante, o sin tasa, devuelve el saldo tal cual', () => {
    expect(proyeccionCocos($(10_000_000), 4_000, 0)).toBe(10_000_000);
    expect(proyeccionCocos($(10_000_000), 4_000, -5)).toBe(10_000_000);
    expect(proyeccionCocos($(10_000_000), 0, 365)).toBe(10_000_000);
  });

  it('acepta tasas por encima del 100%, que es lo que la base permite', () => {
    expect(proyeccionCocos($(1_000_000), 100_000, 365)).toBe(11_000_000);
  });

  it('rechaza una tasa que no es un entero no negativo', () => {
    expect(() => proyeccionCocos($(1), -1, 365)).toThrow(RangeError);
    expect(() => proyeccionCocos($(1), 1.5, 365)).toThrow(RangeError);
  });
});

describe('lineasDelLibro', () => {
  it('una transferencia es una sola línea con los dos lados, y sus dos asientos salen de ella', () => {
    const lineas = lineasDelLibro(
      datos({
        movimientos: [
          movimiento({
            id: 'm1',
            tipo: 'transferencia',
            tesoroOrigen: 'cocos',
            tesoroDestino: 'maun',
            monto: $(300_000),
          }),
        ],
      }),
    );

    expect(lineas).toEqual([
      {
        origen: 'manual',
        asientoId: 'm1',
        fecha: '2026-09-01',
        desde: 'cocos',
        hacia: 'maun',
        desdeId: 'cocos',
        haciaId: 'maun',
        monto: 300_000,
        concepto: 'transferencia',
        categoria: '',
        descripcion: '',
        proyectoId: null,
        yaEnLaApertura: false,
      },
    ]);

    const [linea] = lineas;
    if (!linea) throw new Error('la transferencia no generó su línea');
    expect(asientosDeLaLinea(linea).map((asiento) => [asiento.tesoro, asiento.monto])).toEqual([
      ['maun', 300_000],
      ['cocos', -300_000],
    ]);
  });

  it('un ingreso y un gasto tienen un solo lado y un solo asiento', () => {
    const lineas = lineasDelLibro(
      datos({
        movimientos: [
          movimiento({ id: 'm1', tipo: 'ingreso', tesoroOrigen: null, tesoroDestino: 'hogar' }),
          movimiento({ id: 'm2', tipo: 'gasto', tesoroOrigen: 'hogar', tesoroDestino: null }),
        ],
      }),
    );

    expect(lineas.map((linea) => [linea.desde, linea.hacia])).toEqual([
      [null, 'hogar'],
      ['hogar', null],
    ]);
    expect(lineas.flatMap(asientosDeLaLinea)).toHaveLength(2);
  });

  it('un pago entra a maun sin contrapartida y un gasto de proyecto sale de maun', () => {
    const lineas = lineasDelLibro(
      datos({
        proyectos: [proyecto({})],
        pagos: [pago({ id: 'g1', monto: $(500_000) })],
        gastos: [gasto({ id: 'x1', monto: $(120_000) })],
      }),
    );

    expect(lineas.map((linea) => [linea.origen, linea.desde, linea.hacia, linea.monto])).toEqual([
      ['pago', null, 'maun', 500_000],
      ['gasto_proyecto', 'maun', null, 120_000],
    ]);
  });

  it('la distribución congelada son dos líneas de maun hacia diezmo y hogar', () => {
    const lineas = lineasDelLibro(
      datos({
        proyectos: [
          proyecto({
            estado: 'cobrado',
            fechaCobro: '2026-09-10',
            diezmo: $(70_000),
            sueldo: $(500_000),
          }),
        ],
      }),
    );

    expect(
      lineas.map((linea) => [linea.concepto, linea.desde, linea.hacia, linea.monto, linea.fecha]),
    ).toEqual([
      ['diezmo', 'maun', 'diezmo', 70_000, '2026-09-10'],
      ['sueldo', 'maun', 'hogar', 500_000, '2026-09-10'],
    ]);
    expect(lineas.every((linea) => linea.asientoId === 'p1')).toBe(true);
  });

  it('un escalón en cero no genera línea', () => {
    const lineas = lineasDelLibro(
      datos({
        proyectos: [
          proyecto({ estado: 'perdido', fechaCobro: '2026-09-10', diezmo: $(0), sueldo: $(0) }),
        ],
      }),
    );

    expect(lineas).toEqual([]);
  });

  it('un proyecto sin liquidar, o liquidado sin fecha, no genera distribución', () => {
    expect(
      lineasDelLibro(
        datos({ proyectos: [proyecto({ estado: 'en_curso', diezmo: $(1), sueldo: $(1) })] }),
      ),
    ).toEqual([]);
    expect(
      lineasDelLibro(
        datos({
          proyectos: [
            proyecto({ estado: 'cobrado', fechaCobro: null, diezmo: $(1), sueldo: $(1) }),
          ],
        }),
      ),
    ).toEqual([]);
  });

  it('los pagos y los gastos de un proyecto que no está en la réplica se ignoran', () => {
    expect(
      lineasDelLibro(
        datos({ pagos: [pago({ proyectoId: 'otro' })], gastos: [gasto({ proyectoId: 'otro' })] }),
      ),
    ).toEqual([]);
  });
});

describe('lo que ya estaba en los saldos de la apertura', () => {
  const conLaApertura = datos({
    movimientos: [
      movimiento({
        id: 'a1',
        tipo: 'ajuste',
        fecha: '2026-09-14',
        tesoroOrigen: null,
        tesoroDestino: 'maun',
        monto: $(1_000_000),
        categoria: 'Apertura',
      }),
    ],
    pagos: [
      pago({ id: 'viejo', fecha: '2026-07-10', monto: $(300_000), yaEnLaApertura: true }),
      pago({ id: 'nuevo', fecha: '2026-09-20', monto: $(200_000) }),
    ],
    proyectos: [
      proyecto({
        estado: 'cobrado',
        fechaCobro: '2026-07-10',
        diezmo: $(30_000),
        sueldo: $(270_000),
        repartoYaEnLaApertura: true,
      }),
    ],
  });

  it('el pago y el reparto quedan en el libro con su fecha, marcados', () => {
    const lineas = lineasDelLibro(conLaApertura);

    expect(
      lineas
        .filter((linea) => linea.yaEnLaApertura)
        .map((linea) => [linea.origen, linea.fecha, linea.monto]),
    ).toEqual([
      ['pago', '2026-07-10', 300_000],
      ['distribucion', '2026-07-10', 30_000],
      ['distribucion', '2026-07-10', 270_000],
    ]);
    expect(
      asientosDelLibro(conLaApertura)
        .filter((asiento) => asiento.yaEnLaApertura)
        .every((asiento) => !mueveLosTesoros(asiento)),
    ).toBe(true);
  });

  it('pero no mueven los tesoros: el saldo es la apertura más lo nuevo', () => {
    expect(saldosDelLibro(conLaApertura)).toEqual({
      hogar: 0,
      maun: 1_000_000 + 200_000,
      diezmo: 0,
      cocos: 0,
    });
  });

  it('las cifras del mes sí los cuentan en su mes: la plata entró ese mes', () => {
    const julio = asientosDelMes(asientosDelLibro(conLaApertura), '2026-07');
    expect(entradasYSalidas(julio, 'maun')).toEqual({ entro: 300_000, salio: 300_000 });
    expect(entradasYSalidas(julio, 'hogar')).toEqual({ entro: 270_000, salio: 0 });
  });

  it('el diezmo que ya estaba en la apertura no se debe de nuevo', () => {
    expect(estadoDelDiezmo(asientosDelLibro(conLaApertura))).toMatchObject({
      situacion: 'al-dia',
      generado: 0,
    });
  });

  it('la fecha de la apertura es el primer ajuste de apertura; sin apertura no hay', () => {
    expect(fechaDeApertura(conLaApertura.movimientos)).toBe('2026-09-14');
    expect(
      fechaDeApertura([
        movimiento({ id: 'x', tipo: 'ajuste', fecha: '2026-09-16', categoria: 'Apertura' }),
        movimiento({ id: 'y', tipo: 'ajuste', fecha: '2026-09-15', categoria: 'Apertura' }),
        movimiento({ id: 'v', tipo: 'ajuste', fecha: '2026-09-17', categoria: 'Apertura' }),
        movimiento({ id: 'z', tipo: 'ajuste', fecha: '2026-01-01', categoria: 'Ajuste' }),
        movimiento({ id: 'w', tipo: 'ingreso', fecha: '2026-01-01', categoria: 'Apertura' }),
      ]),
    ).toBe('2026-09-15');
    expect(fechaDeApertura([movimiento({})])).toBeNull();
  });

  it('anterior a la apertura es estrictamente antes: el día de la apertura ya no', () => {
    expect(esAnteriorALaApertura('2026-09-13', '2026-09-14')).toBe(true);
    expect(esAnteriorALaApertura('2026-09-14', '2026-09-14')).toBe(false);
    expect(esAnteriorALaApertura('2026-09-20', '2026-09-14')).toBe(false);
    expect(esAnteriorALaApertura('2020-01-01', null)).toBe(false);
  });
});

describe('estadoDelDiezmo', () => {
  function conDiezmo(generado: number, pagado: number): Asiento[] {
    return asientosDelLibro(
      datos({
        proyectos: [proyecto({ estado: 'cobrado', fechaCobro: '2026-09-10', diezmo: $(generado) })],
        movimientos:
          pagado === 0
            ? []
            : [
                movimiento({
                  id: 'm1',
                  tipo: 'pago_diezmo',
                  tesoroOrigen: 'diezmo',
                  tesoroDestino: null,
                  monto: $(pagado),
                }),
              ],
      }),
    );
  }

  it('con más generado que pagado, debe la diferencia', () => {
    expect(estadoDelDiezmo(conDiezmo(100_000, 30_000))).toEqual({
      situacion: 'debe',
      importe: 70_000,
      generado: 100_000,
      pagado: 30_000,
    });
  });

  it('con todo pagado está al día, y el importe es cero', () => {
    expect(estadoDelDiezmo(conDiezmo(100_000, 100_000))).toEqual({
      situacion: 'al-dia',
      importe: 0,
      generado: 100_000,
      pagado: 100_000,
    });
  });

  it('con más pagado que generado, pagó de más, y el importe sigue siendo positivo', () => {
    expect(estadoDelDiezmo(conDiezmo(100_000, 130_000))).toEqual({
      situacion: 'pago-de-mas',
      importe: 30_000,
      generado: 100_000,
      pagado: 130_000,
    });
  });

  it('sin nada generado ni pagado, está al día', () => {
    expect(estadoDelDiezmo([])).toEqual({
      situacion: 'al-dia',
      importe: 0,
      generado: 0,
      pagado: 0,
    });
  });
});

describe('la cuenta por id de tesoro', () => {
  const TESOROS_DEL_TALLER = [
    { id: 't-hogar', clave: 'hogar' as const },
    { id: 't-maun', clave: 'maun' as const },
    { id: 't-diezmo', clave: 'diezmo' as const },
    { id: 't-cocos', clave: 'cocos' as const },
    { id: 't-fijos', clave: null },
    { id: 't-materiales', clave: null },
  ];

  function reparto(partes: Partial<RepartoDelLibro>): RepartoDelLibro {
    return {
      id: 'r1',
      proyectoId: 'p1',
      tesoroId: 't-fijos',
      clase: 'fijos',
      monto: $(900_000),
      fecha: '2026-09-10',
      yaEnLaApertura: false,
      ...partes,
    };
  }

  it('un movimiento de antes, con la clave sola, lleva el id de su tesoro', () => {
    const [linea] = lineasDelLibro(
      datos({
        tesoros: TESOROS_DEL_TALLER,
        movimientos: [
          movimiento({ tipo: 'transferencia', tesoroOrigen: 'maun', tesoroDestino: 'cocos' }),
        ],
      }),
    );

    expect(linea).toMatchObject({
      desde: 'maun',
      hacia: 'cocos',
      desdeId: 't-maun',
      haciaId: 't-cocos',
    });
  });

  it('uno con el id solo recupera la clave de los de siempre, y los del dueño no tienen', () => {
    const lineas = lineasDelLibro(
      datos({
        tesoros: TESOROS_DEL_TALLER,
        movimientos: [
          movimiento({
            id: 'm1',
            tipo: 'transferencia',
            tesoroOrigen: null,
            tesoroDestino: null,
            desdeId: 't-maun',
            haciaId: 't-materiales',
          }),
        ],
      }),
    );

    expect(lineas.map((linea) => [linea.desde, linea.hacia, linea.desdeId, linea.haciaId])).toEqual(
      [['maun', null, 't-maun', 't-materiales']],
    );
  });

  it('un id que no está entre los tesoros no tiene clave, salvo que sea una clave', () => {
    const [linea] = lineasDelLibro(
      datos({
        movimientos: [
          movimiento({
            tipo: 'transferencia',
            tesoroOrigen: null,
            tesoroDestino: null,
            desdeId: 'hogar',
            haciaId: 'otro',
          }),
        ],
      }),
    );

    expect(linea).toMatchObject({ desde: 'hogar', hacia: null, desdeId: 'hogar', haciaId: 'otro' });
  });

  it('entre dos tesoros del dueño: dos asientos por id, sin clave, que las cuatro claves no ven', () => {
    const asientos = asientosDelLibro(
      datos({
        tesoros: TESOROS_DEL_TALLER,
        movimientos: [
          movimiento({
            tipo: 'transferencia',
            tesoroOrigen: null,
            tesoroDestino: null,
            desdeId: 't-fijos',
            haciaId: 't-materiales',
            monto: $(40_000),
          }),
        ],
      }),
    );

    expect(
      asientos.map((asiento) => [
        asiento.tesoro,
        asiento.tesoroId,
        asiento.contrapartidaId,
        asiento.monto,
      ]),
    ).toEqual([
      [null, 't-materiales', 't-fijos', 40_000],
      [null, 't-fijos', 't-materiales', -40_000],
    ]);
    expect(saldosPorTesoro(asientos)).toEqual({ hogar: 0, maun: 0, diezmo: 0, cocos: 0 });
    expect(saldosPorId(asientos)).toEqual(
      new Map([
        ['t-materiales', 40_000],
        ['t-fijos', -40_000],
      ]),
    );
  });

  it('los pagos, los gastos y la distribución de siempre apuntan a los ids de su clave', () => {
    const lineas = lineasDelLibro(
      datos({
        tesoros: TESOROS_DEL_TALLER,
        proyectos: [
          proyecto({
            estado: 'cobrado',
            fechaCobro: '2026-09-10',
            diezmo: $(70_000),
            sueldo: $(500_000),
          }),
        ],
        pagos: [pago({})],
        gastos: [gasto({})],
      }),
    );

    expect(lineas.map((linea) => [linea.origen, linea.desdeId, linea.haciaId])).toEqual([
      ['pago', null, 't-maun'],
      ['gasto_proyecto', 't-maun', null],
      ['distribucion', 't-maun', 't-diezmo'],
      ['distribucion', 't-maun', 't-hogar'],
    ]);
  });

  it('cada reparto de un cobro por la fila pasa de Maun a su tesoro', () => {
    const lineas = lineasDelLibro(
      datos({
        tesoros: TESOROS_DEL_TALLER,
        proyectos: [proyecto({ estado: 'cobrado', fechaCobro: '2026-09-10' })],
        repartos: [
          reparto({ id: 'r1', tesoroId: 't-hogar', clase: 'sueldo', monto: $(1_800_000) }),
          reparto({ id: 'r2', tesoroId: 't-fijos', clase: 'fijos', monto: $(900_000) }),
          reparto({ id: 'r3', tesoroId: 't-cocos', clase: null, monto: $(123_456) }),
        ],
      }),
    );

    expect(
      lineas.map((linea) => [
        linea.origen,
        linea.asientoId,
        linea.desde,
        linea.hacia,
        linea.haciaId,
        linea.concepto,
        linea.monto,
      ]),
    ).toEqual([
      ['reparto', 'r1', 'maun', 'hogar', 't-hogar', 'sueldo', 1_800_000],
      ['reparto', 'r2', 'maun', null, 't-fijos', 'fijos', 900_000],
      ['reparto', 'r3', 'maun', 'cocos', 't-cocos', 'reparto', 123_456],
    ]);
    expect(lineas[0]).toMatchObject({
      fecha: '2026-09-10',
      categoria: 'Distribución',
      descripcion: 'Placard',
      proyectoId: 'p1',
    });
  });

  it('lo que queda en Maun, un reparto en cero y el de un proyecto sin liquidar no mueven nada', () => {
    const lineas = lineasDelLibro(
      datos({
        tesoros: TESOROS_DEL_TALLER,
        proyectos: [
          proyecto({ id: 'p1', estado: 'cobrado', fechaCobro: '2026-09-10' }),
          proyecto({ id: 'p2', estado: 'entregado' }),
        ],
        repartos: [
          reparto({ id: 'r1', tesoroId: 't-maun', clase: 'fijos' }),
          reparto({ id: 'r2', tesoroId: 't-fijos', monto: $(0) }),
          reparto({ id: 'r3', proyectoId: 'p2' }),
          reparto({ id: 'r4', proyectoId: 'no-esta' }),
        ],
      }),
    );

    expect(lineas).toEqual([]);
  });

  it('un reparto ya en la apertura queda en el libro y no mueve los tesoros', () => {
    const conRepartos = datos({
      tesoros: TESOROS_DEL_TALLER,
      proyectos: [proyecto({ estado: 'cobrado', fechaCobro: '2026-09-10' })],
      repartos: [
        reparto({ id: 'r1', monto: $(900_000) }),
        reparto({ id: 'r2', tesoroId: 't-materiales', monto: $(50_000), yaEnLaApertura: true }),
      ],
    });

    expect(saldosDelLibroPorId(conRepartos)).toEqual(
      new Map([
        ['t-fijos', 900_000],
        ['t-maun', -900_000],
      ]),
    );
    expect(saldosDelLibro(conRepartos)).toEqual({ hogar: 0, maun: -900_000, diezmo: 0, cocos: 0 });
  });

  it('lo que entró y lo que salió de un tesoro también se cuenta por id', () => {
    const asientos = asientosDelLibro(
      datos({
        tesoros: TESOROS_DEL_TALLER,
        movimientos: [
          movimiento({
            id: 'm1',
            tesoroDestino: null,
            haciaId: 't-materiales',
            monto: $(300_000),
          }),
          movimiento({
            id: 'm2',
            tipo: 'gasto',
            tesoroDestino: null,
            desdeId: 't-materiales',
            monto: $(120_000),
          }),
        ],
      }),
    );

    expect(entradasYSalidasPorId(asientos, 't-materiales')).toEqual({
      entro: 300_000,
      salio: 120_000,
    });
    expect(entradasYSalidasPorId(asientos, 't-cocos')).toEqual({ entro: 0, salio: 0 });
  });
});

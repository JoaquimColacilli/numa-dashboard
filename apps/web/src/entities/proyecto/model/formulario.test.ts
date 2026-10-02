import { describe, expect, it } from 'vitest';

import type { FilaDe } from '@/shared/api';

import { datosActualesDelProyecto } from './liquidacion';
import {
  cambiaLaFila,
  datosDelFormulario,
  esquemaDeProyecto,
  pagoVacio,
  pedidoDeGuardado,
  totalesDeLosPagos,
  valoresDelFormulario,
  versionDelGuardado,
} from './formulario';

describe('valoresDelFormulario', () => {
  it('un proyecto nuevo que llega desde la agenda trae la entrega estimada de ese día, y si no, arranca vacío', () => {
    expect(
      valoresDelFormulario(undefined, [], [], [], { hoy: '2026-09-14', entrega: '2026-10-01' })
        .entrega_estimada,
    ).toBe('2026-10-01');
    expect(
      valoresDelFormulario(undefined, [], [], [], { hoy: '2026-09-14' }).entrega_estimada,
    ).toBe('');
  });
});

describe('la visita hecha en el formulario grande', () => {
  const HOY = '2026-09-14';

  it('se conserva al guardar, aunque el formulario no la muestre', () => {
    const valores = valoresDelFormulario(proyecto({ visita_hecha: true }), [], [], [], {
      hoy: HOY,
    });
    expect(valores.visita_hecha).toBe(true);
    expect(datosDelFormulario(valores, HOY).visita_hecha).toBe(true);
    expect(valoresDelFormulario(undefined, [], [], [], { hoy: HOY }).visita_hecha).toBe(false);
  });

  it('se apaga si la visita se mueve a un día que todavía no llegó o se borra', () => {
    const valores = valoresDelFormulario(proyecto({ visita_hecha: true }), [], [], [], {
      hoy: HOY,
    });
    expect(datosDelFormulario({ ...valores, fecha_visita: '2026-09-20' }, HOY).visita_hecha).toBe(
      false,
    );
    expect(datosDelFormulario({ ...valores, fecha_visita: '' }, HOY).visita_hecha).toBe(false);
  });

  it('una fila guardada en el dispositivo antes de la columna arranca sin la visita hecha', () => {
    const vieja = proyecto();
    delete (vieja as Partial<FilaDe<'proyectos'>>).visita_hecha;
    expect(valoresDelFormulario(vieja, [], [], [], { hoy: HOY }).visita_hecha).toBe(false);
  });
});

describe('hasta cuándo vale el presupuesto, en el formulario grande', () => {
  const HOY = '2026-09-24';

  it('no se muestra, pero guardar la conserva', () => {
    const valores = valoresDelFormulario(
      proyecto({ estado: 'presupuesto_enviado', presupuesto_vale_hasta: '2026-10-09' }),
      [],
      [],
      [],
      { hoy: HOY },
    );
    expect(datosDelFormulario(valores, HOY).presupuesto_vale_hasta).toBe('2026-10-09');
  });

  it('un trabajo nuevo y una fila de antes de la columna arrancan sin fecha', () => {
    expect(
      datosDelFormulario(valoresDelFormulario(undefined, [], [], [], { hoy: HOY }), HOY)
        .presupuesto_vale_hasta,
    ).toBeNull();
    const vieja = proyecto();
    delete (vieja as Partial<FilaDe<'proyectos'>>).presupuesto_vale_hasta;
    expect(valoresDelFormulario(vieja, [], [], [], { hoy: HOY }).presupuesto_vale_hasta).toBe('');
  });
});

describe('el tipo de proyecto en el formulario grande', () => {
  const HOY = '2026-09-25';

  it('va y vuelve sin blancos en las puntas, y vacío se guarda como sin tipo', () => {
    const valores = valoresDelFormulario(proyecto({ tipo_de_proyecto: 'Placard' }), [], [], [], {
      hoy: HOY,
    });
    expect(valores.tipo_de_proyecto).toBe('Placard');
    expect(datosDelFormulario({ ...valores, tipo_de_proyecto: '  Cocina ' }, HOY)).toMatchObject({
      tipo_de_proyecto: 'Cocina',
    });
    expect(datosDelFormulario({ ...valores, tipo_de_proyecto: '   ' }, HOY).tipo_de_proyecto).toBe(
      null,
    );
  });

  it('un trabajo nuevo y una fila de antes de la columna arrancan sin tipo', () => {
    expect(valoresDelFormulario(undefined, [], [], [], { hoy: HOY }).tipo_de_proyecto).toBe('');
    const vieja = proyecto();
    delete (vieja as Partial<FilaDe<'proyectos'>>).tipo_de_proyecto;
    expect(valoresDelFormulario(vieja, [], [], [], { hoy: HOY }).tipo_de_proyecto).toBe('');
  });

  it('listo y la comprometida no pasan por el formulario', () => {
    const datos = datosDelFormulario(
      valoresDelFormulario(
        proyecto({
          estado: 'en_curso',
          listo_el: '2026-09-24',
          entrega_comprometida: '2026-10-08',
        }),
        [],
        [],
        [],
        { hoy: HOY },
      ),
      HOY,
    );
    expect(Object.keys(datos)).not.toContain('listo_el');
    expect(Object.keys(datos)).not.toContain('entrega_comprometida');
  });
});

describe('la moneda del trabajo en el formulario grande', () => {
  const HOY = '2026-10-01';

  it('va y vuelve por el formulario, y un trabajo nuevo arranca en pesos', () => {
    const valores = valoresDelFormulario(proyecto({ moneda: 'USD' }), [], [], [], { hoy: HOY });
    expect(valores.moneda).toBe('USD');
    expect(datosDelFormulario(valores, HOY).moneda).toBe('USD');
    expect(valoresDelFormulario(undefined, [], [], [], { hoy: HOY }).moneda).toBe('ARS');
  });

  it('una fila guardada en el dispositivo antes de la columna se lee en pesos', () => {
    const vieja = proyecto();
    delete (vieja as Partial<FilaDe<'proyectos'>>).moneda;
    expect(valoresDelFormulario(vieja, [], [], [], { hoy: HOY }).moneda).toBe('ARS');
  });

  it('guardar manda la moneda que tiene, para que la base no la confunda con un pedido viejo', () => {
    expect(datosActualesDelProyecto(proyecto({ moneda: 'USD' })).moneda).toBe('USD');
  });
});

describe('los pagos en dos monedas en el formulario grande', () => {
  const HOY = '2026-10-01';

  function pago(extra: Partial<FilaDe<'pagos'>> = {}): FilaDe<'pagos'> {
    return {
      id: 'g',
      household_id: 'h',
      proyecto_id: 'p',
      fecha: '2026-09-30',
      concepto: 'Seña',
      monto_centavos: 100_000,
      ya_en_la_apertura: false,
      moneda: 'USD',
      cotizacion_centavos: 154_000,
      tesoro_id: 'usd',
      created_at: '',
      updated_at: '',
      deleted_at: null,
      version: 1,
      ...extra,
    };
  }

  it('cada pago trae su moneda, su dólar y su tesoro, y uno de antes de las columnas se lee en pesos', () => {
    const [enDolares] = valoresDelFormulario(proyecto(), [pago()], [], [], { hoy: HOY }).pagos;
    expect(enDolares).toMatchObject({ moneda: 'USD', cotizacion: 154_000, tesoroId: 'usd' });
    const viejo: Partial<FilaDe<'pagos'>> = pago();
    delete viejo.moneda;
    delete viejo.cotizacion_centavos;
    delete viejo.tesoro_id;
    const [deAntes] = valoresDelFormulario(proyecto(), [viejo as FilaDe<'pagos'>], [], [], {
      hoy: HOY,
    }).pagos;
    expect(deAntes).toMatchObject({ moneda: 'ARS', cotizacion: null, tesoroId: null });
  });

  it('guardar manda las tres claves, y un pago en pesos nunca va con tesoro', () => {
    const valores = valoresDelFormulario(proyecto({ moneda: 'USD' }), [pago()], [], [], {
      hoy: HOY,
    });
    const enPesos = { ...pagoVacio('n', HOY, 'ARS', 150_000), monto: 30_000_000, tesoroId: 'x' };
    const pedido = pedidoDeGuardado(
      'p',
      1,
      { ...valores, pagos: [...valores.pagos, enPesos] },
      {
        pagos: ['g'],
        gastos: [],
        opciones: [],
      },
    );
    expect(pedido.pagos).toEqual([
      expect.objectContaining({
        id: 'g',
        moneda: 'USD',
        cotizacion_centavos: 154_000,
        tesoro_id: 'usd',
      }),
      expect.objectContaining({
        id: 'n',
        moneda: 'ARS',
        cotizacion_centavos: 150_000,
        tesoro_id: null,
      }),
    ]);
  });

  it('pide el dólar de un pago en pesos de un trabajo en dólares, y el tesoro de un pago en dólares', () => {
    const base = valoresDelFormulario(
      proyecto({ moneda: 'USD', titulo: 'Vestidor', cliente_id: 'c' }),
      [],
      [],
      [],
      { hoy: HOY },
    );
    const sinDolar = { ...pagoVacio('a', HOY, 'ARS'), monto: 12_000_000 };
    const sinTesoro = { ...pagoVacio('b', HOY, 'USD', 154_000), monto: 50_000 };
    const resultado = esquemaDeProyecto.safeParse({ ...base, pagos: [sinDolar, sinTesoro] });
    expect(resultado.success).toBe(false);
    const caminos = resultado.error?.issues.map((issue) => issue.path.join('.'));
    expect(caminos).toEqual(expect.arrayContaining(['pagos.0.cotizacion', 'pagos.1.tesoroId']));

    const completos = [
      { ...sinDolar, cotizacion: 145_000 },
      { ...sinTesoro, tesoroId: 'usd' },
    ];
    expect(esquemaDeProyecto.safeParse({ ...base, pagos: completos }).success).toBe(true);
    expect(esquemaDeProyecto.safeParse({ ...base, moneda: 'ARS', pagos: [sinDolar] }).success).toBe(
      true,
    );
  });

  it('los totales van en la moneda del trabajo y en pesos, sin sumar una moneda con la otra', () => {
    const filas = [
      { moneda: 'ARS' as const, monto: 12_000_000, cotizacion: 145_000 },
      { moneda: 'USD' as const, monto: 50_000, cotizacion: 150_000 },
      { moneda: 'USD' as const, monto: null, cotizacion: null },
    ];
    expect(totalesDeLosPagos(filas, 'USD')).toEqual({ enSuMoneda: 58_276, enPesos: 87_000_000 });
    expect(totalesDeLosPagos(filas, 'ARS')).toEqual({
      enSuMoneda: 87_000_000,
      enPesos: 87_000_000,
    });
  });
});

function proyecto(extra: Partial<FilaDe<'proyectos'>> = {}): FilaDe<'proyectos'> {
  return {
    household_id: 'h',
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-01T12:00:00Z',
    deleted_at: null,
    version: 4,
    id: 'p',
    cliente_id: 'c',
    titulo: 'Placard',
    descripcion: '',
    estado: 'a_presupuestar',
    presupuesto_centavos: null,
    sena_bp: null,
    forma_pago: null,
    cobro_sena: null,
    cobro_saldo: null,
    moneda: 'ARS',
    cobra_en: null,
    costos_cotizacion_centavos: null,
    comprobante: 'sin_comprobante',
    fecha_visita: '2026-09-10',
    visita_hora: null,
    ultimo_contacto: null,
    fecha_inicio: null,
    entrega_estimada: null,
    entrega_hora: null,
    fecha_entrega: null,
    direccion_entrega: '',
    notas: '',
    vencimiento_presupuesto: null,
    costo_madera_centavos: null,
    costo_herrajes_centavos: null,
    costo_flete_centavos: null,
    costo_ayudante_centavos: null,
    fecha_cobro: null,
    dist_cobrado_centavos: null,
    dist_gastos_centavos: null,
    dist_diezmo_bp: null,
    dist_tope_sueldo_centavos: null,
    dist_tope_fijos_centavos: null,
    dist_diezmo_centavos: null,
    dist_sueldo_centavos: null,
    dist_fijos_centavos: null,
    dist_remanente_centavos: null,
    dist_objetivo_sueldo_centavos: null,
    dist_objetivo_fijos_centavos: null,
    dist_sueldo_mensual: null,
    dist_sueldo_previo_centavos: null,
    dist_fijos_previo_centavos: null,
    dist_liquidado_at: null,
    reapertura_objetivo_sueldo_centavos: null,
    reapertura_objetivo_fijos_centavos: null,
    reapertura_sueldo_mensual: null,
    reapertura_fecha_cobro: null,
    reapertura_fila: null,
    dist_fila_version: null,
    dist_fila: null,
    dist_previo: null,
    reparto_ya_en_la_apertura: false,
    presupuesto_vale_hasta: null,
    listo_el: null,
    entrega_comprometida: null,
    entrega_comprometida_franja: null,
    tipo_de_proyecto: null,
    presupuesto_diseno: false,
    presupuesto_despiece: false,
    presupuesto_cotizacion: false,
    presupuesto_pdf: false,
    visita_hecha: false,
    visita_importante: false,
    entrega_importante: false,
    presupuesto_importante: false,
    ...extra,
  };
}

describe('versionDelGuardado', () => {
  it('un alta arranca en la versión que le pone la base', () => {
    expect(versionDelGuardado(null, datosActualesDelProyecto(proyecto()))).toBe(1);
  });

  it('guardar la fila igual no sube la versión, porque la base tampoco la sube', () => {
    const fila = proyecto();
    expect(versionDelGuardado(fila, datosActualesDelProyecto(fila))).toBe(4);
  });

  it('cambiar una columna la sube en uno, igual que el trigger', () => {
    const fila = proyecto();
    expect(
      versionDelGuardado(fila, {
        ...datosActualesDelProyecto(fila),
        estado: 'presupuesto_enviado',
      }),
    ).toBe(5);
  });

  it('una edición parcial solo mira las columnas que manda', () => {
    const fila = proyecto({ notas: 'medir la pared' });
    expect(versionDelGuardado(fila, { notas: 'medir la pared' })).toBe(4);
    expect(versionDelGuardado(fila, { notas: 'medir la pared del fondo' })).toBe(5);
    expect(cambiaLaFila(fila, {})).toBe(false);
  });
});

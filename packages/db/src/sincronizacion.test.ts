import { centavos, puntosBasicos, repartir, type Fila } from '@maun/domain';
import { describe, expect, it, vi } from 'vitest';

import type { ClienteMaun } from './cliente.ts';
import { RespuestaInvalidaError } from './replica.ts';
import {
  COLUMNAS_DE_AJUSTES,
  COLUMNAS_DE_CLIENTE,
  COLUMNAS_DE_COSTOS,
  COLUMNAS_DE_FORMAS_DE_COBRO,
  COLUMNAS_DE_LA_ENTREGA,
  COLUMNAS_DE_MOVIMIENTO,
  COLUMNAS_DE_PROYECTO,
  COLUMNAS_DE_TESORO,
  guardarLaFilaDelTaller,
  guardarProyecto,
  liquidarProyecto,
  leerProyectoGuardado,
  pedidoDeLaFila,
  proponerLaEntrega,
  type ProyectoParaGuardar,
} from './sincronizacion.ts';

const DATOS = {
  cliente_id: 'c',
  titulo: 'Placard',
  descripcion: '',
  estado: 'en_seguimiento',
  presupuesto_centavos: 90_000_000,
  moneda: 'ARS',
  sena_bp: null,
  forma_pago: null,
  comprobante: 'sin_comprobante',
  fecha_visita: null,
  visita_hora: null,
  ultimo_contacto: '2026-09-23',
  fecha_inicio: null,
  entrega_estimada: null,
  entrega_hora: null,
  fecha_entrega: null,
  direccion_entrega: '',
  notas: '',
  vencimiento_presupuesto: null,
  visita_hecha: false,
  presupuesto_vale_hasta: null,
  tipo_de_proyecto: null,
} satisfies ProyectoParaGuardar['datos'];

const GUARDADO = {
  proyecto: { id: 'p' },
  pagos: [],
  gastos: [],
  opciones_de_presupuesto: [],
  necesidades: [],
  proximos_contactos: [{ id: 'contacto', fecha: '2026-10-23' }],
};

function clienteFalso(data: unknown) {
  const rpc = vi.fn(() => Promise.resolve({ data, error: null }));
  return { cliente: { rpc } as unknown as ClienteMaun, rpc };
}

describe('el próximo contacto en el agregado del trabajo', () => {
  it('viaja en p_proximos junto con el estado, y sin la clave va en null para no tocarlo', async () => {
    const { cliente, rpc } = clienteFalso(GUARDADO);
    const proximos = [
      {
        id: 'contacto',
        fecha: '2026-10-23',
        nota: 'Después de las vacaciones',
        etapa_previa: 'presupuesto_enviado',
        hecho_el: null,
        resultado: null,
        respuesta: '',
      },
    ] as const;

    await guardarProyecto(cliente, {
      id: 'p',
      version: 3,
      datos: DATOS,
      pagos: [],
      gastos: [],
      proximos,
    });
    expect(rpc).toHaveBeenLastCalledWith(
      'guardar_proyecto',
      expect.objectContaining({ p_proximos: proximos }),
    );

    await guardarProyecto(cliente, { id: 'p', version: 3, datos: DATOS, pagos: [], gastos: [] });
    expect(rpc).toHaveBeenLastCalledWith(
      'guardar_proyecto',
      expect.objectContaining({ p_proximos: null }),
    );
  });

  it('vuelve con las filas del seguimiento, y sin la lista la respuesta no sirve', () => {
    expect(leerProyectoGuardado(GUARDADO).proximos).toEqual([
      { id: 'contacto', fecha: '2026-10-23' },
    ]);
    expect(() => leerProyectoGuardado({ ...GUARDADO, proximos_contactos: undefined })).toThrow(
      RespuestaInvalidaError,
    );
  });
});

describe('hasta cuándo vale el presupuesto', () => {
  it('viaja con los datos del trabajo, que es de donde guardar_proyecto la lee', async () => {
    const { cliente, rpc } = clienteFalso(GUARDADO);

    await guardarProyecto(cliente, {
      id: 'p',
      version: 3,
      datos: { ...DATOS, estado: 'presupuesto_enviado', presupuesto_vale_hasta: '2026-10-09' },
      pagos: [],
      gastos: [],
    });

    expect(rpc).toHaveBeenLastCalledWith(
      'guardar_proyecto',
      expect.objectContaining({
        p_proyecto: expect.objectContaining({ presupuesto_vale_hasta: '2026-10-09' }) as unknown,
      }),
    );
  });
});

describe('la entrega del trabajo', () => {
  it('el tipo de proyecto viaja con los datos, y listo y la comprometida no', async () => {
    const { cliente, rpc } = clienteFalso(GUARDADO);

    await guardarProyecto(cliente, {
      id: 'p',
      version: 3,
      datos: { ...DATOS, tipo_de_proyecto: 'Placard' },
      pagos: [],
      gastos: [],
    });

    const [, argumentos] = rpc.mock.lastCall as unknown as [string, { p_proyecto: object }];
    expect(argumentos.p_proyecto).toMatchObject({ tipo_de_proyecto: 'Placard' });
    expect(Object.keys(argumentos.p_proyecto)).not.toContain('listo_el');
    expect(Object.keys(argumentos.p_proyecto)).not.toContain('entrega_comprometida');
  });

  it('proponer manda el trabajo y la propuesta, o null para solo cerrar la abierta', async () => {
    const { cliente, rpc } = clienteFalso({ propuestas: [{ id: 'nueva' }] });
    const propuesta = { id: 'nueva', forma: 'un_dia', fecha: '2026-10-08', franja: null } as const;

    expect(await proponerLaEntrega(cliente, 'p', propuesta)).toEqual([{ id: 'nueva' }]);
    expect(rpc).toHaveBeenLastCalledWith('proponer_la_entrega', {
      p_proyecto_id: 'p',
      p_propuesta: propuesta,
    });

    await proponerLaEntrega(cliente, 'p', null);
    expect(rpc).toHaveBeenLastCalledWith('proponer_la_entrega', {
      p_proyecto_id: 'p',
      p_propuesta: null,
    });
  });

  it('un rechazo de la base sale como error', async () => {
    const rechazo = { code: 'MN021', details: 'sin_listo', message: 'x' };
    const cliente = {
      rpc: vi.fn(() => Promise.resolve({ data: null, error: rechazo })),
    } as unknown as ClienteMaun;

    await expect(proponerLaEntrega(cliente, 'p', null)).rejects.toBe(rechazo);
  });

  it('solo las tres columnas de la entrega van por su lado', () => {
    expect(COLUMNAS_DE_LA_ENTREGA).toEqual([
      'listo_el',
      'entrega_comprometida',
      'entrega_comprometida_franja',
    ]);
    for (const columna of COLUMNAS_DE_LA_ENTREGA) {
      expect(COLUMNAS_DE_PROYECTO).not.toContain(columna);
    }
  });
});

describe('las monedas y los idiomas en lo que se guarda', () => {
  it('la moneda del trabajo viaja con sus datos; en qué paga y el dólar de los costos van por su lado', async () => {
    const { cliente, rpc } = clienteFalso(GUARDADO);

    await guardarProyecto(cliente, {
      id: 'p',
      version: 3,
      datos: { ...DATOS, moneda: 'USD' },
      pagos: [],
      gastos: [],
    });

    const [, argumentos] = rpc.mock.lastCall as unknown as [string, { p_proyecto: object }];
    expect(argumentos.p_proyecto).toMatchObject({ moneda: 'USD' });
    expect(COLUMNAS_DE_PROYECTO).not.toContain('cobra_en');
    expect(COLUMNAS_DE_PROYECTO).not.toContain('costos_cotizacion_centavos');
    expect(COLUMNAS_DE_FORMAS_DE_COBRO).toContain('cobra_en');
    expect(COLUMNAS_DE_COSTOS).toContain('costos_cotizacion_centavos');
  });

  it('cada pago lleva su moneda, su dólar y el tesoro al que entra', async () => {
    const { cliente, rpc } = clienteFalso(GUARDADO);
    const pagos = [
      {
        id: 'en-dolares',
        fecha: '2026-09-30',
        monto_centavos: 50_000,
        concepto: 'Seña',
        moneda: 'USD',
        cotizacion_centavos: 145_000,
        tesoro_id: 'dolares',
      },
      {
        id: 'en-pesos',
        fecha: '2026-09-30',
        monto_centavos: 7_250_000,
        concepto: 'Seña',
        moneda: 'ARS',
        cotizacion_centavos: 145_000,
        tesoro_id: null,
      },
    ] as const;

    await guardarProyecto(cliente, { id: 'p', version: 3, datos: DATOS, pagos, gastos: [] });

    expect(rpc).toHaveBeenLastCalledWith(
      'guardar_proyecto',
      expect.objectContaining({ p_pagos: pagos }),
    );
  });

  it('un tesoro elige su moneda al nacer y un cambio nunca la manda', () => {
    expect(COLUMNAS_DE_TESORO).not.toContain('moneda');
  });

  it('un movimiento lleva su segundo importe, el de una compra o una venta', () => {
    expect(COLUMNAS_DE_MOVIMIENTO).toContain('monto_destino_centavos');
  });

  it('los ajustes guardan el idioma de los clientes, el dólar del día y la cuenta en dólares', () => {
    for (const columna of [
      'idioma_de_los_clientes',
      'dolar_del_dia_centavos',
      'dolar_del_dia_el',
      'cobro_dolares_cbu',
      'cobro_dolares_alias',
    ]) {
      expect(COLUMNAS_DE_AJUSTES).toContain(columna);
    }
  });

  it('los ajustes guardan los cuatro datos de la facturación que son del dueño, y nunca la conexión con ARCA', () => {
    for (const columna of [
      'facturacion_concepto',
      'facturacion_categoria',
      'facturacion_ingresos_brutos',
      'facturacion_inicio_de_actividades',
    ]) {
      expect(COLUMNAS_DE_AJUSTES).toContain(columna);
    }
    for (const columna of [
      'facturacion_ambiente',
      'facturacion_cuit',
      'facturacion_punto_de_venta',
      'facturacion_desde',
      'facturacion_alertas',
    ]) {
      expect(COLUMNAS_DE_AJUSTES).not.toContain(columna);
    }
  });

  it('el cliente guarda su DNI', () => {
    expect(COLUMNAS_DE_CLIENTE).toContain('dni');
  });
});

describe('el cobro por la fila', () => {
  const PEDIDO = {
    proyectoId: 'p',
    version: 4,
    destino: 'cobrado',
    fecha: '2026-09-27',
    cobradoCentavos: 1000,
    gastosCentavos: 0,
    topeSueldoCentavos: 0,
    topeFijosCentavos: 0,
    diezmoBp: 1000,
    diezmoCentavos: 100,
    sueldoCentavos: 0,
    fijosCentavos: 0,
    remanenteCentavos: 900,
    sueldoPrevioCentavos: 0,
    fijosPrevioCentavos: 0,
  } as const;

  it('sin la fila, el pedido de siempre no manda los parámetros nuevos', async () => {
    const { cliente, rpc } = clienteFalso({ id: 'p' });
    await liquidarProyecto(cliente, PEDIDO);
    const [nombre, argumentos] = rpc.mock.lastCall as unknown as [string, object];
    expect(nombre).toBe('cobrar_proyecto');
    expect(Object.keys(argumentos)).not.toContain('p_fila_version');
  });

  it('con la fila viajan la revisión, los repartos y lo del mes', async () => {
    const { cliente, rpc } = clienteFalso({ id: 'p' });
    const porLaFila = {
      version: 3,
      repartos: [{ id: 'r', posicion: 1, tesoro_id: 'uno', monto_centavos: 900 }],
      previo: { uno: 0 },
    };
    await liquidarProyecto(cliente, { ...PEDIDO, destino: 'perdido', porLaFila });
    expect(rpc).toHaveBeenLastCalledWith(
      'cerrar_perdido',
      expect.objectContaining({
        p_diezmo_bp: 1000,
        p_fila_version: 3,
        p_repartos: porLaFila.repartos,
        p_previo: porLaFila.previo,
      }),
    );
  });

  it('guardar la fila manda la revisión que se vio, o null para volver a la de siempre', async () => {
    const { cliente, rpc } = clienteFalso({ id: 'a1', fila_version: 5 });
    const fila: Fila = {
      obligaciones: [{ tesoro: 'diezmo', porcentaje: puntosBasicos(1000), base: 'ingreso' }],
      pasos: [],
      reparto: [],
      superavit: 'maun',
      sueldoPorTrabajo: false,
    };

    expect(await guardarLaFilaDelTaller(cliente, 4, fila)).toEqual({ id: 'a1', fila_version: 5 });
    expect(rpc).toHaveBeenLastCalledWith('guardar_la_fila', { p_version: 4, p_fila: fila });

    await guardarLaFilaDelTaller(cliente, 5, null);
    expect(rpc).toHaveBeenLastCalledWith('guardar_la_fila', { p_version: 5, p_fila: null });
  });

  it('un rechazo al guardar la fila sale como error', async () => {
    const rechazo = { code: 'MN023', message: 'La fila no se pudo guardar.' };
    const cliente = {
      rpc: vi.fn(() => Promise.resolve({ data: null, error: rechazo })),
    } as unknown as ClienteMaun;

    await expect(guardarLaFilaDelTaller(cliente, 1, null)).rejects.toBe(rechazo);
  });

  it('el pedido lleva los repartos en el orden del cobro, sin el diezmo, y lo que vio cada paso y cada meta', () => {
    const reparto = repartir({
      obligaciones: [
        { tesoro: 'brutos', porcentaje: puntosBasicos(350), base: 'cobrado', diezmo: false },
        { tesoro: 'diezmo', porcentaje: puntosBasicos(1000), base: 'ingreso', diezmo: true },
      ],
      pasos: [
        {
          tesoro: 'fijos',
          clase: 'fijos',
          objetivo: centavos(90_000_000),
          porMes: true,
          modo: 'saldo',
          hastaLaMeta: false,
        },
      ],
      reparto: [
        { tesoro: 'stock', porcentaje: puntosBasicos(2000), hastaLaMeta: true },
        { tesoro: 'maquinas', porcentaje: puntosBasicos(1000), hastaLaMeta: false },
      ],
      superavit: 'superavit',
      cobrado: centavos(250_000_000),
      gastos: centavos(50_000_000),
      previo: new Map([['fijos', centavos(63_000_000)]]),
      topes: new Map([['stock', centavos(5_000_000)]]),
    });

    expect(pedidoDeLaFila(reparto, 9, ['a', 'b', 'c', 'd', 'e'])).toEqual({
      version: 9,
      repartos: [
        { id: 'a', posicion: 1, tesoro_id: 'brutos', monto_centavos: 8_750_000 },
        { id: 'b', posicion: 2, tesoro_id: 'fijos', monto_centavos: 27_000_000 },
        { id: 'c', posicion: 3, tesoro_id: 'stock', monto_centavos: 5_000_000 },
        { id: 'd', posicion: 4, tesoro_id: 'maquinas', monto_centavos: 14_512_500 },
        { id: 'e', posicion: 5, tesoro_id: 'superavit', monto_centavos: 125_612_500 },
      ],
      previo: { fijos: 63_000_000, stock: 5_000_000 },
    });
    expect(() => pedidoDeLaFila(reparto, 9, ['a'])).toThrow(RangeError);
  });

  it('un tesoro no manda su clave: esa es del sistema', () => {
    expect(COLUMNAS_DE_TESORO).not.toContain('clave');
    expect(COLUMNAS_DE_TESORO).not.toContain('household_id');
  });
});

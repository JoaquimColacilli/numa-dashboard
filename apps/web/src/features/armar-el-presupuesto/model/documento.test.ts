import {
  borradorNuevo,
  centavos,
  CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE,
  cotizacion,
  PLANTILLA_DE_SIEMPRE,
  problemaDelDocumento,
} from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { FilaDelPresupuesto } from '@/entities/presupuesto';
import type { Proyecto } from '@/entities/proyecto';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import {
  abonadoDeHoy,
  borradorGuardado,
  datosDelTaller,
  documentoDeHoy,
  dolarDeHoy,
  entradaDeHoy,
  opcionesDeHoy,
  precioDeHoy,
  senaDeHoy,
} from './documento';
import { comoLoVeElCliente } from './vistaPrevia';

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

const PROYECTO = {
  ...METADATOS,
  id: 'p',
  cliente_id: 'c',
  titulo: 'Vanitory',
  estado: 'a_presupuestar',
  version: 2,
  presupuesto_centavos: 800_000,
  direccion_entrega: 'Calle Falsa 123',
  sena_bp: null,
} as unknown as Proyecto;

function replica(tablas: Partial<Record<TablaReplicada, Record<string, unknown>>> = {}): Replica {
  const todas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) todas[tabla] = tablas[tabla] ?? {};
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas: todas } as unknown as Replica;
}

describe('el documento de hoy, con lo que hay en el dispositivo', () => {
  it('los datos del taller salen de los ajustes, y el nombre del hogar o el de siempre', () => {
    expect(datosDelTaller(replica())).toEqual({
      nombre: 'Taller MAUN',
      titular: '',
      cuit: '',
      condicionFiscal: null,
      domicilio: '',
      telefono: '',
      email: '',
    });
    const conAjustes = replica({
      households: { h: { id: 'h', nombre: '  Taller de prueba ', deleted_at: null, version: 1 } },
      ajustes: {
        a: {
          ...METADATOS,
          id: 'a',
          taller_titular: 'Ana Pérez',
          taller_cuit: '20-12345678-9',
          taller_condicion_fiscal: 'monotributo',
          taller_domicilio: 'Av. Siempreviva 742',
          taller_telefono: '11 5555-0000',
          taller_email: 'taller@ejemplo.com',
          sena_bp: 4000,
        },
      },
    });
    expect(datosDelTaller(conAjustes)).toEqual({
      nombre: 'Taller de prueba',
      titular: 'Ana Pérez',
      cuit: '20-12345678-9',
      condicionFiscal: 'monotributo',
      domicilio: 'Av. Siempreviva 742',
      telefono: '11 5555-0000',
      email: 'taller@ejemplo.com',
    });
    expect(senaDeHoy(conAjustes, PROYECTO)).toBe(4000);
    expect(senaDeHoy(conAjustes, { ...PROYECTO, sena_bp: 3000 })).toBe(3000);
  });

  it('lo pagado y las opciones son las de ese trabajo', () => {
    const conPagos = replica({
      pagos: {
        g1: {
          ...METADATOS,
          id: 'g1',
          proyecto_id: 'p',
          fecha: '2026-09-10',
          concepto: 'Visita',
          monto_centavos: 40_000,
        },
        g2: {
          ...METADATOS,
          id: 'g2',
          proyecto_id: 'otro',
          fecha: '2026-09-10',
          concepto: 'Otro',
          monto_centavos: 1,
        },
        g3: {
          ...METADATOS,
          id: 'g3',
          proyecto_id: 'p',
          fecha: '2026-09-11',
          concepto: 'Seña',
          monto_centavos: 5,
        },
      },
      opciones_de_presupuesto: {
        o2: {
          ...METADATOS,
          id: 'o2',
          proyecto_id: 'p',
          descripcion: 'Laqueado',
          monto_centavos: 900_000,
          aprobada: false,
        },
        o1: {
          ...METADATOS,
          id: 'o1',
          proyecto_id: 'p',
          descripcion: 'Melamina',
          monto_centavos: 700_000,
          aprobada: false,
        },
      },
    });
    expect(abonadoDeHoy(conPagos, 'p')).toBe(40_005);
    expect(opcionesDeHoy(conPagos, 'p')).toEqual([
      { id: 'o1', descripcion: 'Melamina', monto: 700_000 },
      { id: 'o2', descripcion: 'Laqueado', monto: 900_000 },
    ]);
  });

  it('sin borrador guardado, o con uno que no se puede leer, empieza uno nuevo con el título y la obra del trabajo', () => {
    const nuevo = borradorGuardado(replica(), PROYECTO, null);
    expect(nuevo.titulo).toBe('Vanitory');
    expect(nuevo.obra).toBe('Calle Falsa 123');
    expect(nuevo.validezDias).toBe(15);

    const roto = { contenido: { forma: 99 } } as unknown as FilaDelPresupuesto;
    expect(borradorGuardado(replica(), PROYECTO, roto).titulo).toBe('Vanitory');
  });
});

describe('cómo lo ve tu cliente, mientras lo armás', () => {
  const borrador = {
    ...borradorNuevo({
      titulo: 'Vanitory',
      obra: '',
      plantilla: PLANTILLA_DE_SIEMPRE,
      validezDias: 10,
      idNuevo: () => 'm1',
    }),
    muebles: [{ id: 'm1', nombre: 'Vanitory', descripcion: 'Dos cajones.' }],
  };

  it('es la página del cliente con lo de hoy: sin número todavía, vale desde hoy y pide la seña', () => {
    const documento = documentoDeHoy({ replica: replica(), proyecto: PROYECTO, borrador });
    const vista = comoLoVeElCliente(documento, null, 1, '2026-09-22', centavos(0), 'es');
    expect(vista).toMatchObject({
      etapa: 'mandado',
      numero: '',
      idioma: 'es',
      mandadoEl: '2026-09-22',
      valeHasta: '2026-10-02',
      vencio: null,
      queCambio: null,
      pideLaSena: true,
    });
    expect(vista.cuentas).toHaveLength(1);
  });

  it('con número, el de la revisión que se va a mandar; con opciones o la seña cubierta, no pide la seña', () => {
    const documento = documentoDeHoy({ replica: replica(), proyecto: PROYECTO, borrador });
    const segunda = comoLoVeElCliente(
      documento,
      '20260915-01',
      2,
      '2026-09-22',
      centavos(800_000),
      'es',
    );
    expect(segunda).toMatchObject({ numero: '20260915-01', revision: 2 });
    expect(segunda.pideLaSena).toBe(false);

    const conOpciones = documentoDeHoy({
      replica: replica(),
      proyecto: PROYECTO,
      borrador,
      total: null,
      opciones: [
        { id: 'o1', descripcion: 'Melamina', monto: centavos(700_000) },
        { id: 'o2', descripcion: 'Laqueado', monto: centavos(900_000) },
      ],
    });
    const vista = comoLoVeElCliente(conOpciones, null, 1, '2026-09-22', centavos(0), 'es');
    expect(vista.cuentas).toHaveLength(2);
    expect(vista.pideLaSena).toBe(false);
    expect(
      comoLoVeElCliente(
        { ...conOpciones, validezDias: null },
        null,
        1,
        '2026-09-22',
        centavos(0),
        'es',
      ).valeHasta,
    ).toBeNull();
  });
});

describe('el documento de un trabajo en dólares', () => {
  const EN_DOLARES = {
    ...PROYECTO,
    moneda: 'USD',
    cobra_en: null,
    presupuesto_centavos: 240_000,
  } as unknown as Proyecto;

  const borrador = {
    ...borradorNuevo({
      titulo: 'Vanitory',
      obra: '',
      plantilla: PLANTILLA_DE_SIEMPRE,
      validezDias: 15,
      idNuevo: () => 'm1',
    }),
    muebles: [{ id: 'm1', nombre: 'Vanitory', descripcion: 'Dos cajones.' }],
  };

  function taller(
    proyecto: Proyecto,
    dolar: { valor: number; el: string } | null = { valor: 154_000, el: '2026-10-01' },
  ): Replica {
    return replica({
      ajustes: {
        a: {
          ...METADATOS,
          id: 'a',
          dolar_del_dia_centavos: dolar?.valor ?? null,
          dolar_del_dia_el: dolar?.el ?? null,
        },
      },
      proyectos: { p: proyecto },
      pagos: {
        visita: {
          ...METADATOS,
          id: 'visita',
          proyecto_id: 'p',
          fecha: '2026-09-10',
          concepto: 'Visita',
          monto_centavos: 12_000_000,
          moneda: 'ARS',
          cotizacion_centavos: 145_000,
          tesoro_id: null,
        },
        sena: {
          ...METADATOS,
          id: 'sena',
          proyecto_id: 'p',
          fecha: '2026-09-20',
          concepto: 'Seña',
          monto_centavos: 50_000,
          moneda: 'USD',
          cotizacion_centavos: 154_000,
          tesoro_id: 't',
        },
      },
    });
  }

  it('es un documento en dólares, con la referencia del dólar del día y la cláusula de su combinación', () => {
    const documento = documentoDeHoy({
      replica: taller(EN_DOLARES),
      proyecto: EN_DOLARES,
      borrador,
    });
    expect(documento).toMatchObject({
      forma: 2,
      moneda: 'USD',
      valores: { tipo: 'total', total: 240_000 },
      referencia: { cotizacion: 154_000, fecha: '2026-10-01' },
      cobraEn: ['ARS'],
      clausulaDeLaMoneda: CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE.dolaresEnPesos,
      monedaDeLoAbonado: 'USD',
      abonado: 8_276 + 50_000,
    });
    expect(documento.avisos.map(({ texto }) => texto.replace(/\s/g, ' '))).toContainEqual(
      expect.stringContaining('(US$ 582,76)'),
    );
    expect(problemaDelDocumento(documento)).toBeNull();
  });

  it('lo abonado en pesos es lo que pagó por su valor en pesos, y lo que descuenta queda en dólares', () => {
    const replica = taller(EN_DOLARES);
    expect(abonadoDeHoy(replica, 'p')).toBe(58_276);
    expect(abonadoDeHoy(replica, 'p', 'ARS')).toBe(12_000_000 + 77_000_000);

    const documento = documentoDeHoy({
      replica,
      proyecto: EN_DOLARES,
      borrador: { ...borrador, monedaDeLoAbonado: 'ARS' },
    });
    expect(documento).toMatchObject({ monedaDeLoAbonado: 'ARS', abonado: 89_000_000 });
    expect(documento.avisos.map(({ texto }) => texto.replace(/\s/g, ' '))).toContainEqual(
      expect.stringContaining('($ 890.000)'),
    );
  });

  it('sin dólar del día va sin referencia; con otra referencia, esa', () => {
    const sinDolar = taller(EN_DOLARES, null);
    expect(documentoDeHoy({ replica: sinDolar, proyecto: EN_DOLARES, borrador })).toMatchObject({
      forma: 2,
      referencia: null,
    });
    const conLaDeHoy = entradaDeHoy({
      replica: sinDolar,
      proyecto: EN_DOLARES,
      borrador,
      referencia: { cotizacion: cotizacion(160_000), fecha: '2026-10-02' },
    });
    expect(conLaDeHoy).toMatchObject({
      moneda: 'USD',
      referencia: { cotizacion: 160_000, fecha: '2026-10-02' },
    });
  });

  it('el dólar de hoy es el del día solo si es de hoy', () => {
    const replica = taller(EN_DOLARES);
    expect(dolarDeHoy(replica, '2026-10-01')).toBe(154_000);
    expect(dolarDeHoy(replica, '2026-10-02')).toBeNull();
    expect(dolarDeHoy(taller(EN_DOLARES, null), '2026-10-01')).toBeNull();
  });

  it('la cláusula sale de la combinación del trabajo, y la retocada pisa la de la plantilla', () => {
    const enDolares = { ...EN_DOLARES, cobra_en: ['USD'] } as unknown as Proyecto;
    const replica = taller(enDolares);
    expect(documentoDeHoy({ replica, proyecto: enDolares, borrador }).clausulaDeLaMoneda).toBe(
      CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE.dolaresEnDolares,
    );
    expect(
      documentoDeHoy({
        replica,
        proyecto: enDolares,
        borrador: { ...borrador, clausulaDeLaMoneda: 'Se paga en dólares billete.' },
      }).clausulaDeLaMoneda,
    ).toBe('Se paga en dólares billete.');

    const enPesosConDolares = {
      ...PROYECTO,
      cobra_en: ['ARS', 'USD'],
    } as unknown as Proyecto;
    const enPesos = documentoDeHoy({
      replica: taller(enPesosConDolares),
      proyecto: enPesosConDolares,
      borrador,
    });
    expect(enPesos).toMatchObject({
      forma: 1,
      clausulaDeLaMoneda: CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE.pesosEnPesosODolares,
    });
  });

  it('el precio de hoy va en la moneda del trabajo', () => {
    expect(precioDeHoy(EN_DOLARES)).toEqual({ moneda: 'USD', importe: 240_000 });
    expect(precioDeHoy(PROYECTO)).toEqual({ moneda: 'ARS', importe: 800_000 });
    expect(precioDeHoy({ ...PROYECTO, presupuesto_centavos: null })).toBeNull();
  });

  it('cómo lo ve el cliente descuenta lo pagado en la moneda del trabajo', () => {
    const replica = taller(EN_DOLARES);
    const documento = documentoDeHoy({
      replica,
      proyecto: EN_DOLARES,
      borrador: { ...borrador, monedaDeLoAbonado: 'ARS' },
    });
    const vista = comoLoVeElCliente(
      documento,
      null,
      1,
      '2026-10-01',
      abonadoDeHoy(replica, 'p'),
      'es',
    );
    expect(vista.cuentas[0]).toMatchObject({
      total: 240_000,
      sena: 120_000,
      pagado: 58_276,
      faltaParaLaSena: 120_000 - 58_276,
    });
  });
});

describe('el documento en el idioma de los clientes', () => {
  const enIngles = replica({
    ajustes: { a: { ...METADATOS, id: 'a', idioma_de_los_clientes: 'en' } },
  });

  it('sin plantilla propia, son los textos de siempre en su idioma, con los datos escritos como los lee', () => {
    const borrador = borradorGuardado(enIngles, PROYECTO, null);
    const documento = documentoDeHoy({ replica: enIngles, proyecto: PROYECTO, borrador });
    expect(documento.garantia).toMatch(/^Warranty for 6 months from delivery/);
    expect(documento.formaDePago).toBe(
      '50% deposit to confirm the job, and the balance on delivery.',
    );
    expect(documento.avisos.map(({ texto }) => texto)).toContainEqual(
      expect.stringContaining('up to 2 modifications'),
    );
    expect(comoLoVeElCliente(documento, null, 1, '2026-09-22', centavos(0), 'en').idioma).toBe(
      'en',
    );
  });
});

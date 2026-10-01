import { borradorNuevo, centavos, PLANTILLA_DE_SIEMPRE } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { FilaDelPresupuesto } from '@/entities/presupuesto';
import type { Proyecto } from '@/entities/proyecto';
import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import {
  abonadoDeHoy,
  borradorGuardado,
  datosDelTaller,
  documentoDeHoy,
  opcionesDeHoy,
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
    const vista = comoLoVeElCliente(documento, null, 1, '2026-09-22', centavos(0));
    expect(vista).toMatchObject({
      etapa: 'mandado',
      numero: '',
      numeroVisible: 'Sin número todavía',
      mandadoEl: '2026-09-22',
      valeHasta: '2026-10-02',
      vencio: null,
      queCambio: null,
      mensajeParaElTaller: '',
      pideLaSena: true,
      nombreDelArchivo: 'Presupuesto (borrador).pdf',
    });
    expect(vista.cuentas).toHaveLength(1);
  });

  it('con número, el de la revisión que se va a mandar; con opciones o la seña cubierta, no pide la seña', () => {
    const documento = documentoDeHoy({ replica: replica(), proyecto: PROYECTO, borrador });
    const segunda = comoLoVeElCliente(documento, '20260915-01', 2, '2026-09-22', centavos(800_000));
    expect(segunda.numeroVisible).toBe('Nº 20260915-01 · Rev. 2');
    expect(segunda.mensajeParaElTaller).not.toBe('');
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
    const vista = comoLoVeElCliente(conOpciones, null, 1, '2026-09-22', centavos(0));
    expect(vista.cuentas).toHaveLength(2);
    expect(vista.pideLaSena).toBe(false);
    expect(
      comoLoVeElCliente({ ...conOpciones, validezDias: null }, null, 1, '2026-09-22', centavos(0))
        .valeHasta,
    ).toBeNull();
  });
});

import {
  borradorNuevo,
  centavos,
  documentoDelPresupuesto,
  PLANTILLA_DE_SIEMPRE,
  puntosBasicos,
  valoresDelTrabajo,
  type DocumentoDelPresupuesto,
  type ValoresDelPresupuesto,
} from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { TABLAS_REPLICADAS, type Json, type Replica, type TablaReplicada } from '@/shared/api';
import { formatosDelDocumento } from '@/shared/idioma-del-cliente';

import {
  avisoDelAcordado,
  ayudaDeLaEntrega,
  entregaDelPasaje,
  loMandadoAlCliente,
  plazoDelPasaje,
  type LoMandadoAlCliente,
} from './presupuestoMandado';

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

function documento(plazo: number, valores: ValoresDelPresupuesto | null): DocumentoDelPresupuesto {
  return documentoDelPresupuesto(
    {
      borrador: {
        ...borradorNuevo({
          titulo: 'Placard de tres puertas',
          obra: '',
          plantilla: PLANTILLA_DE_SIEMPRE,
          validezDias: 15,
          idNuevo: () => 'm1',
        }),
        plazoDeFabricacion: plazo,
      },
      plantilla: PLANTILLA_DE_SIEMPRE,
      taller: {
        nombre: 'Taller de prueba',
        titular: '',
        cuit: '',
        condicionFiscal: null,
        domicilio: '',
        telefono: '',
        email: '',
      },
      cliente: 'Marcela Duarte',
      moneda: 'ARS',
      cobraEn: null,
      valores,
      senaBp: puntosBasicos(5000),
      abonado: centavos(0),
    },
    formatosDelDocumento('es'),
  );
}

const CON_TOTAL = documento(30, valoresDelTrabajo(centavos(1_000_000), []));

const CON_OPCIONES = documento(
  21,
  valoresDelTrabajo(null, [
    { id: 'o1', descripcion: 'Frentes en melamina.', monto: centavos(1_000_000) },
    { id: 'o2', descripcion: 'Frentes laqueados.', monto: centavos(1_500_000) },
  ]),
);

function enUnRenglon(texto: string | null): string | null {
  return texto === null ? null : texto.replace(/\s+/g, ' ');
}

function mandado(doc: DocumentoDelPresupuesto, numero = '20260914-01', revision = 1) {
  return { documento: doc, numero, revision } satisfies LoMandadoAlCliente;
}

function replica(tablas: Partial<Record<TablaReplicada, Record<string, unknown>>> = {}): Replica {
  const todas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) todas[tabla] = tablas[tabla] ?? {};
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas: todas } as unknown as Replica;
}

function revision(id: string, numero: number, contenido: DocumentoDelPresupuesto) {
  return {
    ...METADATOS,
    id,
    presupuesto_id: 'b1',
    proyecto_id: 'p',
    revision: numero,
    numero: '20260914-01',
    mandado_el: '2026-09-14',
    vale_hasta: '2026-09-29',
    que_cambio: numero > 1 ? 'Cambié los frentes.' : null,
    contenido: contenido as unknown as Json,
  };
}

const PRESUPUESTO = {
  ...METADATOS,
  id: 'b1',
  proyecto_id: 'p',
  contenido: {},
  borrador_version: 3,
  numero: '20260914-01',
  aceptado_el: null,
};

describe('lo que se le mandó al cliente, en el pasaje', () => {
  it('sin presupuesto, o con uno que nunca se mandó, no hay nada mandado', () => {
    expect(loMandadoAlCliente(replica(), 'p')).toBeNull();
    expect(loMandadoAlCliente(replica({ presupuestos: { b1: PRESUPUESTO } }), 'p')).toBeNull();
  });

  it('con revisiones, es la última, con su número y su foto', () => {
    const conDos = replica({
      presupuestos: { b1: PRESUPUESTO },
      revisiones_del_presupuesto: {
        r2: revision('r2', 2, CON_OPCIONES),
        r1: revision('r1', 1, CON_TOTAL),
      },
    });

    expect(loMandadoAlCliente(conDos, 'p')).toEqual({
      documento: CON_OPCIONES,
      numero: '20260914-01',
      revision: 2,
    });
    expect(loMandadoAlCliente(conDos, 'otro')).toBeNull();
  });

  it('el plazo es el de la última revisión, y sin presupuesto siguen los 21 días hábiles', () => {
    expect(plazoDelPasaje(mandado(CON_TOTAL))).toBe(30);
    expect(plazoDelPasaje(null)).toBe(21);
    expect(entregaDelPasaje('2026-09-14', 30)).toBe('2026-10-26');
    expect(entregaDelPasaje('2026-09-14', 21)).toBe('2026-10-13');
  });

  it('la ayuda de la entrega dice de dónde sale el plazo', () => {
    expect(ayudaDeLaEntrega(30, true)).toBe(
      'Calculada a 30 días hábiles del inicio, el plazo del presupuesto.',
    );
    expect(ayudaDeLaEntrega(21, false)).toBe('Calculada a 21 días hábiles del inicio.');
  });
});

describe('el aviso de lo acordado al aprobar', () => {
  it('no avisa si aprueba lo mismo que dice el presupuesto, ni sin presupuesto mandado', () => {
    expect(enUnRenglon(avisoDelAcordado(mandado(CON_TOTAL), null, 1_000_000))).toBeNull();
    expect(enUnRenglon(avisoDelAcordado(mandado(CON_OPCIONES), 'o2', 1_500_000))).toBeNull();
    expect(enUnRenglon(avisoDelAcordado(null, null, 1_200_000))).toBeNull();
    expect(enUnRenglon(avisoDelAcordado(mandado(CON_TOTAL), null, null))).toBeNull();
  });

  it('con otro importe, dice qué decía el presupuesto y qué va a ver el cliente', () => {
    expect(enUnRenglon(avisoDelAcordado(mandado(CON_TOTAL), null, 1_200_000))).toBe(
      'En el presupuesto Nº 20260914-01 dice $ 10.000. Si lo aprobás así, su página, la ficha y el PDF suman «Acordado al aprobar: $ 12.000».',
    );
    expect(
      enUnRenglon(avisoDelAcordado(mandado(CON_OPCIONES, '20260914-01', 2), 'o1', 900_000)),
    ).toBe(
      'En el presupuesto Nº 20260914-01 · Rev. 2 dice $ 10.000. Si lo aprobás así, su página, la ficha y el PDF suman «Acordado al aprobar: $ 9.000».',
    );
  });

  it('una opción que no estaba en lo mandado, o un envío sin número todavía, también avisan', () => {
    expect(enUnRenglon(avisoDelAcordado(mandado(CON_OPCIONES), 'o3', 2_000_000))).toBe(
      'Ese importe no está en el presupuesto Nº 20260914-01. Si lo aprobás así, su página, la ficha y el PDF suman «Acordado al aprobar: $ 20.000».',
    );
    expect(enUnRenglon(avisoDelAcordado(mandado(CON_TOTAL, ''), null, 1_200_000))).toBe(
      'En el presupuesto que le mandaste dice $ 10.000. Si lo aprobás así, su página, la ficha y el PDF suman «Acordado al aprobar: $ 12.000».',
    );
  });
});

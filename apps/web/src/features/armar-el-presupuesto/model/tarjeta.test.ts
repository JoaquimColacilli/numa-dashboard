import { borradorNuevo, PLANTILLA_DE_SIEMPRE, type BorradorDelPresupuesto } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { Proyecto } from '@/entities/proyecto';
import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type Json,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import { documentoDeHoy } from './documento';
import { pdfDeLaRevision, pdfDeLaTarjeta, pdfDelAceptado, pdfDelBorrador } from './pdf';
import { estadoDeLaTarjeta, sePuedeMandarOtra } from './tarjeta';

const HOY = '2026-09-22';

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

const BORRADOR: BorradorDelPresupuesto = {
  ...borradorNuevo({
    titulo: 'Placard de tres puertas',
    obra: 'Calle Falsa 123',
    plantilla: PLANTILLA_DE_SIEMPRE,
    validezDias: 15,
    idNuevo: () => 'm1',
  }),
  muebles: [{ id: 'm1', nombre: 'Placard', descripcion: 'Tres puertas corredizas.' }],
};

function proyecto(cambios: Record<string, unknown> = {}): Proyecto {
  return {
    ...METADATOS,
    id: 'p',
    cliente_id: 'c',
    titulo: 'Placard de tres puertas',
    estado: 'a_presupuestar',
    version: 3,
    presupuesto_centavos: 1_000_000,
    presupuesto_vale_hasta: null,
    sena_bp: null,
    ...cambios,
  } as unknown as Proyecto;
}

function vacia(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.households = { h: { id: 'h', nombre: 'Taller de prueba', deleted_at: null, version: 1 } };
  tablas.clientes = { c: { ...METADATOS, id: 'c', nombre: 'Marcela Duarte', telefono: '' } };
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function conElBorrador(replica: Replica, borrador = BORRADOR): Replica {
  return aplicarFilaLocal(replica, 'presupuestos', {
    ...METADATOS,
    id: 'b1',
    proyecto_id: 'p',
    contenido: borrador as unknown as Json,
    borrador_version: 2,
    numero: '20260915-01',
    aceptado_el: null,
  });
}

function conLaRevision(
  replica: Replica,
  uno: Proyecto,
  revision: number,
  queCambio: string | null,
): Replica {
  return aplicarFilaLocal(replica, 'revisiones_del_presupuesto', {
    ...METADATOS,
    id: `r${String(revision)}`,
    presupuesto_id: 'b1',
    proyecto_id: 'p',
    revision,
    numero: '20260915-01',
    mandado_el: `2026-09-1${String(revision + 4)}`,
    vale_hasta: '2026-09-30',
    que_cambio: queCambio,
    contenido: documentoDeHoy({ replica, proyecto: uno, borrador: BORRADOR }) as unknown as Json,
  });
}

describe('la tarjeta del presupuesto en la ficha', () => {
  it('sin presupuesto, invita a armarlo; con un borrador, lo muestra como se va a ver', () => {
    const uno = proyecto();
    expect(estadoDeLaTarjeta(vacia(), uno, HOY)).toEqual({ cual: 'sin-borrador' });

    const estado = estadoDeLaTarjeta(conElBorrador(vacia()), uno, HOY);
    expect(estado.cual).toBe('borrador');
    if (estado.cual !== 'borrador') return;
    expect(estado.documento.titulo).toBe('Placard de tres puertas');
    expect(estado.documento.cliente).toBe('Marcela Duarte');
    expect(estado.documento.taller.nombre).toBe('Taller de prueba');
    expect(estado.documento.valores).toEqual({ tipo: 'total', total: 1_000_000 });
  });

  it('mandado: la última revisión arriba, las anteriores de la más nueva a la más vieja, y sin cambios', () => {
    const uno = proyecto({ estado: 'presupuesto_enviado', presupuesto_vale_hasta: '2026-09-30' });
    let replica = conElBorrador(vacia());
    replica = conLaRevision(replica, uno, 1, null);
    replica = conLaRevision(replica, uno, 2, 'Cambié los frentes.');
    replica = conLaRevision(replica, uno, 3, 'Sumé un estante.');

    const estado = estadoDeLaTarjeta(replica, uno, HOY);
    expect(estado.cual).toBe('mandado');
    if (estado.cual !== 'mandado') return;
    expect(estado.ultima.fila.revision).toBe(3);
    expect(estado.anteriores.map(({ fila }) => fila.revision)).toEqual([2, 1]);
    expect(estado.cambiosSinMandar).toBe(false);
    expect(estado.vencido).toBe(false);
    expect(estado.seMandaOtra).toBe(true);
    expect(estado.valeHasta).toBe('2026-09-30');
  });

  it('un cambio en el borrador o en el total después de mandarlo queda como cambios sin mandar', () => {
    const uno = proyecto({ estado: 'presupuesto_enviado' });
    const mandado = conLaRevision(conElBorrador(vacia()), uno, 1, null);

    const otroTitulo = conElBorrador(mandado, { ...BORRADOR, titulo: 'Placard y cajonera' });
    const conCambios = estadoDeLaTarjeta(otroTitulo, uno, HOY);
    expect(conCambios.cual === 'mandado' && conCambios.cambiosSinMandar).toBe(true);

    const otroTotal = estadoDeLaTarjeta(
      mandado,
      proyecto({ estado: 'presupuesto_enviado', presupuesto_centavos: 1_100_000 }),
      HOY,
    );
    expect(otroTotal.cual === 'mandado' && otroTotal.cambiosSinMandar).toBe(true);
  });

  it('vencido, se dice; perdido, se ve pero ya no se manda otra', () => {
    const vencido = proyecto({
      estado: 'presupuesto_enviado',
      presupuesto_vale_hasta: '2026-09-21',
    });
    const mandado = conLaRevision(conElBorrador(vacia()), vencido, 1, null);
    const estado = estadoDeLaTarjeta(mandado, vencido, HOY);
    expect(estado.cual === 'mandado' && estado.vencido).toBe(true);

    const perdido = proyecto({ estado: 'perdido', presupuesto_vale_hasta: '2026-09-21' });
    const cerrado = estadoDeLaTarjeta(mandado, perdido, HOY);
    expect(cerrado).toMatchObject({
      cual: 'mandado',
      seMandaOtra: false,
      vencido: false,
      cambiosSinMandar: false,
    });
    expect(sePuedeMandarOtra('perdido')).toBe(false);
    expect(sePuedeMandarOtra('en_seguimiento')).toBe(true);
    expect(sePuedeMandarOtra('a_presupuestar')).toBe(true);
    expect(sePuedeMandarOtra('en_curso')).toBe(false);
  });

  it('aceptado: solo la opción elegida, con su letra, y lo acordado si se aprobó otro importe', () => {
    const consulta = proyecto({ estado: 'presupuesto_enviado', presupuesto_centavos: null });
    let replica = conElBorrador(vacia());
    for (const [id, monto, aprobada] of [
      ['o1', 900_000, false],
      ['o2', 1_400_000, false],
    ] as const) {
      replica = aplicarFilaLocal(replica, 'opciones_de_presupuesto', {
        ...METADATOS,
        id,
        proyecto_id: 'p',
        descripcion: id === 'o1' ? 'Melamina' : 'Laqueado',
        monto_centavos: monto,
        aprobada,
      });
    }
    replica = conLaRevision(replica, consulta, 1, null);
    replica = aplicarFilaLocal(replica, 'opciones_de_presupuesto', {
      ...METADATOS,
      id: 'o2',
      proyecto_id: 'p',
      descripcion: 'Laqueado',
      monto_centavos: 1_500_000,
      aprobada: true,
    });

    const aprobado = proyecto({ estado: 'en_curso', presupuesto_centavos: 1_500_000 });
    const estado = estadoDeLaTarjeta(replica, aprobado, HOY);
    expect(estado.cual).toBe('aceptado');
    if (estado.cual !== 'aceptado') return;
    expect(estado.opcion).toEqual({
      id: 'o2',
      letra: 'B',
      descripcion: 'Laqueado',
      total: 1_400_000,
    });
    expect(estado.documento.valores).toEqual({ tipo: 'opciones', opciones: [estado.opcion] });
    expect(estado.acordado).toBe(1_500_000);

    const igual = estadoDeLaTarjeta(
      replica,
      proyecto({ estado: 'en_curso', presupuesto_centavos: 1_400_000 }),
      HOY,
    );
    expect(igual.cual === 'aceptado' && igual.acordado).toBeNull();
  });
});

describe('el PDF de la tarjeta', () => {
  it('es el borrador, la última revisión o el aceptado, según el estado', () => {
    expect(pdfDeLaTarjeta({ cual: 'sin-borrador' })).toBeNull();

    const uno = proyecto({ estado: 'presupuesto_enviado' });
    const conBorrador = estadoDeLaTarjeta(conElBorrador(vacia()), uno, HOY);
    if (conBorrador.cual !== 'borrador') throw new Error('Se esperaba un borrador.');
    expect(pdfDeLaTarjeta(conBorrador)).toEqual(
      pdfDelBorrador(conBorrador.documento, '20260915-01', 1),
    );
    expect(pdfDeLaTarjeta(conBorrador)?.borrador).toBe(true);

    const mandado = estadoDeLaTarjeta(
      conLaRevision(conElBorrador(vacia()), uno, 1, null),
      proyecto({ estado: 'presupuesto_enviado', presupuesto_vale_hasta: '2026-09-30' }),
      HOY,
    );
    if (mandado.cual !== 'mandado') throw new Error('Se esperaba un mandado.');
    expect(pdfDeLaTarjeta(mandado)).toEqual(pdfDeLaRevision(mandado.ultima, '2026-09-30'));
    expect(pdfDeLaTarjeta(mandado)).toMatchObject({
      numero: '20260915-01',
      revision: 1,
      mandadoEl: '2026-09-15',
      valeHasta: '2026-09-30',
      aceptado: null,
      borrador: false,
    });
  });

  it('una revisión que todavía no tiene número sale como borrador, y el aceptado lleva su día y su letra', () => {
    const uno = proyecto({ estado: 'presupuesto_enviado' });
    const mandado = estadoDeLaTarjeta(
      conLaRevision(conElBorrador(vacia()), uno, 1, null),
      uno,
      HOY,
    );
    if (mandado.cual !== 'mandado') throw new Error('Se esperaba un mandado.');
    const sinNumero = { ...mandado.ultima, fila: { ...mandado.ultima.fila, numero: '' } };
    expect(pdfDeLaRevision(sinNumero, null)).toMatchObject({ numero: null, borrador: true });

    expect(
      pdfDelAceptado(mandado.ultima, mandado.ultima.documento, '2026-09-25', null, null),
    ).toMatchObject({
      numero: '20260915-01',
      valeHasta: null,
      queCambio: null,
      aceptado: { el: '2026-09-25', letra: null, acordado: null },
      borrador: false,
    });
  });
});

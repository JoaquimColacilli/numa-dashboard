import { describe, expect, it } from 'vitest';

import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import { ordenarProyectos } from './busqueda';
import { loCobradoEnPalabras, resumenDeProyecto, resumenesDeProyectos } from './resumen';

const HOY = '2026-10-02';

function replicaDelTaller(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  const trabajo = (id: string, presupuesto: number, moneda: string) => ({
    id,
    titulo: `Trabajo ${id}`,
    estado: 'en_curso',
    cliente_id: 'c',
    presupuesto_centavos: presupuesto,
    moneda,
    entrega_estimada: null,
    entrega_comprometida: null,
    entrega_comprometida_franja: null,
    fecha_entrega: null,
    listo_el: null,
  });
  tablas.proyectos = {
    pesos: trabajo('pesos', 300_000_000, 'ARS'),
    dolares: trabajo('dolares', 200_000, 'USD'),
    chico: trabajo('chico', 10_000_000, 'ARS'),
  };
  tablas.pagos = {
    visita: {
      id: 'visita',
      proyecto_id: 'dolares',
      monto_centavos: 12_000_000,
      moneda: 'ARS',
      cotizacion_centavos: 145_000,
      tesoro_id: null,
    },
    sena: {
      id: 'sena',
      proyecto_id: 'dolares',
      monto_centavos: 50_000,
      moneda: 'USD',
      cotizacion_centavos: 150_000,
      tesoro_id: 'usd',
    },
    pesos: { id: 'pesos', proyecto_id: 'pesos', monto_centavos: 100_000_000, moneda: 'ARS' },
  };
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

describe('el resumen de un trabajo', () => {
  it('en dólares lleva el precio, lo cobrado y el saldo en dólares, y aparte lo cobrado en pesos', () => {
    expect(resumenDeProyecto(replicaDelTaller(), 'dolares', HOY)).toMatchObject({
      moneda: 'USD',
      precio: { importe: 200_000, moneda: 'USD' },
      cobradoEnSuMoneda: { importe: 58_276, moneda: 'USD' },
      cobradoEnPesos: 87_000_000,
      enMaun: 12_000_000,
      enDolares: [{ tesoroId: 'usd', monto: 50_000 }],
      saldo: { importe: 141_724, moneda: 'USD' },
    });
  });

  it('en pesos es el de siempre', () => {
    expect(resumenDeProyecto(replicaDelTaller(), 'pesos', HOY)).toMatchObject({
      moneda: 'ARS',
      precio: { importe: 300_000_000, moneda: 'ARS' },
      cobradoEnSuMoneda: { importe: 100_000_000, moneda: 'ARS' },
      saldo: { importe: 200_000_000, moneda: 'ARS' },
    });
  });

  it('lo cobrado se dice en pesos, y con dólares dice las dos cifras', () => {
    const replica = replicaDelTaller();
    const enPalabras = (id: string) =>
      loCobradoEnPalabras(resumenDeProyecto(replica, id, HOY) ?? fallar()).replace(/\s/g, ' ');
    expect(enPalabras('pesos')).toBe('$ 1.000.000');
    expect(enPalabras('dolares')).toBe('$ 120.000 y US$ 500 ($ 870.000)');
  });

  it('al ordenar por importe nunca compara pesos con dólares: primero los de pesos', () => {
    const resumenes = resumenesDeProyectos(replicaDelTaller(), HOY);
    const ids = (orden: string, sentido: 'asc' | 'desc') =>
      ordenarProyectos(resumenes, orden, sentido).map((resumen) => resumen.proyecto.id);
    expect(ids('presupuesto', 'desc')).toEqual(['pesos', 'chico', 'dolares']);
    expect(ids('presupuesto', 'asc')).toEqual(['chico', 'pesos', 'dolares']);
    expect(ids('saldo', 'desc')).toEqual(['pesos', 'chico', 'dolares']);
  });
});

function fallar(): never {
  throw new Error('Falta el resumen.');
}

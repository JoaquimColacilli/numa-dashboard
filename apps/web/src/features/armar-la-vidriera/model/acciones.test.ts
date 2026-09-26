import type { MutationOptions } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { ESPERA_ANTES_DE_QUITAR_DEL_BUCKET_MS } from '@/entities/archivo';
import type { NuevoAviso } from '@/shared/lib';

import type { FotoEnLaVidriera } from '../api/mutacion';
import {
  moverLaFoto,
  sacarLaFoto,
  sumarLaFoto,
  type Mandar,
  type OpcionesDeLaBaja,
} from './acciones';

function foto(id: string, extra: Partial<FotoEnLaVidriera> = {}): FotoEnLaVidriera {
  return {
    id,
    household_id: 'h',
    orden: 0,
    tipo: 'image/webp',
    bytes: 300_000,
    ancho: 900,
    alto: 1200,
    archivo_de_origen: null,
    created_at: '2026-09-26T10:00:00Z',
    updated_at: '2026-09-26T10:00:00Z',
    deleted_at: null,
    version: 1,
    ...extra,
  };
}

function registrador() {
  const mandadas: { clave: readonly unknown[] | undefined; variables: unknown }[] = [];
  const mandar: Mandar = (
    opciones: MutationOptions<FotoEnLaVidriera, unknown, never>,
    variables,
  ) => {
    mandadas.push({ clave: opciones.mutationKey, variables });
  };
  return { mandadas, mandar };
}

function opciones(extra: Partial<OpcionesDeLaBaja> = {}) {
  const avisos: NuevoAviso[] = [];
  const programados: { hacer: () => void; espera: number }[] = [];
  const quitadas: (readonly string[])[] = [];
  const cancelados: unknown[] = [];
  const base: OpcionesDeLaBaja = {
    avisar: (aviso) => {
      avisos.push(aviso);
    },
    quitarDelBucket: (rutas) => {
      quitadas.push(rutas);
      return Promise.resolve();
    },
    enLinea: () => true,
    sigueSacada: () => true,
    programar: (hacer, espera) => {
      programados.push({ hacer, espera });
      return programados.length;
    },
    cancelar: (reloj) => {
      cancelados.push(reloj);
    },
    ...extra,
  };
  return { base, avisos, programados, quitadas, cancelados };
}

const FOTOS = [foto('a', { orden: 0 }), foto('b', { orden: 1 }), foto('c', { orden: 5 })];

describe('sumar una foto', () => {
  it('va por la cola como un alta nueva, en silencio', () => {
    const { mandadas, mandar } = registrador();
    sumarLaFoto(mandar, {
      id: 'n',
      orden: 6,
      tipo: 'image/webp',
      bytes: 1,
      ancho: 900,
      alto: 1200,
      archivo_de_origen: null,
    });
    expect(mandadas).toHaveLength(1);
    expect(mandadas[0]?.clave).toEqual(['vidriera', 'sumar']);
    expect(mandadas[0]?.variables).toMatchObject({ previa: null, nueva: { id: 'n', orden: 6 } });
  });
});

describe('mover una foto', () => {
  it('cambia el orden de las dos que se cruzan, una mutación por cada una', () => {
    const { mandadas, mandar } = registrador();
    expect(moverLaFoto(mandar, FOTOS, 'c', 'antes')).toBe(true);
    expect(mandadas).toEqual([
      { clave: ['vidriera', 'ordenar'], variables: { id: 'c', orden: 1, previo: 5 } },
      { clave: ['vidriera', 'ordenar'], variables: { id: 'b', orden: 5, previo: 1 } },
    ]);
  });

  it('la primera no va más antes ni la última más después', () => {
    const { mandadas, mandar } = registrador();
    expect(moverLaFoto(mandar, FOTOS, 'a', 'antes')).toBe(false);
    expect(moverLaFoto(mandar, FOTOS, 'c', 'despues')).toBe(false);
    expect(mandadas).toEqual([]);
  });
});

describe('sacar una foto de la vidriera', () => {
  it('la da de baja por la cola, avisa con deshacer y quita el binario cuando vence el deshacer', () => {
    const { mandadas, mandar } = registrador();
    const { base, avisos, programados, quitadas } = opciones();
    sacarLaFoto(mandar, foto('a'), base);

    expect(mandadas[0]?.clave).toEqual(['vidriera', 'sacar']);
    expect(mandadas[0]?.variables).toMatchObject({ id: 'a', previa: { id: 'a' } });
    expect(avisos[0]).toMatchObject({
      tono: 'hecho',
      texto: 'Sacaste una foto de tu vidriera.',
      accion: { etiqueta: 'Deshacer' },
    });
    expect(programados[0]?.espera).toBe(ESPERA_ANTES_DE_QUITAR_DEL_BUCKET_MS);

    programados[0]?.hacer();
    expect(quitadas).toEqual([['h/vidriera/a.webp', 'h/vidriera/a.mini.webp']]);
  });

  it('deshacer la vuelve a poner con la fila de antes y no quita nada del bucket', () => {
    const { mandadas, mandar } = registrador();
    const { base, avisos, programados, quitadas, cancelados } = opciones();
    const sacada = foto('a', { orden: 3, archivo_de_origen: 'ar1' });
    sacarLaFoto(mandar, sacada, base);

    avisos[0]?.accion?.alTocar();
    expect(cancelados).toHaveLength(1);
    expect(mandadas[1]).toEqual({
      clave: ['vidriera', 'sumar'],
      variables: {
        previa: sacada,
        nueva: {
          id: 'a',
          orden: 3,
          tipo: 'image/webp',
          bytes: 300_000,
          ancho: 900,
          alto: 1200,
          archivo_de_origen: 'ar1',
        },
      },
    });

    programados[0]?.hacer();
    expect(quitadas).toEqual([]);
  });

  it('sin señal, o si la baja rebotó y la foto volvió, el binario se queda', () => {
    for (const extra of [{ enLinea: () => false }, { sigueSacada: () => false }]) {
      const { mandar } = registrador();
      const { base, programados, quitadas } = opciones(extra);
      sacarLaFoto(mandar, foto('a'), base);
      programados[0]?.hacer();
      expect(quitadas).toEqual([]);
    }
  });
});

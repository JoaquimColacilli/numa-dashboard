import { centavos } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { OpcionDePresupuesto, Proyecto } from '@/entities/proyecto';

import {
  conMasDeUnaOpcion,
  enElOrdenDelDocumento,
  guardadoDeLosValores,
  mismosValores,
  opcionesDelEditor,
  presupuestoDelEditor,
  totalDelEditor,
  valoresDelProyecto,
  type ValoresDelEditor,
} from './valores';

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
  titulo: 'Placard',
  estado: 'a_presupuestar',
  version: 4,
  presupuesto_centavos: 1_000_000,
} as unknown as Proyecto;

function opcion(id: string, monto: number, aprobada = false): OpcionDePresupuesto {
  return {
    ...METADATOS,
    id,
    proyecto_id: 'p',
    descripcion: ` Opción ${id} `,
    monto_centavos: monto,
    aprobada,
  };
}

describe('los valores en el editor', () => {
  it('sin opciones es el total del trabajo; con opciones, sus importes, y un cero queda vacío', () => {
    expect(valoresDelProyecto(PROYECTO, [])).toEqual({ total: 1_000_000, opciones: [] });
    expect(valoresDelProyecto(PROYECTO, [opcion('o1', 900_000, true), opcion('o2', 0)])).toEqual({
      total: null,
      opciones: [
        { id: 'o1', descripcion: ' Opción o1 ', monto: 900_000, aprobada: true },
        { id: 'o2', descripcion: ' Opción o2 ', monto: null, aprobada: false },
      ],
    });
  });

  it('para el documento, las opciones van con su texto limpio y un vacío vale cero', () => {
    const valores: ValoresDelEditor = {
      total: centavos(5),
      opciones: [{ id: 'o1', descripcion: '  Laqueado ', monto: null, aprobada: false }],
    };
    expect(totalDelEditor(valores)).toBeNull();
    expect(opcionesDelEditor(valores)).toEqual([{ id: 'o1', descripcion: 'Laqueado', monto: 0 }]);
    expect(totalDelEditor({ total: centavos(5), opciones: [] })).toBe(5);
  });

  it('ofrecer más de una opción pasa el total a la primera y deja la segunda vacía', () => {
    expect(conMasDeUnaOpcion({ total: centavos(1_000_000), opciones: [] }, ['a', 'b'])).toEqual({
      total: null,
      opciones: [
        { id: 'a', descripcion: '', monto: 1_000_000, aprobada: false },
        { id: 'b', descripcion: '', monto: null, aprobada: false },
      ],
    });
  });

  it('la A del editor es la A del documento: las opciones van por id, aunque los dos ids salgan en el mismo milisegundo', () => {
    const dos = conMasDeUnaOpcion({ total: centavos(1_000_000), opciones: [] }, ['b', 'a']);
    expect(dos.opciones.map(({ id, monto }) => [id, monto])).toEqual([
      ['a', 1_000_000],
      ['b', null],
    ]);
    const desordenadas: ValoresDelEditor = {
      total: null,
      opciones: [
        { id: 'c', descripcion: 'Tercera', monto: null, aprobada: false },
        { id: 'a', descripcion: 'Primera', monto: null, aprobada: false },
      ],
    };
    expect(enElOrdenDelDocumento(desordenadas).opciones.map(({ id }) => id)).toEqual(['a', 'c']);
    expect(mismosValores(desordenadas, enElOrdenDelDocumento(desordenadas))).toBe(true);
  });

  it('el presupuesto del trabajo es el total, o el de la opción aprobada', () => {
    expect(presupuestoDelEditor({ total: centavos(7), opciones: [] })).toBe(7);
    expect(
      presupuestoDelEditor(
        valoresDelProyecto(PROYECTO, [opcion('o1', 900_000, true), opcion('o2', 5)]),
      ),
    ).toBe(900_000);
    expect(presupuestoDelEditor(valoresDelProyecto(PROYECTO, [opcion('o1', 900_000)]))).toBeNull();
  });
});

describe('guardar los valores', () => {
  it('manda las opciones que quedan, borra las que se quitaron y el presupuesto sale de ellas', () => {
    const vivas = [opcion('o1', 900_000, true), opcion('o2', 1_100_000)];
    const { pedido, previos } = guardadoDeLosValores(PROYECTO, vivas, {
      total: null,
      opciones: [
        { id: 'o1', descripcion: ' Melamina ', monto: centavos(950_000), aprobada: true },
        { id: 'o3', descripcion: '', monto: null, aprobada: false },
      ],
    });

    expect(pedido.id).toBe('p');
    expect(pedido.version).toBe(4);
    expect(pedido.datos.presupuesto_centavos).toBe(950_000);
    expect(pedido.opciones).toEqual([
      { id: 'o1', descripcion: 'Melamina', monto_centavos: 950_000, aprobada: true },
      { id: 'o3', descripcion: '', monto_centavos: 0, aprobada: false },
      { id: 'o2', borrado: true },
    ]);
    expect(pedido.pagos).toEqual([]);
    expect(pedido.gastos).toEqual([]);
    expect(previos.opciones).toBe(vivas);
  });

  it('sin opciones, guarda el total', () => {
    const { pedido } = guardadoDeLosValores(PROYECTO, [], {
      total: centavos(1_250_000),
      opciones: [],
    });
    expect(pedido.datos.presupuesto_centavos).toBe(1_250_000);
    expect(pedido.opciones).toEqual([]);
  });
});

describe('si lo guardado ya es lo que hay en pantalla', () => {
  it('compara sin fijarse en blancos de las puntas, ceros vacíos ni el total escondido detrás de las opciones', () => {
    const enLaBase = valoresDelProyecto(PROYECTO, [opcion('o1', 0)]);
    expect(
      mismosValores(enLaBase, {
        total: centavos(1_000_000),
        opciones: [{ id: 'o1', descripcion: 'Opción o1', monto: centavos(0), aprobada: false }],
      }),
    ).toBe(true);
    expect(
      mismosValores(enLaBase, {
        total: null,
        opciones: [{ id: 'o1', descripcion: 'Opción o1', monto: centavos(1), aprobada: false }],
      }),
    ).toBe(false);
    expect(mismosValores({ total: centavos(1), opciones: [] }, { total: null, opciones: [] })).toBe(
      false,
    );
  });
});

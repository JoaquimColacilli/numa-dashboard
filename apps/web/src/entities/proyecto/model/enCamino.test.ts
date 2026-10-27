import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Proyecto } from './catalogos';
import { filaConLasRespuestas, filaDespuesDelGuardado, useFilaEnCamino } from './enCamino';
import { datosActualesDelProyecto } from './liquidacion';

const FILA = {
  id: 'p',
  household_id: 'h',
  version: 4,
  cliente_id: 'c',
  titulo: 'Placard',
  descripcion: '',
  estado: 'a_presupuestar',
  presupuesto_centavos: null,
  direccion_entrega: '',
  notas: '',
  respuestas_de_la_consulta: [],
} as unknown as Proyecto;

describe('la fila que va en camino', () => {
  it('sin nada mandado es la de la réplica; con algo mandado, la más nueva de las dos', () => {
    const { result } = renderHook(() => useFilaEnCamino());
    expect(result.current.masNueva(FILA)).toBe(FILA);
    expect(result.current.masNueva(undefined)).toBeUndefined();

    const enviada = { ...FILA, version: 5, direccion_entrega: 'Mitre 123' };
    result.current.anotar(enviada);
    expect(result.current.masNueva(FILA)).toBe(enviada);
    expect(result.current.masNueva(undefined)).toBe(enviada);
    const yaLlego = { ...FILA, version: 6 };
    expect(result.current.masNueva(yaLlego)).toBe(yaLlego);
    expect(result.current.masNueva({ ...FILA, id: 'otro', version: 1 })).toEqual({
      ...FILA,
      id: 'otro',
      version: 1,
    });
  });

  it('se suelta cuando termina lo último que se mandó, no lo de antes', () => {
    const { result } = renderHook(() => useFilaEnCamino());
    const soltarLaPrimera = result.current.anotar({ ...FILA, version: 5 });
    const soltarLaSegunda = result.current.anotar({ ...FILA, version: 6 });
    soltarLaPrimera();
    expect(result.current.masNueva(FILA)?.version).toBe(6);
    soltarLaSegunda();
    expect(result.current.masNueva(FILA)).toBe(FILA);
  });

  it('la fila después de un guardado sube la versión solo si algo cambia, y las respuestas siempre', () => {
    const conLaDireccion = filaDespuesDelGuardado(FILA, {
      ...datosActualesDelProyecto(FILA),
      direccion_entrega: 'Mitre 123',
    });
    expect(conLaDireccion).toMatchObject({ direccion_entrega: 'Mitre 123', version: 5 });
    expect(filaDespuesDelGuardado(FILA, datosActualesDelProyecto(FILA)).version).toBe(4);

    const respuestas = [{ id: 'acceso', pregunta: 'Acceso al lugar', respuesta: 'Tercer piso' }];
    expect(filaConLasRespuestas(conLaDireccion, respuestas)).toMatchObject({
      direccion_entrega: 'Mitre 123',
      respuestas_de_la_consulta: respuestas,
      version: 6,
    });
  });
});

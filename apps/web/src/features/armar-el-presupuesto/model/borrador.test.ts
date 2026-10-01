import { borradorNuevo, PLANTILLA_DE_SIEMPRE, type BorradorDelPresupuesto } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  conElHerrajeEditado,
  conElMuebleDeVuelta,
  conElMuebleEditado,
  conElMuebleMovido,
  conLaCasilla,
  conLaForma,
  conLaPropiaEditada,
  conLosHerrajesTraidos,
  conUnaPropiaMas,
  conUnHerrajeMas,
  conUnMuebleMas,
  sinElHerraje,
  sinElMueble,
  sinLaPropia,
  sinLosTraidos,
} from './borrador';

function contador(prefijo: string): () => string {
  let siguiente = 0;
  return () => {
    siguiente += 1;
    return `${prefijo}${String(siguiente)}`;
  };
}

const BASE: BorradorDelPresupuesto = {
  ...borradorNuevo({
    titulo: 'Placard',
    obra: '',
    plantilla: PLANTILLA_DE_SIEMPRE,
    validezDias: 15,
    idNuevo: () => 'm1',
  }),
  muebles: [
    { id: 'm1', nombre: 'Placard', descripcion: 'Tres puertas.' },
    { id: 'm2', nombre: 'Cajonera', descripcion: 'Cuatro cajones.' },
    { id: 'm3', nombre: 'Estante', descripcion: '' },
  ],
};

function ids(borrador: BorradorDelPresupuesto): string[] {
  return borrador.muebles.map(({ id }) => id);
}

describe('los muebles del borrador', () => {
  it('se suman vacíos al final y se editan por su id', () => {
    const conOtro = conUnMuebleMas(BASE, 'm4');
    expect(conOtro.muebles.at(-1)).toEqual({ id: 'm4', nombre: '', descripcion: '' });

    const editado = conElMuebleEditado(conOtro, 'm4', { nombre: 'Rack' });
    expect(editado.muebles.at(-1)).toEqual({ id: 'm4', nombre: 'Rack', descripcion: '' });
    expect(editado.muebles.slice(0, 3)).toEqual(BASE.muebles);
  });

  it('al quitar uno se recuerda dónde estaba y «Deshacer» lo vuelve a poner ahí, una sola vez', () => {
    const { borrador, quitado } = sinElMueble(BASE, 'm2');
    expect(ids(borrador)).toEqual(['m1', 'm3']);
    expect(quitado).toEqual({ mueble: BASE.muebles[1], indice: 1 });
    if (quitado === null) return;

    const deVuelta = conElMuebleDeVuelta(borrador, quitado);
    expect(ids(deVuelta)).toEqual(['m1', 'm2', 'm3']);
    expect(conElMuebleDeVuelta(deVuelta, quitado)).toBe(deVuelta);
  });

  it('si mientras tanto se quitaron otros, vuelve lo más cerca que puede', () => {
    const { borrador: sinElUltimo, quitado } = sinElMueble(BASE, 'm3');
    const { borrador: casiVacio } = sinElMueble(sinElUltimo, 'm2');
    if (quitado === null) return;
    expect(ids(conElMuebleDeVuelta(casiVacio, quitado))).toEqual(['m1', 'm3']);
    expect(sinElMueble(BASE, 'no-esta')).toEqual({ borrador: BASE, quitado: null });
  });

  it('se mueven de a uno, y en las puntas no pasa nada', () => {
    expect(ids(conElMuebleMovido(BASE, 'm2', -1))).toEqual(['m2', 'm1', 'm3']);
    expect(ids(conElMuebleMovido(BASE, 'm2', 1))).toEqual(['m1', 'm3', 'm2']);
    expect(conElMuebleMovido(BASE, 'm1', -1)).toBe(BASE);
    expect(conElMuebleMovido(BASE, 'm3', 1)).toBe(BASE);
  });
});

describe('los herrajes del borrador', () => {
  it('trae los de «Lo que hace falta» sin repetir los que ya están, aunque cambien tildes o mayúsculas', () => {
    const conUno = conUnHerrajeMas(BASE, { id: 'h0', texto: 'Bisagras cazoleta 35 mm' });
    const { borrador, traidos } = conLosHerrajesTraidos(
      conUno,
      [
        'BISAGRAS CAZOLETA 35MM',
        'bisagras cazoleta 35 mm',
        'Correderas telescópicas',
        '  ',
        'Correderas telescopicas',
      ],
      contador('h'),
    );

    expect(traidos).toEqual([
      { id: 'h1', texto: 'BISAGRAS CAZOLETA 35MM' },
      { id: 'h2', texto: 'Correderas telescópicas' },
    ]);
    expect(borrador.herrajes.lista.map(({ texto }) => texto)).toEqual([
      'Bisagras cazoleta 35 mm',
      'BISAGRAS CAZOLETA 35MM',
      'Correderas telescópicas',
    ]);
    expect(sinLosTraidos(borrador, traidos).herrajes.lista).toEqual(conUno.herrajes.lista);
  });

  it('se editan y se quitan por su id', () => {
    const conUno = conUnHerrajeMas(BASE, { id: 'h1', texto: 'Tiradores' });
    const editado = conElHerrajeEditado(conUno, 'h1', 'Tiradores de barral');
    expect(editado.herrajes.lista).toEqual([{ id: 'h1', texto: 'Tiradores de barral' }]);
    expect(sinElHerraje(editado, 'h1').herrajes.lista).toEqual([]);
  });
});

describe('las casillas y los textos propios', () => {
  it('tildar no repite y destildar saca', () => {
    const id = PLANTILLA_DE_SIEMPRE.avisos[0]?.id ?? 'aviso';
    const sinNada = conLaCasilla(BASE, 'avisos', id, false);
    expect(sinNada.avisos.tildadas).not.toContain(id);
    const tildada = conLaCasilla(conLaCasilla(sinNada, 'avisos', id, true), 'avisos', id, true);
    expect(tildada.avisos.tildadas.filter((otra) => otra === id)).toHaveLength(1);
    expect(tildada.condiciones).toBe(BASE.condiciones);
  });

  it('un texto propio se suma vacío, se escribe y se quita, en su grupo', () => {
    const conUno = conUnaPropiaMas(BASE, 'incluye', 'p1');
    expect(conUno.incluye.propias.at(-1)).toEqual({ id: 'p1', texto: '' });
    const escrito = conLaPropiaEditada(conUno, 'incluye', 'p1', 'Colocación en altura');
    expect(escrito.incluye.propias.at(-1)).toEqual({ id: 'p1', texto: 'Colocación en altura' });
    expect(escrito.aTenerEnCuenta).toBe(BASE.aTenerEnCuenta);
    expect(sinLaPropia(escrito, 'incluye', 'p1').incluye.propias).toEqual(BASE.incluye.propias);
  });

  it('la forma de pago se elige o se deja sin elegir', () => {
    const forma = { plantillaId: 'forma-a', texto: null };
    expect(conLaForma(BASE, forma).formaDePago).toEqual(forma);
    expect(conLaForma(conLaForma(BASE, forma), null).formaDePago).toBeNull();
  });
});

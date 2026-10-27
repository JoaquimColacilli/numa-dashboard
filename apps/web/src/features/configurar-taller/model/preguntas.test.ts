import {
  LARGOS_DE_LAS_PREGUNTAS,
  PREGUNTA_DEL_DOMICILIO,
  preguntasDeSiempre,
  problemaDeLasPreguntas,
  TOPE_DE_PREGUNTAS,
  type PreguntaDeLaConsulta,
} from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { conLaBorrada, mismasPreguntas, preguntaNueva, preguntasParaGuardar } from './preguntas';

const DOMICILIO: PreguntaDeLaConsulta = {
  id: PREGUNTA_DEL_DOMICILIO,
  rotulo: 'Domicilio',
  ayuda: '',
};
const ACCESO: PreguntaDeLaConsulta = {
  id: 'acceso',
  rotulo: 'Acceso al lugar',
  ayuda: 'Escaleras, piso, tamaño del ascensor.',
};
const URGENCIA: PreguntaDeLaConsulta = {
  id: 'urgencia',
  rotulo: 'Urgencia',
  ayuda: 'Para cuándo lo necesita.',
};
const MEDIDAS: PreguntaDeLaConsulta = { id: 'medidas', rotulo: 'Medidas', ayuda: '' };

describe('una pregunta nueva', () => {
  it('arranca vacía, con un id que la base acepta: minúsculas, dígitos y guiones, hasta 40', () => {
    const nueva = preguntaNueva();
    expect(nueva).toEqual({ id: nueva.id, rotulo: '', ayuda: '' });
    expect(nueva.id).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    expect(Array.from(nueva.id).length).toBeLessThanOrEqual(LARGOS_DE_LAS_PREGUNTAS.id);
    expect(
      problemaDeLasPreguntas([...preguntasDeSiempre('es'), { ...nueva, rotulo: 'Medidas' }]),
    ).toBeNull();
  });

  it('cada una tiene su id, y ninguna choca con el domicilio', () => {
    const ids = Array.from({ length: 20 }, () => preguntaNueva().id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(PREGUNTA_DEL_DOMICILIO);
  });
});

describe('las preguntas que se guardan', () => {
  it('van sin los blancos de las puntas', () => {
    expect(
      preguntasParaGuardar([
        { ...DOMICILIO, rotulo: '  Domicilio ' },
        { ...ACCESO, rotulo: ' Acceso al lugar  ', ayuda: '  Escaleras, piso.  ' },
      ]),
    ).toEqual([DOMICILIO, { ...ACCESO, ayuda: 'Escaleras, piso.' }]);
  });

  it('una nueva que todavía no tiene rótulo no se guarda, y las demás sí', () => {
    const sinRotulo = { ...preguntaNueva(), ayuda: 'Algo para ayudar.' };
    expect(
      preguntasParaGuardar([DOMICILIO, sinRotulo, ACCESO, { ...MEDIDAS, rotulo: '   ' }]),
    ).toEqual([DOMICILIO, ACCESO]);
  });

  it('el domicilio se conserva aunque se haya quedado sin nombre: así no se guarda nada', () => {
    expect(preguntasParaGuardar([{ ...DOMICILIO, rotulo: '  ' }, ACCESO])).toBeNull();
    expect(preguntasParaGuardar([DOMICILIO])).toEqual([DOMICILIO]);
  });

  it('una lista que la base rechazaría no se guarda', () => {
    expect(preguntasParaGuardar([ACCESO, DOMICILIO])).toBeNull();
    expect(preguntasParaGuardar([DOMICILIO, ACCESO, { ...URGENCIA, id: 'acceso' }])).toBeNull();
    expect(
      preguntasParaGuardar([
        DOMICILIO,
        { ...ACCESO, rotulo: 'x'.repeat(LARGOS_DE_LAS_PREGUNTAS.rotulo + 1) },
      ]),
    ).toBeNull();
    const demasiadas = Array.from({ length: TOPE_DE_PREGUNTAS }, (_, lugar) => ({
      id: `p-${String(lugar)}`,
      rotulo: `Pregunta ${String(lugar)}`,
      ayuda: '',
    }));
    expect(preguntasParaGuardar([DOMICILIO, ...demasiadas])).toBeNull();
    expect(preguntasParaGuardar([DOMICILIO, ...demasiadas.slice(1)])).toHaveLength(
      TOPE_DE_PREGUNTAS,
    );
  });
});

describe('la pregunta borrada, al deshacer', () => {
  it('vuelve al lugar donde estaba', () => {
    expect(conLaBorrada([DOMICILIO, ACCESO, MEDIDAS], { pregunta: URGENCIA, lugar: 2 })).toEqual([
      DOMICILIO,
      ACCESO,
      URGENCIA,
      MEDIDAS,
    ]);
    expect(conLaBorrada([DOMICILIO, ACCESO], { pregunta: URGENCIA, lugar: 2 })).toEqual([
      DOMICILIO,
      ACCESO,
      URGENCIA,
    ]);
  });

  it('si la lista se achicó, va al final; y nunca antes del domicilio', () => {
    expect(conLaBorrada([DOMICILIO], { pregunta: URGENCIA, lugar: 3 })).toEqual([
      DOMICILIO,
      URGENCIA,
    ]);
    expect(conLaBorrada([DOMICILIO, ACCESO], { pregunta: URGENCIA, lugar: 0 })).toEqual([
      DOMICILIO,
      URGENCIA,
      ACCESO,
    ]);
  });
});

describe('las mismas preguntas', () => {
  it('son las mismas solo con los mismos textos en el mismo orden', () => {
    const deSiempre = preguntasDeSiempre('es');
    expect(mismasPreguntas(deSiempre, preguntasDeSiempre('es'))).toBe(true);
    expect(mismasPreguntas(deSiempre, [DOMICILIO, URGENCIA, ACCESO])).toBe(false);
    expect(mismasPreguntas(deSiempre, [DOMICILIO, ACCESO, { ...URGENCIA, ayuda: '' }])).toBe(false);
    expect(mismasPreguntas(deSiempre, [DOMICILIO, ACCESO])).toBe(false);
  });
});

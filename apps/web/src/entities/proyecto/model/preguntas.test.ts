import type { PreguntaDeLaConsulta, RespuestaDeLaConsulta } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { TABLAS_REPLICADAS, type Replica, type TablaReplicada } from '@/shared/api';

import {
  mismasRespuestas,
  preguntasConLasDeAntes,
  preguntasDelTaller,
  respuestasConLoEscrito,
} from './preguntas';

const DOMICILIO: PreguntaDeLaConsulta = { id: 'domicilio', rotulo: 'Domicilio', ayuda: '' };
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
const PREGUNTAS = [DOMICILIO, ACCESO, URGENCIA];

const DEL_ACCESO: RespuestaDeLaConsulta = {
  id: 'acceso',
  pregunta: 'Acceso al lugar',
  respuesta: 'Tercer piso por escalera',
};
const DE_LA_MEDIDA: RespuestaDeLaConsulta = {
  id: 'medida',
  pregunta: 'Medida de la pared',
  respuesta: '3,20 m',
};

function replicaCon(ajustes: Record<string, unknown> | null): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  if (ajustes !== null) tablas.ajustes = { a: { id: 'a', household_id: 'h', ...ajustes } };
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

describe('las preguntas del taller', () => {
  it('sin preguntas en los ajustes son las de siempre, con el domicilio primero', () => {
    const deSiempre = [DOMICILIO, ACCESO, URGENCIA];
    expect(preguntasDelTaller(replicaCon(null))).toEqual(deSiempre);
    expect(preguntasDelTaller(replicaCon({}))).toEqual(deSiempre);
    expect(preguntasDelTaller(replicaCon({ preguntas_de_la_consulta: null }))).toEqual(deSiempre);
  });

  it('las que cargó en Ajustes, en su orden; si no se pueden leer, las de siempre', () => {
    const propias = [DOMICILIO, { id: 'medida', rotulo: 'Medida de la pared', ayuda: '' }];
    expect(preguntasDelTaller(replicaCon({ preguntas_de_la_consulta: propias }))).toEqual(propias);
    expect(
      preguntasDelTaller(replicaCon({ preguntas_de_la_consulta: [{ id: 'medida' }] })),
    ).toEqual(PREGUNTAS);
  });
});

describe('las preguntas con las de antes', () => {
  it('suma al final las respuestas de preguntas que ya no están, con su rótulo de entonces', () => {
    expect(preguntasConLasDeAntes(PREGUNTAS, [DEL_ACCESO, DE_LA_MEDIDA])).toEqual([
      ...PREGUNTAS,
      { id: 'medida', rotulo: 'Medida de la pared', ayuda: '' },
    ]);
  });

  it('sin respuestas de preguntas borradas, quedan las del taller', () => {
    expect(preguntasConLasDeAntes(PREGUNTAS, [DEL_ACCESO])).toEqual(PREGUNTAS);
    expect(preguntasConLasDeAntes(PREGUNTAS, [])).toEqual(PREGUNTAS);
  });
});

describe('las respuestas con lo escrito', () => {
  it('cambia la respuesta en su lugar, suma las nuevas al final y no toca las que no se escribieron', () => {
    const respuestas = respuestasConLoEscrito([DEL_ACCESO, DE_LA_MEDIDA], PREGUNTAS, {
      acceso: 'Planta baja',
      urgencia: 'Antes de fin de año',
    });
    expect(respuestas).toEqual([
      { ...DEL_ACCESO, respuesta: 'Planta baja' },
      DE_LA_MEDIDA,
      { id: 'urgencia', pregunta: 'Urgencia', respuesta: 'Antes de fin de año' },
    ]);
  });

  it('saca las que quedaron vacías y conserva las de preguntas que se borraron', () => {
    expect(
      respuestasConLoEscrito([DEL_ACCESO, DE_LA_MEDIDA], PREGUNTAS, { acceso: '   ' }),
    ).toEqual([DE_LA_MEDIDA]);
    expect(respuestasConLoEscrito([DE_LA_MEDIDA], PREGUNTAS, {})).toEqual([DE_LA_MEDIDA]);
  });

  it('mientras escribe deja los espacios; recortada, los saca', () => {
    const escritas = { acceso: '  Escalera angosta  ' };
    expect(respuestasConLoEscrito([], PREGUNTAS, escritas)).toEqual([
      { id: 'acceso', pregunta: 'Acceso al lugar', respuesta: '  Escalera angosta  ' },
    ]);
    expect(respuestasConLoEscrito([], PREGUNTAS, escritas, true)).toEqual([
      { id: 'acceso', pregunta: 'Acceso al lugar', respuesta: 'Escalera angosta' },
    ]);
  });

  it('el domicilio no es una respuesta: es la dirección del trabajo', () => {
    expect(
      respuestasConLoEscrito([], PREGUNTAS, { domicilio: 'Av. Siempre Viva 742', acceso: 'PB' }),
    ).toEqual([{ id: 'acceso', pregunta: 'Acceso al lugar', respuesta: 'PB' }]);
  });
});

describe('las mismas respuestas', () => {
  it('son las mismas con los mismos textos en el mismo orden', () => {
    expect(
      mismasRespuestas([DEL_ACCESO, DE_LA_MEDIDA], [{ ...DEL_ACCESO }, { ...DE_LA_MEDIDA }]),
    ).toBe(true);
    expect(mismasRespuestas([], [])).toBe(true);
  });

  it('cambian con otro texto, con una de más o con otro orden', () => {
    expect(mismasRespuestas([DEL_ACCESO], [{ ...DEL_ACCESO, respuesta: 'PB' }])).toBe(false);
    expect(mismasRespuestas([DEL_ACCESO], [DEL_ACCESO, DE_LA_MEDIDA])).toBe(false);
    expect(mismasRespuestas([DEL_ACCESO, DE_LA_MEDIDA], [DE_LA_MEDIDA, DEL_ACCESO])).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import {
  agregarLaPregunta,
  cambiarLaPregunta,
  conLaRespuesta,
  contestadas,
  leerLasPreguntas,
  leerLasRespuestas,
  moverLaPregunta,
  PREGUNTA_DEL_DOMICILIO,
  preguntasDeSiempre,
  problemaDeLasPreguntas,
  problemaDeLasRespuestas,
  quitarLaPregunta,
  respuestaA,
  respuestasDeOtrasPreguntas,
  sePuedeAgregarUnaPregunta,
  sePuedeMover,
  sePuedeQuitar,
  TOPE_DE_PREGUNTAS,
  TOPE_DE_RESPUESTAS,
  type PreguntaDeLaConsulta,
  type RespuestaDeLaConsulta,
} from './preguntas.ts';

const DE_SIEMPRE = preguntasDeSiempre('es');

const [DOMICILIO, ACCESO, URGENCIA] = DE_SIEMPRE as [
  PreguntaDeLaConsulta,
  PreguntaDeLaConsulta,
  PreguntaDeLaConsulta,
];

function pregunta(id: string, rotulo = `Pregunta ${id}`, ayuda = ''): PreguntaDeLaConsulta {
  return { id, rotulo, ayuda };
}

describe('las preguntas de siempre', () => {
  it('son el domicilio, el acceso al lugar y la urgencia, con su ayuda', () => {
    expect(DE_SIEMPRE).toEqual([
      { id: 'domicilio', rotulo: 'Domicilio', ayuda: '' },
      { id: 'acceso', rotulo: 'Acceso al lugar', ayuda: 'Escaleras, piso, tamaño del ascensor.' },
      { id: 'urgencia', rotulo: 'Urgencia', ayuda: 'Para cuándo lo necesita.' },
    ]);
  });

  it('van en el idioma del dueño, con los mismos ids', () => {
    expect(preguntasDeSiempre('en').map((una) => [una.id, una.rotulo])).toEqual([
      ['domicilio', 'Address'],
      ['acceso', 'Site access'],
      ['urgencia', 'Urgency'],
    ]);
    expect(preguntasDeSiempre('pt-BR').map((una) => una.rotulo)).toEqual([
      'Endereço',
      'Acesso ao local',
      'Urgência',
    ]);
  });

  it('cada pedido es una copia: cambiar una no cambia las de siempre', () => {
    const copia = preguntasDeSiempre('es');
    (copia[1] as PreguntaDeLaConsulta).rotulo = 'Otra';
    expect(preguntasDeSiempre('es')[1]?.rotulo).toBe('Acceso al lugar');
  });
});

describe('la forma de las preguntas, la que mira la base', () => {
  it('las de siempre están bien', () => {
    expect(problemaDeLasPreguntas(DE_SIEMPRE)).toBeNull();
    expect(problemaDeLasPreguntas([DOMICILIO])).toBeNull();
  });

  it('una lista de objetos con id, rótulo y ayuda, y nada más', () => {
    expect(problemaDeLasPreguntas(null)).toBe('forma-invalida');
    expect(problemaDeLasPreguntas({})).toBe('forma-invalida');
    expect(problemaDeLasPreguntas(['domicilio'])).toBe('forma-invalida');
    expect(problemaDeLasPreguntas([[]])).toBe('forma-invalida');
    expect(problemaDeLasPreguntas([{ id: 'domicilio', rotulo: 'Domicilio' }])).toBe(
      'forma-invalida',
    );
    expect(problemaDeLasPreguntas([{ ...DOMICILIO, otra: 'x' }])).toBe('forma-invalida');
    expect(problemaDeLasPreguntas([{ ...DOMICILIO, ayuda: 3 }])).toBe('forma-invalida');
  });

  it('el domicilio va primero, y hasta doce', () => {
    expect(problemaDeLasPreguntas([])).toBe('sin-domicilio');
    expect(problemaDeLasPreguntas([ACCESO, DOMICILIO])).toBe('sin-domicilio');
    const doce = [DOMICILIO, ...Array.from({ length: 11 }, (_, indice) => pregunta(`p${indice}`))];
    expect(problemaDeLasPreguntas(doce)).toBeNull();
    expect(problemaDeLasPreguntas([...doce, pregunta('p99')])).toBe('demasiadas-preguntas');
  });

  it('ids cortos, en minúscula, sin repetir', () => {
    expect(problemaDeLasPreguntas([DOMICILIO, pregunta('Acceso')])).toBe('id-invalido');
    expect(problemaDeLasPreguntas([DOMICILIO, pregunta('-acceso')])).toBe('id-invalido');
    expect(problemaDeLasPreguntas([DOMICILIO, pregunta('a'.repeat(41))])).toBe('id-invalido');
    expect(problemaDeLasPreguntas([DOMICILIO, pregunta('a'.repeat(40))])).toBeNull();
    expect(
      problemaDeLasPreguntas([DOMICILIO, pregunta('0190a0b2-7c3e-7d4f-8a1b-2c3d4e5f6a7b')]),
    ).toBeNull();
    expect(problemaDeLasPreguntas([DOMICILIO, ACCESO, ACCESO])).toBe('pregunta-repetida');
  });

  it('el rótulo no va vacío y tiene hasta sesenta letras; la ayuda, hasta ciento veinte', () => {
    expect(problemaDeLasPreguntas([DOMICILIO, pregunta('a', '   ')])).toBe('rotulo-invalido');
    expect(problemaDeLasPreguntas([DOMICILIO, pregunta('a', 'ñ'.repeat(60))])).toBeNull();
    expect(problemaDeLasPreguntas([DOMICILIO, pregunta('a', 'ñ'.repeat(61))])).toBe(
      'rotulo-invalido',
    );
    expect(problemaDeLasPreguntas([DOMICILIO, pregunta('a', 'A', 'é'.repeat(120))])).toBeNull();
    expect(problemaDeLasPreguntas([DOMICILIO, pregunta('a', 'A', 'é'.repeat(121))])).toBe(
      'ayuda-invalida',
    );
  });

  it('leer: lo guardado si está bien; si no hay o está mal, las de siempre en su idioma', () => {
    const propias = [DOMICILIO, pregunta('medidas', 'Medidas', 'Ancho y alto.')];
    expect(leerLasPreguntas(propias, 'es')).toEqual(propias);
    expect(leerLasPreguntas(null, 'en')).toEqual(preguntasDeSiempre('en'));
    expect(leerLasPreguntas(undefined, 'es')).toEqual(DE_SIEMPRE);
    expect(leerLasPreguntas([ACCESO], 'pt-BR')).toEqual(preguntasDeSiempre('pt-BR'));
  });
});

describe('las respuestas de un trabajo', () => {
  const respuesta = (id: string, texto: string, rotulo = `Pregunta ${id}`) => ({
    id,
    pregunta: rotulo,
    respuesta: texto,
  });

  it('la forma: id, la pregunta como estaba y la respuesta, sin el domicilio', () => {
    expect(problemaDeLasRespuestas([])).toBeNull();
    expect(problemaDeLasRespuestas([respuesta('acceso', 'Tercer piso')])).toBeNull();
    expect(problemaDeLasRespuestas('x')).toBe('forma-invalida');
    expect(problemaDeLasRespuestas([{ id: 'acceso', respuesta: 'x' }])).toBe('forma-invalida');
    expect(problemaDeLasRespuestas([7])).toBe('forma-invalida');
    expect(problemaDeLasRespuestas([respuesta('Acceso', 'x')])).toBe('id-invalido');
    expect(problemaDeLasRespuestas([respuesta('acceso', 'x'), respuesta('acceso', 'y')])).toBe(
      'respuesta-repetida',
    );
    expect(problemaDeLasRespuestas([respuesta(PREGUNTA_DEL_DOMICILIO, 'Calle 1')])).toBe(
      'respuesta-del-domicilio',
    );
    expect(problemaDeLasRespuestas([respuesta('acceso', 'x', ' ')])).toBe('pregunta-invalida');
    expect(problemaDeLasRespuestas([respuesta('acceso', 'x', 'a'.repeat(61))])).toBe(
      'pregunta-invalida',
    );
    expect(problemaDeLasRespuestas([respuesta('acceso', '  ')])).toBe('respuesta-invalida');
    expect(problemaDeLasRespuestas([respuesta('acceso', 'a'.repeat(500))])).toBeNull();
    expect(problemaDeLasRespuestas([respuesta('acceso', 'a'.repeat(501))])).toBe(
      'respuesta-invalida',
    );
    const muchas = Array.from({ length: TOPE_DE_RESPUESTAS + 1 }, (_, indice) =>
      respuesta(`p${indice}`, 'x'),
    );
    expect(problemaDeLasRespuestas(muchas.slice(1))).toBeNull();
    expect(problemaDeLasRespuestas(muchas)).toBe('demasiadas-respuestas');
  });

  it('leer: lo guardado si está bien, y si no, ninguna', () => {
    const guardadas = [respuesta('acceso', 'Tercer piso', 'Acceso al lugar')];
    expect(leerLasRespuestas(guardadas)).toEqual(guardadas);
    expect(leerLasRespuestas(null)).toEqual([]);
    expect(leerLasRespuestas([{ id: 'x' }])).toEqual([]);
  });

  it('contestar guarda la pregunta como está hoy, en su lugar, y vaciarla la saca', () => {
    const primera = conLaRespuesta([], ACCESO, 'Tercer piso por escalera');
    expect(primera).toEqual([
      { id: 'acceso', pregunta: 'Acceso al lugar', respuesta: 'Tercer piso por escalera' },
    ]);
    const dos = conLaRespuesta(primera, URGENCIA, 'Antes de fin de año');
    const renombrada = { ...ACCESO, rotulo: 'Cómo se llega' };
    expect(conLaRespuesta(dos, renombrada, 'Ascensor chico').map((una) => una.pregunta)).toEqual([
      'Cómo se llega',
      'Urgencia',
    ]);
    expect(conLaRespuesta(dos, ACCESO, '   ')).toEqual([dos[1]]);
    expect(conLaRespuesta(dos, pregunta('otra'), '')).toEqual(dos);
    expect(respuestaA(dos, URGENCIA)).toBe('Antes de fin de año');
    expect(respuestaA(dos, pregunta('otra'))).toBe('');
  });

  it('una respuesta larga se corta en quinientas letras, y con el lugar lleno se va la más vieja', () => {
    expect(conLaRespuesta([], ACCESO, 'ñ'.repeat(600))[0]?.respuesta).toBe('ñ'.repeat(500));
    const llenas: RespuestaDeLaConsulta[] = Array.from(
      { length: TOPE_DE_RESPUESTAS },
      (_, indice) => respuesta(`p${indice}`, 'x'),
    );
    const conUnaMas = conLaRespuesta(llenas, ACCESO, 'Planta baja');
    expect(conUnaMas).toHaveLength(TOPE_DE_RESPUESTAS);
    expect(conUnaMas[0]?.id).toBe('p1');
    expect(conUnaMas.at(-1)?.id).toBe('acceso');
  });

  it('el domicilio no se contesta acá: es la dirección del trabajo', () => {
    expect(() => conLaRespuesta([], DOMICILIO, 'Calle 1')).toThrow(RangeError);
  });

  it('«2 de 3»: cuenta el domicilio por la dirección y las demás por su respuesta', () => {
    const respuestas = [respuesta('acceso', 'Tercer piso')];
    expect(contestadas(DE_SIEMPRE, respuestas, 'Av. Siempre Viva 742')).toEqual({
      contestadas: 2,
      total: 3,
    });
    expect(contestadas(DE_SIEMPRE, respuestas, '  ')).toEqual({ contestadas: 1, total: 3 });
    expect(contestadas(DE_SIEMPRE, [], '')).toEqual({ contestadas: 0, total: 3 });
  });

  it('las respuestas a preguntas que ya no están quedan aparte, con la pregunta como era', () => {
    const vieja = respuesta('medidas', '2,40 de ancho', 'Medidas');
    expect(respuestasDeOtrasPreguntas(DE_SIEMPRE, [respuesta('acceso', 'x'), vieja])).toEqual([
      vieja,
    ]);
  });
});

describe('armar la lista en Ajustes', () => {
  it('se agrega al final hasta doce, sin repetir', () => {
    const con = agregarLaPregunta(DE_SIEMPRE, pregunta('medidas', 'Medidas'));
    expect(con.map((una) => una.id)).toEqual(['domicilio', 'acceso', 'urgencia', 'medidas']);
    expect(() => agregarLaPregunta(con, pregunta('acceso'))).toThrow(RangeError);
    const llenas = [
      DOMICILIO,
      ...Array.from({ length: TOPE_DE_PREGUNTAS - 1 }, (_, indice) => pregunta(`p${indice}`)),
    ];
    expect(sePuedeAgregarUnaPregunta(llenas)).toBe(false);
    expect(sePuedeAgregarUnaPregunta(DE_SIEMPRE)).toBe(true);
    expect(() => agregarLaPregunta(llenas, pregunta('otra'))).toThrow(RangeError);
  });

  it('se cambia el rótulo o la ayuda de una, también del domicilio', () => {
    expect(cambiarLaPregunta(DE_SIEMPRE, 'acceso', { ayuda: 'Piso y ascensor.' })[1]).toEqual({
      id: 'acceso',
      rotulo: 'Acceso al lugar',
      ayuda: 'Piso y ascensor.',
    });
    expect(cambiarLaPregunta(DE_SIEMPRE, 'domicilio', { rotulo: 'Dirección' })[0]?.rotulo).toBe(
      'Dirección',
    );
  });

  it('se sube y se baja, pero nada pasa arriba del domicilio ni el domicilio se mueve', () => {
    expect(moverLaPregunta(DE_SIEMPRE, 'urgencia', -1).map((una) => una.id)).toEqual([
      'domicilio',
      'urgencia',
      'acceso',
    ]);
    expect(moverLaPregunta(DE_SIEMPRE, 'acceso', 1).map((una) => una.id)).toEqual([
      'domicilio',
      'urgencia',
      'acceso',
    ]);
    expect(sePuedeMover(DE_SIEMPRE, 'acceso', -1)).toBe(false);
    expect(sePuedeMover(DE_SIEMPRE, 'urgencia', 1)).toBe(false);
    expect(sePuedeMover(DE_SIEMPRE, 'domicilio', 1)).toBe(false);
    expect(sePuedeMover(DE_SIEMPRE, 'no-esta', 1)).toBe(false);
    expect(moverLaPregunta(DE_SIEMPRE, 'acceso', -1)).toEqual(DE_SIEMPRE);
    expect(moverLaPregunta(DE_SIEMPRE, 'no-esta', -1)).toEqual(DE_SIEMPRE);
  });

  it('se saca cualquiera menos el domicilio', () => {
    expect(quitarLaPregunta(DE_SIEMPRE, 'acceso').map((una) => una.id)).toEqual([
      'domicilio',
      'urgencia',
    ]);
    expect(sePuedeQuitar('acceso')).toBe(true);
    expect(sePuedeQuitar('domicilio')).toBe(false);
    expect(() => quitarLaPregunta(DE_SIEMPRE, 'domicilio')).toThrow(RangeError);
  });
});

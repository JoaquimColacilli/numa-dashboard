import type { Idioma } from './idioma.ts';

export const TOPE_DE_PREGUNTAS = 12;
export const TOPE_DE_RESPUESTAS = 24;
export const LARGOS_DE_LAS_PREGUNTAS = { id: 40, rotulo: 60, ayuda: 120, respuesta: 500 } as const;
export const PREGUNTA_DEL_DOMICILIO = 'domicilio';

export interface PreguntaDeLaConsulta {
  id: string;
  rotulo: string;
  ayuda: string;
}

export interface RespuestaDeLaConsulta {
  id: string;
  pregunta: string;
  respuesta: string;
}

export type ProblemaDeLasPreguntas =
  | 'forma-invalida'
  | 'demasiadas-preguntas'
  | 'sin-domicilio'
  | 'id-invalido'
  | 'pregunta-repetida'
  | 'rotulo-invalido'
  | 'ayuda-invalida';

export type ProblemaDeLasRespuestas =
  | 'forma-invalida'
  | 'demasiadas-respuestas'
  | 'id-invalido'
  | 'respuesta-repetida'
  | 'respuesta-del-domicilio'
  | 'pregunta-invalida'
  | 'respuesta-invalida';

export interface Contestadas {
  contestadas: number;
  total: number;
}

const PREGUNTAS_DE_SIEMPRE: Readonly<Record<Idioma, readonly PreguntaDeLaConsulta[]>> = {
  es: [
    { id: PREGUNTA_DEL_DOMICILIO, rotulo: 'Domicilio', ayuda: '' },
    { id: 'acceso', rotulo: 'Acceso al lugar', ayuda: 'Escaleras, piso, tamaño del ascensor.' },
    { id: 'urgencia', rotulo: 'Urgencia', ayuda: 'Para cuándo lo necesita.' },
  ],
  en: [
    { id: PREGUNTA_DEL_DOMICILIO, rotulo: 'Address', ayuda: '' },
    { id: 'acceso', rotulo: 'Site access', ayuda: 'Stairs, floor, elevator size.' },
    { id: 'urgencia', rotulo: 'Urgency', ayuda: 'When they need it by.' },
  ],
  'pt-BR': [
    { id: PREGUNTA_DEL_DOMICILIO, rotulo: 'Endereço', ayuda: '' },
    { id: 'acceso', rotulo: 'Acesso ao local', ayuda: 'Escadas, andar, tamanho do elevador.' },
    { id: 'urgencia', rotulo: 'Urgência', ayuda: 'Para quando precisa.' },
  ],
};

const FORMA_DEL_ID = /^[a-z0-9][a-z0-9-]*$/;

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function tieneLasClaves(valor: Record<string, unknown>, claves: readonly string[]): boolean {
  const propias = Object.keys(valor);
  return (
    propias.length === claves.length && claves.every((clave) => typeof valor[clave] === 'string')
  );
}

function largo(texto: string): number {
  return Array.from(texto).length;
}

function estaVacio(texto: string): boolean {
  return texto.replace(/^ +| +$/g, '') === '';
}

function esIdDePregunta(id: string): boolean {
  return largo(id) <= LARGOS_DE_LAS_PREGUNTAS.id && FORMA_DEL_ID.test(id);
}

function esTextoConLargo(texto: string, maximo: number): boolean {
  return !estaVacio(texto) && largo(texto) <= maximo;
}

export function preguntasDeSiempre(idioma: Idioma): PreguntaDeLaConsulta[] {
  return PREGUNTAS_DE_SIEMPRE[idioma].map((pregunta) => ({ ...pregunta }));
}

export function problemaDeLasPreguntas(valor: unknown): ProblemaDeLasPreguntas | null {
  if (!Array.isArray(valor)) return 'forma-invalida';
  if (
    !valor.every(
      (pregunta) => esObjeto(pregunta) && tieneLasClaves(pregunta, ['id', 'rotulo', 'ayuda']),
    )
  ) {
    return 'forma-invalida';
  }
  const preguntas = valor as readonly PreguntaDeLaConsulta[];
  if (preguntas.length > TOPE_DE_PREGUNTAS) return 'demasiadas-preguntas';
  if (preguntas[0]?.id !== PREGUNTA_DEL_DOMICILIO) return 'sin-domicilio';
  const vistas = new Set<string>();
  for (const pregunta of preguntas) {
    if (!esIdDePregunta(pregunta.id)) return 'id-invalido';
    if (vistas.has(pregunta.id)) return 'pregunta-repetida';
    vistas.add(pregunta.id);
    if (!esTextoConLargo(pregunta.rotulo, LARGOS_DE_LAS_PREGUNTAS.rotulo)) return 'rotulo-invalido';
    if (largo(pregunta.ayuda) > LARGOS_DE_LAS_PREGUNTAS.ayuda) return 'ayuda-invalida';
  }
  return null;
}

export function leerLasPreguntas(valor: unknown, idioma: Idioma): PreguntaDeLaConsulta[] {
  if (valor === null || valor === undefined || problemaDeLasPreguntas(valor) !== null) {
    return preguntasDeSiempre(idioma);
  }
  return (valor as readonly PreguntaDeLaConsulta[]).map(({ id, rotulo, ayuda }) => ({
    id,
    rotulo,
    ayuda,
  }));
}

export function problemaDeLasRespuestas(valor: unknown): ProblemaDeLasRespuestas | null {
  if (!Array.isArray(valor)) return 'forma-invalida';
  if (
    !valor.every(
      (respuesta) =>
        esObjeto(respuesta) && tieneLasClaves(respuesta, ['id', 'pregunta', 'respuesta']),
    )
  ) {
    return 'forma-invalida';
  }
  const respuestas = valor as readonly RespuestaDeLaConsulta[];
  if (respuestas.length > TOPE_DE_RESPUESTAS) return 'demasiadas-respuestas';
  const vistas = new Set<string>();
  for (const respuesta of respuestas) {
    if (!esIdDePregunta(respuesta.id)) return 'id-invalido';
    if (vistas.has(respuesta.id)) return 'respuesta-repetida';
    vistas.add(respuesta.id);
    if (respuesta.id === PREGUNTA_DEL_DOMICILIO) return 'respuesta-del-domicilio';
    if (!esTextoConLargo(respuesta.pregunta, LARGOS_DE_LAS_PREGUNTAS.rotulo))
      return 'pregunta-invalida';
    if (!esTextoConLargo(respuesta.respuesta, LARGOS_DE_LAS_PREGUNTAS.respuesta)) {
      return 'respuesta-invalida';
    }
  }
  return null;
}

export function leerLasRespuestas(valor: unknown): RespuestaDeLaConsulta[] {
  if (problemaDeLasRespuestas(valor) !== null) return [];
  return (valor as readonly RespuestaDeLaConsulta[]).map(({ id, pregunta, respuesta }) => ({
    id,
    pregunta,
    respuesta,
  }));
}

export function respuestaA(
  respuestas: readonly RespuestaDeLaConsulta[],
  pregunta: Pick<PreguntaDeLaConsulta, 'id'>,
): string {
  return respuestas.find((respuesta) => respuesta.id === pregunta.id)?.respuesta ?? '';
}

export function conLaRespuesta(
  respuestas: readonly RespuestaDeLaConsulta[],
  pregunta: PreguntaDeLaConsulta,
  texto: string,
): RespuestaDeLaConsulta[] {
  if (pregunta.id === PREGUNTA_DEL_DOMICILIO) {
    throw new RangeError('El domicilio es la dirección del trabajo: no se guarda como respuesta.');
  }
  const respuesta = Array.from(texto).slice(0, LARGOS_DE_LAS_PREGUNTAS.respuesta).join('');
  const otras = respuestas.filter((anterior) => anterior.id !== pregunta.id);
  if (estaVacio(respuesta)) return otras;
  const nueva = { id: pregunta.id, pregunta: pregunta.rotulo, respuesta };
  const lugar = respuestas.findIndex((anterior) => anterior.id === pregunta.id);
  if (lugar === -1) return [...otras, nueva].slice(-TOPE_DE_RESPUESTAS);
  return [...respuestas.slice(0, lugar), nueva, ...respuestas.slice(lugar + 1)];
}

export function contestadas(
  preguntas: readonly PreguntaDeLaConsulta[],
  respuestas: readonly RespuestaDeLaConsulta[],
  domicilio: string,
): Contestadas {
  let cuenta = 0;
  for (const pregunta of preguntas) {
    const texto =
      pregunta.id === PREGUNTA_DEL_DOMICILIO ? domicilio : respuestaA(respuestas, pregunta);
    if (!estaVacio(texto)) cuenta += 1;
  }
  return { contestadas: cuenta, total: preguntas.length };
}

export function respuestasDeOtrasPreguntas(
  preguntas: readonly PreguntaDeLaConsulta[],
  respuestas: readonly RespuestaDeLaConsulta[],
): RespuestaDeLaConsulta[] {
  const actuales = new Set(preguntas.map((pregunta) => pregunta.id));
  return respuestas.filter((respuesta) => !actuales.has(respuesta.id));
}

export function sePuedeAgregarUnaPregunta(preguntas: readonly PreguntaDeLaConsulta[]): boolean {
  return preguntas.length < TOPE_DE_PREGUNTAS;
}

export function agregarLaPregunta(
  preguntas: readonly PreguntaDeLaConsulta[],
  pregunta: PreguntaDeLaConsulta,
): PreguntaDeLaConsulta[] {
  if (!sePuedeAgregarUnaPregunta(preguntas)) {
    throw new RangeError(`Una consulta lleva hasta ${String(TOPE_DE_PREGUNTAS)} preguntas.`);
  }
  if (preguntas.some((otra) => otra.id === pregunta.id)) {
    throw new RangeError(`La pregunta ${pregunta.id} ya está.`);
  }
  return [...preguntas, pregunta];
}

export function cambiarLaPregunta(
  preguntas: readonly PreguntaDeLaConsulta[],
  id: string,
  cambios: Partial<Pick<PreguntaDeLaConsulta, 'rotulo' | 'ayuda'>>,
): PreguntaDeLaConsulta[] {
  return preguntas.map((pregunta) => (pregunta.id === id ? { ...pregunta, ...cambios } : pregunta));
}

export function sePuedeMover(
  preguntas: readonly PreguntaDeLaConsulta[],
  id: string,
  hacia: -1 | 1,
): boolean {
  const lugar = preguntas.findIndex((pregunta) => pregunta.id === id);
  const destino = lugar + hacia;
  return lugar > 0 && destino > 0 && destino < preguntas.length;
}

export function moverLaPregunta(
  preguntas: readonly PreguntaDeLaConsulta[],
  id: string,
  hacia: -1 | 1,
): PreguntaDeLaConsulta[] {
  const pregunta = preguntas.find((candidata) => candidata.id === id);
  if (pregunta === undefined || !sePuedeMover(preguntas, id, hacia)) return [...preguntas];
  const lugar = preguntas.indexOf(pregunta) + hacia;
  const sin = preguntas.filter((otra) => otra !== pregunta);
  return [...sin.slice(0, lugar), pregunta, ...sin.slice(lugar)];
}

export function sePuedeQuitar(id: string): boolean {
  return id !== PREGUNTA_DEL_DOMICILIO;
}

export function quitarLaPregunta(
  preguntas: readonly PreguntaDeLaConsulta[],
  id: string,
): PreguntaDeLaConsulta[] {
  if (!sePuedeQuitar(id)) {
    throw new RangeError('El domicilio va siempre primero y no se saca.');
  }
  return preguntas.filter((pregunta) => pregunta.id !== id);
}

import {
  conLaRespuesta,
  leerLasPreguntas,
  PREGUNTA_DEL_DOMICILIO,
  respuestasDeOtrasPreguntas,
  type PreguntaDeLaConsulta,
  type RespuestaDeLaConsulta,
} from '@maun/domain';

import { ajustesDe, type Replica } from '@/shared/api';
import { idiomaActual } from '@/shared/lib';

export type RespuestasEscritas = Readonly<Record<string, string>>;

export function preguntasDelTaller(replica: Replica): PreguntaDeLaConsulta[] {
  return leerLasPreguntas(ajustesDe(replica)?.preguntas_de_la_consulta ?? null, idiomaActual());
}

export function preguntasConLasDeAntes(
  preguntas: readonly PreguntaDeLaConsulta[],
  respuestas: readonly RespuestaDeLaConsulta[],
): PreguntaDeLaConsulta[] {
  return [
    ...preguntas,
    ...respuestasDeOtrasPreguntas(preguntas, respuestas).map((respuesta) => ({
      id: respuesta.id,
      rotulo: respuesta.pregunta,
      ayuda: '',
    })),
  ];
}

export function respuestasConLoEscrito(
  guardadas: readonly RespuestaDeLaConsulta[],
  preguntas: readonly PreguntaDeLaConsulta[],
  escritas: RespuestasEscritas,
  recortadas = false,
): RespuestaDeLaConsulta[] {
  let respuestas = [...guardadas];
  for (const pregunta of preguntas) {
    const texto = escritas[pregunta.id];
    if (texto === undefined || pregunta.id === PREGUNTA_DEL_DOMICILIO) continue;
    respuestas = conLaRespuesta(respuestas, pregunta, recortadas ? texto.trim() : texto);
  }
  return respuestas;
}

export function mismasRespuestas(
  unas: readonly RespuestaDeLaConsulta[],
  otras: readonly RespuestaDeLaConsulta[],
): boolean {
  return JSON.stringify(unas) === JSON.stringify(otras);
}

import {
  PREGUNTA_DEL_DOMICILIO,
  problemaDeLasPreguntas,
  type PreguntaDeLaConsulta,
} from '@maun/domain';

import { uuidv7 } from '@/shared/lib';

export interface PreguntaBorrada {
  pregunta: PreguntaDeLaConsulta;
  lugar: number;
}

export function preguntaNueva(): PreguntaDeLaConsulta {
  return { id: `p-${uuidv7()}`, rotulo: '', ayuda: '' };
}

export function preguntasParaGuardar(
  lista: readonly PreguntaDeLaConsulta[],
): PreguntaDeLaConsulta[] | null {
  const limpias = lista
    .map((pregunta) => ({
      ...pregunta,
      rotulo: pregunta.rotulo.trim(),
      ayuda: pregunta.ayuda.trim(),
    }))
    .filter((pregunta) => pregunta.id === PREGUNTA_DEL_DOMICILIO || pregunta.rotulo !== '');
  return problemaDeLasPreguntas(limpias) === null ? limpias : null;
}

export function mismasPreguntas(
  unas: readonly PreguntaDeLaConsulta[],
  otras: readonly PreguntaDeLaConsulta[],
): boolean {
  return JSON.stringify(unas) === JSON.stringify(otras);
}

export function conLaBorrada(
  lista: readonly PreguntaDeLaConsulta[],
  { pregunta, lugar }: PreguntaBorrada,
): PreguntaDeLaConsulta[] {
  const donde = Math.max(1, Math.min(lugar, lista.length));
  return [...lista.slice(0, donde), pregunta, ...lista.slice(donde)];
}

import { enPalabras, type Genero } from '@maun/domain';
import type { ReactNode } from 'react';

import type { Envoltorio } from '@/shared/lib';

function cuantas(n: number, singular: string, plural: string, genero: Genero): string {
  return `${enPalabras(n, genero)} ${n === 1 ? singular : plural}`;
}

function queTieneLaEncuesta(preguntas: number, comentarios: number): string {
  const partes = [
    ...(preguntas > 0 ? [cuantas(preguntas, 'pregunta', 'preguntas', 'femenino')] : []),
    ...(comentarios > 0 ? [cuantas(comentarios, 'comentario', 'comentarios', 'masculino')] : []),
  ];
  if (partes.length === 0) return 'No tiene preguntas';
  return `${preguntas + comentarios === 1 ? 'Es' : 'Son'} ${partes.join(' y ')}`;
}

function despuesDeLaEntrega(dias: number | null): string {
  if (dias === null) return '';
  if (dias === 0) return ', el mismo día de la entrega';
  return `, ${enPalabras(dias, 'masculino')} ${dias === 1 ? 'día' : 'días'} después de la entrega`;
}

function aQuien(nombre: string | null): string {
  return nombre ?? 'tu cliente';
}

export const pedirLaOpinion = {
  sinSenal: 'Para crear el enlace de la encuesta hace falta señal. Cuando vuelva, tocá de nuevo.',
  enlaceCopiado: 'Enlace copiado.',
  copiado: 'Copiado',
  copiarElEnlace: 'Copiar el enlace',
  darDeBaja: {
    abrir: 'Dar de baja este enlace',
    titulo: '¿Dar de baja el enlace?',
    texto: (nombre: string | null): string =>
      `El enlace que le mandaste a ${aQuien(nombre)} deja de andar: si lo abre, le va a decir que no funciona. Después podés mandarle uno nuevo desde acá.`,
    sinSenal: 'Para darlo de baja hace falta señal.',
    confirmar: 'Dar de baja',
    cancelar: 'Cancelar',
  },
  pie: (Enlace: Envoltorio): ReactNode => (
    <>
      La encuesta que recibe sale de <Enlace>Opiniones › Preguntas</Enlace>, más lo que agregues
      acá.
    </>
  ),
  contestada: {
    titulo: (nombre: string | null): string => `${aQuien(nombre)} ya te contestó`,
    chip: 'contestada',
    contestoLaEncuesta: 'Contestó la encuesta.',
    contestoEl: (dia: string, diasDespues: number | null): string =>
      `Contestó el ${dia}${despuesDeLaEntrega(diasDespues)}.`,
    verLoQueContesto: 'Ver lo que contestó',
    comentario: (texto: string): string => `«${texto}»`,
    verTodas: 'Ver todas las opiniones',
  },
  mandada: {
    titulo: 'Le pediste la opinión',
    chip: 'sin contestar',
    bajada: 'El enlace le llegó por WhatsApp. Cuando conteste, te aparece acá y en Opiniones.',
    leLlego: (cuando: string): string => `Le llegó ${cuando}, todavía no contestó`,
    recordarselo: 'Recordárselo una vez',
    yaLeRecordaste: (dia: string): string =>
      `Ya le recordaste una vez, el ${dia}. No hay un segundo recordatorio: insistirle dos veces a un cliente que te pagó molesta más de lo que suma.`,
    unRecordatorio:
      'Un recordatorio y nada más. Si después de eso no contesta, quedó así y está bien.',
  },
  sinMandar: {
    titulo: (nombre: string | null): string => `Pedile la opinión a ${aQuien(nombre)}`,
    sinPreguntas:
      'La encuesta no tiene ninguna pregunta todavía. Agregá alguna en Opiniones › Preguntas antes de pedirla.',
    queTiene: (preguntas: number, comentarios: number, minutos: number): string =>
      `${queTieneLaEncuesta(preguntas, comentarios)}. Le llega un enlace, lo abre sin cuenta y te contesta en menos de ${cuantas(minutos, 'minuto', 'minutos', 'masculino')}.`,
    pedirsela: 'Pedírsela por WhatsApp',
    noSeCreo: (motivo: string): string =>
      `No se pudo crear el enlace. ${motivo} Si ya le mandaste el mensaje, tocá «Reintentar»: el enlace que le llegó empieza a andar sin mandarle nada de nuevo.`,
    reintentar: 'Reintentar',
    elMismoDia:
      'Lo que se pide el mismo día que entregás se contesta bastante más que lo mismo pedido una semana después. Si podés, mandásela ahora.',
  },
  propias: {
    titulo: 'Algo puntual de este trabajo',
    cuantas: (propias: number, tope: number): string =>
      propias === 0 ? 'ninguna todavía' : `${String(propias)} de ${String(tope)}`,
    detalle: 'Se suma solo a la encuesta de este cliente. No entra en el promedio general.',
    sacar: (texto: string): string => `Sacar la pregunta «${texto}»`,
    queLePreguntas: (nombre: string | null): string =>
      `Qué le querés preguntar a ${aQuien(nombre)}`,
    ejemplo: '¿La altura de la alacena te quedó cómoda?',
    comoContesta: 'Cómo contesta',
    agregarla: 'Agregarla a esta encuesta',
    cancelar: 'Cancelar',
    agregarUna: 'Agregar una pregunta para este trabajo',
    yaContesto: (nombre: string | null): string =>
      `${aQuien(nombre)} ya contestó, así que estas preguntas quedan como están. Para preguntarle algo nuevo, escribile.`,
    problemas: {
      'sin-texto': 'Escribí la pregunta.',
      'texto-largo': 'La pregunta es muy larga: tiene que entrar en 300 letras.',
    },
  },
  avisos: {
    laSumamos: 'La sumamos a la encuesta de este trabajo.',
    sacaste: 'Sacaste la pregunta.',
    deshacer: 'Deshacer',
  },
} as const;

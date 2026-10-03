import type { ReactNode } from 'react';

import type { Envoltorio } from '@/shared/lib';

export const paginaOpiniones = {
  opiniones: 'Opiniones',
  secciones: {
    resultados: 'Resultados',
    preguntas: 'Preguntas',
  },
  sinConexion: 'Sin conexión. Estás viendo lo último que se sincronizó.',
  sinEnviar: {
    titulo: 'Todavía no le preguntaste a nadie',
    detalle:
      'Cuando marques un trabajo como entregado, te va a aparecer ahí mismo el botón para pedirle la opinión al cliente. Lo que contesten se junta acá.',
    detalleConTerminados: (terminados: number): string =>
      terminados === 1
        ? 'Tenés 1 trabajo terminado. Cuando marcás uno como entregado, te va a aparecer ahí mismo el botón para pedirle la opinión al cliente. Lo que contesten se junta acá.'
        : `Tenés ${String(terminados)} trabajos terminados. Cuando marcás uno como entregado, te va a aparecer ahí mismo el botón para pedirle la opinión al cliente. Lo que contesten se junta acá.`,
    pedirle: 'Pedirle la opinión a un cliente',
    verQueSePregunta: 'Ver qué se pregunta',
  },
  sinRespuestas: {
    preguntaste: (enviadas: number, cuando: string): string =>
      enviadas === 1
        ? `Le preguntaste a un cliente ${cuando}`
        : `Les preguntaste a ${String(enviadas)} clientes, el más viejo ${cuando}`,
    titulo: 'Todavía no contestó ninguno',
    esNormal:
      'Es normal los primeros días. De cada diez personas a las que se les pide, suelen contestar entre tres y cinco, y casi siempre en la primera semana.',
    verAQuien: 'Ver a quién le mandaste',
  },
  titular: {
    region: 'El titular',
    queTanConformes: 'Qué tan conformes quedaron',
    deCinco: 'de 5',
    nadieContesto: 'Todavía nadie contestó esta pregunta.',
    promedioDe: (respuestas: number): string =>
      respuestas === 1
        ? 'Es el promedio de 1 respuesta'
        : `Es el promedio de ${String(respuestas)} respuestas, una por persona`,
    contestaron: (tasa: string): string => `Contestaron ${tasa}`,
    unPunto: 'Cada punto es un cliente al que le preguntaste. El lleno contestó.',
    variosPuntos: 'Cada punto es un cliente. Los llenos contestaron.',
    variosPuntosConTope: (tope: number): string =>
      `Cada punto es un cliente. Los llenos contestaron. Se muestran los primeros ${String(tope)}.`,
  },
  porcentaje: (porcentaje: number, parte: number, total: number): string =>
    `${String(porcentaje)}% (${String(parte)} de ${String(total)})`,
  comentarios: {
    titulo: 'Lo que escribieron',
    escribieronAlgo: (escribieron: number, contestadas: number): string =>
      `${String(escribieron)} de ${String(contestadas)} escribieron algo`,
    nadieEscribio:
      'Nadie escribió nada todavía. El comentario es opcional, así que muchos contestan las escalas y listo.',
    verLaRespuesta: 'Ver la respuesta',
  },
  preguntas: {
    titulo: 'Pregunta por pregunta',
    ocultarLosNumeros: 'Ocultar los números',
    verLosNumeros: 'Ver los números',
    repartidas:
      'Con esta cantidad de respuestas ya tiene sentido verlas repartidas. El corte del medio es «ni bien ni mal».',
    deAUna: (umbral: number): string =>
      `Cada punto es una persona. Con menos de ${String(umbral)} respuestas no mostramos porcentajes repartidos: se leen mejor de a una.`,
    mezcladas: (umbral: number): string =>
      `Con esta cantidad de respuestas ya tiene sentido verlas repartidas. El corte del medio es «ni bien ni mal». Las que tienen menos de ${String(umbral)} respuestas van de a una: cada punto es una persona.`,
    lasQueYaNo: 'Las que ya no preguntás',
    noSePreguntanMas: 'No se preguntan más, pero lo que contestaron queda acá.',
    antesDecia: (Cita: Envoltorio, texto: string, contestaron: number, hasta: string): ReactNode =>
      contestaron === 1 ? (
        <>
          Antes esta pregunta decía <Cita>«{texto}»</Cita> y la contestó 1 persona hasta {hasta}.
          Esas respuestas no se suman acá, porque contestaban otra cosa.
        </>
      ) : (
        <>
          Antes esta pregunta decía <Cita>«{texto}»</Cita> y la contestaron {String(contestaron)}{' '}
          personas hasta {hasta}. Esas respuestas no se suman acá, porque contestaban otra cosa.
        </>
      ),
    ocultarLasDeAntes: 'Ocultar las de antes',
    verLasDeAntes: 'Ver las de antes',
  },
  enElTiempo: {
    titulo: 'En el tiempo',
    conEvolucion:
      'Cada barra es una respuesta, de la más vieja a la más nueva. Alto igual a qué tan conforme quedó.',
    sinEvolucion: (umbral: number): string =>
      `Cada barra es una respuesta, en orden. Con ${String(umbral)} respuestas y medio año de historia vamos a poder mostrar si mejora o empeora; con menos sería inventar una tendencia.`,
    tira: (respuestas: number, desde: string, hasta: string): string =>
      respuestas === 1
        ? `1 respuesta, del ${desde} al ${hasta}`
        : `${String(respuestas)} respuestas, del ${desde} al ${hasta}`,
    sinRespuestas: 'Sin respuestas',
  },
  trabajos: {
    titulo: 'Trabajo por trabajo',
    contesto: (cuando: string): string => `Contestó ${cuando}`,
    recordada: 'Sin contestar, ya le recordaste',
    leMandaste: (cuando: string): string => `Le mandaste ${cuando}`,
    sinCliente: 'Sin cliente',
    propias: (propias: number): string =>
      propias === 1 ? '+1 propia' : `+${String(propias)} propias`,
  },
} as const;

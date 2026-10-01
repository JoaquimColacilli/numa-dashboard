import type { QueryClient } from '@tanstack/react-query';

import {
  CLAVE_DE_ANOTACION,
  CLAVE_DE_ANOTACION_NUEVA,
  CLAVE_DE_BAJA_DE_ANOTACION,
  MUTACION_DE_ANOTACION,
  MUTACION_DE_ANOTACION_NUEVA,
  MUTACION_DE_BAJA_DE_ANOTACION,
} from '@/entities/agenda';
import {
  CLAVE_DE_ARCHIVO_COMPARTIDO,
  CLAVE_DE_ARCHIVO_NUEVO,
  CLAVE_DE_BAJA_DE_ARCHIVO,
  MUTACION_DE_ARCHIVO_COMPARTIDO,
  MUTACION_DE_ARCHIVO_NUEVO,
  MUTACION_DE_BAJA_DE_ARCHIVO,
} from '@/entities/archivo';
import {
  CLAVE_DE_BAJA_DE_ENLACE,
  CLAVE_DE_ENLACE,
  CLAVE_DE_TOKEN_DE_ENLACE,
  MUTACION_DE_BAJA_DE_ENLACE,
  MUTACION_DE_ENLACE,
  MUTACION_DE_TOKEN_DE_ENLACE,
} from '@/entities/enlace';
import {
  CLAVE_DE_LECTURA_DE_ENTREGA,
  CLAVE_DE_PROPUESTA_DE_ENTREGA,
  MUTACION_DE_LECTURA_DE_ENTREGA,
  MUTACION_DE_PROPUESTA_DE_ENTREGA,
} from '@/entities/entrega';
import {
  CLAVE_DE_BAJA_DE_CLIENTE,
  CLAVE_DE_CLIENTE,
  CLAVE_DE_CLIENTE_NUEVO,
  MUTACION_DE_BAJA_DE_CLIENTE,
  MUTACION_DE_CLIENTE,
  MUTACION_DE_CLIENTE_NUEVO,
} from '@/entities/cliente';
import {
  CLAVE_DE_BAJA_DE_MOVIMIENTO,
  CLAVE_DE_EDICION_DE_MOVIMIENTO,
  CLAVE_DE_MOVIMIENTO,
  MUTACION_DE_BAJA_DE_MOVIMIENTO,
  MUTACION_DE_EDICION_DE_MOVIMIENTO,
  MUTACION_DE_MOVIMIENTO,
} from '@/entities/movimiento';
import {
  CLAVE_DE_BAJA_DE_PROYECTO,
  CLAVE_DE_COSTOS,
  CLAVE_DE_FORMAS_DE_COBRO,
  CLAVE_DE_LA_ENTREGA,
  CLAVE_DE_LIQUIDACION,
  CLAVE_DE_MARCA_DEL_SEGUIMIENTO,
  CLAVE_DE_MARCAS,
  CLAVE_DE_NOTAS,
  CLAVE_DE_PROYECTO,
  CLAVE_DE_REVERSION,
  CLAVE_DE_TAREAS,
  MUTACION_DE_BAJA_DE_PROYECTO,
  MUTACION_DE_COSTOS,
  MUTACION_DE_FORMAS_DE_COBRO,
  MUTACION_DE_LA_ENTREGA,
  MUTACION_DE_LIQUIDACION,
  MUTACION_DE_MARCA_DEL_SEGUIMIENTO,
  MUTACION_DE_MARCAS,
  MUTACION_DE_NOTAS,
  MUTACION_DE_PROYECTO,
  MUTACION_DE_REVERSION,
  MUTACION_DE_TAREAS,
} from '@/entities/proyecto';
import {
  CLAVE_DE_BAJA_DE_ENCUESTA,
  CLAVE_DE_ENCUESTA,
  CLAVE_DE_LECTURA,
  CLAVE_DE_PREGUNTA,
  CLAVE_DE_RECORDATORIO,
  MUTACION_DE_BAJA_DE_ENCUESTA,
  MUTACION_DE_ENCUESTA,
  MUTACION_DE_LECTURA,
  MUTACION_DE_PREGUNTA,
  MUTACION_DE_RECORDATORIO,
} from '@/entities/opinion';
import {
  CLAVE_DEL_BORRADOR,
  CLAVE_DEL_ENVIO,
  MUTACION_DEL_BORRADOR,
  MUTACION_DEL_ENVIO,
} from '@/entities/presupuesto';
import { CLAVE_DEL_PERFIL, MUTACION_DEL_PERFIL } from '@/entities/sesion';
import {
  CLAVE_DE_ARCHIVO_DE_TESORO,
  CLAVE_DE_TESORO,
  CLAVE_DE_TESORO_NUEVO,
  MUTACION_DE_ARCHIVO_DE_TESORO,
  MUTACION_DE_TESORO,
  MUTACION_DE_TESORO_NUEVO,
} from '@/entities/tesoro';
import { CLAVE_DE_LA_FILA, MUTACION_DE_LA_FILA } from '@/features/armar-la-fila';
import {
  CLAVE_DE_BAJA_DE_LA_VIDRIERA,
  CLAVE_DE_FOTO_DE_LA_VIDRIERA,
  CLAVE_DE_ORDEN_DE_LA_VIDRIERA,
  MUTACION_DE_BAJA_DE_LA_VIDRIERA,
  MUTACION_DE_FOTO_DE_LA_VIDRIERA,
  MUTACION_DE_ORDEN_DE_LA_VIDRIERA,
} from '@/features/armar-la-vidriera';
import {
  CLAVE_DE_LA_PLANTILLA,
  MUTACION_DE_LA_PLANTILLA,
} from '@/features/configurar-el-presupuesto';
import {
  CLAVE_DE_AJUSTES,
  CLAVE_DEL_NOMBRE,
  MUTACION_DE_AJUSTES,
  MUTACION_DEL_NOMBRE,
} from '@/features/configurar-taller';
type RegistroDeMutacion = (queryClient: QueryClient) => void;

const mutacionesPersistibles: readonly RegistroDeMutacion[] = [
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_MOVIMIENTO, MUTACION_DE_MOVIMIENTO);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(
      CLAVE_DE_EDICION_DE_MOVIMIENTO,
      MUTACION_DE_EDICION_DE_MOVIMIENTO,
    );
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_BAJA_DE_MOVIMIENTO, MUTACION_DE_BAJA_DE_MOVIMIENTO);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_AJUSTES, MUTACION_DE_AJUSTES);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DEL_NOMBRE, MUTACION_DEL_NOMBRE);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DEL_PERFIL, MUTACION_DEL_PERFIL);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_CLIENTE_NUEVO, MUTACION_DE_CLIENTE_NUEVO);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_CLIENTE, MUTACION_DE_CLIENTE);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_BAJA_DE_CLIENTE, MUTACION_DE_BAJA_DE_CLIENTE);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_PROYECTO, MUTACION_DE_PROYECTO);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_NOTAS, MUTACION_DE_NOTAS);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_TAREAS, MUTACION_DE_TAREAS);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_MARCAS, MUTACION_DE_MARCAS);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(
      CLAVE_DE_MARCA_DEL_SEGUIMIENTO,
      MUTACION_DE_MARCA_DEL_SEGUIMIENTO,
    );
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_COSTOS, MUTACION_DE_COSTOS);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_FORMAS_DE_COBRO, MUTACION_DE_FORMAS_DE_COBRO);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_LA_ENTREGA, MUTACION_DE_LA_ENTREGA);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_BAJA_DE_PROYECTO, MUTACION_DE_BAJA_DE_PROYECTO);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_LIQUIDACION, MUTACION_DE_LIQUIDACION);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_REVERSION, MUTACION_DE_REVERSION);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_ANOTACION_NUEVA, MUTACION_DE_ANOTACION_NUEVA);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_ANOTACION, MUTACION_DE_ANOTACION);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_BAJA_DE_ANOTACION, MUTACION_DE_BAJA_DE_ANOTACION);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_ARCHIVO_NUEVO, MUTACION_DE_ARCHIVO_NUEVO);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_BAJA_DE_ARCHIVO, MUTACION_DE_BAJA_DE_ARCHIVO);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_ARCHIVO_COMPARTIDO, MUTACION_DE_ARCHIVO_COMPARTIDO);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_ENLACE, MUTACION_DE_ENLACE);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_BAJA_DE_ENLACE, MUTACION_DE_BAJA_DE_ENLACE);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_TOKEN_DE_ENLACE, MUTACION_DE_TOKEN_DE_ENLACE);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_PREGUNTA, MUTACION_DE_PREGUNTA);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_LECTURA, MUTACION_DE_LECTURA);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_RECORDATORIO, MUTACION_DE_RECORDATORIO);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_ENCUESTA, MUTACION_DE_ENCUESTA);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_BAJA_DE_ENCUESTA, MUTACION_DE_BAJA_DE_ENCUESTA);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(
      CLAVE_DE_PROPUESTA_DE_ENTREGA,
      MUTACION_DE_PROPUESTA_DE_ENTREGA,
    );
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_LECTURA_DE_ENTREGA, MUTACION_DE_LECTURA_DE_ENTREGA);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_FOTO_DE_LA_VIDRIERA, MUTACION_DE_FOTO_DE_LA_VIDRIERA);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(
      CLAVE_DE_ORDEN_DE_LA_VIDRIERA,
      MUTACION_DE_ORDEN_DE_LA_VIDRIERA,
    );
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_BAJA_DE_LA_VIDRIERA, MUTACION_DE_BAJA_DE_LA_VIDRIERA);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_TESORO_NUEVO, MUTACION_DE_TESORO_NUEVO);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_TESORO, MUTACION_DE_TESORO);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_ARCHIVO_DE_TESORO, MUTACION_DE_ARCHIVO_DE_TESORO);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_LA_FILA, MUTACION_DE_LA_FILA);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DEL_BORRADOR, MUTACION_DEL_BORRADOR);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DEL_ENVIO, MUTACION_DEL_ENVIO);
  },
  (queryClient) => {
    queryClient.setMutationDefaults(CLAVE_DE_LA_PLANTILLA, MUTACION_DE_LA_PLANTILLA);
  },
];

export function registrarMutacionesPersistibles(queryClient: QueryClient): void {
  for (const registrar of mutacionesPersistibles) registrar(queryClient);
}

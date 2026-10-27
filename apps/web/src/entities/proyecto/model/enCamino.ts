import type { RespuestaDeLaConsulta } from '@maun/domain';
import { useRef } from 'react';

import type { Json, ProyectoParaGuardar } from '@/shared/api';

import type { Proyecto } from './catalogos';
import { versionDelGuardado } from './formulario';

export function filaDespuesDelGuardado(
  base: Proyecto,
  datos: ProyectoParaGuardar['datos'],
): Proyecto {
  return { ...base, ...datos, version: versionDelGuardado(base, datos) };
}

export function filaConLasRespuestas(
  base: Proyecto,
  respuestas: readonly RespuestaDeLaConsulta[],
): Proyecto {
  return {
    ...base,
    respuestas_de_la_consulta: [...respuestas] as unknown as Json,
    version: base.version + 1,
  };
}

export interface FilaEnCamino {
  masNueva: (actual: Proyecto | undefined) => Proyecto | undefined;
  anotar: (fila: Proyecto) => () => void;
}

export function useFilaEnCamino(): FilaEnCamino {
  const enCamino = useRef<{ fila: Proyecto; vez: number } | null>(null);
  const veces = useRef(0);
  return {
    masNueva: (actual) => {
      const enviada = enCamino.current?.fila;
      if (enviada === undefined) return actual;
      if (actual === undefined) return enviada;
      return enviada.id === actual.id && enviada.version > actual.version ? enviada : actual;
    },
    anotar: (fila) => {
      veces.current += 1;
      const vez = veces.current;
      enCamino.current = { fila, vez };
      return () => {
        if (enCamino.current?.vez === vez) enCamino.current = null;
      };
    },
  };
}

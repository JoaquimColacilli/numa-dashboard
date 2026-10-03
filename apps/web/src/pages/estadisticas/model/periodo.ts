import {
  conOtroLargo,
  correrElPeriodo,
  parametrosDelPeriodo,
  periodoDeLaUrl,
  type LargoDelPeriodo,
  type Periodo,
} from '@maun/domain';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

export const PARAMETRO_DE_LOS_MESES = 'meses';

export const PARAMETRO_DEL_FIN = 'hasta';

export interface PeriodoDeLaPagina {
  periodo: Periodo;
  elegirElLargo: (largo: LargoDelPeriodo) => void;
  correr: (sentido: -1 | 1) => void;
}

function conElParametro(parametros: URLSearchParams, nombre: string, valor: string | null): void {
  if (valor === null) parametros.delete(nombre);
  else parametros.set(nombre, valor);
}

export function usePeriodoDeLaUrl(mesEnCurso: string): PeriodoDeLaPagina {
  const [parametros, setParametros] = useSearchParams();
  const meses = parametros.get(PARAMETRO_DE_LOS_MESES);
  const hasta = parametros.get(PARAMETRO_DEL_FIN);
  const periodo = useMemo(
    () => periodoDeLaUrl(meses, hasta, mesEnCurso),
    [meses, hasta, mesEnCurso],
  );

  function ir(nuevo: Periodo): void {
    const enLaUrl = parametrosDelPeriodo(nuevo, mesEnCurso);
    setParametros(
      (previos) => {
        const siguientes = new URLSearchParams(previos);
        conElParametro(siguientes, PARAMETRO_DE_LOS_MESES, enLaUrl.meses);
        conElParametro(siguientes, PARAMETRO_DEL_FIN, enLaUrl.hasta);
        return siguientes;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  return {
    periodo,
    elegirElLargo: (largo) => {
      ir(conOtroLargo(periodo, largo, mesEnCurso));
    },
    correr: (sentido) => {
      ir(correrElPeriodo(periodo, sentido, mesEnCurso));
    },
  };
}

import { esCotizacion, RANGO_DE_LA_COTIZACION } from '@maun/domain';
import { useEffect, useState } from 'react';

import {
  pedirLaSugerenciaDelDolar,
  sugerenciaDelDolarGuardada,
  type SugerenciaDelDolar,
} from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import { formatearPesos } from '@/shared/lib';

export function errorDelDolar(valor: number | null, obligatorio = true): string | undefined {
  const textos = mensajes().ui.dolar;
  if (valor === null) return obligatorio ? textos.falta : undefined;
  if (esCotizacion(valor)) return undefined;
  return textos.fueraDeRango(
    formatearPesos(RANGO_DE_LA_COTIZACION.desde),
    formatearPesos(RANGO_DE_LA_COTIZACION.hasta),
  );
}

export function useSugerenciaDelDolar(activa = true): SugerenciaDelDolar | null {
  const [sugerencia, setSugerencia] = useState(() => sugerenciaDelDolarGuardada());
  useEffect(() => {
    if (!activa) return undefined;
    let vigente = true;
    void pedirLaSugerenciaDelDolar().then((traida) => {
      if (vigente) setSugerencia(traida);
    });
    return () => {
      vigente = false;
    };
  }, [activa]);
  return sugerencia;
}

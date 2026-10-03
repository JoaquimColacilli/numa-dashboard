import { mensajes } from '@/shared/idioma';
import type { NombreDeIcono } from '@/shared/ui';

import type { OperacionDeLiquidacion } from '../api/liquidacion';

export interface MarcaDeSincronizacion {
  texto: string;
  icono: NombreDeIcono;
  tono: string;
}

export function marcaDeLiquidacion(
  enVuelo: { operacion: OperacionDeLiquidacion; enPausa: boolean } | undefined,
  hayRechazo: boolean,
): MarcaDeSincronizacion | undefined {
  const textos = mensajes().proyecto.marca;
  if (enVuelo) {
    return enVuelo.enPausa
      ? { texto: textos.enPausa[enVuelo.operacion], icono: 'cloud-off', tono: 'text-atencion' }
      : {
          texto: textos.confirmando[enVuelo.operacion],
          icono: 'arrow-up-down',
          tono: 'text-text-2',
        };
  }
  if (hayRechazo) {
    return { texto: textos.rechazado, icono: 'triangle-alert', tono: 'text-alerta' };
  }
  return undefined;
}

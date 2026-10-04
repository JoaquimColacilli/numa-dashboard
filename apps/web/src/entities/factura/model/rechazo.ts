import { claseDelRechazo } from '@maun/domain';

import { leerRechazoDeArca, type Json } from '@/shared/api';
import { mensajes } from '@/shared/idioma';

export function motivoDelRechazo(rechazo: Json | null): string {
  const m = mensajes().facturacion.motivos;
  const [primero] = leerRechazoDeArca(rechazo).errores;
  if (primero === undefined) return m.sinMotivo;
  if (primero.codigo === null) return primero.mensaje;
  switch (claseDelRechazo(primero.codigo)) {
    case 'condicion-iva':
      return m.condicionIva;
    case 'documento':
      return m.documento;
    default:
      return m.deArca(primero.mensaje, String(primero.codigo));
  }
}

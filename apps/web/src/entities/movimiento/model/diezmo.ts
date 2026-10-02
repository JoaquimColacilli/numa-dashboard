import type { EstadoDelDiezmo } from '@maun/domain';

import { mensajes } from '@/shared/idioma';
import { formatearPesos } from '@/shared/lib';

export interface FraseDelDiezmo {
  situacion: EstadoDelDiezmo['situacion'];
  titulo: string;
  importe: string | null;
  frase: string;
  detalle: string;
}

export function fraseDelDiezmo(estado: EstadoDelDiezmo): FraseDelDiezmo {
  const textos = mensajes().movimiento.diezmo;
  if (estado.situacion === 'debe') {
    const importe = formatearPesos(estado.importe);
    return {
      situacion: estado.situacion,
      titulo: textos.debes,
      importe,
      frase: textos.debesElImporte(importe),
      detalle: textos.deLoQueYaCobraste,
    };
  }
  if (estado.situacion === 'pago-de-mas') {
    const importe = formatearPesos(estado.importe);
    return {
      situacion: estado.situacion,
      titulo: textos.pagasteDeMas,
      importe,
      frase: textos.pagasteElImporteDeMas(importe),
      detalle: textos.seDescuenta,
    };
  }
  return {
    situacion: estado.situacion,
    titulo: textos.estasAlDia,
    importe: null,
    frase: textos.estasAlDia,
    detalle: textos.todoPagado,
  };
}

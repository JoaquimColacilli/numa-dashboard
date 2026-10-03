import type { TipoDePregunta } from '@maun/domain';

import { mensajes, textosDelIdioma } from '@/shared/idioma';
import type { NombreDeIcono } from '@/shared/ui';

export interface DatosDelTipo {
  etiqueta: string;
  descripcion: string;
  icono: NombreDeIcono;
}

function tiposDelIdioma(): Readonly<Record<TipoDePregunta, DatosDelTipo>> {
  const { tipos } = mensajes().opinion;
  return {
    escala5: { ...tipos.escala5, icono: 'smile' },
    sitalvezno: { ...tipos.sitalvezno, icono: 'circle-check' },
    una: { ...tipos.una, icono: 'circle-dot' },
    varias: { ...tipos.varias, icono: 'list-checks' },
    texto: { ...tipos.texto, icono: 'pencil-line' },
  };
}

export const TIPO: Readonly<Record<TipoDePregunta, DatosDelTipo>> = textosDelIdioma(tiposDelIdioma);

export function cuantasRespuestas(cantidad: number): string {
  return mensajes().opinion.cuantasRespuestas(cantidad);
}

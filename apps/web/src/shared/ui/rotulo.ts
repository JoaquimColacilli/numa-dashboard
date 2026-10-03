import type { Idioma } from '@maun/domain';

import { mensajes, type TextosDeLaUiQueVeElCliente } from '@/shared/idioma';
import { fechaDelRotulo, idiomaActual } from '@/shared/lib';

import type { CasillaDelRotulo } from './plano';

export interface AceptacionDelRotulo {
  el: string | null;
  letra: string | null;
}

export interface DatosDelRotulo {
  numero: string | null;
  revision: number;
  emitido: string | null;
  valeHasta?: string | null;
  vencido?: boolean;
  aceptado?: AceptacionDelRotulo | null;
}

export function casillasDelPresupuesto(
  { numero, revision, emitido, valeHasta, vencido = false, aceptado = null }: DatosDelRotulo,
  textos: TextosDeLaUiQueVeElCliente['rotulo'] = mensajes().ui.rotulo,
  idioma: Idioma = idiomaActual(),
): CasillaDelRotulo[] {
  const casillas: CasillaDelRotulo[] = [
    {
      titulo: textos.presupuesto,
      valor: numero === null ? textos.sinNumero : textos.numero(numero),
    },
    { titulo: textos.revision, valor: String(revision) },
  ];
  if (emitido !== null)
    casillas.push({ titulo: textos.emitido, valor: fechaDelRotulo(emitido, idioma) });
  if (aceptado !== null) {
    if (aceptado.letra !== null) casillas.push({ titulo: textos.opcion, valor: aceptado.letra });
    if (aceptado.el !== null) {
      casillas.push({
        titulo: textos.aceptado,
        valor: fechaDelRotulo(aceptado.el, idioma),
        tono: 'hecho',
      });
    }
    return casillas;
  }
  if (valeHasta === undefined) return casillas;
  if (valeHasta === null) {
    casillas.push({ titulo: textos.valeHasta, valor: textos.sinVencimiento });
  } else if (vencido) {
    casillas.push({
      titulo: textos.vencio,
      valor: fechaDelRotulo(valeHasta, idioma),
      tono: 'atencion',
    });
  } else {
    casillas.push({ titulo: textos.valeHasta, valor: fechaDelRotulo(valeHasta, idioma) });
  }
  return casillas;
}

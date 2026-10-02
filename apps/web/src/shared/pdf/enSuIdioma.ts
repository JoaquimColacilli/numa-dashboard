import type { DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

import { cargarMensajesDelCliente } from '@/shared/idioma-del-cliente';

import { PresupuestoPdf } from './Documento';
import { partirEnElIdioma } from './fuentes';
import { lenguaDelPdf, sinEspaciosFinosEn } from './lengua';
import type { PresupuestoEnPdf } from './tipos';

export async function presupuestoEnSuIdioma(
  presupuesto: PresupuestoEnPdf,
): Promise<ReactElement<DocumentProps>> {
  const { idioma } = presupuesto;
  const m = await cargarMensajesDelCliente(idioma);
  partirEnElIdioma(idioma);
  return PresupuestoPdf(sinEspaciosFinosEn(presupuesto), lenguaDelPdf(idioma, m));
}

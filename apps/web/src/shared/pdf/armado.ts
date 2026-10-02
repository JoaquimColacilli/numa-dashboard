import {
  centavosEn,
  monedaDeLoAbonadoDelDocumento,
  monedaDelDocumento,
  NOMBRE_DE_LA_CONDICION,
  pesosDeDolares,
  type DatosDelTaller,
  type DocumentoDelPresupuesto,
  type Moneda,
  type Money,
  type ReferenciaEnPesos,
} from '@maun/domain';

import type { LenguaDelPdf } from './lengua';
import { ANCHO_DE_LA_OPCION, ANCHO_DE_LA_REVISION } from './medidas';
import type { PresupuestoEnPdf } from './tipos';

export { LEYENDA_DE_ARCA } from './leyenda';

const SIN_DATO = '—';

export function mediodiaEnElTaller(fecha: string): Date {
  return new Date(`${fecha}T12:00:00-03:00`);
}

export function fechaDeCreacion(p: PresupuestoEnPdf): Date | undefined {
  return p.borrador || p.mandadoEl === null ? undefined : mediodiaEnElTaller(p.mandadoEl);
}

export function tituloDelPdf(p: PresupuestoEnPdf, { m }: LenguaDelPdf): string {
  const { titulo } = m.pdf;
  if (p.numero === null) return titulo.sinNumero;
  const conRevision =
    p.revision <= 1 ? titulo.numero(p.numero) : titulo.conRevision(p.numero, p.revision);
  return p.borrador ? titulo.enBorrador(conRevision) : conRevision;
}

export function textoDeLaPagina(
  titulo: string,
  pagina: number,
  total: number,
  { m }: LenguaDelPdf,
): string {
  return m.pdf.pagina(titulo, pagina, total);
}

export function deQuienEs(documento: DocumentoDelPresupuesto): string {
  return [documento.cliente, documento.titulo].filter(Boolean).join(' · ');
}

export function pieDelTaller(taller: DatosDelTaller): string {
  return [taller.nombre, taller.cuit === '' ? '' : `CUIT ${taller.cuit}`]
    .filter(Boolean)
    .join(' · ');
}

export function lineasDelTaller(taller: DatosDelTaller): string[] {
  const cuit = taller.cuit === '' ? '' : `CUIT ${taller.cuit}`;
  const condicion =
    taller.condicionFiscal === null ? '' : NOMBRE_DE_LA_CONDICION[taller.condicionFiscal];
  return [
    [taller.titular, cuit].filter(Boolean).join(' · '),
    condicion,
    taller.domicilio,
    [taller.telefono, taller.email].filter(Boolean).join(' · '),
  ].filter((linea) => linea !== '');
}

export interface CasillaDelPdf {
  titulo: string;
  valor: string;
  ancho?: number;
}

export function casillasDelRotuloDelPdf(
  p: PresupuestoEnPdf,
  { m, f }: LenguaDelPdf,
): CasillaDelPdf[] {
  const { rotulo } = m.ui;
  const delPdf = m.pdf.rotulo;
  if (p.borrador) {
    const dias = p.documento.validezDias;
    return [
      {
        titulo: rotulo.revision,
        valor: p.numero === null ? SIN_DATO : String(p.revision),
        ancho: ANCHO_DE_LA_REVISION,
      },
      { titulo: rotulo.emitido, valor: SIN_DATO },
      {
        titulo: delPdf.validez,
        valor: dias === null ? delPdf.sinVencimiento : delPdf.dias(dias),
      },
    ];
  }
  const emitido: CasillaDelPdf[] = [
    { titulo: rotulo.revision, valor: String(p.revision), ancho: ANCHO_DE_LA_REVISION },
    {
      titulo: rotulo.emitido,
      valor: p.mandadoEl === null ? SIN_DATO : f.fechaDelRotulo(p.mandadoEl),
    },
  ];
  if (p.aceptado !== null) {
    const { letra, el } = p.aceptado;
    return [
      ...emitido,
      ...(letra === null
        ? []
        : [{ titulo: rotulo.opcion, valor: letra, ancho: ANCHO_DE_LA_OPCION }]),
      ...(el === null ? [] : [{ titulo: rotulo.aceptado, valor: f.fechaDelRotulo(el) }]),
    ];
  }
  return [
    ...emitido,
    p.valeHasta === null
      ? { titulo: delPdf.validez, valor: delPdf.sinVencimiento }
      : { titulo: rotulo.valeHasta, valor: f.fechaDelRotulo(p.valeHasta) },
  ];
}

export function textoDeLaValidez(p: PresupuestoEnPdf, { m, f }: LenguaDelPdf): string | null {
  const { validez } = m.pdf;
  if (p.aceptado !== null) return null;
  if (p.borrador) {
    const dias = p.documento.validezDias;
    return dias === null ? validez.sinVencimiento : validez.dias(dias);
  }
  return p.valeHasta === null ? validez.sinVencimiento : validez.hasta(f.fechaConAnio(p.valeHasta));
}

export function textoDelPlazo(dias: number, { m }: LenguaDelPdf): string {
  return m.pdf.plazo(dias);
}

export function lineaDelAceptado(
  el: string | null,
  letra: string | null,
  { m, f }: LenguaDelPdf,
): string {
  const { aceptado } = m.pdf;
  if (el === null) return letra === null ? aceptado.sinFecha : aceptado.sinFechaConOpcion(letra);
  const fecha = f.fechaConAnio(el);
  return letra === null ? aceptado.el(fecha) : aceptado.elConOpcion(fecha, letra);
}

export function conQueCambio(p: PresupuestoEnPdf): boolean {
  return !p.borrador && p.aceptado === null && p.revision > 1 && (p.queCambio ?? '').trim() !== '';
}

export function plataDelDocumento(
  documento: DocumentoDelPresupuesto,
  { f }: Pick<LenguaDelPdf, 'f'>,
): (importe: number) => string {
  const moneda = monedaDelDocumento(documento);
  return (importe) => f.plata(importe, moneda);
}

export function pagadoDelDocumento(documento: DocumentoDelPresupuesto): Money<Moneda> {
  const moneda = monedaDelDocumento(documento);
  return monedaDeLoAbonadoDelDocumento(documento) === moneda
    ? documento.abonado
    : centavosEn(moneda, 0);
}

export function referenciaDelDocumento(
  documento: DocumentoDelPresupuesto,
): ReferenciaEnPesos | null {
  return documento.forma === 2 ? documento.referencia : null;
}

function enPesos(
  importe: number,
  referencia: ReferenciaEnPesos,
  { f }: Pick<LenguaDelPdf, 'f'>,
): string | null {
  if (importe < 0 || !Number.isSafeInteger(importe * referencia.cotizacion + 50)) return null;
  return f.pesos(pesosDeDolares(centavosEn('USD', importe), referencia.cotizacion));
}

export function lineaDeLaReferencia(
  importe: number,
  referencia: ReferenciaEnPesos,
  lengua: Pick<LenguaDelPdf, 'm' | 'f'>,
): string | null {
  const { m, f } = lengua;
  const pesos = enPesos(importe, referencia, lengua);
  if (pesos === null) return null;
  return m.presupuesto.valores.referencia(
    pesos,
    f.pesos(referencia.cotizacion),
    f.fechaConAnio(referencia.fecha),
  );
}

export function lineaDeLaReferenciaConLaSena(
  total: number,
  sena: number,
  referencia: ReferenciaEnPesos,
  lengua: Pick<LenguaDelPdf, 'm' | 'f'>,
): string | null {
  const { m, f } = lengua;
  const pesos = enPesos(total, referencia, lengua);
  const deLaSena = enPesos(sena, referencia, lengua);
  if (pesos === null || deLaSena === null) return null;
  return m.presupuesto.valores.referenciaConLaSena(
    pesos,
    deLaSena,
    f.pesos(referencia.cotizacion),
    f.fechaConAnio(referencia.fecha),
  );
}

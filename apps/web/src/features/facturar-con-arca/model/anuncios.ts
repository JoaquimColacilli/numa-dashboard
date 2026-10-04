import { numeroDe, type Comprobante } from '@/entities/factura';
import { mensajes } from '@/shared/idioma';

export function firmaDeLosEstados(comprobantes: readonly Comprobante[]): string {
  return comprobantes.map((comprobante) => `${comprobante.id}:${comprobante.estado}`).join(',');
}

function anuncioDe(comprobante: Comprobante, comprobantes: readonly Comprobante[]): string | null {
  const m = mensajes().facturacion.anuncios;
  if (comprobante.tipo === 'factura_c') {
    switch (comprobante.estado) {
      case 'autorizada':
        return m.autorizada(numeroDe(comprobante));
      case 'anulada':
        return m.anulada(numeroDe(comprobante));
      case 'rechazada':
        return m.rechazada;
      case 'a_revisar':
        return m.aRevisar;
      default:
        return null;
    }
  }
  if (comprobante.estado === 'a_revisar') return m.aRevisar;
  if (comprobante.estado !== 'rechazada') return null;
  const factura = comprobantes.find((una) => una.id === comprobante.asociado_id);
  return factura === undefined ? m.rechazada : m.notaRechazada(numeroDe(factura));
}

export function anuncioDeLosCambios(
  vistos: readonly Comprobante[],
  comprobantes: readonly Comprobante[],
): string | null {
  const antes = new Map(vistos.map((comprobante) => [comprobante.id, comprobante.estado]));
  let anuncio: string | null = null;
  for (const comprobante of comprobantes) {
    const previo = antes.get(comprobante.id);
    if (previo === undefined || previo === comprobante.estado) continue;
    anuncio = anuncioDe(comprobante, comprobantes) ?? anuncio;
  }
  return anuncio;
}

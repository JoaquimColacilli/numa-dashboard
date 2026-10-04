import {
  centavos,
  esAmbienteDeArca,
  esEstadoDelComprobante,
  esTipoDeComprobante,
  esUnaFacturaViva,
  MONEDA_DEL_TALLER,
  type ComprobanteQueSuma,
} from '@maun/domain';

import { filasDe, type FilaDe, type Replica } from '@/shared/api';

export type Comprobante = FilaDe<'comprobantes'>;

export const DEMORA_DE_ARCA_MS = 2 * 60 * 60 * 1000;

export type SituacionDelPago =
  | { tipo: 'nada' }
  | { tipo: 'sin-facturar' }
  | { tipo: 'en-dolares' }
  | { tipo: 'en-cola' }
  | { tipo: 'pidiendo'; demora: boolean; prueba: boolean }
  | { tipo: 'autorizada'; factura: Comprobante; prueba: boolean }
  | { tipo: 'anulando'; factura: Comprobante; prueba: boolean }
  | { tipo: 'nota-rechazada'; factura: Comprobante; nota: Comprobante; prueba: boolean }
  | {
      tipo: 'anulada';
      factura: Comprobante;
      nota: Comprobante | null;
      facturable: boolean;
      prueba: boolean;
    }
  | { tipo: 'rechazada'; factura: Comprobante; facturable: boolean; prueba: boolean }
  | { tipo: 'a-revisar'; factura: Comprobante; aRevisar: Comprobante; prueba: boolean };

export interface PagoQueSeMira {
  id: string;
  moneda: string;
  yaEnLaApertura: boolean;
}

export interface TallerQueFactura {
  conectado: boolean;
  enPrueba: boolean;
  monotributista: boolean;
}

export interface PedidosEnLaCola {
  facturas: ReadonlySet<string>;
  notas: ReadonlySet<string>;
}

export interface DatosDeLaSituacion {
  pago: PagoQueSeMira;
  monedaDelTrabajo: string;
  comprobantes: readonly Comprobante[];
  taller: TallerQueFactura;
  enLaCola: PedidosEnLaCola;
  haySenal: boolean;
  ahora?: number;
}

export const NADA_EN_LA_COLA: PedidosEnLaCola = { facturas: new Set(), notas: new Set() };

function porPedido(una: Comprobante, otra: Comprobante): number {
  if (una.pedida_at !== otra.pedida_at) return una.pedida_at < otra.pedida_at ? -1 : 1;
  return una.id < otra.id ? -1 : una.id > otra.id ? 1 : 0;
}

function esFactura(comprobante: Comprobante): boolean {
  return comprobante.tipo === 'factura_c';
}

function estadoDe(comprobante: Comprobante) {
  return esEstadoDelComprobante(comprobante.estado) ? comprobante.estado : null;
}

export function esDePrueba(comprobante: Pick<Comprobante, 'ambiente'>): boolean {
  return comprobante.ambiente === 'homologacion';
}

export function comprobantesDelTaller(replica: Replica): Comprobante[] {
  return [...filasDe(replica, 'comprobantes')].sort(porPedido);
}

export function comprobantesDelPago(replica: Replica, pagoId: string): Comprobante[] {
  return comprobantesDelTaller(replica).filter((comprobante) => comprobante.pago_id === pagoId);
}

export function notasDeLaFactura(
  comprobantes: readonly Comprobante[],
  facturaId: string,
): Comprobante[] {
  return comprobantes.filter(
    (comprobante) => !esFactura(comprobante) && comprobante.asociado_id === facturaId,
  );
}

function puedeFacturarse(
  pago: PagoQueSeMira,
  monedaDelTrabajo: string,
  taller: TallerQueFactura,
): boolean {
  return (
    taller.conectado &&
    taller.monotributista &&
    pago.moneda === MONEDA_DEL_TALLER &&
    monedaDelTrabajo === MONEDA_DEL_TALLER &&
    !pago.yaEnLaApertura
  );
}

function deLaFacturaAutorizada(
  factura: Comprobante,
  notas: readonly Comprobante[],
  notaEnLaCola: boolean,
): SituacionDelPago {
  const prueba = esDePrueba(factura);
  const ultima = notas.at(-1);
  const estado = ultima === undefined ? null : estadoDe(ultima);
  if (notaEnLaCola || estado === 'pedida' || estado === 'emitiendo') {
    return { tipo: 'anulando', factura, prueba };
  }
  if (ultima !== undefined && estado === 'a_revisar') {
    return { tipo: 'a-revisar', factura, aRevisar: ultima, prueba };
  }
  if (ultima !== undefined && estado === 'rechazada') {
    return { tipo: 'nota-rechazada', factura, nota: ultima, prueba };
  }
  return { tipo: 'autorizada', factura, prueba };
}

export function situacionDelPago(datos: DatosDeLaSituacion): SituacionDelPago {
  const { pago, monedaDelTrabajo, taller, enLaCola, haySenal, ahora = Date.now() } = datos;
  const visibles = datos.comprobantes
    .filter((comprobante) => taller.conectado || comprobante.ambiente === 'produccion')
    .filter((comprobante) => comprobante.deleted_at === null)
    .slice()
    .sort(porPedido);
  const facturas = visibles.filter(esFactura);
  const viva = facturas
    .filter((factura) => {
      const estado = estadoDe(factura);
      return estado !== null && esUnaFacturaViva(estado);
    })
    .at(-1);

  if (viva !== undefined) {
    const estado = estadoDe(viva);
    const prueba = esDePrueba(viva);
    if (estado === 'pedida' || estado === 'emitiendo') {
      return {
        tipo: 'pidiendo',
        demora: ahora - Date.parse(viva.pedida_at) > DEMORA_DE_ARCA_MS,
        prueba,
      };
    }
    if (estado === 'a_revisar') return { tipo: 'a-revisar', factura: viva, aRevisar: viva, prueba };
    return deLaFacturaAutorizada(
      viva,
      notasDeLaFactura(visibles, viva.id),
      enLaCola.notas.has(viva.id),
    );
  }

  if (enLaCola.facturas.has(pago.id)) {
    return haySenal
      ? { tipo: 'pidiendo', demora: false, prueba: taller.enPrueba }
      : { tipo: 'en-cola' };
  }

  const facturable = puedeFacturarse(pago, monedaDelTrabajo, taller);
  const ultima = facturas.at(-1);
  if (ultima !== undefined && estadoDe(ultima) === 'anulada') {
    const nota =
      notasDeLaFactura(visibles, ultima.id)
        .filter((una) => estadoDe(una) === 'autorizada')
        .at(-1) ?? null;
    return { tipo: 'anulada', factura: ultima, nota, facturable, prueba: esDePrueba(ultima) };
  }
  if (ultima !== undefined && estadoDe(ultima) === 'rechazada') {
    return { tipo: 'rechazada', factura: ultima, facturable, prueba: esDePrueba(ultima) };
  }

  if (!taller.conectado) return { tipo: 'nada' };
  if (pago.moneda !== MONEDA_DEL_TALLER || monedaDelTrabajo !== MONEDA_DEL_TALLER) {
    return { tipo: 'en-dolares' };
  }
  if (pago.yaEnLaApertura || !taller.monotributista) return { tipo: 'nada' };
  return { tipo: 'sin-facturar' };
}

export function sePuedeFacturar(situacion: SituacionDelPago): boolean {
  switch (situacion.tipo) {
    case 'sin-facturar':
      return true;
    case 'anulada':
    case 'rechazada':
      return situacion.facturable;
    default:
      return false;
  }
}

export function queSuma(comprobante: Comprobante): ComprobanteQueSuma | null {
  const estado = estadoDe(comprobante);
  if (
    estado === null ||
    !esTipoDeComprobante(comprobante.tipo) ||
    !esAmbienteDeArca(comprobante.ambiente) ||
    comprobante.deleted_at !== null
  ) {
    return null;
  }
  return {
    tipo: comprobante.tipo,
    ambiente: comprobante.ambiente,
    estado,
    fecha: comprobante.fecha,
    importe: centavos(comprobante.importe_centavos),
  };
}

export function comprobantesQueSuman(replica: Replica): ComprobanteQueSuma[] {
  return comprobantesDelTaller(replica)
    .map(queSuma)
    .filter((comprobante): comprobante is ComprobanteQueSuma => comprobante !== null);
}

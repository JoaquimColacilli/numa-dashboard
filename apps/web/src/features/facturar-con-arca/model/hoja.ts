import {
  centavos,
  detalleDeLaFactura,
  escalaVigente,
  estadoDelTope,
  facturadoEnLosUltimos12Meses,
  formatearCuit,
  nombreDelReceptor,
  puntoDeVentaConCeros,
  type CategoriaDelMonotributo,
  type CondicionDelReceptor,
  type ConceptoDeArca,
  type LoQueFaltaParaFacturar,
  type Money,
  type NivelDelTope,
} from '@maun/domain';

import {
  clienteDeLaFactura,
  comprobantesDelPago,
  comprobantesQueSuman,
  documentoParaFacturar,
  facturacionDelTaller,
  faltasParaFacturar,
  tieneUnaFacturaViva,
  type PedidosEnLaCola,
} from '@/entities/factura';
import { resumenDeProyecto, type Pago, type Proyecto } from '@/entities/proyecto';
import { ajustesDe, filaPorId, type Replica } from '@/shared/api';
import { diasHasta } from '@/shared/lib';

export const DIAS_PARA_AVISAR_LA_FECHA = 2;

export interface ReceptorDeLaHoja {
  clienteId: string | null;
  nombre: string;
  condicion: CondicionDelReceptor;
  cuit: string | null;
  dni: string | null;
}

export interface TopeConEstaFactura {
  llevas: Money;
  categoria: CategoriaDelMonotributo;
  tope: Money;
  nivel: NivelDelTope;
}

export interface DatosDeLaHojaDeFacturar {
  pago: Pago;
  proyecto: Proyecto;
  importe: Money;
  detalle: string;
  receptor: ReceptorDeLaHoja;
  faltas: LoQueFaltaParaFacturar[];
  prueba: boolean;
  puntoDeVenta: string;
  concepto: ConceptoDeArca;
  cobroViejo: string | null;
  tope: TopeConEstaFactura | null;
  yaTieneFactura: boolean;
}

function topeConEstaFactura(
  replica: Replica,
  hoy: string,
  importe: Money,
  categoria: CategoriaDelMonotributo,
): TopeConEstaFactura {
  const facturado = facturadoEnLosUltimos12Meses(comprobantesQueSuman(replica), hoy);
  const llevas = centavos(facturado.centavos + importe);
  const estado = estadoDelTope(llevas, categoria, escalaVigente(hoy));
  return { llevas, categoria, tope: estado.tope, nivel: estado.nivel };
}

export function datosDeLaHojaDeFacturar(
  replica: Replica,
  pagoId: string,
  hoy: string,
  enLaCola: PedidosEnLaCola,
): DatosDeLaHojaDeFacturar | null {
  const pago = filaPorId(replica, 'pagos', pagoId);
  if (pago === undefined) return null;
  const proyecto = filaPorId(replica, 'proyectos', pago.proyecto_id);
  if (proyecto === undefined) return null;
  const ajustes = ajustesDe(replica);
  const taller = facturacionDelTaller(ajustes);
  const cliente = clienteDeLaFactura(filaPorId(replica, 'clientes', proyecto.cliente_id));
  const importe = centavos(pago.monto_centavos);
  const loQueSeFactura = {
    ajustes,
    proyecto,
    cliente,
    pago: {
      moneda: pago.moneda,
      borrado: pago.deleted_at !== null,
      yaEnLaApertura: pago.ya_en_la_apertura,
    },
    cobrado: centavos(resumenDeProyecto(replica, proyecto.id, hoy)?.cobradoEnSuMoneda.importe ?? 0),
  };
  const documento = documentoParaFacturar(loQueSeFactura);
  const conCuit =
    ('docTipo' in documento && documento.docTipo === 80) ||
    ('falta' in documento && documento.falta === 'cuit-invalido');
  return {
    pago,
    proyecto,
    importe,
    detalle: detalleDeLaFactura(pago.concepto, proyecto.titulo),
    receptor: {
      clienteId: proyecto.cliente_id,
      nombre: nombreDelReceptor(cliente),
      condicion: cliente.condicion,
      cuit: conCuit ? formatearCuit(cliente.cuit) : null,
      dni: 'docTipo' in documento && documento.docTipo === 96 ? documento.docNro : null,
    },
    faltas: faltasParaFacturar(loQueSeFactura),
    prueba: taller.enPrueba,
    puntoDeVenta: taller.puntoDeVenta === null ? '' : puntoDeVentaConCeros(taller.puntoDeVenta),
    concepto: taller.concepto,
    cobroViejo: diasHasta(pago.fecha, hoy) < -DIAS_PARA_AVISAR_LA_FECHA ? pago.fecha : null,
    tope:
      taller.ambiente === 'produccion' && taller.categoria !== null
        ? topeConEstaFactura(replica, hoy, importe, taller.categoria)
        : null,
    yaTieneFactura:
      enLaCola.facturas.has(pago.id) ||
      tieneUnaFacturaViva(comprobantesDelPago(replica, pago.id), pago.id),
  };
}

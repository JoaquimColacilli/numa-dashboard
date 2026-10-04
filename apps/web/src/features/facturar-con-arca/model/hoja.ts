import {
  centavos,
  CONDICIONES_FISCALES,
  detalleDeLaFactura,
  documentoDelReceptor,
  esCondicionDelReceptor,
  escalaVigente,
  esEstadoDelComprobante,
  esUnaFacturaViva,
  estadoDelTope,
  facturadoEnLosUltimos12Meses,
  formatearCuit,
  loQueFaltaParaFacturar,
  monedaLeida,
  nombreDelReceptor,
  operacionDelTrabajo,
  puntoDeVentaConCeros,
  type CategoriaDelMonotributo,
  type CondicionDelReceptor,
  type CondicionFiscal,
  type ConceptoDeArca,
  type LoQueFaltaParaFacturar,
  type Money,
  type NivelDelTope,
} from '@maun/domain';

import {
  comprobantesDelPago,
  comprobantesQueSuman,
  type PedidosEnLaCola,
} from '@/entities/factura';
import { resumenDeProyecto, type Pago, type Proyecto } from '@/entities/proyecto';
import { ajustesDe, filaPorId, type FilaDe, type Replica } from '@/shared/api';
import { diasHasta } from '@/shared/lib';

import { facturacionDelTaller } from './taller';

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

function condicionDelTaller(valor: string | null | undefined): CondicionFiscal | null {
  return CONDICIONES_FISCALES.find((condicion) => condicion === valor) ?? null;
}

function clienteQueRecibe(cliente: Partial<FilaDe<'clientes'>> | undefined) {
  const condicion = cliente?.condicion_fiscal;
  return {
    condicion: esCondicionDelReceptor(condicion) ? condicion : 'consumidor_final',
    cuit: cliente?.cuit ?? '',
    dni: cliente?.dni ?? '',
    nombre: cliente?.nombre ?? '',
    razonSocial: cliente?.razon_social ?? '',
    domicilioFiscal: cliente?.domicilio_fiscal ?? '',
    direccion: cliente?.direccion ?? '',
  } as const;
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
  const cliente = clienteQueRecibe(filaPorId(replica, 'clientes', proyecto.cliente_id));
  const importe = centavos(pago.monto_centavos);
  const precio =
    proyecto.presupuesto_centavos === null ? null : centavos(proyecto.presupuesto_centavos);
  const cobrado = centavos(
    resumenDeProyecto(replica, proyecto.id, hoy)?.cobradoEnSuMoneda.importe ?? 0,
  );
  const faltas = loQueFaltaParaFacturar({
    taller: {
      condicion: condicionDelTaller(ajustes?.taller_condicion_fiscal),
      razonSocial: ajustes?.taller_titular ?? '',
      domicilio: ajustes?.taller_domicilio ?? '',
      ingresosBrutos: ajustes?.facturacion_ingresos_brutos ?? '',
      inicioDeActividades: ajustes?.facturacion_inicio_de_actividades ?? null,
    },
    trabajo: {
      moneda: monedaLeida(proyecto.moneda),
      borrado: proyecto.deleted_at !== null,
      precio,
      cobrado,
    },
    pago: {
      moneda: monedaLeida(pago.moneda),
      borrado: pago.deleted_at !== null,
      yaEnLaApertura: pago.ya_en_la_apertura,
    },
    cliente,
  });
  const documento = documentoDelReceptor(cliente, operacionDelTrabajo(precio, cobrado));
  const conCuit = 'docTipo' in documento && documento.docTipo === 80;
  const cuitQueNoDa = 'falta' in documento && documento.falta === 'cuit-invalido';
  const yaTieneFactura =
    enLaCola.facturas.has(pago.id) ||
    comprobantesDelPago(replica, pago.id).some(
      (comprobante) =>
        comprobante.tipo === 'factura_c' &&
        comprobante.deleted_at === null &&
        esEstadoDelComprobante(comprobante.estado) &&
        esUnaFacturaViva(comprobante.estado),
    );
  return {
    pago,
    proyecto,
    importe,
    detalle: detalleDeLaFactura(pago.concepto, proyecto.titulo),
    receptor: {
      clienteId: proyecto.cliente_id,
      nombre: nombreDelReceptor(cliente),
      condicion: cliente.condicion,
      cuit: conCuit || cuitQueNoDa ? formatearCuit(cliente.cuit) : null,
      dni: 'docTipo' in documento && documento.docTipo === 96 ? documento.docNro : null,
    },
    faltas,
    prueba: taller.enPrueba,
    puntoDeVenta: taller.puntoDeVenta === null ? '' : puntoDeVentaConCeros(taller.puntoDeVenta),
    concepto: taller.concepto,
    cobroViejo: diasHasta(pago.fecha, hoy) < -DIAS_PARA_AVISAR_LA_FECHA ? pago.fecha : null,
    tope:
      taller.ambiente === 'produccion' && taller.categoria !== null
        ? topeConEstaFactura(replica, hoy, importe, taller.categoria)
        : null,
    yaTieneFactura,
  };
}

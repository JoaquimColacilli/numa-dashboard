import {
  borradorNuevo,
  centavosEn,
  cobraEnLeido,
  combinacionDeLaMoneda,
  CONDICIONES_FISCALES,
  cotizacionLeida,
  documentoDelPresupuesto,
  leerBorrador,
  MONEDA_DEL_TALLER,
  monedaDeLoAbonado,
  plantillaDelTaller,
  plata,
  valoresDelTrabajo,
  type BorradorDelPresupuesto,
  type CombinacionDeLaMoneda,
  type CondicionFiscal,
  type Cotizacion,
  type DatosDelTaller,
  type DocumentoDelPresupuesto,
  type EntradaDelDocumento,
  type Formatos,
  type Moneda,
  type Money,
  type OpcionDelTrabajo,
  type Plata,
  type PlantillaDelPresupuesto,
  type PuntosBasicos,
  type ReferenciaEnPesos,
  type ValoresDelPresupuesto,
} from '@maun/domain';

import type { FilaDelPresupuesto } from '@/entities/presupuesto';
import {
  diasQueValeElPresupuesto,
  dolarDelDiaDelTaller,
  opcionesDelProyecto,
  pagosDelProyecto,
  senaDelProyecto,
  senaDelTaller,
  type Proyecto,
} from '@/entities/proyecto';
import { idiomaDeLosClientes } from '@/entities/replica';
import {
  ajustesDe,
  filaPorId,
  householdDe,
  importeDelPago,
  loQueDescuentaElPago,
  monedaDelTrabajo,
  valorEnPesosDelPago,
  type Replica,
} from '@/shared/api';
import { formatosDelDocumento } from '@/shared/idioma-del-cliente';
import { nombreDelTaller, uuidv7 } from '@/shared/lib';

export function formatosDeLaReplica(replica: Replica): Formatos {
  return formatosDelDocumento(idiomaDeLosClientes(replica));
}

function esCondicionFiscal(valor: unknown): valor is CondicionFiscal {
  return (CONDICIONES_FISCALES as readonly unknown[]).includes(valor);
}

export function plantillaDeLaReplica(replica: Replica): PlantillaDelPresupuesto {
  return plantillaDelTaller(
    ajustesDe(replica)?.plantilla_del_presupuesto,
    idiomaDeLosClientes(replica),
  );
}

export function datosDelTaller(replica: Replica): DatosDelTaller {
  const ajustes = ajustesDe(replica);
  const condicion = ajustes?.taller_condicion_fiscal;
  return {
    nombre: nombreDelTaller(householdDe(replica)?.nombre),
    titular: ajustes?.taller_titular ?? '',
    cuit: ajustes?.taller_cuit ?? '',
    condicionFiscal: esCondicionFiscal(condicion) ? condicion : null,
    domicilio: ajustes?.taller_domicilio ?? '',
    telefono: ajustes?.taller_telefono ?? '',
    email: ajustes?.taller_email ?? '',
  };
}

export function senaDeHoy(replica: Replica, proyecto: Proyecto): PuntosBasicos {
  return senaDelProyecto(proyecto) ?? senaDelTaller(ajustesDe(replica));
}

export function senaEsPropia(proyecto: Proyecto): boolean {
  return senaDelProyecto(proyecto) !== null;
}

export function cobraEnDelTrabajo(proyecto: Proyecto): readonly Moneda[] | null {
  return cobraEnLeido((proyecto as Partial<Proyecto>).cobra_en ?? null);
}

export function combinacionDelTrabajo(proyecto: Proyecto): CombinacionDeLaMoneda | null {
  return combinacionDeLaMoneda(monedaDelTrabajo(proyecto), cobraEnDelTrabajo(proyecto));
}

function monedaDelTrabajoDeLaReplica(replica: Replica, proyectoId: string): Moneda {
  const fila = filaPorId(replica, 'proyectos', proyectoId);
  return fila === undefined ? MONEDA_DEL_TALLER : monedaDelTrabajo(fila);
}

export function abonadoDeHoy(replica: Replica, proyectoId: string, en?: Moneda): Money<Moneda> {
  const delTrabajo = monedaDelTrabajoDeLaReplica(replica, proyectoId);
  const moneda = en ?? delTrabajo;
  let total = 0;
  for (const pago of pagosDelProyecto(replica, proyectoId)) {
    const importe = importeDelPago(pago);
    total +=
      moneda === delTrabajo
        ? loQueDescuentaElPago(importe, delTrabajo)
        : valorEnPesosDelPago(importe);
  }
  return centavosEn(moneda, total);
}

export function monedaDeLoAbonadoDeHoy(
  proyecto: Proyecto,
  borrador: Pick<BorradorDelPresupuesto, 'monedaDeLoAbonado'>,
): Moneda {
  return monedaDeLoAbonado(borrador, monedaDelTrabajo(proyecto));
}

export function opcionesDeHoy(replica: Replica, proyectoId: string): OpcionDelTrabajo<Moneda>[] {
  const moneda = monedaDelTrabajoDeLaReplica(replica, proyectoId);
  return opcionesDelProyecto(replica, proyectoId).map((opcion) => ({
    id: opcion.id,
    descripcion: opcion.descripcion,
    monto: centavosEn(moneda, opcion.monto_centavos),
  }));
}

export function totalDeHoy(proyecto: Proyecto): Money<Moneda> | null {
  return proyecto.presupuesto_centavos === null
    ? null
    : centavosEn(monedaDelTrabajo(proyecto), proyecto.presupuesto_centavos);
}

export function precioDeHoy(proyecto: Proyecto): Plata | null {
  return proyecto.presupuesto_centavos === null
    ? null
    : plata(monedaDelTrabajo(proyecto), proyecto.presupuesto_centavos);
}

export function referenciaDelTaller(replica: Replica): ReferenciaEnPesos | null {
  const delDia = dolarDelDiaDelTaller(replica);
  const cotizacion = cotizacionLeida(delDia?.valor ?? null);
  return delDia === null || cotizacion === null ? null : { cotizacion, fecha: delDia.fecha };
}

export function dolarDeHoy(replica: Replica, hoy: string): Cotizacion | null {
  const referencia = referenciaDelTaller(replica);
  return referencia !== null && referencia.fecha === hoy ? referencia.cotizacion : null;
}

export function nombreDelCliente(replica: Replica, proyecto: Proyecto): string {
  return filaPorId(replica, 'clientes', proyecto.cliente_id)?.nombre ?? '';
}

export function borradorParaEmpezar(replica: Replica, proyecto: Proyecto): BorradorDelPresupuesto {
  return borradorNuevo({
    titulo: proyecto.titulo,
    obra: proyecto.direccion_entrega,
    plantilla: plantillaDeLaReplica(replica),
    validezDias: diasQueValeElPresupuesto(ajustesDe(replica)),
    idNuevo: uuidv7,
  });
}

export function borradorGuardado(
  replica: Replica,
  proyecto: Proyecto,
  presupuesto: FilaDelPresupuesto | null,
): BorradorDelPresupuesto {
  if (presupuesto === null) return borradorParaEmpezar(replica, proyecto);
  return (
    leerBorrador(presupuesto.contenido, plantillaDeLaReplica(replica)) ??
    borradorParaEmpezar(replica, proyecto)
  );
}

function valoresEn<M extends Moneda>(
  moneda: M,
  total: number | null,
  opciones: readonly OpcionDelTrabajo<Moneda>[],
): ValoresDelPresupuesto<M> | null {
  return valoresDelTrabajo<M>(
    total === null ? null : centavosEn(moneda, total),
    opciones.map((opcion) => ({ ...opcion, monto: centavosEn(moneda, opcion.monto) })),
  );
}

export interface EntradaDeHoy {
  replica: Replica;
  proyecto: Proyecto;
  borrador: BorradorDelPresupuesto;
  total?: Money<Moneda> | null;
  opciones?: readonly OpcionDelTrabajo<Moneda>[];
  abonado?: Money<Moneda>;
  referencia?: ReferenciaEnPesos | null;
}

export function entradaDeHoy({
  replica,
  proyecto,
  borrador,
  total = totalDeHoy(proyecto),
  opciones = opcionesDeHoy(replica, proyecto.id),
  abonado = abonadoDeHoy(replica, proyecto.id, monedaDeLoAbonadoDeHoy(proyecto, borrador)),
  referencia = referenciaDelTaller(replica),
}: EntradaDeHoy): EntradaDelDocumento {
  const comun = {
    borrador,
    plantilla: plantillaDeLaReplica(replica),
    taller: datosDelTaller(replica),
    cliente: nombreDelCliente(replica, proyecto),
    cobraEn: cobraEnDelTrabajo(proyecto),
    senaBp: senaDeHoy(replica, proyecto),
    abonado,
  };
  if (monedaDelTrabajo(proyecto) === MONEDA_DEL_TALLER) {
    return {
      ...comun,
      moneda: MONEDA_DEL_TALLER,
      valores: valoresEn(MONEDA_DEL_TALLER, total, opciones),
    };
  }
  return { ...comun, moneda: 'USD', valores: valoresEn('USD', total, opciones), referencia };
}

export function documentoDeHoy(entrada: EntradaDeHoy): DocumentoDelPresupuesto {
  return documentoDelPresupuesto(entradaDeHoy(entrada), formatosDeLaReplica(entrada.replica));
}

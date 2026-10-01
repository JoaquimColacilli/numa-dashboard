import {
  borradorNuevo,
  centavos,
  CONDICIONES_FISCALES,
  documentoDelPresupuesto,
  leerBorrador,
  plantillaDelTaller,
  sumarTodos,
  valoresDelTrabajo,
  type BorradorDelPresupuesto,
  type CondicionFiscal,
  type DatosDelTaller,
  type DocumentoDelPresupuesto,
  type EntradaDelDocumento,
  type Formatos,
  type Money,
  type OpcionDelTrabajo,
  type PlantillaDelPresupuesto,
  type PuntosBasicos,
} from '@maun/domain';

import type { FilaDelPresupuesto } from '@/entities/presupuesto';
import {
  diasQueValeElPresupuesto,
  opcionesDelProyecto,
  pagosDelProyecto,
  senaDelProyecto,
  senaDelTaller,
  type Proyecto,
} from '@/entities/proyecto';
import { ajustesDe, filaPorId, householdDe, type Replica } from '@/shared/api';
import { formatearPesos, formatearPorcentaje, nombreDelTaller, uuidv7 } from '@/shared/lib';

export const FORMATOS_DE_LA_APP: Formatos = {
  plata: (importe) => formatearPesos(importe),
  porcentaje: formatearPorcentaje,
};

function esCondicionFiscal(valor: unknown): valor is CondicionFiscal {
  return (CONDICIONES_FISCALES as readonly unknown[]).includes(valor);
}

export function plantillaDeLaReplica(replica: Replica): PlantillaDelPresupuesto {
  return plantillaDelTaller(ajustesDe(replica)?.plantilla_del_presupuesto);
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

export function abonadoDeHoy(replica: Replica, proyectoId: string): Money {
  return sumarTodos(
    pagosDelProyecto(replica, proyectoId).map((pago) => centavos(pago.monto_centavos)),
  );
}

export function opcionesDeHoy(replica: Replica, proyectoId: string): OpcionDelTrabajo[] {
  return opcionesDelProyecto(replica, proyectoId).map((opcion) => ({
    id: opcion.id,
    descripcion: opcion.descripcion,
    monto: centavos(opcion.monto_centavos),
  }));
}

export function totalDeHoy(proyecto: Proyecto): Money | null {
  return proyecto.presupuesto_centavos === null ? null : centavos(proyecto.presupuesto_centavos);
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

export interface EntradaDeHoy {
  replica: Replica;
  proyecto: Proyecto;
  borrador: BorradorDelPresupuesto;
  total?: Money | null;
  opciones?: readonly OpcionDelTrabajo[];
  abonado?: Money;
}

export function entradaDeHoy({
  replica,
  proyecto,
  borrador,
  total = totalDeHoy(proyecto),
  opciones = opcionesDeHoy(replica, proyecto.id),
  abonado = abonadoDeHoy(replica, proyecto.id),
}: EntradaDeHoy): EntradaDelDocumento {
  return {
    borrador,
    plantilla: plantillaDeLaReplica(replica),
    taller: datosDelTaller(replica),
    cliente: nombreDelCliente(replica, proyecto),
    moneda: 'ARS',
    cobraEn: null,
    valores: valoresDelTrabajo(total, opciones),
    senaBp: senaDeHoy(replica, proyecto),
    abonado,
  };
}

export function documentoDeHoy(entrada: EntradaDeHoy): DocumentoDelPresupuesto {
  return documentoDelPresupuesto(entradaDeHoy(entrada), FORMATOS_DE_LA_APP);
}

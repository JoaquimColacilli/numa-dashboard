import {
  centavos,
  escalaVigente,
  estadoDelTope,
  facturadoEnLosUltimos12Meses,
  MONEDA_DEL_TALLER,
  proximaRecategorizacion,
  type CategoriaDelMonotributo,
  type EstadoDelTope,
  type Money,
} from '@maun/domain';

import {
  comprobantesQueSuman,
  facturacionDelTaller,
  pagosConFacturaDeVerdad,
} from '@/entities/factura';
import type { Pago, Proyecto } from '@/entities/proyecto';
import { ajustesDe, filasDe, type Replica } from '@/shared/api';

export interface CobroSinFacturar {
  pago: Pago;
  proyecto: Proyecto;
}

export interface DatosDelMonotributo {
  prueba: boolean;
  categoria: CategoriaDelMonotributo | null;
  facturado: Money;
  desde: string;
  tope: EstadoDelTope | null;
  proximaRecategorizacion: string;
  facturacionDesde: string | null;
  sinFacturar: CobroSinFacturar[];
}

export function cobrosSinFacturar(replica: Replica, desde: string | null): CobroSinFacturar[] {
  const facturados = pagosConFacturaDeVerdad(replica);
  const proyectos = new Map(
    filasDe(replica, 'proyectos')
      .filter((proyecto) => proyecto.deleted_at === null)
      .map((proyecto) => [proyecto.id, proyecto]),
  );
  const cobros: CobroSinFacturar[] = [];
  for (const pago of filasDe(replica, 'pagos')) {
    const proyecto = proyectos.get(pago.proyecto_id);
    if (
      proyecto === undefined ||
      pago.deleted_at !== null ||
      pago.ya_en_la_apertura ||
      pago.moneda !== MONEDA_DEL_TALLER ||
      proyecto.moneda !== MONEDA_DEL_TALLER ||
      (desde !== null && pago.fecha < desde) ||
      facturados.has(pago.id)
    ) {
      continue;
    }
    cobros.push({ pago, proyecto });
  }
  return cobros.sort((uno, otro) =>
    uno.pago.fecha !== otro.pago.fecha
      ? uno.pago.fecha < otro.pago.fecha
        ? -1
        : 1
      : uno.pago.id < otro.pago.id
        ? -1
        : 1,
  );
}

export function datosDelMonotributo(replica: Replica, hoy: string): DatosDelMonotributo | null {
  const taller = facturacionDelTaller(ajustesDe(replica));
  if (!taller.conectado) return null;
  const facturado = facturadoEnLosUltimos12Meses(comprobantesQueSuman(replica), hoy);
  const enLosDoce = taller.enPrueba ? centavos(0) : facturado.centavos;
  return {
    prueba: taller.enPrueba,
    categoria: taller.categoria,
    facturado: enLosDoce,
    desde: facturado.desde,
    tope:
      taller.categoria === null
        ? null
        : estadoDelTope(enLosDoce, taller.categoria, escalaVigente(hoy)),
    proximaRecategorizacion: proximaRecategorizacion(hoy),
    facturacionDesde: taller.desde,
    sinFacturar: cobrosSinFacturar(replica, taller.desde),
  };
}

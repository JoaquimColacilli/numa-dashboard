import {
  centavos,
  faseDe,
  plata,
  sumarTodos,
  type Fase,
  type Moneda,
  type Money,
  type Plata,
} from '@maun/domain';

import {
  filasDe,
  monedaDelTrabajo,
  totalesPorProyecto,
  type EnUnTesoroEnDolares,
  type FilaDe,
  type Replica,
} from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import { enLista, formatearPesos, formatearPlata } from '@/shared/lib';

import type { Gasto, Pago, Proyecto } from './catalogos';
import {
  entregaDelResumen,
  urgenciaDeEntrega,
  type EntregaDelResumen,
  type Urgencia,
} from './entrega';

export interface ResumenDeProyecto {
  proyecto: Proyecto;
  cliente: FilaDe<'clientes'> | undefined;
  nombreDelCliente: string;
  fase: Fase;
  moneda: Moneda;
  precio: Plata;
  cobradoEnSuMoneda: Plata;
  cobradoEnPesos: Money;
  enMaun: Money;
  enDolares: readonly EnUnTesoroEnDolares[];
  gastos: Money;
  saldo: Plata | null;
  entrega: EntregaDelResumen;
  urgencia: Urgencia | undefined;
}

export function saldoDelPrecio(precio: number | null, cobrado: Plata): Plata | null {
  return precio === null ? null : plata(cobrado.moneda, Math.max(0, precio - cobrado.importe));
}

export function resumenesDeProyectos(replica: Replica, hoy: string): ResumenDeProyecto[] {
  const totales = totalesPorProyecto(replica);
  const clientes = new Map(filasDe(replica, 'clientes').map((cliente) => [cliente.id, cliente]));
  const sinCliente = mensajes().proyecto.clienteBorrado;

  return filasDe(replica, 'proyectos').map((proyecto) => {
    const cliente = clientes.get(proyecto.cliente_id);
    const entrega = entregaDelResumen(proyecto);
    const moneda = monedaDelTrabajo(proyecto);
    const delTrabajo = totales.get(proyecto.id);
    const cobradoEnSuMoneda = delTrabajo?.cobradoEnSuMoneda ?? plata(moneda, 0);

    return {
      proyecto,
      cliente,
      nombreDelCliente: cliente?.nombre ?? sinCliente,
      fase: faseDe(proyecto.estado),
      moneda,
      precio: plata(moneda, proyecto.presupuesto_centavos ?? 0),
      cobradoEnSuMoneda,
      cobradoEnPesos: delTrabajo?.cobradoEnPesos ?? centavos(0),
      enMaun: delTrabajo?.enMaun ?? centavos(0),
      enDolares: delTrabajo?.enDolares ?? [],
      gastos: delTrabajo?.gastos ?? centavos(0),
      saldo: saldoDelPrecio(proyecto.presupuesto_centavos, cobradoEnSuMoneda),
      entrega,
      urgencia: urgenciaDeEntrega(entrega.fecha, proyecto.estado, hoy),
    };
  });
}

export function loCobradoEnPalabras(
  resumen: Pick<ResumenDeProyecto, 'cobradoEnPesos' | 'enMaun' | 'enDolares'>,
): string {
  const dolares = sumarTodos<'USD'>(resumen.enDolares.map((uno) => uno.monto));
  if (dolares === 0) return formatearPesos(resumen.cobradoEnPesos);
  const partes = [
    ...(resumen.enMaun > 0 ? [formatearPesos(resumen.enMaun)] : []),
    formatearPlata(dolares, 'USD'),
  ];
  return mensajes().proyecto.plata.conSuValorEnPesos(
    enLista(partes),
    formatearPesos(resumen.cobradoEnPesos),
  );
}

export function resumenDeProyecto(
  replica: Replica,
  proyectoId: string,
  hoy: string,
): ResumenDeProyecto | undefined {
  return resumenesDeProyectos(replica, hoy).find((resumen) => resumen.proyecto.id === proyectoId);
}

function delProyecto<T extends Pago | Gasto>(filas: readonly T[], proyectoId: string): T[] {
  return filas
    .filter((fila) => fila.proyecto_id === proyectoId)
    .sort((uno, otro) =>
      uno.fecha < otro.fecha ? -1 : uno.fecha > otro.fecha ? 1 : uno.id < otro.id ? -1 : 1,
    );
}

export function pagosDelProyecto(replica: Replica, proyectoId: string): Pago[] {
  return delProyecto(filasDe(replica, 'pagos'), proyectoId);
}

export function gastosDelProyecto(replica: Replica, proyectoId: string): Gasto[] {
  return delProyecto(filasDe(replica, 'gastos'), proyectoId);
}

export interface MetricasDeProyectos {
  total: number;
  enCurso: number;
  entregadosConSaldo: number;
  cobrados: number;
}

export function metricasDeProyectos(resumenes: readonly ResumenDeProyecto[]): MetricasDeProyectos {
  let total = 0;
  let enCurso = 0;
  let entregadosConSaldo = 0;
  let cobrados = 0;

  for (const resumen of resumenes) {
    if (resumen.fase === 'activos' || resumen.fase === 'historial') total += 1;
    if (resumen.proyecto.estado === 'en_curso') enCurso += 1;
    if (resumen.proyecto.estado === 'entregado' && (resumen.saldo?.importe ?? 0) > 0) {
      entregadosConSaldo += 1;
    }
    if (resumen.proyecto.estado === 'cobrado') cobrados += 1;
  }

  return { total, enCurso, entregadosConSaldo, cobrados };
}

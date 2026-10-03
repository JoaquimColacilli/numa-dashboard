import { faseDe, plata, type EstadoProyecto, type Plata } from '@maun/domain';

import {
  filasDe,
  monedaDelTrabajo,
  totalesPorProyecto,
  type FilaDe,
  type Replica,
} from '@/shared/api';
import { porMoneda } from '@/shared/lib';

import type { Cliente } from './catalogos';

export type Proyecto = FilaDe<'proyectos'>;

const ESTADOS_CON_SALDO: readonly EstadoProyecto[] = ['en_curso', 'entregado'];

export interface ResumenDeCliente {
  cliente: Cliente;
  proyectos: readonly Proyecto[];
  enConsultas: number;
  facturados: number;
  ultimo: Proyecto | undefined;
  fechaDelUltimo: string | undefined;
  facturado: readonly Plata[];
  saldo: readonly Plata[];
}

export function fechaDelProyecto(proyecto: Proyecto): string | undefined {
  return (
    proyecto.fecha_cobro ??
    proyecto.fecha_entrega ??
    proyecto.fecha_inicio ??
    proyecto.fecha_visita ??
    proyecto.ultimo_contacto ??
    undefined
  );
}

function masReciente(uno: Proyecto, otro: Proyecto): number {
  const a = fechaDelProyecto(otro) ?? '';
  const b = fechaDelProyecto(uno) ?? '';
  if (a !== b) return a < b ? -1 : 1;
  return uno.id < otro.id ? 1 : -1;
}

export function resumenesDeClientes(replica: Replica): ResumenDeCliente[] {
  const totales = totalesPorProyecto(replica);
  const porCliente = new Map<string, Proyecto[]>();
  for (const proyecto of filasDe(replica, 'proyectos')) {
    const lista = porCliente.get(proyecto.cliente_id);
    if (lista) lista.push(proyecto);
    else porCliente.set(proyecto.cliente_id, [proyecto]);
  }

  return filasDe(replica, 'clientes').map((cliente) => {
    const proyectos = (porCliente.get(cliente.id) ?? []).sort(masReciente);

    const facturado: Plata[] = [];
    const saldo: Plata[] = [];
    let facturados = 0;
    for (const proyecto of proyectos) {
      if (faseDe(proyecto.estado) === 'consultas' || faseDe(proyecto.estado) === 'seguimiento')
        continue;
      facturados += 1;
      const moneda = monedaDelTrabajo(proyecto);
      const precio = proyecto.presupuesto_centavos ?? 0;
      facturado.push(plata(moneda, precio));
      if (!ESTADOS_CON_SALDO.includes(proyecto.estado)) continue;
      const cobrado = totales.get(proyecto.id)?.cobradoEnSuMoneda.importe ?? 0;
      if (precio - cobrado > 0) saldo.push(plata(moneda, precio - cobrado));
    }

    const ultimo = proyectos[0];
    return {
      cliente,
      proyectos,
      enConsultas: proyectos.length - facturados,
      facturados,
      ultimo,
      fechaDelUltimo: ultimo ? fechaDelProyecto(ultimo) : undefined,
      facturado: porMoneda(facturado),
      saldo: porMoneda(saldo),
    };
  });
}

export function resumenDeCliente(
  replica: Replica,
  clienteId: string,
): ResumenDeCliente | undefined {
  return resumenesDeClientes(replica).find((resumen) => resumen.cliente.id === clienteId);
}

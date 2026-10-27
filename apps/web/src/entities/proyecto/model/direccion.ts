import { direccionDelPresupuesto, type DireccionDelPresupuesto } from '@maun/domain';

import { filaPorId, type Replica } from '@/shared/api';

import type { GuardadoDeProyecto } from '../api/mutacion';
import type { Proyecto } from './catalogos';
import { datosActualesDelProyecto } from './liquidacion';

export function direccionDelTrabajo(replica: Replica, proyecto: Proyecto): DireccionDelPresupuesto {
  const cliente = filaPorId(replica, 'clientes', proyecto.cliente_id);
  return direccionDelPresupuesto(proyecto.direccion_entrega, cliente?.direccion ?? '');
}

export function guardadoDeLaDireccion(proyecto: Proyecto, direccion: string): GuardadoDeProyecto {
  return {
    pedido: {
      id: proyecto.id,
      version: proyecto.version,
      datos: { ...datosActualesDelProyecto(proyecto), direccion_entrega: direccion.trim() },
      pagos: [],
      gastos: [],
    },
    previos: { proyecto, pagos: [], gastos: [], opciones: [], necesidades: [] },
  };
}

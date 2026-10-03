import {
  baseDeLasEstadisticas,
  type BaseDeLasEstadisticas,
  type PeriodoResuelto,
} from '@maun/domain';

import { datosDeLasOpiniones } from '@/entities/opinion';
import { datosDeLasEstadisticas, filasDe, type Replica } from '@/shared/api';
import { diaLocal } from '@/shared/lib';

export function baseDeLaReplica(replica: Replica): BaseDeLasEstadisticas {
  const datos = datosDeLasEstadisticas(replica);
  return baseDeLasEstadisticas(
    {
      ...datos,
      necesidades: datos.necesidades.map((necesidad) => ({
        ...necesidad,
        alta: diaLocal(necesidad.alta),
      })),
    },
    datosDeLasOpiniones(replica),
  );
}

export function nombresDeLosClientes(replica: Replica): ReadonlyMap<string, string> {
  return new Map(filasDe(replica, 'clientes').map((cliente) => [cliente.id, cliente.nombre]));
}

export interface DatosDeAntes {
  dejaron: boolean;
  gastos: boolean;
  entregas: boolean;
  consultas: boolean;
  opiniones: boolean;
}

export function datosDeAntes(base: BaseDeLasEstadisticas, resuelto: PeriodoResuelto): DatosDeAntes {
  const antes = (fecha: string) => fecha < resuelto.dias.desde;
  return {
    dejaron: base.liquidaciones.some((liquidacion) => antes(liquidacion.fecha)),
    gastos:
      base.gastosDeLosTrabajos.some((gasto) => antes(gasto.fecha)) ||
      base.gastosDelTaller.some((gasto) => antes(gasto.fecha)) ||
      base.necesidades.some((necesidad) => antes(necesidad.alta)),
    entregas: base.entregas.filas.some((fila) => fila.demora !== null && antes(fila.entregado)),
    consultas: base.consultas.some((consulta) => antes(consulta.entro)),
    opiniones: base.pedidos.some(({ pedido }) => antes(pedido.envio.enviadaEl)),
  };
}

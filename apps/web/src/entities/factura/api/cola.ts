import { useMutationState } from '@tanstack/react-query';

import type { PedidosEnLaCola } from '../model/situacion';
import { CLAVE_DE_LA_FACTURA, CLAVE_DE_LA_NOTA_DE_CREDITO } from './mutacion';

function delPedido(variables: unknown, clave: 'pagoId' | 'facturaId'): string | undefined {
  if (typeof variables !== 'object' || variables === null || !('pedido' in variables)) {
    return undefined;
  }
  const { pedido } = variables;
  if (typeof pedido !== 'object' || pedido === null) return undefined;
  const valor: unknown = Reflect.get(pedido, clave);
  return typeof valor === 'string' ? valor : undefined;
}

function esTexto(valor: string | undefined): valor is string {
  return valor !== undefined;
}

export function usePedidosEnLaCola(): PedidosEnLaCola {
  const facturas = useMutationState({
    filters: { mutationKey: CLAVE_DE_LA_FACTURA, status: 'pending' },
    select: (mutacion) => delPedido(mutacion.state.variables, 'pagoId'),
  });
  const notas = useMutationState({
    filters: { mutationKey: CLAVE_DE_LA_NOTA_DE_CREDITO, status: 'pending' },
    select: (mutacion) => delPedido(mutacion.state.variables, 'facturaId'),
  });
  return {
    facturas: new Set(facturas.filter(esTexto)),
    notas: new Set(notas.filter(esTexto)),
  };
}

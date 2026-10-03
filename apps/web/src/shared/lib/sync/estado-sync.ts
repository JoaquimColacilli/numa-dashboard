import { textosDeLib } from '../textos';

export type EstadoSync =
  | { tipo: 'sin-conexion'; pendientes: number }
  | { tipo: 'pendiente'; pendientes: number }
  | { tipo: 'rechazado'; rechazados: number }
  | { tipo: 'sincronizado' };

export function calcularEstadoSync(
  enLinea: boolean,
  pendientes: number,
  rechazados = 0,
): EstadoSync {
  if (!enLinea) return { tipo: 'sin-conexion', pendientes };
  if (pendientes > 0) return { tipo: 'pendiente', pendientes };
  if (rechazados > 0) return { tipo: 'rechazado', rechazados };
  return { tipo: 'sincronizado' };
}

export function describirEstadoSync(estado: EstadoSync): string {
  const { sync } = textosDeLib();
  switch (estado.tipo) {
    case 'sin-conexion':
      return sync.sinConexion(estado.pendientes);
    case 'pendiente':
      return sync.sincronizando(estado.pendientes);
    case 'rechazado':
      return sync.rechazados(estado.rechazados);
    case 'sincronizado':
      return sync.sincronizado;
  }
}

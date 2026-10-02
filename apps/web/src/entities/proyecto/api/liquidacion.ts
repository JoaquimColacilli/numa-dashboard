import type { EstadoProyecto, PlanDelReparto } from '@maun/domain';
import { useMutationState, type MutationOptions, type QueryClient } from '@tanstack/react-query';

import {
  aplicarFilaLocal,
  debeReintentarse,
  liquidarElProyecto,
  quitarFilaLocal,
  revertirLaLiquidacion,
  traducirRechazo,
  type FilaDe,
  type OperacionRechazada,
  type PedidoDeLiquidacion,
  type PedidoDeReversion,
  type Replica,
} from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import {
  anotarAviso,
  claveDeTodaReplica,
  COLA_DE_SALIDA,
  formatearPesos,
  guardarCacheAhora,
  limpiarRechazosDelProyecto,
  uuidv7,
} from '@/shared/lib';

import { ajusteDeLaLiquidacion } from '../model/liquidacion';
import {
  ajusteDelReparto,
  type AjusteDelReparto,
  type DiferenciaDelReparto,
} from '../model/por-la-fila';
import { rutaDelProyecto } from '../model/rutas';

export const CLAVE_DE_LIQUIDACION = ['proyectos', 'liquidar'] as const;
export const CLAVE_DE_REVERSION = ['proyectos', 'revertir'] as const;

const REINTENTOS = 5;

const DURACION_DEL_RECHAZO_MS = 24 * 60 * 60 * 1000;

export interface LiquidacionDeProyecto {
  pedido: PedidoDeLiquidacion;
  optimista: FilaDe<'proyectos'>;
  previo: FilaDe<'proyectos'>;
  titulo: string;
  repartos?: readonly FilaDe<'repartos'>[];
  plan?: PlanDelReparto;
}

export interface ReversionDeProyecto {
  pedido: PedidoDeReversion;
  optimista: FilaDe<'proyectos'>;
  previo: FilaDe<'proyectos'>;
  titulo: string;
  repartos?: readonly FilaDe<'repartos'>[];
}

export type OperacionDeLiquidacion = 'cobro' | 'cierre' | 'reapertura' | 'reactivacion';

function etiquetaDe(operacion: OperacionDeLiquidacion): string {
  return mensajes().proyecto.liquidacion.operaciones[operacion];
}

export function operacionDeLiquidacion(pedido: PedidoDeLiquidacion): OperacionDeLiquidacion {
  return pedido.destino === 'cobrado' ? 'cobro' : 'cierre';
}

export function operacionDeReversion(pedido: PedidoDeReversion): OperacionDeLiquidacion {
  return pedido.desde === 'cobrado' ? 'reapertura' : 'reactivacion';
}

function cambiarReplicas(cliente: QueryClient, cambio: (replica: Replica) => Replica): void {
  cliente.setQueriesData<Replica>({ queryKey: claveDeTodaReplica() }, (previa) =>
    previa ? cambio(previa) : previa,
  );
}

function anotarElRechazo(
  cliente: QueryClient,
  error: unknown,
  operacion: OperacionDeLiquidacion,
  proyectoId: string,
  titulo: string,
  estado: 'cobrado' | 'perdido',
): Promise<void> {
  const traducido = traducirRechazo(error, {
    operacion: operacion satisfies OperacionRechazada,
    sujeto: titulo,
    estado,
  });
  if (!traducido) return Promise.resolve();

  return anotarAviso(cliente, {
    id: uuidv7(),
    tipo: 'rechazo',
    cuando: new Date().toISOString(),
    operacion: etiquetaDe(operacion),
    sujeto: titulo,
    titulo: traducido.titulo,
    detalle: traducido.queHacer,
    codigo: traducido.codigo,
    proyectoId,
    ruta: rutaDelProyecto(proyectoId),
  });
}

function lineaDeLaDiferencia(diferencia: DiferenciaDelReparto): string {
  const textos = mensajes().proyecto.liquidacion;
  const esperado = formatearPesos(diferencia.esperado);
  const quedo = formatearPesos(diferencia.quedo);
  const previo = formatearPesos(diferencia.yaLlevabaElMes);
  if (diferencia.modo === 'saldo') {
    return textos.diferenciaPorLoQueTenia(diferencia.nombre, esperado, quedo, previo);
  }
  if (diferencia.modo === 'mes' && diferencia.yaLlevabaElMes > 0) {
    return textos.diferenciaPorElMes(diferencia.nombre, esperado, quedo, previo);
  }
  return textos.diferencia(diferencia.nombre, esperado, quedo);
}

function ajusteQueSePuedeLeer(
  fila: FilaDe<'proyectos'>,
  pedido: PedidoDeLiquidacion,
  plan: PlanDelReparto,
  nombres: ReadonlyMap<string, string>,
): AjusteDelReparto | undefined {
  try {
    return ajusteDelReparto(fila, pedido, plan, nombres);
  } catch {
    return undefined;
  }
}

function detalleDelAjuste({
  pedido,
  plan,
  repartos,
}: LiquidacionDeProyecto): (fila: FilaDe<'proyectos'>) => string | undefined {
  return (fila) => {
    const textos = mensajes().proyecto.liquidacion;
    if (pedido.porLaFila !== undefined && plan !== undefined) {
      const nombres = new Map(
        (repartos ?? []).map((reparto) => [reparto.tesoro_id, reparto.nombre]),
      );
      const ajuste = ajusteQueSePuedeLeer(fila, pedido, plan, nombres);
      if (!ajuste) return undefined;
      const lineas = ajuste.diferencias.map(lineaDeLaDiferencia).join(' ');
      if (ajuste.superavit !== null) return lineas;
      const enElTaller = textos.quedoEnElTaller(
        formatearPesos(ajuste.remanenteQuedo),
        formatearPesos(ajuste.remanenteEsperado),
      );
      return `${lineas} ${enElTaller}`;
    }

    const ajuste = ajusteDeLaLiquidacion(fila, pedido);
    if (!ajuste) return undefined;
    const lineas = ajuste.diferencias
      .map((diferencia) =>
        textos.diferenciaPorElMes(
          diferencia.etiqueta,
          formatearPesos(diferencia.esperado),
          formatearPesos(diferencia.quedo),
          formatearPesos(diferencia.yaLlevabaElMes),
        ),
      )
      .join(' ');
    const enElRemanente = textos.quedoEnElRemanente(
      formatearPesos(ajuste.remanenteQuedo),
      formatearPesos(ajuste.remanenteEsperado),
    );
    return `${lineas} ${enElRemanente}`;
  };
}

function anotarElAjuste(
  cliente: QueryClient,
  fila: FilaDe<'proyectos'>,
  variables: LiquidacionDeProyecto,
): Promise<void> {
  const { pedido, titulo } = variables;
  const detalle = detalleDelAjuste(variables)(fila);
  if (detalle === undefined) return Promise.resolve();

  return anotarAviso(cliente, {
    id: uuidv7(),
    tipo: 'ajuste',
    cuando: new Date().toISOString(),
    operacion: etiquetaDe(operacionDeLiquidacion(pedido)),
    sujeto: titulo,
    titulo: mensajes().proyecto.liquidacion.elRepartoSalioDistinto,
    detalle,
    codigo: '',
    proyectoId: pedido.proyectoId,
    ruta: rutaDelProyecto(pedido.proyectoId),
  });
}

export const MUTACION_DE_LIQUIDACION: MutationOptions<
  FilaDe<'proyectos'>,
  unknown,
  LiquidacionDeProyecto
> = {
  mutationKey: CLAVE_DE_LIQUIDACION,
  mutationFn: ({ pedido }) => liquidarElProyecto(pedido),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async ({ optimista, repartos = [] }, { client }) => {
    await client.cancelQueries({ queryKey: claveDeTodaReplica() });
    cambiarReplicas(client, (replica) =>
      repartos.reduce(
        (conRepartos, reparto) => aplicarFilaLocal(conRepartos, 'repartos', reparto),
        aplicarFilaLocal(replica, 'proyectos', optimista),
      ),
    );
    await guardarCacheAhora();
  },
  onSuccess: async (fila, variables, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => aplicarFilaLocal(replica, 'proyectos', fila));
    await limpiarRechazosDelProyecto(client, variables.pedido.proyectoId);
    await anotarElAjuste(client, fila, variables);
  },
  onError: async (error, { pedido, previo, titulo, repartos = [] }, _contexto, { client }) => {
    cambiarReplicas(client, (replica) =>
      repartos.reduce(
        (sinRepartos, reparto) => quitarFilaLocal(sinRepartos, 'repartos', reparto.id),
        aplicarFilaLocal(replica, 'proyectos', previo),
      ),
    );
    await anotarElRechazo(
      client,
      error,
      operacionDeLiquidacion(pedido),
      pedido.proyectoId,
      titulo,
      pedido.destino,
    );
  },
};

export const MUTACION_DE_REVERSION: MutationOptions<
  FilaDe<'proyectos'>,
  unknown,
  ReversionDeProyecto
> = {
  mutationKey: CLAVE_DE_REVERSION,
  mutationFn: ({ pedido }) => revertirLaLiquidacion(pedido),
  scope: COLA_DE_SALIDA,
  gcTime: DURACION_DEL_RECHAZO_MS,
  retry: (intentos, error) => intentos < REINTENTOS && debeReintentarse(error),
  onMutate: async ({ optimista, repartos = [] }, { client }) => {
    await client.cancelQueries({ queryKey: claveDeTodaReplica() });
    cambiarReplicas(client, (replica) =>
      repartos.reduce(
        (sinRepartos, reparto) => quitarFilaLocal(sinRepartos, 'repartos', reparto.id),
        aplicarFilaLocal(replica, 'proyectos', optimista),
      ),
    );
    await guardarCacheAhora();
  },
  onSuccess: async (fila, { pedido }, _contexto, { client }) => {
    cambiarReplicas(client, (replica) => aplicarFilaLocal(replica, 'proyectos', fila));
    await limpiarRechazosDelProyecto(client, pedido.proyectoId);
  },
  onError: async (error, { pedido, previo, titulo, repartos = [] }, _contexto, { client }) => {
    cambiarReplicas(client, (replica) =>
      repartos.reduce(
        (conRepartos, reparto) => aplicarFilaLocal(conRepartos, 'repartos', reparto),
        aplicarFilaLocal(replica, 'proyectos', previo),
      ),
    );
    await anotarElRechazo(
      client,
      error,
      operacionDeReversion(pedido),
      pedido.proyectoId,
      titulo,
      pedido.desde,
    );
  },
};

export interface LiquidacionEnVuelo {
  proyectoId: string;
  operacion: OperacionDeLiquidacion;
  destino: EstadoProyecto;
  enPausa: boolean;
}

function enVuelo(variables: unknown, enPausa: boolean): LiquidacionEnVuelo | undefined {
  if (typeof variables !== 'object' || variables === null || !('pedido' in variables)) {
    return undefined;
  }
  const { pedido } = variables;
  if (typeof pedido !== 'object' || pedido === null || !('proyectoId' in pedido)) return undefined;

  if ('destino' in pedido) {
    const liquidacion = pedido as PedidoDeLiquidacion;
    return {
      proyectoId: liquidacion.proyectoId,
      operacion: operacionDeLiquidacion(liquidacion),
      destino: liquidacion.destino,
      enPausa,
    };
  }

  const reversion = pedido as PedidoDeReversion;
  return {
    proyectoId: reversion.proyectoId,
    operacion: operacionDeReversion(reversion),
    destino: reversion.hacia,
    enPausa,
  };
}

export function useLiquidacionesEnVuelo(): readonly LiquidacionEnVuelo[] {
  return useMutationState({
    filters: { status: 'pending' },
    select: (mutacion) => enVuelo(mutacion.state.variables, mutacion.state.isPaused),
  }).filter((pendiente): pendiente is LiquidacionEnVuelo => pendiente !== undefined);
}

export function useLiquidacionEnVuelo(proyectoId: string): LiquidacionEnVuelo | undefined {
  return useLiquidacionesEnVuelo().find((pendiente) => pendiente.proyectoId === proyectoId);
}

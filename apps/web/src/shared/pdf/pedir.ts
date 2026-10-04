import type {
  FacturaEnPdf,
  PedidoAlTrabajador,
  PresupuestoEnPdf,
  RespuestaDelTrabajador,
} from './tipos';

interface Espera {
  resolver: (archivo: Blob) => void;
  rechazar: (error: Error) => void;
}

let trabajador: Worker | null = null;
let ultimo = 0;
const esperando = new Map<number, Espera>();

function rechazarTodo(motivo: string): void {
  for (const espera of esperando.values()) espera.rechazar(new Error(motivo));
  esperando.clear();
}

function elTrabajador(): Worker {
  if (trabajador !== null) return trabajador;
  const nuevo = new Worker(new URL('./trabajador.ts', import.meta.url), {
    type: 'module',
    name: 'presupuesto-en-pdf',
  });
  nuevo.addEventListener('message', (evento: MessageEvent<RespuestaDelTrabajador>) => {
    const respuesta = evento.data;
    const espera = esperando.get(respuesta.id);
    if (espera === undefined) return;
    esperando.delete(respuesta.id);
    if (respuesta.listo) {
      espera.resolver(new Blob([respuesta.bytes], { type: 'application/pdf' }));
    } else {
      espera.rechazar(new Error(respuesta.motivo));
    }
  });
  nuevo.addEventListener('error', (evento) => {
    trabajador = null;
    nuevo.terminate();
    rechazarTodo(evento.message);
  });
  trabajador = nuevo;
  return nuevo;
}

function pedirAlTrabajador(armar: (id: number) => PedidoAlTrabajador): Promise<Blob> {
  return new Promise((resolver, rechazar) => {
    ultimo += 1;
    const pedido = armar(ultimo);
    esperando.set(pedido.id, { resolver, rechazar });
    elTrabajador().postMessage(pedido);
  });
}

export function generarEnElTrabajador(presupuesto: PresupuestoEnPdf): Promise<Blob> {
  return pedirAlTrabajador((id) => ({ id, presupuesto }));
}

export function generarLaFacturaEnElTrabajador(factura: FacturaEnPdf): Promise<Blob> {
  return pedirAlTrabajador((id) => ({ id, factura }));
}

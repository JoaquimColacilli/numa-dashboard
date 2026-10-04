import plex400 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff?url';
import plex600 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff?url';
import youngSerif from '@fontsource/young-serif/files/young-serif-latin-400-normal.woff?url';
import { pdf } from '@react-pdf/renderer';

import { presupuestoEnSuIdioma } from './enSuIdioma';
import { FacturaPdf } from './factura/Factura';
import { partirEnElIdioma, registrarLasFuentes } from './fuentes';
import type { PedidoAlTrabajador, RespuestaDelTrabajador } from './tipos';

registrarLasFuentes({ plex400, plex600, youngSerif });

function responder(respuesta: RespuestaDelTrabajador, transferir: Transferable[] = []): void {
  self.postMessage(respuesta, { transfer: transferir });
}

async function documentoDe(pedido: PedidoAlTrabajador) {
  if ('factura' in pedido) {
    partirEnElIdioma('es');
    return FacturaPdf(pedido.factura);
  }
  return presupuestoEnSuIdioma(pedido.presupuesto);
}

async function generar(pedido: PedidoAlTrabajador): Promise<void> {
  const { id } = pedido;
  try {
    const archivo = await pdf(await documentoDe(pedido)).toBlob();
    const bytes = await archivo.arrayBuffer();
    responder({ id, listo: true, bytes }, [bytes]);
  } catch (error) {
    responder({ id, listo: false, motivo: error instanceof Error ? error.message : String(error) });
  }
}

let enFila: Promise<void> = Promise.resolve();

self.addEventListener('message', (evento: MessageEvent<PedidoAlTrabajador>) => {
  const pedido = evento.data;
  enFila = enFila.then(() => generar(pedido));
});

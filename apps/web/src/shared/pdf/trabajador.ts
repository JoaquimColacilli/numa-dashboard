import plex400 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff?url';
import plex600 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff?url';
import youngSerif from '@fontsource/young-serif/files/young-serif-latin-400-normal.woff?url';
import { pdf } from '@react-pdf/renderer';

import { PresupuestoPdf } from './Documento';
import { registrarLasFuentes } from './fuentes';
import type { PedidoAlTrabajador, RespuestaDelTrabajador } from './tipos';

registrarLasFuentes({ plex400, plex600, youngSerif });

function responder(respuesta: RespuestaDelTrabajador, transferir: Transferable[] = []): void {
  self.postMessage(respuesta, { transfer: transferir });
}

async function generar({ id, presupuesto }: PedidoAlTrabajador): Promise<void> {
  try {
    const archivo = await pdf(PresupuestoPdf(presupuesto)).toBlob();
    const bytes = await archivo.arrayBuffer();
    responder({ id, listo: true, bytes }, [bytes]);
  } catch (error) {
    responder({ id, listo: false, motivo: error instanceof Error ? error.message : String(error) });
  }
}

self.addEventListener('message', (evento: MessageEvent<PedidoAlTrabajador>) => {
  void generar(evento.data);
});

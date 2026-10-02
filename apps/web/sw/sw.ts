import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
  type PrecacheEntry,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

import { cargaDelPush, RUTA_DE_LA_AGENDA } from './carga';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (PrecacheEntry | string)[];
};

function esPedidoDeActualizar(datos: unknown): boolean {
  return (
    typeof datos === 'object' && datos !== null && 'type' in datos && datos.type === 'SKIP_WAITING'
  );
}

function urlDeLaApp(datos: unknown): string {
  const ruta =
    typeof datos === 'object' && datos !== null && 'url' in datos && typeof datos.url === 'string'
      ? datos.url
      : RUTA_DE_LA_AGENDA;
  const destino = new URL(ruta, self.location.origin);
  return destino.origin === self.location.origin
    ? destino.href
    : new URL(RUTA_DE_LA_AGENDA, self.location.origin).href;
}

const VUELTA_POR_UN_AVISO = 'MAUN_VUELTA_POR_UN_AVISO';
const ESPERA_DE_LA_VENTANA_MS = 500;

function avisarLaVuelta(ventana: WindowClient, url: string): Promise<void> {
  return new Promise((resolver) => {
    const canal = new MessageChannel();
    const reloj = setTimeout(() => {
      resolver();
    }, ESPERA_DE_LA_VENTANA_MS);
    canal.port1.onmessage = () => {
      clearTimeout(reloj);
      resolver();
    };
    ventana.postMessage({ type: VUELTA_POR_UN_AVISO, url }, [canal.port2]);
  });
}

async function abrirLaApp(url: string): Promise<void> {
  const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const ventana = ventanas.find((cliente) => new URL(cliente.url).origin === self.location.origin);
  if (ventana === undefined) {
    await self.clients.openWindow(url);
    return;
  }
  await avisarLaVuelta(ventana, url);
  await ventana.focus().catch(() => null);
}

self.addEventListener('message', (evento) => {
  if (esPedidoDeActualizar(evento.data)) void self.skipWaiting();
});

self.addEventListener('push', (evento) => {
  const carga = cargaDelPush(evento.data);
  evento.waitUntil(
    self.registration.showNotification(carga.titulo, {
      body: carga.cuerpo,
      tag: carga.etiqueta,
      icon: '/numa-192.png',
      badge: '/numa-insignia-96.png',
      lang: carga.lang,
      data: { url: carga.url },
    }),
  );
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  evento.waitUntil(abrirLaApp(urlDeLaApp(evento.notification.data)));
});

const VISTA_PUBLICA = /^\/v\//;

const ENCUESTA_PUBLICA = /^\/o\//;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [VISTA_PUBLICA, ENCUESTA_PUBLICA],
  }),
);

import { expect, test, type Page } from '@playwright/test';

import { entornoDePrueba } from '../apoyo/entorno';
import { listoParaCortar } from '../apoyo/pantalla';
import { iniciarSesionDePrueba } from '../apoyo/taller';

const SIN_ESPERAR_A_LA_RED = { timeout: 5_000 };

async function laReplicaEstaGuardada(page: Page, usuarioId: string): Promise<boolean> {
  return page.evaluate(async (usuario) => {
    const base = await new Promise<IDBDatabase>((resolver, fallar) => {
      const pedido = indexedDB.open('maun');
      pedido.onsuccess = () => {
        resolver(pedido.result);
      };
      pedido.onerror = () => {
        fallar(new Error('no se pudo abrir la base del aparato'));
      };
    });
    try {
      if (!base.objectStoreNames.contains('react-query')) return false;
      const guardado = await new Promise<unknown>((resolver, fallar) => {
        const pedido = base.transaction('react-query').objectStore('react-query').get('cache');
        pedido.onsuccess = () => {
          resolver(pedido.result);
        };
        pedido.onerror = () => {
          fallar(new Error('no se pudo leer lo guardado'));
        };
      });
      const consultas =
        (
          guardado as {
            clientState?: { queries?: { queryKey: unknown[]; state: { data?: unknown } }[] };
          }
        ).clientState?.queries ?? [];
      return consultas.some(
        (consulta) =>
          consulta.queryKey[0] === 'replica' &&
          consulta.queryKey[1] === usuario &&
          consulta.state.data !== undefined,
      );
    } finally {
      base.close();
    }
  }, usuarioId);
}

test('con la réplica guardada y el token vigente, Inicio abre desde lo guardado aunque Supabase no conteste nada', async ({
  page,
}) => {
  const sesion = await iniciarSesionDePrueba();
  await page.goto('/');
  await listoParaCortar(page);
  await expect
    .poll(() => laReplicaEstaGuardada(page, sesion.usuarioId), { timeout: 20_000 })
    .toBe(true);

  const retenidos: string[] = [];
  await page.route(`${entornoDePrueba().url}/**`, (ruta) => {
    retenidos.push(new URL(ruta.request().url()).pathname);
  });
  await page.routeWebSocket(/\/realtime\//, () => undefined);
  await page.evaluate((guardada) => {
    localStorage.setItem('maun.sesion', guardada);
  }, sesion.guardada);

  await page.reload();

  await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible(
    SIN_ESPERAR_A_LA_RED,
  );
  await expect(page.getByRole('region', { name: 'Tesoros' })).toBeVisible();
  await expect(
    page.getByRole('status').filter({ hasText: /Abriendo la app|Trayendo los datos/ }),
  ).toHaveCount(0);
  await expect.poll(() => retenidos.length).toBeGreaterThan(0);

  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

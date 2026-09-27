import { expect, test, type Locator, type Page } from '@playwright/test';

import { entornoDePrueba } from '../apoyo/entorno';

function campoDe(objeto: unknown, campo: string): unknown {
  return typeof objeto === 'object' && objeto !== null && campo in objeto
    ? (objeto as Record<string, unknown>)[campo]
    : undefined;
}

async function abrirElEnlaceDeRecuperacion(page: Page): Promise<unknown> {
  const entorno = entornoDePrueba();
  const respuesta = await fetch(`${entorno.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: entorno.publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: entorno.email, password: entorno.password }),
  });
  expect(respuesta.ok).toBe(true);
  const sesion: unknown = await respuesta.json();

  await page.addInitScript(() => {
    if (localStorage.getItem('maun.sesion-code-verifier') === null) {
      localStorage.setItem(
        'maun.sesion-code-verifier',
        JSON.stringify('verificador-de-prueba-e2e/recovery'),
      );
    }
  });
  await page.route(
    (url) =>
      url.pathname.endsWith('/auth/v1/token') && url.searchParams.get('grant_type') === 'pkce',
    (ruta) => ruta.fulfill({ json: sesion }),
  );

  await page.goto('/acceso/nueva-contrasena?code=codigo-de-prueba-e2e');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Poné una contraseña nueva', {
    timeout: 20_000,
  });
  return sesion;
}

async function guardarSinTocarLaCuenta(page: Page, sesion: unknown): Promise<unknown[]> {
  const pedidos: unknown[] = [];
  await page.route(
    (url) => url.pathname.endsWith('/auth/v1/user'),
    async (ruta) => {
      if (ruta.request().method() !== 'PUT') {
        await ruta.fallback();
        return;
      }
      const cuerpo: unknown = ruta.request().postDataJSON();
      pedidos.push(campoDe(cuerpo, 'password'));
      await ruta.fulfill({ json: campoDe(sesion, 'user') });
    },
  );
  await page.getByLabel('Contraseña nueva', { exact: true }).fill('una-clave-de-prueba');
  await page.getByRole('button', { name: 'Guardar la contraseña' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Listo, ya entraste');
  return pedidos;
}

interface Trazo {
  estado: string;
  duracion: number;
  vueltas: number;
}

function trazosDe(tilde: Locator): Promise<Trazo[]> {
  return tilde.evaluate((nodo) =>
    nodo
      .getAnimations()
      .filter(
        (animacion): animacion is CSSAnimation =>
          animacion instanceof CSSAnimation && animacion.animationName === 'maun-trazo',
      )
      .map((animacion) => {
        const tiempo = animacion.effect?.getComputedTiming();
        return {
          estado: animacion.playState,
          duracion: Number(tiempo?.duration ?? Number.NaN),
          vueltas: tiempo?.iterations ?? Number.NaN,
        };
      }),
  );
}

test('el enlace de recuperación abre el formulario aunque el código se canjee antes de que cargue la pantalla', async ({
  page,
}) => {
  await abrirElEnlaceDeRecuperacion(page);

  await expect(page.getByLabel('Contraseña nueva', { exact: true })).toHaveAttribute(
    'autocomplete',
    'new-password',
  );
  await expect(page.locator('[data-pantalla-de-acceso] aside [data-pose]')).toHaveAttribute(
    'data-pose',
    'pensando',
  );
});

test('al guardar la contraseña nueva, el dibujo levanta el pulgar y su tilde se traza una sola vez', async ({
  page,
}) => {
  const sesion = await abrirElEnlaceDeRecuperacion(page);
  const pedidos = await guardarSinTocarLaCuenta(page, sesion);
  expect(pedidos).toEqual(['una-clave-de-prueba']);

  const hueco = page.locator('[data-pantalla-de-acceso] aside [data-pose]');
  await expect(hueco).toHaveAttribute('data-pose', 'pulgar');
  const tilde = hueco.locator('.trazar');
  await expect(tilde).toHaveCount(1);

  const alLlegar = await trazosDe(tilde);
  expect(alLlegar).toHaveLength(1);
  expect(alLlegar[0]?.vueltas).toBe(1);
  expect(alLlegar[0]?.duracion).toBeGreaterThan(0);

  await expect
    .poll(async () => (await trazosDe(tilde)).map(({ estado }) => estado))
    .toEqual(['finished']);
  await page.waitForTimeout(500);
  expect((await trazosDe(tilde)).map(({ estado }) => estado)).toEqual(['finished']);
  await expect(page.locator('.trazar')).toHaveCount(1);
});

test.describe('con menos movimiento', () => {
  test.use({ reducedMotion: 'reduce' });

  test('la tilde del pulgar aparece hecha', async ({ page }) => {
    const sesion = await abrirElEnlaceDeRecuperacion(page);
    await guardarSinTocarLaCuenta(page, sesion);

    const tilde = page.locator('[data-pantalla-de-acceso] aside [data-pose="pulgar"] .trazar');
    await expect(tilde).toHaveCount(1);
    const trazos = await trazosDe(tilde);
    expect(trazos).toHaveLength(1);
    for (const { duracion } of trazos) expect(duracion).toBeLessThanOrEqual(0.01);
  });
});

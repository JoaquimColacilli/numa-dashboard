import { expect, test, type Page } from '@playwright/test';

import { dedo } from '../apoyo/dedo';
import {
  archivoPorRest,
  contactoPorRpc,
  enlacePorRest,
  guardarProyectoPorRpc,
  iniciarSesionDePrueba,
  leerProyecto,
  vaciarTaller,
  type SesionDePrueba,
} from '../apoyo/taller';
import {
  contarLaMedicion,
  deslizarYMedir,
  exigirQueLlegueAlFinal,
  medirLaVista,
} from '../apoyo/vista';

const CARGA = { timeout: 30_000 };

function hoyLocal(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${String(ahora.getFullYear())}-${mes}-${dia}`;
}

function tokenDePrueba(): string {
  return `e2e-${crypto.randomUUID().replaceAll('-', '')}`;
}

const TITULO = 'Cocina completa con isla y alacenas';

let sesion: SesionDePrueba;

test.beforeEach(async () => {
  sesion = await iniciarSesionDePrueba();
  await vaciarTaller(sesion);
});

async function obraLargaConEnlace(token: string): Promise<string> {
  const { id, clienteId } = await contactoPorRpc(sesion, {
    titulo: TITULO,
    estado: 'presupuesto_enviado',
  });
  const proyecto = await leerProyecto(sesion, TITULO);
  const hoy = hoyLocal();

  await guardarProyectoPorRpc(sesion, {
    proyecto: {
      id,
      version: proyecto?.version ?? null,
      cliente_id: clienteId,
      titulo: TITULO,
      estado: 'en_curso',
      presupuesto_centavos: 398_700_000,
      comprobante: 'sin_comprobante',
      direccion_entrega: 'Av. Rivadavia 15320, Ramos Mejía',
      fecha_inicio: hoy,
      entrega_estimada: hoy,
    },
    pagos: [
      { id: crypto.randomUUID(), fecha: hoy, concepto: 'Seña', monto_centavos: 190_000_000 },
      { id: crypto.randomUUID(), fecha: hoy, concepto: 'Adelanto', monto_centavos: 98_000_000 },
    ],
    gastos: [],
  });

  for (const nombre of ['Plano de frente', 'Render del isla', 'Despiece general']) {
    await archivoPorRest(sesion, { proyectoId: id, nombre, visible: true });
  }

  await enlacePorRest(sesion, id, token);
  return id;
}

function laVista(page: Page) {
  return page.getByRole('region', { name: 'Tu mueble' });
}

test('el enlace del cliente llega hasta el final con el dedo', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'el deslizamiento táctil es del celular');

  const token = tokenDePrueba();
  await obraLargaConEnlace(token);

  await page.goto(`/v/${token}`);
  await expect(laVista(page)).toBeVisible(CARGA);

  const antes = await medirLaVista(page);
  const despues = await deslizarYMedir(page, await dedo(page));

  console.log(
    [
      `\n=== ${testInfo.project.name}: el enlace en una pestaña, sin sesión ===`,
      contarLaMedicion('al abrir', antes),
      contarLaMedicion('después de deslizar', despues),
    ].join('\n'),
  );

  await page.screenshot({
    path: testInfo.outputPath(`vista-scroll-enlace-${testInfo.project.name}.png`),
  });

  await exigirQueLlegueAlFinal(page, despues, 'el enlace en una pestaña, sin sesión');
});

const FOTO = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test('con una foto abierta en el visor, deslizar no mueve la página de atrás', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'el deslizamiento táctil es del celular');

  const token = tokenDePrueba();
  const id = await obraLargaConEnlace(token);
  for (const nombre of ['Frente de la cocina.webp', 'La isla.webp']) {
    await archivoPorRest(sesion, { proyectoId: id, nombre, tipo: 'image/webp', visible: true });
  }
  await page
    .context()
    .route('**/storage/v1/object/public/archivos/**', (ruta) =>
      ruta.fulfill({ status: 200, contentType: 'image/png', body: FOTO }),
    );

  await page.goto(`/v/${token}`);
  await expect(laVista(page)).toBeVisible(CARGA);
  await page
    .getByRole('region', { name: 'Fotos y planos' })
    .getByRole('button', { name: 'Ver Frente de la cocina.webp' })
    .tap();
  const visor = page.getByRole('dialog', { name: 'Frente de la cocina.webp' });
  await expect(visor).toBeVisible();

  const arriba = () => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);
  const antes = await arriba();
  await deslizarYMedir(page, await dedo(page));
  expect(await arriba()).toBe(antes);
  await expect(visor).toBeVisible();

  await visor.getByRole('button', { name: 'Cerrar' }).click();
  await expect(visor).toHaveCount(0);
  const cerrado = await deslizarYMedir(page, await dedo(page));
  expect(cerrado.recorrido).toBeGreaterThan(0);
});

test('el enlace del cliente entra entero en la pantalla ancha', async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.hasTouch), 'esta es la medición de escritorio');

  const token = tokenDePrueba();
  await obraLargaConEnlace(token);

  await page.goto(`/v/${token}`);
  await expect(laVista(page)).toBeVisible(CARGA);

  const antes = await medirLaVista(page);
  await page.evaluate(() => {
    for (const nodo of document.querySelectorAll<HTMLElement>('*')) {
      if (nodo.scrollHeight > nodo.clientHeight) nodo.scrollTop = nodo.scrollHeight;
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await page.waitForTimeout(350);
  const despues = await medirLaVista(page);

  console.log(
    [
      `\n=== ${testInfo.project.name}: el enlace en una pestaña, sin sesión ===`,
      contarLaMedicion('al abrir', antes),
      contarLaMedicion('después de mandar todo al fondo', despues),
    ].join('\n'),
  );

  await page.screenshot({
    path: testInfo.outputPath(`vista-scroll-enlace-${testInfo.project.name}.png`),
  });

  await exigirQueLlegueAlFinal(page, despues, 'el enlace en una pestaña, sin sesión');
});

test('el cliente que entra por el enlace no se baja la app del taller', async ({ page }) => {
  const token = tokenDePrueba();
  await obraLargaConEnlace(token);

  const pedidos: string[] = [];
  page.on('request', (pedido) => {
    const ruta = new URL(pedido.url()).pathname;
    if (/sw\.js|registerSW|manifest\.webmanifest/.test(ruta)) pedidos.push(ruta);
  });

  await page.goto(`/v/${token}`);
  await expect(laVista(page)).toBeVisible(CARGA);
  await page.waitForTimeout(1_000);

  expect(await page.locator('link[rel="manifest"]').count()).toBe(0);
  expect(
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length),
  ).toBe(0);
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(false);
  expect(pedidos, `el enlace pidió ${pedidos.join(', ')}`).toEqual([]);
});

test('en el enlace no queda nada guardado del cliente', async ({ page }) => {
  const token = tokenDePrueba();
  await obraLargaConEnlace(token);

  await page.goto(`/v/${token}`);
  await expect(laVista(page)).toBeVisible(CARGA);
  await page.waitForTimeout(1_000);

  const guardado = await page.evaluate(async () => ({
    local: Object.keys(localStorage),
    bases: (await indexedDB.databases()).map((base) => base.name ?? ''),
  }));

  expect(guardado.local.filter((clave) => clave !== 'maun:tema')).toEqual([]);
  expect(guardado.bases).toEqual([]);
});

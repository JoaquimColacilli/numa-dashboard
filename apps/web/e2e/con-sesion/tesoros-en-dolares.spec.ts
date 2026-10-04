import { expect, type Locator, type Page } from '@playwright/test';

import { test } from '../apoyo/prueba';
import {
  hoyEnElTaller,
  idDelTesoro,
  iniciarSesionDePrueba,
  movimientosPorRest,
  saldoDelTesoro,
  tesorosDelTaller,
  vaciarTaller,
  type SesionDePrueba,
} from '../apoyo/taller';

const CARGA = { timeout: 30_000 };

let sesion: SesionDePrueba;

test.beforeEach(async () => {
  sesion = await iniciarSesionDePrueba();
  await vaciarTaller(sesion);
  await movimientosPorRest(sesion, [
    {
      id: crypto.randomUUID(),
      fecha: hoyEnElTaller(),
      tipo: 'ingreso',
      hacia_id: await idDelTesoro(sesion, 'maun'),
      monto_centavos: 100_000_000,
      categoria: 'Otro',
      descripcion: 'Para probar los dólares',
    },
  ]);
});

test.afterEach(async () => {
  await vaciarTaller(sesion);
});

function lienzo(page: Page): Locator {
  return page.locator('.react-flow.plano');
}

function ficha(page: Page, nombre: RegExp): Locator {
  return lienzo(page).getByRole('group', { name: nombre });
}

function detalleDe(page: Page): Locator {
  return page.getByRole('complementary', { name: 'Detalle' });
}

async function abrirLosTesoros(page: Page): Promise<void> {
  await page.goto('/tesoros');
  await expect(page.getByRole('heading', { level: 1, name: 'Tesoros' })).toBeVisible(CARGA);
  const entendido = page.getByRole('button', { name: 'Entendido' });
  if (await entendido.isVisible()) await entendido.click();
}

async function idDeLosDolares(): Promise<string> {
  const tesoro = (await tesorosDelTaller(sesion)).find((uno) => uno.nombre === 'Dólares');
  if (tesoro === undefined) throw new Error('no está el tesoro en dólares');
  return tesoro.id;
}

async function cargarElCambio(
  page: Page,
  { sale, entra }: { sale: string; entra: string },
): Promise<void> {
  const hoja = page.getByRole('dialog', { name: 'Cargar un movimiento' });
  await expect(hoja).toBeVisible(CARGA);
  await hoja.getByRole('textbox', { name: /^(Pagaste|Vendiste)$/ }).fill(sale);
  await hoja.getByRole('textbox', { name: 'Recibiste' }).fill(entra);
}

test.describe('en la compu', () => {
  test.skip(({ isMobile }) => isMobile, 'el lienzo y su panel son de la compu');

  test('un tesoro en dólares va al estante, no entra a la fila, se compra desde Maun, se vende y se archiva sin dólares', async ({
    page,
  }) => {
    test.setTimeout(300_000);
    await abrirLosTesoros(page);

    await lienzo(page)
      .locator('.react-flow__node[data-id="nuevo"]')
      .getByRole('button', { name: 'Nuevo tesoro' })
      .click();
    const nuevo = page.getByRole('dialog', { name: 'Nuevo tesoro' });
    await nuevo.getByRole('textbox', { name: 'Nombre' }).fill('Dólares');
    await nuevo.getByRole('radio', { name: 'Dólares' }).check();
    await expect(
      nuevo.getByText(
        'La moneda no se cambia después. Un tesoro en dólares va al estante: la fila reparte pesos.',
      ),
    ).toBeVisible();
    await expect(nuevo.getByRole('radio', { name: /^Al estante/ })).toBeChecked();
    await expect(nuevo.getByRole('radio', { name: /^Un porcentaje de cada cobro/ })).toHaveCount(0);
    await nuevo.getByRole('button', { name: 'Crear el tesoro' }).click();
    await expect(nuevo).toHaveCount(0, CARGA);

    const dolares = ficha(page, /^Dólares, en el estante, tiene US\$\s0$/);
    await expect(dolares).toBeVisible(CARGA);
    await dolares.click();
    const sumarlo = detalleDe(page).getByRole('region', { name: 'Sumarlo a la fila' });
    await expect(sumarlo).toContainText(
      'La fila reparte pesos: un tesoro en dólares queda en el estante.',
    );
    await expect(sumarlo.getByRole('button')).toHaveCount(0);

    await ficha(page, /^Compromiso \d de \d: Maun,/).click();
    await detalleDe(page).getByRole('button', { name: 'Comprar dólares' }).click();
    await cargarElCambio(page, { sale: '725.000', entra: '500' });
    const hoja = page.getByRole('dialog', { name: 'Cargar un movimiento' });
    await expect(hoja.getByText('Te quedó a $ 1.450 por dólar.')).toBeVisible();
    await hoja.getByRole('button', { name: 'Cargar el movimiento' }).click();
    await expect(hoja).toHaveCount(0, CARGA);

    await expect
      .poll(async () => saldoDelTesoro(sesion, await idDeLosDolares()), CARGA)
      .toBe(50_000);
    await expect
      .poll(async () => saldoDelTesoro(sesion, await idDelTesoro(sesion, 'maun')), CARGA)
      .toBe(27_500_000);

    await page.goto('/finanzas');
    await expect(page.getByText(/−\$\s725\.000 → \+US\$\s500 · a \$\s1\.450/).first()).toBeVisible(
      CARGA,
    );

    await abrirLosTesoros(page);
    await expect(ficha(page, /^Dólares, en el estante, tiene US\$\s500$/)).toBeVisible(CARGA);

    await page.goto('/');
    await expect(page.getByText('En dólares').first()).toBeVisible(CARGA);
    await expect(
      page.getByText(/≈ \$\s725\.000 a \$\s1\.450, tu última compra/).first(),
    ).toBeVisible();

    await page.goto(
      `/finanzas/nuevo?clase=venta_de_dolares&tesoro=${await idDeLosDolares()}&monto=20000`,
    );
    await cargarElCambio(page, { sale: '200', entra: '290.000' });
    const venta = page.getByRole('dialog', { name: 'Cargar un movimiento' });
    await expect(venta.getByText('Te lo pagaron a $ 1.450 por dólar.')).toBeVisible();
    await venta.getByRole('button', { name: 'Cargar el movimiento' }).click();
    await expect(venta).toHaveCount(0, CARGA);
    await expect
      .poll(async () => saldoDelTesoro(sesion, await idDeLosDolares()), CARGA)
      .toBe(30_000);

    await abrirLosTesoros(page);
    await ficha(page, /^Dólares, en el estante, tiene US\$\s300$/).click();
    await detalleDe(page).getByRole('button', { name: 'Editar Dólares' }).click();
    const editar = page.getByRole('dialog', { name: /Dólares/ });
    await editar.getByRole('button', { name: 'Archivar' }).click();
    const archivar = page.getByRole('dialog', {
      name: /Archivar Dólares|Todavía no se puede archivar/,
    });
    await expect(
      archivar.getByText('Para archivarlo, vendé los dólares o pasalos a otro tesoro en dólares.'),
    ).toBeVisible(CARGA);
    await archivar.getByRole('button', { name: 'Vender dólares' }).click();

    await cargarElCambio(page, { sale: '300', entra: '435.000' });
    const resto = page.getByRole('dialog', { name: 'Cargar un movimiento' });
    await resto.getByRole('button', { name: 'Cargar el movimiento' }).click();
    await expect(resto).toHaveCount(0, CARGA);
    await expect.poll(async () => saldoDelTesoro(sesion, await idDeLosDolares()), CARGA).toBe(0);

    await abrirLosTesoros(page);
    await ficha(page, /^Dólares, en el estante, tiene US\$\s0$/).click();
    await detalleDe(page).getByRole('button', { name: 'Editar Dólares' }).click();
    await page
      .getByRole('dialog', { name: /Dólares/ })
      .getByRole('button', { name: 'Archivar' })
      .click();
    await page.getByRole('button', { name: 'Archivar Dólares' }).click();
    await expect
      .poll(
        async () =>
          (await tesorosDelTaller(sesion, { conLosArchivados: true })).find(
            (tesoro) => tesoro.nombre === 'Dólares',
          )?.archivado_at ?? null,
        CARGA,
      )
      .not.toBeNull();
  });
});

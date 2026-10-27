import { expect, type Page } from '@playwright/test';

import { listoParaCortar } from '../apoyo/pantalla';
import { test } from '../apoyo/prueba';
import {
  hoyEnElTaller,
  iniciarSesionDePrueba,
  leerLaFila,
  tesorosDelTaller,
  vaciarTaller,
  type SesionDePrueba,
} from '../apoyo/taller';

const CARGA = { timeout: 30_000 };

let sesion: SesionDePrueba;

test.beforeEach(async () => {
  sesion = await iniciarSesionDePrueba();
  await vaciarTaller(sesion);
});

async function abrirLosTesoros(page: Page): Promise<void> {
  await page.goto('/tesoros');
  await listoParaCortar(page);
}

test('«Nuevo tesoro» pregunta primero qué es, y una deuda obligatoria entra con su día de pago y se paga sola', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'el estante con «Nuevo tesoro» es del lienzo');
  test.setTimeout(120_000);
  await abrirLosTesoros(page);
  await page.getByRole('button', { name: 'Nuevo tesoro' }).first().click();
  const hoja = page.getByRole('dialog', { name: 'Nuevo tesoro' });
  await expect(hoja.getByRole('group', { name: '¿Qué es?' })).toBeVisible();
  await expect(hoja.getByRole('radio', { name: /^Caja/ })).toBeVisible();
  await expect(hoja.getByRole('radio', { name: /^Deuda destinada/ })).toBeVisible();
  await expect(hoja.getByRole('radio', { name: /^Meta/ })).toBeVisible();

  await hoja.getByRole('radio', { name: /^Deuda obligatoria/ }).click();
  await expect(hoja.getByRole('button', { name: 'Qué es una deuda obligatoria' })).toBeVisible();
  await hoja.getByRole('textbox', { name: 'Nombre', exact: true }).fill('Alquiler del galpón');
  await hoja.getByLabel('Tope').fill('300.000');
  await hoja.getByLabel('Día de pago').fill('15');
  await expect(hoja.getByRole('switch', { name: 'Se paga sola' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await hoja.getByRole('button', { name: 'Crear el tesoro' }).click();
  await expect(hoja).toBeHidden(CARGA);

  let alquiler: string | undefined;
  await expect
    .poll(async () => {
      alquiler = (await tesorosDelTaller(sesion)).find(
        (tesoro) => tesoro.nombre === 'Alquiler del galpón',
      )?.id;
      return alquiler !== undefined;
    }, CARGA)
    .toBe(true);

  await expect
    .poll(async () => {
      const { fila } = await leerLaFila(sesion);
      const paso = (fila as { pasos?: Record<string, unknown>[] } | null)?.pasos?.find(
        (uno) => uno.tesoro === alquiler,
      );
      return paso === undefined ? null : [paso.tope, paso.dia, paso.pagaSola, paso.pagaSolaDesde];
    }, CARGA)
    .toEqual([30_000_000, 15, true, hoyEnElTaller()]);
});

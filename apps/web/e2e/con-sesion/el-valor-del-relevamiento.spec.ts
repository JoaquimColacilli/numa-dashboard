import { expect } from '@playwright/test';

import { test } from '../apoyo/prueba';
import { listoParaCortar } from '../apoyo/pantalla';
import {
  contactoPorRpc,
  enlacePorRest,
  escribirAjustes,
  iniciarSesionDePrueba,
  leerAjustes,
  vaciarTaller,
  type SesionDePrueba,
} from '../apoyo/taller';

const CARGA = { timeout: 30_000 };

let sesion: SesionDePrueba;

test.beforeEach(async () => {
  sesion = await iniciarSesionDePrueba();
  await vaciarTaller(sesion);
  await escribirAjustes(sesion, { relevamiento_centavos: 12_000_000 });
});

test.afterEach(async () => {
  await escribirAjustes(sesion, { relevamiento_centavos: 12_000_000 });
});

function tokenDePrueba(): string {
  return `e2e-${crypto.randomUUID().replaceAll('-', '')}`;
}

test('en «Tu taller» el valor del relevamiento se cambia y se vacía, y la página del cliente lo sigue', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'una sola vez por corrida');
  test.setTimeout(120_000);

  const token = tokenDePrueba();
  const { id } = await contactoPorRpc(sesion, {
    titulo: 'Cocina - Quilmes',
    estado: 'presupuesto_estimativo',
  });
  await enlacePorRest(sesion, id, token);

  await page.goto('/ajustes');
  await listoParaCortar(page);
  const taller = page.getByRole('region', { name: 'Tu taller' });
  const campo = taller.getByLabel('Valor del relevamiento');
  await expect(campo).toHaveValue('120.000', CARGA);
  await expect(taller).toContainText(
    'Tu cliente lo ve en su página mientras falta ir a medir. Si lo dejás vacío, ve qué es el relevamiento pero no el precio.',
  );

  await campo.fill('150.000');
  await taller.getByRole('button', { name: 'Guardar la configuración' }).click();
  await expect(taller).toContainText('Guardado.', CARGA);
  await expect
    .poll(async () => (await leerAjustes(sesion)).relevamiento_centavos, CARGA)
    .toBe(15_000_000);

  const bloque = page.getByRole('region', { name: 'Relevamiento técnico' });
  await page.goto(`/v/${token}`);
  await expect(bloque).toContainText('El valor del relevamiento es de $ 150.000', CARGA);

  await page.goto('/ajustes');
  await listoParaCortar(page);
  await campo.fill('');
  await taller.getByRole('button', { name: 'Guardar la configuración' }).click();
  await expect(taller).toContainText('Guardado.', CARGA);
  await expect
    .poll(async () => (await leerAjustes(sesion)).relevamiento_centavos, CARGA)
    .toBeNull();

  await page.goto(`/v/${token}`);
  await expect(bloque).toContainText(
    'El siguiente paso es el relevamiento técnico en obra.',
    CARGA,
  );
  await expect(bloque).not.toContainText('$');
});

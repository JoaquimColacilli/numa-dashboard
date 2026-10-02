import { readFile } from 'node:fs/promises';

import { expect, test, type Page } from '@playwright/test';

import { listoParaCortar } from '../apoyo/pantalla';
import {
  contactoPorRpc,
  crearCliente,
  encuestaPorRest,
  enlacePorRest,
  escribirAjustes,
  guardarProyectoPorRpc,
  idiomaDeLaCuentaDe,
  idiomaDeLaCuentaPorRest,
  iniciarSesionDePrueba,
  leerAjustes,
  vaciarTaller,
  type AjustesDePrueba,
  type SesionDePrueba,
} from '../apoyo/taller';

const CARGA = { timeout: 30_000 };

let sesion: SesionDePrueba;
let previos: AjustesDePrueba;

test.skip(({ isMobile }) => isMobile, 'los idiomas se recorren en la compu');

test.beforeEach(async () => {
  sesion = await iniciarSesionDePrueba();
  await vaciarTaller(sesion);
  previos = await leerAjustes(sesion);
});

test.afterEach(async () => {
  await idiomaDeLaCuentaPorRest(sesion, null);
  await escribirAjustes(sesion, previos);
});

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await listoParaCortar(page);
}

async function elegir(page: Page, grupo: string, opcion: string): Promise<void> {
  await page
    .getByRole('group', { name: grupo })
    .locator('label')
    .filter({ has: page.getByRole('radio', { name: opcion }) })
    .click();
}

function titulo(page: Page) {
  return page.getByRole('heading', { level: 1 }).first();
}

interface Recorrido {
  lang: RegExp;
  inicio: string;
  finanzas: string;
  ajustes: string;
  tesoros: string;
  queFalta: string;
  enCastellano: readonly string[];
}

const EN_INGLES: Recorrido = {
  lang: /^en/,
  inicio: 'Home',
  finanzas: 'Finances',
  ajustes: 'Settings',
  tesoros: 'Buckets',
  queFalta: 'To do',
  enCastellano: ['Inicio', 'Finanzas', 'Ajustes', 'Tesoros'],
};

const EN_PORTUGUES: Recorrido = {
  lang: /^pt-BR$/,
  inicio: 'Início',
  finanzas: 'Finanças',
  ajustes: 'Configurações',
  tesoros: 'Caixinhas',
  queFalta: 'O que falta',
  enCastellano: ['Inicio', 'Finanzas', 'Ajustes', 'Tesoros'],
};

async function recorrer(page: Page, idioma: Recorrido, proyecto: string): Promise<void> {
  const navegacion = page.getByRole('navigation').first();
  for (const nombre of idioma.enCastellano) {
    await expect(navegacion.getByRole('button', { name: nombre, exact: true })).toHaveCount(0);
  }
  await navegacion.getByRole('button', { name: idioma.inicio, exact: true }).first().click();
  await expect(titulo(page)).toHaveText(idioma.inicio, CARGA);
  await expect(page.locator('html')).toHaveAttribute('lang', idioma.lang);

  await navegacion.getByRole('button', { name: idioma.tesoros, exact: true }).first().click();
  await expect(page).toHaveURL(/\/tesoros/, CARGA);

  await navegacion.getByRole('button', { name: idioma.finanzas, exact: true }).first().click();
  await expect(titulo(page)).toHaveText(idioma.finanzas, CARGA);

  await page.goto(`/proyectos/${proyecto}`);
  await expect(page.getByRole('region', { name: idioma.queFalta })).toBeVisible(CARGA);

  await page.goto('/ajustes');
  await expect(titulo(page)).toHaveText(idioma.ajustes, CARGA);
  await expect(page.locator('html')).toHaveAttribute('lang', idioma.lang);
}

test('la app en inglés y en portugués desde Ajustes, también sin señal, sin un texto viejo en pantalla', async ({
  page,
  context,
}) => {
  test.setTimeout(240_000);
  const { id } = await contactoPorRpc(sesion, {
    titulo: 'Placard del pasillo',
    estado: 'a_presupuestar',
  });

  await abrir(page, '/ajustes');
  await elegir(page, 'Idioma de la app', 'English');
  await expect(titulo(page)).toHaveText('Settings', CARGA);
  await expect(page.locator('html')).toHaveAttribute('lang', /^en/);
  await expect.poll(() => idiomaDeLaCuentaDe(sesion), CARGA).toBe('en');
  await recorrer(page, EN_INGLES, id);

  await context.setOffline(true);
  await elegir(page, 'App language', 'Português');
  await expect(titulo(page)).toHaveText('Configurações', CARGA);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.getByText('Settings', { exact: true })).toHaveCount(0);
  await context.setOffline(false);
  await expect.poll(() => idiomaDeLaCuentaDe(sesion), CARGA).toBe('pt-BR');
  await recorrer(page, EN_PORTUGUES, id);

  await elegir(page, 'Idioma do app', 'Español');
  await expect(titulo(page)).toHaveText('Ajustes', CARGA);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-AR');
  await expect.poll(() => idiomaDeLaCuentaDe(sesion), CARGA).toBe('es');
});

test('con los clientes en portugués, su página, el PDF y la encuesta salen en portugués', async ({
  page,
}) => {
  test.setTimeout(240_000);
  const { id } = await contactoPorRpc(sesion, {
    titulo: 'Placard del dormitorio',
    estado: 'a_presupuestar',
    telefono: '11 5555-0000',
  });

  await abrir(page, '/ajustes');
  await elegir(page, 'Tus clientes leen en', 'Português');
  await expect
    .poll(async () => (await leerAjustes(sesion)).idioma_de_los_clientes, CARGA)
    .toBe('pt-BR');

  await abrir(page, `/proyectos/${id}/presupuesto`);
  await page.getByRole('textbox', { name: 'Obra', exact: true }).fill('Olazábal 1240, Ituzaingó');
  await page.getByLabel('Nombre del mueble 1').fill('Placard');
  await page
    .locator('[data-mueble]')
    .first()
    .getByLabel('Descripción técnica')
    .fill('Placard de tres puertas corredizas, en melamina blanca de 18 mm.');
  await page.getByLabel('Total del presupuesto').fill('1.250.000');
  await page.getByRole('button', { name: 'Mandar el presupuesto' }).click();
  const hoja = page.getByRole('dialog', { name: 'Mandar el presupuesto' });
  await hoja.getByRole('button', { name: 'Mandar', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Listo' })).toBeVisible(CARGA);

  const token = `e2e-${crypto.randomUUID().replaceAll('-', '')}`;
  await enlacePorRest(sesion, id, token);
  await abrir(page, `/v/${token}`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR', CARGA);
  const presupuesto = page.getByRole('region', { name: /orçamento/i }).first();
  await expect(presupuesto).toContainText('Placard de tres puertas corredizas', CARGA);
  await expect(page.getByText('Sinal para começar')).toBeVisible();
  const descarga = page.waitForEvent('download', CARGA);
  await presupuesto.getByRole('button', { name: /PDF/ }).first().click();
  const pdf = (await readFile(await (await descarga).path())).toString('latin1');
  expect(pdf.startsWith('%PDF-')).toBe(true);
  expect(pdf).toMatch(/\/Lang \(pt-BR\)/);

  const clienteId = await crearCliente(sesion, 'Marcela Duarte', { telefono: '11 5523 4410' });
  const entregado = crypto.randomUUID();
  await guardarProyectoPorRpc(sesion, {
    proyecto: {
      id: entregado,
      version: null,
      cliente_id: clienteId,
      titulo: 'Placard 3 puertas con interior en melamina',
      estado: 'entregado',
      presupuesto_centavos: 100_000_000,
      comprobante: 'sin_comprobante',
    },
    pagos: [],
    gastos: [],
  });
  const deLaEncuesta = `e2e-${crypto.randomUUID().replaceAll('-', '')}`;
  await encuestaPorRest(sesion, entregado, deLaEncuesta);
  await abrir(page, `/o/${deLaEncuesta}`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR', CARGA);
  await expect(page.getByRole('button', { name: 'Enviar minha opinião' })).toBeVisible(CARGA);
  await expect(page.getByRole('button', { name: 'Mandar mi opinión' })).toHaveCount(0);
});

import { readFile } from 'node:fs/promises';

import { expect, type Download, type Locator, type Page } from '@playwright/test';

import { test } from '../apoyo/prueba';
import { listoParaCortar } from '../apoyo/pantalla';
import {
  contactoPorRpc,
  enlacesDe,
  hoyEnElTaller,
  iniciarSesionDePrueba,
  leerContacto,
  leerProyecto,
  opcionesDe,
  presupuestoDe,
  presupuestoDelTallerDe,
  revisionesDe,
  vaciarTaller,
  type SesionDePrueba,
} from '../apoyo/taller';

const CARGA = { timeout: 30_000 };
const TITULO = 'Placard del dormitorio';
const CLIENTE = `Cliente de ${TITULO}`;

let sesion: SesionDePrueba;

test.beforeEach(async () => {
  sesion = await iniciarSesionDePrueba();
  await vaciarTaller(sesion);
});

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await listoParaCortar(page);
}

async function esUnPdf(descarga: Download): Promise<boolean> {
  const ruta = await descarga.path();
  const bytes = await readFile(ruta);
  return bytes.subarray(0, 5).toString('latin1') === '%PDF-';
}

async function bajar(page: Page, boton: Locator): Promise<Download> {
  const descarga = page.waitForEvent('download', CARGA);
  await boton.click();
  return descarga;
}

function tarjeta(page: Page): Locator {
  return page.getByRole('region', { name: 'El presupuesto', exact: true });
}

async function esperarQueSeGuarde(page: Page): Promise<void> {
  await expect(page.getByText('Guardado', { exact: false }).first()).toBeVisible(CARGA);
}

test('se arma en la ficha, se manda, el cliente lo ve y lo baja, sale una revisión y se aprueba una opción', async ({
  page,
}, testInfo) => {
  test.setTimeout(240_000);
  const { id } = await contactoPorRpc(sesion, {
    titulo: TITULO,
    estado: 'a_presupuestar',
    telefono: '11 5555-0000',
  });
  const hoy = hoyEnElTaller();

  await abrir(page, `/proyectos/${id}`);
  const queFalta = page.getByRole('region', { name: 'Qué falta' });
  await expect(queFalta.getByRole('button').first()).toHaveText('Armar el presupuesto', CARGA);
  await queFalta.getByRole('button', { name: 'Armar el presupuesto' }).click();
  await expect(page).toHaveURL(new RegExp(`/proyectos/${id}/presupuesto$`));
  await expect(page.getByRole('heading', { level: 1, name: 'El presupuesto' })).toBeVisible();

  await expect(page.getByRole('textbox', { name: 'Título', exact: true })).toHaveValue(TITULO);
  await page
    .getByRole('textbox', { name: 'Obra', exact: true })
    .fill('Av. Siempreviva 742, Ituzaingó');
  await page.getByLabel('Nombre del mueble 1').fill('Placard');
  await page
    .locator('[data-mueble]')
    .first()
    .getByLabel('Descripción técnica')
    .fill('Placard de tres puertas corredizas, 2.40 x 2.60, en melamina blanca de 18 mm.');
  await page.getByLabel('Total del presupuesto').fill('1.250.000');
  await esperarQueSeGuarde(page);
  await expect.poll(async () => (await presupuestoDe(sesion, id))?.id, CARGA).toBeDefined();
  await expect
    .poll(async () => (await leerProyecto(sesion, TITULO))?.presupuesto_centavos, CARGA)
    .toBe(125_000_000);

  await page.getByRole('tab', { name: 'Ver cómo lo ve tu cliente' }).click();
  const previa = page.getByRole('tabpanel');
  await expect(previa).toContainText('Borrador');
  await expect(previa).toContainText('$ 1.250.000');
  await page.getByRole('tab', { name: 'Armarlo' }).click();

  await page.getByRole('button', { name: 'Mandar el presupuesto' }).click();
  const hoja = page.getByRole('dialog', { name: 'Mandar el presupuesto' });
  await expect(hoja).toContainText('Se tilda «Armar el presupuesto» en Qué falta.');
  await hoja.getByRole('button', { name: 'Mandar', exact: true }).click();
  const listo = page.getByRole('dialog', { name: 'Listo' });
  await expect(listo).toContainText('ya lo puede ver en su página', CARGA);

  const presupuesto = await presupuestoDe(sesion, id);
  const numero = presupuesto?.numero ?? '';
  expect(numero).toMatch(new RegExp(`^${hoy.replaceAll('-', '')}-\\d{2,}$`));
  await expect(listo).toContainText(`Nº ${numero}`);
  expect(await revisionesDe(sesion, id)).toEqual([
    expect.objectContaining({ revision: 1, numero, mandado_el: hoy, que_cambio: null }),
  ]);
  const enviado = await leerContacto(sesion, TITULO);
  expect(enviado?.estado).toBe('presupuesto_enviado');
  expect(enviado?.presupuesto_pdf).toBe(true);

  const nombreDelPdf = `Presupuesto ${numero} - ${CLIENTE}.pdf`;
  const desdeLaHoja = await bajar(page, listo.getByRole('button', { name: 'Descargar el PDF' }));
  expect(desdeLaHoja.suggestedFilename()).toBe(nombreDelPdf);
  expect(await esUnPdf(desdeLaHoja)).toBe(true);

  await page
    .context()
    .route('https://wa.me/**', (ruta) =>
      ruta.fulfill({ status: 200, contentType: 'text/plain', body: 'WhatsApp' }),
    );
  const ventana = page.context().waitForEvent('page', CARGA);
  await listo.getByRole('link', { name: 'Mandarle el link por WhatsApp' }).click();
  const whatsapp = await ventana;
  await whatsapp.waitForLoadState();
  const destino = new URL(whatsapp.url());
  await whatsapp.close();
  expect(destino.pathname).toBe('/5491155550000');
  const mensaje = destino.searchParams.get('text') ?? '';
  const token = /\/v\/([A-Za-z0-9_-]+)/.exec(mensaje)?.[1] ?? '';
  expect(token).not.toBe('');
  await expect.poll(async () => (await enlacesDe(sesion, id))[0]?.token, CARGA).toBe(token);

  await abrir(page, `/v/${token}`);
  const delCliente = page.getByRole('region', { name: 'El presupuesto', exact: true });
  await expect(delCliente).toContainText(`Nº ${numero}`, CARGA);
  await expect(delCliente).toContainText('Placard de tres puertas corredizas');
  await expect(delCliente).toContainText('$ 1.250.000');
  await page.screenshot({
    path: testInfo.outputPath(`cliente-mandado-${testInfo.project.name}.png`),
    fullPage: true,
  });
  const desdeLaPagina = await bajar(
    page,
    delCliente.getByRole('button', { name: 'Descargar el PDF' }),
  );
  expect(desdeLaPagina.suggestedFilename()).toBe(nombreDelPdf);
  expect(await esUnPdf(desdeLaPagina)).toBe(true);

  await abrir(page, `/proyectos/${id}`);
  await expect(tarjeta(page)).toContainText(`Nº ${numero}`, CARGA);
  await tarjeta(page).getByRole('button', { name: 'Hacer cambios' }).click();
  await expect(page).toHaveURL(new RegExp(`/proyectos/${id}/presupuesto$`));
  await page.getByRole('button', { name: 'Ofrecerle más de una opción' }).click();
  await page.getByLabel('Qué incluye la opción A').fill('Frentes en melamina blanca.');
  await page.getByLabel('Qué incluye la opción B').fill('Frentes laqueados blanco mate.');
  await page.getByLabel('Importe de la opción B').fill('1.600.000');
  await esperarQueSeGuarde(page);
  await expect.poll(async () => (await opcionesDe(sesion, id)).length, CARGA).toBe(2);

  await page.getByRole('button', { name: 'Mandar la revisión 2' }).click();
  const revision = page.getByRole('dialog', { name: 'Mandar la revisión 2' });
  await expect(revision.getByRole('button', { name: 'Mandar', exact: true })).toBeDisabled();
  await revision.getByLabel('Qué cambió').fill('Sumé una opción con frentes laqueados.');
  await revision.getByRole('button', { name: 'Mandar', exact: true }).click();
  const segunda = page.getByRole('dialog', { name: 'Listo' });
  await expect(segunda).toContainText('ya ve la revisión 2 en su página', CARGA);
  await expect(segunda).toContainText(`Nº ${numero} · Rev. 2`);
  await segunda.getByRole('button', { name: 'Cerrar' }).click();
  expect((await revisionesDe(sesion, id)).map((una) => [una.revision, una.que_cambio])).toEqual([
    [1, null],
    [2, 'Sumé una opción con frentes laqueados.'],
  ]);

  await abrir(page, `/v/${token}`);
  const conOpciones = page.getByRole('region', { name: 'El presupuesto', exact: true });
  await expect(conOpciones).toContainText('Sumé una opción con frentes laqueados.', CARGA);
  await expect(conOpciones).toContainText('Opción A');
  await expect(conOpciones).toContainText('Opción B');
  await expect(page.getByRole('region', { name: 'Tu mueble' })).toContainText('2 opciones');

  await abrir(page, `/proyectos/${id}`);
  await page
    .getByRole('region', { name: 'Qué falta' })
    .getByRole('button', { name: 'Lo aprobó: pasar a Proyectos' })
    .click();
  await page.getByRole('radio', { name: /Frentes en melamina blanca/ }).check();
  await expect(page.getByText(/Acordado al aprobar/)).toHaveCount(0);
  await expect(page.getByLabel('Entrega estimada')).toHaveAccessibleDescription(
    'Calculada a 30 días hábiles del inicio, el plazo del presupuesto.',
  );
  await page.getByLabel('Seña que cobrás ahora').fill('');
  await page.getByRole('button', { name: 'Pasar a Proyectos' }).press('Enter');
  await expect
    .poll(async () => (await leerProyecto(sesion, TITULO))?.estado, CARGA)
    .toBe('en_curso');
  await expect.poll(async () => (await presupuestoDe(sesion, id))?.aceptado_el, CARGA).toBe(hoy);

  await expect(tarjeta(page)).toContainText('Aceptado', CARGA);
  await expect(tarjeta(page)).toContainText('con la opción A');
  await expect(tarjeta(page)).not.toContainText('laqueados');

  await abrir(page, `/v/${token}`);
  const aceptado = page.getByRole('region', { name: 'El presupuesto que aceptaste' });
  await expect(aceptado).toContainText('Frentes en melamina blanca.', CARGA);
  await expect(aceptado).not.toContainText('laqueados');
  await page.screenshot({
    path: testInfo.outputPath(`cliente-aceptado-${testInfo.project.name}.png`),
    fullPage: true,
  });
});

test('lo que se cambia en Ajustes, en «Tu presupuesto», sale en el próximo presupuesto', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const AVISO = 'La fecha de producción se reserva con la seña.';
  const antes = await presupuestoDelTallerDe(sesion);

  await abrir(page, '/ajustes');
  const resumen = page.getByRole('region', { name: 'Tu presupuesto' });
  await expect(resumen).toContainText('Faltan tu CUIT y tu domicilio', CARGA);
  await resumen.getByRole('link', { name: 'Cambiar lo que va en tus presupuestos' }).click();
  await expect(page).toHaveURL(/\/ajustes\/presupuesto$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Tu presupuesto' })).toBeVisible();

  const datos = page.getByRole('region', { name: 'Tus datos en el presupuesto' });
  await datos.getByLabel('Nombre o razón social').fill('Ana Pérez');
  await datos.getByLabel('CUIT').fill('20301112220');
  await expect(datos.getByLabel('CUIT')).toHaveValue('20-30111222-0');
  await datos.getByLabel('Domicilio').fill('Av. Siempreviva 742, Ituzaingó');
  await expect(datos).toContainText('Ana Pérez · CUIT 20-30111222-0');

  const avisos = page.getByRole('region', { name: 'Avisos' });
  await avisos.getByRole('button', { name: 'Agregar un aviso' }).click();
  await avisos.getByRole('textbox', { name: 'Texto del aviso' }).fill(AVISO);
  await avisos.getByRole('button', { name: 'Listo' }).click();
  await expect(avisos).toContainText('Nuevo, sin guardar');

  const barra = page.locator('[data-barra-de-guardado]');
  await expect(barra).toContainText('Sin guardar');
  await barra.getByRole('button', { name: 'Guardar los cambios' }).click();
  await expect(barra).toHaveCount(0);
  await expect
    .poll(async () => (await presupuestoDelTallerDe(sesion)).taller_cuit, CARGA)
    .toBe('20-30111222-0');
  const guardado = await presupuestoDelTallerDe(sesion);
  expect(antes.plantilla_del_presupuesto).toBeNull();
  expect(guardado.plantilla_del_presupuesto_version).toBe(
    antes.plantilla_del_presupuesto_version + 1,
  );
  expect(guardado.plantilla_del_presupuesto?.avisos.at(-1)).toMatchObject({
    texto: AVISO,
    tildadaPorDefecto: true,
  });

  const { id } = await contactoPorRpc(sesion, {
    titulo: 'Rack del living',
    estado: 'a_presupuestar',
  });
  await abrir(page, `/proyectos/${id}/presupuesto`);
  await expect(page.getByRole('checkbox', { name: AVISO })).toBeChecked(CARGA);
});

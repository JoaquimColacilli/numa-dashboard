import { readFile } from 'node:fs/promises';

import { expect, test, type Download, type Locator, type Page } from '@playwright/test';

import { listoParaCortar } from '../apoyo/pantalla';
import {
  ajustarCobroDelTaller,
  ajustarTaller,
  contactoPorRpc,
  crearCliente,
  diaDesdeHoy,
  dolarDelDiaPorRest,
  enlacePorRest,
  escribirAjustes,
  formasDeCobroPorRest,
  guardarProyectoPorRpc,
  hoyEnElTaller,
  iniciarSesionDePrueba,
  leerAjustes,
  leerContacto,
  pagosEnSuMonedaDe,
  saldoDelTesoro,
  tesoroPorRest,
  vaciarTaller,
  type AjustesDePrueba,
  type SesionDePrueba,
} from '../apoyo/taller';

const CARGA = { timeout: 30_000 };
const DOLAR = 145_000;
const SUELDO_ALTO = 500_000_000;

const MEP = {
  moneda: 'USD',
  casa: 'bolsa',
  nombre: 'Bolsa',
  compra: 1548,
  venta: 1560,
  fechaActualizacion: '2026-10-02T21:05:00.000Z',
};
const BLUE = { ...MEP, casa: 'blue', nombre: 'Blue', compra: 1535, venta: 1555 };

let sesion: SesionDePrueba;
let dolares: string;
let previos: AjustesDePrueba;

test.skip(({ isMobile }) => isMobile, 'los trabajos en dólares se recorren en la compu');

test.beforeEach(async ({ page }) => {
  sesion = await iniciarSesionDePrueba();
  await vaciarTaller(sesion);
  previos = await leerAjustes(sesion);
  dolares = (await tesoroPorRest(sesion, { nombre: 'Dólares', moneda: 'USD' })).id;
  await page.route('https://dolarapi.com/v1/dolares/bolsa', (ruta) => ruta.fulfill({ json: MEP }));
  await page.route('https://dolarapi.com/v1/dolares/blue', (ruta) => ruta.fulfill({ json: BLUE }));
});

test.afterEach(async ({ isMobile }) => {
  if (isMobile) return;
  await escribirAjustes(sesion, previos);
});

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await listoParaCortar(page);
}

async function bajar(boton: Locator): Promise<Download> {
  const descarga = boton.page().waitForEvent('download', CARGA);
  await boton.click();
  return descarga;
}

async function textoDelPdf(descarga: Download): Promise<string> {
  return (await readFile(await descarga.path())).toString('latin1');
}

const ESPACIOS_RAROS = new RegExp(`[${String.fromCharCode(0xa0, 0x202f)}]`, 'gu');

function sinEspaciosRaros(texto: string): string {
  return texto.replace(ESPACIOS_RAROS, ' ');
}

async function enLaPagina(page: Page): Promise<string> {
  return sinEspaciosRaros((await page.locator('body').textContent()) ?? '');
}

async function mandarOtraRevision(
  page: Page,
  id: string,
  revision: number,
  queCambio: string,
): Promise<void> {
  await abrir(page, `/proyectos/${id}/presupuesto`);
  await page
    .locator('[data-mueble]')
    .first()
    .getByLabel('Descripción técnica')
    .fill(`Vestidor de dos cuerpos con puertas corredizas. ${queCambio}`);
  await page.getByRole('button', { name: `Mandar la revisión ${String(revision)}` }).click();
  const hoja = page.getByRole('dialog', { name: `Mandar la revisión ${String(revision)}` });
  await hoja.getByLabel('Qué cambió').fill(queCambio);
  await hoja.getByRole('button', { name: 'Mandar', exact: true }).click();
  const listo = page.getByRole('dialog', { name: 'Listo' });
  await expect(listo).toBeVisible(CARGA);
  await listo.getByRole('button', { name: 'Cerrar' }).click();
}

test('un trabajo en dólares de punta a punta: la visita en pesos con su dólar, el presupuesto con su referencia, la página del cliente, la seña en dólares y el cobro con Maun en negativo', async ({
  page,
}) => {
  test.setTimeout(420_000);
  const hoy = hoyEnElTaller();
  await ajustarTaller(sesion, { sueldo_mensual_centavos: SUELDO_ALTO, costos_fijos_centavos: 0 });
  await dolarDelDiaPorRest(sesion, DOLAR);
  const { id, titulo } = await contactoPorRpc(sesion, {
    titulo: 'Vestidor en dólares',
    estado: 'relevamiento',
    moneda: 'USD',
    telefono: '11 5555-0000',
  });

  await abrir(page, `/proyectos/${id}`);
  const panel = page.getByRole('region', { name: 'Qué falta' });
  await panel.getByRole('button', { name: 'Ya fui a relevar' }).click();
  await panel.getByLabel('Cuánto te pagó la visita').fill('120.000');
  await expect(panel.getByLabel('Dólar', { exact: true })).toHaveValue(/1\.450/);
  await expect(panel).toContainText(/Descuenta US\$\s82,76 del precio\./);
  await panel.getByRole('button', { name: 'Anotar el relevamiento' }).click();
  await expect
    .poll(
      async () =>
        (await pagosEnSuMonedaDe(sesion, id)).map((pago) => [
          pago.moneda,
          pago.monto_centavos,
          pago.cotizacion_centavos,
          pago.tesoro_id,
          pago.concepto,
        ]),
      CARGA,
    )
    .toEqual([['ARS', 12_000_000, DOLAR, null, 'Seña de la visita']]);

  await abrir(page, `/proyectos/${id}/presupuesto`);
  await page.getByRole('textbox', { name: 'Obra', exact: true }).fill('Olazábal 1240, Ituzaingó');
  await page.getByLabel('Nombre del mueble 1').fill('Vestidor');
  await page
    .locator('[data-mueble]')
    .first()
    .getByLabel('Descripción técnica')
    .fill('Vestidor de dos cuerpos con puertas corredizas, en melamina blanca de 18 mm.');
  await page.getByLabel('Total del presupuesto').fill('2.400');
  await expect(page.getByText('Guardado', { exact: false }).first()).toBeVisible(CARGA);
  await page.getByRole('button', { name: 'Mandar el presupuesto' }).click();
  const hoja = page.getByRole('dialog', { name: 'Mandar el presupuesto' });
  await expect(hoja).toContainText(
    /Cada total en dólares lleva sus pesos con el dólar a \$\s1\.450 de hoy/,
  );
  await hoja.getByRole('button', { name: 'Mandar', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Listo' })).toBeVisible(CARGA);
  await expect
    .poll(async () => (await leerContacto(sesion, titulo))?.estado, CARGA)
    .toBe('presupuesto_enviado');

  await formasDeCobroPorRest(sesion, id, { sena: ['transferencia'] });
  await ajustarCobroDelTaller(sesion, {
    alias: 'taller.maun.pesos',
    cbu: '',
    titular: 'Eliseo Maun',
    cuit: '',
  });
  const token = `e2e-${crypto.randomUUID().replaceAll('-', '')}`;
  await enlacePorRest(sesion, id, token);
  await abrir(page, `/v/${token}`);
  const presupuesto = page.getByRole('region', { name: 'El presupuesto', exact: true });
  await expect(presupuesto).toContainText(/US\$\s2\.400/, CARGA);
  expect(await enLaPagina(page)).toMatch(
    /Son \$ 3\.480\.000 con el dólar a \$ 1\.450, el que vale para pagos del \d{1,2} de [a-z]+ de \d{4}\./,
  );
  expect(await enLaPagina(page)).toContain('Hoy son $ 1.619.998, con el dólar a $ 1.450 de hoy.');
  await expect(page.getByRole('button', { name: 'Copiar el monto en pesos' })).toBeVisible();

  await dolarDelDiaPorRest(sesion, DOLAR, diaDesdeHoy(-1));
  await abrir(page, `/v/${token}`);
  await expect(page.getByRole('region', { name: 'El presupuesto', exact: true })).toBeVisible(
    CARGA,
  );
  expect(await enLaPagina(page)).toContain(
    'El importe en pesos te lo pasa el taller el día que pagás.',
  );
  await expect(page.getByRole('button', { name: 'Copiar el monto en pesos' })).toHaveCount(0);

  await dolarDelDiaPorRest(sesion, DOLAR);
  const enOtrosIdiomas = [
    {
      idioma: 'en',
      revision: 2,
      queCambio: 'Revisión para leer en inglés.',
      lang: /^en/,
      region: /quote/i,
      referencia: 'per dollar, the rate for payments made on',
      enElPdf: /\/Lang \(en(-US)?\)/,
    },
    {
      idioma: 'pt-BR',
      revision: 3,
      queCambio: 'Revisión para leer en portugués.',
      lang: /^pt-BR$/,
      region: /orçamento/i,
      referencia: 'a cotação válida para pagamentos feitos em',
      enElPdf: /\/Lang \(pt-BR\)/,
    },
  ] as const;
  for (const otro of enOtrosIdiomas) {
    await escribirAjustes(sesion, { idioma_de_los_clientes: otro.idioma });
    await mandarOtraRevision(page, id, otro.revision, otro.queCambio);
    await abrir(page, `/v/${token}`);
    await expect(page.locator('html')).toHaveAttribute('lang', otro.lang, CARGA);
    await expect(page.getByRole('region', { name: otro.region }).first()).toContainText(
      otro.queCambio,
      CARGA,
    );
    expect(await enLaPagina(page)).toContain(otro.referencia);
    const pdf = await textoDelPdf(
      await bajar(
        page
          .getByRole('region', { name: otro.region })
          .getByRole('button', { name: /PDF/ })
          .first(),
      ),
    );
    expect(pdf.startsWith('%PDF-')).toBe(true);
    expect(pdf).toMatch(otro.enElPdf);
  }
  await escribirAjustes(sesion, { idioma_de_los_clientes: 'es' });

  await abrir(page, `/proyectos/${id}/aprobar`);
  await page.getByRole('button', { name: 'Pasar a dólares' }).click();
  await page.getByLabel('Seña que cobrás ahora').fill('1.000');
  await page.getByLabel('Dólar', { exact: true }).fill('1.450');
  await expect(page.getByText('Entra a «Dólares».')).toBeVisible();
  await page.getByRole('button', { name: 'Pasar a Proyectos' }).click();
  await expect
    .poll(async () => (await leerContacto(sesion, titulo))?.estado, CARGA)
    .toBe('en_curso');
  expect(
    (await pagosEnSuMonedaDe(sesion, id)).map((pago) => [
      pago.moneda,
      pago.monto_centavos,
      pago.cotizacion_centavos,
      pago.tesoro_id,
    ]),
  ).toEqual([
    ['ARS', 12_000_000, DOLAR, null],
    ['USD', 100_000, DOLAR, dolares],
  ]);
  expect(await saldoDelTesoro(sesion, dolares)).toBe(100_000);

  await abrir(page, `/proyectos/${id}`);
  await page
    .getByRole('region', { name: 'Qué falta' })
    .getByRole('button', { name: 'Ya lo entregué' })
    .click();
  await page.getByRole('button', { name: /^Cobrar el saldo/ }).click();
  await expect(page.getByLabel('Monto', { exact: true })).toHaveValue(/1\.909\.998/, CARGA);
  await expect(page.getByLabel('Dólar', { exact: true })).toHaveValue(/1\.450/);
  await expect(page.locator('main')).toContainText(/Descuenta US\$\s1\.317,24 del precio\./);
  await expect(page.locator('main')).toContainText(
    /Después de cobrar, Maun queda en [−-]\$\s[\d.]+: parte de lo cobrado está en «Dólares»\./,
  );
  const vender = page.getByRole('link', { name: 'Vender dólares' });
  await expect(vender).toHaveAttribute(
    'href',
    new RegExp(`clase=venta_de_dolares.*tesoro=${dolares}`),
  );
  await page.getByRole('button', { name: /^Cobrar y repartir/ }).click();
  await expect
    .poll(async () => (await leerContacto(sesion, titulo))?.estado, CARGA)
    .toBe('cobrado');
  const final = (await pagosEnSuMonedaDe(sesion, id)).at(-1);
  expect(final).toMatchObject({
    moneda: 'ARS',
    monto_centavos: 190_999_800,
    cotizacion_centavos: DOLAR,
    tesoro_id: null,
    concepto: 'Saldo final en la entrega',
    fecha: hoy,
  });
});

test('un trabajo en pesos con un pago en dólares: entra al tesoro en dólares y descuenta pesos', async ({
  page,
}) => {
  const clienteId = await crearCliente(sesion, 'Cliente de la cocina en pesos');
  const id = crypto.randomUUID();
  await guardarProyectoPorRpc(sesion, {
    proyecto: {
      id,
      version: null,
      cliente_id: clienteId,
      titulo: 'Cocina en pesos',
      estado: 'en_curso',
      presupuesto_centavos: 300_000_000,
      comprobante: 'sin_comprobante',
    },
    pagos: [],
    gastos: [],
  });

  await abrir(page, `/proyectos/${id}/editar`);
  const pagos = page.getByRole('region', { name: 'Pagos recibidos' });
  await pagos.getByRole('button', { name: 'Agregar un pago' }).click();
  await pagos.getByLabel('Concepto 1', { exact: true }).fill('Pago en dólares');
  await pagos.getByRole('button', { name: 'Pasar a dólares' }).click();
  await pagos.getByLabel('Monto 1', { exact: true }).fill('500');
  await pagos.getByLabel('Dólar', { exact: true }).last().fill('1.450');
  await expect(pagos).toContainText(/Descuenta \$\s725\.000 del precio\./);
  await expect(pagos).toContainText('Entra a «Dólares».');
  await page
    .getByRole('button', { name: /^Guardar/ })
    .first()
    .click();

  await expect
    .poll(
      async () =>
        (await pagosEnSuMonedaDe(sesion, id)).map((pago) => [
          pago.moneda,
          pago.monto_centavos,
          pago.cotizacion_centavos,
          pago.tesoro_id,
        ]),
      CARGA,
    )
    .toEqual([['USD', 50_000, DOLAR, dolares]]);
  await expect.poll(() => saldoDelTesoro(sesion, dolares), CARGA).toBe(50_000);

  await abrir(page, `/proyectos/${id}`);
  await expect(page.locator('main')).toContainText(
    /Descontó \$\s725\.000 del precio, con el dólar a \$\s1\.450\./,
    CARGA,
  );
});

test('el campo del dólar sugiere el MEP y el blue con un toque, y sin respuesta no estorba', async ({
  page,
}) => {
  const { id, clienteId } = await contactoPorRpc(sesion, {
    titulo: 'Placard en dólares',
    estado: 'presupuesto_enviado',
    moneda: 'USD',
  });
  await guardarProyectoPorRpc(sesion, {
    proyecto: {
      id,
      version: 1,
      cliente_id: clienteId,
      titulo: 'Placard en dólares',
      estado: 'presupuesto_enviado',
      moneda: 'USD',
      presupuesto_centavos: 200_000,
      comprobante: 'sin_comprobante',
    },
    pagos: [],
    gastos: [],
  });

  await abrir(page, `/proyectos/${id}/compartir`);
  const campo = page.getByLabel('Dólar del día (para todos tus trabajos)');
  await expect(campo).toBeVisible(CARGA);
  const sugerencias = page.getByLabel('Dólares para elegir');
  await expect(sugerencias).toContainText('MEP', CARGA);
  await expect(sugerencias).toContainText('Blue');
  await page.getByRole('button', { name: 'Usar el MEP de venta: $ 1.560' }).click();
  await expect(campo).toHaveValue(/1\.560/);

  await page.unroute('https://dolarapi.com/v1/dolares/bolsa');
  await page.unroute('https://dolarapi.com/v1/dolares/blue');
  await page.route('https://dolarapi.com/**', (ruta) => ruta.abort());
  await abrir(page, `/proyectos/${id}/compartir`);
  await expect(campo).toBeVisible(CARGA);
  await page.waitForTimeout(1_500);
  await expect(page.getByLabel('Dólares para elegir')).toHaveCount(0);
  await campo.fill('1.470');
  await expect(campo).toHaveValue(/1\.470/);
});

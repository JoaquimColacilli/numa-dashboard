import { devices, expect, type Browser, type Page, type TestInfo } from '@playwright/test';

import { test } from '../apoyo/prueba';
import { listoParaCortar } from '../apoyo/pantalla';
import { entrarConLaSesion } from '../apoyo/sesion';
import {
  ajustarTaller,
  cobrarPorRpc,
  crearCliente,
  guardarProyectoPorRpc,
  hoyEnElTaller,
  idiomaDeLaCuentaPorRest,
  iniciarSesionDePrueba,
  escribirAjustes,
  leerAjustes,
  tesoroPorRest,
  vaciarTaller,
  type AjustesDePrueba,
  type SesionDePrueba,
} from '../apoyo/taller';

const CARGA = { timeout: 30_000 };
const ANCHOS = [320, 360] as const;

let sesion: SesionDePrueba;
let previos: AjustesDePrueba;

test.skip(({ isMobile }) => isMobile, 'los anchos del celular se arman acá con su propio contexto');

test.beforeEach(async () => {
  sesion = await iniciarSesionDePrueba();
  await vaciarTaller(sesion);
  previos = await leerAjustes(sesion);
  await ajustarTaller(sesion, {
    sueldo_mensual_centavos: 50_000_000,
    costos_fijos_centavos: 25_000_000,
  });
});

test.afterEach(async ({ isMobile }) => {
  if (isMobile) return;
  await idiomaDeLaCuentaPorRest(sesion, null);
  await escribirAjustes(sesion, previos);
});

async function enPortugues(browser: Browser, testInfo: TestInfo, ancho: number): Promise<Page> {
  await idiomaDeLaCuentaPorRest(sesion, 'pt-BR');
  const enLaCuenta = await iniciarSesionDePrueba();
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
    baseURL: testInfo.project.use.baseURL,
    storageState: { cookies: [], origins: [] },
    viewport: { width: ancho, height: 740 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await entrarConLaSesion(context, enLaCuenta);
  return context.newPage();
}

function loQueSeCorta(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const cortados: string[] = [];
    const conPlata = /(\$|ARS|US\$)\s?[\d.,]+/u;
    for (const elemento of document.querySelectorAll<HTMLElement>(
      'main *, dialog[open] *, nav *',
    )) {
      if (elemento.children.length > 0 && elemento.childElementCount === elemento.childNodes.length)
        continue;
      if (!conPlata.test(elemento.textContent)) continue;
      const estilo = getComputedStyle(elemento);
      const recorta =
        estilo.textOverflow === 'ellipsis' ||
        estilo.overflow === 'hidden' ||
        estilo.overflowX === 'hidden';
      if (!recorta) continue;
      if (elemento.getBoundingClientRect().width <= 1) continue;
      if (elemento.scrollWidth > elemento.clientWidth + 1) {
        cortados.push(elemento.textContent.trim().slice(0, 60));
      }
    }
    return cortados.filter((texto) => texto !== '');
  });
}

function loQueSeSale(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const salidos = new Set<string>();
    const caminante = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let nodo = caminante.nextNode(); nodo !== null; nodo = caminante.nextNode()) {
      const texto = (nodo.textContent ?? '').trim();
      const padre = nodo.parentElement;
      if (texto === '' || padre === null) continue;
      if (padre.closest('svg') !== null || padre.closest('main, dialog[open], nav') === null) {
        continue;
      }
      const rango = document.createRange();
      rango.selectNodeContents(nodo);
      const renglones = [...rango.getClientRects()].filter(
        (caja) => caja.width > 0 && caja.height > 0,
      );
      if (renglones.length === 0) continue;
      const derecha = Math.max(...renglones.map((caja) => caja.right));
      const izquierda = Math.min(...renglones.map((caja) => caja.left));
      let aparte = false;
      for (
        let elemento: HTMLElement | null = padre;
        elemento !== null && elemento !== document.body;
        elemento = elemento.parentElement
      ) {
        const estilo = getComputedStyle(elemento);
        const caja = elemento.getBoundingClientRect();
        const recortaConPuntos =
          estilo.textOverflow === 'ellipsis' && estilo.overflowX !== 'visible';
        const correHaciaElCostado =
          (estilo.overflowX === 'auto' || estilo.overflowX === 'scroll') &&
          elemento.id !== 'contenido' &&
          elemento.scrollWidth > elemento.clientWidth + 1;
        const escondido =
          estilo.visibility === 'hidden' ||
          estilo.opacity === '0' ||
          (estilo.display !== 'contents' && (caja.width <= 1 || caja.height <= 1));
        if (
          recortaConPuntos ||
          correHaciaElCostado ||
          escondido ||
          estilo.webkitLineClamp !== 'none'
        ) {
          aparte = true;
        }
      }
      if (aparte) continue;
      let bloque: HTMLElement | null = padre;
      while (bloque !== null && ['inline', 'contents'].includes(getComputedStyle(bloque).display)) {
        bloque = bloque.parentElement;
      }
      for (const contenedor of [
        bloque,
        padre.closest<HTMLElement>('button, a, li, section, dialog, label'),
      ]) {
        if (contenedor === null) continue;
        const borde = contenedor.getBoundingClientRect();
        if (derecha > borde.right + 1 || izquierda < borde.left - 1) {
          salidos.add(texto.slice(0, 60));
          break;
        }
      }
    }
    return [...salidos];
  });
}

async function sinNadaCortado(page: Page, donde: string): Promise<string[]> {
  const ancho = page.viewportSize()?.width ?? 0;
  const fallas = (await loQueSeCorta(page)).map((texto) => `${donde}: «${texto}» se corta`);
  fallas.push(
    ...(await loQueSeSale(page)).map((texto) => `${donde}: «${texto}» se sale de su caja`),
  );
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth);
  if (desborde > ancho) fallas.push(`${donde}: la página mide ${String(desborde)} px de ancho`);
  return fallas;
}

for (const ancho of ANCHOS) {
  test(`en portugués, a ${String(ancho)} px, las pestañas entran enteras, ningún monto se corta y ningún texto se sale de su caja`, async ({
    browser,
  }, testInfo) => {
    test.setTimeout(240_000);
    const clienteId = await crearCliente(sesion, 'Marcela Duarte');
    const entregado = crypto.randomUUID();
    await guardarProyectoPorRpc(sesion, {
      proyecto: {
        id: entregado,
        version: null,
        cliente_id: clienteId,
        titulo: 'Placard de três portas',
        estado: 'entregado',
        presupuesto_centavos: 1_234_567_890,
        comprobante: 'sin_comprobante',
      },
      pagos: [
        {
          id: crypto.randomUUID(),
          fecha: hoyEnElTaller(),
          concepto: 'Seña',
          monto_centavos: 617_283_945,
        },
      ],
      gastos: [],
    });
    const cobrado = crypto.randomUUID();
    const monto = 120_000_000;
    await guardarProyectoPorRpc(sesion, {
      proyecto: {
        id: cobrado,
        version: null,
        cliente_id: clienteId,
        titulo: 'Mesada de cozinha',
        estado: 'entregado',
        presupuesto_centavos: monto,
        comprobante: 'sin_comprobante',
      },
      pagos: [
        {
          id: crypto.randomUUID(),
          fecha: hoyEnElTaller(),
          concepto: 'Todo',
          monto_centavos: monto,
        },
      ],
      gastos: [],
    });
    await cobrarPorRpc(sesion, {
      p_proyecto_id: cobrado,
      p_version: 1,
      p_fecha_cobro: hoyEnElTaller(),
      p_cobrado_centavos: monto,
      p_gastos_centavos: 0,
      p_tope_sueldo_centavos: 50_000_000,
      p_tope_fijos_centavos: 25_000_000,
      p_diezmo_centavos: 12_000_000,
      p_sueldo_centavos: 50_000_000,
      p_fijos_centavos: 25_000_000,
      p_remanente_centavos: 33_000_000,
    });
    const dolares = await tesoroPorRest(sesion, { nombre: 'Dólares', moneda: 'USD' });
    await guardarProyectoPorRpc(sesion, {
      proyecto: {
        id: crypto.randomUUID(),
        version: null,
        cliente_id: clienteId,
        titulo: 'Closet em dólares',
        estado: 'entregado',
        moneda: 'USD',
        presupuesto_centavos: 240_000,
        comprobante: 'sin_comprobante',
      },
      pagos: [
        {
          id: crypto.randomUUID(),
          fecha: hoyEnElTaller(),
          concepto: 'Seña',
          monto_centavos: 108_276,
          moneda: 'USD',
          cotizacion_centavos: 145_000,
          tesoro_id: dolares.id,
        },
      ],
      gastos: [],
    });

    const page = await enPortugues(browser, testInfo, ancho);
    const fallas: string[] = [];
    try {
      await page.goto('/proyectos?etapa=seguimiento');
      await listoParaCortar(page);
      expect(await page.evaluate(() => navigator.language)).toBe('es-AR');
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR', CARGA);
      const pestanas = page.getByRole('tab');
      await expect(pestanas).toHaveCount(4, CARGA);
      for (const pestana of await pestanas.all()) {
        const caja = await pestana.boundingBox();
        if (caja === null) throw new Error('uma aba não aparece');
        if (caja.x < 0 || caja.x + caja.width > ancho) {
          fallas.push(`la pestaña «${(await pestana.textContent()) ?? ''}» se sale de la pantalla`);
        }
        if (
          !(await pestana.evaluate((elemento) => elemento.scrollWidth <= elemento.clientWidth + 1))
        ) {
          fallas.push(`la pestaña «${(await pestana.textContent()) ?? ''}» se corta`);
        }
      }

      for (const [donde, ruta] of [
        ['Início', '/'],
        ['Finanças', '/finanzas'],
        ['Caixinhas', '/tesoros'],
        ['a ficha entregue', `/proyectos/${entregado}`],
        ['o recebimento', `/proyectos/${entregado}/cobrar`],
        ['Clientes', '/clientes'],
        ['a ficha da cliente', `/clientes/${clienteId}`],
        ['Configurações', '/ajustes'],
      ] as const) {
        await page.goto(ruta);
        await listoParaCortar(page);
        await page.evaluate(() => document.fonts.ready.then(() => undefined));
        fallas.push(...(await sinNadaCortado(page, donde)));
      }

      await page.goto(`/proyectos/${cobrado}`);
      await listoParaCortar(page);
      await page.getByRole('button', { name: 'Reabrir o recebimento' }).click();
      const confirmar = page.getByRole('button', { name: 'Reabrir e desfazer a divisão' });
      await expect(confirmar).toBeVisible(CARGA);
      if (!(await confirmar.evaluate((boton) => boton.scrollWidth <= boton.clientWidth + 1))) {
        fallas.push('«Reabrir e desfazer a divisão» no entra en su botón');
      }
      fallas.push(...(await sinNadaCortado(page, 'reabrir o recebimento')));
    } finally {
      await page.context().close();
    }
    expect(fallas, fallas.join('\n')).toEqual([]);
  });
}

import {
  devices,
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
  type TestInfo,
} from '@playwright/test';

import { entrarConLaSesion } from '../apoyo/sesion';
import {
  escribirAjustes,
  iniciarSesionDePrueba,
  leerAjustes,
  type AjustesDePrueba,
  type SesionDePrueba,
} from '../apoyo/taller';
import { PANTALLAS } from './pantallas';
import { sembrarPocos, type TallerSembrado } from './sembrar';

const ZONA = 'America/Argentina/Buenos_Aires';
const ANCHOS = [390, 1440] as const;
const CARGA = { timeout: 30_000 };

async function esperarLaPantalla(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await expect(
    page
      .locator('main#contenido h1, main#contenido form, dialog[open], [data-fin-de-la-vista], h1')
      .first(),
  ).toBeVisible(CARGA);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

let sesion: SesionDePrueba;
let previos: AjustesDePrueba;
let taller: TallerSembrado;

test.use({ actionTimeout: 30_000 });

test.beforeAll(async () => {
  test.setTimeout(300_000);
  sesion = await iniciarSesionDePrueba();
  previos = await leerAjustes(sesion);
  taller = await sembrarPocos(sesion);
});

test.afterAll(async () => {
  await escribirAjustes(sesion, previos);
});

async function abrirContexto(
  browser: Browser,
  testInfo: TestInfo,
  ancho: number,
  conSesion: boolean,
): Promise<BrowserContext> {
  const celular = ancho < 768;
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
    baseURL: testInfo.project.use.baseURL,
    viewport: { width: ancho, height: celular ? 844 : 900 },
    deviceScaleFactor: celular ? 2 : 1,
    isMobile: celular,
    hasTouch: celular,
    timezoneId: ZONA,
  });
  await context.addInitScript(() => {
    localStorage.setItem('maun:seudoidioma', 'activo');
  });
  if (conSesion) await entrarConLaSesion(context, sesion);
  return context;
}

function textosFueraDelCatalogo(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const conLetras = /\p{L}/u;
    const marcado = /[⟦⟧]/u;
    const deTerceros = '.react-flow__attribution';
    const afuera = `[translate="no"], [data-seudo], ${deTerceros}, option, textarea, script, style, noscript, [hidden]`;
    const sueltos: string[] = [];
    const caminante = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let nodo = caminante.nextNode(); nodo !== null; nodo = caminante.nextNode()) {
      const texto = nodo.textContent ?? '';
      if (!conLetras.test(texto) || marcado.test(texto)) continue;
      const padre = nodo.parentElement;
      if (padre === null || padre.closest(afuera) !== null) continue;
      sueltos.push(texto.trim());
    }
    for (const elemento of document.body.querySelectorAll(
      '[aria-label], [title], [placeholder], [alt]',
    )) {
      if (elemento.closest(`[translate="no"], ${deTerceros}`) !== null) continue;
      for (const atributo of ['aria-label', 'title', 'placeholder', 'alt']) {
        const valor = elemento.getAttribute(atributo);
        if (valor !== null && conLetras.test(valor) && !marcado.test(valor)) {
          sueltos.push(`${atributo}=${valor}`);
        }
      }
    }
    return [...new Set(sueltos)];
  });
}

function textosCortados(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, a, h1, h2, h3, label, [role="tab"]')]
      .filter((elemento) => {
        if (elemento.getBoundingClientRect().width <= 1) return false;
        const estilo = getComputedStyle(elemento);
        if (estilo.textOverflow !== 'ellipsis' && estilo.overflow !== 'hidden') return false;
        return elemento.scrollWidth > elemento.clientWidth + 1;
      })
      .map((elemento) => elemento.textContent.trim())
      .filter((texto) => /[⟦⟧]/u.test(texto)),
  );
}

test('con el seudoidioma, cada pantalla tiene todo su texto del catálogo y nada cortado', async ({
  browser,
}, testInfo) => {
  test.setTimeout(900_000);
  const fallas: string[] = [];
  for (const ancho of ANCHOS) {
    for (const pantalla of PANTALLAS) {
      const context = await abrirContexto(browser, testInfo, ancho, pantalla.sinSesion !== true);
      const page = await context.newPage();
      try {
        await page.goto(pantalla.ruta(taller));
        try {
          await esperarLaPantalla(page);
        } catch {
          fallas.push(`${pantalla.nombre} a ${String(ancho)}: no terminó de abrir`);
          continue;
        }
        const sueltos = await textosFueraDelCatalogo(page);
        if (sueltos.length > 0) {
          fallas.push(`${pantalla.nombre} a ${String(ancho)}: ${sueltos.join(' | ')}`);
        }
        const cortados = await textosCortados(page);
        if (cortados.length > 0) {
          fallas.push(`${pantalla.nombre} a ${String(ancho)}, cortado: ${cortados.join(' | ')}`);
        }
      } finally {
        await context.close();
      }
    }
  }
  expect(fallas, fallas.join('\n')).toEqual([]);
});

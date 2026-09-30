import { expect, test, type Page } from '@playwright/test';

import { dedo, tirarYSoltar } from '../apoyo/dedo';
import {
  ajustarTaller,
  guardarLaFilaPorRpc,
  iniciarSesionDePrueba,
  leerLaFila,
  tesoroPorRest,
  tesorosDelTaller,
  vaciarTaller,
  type SesionDePrueba,
} from '../apoyo/taller';

const CARGA = { timeout: 30_000 };

let sesion: SesionDePrueba;

test.beforeEach(async () => {
  sesion = await iniciarSesionDePrueba();
  await vaciarTaller(sesion);
  await ajustarTaller(sesion, {
    sueldo_mensual_centavos: 180_000_000,
    costos_fijos_centavos: 60_000_000,
    meta_cocos_centavos: 0,
  });
});

async function abrirLosTesoros(page: Page): Promise<void> {
  await page.goto('/tesoros');
  await expect(page.getByRole('heading', { level: 1, name: 'Tesoros' })).toBeVisible(CARGA);
  const entendido = page.getByRole('button', { name: 'Entendido' });
  if (await entendido.isVisible()) await entendido.click();
}

async function planoQuieto(page: Page): Promise<void> {
  await expect(page.locator('.react-flow__node').first()).toBeVisible(CARGA);
  let antes = '';
  await expect
    .poll(async () => {
      const ahora = await page
        .locator('.react-flow__viewport')
        .evaluate((vista) => (vista as HTMLElement).style.transform);
      const quieto = ahora === antes;
      antes = ahora;
      return quieto;
    }, CARGA)
    .toBe(true);
}

interface RotuloPisado {
  rotulo: string;
  ficha: string;
}

function rotulosQuePisan(page: Page): Promise<RotuloPisado[]> {
  return page.evaluate(() => {
    const fichas = [...document.querySelectorAll<HTMLElement>('.react-flow__node')].filter(
      (nodo) => !nodo.classList.contains('react-flow__node-tipo'),
    );
    const pisados: { rotulo: string; ficha: string }[] = [];
    for (const rotulo of document.querySelectorAll<HTMLElement>(
      '.react-flow__edgelabel-renderer > *',
    )) {
      const caja = rotulo.getBoundingClientRect();
      if (caja.width === 0 || caja.height === 0) continue;
      for (const ficha of fichas) {
        const otra = ficha.getBoundingClientRect();
        const cruzan =
          caja.left < otra.right - 0.5 &&
          otra.left < caja.right - 0.5 &&
          caja.top < otra.bottom - 0.5 &&
          otra.top < caja.bottom - 0.5;
        if (cruzan) {
          pisados.push({
            rotulo: rotulo.textContent.trim() || rotulo.getAttribute('aria-label') || '?',
            ficha: ficha.dataset.id ?? '?',
          });
        }
      }
    }
    return pisados;
  });
}

function ayudasTapadas(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLButtonElement>(
        '.react-flow__edgelabel-renderer button[popovertarget]',
      ),
    ]
      .filter((boton) => {
        const caja = boton.getBoundingClientRect();
        const arriba = document.elementFromPoint(
          caja.left + caja.width / 2,
          caja.top + caja.height / 2,
        );
        return arriba?.closest('button') !== boton;
      })
      .map((boton) => boton.getAttribute('aria-label') ?? '?'),
  );
}

async function revisar(page: Page, momento: string): Promise<void> {
  await planoQuieto(page);
  expect(await rotulosQuePisan(page), `${momento}: un rótulo pisa una ficha`).toEqual([]);
  expect(await ayudasTapadas(page), `${momento}: una (i) del flujo quedó tapada`).toEqual([]);
}

async function probar(page: Page, monto: string): Promise<void> {
  const deja = page
    .getByRole('textbox', { name: /Probá con un trabajo que deje|Deja \(cobrado menos gastos\)/ })
    .first();
  await deja.fill(monto);
  await deja.press('Tab');
}

function globoAbierto(page: Page) {
  return page.locator('[popover]:popover-open');
}

async function sinInercia(page: Page): Promise<void> {
  let antes = -1;
  await expect
    .poll(async () => {
      const ahora = await page.evaluate(() => document.querySelector('main')?.scrollTop ?? 0);
      const quieto = ahora === antes;
      antes = ahora;
      return quieto;
    }, CARGA)
    .toBe(true);
}

test.describe('en la compu y la tablet', () => {
  test.skip(({ isMobile }) => isMobile, 'el lienzo es de la tablet y la compu');

  test('los rótulos del flujo no pisan ninguna ficha y su (i) se puede tocar, mirando, probando y editando', async ({
    page,
  }, testInfo) => {
    test.setTimeout(240_000);
    for (const [ancho, alto] of [
      [1440, 900],
      [1280, 800],
      [1024, 768],
      [768, 1024],
    ] as const) {
      await page.setViewportSize({ width: ancho, height: alto });
      await abrirLosTesoros(page);
      await revisar(page, `${String(ancho)}, mirando`);

      await probar(page, '2.000.000');
      await revisar(page, `${String(ancho)}, probando $ 2.000.000`);
      await page.screenshot({
        path: testInfo.outputPath(`plano-${String(ancho)}-probando.png`),
      });

      await probar(page, '12.345.678,90');
      await revisar(page, `${String(ancho)}, probando un monto largo`);
      const sobra = page.locator('.react-flow__node[data-id="reparto"]').getByText('Lo que sobra');
      expect(
        await sobra.evaluate((nombre) => nombre.scrollWidth <= nombre.clientWidth),
        `${String(ancho)}: «Lo que sobra» se cortó con el monto largo`,
      ).toBe(true);

      await page.getByRole('button', { name: 'Editar la fila' }).first().click();
      const barra = page.getByRole('region', { name: 'Editando la fila' });
      await expect(barra).toBeVisible();
      await revisar(page, `${String(ancho)}, editando y probando`);
      await page.screenshot({
        path: testInfo.outputPath(`plano-${String(ancho)}-editando.png`),
      });
      await barra.getByRole('button', { name: /^Descartar/ }).click();
      await expect(barra).toHaveCount(0);
    }
  });

  test('una (i) abierta con un clic se cierra con la rueda, en el panel y en el lienzo', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await abrirLosTesoros(page);
    await planoQuieto(page);

    const panel = page.getByRole('complementary', { name: 'Detalle' });
    await panel.locator('button[popovertarget]').first().click();
    await expect(globoAbierto(page)).toHaveCount(1);
    const delPanel = await panel.boundingBox();
    if (delPanel === null) throw new Error('el panel no está a la vista');
    await page.mouse.move(delPanel.x + delPanel.width / 2, delPanel.y + delPanel.height / 2);
    await page.mouse.wheel(0, 400);
    await expect(globoAbierto(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Qué muestra el ingreso' }).first().click();
    await expect(globoAbierto(page)).toHaveCount(1);
    const lienzo = await page.locator('.react-flow.plano').boundingBox();
    if (lienzo === null) throw new Error('el lienzo no está a la vista');
    await page.mouse.move(lienzo.x + lienzo.width / 2, lienzo.y + lienzo.height / 2);
    await page.mouse.wheel(0, 300);
    await expect(globoAbierto(page)).toHaveCount(0);
  });
});

test.describe('en el celular', () => {
  test.skip(({ isMobile }) => !isMobile, 'el plano vertical es del celular');

  test('la explicación de una (i) del plano se cierra al deslizar con el dedo', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await abrirLosTesoros(page);

    const compromisos = page.getByRole('button', { name: 'Qué son los compromisos' }).first();
    await compromisos.evaluate((boton) => {
      const principal = document.querySelector('main');
      if (principal !== null) principal.scrollTop += boton.getBoundingClientRect().top - 200;
    });
    await sinInercia(page);
    await compromisos.tap();
    await expect(globoAbierto(page)).toHaveCount(1);
    const antes = await compromisos.evaluate((boton) => boton.getBoundingClientRect().top);
    await tirarYSoltar(await dedo(page), 700, 380);
    await expect(globoAbierto(page)).toHaveCount(0);
    expect(await compromisos.evaluate((boton) => boton.getBoundingClientRect().top)).toBeLessThan(
      antes,
    );
  });

  test('adentro de la hoja de un paso largo, la explicación de una (i) se cierra al deslizar con el dedo', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const tesoros = await tesorosDelTaller(sesion);
    const idDe = (clave: string) => tesoros.find((tesoro) => tesoro.clave === clave)?.id ?? '';
    const gastos = await tesoroPorRest(sesion, {
      nombre: 'Gastos fijos',
      tinta: 'grana',
      icono: 'receipt',
    });
    const renglones = ['Alquiler', 'Luz', 'Gas', 'Seguro', 'Internet', 'Contador'].map(
      (nombre, indice) => ({ nombre, monto: 10_000_000, dia: indice === 0 ? 10 : null }),
    );
    const { fila_version } = await leerLaFila(sesion);
    await guardarLaFilaPorRpc(sesion, fila_version, {
      obligaciones: [{ tesoro: idDe('diezmo'), porcentaje: 1000, base: 'ingreso' }],
      pasos: [
        {
          tesoro: idDe('hogar'),
          clase: 'sueldo',
          tope: 180_000_000,
          renglones: [],
          desde: null,
          modo: 'mes',
          hastaLaMeta: false,
        },
        {
          tesoro: gastos.id,
          clase: 'fijos',
          tope: 60_000_000,
          renglones,
          desde: null,
          modo: 'mes',
          hastaLaMeta: false,
        },
      ],
      reparto: [],
      superavit: idDe('maun'),
      sueldoPorTrabajo: false,
    });

    await abrirLosTesoros(page);
    await page
      .getByRole('region', { name: 'La fila', exact: true })
      .getByRole('button', { name: /^Compromiso 3 de 3: Gastos fijos/ })
      .tap();
    const hoja = page.getByRole('dialog', { name: 'Gastos fijos' });
    await expect(hoja).toBeVisible();
    const ayuda = hoja.locator('button[popovertarget]').first();
    await ayuda.tap();
    await expect(globoAbierto(page)).toHaveCount(1);
    const antes = await ayuda.evaluate((boton) => boton.getBoundingClientRect().top);
    await tirarYSoltar(await dedo(page), 700, 420);
    await expect(globoAbierto(page)).toHaveCount(0);
    expect(await ayuda.evaluate((boton) => boton.getBoundingClientRect().top)).toBeLessThan(antes);
  });

  test('con «Probá un cobro», la pantalla no se corre de costado a 320, 360 y 390 de ancho', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    for (const ancho of [320, 360, 390]) {
      await page.setViewportSize({ width: ancho, height: 844 });
      await abrirLosTesoros(page);
      const probarUnCobro = page.getByRole('region', { name: 'Probar un cobro' });
      await probarUnCobro.getByRole('button', { name: /^\$\s2\.000\.000$/ }).tap();
      await expect(page.getByText('Ingreso libre')).toBeVisible();
      for (const monto of [null, '12.345.678']) {
        if (monto !== null) {
          const deja = probarUnCobro.getByRole('textbox').first();
          await deja.fill(monto);
          await deja.press('Tab');
        }
        await expect
          .poll(
            () =>
              page.evaluate(() => {
                const principal = document.querySelector('main');
                return principal === null ? -1 : principal.scrollWidth - principal.clientWidth;
              }),
            { message: `${String(ancho)} px, ${monto ?? '$ 2.000.000'}` },
          )
          .toBe(0);
      }
    }
  });
});

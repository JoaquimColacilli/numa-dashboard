import { readdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { RAIZ_DE_LA_APP } from '../apoyo/entorno';
import { indicadorDeSync, saldosEnInicio } from '../apoyo/pantalla';
import {
  ajustarTaller,
  crearCliente,
  distribucionDe,
  guardarLaFilaPorRpc,
  guardarProyectoPorRpc,
  hoyEnElTaller,
  idDelTesoro,
  iniciarSesionDePrueba,
  leerLaFila,
  movimientosDelTaller,
  movimientosPorRest,
  repartoDelCobro,
  saldoDelTesoro,
  tesoroPorRest,
  tesorosDelTaller,
  vaciarTaller,
  type SesionDePrueba,
} from '../apoyo/taller';

const SUELDO = 50_000_000;
const FIJOS = 25_000_000;
const CARGA = { timeout: 30_000 };

let sesion: SesionDePrueba;

test.beforeEach(async () => {
  sesion = await iniciarSesionDePrueba();
  await vaciarTaller(sesion);
  await ajustarTaller(sesion, {
    sueldo_mensual_centavos: SUELDO,
    costos_fijos_centavos: FIJOS,
  });
});

function chunkDelLienzo(): string {
  const nombre = readdirSync(path.join(RAIZ_DE_LA_APP, 'dist', 'assets')).find((archivo) =>
    /^Lienzo-[\w-]+\.js$/.test(archivo),
  );
  if (nombre === undefined) {
    throw new Error('el build no tiene el chunk del lienzo: corré el build antes del e2e');
  }
  return nombre;
}

function lienzo(page: Page): Locator {
  return page.locator('.react-flow.plano');
}

function ficha(page: Page, nombre: RegExp): Locator {
  return lienzo(page).getByRole('group', { name: nombre });
}

function rotulo(page: Page): Locator {
  return page.getByRole('group', { name: 'Rótulo del plano' });
}

async function abrirLosTesoros(page: Page): Promise<void> {
  await page.goto('/tesoros');
  await expect(page.getByRole('heading', { level: 1, name: 'Tesoros' })).toBeVisible(CARGA);
}

async function centro(elemento: Locator): Promise<{ x: number; y: number }> {
  const caja = await elemento.boundingBox();
  if (caja === null) throw new Error('el elemento no está a la vista');
  return { x: caja.x + caja.width / 2, y: caja.y + caja.height / 2 };
}

async function arrastrarConElMouse(
  page: Page,
  desde: Locator,
  hasta: Locator,
  antesDeSoltar: () => Promise<void>,
): Promise<void> {
  const salida = await centro(desde);
  const llegada = await centro(hasta);
  await page.mouse.move(salida.x, salida.y);
  await page.mouse.down();
  await page.mouse.move(salida.x, salida.y + 24, { steps: 4 });
  await page.mouse.move(llegada.x, llegada.y, { steps: 24 });
  await antesDeSoltar();
  await page.mouse.up();
}

async function trabajoParaCobrar(titulo: string, monto: number): Promise<string> {
  const clienteId = await crearCliente(sesion, `Cliente de ${titulo}`);
  const id = crypto.randomUUID();
  await guardarProyectoPorRpc(sesion, {
    proyecto: {
      id,
      version: null,
      cliente_id: clienteId,
      titulo,
      estado: 'entregado',
      presupuesto_centavos: monto,
      comprobante: 'sin_comprobante',
    },
    pagos: [
      { id: crypto.randomUUID(), fecha: hoyEnElTaller(), concepto: 'Todo', monto_centavos: monto },
    ],
    gastos: [],
  });
  return id;
}

test.describe('en la compu', () => {
  test.skip(({ isMobile }) => isMobile, 'el lienzo es de la tablet y la compu');

  test('la fila de siempre se prueba con un cobro, se arma en el lienzo y se guarda como la revisión siguiente', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const cocos = await idDelTesoro(sesion, 'cocos');
    await abrirLosTesoros(page);

    const primeraVez = page.getByRole('region', { name: 'La fila, la primera vez' });
    await expect(primeraVez).toBeVisible();
    await expect(
      primeraVez.getByRole('heading', { name: 'Cada cobro baja por la fila' }),
    ).toBeVisible();
    await expect(
      ficha(page, /^Paso 1 de 2: Hogar, sueldo, hasta \$\s500\.000 por mes/),
    ).toBeVisible(CARGA);
    await expect(
      ficha(page, /^Paso 2 de 2: Maun, gastos fijos, hasta \$\s250\.000 por mes/),
    ).toBeVisible();
    await expect(rotulo(page)).toContainText(/Rige\s*de Ajustes/);

    const detalle = page.getByRole('complementary', { name: 'Detalle' });
    await detalle.getByRole('button', { name: /^\$\s2\.000\.000$/ }).click();
    const tabla = detalle.getByRole('list', { name: 'Cómo baja este cobro' });
    await expect(tabla.getByRole('listitem')).toHaveText([
      /^Diezmo 10%.*\$\s200\.000$/,
      /Hogar.*\$\s500\.000/,
      /Maun.*\$\s250\.000/,
      /^Lo que sobra.*\$\s1\.050\.000$/,
      /^Maun, el resto 100%.*\$\s1\.050\.000$/,
    ]);
    await expect(detalle.getByText('da la ganancia')).toBeAttached();
    await expect(lienzo(page).getByText(/^Probando con \$\s2\.000\.000$/)).toBeVisible();
    await expect
      .poll(() =>
        lienzo(page)
          .locator('.react-flow__edge path:not(.react-flow__edge-path)')
          .evaluateAll(
            (caminos) =>
              caminos.filter((camino) => Number(camino.getAttribute('stroke-width')) > 2).length,
          ),
      )
      .toBeGreaterThanOrEqual(4);

    await page.getByRole('button', { name: 'Editar la fila' }).first().click();
    const barra = page.getByRole('region', { name: 'Editando la fila' });
    await expect(barra).toBeVisible();
    await expect(primeraVez).toHaveCount(0);

    await lienzo(page).getByRole('button', { name: 'Sumar un paso acá' }).last().click();
    const menu = page.getByRole('menu', { name: 'Sumar como paso 3' });
    await expect(menu).toBeVisible();
    await menu.getByRole('menuitem', { name: 'Un tesoro nuevo' }).click();
    const nuevo = page.getByRole('dialog', { name: 'Nuevo tesoro' });
    await expect(nuevo).toBeVisible();
    await nuevo.getByLabel('Nombre', { exact: true }).fill('Vacaciones');
    await expect(nuevo.getByRole('radio', { name: /^Como paso, al final/ })).toBeChecked();
    await nuevo.getByLabel('Tope por mes', { exact: true }).fill('150.000');
    await nuevo.getByRole('button', { name: 'Crear el tesoro' }).click();
    await expect(nuevo).toHaveCount(0);

    const vacaciones = ficha(page, /^Paso 3 de 3: Vacaciones, prioridad/);
    await expect(vacaciones).toContainText('$ 150.000');
    await expect(detalle.getByRole('heading', { name: 'Vacaciones' })).toBeVisible();
    await detalle.getByLabel('Tope por mes de Vacaciones').fill('200.000');
    await expect(
      ficha(page, /^Paso 3 de 3: Vacaciones, prioridad, hasta \$\s200\.000 por mes/),
    ).toBeVisible();

    const tirador = vacaciones.locator('.react-flow__handle[data-handleid="abajo"]');
    await expect(tirador).toHaveClass(/connectablestart/);
    const enElEstante = lienzo(page).getByTestId(`rf__node-estante-${cocos}`);
    await expect(enElEstante).toHaveAccessibleName(/^Cocos, en el estante/);
    await arrastrarConElMouse(
      page,
      tirador,
      enElEstante.locator('.react-flow__handle[data-handleid="arriba"]'),
      async () => {
        await expect(
          page.getByRole('status').filter({ hasText: 'Soltá: Cocos entra como paso 4' }),
        ).toBeVisible();
      },
    );
    await expect(ficha(page, /^Paso 4 de 4: Cocos, prioridad/)).toBeVisible();
    await expect(detalle.getByRole('heading', { name: 'Cocos' })).toBeVisible();

    await detalle.getByRole('button', { name: 'Subir' }).click();
    await expect(ficha(page, /^Paso 3 de 4: Cocos/)).toBeVisible();
    await expect(ficha(page, /^Paso 4 de 4: Vacaciones/)).toBeVisible();

    const { fila_version: antes } = await leerLaFila(sesion);
    await expect(rotulo(page)).toContainText(new RegExp(`Rev\\.\\s*${String(antes)}(?!\\d)`));
    await barra.getByRole('button', { name: 'Guardar la fila' }).click();
    const guardar = page.getByRole('dialog', { name: 'Guardar la fila' });
    await expect(guardar).toContainText(`Pasa a ser la revisión ${String(antes + 1)}`);
    await expect(guardar).toContainText('Cocos entra como paso 3, con $ 0 por mes.');
    await expect(guardar).toContainText('Vacaciones entra como paso 4, con $ 200.000 por mes.');
    await guardar.getByRole('button', { name: 'Guardar la fila' }).click();

    await expect(barra).toHaveCount(0);
    await expect(rotulo(page)).toContainText(new RegExp(`Rev\\.\\s*${String(antes + 1)}(?!\\d)`));
    await expect(indicadorDeSync(page)).toBeHidden(CARGA);
    await expect.poll(async () => (await leerLaFila(sesion)).fila_version, CARGA).toBe(antes + 1);

    const tesoros = await tesorosDelTaller(sesion);
    const nombreDe = (id: string) => tesoros.find((tesoro) => tesoro.id === id)?.nombre ?? id;
    const pasos = ((await leerLaFila(sesion)).fila?.pasos ?? []) as {
      tesoro: string;
      tope: number;
    }[];
    expect(pasos.map((paso) => [nombreDe(paso.tesoro), paso.tope])).toEqual([
      ['Hogar', SUELDO],
      ['Maun', FIJOS],
      ['Cocos', 0],
      ['Vacaciones', 20_000_000],
    ]);
  });
});

test.describe('en el celular', () => {
  test.skip(({ isMobile }) => !isMobile, 'el plano vertical es del celular');

  test('la pantalla no baja React Flow al abrir; Subir, Bajar y la hoja del paso andan, y el plano completo sí lo baja', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const chunk = chunkDelLienzo();
    const pedidos: string[] = [];
    page.on('request', (pedido) => {
      if (pedido.url().includes(chunk)) pedidos.push(pedido.url());
    });

    await abrirLosTesoros(page);
    const fila = page.getByRole('region', { name: 'La fila', exact: true });
    await expect(fila).toBeVisible();
    await expect(page.getByRole('region', { name: 'La fila, la primera vez' })).toBeVisible();
    await expect(fila.getByRole('button', { name: /^Paso 1 de 2: Hogar/ })).toBeVisible();
    await expect(fila.getByRole('button', { name: /^Paso 2 de 2: Maun/ })).toBeVisible();
    await page.waitForTimeout(1_000);
    expect(pedidos).toEqual([]);

    await page.getByRole('button', { name: 'Editar', exact: true }).click();
    const barra = page.getByRole('region', { name: 'Editando la fila' });
    await expect(barra).toBeVisible();

    const lugarDeHogar = page.getByRole('group', { name: 'Lugar de Hogar' });
    await expect(lugarDeHogar.getByRole('button', { name: 'Subir' })).toBeDisabled();
    await lugarDeHogar.getByRole('button', { name: 'Bajar' }).click();
    await expect(fila.getByRole('button', { name: /^Paso 1 de 2: Maun/ })).toBeVisible();
    await expect(fila.getByRole('button', { name: /^Paso 2 de 2: Hogar/ })).toBeVisible();
    await expect(lugarDeHogar.getByRole('button', { name: 'Bajar' })).toBeDisabled();
    await lugarDeHogar.getByRole('button', { name: 'Subir' }).click();
    await expect(fila.getByRole('button', { name: /^Paso 1 de 2: Hogar/ })).toBeVisible();
    await expect(fila.getByRole('button', { name: /^Paso 2 de 2: Maun/ })).toBeVisible();

    await fila.getByRole('button', { name: /^Paso 2 de 2: Maun/ }).click();
    const hoja = page.getByRole('dialog', { name: 'Maun' });
    await expect(hoja).toBeVisible();
    await expect(hoja).toContainText('Paso 2 de 2');
    await hoja.getByRole('textbox', { name: 'Monto de Costos fijos' }).fill('300.000');
    await expect(hoja).toContainText('$ 300.000');
    await hoja.getByRole('button', { name: 'Listo', exact: true }).click();
    await expect(hoja).toHaveCount(0);
    await expect(
      fila.getByRole('button', { name: /^Paso 2 de 2: Maun, gastos fijos, hasta \$\s300\.000/ }),
    ).toBeVisible();

    await barra.getByRole('button', { name: 'Descartar los cambios' }).click();
    await expect(barra).toHaveCount(0);
    await expect(
      fila.getByRole('button', { name: /^Paso 2 de 2: Maun, gastos fijos, hasta \$\s250\.000/ }),
    ).toBeVisible();
    expect(pedidos).toEqual([]);

    const pedido = page.waitForRequest((uno) => uno.url().includes(chunk));
    await page.getByRole('button', { name: 'Ver el plano completo' }).click();
    await pedido;
    const plano = page.getByRole('dialog', { name: 'El plano de la fila' });
    await expect(plano).toBeVisible();
    await expect(plano.locator('.react-flow__node[aria-label^="Paso 2 de 2: Maun"]')).toBeVisible(
      CARGA,
    );
    await plano.getByRole('button', { name: 'Cerrar el plano' }).click();
    await expect(plano).toHaveCount(0);
    expect(pedidos.length).toBeGreaterThan(0);
  });
});

test('un cobro con la fila guardada reparte por la fila y la ficha del paso sube su nivel', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const TOPE = 40_000_000;
  const [hogar, maun] = await Promise.all([
    idDelTesoro(sesion, 'hogar'),
    idDelTesoro(sesion, 'maun'),
  ]);
  const herramientas = await tesoroPorRest(sesion, {
    nombre: 'Herramientas',
    descripcion: 'La plegadora nueva',
    tinta: 'mostaza',
    icono: 'wrench',
  });
  const { fila_version } = await leerLaFila(sesion);
  await guardarLaFilaPorRpc(sesion, fila_version, {
    pasos: [
      { tesoro: hogar, clase: 'sueldo', tope: SUELDO, renglones: [], desde: null },
      {
        tesoro: maun,
        clase: 'fijos',
        tope: FIJOS,
        renglones: [{ nombre: 'Alquiler del taller', monto: FIJOS }],
        desde: null,
      },
      { tesoro: herramientas.id, clase: 'prioridad', tope: TOPE, renglones: [], desde: null },
    ],
    reparto: [],
    sueldoPorTrabajo: false,
  });

  const nivel = page.getByRole('meter', { name: /^Herramientas en / });
  await abrirLosTesoros(page);
  await expect(nivel).toHaveAttribute('aria-valuenow', '0', CARGA);

  const id = await trabajoParaCobrar('Placard del pasillo', 100_000_000);
  await page.goto(`/proyectos/${id}`);
  await page.getByRole('button', { name: /^Cobrar/ }).click();
  await page.getByRole('button', { name: /^Cobrar y repartir/ }).click();
  await expect(page).toHaveURL(new RegExp(`/proyectos/${id}$`));
  await expect.poll(async () => (await distribucionDe(sesion, id))?.estado, CARGA).toBe('cobrado');

  expect(await repartoDelCobro(sesion, id)).toEqual([
    { tesoro: 'hogar', clase: 'sueldo', objetivo: SUELDO, previo: 0, monto: SUELDO },
    { tesoro: 'maun', clase: 'fijos', objetivo: FIJOS, previo: 0, monto: FIJOS },
    { tesoro: 'Herramientas', clase: 'prioridad', objetivo: TOPE, previo: 0, monto: 15_000_000 },
  ]);
  expect(await saldoDelTesoro(sesion, herramientas.id)).toBe(15_000_000);

  await abrirLosTesoros(page);
  await expect(nivel).toHaveAttribute('aria-valuenow', '38', CARGA);
  await expect(nivel).toHaveAttribute('aria-valuetext', /^\$\s150\.000 de \$\s400\.000$/);
});

test('cubrir el faltante desde Inicio pasa la plata al paso y el aviso se va', async ({ page }) => {
  test.setTimeout(120_000);
  const [hogar, maun] = await Promise.all([
    idDelTesoro(sesion, 'hogar'),
    idDelTesoro(sesion, 'maun'),
  ]);
  const hoy = hoyEnElTaller();
  await movimientosPorRest(sesion, [
    {
      id: crypto.randomUUID(),
      fecha: hoy,
      tipo: 'ingreso',
      tesoro_origen: null,
      tesoro_destino: 'hogar',
      monto_centavos: 40_000_000,
      categoria: 'Docencia',
      descripcion: 'Clases del mes',
    },
  ]);

  await page.goto('/');
  const aviso = page.getByRole('region', { name: 'Falta para los costos fijos' });
  await expect(aviso).toBeVisible(CARGA);
  await expect(aviso).toContainText('Faltan $ 250.000 para los costos fijos de');
  await aviso.getByRole('button', { name: 'Elegir de qué tesoro sacar' }).click();

  const hoja = page.getByRole('dialog', { name: 'Cubrir los gastos fijos' });
  await expect(hoja).toBeVisible();
  await hoja.getByRole('checkbox', { name: /^Hogar/ }).check();
  await hoja.getByRole('textbox', { name: 'Cuánto sale de Hogar' }).fill('250.000');
  await hoja.getByRole('button', { name: /^Pasar \$\s250\.000 a Maun$/ }).click();

  await expect(aviso).toHaveCount(0);
  await expect(indicadorDeSync(page)).toBeHidden(CARGA);
  await expect.poll(async () => (await movimientosDelTaller(sesion)).length, CARGA).toBe(2);
  const cubierta = (await movimientosDelTaller(sesion)).find(
    (fila) => fila.tipo === 'transferencia',
  );
  expect(cubierta).toMatchObject({
    tesoro_origen: 'hogar',
    tesoro_destino: 'maun',
    desde_id: hogar,
    hacia_id: maun,
    cubre_el_mes: `${hoy.slice(0, 7)}-01`,
    monto_centavos: 25_000_000,
    categoria: 'Cubrir el mes',
  });

  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Tesoros' })).toBeVisible(CARGA);
  await expect(aviso).toHaveCount(0);
});

test('archivar un tesoro con saldo pasa la plata a Maun y lo saca de las tarjetas', async ({
  page,
  isMobile,
}) => {
  test.setTimeout(120_000);
  const NOMBRE = 'Vacaciones en la costa';
  const maun = await idDelTesoro(sesion, 'maun');
  const propio = await tesoroPorRest(sesion, {
    nombre: NOMBRE,
    descripcion: 'Dos semanas en enero',
    tinta: 'petroleo',
    icono: 'plane',
  });
  await movimientosPorRest(sesion, [
    {
      id: crypto.randomUUID(),
      fecha: hoyEnElTaller(),
      tipo: 'ingreso',
      tesoro_origen: null,
      tesoro_destino: null,
      hacia_id: propio.id,
      monto_centavos: 45_000_000,
      categoria: 'E2E',
      descripcion: 'Lo juntado para las vacaciones',
    },
  ]);

  const maunAntes = await saldoDelTesoro(sesion, maun);

  await page.goto('/');
  const tarjetas = page.getByRole('region', { name: 'Tesoros' });
  await expect(tarjetas.getByRole('button', { name: new RegExp(`^${NOMBRE}`) })).toBeVisible(CARGA);
  const enInicio = await saldosEnInicio(page);

  await abrirLosTesoros(page);
  const enElEstante = new RegExp(`^${NOMBRE}, en el estante, tiene \\$\\s450\\.000`);
  if (isMobile) {
    await page
      .getByRole('region', { name: 'Estante', exact: true })
      .getByRole('button', { name: enElEstante })
      .click();
  } else {
    await ficha(page, enElEstante).click();
  }
  await page.getByRole('button', { name: `Editar ${NOMBRE}`, exact: true }).click();
  await page.getByRole('button', { name: 'Archivar', exact: true }).click();
  const archivar = page.getByRole('dialog', { name: `Archivar ${NOMBRE}` });
  await expect(archivar).toBeVisible();
  await expect(archivar.getByRole('radio', { name: /^Maun/ })).toBeChecked();
  await archivar.getByRole('button', { name: /^Pasar \$\s450\.000 a Maun y archivar$/ }).click();
  await expect(archivar).toHaveCount(0);

  await expect(indicadorDeSync(page)).toBeHidden(CARGA);
  await expect
    .poll(
      async () =>
        (await tesorosDelTaller(sesion, { conLosArchivados: true })).find(
          (tesoro) => tesoro.id === propio.id,
        )?.archivado_at ?? null,
      CARGA,
    )
    .not.toBeNull();
  expect(await saldoDelTesoro(sesion, propio.id)).toBe(0);
  expect(await saldoDelTesoro(sesion, maun)).toBe(maunAntes + 45_000_000);
  expect(
    (await movimientosDelTaller(sesion)).find((fila) => fila.tipo === 'transferencia'),
  ).toMatchObject({
    tesoro_origen: null,
    tesoro_destino: 'maun',
    desde_id: propio.id,
    hacia_id: maun,
    monto_centavos: 45_000_000,
    categoria: 'Archivo de un tesoro',
  });

  await page.goto('/');
  await expect(tarjetas).toBeVisible(CARGA);
  await expect(tarjetas.getByRole('button', { name: new RegExp(`^${NOMBRE}`) })).toHaveCount(0);
  expect((await saldosEnInicio(page)).maun).toBe(enInicio.maun + 450_000);
});

test.describe('en la tablet', () => {
  test.skip(({ isMobile }) => isMobile, 'la tablet va con su propio ancho, una sola vez');
  test.use({ viewport: { width: 834, height: 1112 } });

  test('elegir una ficha abre el panel de abajo, la ficha queda entera arriba y el lienzo se sigue pudiendo tocar', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await abrirLosTesoros(page);
    const maun = ficha(page, /^Paso 2 de 2: Maun/);
    await expect(maun).toBeVisible(CARGA);
    await expect(page.getByRole('complementary', { name: 'Detalle' })).toHaveCount(0);

    const entera = async (unaFicha: Locator, panel: Locator) => {
      const caja = await unaFicha.boundingBox();
      const delPanel = await panel.boundingBox();
      const delLienzo = await lienzo(page).boundingBox();
      if (caja === null || delPanel === null || delLienzo === null) return false;
      return caja.y >= delLienzo.y && caja.y + caja.height <= delPanel.y;
    };

    await maun.click();
    const panelDeMaun = page.getByRole('region', { name: 'Maun', exact: true });
    await expect(panelDeMaun).toBeVisible();
    await expect(panelDeMaun).toContainText('Paso 2 de 2');
    await expect.poll(() => entera(maun, panelDeMaun)).toBe(true);

    const hogar = ficha(page, /^Paso 1 de 2: Hogar/);
    await hogar.click();
    const panelDeHogar = page.getByRole('region', { name: 'Hogar', exact: true });
    await expect(panelDeHogar).toBeVisible();
    await expect(panelDeMaun).toHaveCount(0);
    await expect.poll(() => entera(hogar, panelDeHogar)).toBe(true);

    await page.locator('.react-flow__pane').click({ position: { x: 12, y: 12 } });
    await expect(panelDeHogar).toHaveCount(0);
  });
});

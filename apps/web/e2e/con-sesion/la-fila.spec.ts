import { readdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { endpointsCreados, servidorDeAvisosSimulado, simularPush } from '../apoyo/avisos';
import { RAIZ_DE_LA_APP } from '../apoyo/entorno';
import { indicadorDeSync, saldosEnInicio } from '../apoyo/pantalla';
import {
  ajustarTaller,
  crearCliente,
  darDeBajaAvisosPorRpc,
  distribucionDe,
  estadoDeLosAvisosPorRpc,
  guardarLaFilaPorRpc,
  guardarPreferenciasDeAvisosPorRpc,
  guardarProyectoPorRpc,
  hoyEnElTaller,
  idDelTesoro,
  iniciarSesionDePrueba,
  leerLaFila,
  movimientosDelTaller,
  movimientosPorRest,
  repartoDelCobro,
  repartosDe,
  saldoDelTesoro,
  tesoroPorRest,
  tesorosDelTaller,
  vaciarTaller,
  type FilaDeTesoro,
  type SesionDePrueba,
} from '../apoyo/taller';

const SUELDO = 50_000_000;
const FIJOS = 25_000_000;
const CARGA = { timeout: 30_000 };
const BUENOS_AIRES = 'America/Argentina/Buenos_Aires';

let sesion: SesionDePrueba;

test.beforeEach(async () => {
  sesion = await iniciarSesionDePrueba();
  await vaciarTaller(sesion);
  await ajustarTaller(sesion, {
    sueldo_mensual_centavos: SUELDO,
    costos_fijos_centavos: FIJOS,
    meta_cocos_centavos: 0,
  });
});

interface DelSistema {
  hogar: string;
  maun: string;
  diezmo: string;
}

type ModoParaGuardar = 'mes' | 'saldo' | 'trabajo';

interface ObligacionParaGuardar {
  tesoro: string;
  porcentaje: number;
  base: 'cobrado' | 'ingreso';
}

interface RenglonParaGuardar {
  nombre: string;
  monto: number;
  dia: number | null;
}

interface PasoParaGuardar {
  tesoro: string;
  clase: 'sueldo' | 'fijos' | 'prioridad';
  tope: number;
  renglones: RenglonParaGuardar[];
  desde: null;
  modo: ModoParaGuardar;
  hastaLaMeta: boolean;
}

interface ParteParaGuardar {
  tesoro: string;
  porcentaje: number;
  hastaLaMeta: boolean;
}

async function delSistema(): Promise<DelSistema> {
  const tesoros = await tesorosDelTaller(sesion);
  const idDe = (clave: 'hogar' | 'maun' | 'diezmo'): string => {
    const tesoro = tesoros.find((uno) => uno.clave === clave);
    if (tesoro === undefined) throw new Error(`el taller de prueba no tiene el tesoro ${clave}`);
    return tesoro.id;
  };
  return { hogar: idDe('hogar'), maun: idDe('maun'), diezmo: idDe('diezmo') };
}

function elDiezmo(diezmo: string): ObligacionParaGuardar {
  return { tesoro: diezmo, porcentaje: 1000, base: 'ingreso' };
}

function sueldoDelHogar(hogar: string, tope: number): PasoParaGuardar {
  return {
    tesoro: hogar,
    clase: 'sueldo',
    tope,
    renglones: [],
    desde: null,
    modo: 'mes',
    hastaLaMeta: false,
  };
}

function compromisoConRenglones(
  tesoro: string,
  renglones: RenglonParaGuardar[],
  modo: ModoParaGuardar,
): PasoParaGuardar {
  return {
    tesoro,
    clase: 'fijos',
    tope: renglones.reduce((suma, renglon) => suma + renglon.monto, 0),
    renglones,
    desde: null,
    modo,
    hastaLaMeta: false,
  };
}

async function guardarLaFila(fila: {
  obligaciones: ObligacionParaGuardar[];
  pasos?: PasoParaGuardar[];
  reparto?: ParteParaGuardar[];
  superavit: string;
}): Promise<void> {
  const { fila_version } = await leerLaFila(sesion);
  await guardarLaFilaPorRpc(sesion, fila_version, {
    obligaciones: fila.obligaciones,
    pasos: fila.pasos ?? [],
    reparto: fila.reparto ?? [],
    superavit: fila.superavit,
    sueldoPorTrabajo: false,
  });
}

async function tesoroLlamado(nombre: string): Promise<FilaDeTesoro> {
  let encontrado: FilaDeTesoro | undefined;
  await expect
    .poll(async () => {
      encontrado = (await tesorosDelTaller(sesion)).find((tesoro) => tesoro.nombre === nombre);
      return encontrado !== undefined;
    }, CARGA)
    .toBe(true);
  if (encontrado === undefined) throw new Error(`no apareció el tesoro ${nombre}`);
  return encontrado;
}

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

function detalleDe(page: Page): Locator {
  return page.getByRole('complementary', { name: 'Detalle' });
}

function nuevoDelEstante(page: Page): Locator {
  return lienzo(page)
    .locator('.react-flow__node[data-id="nuevo"]')
    .getByRole('button', { name: 'Nuevo tesoro' });
}

async function abrirLosTesoros(page: Page, ruta = '/tesoros'): Promise<void> {
  await page.goto(ruta);
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

async function trabajo(
  titulo: string,
  {
    estado = 'entregado',
    cobrado,
    gastos = 0,
  }: { estado?: 'entregado' | 'en_curso'; cobrado: number; gastos?: number },
): Promise<string> {
  const clienteId = await crearCliente(sesion, `Cliente de ${titulo}`);
  const id = crypto.randomUUID();
  const hoy = hoyEnElTaller();
  await guardarProyectoPorRpc(sesion, {
    proyecto: {
      id,
      version: null,
      cliente_id: clienteId,
      titulo,
      estado,
      presupuesto_centavos: estado === 'en_curso' ? cobrado * 2 : cobrado,
      comprobante: 'sin_comprobante',
    },
    pagos: [
      {
        id: crypto.randomUUID(),
        fecha: hoy,
        concepto: estado === 'en_curso' ? 'Seña' : 'Todo',
        monto_centavos: cobrado,
      },
    ],
    gastos:
      gastos === 0
        ? []
        : [
            {
              id: crypto.randomUUID(),
              fecha: hoy,
              descripcion: 'Melamina',
              monto_centavos: gastos,
            },
          ],
  });
  return id;
}

async function cobrarDesdeLaFicha(page: Page, id: string): Promise<void> {
  await page.goto(`/proyectos/${id}`);
  await page.getByRole('button', { name: /^Cobrar/ }).click();
  await page.getByRole('button', { name: /^Cobrar y repartir/ }).click();
  await expect(page).toHaveURL(new RegExp(`/proyectos/${id}$`));
  await expect.poll(async () => (await distribucionDe(sesion, id))?.estado, CARGA).toBe('cobrado');
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
    const diezmo = ficha(
      page,
      /^Obligación 1 de 3: Diezmo, 10% sobre el ingreso; a pagar \$\s0; no se puede sacar de la fila$/,
    );
    await expect(diezmo).toBeVisible(CARGA);
    await expect(diezmo).toHaveAttribute('aria-roledescription', 'obligación');
    const hogar = ficha(page, /^Compromiso 2 de 3: Hogar, sueldo, hasta \$\s500\.000 por mes/);
    await expect(hogar).toBeVisible();
    await expect(hogar).toHaveAttribute('aria-roledescription', 'compromiso');
    await expect(ficha(page, /^Compromiso 3 de 3: Maun, hasta \$\s250\.000 por mes/)).toBeVisible();
    await expect(
      ficha(page, /^Superávit: Maun recibe el resto, 100%, y los centavos$/),
    ).toHaveAttribute('aria-roledescription', 'superávit');
    await expect(rotulo(page)).toContainText(/Rige\s*de Ajustes/);

    const detalle = detalleDe(page);
    await detalle.getByRole('button', { name: /^\$\s2\.000\.000$/ }).click();
    const tabla = detalle.getByRole('list', { name: 'Cómo baja este cobro' });
    await expect(tabla.getByRole('listitem')).toHaveText([
      /^Diezmo 10%.*\$\s200\.000$/,
      /^Ingreso libre.*\$\s1\.800\.000$/,
      /^Hogar.*\$\s500\.000/,
      /^Maun.*\$\s250\.000/,
      /^Ganancia.*\$\s1\.050\.000$/,
      /^Lo que sobra.*\$\s1\.050\.000$/,
      /^Maun, el resto 100%.*\$\s1\.050\.000$/,
    ]);
    await expect(detalle.getByText('da el ingreso')).toBeAttached();
    await expect(
      lienzo(page).getByText(/^Prueba: un trabajo que deja \$\s2\.000\.000$/),
    ).toBeVisible();
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

    await lienzo(page).getByRole('button', { name: 'Sumar un tesoro acá' }).last().click();
    const menu = page.getByRole('menu', { name: /^Sumar un tesoro: / });
    await expect(menu).toHaveAccessibleName('Sumar un tesoro: Como compromiso, después de Maun');
    await menu.getByRole('menuitemradio', { name: 'Como ahorro fijo' }).click();
    await expect(menu.getByRole('menuitemradio', { name: 'Como ahorro fijo' })).toBeChecked();
    await menu.getByRole('menuitem', { name: 'Un tesoro nuevo' }).click();
    const nuevo = page.getByRole('dialog', { name: 'Nuevo tesoro' });
    await expect(nuevo).toBeVisible();
    await nuevo.getByLabel('Nombre', { exact: true }).fill('Vacaciones');
    await expect(nuevo.getByRole('radio', { name: /^Como ahorro fijo/ })).toBeChecked();
    await nuevo.getByRole('textbox', { name: 'Monto', exact: true }).fill('150.000');
    await nuevo.getByRole('button', { name: 'Crear el tesoro' }).click();
    await expect(nuevo).toHaveCount(0);

    const vacaciones = ficha(page, /^Ahorro fijo 4 de 4: Vacaciones, hasta \$\s150\.000 por mes/);
    await expect(vacaciones).toBeVisible();
    await expect(vacaciones).toHaveAttribute('aria-roledescription', 'ahorro');
    await expect(detalle.getByRole('heading', { name: 'Vacaciones' })).toBeVisible();
    await detalle.getByLabel('Monto de Vacaciones').fill('200.000');
    await expect(
      ficha(page, /^Ahorro fijo 4 de 4: Vacaciones, hasta \$\s200\.000 por mes/),
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
          page.getByRole('status').filter({ hasText: 'Soltá: Cocos entra como ahorro fijo 5' }),
        ).toBeVisible();
      },
    );
    await expect(ficha(page, /^Ahorro fijo 5 de 5: Cocos/)).toBeVisible();
    await expect(detalle.getByRole('heading', { name: 'Cocos' })).toBeVisible();

    await detalle.getByRole('button', { name: 'Subir' }).click();
    await expect(ficha(page, /^Ahorro fijo 4 de 5: Cocos/)).toBeVisible();
    await expect(ficha(page, /^Ahorro fijo 5 de 5: Vacaciones/)).toBeVisible();

    const { fila_version: antes } = await leerLaFila(sesion);
    await expect(rotulo(page)).toContainText(new RegExp(`Rev\\.\\s*${String(antes)}(?!\\d)`));
    await barra.getByRole('button', { name: 'Guardar la fila' }).click();
    const guardar = page.getByRole('dialog', { name: 'Guardar la fila' });
    await expect(guardar).toContainText(`Pasa a ser la revisión ${String(antes + 1)}`);
    await expect(guardar).toContainText('Cocos entra como ahorro fijo 4, con $ 0 por mes.');
    await expect(guardar).toContainText(
      'Vacaciones entra como ahorro fijo 5, con $ 200.000 por mes.',
    );
    await guardar.getByRole('button', { name: 'Guardar la fila' }).click();

    await expect(barra).toHaveCount(0);
    await expect(rotulo(page)).toContainText(new RegExp(`Rev\\.\\s*${String(antes + 1)}(?!\\d)`));
    await expect(indicadorDeSync(page)).toBeHidden(CARGA);
    await expect.poll(async () => (await leerLaFila(sesion)).fila_version, CARGA).toBe(antes + 1);

    const tesoros = await tesorosDelTaller(sesion);
    const nombreDe = (id: string) => tesoros.find((tesoro) => tesoro.id === id)?.nombre ?? id;
    const guardada = (await leerLaFila(sesion)).fila;
    const pasos = (guardada?.pasos ?? []) as PasoParaGuardar[];
    expect(pasos.map((paso) => [nombreDe(paso.tesoro), paso.tope, paso.modo])).toEqual([
      ['Hogar', SUELDO, 'mes'],
      ['Maun', FIJOS, 'mes'],
      ['Cocos', 0, 'mes'],
      ['Vacaciones', 20_000_000, 'mes'],
    ]);
    expect(guardada?.obligaciones).toEqual([elDiezmo((await delSistema()).diezmo)]);
  });

  test('Ingresos Brutos al 3,5% sobre lo que cobrás entra antes del diezmo, y la prueba da la cuenta en los dos órdenes', async ({
    page,
  }) => {
    test.setTimeout(150_000);
    const { diezmo } = await delSistema();
    await abrirLosTesoros(page);
    await expect(ficha(page, /^Obligación 1 de 3: Diezmo/)).toBeVisible(CARGA);

    await page
      .getByRole('main')
      .locator('header')
      .getByRole('button', { name: 'Nuevo tesoro' })
      .click();
    const nuevo = page.getByRole('dialog', { name: 'Nuevo tesoro' });
    await expect(nuevo).toBeVisible();
    await nuevo.getByRole('radio', { name: /^Como obligación/ }).check();
    await nuevo
      .getByRole('group', { name: 'Nombres sugeridos' })
      .getByRole('button', { name: 'Ingresos Brutos' })
      .click();
    await expect(nuevo.getByLabel('Nombre', { exact: true })).toHaveValue('Ingresos Brutos');
    await expect(
      nuevo
        .getByRole('radiogroup', { name: 'Sobre qué se calcula' })
        .getByRole('radio', { name: 'Lo que cobrás' }),
    ).toBeChecked();
    await expect(nuevo.getByRole('switch', { name: 'Antes del diezmo' })).toBeChecked();
    await nuevo.getByRole('textbox', { name: 'Porcentaje (%)' }).fill('3,5');
    await nuevo.getByRole('button', { name: 'Crear el tesoro' }).click();
    await expect(nuevo).toHaveCount(0);

    const iibb = ficha(
      page,
      /^Obligación 1 de 4: Ingresos Brutos, 3,5% sobre lo que cobrás; a pagar \$\s0$/,
    );
    await expect(iibb).toBeVisible(CARGA);
    await expect(iibb).toHaveAttribute('aria-roledescription', 'obligación');
    await expect(ficha(page, /^Obligación 2 de 4: Diezmo, 10% sobre el ingreso/)).toBeVisible();
    await expect(indicadorDeSync(page)).toBeHidden(CARGA);
    const creado = await tesoroLlamado('Ingresos Brutos');
    await expect
      .poll(async () => (await leerLaFila(sesion)).fila?.obligaciones, CARGA)
      .toEqual([{ tesoro: creado.id, porcentaje: 350, base: 'cobrado' }, elDiezmo(diezmo)]);

    const detalle = detalleDe(page);
    await detalle.getByRole('button', { name: 'Cerrar el detalle' }).click();
    const probar = detalle.getByRole('region', { name: 'Probar un cobro' });
    await probar.getByRole('textbox', { name: 'Se cobró' }).fill('2.500.000');
    await probar.getByRole('textbox', { name: 'Deja (cobrado menos gastos)' }).fill('2.000.000');
    const tabla = detalle.getByRole('list', { name: 'Cómo baja este cobro' });
    await expect(tabla.getByRole('listitem')).toHaveText([
      /^Ingresos Brutos 3,5%.*\$\s87\.500$/,
      /^Diezmo 10%.*\$\s191\.250$/,
      /^Ingreso libre.*\$\s1\.721\.250$/,
      /^Hogar.*\$\s500\.000/,
      /^Maun.*\$\s250\.000/,
      /^Ganancia.*\$\s971\.250$/,
      /^Lo que sobra.*\$\s971\.250$/,
      /^Maun, el resto 100%.*\$\s971\.250$/,
    ]);

    await page.getByRole('button', { name: 'Editar la fila' }).first().click();
    const barra = page.getByRole('region', { name: 'Editando la fila' });
    await expect(barra).toBeVisible();
    await ficha(page, /^Obligación 1 de 4: Ingresos Brutos/).click();
    await expect(detalle.getByRole('heading', { name: 'Ingresos Brutos' })).toBeVisible();
    await detalle
      .getByRole('region', { name: 'Lugar en la fila' })
      .getByRole('button', { name: 'Bajar' })
      .click();
    await expect(ficha(page, /^Obligación 1 de 4: Diezmo/)).toBeVisible();
    await expect(ficha(page, /^Obligación 2 de 4: Ingresos Brutos/)).toBeVisible();
    await detalle.getByRole('button', { name: 'Cerrar el detalle' }).click();
    await expect(tabla.getByRole('listitem')).toHaveText([
      /^Diezmo 10%.*\$\s200\.000$/,
      /^Ingresos Brutos 3,5%.*\$\s87\.500$/,
      /^Ingreso libre.*\$\s1\.712\.500$/,
      /^Hogar.*\$\s500\.000/,
      /^Maun.*\$\s250\.000/,
      /^Ganancia.*\$\s962\.500$/,
      /^Lo que sobra.*\$\s962\.500$/,
      /^Maun, el resto 100%.*\$\s962\.500$/,
    ]);
    await barra.getByRole('button', { name: 'Descartar' }).click();
    await expect(barra).toHaveCount(0);
    await expect(ficha(page, /^Obligación 1 de 4: Ingresos Brutos/)).toBeVisible();
  });

  test('un compromiso que se renueva al pagar se llena con un cobro, registrar el pago lo baja y la agenda lo muestra pagado, y el cobro siguiente lo vuelve a llenar', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const ALQUILER = 50_000_000;
    const { diezmo, maun } = await delSistema();
    const gastos = await tesoroPorRest(sesion, {
      nombre: 'Gastos fijos',
      tinta: 'mostaza',
      icono: 'receipt',
    });
    await guardarLaFila({
      obligaciones: [elDiezmo(diezmo)],
      pasos: [
        compromisoConRenglones(
          gastos.id,
          [{ nombre: 'Alquiler', monto: ALQUILER, dia: 10 }],
          'saldo',
        ),
      ],
      superavit: maun,
    });
    const primero = await trabajo('Placard del alquiler', { cobrado: 100_000_000 });
    const segundo = await trabajo('Vestidor del alquiler', { cobrado: 100_000_000 });
    const lleno = [
      { tesoro: 'Gastos fijos', clase: 'fijos', objetivo: ALQUILER, previo: 0, monto: ALQUILER },
    ];

    await cobrarDesdeLaFicha(page, primero);
    expect(await repartoDelCobro(sesion, primero)).toEqual(lleno);
    expect((await repartosDe(sesion, primero)).map((uno) => [uno.tipo, uno.modo])).toEqual([
      ['paso', 'saldo'],
    ]);
    expect(await saldoDelTesoro(sesion, gastos.id)).toBe(ALQUILER);

    const dia = `${hoyEnElTaller().slice(0, 7)}-10`;
    const capa = page.getByRole('complementary', { name: /^El .+ 10 de / });
    const vencimiento = capa.locator('[data-vencimiento]');
    await page.goto('/agenda');
    await page.locator(`[data-fecha="${dia}"] > button`).first().click();
    await expect(vencimiento).toContainText('Alquiler', CARGA);
    await expect(vencimiento).toContainText('$ 500.000 de Gastos fijos');
    await expect(vencimiento).toHaveAttribute('data-hecha', 'false');
    await expect(vencimiento.getByRole('button', { name: 'Registrar el pago' })).toBeVisible();
    await vencimiento.getByRole('button', { name: 'Ver en Tesoros' }).click();
    await expect(page).toHaveURL(new RegExp(`/tesoros\\?tesoro=${gastos.id}$`));

    const detalle = detalleDe(page);
    await expect(detalle.getByRole('heading', { name: 'Gastos fijos' })).toBeVisible(CARGA);
    await expect(
      ficha(
        page,
        /^Compromiso 2 de 2: Gastos fijos, hasta \$\s500\.000, se renueva al pagar; a pagar \$\s500\.000, completo$/,
      ),
    ).toBeVisible(CARGA);
    await detalle.getByRole('button', { name: 'Registrar el pago de Alquiler' }).click();
    await expect(page).toHaveURL(
      new RegExp(
        `/finanzas/nuevo\\?clase=gasto_tesoro&tesoro=${gastos.id}&monto=${String(ALQUILER)}&categoria=Alquiler$`,
      ),
    );
    const hoja = page.getByRole('dialog', { name: 'Cargar un movimiento' });
    await expect(
      hoja.getByRole('group', { name: 'Detalle del tipo' }).getByRole('button', {
        name: 'De un tesoro',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      hoja.getByRole('group', { name: 'Sale de' }).getByRole('button', { name: 'Gastos fijos' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(hoja.getByRole('textbox', { name: 'Cuánta plata' })).toHaveValue('500.000');
    await expect(hoja.getByRole('combobox', { name: 'Categoría' })).toHaveValue('Alquiler');
    await hoja.getByRole('button', { name: 'Cargar el movimiento' }).click();
    await expect(hoja).toHaveCount(0);
    await expect(
      ficha(
        page,
        /^Compromiso 2 de 2: Gastos fijos, hasta \$\s500\.000, se renueva al pagar; a pagar \$\s0, faltan \$\s500\.000$/,
      ),
    ).toBeVisible(CARGA);
    await expect(indicadorDeSync(page)).toBeHidden(CARGA);
    await expect
      .poll(
        async () =>
          (await movimientosDelTaller(sesion))
            .filter((movimiento) => movimiento.tipo === 'gasto')
            .map((movimiento) => [
              movimiento.desde_id,
              movimiento.monto_centavos,
              movimiento.categoria,
            ]),
        CARGA,
      )
      .toEqual([[gastos.id, ALQUILER, 'Alquiler']]);
    expect(await saldoDelTesoro(sesion, gastos.id)).toBe(0);

    await page.goto('/agenda');
    await page.locator(`[data-fecha="${dia}"] > button`).first().click();
    await expect(vencimiento).toHaveAttribute('data-hecha', 'true', CARGA);
    await expect(vencimiento).toContainText('Pagado');
    await expect(vencimiento.getByRole('button', { name: 'Registrar el pago' })).toHaveCount(0);

    await cobrarDesdeLaFicha(page, segundo);
    expect(await repartoDelCobro(sesion, segundo)).toEqual(lleno);
    expect(await saldoDelTesoro(sesion, gastos.id)).toBe(ALQUILER);
  });

  test('un ahorro del 20% hasta su meta recibe solo lo que le falta y lo demás va al superávit', async ({
    page,
  }) => {
    test.setTimeout(150_000);
    const { hogar, maun, diezmo } = await delSistema();
    const inmueble = await tesoroPorRest(sesion, {
      nombre: 'Inmueble',
      tinta: 'petroleo',
      icono: 'building-2',
      meta_centavos: 30_000_000,
    });
    await movimientosPorRest(sesion, [
      {
        id: crypto.randomUUID(),
        fecha: hoyEnElTaller(),
        tipo: 'ingreso',
        tesoro_origen: null,
        tesoro_destino: null,
        hacia_id: inmueble.id,
        monto_centavos: 25_000_000,
        categoria: 'E2E',
        descripcion: 'Lo que ya estaba juntado',
      },
    ]);
    await guardarLaFila({
      obligaciones: [elDiezmo(diezmo)],
      pasos: [sueldoDelHogar(hogar, 35_000_000)],
      reparto: [{ tesoro: inmueble.id, porcentaje: 2000, hastaLaMeta: true }],
      superavit: maun,
    });
    const id = await trabajo('Cocina de la meta', { cobrado: 150_000_000 });

    await abrirLosTesoros(page);
    const parte = ficha(
      page,
      /^Ahorro: Inmueble, 20% de lo que sobra, hasta la meta; tiene \$\s250\.000 de su meta de \$\s300\.000$/,
    );
    await expect(parte).toBeVisible(CARGA);
    await expect(parte).toHaveAttribute('aria-roledescription', 'ahorro');

    const detalle = detalleDe(page);
    await detalle.getByRole('textbox', { name: 'Probá con un trabajo que deje' }).fill('1.500.000');
    const tabla = detalle.getByRole('list', { name: 'Cómo baja este cobro' });
    await expect(tabla.getByRole('listitem')).toHaveText([
      /^Diezmo 10%.*\$\s150\.000$/,
      /^Ingreso libre.*\$\s1\.350\.000$/,
      /^Hogar.*\$\s350\.000/,
      /^Ganancia.*\$\s1\.000\.000$/,
      /^Lo que sobra.*\$\s1\.000\.000$/,
      /^Inmueble 20%.*\$\s50\.000\s*llegó a la meta$/,
      /^Maun, el resto 80%.*\$\s950\.000$/,
    ]);
    await detalle
      .getByRole('radiogroup', { name: 'Con qué se prueba' })
      .getByRole('radio', { name: 'Todo en cero' })
      .click();
    await expect(tabla.getByRole('listitem').filter({ hasText: /^Inmueble/ })).toHaveText(
      /^Inmueble 20%.*\$\s200\.000$/,
    );
    await expect(tabla.getByRole('listitem').last()).toHaveText(
      /^Maun, el resto 80%.*\$\s800\.000$/,
    );

    await cobrarDesdeLaFicha(page, id);
    const repartos = await repartosDe(sesion, id);
    expect(repartos.map((uno) => [uno.tipo, uno.tesoro_id, uno.monto_centavos])).toEqual([
      ['paso', hogar, 35_000_000],
      ['parte', inmueble.id, 5_000_000],
    ]);
    expect(repartos.find((uno) => uno.tipo === 'parte')).toMatchObject({
      porcentaje_bp: 2000,
      tope_centavos: 5_000_000,
    });
    expect(await saldoDelTesoro(sesion, inmueble.id)).toBe(30_000_000);
    expect(await saldoDelTesoro(sesion, maun)).toBe(95_000_000);
  });

  test('con el superávit en su propio tesoro, el resto va ahí y Maun queda con los insumos', async ({
    page,
  }) => {
    test.setTimeout(150_000);
    const { maun, diezmo } = await delSistema();
    const superavit = await tesoroPorRest(sesion, {
      nombre: 'Superávit',
      tinta: 'verde',
      icono: 'piggy-bank',
    });
    await guardarLaFila({ obligaciones: [elDiezmo(diezmo)], superavit: superavit.id });
    await trabajo('Cocina en curso', {
      estado: 'en_curso',
      cobrado: 100_000_000,
      gastos: 40_000_000,
    });
    const id = await trabajo('Mesa para cobrar', { cobrado: 100_000_000 });

    await abrirLosTesoros(page);
    const resto = ficha(page, /^Superávit: Superávit recibe el resto, 100%, y los centavos$/);
    await expect(resto).toBeVisible(CARGA);
    await expect(resto).toHaveAttribute('aria-roledescription', 'superávit');
    await expect(ficha(page, /^Maun, en el estante, tiene \$\s1\.600\.000$/)).toBeVisible();

    await cobrarDesdeLaFicha(page, id);
    expect(
      (await repartosDe(sesion, id)).map((uno) => [uno.tipo, uno.tesoro_id, uno.monto_centavos]),
    ).toEqual([['superavit', superavit.id, 90_000_000]]);
    expect(await saldoDelTesoro(sesion, superavit.id)).toBe(90_000_000);
    expect(await saldoDelTesoro(sesion, maun)).toBe(60_000_000);

    await page.goto('/');
    const tarjetas = page.getByRole('region', { name: 'Tesoros' });
    await expect(tarjetas.getByRole('button', { name: /^Maun/ })).toContainText(
      '$ 600.000 son insumos',
      CARGA,
    );
    const delSuperavit = tarjetas.getByRole('button', { name: /^Superávit/ });
    await expect(delSuperavit).toContainText('$ 900.000');
    await expect(delSuperavit.locator('[data-tipo-del-tesoro]')).toHaveText('Superávit');
    const panorama = page.getByRole('region', { name: 'Panorama' });
    await expect(panorama.locator('[data-cifra-del-panorama="superavit"]')).toContainText(
      '$ 900.000',
    );
    await expect(panorama.locator('[data-cifra-del-panorama="superavit"]')).toContainText(
      'en Superávit',
    );
    await expect(panorama.locator('[data-cifra-del-panorama="insumos"]')).toContainText(
      '$ 600.000',
    );
  });

  test('«Nuevo tesoro» del estante abre la hoja sin estar editando, con el clic y con Enter', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await abrirLosTesoros(page);
    const boton = nuevoDelEstante(page);
    await expect(boton).toBeVisible(CARGA);
    await expect(page.getByRole('region', { name: 'Editando la fila' })).toHaveCount(0);

    await boton.click();
    const hoja = page.getByRole('dialog', { name: 'Nuevo tesoro' });
    await expect(hoja).toBeVisible();
    await expect(hoja.getByRole('radio', { name: /^Al estante/ })).toBeChecked();
    await hoja.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await expect(hoja).toHaveCount(0);

    await boton.focus();
    await page.keyboard.press('Enter');
    await expect(hoja).toBeVisible();
    await expect(hoja.getByRole('radio', { name: /^Al estante/ })).toBeChecked();
    await page.keyboard.press('Escape');
    await expect(hoja).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Editando la fila' })).toHaveCount(0);
  });
});

test.describe('en el celular', () => {
  test.skip(({ isMobile }) => !isMobile, 'el plano vertical es del celular');

  test('la pantalla no baja React Flow al abrir; los grupos llevan su tipo, Subir, Bajar y la hoja del paso andan, y el plano completo sí lo baja', async ({
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
    await expect(fila.getByRole('button', { name: /^Obligación 1 de 3: Diezmo/ })).toBeVisible();
    await expect(fila.getByRole('button', { name: /^Compromiso 2 de 3: Hogar/ })).toBeVisible();
    await expect(fila.getByRole('button', { name: /^Compromiso 3 de 3: Maun/ })).toBeVisible();
    for (const [grupo, ayuda] of [
      ['Obligaciones', 'Qué son las obligaciones'],
      ['Compromisos', 'Qué son los compromisos'],
    ] as const) {
      await expect(fila.getByText(grupo, { exact: true })).toBeVisible();
      await expect(fila.getByRole('button', { name: ayuda })).toBeVisible();
    }
    const insumos = page.getByRole('region', { name: 'Insumos', exact: true });
    await expect(insumos).toContainText('Sin trabajos en curso');
    const arribaDe = async (una: Locator, otra: Locator) =>
      ((await una.boundingBox())?.y ?? Infinity) < ((await otra.boundingBox())?.y ?? -Infinity);
    expect(await arribaDe(insumos, page.getByRole('region', { name: 'Probar un cobro' }))).toBe(
      true,
    );
    await page.waitForTimeout(1_000);
    expect(pedidos).toEqual([]);

    await page.getByRole('button', { name: 'Editar', exact: true }).click();
    const barra = page.getByRole('region', { name: 'Editando la fila' });
    await expect(barra).toBeVisible();

    const lugarDeHogar = page.getByRole('group', { name: 'Lugar de Hogar' });
    await expect(lugarDeHogar.getByRole('button', { name: 'Subir' })).toBeDisabled();
    await lugarDeHogar.getByRole('button', { name: 'Bajar' }).click();
    await expect(fila.getByRole('button', { name: /^Compromiso 2 de 3: Maun/ })).toBeVisible();
    await expect(fila.getByRole('button', { name: /^Compromiso 3 de 3: Hogar/ })).toBeVisible();
    await expect(lugarDeHogar.getByRole('button', { name: 'Bajar' })).toBeDisabled();
    await lugarDeHogar.getByRole('button', { name: 'Subir' }).click();
    await expect(fila.getByRole('button', { name: /^Compromiso 2 de 3: Hogar/ })).toBeVisible();
    await expect(fila.getByRole('button', { name: /^Compromiso 3 de 3: Maun/ })).toBeVisible();

    await fila.getByRole('button', { name: /^Compromiso 3 de 3: Maun/ }).click();
    const hoja = page.getByRole('dialog', { name: 'Maun' });
    await expect(hoja).toBeVisible();
    await expect(hoja).toContainText('Compromiso · 3 de 3');
    await hoja.getByRole('textbox', { name: 'Monto de Costos fijos' }).fill('300.000');
    await expect(hoja).toContainText('$ 300.000');
    await hoja.getByRole('button', { name: 'Listo', exact: true }).click();
    await expect(hoja).toHaveCount(0);
    await expect(
      fila.getByRole('button', { name: /^Compromiso 3 de 3: Maun, hasta \$\s300\.000/ }),
    ).toBeVisible();

    await barra.getByRole('button', { name: 'Descartar los cambios' }).click();
    await expect(barra).toHaveCount(0);
    await expect(
      fila.getByRole('button', { name: /^Compromiso 3 de 3: Maun, hasta \$\s250\.000/ }),
    ).toBeVisible();
    expect(pedidos).toEqual([]);

    const pedido = page.waitForRequest((uno) => uno.url().includes(chunk));
    await page.getByRole('button', { name: 'Ver el plano completo' }).click();
    await pedido;
    const plano = page.getByRole('dialog', { name: 'El plano de la fila' });
    await expect(plano).toBeVisible();
    await expect(
      plano.locator('.react-flow__node[aria-label^="Compromiso 3 de 3: Maun"]'),
    ).toBeVisible(CARGA);
    await plano.getByRole('button', { name: 'Cerrar el plano' }).click();
    await expect(plano).toHaveCount(0);
    expect(pedidos.length).toBeGreaterThan(0);
  });

  test('cambiar cómo se llena un compromiso desde la hoja del paso lo guarda en la fila', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const { maun, diezmo } = await delSistema();
    const gastos = await tesoroPorRest(sesion, {
      nombre: 'Gastos fijos',
      tinta: 'mostaza',
      icono: 'receipt',
    });
    await guardarLaFila({
      obligaciones: [elDiezmo(diezmo)],
      pasos: [
        compromisoConRenglones(
          gastos.id,
          [{ nombre: 'Alquiler', monto: 50_000_000, dia: 10 }],
          'mes',
        ),
      ],
      superavit: maun,
    });

    await abrirLosTesoros(page);
    const fila = page.getByRole('region', { name: 'La fila', exact: true });
    await expect(
      fila.getByRole('button', {
        name: /^Compromiso 2 de 2: Gastos fijos, hasta \$\s500\.000 por mes/,
      }),
    ).toBeVisible(CARGA);
    await page.getByRole('button', { name: 'Editar', exact: true }).click();
    const barra = page.getByRole('region', { name: 'Editando la fila' });
    await expect(barra).toBeVisible();

    await fila.getByRole('button', { name: /^Compromiso 2 de 2: Gastos fijos/ }).tap();
    const hoja = page.getByRole('dialog', { name: 'Gastos fijos' });
    await expect(hoja).toBeVisible();
    await expect(hoja).toContainText('Compromiso · 2 de 2');
    const modo = hoja.getByRole('radiogroup', { name: 'Cómo se llena Gastos fijos' });
    await expect(modo.getByRole('radio', { name: 'Por mes' })).toBeChecked();
    await modo.getByRole('radio', { name: 'Se renueva al pagar' }).tap();
    await expect(modo.getByRole('radio', { name: 'Se renueva al pagar' })).toBeChecked();
    await expect(hoja.getByRole('region', { name: 'Lo apartado' })).toBeVisible();
    await hoja.getByRole('button', { name: 'Listo', exact: true }).click();
    await expect(hoja).toHaveCount(0);
    await expect(
      fila.getByRole('button', {
        name: /^Compromiso 2 de 2: Gastos fijos, hasta \$\s500\.000, se renueva al pagar/,
      }),
    ).toBeVisible();

    await barra.getByRole('button', { name: 'Guardar' }).click();
    const guardar = page.getByRole('dialog', { name: 'Guardar la fila' });
    await expect(guardar).toContainText('ahora se renueva al pagar');
    await guardar.getByRole('button', { name: 'Guardar la fila' }).click();
    await expect(barra).toHaveCount(0);
    await expect(indicadorDeSync(page)).toBeHidden(CARGA);
    await expect
      .poll(
        async () =>
          ((await leerLaFila(sesion)).fila?.pasos as PasoParaGuardar[] | undefined)?.map(
            (paso) => paso.modo,
          ),
        CARGA,
      )
      .toEqual(['saldo']);
  });

  test('«Nuevo tesoro» del estante abre la hoja con el toque', async ({ page }) => {
    test.setTimeout(90_000);
    await abrirLosTesoros(page);
    await page
      .getByRole('region', { name: 'Estante', exact: true })
      .getByRole('button', { name: 'Nuevo tesoro' })
      .tap();
    const hoja = page.getByRole('dialog', { name: 'Nuevo tesoro' });
    await expect(hoja).toBeVisible();
    await expect(hoja.getByRole('radio', { name: /^Al estante/ })).toBeChecked();
    await expect(page.getByRole('region', { name: 'Editando la fila' })).toHaveCount(0);
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

  const id = await trabajo('Placard del pasillo', { cobrado: 100_000_000 });
  await cobrarDesdeLaFicha(page, id);

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

test('los insumos de un trabajo en curso se ven en su ficha, en Tesoros y en Inicio', async ({
  page,
  isMobile,
}) => {
  test.setTimeout(120_000);
  const id = await trabajo('Placard con seña', {
    estado: 'en_curso',
    cobrado: 100_000_000,
    gastos: 40_000_000,
  });

  await page.goto(`/proyectos/${id}`);
  const enLaFicha = page.getByRole('region', { name: 'Insumos del trabajo', exact: true });
  await expect(enLaFicha).toBeVisible(CARGA);
  await expect(enLaFicha.getByRole('term')).toHaveText(['Entró', 'Gastado', 'Queda']);
  await expect(enLaFicha.getByRole('definition')).toHaveText([
    /^\$\s1\.000\.000$/,
    /^\$\s400\.000$/,
    /^\$\s600\.000$/,
  ]);

  await abrirLosTesoros(page);
  if (isMobile) {
    const insumos = page.getByRole('region', { name: 'Insumos', exact: true });
    await expect(insumos).toContainText('$ 600.000');
    await expect(insumos.getByRole('link', { name: /^Placard con seña/ })).toContainText(
      '$ 600.000',
    );
  } else {
    const deLosInsumos = ficha(page, /^Insumos: \$\s600\.000, 1 trabajo en curso$/);
    await expect(deLosInsumos).toBeVisible(CARGA);
    await expect(deLosInsumos).toHaveAttribute('aria-roledescription', 'insumos');
    await deLosInsumos.click();
    const detalle = detalleDe(page);
    await expect(detalle.getByRole('heading', { name: 'Lo que queda de cada seña' })).toBeVisible();
    await detalle.getByRole('link', { name: /^Placard con seña/ }).click();
    await expect(page).toHaveURL(new RegExp(`/proyectos/${id}$`));
  }

  await page.goto('/');
  const insumos = page
    .getByRole('region', { name: 'Panorama' })
    .locator('[data-cifra-del-panorama="insumos"]');
  await expect(insumos).toContainText('$ 600.000', CARGA);
  await expect(insumos).toContainText('de un trabajo');
  await expect(
    page.getByRole('region', { name: 'Tesoros' }).getByRole('button', { name: /^Maun/ }),
  ).toContainText('$ 600.000 son insumos');
});

test.describe('los avisos', () => {
  test.afterEach(async ({ page }) => {
    for (const endpoint of await endpointsCreados(page)) {
      await darDeBajaAvisosPorRpc(sesion, endpoint);
    }
  });

  test('la pantalla de Avisos muestra los vencimientos, prendidos el mismo día, y apagarlos queda guardado', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await guardarPreferenciasDeAvisosPorRpc(sesion, {
      zona: BUENOS_AIRES,
      hora: '07:30',
      avisos: {
        entregas: { activo: true, anticipacion: 2 },
        visitas: { activo: true, anticipacion: 1 },
        presupuestos: { activo: true, anticipacion: 1 },
        seguimientos: { activo: true, anticipacion: 0 },
        vencimientos: { activo: true, anticipacion: 0 },
        anotaciones: { activo: false, anticipacion: 0 },
      },
    });
    await simularPush(page);
    await servidorDeAvisosSimulado(page, true);
    await page.goto('/ajustes/avisos');
    await expect(page.getByRole('heading', { name: 'Avisos', level: 1 })).toBeVisible(CARGA);
    await page.getByLabel('¿Dónde vivís?').selectOption(BUENOS_AIRES);
    await page.getByRole('button', { name: 'Activar los avisos' }).click();
    await expect(page.getByText(/Avisos activos en este dispositivo/)).toBeVisible(CARGA);

    const vencimientos = page.getByRole('switch', { name: 'Vencimientos' });
    await expect(vencimientos).toBeChecked();
    await expect(page.getByRole('combobox', { name: 'Anticipación de Vencimientos' })).toHaveValue(
      '0',
    );
    await expect(
      page.getByText('El día de pago de cada compromiso que todavía no pagaste'),
    ).toBeVisible();
    await vencimientos.click();
    await expect(vencimientos).not.toBeChecked();
    await expect
      .poll(
        async () => (await estadoDeLosAvisosPorRpc(sesion, null)).preferencias?.avisos.vencimientos,
        CARGA,
      )
      .toEqual({ activo: false, anticipacion: 0 });
  });
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
    const maun = ficha(page, /^Compromiso 3 de 3: Maun/);
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
    await expect(panelDeMaun).toContainText('Compromiso · 3 de 3');
    await expect.poll(() => entera(maun, panelDeMaun)).toBe(true);

    const hogar = ficha(page, /^Compromiso 2 de 3: Hogar/);
    await hogar.click();
    const panelDeHogar = page.getByRole('region', { name: 'Hogar', exact: true });
    await expect(panelDeHogar).toBeVisible();
    await expect(panelDeMaun).toHaveCount(0);
    await expect.poll(() => entera(hogar, panelDeHogar)).toBe(true);

    await page.locator('.react-flow__pane').click({ position: { x: 12, y: 12 } });
    await expect(panelDeHogar).toHaveCount(0);
  });
});

test.describe('en la tablet, con el dedo', () => {
  test.skip(({ isMobile }) => isMobile, 'la tablet va con su propio ancho, una sola vez');
  test.use({ viewport: { width: 834, height: 1112 }, hasTouch: true });

  test('«Nuevo tesoro» del estante abre la hoja con el toque, sin estar editando', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await abrirLosTesoros(page);
    const boton = nuevoDelEstante(page);
    await expect(boton).toBeVisible(CARGA);
    await boton.tap();
    const hoja = page.getByRole('dialog', { name: 'Nuevo tesoro' });
    await expect(hoja).toBeVisible();
    await expect(hoja.getByRole('radio', { name: /^Al estante/ })).toBeChecked();
    await expect(page.getByRole('region', { name: 'Editando la fila' })).toHaveCount(0);
  });
});

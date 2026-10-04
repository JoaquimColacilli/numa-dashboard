import { expect, type Locator, type Page } from '@playwright/test';

import { test } from '../apoyo/prueba';
import { textosCortados, textosFueraDelCatalogo } from '../apoyo/seudoidioma';
import {
  cobrarPorRpc,
  crearCliente,
  diaDesdeHoy,
  entregaDe,
  escribirAjustes,
  guardarProyectoPorRpc,
  hoyEnElTaller,
  iniciarSesionDePrueba,
  leerAjustes,
  movimientosPorRest,
  vaciarTaller,
  type AjustesDePrueba,
  type SesionDePrueba,
} from '../apoyo/taller';

const CARGA = { timeout: 30_000 };
const SUELDO = 180_000_000;
const FIJOS = 60_000_000;
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

const DEJARON = 'Lo que te dejaron los trabajos, mes por mes';
const ENTREGAS = 'Cuántos días tardó cada trabajo';
const GASTASTE = 'Lo que gastaste, por categoría';
const SECCION_DE_LO_QUE_DEJARON = '¿Cuánto me dejaron los trabajos?';

interface Sembrado {
  deEsteMes: string;
  enCurso: string;
}

interface Mes {
  anio: number;
  mes: number;
}

let sesion: SesionDePrueba;
let previos: AjustesDePrueba;
let taller: Sembrado;
let arranque: Date;

function mesDe(hoy: string, atras: number): Mes {
  const [anio = 0, mes = 1] = hoy.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1 - atras, 1));
  return { anio: fecha.getUTCFullYear(), mes: fecha.getUTCMonth() + 1 };
}

function diaDelMes({ anio, mes }: Mes, dia: number): string {
  return `${String(anio)}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function nombreDelMes({ mes }: Mes): string {
  return MESES[mes - 1] ?? '';
}

function mesConSuAnio(hoy: string, atras: number): string {
  const mes = mesDe(hoy, atras);
  return `${nombreDelMes(mes)} ${String(mes.anio)}`;
}

function mesEnLaFrase(hoy: string, atras: number): string {
  const mes = mesDe(hoy, atras);
  return mes.anio === mesDe(hoy, 0).anio
    ? nombreDelMes(mes)
    : `${nombreDelMes(mes)} de ${String(mes.anio)}`;
}

async function costosPorRest(proyectoId: string, costos: Record<string, number>): Promise<void> {
  const { entorno, accessToken } = sesion;
  const respuesta = await fetch(`${entorno.url}/rest/v1/proyectos?id=eq.${proyectoId}`, {
    method: 'PATCH',
    headers: {
      apikey: entorno.publishableKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(costos),
  });
  expect(respuesta.ok).toBe(true);
}

async function gastosDe(proyectoId: string): Promise<{ descripcion: string; categoria: string }[]> {
  const { entorno, accessToken } = sesion;
  const respuesta = await fetch(
    `${entorno.url}/rest/v1/gastos?select=descripcion,categoria&proyecto_id=eq.${proyectoId}&deleted_at=is.null`,
    { headers: { apikey: entorno.publishableKey, Authorization: `Bearer ${accessToken}` } },
  );
  expect(respuesta.ok).toBe(true);
  return (await respuesta.json()) as { descripcion: string; categoria: string }[];
}

async function cobrado(
  cliente: string,
  datos: {
    titulo: string;
    monto: number;
    gastos: number;
    fecha: string;
    costos?: Record<string, number>;
  },
): Promise<string> {
  const id = crypto.randomUUID();
  await guardarProyectoPorRpc(sesion, {
    proyecto: {
      id,
      version: null,
      cliente_id: cliente,
      titulo: datos.titulo,
      estado: 'entregado',
      presupuesto_centavos: datos.monto,
      comprobante: 'sin_comprobante',
    },
    pagos: [
      {
        id: crypto.randomUUID(),
        fecha: datos.fecha,
        concepto: 'Todo',
        monto_centavos: datos.monto,
      },
    ],
    gastos: [
      {
        id: crypto.randomUUID(),
        fecha: datos.fecha,
        descripcion: 'Placas de melamina y herrajes',
        monto_centavos: datos.gastos,
      },
    ],
  });
  if (datos.costos !== undefined) await costosPorRest(id, datos.costos);
  const version = (await entregaDe(sesion, id))?.version ?? 1;
  const neta = datos.monto - datos.gastos;
  const diezmo = Math.floor((neta * 1000 + 5000) / 10000);
  const sueldo = Math.min(SUELDO, neta - diezmo);
  const fijos = Math.min(FIJOS, neta - diezmo - sueldo);
  await cobrarPorRpc(sesion, {
    p_proyecto_id: id,
    p_version: version,
    p_fecha_cobro: datos.fecha,
    p_cobrado_centavos: datos.monto,
    p_gastos_centavos: datos.gastos,
    p_tope_sueldo_centavos: SUELDO,
    p_tope_fijos_centavos: FIJOS,
    p_diezmo_centavos: diezmo,
    p_sueldo_centavos: sueldo,
    p_fijos_centavos: fijos,
    p_remanente_centavos: neta - diezmo - sueldo - fijos,
  });
  return id;
}

async function entregado(
  cliente: string,
  titulo: string,
  dias: { arranco: number; prometida: number | null; entregada: number },
): Promise<void> {
  const id = crypto.randomUUID();
  const base = {
    id,
    cliente_id: cliente,
    titulo,
    presupuesto_centavos: 50_000_000,
    comprobante: 'sin_comprobante',
    fecha_inicio: diaDesdeHoy(dias.arranco),
    entrega_estimada: diaDesdeHoy(dias.prometida ?? dias.entregada),
    ...(dias.prometida === null
      ? {}
      : {
          entrega_comprometida: diaDesdeHoy(dias.prometida),
          entrega_comprometida_franja: 'manana',
        }),
  };
  const creado = (await guardarProyectoPorRpc(sesion, {
    proyecto: { ...base, version: null, estado: 'en_curso' },
    pagos: [],
    gastos: [],
  })) as { proyecto: { version: number } };
  await guardarProyectoPorRpc(sesion, {
    proyecto: {
      ...base,
      version: creado.proyecto.version,
      estado: 'entregado',
      fecha_entrega: diaDesdeHoy(dias.entregada),
    },
    pagos: [],
    gastos: [],
  });
}

async function sembrar(): Promise<Sembrado> {
  await vaciarTaller(sesion);
  await escribirAjustes(sesion, { sueldo_mensual_centavos: SUELDO, costos_fijos_centavos: FIJOS });
  const cliente = await crearCliente(sesion, 'Inés Barrionuevo');
  const hoy = hoyEnElTaller();

  const deEsteMes = await cobrado(cliente, {
    titulo: 'Vestidor del dormitorio',
    monto: 120_000_000,
    gastos: 30_000_000,
    fecha: hoy,
    costos: {
      costo_madera_centavos: 25_000_000,
      costo_herrajes_centavos: 6_000_000,
      costo_flete_centavos: 3_000_000,
      costo_ayudante_centavos: 10_000_000,
    },
  });
  await cobrado(cliente, {
    titulo: 'Cocina con isla',
    monto: 130_000_000,
    gastos: 20_000_000,
    fecha: diaDelMes(mesDe(hoy, 1), 12),
  });
  await movimientosPorRest(sesion, [
    {
      id: crypto.randomUUID(),
      fecha: diaDelMes(mesDe(hoy, 2), 15),
      tipo: 'gasto',
      tesoro_origen: 'maun',
      tesoro_destino: null,
      monto_centavos: 4_500_000,
      categoria: 'Herramientas',
      descripcion: 'Sierra circular',
    },
  ]);
  await entregado(cliente, 'Escritorio en L con cajonera', {
    arranco: -45,
    prometida: -14,
    entregada: -15,
  });
  await entregado(cliente, 'Bajomesada de cocina', {
    arranco: -50,
    prometida: -20,
    entregada: -18,
  });
  await entregado(cliente, 'Rack para el living', { arranco: -30, prometida: null, entregada: -5 });

  const enCurso = crypto.randomUUID();
  await guardarProyectoPorRpc(sesion, {
    proyecto: {
      id: enCurso,
      version: null,
      cliente_id: cliente,
      titulo: 'Placard de pasillo en guatambú',
      estado: 'en_curso',
      presupuesto_centavos: 90_000_000,
      comprobante: 'sin_comprobante',
      fecha_inicio: diaDesdeHoy(-10),
      entrega_estimada: diaDesdeHoy(20),
    },
    pagos: [],
    gastos: [],
  });
  return { deEsteMes, enCurso };
}

async function entrar(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await expect(page.locator('main#contenido')).toBeVisible(CARGA);
  await expect(
    page.getByRole('status').filter({ hasText: /Abriendo la app|Trayendo los datos/ }),
  ).toHaveCount(0, CARGA);
  await page.clock.setFixedTime(arranque);
}

async function abrirLasEstadisticas(page: Page, ruta = '/estadisticas'): Promise<void> {
  await entrar(page, ruta);
  await expect(page.getByRole('heading', { level: 1, name: 'Estadísticas' })).toBeVisible(CARGA);
}

function seccionDeLoQueDejaron(page: Page): Locator {
  return page.getByRole('region', { name: SECCION_DE_LO_QUE_DEJARON });
}

function elPeriodo(page: Page): Locator {
  return page.getByRole('group', { name: 'Período' });
}

async function elegirElPeriodo(page: Page, nombre: string): Promise<void> {
  await elPeriodo(page).locator('label').filter({ hasText: nombre }).click();
  await expect(elPeriodo(page).getByRole('radio', { name: nombre })).toBeChecked();
}

test.describe.serial('las estadísticas con la cuenta de prueba', () => {
  test.beforeAll(async () => {
    test.setTimeout(300_000);
    sesion = await iniciarSesionDePrueba();
    previos = await leerAjustes(sesion);
    taller = await sembrar();
    arranque = new Date();
  });

  test.afterAll(async () => {
    await vaciarTaller(sesion);
    await escribirAjustes(sesion, previos);
  });

  test('lo que te dejaron y las entregas: cada figura dice lo mismo que sus números', async ({
    page,
  }) => {
    await abrirLasEstadisticas(page);
    const hoy = hoyEnElTaller(arranque);

    await expect(page.getByRole('figure', { name: DEJARON })).toMatchAriaSnapshot(`
      - figure "${DEJARON}":
        - text: ${DEJARON} Tocá un mes para ver cuánto te dejó y qué trabajos fueron.
        - listbox "${DEJARON}":
          - 'option "${mesConSuAnio(hoy, 2)}: sin trabajos cobrados"'
          - 'option "${mesConSuAnio(hoy, 1)}: $ 1.100.000 en pesos de hoy, 1 trabajo"'
          - 'option "${mesConSuAnio(hoy, 0)}: $ 900.000 en pesos de hoy, 1 trabajo"'
        - paragraph: "* ${mesEnLaFrase(hoy, 0)}, hasta hoy."
    `);

    await expect(page.getByRole('figure', { name: ENTREGAS })).toMatchAriaSnapshot(`
      - figure "${ENTREGAS}":
        - text: ${ENTREGAS} a tiempo tarde sin fecha prometida Tocá un punto para ver de qué trabajo es.
        - listbox "${ENTREGAS}":
          - 'option "Rack para el living: 25 días, sin fecha prometida"'
          - 'option "Escritorio en L con cajonera: 30 días, a tiempo"'
          - 'option "Bajomesada de cocina: 32 días, 2 días tarde"'
    `);
  });

  test('las columnas se recorren con el teclado: flechas, Inicio, Fin, Enter y Escape', async ({
    page,
  }) => {
    await abrirLasEstadisticas(page);
    const hoy = hoyEnElTaller(arranque);
    const seccion = seccionDeLoQueDejaron(page);
    const columnas = seccion.getByRole('listbox', { name: DEJARON }).getByRole('option');
    const deEsteMes = seccion.getByRole('list', {
      name: `Los trabajos de ${mesEnLaFrase(hoy, 0)}`,
    });

    await seccion.getByRole('button', { name: `Qué es: ${SECCION_DE_LO_QUE_DEJARON}` }).focus();
    await page.keyboard.press('Tab');
    await expect(columnas.first()).toBeFocused();
    await expect(columnas.first()).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('End');
    await expect(columnas.last()).toBeFocused();
    await expect(columnas.last()).toHaveAttribute('aria-selected', 'true');
    await expect(columnas.first()).toHaveAttribute('aria-selected', 'false');
    await expect(seccion.getByText(`en ${mesEnLaFrase(hoy, 0)} · 1 trabajo`)).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(deEsteMes).toBeVisible();
    await expect(deEsteMes.getByRole('link', { name: 'Vestidor del dormitorio' })).toBeVisible();
    await expect(deEsteMes).toContainText(`Total de ${mesEnLaFrase(hoy, 0)}`);

    await page.keyboard.press('ArrowLeft');
    await expect(columnas.nth(1)).toBeFocused();
    await expect(columnas.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(deEsteMes).toBeHidden();

    await page.keyboard.press('Home');
    await expect(columnas.first()).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(seccion.getByRole('option', { selected: true })).toHaveCount(0);
    await expect(
      seccion.getByText('Tocá un mes para ver cuánto te dejó y qué trabajos fueron.'),
    ).toBeVisible();
  });

  test('tocar una columna muestra su lectura y abre la lista de sus trabajos', async ({
    page,
    isMobile,
  }) => {
    await abrirLasEstadisticas(page);
    const hoy = hoyEnElTaller(arranque);
    const seccion = seccionDeLoQueDejaron(page);
    const columna = seccion.getByRole('option', {
      name: `${mesConSuAnio(hoy, 1)}: $ 1.100.000 en pesos de hoy, 1 trabajo`,
    });

    if (isMobile) await columna.tap({ force: true });
    else await columna.click({ force: true });
    await expect(columna).toHaveAttribute('aria-selected', 'true');
    await expect(seccion.getByText(`en ${mesEnLaFrase(hoy, 1)} · 1 trabajo`)).toBeVisible();

    const verLaLista = seccion.getByRole('button', {
      name: `Ver el trabajo de ${mesEnLaFrase(hoy, 1)}`,
    });
    await expect(verLaLista).toHaveAttribute('aria-expanded', 'false');
    await verLaLista.click();

    const lista = seccion.getByRole('list', { name: `Los trabajos de ${mesEnLaFrase(hoy, 1)}` });
    await expect(lista.getByRole('link', { name: 'Cocina con isla' })).toBeVisible();
    await expect(lista).toContainText(`Total de ${mesEnLaFrase(hoy, 1)}`);
    await expect(seccion.getByRole('button', { name: 'Esconder la lista' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  test('cambiar el período no suma pasos para atrás, y al volver de un trabajo sigue el mismo', async ({
    page,
  }) => {
    await entrar(page, '/');
    await page.getByRole('link', { name: /^Cómo viene el taller/ }).click();
    await expect(page).toHaveURL(/\/estadisticas$/, CARGA);
    await expect(elPeriodo(page).getByRole('radio', { name: '3 meses' })).toBeChecked();

    await elegirElPeriodo(page, '6 meses');
    await expect(page).toHaveURL(/\/estadisticas\?meses=6$/);
    await elegirElPeriodo(page, '12 meses');
    await expect(page).toHaveURL(/\/estadisticas\?meses=12$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/, CARGA);
    await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible(CARGA);

    await page.getByRole('link', { name: /^Cómo viene el taller/ }).click();
    await expect(page).toHaveURL(/\/estadisticas$/, CARGA);
    await elegirElPeriodo(page, '6 meses');
    const seccion = seccionDeLoQueDejaron(page);
    await seccion.getByRole('button', { name: 'Ver los 2 trabajos' }).click();
    await seccion
      .getByRole('list', { name: 'Los trabajos del período' })
      .getByRole('link', { name: 'Vestidor del dormitorio' })
      .click();
    await expect(page).toHaveURL(new RegExp(`/proyectos/${taller.deEsteMes}$`), CARGA);

    await page.getByRole('main').getByRole('link', { name: 'Estadísticas', exact: true }).click();
    await expect(page).toHaveURL(/\/estadisticas\?meses=6$/, CARGA);
    await expect(elPeriodo(page).getByRole('radio', { name: '6 meses' })).toBeChecked();
  });

  test('en el celular, la primera pantalla tiene el título, el período, la cifra y las cuatro tarjetas', async ({
    page,
    isMobile,
  }, testInfo) => {
    test.skip(!isMobile, 'la primera pantalla se mide en el celular');
    await abrirLasEstadisticas(page);
    const tarjetas = page.getByRole('navigation', { name: 'Las cifras del período' });
    await expect(tarjetas.getByRole('button')).toHaveCount(4);

    const medida = await page.evaluate(() => {
      const cajas = (selector: string) =>
        [...document.querySelectorAll(selector)]
          .map((elemento) => elemento.getBoundingClientRect())
          .filter((caja) => caja.width > 0 && caja.height > 0);
      const titulo = cajas('main#contenido h1')[0];
      const tarjetas = cajas('nav[aria-label="Las cifras del período"] button');
      const flota = cajas('nav[aria-label="Principal"] *');
      return {
        titulo: titulo?.top ?? -1,
        tarjetas: Math.max(...tarjetas.map((caja) => caja.bottom)),
        barra: Math.min(...flota.map((caja) => caja.top)),
        alto: window.innerHeight,
      };
    });
    const aire = medida.barra - medida.tarjetas;
    console.log(
      `primera pantalla a 390 × ${String(medida.alto)}: las tarjetas terminan en ${medida.tarjetas.toFixed(1)} px y la barra empieza en ${medida.barra.toFixed(1)} px, ${aire.toFixed(1)} px de aire`,
    );
    await page.screenshot({ path: testInfo.outputPath('primera-pantalla.png') });
    expect(medida.titulo).toBeGreaterThanOrEqual(0);
    expect(aire).toBeGreaterThanOrEqual(0);
  });

  test('en la tablet, el riel entra entero con sus nueve destinos, acostada y de pie', async ({
    page,
    isMobile,
  }, testInfo) => {
    test.skip(isMobile, 'el riel es de la tablet');
    for (const { ancho, alto } of [
      { ancho: 1024, alto: 768 },
      { ancho: 768, alto: 1024 },
    ]) {
      await page.setViewportSize({ width: ancho, height: alto });
      await abrirLasEstadisticas(page);
      const riel = page.getByRole('navigation', { name: 'Principal' });
      await expect(riel.getByRole('button', { name: 'Estadísticas' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      const medida = await riel.evaluate((nav) => {
        const piezas = [...nav.querySelectorAll('a, button')]
          .map((elemento) => ({
            nombre: elemento.getAttribute('aria-label') ?? elemento.textContent.trim(),
            caja: elemento.getBoundingClientRect(),
          }))
          .filter(({ caja }) => caja.width > 0 && caja.height > 0);
        const pisadas: string[] = [];
        piezas.forEach((una, indice) => {
          for (const otra of piezas.slice(indice + 1)) {
            const ancho =
              Math.min(una.caja.right, otra.caja.right) - Math.max(una.caja.left, otra.caja.left);
            const alto =
              Math.min(una.caja.bottom, otra.caja.bottom) - Math.max(una.caja.top, otra.caja.top);
            if (ancho > 0.5 && alto > 0.5) pisadas.push(`${una.nombre} con ${otra.nombre}`);
          }
        });
        const estadisticas = piezas.find((pieza) => pieza.nombre === 'Estadísticas');
        const ajustes = piezas.find((pieza) => pieza.nombre === 'Ajustes');
        return {
          nombres: piezas.map((pieza) => pieza.nombre),
          afuera: piezas
            .filter(({ caja }) => caja.top < 0 || caja.bottom > window.innerHeight)
            .map((pieza) => pieza.nombre),
          pisadas,
          sobra: nav.scrollHeight - nav.clientHeight,
          libre:
            estadisticas === undefined || ajustes === undefined
              ? null
              : ajustes.caja.top - estadisticas.caja.bottom,
        };
      });
      console.log(
        `el riel a ${String(ancho)} × ${String(alto)}: ${medida.nombres.join(', ')}; entre Estadísticas y Ajustes quedan ${String(medida.libre)} px`,
      );
      await page.screenshot({
        path: testInfo.outputPath(`riel-${String(ancho)}x${String(alto)}.png`),
      });
      expect(medida.nombres).toContain('Estadísticas');
      expect(medida.afuera).toEqual([]);
      expect(medida.pisadas).toEqual([]);
      expect(medida.sobra).toBeLessThanOrEqual(0);
      expect(medida.libre).not.toBeNull();
      expect(medida.libre ?? -1).toBeGreaterThanOrEqual(0);
    }
  });

  test('con el seudoidioma, todo el texto de la página sale del catálogo, también el de los gráficos', async ({
    page,
    context,
  }) => {
    await context.addInitScript(() => {
      localStorage.setItem('maun:seudoidioma', 'activo');
    });
    await entrar(page, '/estadisticas');
    const titulo = page.locator('main#contenido h1');
    await expect(titulo).toContainText('⟦', CARGA);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    const enLosGraficos = await page.evaluate(
      () =>
        [...document.querySelectorAll('main#contenido svg text')].filter((texto) =>
          /\p{L}/u.test(texto.textContent),
        ).length,
    );
    expect(enLosGraficos).toBeGreaterThan(0);
    expect(await textosFueraDelCatalogo(page)).toEqual([]);
    expect(await textosCortados(page)).toEqual([]);
  });

  test('un gasto cargado en el trabajo con su categoría aparece en lo que gastaste', async ({
    page,
  }) => {
    await entrar(page, `/proyectos/${taller.enCurso}/editar`);
    const gastos = page.getByRole('region', { name: 'Gastos e insumos' });
    await gastos.getByRole('button', { name: 'Agregar un gasto' }).click();
    await gastos.getByLabel('Descripción 1', { exact: true }).fill('Bisagras cazoleta con freno');
    await gastos.getByLabel('Monto 1', { exact: true }).fill('38.500');
    await gastos.getByRole('combobox', { name: 'Categoría 1' }).selectOption({ label: 'Herrajes' });
    await page.getByRole('button', { name: 'Guardar los cambios' }).click();
    await expect(page).toHaveURL(new RegExp(`/proyectos/${taller.enCurso}$`), CARGA);
    await expect
      .poll(async () => (await gastosDe(taller.enCurso)).map((gasto) => gasto.categoria), CARGA)
      .toEqual(['herrajes']);

    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('button', { name: 'Inicio' })
      .click();
    await page.getByRole('link', { name: /^Cómo viene el taller/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Estadísticas' })).toBeVisible(CARGA);
    const figura = page.getByRole('figure', { name: GASTASTE });
    await expect(figura.getByRole('listitem').filter({ hasText: 'Herrajes' })).toContainText(
      '$ 38.500',
    );
  });
});

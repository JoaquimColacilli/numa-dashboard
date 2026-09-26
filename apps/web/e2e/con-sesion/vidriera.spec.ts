import { expect, test, type Page } from '@playwright/test';

import { fotoDePrueba } from '../apoyo/imagenes';
import { listoParaCortar } from '../apoyo/pantalla';
import {
  archivoPorRest,
  escribirAjustes,
  fotoALaVidrieraPorRest,
  fotosDeLaVidrieraDelTaller,
  householdDePrueba,
  iniciarSesionDePrueba,
  leerAjustes,
  objetosDeLaVidriera,
  rutasDelArchivo,
  rutasEnLaVidriera,
  subirAlBucketDePrueba,
  trabajoListoConEnlace,
  vaciarTaller,
  type AjustesDePrueba,
  type FilaDeArchivo,
  type SesionDePrueba,
} from '../apoyo/taller';

const CARGA = { timeout: 30_000 };

let sesion: SesionDePrueba;
let previos: AjustesDePrueba;

test.beforeEach(async () => {
  sesion = await iniciarSesionDePrueba();
  previos = await leerAjustes(sesion);
  await vaciarTaller(sesion);
});

test.afterEach(async () => {
  await escribirAjustes(sesion, previos);
  await vaciarTaller(sesion);
});

async function fotoDeUnTrabajo(
  page: Page,
  proyectoId: string,
  nombre: string,
  visible: boolean,
  numero: number,
): Promise<FilaDeArchivo> {
  const fila = await archivoPorRest(sesion, { proyectoId, nombre, tipo: 'image/webp', visible });
  const contenido = await fotoDePrueba(page, numero);
  for (const ruta of rutasDelArchivo(fila)) {
    await subirAlBucketDePrueba(sesion, ruta, contenido, 'image/webp');
  }
  return fila;
}

function tuVidriera(page: Page) {
  return page.getByRole('region', { name: 'Tu vidriera' });
}

function filasDeLaVidriera(page: Page) {
  return tuVidriera(page)
    .getByRole('list', { name: /Las fotos de tu vidriera/ })
    .getByRole('listitem');
}

test('la vidriera de punta a punta: las redes, sumar de un trabajo y subir, el orden, sacar con deshacer, y el cliente la ve', async ({
  page,
  browser,
  isMobile,
}, testInfo) => {
  test.skip(isMobile, 'una sola vez por corrida: escribe en Storage');
  test.setTimeout(240_000);

  const trabajo = await trabajoListoConEnlace(sesion, {
    titulo: 'E2E Placard con vidriera',
    cliente: 'E2E Lucía Fernández',
  });
  await page.goto('/');
  const compartida = await fotoDeUnTrabajo(page, trabajo.id, 'Frente terminado.webp', true, 1);
  const sinCompartir = await fotoDeUnTrabajo(page, trabajo.id, 'Detalle.webp', false, 2);
  const household = await householdDePrueba(sesion);

  await page.goto('/ajustes');
  await listoParaCortar(page);
  const seccion = tuVidriera(page);
  await expect(seccion).toBeVisible(CARGA);
  await expect(seccion).toContainText('0 de 12');
  await expect(seccion).toContainText('Todavía no hay nada en tu vidriera');

  const instagram = seccion.getByRole('textbox', { name: 'Instagram' });
  await instagram.fill('https://www.instagram.com/p/C1a2b3c4/');
  await seccion.getByRole('button', { name: 'Guardar las redes' }).click();
  await expect(instagram).toHaveAccessibleDescription(/no es el de tu perfil/);

  await instagram.fill('@Taller.Maun');
  await seccion
    .getByRole('textbox', { name: 'Facebook' })
    .fill('https://m.facebook.com/TallerMaun/?mibextid=abc');
  await seccion
    .getByRole('textbox', { name: 'TikTok' })
    .fill('https://www.tiktok.com/@Taller.Maun?lang=es');
  await seccion.getByRole('button', { name: 'Guardar las redes' }).click();
  await expect
    .poll(async () => {
      const { instagram_link, facebook_link, tiktok_link } = await leerAjustes(sesion);
      return [instagram_link, facebook_link, tiktok_link];
    }, CARGA)
    .toEqual([
      'https://www.instagram.com/taller.maun/',
      'https://www.facebook.com/tallermaun',
      'https://www.tiktok.com/@taller.maun',
    ]);
  await expect(instagram).toHaveValue('@taller.maun');

  await seccion.getByRole('button', { name: 'Sumar fotos' }).click();
  const hoja = page.getByRole('dialog', { name: 'Sumar fotos a la vidriera' });
  await expect(hoja).toBeVisible();
  await expect(hoja.getByRole('tab', { name: 'De tus trabajos' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const delTrabajo = hoja.getByRole('region', { name: 'E2E Placard con vidriera' });
  await delTrabajo.getByRole('button', { name: 'Foto 2 de «E2E Placard con vidriera»' }).click();
  await delTrabajo.getByRole('button', { name: 'Foto 1 de «E2E Placard con vidriera»' }).click();
  await hoja.getByRole('button', { name: 'Sumar 2 fotos' }).click();
  await expect(hoja).toContainText('está sin compartir');
  await hoja.getByRole('button', { name: 'Sumar igual' }).click();
  await expect(hoja).toBeHidden(CARGA);

  await expect.poll(async () => (await fotosDeLaVidrieraDelTaller(sesion)).length, CARGA).toBe(2);
  const sumadas = await fotosDeLaVidrieraDelTaller(sesion);
  expect(sumadas.map((foto) => [foto.archivo_de_origen, foto.orden])).toEqual([
    [compartida.id, 0],
    [sinCompartir.id, 1],
  ]);
  const objetos = await objetosDeLaVidriera(sesion, household);
  for (const foto of sumadas) {
    for (const ruta of rutasEnLaVidriera(foto)) expect(objetos).toContain(ruta);
  }

  await seccion.getByRole('button', { name: 'Sumar fotos' }).click();
  await expect(hoja).toBeVisible();
  await hoja.getByRole('tab', { name: 'Subir nuevas' }).click();
  await hoja.locator('input[type="file"]').setInputFiles({
    name: 'mesa-ratona.jpg',
    mimeType: 'image/jpeg',
    buffer: await fotoDePrueba(page, 3, 'image/jpeg'),
  });
  await expect(hoja).toBeHidden(CARGA);
  await expect.poll(async () => (await fotosDeLaVidrieraDelTaller(sesion)).length, CARGA).toBe(3);
  const subida = (await fotosDeLaVidrieraDelTaller(sesion)).at(-1);
  expect(subida).toMatchObject({ archivo_de_origen: null, orden: 2 });
  await expect(seccion).toContainText('3 de 12');
  await expect(filasDeLaVidriera(page).nth(2)).toContainText('Subida para la vidriera');

  const [primera, segunda] = sumadas;
  if (primera === undefined || segunda === undefined) throw new Error('faltan las sumadas');
  await filasDeLaVidriera(page).nth(0).getByRole('button', { name: 'Mover después' }).click();
  await expect
    .poll(async () => (await fotosDeLaVidrieraDelTaller(sesion)).map((foto) => foto.id), CARGA)
    .toEqual([segunda.id, primera.id, subida?.id]);
  await expect(page.locator(`[data-foto="${primera.id}"] [data-accion="despues"]`)).toBeFocused();

  await filasDeLaVidriera(page).nth(2).getByRole('button', { name: 'Sacar' }).click();
  await expect(seccion).toContainText('2 de 12');
  const aviso = page.getByRole('status').filter({ hasText: 'Sacaste una foto de tu vidriera.' });
  await expect(aviso).toBeVisible();
  await aviso.getByRole('button', { name: 'Deshacer' }).click();
  await expect(seccion).toContainText('3 de 12');
  await expect.poll(async () => (await fotosDeLaVidrieraDelTaller(sesion)).length, CARGA).toBe(3);

  await filasDeLaVidriera(page).nth(2).getByRole('button', { name: 'Sacar' }).click();
  await expect.poll(async () => (await fotosDeLaVidrieraDelTaller(sesion)).length, CARGA).toBe(2);
  if (subida === undefined) throw new Error('falta la subida');
  await expect
    .poll(async () => {
      const quedan = await objetosDeLaVidriera(sesion, household);
      return rutasEnLaVidriera(subida).some((ruta) => quedan.includes(ruta));
    }, CARGA)
    .toBe(false);

  const anonimo = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
  const delCliente = await anonimo.newPage();
  await delCliente.goto(`/v/${trabajo.token}`);
  const vidriera = delCliente.getByRole('region', { name: 'Más trabajos del taller' });
  await expect(vidriera).toBeVisible(CARGA);
  const fotos = vidriera.getByRole('list').getByRole('link');
  await expect(fotos).toHaveCount(2);
  await expect(fotos.first()).toHaveAccessibleName('Foto 1 de 2');
  for (const enlace of await fotos.all()) {
    const direccion = (await enlace.getAttribute('href')) ?? '';
    expect(direccion).toContain(`/${household}/vidriera/`);
    expect(direccion).not.toContain(trabajo.id);
    expect(direccion).not.toContain(compartida.id);
  }
  await expect(vidriera.getByRole('link', { name: '@taller.maun en Instagram' })).toHaveAttribute(
    'href',
    'https://www.instagram.com/taller.maun/',
  );
  await expect(vidriera.getByRole('link', { name: 'Facebook del taller' })).toBeVisible();
  await expect(vidriera.getByRole('link', { name: 'TikTok del taller' })).toBeVisible();
  await expect(vidriera.getByRole('button', { name: 'Compartir' })).toBeVisible();
  await anonimo.close();

  await page.goto(`/proyectos/${trabajo.id}/vista-cliente`);
  const enLaApp = page.getByRole('region', { name: 'Más trabajos del taller' });
  await expect(enLaApp).toBeVisible(CARGA);
  await expect(enLaApp.getByRole('list').getByRole('link')).toHaveCount(2);
});

test('con doce fotos, sumar otra no se ofrece y dice por qué', async ({ page }) => {
  for (let orden = 0; orden < 12; orden += 1) {
    await fotoALaVidrieraPorRest(sesion, { orden });
  }
  await page.goto('/ajustes');
  await listoParaCortar(page);
  const seccion = tuVidriera(page);
  await expect(seccion).toContainText('12 de 12', CARGA);
  await expect(seccion.getByRole('button', { name: 'Sumar fotos' })).toBeDisabled();
  await expect(seccion).toContainText(
    'Tu vidriera ya tiene sus 12 fotos. Sacá una para sumar otra.',
  );
});

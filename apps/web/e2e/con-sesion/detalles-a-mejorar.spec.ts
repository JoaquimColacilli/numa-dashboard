import { expect, type Locator, type Page } from '@playwright/test';

import { listoParaCortar } from '../apoyo/pantalla';
import { test } from '../apoyo/prueba';
import {
  cambiarElCliente,
  columnasDelProyecto,
  contactoPorRpc,
  diaDesdeHoy,
  enlacePorRest,
  idDelTesoro,
  iniciarSesionDePrueba,
  leerProyecto,
  movimientosDelTaller,
  preguntasDeLaConsultaDe,
  proximosContactosDe,
  respuestasAlPresupuestoDe,
  saldoDelTesoro,
  seguimientoPorRpc,
  vaciarTaller,
  type SesionDePrueba,
} from '../apoyo/taller';

const CARGA = { timeout: 30_000 };

let sesion: SesionDePrueba;

test.beforeEach(async () => {
  sesion = await iniciarSesionDePrueba();
  await vaciarTaller(sesion);
});

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await listoParaCortar(page);
}

function bloqueDelEstimativo(page: Page): Locator {
  return page.locator('details', {
    has: page.getByRole('heading', { name: 'Para el estimativo' }),
  });
}

function enPesos(centavos: number): string {
  return (centavos / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

test('el próximo contacto cambia de día desde la ficha, sin registrar un contacto', async ({
  page,
}) => {
  const { id } = await seguimientoPorRpc(sesion, {
    titulo: 'Vestidor de Ana',
    fecha: diaDesdeHoy(7),
  });
  const [antes] = await proximosContactosDe(sesion, id);

  await abrir(page, `/proyectos/${id}`);
  await page.getByRole('button', { name: 'Cambiar la fecha' }).click();
  const hoja = page.getByRole('dialog', { name: 'Cambiar la fecha' });
  await expect(hoja).toContainText('no queda como un contacto registrado');

  await hoja.getByLabel('Otro día').fill(diaDesdeHoy(-1));
  await hoja.getByRole('button', { name: 'Cambiar la fecha' }).click();
  await expect(hoja.getByRole('alert')).toContainText('Ese día ya pasó');

  await hoja.getByLabel('Otro día').fill(diaDesdeHoy(12));
  await hoja.getByRole('button', { name: 'Cambiar la fecha' }).click();
  await expect(hoja).toBeHidden(CARGA);

  await expect
    .poll(
      async () =>
        (await proximosContactosDe(sesion, id)).map((uno) => [uno.id, uno.fecha, uno.hecho_el]),
      CARGA,
    )
    .toEqual([[antes?.id, diaDesdeHoy(12), null]]);
});

test('«Editar» de una consulta muestra la dirección de entrega y la guarda', async ({ page }) => {
  const { id } = await contactoPorRpc(sesion, { titulo: 'Bajo mesada', estado: 'contacto' });

  await abrir(page, `/proyectos/${id}`);
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(page.getByLabel('Visita', { exact: true })).toBeVisible(CARGA);
  await page.getByLabel('Dirección de entrega').fill('Mitre 123, Morón');
  await page.getByRole('button', { name: 'Guardar los cambios' }).click();

  await expect
    .poll(
      async () => (await columnasDelProyecto(sesion, id, ['direccion_entrega']))?.direccion_entrega,
      CARGA,
    )
    .toBe('Mitre 123, Morón');
});

test('las preguntas de la consulta: se suman en Ajustes y se contestan solas en la ficha', async ({
  page,
}) => {
  await abrir(page, '/ajustes');
  await page.getByRole('button', { name: 'Sumar una pregunta' }).click();
  await page.getByLabel('Pregunta 4').fill('Color');
  await page.getByLabel('Ayuda de «Color»').fill('Qué tono quiere.');
  await expect
    .poll(async () => preguntasDeLaConsultaDe(sesion), CARGA)
    .toEqual([
      { id: 'domicilio', rotulo: 'Domicilio', ayuda: '' },
      { id: 'acceso', rotulo: 'Acceso al lugar', ayuda: 'Escaleras, piso, tamaño del ascensor.' },
      { id: 'urgencia', rotulo: 'Urgencia', ayuda: 'Para cuándo lo necesita.' },
      expect.objectContaining({ rotulo: 'Color', ayuda: 'Qué tono quiere.' }),
    ]);

  const { id, clienteId } = await contactoPorRpc(sesion, {
    titulo: 'Rack de TV',
    estado: 'contacto',
  });
  await cambiarElCliente(sesion, clienteId, { direccion: 'Rivadavia 4500, Caballito' });

  await abrir(page, `/proyectos/${id}`);
  const bloque = bloqueDelEstimativo(page);
  await expect(bloque).toContainText('0 de 4', CARGA);
  await expect(bloque.getByLabel('Acceso al lugar')).toHaveAttribute(
    'placeholder',
    'Escaleras, piso, tamaño del ascensor.',
  );
  await bloque.getByLabel('Acceso al lugar').fill('Tercer piso, ascensor chico');
  await bloque
    .getByRole('button', { name: 'Usar la del cliente: Rivadavia 4500, Caballito' })
    .click();
  await expect(bloque).toContainText('2 de 4');

  await expect
    .poll(
      async () =>
        columnasDelProyecto(sesion, id, ['direccion_entrega', 'respuestas_de_la_consulta']),
      CARGA,
    )
    .toEqual({
      direccion_entrega: 'Rivadavia 4500, Caballito',
      respuestas_de_la_consulta: [
        { id: 'acceso', pregunta: 'Acceso al lugar', respuesta: 'Tercer piso, ascensor chico' },
      ],
    });
});

test('el estimativo se manda con un tilde, el cliente lo aprueba con un día para medir y el dueño lo ve', async ({
  page,
  browser,
}) => {
  test.setTimeout(240_000);
  const titulo = 'Cocina de Lucía';
  const { id } = await contactoPorRpc(sesion, {
    titulo,
    estado: 'contacto',
    telefono: '11 5555-0000',
  });

  await abrir(page, `/proyectos/${id}/presupuesto`);
  await page.getByRole('checkbox', { name: 'Es un estimativo' }).check();
  await expect(page.getByRole('checkbox', { name: 'Pedirle una fecha para medir' })).toBeChecked();
  await page.getByLabel('Nombre del mueble 1').fill('Cocina');
  await page
    .locator('[data-mueble]')
    .first()
    .getByLabel('Descripción técnica')
    .fill('Cocina en L con bajomesada y alacena, en melamina blanca de 18 mm.');
  await page.getByLabel('Total del presupuesto').fill('900.000');
  await expect(page.getByText('Guardado', { exact: false }).first()).toBeVisible(CARGA);

  await page.getByRole('button', { name: 'Mandar el estimativo' }).click();
  const hoja = page.getByRole('dialog', { name: 'Mandar el estimativo' });
  await hoja.getByRole('button', { name: 'Mandar', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Listo' })).toBeVisible(CARGA);
  await expect
    .poll(async () => (await leerProyecto(sesion, titulo))?.estado, CARGA)
    .toBe('presupuesto_estimativo');

  const token = `detalles-${crypto.randomUUID()}`;
  await enlacePorRest(sesion, id, token);
  const cliente = await browser.newContext();
  const pagina = await cliente.newPage();
  await pagina.goto(`/v/${token}`);
  await pagina.getByRole('button', { name: 'Aprobar', exact: true }).click();
  const aprobar = pagina.getByRole('dialog', { name: 'Aprobar el estimativo' });
  await aprobar
    .getByRole('group', { name: '¿Qué día te queda bien para que vayamos a medir?' })
    .getByRole('button')
    .first()
    .click();
  await aprobar.getByRole('radio', { name: 'A la mañana' }).check();
  await aprobar.getByLabel(/Algo que tengamos que saber/).fill('Tocar el timbre de abajo.');
  await aprobar.getByRole('button', { name: 'Aprobar', exact: true }).click();
  await expect(pagina.getByText(/Propusiste el .*, a la mañana, para medir\./)).toBeVisible(CARGA);
  await cliente.close();

  await expect
    .poll(async () => (await respuestasAlPresupuestoDe(sesion, id)).length, CARGA)
    .toBe(1);
  const [respuesta] = await respuestasAlPresupuestoDe(sesion, id);
  expect(respuesta).toEqual(
    expect.objectContaining({
      franja: 'manana',
      nota: 'Tocar el timbre de abajo.',
      atendida_at: null,
    }),
  );

  await abrir(page, `/proyectos/${id}`);
  await expect(page.getByText(/aprobó el estimativo/)).toBeVisible(CARGA);
  await expect(page.getByText(/a la mañana, para medir\./)).toBeVisible();
  await page.getByRole('button', { name: 'Listo, ya lo hablé' }).click();
  await expect
    .poll(async () => (await respuestasAlPresupuestoDe(sesion, id))[0]?.atendida_at, CARGA)
    .not.toBeNull();
});

test('«Ajustar el saldo» deja el tesoro con lo que tiene de verdad, con un ajuste por la diferencia', async ({
  page,
  isMobile,
}) => {
  const maun = await idDelTesoro(sesion, 'maun');
  const saldo = await saldoDelTesoro(sesion, maun);
  test.skip(saldo < 0, 'el taller de prueba tiene a Maun en negativo');

  await abrir(page, '/tesoros?tesoro=maun');
  if (isMobile) {
    await page
      .getByRole('region', { name: 'La fila', exact: true })
      .getByRole('button', { name: /: Maun,/ })
      .first()
      .click();
  }
  await page.getByRole('button', { name: 'Editar Maun' }).first().click();
  await page.getByRole('button', { name: 'Ajustar el saldo' }).click();
  const hoja = page.getByRole('dialog', { name: 'Ajustar el saldo de Maun' });
  await expect(hoja.getByRole('button', { name: 'Ajustar', exact: true })).toBeDisabled();

  await hoja.getByLabel('Tiene ahora').fill(enPesos(saldo + 5_000_000));
  await expect(hoja.getByRole('status')).toHaveText('Se suman $ 50.000');
  await hoja.getByRole('button', { name: 'Intereses' }).click();
  await hoja.getByRole('button', { name: 'Ajustar', exact: true }).click();
  await expect(hoja).toBeHidden(CARGA);

  await expect
    .poll(
      async () =>
        (await movimientosDelTaller(sesion))
          .filter((movimiento) => movimiento.tipo === 'ajuste')
          .map((movimiento) => [
            movimiento.hacia_id,
            movimiento.desde_id,
            movimiento.monto_centavos,
            movimiento.categoria,
          ]),
      CARGA,
    )
    .toEqual([[maun, null, 5_000_000, 'Intereses']]);
  await expect.poll(async () => saldoDelTesoro(sesion, maun), CARGA).toBe(saldo + 5_000_000);
});

import { expect, type Page } from '@playwright/test';

import {
  conComprobantesEnElArranque,
  ESTADO_DEL_TALLER_DE_PRUEBA,
  facturasEnLaCola,
  filaDeComprobante,
  losEscapados,
  sacarLosEscapados,
  servidorDeLaFacturacion,
  type RespuestaSimulada,
} from '../apoyo/facturacion';
import { listoParaCortar } from '../apoyo/pantalla';
import { test } from '../apoyo/prueba';
import {
  clientesPorRest,
  crearCliente,
  distribucionDe,
  documentoDelCliente,
  escribirLaFacturacion,
  FACTURACION_DE_FABRICA,
  guardarProyectoPorRpc,
  householdDePrueba,
  hoyEnElTaller,
  iniciarSesionDePrueba,
  leerLaFacturacion,
  pagosDe,
  restablecerElPresupuestoDelTaller,
  tallerQueFactura,
  vaciarTaller,
  type SesionDePrueba,
} from '../apoyo/taller';

const COMO_CONECTARLO =
  'El taller de la cuenta de prueba no está conectado con ARCA en homologación, y este spec lo necesita. Conectalo una vez con: pnpm --filter @maun/db db:facturacion --conectar --email <E2E_EMAIL> --ambiente homologacion --punto-de-venta 2';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const PEDIDO_DE_MENTIRA =
  '-----BEGIN CERTIFICATE REQUEST-----\nTlVNQSBkZSBwcnVlYmE=\n-----END CERTIFICATE REQUEST-----\n';

const CERTIFICADO_DE_MENTIRA =
  '-----BEGIN CERTIFICATE-----\nTlVNQSBkZSBwcnVlYmE=\n-----END CERTIFICATE-----\n';

let sesion: SesionDePrueba;
let household: string;
let puntoDeVenta: string;

test.beforeEach(async () => {
  sesion = await iniciarSesionDePrueba();
  await vaciarTaller(sesion);
  const conexion = await leerLaFacturacion(sesion);
  if (
    conexion.facturacion_ambiente !== 'homologacion' ||
    conexion.facturacion_punto_de_venta === null
  ) {
    throw new Error(COMO_CONECTARLO);
  }
  puntoDeVenta = String(conexion.facturacion_punto_de_venta).padStart(5, '0');
  household = await householdDePrueba(sesion);
  await tallerQueFactura(sesion);
});

test.afterEach(async () => {
  await escribirLaFacturacion(sesion, FACTURACION_DE_FABRICA);
  await restablecerElPresupuestoDelTaller(sesion);
});

interface TrabajoConSena {
  id: string;
  clienteId: string;
  pagoId: string;
  titulo: string;
}

async function trabajoConSena(
  titulo: string,
  opciones: { clienteId?: string; estado?: string; precio?: number; sena?: number } = {},
): Promise<TrabajoConSena> {
  const { estado = 'en_curso', precio = 96_000_000, sena = 45_000_000 } = opciones;
  const clienteId = opciones.clienteId ?? (await crearCliente(sesion, `Cliente de ${titulo}`));
  const id = crypto.randomUUID();
  const pagoId = crypto.randomUUID();
  await guardarProyectoPorRpc(sesion, {
    proyecto: {
      id,
      version: null,
      cliente_id: clienteId,
      titulo,
      estado,
      presupuesto_centavos: precio,
      comprobante: 'sin_comprobante',
    },
    pagos: [{ id: pagoId, fecha: hoyEnElTaller(), concepto: 'Seña', monto_centavos: sena }],
    gastos: [],
  });
  return { id, clienteId, pagoId, titulo };
}

function laFacturaPedida(
  trabajo: TrabajoConSena,
  importe: number,
): (cuerpo: unknown) => RespuestaSimulada {
  return (cuerpo) => {
    const pedido = cuerpo as { p_id: string; p_pago_id: string; p_detalle: string };
    return {
      json: filaDeComprobante({
        id: pedido.p_id,
        householdId: household,
        proyectoId: trabajo.id,
        pagoId: pedido.p_pago_id,
        importe,
        detalle: pedido.p_detalle,
        puntoDeVenta: Number(puntoDeVenta),
      }),
    };
  };
}

function enLosPagos(page: Page) {
  return page.getByRole('region', { name: 'Pagos recibidos' });
}

async function abrirLaHojaDeFacturar(page: Page, trabajo: TrabajoConSena) {
  await page.goto(`/proyectos/${trabajo.id}`);
  await page.getByRole('button', { name: /^Facturar el pago de/ }).click();
  const hoja = page.getByRole('dialog', { name: 'Facturar este pago' });
  await expect(hoja).toBeVisible();
  return hoja;
}

test('facturar el pago de un consumidor final: la hoja dice qué sale y el pedido lleva su id, el pago y el detalle', async ({
  page,
  context,
}) => {
  const trabajo = await trabajoConSena('Placard del pasillo');
  const servidor = await servidorDeLaFacturacion(context, {
    pedir_la_factura: laFacturaPedida(trabajo, 45_000_000),
  });

  await page.goto(`/proyectos/${trabajo.id}`);
  await page.getByRole('button', { name: /^Facturar el pago de \$\s?450\.000/ }).click();
  const hoja = page.getByRole('dialog', { name: 'Facturar este pago' });
  await expect(hoja).toContainText('Factura C');
  await expect(hoja).toContainText(puntoDeVenta);
  await expect(hoja).toContainText('Estás en modo prueba: la factura no vale para ARCA.');
  await expect(hoja.getByLabel('Detalle')).toHaveValue('Seña — Placard del pasillo');

  await hoja.getByRole('button', { name: /^Emitir la factura de \$\s?450\.000/ }).click();
  await expect(hoja).toBeHidden();
  await expect(enLosPagos(page).getByText('Pidiéndole la factura a ARCA…')).toBeVisible();

  await expect.poll(() => servidor.de('pedir_la_factura').length).toBe(1);
  expect(servidor.de('pedir_la_factura')[0]?.cuerpo).toEqual({
    p_id: expect.stringMatching(UUID) as unknown,
    p_pago_id: trabajo.pagoId,
    p_detalle: 'Seña — Placard del pasillo',
  });
  expect(servidor.pedidos).toHaveLength(1);
  expect(servidor.sinRespuesta).toEqual([]);
});

test('un responsable inscripto sin CUIT ni domicilio: la hoja lo dice antes de tocar, no deja emitir, y «Cargar el CUIT» abre su ficha', async ({
  page,
  context,
}) => {
  const [clienteId] = await clientesPorRest(sesion, [
    { nombre: 'Carpintería Pérez SRL', condicion_fiscal: 'responsable_inscripto' },
  ]);
  const trabajo = await trabajoConSena('Mostrador del local', { clienteId });
  const servidor = await servidorDeLaFacturacion(context);

  const hoja = await abrirLaHojaDeFacturar(page, trabajo);
  await expect(hoja).toContainText(
    'A Carpintería Pérez SRL le falta el CUIT. Cargalo en su ficha para poder facturarle.',
  );
  await expect(hoja).toContainText('A Carpintería Pérez SRL le falta el domicilio.');
  await expect(hoja.getByRole('button', { name: /^Emitir la factura/ })).toBeDisabled();

  await hoja.getByRole('button', { name: 'Cargar el CUIT' }).click();
  const ficha = page.getByRole('dialog', { name: 'Editar cliente' });
  await expect(ficha).toBeVisible();
  await ficha.getByLabel('CUIT', { exact: true }).fill('30-71234567-1');
  await ficha.getByLabel('Domicilio fiscal', { exact: true }).fill('Av. Pellegrini 1250, Rosario');
  await ficha.getByRole('button', { name: 'Guardar los cambios' }).click();
  await expect(ficha).toBeHidden();

  await expect(hoja).toContainText('CUIT 30-71234567-1');
  await expect(hoja).not.toContainText('le falta');
  await expect(hoja.getByRole('button', { name: /^Emitir la factura/ })).toBeEnabled();
  await expect
    .poll(async () => documentoDelCliente(sesion, trabajo.clienteId))
    .toMatchObject({ cuit: '30-71234567-1', domicilio_fiscal: 'Av. Pellegrini 1250, Rosario' });
  expect(servidor.pedidos).toEqual([]);
});

test('el DNI y el CUIT de un consumidor final: un trabajo grande los pide, y se cargan desde la hoja', async ({
  page,
  context,
}) => {
  const trabajo = await trabajoConSena('Cocina completa', {
    precio: 1_500_000_000,
    sena: 750_000_000,
  });
  const servidor = await servidorDeLaFacturacion(context);

  const hoja = await abrirLaHojaDeFacturar(page, trabajo);
  await expect(hoja).toContainText('ARCA pide el DNI o el CUIT del cliente.');
  await expect(hoja.getByRole('button', { name: /^Emitir la factura/ })).toBeDisabled();

  await hoja.getByRole('button', { name: 'Cargar el DNI' }).click();
  const ficha = page.getByRole('dialog', { name: 'Editar cliente' });
  await ficha.getByLabel('DNI', { exact: true }).fill('28456789');
  await ficha.getByLabel('CUIT', { exact: true }).fill('20-30123456-3');
  await ficha.getByRole('button', { name: 'Guardar los cambios' }).click();
  await expect(ficha).toBeHidden();

  await expect(hoja.getByRole('button', { name: /^Emitir la factura/ })).toBeEnabled();
  await expect
    .poll(async () => documentoDelCliente(sesion, trabajo.clienteId))
    .toMatchObject({
      condicion_fiscal: 'consumidor_final',
      dni: '28456789',
      cuit: '20-30123456-3',
    });
  expect(servidor.pedidos).toEqual([]);
});

test('sin señal, la factura pedida espera, sobrevive a cerrar la app y sale una sola vez al volver, con el mismo id', async ({
  page,
  context,
}) => {
  const trabajo = await trabajoConSena('Vanitory del baño');
  const servidor = await servidorDeLaFacturacion(context, {
    pedir_la_factura: laFacturaPedida(trabajo, 45_000_000),
  });

  await page.goto(`/proyectos/${trabajo.id}`);
  await listoParaCortar(page);
  await context.setOffline(true);

  await page.getByRole('button', { name: /^Facturar el pago de/ }).click();
  const hoja = page.getByRole('dialog', { name: 'Facturar este pago' });
  await expect(hoja).toContainText('Sin señal: la factura sale cuando vuelva.');
  await hoja.getByRole('button', { name: /^Emitir la factura/ }).click();
  await expect(
    enLosPagos(page).getByText('Factura pedida sin señal: sale cuando vuelva.'),
  ).toBeVisible();
  await expect.poll(() => facturasEnLaCola(page)).toHaveLength(1);
  const [enLaCola] = await facturasEnLaCola(page);
  expect(enLaCola).toMatch(UUID);

  await page.close();
  const reabierta = await context.newPage();
  await reabierta.goto(`/proyectos/${trabajo.id}`);
  await expect(
    enLosPagos(reabierta).getByText('Factura pedida sin señal: sale cuando vuelva.'),
  ).toBeVisible();
  expect(servidor.pedidos).toEqual([]);

  await context.setOffline(false);
  await expect.poll(() => servidor.de('pedir_la_factura').length, { timeout: 30_000 }).toBe(1);
  expect(servidor.de('pedir_la_factura')[0]?.cuerpo).toMatchObject({
    p_id: enLaCola,
    p_pago_id: trabajo.pagoId,
  });
  await expect(enLosPagos(reabierta).getByText('Pidiéndole la factura a ARCA…')).toBeVisible();
  await reabierta.waitForTimeout(2_000);
  expect(servidor.de('pedir_la_factura')).toHaveLength(1);
  expect(servidor.sinRespuesta).toEqual([]);
});

test('al cobrar con la casilla prendida, la factura del pago final se pide después del cobro', async ({
  page,
  context,
}) => {
  const trabajo = await trabajoConSena('Placard del dormitorio', { estado: 'entregado' });
  const servidor = await servidorDeLaFacturacion(context, {
    pedir_la_factura: laFacturaPedida(trabajo, 51_000_000),
  });

  await page.goto(`/proyectos/${trabajo.id}`);
  await page.getByRole('button', { name: /^Cobrar/ }).click();
  const casilla = page.getByRole('checkbox', { name: /^Facturar el pago final con ARCA/ });
  await expect(casilla).toBeChecked();
  await expect(page.getByText(/^Sale a nombre de .+, consumidor final\.$/)).toBeVisible();
  await page.getByRole('button', { name: /^Cobrar y repartir/ }).click();
  await expect(page).toHaveURL(new RegExp(`/proyectos/${trabajo.id}$`));

  await expect
    .poll(async () => (await distribucionDe(sesion, trabajo.id))?.estado, { timeout: 30_000 })
    .toBe('cobrado');
  await expect.poll(() => servidor.de('pedir_la_factura').length, { timeout: 30_000 }).toBe(1);
  const final = (await pagosDe(sesion, trabajo.id)).find((pago) => pago.id !== trabajo.pagoId);
  expect(final?.monto_centavos).toBe(51_000_000);
  expect(servidor.de('pedir_la_factura')[0]?.cuerpo).toMatchObject({
    p_id: expect.stringMatching(UUID),
    p_pago_id: final?.id,
  });
  expect(servidor.pedidos).toHaveLength(1);
  expect(servidor.sinRespuesta).toEqual([]);
});

test('anular una factura autorizada: el diálogo pide confirmar y la nota de crédito se pide con la factura que anula', async ({
  page,
  context,
}) => {
  const trabajo = await trabajoConSena('Biblioteca del living');
  const facturaId = crypto.randomUUID();
  await conComprobantesEnElArranque(page, [
    filaDeComprobante({
      id: facturaId,
      householdId: household,
      proyectoId: trabajo.id,
      pagoId: trabajo.pagoId,
      importe: 45_000_000,
      estado: 'autorizada',
      puntoDeVenta: Number(puntoDeVenta),
      numero: 7,
      fecha: hoyEnElTaller(),
      detalle: 'Seña — Biblioteca del living',
    }),
  ]);
  const servidor = await servidorDeLaFacturacion(context, {
    pedir_la_nota_de_credito: (cuerpo) => {
      const pedido = cuerpo as { p_id: string; p_factura_id: string };
      return {
        json: filaDeComprobante({
          id: pedido.p_id,
          householdId: household,
          proyectoId: trabajo.id,
          pagoId: trabajo.pagoId,
          importe: 45_000_000,
          tipo: 'nota_de_credito_c',
          asociadoId: pedido.p_factura_id,
          puntoDeVenta: Number(puntoDeVenta),
        }),
      };
    },
  });
  const numero = `${puntoDeVenta}-00000007`;

  await page.goto(`/proyectos/${trabajo.id}`);
  await page.getByRole('button', { name: `Factura C ${numero}` }).click();
  const hoja = page.getByRole('dialog', { name: `Factura C ${numero}` });
  await expect(hoja).toContainText('86400944804384');
  await hoja.getByRole('button', { name: 'Anular la factura' }).click();

  const dialogo = page.getByRole('alertdialog', { name: `¿Anulás la factura C ${numero}?` });
  await expect(dialogo).toContainText(/Sale una nota de crédito C por \$\s?450\.000/);
  await dialogo.getByRole('button', { name: 'Emitir la nota de crédito' }).click();

  await expect.poll(() => servidor.de('pedir_la_nota_de_credito').length).toBe(1);
  expect(servidor.de('pedir_la_nota_de_credito')[0]?.cuerpo).toEqual({
    p_id: expect.stringMatching(UUID) as unknown,
    p_factura_id: facturaId,
  });
  await expect(
    enLosPagos(page).getByRole('list').getByText(`Anulando la factura C ${numero}…`),
  ).toBeVisible();
  await expect(hoja).toContainText(`Anulando la factura C ${numero}…`);
  expect(servidor.pedidos).toHaveLength(1);
  expect(servidor.sinRespuesta).toEqual([]);
});

test('Ajustes › Facturación muestra la conexión en prueba, y «Probar la conexión» dice lo que contestó el servidor', async ({
  page,
  context,
}) => {
  const servidor = await servidorDeLaFacturacion(context, {
    estado: () => ({ json: { ...ESTADO_DEL_TALLER_DE_PRUEBA, ultimoNumero: 7 } }),
  });

  await page.goto('/ajustes/facturacion');
  const conexion = page.getByRole('region', { name: 'La conexión con ARCA' });
  await expect(conexion, COMO_CONECTARLO).toContainText('En prueba');
  await expect(conexion).toContainText(puntoDeVenta);
  await expect(conexion).toContainText(
    'Estás en modo prueba: las facturas salen con «Prueba» y no valen para ARCA.',
  );

  await conexion.getByRole('button', { name: 'Probar la conexión' }).click();
  await expect(conexion.getByRole('status')).toContainText(
    'ARCA contesta y NUMA entra bien. La última factura C es la 00000007.',
  );
  expect(servidor.de('estado')).toHaveLength(1);
  expect(servidor.pedidos).toHaveLength(1);
  expect(servidor.sinRespuesta).toEqual([]);
});

test('el asistente para conectar: baja el pedido, sube el certificado y conecta después del diálogo, todo contra el servidor del spec', async ({
  page,
  context,
}) => {
  const conectada = {
    ...ESTADO_DEL_TALLER_DE_PRUEBA,
    ambiente: 'produccion',
    certificadoVence: '2028-10-03',
    certificado: { estado: 'activo', vence: '2028-10-03' },
  };
  const servidor = await servidorDeLaFacturacion(context, {
    estado: () => ({ json: ESTADO_DEL_TALLER_DE_PRUEBA }),
    certificado: () => ({ json: { pedido: PEDIDO_DE_MENTIRA } }),
    'certificado/subir': () => ({
      json: {
        ...ESTADO_DEL_TALLER_DE_PRUEBA,
        certificado: { estado: 'subido', vence: '2028-10-03' },
      },
    }),
    conectar: () => ({ json: conectada }),
  });

  await page.goto('/ajustes/facturacion/conectar');
  await expect.poll(() => servidor.de('estado').length).toBe(1);

  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Bajar el pedido' }).click();
  expect((await descarga).suggestedFilename()).toBe('numa-produccion.csr');
  await expect(page.getByText(/^Listo: se bajó numa-produccion\.csr\./)).toBeVisible();

  await page.getByLabel('El certificado que bajaste de ARCA').setInputFiles({
    name: 'numa.crt',
    mimeType: 'application/x-x509-ca-cert',
    buffer: Buffer.from(CERTIFICADO_DE_MENTIRA),
  });
  await expect(page.getByText(/^Certificado listo\. Vence el /)).toBeVisible();
  expect(servidor.de('certificado/subir')[0]?.cuerpo).toEqual({
    certificado: CERTIFICADO_DE_MENTIRA,
  });

  await page.getByLabel('Punto de venta', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Conectar', exact: true }).click();
  const dialogo = page.getByRole('alertdialog', { name: '¿Conectás la facturación de verdad?' });
  await expect(dialogo).toContainText(
    'Desde ahora, cada factura que hagas en NUMA va a ser real, a tu nombre y con validez fiscal.',
  );
  expect(servidor.de('conectar')).toHaveLength(0);
  await dialogo.getByRole('button', { name: 'Conectar', exact: true }).click();

  await expect(
    page.getByText('Listo, la facturación quedó conectada. Ya podés facturar tus cobros.'),
  ).toBeVisible();
  expect(servidor.de('conectar')[0]?.cuerpo).toEqual({ puntoDeVenta: 3 });
  expect(servidor.de('certificado')).toHaveLength(1);
  expect(servidor.de('estado')).toHaveLength(1);
  expect(servidor.pedidos).toHaveLength(4);
  expect(servidor.sinRespuesta).toEqual([]);
});

test('la tarjeta del monotributo en Finanzas, con el taller en prueba, dice que no cuenta nada', async ({
  page,
  context,
}) => {
  const servidor = await servidorDeLaFacturacion(context);

  await page.goto('/finanzas');
  const tarjeta = page.getByRole('region', { name: 'Monotributo' });
  await expect(tarjeta).toContainText(
    'En modo prueba no cuenta nada: las facturas de prueba no son de verdad.',
  );
  await expect(tarjeta).toContainText('Categoría D');
  await expect(tarjeta).toContainText('Próxima recategorización');
  expect(servidor.pedidos).toEqual([]);
});

test('la traba común: un pedido a la facturación que el spec no responde no sale del navegador y queda anotado', async ({
  page,
}) => {
  await page.goto('/ajustes/facturacion/conectar');
  await expect(page.getByRole('heading', { level: 1, name: 'Conectar con ARCA' })).toBeVisible();
  await expect.poll(() => losEscapados()).toEqual(['GET estado']);
  expect(sacarLosEscapados()).toEqual(['GET estado']);
});

test('vaciarTaller devuelve a fábrica lo que la app edita de la facturación, y la conexión del taller de prueba queda', async ({
  isMobile,
}) => {
  test.skip(isMobile, 'una sola vez por corrida: es el apoyo de los e2e, no una pantalla');
  const antes = await leerLaFacturacion(sesion);
  await escribirLaFacturacion(sesion, { facturacion_concepto: 3 });
  expect(await leerLaFacturacion(sesion)).toMatchObject({
    facturacion_concepto: 3,
    facturacion_categoria: 'D',
    facturacion_ingresos_brutos: '901-123456-7',
    facturacion_inicio_de_actividades: '2019-03-01',
  });

  await vaciarTaller(sesion);

  expect(await leerLaFacturacion(sesion)).toEqual({
    facturacion_ambiente: antes.facturacion_ambiente,
    facturacion_cuit: antes.facturacion_cuit,
    facturacion_punto_de_venta: antes.facturacion_punto_de_venta,
    facturacion_desde: antes.facturacion_desde,
    ...FACTURACION_DE_FABRICA,
  });
});

import assert from 'node:assert/strict';

import type { CategoriaDerivada, EventoDeLaAgenda, PreferenciasDeAvisos } from '@maun/domain';
import webpush from 'web-push';

import {
  baseDeSupabase,
  type AvisoPorMandar,
  type Base,
  type Suscripcion,
  type UsuarioDelToken,
} from './base.ts';
import { configuracionDelEntorno } from './entorno.ts';
import {
  laSuscripcionMurio,
  mandarLaPrueba,
  mandarLosAvisos,
  preferenciasCompletas,
  rangoDelAviso,
  type Enviador,
} from './envio.ts';
import { crearManejador } from './manejador.ts';
import { cargaDelAviso, pesos } from './texto.ts';

const DIA = '2026-09-14';
const VAPID = {
  publica: 'la-publica',
  privada: 'la-privada',
  sujeto: 'https://numa-dashboard.netlify.app',
};

const PREFERENCIAS: PreferenciasDeAvisos = {
  entregas: { activo: true, anticipacion: 2 },
  visitas: { activo: true, anticipacion: 1 },
  presupuestos: { activo: true, anticipacion: 1 },
  seguimientos: { activo: true, anticipacion: 0 },
  vencimientos: { activo: true, anticipacion: 0 },
  anotaciones: { activo: false, anticipacion: 0 },
};

interface Registro {
  anotados: [string, string, boolean][];
  borrados: string[];
}

const DE_LA_SESION: UsuarioDelToken = { id: 'u1', idioma: 'es' };

function baseFalsa(
  avisos: AvisoPorMandar[] = [],
  suscripciones: Suscripcion[] = [],
): Base & { registro: Registro } {
  const registro: Registro = { anotados: [], borrados: [] };
  return {
    registro,
    avisosPorMandar: () => Promise.resolve(avisos),
    anotarAviso: (id, dia, mandado) => {
      registro.anotados.push([id, dia, mandado]);
      return Promise.resolve();
    },
    borrarSuscripcionVencida: (endpoint) => {
      registro.borrados.push(endpoint);
      return Promise.resolve();
    },
    suscripcionesParaProbar: () => Promise.resolve(suscripciones),
    usuarioDelToken: (token) => Promise.resolve(token === 'sesion-valida' ? DE_LA_SESION : null),
  };
}

function suscripcion(id: string): Suscripcion {
  return { id, endpoint: `https://push.example/${id}`, p256dh: 'p', auth: 'a' };
}

function aviso(id: string, entrega: string | null): AvisoPorMandar {
  return {
    ...suscripcion(id),
    dia: DIA,
    preferencias: PREFERENCIAS,
    filas: {
      proyectos:
        entrega === null
          ? []
          : [
              {
                id: `p-${id}`,
                cliente_id: 'c1',
                titulo: 'Cocina de Villalba',
                estado: 'en_curso',
                fecha_visita: null,
                entrega_estimada: entrega,
                vencimiento_presupuesto: null,
                direccion_entrega: 'Sarmiento 2310',
              } as never,
            ],
      clientes: [{ id: 'c1', nombre: 'Villalba', zona: 'Morón' } as never],
      anotaciones: [],
    },
  };
}

function enviadorQueContesta(respuestas: Record<string, number>): Enviador & { cargas: string[] } {
  const cargas: string[] = [];
  const enviar: Enviador = (destino, carga) => {
    cargas.push(carga);
    const estado = respuestas[destino.id];
    if (estado === undefined) return Promise.resolve();
    return Promise.reject(
      Object.assign(new Error(`contestó ${String(estado)}`), { statusCode: estado }),
    );
  };
  return Object.assign(enviar, { cargas });
}

function manejador(
  valores: Record<string, string>,
  base: Base = baseFalsa(),
  enviar: Enviador = enviadorQueContesta({}),
) {
  return crearManejador({
    configuracion: configuracionDelEntorno({ get: (nombre) => valores[nombre] }),
    base,
    enviar,
    ahora: () => new Date('2026-09-14T10:40:00Z'),
  });
}

const CON_CLAVES = {
  VAPID_PUBLIC_KEY: 'la-publica',
  VAPID_PRIVATE_KEY: 'la-privada',
  VAPID_SUBJECT: 'https://numa-dashboard.netlify.app',
  AVISOS_SECRETO: 'el-secreto',
};

Deno.test(
  'un 410 o un 404 borran la suscripción; un 500 no la toca y no marca el día',
  async () => {
    const base = baseFalsa();
    const enviar = enviadorQueContesta({ muerta: 410, desconocida: 404, caida: 500 });

    const resultado = await mandarLosAvisos(
      [aviso('muerta', DIA), aviso('desconocida', DIA), aviso('caida', DIA), aviso('viva', DIA)],
      base,
      enviar,
      VAPID,
    );

    assert.deepEqual(resultado, { mandados: 1, sinNadaQueAvisar: 0, podados: 2, fallidos: 1 });
    assert.deepEqual(base.registro.borrados, [
      'https://push.example/muerta',
      'https://push.example/desconocida',
    ]);
    assert.deepEqual(base.registro.anotados, [['viva', DIA, true]]);
  },
);

Deno.test('sin nada que avisar no manda, pero marca el día para no volver a mirar', async () => {
  const base = baseFalsa();
  const enviar = enviadorQueContesta({});

  const resultado = await mandarLosAvisos(
    [aviso('lejos', '2026-10-20'), aviso('nada', null)],
    base,
    enviar,
    VAPID,
  );

  assert.deepEqual(resultado, { mandados: 0, sinNadaQueAvisar: 2, podados: 0, fallidos: 0 });
  assert.equal(enviar.cargas.length, 0);
  assert.deepEqual(base.registro.anotados, [
    ['lejos', DIA, false],
    ['nada', DIA, false],
  ]);
});

Deno.test(
  'la selección es la de la agenda: una entrega dentro de la anticipación se avisa',
  async () => {
    const enviar = enviadorQueContesta({});
    await mandarLosAvisos([aviso('viva', '2026-09-16')], baseFalsa(), enviar, VAPID);

    assert.deepEqual(JSON.parse(enviar.cargas[0] ?? '{}'), {
      titulo: 'Lo que viene en la agenda',
      cuerpo: 'Entregar: Cocina de Villalba (en 2 días)',
      url: '/agenda',
      etiqueta: `agenda-${DIA}`,
    });
  },
);

Deno.test(
  'lo hecho no se avisa: la visita de hoy que ya se relevó no sale, y la misma sin relevar sí',
  async () => {
    const visita = (id: string, hecha: boolean): AvisoPorMandar => ({
      ...aviso(id, null),
      filas: {
        proyectos: [
          {
            id: `p-${id}`,
            cliente_id: 'c1',
            titulo: 'Relevamiento UTN',
            estado: 'a_presupuestar',
            fecha_visita: DIA,
            visita_hecha: hecha,
            entrega_estimada: null,
            vencimiento_presupuesto: null,
            direccion_entrega: '',
          } as never,
        ],
        clientes: [{ id: 'c1', nombre: 'UTN', zona: 'Haedo' } as never],
        anotaciones: [],
      },
    });
    const base = baseFalsa();
    const enviar = enviadorQueContesta({});

    const resultado = await mandarLosAvisos(
      [visita('relevada', true), visita('pendiente', false)],
      base,
      enviar,
      VAPID,
    );

    assert.deepEqual(resultado, { mandados: 1, sinNadaQueAvisar: 1, podados: 0, fallidos: 0 });
    assert.deepEqual(base.registro.anotados, [
      ['relevada', DIA, false],
      ['pendiente', DIA, true],
    ]);
    assert.equal(
      JSON.parse(enviar.cargas[0] ?? '{}').cuerpo,
      'Relevamiento: Relevamiento UTN (hoy)',
    );
  },
);

Deno.test(
  'a quién le toca escribirle hoy va en el aviso con su nombre, y con el seguimiento apagado no',
  async () => {
    const enSeguimiento = (id: string, preferencias: PreferenciasDeAvisos): AvisoPorMandar => ({
      ...aviso(id, null),
      preferencias,
      filas: {
        proyectos: [
          {
            id: 'p-placard',
            cliente_id: 'c1',
            titulo: 'Placard',
            estado: 'en_seguimiento',
            fecha_visita: null,
            entrega_estimada: null,
            vencimiento_presupuesto: null,
            direccion_entrega: '',
          } as never,
        ],
        clientes: [{ id: 'c1', nombre: 'Villalba', zona: 'Morón' } as never],
        anotaciones: [],
        proximos_contactos: [
          {
            id: 's1',
            proyecto_id: 'p-placard',
            fecha: DIA,
            hecho_el: null,
            nota: 'Después de las vacaciones',
            importante: false,
            deleted_at: null,
          } as never,
        ],
      },
    });
    const base = baseFalsa();
    const enviar = enviadorQueContesta({});

    const resultado = await mandarLosAvisos(
      [
        enSeguimiento('prendido', PREFERENCIAS),
        enSeguimiento('apagado', {
          ...PREFERENCIAS,
          seguimientos: { activo: false, anticipacion: 0 },
        }),
      ],
      base,
      enviar,
      VAPID,
    );

    assert.deepEqual(resultado, { mandados: 1, sinNadaQueAvisar: 1, podados: 0, fallidos: 0 });
    assert.deepEqual(JSON.parse(enviar.cargas[0] ?? '{}'), {
      titulo: 'Hoy tenés 1 cosa en la agenda',
      cuerpo: 'Volver a escribirle a Villalba (hoy)',
      url: '/agenda',
      etiqueta: `agenda-${DIA}`,
    });
  },
);

const HOGAR = '00000000-0000-7000-8000-000000000001';
const MAUN = '00000000-0000-7000-8000-000000000002';
const DIEZMO = '00000000-0000-7000-8000-000000000003';
const GASTOS_FIJOS = '00000000-0000-7000-8000-000000000010';

interface Renglon {
  nombre: string;
  monto: number;
  dia: number | null;
}

interface ConVencimientos {
  dia?: string;
  zona?: string;
  preferencias?: Partial<PreferenciasDeAvisos>;
  renglones?: Renglon[];
  guardadaEn?: string;
  gastos?: { categoria: string; fecha: string }[];
}

function conVencimientos(
  id: string,
  {
    dia = DIA,
    zona = 'America/Argentina/Buenos_Aires',
    preferencias = PREFERENCIAS,
    renglones = [
      { nombre: 'Alquiler', monto: 50_000_000, dia: 14 },
      { nombre: 'Luz', monto: 6_000_000, dia: 14 },
      { nombre: 'Ayudante', monto: 34_000_000, dia: null },
    ],
    guardadaEn = '2026-09-01T12:00:00.123456+00:00',
    gastos = [],
  }: ConVencimientos = {},
): AvisoPorMandar {
  const fila = {
    obligaciones: [{ tesoro: DIEZMO, porcentaje: 1000, base: 'ingreso' }],
    pasos: [
      {
        tesoro: GASTOS_FIJOS,
        clase: 'fijos',
        tope: renglones.reduce((suma, renglon) => suma + renglon.monto, 0),
        renglones,
        desde: null,
        modo: 'saldo',
        hastaLaMeta: false,
      },
    ],
    reparto: [],
    superavit: MAUN,
    sueldoPorTrabajo: false,
  };
  const tesoro = (tesoroId: string, clave: string | null, nombre: string) =>
    ({ id: tesoroId, clave, nombre, archivado_at: null, deleted_at: null }) as never;
  return {
    ...suscripcion(id),
    dia,
    zona,
    preferencias: preferencias as PreferenciasDeAvisos,
    filas: {
      proyectos: [],
      clientes: [],
      anotaciones: [],
      proximos_contactos: [],
      ajustes: [
        {
          id: 'a1',
          fila,
          fila_version: 3,
          fila_guardada_at: guardadaEn,
          deleted_at: null,
        } as never,
      ],
      tesoros: [
        tesoro(HOGAR, 'hogar', 'Hogar'),
        tesoro(MAUN, 'maun', 'Maun'),
        tesoro(DIEZMO, 'diezmo', 'Diezmo'),
        tesoro(GASTOS_FIJOS, null, 'Gastos fijos'),
      ],
      movimientos: gastos.map(
        (gasto, indice) =>
          ({
            id: `m${String(indice)}`,
            tipo: 'gasto',
            fecha: gasto.fecha,
            tesoro_origen: null,
            tesoro_destino: null,
            desde_id: GASTOS_FIJOS,
            hacia_id: null,
            monto_centavos: 1,
            categoria: gasto.categoria,
            deleted_at: null,
          }) as never,
      ),
    },
  };
}

async function cuerposDe(avisos: AvisoPorMandar[]) {
  const base = baseFalsa();
  const enviar = enviadorQueContesta({});
  const resultado = await mandarLosAvisos(avisos, base, enviar, VAPID);
  return {
    resultado,
    anotados: base.registro.anotados,
    cargas: enviar.cargas.map((carga) => JSON.parse(carga) as { titulo: string; cuerpo: string }),
  };
}

Deno.test(
  'el compromiso que vence hoy se avisa con su renglón y su monto, y el que ya se pagó en el mes no',
  async () => {
    const { resultado, cargas } = await cuerposDe([
      conVencimientos('telefono', {
        gastos: [
          { categoria: 'luz ', fecha: '2026-09-02' },
          { categoria: 'Alquiler', fecha: '2026-08-14' },
        ],
      }),
    ]);

    assert.deepEqual(resultado, { mandados: 1, sinNadaQueAvisar: 0, podados: 0, fallidos: 0 });
    assert.deepEqual(cargas, [
      {
        titulo: 'Hoy tenés 1 cosa en la agenda',
        cuerpo: 'Vence: Alquiler, $\u00a0500.000 (hoy)',
        url: '/agenda',
        etiqueta: `agenda-${DIA}`,
      },
    ]);
  },
);

Deno.test('con los vencimientos apagados, o todo pagado, no hay nada que avisar', async () => {
  const { resultado, anotados } = await cuerposDe([
    conVencimientos('apagado', {
      preferencias: { ...PREFERENCIAS, vencimientos: { activo: false, anticipacion: 0 } },
    }),
    conVencimientos('pagado', {
      gastos: [
        { categoria: 'Alquiler', fecha: '2026-09-10' },
        { categoria: 'Luz', fecha: '2026-09-14' },
      ],
    }),
    conVencimientos('sin-dias', { renglones: [{ nombre: 'Alquiler', monto: 1, dia: null }] }),
  ]);

  assert.deepEqual(resultado, { mandados: 0, sinNadaQueAvisar: 3, podados: 0, fallidos: 0 });
  assert.deepEqual(anotados, [
    ['apagado', DIA, false],
    ['pagado', DIA, false],
    ['sin-dias', DIA, false],
  ]);
});

Deno.test('el que vence el 31 se avisa el último día de un mes de 30', async () => {
  const { cargas } = await cuerposDe([
    conVencimientos('telefono', {
      dia: '2026-09-30',
      renglones: [{ nombre: 'Cuota del auto', monto: 20_000_050, dia: 31 }],
    }),
  ]);

  assert.equal(cargas[0]?.cuerpo, 'Vence: Cuota del auto, $\u00a0200.000,50 (hoy)');
});

Deno.test(
  'con anticipación, el aviso mira también el mes que viene y dice en cuántos días vence',
  async () => {
    const renglones = [{ nombre: 'Alquiler', monto: 50_000_000, dia: 1 }];
    const { cargas, resultado } = await cuerposDe([
      conVencimientos('anticipado', {
        dia: '2026-09-29',
        renglones,
        preferencias: { ...PREFERENCIAS, vencimientos: { activo: true, anticipacion: 3 } },
      }),
      conVencimientos('el-mismo-dia', { dia: '2026-09-29', renglones }),
    ]);

    assert.deepEqual(resultado, { mandados: 1, sinNadaQueAvisar: 1, podados: 0, fallidos: 0 });
    assert.deepEqual(cargas[0], {
      titulo: 'Lo que viene en la agenda',
      cuerpo: 'Vence: Alquiler, $\u00a0500.000 (en 2 días)',
      url: '/agenda',
      etiqueta: 'agenda-2026-09-29',
    });
    assert.deepEqual(rangoDelAviso('2026-09-29', PREFERENCIAS), {
      desde: '2026-09-29',
      hasta: '2026-10-01',
    });
  },
);

Deno.test(
  'unas preferencias guardadas antes de los vencimientos los avisan igual, prendidos y el mismo día',
  async () => {
    const { vencimientos: _vencimientos, ...deAntes } = PREFERENCIAS;
    assert.deepEqual(preferenciasCompletas(deAntes).vencimientos, {
      activo: true,
      anticipacion: 0,
    });

    const { cargas } = await cuerposDe([conVencimientos('telefono', { preferencias: deAntes })]);
    assert.equal(
      cargas[0]?.cuerpo,
      'Vence: Alquiler, $\u00a0500.000 (hoy)\nVence: Luz, $\u00a060.000 (hoy)',
    );
  },
);

Deno.test(
  'el mes en que se guardó la fila se toma en la zona de la suscripción: antes de eso no vence nada',
  async () => {
    const guardadaEn = '2026-10-01T01:30:00.123456+00:00';
    const renglones = [{ nombre: 'Alquiler', monto: 50_000_000, dia: 30 }];
    const { resultado } = await cuerposDe([
      conVencimientos('buenos-aires', { dia: '2026-09-30', guardadaEn, renglones }),
      conVencimientos('utc', { dia: '2026-09-30', guardadaEn, renglones, zona: 'UTC' }),
    ]);

    assert.deepEqual(resultado, { mandados: 1, sinNadaQueAvisar: 1, podados: 0, fallidos: 0 });
  },
);

Deno.test('los pesos van con puntos de miles, coma decimal y el signo pegado al número', () => {
  assert.equal(pesos(50_000_000), '$\u00a0500.000');
  assert.equal(pesos(12_345_678), '$\u00a0123.456,78');
  assert.equal(pesos(5), '$\u00a00,05');
  assert.equal(pesos(-100), '-$\u00a01');
});

Deno.test('el texto dice lo de hoy primero y resume lo que no entra', () => {
  const eventos = [
    {
      clase: 'derivada',
      id: 'e',
      categoria: 'entrega',
      fecha: DIA,
      hora: null,
      proyectoId: 'p',
      clienteId: 'c',
      titulo: 'Placard',
      cliente: '',
      lugar: '',
      hecha: false,
      importante: false,
      comprometida: false,
      franja: null,
    },
    {
      clase: 'propia',
      id: 'n1',
      categoria: 'taller',
      fecha: DIA,
      hora: null,
      texto: 'Retirar el pulpo',
      proyectoId: null,
      proyecto: null,
      hecha: false,
      importante: false,
    },
    {
      clase: 'derivada',
      id: 'v',
      categoria: 'visita',
      fecha: '2026-09-15',
      hora: null,
      proyectoId: 'p',
      clienteId: 'c',
      titulo: 'UTN',
      cliente: '',
      lugar: '',
      hecha: false,
      importante: false,
      comprometida: false,
      franja: null,
    },
    {
      clase: 'derivada',
      id: 'pr',
      categoria: 'presupuesto',
      fecha: '2026-09-15',
      hora: null,
      proyectoId: 'p',
      clienteId: 'c',
      titulo: 'Vestidor',
      cliente: '',
      lugar: '',
      hecha: false,
      importante: false,
      comprometida: false,
      franja: null,
    },
    {
      clase: 'propia',
      id: 'n2',
      categoria: 'materiales',
      fecha: '2026-09-16',
      hora: null,
      texto: 'Comprar melamina',
      proyectoId: null,
      proyecto: null,
      hecha: false,
      importante: false,
    },
  ] as const;

  const carga = cargaDelAviso(eventos, DIA);

  assert.equal(carga.titulo, 'Hoy tenés 2 cosas en la agenda');
  assert.equal(
    carga.cuerpo,
    [
      'Entregar: Placard (hoy)',
      'Retirar el pulpo (hoy)',
      'Relevamiento: UTN (mañana)',
      'Entregar presupuesto: Vestidor (mañana)',
      'y 1 más en la agenda',
    ].join('\n'),
  );
});

Deno.test('probar manda a los dispositivos del usuario y poda los que murieron', async () => {
  const base = baseFalsa();
  const resultado = await mandarLaPrueba(
    [suscripcion('telefono'), suscripcion('vieja')],
    base,
    enviadorQueContesta({ vieja: 410 }),
    VAPID,
  );

  assert.deepEqual(resultado, { mandados: 1, sinNadaQueAvisar: 0, podados: 1, fallidos: 0 });
  assert.deepEqual(base.registro.borrados, ['https://push.example/vieja']);
});

Deno.test(
  'sin claves VAPID el servidor dice que no puede mandar, y el trabajo no hace nada',
  async () => {
    const sinClaves = manejador({ AVISOS_SECRETO: 'el-secreto' });

    const estado = await sinClaves(new Request('https://f.example/avisos'));
    assert.equal(estado.status, 200);
    assert.deepEqual(await estado.json(), { configurado: false, clavePublica: null });

    const trabajo = await sinClaves(
      new Request('https://f.example/avisos', {
        method: 'POST',
        headers: { Authorization: 'Bearer el-secreto' },
      }),
    );
    assert.deepEqual(await trabajo.json(), { configurado: false, mandados: 0 });
  },
);

Deno.test('con claves dice que puede, y comparte solo la pública', async () => {
  const respuesta = await manejador(CON_CLAVES)(new Request('https://f.example/avisos'));
  const cuerpo = await respuesta.text();

  assert.deepEqual(JSON.parse(cuerpo), { configurado: true, clavePublica: 'la-publica' });
  assert.equal(cuerpo.includes('la-privada'), false);
  assert.equal(respuesta.headers.get('Access-Control-Allow-Origin'), '*');
});

Deno.test('el trabajo programado sin el secreto no pasa, y con el secreto manda', async () => {
  const base = baseFalsa([aviso('viva', DIA)]);
  const atender = manejador(CON_CLAVES, base);

  for (const autorizacion of [undefined, 'Bearer otro-secreto', 'Bearer el-secret']) {
    const respuesta = await atender(
      new Request('https://f.example/avisos', {
        method: 'POST',
        headers: autorizacion === undefined ? {} : { Authorization: autorizacion },
      }),
    );
    assert.equal(respuesta.status, 401);
  }
  assert.deepEqual(base.registro.anotados, []);

  const conSecreto = await atender(
    new Request('https://f.example/avisos', {
      method: 'POST',
      headers: { Authorization: 'Bearer el-secreto' },
    }),
  );
  assert.deepEqual(await conSecreto.json(), {
    configurado: true,
    mandados: 1,
    sinNadaQueAvisar: 0,
    podados: 0,
    fallidos: 0,
  });
});

Deno.test('probar necesita una sesión válida', async () => {
  const atender = manejador(CON_CLAVES, baseFalsa([], [suscripcion('telefono')]));

  const sinSesion = await atender(
    new Request('https://f.example/avisos/probar', { method: 'POST' }),
  );
  assert.equal(sinSesion.status, 401);

  const conSesion = await atender(
    new Request('https://f.example/avisos/probar', {
      method: 'POST',
      headers: { Authorization: 'Bearer sesion-valida' },
      body: JSON.stringify({ endpoint: 'https://push.example/telefono' }),
    }),
  );
  assert.equal(conSesion.status, 200);
  assert.equal(((await conSesion.json()) as { mandados: number }).mandados, 1);
});

Deno.test(
  'la base llama a las funciones con la clave del servidor, sin exponerla en otro lado',
  async () => {
    const pedidos: { url: string; init: RequestInit }[] = [];
    const base = baseDeSupabase('https://ref.supabase.co', 'sb_secret_abc', (url, init) => {
      pedidos.push({ url, init });
      return Promise.resolve(new Response('true', { status: 200 }));
    });

    await base.borrarSuscripcionVencida('https://push.example/muerta');

    assert.equal(pedidos[0]?.url, 'https://ref.supabase.co/rest/v1/rpc/borrar_suscripcion_vencida');
    assert.deepEqual(pedidos[0]?.init.headers, {
      apikey: 'sb_secret_abc',
      'Content-Type': 'application/json',
    });
    assert.equal(
      pedidos[0]?.init.body,
      JSON.stringify({ p_endpoint: 'https://push.example/muerta' }),
    );
  },
);

Deno.test(
  'la clave del servidor sale de la heredada o de las nuevas, y sin claves queda vacía',
  () => {
    assert.equal(
      configuracionDelEntorno({ get: (n) => ({ SUPABASE_SERVICE_ROLE_KEY: 'eyJ.x' })[n] })
        .claveDelServidor,
      'eyJ.x',
    );
    assert.equal(
      configuracionDelEntorno({
        get: (n) => ({ SUPABASE_SECRET_KEYS: '{"default":"sb_secret_1"}' })[n],
      }).claveDelServidor,
      'sb_secret_1',
    );
    assert.equal(configuracionDelEntorno({ get: () => undefined }).claveDelServidor, '');
  },
);

Deno.test(
  'web-push importa en Deno, cifra un aviso para una suscripción real y su error trae el estado',
  async () => {
    const b64url = (bytes: Uint8Array) =>
      btoa(String.fromCharCode(...bytes))
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replaceAll('=', '');
    const par = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
      'deriveBits',
    ]);
    const publica = new Uint8Array(await crypto.subtle.exportKey('raw', par.publicKey));
    const vapid = webpush.generateVAPIDKeys();

    const detalles = webpush.generateRequestDetails(
      {
        endpoint: 'https://fcm.googleapis.com/fcm/send/prueba',
        keys: { p256dh: b64url(publica), auth: b64url(crypto.getRandomValues(new Uint8Array(16))) },
      },
      JSON.stringify({ titulo: 'Hola' }),
      {
        vapidDetails: {
          subject: 'https://numa-dashboard.netlify.app',
          publicKey: vapid.publicKey,
          privateKey: vapid.privateKey,
        },
        TTL: 60,
      },
    );

    assert.equal(detalles.method, 'POST');
    assert.equal(detalles.headers['Content-Encoding'], 'aes128gcm');
    assert.match(String(detalles.headers.Authorization), /^vapid t=.+, k=.+$/);
    assert.ok((detalles.body?.length ?? 0) > 0);
    assert.equal(laSuscripcionMurio(new webpush.WebPushError('Gone', 410, {}, '', 'x')), true);
    assert.equal(laSuscripcionMurio(new webpush.WebPushError('Error', 500, {}, '', 'x')), false);
  },
);

Deno.test(
  'el aviso sale en el idioma de su persona, con su lang; sin un idioma que conozca, en castellano y sin lang',
  async () => {
    const enviar = enviadorQueContesta({});
    await mandarLosAvisos(
      [
        { ...aviso('ingles', '2026-09-16'), idioma: 'en' },
        { ...aviso('portugues', '2026-09-16'), idioma: 'pt-BR' },
        { ...aviso('frances', '2026-09-16'), idioma: 'fr' },
      ],
      baseFalsa(),
      enviar,
      VAPID,
    );

    assert.deepEqual(
      enviar.cargas.map((carga) => JSON.parse(carga) as unknown),
      [
        {
          titulo: 'Coming up on your calendar',
          cuerpo: 'Deliver: Cocina de Villalba (in 2 days)',
          url: '/agenda',
          etiqueta: `agenda-${DIA}`,
          lang: 'en-US',
        },
        {
          titulo: 'Próximos compromissos na agenda',
          cuerpo: 'Entregar: Cocina de Villalba (em 2 dias)',
          url: '/agenda',
          etiqueta: `agenda-${DIA}`,
          lang: 'pt-BR',
        },
        {
          titulo: 'Lo que viene en la agenda',
          cuerpo: 'Entregar: Cocina de Villalba (en 2 días)',
          url: '/agenda',
          etiqueta: `agenda-${DIA}`,
        },
      ],
    );
  },
);

Deno.test('el monto del vencimiento va con el formato de plata del idioma', async () => {
  const cuota = {
    dia: '2026-09-30',
    renglones: [{ nombre: 'Cuota del auto', monto: 20_000_050, dia: 31 }],
  };
  const { cargas } = await cuerposDe([
    { ...conVencimientos('ingles', cuota), idioma: 'en' },
    { ...conVencimientos('portugues', cuota), idioma: 'pt-BR' },
    { ...conVencimientos('ingles-redondo'), idioma: 'en' },
    { ...conVencimientos('portugues-redondo'), idioma: 'pt-BR' },
  ]);

  assert.deepEqual(
    cargas.map((carga) => [carga.titulo, carga.cuerpo]),
    [
      [
        'You have 1 thing on your calendar today',
        'Due: Cuota del auto, ARS\u00a0200,000.50 (today)',
      ],
      [
        'Hoje você tem 1 compromisso na agenda',
        'Vence: Cuota del auto, ARS\u00a0200.000,50 (hoje)',
      ],
      [
        'You have 2 things on your calendar today',
        'Due: Alquiler, ARS\u00a0500,000 (today)\nDue: Luz, ARS\u00a060,000 (today)',
      ],
      [
        'Hoje você tem 2 compromissos na agenda',
        'Vence: Alquiler, ARS\u00a0500.000 (hoje)\nVence: Luz, ARS\u00a060.000 (hoje)',
      ],
    ],
  );
});

Deno.test(
  'en inglés y en portugués cada renglón dice su acción y su cuándo, y resume lo que no entra',
  () => {
    const derivada = (
      categoria: CategoriaDerivada,
      fecha: string,
      titulo: string,
    ): EventoDeLaAgenda => ({
      clase: 'derivada',
      id: `${categoria}-${titulo}`,
      categoria,
      fecha,
      hora: null,
      proyectoId: 'p',
      clienteId: 'c',
      titulo,
      cliente: '',
      lugar: '',
      hecha: false,
      importante: false,
      comprometida: false,
      franja: null,
    });
    const eventos: EventoDeLaAgenda[] = [
      derivada('seguimiento', DIA, 'Villalba'),
      derivada('visita', '2026-09-15', 'UTN'),
      derivada('presupuesto', '2026-09-17', 'Vestidor'),
      {
        clase: 'propia',
        id: 'n1',
        categoria: 'materiales',
        fecha: '2026-09-17',
        hora: null,
        texto: 'Comprar melamina',
        proyectoId: null,
        proyecto: null,
        hecha: false,
        importante: false,
      },
      derivada('entrega', '2026-09-18', 'Placard'),
    ];

    const enIngles = cargaDelAviso(eventos, DIA, 'en');
    assert.equal(enIngles.titulo, 'You have 1 thing on your calendar today');
    assert.equal(
      enIngles.cuerpo,
      [
        'Follow up with Villalba (today)',
        'Site measure: UTN (tomorrow)',
        'Send quote: Vestidor (in 3 days)',
        'Comprar melamina (in 3 days)',
        'and 1 more on your calendar',
      ].join('\n'),
    );

    const enPortugues = cargaDelAviso(eventos, DIA, 'pt-BR');
    assert.equal(enPortugues.titulo, 'Hoje você tem 1 compromisso na agenda');
    assert.equal(
      enPortugues.cuerpo,
      [
        'Retomar contato com Villalba (hoje)',
        'Visita técnica: UTN (amanhã)',
        'Enviar orçamento: Vestidor (em 3 dias)',
        'Comprar melamina (em 3 dias)',
        'e mais 1 na agenda',
      ].join('\n'),
    );
  },
);

Deno.test(
  'el aviso de prueba sale en el idioma de quien lo pide, y en castellano igual que antes',
  async () => {
    const casos = [
      {
        idioma: 'pt-BR',
        carga: {
          titulo: 'Notificação de teste',
          cuerpo: 'Se você está vendo isto, as notificações chegam a este aparelho.',
          url: '/ajustes/avisos',
          etiqueta: 'prueba',
          lang: 'pt-BR',
        },
      },
      {
        idioma: 'en',
        carga: {
          titulo: 'Test notification',
          cuerpo: 'If you can see this, notifications are reaching this device.',
          url: '/ajustes/avisos',
          etiqueta: 'prueba',
          lang: 'en-US',
        },
      },
      {
        idioma: 'es',
        carga: {
          titulo: 'Aviso de prueba',
          cuerpo: 'Si ves esto, los avisos llegan a este dispositivo.',
          url: '/ajustes/avisos',
          etiqueta: 'prueba',
        },
      },
    ] as const;

    for (const { idioma, carga } of casos) {
      const enviar = enviadorQueContesta({});
      const base: Base = {
        ...baseFalsa([], [suscripcion('telefono')]),
        usuarioDelToken: () => Promise.resolve({ id: 'u1', idioma }),
      };
      const respuesta = await manejador(
        CON_CLAVES,
        base,
        enviar,
      )(
        new Request('https://f.example/avisos/probar', {
          method: 'POST',
          headers: { Authorization: 'Bearer sesion-valida' },
        }),
      );

      assert.equal(respuesta.status, 200);
      assert.deepEqual(JSON.parse(enviar.cargas[0] ?? '{}') as unknown, carga);
    }
  },
);

Deno.test(
  'el usuario del token trae el idioma de su cuenta, validado contra los tres',
  async () => {
    const leer = (estado: number, cuerpo: unknown) =>
      baseDeSupabase('https://ref.supabase.co', 'sb_publishable_x', () =>
        Promise.resolve(new Response(JSON.stringify(cuerpo), { status: estado })),
      ).usuarioDelToken('token');

    assert.deepEqual(
      await Promise.all([
        leer(200, { id: 'u1', user_metadata: { idioma: 'pt-BR' } }),
        leer(200, { id: 'u1', user_metadata: { idioma: 'en' } }),
        leer(200, { id: 'u1', user_metadata: { idioma: 'fr' } }),
        leer(200, { id: 'u1', user_metadata: null }),
        leer(200, { id: 'u1' }),
        leer(401, { message: 'token vencido' }),
      ]),
      [
        { id: 'u1', idioma: 'pt-BR' },
        { id: 'u1', idioma: 'en' },
        { id: 'u1', idioma: 'es' },
        { id: 'u1', idioma: 'es' },
        { id: 'u1', idioma: 'es' },
        null,
      ],
    );
  },
);

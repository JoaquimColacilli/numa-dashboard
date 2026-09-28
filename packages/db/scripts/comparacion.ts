import {
  aportesDelReparto,
  asientosDelLibro,
  calcularDistribucion,
  calcularLiquidacion,
  calcularPorLaFila,
  calcularSena,
  centavos,
  columnasDeSiempre,
  DIEZMO,
  ESTADOS,
  esEstado,
  estaLiquidado,
  esLinkDeMercadoPago,
  fechaDeApertura,
  esLinkDeLaRed,
  esLinkDeResena,
  esNombreDeNecesidad,
  filaDeSiempre,
  formasDeCobro,
  LARGO_MAXIMO_DEL_NOMBRE,
  leerLaFila,
  pagosPorDelante,
  planDelReparto,
  primerProblemaDeLaFila,
  puedeCambiarEstado,
  puedeLiquidar,
  puedeRevertir,
  puntosBasicos,
  REDES_DEL_TALLER,
  repartir,
  revisarLaRed,
  saldosPorId,
  saldosPorTesoro,
  SEGMENTOS_QUE_NO_SON_UN_PERFIL,
  TESOROS,
  topesDeLaLiquidacion,
  validarRespuesta,
  validarRespuestaDeEntrega,
  type AjustesDeLiquidacion,
  type Asiento,
  type ClaseDePaso,
  type Distribucion,
  type EntradaCascada,
  type EstadoLiquidado,
  type EstadoProyecto,
  type Fila,
  type FormaDeCobro,
  type FormaDeCoordinar,
  type Liquidacion,
  type LiquidacionPorLaFila,
  type LiquidacionRegistrada,
  type PreguntaDeLaEncuesta,
  type Reapertura,
  type RedDelTaller,
  type TesoroDeLaFila,
} from '@maun/domain';
import type pg from 'pg';

import type { TipoMovimiento } from '../src/enums.ts';
import {
  ajustesDe,
  aplicarLote,
  filaPorId,
  leerLote,
  quitarFilaLocal,
  replicaVacia,
  type Replica,
} from '../src/replica.ts';
import { leerProyectoGuardado, type ProyectoGuardado } from '../src/sincronizacion.ts';
import {
  coberturasDeLaReplica,
  datosDelLibro,
  filaDelTaller,
  filaParaLiquidar,
  liquidacionesDelMesDeLaReplica,
  tesorosDeLaReplica,
  totalesDelProyecto,
} from '../src/vistas.ts';

export const HOUSEHOLD_DEL_SEED = '5eed0000-0000-7000-8000-000000000001';

type Tupla = [number, number, number, number, number];
type TuplaTopes = [number, number, boolean, number, number];

function generador(semilla: number): (tope: number) => number {
  let estado = semilla >>> 0;
  return (tope) => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4_294_967_296) * tope);
  };
}

function entrada([cobrado, gastos, diezmoBp, topeSueldo, topeFijos]: Tupla): EntradaCascada {
  return {
    cobrado: centavos(cobrado),
    gastos: centavos(gastos),
    diezmoBp: puntosBasicos(diezmoBp),
    topeSueldo: centavos(topeSueldo),
    topeFijos: centavos(topeFijos),
  };
}

function topesEnTs([
  objetivoSueldo,
  objetivoFijos,
  sueldoMensual,
  previoSueldo,
  previoFijos,
]: TuplaTopes) {
  return topesDeLaLiquidacion(
    { sueldo: centavos(objetivoSueldo), fijos: centavos(objetivoFijos), sueldoMensual },
    { sueldo: centavos(previoSueldo), fijos: centavos(previoFijos) },
  );
}

export function casosDeCascada(): Tupla[] {
  const casos: Tupla[] = [
    [0, 0, 1_000, 0, 0],
    [100_000_000, 100_000_000, 1_000, 180_000_000, 25_000_000],
    [50_000_000, 80_000_000, 1_000, 180_000_000, 25_000_000],
    [0, 12_500_000, 1_000, 180_000_000, 25_000_000],
    [15, 0, 1_000, 0, 0],
    [14, 0, 1_000, 0, 0],
    [5, 0, 1_000, 0, 0],
    [25, 0, 1_000, 0, 0],
    [4, 0, 1_000, 0, 0],
    [1, 0, 1_000, 180_000_000, 0],
    [1_000_005, 0, 1_000, 180_000_000, 25_000_000],
    [1_000_015, 0, 1_000, 180_000_000, 25_000_000],
    [124_000_000, 35_330_000, 1_000, 180_000_000, 25_000_000],
    [215_000_000, 0, 1_000, 180_000_000, 25_000_000],
    [480_000_000, 165_000_000, 1_000, 180_000_000, 25_000_000],
    [10_000_000, 0, 0, 0, 0],
    [10_000_000, 0, 10_000, 0, 0],
    [900_719_925_473, 0, 10_000, 0, 0],
    [900_719_925_473, 1, 9_999, 300_000_000_000, 100_000_000_000],
    [9_007_199_254_735, 0, 1_000, 0, 0],
  ];
  const siguiente = generador(20_260_912);
  for (let i = 0; i < 5_000; i++) {
    casos.push([
      siguiente(i % 7 === 0 ? 900_000_000_000 : 1_000_000_000),
      siguiente(600_000_000),
      i % 5 === 0 ? siguiente(10_001) : DIEZMO,
      siguiente(250_000_000),
      siguiente(50_000_000),
    ]);
  }
  return casos;
}

export function casosDeTopes(): TuplaTopes[] {
  const casos: TuplaTopes[] = [
    [0, 0, false, 0, 0],
    [0, 0, true, 0, 0],
    [180_000_000, 25_000_000, false, 500_000_000, 25_000_000],
    [180_000_000, 25_000_000, true, 180_000_000, 30_000_000],
    [180_000_000, 25_000_000, true, 179_999_999, 24_999_999],
    [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, true, 0, Number.MAX_SAFE_INTEGER],
  ];
  const siguiente = generador(20_260_913);
  for (let i = 0; i < 2_000; i++) {
    casos.push([
      siguiente(250_000_000),
      siguiente(60_000_000),
      i % 2 === 0,
      siguiente(400_000_000),
      siguiente(80_000_000),
    ]);
  }
  return casos;
}

const CASOS_FUERA_DE_RANGO: Tupla[] = [
  [9_007_199_254_736, 0, 1_000, 0, 0],
  [Number.MAX_SAFE_INTEGER, 1, 1, 0, 0],
  [Number.MAX_SAFE_INTEGER, 0, 0, 0, 0],
  [9_007_199_254_735, 0, 1_000, 0, 0],
];

const TOPES_FUERA_DE_RANGO: TuplaTopes[] = [
  [Number.MAX_SAFE_INTEGER + 1, 0, false, 0, 0],
  [0, 0, true, Number.MAX_SAFE_INTEGER + 1, 0],
  [-1, 0, false, 0, 0],
  [0, 0, false, 0, -1],
  [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, true, Number.MAX_SAFE_INTEGER, 0],
];

interface FilaCascada {
  neta_centavos: string;
  diezmo_centavos: string;
  sueldo_centavos: string;
  fijos_centavos: string;
  remanente_centavos: string;
}

function escalones(
  distribucion: Pick<Distribucion, 'neta' | 'diezmo' | 'sueldo' | 'fijos' | 'remanente'>,
): string {
  const { neta, diezmo, sueldo, fijos, remanente } = distribucion;
  return JSON.stringify({ neta, diezmo, sueldo, fijos, remanente });
}

function escalonesDeSql(fila: FilaCascada): string {
  return JSON.stringify({
    neta: Number(fila.neta_centavos),
    diezmo: Number(fila.diezmo_centavos),
    sueldo: Number(fila.sueldo_centavos),
    fijos: Number(fila.fijos_centavos),
    remanente: Number(fila.remanente_centavos),
  });
}

function columnas(casos: readonly (readonly unknown[])[], cantidad: number): unknown[][] {
  return Array.from({ length: cantidad }, (_, columna) => casos.map((caso) => caso[columna]));
}

export async function compararCascada(cliente: pg.Client): Promise<string[]> {
  const casos = casosDeCascada();
  const { rows } = await cliente.query<FilaCascada & { orden: string }>(
    `select c.orden, r.*
     from unnest($1::bigint[], $2::bigint[], $3::int[], $4::bigint[], $5::bigint[])
       with ordinality as c (cobrado, gastos, diezmo_bp, tope_sueldo, tope_fijos, orden)
     cross join lateral private.cascada(c.cobrado, c.gastos, c.diezmo_bp, c.tope_sueldo, c.tope_fijos) as r
     order by c.orden`,
    columnas(casos, 5),
  );
  if (rows.length !== casos.length) {
    return [
      `la cascada de SQL devolvió ${String(rows.length)} filas para ${String(casos.length)} casos`,
    ];
  }
  return rows.flatMap((fila, i) => {
    const caso = casos[i] ?? [0, 0, 0, 0, 0];
    const ts = escalones(calcularDistribucion(entrada(caso)));
    const sql = escalonesDeSql(fila);
    return ts === sql ? [] : [`cascada ${JSON.stringify(caso)}: SQL ${sql}, TS ${ts}`];
  });
}

export async function compararTopes(cliente: pg.Client): Promise<string[]> {
  const casos = casosDeTopes();
  const { rows } = await cliente.query<{
    tope_sueldo_centavos: string;
    tope_fijos_centavos: string;
  }>(
    `select r.*
     from unnest($1::bigint[], $2::bigint[], $3::boolean[], $4::bigint[], $5::bigint[])
       with ordinality as c (objetivo_sueldo, objetivo_fijos, sueldo_mensual, previo_sueldo, previo_fijos, orden)
     cross join lateral private.topes_de_la_liquidacion(
       c.objetivo_sueldo, c.objetivo_fijos, c.sueldo_mensual, c.previo_sueldo, c.previo_fijos
     ) as r
     order by c.orden`,
    columnas(casos, 5),
  );
  if (rows.length !== casos.length) {
    return [
      `los topes de SQL devolvieron ${String(rows.length)} filas para ${String(casos.length)} casos`,
    ];
  }
  return rows.flatMap((fila, i) => {
    const caso = casos[i] ?? [0, 0, false, 0, 0];
    const ts = JSON.stringify(topesEnTs(caso));
    const sql = JSON.stringify({
      topeSueldo: Number(fila.tope_sueldo_centavos),
      topeFijos: Number(fila.tope_fijos_centavos),
    });
    return ts === sql ? [] : [`topes ${JSON.stringify(caso)}: SQL ${sql}, TS ${ts}`];
  });
}

type TuplaDelPago = [number | null, number, number];

const PAGOS_QUE_TOCAN: TuplaDelPago[] = [
  [null, 0, 5000],
  [null, 12345, 5000],
  [100_000_000, 0, 5000],
  [100_000_000, 1, 5000],
  [100_000_000, 49_999_999, 5000],
  [100_000_000, 50_000_000, 5000],
  [100_000_000, 50_000_001, 5000],
  [100_000_000, 99_999_999, 5000],
  [100_000_000, 100_000_000, 5000],
  [100_000_000, 100_000_001, 5000],
  [100_000_000, 0, 0],
  [100_000_000, 0, 10000],
  [100_000_000, 100_000_000, 10000],
  [0, 0, 5000],
  [1, 0, 5000],
  [1, 1, 5000],
  [3, 0, 3333],
  [7, 0, 1],
  [999, 0, 9999],
  [123_456_789, 7_654_321, 4321],
  [123_456_789, 61_728_395, 4321],
];

function pagosEnTs([precio, cobrado, bp]: TuplaDelPago): string {
  return JSON.stringify(
    pagosPorDelante({
      presupuesto: precio === null ? null : centavos(precio),
      cobrado: centavos(cobrado),
      porcentajeDelTaller: puntosBasicos(bp),
      porcentajeDelTrabajo: null,
    }),
  );
}

export async function compararPagosPorDelante(cliente: pg.Client): Promise<string[]> {
  const casos = PAGOS_QUE_TOCAN;
  const { rows } = await cliente.query<{ pagos: string | null }>(
    `select (
       select jsonb_agg(
         jsonb_build_object('instancia', r.instancia, 'monto', r.monto_centavos)
         order by r.orden
       )
       from private.pagos_por_delante(c.precio, c.cobrado, c.bp) as r
     )::text as pagos
     from unnest($1::bigint[], $2::bigint[], $3::int[])
       with ordinality as c (precio, cobrado, bp, orden)
     order by c.orden`,
    columnas(casos, 3),
  );
  if (rows.length !== casos.length) {
    return [
      `los pagos por delante de SQL devolvieron ${String(rows.length)} filas para ${String(casos.length)} casos`,
    ];
  }
  return rows.flatMap((fila, i) => {
    const caso = casos[i] ?? [null, 0, 0];
    const ts = pagosEnTs(caso);
    // jsonb ordena las claves por largo y después alfabéticamente, así que la comparación se hace
    // sobre objetos armados acá, no sobre el texto que devuelve Postgres.
    const crudos =
      fila.pagos === null ? [] : (JSON.parse(fila.pagos) as { instancia: string; monto: number }[]);
    const sql = JSON.stringify(
      crudos.map((pago) => ({ instancia: pago.instancia, monto: pago.monto })),
    );
    return ts === sql ? [] : [`pagos por delante ${JSON.stringify(caso)}: SQL ${sql}, TS ${ts}`];
  });
}

type TuplaDeLaSena = [number | null, number];

const SENAS: TuplaDeLaSena[] = [
  [null, 5000],
  [0, 5000],
  [1, 5000],
  [1, 4999],
  [3, 3333],
  [7, 1],
  [999, 9999],
  [124_800_000, 5000],
  [100_000_000, 0],
  [100_000_000, 10000],
  [123_456_789, 4321],
  [900_719_925_473, 10000],
];

function senaEnTs([precio, bp]: TuplaDeLaSena): number | null {
  const sena = calcularSena({
    presupuesto: precio === null ? null : centavos(precio),
    cobrado: centavos(0),
    porcentajeDelTaller: puntosBasicos(bp),
    porcentajeDelTrabajo: null,
  });
  return sena.situacion === 'sin-presupuesto' ? null : sena.esperada;
}

export async function compararSenaEsperada(cliente: pg.Client): Promise<string[]> {
  const casos = [...SENAS];
  const aleatorio = generador(67);
  for (let i = 0; i < 500; i += 1) {
    casos.push([aleatorio(2_000_000_000), aleatorio(10_001)]);
  }
  const { rows } = await cliente.query<{ sena: string | null }>(
    `select private.sena_esperada(c.precio, c.bp)::text as sena
     from unnest($1::bigint[], $2::int[]) with ordinality as c (precio, bp, orden)
     order by c.orden`,
    columnas(casos, 2),
  );
  if (rows.length !== casos.length) {
    return [
      `la seña de SQL devolvió ${String(rows.length)} filas para ${String(casos.length)} casos`,
    ];
  }
  return rows.flatMap((fila, i) => {
    const caso = casos[i] ?? [null, 0];
    const ts = senaEnTs(caso);
    const sql = fila.sena === null ? null : Number(fila.sena);
    return ts === sql ? [] : [`seña ${JSON.stringify(caso)}: SQL ${String(sql)}, TS ${String(ts)}`];
  });
}

const FORMAS_GUARDADAS: (readonly FormaDeCobro[] | null)[] = [
  null,
  ['transferencia'],
  ['efectivo'],
  ['transferencia', 'efectivo'],
];

export async function compararFormasDeCobro(cliente: pg.Client): Promise<string[]> {
  const casos = FORMAS_GUARDADAS.flatMap((guardado) =>
    [true, false].map((hay) => [guardado, hay] as const),
  );
  const { rows } = await cliente.query<{ formas: string[] }>(
    `select private.formas_de_cobro(c.guardado::public.forma_de_cobro[], c.hay)::text[] as formas
     from unnest($1::text[], $2::boolean[]) with ordinality as c (guardado, hay, orden)
     order by c.orden`,
    [
      casos.map(([guardado]) => (guardado === null ? null : `{${guardado.join(',')}}`)),
      casos.map(([, hay]) => hay),
    ],
  );
  if (rows.length !== casos.length) {
    return [
      `las formas de cobro de SQL devolvieron ${String(rows.length)} filas para ${String(casos.length)} casos`,
    ];
  }
  return rows.flatMap((fila, i) => {
    const caso = casos[i] ?? [null, true];
    const ts = JSON.stringify(formasDeCobro(caso[0], caso[1]));
    const sql = JSON.stringify(fila.formas);
    return ts === sql ? [] : [`formas de cobro ${JSON.stringify(caso)}: SQL ${sql}, TS ${ts}`];
  });
}

const LINKS_A_PROBAR: readonly string[] = [
  '',
  'https://mpago.la/2vXyZ1',
  'https://mpago.li/2vXyZ1',
  'https://link.mercadopago.com.ar/tallermaun',
  'https://www.mercadopago.com.ar/cobrar/qr/1234',
  'https://mercadopago.com.ar/cobrar',
  'https://mpago.la/',
  'https://mpago.la',
  'http://mpago.la/2vXyZ1',
  'mpago.la/2vXyZ1',
  'https://MPAGO.LA/2vXyZ1',
  'https://pagame-aca.com/taller',
  'https://mercadopago.com.ar.pagame.net/x',
  'https://mpago.la.otro.com/x',
  'https://mpago.la/con espacio',
  'https://mpago.la/con\ttab',
  `https://mpago.la/${'x'.repeat(280)}`,
  `https://mpago.la/${'x'.repeat(300)}`,
];

export async function compararLinkDeCobro(cliente: pg.Client): Promise<string[]> {
  const { rows: definicion } = await cliente.query<{ def: string }>(
    `select pg_get_constraintdef(c.oid) as def
     from pg_constraint c
     where c.conrelid = 'public.ajustes'::regclass and c.conname = 'ajustes_cobro_link_formato'`,
  );
  const cruda = definicion[0]?.def;
  if (cruda === undefined) return ['no existe el check ajustes_cobro_link_formato en la base'];

  const expresion = cruda
    .replace(/^CHECK\s*\(/, '')
    .replace(/\)$/, '')
    .replaceAll('cobro_link', 'c.valor');

  const { rows } = await cliente.query<{ pasa: boolean }>(
    `select (${expresion}) as pasa
     from unnest($1::text[]) with ordinality as c (valor, orden)
     order by c.orden`,
    [LINKS_A_PROBAR],
  );
  if (rows.length !== LINKS_A_PROBAR.length) {
    return [
      `el check del link devolvió ${String(rows.length)} filas para ${String(LINKS_A_PROBAR.length)} casos`,
    ];
  }

  return rows.flatMap((fila, i) => {
    const valor = LINKS_A_PROBAR[i] ?? '';
    const ts = valor === '' || esLinkDeMercadoPago(valor);
    return ts === fila.pasa
      ? []
      : [`link de cobro ${JSON.stringify(valor)}: SQL ${String(fila.pasa)}, TS ${String(ts)}`];
  });
}

const RESENAS_A_PROBAR: readonly string[] = [
  '',
  'https://g.page/r/CaMaunTaller/review',
  'https://g.page/',
  'https://g.page',
  'https://search.google.com/local/writereview?placeid=ChIJ123',
  'https://maps.google.com/?cid=123',
  'https://www.google.com/maps/place/Taller',
  'https://google.com/maps',
  'https://maps.app.goo.gl/abc123',
  'https://g.co/kgs/abc',
  'http://g.page/r/x',
  'g.page/r/x',
  'https://G.PAGE/r/x',
  'https://resenas-truchas.com/maun',
  'https://g.page.otro.com/x',
  'https://g.co.ar/x',
  'https://g.page/con espacio',
  'https://g.page/con\ttab',
  `https://g.page/${'x'.repeat(285)}`,
  `https://g.page/${'x'.repeat(286)}`,
];

export async function compararLinkDeResena(cliente: pg.Client): Promise<string[]> {
  const { rows: definicion } = await cliente.query<{ def: string }>(
    `select pg_get_constraintdef(c.oid) as def
     from pg_constraint c
     where c.conrelid = 'public.ajustes'::regclass and c.conname = 'ajustes_resena_link_formato'`,
  );
  const cruda = definicion[0]?.def;
  if (cruda === undefined) return ['no existe el check ajustes_resena_link_formato en la base'];

  const expresion = cruda
    .replace(/^CHECK\s*\(/, '')
    .replace(/\)$/, '')
    .replaceAll('resena_link', 'c.valor');

  const { rows } = await cliente.query<{ pasa: boolean }>(
    `select (${expresion}) as pasa
     from unnest($1::text[]) with ordinality as c (valor, orden)
     order by c.orden`,
    [RESENAS_A_PROBAR],
  );
  if (rows.length !== RESENAS_A_PROBAR.length) {
    return [
      `el check del link de reseña devolvió ${String(rows.length)} filas para ${String(RESENAS_A_PROBAR.length)} casos`,
    ];
  }

  return rows.flatMap((fila, i) => {
    const valor = RESENAS_A_PROBAR[i] ?? '';
    const ts = valor === '' || esLinkDeResena(valor);
    return ts === fila.pasa
      ? []
      : [`link de reseña ${JSON.stringify(valor)}: SQL ${String(fila.pasa)}, TS ${String(ts)}`];
  });
}

const REDES_A_PROBAR: Readonly<
  Record<RedDelTaller, { links: readonly string[]; escritos: readonly string[] }>
> = {
  instagram: {
    links: [
      '',
      'https://www.instagram.com/taller.maun/',
      'https://www.instagram.com/taller_maun/',
      'https://www.instagram.com/a/',
      `https://www.instagram.com/${'a'.repeat(30)}/`,
      `https://www.instagram.com/${'a'.repeat(31)}/`,
      'https://www.instagram.com/tv.maun/',
      'https://www.instagram.com/taller.maun',
      'https://instagram.com/taller.maun/',
      'http://www.instagram.com/taller.maun/',
      'https://www.instagram.com/Taller.Maun/',
      'https://www.instagram.com/taller-maun/',
      'https://www.instagram.com/taller maun/',
      'https://www.instagram.com/ñandú/',
      'https://www.instagram.com//',
      'https://www.instagram.com/taller.maun/?igsh=abc',
      'https://www.instagram.com/taller.maun/\n',
      'https://www.instagram.com.otro.com/taller/',
      'https://www.instagram.com/p/abc/',
      ...SEGMENTOS_QUE_NO_SON_UN_PERFIL.instagram.map(
        (segmento) => `https://www.instagram.com/${segmento}/`,
      ),
    ],
    escritos: [
      '@taller.maun',
      'Taller.Maun',
      'https://www.instagram.com/Taller.Maun/?igsh=abc',
      'instagram.com/taller.maun',
      '  http://instagram.com/taller.maun/reels/  ',
    ],
  },
  facebook: {
    links: [
      '',
      'https://www.facebook.com/tallermaun',
      'https://www.facebook.com/taller.maun',
      'https://www.facebook.com/mauns',
      'https://www.facebook.com/maun',
      'https://www.facebook.com/12345',
      `https://www.facebook.com/${'a'.repeat(50)}`,
      `https://www.facebook.com/${'a'.repeat(51)}`,
      'https://www.facebook.com/profile.php?id=12345',
      'https://www.facebook.com/profile.php?id=1234',
      'https://www.facebook.com/profile.php?id=100012345678',
      `https://www.facebook.com/profile.php?id=${'1'.repeat(20)}`,
      `https://www.facebook.com/profile.php?id=${'1'.repeat(21)}`,
      'https://www.facebook.com/profile.php?id=',
      'https://www.facebook.com/profile.php?id=12345&sk=about',
      'https://www.facebook.com/tallermaun/',
      'https://facebook.com/tallermaun',
      'https://m.facebook.com/tallermaun',
      'https://www.facebook.com/TallerMaun',
      'https://www.facebook.com/taller_maun',
      'https://www.facebook.com/tallermaun/posts/123',
      'https://www.facebook.com/tallermaun\n',
      ...SEGMENTOS_QUE_NO_SON_UN_PERFIL.facebook.map(
        (segmento) => `https://www.facebook.com/${segmento}`,
      ),
    ],
    escritos: [
      'TallerMaun',
      'https://m.facebook.com/TallerMaun/?mibextid=abc',
      'web.facebook.com/taller.maun',
      'https://www.facebook.com/profile.php?id=100012345678&sk=about',
      '100012345678',
    ],
  },
  tiktok: {
    links: [
      '',
      'https://www.tiktok.com/@taller.maun',
      'https://www.tiktok.com/@taller_maun',
      'https://www.tiktok.com/@ab',
      'https://www.tiktok.com/@a',
      `https://www.tiktok.com/@${'a'.repeat(24)}`,
      `https://www.tiktok.com/@${'a'.repeat(25)}`,
      'https://www.tiktok.com/taller.maun',
      'https://www.tiktok.com/@taller.maun/',
      'https://tiktok.com/@taller.maun',
      'https://www.tiktok.com/@Taller.Maun',
      'https://www.tiktok.com/@taller-maun',
      'https://www.tiktok.com/@taller.maun/video/7212345678901234567',
      'https://www.tiktok.com/@taller.maun\n',
      'https://vm.tiktok.com/ZMabc123/',
    ],
    escritos: [
      '@Taller.Maun',
      'taller.maun',
      'https://www.tiktok.com/@Taller.Maun?lang=es',
      'tiktok.com/@taller_maun',
    ],
  },
};

export async function compararLinksDeLasRedes(cliente: pg.Client): Promise<string[]> {
  const diferencias: string[] = [];
  for (const red of REDES_DEL_TALLER) {
    const columna = `${red}_link`;
    const restriccion = `ajustes_${columna}_formato`;
    const { rows: definicion } = await cliente.query<{ def: string }>(
      `select pg_get_constraintdef(c.oid) as def
       from pg_constraint c
       where c.conrelid = 'public.ajustes'::regclass and c.conname = $1`,
      [restriccion],
    );
    const cruda = definicion[0]?.def;
    if (cruda === undefined) {
      diferencias.push(`no existe el check ${restriccion} en la base`);
      continue;
    }

    const expresion = cruda
      .replace(/^CHECK\s*\(/, '')
      .replace(/\)$/, '')
      .replaceAll(columna, 'c.valor');

    const { links, escritos } = REDES_A_PROBAR[red];
    const guardados = escritos.map((escrito) => {
      const revision = revisarLaRed(red, escrito);
      return revision.estado === 'valido' ? revision.link : '';
    });
    const casos = [...links, ...guardados];

    const { rows } = await cliente.query<{ pasa: boolean }>(
      `select (${expresion}) as pasa
       from unnest($1::text[]) with ordinality as c (valor, orden)
       order by c.orden`,
      [casos],
    );
    if (rows.length !== casos.length) {
      diferencias.push(
        `el check de ${red} devolvió ${String(rows.length)} filas para ${String(casos.length)} casos`,
      );
      continue;
    }

    rows.forEach((fila, i) => {
      const valor = casos[i] ?? '';
      const ts = valor === '' || esLinkDeLaRed(red, valor);
      if (ts !== fila.pasa) {
        diferencias.push(
          `link de ${red} ${JSON.stringify(valor)}: SQL ${String(fila.pasa)}, TS ${String(ts)}`,
        );
      }
      const escrito = escritos[i - links.length];
      if (escrito !== undefined && (valor === '' || !fila.pasa)) {
        diferencias.push(
          `${red}: lo que la app guardaría de ${JSON.stringify(escrito)} (${JSON.stringify(valor)}) no lo acepta la base`,
        );
      }
    });
  }
  return diferencias;
}

const NOMBRES_DE_NECESIDAD_A_PROBAR: readonly string[] = [
  '',
  '   ',
  'Bisagras',
  ' Tarugos ',
  'a'.repeat(LARGO_MAXIMO_DEL_NOMBRE - 1),
  'a'.repeat(LARGO_MAXIMO_DEL_NOMBRE),
  'a'.repeat(LARGO_MAXIMO_DEL_NOMBRE + 1),
  'ñ'.repeat(LARGO_MAXIMO_DEL_NOMBRE),
  'ñ'.repeat(LARGO_MAXIMO_DEL_NOMBRE + 1),
  '🔩'.repeat(LARGO_MAXIMO_DEL_NOMBRE),
  '🔩'.repeat(LARGO_MAXIMO_DEL_NOMBRE + 1),
];

export async function compararNombreDeNecesidad(cliente: pg.Client): Promise<string[]> {
  const { rows: definicion } = await cliente.query<{ def: string }>(
    `select pg_get_constraintdef(c.oid) as def
     from pg_constraint c
     where c.conrelid = 'public.necesidades'::regclass and c.conname = 'necesidades_nombre_valido'`,
  );
  const cruda = definicion[0]?.def;
  if (cruda === undefined) return ['no existe el check necesidades_nombre_valido en la base'];

  const expresion = cruda
    .replace(/^CHECK\s*\(/, '')
    .replace(/\)$/, '')
    .replaceAll('nombre', 'c.valor');

  const { rows } = await cliente.query<{ pasa: boolean }>(
    `select coalesce((${expresion}), false) as pasa
     from unnest($1::text[]) with ordinality as c (valor, orden)
     order by c.orden`,
    [NOMBRES_DE_NECESIDAD_A_PROBAR],
  );
  if (rows.length !== NOMBRES_DE_NECESIDAD_A_PROBAR.length) {
    return [
      `el check del nombre de lo que hace falta devolvió ${String(rows.length)} filas para ${String(NOMBRES_DE_NECESIDAD_A_PROBAR.length)} casos`,
    ];
  }

  return rows.flatMap((fila, i) => {
    const valor = NOMBRES_DE_NECESIDAD_A_PROBAR[i] ?? '';
    const ts = esNombreDeNecesidad(valor);
    return ts === fila.pasa
      ? []
      : [
          `nombre de lo que hace falta de ${String(Array.from(valor).length)} caracteres ${JSON.stringify(valor.slice(0, 12))}: SQL ${String(fila.pasa)}, TS ${String(ts)}`,
        ];
  });
}

const PREGUNTAS_A_VALIDAR: readonly PreguntaDeLaEncuesta[] = [
  {
    id: 'aaaaaaaa-0000-7000-8000-000000000001',
    texto: '¿Qué tan conforme quedaste con el mueble?',
    tipo: 'escala5',
    escala: 'conformidad',
    obligatoria: true,
    opciones: null,
    propia: false,
  },
  {
    id: 'aaaaaaaa-0000-7000-8000-000000000002',
    texto: '¿Se lo recomendarías a alguien?',
    tipo: 'sitalvezno',
    escala: null,
    obligatoria: true,
    opciones: null,
    propia: false,
  },
  {
    id: 'aaaaaaaa-0000-7000-8000-000000000003',
    texto: '¿Cómo nos conociste?',
    tipo: 'una',
    escala: null,
    obligatoria: false,
    opciones: ['Me lo recomendaron', 'Por Instagram', 'Vi el cartel'],
    propia: false,
  },
  {
    id: 'aaaaaaaa-0000-7000-8000-000000000004',
    texto: '¿Qué usás más?',
    tipo: 'varias',
    escala: null,
    obligatoria: false,
    opciones: ['El placard', 'La cómoda', 'El escritorio', 'La biblioteca'],
    propia: false,
  },
  {
    id: 'aaaaaaaa-0000-7000-8000-000000000005',
    texto: '¿Qué podríamos hacer mejor?',
    tipo: 'texto',
    escala: null,
    obligatoria: false,
    opciones: null,
    propia: false,
  },
  {
    id: 'aaaaaaaa-0000-7000-8000-000000000006',
    texto: '¿La altura te quedó cómoda?',
    tipo: 'escala5',
    escala: 'conformidad',
    obligatoria: false,
    opciones: null,
    propia: true,
  },
];

const ID_DE_RESPUESTA = '0192a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b';

function idDeLaPregunta(indice: number): string {
  return PREGUNTAS_A_VALIDAR[indice]?.id ?? '';
}

const VALORES_A_PROBAR: readonly unknown[] = [
  1,
  2,
  3,
  4,
  5,
  0,
  -1,
  6,
  2.5,
  5.0,
  1e2,
  '3',
  true,
  null,
  {},
  [],
  [0],
  [3],
  [4],
  [0, 0],
  [0, 2, 3],
  [1.5],
  ['1'],
  '',
  ' \t\n\r\f\v',
  String.fromCharCode(0xa0),
  'Quedó impecable.',
  '  Con blancos en las puntas.  \n',
  'a'.repeat(2000),
  `  ${'a'.repeat(2000)}\n`,
  'a'.repeat(2001),
  '👍'.repeat(2000),
  '👍'.repeat(2001),
];

function renglonDePrueba(indice: number, valor: unknown): unknown {
  return { pregunta: idDeLaPregunta(indice), valor };
}

function respuestasAValidar(): unknown[] {
  const fijas: unknown[] = [
    null,
    [],
    'respuesta',
    7,
    {},
    { id: ID_DE_RESPUESTA },
    { renglones: [] },
    { id: ID_DE_RESPUESTA, renglones: [], extra: true },
    { id: 7, renglones: [] },
    { id: 'no-es-un-id', renglones: [] },
    {
      id: ID_DE_RESPUESTA.toUpperCase(),
      renglones: [renglonDePrueba(0, 5), renglonDePrueba(1, 3)],
    },
    { id: ` ${ID_DE_RESPUESTA}`, renglones: [] },
    { id: ID_DE_RESPUESTA, renglones: {} },
    { id: ID_DE_RESPUESTA, renglones: 'renglones' },
    { id: ID_DE_RESPUESTA, renglones: [null] },
    { id: ID_DE_RESPUESTA, renglones: [[]] },
    { id: ID_DE_RESPUESTA, renglones: [{ pregunta: idDeLaPregunta(0) }] },
    { id: ID_DE_RESPUESTA, renglones: [{ valor: 5 }] },
    { id: ID_DE_RESPUESTA, renglones: [{ pregunta: idDeLaPregunta(0), valor: 5, extra: 1 }] },
    { id: ID_DE_RESPUESTA, renglones: [{ pregunta: 3, valor: 5 }] },
    { id: ID_DE_RESPUESTA, renglones: [{ pregunta: 'otra', valor: 5 }] },
    { id: ID_DE_RESPUESTA, renglones: [renglonDePrueba(0, 5), renglonDePrueba(0, 4)] },
    { id: ID_DE_RESPUESTA, renglones: [renglonDePrueba(0, 5)] },
    { id: ID_DE_RESPUESTA, renglones: [renglonDePrueba(1, 3), renglonDePrueba(0, 5)] },
    { id: ID_DE_RESPUESTA, renglones: [] },
  ];
  const conObligatorias = VALORES_A_PROBAR.flatMap((valor) =>
    [0, 1, 2, 3, 4, 5].map((indice) => ({
      id: ID_DE_RESPUESTA,
      renglones: [
        ...(indice === 0 ? [] : [renglonDePrueba(0, 5)]),
        ...(indice === 1 ? [] : [renglonDePrueba(1, 3)]),
        renglonDePrueba(indice, valor),
      ],
    })),
  );
  const siguiente = generador(20_260_921);
  const azar: unknown[] = [];
  for (let i = 0; i < 1_500; i++) {
    const renglones: unknown[] = [];
    const cuantos = siguiente(8);
    for (let j = 0; j < cuantos; j++) {
      const indice = siguiente(PREGUNTAS_A_VALIDAR.length + 1);
      const valor = VALORES_A_PROBAR[siguiente(VALORES_A_PROBAR.length)];
      renglones.push(
        indice === PREGUNTAS_A_VALIDAR.length
          ? { pregunta: 'aaaaaaaa-0000-7000-8000-00000000ffff', valor }
          : renglonDePrueba(indice, valor),
      );
    }
    azar.push({ id: ID_DE_RESPUESTA, renglones });
  }
  return [...fijas, ...conObligatorias, ...azar];
}

export async function compararValidacionDeRespuestas(cliente: pg.Client): Promise<string[]> {
  const respuestas = respuestasAValidar();
  const { rows } = await cliente.query<{ motivo: string | null }>(
    `select private.validar_respuesta($1::jsonb, c.respuesta) as motivo
     from unnest($2::jsonb[]) with ordinality as c (respuesta, orden)
     order by c.orden`,
    [JSON.stringify(PREGUNTAS_A_VALIDAR), respuestas.map((respuesta) => JSON.stringify(respuesta))],
  );
  if (rows.length !== respuestas.length) {
    return [
      `la validación de SQL devolvió ${String(rows.length)} filas para ${String(respuestas.length)} respuestas`,
    ];
  }
  return rows.flatMap((fila, i) => {
    const respuesta = respuestas[i];
    const ts = validarRespuesta(PREGUNTAS_A_VALIDAR, respuesta);
    return ts === fila.motivo
      ? []
      : [
          `respuesta ${JSON.stringify(respuesta).slice(0, 160)}: SQL ${String(fila.motivo)}, TS ${String(ts)}`,
        ];
  });
}

// La respuesta a una propuesta de entrega (ADR 0071). El viernes 25 de septiembre de 2026 pasado
// mañana es domingo, así que el borde de abajo cae justo en un día que no se puede.
const HOY_DE_LA_ENTREGA = '2026-09-25';

const ID_DE_LA_ENTREGA = '0192a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b';

const PROPUESTA_DE_LA_ENTREGA = '0192a3b4-c5d6-7e8f-9a0b-000000000071';

const FECHAS_A_PROBAR: readonly unknown[] = [
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
  '2026-09-27',
  '2026-09-28',
  '2026-09-30',
  '2026-10-03',
  '2026-10-04',
  '2026-10-08',
  '2026-10-24',
  '2026-10-25',
  '2026-10-26',
  '2026-02-30',
  '2026-9-30',
  '1999-10-01',
  '2126-10-01',
  ' 2026-10-01',
  20261001,
  null,
];

const FRANJAS_A_PROBAR: readonly unknown[] = [
  [],
  ['manana'],
  ['tarde'],
  ['manana', 'tarde'],
  ['tarde', 'manana'],
  ['manana', 'manana'],
  ['noche'],
  ['Manana'],
  [1],
  'manana',
  null,
  ['manana', 'tarde', 'manana'],
];

const NOTAS_A_PROBAR: readonly unknown[] = [
  '',
  '   ',
  ' \t\n\r\f\v',
  String.fromCharCode(0xa0),
  'Tercer piso, sin ascensor',
  'a'.repeat(500),
  `  ${'a'.repeat(500)}\n`,
  'a'.repeat(501),
  '👍'.repeat(500),
  '👍'.repeat(501),
  5,
  null,
];

function respuestaDeEntrega(cambios: Record<string, unknown>): Record<string, unknown> {
  return {
    id: ID_DE_LA_ENTREGA,
    propuesta_id: PROPUESTA_DE_LA_ENTREGA,
    respuesta: 'mis_dias',
    dias: [],
    nota: '',
    ...cambios,
  };
}

function respuestasDeEntregaAValidar(): unknown[] {
  const dia = (fecha: unknown, franjas: unknown = ['manana']): unknown => ({ fecha, franjas });
  const fijas: unknown[] = [
    null,
    [],
    'mis_dias',
    7,
    {},
    respuestaDeEntrega({ respuesta: 'me_queda_bien' }),
    respuestaDeEntrega({ respuesta: 'me_queda_bien', nota: '  ' }),
    respuestaDeEntrega({ respuesta: 'me_queda_bien', nota: 'A la tarde' }),
    respuestaDeEntrega({ respuesta: 'me_queda_bien', dias: [dia('2026-09-28')] }),
    respuestaDeEntrega({ respuesta: 'otra' }),
    respuestaDeEntrega({ respuesta: null }),
    respuestaDeEntrega({ id: 7 }),
    respuestaDeEntrega({ id: 'no-es-un-id' }),
    respuestaDeEntrega({ id: ID_DE_LA_ENTREGA.toUpperCase(), dias: [dia('2026-09-28')] }),
    respuestaDeEntrega({ propuesta_id: ` ${PROPUESTA_DE_LA_ENTREGA}` }),
    respuestaDeEntrega({ extra: true }),
    {
      id: ID_DE_LA_ENTREGA,
      propuesta_id: PROPUESTA_DE_LA_ENTREGA,
      respuesta: 'mis_dias',
      dias: [],
    },
    respuestaDeEntrega({ dias: {} }),
    respuestaDeEntrega({ dias: 'lunes' }),
    respuestaDeEntrega({ dias: [null] }),
    respuestaDeEntrega({ dias: [[]] }),
    respuestaDeEntrega({ dias: [{ fecha: '2026-09-28' }] }),
    respuestaDeEntrega({ dias: [{ franjas: ['manana'] }] }),
    respuestaDeEntrega({ dias: [{ fecha: '2026-09-28', franjas: ['manana'], hora: '10' }] }),
    respuestaDeEntrega({ dias: [dia('2026-09-28'), dia('2026-09-28', ['tarde'])] }),
    respuestaDeEntrega({ dias: [dia('2026-09-28'), dia('2026-09-27')] }),
    respuestaDeEntrega({ dias: [dia('2026-09-27'), dia('2026-02-30')] }),
    respuestaDeEntrega({
      dias: Array.from({ length: 10 }, (_, i) => dia(`2026-10-${String(i + 1).padStart(2, '0')}`)),
    }),
    respuestaDeEntrega({
      dias: Array.from({ length: 11 }, (_, i) => dia(`2026-10-${String(i + 1).padStart(2, '0')}`)),
    }),
  ];

  const unDiaCadaUno = FECHAS_A_PROBAR.flatMap((fecha) =>
    FRANJAS_A_PROBAR.map((franjas) => respuestaDeEntrega({ dias: [dia(fecha, franjas)] })),
  );
  const conNota = NOTAS_A_PROBAR.flatMap((nota) => [
    respuestaDeEntrega({ nota }),
    respuestaDeEntrega({ nota, dias: [dia('2026-09-29')] }),
    respuestaDeEntrega({ nota, respuesta: 'me_queda_bien' }),
  ]);

  const siguiente = generador(20_260_925);
  const azar: unknown[] = [];
  for (let i = 0; i < 2_000; i++) {
    const cuantos = siguiente(13);
    const dias: unknown[] = [];
    for (let j = 0; j < cuantos; j++) {
      dias.push(
        dia(
          FECHAS_A_PROBAR[siguiente(FECHAS_A_PROBAR.length)],
          FRANJAS_A_PROBAR[siguiente(FRANJAS_A_PROBAR.length)],
        ),
      );
    }
    azar.push(
      respuestaDeEntrega({
        respuesta: siguiente(5) === 0 ? 'me_queda_bien' : 'mis_dias',
        dias,
        nota: NOTAS_A_PROBAR[siguiente(NOTAS_A_PROBAR.length)],
      }),
    );
  }
  return [...fijas, ...unDiaCadaUno, ...conNota, ...azar];
}

export async function compararValidacionDeRespuestasDeEntrega(
  cliente: pg.Client,
): Promise<string[]> {
  const respuestas = respuestasDeEntregaAValidar();
  const formas: readonly FormaDeCoordinar[] = ['un_dia', 'sus_dias'];
  const casos = formas.flatMap((forma) => respuestas.map((respuesta) => ({ forma, respuesta })));
  const { rows } = await cliente.query<{ motivo: string | null }>(
    `select private.validar_respuesta_de_entrega(c.respuesta, c.forma::public.forma_de_coordinar, $3::date) as motivo
     from unnest($1::jsonb[], $2::text[]) with ordinality as c (respuesta, forma, orden)
     order by c.orden`,
    [
      casos.map((caso) => JSON.stringify(caso.respuesta)),
      casos.map((caso) => caso.forma),
      HOY_DE_LA_ENTREGA,
    ],
  );
  if (rows.length !== casos.length) {
    return [
      `la validación de SQL devolvió ${String(rows.length)} filas para ${String(casos.length)} respuestas a la entrega`,
    ];
  }
  return rows.flatMap((fila, i) => {
    const caso = casos[i];
    if (caso === undefined) return [`falta el caso ${String(i)}`];
    const ts = validarRespuestaDeEntrega(caso.respuesta, caso.forma, HOY_DE_LA_ENTREGA);
    return ts === fila.motivo
      ? []
      : [
          `respuesta a ${caso.forma} ${JSON.stringify(caso.respuesta).slice(0, 160)}: SQL ${String(fila.motivo)}, TS ${String(ts)}`,
        ];
  });
}

function rechazaEnTs(calculo: () => unknown): boolean {
  try {
    calculo();
    return false;
  } catch {
    return true;
  }
}

async function rechazaEnSql(
  cliente: pg.Client,
  sql: string,
  parametros: unknown[],
): Promise<boolean> {
  await cliente.query('savepoint rango');
  let rechaza = false;
  try {
    await cliente.query(sql, parametros);
  } catch {
    rechaza = true;
  }
  await cliente.query('rollback to savepoint rango');
  return rechaza;
}

function diferenciaDeRango(que: string, caso: unknown, ts: boolean, sql: boolean): string[] {
  return ts === sql
    ? []
    : [
        `${que} ${JSON.stringify(caso)}: TS ${ts ? 'rechaza' : 'acepta'}, SQL ${sql ? 'rechaza' : 'acepta'}`,
      ];
}

export async function compararRangos(cliente: pg.Client): Promise<string[]> {
  const diferencias: string[] = [];
  for (const caso of CASOS_FUERA_DE_RANGO) {
    const ts = rechazaEnTs(() => calcularDistribucion(entrada(caso)));
    const sql = await rechazaEnSql(
      cliente,
      'select * from private.cascada($1, $2, $3, $4, $5)',
      caso,
    );
    diferencias.push(...diferenciaDeRango('rango de la cascada', caso, ts, sql));
  }
  for (const caso of TOPES_FUERA_DE_RANGO) {
    const ts = rechazaEnTs(() => topesEnTs(caso));
    const sql = await rechazaEnSql(
      cliente,
      'select * from private.topes_de_la_liquidacion($1, $2, $3, $4, $5)',
      caso.map(String),
    );
    diferencias.push(...diferenciaDeRango('rango de los topes', caso, ts, sql));
  }
  return diferencias;
}

const RECHAZOS_DE_RANGO: ReadonlySet<string> = new Set(['22004', '22023', '22003']);

const IDS_DE_LA_FILA: readonly string[] = Array.from(
  { length: 12 },
  (_, i) => `00000000-0000-7000-8000-${String(i + 1).padStart(12, '0')}`,
);

function idDeLaFila(indice: number): string {
  return IDS_DE_LA_FILA[indice] ?? '';
}

const TESOROS_DE_LA_FILA: readonly TesoroDeLaFila[] = [
  { id: idDeLaFila(0), clave: 'hogar', archivado: false },
  { id: idDeLaFila(1), clave: 'maun', archivado: false },
  { id: idDeLaFila(2), clave: 'diezmo', archivado: false },
  { id: idDeLaFila(3), clave: 'cocos', archivado: false },
  ...IDS_DE_LA_FILA.slice(4, 10).map((id) => ({ id, clave: null, archivado: false })),
  { id: idDeLaFila(10), clave: null, archivado: true },
];

function codigoDelError(error: unknown): string {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
    ? error.code
    : 'sin código';
}

const RECHAZO_DE_LA_GEMELA = `create or replace function pg_temp.rechazo_de_la_gemela(
    p_sql text, p_caso jsonb, p_extra jsonb
  )
  returns text
  language plpgsql
  as $cuerpo$
  begin
    if p_extra is null then
      execute p_sql using array[p_caso];
    else
      execute p_sql using array[p_caso], p_extra;
    end if;
    return null;
  exception
    when others then
      return sqlstate;
  end;
  $cuerpo$`;

async function filasEnLote(
  cliente: pg.Client,
  sql: string,
  parametros: unknown[],
): Promise<Record<string, unknown>[] | string> {
  await cliente.query('savepoint lote');
  try {
    const { rows } = await cliente.query<Record<string, unknown>>(sql, parametros);
    await cliente.query('release savepoint lote');
    return rows;
  } catch (error) {
    await cliente.query('rollback to savepoint lote');
    await cliente.query('release savepoint lote');
    return codigoDelError(error);
  }
}

type EnTs<T> = { valor: T } | { rechazo: string };

function enTs<T>(calculo: () => T): EnTs<T> {
  try {
    return { valor: calculo() };
  } catch (error) {
    return { rechazo: error instanceof RangeError ? 'rango' : String(error) };
  }
}

function ordenado(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenado);
  if (typeof valor === 'object' && valor !== null) {
    return Object.fromEntries(
      Object.entries(valor)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([clave, dato]) => [clave, ordenado(dato)]),
    );
  }
  return valor;
}

function canonico(valor: unknown): string {
  return JSON.stringify(ordenado(valor));
}

function textos(valores: readonly unknown[]): number[] {
  return valores.map((valor) => Number(valor));
}

interface Gemela<C, T> {
  nombre: string;
  casos: readonly C[];
  ts: (caso: C) => T;
  sql: string;
  enJson: (caso: C) => string;
  extra?: unknown;
  deSql: (fila: Record<string, unknown>) => string;
  deTs: (valor: T) => string;
}

async function codigosEnSql<C, T>(
  cliente: pg.Client,
  gemela: Gemela<C, T>,
  casos: readonly C[],
): Promise<(string | null)[]> {
  if (casos.length === 0) return [];
  const { rows } = await cliente.query<{ codigo: string | null }>(
    `select pg_temp.rechazo_de_la_gemela($1, c.caso, $3::jsonb) as codigo
     from unnest($2::jsonb[]) with ordinality as c (caso, orden)
     order by c.orden`,
    [
      gemela.sql,
      casos.map(gemela.enJson),
      gemela.extra === undefined ? null : JSON.stringify(gemela.extra),
    ],
  );
  return rows.map((fila) => fila.codigo);
}

async function compararGemela<C, T>(cliente: pg.Client, gemela: Gemela<C, T>): Promise<string[]> {
  const describir = (caso: C) => JSON.stringify(caso).slice(0, 240);
  const calculados = gemela.casos.map((caso) => ({ caso, ts: enTs(() => gemela.ts(caso)) }));
  const aceptados = calculados.flatMap(({ caso, ts }) =>
    'valor' in ts ? [{ caso, valor: ts.valor }] : [],
  );
  const rechazados = calculados.flatMap(({ caso, ts }) =>
    'rechazo' in ts ? [{ caso, rechazo: ts.rechazo }] : [],
  );
  const diferencias: string[] = [];

  const casosAceptados = aceptados.map(({ caso }) => caso);
  const filas = await filasEnLote(
    cliente,
    gemela.sql,
    gemela.extra === undefined
      ? [casosAceptados.map(gemela.enJson)]
      : [casosAceptados.map(gemela.enJson), JSON.stringify(gemela.extra)],
  );
  if (typeof filas === 'string') {
    const codigos = await codigosEnSql(cliente, gemela, casosAceptados);
    codigos.forEach((codigo, i) => {
      if (codigo === null) return;
      diferencias.push(
        `${gemela.nombre} ${describir(casosAceptados[i] as C)}: TS acepta, SQL rechaza con ${codigo}`,
      );
    });
    if (diferencias.length === 0) {
      diferencias.push(`${gemela.nombre}: el lote rechazó con ${filas} y ningún caso solo`);
    }
  } else if (filas.length !== aceptados.length) {
    diferencias.push(
      `${gemela.nombre}: SQL devolvió ${String(filas.length)} filas para ${String(aceptados.length)} casos`,
    );
  } else {
    filas.forEach((fila, i) => {
      const aceptado = aceptados[i];
      if (aceptado === undefined) return;
      const sql = gemela.deSql(fila);
      const ts = gemela.deTs(aceptado.valor);
      if (sql !== ts) {
        diferencias.push(`${gemela.nombre} ${describir(aceptado.caso)}: SQL ${sql}, TS ${ts}`);
      }
    });
  }

  const codigos = await codigosEnSql(
    cliente,
    gemela,
    rechazados.map(({ caso }) => caso),
  );
  rechazados.forEach(({ caso, rechazo }, i) => {
    if (rechazo !== 'rango') {
      diferencias.push(
        `${gemela.nombre} ${describir(caso)}: TS no rechaza con RangeError: ${rechazo}`,
      );
      return;
    }
    const codigo = codigos[i] ?? null;
    if (codigo === null || !RECHAZOS_DE_RANGO.has(codigo)) {
      diferencias.push(
        `${gemela.nombre} ${describir(caso)}: TS rechaza, SQL ${codigo === null ? 'acepta' : `rechaza con ${codigo}`}`,
      );
    }
  });
  return diferencias;
}

const ENTEROS_FIJOS: readonly string[] = [
  '0',
  '-0',
  '1',
  '-1',
  '2.0',
  '1e2',
  '1E2',
  '0.1e1',
  '0.5',
  '-0.5',
  '1e-7',
  '4.5e15',
  '9007199254740991',
  '-9007199254740991',
  '9007199254740991.0',
  '9007199254740992',
  '-9007199254740992',
  '9007199254740993',
  '12345678901234567890',
  '1e400',
  '"3"',
  '""',
  'true',
  'false',
  'null',
  '{}',
  '[]',
  '[1]',
  '{"a": 1}',
];

function enterosAlAzar(): string[] {
  const siguiente = generador(20_260_927);
  const casos: string[] = [];
  for (let i = 0; i < 600; i++) {
    const forma = i % 3;
    const valor =
      forma === 0
        ? siguiente(2_000_000_000) - 1_000_000_000
        : forma === 1
          ? (siguiente(2_000_000) - 1_000_000) / 8
          : siguiente(4_194_304) * 4_294_967_296 + siguiente(4_294_967_296);
    casos.push(JSON.stringify(valor));
  }
  return casos;
}

function enteroEnTs(texto: string): number | null {
  const fila = leerLaFila({
    pasos: [],
    reparto: [{ tesoro: idDeLaFila(4), porcentaje: JSON.parse(texto) as unknown }],
    sueldoPorTrabajo: false,
  });
  return fila?.reparto[0]?.porcentaje ?? null;
}

interface CasoDelReparto {
  cobrado: number;
  gastos: number;
  diezmoBp: number;
  pasos: { objetivo: number; previo: number; porMes: boolean }[];
  porcentajes: number[];
}

const REPARTOS_FIJOS: readonly CasoDelReparto[] = [
  { cobrado: 0, gastos: 0, diezmoBp: 1000, pasos: [], porcentajes: [] },
  {
    cobrado: 200_000_000,
    gastos: 20_000_000,
    diezmoBp: 1000,
    pasos: [
      { objetivo: 100_000_000, previo: 0, porMes: true },
      { objetivo: 30_000_000, previo: 0, porMes: true },
      { objetivo: 5_000_000, previo: 0, porMes: true },
    ],
    porcentajes: [5000, 3000],
  },
  {
    cobrado: 50_000_000,
    gastos: 80_000_000,
    diezmoBp: 1000,
    pasos: [{ objetivo: 100_000_000, previo: 0, porMes: true }],
    porcentajes: [5000],
  },
  {
    cobrado: 60_000_000,
    gastos: 0,
    diezmoBp: 1000,
    pasos: [
      { objetivo: 100_000_000, previo: 100_000_000, porMes: true },
      { objetivo: 30_000_000, previo: 8_000_000, porMes: true },
      { objetivo: 5_000_000, previo: 9_000_000, porMes: false },
    ],
    porcentajes: [10_000],
  },
  { cobrado: 9_007_199_254_740_991, gastos: 0, diezmoBp: 0, pasos: [], porcentajes: [1] },
  {
    cobrado: 9_007_199_254_735,
    gastos: 0,
    diezmoBp: 1000,
    pasos: [{ objetivo: 9_007_199_254_740_991, previo: 9_007_199_254_740_991, porMes: true }],
    porcentajes: [],
  },
  { cobrado: -1, gastos: 0, diezmoBp: 1000, pasos: [], porcentajes: [] },
  { cobrado: 0, gastos: -1, diezmoBp: 1000, pasos: [], porcentajes: [] },
  { cobrado: 9_007_199_254_740_992, gastos: 0, diezmoBp: 1000, pasos: [], porcentajes: [] },
  { cobrado: 100, gastos: 0, diezmoBp: -1, pasos: [], porcentajes: [] },
  { cobrado: 100, gastos: 0, diezmoBp: 10_001, pasos: [], porcentajes: [] },
  {
    cobrado: 100,
    gastos: 0,
    diezmoBp: 1000,
    pasos: [{ objetivo: -1, previo: 0, porMes: true }],
    porcentajes: [],
  },
  {
    cobrado: 100,
    gastos: 0,
    diezmoBp: 1000,
    pasos: [{ objetivo: 10, previo: -1, porMes: true }],
    porcentajes: [],
  },
  {
    cobrado: 100,
    gastos: 0,
    diezmoBp: 1000,
    pasos: [{ objetivo: 9_007_199_254_740_992, previo: 0, porMes: false }],
    porcentajes: [],
  },
  { cobrado: 100, gastos: 0, diezmoBp: 1000, pasos: [], porcentajes: [0] },
  { cobrado: 100, gastos: 0, diezmoBp: 1000, pasos: [], porcentajes: [-1] },
  { cobrado: 100, gastos: 0, diezmoBp: 1000, pasos: [], porcentajes: [10_001] },
  { cobrado: 100, gastos: 0, diezmoBp: 1000, pasos: [], porcentajes: [5000, 5001] },
  { cobrado: 9_007_199_254_740_991, gastos: 0, diezmoBp: 1000, pasos: [], porcentajes: [] },
  { cobrado: 9_007_199_254_740_991, gastos: 0, diezmoBp: 0, pasos: [], porcentajes: [2] },
];

function repartosAlAzar(): CasoDelReparto[] {
  const siguiente = generador(20_260_928);
  const importe = (): number => {
    const forma = siguiente(7);
    if (forma < 5) return siguiente(90_000_000_000);
    if (forma === 5) return [0, 1, 2, 99, 10_000, 9_007_199_254_740_991][siguiente(6)] ?? 0;
    return siguiente(1_099_511_627_776);
  };
  const casos: CasoDelReparto[] = [];
  for (let i = 0; i < 1_500; i++) {
    const diezmoBp =
      siguiente(4) === 0 ? siguiente(10_016) - 5 : ([0, 1000, 1000, 10_000][siguiente(4)] ?? 1000);
    const pasos = Array.from({ length: siguiente(7) }, () => ({
      objetivo: importe(),
      previo: siguiente(3) === 0 ? 0 : importe(),
      porMes: siguiente(2) === 0,
    }));
    const porcentajes = Array.from({ length: siguiente(6) }, () =>
      siguiente(7) < 6 ? 1 + siguiente(2500) : siguiente(10_005) - 2,
    );
    casos.push({ cobrado: importe(), gastos: importe(), diezmoBp, pasos, porcentajes });
  }
  return casos;
}

function repartirEnTs(caso: CasoDelReparto) {
  const pasos = caso.pasos.map((paso, i) => ({
    tesoro: idDeLaFila(i),
    clase: 'prioridad' as const,
    objetivo: centavos(paso.objetivo),
    porMes: paso.porMes,
    previo: centavos(paso.previo),
  }));
  return repartir({
    cobrado: centavos(caso.cobrado),
    gastos: centavos(caso.gastos),
    diezmoBp: puntosBasicos(caso.diezmoBp),
    pasos: pasos.map(({ tesoro, clase, objetivo, porMes }) => ({
      tesoro,
      clase,
      objetivo,
      porMes,
    })),
    reparto: caso.porcentajes.map((porcentaje, i) => ({
      tesoro: idDeLaFila(6 + i),
      porcentaje: puntosBasicos(porcentaje),
    })),
    previo: new Map(pasos.map((paso) => [paso.tesoro, paso.previo])),
  });
}

const REPARTIR_EN_SQL = `select r.neta_centavos::text as neta, r.diezmo_centavos::text as diezmo,
    r.topes::text[] as topes, r.montos::text[] as montos, r.sobrante_centavos::text as sobrante,
    r.partes::text[] as partes, r.remanente_centavos::text as remanente
  from unnest($1::jsonb[]) with ordinality as c (caso, orden)
  cross join lateral private.repartir_por_la_fila(
    (c.caso ->> 'cobrado')::bigint,
    (c.caso ->> 'gastos')::bigint,
    (c.caso ->> 'diezmoBp')::integer,
    array(select e.v::bigint from jsonb_array_elements_text(c.caso -> 'objetivos') with ordinality as e (v, n) order by e.n),
    array(select e.v::bigint from jsonb_array_elements_text(c.caso -> 'previos') with ordinality as e (v, n) order by e.n),
    array(select e.v::boolean from jsonb_array_elements_text(c.caso -> 'porMes') with ordinality as e (v, n) order by e.n),
    array(select e.v::integer from jsonb_array_elements_text(c.caso -> 'porcentajes') with ordinality as e (v, n) order by e.n)
  ) as r
  order by c.orden`;

function casoDelRepartoEnJson(caso: CasoDelReparto): string {
  return JSON.stringify({
    cobrado: caso.cobrado,
    gastos: caso.gastos,
    diezmoBp: caso.diezmoBp,
    objetivos: caso.pasos.map((paso) => paso.objetivo),
    previos: caso.pasos.map((paso) => paso.previo),
    porMes: caso.pasos.map((paso) => paso.porMes),
    porcentajes: caso.porcentajes,
  });
}

type CasoDeSiempre = [number, number, boolean];

function filasDeSiempreAlAzar(): CasoDeSiempre[] {
  const casos: CasoDeSiempre[] = [
    [0, 0, true],
    [0, 0, false],
    [1, 0, true],
    [0, 1, false],
    [100_000_000, 30_000_000, true],
    [180_000_000, 0, false],
    [9_007_199_254_740_991, 9_007_199_254_740_991, false],
    [9_007_199_254_740_992, 0, true],
    [0, 9_007_199_254_740_992, false],
    [-1, 0, true],
    [0, -1, false],
  ];
  const siguiente = generador(20_260_929);
  for (let i = 0; i < 300; i++) {
    casos.push([
      siguiente(3) === 0 ? 0 : siguiente(90_000_000_000),
      siguiente(3) === 0 ? 0 : siguiente(9_000_000_000),
      siguiente(2) === 0,
    ]);
  }
  return casos;
}

const NOMBRES_DE_RENGLON: readonly string[] = [
  'Alquiler',
  'Luz',
  'Ayudante',
  ' ',
  '   ',
  '',
  'ñandú',
  '\tLuz',
  ' Luz ',
  'a'.repeat(40),
  'b'.repeat(41),
  'ñ'.repeat(40),
  'ñ'.repeat(41),
];

function filasAlAzar(): unknown[] {
  const siguiente = generador(20_260_930);
  const de = <T>(opciones: readonly T[]): T => opciones[siguiente(opciones.length)] as T;
  const texto = (): string =>
    Array.from({ length: siguiente(46) }, () => String.fromCharCode(32 + siguiente(95))).join('');
  const monto = (): unknown =>
    siguiente(15) < 14
      ? 1 + siguiente(500_000_000)
      : de([0, -1, 1_000_000_000_000, 1_000_000_000_001, 1.5, 2 ** 60]);
  const id = (): unknown =>
    siguiente(9) < 8
      ? idDeLaFila(siguiente(12))
      : de(['00000000-0000-7000-8000-000000000099', 'MAUN', 7]);
  const paso = (): unknown => {
    const renglones = Array.from({ length: siguiente(5) }, () => ({
      nombre: siguiente(3) === 0 ? texto() : de(NOMBRES_DE_RENGLON),
      monto: monto(),
    }));
    const sumables = renglones.every((renglon) => Number.isSafeInteger(renglon.monto));
    const tope =
      siguiente(2) === 0 && sumables
        ? renglones.reduce((suma, renglon) => suma + Number(renglon.monto), 0)
        : monto();
    const forma = siguiente(9);
    const desde = forma < 6 ? null : forma < 8 ? de(['2026-09', '2026-13', '09-2026']) : 202609;
    const clase = siguiente(9) < 8 ? de(['sueldo', 'fijos', 'prioridad']) : de(['otra', 3]);
    const armado = { tesoro: id(), clase, tope, renglones };
    return siguiente(31) === 0 ? armado : { ...armado, desde };
  };
  const parte = (): unknown => ({
    tesoro: id(),
    porcentaje: siguiente(7) < 6 ? 1 + siguiente(4000) : de([0, 10_000, 10_001, 2.5]),
  });
  const filas: unknown[] = [
    null,
    [],
    'fila',
    { pasos: [], reparto: [] },
    {
      pasos: Array.from({ length: 13 }, () => ({
        tesoro: idDeLaFila(5),
        clase: 'prioridad',
        tope: 1,
        renglones: [],
        desde: null,
      })),
      reparto: [],
      sueldoPorTrabajo: false,
    },
    {
      pasos: [],
      reparto: Array.from({ length: 9 }, () => ({ tesoro: idDeLaFila(6), porcentaje: 1 })),
      sueldoPorTrabajo: false,
    },
    {
      pasos: [
        {
          tesoro: idDeLaFila(4),
          clase: 'fijos',
          tope: 13,
          renglones: Array.from({ length: 13 }, (_, i) => ({
            nombre: `Renglón ${String(i)}`,
            monto: 1,
          })),
          desde: null,
        },
      ],
      reparto: [],
      sueldoPorTrabajo: false,
    },
    {
      pasos: [],
      reparto: [
        { tesoro: idDeLaFila(4), porcentaje: 6000 },
        { tesoro: idDeLaFila(5), porcentaje: 4001 },
      ],
      sueldoPorTrabajo: false,
    },
    {
      pasos: [
        {
          tesoro: idDeLaFila(0),
          clase: 'sueldo',
          tope: 100_000_000,
          renglones: [],
          desde: '2026-09',
        },
        {
          tesoro: idDeLaFila(4),
          clase: 'fijos',
          tope: 30_000_000,
          renglones: [
            { nombre: 'Alquiler', monto: 20_000_000 },
            { nombre: 'Luz', monto: 10_000_000 },
          ],
          desde: null,
        },
        { tesoro: idDeLaFila(5), clase: 'prioridad', tope: 0, renglones: [], desde: null },
      ],
      reparto: [
        { tesoro: idDeLaFila(3), porcentaje: 5000 },
        { tesoro: idDeLaFila(6), porcentaje: 5000 },
      ],
      sueldoPorTrabajo: false,
    },
  ];
  for (let i = 0; i < 2_000; i++) {
    if (siguiente(21) === 0) {
      filas.push(de(filas.slice(0, 6)));
      continue;
    }
    filas.push({
      pasos: Array.from({ length: siguiente(6) }, paso),
      reparto: Array.from({ length: siguiente(5) }, parte),
      sueldoPorTrabajo: siguiente(9) === 0,
    });
  }
  return filas.map((fila) => JSON.parse(JSON.stringify(fila)) as unknown);
}

interface CasoDelPlan {
  destino: EstadoLiquidado;
  fila: unknown;
  conSueldo: boolean;
  conDiezmo: boolean;
}

function planesAlAzar(): CasoDelPlan[] {
  const siguiente = generador(20_260_931);
  const casos: CasoDelPlan[] = [];
  for (let i = 0; i < 600; i++) {
    const indices = [4, 5, 6, 7, 8, 9].filter(() => siguiente(3) === 0).slice(0, 4);
    const pasos = indices.map((indice) => {
      const clase = siguiente(2) === 0 ? 'fijos' : 'prioridad';
      const tope = 1 + siguiente(500_000_000);
      return {
        tesoro: idDeLaFila(indice),
        clase,
        tope,
        renglones: clase === 'fijos' ? [{ nombre: 'Alquiler', monto: tope }] : [],
        desde: null,
      };
    });
    const sueldo =
      siguiente(3) === 0
        ? []
        : [
            {
              tesoro: idDeLaFila(0),
              clase: 'sueldo',
              tope: siguiente(500_000_000),
              renglones: [],
              desde: null,
            },
          ];
    casos.push({
      destino: siguiente(2) === 0 ? 'cobrado' : 'perdido',
      fila: {
        pasos: [...sueldo, ...pasos],
        reparto: [10, 11]
          .filter(() => siguiente(2) === 0)
          .map((indice) => ({ tesoro: idDeLaFila(indice), porcentaje: 1500 })),
        sueldoPorTrabajo: siguiente(2) === 0,
      },
      conSueldo: siguiente(2) === 0,
      conDiezmo: siguiente(2) === 0,
    });
  }
  return casos;
}

function planEnTs(caso: CasoDelPlan) {
  const fila = leerLaFila(caso.fila);
  if (fila === null) throw new Error('el caso del plan no es una fila');
  return planDelReparto(caso.destino, fila, {
    perdidoConSueldo: caso.conSueldo,
    perdidoConDiezmo: caso.conDiezmo,
  });
}

const VECTORES_DE_REDONDEO: readonly (readonly [
  number,
  readonly number[],
  readonly number[],
  number,
])[] = [
  [5, [7000, 3000], [3, 1], 1],
  [100, [3333, 3333, 3334], [33, 33, 33], 1],
  [100, [3333, 3333, 3333], [33, 33, 33], 1],
  [101, [5000, 5000], [50, 50], 1],
  [0, [5000], [0], 0],
];

async function compararVectoresDeRedondeo(cliente: pg.Client): Promise<string[]> {
  const diferencias: string[] = [];
  for (const [sobrante, porcentajes, partes, remanente] of VECTORES_DE_REDONDEO) {
    const { rows } = await cliente.query<{ partes: string[]; remanente: string }>(
      `select r.partes::text[] as partes, r.remanente_centavos::text as remanente
       from private.repartir_por_la_fila($1, 0, 0, '{}', '{}', '{}', $2::integer[]) as r`,
      [sobrante, porcentajes],
    );
    const ts = repartir({
      cobrado: centavos(sobrante),
      gastos: centavos(0),
      diezmoBp: puntosBasicos(0),
      pasos: [],
      reparto: porcentajes.map((porcentaje, i) => ({
        tesoro: idDeLaFila(i),
        porcentaje: puntosBasicos(porcentaje),
      })),
      previo: new Map(),
    });
    const esperado = JSON.stringify([partes, remanente]);
    const enSql = JSON.stringify([textos(rows[0]?.partes ?? []), Number(rows[0]?.remanente)]);
    const enDominio = JSON.stringify([ts.reparto.map((parte) => parte.monto), ts.remanente]);
    if (enSql !== esperado || enDominio !== esperado) {
      diferencias.push(
        `redondeo de ${String(sobrante)} al ${porcentajes.join('/')}: esperado ${esperado}, SQL ${enSql}, TS ${enDominio}`,
      );
    }
  }
  return diferencias;
}

export async function compararFila(cliente: pg.Client): Promise<string[]> {
  await cliente.query(RECHAZO_DE_LA_GEMELA);

  const enteros = await compararGemela<string, number | null>(cliente, {
    nombre: 'entero de JSON',
    casos: [...ENTEROS_FIJOS, ...enterosAlAzar()],
    ts: enteroEnTs,
    sql: `select private.entero_de_json(c.valor)::text as entero
          from unnest($1::jsonb[]) with ordinality as c (valor, orden)
          order by c.orden`,
    enJson: (texto) => texto,
    deSql: (fila) => (typeof fila.entero === 'string' ? fila.entero : 'null'),
    deTs: (valor) => (valor === null ? 'null' : String(valor)),
  });

  const repartos = await compararGemela(cliente, {
    nombre: 'reparto por la fila',
    casos: [...REPARTOS_FIJOS, ...repartosAlAzar()],
    ts: repartirEnTs,
    sql: REPARTIR_EN_SQL,
    enJson: casoDelRepartoEnJson,
    deSql: (fila) =>
      JSON.stringify([
        Number(fila.neta),
        Number(fila.diezmo),
        textos(fila.topes as unknown[]),
        textos(fila.montos as unknown[]),
        Number(fila.sobrante),
        textos(fila.partes as unknown[]),
        Number(fila.remanente),
      ]),
    deTs: (reparto) =>
      JSON.stringify([
        reparto.neta,
        reparto.diezmo,
        reparto.pasos.map((paso) => paso.tope),
        reparto.pasos.map((paso) => paso.monto),
        reparto.sobrante,
        reparto.reparto.map((parte) => parte.monto),
        reparto.remanente,
      ]),
  });

  const deSiempre = await compararGemela(cliente, {
    nombre: 'fila de siempre',
    casos: filasDeSiempreAlAzar(),
    ts: ([sueldo, fijos, mensual]) =>
      filaDeSiempre(
        {
          sueldoMensual: centavos(sueldo),
          costosFijos: centavos(fijos),
          sueldoTopeMensual: mensual,
        },
        { hogar: idDeLaFila(0), maun: idDeLaFila(1) },
      ),
    sql: `select private.fila_de_siempre(
            (c.caso ->> 0)::bigint, (c.caso ->> 1)::bigint, (c.caso ->> 2)::boolean,
            ($2::jsonb ->> 'hogar')::uuid, ($2::jsonb ->> 'maun')::uuid
          ) as fila
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          order by c.orden`,
    enJson: (caso) => JSON.stringify(caso),
    extra: { hogar: idDeLaFila(0), maun: idDeLaFila(1) },
    deSql: (fila) => canonico(fila.fila),
    deTs: (fila) => canonico(fila),
  });

  const problemas = await compararGemela<unknown, string | null>(cliente, {
    nombre: 'problema de la fila',
    casos: filasAlAzar(),
    ts: (fila) => primerProblemaDeLaFila(fila, TESOROS_DE_LA_FILA),
    sql: `select private.problema_de_la_fila(c.fila, $2::jsonb) as problema
          from unnest($1::jsonb[]) with ordinality as c (fila, orden)
          order by c.orden`,
    enJson: (caso) => JSON.stringify(caso),
    extra: TESOROS_DE_LA_FILA,
    deSql: (fila) => (typeof fila.problema === 'string' ? fila.problema : 'null'),
    deTs: (problema) => String(problema),
  });

  const planes = await compararGemela(cliente, {
    nombre: 'plan del reparto',
    casos: planesAlAzar(),
    ts: planEnTs,
    sql: `select r.diezmo_bp, r.tesoros::text[] as tesoros, r.clases, r.objetivos::text[] as objetivos,
                 r.por_mes, r.tesoros_del_reparto::text[] as tesoros_del_reparto, r.porcentajes
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          cross join lateral private.plan_del_reparto(
            c.caso ->> 'destino', c.caso -> 'fila', (c.caso ->> 'conSueldo')::boolean,
            (c.caso ->> 'conDiezmo')::boolean
          ) as r
          order by c.orden`,
    enJson: (caso) => JSON.stringify(caso),
    deSql: (fila) =>
      JSON.stringify([
        fila.diezmo_bp,
        fila.tesoros,
        fila.clases,
        textos(fila.objetivos as unknown[]),
        fila.por_mes,
        fila.tesoros_del_reparto,
        fila.porcentajes,
      ]),
    deTs: (plan) =>
      JSON.stringify([
        plan.diezmoBp,
        plan.pasos.map((paso) => paso.tesoro),
        plan.pasos.map((paso) => paso.clase),
        plan.pasos.map((paso) => paso.objetivo),
        plan.pasos.map((paso) => paso.porMes),
        plan.reparto.map((parte) => parte.tesoro),
        plan.reparto.map((parte) => parte.porcentaje),
      ]),
  });

  return [
    ...enteros,
    ...repartos,
    ...deSiempre,
    ...problemas,
    ...planes,
    ...(await compararVectoresDeRedondeo(cliente)),
  ];
}

export async function compararEstados(cliente: pg.Client): Promise<string[]> {
  const { rows } = await cliente.query<{ estados: string[] }>(
    `select array_agg(e.enumlabel::text order by e.enumsortorder) as estados
     from pg_enum e where e.enumtypid = 'public.estado_proyecto'::regtype`,
  );
  const enPostgres = JSON.stringify(rows[0]?.estados ?? []);
  const enDominio = JSON.stringify(ESTADOS);
  return enPostgres === enDominio ? [] : [`estados: Postgres ${enPostgres}, dominio ${enDominio}`];
}

export async function compararTransiciones(cliente: pg.Client): Promise<string[]> {
  const { rows } = await cliente.query<{
    desde: string;
    hasta: string;
    transicion: boolean;
    liquidacion: boolean;
    reversion: boolean;
  }>(
    `select d.estado as desde, h.estado as hasta,
            private.transicion_valida(d.estado::public.estado_proyecto, h.estado::public.estado_proyecto) as transicion,
            private.liquidacion_valida(d.estado::public.estado_proyecto, h.estado::public.estado_proyecto) as liquidacion,
            private.reversion_valida(d.estado::public.estado_proyecto, h.estado::public.estado_proyecto) as reversion
     from unnest($1::text[]) as d (estado)
     cross join unnest($1::text[]) as h (estado)`,
    [[...ESTADOS]],
  );
  if (rows.length !== ESTADOS.length ** 2) return [`transiciones: ${String(rows.length)} filas`];
  return rows.flatMap((fila) => {
    if (!esEstado(fila.desde) || !esEstado(fila.hasta))
      return [`transición desconocida ${fila.desde} → ${fila.hasta}`];
    const desde = fila.desde;
    const hasta = fila.hasta;
    const pares: [string, boolean, boolean][] = [
      ['transición', puedeCambiarEstado(desde, hasta), fila.transicion],
      ['liquidación', puedeLiquidar(desde, hasta), fila.liquidacion],
      ['reversión', puedeRevertir(desde, hasta), fila.reversion],
    ];
    return pares.flatMap(([que, ts, sql]) =>
      ts === sql ? [] : [`${que} ${desde} → ${hasta}: SQL ${String(sql)}, TS ${String(ts)}`],
    );
  });
}

export interface FilaProyecto {
  id: string;
  estado: string;
  version: number;
  fecha_cobro: string | null;
  cobrado: string | null;
  gastos: string | null;
  diezmo_bp: number | null;
  tope_sueldo: string | null;
  tope_fijos: string | null;
  diezmo: string | null;
  sueldo: string | null;
  fijos: string | null;
  remanente: string | null;
  objetivo_sueldo: string | null;
  objetivo_fijos: string | null;
  sueldo_mensual: boolean | null;
  sueldo_previo: string | null;
  fijos_previo: string | null;
  liquidado_en: number | null;
  reapertura_objetivo_sueldo: string | null;
  reapertura_objetivo_fijos: string | null;
  reapertura_sueldo_mensual: boolean | null;
  reapertura_fecha: string | null;
  en_la_apertura: boolean;
  fila_version: number | null;
  fila: unknown;
  previo_del_mes: unknown;
  reapertura_fila: unknown;
}

const COLUMNAS = `p.id, p.estado::text as estado, p.version, p.fecha_cobro::text as fecha_cobro,
  p.dist_fila_version as fila_version, p.dist_fila as fila, p.dist_previo as previo_del_mes,
  p.reapertura_fila,
  p.dist_cobrado_centavos::text as cobrado, p.dist_gastos_centavos::text as gastos,
  p.dist_diezmo_bp as diezmo_bp,
  p.dist_tope_sueldo_centavos::text as tope_sueldo, p.dist_tope_fijos_centavos::text as tope_fijos,
  p.dist_diezmo_centavos::text as diezmo, p.dist_sueldo_centavos::text as sueldo,
  p.dist_fijos_centavos::text as fijos, p.dist_remanente_centavos::text as remanente,
  p.dist_objetivo_sueldo_centavos::text as objetivo_sueldo,
  p.dist_objetivo_fijos_centavos::text as objetivo_fijos, p.dist_sueldo_mensual as sueldo_mensual,
  p.dist_sueldo_previo_centavos::text as sueldo_previo,
  p.dist_fijos_previo_centavos::text as fijos_previo,
  (extract(epoch from p.dist_liquidado_at) * 1000)::float8 as liquidado_en,
  p.reapertura_objetivo_sueldo_centavos::text as reapertura_objetivo_sueldo,
  p.reapertura_objetivo_fijos_centavos::text as reapertura_objetivo_fijos,
  p.reapertura_sueldo_mensual, p.reapertura_fecha_cobro::text as reapertura_fecha,
  p.reparto_ya_en_la_apertura as en_la_apertura`;

function entero(valor: string | null): number | null {
  return valor === null ? null : Number(valor);
}

function congelado(fila: FilaProyecto): string {
  return JSON.stringify([
    fila.estado,
    fila.fecha_cobro,
    entero(fila.cobrado),
    entero(fila.gastos),
    fila.diezmo_bp,
    entero(fila.tope_sueldo),
    entero(fila.tope_fijos),
    entero(fila.diezmo),
    entero(fila.sueldo),
    entero(fila.fijos),
    entero(fila.remanente),
    entero(fila.objetivo_sueldo),
    entero(fila.objetivo_fijos),
    fila.sueldo_mensual,
    entero(fila.sueldo_previo),
    entero(fila.fijos_previo),
    fila.liquidado_en !== null,
    entero(fila.reapertura_objetivo_sueldo),
    entero(fila.reapertura_objetivo_fijos),
    fila.reapertura_sueldo_mensual,
    fila.reapertura_fecha,
    fila.en_la_apertura,
  ]);
}

function esperadoAlLiquidar(liquidacion: Liquidacion, enLaApertura: boolean): string {
  return JSON.stringify([
    liquidacion.destino,
    liquidacion.fecha,
    liquidacion.cobrado,
    liquidacion.gastos,
    liquidacion.diezmoBp,
    liquidacion.topeSueldo,
    liquidacion.topeFijos,
    liquidacion.diezmo,
    liquidacion.sueldo,
    liquidacion.fijos,
    liquidacion.remanente,
    liquidacion.objetivos.sueldo,
    liquidacion.objetivos.fijos,
    liquidacion.objetivos.sueldoMensual,
    liquidacion.previo.sueldo,
    liquidacion.previo.fijos,
    true,
    null,
    null,
    null,
    null,
    enLaApertura,
  ]);
}

function esperadoPorLaFila(liquidacion: LiquidacionPorLaFila, enLaApertura: boolean): string {
  const columnasDeLaFila = columnasDeSiempre(liquidacion);
  return JSON.stringify([
    liquidacion.destino,
    liquidacion.fecha,
    liquidacion.cobrado,
    liquidacion.gastos,
    columnasDeLaFila.diezmoBp,
    columnasDeLaFila.topeSueldo,
    columnasDeLaFila.topeFijos,
    columnasDeLaFila.diezmo,
    columnasDeLaFila.sueldo,
    columnasDeLaFila.fijos,
    columnasDeLaFila.remanente,
    columnasDeLaFila.objetivoSueldo,
    columnasDeLaFila.objetivoFijos,
    columnasDeLaFila.sueldoMensual,
    columnasDeLaFila.sueldoPrevio,
    columnasDeLaFila.fijosPrevio,
    true,
    null,
    null,
    null,
    null,
    enLaApertura,
  ]);
}

function filaCongelada(fila: FilaProyecto): string {
  return canonico([fila.fila_version, fila.fila, fila.previo_del_mes, fila.reapertura_fila]);
}

function previoQueVio(liquidacion: LiquidacionPorLaFila): Record<string, number> {
  return Object.fromEntries(liquidacion.pasos.map((paso) => [paso.tesoro, paso.previo]));
}

function esperadoAlRevertir(antes: FilaProyecto, hacia: EstadoProyecto): string {
  const conFoto = antes.estado === 'cobrado';
  return JSON.stringify([
    hacia,
    ...Array<null>(15).fill(null),
    false,
    conFoto ? entero(antes.objetivo_sueldo) : null,
    conFoto ? entero(antes.objetivo_fijos) : null,
    conFoto ? antes.sueldo_mensual : null,
    conFoto ? antes.fecha_cobro : null,
    conFoto ? antes.en_la_apertura : false,
  ]);
}

function registrada(fila: FilaProyecto): LiquidacionRegistrada | null {
  if (!esEstado(fila.estado) || !estaLiquidado(fila.estado) || fila.fecha_cobro === null)
    return null;
  return {
    estado: fila.estado,
    fecha: fila.fecha_cobro,
    liquidadaEn: fila.liquidado_en ?? 0,
    sueldo: centavos(Number(fila.sueldo)),
    fijos: centavos(Number(fila.fijos)),
    objetivoSueldo: centavos(Number(fila.objetivo_sueldo)),
    objetivoFijos: centavos(Number(fila.objetivo_fijos)),
    sueldoMensual: fila.sueldo_mensual === true,
  };
}

function reaperturaDe(fila: FilaProyecto): Reapertura | null {
  if (fila.reapertura_fecha === null) return null;
  return {
    fecha: fila.reapertura_fecha,
    objetivoSueldo: centavos(Number(fila.reapertura_objetivo_sueldo)),
    objetivoFijos: centavos(Number(fila.reapertura_objetivo_fijos)),
    sueldoMensual: fila.reapertura_sueldo_mensual === true,
  };
}

async function leerProyectos(
  cliente: pg.Client,
  condicion: string,
  parametros: unknown[],
): Promise<FilaProyecto[]> {
  const { rows } = await cliente.query<FilaProyecto>(
    `select ${COLUMNAS} from public.proyectos p where ${condicion}`,
    parametros,
  );
  return rows;
}

async function leerProyecto(cliente: pg.Client, proyectoId: string): Promise<FilaProyecto> {
  const [fila] = await leerProyectos(cliente, 'p.id = $1', [proyectoId]);
  if (fila === undefined) throw new Error(`no existe el proyecto ${proyectoId}`);
  return fila;
}

async function leerAjustes(cliente: pg.Client, householdId: string): Promise<AjustesDeLiquidacion> {
  const { rows } = await cliente.query<{
    sueldo: string;
    fijos: string;
    sueldo_tope_mensual: boolean;
    perdido_con_sueldo: boolean;
    perdido_con_diezmo: boolean;
  }>(
    `select sueldo_mensual_centavos::text as sueldo, costos_fijos_centavos::text as fijos,
            sueldo_tope_mensual, perdido_con_sueldo, perdido_con_diezmo
     from public.ajustes where household_id = $1`,
    [householdId],
  );
  const fila = rows[0];
  if (fila === undefined) throw new Error(`el household ${householdId} no tiene ajustes`);
  return {
    sueldoMensual: centavos(Number(fila.sueldo)),
    costosFijos: centavos(Number(fila.fijos)),
    sueldoTopeMensual: fila.sueldo_tope_mensual,
    perdidoConSueldo: fila.perdido_con_sueldo,
    perdidoConDiezmo: fila.perdido_con_diezmo,
  };
}

async function totales(
  cliente: pg.Client,
  proyectoId: string,
): Promise<{ cobrado: number; gastos: number }> {
  const { rows } = await cliente.query<{ cobrado: string; gastos: string }>(
    `select (select coalesce(sum(monto_centavos), 0) from public.pagos where proyecto_id = $1 and deleted_at is null)::text as cobrado,
            (select coalesce(sum(monto_centavos), 0) from public.gastos where proyecto_id = $1 and deleted_at is null)::text as gastos`,
    [proyectoId],
  );
  return { cobrado: Number(rows[0]?.cobrado), gastos: Number(rows[0]?.gastos) };
}

async function loRepartidoPorLaFila(
  cliente: pg.Client,
  householdId: string,
): Promise<Map<string, { sueldo: number; fijos: number }>> {
  const { rows } = await cliente.query<{ proyecto_id: string; sueldo: string; fijos: string }>(
    `select r.proyecto_id,
            coalesce(sum(r.monto_centavos) filter (where r.clase = 'sueldo'), 0)::text as sueldo,
            coalesce(sum(r.monto_centavos) filter (where r.clase = 'fijos' and t.clave = 'maun'), 0)::text as fijos
     from public.repartos r
     join public.tesoros t on t.household_id = r.household_id and t.id = r.tesoro_id
     where r.household_id = $1 and r.deleted_at is null and r.tipo = 'paso'
     group by r.proyecto_id`,
    [householdId],
  );
  return new Map(
    rows.map((fila) => [
      fila.proyecto_id,
      { sueldo: Number(fila.sueldo), fijos: Number(fila.fijos) },
    ]),
  );
}

export interface LiquidacionPreparada {
  proyectoId: string;
  version: number;
  esperado: Liquidacion;
  vista: Liquidacion;
  enLaApertura: boolean;
}

export async function prepararLiquidacion(
  cliente: pg.Client,
  householdId: string,
  proyectoId: string,
  destino: EstadoLiquidado,
  fecha: string,
  sinVer: readonly string[] = [],
  enLaApertura = false,
): Promise<LiquidacionPreparada> {
  const actual = await leerProyecto(cliente, proyectoId);
  const otras = await leerProyectos(
    cliente,
    'p.household_id = $1 and p.fecha_cobro is not null and p.deleted_at is null and p.id <> $2',
    [householdId, proyectoId],
  );
  const { cobrado, gastos } = await totales(cliente, proyectoId);
  const entrada = {
    destino,
    fecha,
    cobrado: centavos(cobrado),
    gastos: centavos(gastos),
    ajustes: await leerAjustes(cliente, householdId),
    reapertura: reaperturaDe(actual),
  };

  const deLasOtras = (filas: readonly FilaProyecto[]) =>
    filas.map(registrada).filter((liquidacion) => liquidacion !== null);

  const repartido = otras.some((fila) => fila.fila_version !== null)
    ? await loRepartidoPorLaFila(cliente, householdId)
    : new Map<string, { sueldo: number; fijos: number }>();
  const conSusRepartos = (fila: FilaProyecto): LiquidacionRegistrada | null => {
    const registro = registrada(fila);
    if (registro === null || fila.fila_version === null) return registro;
    const suyo = repartido.get(fila.id);
    return { ...registro, sueldo: centavos(suyo?.sueldo ?? 0), fijos: centavos(suyo?.fijos ?? 0) };
  };

  const esperado = calcularLiquidacion({
    ...entrada,
    liquidaciones: otras.map(conSusRepartos).filter((liquidacion) => liquidacion !== null),
  });
  const vista =
    sinVer.length === 0 && otras.every((fila) => fila.fila_version === null)
      ? esperado
      : calcularLiquidacion({
          ...entrada,
          liquidaciones: deLasOtras(otras.filter((fila) => !sinVer.includes(fila.id))),
        });

  return { proyectoId, version: actual.version, esperado, vista, enLaApertura };
}

export function liquidarPreparada(
  cliente: pg.Client,
  { proyectoId, version, vista, enLaApertura }: LiquidacionPreparada,
): Promise<pg.QueryResult<FilaProyecto>> {
  const comunes = [
    proyectoId,
    version,
    vista.fecha,
    vista.cobrado,
    vista.gastos,
    vista.topeSueldo,
    vista.topeFijos,
    vista.diezmo,
    vista.sueldo,
    vista.fijos,
    vista.remanente,
  ];
  const acumulado = [vista.previo.sueldo, vista.previo.fijos, enLaApertura];

  return vista.destino === 'cobrado'
    ? cliente.query<FilaProyecto>(
        `select ${COLUMNAS} from public.cobrar_proyecto($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) p`,
        [...comunes, ...acumulado],
      )
    : cliente.query<FilaProyecto>(
        `select ${COLUMNAS} from public.cerrar_perdido($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) p`,
        [...comunes, vista.diezmoBp, ...acumulado],
      );
}

interface AjustesDeEscenario {
  sueldo: number;
  fijos: number;
  sueldoTopeMensual?: boolean;
  perdidoConSueldo?: boolean;
  perdidoConDiezmo?: boolean;
}

interface ProyectoDeEscenario {
  estado: EstadoProyecto;
  pagos: number[];
  gastos: number[];
  fechaDeLosPagos?: string;
  pagosEnLaApertura?: boolean;
  borrado?: boolean;
  pagosBorrados?: number[];
  gastosBorrados?: number[];
}

interface MovimientoDeEscenario {
  tipo: TipoMovimiento;
  origen: string | null;
  destino: string | null;
  monto: number;
  fecha: string;
  categoria?: string;
  descripcion?: string;
  borrado?: boolean;
}

interface PasoDeLaFilaDeEscenario {
  tesoro: string;
  clase: ClaseDePaso;
  tope?: number;
  renglones?: readonly (readonly [string, number])[];
}

interface FilaDeEscenario {
  pasos: readonly PasoDeLaFilaDeEscenario[];
  reparto: readonly (readonly [string, number])[];
}

interface CoberturaDeEscenario {
  desde: string;
  hacia: string;
  monto: number;
  mes: string;
  fecha: string;
  borrado?: boolean;
}

type Paso =
  | {
      liquidar: EstadoLiquidado;
      proyecto: string;
      fecha: string;
      sinVer?: string[];
      enLaApertura?: boolean;
      porLaFila?: boolean;
    }
  | { revertir: EstadoProyecto; proyecto: string }
  | { pago: number; proyecto: string }
  | { ajustes: { sueldo?: number; fijos?: number } }
  | { fila: FilaDeEscenario | null }
  | { cubrir: CoberturaDeEscenario };

export interface EscenarioDeLiquidacion {
  nombre: string;
  ajustes: AjustesDeEscenario;
  proyectos: Readonly<Record<string, ProyectoDeEscenario>>;
  pasos: Paso[];
  movimientos?: MovimientoDeEscenario[];
  apertura?: string;
  tesoros?: readonly string[];
}

function unCobro(
  nombre: string,
  pagos: number[],
  gastos: number[],
  sueldo: number,
  fijos: number,
): EscenarioDeLiquidacion {
  return {
    nombre,
    ajustes: { sueldo, fijos },
    proyectos: { p: { estado: 'entregado', pagos, gastos } },
    pasos: [{ liquidar: 'cobrado', proyecto: 'p', fecha: '2026-09-10' }],
  };
}

function entregado(...pagos: number[]): ProyectoDeEscenario {
  return { estado: 'entregado', pagos, gastos: [] };
}

const TESOROS_DE_LA_FILA_COMPLETA: readonly string[] = ['Gastos fijos', 'Materiales', 'Inmuebles'];

const FILA_COMPLETA: FilaDeEscenario = {
  pasos: [
    { tesoro: 'hogar', clase: 'sueldo', tope: 100_000_000 },
    {
      tesoro: 'Gastos fijos',
      clase: 'fijos',
      renglones: [
        ['Alquiler', 20_000_000],
        ['Luz', 7_500_000],
        ['Ayudante', 2_500_000],
      ],
    },
    { tesoro: 'Materiales', clase: 'prioridad', tope: 5_000_000 },
  ],
  reparto: [
    ['cocos', 5000],
    ['Inmuebles', 3000],
  ],
};

const FILA_CAMBIADA: FilaDeEscenario = {
  pasos: [
    { tesoro: 'hogar', clase: 'sueldo', tope: 100_000_000 },
    {
      tesoro: 'Gastos fijos',
      clase: 'fijos',
      renglones: [
        ['Alquiler', 20_000_000],
        ['Luz', 7_500_000],
        ['Ayudante', 2_500_000],
      ],
    },
    { tesoro: 'Materiales', clase: 'prioridad', tope: 8_000_000 },
  ],
  reparto: [['cocos', 6000]],
};

const MENSUAL = { sueldo: 100_000_000, fijos: 30_000_000, sueldoTopeMensual: true };

const ESCENARIOS_POR_LA_FILA: EscenarioDeLiquidacion[] = [
  {
    nombre:
      'por la fila: sueldo, gastos fijos con renglones y prioridad, y un reparto por debajo de 100%',
    tesoros: TESOROS_DE_LA_FILA_COMPLETA,
    ajustes: MENSUAL,
    proyectos: {
      p1: { estado: 'entregado', pagos: [200_000_000], gastos: [20_000_000] },
      p2: entregado(60_000_000),
      p3: entregado(33_333_333),
      p4: { estado: 'entregado', pagos: [10_000_000], gastos: [15_000_000] },
    },
    pasos: [
      { fila: FILA_COMPLETA },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-10', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-20', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p3', fecha: '2026-10-02', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p4', fecha: '2026-10-05', porLaFila: true },
    ],
  },
  {
    nombre: 'por la fila: el reparto al 100%, con los centavos del redondeo en Maun',
    tesoros: ['Inmuebles', 'Herramientas'],
    ajustes: MENSUAL,
    proyectos: { p1: entregado(50_000_007), p2: entregado(1_234_567) },
    pasos: [
      {
        fila: {
          pasos: [{ tesoro: 'hogar', clase: 'sueldo', tope: 10_000_000 }],
          reparto: [
            ['cocos', 3333],
            ['Inmuebles', 3333],
            ['Herramientas', 3334],
          ],
        },
      },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-10', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-11', porLaFila: true },
    ],
  },
  {
    nombre:
      'por la fila: lo que se pasa para cubrir el mes cuenta para su tope, y lo de otro mes o lo borrado no',
    tesoros: ['Gastos fijos'],
    ajustes: MENSUAL,
    proyectos: { p1: entregado(50_000_000), p2: entregado(30_000_000) },
    pasos: [
      {
        fila: {
          pasos: [
            { tesoro: 'Gastos fijos', clase: 'fijos', renglones: [['Alquiler', 30_000_000]] },
          ],
          reparto: [],
        },
      },
      {
        cubrir: {
          desde: 'maun',
          hacia: 'Gastos fijos',
          monto: 12_000_000,
          mes: '2026-09-01',
          fecha: '2026-09-05',
        },
      },
      {
        cubrir: {
          desde: 'hogar',
          hacia: 'Gastos fijos',
          monto: 4_000_000,
          mes: '2026-10-01',
          fecha: '2026-09-06',
        },
      },
      {
        cubrir: {
          desde: 'cocos',
          hacia: 'Gastos fijos',
          monto: 2_000_000,
          mes: '2026-09-01',
          fecha: '2026-09-07',
          borrado: true,
        },
      },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-15', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-10-03', porLaFila: true },
    ],
  },
  {
    nombre:
      'por la fila: un perdido lleva el diezmo y el sueldo en cero, reactivarlo no deja foto y volver a cerrarlo es otro evento',
    tesoros: TESOROS_DE_LA_FILA_COMPLETA,
    ajustes: MENSUAL,
    proyectos: {
      lead: { estado: 'presupuesto_enviado', pagos: [40_000_000], gastos: [] },
      obra: { estado: 'en_curso', pagos: [150_000_000], gastos: [30_000_000] },
      p1: entregado(100_000_000),
    },
    pasos: [
      { fila: FILA_COMPLETA },
      { liquidar: 'perdido', proyecto: 'lead', fecha: '2026-09-05', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-10', porLaFila: true },
      { revertir: 'contacto', proyecto: 'lead' },
      { liquidar: 'perdido', proyecto: 'lead', fecha: '2026-10-01', porLaFila: true },
      { liquidar: 'perdido', proyecto: 'obra', fecha: '2026-10-02', porLaFila: true },
    ],
  },
  {
    nombre: 'por la fila: un perdido con sueldo y sin diezmo, y un cobro después en el mismo mes',
    tesoros: TESOROS_DE_LA_FILA_COMPLETA,
    ajustes: { ...MENSUAL, perdidoConSueldo: true, perdidoConDiezmo: false },
    proyectos: {
      obra: { estado: 'en_curso', pagos: [150_000_000], gastos: [30_000_000] },
      p: entregado(80_000_000),
    },
    pasos: [
      { fila: FILA_COMPLETA },
      { liquidar: 'perdido', proyecto: 'obra', fecha: '2026-09-07', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p', fecha: '2026-09-08', porLaFila: true },
    ],
  },
  {
    nombre:
      'por la fila: reabrir un cobro, cambiar la fila y volver a cobrarlo con la fila de su foto',
    tesoros: TESOROS_DE_LA_FILA_COMPLETA,
    ajustes: MENSUAL,
    proyectos: { p1: entregado(120_000_000), p2: entregado(80_000_000) },
    pasos: [
      { fila: FILA_COMPLETA },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-03', porLaFila: true },
      { revertir: 'entregado', proyecto: 'p1' },
      { pago: 30_000_000, proyecto: 'p1' },
      { fila: FILA_CAMBIADA },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-10', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-03', porLaFila: true },
    ],
  },
  {
    nombre: 'por la fila: un cobro y un perdido con lo del mes viejo se ajustan',
    tesoros: TESOROS_DE_LA_FILA_COMPLETA,
    ajustes: MENSUAL,
    proyectos: {
      p1: entregado(150_000_000),
      p2: entregado(90_000_000),
      lead: { estado: 'presupuesto_enviado', pagos: [30_000_000], gastos: [] },
    },
    pasos: [
      { fila: FILA_COMPLETA },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-03', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-20', porLaFila: true, sinVer: ['p1'] },
      {
        liquidar: 'perdido',
        proyecto: 'lead',
        fecha: '2026-09-25',
        porLaFila: true,
        sinVer: ['p1', 'p2'],
      },
    ],
  },
  {
    nombre:
      'sin fila guardada: una app nueva cobra por la fila de siempre, entre cobros de una app vieja',
    ajustes: { sueldo: 50_000_000, fijos: 25_000_000, sueldoTopeMensual: true },
    proyectos: {
      p0: entregado(30_000_000),
      p1: entregado(40_000_000),
      p2: entregado(60_000_000),
      p3: entregado(20_000_000),
    },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p0', fecha: '2026-11-02' },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-11-05', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-11-10' },
      { liquidar: 'cobrado', proyecto: 'p3', fecha: '2026-11-20', porLaFila: true },
    ],
  },
  {
    nombre: 'sin fila guardada y con el sueldo por trabajo: la fila de siempre no topea el sueldo',
    ajustes: { sueldo: 50_000_000, fijos: 25_000_000 },
    proyectos: { p1: entregado(70_000_000), p2: entregado(100_000_000) },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-03', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-20', porLaFila: true },
    ],
  },
  {
    nombre:
      'reabrir un cobro de antes y volver a cobrarlo por la fila: la de siempre armada con su foto',
    tesoros: TESOROS_DE_LA_FILA_COMPLETA,
    ajustes: { sueldo: 50_000_000, fijos: 25_000_000, sueldoTopeMensual: true },
    proyectos: { p1: entregado(70_000_000), p2: entregado(100_000_000) },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-03' },
      { revertir: 'entregado', proyecto: 'p1' },
      { fila: FILA_COMPLETA },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-10', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-03', porLaFila: true },
    ],
  },
  {
    nombre: 'por la fila: un cobro de antes de la apertura, marcado, y volver a la fila de siempre',
    apertura: '2026-09-14',
    tesoros: TESOROS_DE_LA_FILA_COMPLETA,
    ajustes: MENSUAL,
    proyectos: {
      viejo: {
        estado: 'entregado',
        pagos: [160_000_000],
        gastos: [],
        fechaDeLosPagos: '2026-07-01',
        pagosEnLaApertura: true,
      },
      nuevo: entregado(50_000_000),
    },
    pasos: [
      { fila: FILA_COMPLETA },
      {
        liquidar: 'cobrado',
        proyecto: 'viejo',
        fecha: '2026-07-01',
        porLaFila: true,
        enLaApertura: true,
      },
      { fila: null },
      { liquidar: 'cobrado', proyecto: 'nuevo', fecha: '2026-09-20', porLaFila: true },
    ],
  },
];

export const ESCENARIOS_DE_LIQUIDACION: EscenarioDeLiquidacion[] = [
  unCobro('con pérdida', [10_000_000], [15_000_000], 180_000_000, 25_000_000),
  unCobro('sin pagos ni gastos', [], [], 180_000_000, 25_000_000),
  unCobro(
    'ganancia menor al sueldo',
    [40_000_000, 40_000_000, 44_000_000],
    [24_600_000, 5_800_000, 1_450_000, 980_000, 2_500_000],
    180_000_000,
    25_000_000,
  ),
  unCobro('sueldo cubierto y fijos a medias', [215_000_000], [], 180_000_000, 25_000_000),
  unCobro(
    'todo cubierto con remanente',
    [180_000_000, 150_000_000, 150_000_000],
    [82_000_000, 39_000_000, 31_000_000, 4_200_000, 8_800_000],
    180_000_000,
    25_000_000,
  ),
  unCobro('diezmo con medio centavo', [1_000_005], [], 50_000, 20_000),
  {
    nombre: 'dos cobros del mismo mes: el segundo toma lo que falta de los fijos; otro mes, no',
    ajustes: { sueldo: 50_000_000, fijos: 25_000_000 },
    proyectos: {
      p1: entregado(70_000_000),
      p2: { estado: 'entregado', pagos: [100_000_000], gastos: [5_000_000] },
      p3: entregado(100_000_000),
    },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-03' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-30' },
      { liquidar: 'cobrado', proyecto: 'p3', fecha: '2026-10-01' },
    ],
  },
  {
    nombre: 'sueldo con tope mensual',
    ajustes: { sueldo: 50_000_000, fijos: 25_000_000, sueldoTopeMensual: true },
    proyectos: { p1: entregado(40_000_000), p2: entregado(100_000_000), p3: entregado(30_000_000) },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-11-02' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-11-20' },
      { liquidar: 'cobrado', proyecto: 'p3', fecha: '2026-11-28' },
    ],
  },
  {
    nombre: 'reabrir un cobro del mes, cambiar los ajustes y volver a cobrarlo',
    ajustes: { sueldo: 50_000_000, fijos: 25_000_000 },
    proyectos: { p1: entregado(70_000_000), p2: entregado(100_000_000) },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-03' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-20' },
      { revertir: 'entregado', proyecto: 'p1' },
      { pago: 30_000_000, proyecto: 'p1' },
      { ajustes: { sueldo: 90_000_000, fijos: 99_000_000 } },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-10-15' },
    ],
  },
  {
    nombre: 'perdidos con los parámetros por defecto: seña retenida, sin pagos y desde la obra',
    ajustes: { sueldo: 180_000_000, fijos: 25_000_000 },
    proyectos: {
      visita: { estado: 'relevamiento', pagos: [4_000_000], gastos: [800_000] },
      sinSena: { estado: 'contacto', pagos: [], gastos: [] },
      obra: { estado: 'en_curso', pagos: [100_000_000], gastos: [30_000_000] },
    },
    pasos: [
      { liquidar: 'perdido', proyecto: 'visita', fecha: '2026-09-05' },
      { liquidar: 'perdido', proyecto: 'sinSena', fecha: '2026-09-06' },
      { liquidar: 'perdido', proyecto: 'obra', fecha: '2026-09-07' },
    ],
  },
  {
    nombre: 'perdido con sueldo y sin diezmo, y un cobro después en el mismo mes',
    ajustes: {
      sueldo: 180_000_000,
      fijos: 25_000_000,
      perdidoConSueldo: true,
      perdidoConDiezmo: false,
    },
    proyectos: {
      obra: { estado: 'en_curso', pagos: [100_000_000], gastos: [30_000_000] },
      p: entregado(250_000_000),
    },
    pasos: [
      { liquidar: 'perdido', proyecto: 'obra', fecha: '2026-09-07' },
      { liquidar: 'cobrado', proyecto: 'p', fecha: '2026-09-08' },
    ],
  },
  {
    nombre: 'reactivar un perdido lo saca del mes, y volver a cerrarlo es otro evento',
    ajustes: { sueldo: 180_000_000, fijos: 25_000_000 },
    proyectos: {
      lead: { estado: 'presupuesto_enviado', pagos: [30_000_000], gastos: [] },
      p1: entregado(300_000_000),
      p2: entregado(300_000_000),
    },
    pasos: [
      { liquidar: 'perdido', proyecto: 'lead', fecha: '2026-09-02' },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-10' },
      { revertir: 'contacto', proyecto: 'lead' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-20' },
      { liquidar: 'perdido', proyecto: 'lead', fecha: '2026-10-01' },
    ],
  },
  {
    nombre:
      'un estimativo que no avanzó se da por perdido, vuelve a estimativo y se cierra otra vez',
    ajustes: { sueldo: 180_000_000, fijos: 25_000_000 },
    proyectos: {
      estimativo: { estado: 'presupuesto_estimativo', pagos: [3_000_000], gastos: [500_000] },
      p1: entregado(200_000_000),
    },
    pasos: [
      { liquidar: 'perdido', proyecto: 'estimativo', fecha: '2026-09-15' },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-16' },
      { revertir: 'presupuesto_estimativo', proyecto: 'estimativo' },
      { liquidar: 'perdido', proyecto: 'estimativo', fecha: '2026-10-02' },
    ],
  },
  {
    nombre:
      'un por ahora no con seña se da por perdido, se reactiva a una consulta y se cierra otra vez',
    ajustes: { sueldo: 180_000_000, fijos: 25_000_000 },
    proyectos: {
      enSeguimiento: { estado: 'en_seguimiento', pagos: [4_000_000], gastos: [] },
      p1: entregado(200_000_000),
    },
    pasos: [
      { liquidar: 'perdido', proyecto: 'enSeguimiento', fecha: '2026-09-18' },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-19' },
      { revertir: 'presupuesto_enviado', proyecto: 'enSeguimiento' },
      { liquidar: 'perdido', proyecto: 'enSeguimiento', fecha: '2026-10-03' },
    ],
  },
  {
    nombre: 'dos cobros en julio y uno en septiembre: los fijos se topean con el mes de cada fecha',
    ajustes: { sueldo: 50_000_000, fijos: 25_000_000 },
    proyectos: {
      p1: entregado(40_000_000),
      p2: entregado(80_000_000),
      p3: entregado(60_000_000),
    },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-07-10' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-07-28' },
      { liquidar: 'cobrado', proyecto: 'p3', fecha: '2026-09-05' },
    ],
  },
  {
    nombre:
      'reabrir un cobro de agosto y volver a cobrarlo en septiembre: el reparto pasa al mes nuevo con los objetivos del original',
    ajustes: { sueldo: 50_000_000, fijos: 25_000_000 },
    proyectos: {
      p1: entregado(70_000_000),
      p2: entregado(100_000_000),
      p3: entregado(100_000_000),
    },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-08-20' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-03' },
      { revertir: 'entregado', proyecto: 'p1' },
      { ajustes: { sueldo: 90_000_000, fijos: 99_000_000 } },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-10' },
      { liquidar: 'cobrado', proyecto: 'p3', fecha: '2026-08-25' },
    ],
  },
  {
    nombre:
      'un cobro y un perdido de antes de la apertura, marcados: se congelan con la marca, reabrir la conserva y reactivar la apaga',
    apertura: '2026-09-14',
    ajustes: { sueldo: 50_000_000, fijos: 25_000_000 },
    proyectos: {
      viejo: {
        estado: 'entregado',
        pagos: [60_000_000],
        gastos: [],
        fechaDeLosPagos: '2026-07-01',
        pagosEnLaApertura: true,
      },
      lead: {
        estado: 'presupuesto_enviado',
        pagos: [5_000_000],
        gastos: [],
        fechaDeLosPagos: '2026-06-01',
        pagosEnLaApertura: true,
      },
    },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'viejo', fecha: '2026-07-01', enLaApertura: true },
      { liquidar: 'perdido', proyecto: 'lead', fecha: '2026-06-15', enLaApertura: true },
      { revertir: 'entregado', proyecto: 'viejo' },
      { liquidar: 'cobrado', proyecto: 'viejo', fecha: '2026-07-05', enLaApertura: true },
      { revertir: 'presupuesto_enviado', proyecto: 'lead' },
    ],
  },
  {
    nombre: 'un cobro con el acumulado del mes viejo se ajusta, y lo congelado es lo del dominio',
    ajustes: { sueldo: 50_000_000, fijos: 25_000_000 },
    proyectos: {
      p1: entregado(70_000_000),
      p2: entregado(100_000_000),
      p3: entregado(100_000_000),
    },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-03' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-20', sinVer: ['p1'] },
      { liquidar: 'cobrado', proyecto: 'p3', fecha: '2026-09-25', sinVer: ['p1', 'p2'] },
    ],
  },
  {
    nombre: 'cerrar un perdido con el acumulado viejo también ajusta',
    ajustes: { sueldo: 50_000_000, fijos: 25_000_000 },
    proyectos: {
      p1: entregado(70_000_000),
      lead: { estado: 'presupuesto_enviado', pagos: [20_000_000], gastos: [] },
    },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-03' },
      { liquidar: 'perdido', proyecto: 'lead', fecha: '2026-09-29', sinVer: ['p1'] },
    ],
  },
  {
    nombre: 'con sueldo mensual, el acumulado viejo ajusta el sueldo y no lo duplica',
    ajustes: { sueldo: 50_000_000, fijos: 0, sueldoTopeMensual: true },
    proyectos: {
      p1: entregado(60_000_000),
      p2: entregado(100_000_000),
    },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-11-02' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-11-20', sinVer: ['p1'] },
    ],
  },
  ...ESCENARIOS_POR_LA_FILA,
];

interface Contexto {
  householdId: string;
  usuarioId: string;
  clienteId: string;
  ids: Map<string, string>;
  tesoros: Map<string, string>;
  nuevoId: () => string;
  verificar: boolean;
}

const TINTAS_DE_ESCENARIO = ['grana', 'mostaza', 'petroleo', 'ciruela'] as const;

function esClaveDeTesoro(nombre: string): boolean {
  return (TESOROS as readonly string[]).includes(nombre);
}

function idDelTesoro(tesoros: ReadonlyMap<string, string>, nombre: string): string {
  const id = tesoros.get(nombre);
  if (id === undefined) throw new Error(`el escenario no tiene el tesoro ${nombre}`);
  return id;
}

function ladoDelMovimiento(
  tesoros: ReadonlyMap<string, string>,
  nombre: string | null,
): { clave: string | null; id: string | null } {
  if (nombre === null) return { clave: null, id: null };
  if (esClaveDeTesoro(nombre)) return { clave: nombre, id: null };
  return { clave: null, id: idDelTesoro(tesoros, nombre) };
}

function filaDelEscenario(fila: FilaDeEscenario, tesoros: ReadonlyMap<string, string>): Fila {
  return {
    pasos: fila.pasos.map((paso) => {
      const renglones = (paso.renglones ?? []).map(([nombre, monto]) => ({
        nombre,
        monto: centavos(monto),
      }));
      const suma = renglones.reduce((total, renglon) => total + renglon.monto, 0);
      return {
        tesoro: idDelTesoro(tesoros, paso.tesoro),
        clase: paso.clase,
        tope: centavos(paso.tope ?? suma),
        renglones,
        desde: null,
      };
    }),
    reparto: fila.reparto.map(([tesoro, porcentaje]) => ({
      tesoro: idDelTesoro(tesoros, tesoro),
      porcentaje: puntosBasicos(porcentaje),
    })),
    sueldoPorTrabajo: false,
  };
}

async function prepararEscenario(
  cliente: pg.Client,
  escenario: EscenarioDeLiquidacion,
): Promise<Contexto> {
  const { rows: usuario } = await cliente.query<{ id: string }>(
    `with nuevo as (
       insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
       values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
               'comparacion@maun.test', '', now(), now())
       returning id
     )
     select id, set_config('maun.hoy_en_el_taller', '2099-12-31', true) from nuevo`,
  );
  const userId = usuario[0]?.id ?? '';
  const { rows: household } = await cliente.query<{ id: string }>(
    'select private.crear_household($1, $2) as id',
    ['Comparación', userId],
  );
  const householdId = household[0]?.id ?? '';
  const { ajustes } = escenario;
  const { rows: clienteDelTaller } = await cliente.query<{ id: string }>(
    `with cambiados as (
       update public.ajustes set
         sueldo_mensual_centavos = $2, costos_fijos_centavos = $3, sueldo_tope_mensual = $4,
         perdido_con_sueldo = $5, perdido_con_diezmo = $6
       where household_id = $1
       returning household_id
     )
     insert into public.clientes (household_id, nombre)
     select household_id, 'Cliente' from cambiados
     returning id`,
    [
      householdId,
      ajustes.sueldo,
      ajustes.fijos,
      ajustes.sueldoTopeMensual ?? false,
      ajustes.perdidoConSueldo ?? false,
      ajustes.perdidoConDiezmo ?? true,
    ],
  );
  const nombresDeTesoros = escenario.tesoros ?? [];
  const { rows: filasDeTesoros } = await cliente.query<{ nombre: string; id: string }>(
    `with nuevos as (
       insert into public.tesoros (household_id, nombre, tinta, icono, orden)
       select $1, t.nombre, t.tinta, 'vault', t.orden - 1
       from unnest($2::text[], $3::text[]) with ordinality as t (nombre, tinta, orden)
       returning nombre, id
     )
     select nombre, id from nuevos
     union all
     select clave::text, id from public.tesoros where household_id = $1 and clave is not null`,
    [
      householdId,
      nombresDeTesoros,
      nombresDeTesoros.map(
        (_, orden) => TINTAS_DE_ESCENARIO[orden % TINTAS_DE_ESCENARIO.length] ?? 'grana',
      ),
    ],
  );
  const tesoros = new Map(filasDeTesoros.map((fila) => [fila.nombre, fila.id]));
  if (escenario.apertura !== undefined) {
    await cliente.query(
      `insert into public.movimientos
         (household_id, fecha, tipo, tesoro_origen, tesoro_destino, monto_centavos, categoria, descripcion)
       values ($1, $2, 'ajuste', null, 'maun', 100000000, 'Apertura', 'Apertura')`,
      [householdId, escenario.apertura],
    );
  }

  const proyectos = Object.entries(escenario.proyectos);
  const { rows: filasDeProyectos } = await cliente.query<{ titulo: string; id: string }>(
    `insert into public.proyectos (household_id, cliente_id, titulo, estado)
     select $1, $2, p.titulo, p.estado::public.estado_proyecto
     from unnest($3::text[], $4::text[]) with ordinality as p (titulo, estado, orden)
     order by p.orden
     returning titulo, id`,
    [
      householdId,
      clienteDelTaller[0]?.id,
      proyectos.map(([clave]) => clave),
      proyectos.map(([, proyecto]) => proyecto.estado),
    ],
  );
  const ids = new Map(filasDeProyectos.map((fila) => [fila.titulo, fila.id]));
  const idDe = (clave: string) => ids.get(clave) ?? '';

  const enSeguimiento = proyectos.filter(([, proyecto]) => proyecto.estado === 'en_seguimiento');
  if (enSeguimiento.length > 0) {
    await cliente.query(
      `insert into public.proximos_contactos (household_id, proyecto_id, fecha, etapa_previa)
       select $1, p.id, '2026-09-01', 'presupuesto_enviado' from unnest($2::uuid[]) as p (id)`,
      [householdId, enSeguimiento.map(([clave]) => idDe(clave))],
    );
  }

  const pagos = proyectos.flatMap(([clave, proyecto]) =>
    [
      ...proyecto.pagos.map((monto) => [monto, null] as const),
      ...(proyecto.pagosBorrados ?? []).map((monto) => [monto, '2026-08-15T00:00:00Z'] as const),
    ].map(([monto, borrado]) => ({
      proyecto: idDe(clave),
      fecha: proyecto.fechaDeLosPagos ?? '2026-08-01',
      monto,
      borrado,
      enLaApertura: proyecto.pagosEnLaApertura === true,
    })),
  );
  if (pagos.length > 0) {
    await cliente.query(
      `insert into public.pagos (household_id, proyecto_id, fecha, monto_centavos, deleted_at, ya_en_la_apertura)
       select $1, p.proyecto, p.fecha, p.monto, p.borrado, p.en_la_apertura
       from unnest($2::uuid[], $3::date[], $4::bigint[], $5::timestamptz[], $6::boolean[])
         with ordinality as p (proyecto, fecha, monto, borrado, en_la_apertura, orden)
       order by p.orden`,
      [
        householdId,
        pagos.map((pago) => pago.proyecto),
        pagos.map((pago) => pago.fecha),
        pagos.map((pago) => pago.monto),
        pagos.map((pago) => pago.borrado),
        pagos.map((pago) => pago.enLaApertura),
      ],
    );
  }

  const gastos = proyectos.flatMap(([clave, proyecto]) =>
    [
      ...proyecto.gastos.map((monto) => [monto, null] as const),
      ...(proyecto.gastosBorrados ?? []).map((monto) => [monto, '2026-08-15T00:00:00Z'] as const),
    ].map(([monto, borrado]) => ({ proyecto: idDe(clave), monto, borrado })),
  );
  if (gastos.length > 0) {
    await cliente.query(
      `insert into public.gastos (household_id, proyecto_id, fecha, monto_centavos, deleted_at)
       select $1, g.proyecto, '2026-08-01', g.monto, g.borrado
       from unnest($2::uuid[], $3::bigint[], $4::timestamptz[]) with ordinality as g (proyecto, monto, borrado, orden)
       order by g.orden`,
      [
        householdId,
        gastos.map((gasto) => gasto.proyecto),
        gastos.map((gasto) => gasto.monto),
        gastos.map((gasto) => gasto.borrado),
      ],
    );
  }

  const borrados = proyectos.filter(([, proyecto]) => proyecto.borrado === true);
  if (borrados.length > 0) {
    await cliente.query(
      `update public.proyectos set deleted_at = '2026-08-20T00:00:00Z' where id = any ($1::uuid[])`,
      [borrados.map(([clave]) => idDe(clave))],
    );
  }

  const movimientos = escenario.movimientos ?? [];
  if (movimientos.length > 0) {
    const lados = movimientos.map((movimiento) => ({
      desde: ladoDelMovimiento(tesoros, movimiento.origen),
      hacia: ladoDelMovimiento(tesoros, movimiento.destino),
    }));
    await cliente.query(
      `insert into public.movimientos
         (household_id, fecha, tipo, tesoro_origen, tesoro_destino, desde_id, hacia_id, monto_centavos,
          categoria, descripcion, deleted_at)
       select $1, m.fecha, m.tipo::public.tipo_movimiento, m.origen::public.tesoro, m.destino::public.tesoro,
              m.desde, m.hacia, m.monto, m.categoria, m.descripcion, m.borrado
       from unnest(
         $2::date[], $3::text[], $4::text[], $5::text[], $6::uuid[], $7::uuid[], $8::bigint[],
         $9::text[], $10::text[], $11::timestamptz[]
       ) with ordinality as m (fecha, tipo, origen, destino, desde, hacia, monto, categoria, descripcion, borrado, orden)
       order by m.orden`,
      [
        householdId,
        movimientos.map((movimiento) => movimiento.fecha),
        movimientos.map((movimiento) => movimiento.tipo),
        lados.map((lado) => lado.desde.clave),
        lados.map((lado) => lado.hacia.clave),
        lados.map((lado) => lado.desde.id),
        lados.map((lado) => lado.hacia.id),
        movimientos.map((movimiento) => movimiento.monto),
        movimientos.map((movimiento) => movimiento.categoria ?? ''),
        movimientos.map((movimiento) => movimiento.descripcion ?? ''),
        movimientos.map((movimiento) =>
          movimiento.borrado === true ? '2026-08-25T00:00:00Z' : null,
        ),
      ],
    );
  }

  await cliente.query(
    "select set_config('request.jwt.claims', $1, true), set_config('role', 'authenticated', true)",
    [JSON.stringify({ sub: userId, role: 'authenticated' })],
  );
  let emitidos = 0;
  const nuevoId = () => {
    emitidos += 1;
    return `22222222-0000-7000-8000-${String(emitidos).padStart(12, '0')}`;
  };
  return {
    householdId,
    usuarioId: userId,
    clienteId: clienteDelTaller[0]?.id ?? '',
    ids,
    tesoros,
    nuevoId,
    verificar: true,
  };
}

async function guardarLaFilaDelEscenario(
  cliente: pg.Client,
  contexto: Contexto,
  deEscenario: FilaDeEscenario | null,
): Promise<string[]> {
  const { version } = filaDelTaller(await replicaDeLaBase(cliente, contexto.usuarioId));
  const fila = deEscenario === null ? null : filaDelEscenario(deEscenario, contexto.tesoros);
  const { rows } = await cliente.query<{ version: number; fila: unknown }>(
    'select fila_version as version, fila from public.guardar_la_fila($1, $2::jsonb)',
    [version, fila === null ? null : JSON.stringify(fila)],
  );
  const enBase = canonico([rows[0]?.version, rows[0]?.fila]);
  const esperado = canonico([version + 1, fila]);
  return enBase === esperado ? [] : [`guardar la fila: base ${enBase}, esperado ${esperado}`];
}

async function cubrirElMes(
  cliente: pg.Client,
  contexto: Contexto,
  cobertura: CoberturaDeEscenario,
): Promise<void> {
  const { rows } = await cliente.query<{ id: string }>(
    `insert into public.movimientos (fecha, tipo, desde_id, hacia_id, monto_centavos, cubre_el_mes)
     values ($1, 'transferencia', $2, $3, $4, $5) returning id`,
    [
      cobertura.fecha,
      idDelTesoro(contexto.tesoros, cobertura.desde),
      idDelTesoro(contexto.tesoros, cobertura.hacia),
      cobertura.monto,
      cobertura.mes,
    ],
  );
  if (cobertura.borrado === true) {
    await cliente.query('update public.movimientos set deleted_at = now() where id = $1', [
      rows[0]?.id,
    ]);
  }
}

interface FilaDeReparto {
  id: string;
  posicion: number;
  tesoro_id: string;
  nombre: string;
  tipo: string;
  clase: string | null;
  objetivo: string | null;
  previo: string | null;
  tope: string | null;
  por_mes: boolean | null;
  porcentaje_bp: number | null;
  monto: string;
  fecha: string;
  ya_en_la_apertura: boolean;
}

async function repartosVivos(cliente: pg.Client, proyectoId: string): Promise<string[]> {
  const { rows } = await cliente.query<FilaDeReparto>(
    `select id, posicion, tesoro_id, nombre, tipo, clase, objetivo_centavos::text as objetivo,
            previo_centavos::text as previo, tope_centavos::text as tope, por_mes, porcentaje_bp,
            monto_centavos::text as monto, fecha::text as fecha, ya_en_la_apertura
     from public.repartos
     where proyecto_id = $1 and deleted_at is null
     order by posicion`,
    [proyectoId],
  );
  return rows.map((fila) =>
    JSON.stringify([
      fila.id,
      fila.posicion,
      fila.tesoro_id,
      fila.nombre,
      fila.tipo,
      fila.clase,
      entero(fila.objetivo),
      entero(fila.previo),
      entero(fila.tope),
      fila.por_mes,
      fila.porcentaje_bp,
      Number(fila.monto),
      fila.fecha,
      fila.ya_en_la_apertura,
    ]),
  );
}

function repartosEsperados(
  liquidacion: LiquidacionPorLaFila,
  ids: readonly string[],
  nombres: ReadonlyMap<string, string>,
  enLaApertura: boolean,
): string[] {
  const pasos = liquidacion.pasos.map((paso, i) =>
    JSON.stringify([
      ids[i],
      i + 1,
      paso.tesoro,
      nombres.get(paso.tesoro) ?? '',
      'paso',
      paso.clase,
      paso.objetivo,
      paso.previo,
      paso.tope,
      paso.porMes,
      null,
      paso.monto,
      liquidacion.fecha,
      enLaApertura,
    ]),
  );
  const partes = liquidacion.reparto.map((parte, i) =>
    JSON.stringify([
      ids[liquidacion.pasos.length + i],
      liquidacion.pasos.length + i + 1,
      parte.tesoro,
      nombres.get(parte.tesoro) ?? '',
      'parte',
      null,
      null,
      null,
      null,
      null,
      parte.porcentaje,
      parte.monto,
      liquidacion.fecha,
      enLaApertura,
    ]),
  );
  return [...pasos, ...partes];
}

async function liquidarPorLaFila(
  cliente: pg.Client,
  contexto: Contexto,
  paso: {
    liquidar: EstadoLiquidado;
    proyecto: string;
    fecha: string;
    sinVer?: string[];
    enLaApertura?: boolean;
  },
  proyectoId: string,
): Promise<string[]> {
  const replica = await replicaDeLaBase(cliente, contexto.usuarioId);
  const proyecto = filaPorId(replica, 'proyectos', proyectoId);
  if (proyecto === undefined) return [`${paso.liquidar} ${paso.proyecto}: no está en la réplica`];
  const sinVer = (paso.sinVer ?? []).map((clave) => contexto.ids.get(clave) ?? '');
  const loQueVe = sinVer.reduce((vista, id) => quitarFilaLocal(vista, 'proyectos', id), replica);
  const { fila, version } = filaParaLiquidar(replica, proyecto, paso.liquidar);
  const ajustes = ajustesDe(replica);
  const { cobrado, gastos } = totalesDelProyecto(replica, proyectoId);
  const calcular = (desde: Replica) =>
    calcularPorLaFila({
      destino: paso.liquidar,
      fecha: paso.fecha,
      cobrado,
      gastos,
      fila,
      ajustes: {
        perdidoConSueldo: ajustes?.perdido_con_sueldo ?? false,
        perdidoConDiezmo: ajustes?.perdido_con_diezmo ?? true,
      },
      liquidaciones: liquidacionesDelMesDeLaReplica(desde, proyectoId),
      coberturas: coberturasDeLaReplica(desde),
    });
  const esperado = calcular(replica);
  const vista = calcular(loQueVe);

  const aportes = aportesDelReparto(vista);
  const ids = aportes.map(() => contexto.nuevoId());
  const repartos = aportes.map((aporte, i) => ({
    id: ids[i],
    posicion: i + 1,
    tesoro_id: aporte.tesoro,
    monto_centavos: aporte.monto,
  }));
  const columnasDelPedido = columnasDeSiempre(vista);
  const enLaApertura = paso.enLaApertura === true;
  const comunes = [
    proyectoId,
    proyecto.version,
    paso.fecha,
    vista.cobrado,
    vista.gastos,
    columnasDelPedido.topeSueldo,
    columnasDelPedido.topeFijos,
    columnasDelPedido.diezmo,
    columnasDelPedido.sueldo,
    columnasDelPedido.fijos,
    columnasDelPedido.remanente,
  ];
  const finales = [
    columnasDelPedido.sueldoPrevio,
    columnasDelPedido.fijosPrevio,
    enLaApertura,
    version,
    JSON.stringify(repartos),
    JSON.stringify(previoQueVio(vista)),
  ];
  const { rows } =
    paso.liquidar === 'cobrado'
      ? await cliente.query<FilaProyecto>(
          `select ${COLUMNAS} from public.cobrar_proyecto(
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17::jsonb
           ) p`,
          [...comunes, ...finales],
        )
      : await cliente.query<FilaProyecto>(
          `select ${COLUMNAS} from public.cerrar_perdido(
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18::jsonb
           ) p`,
          [...comunes, columnasDelPedido.diezmoBp, ...finales],
        );
  const congeladoEnBase = rows[0];
  const quien = `${paso.liquidar} por la fila ${paso.proyecto}`;
  if (congeladoEnBase === undefined) return [`${quien}: sin fila`];
  if (!contexto.verificar) return [];

  const nombres = new Map(tesorosDeLaReplica(replica).map((tesoro) => [tesoro.id, tesoro.nombre]));
  const diferencias: string[] = [];
  const enBase = congelado(congeladoEnBase);
  const enDominio = esperadoPorLaFila(esperado, enLaApertura);
  if (enBase !== enDominio) diferencias.push(`${quien}: base ${enBase}, dominio ${enDominio}`);
  const filaEnBase = filaCongelada(congeladoEnBase);
  const filaEnDominio = canonico([version, fila, previoQueVio(esperado), null]);
  if (filaEnBase !== filaEnDominio) {
    diferencias.push(`${quien}: la fila en la base ${filaEnBase}, en el dominio ${filaEnDominio}`);
  }
  const repartosEnBase = (await repartosVivos(cliente, proyectoId)).join(' ');
  const repartosEnDominio = repartosEsperados(esperado, ids, nombres, enLaApertura).join(' ');
  if (repartosEnBase !== repartosEnDominio) {
    diferencias.push(
      `${quien}: repartos en la base ${repartosEnBase}, en el dominio ${repartosEnDominio}`,
    );
  }
  if (congeladoEnBase.fecha_cobro !== paso.fecha) {
    diferencias.push(
      `${quien}: se pidió el ${paso.fecha} y quedó el ${String(congeladoEnBase.fecha_cobro)}`,
    );
  }
  return diferencias;
}

async function correrPaso(cliente: pg.Client, contexto: Contexto, paso: Paso): Promise<string[]> {
  if ('ajustes' in paso) {
    await cliente.query(
      `update public.ajustes set
         sueldo_mensual_centavos = coalesce($2, sueldo_mensual_centavos),
         costos_fijos_centavos = coalesce($3, costos_fijos_centavos)
       where household_id = $1`,
      [contexto.householdId, paso.ajustes.sueldo ?? null, paso.ajustes.fijos ?? null],
    );
    return [];
  }

  if ('fila' in paso) return guardarLaFilaDelEscenario(cliente, contexto, paso.fila);

  if ('cubrir' in paso) {
    await cubrirElMes(cliente, contexto, paso.cubrir);
    return [];
  }

  const proyectoId = contexto.ids.get(paso.proyecto) ?? '';

  if ('pago' in paso) {
    await cliente.query(
      `insert into public.pagos (proyecto_id, fecha, monto_centavos) values ($1, '2026-08-02', $2)`,
      [proyectoId, paso.pago],
    );
    return [];
  }

  if ('revertir' in paso) {
    const antes = await leerProyecto(cliente, proyectoId);
    const { rows } =
      antes.estado === 'cobrado'
        ? await cliente.query<FilaProyecto>(
            `select ${COLUMNAS} from public.reabrir_proyecto($1, $2) p`,
            [proyectoId, antes.version],
          )
        : await cliente.query<FilaProyecto>(
            `select ${COLUMNAS} from public.reactivar_perdido($1, $2, $3) p`,
            [proyectoId, antes.version, paso.revertir],
          );
    const enBase = rows[0] === undefined ? 'sin fila' : congelado(rows[0]);
    const esperado = esperadoAlRevertir(antes, paso.revertir);
    const foto =
      antes.estado === 'cobrado' && antes.fila_version !== null
        ? { version: antes.fila_version, fila: antes.fila }
        : null;
    const filaEnBase = rows[0] === undefined ? 'sin fila' : filaCongelada(rows[0]);
    const filaEsperada = canonico([null, null, null, foto]);
    const quedaron = contexto.verificar ? await repartosVivos(cliente, proyectoId) : [];
    return [
      ...(enBase === esperado
        ? []
        : [`revertir ${paso.proyecto}: base ${enBase}, esperado ${esperado}`]),
      ...(filaEnBase === filaEsperada
        ? []
        : [
            `revertir ${paso.proyecto}: la fila en la base ${filaEnBase}, esperada ${filaEsperada}`,
          ]),
      ...(quedaron.length === 0
        ? []
        : [`revertir ${paso.proyecto}: quedaron repartos vivos ${quedaron.join(' ')}`]),
    ];
  }

  if (paso.porLaFila === true) return liquidarPorLaFila(cliente, contexto, paso, proyectoId);

  const preparada = await prepararLiquidacion(
    cliente,
    contexto.householdId,
    proyectoId,
    paso.liquidar,
    paso.fecha,
    (paso.sinVer ?? []).map((clave) => contexto.ids.get(clave) ?? ''),
    paso.enLaApertura === true,
  );
  const { rows } = await liquidarPreparada(cliente, preparada);
  const enBase = rows[0] === undefined ? 'sin fila' : congelado(rows[0]);
  const enDominio = esperadoAlLiquidar(preparada.esperado, preparada.enLaApertura);
  const conSuFecha =
    rows[0]?.fecha_cobro === paso.fecha
      ? []
      : [
          `${paso.liquidar} ${paso.proyecto}: se pidió el ${paso.fecha} y quedó el ${String(rows[0]?.fecha_cobro)}`,
        ];
  const filaEnBase = rows[0] === undefined ? 'sin fila' : filaCongelada(rows[0]);
  const sinFila = canonico([null, null, null, null]);
  const repartos = contexto.verificar ? await repartosVivos(cliente, proyectoId) : [];
  const sinNadaDeLaFila = [
    ...(filaEnBase === sinFila
      ? []
      : [`${paso.liquidar} ${paso.proyecto}: por el camino de antes quedó la fila ${filaEnBase}`]),
    ...(repartos.length === 0
      ? []
      : [
          `${paso.liquidar} ${paso.proyecto}: por el camino de antes quedaron repartos ${repartos.join(' ')}`,
        ]),
  ];
  return enBase === enDominio
    ? [...conSuFecha, ...sinNadaDeLaFila]
    : [
        `${paso.liquidar} ${paso.proyecto}: base ${enBase}, dominio ${enDominio}`,
        ...conSuFecha,
        ...sinNadaDeLaFila,
      ];
}

export async function compararLiquidaciones(cliente: pg.Client): Promise<string[]> {
  const diferencias: string[] = [];
  for (const escenario of ESCENARIOS_DE_LIQUIDACION) {
    await cliente.query('savepoint liquidacion');
    try {
      const contexto = await prepararEscenario(cliente, escenario);
      for (const paso of escenario.pasos) {
        const delPaso = await correrPaso(cliente, contexto, paso);
        diferencias.push(...delPaso.map((diferencia) => `"${escenario.nombre}", ${diferencia}`));
      }
    } catch (error) {
      diferencias.push(
        `"${escenario.nombre}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    await cliente.query('rollback to savepoint liquidacion');
  }
  return diferencias;
}

export async function compararSeed(cliente: pg.Client): Promise<string[]> {
  const filas = await leerProyectos(
    cliente,
    'p.household_id = $1 and p.fecha_cobro is not null order by p.dist_liquidado_at',
    [HOUSEHOLD_DEL_SEED],
  );
  if (filas.length === 0) {
    return ['el seed no tiene liquidaciones: cargalo con `pnpm --filter @maun/db db:seed`'];
  }
  const ajustes = await leerAjustes(cliente, HOUSEHOLD_DEL_SEED);
  const anteriores: LiquidacionRegistrada[] = [];
  const diferencias: string[] = [];
  for (const fila of filas) {
    const registro = registrada(fila);
    if (registro === null) {
      diferencias.push(`seed ${fila.id}: tiene fecha de liquidación y está ${fila.estado}`);
      continue;
    }
    const { cobrado, gastos } = await totales(cliente, fila.id);
    const esperado = calcularLiquidacion({
      destino: registro.estado,
      fecha: registro.fecha,
      cobrado: centavos(cobrado),
      gastos: centavos(gastos),
      ajustes,
      reapertura: null,
      liquidaciones: anteriores,
    });
    const enBase = congelado(fila);
    const enDominio = esperadoAlLiquidar(esperado, false);
    if (enBase !== enDominio)
      diferencias.push(`seed ${fila.id}: base ${enBase}, dominio ${enDominio}`);
    anteriores.push(registro);
  }
  return diferencias;
}

interface FilaDelLibro {
  origen: string;
  asiento_id: string;
  fecha: string;
  tesoro: string | null;
  contrapartida: string | null;
  tesoro_id: string;
  contrapartida_id: string | null;
  monto_centavos: string;
  concepto: string;
  categoria: string;
  descripcion: string;
  proyecto_id: string | null;
  ya_en_la_apertura: boolean;
}

const COLUMNAS_DEL_LIBRO = `origen, asiento_id, fecha::text as fecha, tesoro::text as tesoro,
  contrapartida::text as contrapartida, tesoro_id, contrapartida_id,
  monto_centavos::text as monto_centavos, concepto, categoria, descripcion, proyecto_id,
  ya_en_la_apertura`;

function comoTextoSql(fila: FilaDelLibro): string {
  return JSON.stringify([
    fila.origen,
    fila.asiento_id,
    fila.fecha,
    fila.tesoro,
    fila.contrapartida,
    fila.tesoro_id,
    fila.contrapartida_id,
    Number(fila.monto_centavos),
    fila.concepto,
    fila.categoria,
    fila.descripcion,
    fila.proyecto_id,
    fila.ya_en_la_apertura,
  ]);
}

function comoTextoTs(asiento: Asiento): string {
  return JSON.stringify([
    asiento.origen,
    asiento.asientoId,
    asiento.fecha,
    asiento.tesoro,
    asiento.contrapartida,
    asiento.tesoroId,
    asiento.contrapartidaId,
    asiento.monto,
    asiento.concepto,
    asiento.categoria,
    asiento.descripcion,
    asiento.proyectoId,
    asiento.yaEnLaApertura,
  ]);
}

function diferenciasDeMultiset(enSql: readonly string[], enTs: readonly string[]): string[] {
  const cuenta = new Map<string, number>();
  for (const fila of enSql) cuenta.set(fila, (cuenta.get(fila) ?? 0) + 1);
  for (const fila of enTs) cuenta.set(fila, (cuenta.get(fila) ?? 0) - 1);

  const diferencias: string[] = [];
  for (const [fila, saldo] of [...cuenta].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (saldo > 0) diferencias.push(`solo en SQL (${String(saldo)}x): ${fila}`);
    if (saldo < 0) diferencias.push(`solo en TS (${String(-saldo)}x): ${fila}`);
  }
  return diferencias;
}

async function replicaDeLaBase(cliente: pg.Client, usuarioId: string): Promise<Replica> {
  const { rows } = await cliente.query<{ lote: unknown }>('select public.bootstrap() as lote');
  return aplicarLote(replicaVacia(usuarioId), leerLote(rows[0]?.lote), 'reconcile', 0);
}

async function asientosDeLaReplica(cliente: pg.Client, usuarioId: string): Promise<Asiento[]> {
  return asientosDelLibro(datosDelLibro(await replicaDeLaBase(cliente, usuarioId)));
}

async function compararApertura(
  cliente: pg.Client,
  contexto: Contexto,
  replica: Replica,
): Promise<string[]> {
  const { rows } = await cliente.query<{ fecha: string | null }>(
    'select private.fecha_de_apertura($1)::text as fecha',
    [contexto.householdId],
  );
  const enSql = rows[0]?.fecha ?? null;
  const enTs = fechaDeApertura(datosDelLibro(replica).movimientos);
  return enSql === enTs ? [] : [`apertura: SQL ${String(enSql)}, TS ${String(enTs)}`];
}

async function leerLibro(cliente: pg.Client, householdId: string): Promise<FilaDelLibro[]> {
  const { rows } = await cliente.query<FilaDelLibro>(
    `select ${COLUMNAS_DEL_LIBRO} from public.libro_mayor where household_id = $1`,
    [householdId],
  );
  return rows;
}

async function compararSaldos(
  cliente: pg.Client,
  householdId: string,
  asientos: readonly Asiento[],
): Promise<string[]> {
  const { rows } = await cliente.query<{ tesoro: string; saldo: string }>(
    `select t.tesoro::text as tesoro, coalesce(sum(l.monto_centavos), 0)::text as saldo
     from unnest(enum_range(null::public.tesoro)) as t (tesoro)
     left join public.libro_mayor l
       on l.tesoro = t.tesoro and l.household_id = $1 and not l.ya_en_la_apertura
     group by t.tesoro`,
    [householdId],
  );
  const enTs = saldosPorTesoro(asientos);
  const porClave = TESOROS.flatMap((tesoro) => {
    const enSql = Number(rows.find((fila) => fila.tesoro === tesoro)?.saldo ?? NaN);
    return enSql === enTs[tesoro]
      ? []
      : [`saldo de ${tesoro}: SQL ${String(enSql)}, TS ${String(enTs[tesoro])}`];
  });

  const { rows: porIdEnSql } = await cliente.query<{ tesoro_id: string; saldo: string }>(
    `select l.tesoro_id, sum(l.monto_centavos)::text as saldo
     from public.libro_mayor l
     where l.household_id = $1 and not l.ya_en_la_apertura
     group by l.tesoro_id`,
    [householdId],
  );
  const enSqlPorId = new Map(porIdEnSql.map((fila) => [fila.tesoro_id, Number(fila.saldo)]));
  const enTsPorId = saldosPorId(asientos);
  const ids = [...new Set([...enSqlPorId.keys(), ...enTsPorId.keys()])].sort();
  const porId = ids.flatMap((id) => {
    const enSql = enSqlPorId.get(id);
    const enDominio = enTsPorId.get(id);
    return enSql === enDominio
      ? []
      : [`saldo del tesoro ${id}: SQL ${String(enSql)}, TS ${String(enDominio)}`];
  });
  return [...porClave, ...porId];
}

const MOVIMIENTOS_DE_TODOS_LOS_TIPOS: MovimientoDeEscenario[] = [
  {
    tipo: 'ingreso',
    origen: null,
    destino: 'hogar',
    monto: 12_000_000,
    fecha: '2026-09-01',
    categoria: 'Otros ingresos',
    descripcion: 'una changa',
  },
  {
    tipo: 'gasto',
    origen: 'hogar',
    destino: null,
    monto: 3_500_000,
    fecha: '2026-09-02',
    categoria: 'Supermercado',
  },
  {
    tipo: 'transferencia',
    origen: 'maun',
    destino: 'hogar',
    monto: 8_000_000,
    fecha: '2026-09-03',
  },
  { tipo: 'pago_diezmo', origen: 'diezmo', destino: null, monto: 2_400_000, fecha: '2026-09-04' },
  { tipo: 'aporte_cocos', origen: 'maun', destino: 'cocos', monto: 5_000_000, fecha: '2026-09-05' },
  { tipo: 'ajuste', origen: null, destino: 'cocos', monto: 900_000, fecha: '2026-09-06' },
  { tipo: 'ajuste', origen: 'cocos', destino: null, monto: 700_000, fecha: '2026-09-07' },
  {
    tipo: 'ingreso',
    origen: null,
    destino: 'maun',
    monto: 99_000_000,
    fecha: '2026-09-08',
    descripcion: 'borrado: no va al libro',
    borrado: true,
  },
  {
    tipo: 'transferencia',
    origen: 'hogar',
    destino: 'diezmo',
    monto: 77_000_000,
    fecha: '2026-09-09',
    descripcion: 'borrado de los dos lados',
    borrado: true,
  },
];

export const ESCENARIOS_DEL_LIBRO: EscenarioDeLiquidacion[] = [
  {
    nombre: 'los seis tipos de movimiento, con borrados que no tienen que aparecer',
    ajustes: { sueldo: 180_000_000, fijos: 25_000_000 },
    proyectos: {},
    pasos: [],
    movimientos: MOVIMIENTOS_DE_TODOS_LOS_TIPOS,
  },
  {
    nombre: 'un proyecto borrado se lleva sus pagos y sus gastos del libro',
    ajustes: { sueldo: 180_000_000, fijos: 25_000_000 },
    proyectos: {
      vivo: { estado: 'en_curso', pagos: [40_000_000, 10_000_000], gastos: [12_000_000] },
      muerto: { estado: 'en_curso', pagos: [90_000_000], gastos: [30_000_000], borrado: true },
      conFilasBorradas: {
        estado: 'en_curso',
        pagos: [20_000_000],
        gastos: [],
        pagosBorrados: [55_000_000],
        gastosBorrados: [44_000_000],
      },
    },
    pasos: [],
    movimientos: MOVIMIENTOS_DE_TODOS_LOS_TIPOS,
  },
  {
    nombre: 'el diezmo de un perdido mueve plata igual que el de un cobrado',
    ajustes: { sueldo: 180_000_000, fijos: 25_000_000 },
    proyectos: {
      cobrado: { estado: 'entregado', pagos: [300_000_000], gastos: [40_000_000] },
      perdido: { estado: 'presupuesto_enviado', pagos: [20_000_000], gastos: [1_500_000] },
      perdidoSinSena: { estado: 'contacto', pagos: [], gastos: [] },
    },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'cobrado', fecha: '2026-09-10' },
      { liquidar: 'perdido', proyecto: 'perdido', fecha: '2026-09-11' },
      { liquidar: 'perdido', proyecto: 'perdidoSinSena', fecha: '2026-09-12' },
    ],
    movimientos: MOVIMIENTOS_DE_TODOS_LOS_TIPOS,
  },
  {
    nombre: 'un perdido con sueldo y sin diezmo, y un cobro con pérdida: los ceros no dan asiento',
    ajustes: {
      sueldo: 180_000_000,
      fijos: 25_000_000,
      perdidoConSueldo: true,
      perdidoConDiezmo: false,
    },
    proyectos: {
      lead: { estado: 'relevamiento', pagos: [6_000_000], gastos: [800_000] },
      enPerdida: { estado: 'entregado', pagos: [1_000_000], gastos: [9_000_000] },
    },
    pasos: [
      { liquidar: 'perdido', proyecto: 'lead', fecha: '2026-09-13' },
      { liquidar: 'cobrado', proyecto: 'enPerdida', fecha: '2026-09-14' },
    ],
  },
  {
    nombre:
      'lo de antes de la apertura queda en el libro con su fecha y no mueve los tesoros; lo destildado sí',
    apertura: '2026-09-14',
    ajustes: { sueldo: 180_000_000, fijos: 25_000_000 },
    proyectos: {
      marcado: {
        estado: 'entregado',
        pagos: [60_000_000, 40_000_000],
        gastos: [5_000_000],
        fechaDeLosPagos: '2026-07-10',
        pagosEnLaApertura: true,
      },
      destildado: {
        estado: 'entregado',
        pagos: [30_000_000],
        gastos: [],
        fechaDeLosPagos: '2026-07-12',
      },
      nuevo: { estado: 'en_curso', pagos: [20_000_000], gastos: [], fechaDeLosPagos: '2026-09-20' },
    },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'marcado', fecha: '2026-07-10', enLaApertura: true },
      { liquidar: 'cobrado', proyecto: 'destildado', fecha: '2026-07-12' },
    ],
    movimientos: MOVIMIENTOS_DE_TODOS_LOS_TIPOS,
  },
  {
    nombre: 'reabrir un cobro lo saca del libro y volver a cobrarlo lo devuelve',
    ajustes: { sueldo: 50_000_000, fijos: 25_000_000 },
    proyectos: { p: { estado: 'entregado', pagos: [120_000_000], gastos: [10_000_000] } },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p', fecha: '2026-09-15' },
      { revertir: 'entregado', proyecto: 'p' },
      { pago: 30_000_000, proyecto: 'p' },
      { liquidar: 'cobrado', proyecto: 'p', fecha: '2026-09-16' },
    ],
    movimientos: MOVIMIENTOS_DE_TODOS_LOS_TIPOS,
  },
  {
    nombre: 'los movimientos entre los tesoros del dueño llegan al libro por id, sin clave',
    tesoros: ['Herramientas', 'Viajes'],
    ajustes: { sueldo: 180_000_000, fijos: 25_000_000 },
    proyectos: {},
    pasos: [],
    movimientos: [
      ...MOVIMIENTOS_DE_TODOS_LOS_TIPOS,
      {
        tipo: 'ingreso',
        origen: null,
        destino: 'Herramientas',
        monto: 5_000_000,
        fecha: '2026-09-01',
      },
      {
        tipo: 'transferencia',
        origen: 'maun',
        destino: 'Herramientas',
        monto: 3_000_000,
        fecha: '2026-09-02',
      },
      {
        tipo: 'transferencia',
        origen: 'Herramientas',
        destino: 'Viajes',
        monto: 2_000_000,
        fecha: '2026-09-03',
      },
      { tipo: 'gasto', origen: 'Viajes', destino: null, monto: 500_000, fecha: '2026-09-04' },
      {
        tipo: 'transferencia',
        origen: 'Viajes',
        destino: 'hogar',
        monto: 1_000_000,
        fecha: '2026-09-05',
      },
      {
        tipo: 'ajuste',
        origen: null,
        destino: 'Herramientas',
        monto: 100_000,
        fecha: '2026-09-06',
      },
      {
        tipo: 'transferencia',
        origen: 'Herramientas',
        destino: 'Viajes',
        monto: 9_000_000,
        fecha: '2026-09-07',
        borrado: true,
      },
    ],
  },
];

export async function compararLibroMayor(cliente: pg.Client): Promise<string[]> {
  const diferencias: string[] = [];
  for (const escenario of [...ESCENARIOS_DEL_LIBRO, ...ESCENARIOS_DE_LIQUIDACION]) {
    await cliente.query('savepoint libro');
    try {
      const contexto = { ...(await prepararEscenario(cliente, escenario)), verificar: false };
      for (const paso of escenario.pasos) await correrPaso(cliente, contexto, paso);
      const replica = await replicaDeLaBase(cliente, contexto.usuarioId);
      const asientos = asientosDelLibro(datosDelLibro(replica));
      const filas = await leerLibro(cliente, contexto.householdId);
      const delEscenario = [
        ...diferenciasDeMultiset(filas.map(comoTextoSql), asientos.map(comoTextoTs)),
        ...(await compararSaldos(cliente, contexto.householdId, asientos)),
        ...(await compararApertura(cliente, contexto, replica)),
      ];
      diferencias.push(...delEscenario.map((linea) => `"${escenario.nombre}", ${linea}`));
    } catch (error) {
      diferencias.push(
        `"${escenario.nombre}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    await cliente.query('rollback to savepoint libro');
  }
  return diferencias;
}

export async function compararLibroDelSeed(cliente: pg.Client): Promise<string[]> {
  const filas = await leerLibro(cliente, HOUSEHOLD_DEL_SEED);
  if (filas.length === 0) {
    return ['el seed no tiene asientos: cargalo con `pnpm --filter @maun/db db:seed`'];
  }

  await cliente.query('savepoint libro_del_seed');
  const { rows: usuario } = await cliente.query<{ id: string }>(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
     values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
             'libro-del-seed@maun.test', '', now(), now())
     returning id`,
  );
  const usuarioId = usuario[0]?.id ?? '';
  await cliente.query(
    `insert into public.household_members (household_id, user_id, rol) values ($1, $2, 'titular')`,
    [HOUSEHOLD_DEL_SEED, usuarioId],
  );

  await cliente.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: usuarioId, role: 'authenticated' }),
  ]);
  await cliente.query("select set_config('role', 'authenticated', true)");
  const asientos = await asientosDeLaReplica(cliente, usuarioId);
  const saldos = await compararSaldos(cliente, HOUSEHOLD_DEL_SEED, asientos);
  await cliente.query('rollback to savepoint libro_del_seed');

  return [
    ...diferenciasDeMultiset(filas.map(comoTextoSql), asientos.map(comoTextoTs)),
    ...saldos,
  ].map((linea) => `libro del seed, ${linea}`);
}

export interface PasoDeGuardado {
  titulo: string;
  estado: EstadoProyecto;
  pagos: readonly (readonly [string, number, boolean?])[];
  gastos: readonly (readonly [string, number, boolean?])[];
}

export interface EscenarioDeGuardado {
  nombre: string;
  pasos: readonly PasoDeGuardado[];
}

export const ESCENARIOS_DE_GUARDADO: EscenarioDeGuardado[] = [
  {
    nombre: 'el alta con dos pagos y dos gastos, en una sola llamada',
    pasos: [
      {
        titulo: 'Placard',
        estado: 'en_curso',
        pagos: [
          ['sena', 40_000_000],
          ['adelanto', 20_000_000],
        ],
        gastos: [
          ['melamina', 30_000_000],
          ['herrajes', 5_000_000],
        ],
      },
    ],
  },
  {
    nombre: 'editar sacando un pago y agregando un gasto',
    pasos: [
      {
        titulo: 'Vanitory',
        estado: 'en_curso',
        pagos: [
          ['sena', 40_000_000],
          ['adelanto', 20_000_000],
        ],
        gastos: [['guayubira', 30_000_000]],
      },
      {
        titulo: 'Vanitory colgante',
        estado: 'entregado',
        pagos: [
          ['sena', 40_000_000],
          ['adelanto', 20_000_000, true],
        ],
        gastos: [
          ['guayubira', 30_000_000],
          ['flete', 8_000_000],
        ],
      },
    ],
  },
  {
    nombre: 'un proyecto que nace sin pagos ni gastos y después los suma',
    pasos: [
      { titulo: 'Biblioteca', estado: 'en_curso', pagos: [], gastos: [] },
      {
        titulo: 'Biblioteca',
        estado: 'en_curso',
        pagos: [['sena', 15_000_000]],
        gastos: [['mdf', 3_000_000]],
      },
    ],
  },
  {
    nombre: 'corregirle el monto a un pago ya guardado y sacar todos los gastos',
    pasos: [
      {
        titulo: 'Escritorio',
        estado: 'en_curso',
        pagos: [['sena', 12_000_000]],
        gastos: [
          ['tablero', 4_000_000],
          ['pasacables', 500_000],
        ],
      },
      {
        titulo: 'Escritorio',
        estado: 'en_curso',
        pagos: [['sena', 18_500_000]],
        gastos: [
          ['tablero', 4_000_000, true],
          ['pasacables', 500_000, true],
        ],
      },
    ],
  },
];

function idDelEscenario(clave: string, ids: Map<string, string>): string {
  const existente = ids.get(clave);
  if (existente !== undefined) return existente;
  const nuevo = `11111111-0000-7000-8000-${String(ids.size + 1).padStart(12, '0')}`;
  ids.set(clave, nuevo);
  return nuevo;
}

async function guardarPorRpc(
  cliente: pg.Client,
  contexto: Contexto,
  proyectoId: string,
  version: number | null,
  paso: PasoDeGuardado,
): Promise<ProyectoGuardado> {
  const hija = ([clave, monto, borrado]: readonly [string, number, boolean?]) => ({
    id: idDelEscenario(clave, contexto.ids),
    fecha: '2026-08-01',
    monto_centavos: monto,
    borrado: borrado === true,
  });

  const { rows } = await cliente.query<{ agregado: unknown }>(
    'select public.guardar_proyecto($1::jsonb, $2::jsonb, $3::jsonb) as agregado',
    [
      JSON.stringify({
        id: proyectoId,
        version,
        cliente_id: contexto.clienteId,
        titulo: paso.titulo,
        descripcion: '',
        estado: paso.estado,
        presupuesto_centavos: 120_000_000,
        forma_pago: 'transferencia',
        comprobante: 'remito',
        fecha_visita: null,
        ultimo_contacto: null,
        fecha_inicio: '2026-08-01',
        entrega_estimada: '2026-08-31',
        fecha_entrega: null,
        direccion_entrega: 'Olazábal 1240',
        notas: '',
      }),
      JSON.stringify(paso.pagos.map((pago) => ({ ...hija(pago), concepto: 'Seña' }))),
      JSON.stringify(paso.gastos.map((gasto) => ({ ...hija(gasto), descripcion: 'Insumo' }))),
    ],
  );
  return leerProyectoGuardado(rows[0]?.agregado);
}

async function idsVivos(cliente: pg.Client, tabla: string, proyectoId: string): Promise<string[]> {
  const { rows } = await cliente.query<{ id: string }>(
    `select id from public.${tabla} where proyecto_id = $1 and deleted_at is null order by id`,
    [proyectoId],
  );
  return rows.map((fila) => fila.id);
}

async function compararRespuesta(
  cliente: pg.Client,
  proyectoId: string,
  guardado: ProyectoGuardado,
): Promise<string[]> {
  const diferencias: string[] = [];
  for (const [tabla, filas] of [
    ['pagos', guardado.pagos],
    ['gastos', guardado.gastos],
  ] as const) {
    const enSql = JSON.stringify(await idsVivos(cliente, tabla, proyectoId));
    const devueltos = JSON.stringify(
      filas
        .filter((fila) => fila.deleted_at === null)
        .map((fila) => fila.id)
        .sort(),
    );
    if (enSql !== devueltos) {
      diferencias.push(`${tabla} vivos: la base tiene ${enSql}, la respuesta trae ${devueltos}`);
    }
  }
  return diferencias;
}

async function compararTotalesDelProyecto(
  cliente: pg.Client,
  contexto: Contexto,
  proyectoId: string,
): Promise<string[]> {
  const enSql = await totales(cliente, proyectoId);
  const enTs = totalesDelProyecto(await replicaDeLaBase(cliente, contexto.usuarioId), proyectoId);
  const diferencias: string[] = [];
  if (enTs.cobrado !== enSql.cobrado) {
    diferencias.push(`cobrado: SQL ${String(enSql.cobrado)}, TS ${String(enTs.cobrado)}`);
  }
  if (enTs.gastos !== enSql.gastos) {
    diferencias.push(`gastos: SQL ${String(enSql.gastos)}, TS ${String(enTs.gastos)}`);
  }
  return diferencias;
}

export async function compararGuardadoDeProyecto(cliente: pg.Client): Promise<string[]> {
  const diferencias: string[] = [];
  for (const escenario of ESCENARIOS_DE_GUARDADO) {
    await cliente.query('savepoint guardado');
    try {
      const contexto = await prepararEscenario(cliente, {
        nombre: escenario.nombre,
        ajustes: { sueldo: 180_000_000, fijos: 25_000_000 },
        proyectos: {},
        pasos: [],
      });
      const proyectoId = idDelEscenario('proyecto', contexto.ids);
      let version: number | null = null;

      for (const paso of escenario.pasos) {
        const guardado = await guardarPorRpc(cliente, contexto, proyectoId, version, paso);
        version = guardado.proyecto.version;
        diferencias.push(
          ...(await compararRespuesta(cliente, proyectoId, guardado)).map(
            (linea) => `"${escenario.nombre}", ${linea}`,
          ),
        );
      }

      const asientos = await asientosDeLaReplica(cliente, contexto.usuarioId);
      const filas = await leerLibro(cliente, contexto.householdId);
      const delEscenario = [
        ...(await compararTotalesDelProyecto(cliente, contexto, proyectoId)),
        ...diferenciasDeMultiset(filas.map(comoTextoSql), asientos.map(comoTextoTs)),
        ...(await compararSaldos(cliente, contexto.householdId, asientos)),
      ];
      diferencias.push(...delEscenario.map((linea) => `"${escenario.nombre}", ${linea}`));
    } catch (error) {
      diferencias.push(
        `"${escenario.nombre}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    await cliente.query('rollback to savepoint guardado');
  }
  return diferencias;
}

export async function compararDominioYSql(cliente: pg.Client): Promise<string[]> {
  return [
    ...(await compararCascada(cliente)),
    ...(await compararTopes(cliente)),
    ...(await compararPagosPorDelante(cliente)),
    ...(await compararSenaEsperada(cliente)),
    ...(await compararFormasDeCobro(cliente)),
    ...(await compararLinkDeCobro(cliente)),
    ...(await compararLinkDeResena(cliente)),
    ...(await compararLinksDeLasRedes(cliente)),
    ...(await compararNombreDeNecesidad(cliente)),
    ...(await compararValidacionDeRespuestas(cliente)),
    ...(await compararValidacionDeRespuestasDeEntrega(cliente)),
    ...(await compararRangos(cliente)),
    ...(await compararFila(cliente)),
    ...(await compararEstados(cliente)),
    ...(await compararTransiciones(cliente)),
    ...(await compararLiquidaciones(cliente)),
    ...(await compararLibroMayor(cliente)),
    ...(await compararGuardadoDeProyecto(cliente)),
  ];
}

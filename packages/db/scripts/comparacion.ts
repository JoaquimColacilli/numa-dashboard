import {
  asientosDelLibro,
  borradorNuevo,
  calcularDistribucion,
  calcularLiquidacion,
  calcularPorLaFila,
  calcularSena,
  centavos,
  centavosEn,
  columnasDeSiempre,
  COMBINACIONES_DE_LA_MONEDA,
  condicionIvaDelReceptor,
  CONDICIONES_DEL_RECEPTOR,
  cotizacion,
  cuitValido,
  DIEZMO,
  dolaresDePesos,
  documentoDelPresupuesto,
  documentoDelReceptor,
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
  GRUPOS_DE_CLAUSULAS,
  LARGO_MAXIMO_DEL_NOMBRE,
  leerLaFila,
  letraDeLaOpcion,
  loQueDescuenta,
  loQueFaltaParaFacturar,
  loVistoEsOtro,
  MONEDA_DEL_TALLER,
  MONEDAS,
  pagosPorDelante,
  pesosDeDolares,
  PLANTILLA_DE_SIEMPRE,
  planDelReparto,
  previoDelMes,
  previoQueVio,
  primerProblemaDeLaFila,
  problemaDeLaPlantilla,
  problemaDelBorrador,
  problemaDelDocumento,
  problemasParaMandar,
  puedeCambiarEstado,
  puedeLiquidar,
  puedeRevertir,
  puntosBasicos,
  REDES_DEL_TALLER,
  repartir,
  repartosDelCobro,
  revisarLaRed,
  saldosPorId,
  saldosPorTesoro,
  SEGMENTOS_QUE_NO_SON_UN_PERFIL,
  TESOROS,
  topesDeLaLiquidacion,
  totalEnPesos,
  validarRespuesta,
  validarRespuestaDeEntrega,
  valoresDelTrabajo,
  valorEnPesos,
  type AjustesDeLiquidacion,
  type Asiento,
  type BaseDeLaObligacion,
  type BorradorDelPresupuesto,
  type ClaseDePaso,
  type CondicionDelReceptor,
  type DatosDelTaller,
  type DatosParaFacturar,
  type Distribucion,
  type DocumentoDelPresupuesto,
  type DocumentoEnPesos,
  type EntradaCascada,
  type EstadoLiquidado,
  type EstadoProyecto,
  type Fila,
  type FormaDeCobro,
  type FormaDeCoordinar,
  type Formatos,
  type ImporteDeUnPago,
  type Liquidacion,
  type LiquidacionPorLaFila,
  type LiquidacionRegistrada,
  type ModoDePaso,
  type Moneda,
  type Money,
  type OpcionDelTrabajo,
  type PlanDelReparto,
  type PreguntaDeLaEncuesta,
  type PuntosBasicos,
  type Reapertura,
  type RedDelTaller,
  type Reparto,
  type TesoroDeLaFila,
  type TesorosDelSistema,
  type ValoresDelPresupuesto,
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
  type FilaDe,
  type Replica,
} from '../src/replica.ts';
import {
  leerProyectoGuardado,
  pedidoDeLaFila,
  type ProyectoGuardado,
} from '../src/sincronizacion.ts';
import {
  datosDelLibro,
  entradaDeLaLiquidacion,
  filaDelTaller,
  reaperturaDeLaFila,
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

type CasoDeConversion = readonly [number, number];

const CONVERSIONES_FIJAS: readonly CasoDeConversion[] = [
  [0, 100],
  [1, 100],
  [1, 149],
  [1, 150],
  [1, 151],
  [3, 150],
  [1, 200],
  [3, 200],
  [50, 101],
  [99, 333],
  [12_000_000, 145_000],
  [91_724, 145_000],
  [40_000, 150_000],
  [50_000, 154_050],
  [1, 10_000_000],
  [100_000_000, 10_000_000],
  [1_000_000_000_000, 100],
  [-1, 145_000],
];

function conversionesAlAzar(): CasoDeConversion[] {
  const siguiente = generador(20_261_011);
  return Array.from({ length: 2_000 }, () => {
    const valor = 100 + siguiente(9_999_901);
    const importe = siguiente(4) === 0 ? siguiente(1_000) : siguiente(100_000_000);
    return [importe, valor] as const;
  });
}

interface CasoDeUnPago {
  moneda: Moneda;
  monto: number;
  cotizacion: number | null;
  monedaDelTrabajo: Moneda;
}

function importeDeUnPagoDelCaso(caso: CasoDeUnPago): ImporteDeUnPago {
  const valor = caso.cotizacion === null ? null : cotizacion(caso.cotizacion);
  return caso.moneda === 'USD'
    ? { moneda: 'USD', monto: centavosEn('USD', caso.monto), cotizacion: valor }
    : { moneda: 'ARS', monto: centavos(caso.monto), cotizacion: valor };
}

function pagosAlAzar(): CasoDeUnPago[] {
  const siguiente = generador(20_261_012);
  const casos: CasoDeUnPago[] = [];
  for (const moneda of MONEDAS) {
    for (const monedaDelTrabajo of MONEDAS) {
      casos.push({ moneda, monto: 12_000_000, cotizacion: null, monedaDelTrabajo });
      casos.push({ moneda, monto: 1, cotizacion: 150, monedaDelTrabajo });
      for (let i = 0; i < 300; i++) {
        casos.push({
          moneda,
          monto: siguiente(100_000_000),
          cotizacion: siguiente(10) === 0 ? null : 100 + siguiente(9_999_901),
          monedaDelTrabajo,
        });
      }
    }
  }
  return casos;
}

export async function compararConversiones(cliente: pg.Client): Promise<string[]> {
  await cliente.query(RECHAZO_DE_LA_GEMELA);
  const conversiones = await compararGemela<CasoDeConversion, readonly [number, number]>(cliente, {
    nombre: 'conversión',
    casos: [...CONVERSIONES_FIJAS, ...conversionesAlAzar()],
    ts: ([importe, valor]) => [
      pesosDeDolares(centavosEn('USD', importe), cotizacion(valor)),
      dolaresDePesos(centavos(importe), cotizacion(valor)),
    ],
    sql: `select private.pesos_de_dolares((c.caso ->> 0)::bigint, (c.caso ->> 1)::bigint)::text as pesos,
                 private.dolares_de_pesos((c.caso ->> 0)::bigint, (c.caso ->> 1)::bigint)::text as dolares
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          order by c.orden`,
    enJson: (caso) => JSON.stringify(caso),
    deSql: (fila) => JSON.stringify([Number(fila.pesos), Number(fila.dolares)]),
    deTs: (valor) => JSON.stringify(valor),
  });

  const pagos = await compararGemela<CasoDeUnPago, readonly [number, number]>(cliente, {
    nombre: 'las dos cuentas de un pago',
    casos: pagosAlAzar(),
    ts: (caso) => {
      const pago = importeDeUnPagoDelCaso(caso);
      return [valorEnPesos(pago), loQueDescuenta(pago, caso.monedaDelTrabajo)];
    },
    sql: `select private.valor_en_pesos(
                   c.caso ->> 'moneda', (c.caso ->> 'monto')::bigint, (c.caso ->> 'cotizacion')::bigint
                 )::text as pesos,
                 private.lo_que_descuenta(
                   c.caso ->> 'moneda', (c.caso ->> 'monto')::bigint, (c.caso ->> 'cotizacion')::bigint,
                   c.caso ->> 'monedaDelTrabajo'
                 )::text as descuenta
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          order by c.orden`,
    enJson: (caso) => JSON.stringify(caso),
    deSql: (fila) => JSON.stringify([Number(fila.pesos), Number(fila.descuenta)]),
    deTs: (valor) => JSON.stringify(valor),
  });

  return [...conversiones, ...pagos];
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

const SISTEMA_DE_LA_FILA: TesorosDelSistema = {
  hogar: idDeLaFila(0),
  maun: idDeLaFila(1),
  diezmo: idDeLaFila(2),
};

function metaDeLaFila(valor: number | null): Money | null {
  return valor === null ? null : centavos(valor);
}

const TESOROS_DE_LA_FILA: readonly TesoroDeLaFila[] = [
  { id: idDeLaFila(0), clave: 'hogar', archivado: false, meta: null },
  { id: idDeLaFila(1), clave: 'maun', archivado: false, meta: null },
  { id: idDeLaFila(2), clave: 'diezmo', archivado: false, meta: null },
  { id: idDeLaFila(3), clave: 'cocos', archivado: false, meta: metaDeLaFila(100_000_000) },
  { id: idDeLaFila(4), clave: null, archivado: false, meta: metaDeLaFila(30_000_000) },
  { id: idDeLaFila(5), clave: null, archivado: false, meta: null },
  { id: idDeLaFila(6), clave: null, archivado: false, meta: metaDeLaFila(0) },
  { id: idDeLaFila(7), clave: null, archivado: false, meta: metaDeLaFila(1) },
  { id: idDeLaFila(8), clave: null, archivado: false, meta: metaDeLaFila(200_000_000) },
  { id: idDeLaFila(9), clave: null, archivado: false, meta: null },
  { id: idDeLaFila(10), clave: null, archivado: true, meta: metaDeLaFila(5_000_000) },
  { id: idDeLaFila(11), clave: null, archivado: false, meta: null, moneda: 'USD' },
];

function tesoroDelCaso(indice: number): string {
  return `00000000-0000-7000-8000-${String(100 + indice).padStart(12, '0')}`;
}

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

function textosONull(valores: readonly unknown[]): (number | null)[] {
  return valores.map((valor) => (valor === null ? null : Number(valor)));
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

function enterosAlAzar(escala: number): string[] {
  const siguiente = generador(20_260_927);
  const casos: string[] = [];
  for (let i = 0; i < 600 * escala; i++) {
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
  const fila = leerLaFila(
    {
      pasos: [],
      reparto: [{ tesoro: idDeLaFila(4), porcentaje: JSON.parse(texto) as unknown }],
      sueldoPorTrabajo: false,
    },
    SISTEMA_DE_LA_FILA,
  );
  return fila?.reparto[0]?.porcentaje ?? null;
}

interface ObligacionDelCaso {
  porcentaje: number;
  base: string;
}

interface PasoDelCaso {
  objetivo: number;
  previo: number;
  porMes: boolean;
}

interface ParteDelCaso {
  porcentaje: number;
  tope: number | null;
}

interface CasoDelReparto {
  cobrado: number;
  gastos: number;
  obligaciones: ObligacionDelCaso[];
  pasos: PasoDelCaso[];
  partes: ParteDelCaso[];
}

const DEL_DIEZMO: ObligacionDelCaso = { porcentaje: 1000, base: 'ingreso' };

function sinTope(porcentajes: readonly number[]): ParteDelCaso[] {
  return porcentajes.map((porcentaje) => ({ porcentaje, tope: null }));
}

const REPARTOS_FIJOS: readonly CasoDelReparto[] = [
  { cobrado: 0, gastos: 0, obligaciones: [DEL_DIEZMO], pasos: [], partes: [] },
  {
    cobrado: 200_000_000,
    gastos: 20_000_000,
    obligaciones: [DEL_DIEZMO],
    pasos: [
      { objetivo: 100_000_000, previo: 0, porMes: true },
      { objetivo: 30_000_000, previo: 0, porMes: true },
      { objetivo: 5_000_000, previo: 0, porMes: true },
    ],
    partes: sinTope([5000, 3000]),
  },
  {
    cobrado: 50_000_000,
    gastos: 80_000_000,
    obligaciones: [{ porcentaje: 350, base: 'cobrado' }, DEL_DIEZMO],
    pasos: [{ objetivo: 100_000_000, previo: 0, porMes: true }],
    partes: [{ porcentaje: 5000, tope: 1_000 }],
  },
  {
    cobrado: 60_000_000,
    gastos: 0,
    obligaciones: [DEL_DIEZMO],
    pasos: [
      { objetivo: 100_000_000, previo: 100_000_000, porMes: true },
      { objetivo: 30_000_000, previo: 8_000_000, porMes: true },
      { objetivo: 5_000_000, previo: 9_000_000, porMes: false },
    ],
    partes: sinTope([10_000]),
  },
  {
    cobrado: 9_007_199_254_740_991,
    gastos: 0,
    obligaciones: [{ porcentaje: 0, base: 'ingreso' }],
    pasos: [],
    partes: sinTope([1]),
  },
  {
    cobrado: 9_007_199_254_735,
    gastos: 0,
    obligaciones: [DEL_DIEZMO],
    pasos: [{ objetivo: 9_007_199_254_740_991, previo: 9_007_199_254_740_991, porMes: true }],
    partes: [],
  },
  { cobrado: -1, gastos: 0, obligaciones: [DEL_DIEZMO], pasos: [], partes: [] },
  { cobrado: 0, gastos: -1, obligaciones: [DEL_DIEZMO], pasos: [], partes: [] },
  { cobrado: 9_007_199_254_740_992, gastos: 0, obligaciones: [DEL_DIEZMO], pasos: [], partes: [] },
  {
    cobrado: 100,
    gastos: 0,
    obligaciones: [{ porcentaje: -1, base: 'ingreso' }],
    pasos: [],
    partes: [],
  },
  {
    cobrado: 100,
    gastos: 0,
    obligaciones: [{ porcentaje: 10_001, base: 'cobrado' }],
    pasos: [],
    partes: [],
  },
  {
    cobrado: 100,
    gastos: 0,
    obligaciones: [{ porcentaje: 350, base: 'neta' }],
    pasos: [],
    partes: [],
  },
  {
    cobrado: 100,
    gastos: 0,
    obligaciones: [DEL_DIEZMO],
    pasos: [{ objetivo: -1, previo: 0, porMes: true }],
    partes: [],
  },
  {
    cobrado: 100,
    gastos: 0,
    obligaciones: [DEL_DIEZMO],
    pasos: [{ objetivo: 10, previo: -1, porMes: true }],
    partes: [],
  },
  {
    cobrado: 100,
    gastos: 0,
    obligaciones: [DEL_DIEZMO],
    pasos: [{ objetivo: 9_007_199_254_740_992, previo: 0, porMes: false }],
    partes: [],
  },
  { cobrado: 100, gastos: 0, obligaciones: [DEL_DIEZMO], pasos: [], partes: sinTope([0]) },
  { cobrado: 100, gastos: 0, obligaciones: [DEL_DIEZMO], pasos: [], partes: sinTope([-1]) },
  { cobrado: 100, gastos: 0, obligaciones: [DEL_DIEZMO], pasos: [], partes: sinTope([10_001]) },
  {
    cobrado: 100,
    gastos: 0,
    obligaciones: [DEL_DIEZMO],
    pasos: [],
    partes: sinTope([5000, 5001]),
  },
  {
    cobrado: 100,
    gastos: 0,
    obligaciones: [DEL_DIEZMO],
    pasos: [],
    partes: [{ porcentaje: 1000, tope: -1 }],
  },
  {
    cobrado: 100,
    gastos: 0,
    obligaciones: [DEL_DIEZMO],
    pasos: [],
    partes: [{ porcentaje: 1000, tope: 9_007_199_254_740_992 }],
  },
  {
    cobrado: 9_007_199_254_740_991,
    gastos: 0,
    obligaciones: [DEL_DIEZMO],
    pasos: [],
    partes: [],
  },
  {
    cobrado: 9_007_199_254_740_991,
    gastos: 9_007_199_254_740_990,
    obligaciones: [{ porcentaje: 350, base: 'cobrado' }],
    pasos: [],
    partes: [],
  },
  {
    cobrado: 9_007_199_254_740_991,
    gastos: 0,
    obligaciones: [{ porcentaje: 0, base: 'ingreso' }],
    pasos: [],
    partes: sinTope([2]),
  },
  {
    cobrado: 250_000_000,
    gastos: 50_000_000,
    obligaciones: [{ porcentaje: 350, base: 'cobrado' }, DEL_DIEZMO],
    pasos: [],
    partes: [],
  },
  {
    cobrado: 250_000_000,
    gastos: 50_000_000,
    obligaciones: [DEL_DIEZMO, { porcentaje: 350, base: 'cobrado' }],
    pasos: [],
    partes: [],
  },
  {
    cobrado: 100_000_000,
    gastos: 0,
    obligaciones: [],
    pasos: [],
    partes: [{ porcentaje: 2000, tope: 5_000_000 }],
  },
  {
    cobrado: 100_000_000,
    gastos: 99_000_000,
    obligaciones: [{ porcentaje: 350, base: 'cobrado' }, DEL_DIEZMO],
    pasos: [{ objetivo: 90_000_000, previo: 63_000_000, porMes: true }],
    partes: [],
  },
];

function repartosAlAzar(escala: number): CasoDelReparto[] {
  const siguiente = generador(20_260_928);
  const importe = (): number => {
    const forma = siguiente(7);
    if (forma < 5) return siguiente(90_000_000_000);
    if (forma === 5) return [0, 1, 2, 99, 10_000, 9_007_199_254_740_991][siguiente(6)] ?? 0;
    return siguiente(1_099_511_627_776);
  };
  const porcentajeDeObligacion = (): number =>
    siguiente(6) === 0
      ? siguiente(10_016) - 5
      : ([350, 1000, 1000, 1200, 0, 10_000][siguiente(6)] ?? 1000);
  const casos: CasoDelReparto[] = [];
  for (let i = 0; i < 1_500 * escala; i++) {
    const obligaciones = Array.from(
      { length: siguiente(8) < 6 ? 1 + siguiente(2) : siguiente(7) },
      () => ({
        porcentaje: porcentajeDeObligacion(),
        base: siguiente(40) === 0 ? 'neta' : siguiente(2) === 0 ? 'cobrado' : 'ingreso',
      }),
    );
    const pasos = Array.from({ length: siguiente(7) }, () => ({
      objetivo: importe(),
      previo: siguiente(3) === 0 ? 0 : importe(),
      porMes: siguiente(2) === 0,
    }));
    const partes = Array.from({ length: siguiente(6) }, () => ({
      porcentaje: siguiente(7) < 6 ? 1 + siguiente(2500) : siguiente(10_005) - 2,
      tope: siguiente(3) === 0 ? null : siguiente(20) === 0 ? -1 : importe(),
    }));
    casos.push({ cobrado: importe(), gastos: importe(), obligaciones, pasos, partes });
  }
  return casos;
}

function repartirEnTs(caso: CasoDelReparto): Reparto {
  return repartir({
    cobrado: centavos(caso.cobrado),
    gastos: centavos(caso.gastos),
    obligaciones: caso.obligaciones.map((obligacion, i) => ({
      tesoro: tesoroDelCaso(i),
      porcentaje: obligacion.porcentaje as PuntosBasicos,
      base: obligacion.base as BaseDeLaObligacion,
      diezmo: false,
    })),
    pasos: caso.pasos.map((paso, i) => ({
      tesoro: tesoroDelCaso(10 + i),
      clase: 'prioridad',
      objetivo: centavos(paso.objetivo),
      porMes: paso.porMes,
      modo: 'mes',
      hastaLaMeta: false,
    })),
    reparto: caso.partes.map((parte, i) => ({
      tesoro: tesoroDelCaso(20 + i),
      porcentaje: parte.porcentaje as PuntosBasicos,
      hastaLaMeta: parte.tope !== null,
    })),
    superavit: null,
    previo: new Map(caso.pasos.map((paso, i) => [tesoroDelCaso(10 + i), centavos(paso.previo)])),
    topes: new Map(
      caso.partes.flatMap((parte, i) =>
        parte.tope === null ? [] : [[tesoroDelCaso(20 + i), centavos(parte.tope)] as const],
      ),
    ),
  });
}

const REPARTIR_EN_SQL = `select r.neta_centavos::text as neta, r.obligaciones::text[] as obligaciones,
    r.libre_centavos::text as libre, r.topes::text[] as topes, r.montos::text[] as montos,
    r.sobrante_centavos::text as sobrante, r.partes::text[] as partes,
    r.remanente_centavos::text as remanente
  from unnest($1::jsonb[]) with ordinality as c (caso, orden)
  cross join lateral private.repartir_por_la_fila(
    (c.caso ->> 'cobrado')::bigint,
    (c.caso ->> 'gastos')::bigint,
    array(select e.v::integer from jsonb_array_elements_text(c.caso -> 'porcentajes') with ordinality as e (v, n) order by e.n),
    array(select e.v from jsonb_array_elements_text(c.caso -> 'bases') with ordinality as e (v, n) order by e.n),
    array(select e.v::bigint from jsonb_array_elements_text(c.caso -> 'objetivos') with ordinality as e (v, n) order by e.n),
    array(select e.v::bigint from jsonb_array_elements_text(c.caso -> 'previos') with ordinality as e (v, n) order by e.n),
    array(select e.v::boolean from jsonb_array_elements_text(c.caso -> 'porMes') with ordinality as e (v, n) order by e.n),
    array(select e.v::integer from jsonb_array_elements_text(c.caso -> 'partes') with ordinality as e (v, n) order by e.n),
    array(select e.v::bigint from jsonb_array_elements_text(c.caso -> 'topes') with ordinality as e (v, n) order by e.n)
  ) as r
  order by c.orden`;

function casoDelRepartoEnJson(caso: CasoDelReparto): string {
  return JSON.stringify({
    cobrado: caso.cobrado,
    gastos: caso.gastos,
    porcentajes: caso.obligaciones.map((obligacion) => obligacion.porcentaje),
    bases: caso.obligaciones.map((obligacion) => obligacion.base),
    objetivos: caso.pasos.map((paso) => paso.objetivo),
    previos: caso.pasos.map((paso) => paso.previo),
    porMes: caso.pasos.map((paso) => paso.porMes),
    partes: caso.partes.map((parte) => parte.porcentaje),
    topes: caso.partes.map((parte) => parte.tope),
  });
}

type CasoDeSiempre = [number, number, boolean];

function filasDeSiempreAlAzar(escala: number): CasoDeSiempre[] {
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
  for (let i = 0; i < 300 * escala; i++) {
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

const FILAS_FIJAS: readonly unknown[] = [
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
  {
    obligaciones: [
      { tesoro: idDeLaFila(4), porcentaje: 350, base: 'cobrado' },
      { tesoro: idDeLaFila(2), porcentaje: 1000, base: 'ingreso' },
    ],
    pasos: [
      {
        tesoro: idDeLaFila(0),
        clase: 'sueldo',
        tope: 100_000_000,
        renglones: [],
        desde: null,
        modo: 'mes',
        hastaLaMeta: false,
      },
      {
        tesoro: idDeLaFila(5),
        clase: 'fijos',
        tope: 90_000_000,
        renglones: [
          { nombre: 'Alquiler', monto: 50_000_000, dia: 10 },
          { nombre: 'Luz', monto: 40_000_000, dia: null },
        ],
        desde: '2026-09',
        modo: 'saldo',
        hastaLaMeta: false,
      },
      {
        tesoro: idDeLaFila(9),
        clase: 'prioridad',
        tope: 10_000_000,
        renglones: [],
        desde: null,
        modo: 'trabajo',
        hastaLaMeta: false,
      },
      {
        tesoro: idDeLaFila(8),
        clase: 'prioridad',
        tope: 20_000_000,
        renglones: [],
        desde: null,
        modo: 'mes',
        hastaLaMeta: true,
      },
    ],
    reparto: [
      { tesoro: idDeLaFila(7), porcentaje: 2000, hastaLaMeta: true },
      { tesoro: idDeLaFila(3), porcentaje: 3000, hastaLaMeta: true },
    ],
    superavit: idDeLaFila(6),
    sueldoPorTrabajo: false,
  },
  {
    pasos: [
      { tesoro: idDeLaFila(11), clase: 'prioridad', tope: 100_000, renglones: [], desde: null },
    ],
    reparto: [],
    sueldoPorTrabajo: false,
  },
  {
    pasos: [],
    reparto: [{ tesoro: idDeLaFila(11), porcentaje: 1000 }],
    sueldoPorTrabajo: false,
  },
  {
    obligaciones: [
      { tesoro: idDeLaFila(2), porcentaje: 1000, base: 'ingreso' },
      { tesoro: idDeLaFila(11), porcentaje: 300, base: 'cobrado' },
    ],
    pasos: [],
    reparto: [],
    sueldoPorTrabajo: false,
  },
  {
    pasos: [],
    reparto: [{ tesoro: idDeLaFila(5), porcentaje: 1000 }],
    superavit: idDeLaFila(11),
    sueldoPorTrabajo: false,
  },
];

function filasAlAzar(escala: number): unknown[] {
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
  const conClave = (
    objeto: Record<string, unknown>,
    clave: string,
    forma: number,
    valor: () => unknown,
  ): Record<string, unknown> => (forma === 0 ? objeto : { ...objeto, [clave]: valor() });
  const renglon = (): unknown => {
    const armado = {
      nombre: siguiente(3) === 0 ? texto() : de(NOMBRES_DE_RENGLON),
      monto: monto(),
    };
    const forma = siguiente(10);
    return conClave(armado, 'dia', forma < 4 ? 0 : 1, () =>
      forma === 4
        ? null
        : forma < 8
          ? 1 + siguiente(31)
          : forma === 8
            ? de([0, 32, -1])
            : de(['10', 2.5, true]),
    );
  };
  const paso = (): Record<string, unknown> => {
    const renglones = Array.from({ length: siguiente(5) }, renglon) as {
      monto: unknown;
    }[];
    const sumables = renglones.every((uno) => Number.isSafeInteger(uno.monto));
    const tope =
      siguiente(2) === 0 && sumables
        ? renglones.reduce((suma, uno) => suma + Number(uno.monto), 0)
        : monto();
    const forma = siguiente(9);
    const desde = forma < 6 ? null : forma < 8 ? de(['2026-09', '2026-13', '09-2026']) : 202609;
    const clase =
      siguiente(9) < 8 ? de(['sueldo', 'fijos', 'prioridad', 'prioridad']) : de(['otra', 3]);
    const armado = { tesoro: id(), clase, tope, renglones };
    const conDesde = siguiente(31) === 0 ? armado : { ...armado, desde };
    const formaDelModo = siguiente(8);
    const conModo = conClave(conDesde, 'modo', formaDelModo < 2 ? 0 : 1, () =>
      formaDelModo < 7 ? de(['mes', 'saldo', 'trabajo']) : de(['semanal', null, 3]),
    );
    const formaDeLaMeta = siguiente(8);
    return conClave(conModo, 'hastaLaMeta', formaDeLaMeta < 4 ? 0 : 1, () =>
      formaDeLaMeta < 7 ? siguiente(2) === 0 : de([null, 'si', 1]),
    );
  };
  const parte = (): unknown => {
    const forma = siguiente(8);
    return conClave(
      {
        tesoro: id(),
        porcentaje: siguiente(7) < 6 ? 1 + siguiente(4000) : de([0, 10_000, 10_001, 2.5]),
      },
      'hastaLaMeta',
      forma < 4 ? 0 : 1,
      () => (forma < 7 ? siguiente(2) === 0 : de([null, 'si'])),
    );
  };
  const obligacion = (): unknown => {
    const forma = siguiente(20);
    const armada = {
      tesoro: siguiente(3) === 0 ? idDeLaFila(2) : id(),
      porcentaje: siguiente(7) < 6 ? 1 + siguiente(3000) : de([0, 10_000, 10_001, 2.5, -1]),
      base: siguiente(12) < 11 ? de(['cobrado', 'ingreso']) : de(['neta', 3, null]),
    };
    if (forma === 0) return { tesoro: armada.tesoro, porcentaje: armada.porcentaje };
    return forma === 1 ? 'obligación' : armada;
  };
  const obligaciones = (): unknown => {
    const forma = siguiente(10);
    if (forma < 2) return undefined;
    if (forma === 2) return de([{}, 'diezmo', 7]);
    if (forma === 9) return Array.from({ length: siguiente(9) }, obligacion);
    const delDiezmo = {
      tesoro: idDeLaFila(2),
      porcentaje: de([1000, 1000, 1200, 350]),
      base: de(['ingreso', 'ingreso', 'cobrado']),
    };
    const otras = Array.from({ length: siguiente(3) }, obligacion);
    const lugar = siguiente(otras.length + 1);
    return [...otras.slice(0, lugar), delDiezmo, ...otras.slice(lugar)];
  };
  const superavit = (): unknown => {
    const forma = siguiente(10);
    if (forma < 4) return undefined;
    if (forma < 8) return id();
    if (forma === 8) return idDeLaFila(1);
    return de([null, 'MAUN', 5]);
  };

  const filas: unknown[] = [...FILAS_FIJAS];
  for (let i = 0; i < 2_000 * escala; i++) {
    if (siguiente(21) === 0) {
      filas.push(de(FILAS_FIJAS.slice(0, 6)));
      continue;
    }
    const pasos = Array.from({ length: siguiente(6) }, paso);
    if (siguiente(3) !== 0) {
      pasos.sort((a, b) => Number(a.clase === 'prioridad') - Number(b.clase === 'prioridad'));
    }
    filas.push({
      obligaciones: obligaciones(),
      pasos,
      reparto: Array.from({ length: siguiente(5) }, parte),
      superavit: superavit(),
      sueldoPorTrabajo: siguiente(9) === 0,
    });
  }
  return filas.map((fila) => JSON.parse(JSON.stringify(fila)) as unknown);
}

const CON_META: readonly number[] = [4, 7, 8];
const SIN_META: readonly number[] = [5, 6, 9];

function filasCasiValidasAlAzar(escala: number): unknown[] {
  const siguiente = generador(20_260_935);
  const de = <T>(opciones: readonly T[]): T => opciones[siguiente(opciones.length)] as T;
  const filas: unknown[] = [];
  for (let i = 0; i < 2_000 * escala; i++) {
    const libres = mezclados(siguiente, [4, 5, 6, 7, 8, 9]);
    let tomados = 0;
    const tomar = (): number => libres[tomados++] ?? 9;
    const obligaciones: Record<string, unknown>[] = [
      { tesoro: idDeLaFila(2), porcentaje: de([1000, 1200, 500]), base: 'ingreso' },
    ];
    if (siguiente(2) === 0) {
      const otra = {
        tesoro: idDeLaFila(tomar()),
        porcentaje: 1 + siguiente(3000),
        base: de(['cobrado', 'ingreso']),
      };
      if (siguiente(2) === 0) obligaciones.unshift(otra);
      else obligaciones.push(otra);
    }
    const renglones = (): Record<string, unknown>[] =>
      Array.from({ length: 1 + siguiente(3) }, (_, j) => ({
        nombre: `Renglón ${String(j)}`,
        monto: 1 + siguiente(50_000_000),
        dia: siguiente(3) === 0 ? null : 1 + siguiente(31),
      }));
    const compromiso = (tesoro: number, modo: string): Record<string, unknown> => {
      const lista = renglones();
      return {
        tesoro: idDeLaFila(tesoro),
        clase: 'fijos',
        tope: lista.reduce((suma, renglon) => suma + Number(renglon.monto), 0),
        renglones: lista,
        desde: siguiente(2) === 0 ? null : '2026-09',
        modo,
        hastaLaMeta: false,
      };
    };
    const pasos: Record<string, unknown>[] = [];
    if (siguiente(2) === 0) {
      pasos.push({
        tesoro: idDeLaFila(0),
        clase: 'sueldo',
        tope: siguiente(200_000_000),
        renglones: [],
        desde: null,
        modo: 'mes',
        hastaLaMeta: false,
      });
    }
    const conMaun = siguiente(3) === 0;
    if (conMaun) pasos.push(compromiso(1, 'mes'));
    if (siguiente(2) === 0) pasos.push(compromiso(tomar(), de(['mes', 'saldo'])));
    for (let j = siguiente(3); j > 0; j--) {
      const tesoro = tomar();
      pasos.push({
        tesoro: idDeLaFila(tesoro),
        clase: 'prioridad',
        tope: siguiente(100_000_000),
        renglones: [],
        desde: null,
        modo: de(['mes', 'saldo', 'trabajo']),
        hastaLaMeta: CON_META.includes(tesoro) && siguiente(2) === 0,
      });
    }
    const reparto: Record<string, unknown>[] = [];
    for (let j = siguiente(3); j > 0; j--) {
      const tesoro =
        siguiente(3) === 0 && !reparto.some((parte) => parte.tesoro === idDeLaFila(3))
          ? 3
          : tomar();
      reparto.push({
        tesoro: idDeLaFila(tesoro),
        porcentaje: 1 + siguiente(4000),
        hastaLaMeta: (tesoro === 3 || CON_META.includes(tesoro)) && siguiente(2) === 0,
      });
    }
    const fila: Record<string, unknown> = {
      obligaciones,
      pasos,
      reparto,
      superavit: siguiente(2) === 0 ? idDeLaFila(1) : idDeLaFila(tomar()),
      sueldoPorTrabajo: false,
    };

    const conPasoDe = (clase: string): Record<string, unknown> | undefined =>
      pasos.find((paso) => paso.clase === clase);
    const perturbacion = siguiente(24);
    const primerRenglon = (
      conPasoDe('fijos')?.renglones as Record<string, unknown>[] | undefined
    )?.[0];
    if (perturbacion === 0) {
      const deMaun = pasos.find((paso) => paso.tesoro === idDeLaFila(1));
      if (deMaun) deMaun.modo = 'saldo';
      else pasos.unshift({ ...compromiso(1, 'saldo') });
    } else if (perturbacion === 1) {
      const sueldo = conPasoDe('sueldo');
      if (sueldo) sueldo.modo = de(['saldo', 'trabajo']);
    } else if (perturbacion === 2) {
      const fijos = conPasoDe('fijos');
      if (fijos) fijos.modo = 'trabajo';
    } else if (perturbacion === 3) {
      const fijos = conPasoDe('fijos');
      if (fijos) fijos.hastaLaMeta = true;
    } else if (perturbacion === 4) {
      const ahorro = conPasoDe('prioridad');
      if (ahorro) {
        ahorro.tesoro = idDeLaFila(de(SIN_META));
        ahorro.hastaLaMeta = true;
      }
    } else if (perturbacion === 5) {
      const parte = reparto[0];
      if (parte) {
        parte.tesoro = idDeLaFila(de(SIN_META));
        parte.hastaLaMeta = true;
      }
    } else if (perturbacion === 6) {
      if (primerRenglon) primerRenglon.dia = de([0, 32, -3, 99]);
    } else if (perturbacion === 7) {
      const ahorro = pasos.findIndex((paso) => paso.clase === 'prioridad');
      if (ahorro !== -1) {
        const [movido] = pasos.splice(ahorro, 1);
        pasos.unshift(movido as Record<string, unknown>);
      }
    } else if (perturbacion === 8) {
      fila.superavit = idDeLaFila(de([0, 2, 3, 10, 11]));
    } else if (perturbacion === 9) {
      const enLaFila = [...pasos, ...reparto, ...obligaciones].map((elemento) => elemento.tesoro);
      fila.superavit = de(enLaFila.length > 0 ? enLaFila : [idDeLaFila(1)]);
    } else if (perturbacion === 10) {
      fila.sueldoPorTrabajo = true;
    } else if (perturbacion === 11) {
      const obligacion = obligaciones[0];
      if (obligacion) obligacion.porcentaje = de([0, 10_001, -1]);
    } else if (perturbacion === 12) {
      obligaciones.push({ tesoro: idDeLaFila(de([0, 1])), porcentaje: 100, base: 'cobrado' });
    } else if (perturbacion === 13) {
      fila.obligaciones = obligaciones.filter((obligacion) => obligacion.tesoro !== idDeLaFila(2));
    } else if (perturbacion === 14) {
      fila.obligaciones = Array.from({ length: 7 }, (_, j) => ({
        tesoro: idDeLaFila(j === 0 ? 2 : 4 + (j % 6)),
        porcentaje: 100,
        base: 'cobrado',
      }));
    } else if (perturbacion === 15) {
      reparto.push({ tesoro: idDeLaFila(tomar()), porcentaje: 10_000, hastaLaMeta: false });
    } else if (perturbacion === 16) {
      const fijos = conPasoDe('fijos');
      if (fijos) fijos.tope = Number(fijos.tope) + 1;
    } else if (perturbacion === 17) {
      if (primerRenglon) primerRenglon.nombre = '   ';
    } else if (perturbacion === 18) {
      const paso = pasos[0];
      const obligacion = obligaciones[obligaciones.length - 1];
      if (paso && obligacion) paso.tesoro = obligacion.tesoro;
    } else if (perturbacion === 19) {
      const parte = reparto[0];
      const paso = pasos[pasos.length - 1];
      if (parte && paso) parte.tesoro = paso.tesoro;
    } else if (perturbacion === 20) {
      const paso = pasos[0];
      if (paso) paso.desde = de(['2026-13', '26-09', '2026-9']);
    } else if (perturbacion === 21) {
      const parte = reparto[0];
      if (parte) parte.porcentaje = de([0, 10_001]);
    } else if (perturbacion === 22) {
      if (!conMaun) pasos.unshift(compromiso(1, 'mes'));
      fila.superavit = idDeLaFila(1);
    }
    filas.push(fila);
  }
  return filas.map((fila) => JSON.parse(JSON.stringify(fila)) as unknown);
}

interface CasoDelPlan {
  destino: EstadoLiquidado;
  fila: unknown;
  conSueldo: boolean;
  conDiezmo: boolean;
}

function mezclados<T>(siguiente: (tope: number) => number, lista: readonly T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = siguiente(i + 1);
    const guardado = copia[i] as T;
    copia[i] = copia[j] as T;
    copia[j] = guardado;
  }
  return copia;
}

function filaValidaAlAzar(siguiente: (tope: number) => number): Record<string, unknown> {
  const de = <T>(opciones: readonly T[]): T => opciones[siguiente(opciones.length)] as T;
  const libres = mezclados(siguiente, [3, 4, 5, 6, 7, 8, 9, 10, 11]);
  let tomados = 0;
  const tomar = (): string => idDeLaFila(libres[tomados++] ?? 11);
  const conClaveAlAzar = (
    objeto: Record<string, unknown>,
    clave: string,
    valor: () => unknown,
  ): Record<string, unknown> => (siguiente(4) === 0 ? objeto : { ...objeto, [clave]: valor() });

  const otras = Array.from({ length: siguiente(3) }, () => ({
    tesoro: tomar(),
    porcentaje: 1 + siguiente(3000),
    base: de(['cobrado', 'ingreso']),
  }));
  const delDiezmo = {
    tesoro: idDeLaFila(2),
    porcentaje: de([1000, 1000, 1200, 500, 10_000]),
    base: de(['ingreso', 'ingreso', 'cobrado']),
  };
  const lugar = siguiente(otras.length + 1);
  const formaDeLasObligaciones = siguiente(10);
  const conObligaciones =
    formaDeLasObligaciones < 2
      ? []
      : formaDeLasObligaciones === 2
        ? otras
        : [...otras.slice(0, lugar), delDiezmo, ...otras.slice(lugar)];

  const tope = (): number => (siguiente(6) === 0 ? 0 : 1 + siguiente(500_000_000));
  const sueldo =
    siguiente(3) === 0
      ? []
      : [
          conClaveAlAzar(
            {
              tesoro: idDeLaFila(0),
              clase: 'sueldo',
              tope: tope(),
              renglones: [],
              desde: null,
            },
            'modo',
            () => 'mes',
          ),
        ];
  const compromisos = Array.from({ length: siguiente(3) }, (_, i) => {
    const deMaun = i === 0 && siguiente(3) === 0;
    const monto = 1 + siguiente(500_000_000);
    return conClaveAlAzar(
      {
        tesoro: deMaun ? idDeLaFila(1) : tomar(),
        clase: 'fijos',
        tope: monto,
        renglones: [{ nombre: 'Alquiler', monto, dia: siguiente(2) === 0 ? null : 10 }],
        desde: null,
        hastaLaMeta: false,
      },
      'modo',
      () => (deMaun ? 'mes' : de(['mes', 'saldo'])),
    );
  });
  const ahorros = Array.from({ length: siguiente(3) }, () =>
    conClaveAlAzar(
      conClaveAlAzar(
        { tesoro: tomar(), clase: 'prioridad', tope: tope(), renglones: [], desde: null },
        'modo',
        () => de(['mes', 'saldo', 'trabajo']),
      ),
      'hastaLaMeta',
      () => siguiente(2) === 0,
    ),
  );
  const reparto = Array.from({ length: siguiente(3) }, () =>
    conClaveAlAzar(
      { tesoro: tomar(), porcentaje: 1 + siguiente(3000) },
      'hastaLaMeta',
      () => siguiente(2) === 0,
    ),
  );
  const fila: Record<string, unknown> = {
    pasos: [...sueldo, ...compromisos, ...ahorros],
    reparto,
    sueldoPorTrabajo: siguiente(2) === 0,
  };
  if (conObligaciones.length > 0) fila.obligaciones = conObligaciones;
  const formaDelSuperavit = siguiente(4);
  if (formaDelSuperavit === 1) fila.superavit = idDeLaFila(1);
  if (formaDelSuperavit >= 2) fila.superavit = tomar();
  return fila;
}

function planesAlAzar(escala: number): CasoDelPlan[] {
  const siguiente = generador(20_260_931);
  const casos: CasoDelPlan[] = [];
  for (let i = 0; i < 600 * escala; i++) {
    casos.push({
      destino: siguiente(2) === 0 ? 'cobrado' : 'perdido',
      fila: filaValidaAlAzar(siguiente),
      conSueldo: siguiente(2) === 0,
      conDiezmo: siguiente(2) === 0,
    });
  }
  return casos;
}

function filaLeida(valor: unknown): Fila {
  const fila = leerLaFila(valor, SISTEMA_DE_LA_FILA);
  if (fila === null) throw new Error('el caso no es una fila que se pueda leer');
  return fila;
}

function planEnTs(caso: CasoDelPlan): PlanDelReparto {
  return planDelReparto(
    caso.destino,
    filaLeida(caso.fila),
    { perdidoConSueldo: caso.conSueldo, perdidoConDiezmo: caso.conDiezmo },
    SISTEMA_DE_LA_FILA,
  );
}

function diezmoDelPlan(plan: Pick<PlanDelReparto, 'obligaciones'>): {
  lugar: number | null;
  bp: number;
} {
  const lugar = plan.obligaciones.findIndex((obligacion) => obligacion.diezmo);
  return {
    lugar: lugar === -1 ? null : lugar + 1,
    bp: plan.obligaciones[lugar]?.porcentaje ?? 0,
  };
}

interface CasoDelPrevio {
  pasos: { objetivo: number; modo: string; hastaLaMeta: boolean }[];
  partes: { hastaLaMeta: boolean }[];
  delMes: Record<string, number>;
  saldos: Record<string, number>;
  metas: Record<string, number>;
}

const PREVIOS_FIJOS: readonly CasoDelPrevio[] = [
  {
    pasos: [{ objetivo: 90_000_000, modo: 'saldo', hastaLaMeta: false }],
    partes: [],
    delMes: {},
    saldos: { [tesoroDelCaso(10)]: 63_000_000 },
    metas: {},
  },
  {
    pasos: [{ objetivo: 20_000_000, modo: 'mes', hastaLaMeta: true }],
    partes: [{ hastaLaMeta: true }],
    delMes: {},
    saldos: { [tesoroDelCaso(10)]: 25_000_000, [tesoroDelCaso(20)]: 25_000_000 },
    metas: { [tesoroDelCaso(10)]: 30_000_000, [tesoroDelCaso(20)]: 30_000_000 },
  },
  {
    pasos: [{ objetivo: 20_000_000, modo: 'trabajo', hastaLaMeta: true }],
    partes: [{ hastaLaMeta: true }],
    delMes: {},
    saldos: { [tesoroDelCaso(10)]: 40_000_000, [tesoroDelCaso(20)]: 30_000_000 },
    metas: { [tesoroDelCaso(10)]: 30_000_000, [tesoroDelCaso(20)]: 30_000_000 },
  },
  {
    pasos: [{ objetivo: 10, modo: 'mes', hastaLaMeta: true }],
    partes: [{ hastaLaMeta: true }],
    delMes: {},
    saldos: {
      [tesoroDelCaso(10)]: -9_007_199_254_740_991,
      [tesoroDelCaso(20)]: 0,
    },
    metas: { [tesoroDelCaso(10)]: 9_007_199_254_740_991, [tesoroDelCaso(20)]: 1 },
  },
  {
    pasos: [],
    partes: [{ hastaLaMeta: true }],
    delMes: {},
    saldos: { [tesoroDelCaso(20)]: -9_007_199_254_740_991 },
    metas: { [tesoroDelCaso(20)]: 9_007_199_254_740_991 },
  },
];

function previosAlAzar(escala: number): CasoDelPrevio[] {
  const siguiente = generador(20_260_932);
  const de = <T>(opciones: readonly T[]): T => opciones[siguiente(opciones.length)] as T;
  const casos: CasoDelPrevio[] = [...PREVIOS_FIJOS];
  for (let i = 0; i < 1_000 * escala; i++) {
    const pasos = Array.from({ length: siguiente(5) }, () => ({
      objetivo: siguiente(4) === 0 ? 0 : siguiente(500_000_000),
      modo: de(['mes', 'saldo', 'trabajo']),
      hastaLaMeta: siguiente(2) === 0,
    }));
    const partes = Array.from({ length: siguiente(4) }, () => ({
      hastaLaMeta: siguiente(3) !== 0,
    }));
    const delMes: Record<string, number> = {};
    const saldos: Record<string, number> = {};
    const metas: Record<string, number> = {};
    const tesoros = [
      ...pasos.map((_, j) => tesoroDelCaso(10 + j)),
      ...partes.map((_, j) => tesoroDelCaso(20 + j)),
    ];
    for (const tesoro of tesoros) {
      const meta = de([0, 0, 1, 1 + siguiente(600_000_000), 1 + siguiente(600_000_000)]);
      if (siguiente(4) !== 0) metas[tesoro] = meta;
      if (siguiente(3) !== 0) delMes[tesoro] = siguiente(500_000_000);
      const formaDelSaldo = siguiente(6);
      if (formaDelSaldo > 0) {
        saldos[tesoro] =
          formaDelSaldo === 1
            ? -siguiente(100_000_000)
            : formaDelSaldo === 2
              ? 0
              : formaDelSaldo === 3
                ? meta
                : formaDelSaldo === 4
                  ? meta + siguiente(1_000_000)
                  : siguiente(600_000_000);
      }
    }
    casos.push({ pasos, partes, delMes, saldos, metas });
  }
  return casos;
}

function comoMapa(registro: Readonly<Record<string, number>>): Map<string, Money> {
  return new Map(Object.entries(registro).map(([tesoro, monto]) => [tesoro, centavos(monto)]));
}

function previoEnTs(caso: CasoDelPrevio): { previos: (number | null)[]; topes: (number | null)[] } {
  const pasos = caso.pasos.map((paso, i) => ({
    tesoro: tesoroDelCaso(10 + i),
    clase: 'prioridad' as const,
    objetivo: centavos(paso.objetivo),
    porMes: true,
    modo: paso.modo as ModoDePaso,
    hastaLaMeta: paso.hastaLaMeta,
  }));
  const reparto = caso.partes.map((parte, i) => ({
    tesoro: tesoroDelCaso(20 + i),
    porcentaje: puntosBasicos(1000),
    hastaLaMeta: parte.hastaLaMeta,
  }));
  const { previo, topes } = previoDelMes(
    { pasos, reparto },
    comoMapa(caso.delMes),
    comoMapa(caso.saldos),
    comoMapa(caso.metas),
  );
  return {
    previos: pasos.map((paso) => previo.get(paso.tesoro) ?? null),
    topes: reparto.map((parte) => topes.get(parte.tesoro) ?? null),
  };
}

function casoDelPrevioEnJson(caso: CasoDelPrevio): string {
  return JSON.stringify({
    ...caso,
    pasos: caso.pasos.map((paso, i) => ({ ...paso, tesoro: tesoroDelCaso(10 + i) })),
    partes: caso.partes.map((parte, i) => ({ ...parte, tesoro: tesoroDelCaso(20 + i) })),
  });
}

const PREVIO_EN_SQL = `select p.previos::text[] as previos, p.topes::text[] as topes
  from unnest($1::jsonb[]) with ordinality as c (caso, orden)
  cross join lateral private.previo_del_mes(
    array(select (e.v ->> 'tesoro')::uuid from jsonb_array_elements(c.caso -> 'pasos') with ordinality as e (v, n) order by e.n),
    array(select (e.v ->> 'objetivo')::bigint from jsonb_array_elements(c.caso -> 'pasos') with ordinality as e (v, n) order by e.n),
    array(select e.v ->> 'modo' from jsonb_array_elements(c.caso -> 'pasos') with ordinality as e (v, n) order by e.n),
    array(select (e.v ->> 'hastaLaMeta')::boolean from jsonb_array_elements(c.caso -> 'pasos') with ordinality as e (v, n) order by e.n),
    array(select (e.v ->> 'tesoro')::uuid from jsonb_array_elements(c.caso -> 'partes') with ordinality as e (v, n) order by e.n),
    array(select (e.v ->> 'hastaLaMeta')::boolean from jsonb_array_elements(c.caso -> 'partes') with ordinality as e (v, n) order by e.n),
    c.caso -> 'delMes', c.caso -> 'saldos', c.caso -> 'metas'
  ) as p
  order by c.orden`;

interface CasoDeLoVisto {
  pasos: string[];
  partes: string[];
  visto?: unknown;
  base?: unknown;
}

function vistosAlAzar(escala: number): CasoDeLoVisto[] {
  const siguiente = generador(20_260_933);
  const de = <T>(opciones: readonly T[]): T => opciones[siguiente(opciones.length)] as T;
  const casos: CasoDeLoVisto[] = [];
  for (let i = 0; i < 600 * escala; i++) {
    const pasos = Array.from({ length: siguiente(5) }, (_, j) => tesoroDelCaso(10 + j));
    const partes = Array.from({ length: siguiente(4) }, (_, j) => tesoroDelCaso(20 + j));
    const base: Record<string, unknown> = {};
    for (const tesoro of pasos) base[tesoro] = siguiente(4) === 0 ? 0 : siguiente(1000);
    for (const tesoro of partes) if (siguiente(2) === 0) base[tesoro] = siguiente(1000);
    const visto: Record<string, unknown> = { ...base };
    const tocados = [...pasos, ...partes, tesoroDelCaso(40)].filter(() => siguiente(4) === 0);
    for (const tesoro of tocados) {
      const forma = siguiente(6);
      if (forma === 0) visto[tesoro] = undefined;
      else if (forma === 1) visto[tesoro] = siguiente(1000);
      else if (forma === 2) visto[tesoro] = de([1.5, '3', null, true]);
      else if (forma === 3) visto[tesoro] = 0;
      else visto[tesoro] = base[tesoro];
    }
    const formaDeLoVisto = siguiente(12);
    const caso: CasoDeLoVisto = { pasos, partes };
    if (formaDeLoVisto === 1) caso.visto = null;
    else if (formaDeLoVisto === 2) caso.visto = de([[], 5, 'visto']);
    else if (formaDeLoVisto > 2) caso.visto = visto;
    const formaDeLaBase = siguiente(10);
    if (formaDeLaBase === 0) caso.base = null;
    else if (formaDeLaBase > 1) caso.base = base;
    casos.push(caso);
  }
  return JSON.parse(JSON.stringify(casos)) as CasoDeLoVisto[];
}

function planDeTesoros(
  pasos: readonly string[],
  partes: readonly string[],
): Pick<PlanDelReparto, 'pasos' | 'reparto'> {
  return {
    pasos: pasos.map((tesoro) => ({
      tesoro,
      clase: 'prioridad',
      objetivo: centavos(0),
      porMes: true,
      modo: 'mes',
      hastaLaMeta: false,
    })),
    reparto: partes.map((tesoro) => ({
      tesoro,
      porcentaje: puntosBasicos(1000),
      hastaLaMeta: false,
    })),
  };
}

interface CasoDeLaCuenta {
  destino: EstadoLiquidado;
  fila: Record<string, unknown>;
  conSueldo: boolean;
  conDiezmo: boolean;
  cobrado: number;
  gastos: number;
  delMes: Record<string, number>;
  saldos: Record<string, number>;
  metas: Record<string, number>;
}

function tesorosDeLaFilaDelCaso(fila: Record<string, unknown>): string[] {
  const deLaLista = (clave: string): string[] => {
    const lista = fila[clave];
    return Array.isArray(lista)
      ? lista.map((elemento) => String((elemento as { tesoro: unknown }).tesoro))
      : [];
  };
  return [...deLaLista('pasos'), ...deLaLista('reparto')];
}

function cuentasAlAzar(escala: number): CasoDeLaCuenta[] {
  const siguiente = generador(20_260_934);
  const de = <T>(opciones: readonly T[]): T => opciones[siguiente(opciones.length)] as T;
  const casos: CasoDeLaCuenta[] = [];
  for (let i = 0; i < 2_000 * escala; i++) {
    const fila = filaValidaAlAzar(siguiente);
    const delMes: Record<string, number> = {};
    const saldos: Record<string, number> = {};
    const metas: Record<string, number> = {};
    for (const tesoro of tesorosDeLaFilaDelCaso(fila)) {
      const meta = de([0, 1 + siguiente(300_000_000), 1 + siguiente(300_000_000)]);
      if (siguiente(4) !== 0) metas[tesoro] = meta;
      if (siguiente(2) === 0) delMes[tesoro] = siguiente(400_000_000);
      const formaDelSaldo = siguiente(5);
      if (formaDelSaldo > 0) {
        saldos[tesoro] =
          formaDelSaldo === 1
            ? -siguiente(50_000_000)
            : formaDelSaldo === 2
              ? meta
              : formaDelSaldo === 3
                ? meta + siguiente(50_000_000)
                : siguiente(400_000_000);
      }
    }
    const cobrado = siguiente(8) === 0 ? 0 : siguiente(3_000_000_000);
    casos.push({
      destino: siguiente(3) === 0 ? 'perdido' : 'cobrado',
      fila,
      conSueldo: siguiente(2) === 0,
      conDiezmo: siguiente(2) === 0,
      cobrado,
      gastos: siguiente(5) === 0 ? cobrado + siguiente(100_000_000) : siguiente(cobrado + 1),
      delMes,
      saldos,
      metas,
    });
  }
  return casos;
}

function cuentaEnTs(caso: CasoDeLaCuenta): Reparto {
  const plan = planDelReparto(
    caso.destino,
    filaLeida(caso.fila),
    { perdidoConSueldo: caso.conSueldo, perdidoConDiezmo: caso.conDiezmo },
    SISTEMA_DE_LA_FILA,
  );
  return repartir({
    ...plan,
    ...previoDelMes(plan, comoMapa(caso.delMes), comoMapa(caso.saldos), comoMapa(caso.metas)),
    cobrado: centavos(caso.cobrado),
    gastos: centavos(caso.gastos),
  });
}

const CUENTA_EN_SQL = `select pl.diezmo_en, pl.diezmo_bp, r.neta_centavos::text as neta,
    r.obligaciones::text[] as obligaciones, r.libre_centavos::text as libre,
    pv.previos::text[] as previos, pv.topes::text[] as topes_de_las_partes,
    r.topes::text[] as topes, r.montos::text[] as montos, r.sobrante_centavos::text as sobrante,
    r.partes::text[] as partes, r.remanente_centavos::text as remanente, pl.superavit::text as superavit
  from unnest($1::jsonb[]) with ordinality as c (caso, orden)
  cross join lateral private.plan_del_reparto(
    c.caso ->> 'destino', c.caso -> 'fila', (c.caso ->> 'conSueldo')::boolean,
    (c.caso ->> 'conDiezmo')::boolean, ($2::jsonb ->> 'diezmo')::uuid, ($2::jsonb ->> 'maun')::uuid
  ) as pl
  cross join lateral private.previo_del_mes(
    pl.tesoros, pl.objetivos, pl.modos, pl.hasta_la_meta, pl.tesoros_del_reparto,
    pl.hasta_la_meta_del_reparto, c.caso -> 'delMes', c.caso -> 'saldos', c.caso -> 'metas'
  ) as pv
  cross join lateral private.repartir_por_la_fila(
    (c.caso ->> 'cobrado')::bigint, (c.caso ->> 'gastos')::bigint, pl.porcentajes_de_obligacion,
    pl.bases, pl.objetivos, pv.previos, pl.por_mes, pl.porcentajes, pv.topes
  ) as r
  order by c.orden`;

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
       from private.repartir_por_la_fila(
         $1, 0, '{}', '{}', '{}', '{}', '{}', $2::integer[],
         array_fill(null::bigint, array[cardinality($2::integer[])])
       ) as r`,
      [sobrante, porcentajes],
    );
    const ts = repartir({
      cobrado: centavos(sobrante),
      gastos: centavos(0),
      obligaciones: [],
      pasos: [],
      reparto: porcentajes.map((porcentaje, i) => ({
        tesoro: idDeLaFila(i),
        porcentaje: puntosBasicos(porcentaje),
        hastaLaMeta: false,
      })),
      superavit: null,
      previo: new Map(),
      topes: new Map(),
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

interface VectorDeLaFila {
  nombre: string;
  caso: CasoDelReparto;
  esperado: string;
  deReparto: (reparto: {
    obligaciones: readonly number[];
    libre: number;
    topes: readonly number[];
    montos: readonly number[];
    partes: readonly number[];
    remanente: number;
  }) => string;
}

const VECTORES_DE_LA_FILA: readonly VectorDeLaFila[] = [
  {
    nombre: 'Ingresos Brutos al 3,5% sobre lo cobrado antes del diezmo',
    caso: {
      cobrado: 250_000_000,
      gastos: 50_000_000,
      obligaciones: [{ porcentaje: 350, base: 'cobrado' }, DEL_DIEZMO],
      pasos: [],
      partes: [],
    },
    esperado: JSON.stringify([[8_750_000, 19_125_000], 172_125_000]),
    deReparto: (reparto) => JSON.stringify([reparto.obligaciones, reparto.libre]),
  },
  {
    nombre: 'el diezmo primero y después Ingresos Brutos',
    caso: {
      cobrado: 250_000_000,
      gastos: 50_000_000,
      obligaciones: [DEL_DIEZMO, { porcentaje: 350, base: 'cobrado' }],
      pasos: [],
      partes: [],
    },
    esperado: JSON.stringify([[20_000_000, 8_750_000], 171_250_000]),
    deReparto: (reparto) => JSON.stringify([reparto.obligaciones, reparto.libre]),
  },
  {
    nombre: 'un ahorro del 20% al que le faltan $ 50.000 para la meta, con $ 1.000.000 que sobran',
    caso: {
      cobrado: 100_000_000,
      gastos: 0,
      obligaciones: [],
      pasos: [],
      partes: [{ porcentaje: 2000, tope: 5_000_000 }],
    },
    esperado: JSON.stringify([[5_000_000], 95_000_000]),
    deReparto: (reparto) => JSON.stringify([reparto.partes, reparto.remanente]),
  },
  {
    nombre: 'el mismo ahorro sin meta recibe su 20% y al superávit le quedan $ 150.000 menos',
    caso: {
      cobrado: 100_000_000,
      gastos: 0,
      obligaciones: [],
      pasos: [],
      partes: [{ porcentaje: 2000, tope: null }],
    },
    esperado: JSON.stringify([[20_000_000], 80_000_000]),
    deReparto: (reparto) => JSON.stringify([reparto.partes, reparto.remanente]),
  },
  {
    nombre: 'un compromiso que se renueva de $ 900.000 con $ 630.000 de saldo',
    caso: {
      cobrado: 100_000_000,
      gastos: 0,
      obligaciones: [],
      pasos: [{ objetivo: 90_000_000, previo: 63_000_000, porMes: true }],
      partes: [],
    },
    esperado: JSON.stringify([[27_000_000], [27_000_000]]),
    deReparto: (reparto) => JSON.stringify([reparto.topes, reparto.montos]),
  },
  {
    nombre: 'un ingreso de 15 centavos con el diezmo al 10% aparta 2 (mitad hacia arriba)',
    caso: { cobrado: 15, gastos: 0, obligaciones: [DEL_DIEZMO], pasos: [], partes: [] },
    esperado: JSON.stringify([[2], 13]),
    deReparto: (reparto) => JSON.stringify([reparto.obligaciones, reparto.libre]),
  },
  {
    nombre: 'Ingresos Brutos no aparta más que lo que llega',
    caso: {
      cobrado: 100_000_000,
      gastos: 99_000_000,
      obligaciones: [{ porcentaje: 350, base: 'cobrado' }, DEL_DIEZMO],
      pasos: [],
      partes: [],
    },
    esperado: JSON.stringify([[1_000_000, 0], 0]),
    deReparto: (reparto) => JSON.stringify([reparto.obligaciones, reparto.libre]),
  },
];

async function compararVectoresDeLaFila(cliente: pg.Client): Promise<string[]> {
  const diferencias: string[] = [];
  for (const vector of VECTORES_DE_LA_FILA) {
    const { rows } = await cliente.query<Record<string, unknown>>(REPARTIR_EN_SQL, [
      [casoDelRepartoEnJson(vector.caso)],
    ]);
    const fila = rows[0] ?? {};
    const enSql = vector.deReparto({
      obligaciones: textos((fila.obligaciones as unknown[] | undefined) ?? []),
      libre: Number(fila.libre),
      topes: textos((fila.topes as unknown[] | undefined) ?? []),
      montos: textos((fila.montos as unknown[] | undefined) ?? []),
      partes: textos((fila.partes as unknown[] | undefined) ?? []),
      remanente: Number(fila.remanente),
    });
    const ts = repartirEnTs(vector.caso);
    const enDominio = vector.deReparto({
      obligaciones: ts.obligaciones.map((obligacion) => obligacion.monto),
      libre: ts.libre,
      topes: ts.pasos.map((paso) => paso.tope),
      montos: ts.pasos.map((paso) => paso.monto),
      partes: ts.reparto.map((parte) => parte.monto),
      remanente: ts.remanente,
    });
    if (enSql !== vector.esperado || enDominio !== vector.esperado) {
      diferencias.push(
        `${vector.nombre}: esperado ${vector.esperado}, SQL ${enSql}, TS ${enDominio}`,
      );
    }
  }
  return diferencias;
}

interface CasosDeLaFila {
  enteros: string[];
  repartos: CasoDelReparto[];
  deSiempre: CasoDeSiempre[];
  filas: unknown[];
  planes: CasoDelPlan[];
  previos: CasoDelPrevio[];
  vistos: CasoDeLoVisto[];
  cuentas: CasoDeLaCuenta[];
}

function casosDeLaFilaConEscala(escala: number): CasosDeLaFila {
  return {
    enteros: [...ENTEROS_FIJOS, ...enterosAlAzar(escala)],
    repartos: [...REPARTOS_FIJOS, ...repartosAlAzar(escala)],
    deSiempre: filasDeSiempreAlAzar(escala),
    filas: [...filasAlAzar(escala), ...filasCasiValidasAlAzar(escala)],
    planes: planesAlAzar(escala),
    previos: previosAlAzar(escala),
    vistos: vistosAlAzar(escala),
    cuentas: cuentasAlAzar(escala),
  };
}

export function casosDeLaFila(escala = 1): number {
  const casos = casosDeLaFilaConEscala(escala);
  return (
    casos.enteros.length +
    casos.repartos.length +
    casos.deSiempre.length +
    casos.filas.length +
    casos.planes.length +
    casos.previos.length +
    casos.vistos.length +
    casos.cuentas.length +
    VECTORES_DE_REDONDEO.length +
    VECTORES_DE_LA_FILA.length
  );
}

export async function compararFila(cliente: pg.Client, escala = 1): Promise<string[]> {
  await cliente.query(RECHAZO_DE_LA_GEMELA);
  const casos = casosDeLaFilaConEscala(escala);

  const enteros = await compararGemela<string, number | null>(cliente, {
    nombre: 'entero de JSON',
    casos: casos.enteros,
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
    casos: casos.repartos,
    ts: repartirEnTs,
    sql: REPARTIR_EN_SQL,
    enJson: casoDelRepartoEnJson,
    deSql: (fila) =>
      JSON.stringify([
        Number(fila.neta),
        textos(fila.obligaciones as unknown[]),
        Number(fila.libre),
        textos(fila.topes as unknown[]),
        textos(fila.montos as unknown[]),
        Number(fila.sobrante),
        textos(fila.partes as unknown[]),
        Number(fila.remanente),
      ]),
    deTs: (reparto) =>
      JSON.stringify([
        reparto.neta,
        reparto.obligaciones.map((obligacion) => obligacion.monto),
        reparto.libre,
        reparto.pasos.map((paso) => paso.tope),
        reparto.pasos.map((paso) => paso.monto),
        reparto.sobrante,
        reparto.reparto.map((parte) => parte.monto),
        reparto.remanente,
      ]),
  });

  const deSiempre = await compararGemela(cliente, {
    nombre: 'fila de siempre',
    casos: casos.deSiempre,
    ts: ([sueldo, fijos, mensual]) =>
      filaDeSiempre(
        {
          sueldoMensual: centavos(sueldo),
          costosFijos: centavos(fijos),
          sueldoTopeMensual: mensual,
        },
        SISTEMA_DE_LA_FILA,
      ),
    sql: `select private.fila_de_siempre(
            (c.caso ->> 0)::bigint, (c.caso ->> 1)::bigint, (c.caso ->> 2)::boolean,
            ($2::jsonb ->> 'hogar')::uuid, ($2::jsonb ->> 'maun')::uuid, ($2::jsonb ->> 'diezmo')::uuid
          ) as fila
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          order by c.orden`,
    enJson: (caso) => JSON.stringify(caso),
    extra: SISTEMA_DE_LA_FILA,
    deSql: (fila) => canonico(fila.fila),
    deTs: (fila) => canonico(fila),
  });

  const problemas = await compararGemela<unknown, string | null>(cliente, {
    nombre: 'problema de la fila',
    casos: casos.filas,
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
    casos: casos.planes,
    ts: planEnTs,
    sql: `select r.obligaciones::text[] as obligaciones, r.porcentajes_de_obligacion, r.bases,
                 r.diezmo_en, r.diezmo_bp, r.tesoros::text[] as tesoros, r.clases,
                 r.objetivos::text[] as objetivos, r.por_mes, r.modos, r.hasta_la_meta,
                 r.tesoros_del_reparto::text[] as tesoros_del_reparto, r.porcentajes,
                 r.hasta_la_meta_del_reparto, r.superavit::text as superavit
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          cross join lateral private.plan_del_reparto(
            c.caso ->> 'destino', c.caso -> 'fila', (c.caso ->> 'conSueldo')::boolean,
            (c.caso ->> 'conDiezmo')::boolean, ($2::jsonb ->> 'diezmo')::uuid, ($2::jsonb ->> 'maun')::uuid
          ) as r
          order by c.orden`,
    enJson: (caso) => JSON.stringify(caso),
    extra: SISTEMA_DE_LA_FILA,
    deSql: (fila) =>
      JSON.stringify([
        fila.obligaciones,
        fila.porcentajes_de_obligacion,
        fila.bases,
        fila.diezmo_en,
        fila.diezmo_bp,
        fila.tesoros,
        fila.clases,
        textos(fila.objetivos as unknown[]),
        fila.por_mes,
        fila.modos,
        fila.hasta_la_meta,
        fila.tesoros_del_reparto,
        fila.porcentajes,
        fila.hasta_la_meta_del_reparto,
        fila.superavit,
      ]),
    deTs: (plan) => {
      const diezmo = diezmoDelPlan(plan);
      return JSON.stringify([
        plan.obligaciones.map((obligacion) => obligacion.tesoro),
        plan.obligaciones.map((obligacion) => obligacion.porcentaje),
        plan.obligaciones.map((obligacion) => obligacion.base),
        diezmo.lugar,
        diezmo.bp,
        plan.pasos.map((paso) => paso.tesoro),
        plan.pasos.map((paso) => paso.clase),
        plan.pasos.map((paso) => paso.objetivo),
        plan.pasos.map((paso) => paso.porMes),
        plan.pasos.map((paso) => paso.modo),
        plan.pasos.map((paso) => paso.hastaLaMeta),
        plan.reparto.map((parte) => parte.tesoro),
        plan.reparto.map((parte) => parte.porcentaje),
        plan.reparto.map((parte) => parte.hastaLaMeta),
        plan.superavit,
      ]);
    },
  });

  const previos = await compararGemela(cliente, {
    nombre: 'previo del mes',
    casos: casos.previos,
    ts: previoEnTs,
    sql: PREVIO_EN_SQL,
    enJson: casoDelPrevioEnJson,
    deSql: (fila) =>
      JSON.stringify([
        textosONull(fila.previos as unknown[]),
        textosONull(fila.topes as unknown[]),
      ]),
    deTs: (previo) => JSON.stringify([previo.previos, previo.topes]),
  });

  const vistos = await compararGemela(cliente, {
    nombre: 'lo que vio la app es otro',
    casos: casos.vistos,
    ts: (caso) => loVistoEsOtro(planDeTesoros(caso.pasos, caso.partes), caso.visto, caso.base),
    sql: `select private.lo_del_mes_es_otro(
            array(select e.v::uuid from jsonb_array_elements_text(c.caso -> 'pasos') with ordinality as e (v, n) order by e.n),
            array(select e.v::uuid from jsonb_array_elements_text(c.caso -> 'partes') with ordinality as e (v, n) order by e.n),
            c.caso -> 'visto', c.caso -> 'base'
          ) as otro
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          order by c.orden`,
    enJson: (caso) => JSON.stringify(caso),
    deSql: (fila) => String(fila.otro),
    deTs: (otro) => String(otro),
  });

  const cuentas = await compararGemela(cliente, {
    nombre: 'la cuenta de un cobro por la fila',
    casos: casos.cuentas,
    ts: cuentaEnTs,
    sql: CUENTA_EN_SQL,
    enJson: (caso) => JSON.stringify(caso),
    extra: SISTEMA_DE_LA_FILA,
    deSql: (fila) =>
      JSON.stringify([
        fila.diezmo_en,
        fila.diezmo_bp,
        Number(fila.neta),
        textos(fila.obligaciones as unknown[]),
        Number(fila.libre),
        textos(fila.previos as unknown[]),
        textosONull(fila.topes_de_las_partes as unknown[]),
        textos(fila.topes as unknown[]),
        textos(fila.montos as unknown[]),
        Number(fila.sobrante),
        textos(fila.partes as unknown[]),
        Number(fila.remanente),
        fila.superavit,
      ]),
    deTs: (reparto) => {
      const diezmo = diezmoDelPlan(reparto);
      return JSON.stringify([
        diezmo.lugar,
        reparto.diezmoBp,
        reparto.neta,
        reparto.obligaciones.map((obligacion) => obligacion.monto),
        reparto.libre,
        reparto.pasos.map((paso) => paso.previo),
        reparto.reparto.map((parte) => parte.tope),
        reparto.pasos.map((paso) => paso.tope),
        reparto.pasos.map((paso) => paso.monto),
        reparto.sobrante,
        reparto.reparto.map((parte) => parte.monto),
        reparto.remanente,
        reparto.superavit,
      ]);
    },
  });

  return [
    ...enteros,
    ...repartos,
    ...deSiempre,
    ...problemas,
    ...planes,
    ...previos,
    ...vistos,
    ...cuentas,
    ...(await compararVectoresDeRedondeo(cliente)),
    ...(await compararVectoresDeLaFila(cliente)),
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
    `select (
              select coalesce(sum(private.valor_en_pesos(moneda, monto_centavos, cotizacion_centavos)), 0)
              from public.pagos where proyecto_id = $1 and deleted_at is null
            )::text as cobrado,
            (select coalesce(sum(monto_centavos), 0) from public.gastos where proyecto_id = $1 and deleted_at is null)::text as gastos`,
    [proyectoId],
  );
  return { cobrado: Number(rows[0]?.cobrado), gastos: Number(rows[0]?.gastos) };
}

async function cobradoEnPesosSegunElDominio(
  cliente: pg.Client,
  proyectoId: string,
): Promise<number> {
  const { rows } = await cliente.query<{
    moneda: string;
    monto: string;
    cotizacion: string | null;
  }>(
    `select moneda, monto_centavos::text as monto, cotizacion_centavos::text as cotizacion
     from public.pagos where proyecto_id = $1 and deleted_at is null`,
    [proyectoId],
  );
  return totalEnPesos(
    rows.map((fila) => {
      const cotizacionDelPago =
        fila.cotizacion === null ? null : cotizacion(Number(fila.cotizacion));
      return fila.moneda === 'USD'
        ? {
            moneda: 'USD',
            monto: centavosEn('USD', Number(fila.monto)),
            cotizacion: cotizacionDelPago,
          }
        : { moneda: 'ARS', monto: centavos(Number(fila.monto)), cotizacion: cotizacionDelPago };
    }),
  );
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
  const { gastos } = await totales(cliente, proyectoId);
  const cobrado = await cobradoEnPesosSegunElDominio(cliente, proyectoId);
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
  metaCocos?: number;
}

interface PagoDeEscenario {
  monto: number;
  moneda: Moneda;
  cotizacion: number | null;
  tesoro?: string;
}

interface ProyectoDeEscenario {
  estado: EstadoProyecto;
  moneda?: Moneda;
  pagos: (number | PagoDeEscenario)[];
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
  montoDestino?: number;
  fecha: string;
  categoria?: string;
  descripcion?: string;
  borrado?: boolean;
}

interface PasoDeLaFilaDeEscenario {
  tesoro: string;
  clase: ClaseDePaso;
  tope?: number;
  renglones?: readonly (readonly [string, number, number?])[];
  modo?: ModoDePaso;
  hastaLaMeta?: boolean;
}

interface FilaDeEscenario {
  obligaciones?: readonly (readonly [string, number, BaseDeLaObligacion])[];
  pasos: readonly PasoDeLaFilaDeEscenario[];
  reparto: readonly (readonly [string, number, boolean?])[];
  superavit?: string;
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
  | { gasto: number; proyecto: string }
  | {
      ajustes: {
        sueldo?: number;
        fijos?: number;
        perdidoConDiezmo?: boolean;
        sueldoTopeMensual?: boolean;
      };
    }
  | { fila: FilaDeEscenario | null }
  | { filaDelPrimerPedido: FilaDeEscenario }
  | { cubrir: CoberturaDeEscenario }
  | { mover: MovimientoDeEscenario }
  | { metas: Readonly<Record<string, number | null>> };

export interface EscenarioDeLiquidacion {
  nombre: string;
  ajustes: AjustesDeEscenario;
  proyectos: Readonly<Record<string, ProyectoDeEscenario>>;
  pasos: Paso[];
  movimientos?: MovimientoDeEscenario[];
  apertura?: string;
  tesoros?: readonly (string | readonly [string, number | null, Moneda?])[];
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

function pagoDeEscenario(pago: number | PagoDeEscenario): PagoDeEscenario {
  return typeof pago === 'number'
    ? { monto: pago, moneda: MONEDA_DEL_TALLER, cotizacion: null }
    : pago;
}

const PAGO_EN_DOLARES: PagoDeEscenario = {
  monto: 40_000,
  moneda: 'USD',
  cotizacion: 150_000,
  tesoro: 'Dólares',
};

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

const RENGLONES_DE_LOS_GASTOS_FIJOS: readonly (readonly [string, number, number?])[] = [
  ['Alquiler', 50_000_000, 10],
  ['Luz', 40_000_000],
];

const FILA_DE_ELISEO: FilaDeEscenario = {
  obligaciones: [
    ['Ingresos Brutos', 350, 'cobrado'],
    ['diezmo', 1000, 'ingreso'],
  ],
  pasos: [
    { tesoro: 'hogar', clase: 'sueldo', tope: 100_000_000 },
    {
      tesoro: 'Gastos fijos',
      clase: 'fijos',
      renglones: RENGLONES_DE_LOS_GASTOS_FIJOS,
      modo: 'saldo',
    },
    { tesoro: 'Stock', clase: 'prioridad', tope: 10_000_000, modo: 'trabajo' },
    { tesoro: 'Maquinaria', clase: 'prioridad', tope: 20_000_000, hastaLaMeta: true },
  ],
  reparto: [
    ['Inmueble', 2000, true],
    ['cocos', 3000],
  ],
  superavit: 'Superávit',
};

const ESCENARIOS_POR_TIPOS: EscenarioDeLiquidacion[] = [
  {
    nombre:
      'por tipos: Ingresos Brutos sobre lo cobrado antes del diezmo, después el diezmo primero, y un trabajo a pérdida',
    tesoros: ['Ingresos Brutos'],
    ajustes: MENSUAL,
    proyectos: {
      p1: { estado: 'entregado', pagos: [250_000_000], gastos: [50_000_000] },
      p2: { estado: 'entregado', pagos: [250_000_000], gastos: [50_000_000] },
      p3: { estado: 'entregado', pagos: [10_000_000], gastos: [30_000_000] },
    },
    pasos: [
      {
        fila: {
          obligaciones: [
            ['Ingresos Brutos', 350, 'cobrado'],
            ['diezmo', 1000, 'ingreso'],
          ],
          pasos: [],
          reparto: [],
        },
      },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-10', porLaFila: true },
      {
        fila: {
          obligaciones: [
            ['diezmo', 1000, 'ingreso'],
            ['Ingresos Brutos', 350, 'cobrado'],
          ],
          pasos: [],
          reparto: [],
        },
      },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-10-10', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p3', fecha: '2026-10-12', porLaFila: true },
    ],
  },
  {
    nombre: 'por tipos: un perdido con Ingresos Brutos y el diezmo al 12%, con diezmo y sin diezmo',
    tesoros: ['Ingresos Brutos'],
    ajustes: MENSUAL,
    proyectos: {
      obra: { estado: 'en_curso', pagos: [100_000_000], gastos: [20_000_000] },
      lead: { estado: 'presupuesto_enviado', pagos: [30_000_000], gastos: [] },
    },
    pasos: [
      {
        fila: {
          obligaciones: [
            ['Ingresos Brutos', 350, 'cobrado'],
            ['diezmo', 1200, 'ingreso'],
          ],
          pasos: [],
          reparto: [['cocos', 5000]],
        },
      },
      { liquidar: 'perdido', proyecto: 'obra', fecha: '2026-11-15', porLaFila: true },
      { ajustes: { perdidoConDiezmo: false } },
      { liquidar: 'perdido', proyecto: 'lead', fecha: '2026-11-20', porLaFila: true },
    ],
  },
  {
    nombre:
      'por tipos: un compromiso que se renueva al pagar se llena, baja con el pago y se vuelve a llenar, también desde un aparato que no vio un cobro',
    tesoros: ['Gastos fijos'],
    ajustes: MENSUAL,
    proyectos: {
      p1: entregado(200_000_000),
      p2: entregado(100_000_000),
      p3: entregado(100_000_000),
    },
    pasos: [
      {
        fila: {
          pasos: [
            {
              tesoro: 'Gastos fijos',
              clase: 'fijos',
              renglones: RENGLONES_DE_LOS_GASTOS_FIJOS,
              modo: 'saldo',
            },
          ],
          reparto: [],
        },
      },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-12-05', porLaFila: true },
      {
        mover: {
          tipo: 'gasto',
          origen: 'Gastos fijos',
          destino: null,
          monto: 27_000_000,
          fecha: '2026-12-12',
          categoria: 'Luz',
        },
      },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-12-20', porLaFila: true },
      {
        mover: {
          tipo: 'gasto',
          origen: 'Gastos fijos',
          destino: null,
          monto: 50_000_000,
          fecha: '2026-12-21',
          categoria: 'Alquiler',
        },
      },
      {
        liquidar: 'cobrado',
        proyecto: 'p3',
        fecha: '2026-12-28',
        porLaFila: true,
        sinVer: ['p2'],
      },
    ],
  },
  {
    nombre: 'por tipos: un ahorro por trabajo y uno por mes, los dos en el mismo mes',
    tesoros: ['Stock', 'Herramientas'],
    ajustes: MENSUAL,
    proyectos: {
      p1: entregado(50_000_000),
      p2: entregado(50_000_000),
      p3: entregado(50_000_000),
    },
    pasos: [
      {
        fila: {
          pasos: [
            { tesoro: 'Stock', clase: 'prioridad', tope: 10_000_000, modo: 'trabajo' },
            { tesoro: 'Herramientas', clase: 'prioridad', tope: 10_000_000 },
          ],
          reparto: [],
        },
      },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2027-01-05', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2027-01-06', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p3', fecha: '2027-01-07', porLaFila: true },
    ],
  },
  {
    nombre:
      'por tipos: las metas en pasos y en partes, con el saldo en la meta o arriba, un aparato que no las vio y un tesoro que se queda sin meta',
    tesoros: [
      ['Maquinaria', 30_000_000],
      ['Inmueble', 30_000_000],
    ],
    ajustes: { ...MENSUAL, metaCocos: 100_000_000 },
    movimientos: [
      {
        tipo: 'ingreso',
        origen: null,
        destino: 'Maquinaria',
        monto: 25_000_000,
        fecha: '2027-01-31',
      },
      {
        tipo: 'ingreso',
        origen: null,
        destino: 'Inmueble',
        monto: 25_000_000,
        fecha: '2027-01-31',
      },
    ],
    proyectos: {
      p1: entregado(116_666_667),
      p2: entregado(100_000_000),
      p3: entregado(100_000_000),
      p4: entregado(100_000_000),
    },
    pasos: [
      {
        fila: {
          pasos: [
            { tesoro: 'Maquinaria', clase: 'prioridad', tope: 20_000_000, hastaLaMeta: true },
          ],
          reparto: [
            ['Inmueble', 2000, true],
            ['cocos', 3000, true],
          ],
        },
      },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2027-02-10', porLaFila: true },
      {
        mover: {
          tipo: 'ingreso',
          origen: null,
          destino: 'Maquinaria',
          monto: 10_000_000,
          fecha: '2027-03-01',
        },
      },
      {
        liquidar: 'cobrado',
        proyecto: 'p2',
        fecha: '2027-03-10',
        porLaFila: true,
        sinVer: ['p1'],
      },
      { metas: { Maquinaria: null, Inmueble: null } },
      { liquidar: 'cobrado', proyecto: 'p3', fecha: '2027-04-10', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p4', fecha: '2027-04-20', porLaFila: true },
    ],
  },
  {
    nombre: 'por tipos: el superávit en otro tesoro, con un cobro a pérdida y un perdido',
    tesoros: ['Superávit'],
    ajustes: MENSUAL,
    proyectos: {
      p1: entregado(100_000_000),
      p2: { estado: 'entregado', pagos: [10_000_000], gastos: [30_000_000] },
      lead: { estado: 'presupuesto_enviado', pagos: [20_000_000], gastos: [] },
    },
    pasos: [
      { fila: { pasos: [], reparto: [['cocos', 5000]], superavit: 'Superávit' } },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2027-05-10', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2027-05-15', porLaFila: true },
      { liquidar: 'perdido', proyecto: 'lead', fecha: '2027-05-20', porLaFila: true },
    ],
  },
  {
    nombre: 'por tipos: una fila guardada con la forma del primer pedido se sigue leyendo',
    tesoros: ['Gastos fijos'],
    ajustes: MENSUAL,
    proyectos: { p1: entregado(200_000_000), p2: entregado(50_000_000) },
    pasos: [
      {
        filaDelPrimerPedido: {
          pasos: [
            {
              tesoro: 'Gastos fijos',
              clase: 'fijos',
              renglones: [
                ['Alquiler', 50_000_000],
                ['Luz', 40_000_000],
              ],
            },
          ],
          reparto: [['cocos', 5000]],
        },
      },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2027-06-10', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2027-06-12', porLaFila: true },
    ],
  },
  {
    nombre:
      'por tipos: la fila de Eliseo, con un pago, un perdido, un aparato que no vio un cobro y una reapertura cobrada con su foto',
    tesoros: [
      'Ingresos Brutos',
      'Gastos fijos',
      'Stock',
      ['Maquinaria', 30_000_000],
      ['Inmueble', 30_000_000],
      'Superávit',
    ],
    ajustes: MENSUAL,
    movimientos: [
      {
        tipo: 'ingreso',
        origen: null,
        destino: 'Maquinaria',
        monto: 25_000_000,
        fecha: '2026-08-31',
      },
      {
        tipo: 'ingreso',
        origen: null,
        destino: 'Inmueble',
        monto: 25_000_000,
        fecha: '2026-08-31',
      },
    ],
    proyectos: {
      p1: { estado: 'entregado', pagos: [250_000_000], gastos: [50_000_000] },
      p2: entregado(300_000_000),
      p3: entregado(180_000_000),
      obra: { estado: 'en_curso', pagos: [60_000_000], gastos: [10_000_000] },
    },
    pasos: [
      { fila: FILA_DE_ELISEO },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-05', porLaFila: true },
      {
        mover: {
          tipo: 'gasto',
          origen: 'Gastos fijos',
          destino: null,
          monto: 50_000_000,
          fecha: '2026-09-10',
          categoria: 'Alquiler',
        },
      },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-15', porLaFila: true },
      { liquidar: 'perdido', proyecto: 'obra', fecha: '2026-09-18', porLaFila: true },
      { revertir: 'entregado', proyecto: 'p1' },
      { fila: { ...FILA_DE_ELISEO, superavit: 'maun' } },
      {
        liquidar: 'cobrado',
        proyecto: 'p3',
        fecha: '2026-09-20',
        porLaFila: true,
        sinVer: ['p2'],
      },
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-05', porLaFila: true },
    ],
  },
];

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
  {
    nombre:
      'reabrir un cobro por trabajo de antes del sueldo por mes y volver a cobrarlo por la fila: paga lo que le falta al mes',
    ajustes: { sueldo: 180_000_000, fijos: 0 },
    proyectos: {
      p1: entregado(15_800_000),
      p2: entregado(105_733_800),
      p3: entregado(154_584_953),
      p4: entregado(50_000_000),
    },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-08' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-09' },
      { liquidar: 'cobrado', proyecto: 'p3', fecha: '2026-09-25' },
      { ajustes: { sueldoTopeMensual: true } },
      { revertir: 'entregado', proyecto: 'p3' },
      { gasto: 7_000_000, proyecto: 'p3' },
      { liquidar: 'cobrado', proyecto: 'p3', fecha: '2026-09-25', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p4', fecha: '2026-09-28', porLaFila: true },
    ],
  },
  {
    nombre:
      'por el camino de antes: reabrir un cobro por trabajo de agosto con el taller ya por mes y volverlo a cobrar contra el sueldo de agosto',
    ajustes: { sueldo: 180_000_000, fijos: 0 },
    proyectos: { p1: entregado(121_533_800), p2: entregado(154_584_953) },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-08-08' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-08-20' },
      { ajustes: { sueldoTopeMensual: true } },
      { revertir: 'entregado', proyecto: 'p2' },
      { gasto: 7_000_000, proyecto: 'p2' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-08-20' },
    ],
  },
  {
    nombre:
      'reabrir un cobro por la fila con el sueldo por trabajo, pasar el taller a por mes y volver a cobrarlo con la fila de su foto y el sueldo por mes',
    ajustes: { sueldo: 180_000_000, fijos: 0 },
    proyectos: { p1: entregado(121_533_800), p2: entregado(154_584_953) },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-09', porLaFila: true },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-25', porLaFila: true },
      { revertir: 'entregado', proyecto: 'p2' },
      { ajustes: { sueldoTopeMensual: true } },
      { gasto: 7_000_000, proyecto: 'p2' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-25', porLaFila: true },
    ],
  },
  {
    nombre:
      'en un taller que sigue por trabajo, como el seed, el reabierto se vuelve a cobrar por trabajo',
    ajustes: { sueldo: 180_000_000, fijos: 0 },
    proyectos: { p1: entregado(121_533_800), p2: entregado(154_584_953) },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-09' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-25' },
      { revertir: 'entregado', proyecto: 'p2' },
      { gasto: 7_000_000, proyecto: 'p2' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-25', porLaFila: true },
    ],
  },
  {
    nombre:
      'con la fila guardada el taller va por mes aunque sueldo_tope_mensual siga apagado: el reabierto vuelve con la de siempre de su foto, por mes',
    tesoros: TESOROS_DE_LA_FILA_COMPLETA,
    ajustes: { sueldo: 180_000_000, fijos: 0 },
    proyectos: { p1: entregado(121_533_800), p2: entregado(154_584_953) },
    pasos: [
      { liquidar: 'cobrado', proyecto: 'p1', fecha: '2026-09-09' },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-25' },
      { revertir: 'entregado', proyecto: 'p2' },
      { gasto: 7_000_000, proyecto: 'p2' },
      { fila: FILA_COMPLETA },
      { liquidar: 'cobrado', proyecto: 'p2', fecha: '2026-09-25', porLaFila: true },
    ],
  },
  ...ESCENARIOS_POR_TIPOS,
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
    nombre: 'un cobro con un pago en dólares reparte su valor en pesos',
    tesoros: [['Dólares', null, 'USD']],
    ajustes: { sueldo: 50_000_000, fijos: 25_000_000 },
    proyectos: {
      p: { estado: 'entregado', pagos: [40_000_000, PAGO_EN_DOLARES], gastos: [10_000_000] },
    },
    pasos: [{ liquidar: 'cobrado', proyecto: 'p', fecha: '2026-09-10' }],
  },
  {
    nombre: 'un trabajo en dólares con la visita en pesos y su dólar se cobra en pesos',
    tesoros: [['Dólares', null, 'USD']],
    ajustes: { sueldo: 50_000_000, fijos: 25_000_000 },
    proyectos: {
      p: {
        estado: 'entregado',
        moneda: 'USD',
        pagos: [
          { monto: 12_000_000, moneda: 'ARS', cotizacion: 145_000 },
          { monto: 191_724, moneda: 'USD', cotizacion: 145_001, tesoro: 'Dólares' },
        ],
        gastos: [30_000_000],
      },
    },
    pasos: [{ liquidar: 'cobrado', proyecto: 'p', fecha: '2026-09-10' }],
  },
  {
    nombre: 'un perdido con la seña en dólares retiene su valor en pesos',
    tesoros: [['Dólares', null, 'USD']],
    ajustes: { sueldo: 180_000_000, fijos: 25_000_000 },
    proyectos: {
      p: {
        estado: 'presupuesto_enviado',
        pagos: [{ monto: 100_000, moneda: 'USD', cotizacion: 150_000, tesoro: 'Dólares' }],
        gastos: [],
      },
    },
    pasos: [{ liquidar: 'perdido', proyecto: 'p', fecha: '2026-09-12' }],
  },
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
    obligaciones: (fila.obligaciones ?? [['diezmo', 1000, 'ingreso']]).map(
      ([tesoro, porcentaje, base]) => ({
        tesoro: idDelTesoro(tesoros, tesoro),
        porcentaje: puntosBasicos(porcentaje),
        base,
      }),
    ),
    pasos: fila.pasos.map((paso) => {
      const renglones = (paso.renglones ?? []).map(([nombre, monto, dia]) => ({
        nombre,
        monto: centavos(monto),
        dia: dia ?? null,
      }));
      const suma = renglones.reduce((total, renglon) => total + renglon.monto, 0);
      return {
        tesoro: idDelTesoro(tesoros, paso.tesoro),
        clase: paso.clase,
        tope: centavos(paso.tope ?? suma),
        renglones,
        desde: null,
        modo: paso.modo ?? 'mes',
        hastaLaMeta: paso.hastaLaMeta ?? false,
      };
    }),
    reparto: fila.reparto.map(([tesoro, porcentaje, hastaLaMeta]) => ({
      tesoro: idDelTesoro(tesoros, tesoro),
      porcentaje: puntosBasicos(porcentaje),
      hastaLaMeta: hastaLaMeta ?? false,
    })),
    superavit: idDelTesoro(tesoros, fila.superavit ?? 'maun'),
    sueldoPorTrabajo: false,
  };
}

function filaDelPrimerPedido(fila: FilaDeEscenario, tesoros: ReadonlyMap<string, string>): unknown {
  return {
    pasos: fila.pasos.map((paso) => {
      const renglones = (paso.renglones ?? []).map(([nombre, monto]) => ({ nombre, monto }));
      const suma = renglones.reduce((total, renglon) => total + renglon.monto, 0);
      return {
        tesoro: idDelTesoro(tesoros, paso.tesoro),
        clase: paso.clase,
        tope: paso.tope ?? suma,
        renglones,
        desde: null,
      };
    }),
    reparto: fila.reparto.map(([tesoro, porcentaje]) => ({
      tesoro: idDelTesoro(tesoros, tesoro),
      porcentaje,
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
         perdido_con_sueldo = $5, perdido_con_diezmo = $6,
         meta_cocos_centavos = coalesce($7, meta_cocos_centavos)
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
      ajustes.metaCocos ?? null,
    ],
  );
  const tesorosDelEscenario = (escenario.tesoros ?? []).map((tesoro) =>
    typeof tesoro === 'string'
      ? { nombre: tesoro, meta: null, moneda: MONEDA_DEL_TALLER }
      : { nombre: tesoro[0], meta: tesoro[1], moneda: tesoro[2] ?? MONEDA_DEL_TALLER },
  );
  const { rows: filasDeTesoros } = await cliente.query<{ nombre: string; id: string }>(
    `with nuevos as (
       insert into public.tesoros (household_id, nombre, tinta, icono, orden, meta_centavos, moneda)
       select $1, t.nombre, t.tinta, 'vault', t.orden - 1, t.meta, t.moneda
       from unnest($2::text[], $3::text[], $4::bigint[], $5::text[])
         with ordinality as t (nombre, tinta, meta, moneda, orden)
       returning nombre, id
     )
     select nombre, id from nuevos
     union all
     select clave::text, id from public.tesoros where household_id = $1 and clave is not null`,
    [
      householdId,
      tesorosDelEscenario.map((tesoro) => tesoro.nombre),
      tesorosDelEscenario.map(
        (_, orden) => TINTAS_DE_ESCENARIO[orden % TINTAS_DE_ESCENARIO.length] ?? 'grana',
      ),
      tesorosDelEscenario.map((tesoro) => tesoro.meta),
      tesorosDelEscenario.map((tesoro) => tesoro.moneda),
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
    `insert into public.proyectos (household_id, cliente_id, titulo, estado, moneda)
     select $1, $2, p.titulo, p.estado::public.estado_proyecto, p.moneda
     from unnest($3::text[], $4::text[], $5::text[]) with ordinality as p (titulo, estado, moneda, orden)
     order by p.orden
     returning titulo, id`,
    [
      householdId,
      clienteDelTaller[0]?.id,
      proyectos.map(([clave]) => clave),
      proyectos.map(([, proyecto]) => proyecto.estado),
      proyectos.map(([, proyecto]) => proyecto.moneda ?? MONEDA_DEL_TALLER),
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
      ...proyecto.pagos.map((pago) => [pagoDeEscenario(pago), null] as const),
      ...(proyecto.pagosBorrados ?? []).map(
        (monto) => [pagoDeEscenario(monto), '2026-08-15T00:00:00Z'] as const,
      ),
    ].map(([pago, borrado]) => ({
      proyecto: idDe(clave),
      fecha: proyecto.fechaDeLosPagos ?? '2026-08-01',
      ...pago,
      borrado,
      enLaApertura: proyecto.pagosEnLaApertura === true,
    })),
  );
  if (pagos.length > 0) {
    await cliente.query(
      `insert into public.pagos (
         household_id, proyecto_id, fecha, monto_centavos, deleted_at, ya_en_la_apertura, moneda,
         cotizacion_centavos, tesoro_id
       )
       select $1, p.proyecto, p.fecha, p.monto, p.borrado, p.en_la_apertura, p.moneda, p.cotizacion, p.tesoro
       from unnest(
         $2::uuid[], $3::date[], $4::bigint[], $5::timestamptz[], $6::boolean[], $7::text[], $8::bigint[],
         $9::uuid[]
       ) with ordinality as p (
         proyecto, fecha, monto, borrado, en_la_apertura, moneda, cotizacion, tesoro, orden
       )
       order by p.orden`,
      [
        householdId,
        pagos.map((pago) => pago.proyecto),
        pagos.map((pago) => pago.fecha),
        pagos.map((pago) => pago.monto),
        pagos.map((pago) => pago.borrado),
        pagos.map((pago) => pago.enLaApertura),
        pagos.map((pago) => pago.moneda),
        pagos.map((pago) => pago.cotizacion),
        pagos.map((pago) => (pago.tesoro === undefined ? null : idDelTesoro(tesoros, pago.tesoro))),
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
          monto_destino_centavos, categoria, descripcion, deleted_at)
       select $1, m.fecha, m.tipo::public.tipo_movimiento, m.origen::public.tesoro, m.destino::public.tesoro,
              m.desde, m.hacia, m.monto, m.monto_destino, m.categoria, m.descripcion, m.borrado
       from unnest(
         $2::date[], $3::text[], $4::text[], $5::text[], $6::uuid[], $7::uuid[], $8::bigint[],
         $9::bigint[], $10::text[], $11::text[], $12::timestamptz[]
       ) with ordinality as m (
         fecha, tipo, origen, destino, desde, hacia, monto, monto_destino, categoria, descripcion, borrado, orden
       )
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
        movimientos.map((movimiento) => movimiento.montoDestino ?? null),
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
  fila: unknown,
): Promise<string[]> {
  const { version } = filaDelTaller(await replicaDeLaBase(cliente, contexto.usuarioId));
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

async function moverEnElEscenario(
  cliente: pg.Client,
  contexto: Contexto,
  movimiento: MovimientoDeEscenario,
): Promise<void> {
  const desde = ladoDelMovimiento(contexto.tesoros, movimiento.origen);
  const hacia = ladoDelMovimiento(contexto.tesoros, movimiento.destino);
  await cliente.query(
    `insert into public.movimientos
       (fecha, tipo, tesoro_origen, tesoro_destino, desde_id, hacia_id, monto_centavos,
        monto_destino_centavos, categoria, descripcion)
     values ($1, $2::public.tipo_movimiento, $3::public.tesoro, $4::public.tesoro, $5, $6, $7, $8, $9, $10)`,
    [
      movimiento.fecha,
      movimiento.tipo,
      desde.clave,
      hacia.clave,
      desde.id,
      hacia.id,
      movimiento.monto,
      movimiento.montoDestino ?? null,
      movimiento.categoria ?? '',
      movimiento.descripcion ?? '',
    ],
  );
}

async function cambiarLasMetas(
  cliente: pg.Client,
  contexto: Contexto,
  metas: Readonly<Record<string, number | null>>,
): Promise<void> {
  for (const [nombre, meta] of Object.entries(metas)) {
    await cliente.query('update public.tesoros set meta_centavos = $2 where id = $1', [
      idDelTesoro(contexto.tesoros, nombre),
      meta,
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
  modo: string | null;
  objetivo: string | null;
  previo: string | null;
  tope: string | null;
  por_mes: boolean | null;
  porcentaje_bp: number | null;
  base: string | null;
  monto: string;
  fecha: string;
  ya_en_la_apertura: boolean;
}

async function repartosVivos(cliente: pg.Client, proyectoId: string): Promise<string[]> {
  const { rows } = await cliente.query<FilaDeReparto>(
    `select id, posicion, tesoro_id, nombre, tipo, clase, modo, objetivo_centavos::text as objetivo,
            previo_centavos::text as previo, tope_centavos::text as tope, por_mes, porcentaje_bp,
            base, monto_centavos::text as monto, fecha::text as fecha, ya_en_la_apertura
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
      fila.modo,
      entero(fila.objetivo),
      entero(fila.previo),
      entero(fila.tope),
      fila.por_mes,
      fila.porcentaje_bp,
      fila.base,
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
  return repartosDelCobro(liquidacion).map((fila, i) => {
    const deLaFila = [
      fila.tipo === 'paso' ? fila.clase : null,
      fila.tipo === 'paso' ? fila.modo : null,
      fila.tipo === 'paso' ? fila.objetivo : null,
      fila.tipo === 'paso' ? fila.previo : null,
      fila.tipo === 'paso' || fila.tipo === 'parte' ? fila.tope : null,
      fila.tipo === 'paso' ? fila.porMes : null,
      fila.tipo === 'obligacion' || fila.tipo === 'parte' ? fila.porcentaje : null,
      fila.tipo === 'obligacion' ? fila.base : null,
    ];
    return JSON.stringify([
      ids[i],
      i + 1,
      fila.tesoro,
      nombres.get(fila.tesoro) ?? '',
      fila.tipo,
      ...deLaFila,
      fila.monto,
      liquidacion.fecha,
      enLaApertura,
    ]);
  });
}

function filaCrudaParaLiquidar(
  replica: Replica,
  proyecto: FilaDe<'proyectos'>,
  destino: EstadoLiquidado,
  fila: Fila,
): unknown {
  const quizas = proyecto as Partial<FilaDe<'proyectos'>>;
  const foto = quizas.reapertura_fila;
  const ajustes = ajustesDe(replica) as Partial<FilaDe<'ajustes'>> | undefined;
  if (
    destino === 'cobrado' &&
    typeof foto === 'object' &&
    foto !== null &&
    !Array.isArray(foto) &&
    reaperturaDeLaFila(replica, proyecto) !== null
  ) {
    const porMes = (ajustes?.sueldo_tope_mensual ?? true) || (ajustes?.fila ?? null) !== null;
    return porMes &&
      typeof foto.fila === 'object' &&
      foto.fila !== null &&
      !Array.isArray(foto.fila)
      ? { ...foto.fila, sueldoPorTrabajo: false }
      : foto.fila;
  }
  if (destino === 'cobrado' && proyecto.reapertura_fecha_cobro !== null) return fila;
  return ajustes?.fila ?? fila;
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
  const loQueSeLiquida = { destino: paso.liquidar, fecha: paso.fecha };
  const { entrada: deLaBase, version } = entradaDeLaLiquidacion(replica, proyecto, loQueSeLiquida);
  const { entrada: deLoQueVe } = entradaDeLaLiquidacion(loQueVe, proyecto, loQueSeLiquida);
  const esperado = calcularPorLaFila(deLaBase);
  const vista = calcularPorLaFila(deLoQueVe);

  const ids = repartosDelCobro(vista).map(() => contexto.nuevoId());
  const pedido = pedidoDeLaFila(vista, version, ids);
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
    pedido.version,
    JSON.stringify(pedido.repartos),
    JSON.stringify(pedido.previo),
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
  const filaEnDominio = canonico([
    version,
    filaCrudaParaLiquidar(replica, proyecto, paso.liquidar, deLaBase.fila),
    previoQueVio(esperado),
    null,
  ]);
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
         costos_fijos_centavos = coalesce($3, costos_fijos_centavos),
         perdido_con_diezmo = coalesce($4, perdido_con_diezmo)
       where household_id = $1`,
      [
        contexto.householdId,
        paso.ajustes.sueldo ?? null,
        paso.ajustes.fijos ?? null,
        paso.ajustes.perdidoConDiezmo ?? null,
      ],
    );
    if (paso.ajustes.sueldoTopeMensual !== undefined) {
      await cliente.query("select set_config('role', 'none', true)");
      await cliente.query(
        'update public.ajustes set sueldo_tope_mensual = $2 where household_id = $1',
        [contexto.householdId, paso.ajustes.sueldoTopeMensual],
      );
      await cliente.query("select set_config('role', 'authenticated', true)");
    }
    return [];
  }

  if ('fila' in paso) {
    return guardarLaFilaDelEscenario(
      cliente,
      contexto,
      paso.fila === null ? null : filaDelEscenario(paso.fila, contexto.tesoros),
    );
  }

  if ('filaDelPrimerPedido' in paso) {
    return guardarLaFilaDelEscenario(
      cliente,
      contexto,
      filaDelPrimerPedido(paso.filaDelPrimerPedido, contexto.tesoros),
    );
  }

  if ('cubrir' in paso) {
    await cubrirElMes(cliente, contexto, paso.cubrir);
    return [];
  }

  if ('mover' in paso) {
    await moverEnElEscenario(cliente, contexto, paso.mover);
    return [];
  }

  if ('metas' in paso) {
    await cambiarLasMetas(cliente, contexto, paso.metas);
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

  if ('gasto' in paso) {
    await cliente.query(
      `insert into public.gastos (proyecto_id, fecha, descripcion, monto_centavos) values ($1, '2026-08-02', 'Flete', $2)`,
      [proyectoId, paso.gasto],
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
  {
    nombre:
      'una compra y una venta de dólares: cada lado entra al libro con su importe, y los dólares nunca se suman con pesos',
    tesoros: [['Dólares', null, 'USD'], ['Reserva', 100_000, 'USD'], 'Viajes'],
    ajustes: { sueldo: 180_000_000, fijos: 25_000_000 },
    proyectos: {},
    pasos: [
      {
        mover: {
          tipo: 'cambio',
          origen: 'Dólares',
          destino: 'Viajes',
          monto: 20_000,
          montoDestino: 28_600_000,
          fecha: '2026-09-29',
          categoria: 'Blue',
        },
      },
    ],
    movimientos: [
      ...MOVIMIENTOS_DE_TODOS_LOS_TIPOS,
      {
        tipo: 'cambio',
        origen: 'maun',
        destino: 'Dólares',
        monto: 72_500_000,
        montoDestino: 50_000,
        fecha: '2026-09-28',
        categoria: 'MEP',
      },
      {
        tipo: 'transferencia',
        origen: 'Dólares',
        destino: 'Reserva',
        monto: 10_000,
        fecha: '2026-09-29',
      },
      {
        tipo: 'ingreso',
        origen: null,
        destino: 'Reserva',
        monto: 5_000,
        fecha: '2026-09-29',
        categoria: 'Ingreso en dólares',
      },
      { tipo: 'gasto', origen: 'Reserva', destino: null, monto: 1_000, fecha: '2026-09-30' },
      {
        tipo: 'cambio',
        origen: 'Viajes',
        destino: 'Reserva',
        monto: 1_450_000,
        montoDestino: 1_000,
        fecha: '2026-09-30',
        borrado: true,
      },
    ],
  },
  {
    nombre:
      'un pago en dólares entra a su tesoro en dólares y uno en pesos a Maun; cobrado, reparte el valor en pesos',
    tesoros: [['Dólares', null, 'USD']],
    ajustes: { sueldo: 180_000_000, fijos: 25_000_000 },
    proyectos: {
      enCurso: { estado: 'en_curso', pagos: [40_000_000, PAGO_EN_DOLARES], gastos: [5_000_000] },
      cobrado: {
        estado: 'entregado',
        moneda: 'USD',
        pagos: [
          { monto: 12_000_000, moneda: 'ARS', cotizacion: 145_000 },
          { monto: 100_000, moneda: 'USD', cotizacion: 150_000, tesoro: 'Dólares' },
        ],
        gastos: [],
        pagosBorrados: [7_000_000],
      },
    },
    pasos: [{ liquidar: 'cobrado', proyecto: 'cobrado', fecha: '2026-09-15' }],
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

export interface PagoEnOtraMoneda {
  moneda: Moneda;
  cotizacion: number;
  tesoro: string;
}

export interface PasoDeGuardado {
  titulo: string;
  estado: EstadoProyecto;
  pagos: readonly (readonly [string, number, boolean?, PagoEnOtraMoneda?])[];
  gastos: readonly (readonly [string, number, boolean?])[];
}

export interface EscenarioDeGuardado {
  nombre: string;
  tesoros?: EscenarioDeLiquidacion['tesoros'];
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
  {
    nombre:
      'un pedido de una app sin actualizar conserva la moneda, el dólar y el tesoro de un pago en dólares',
    tesoros: [['Dólares', null, 'USD']],
    pasos: [
      {
        titulo: 'Ropero',
        estado: 'en_curso',
        pagos: [
          ['sena', 40_000_000],
          ['dolares', 50_000, false, { moneda: 'USD', cotizacion: 150_000, tesoro: 'Dólares' }],
        ],
        gastos: [['melamina', 30_000_000]],
      },
      {
        titulo: 'Ropero de dos cuerpos',
        estado: 'entregado',
        pagos: [
          ['sena', 40_000_000],
          ['dolares', 50_000],
        ],
        gastos: [['melamina', 30_000_000]],
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
  const hija = ([clave, monto, borrado]: readonly [
    string,
    number,
    boolean?,
    PagoEnOtraMoneda?,
  ]) => ({
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
      JSON.stringify(
        paso.pagos.map((pago) => {
          const enOtraMoneda = pago[3];
          return {
            ...hija(pago),
            concepto: 'Seña',
            ...(enOtraMoneda === undefined
              ? {}
              : {
                  moneda: enOtraMoneda.moneda,
                  cotizacion_centavos: enOtraMoneda.cotizacion,
                  tesoro_id: idDelTesoro(contexto.tesoros, enOtraMoneda.tesoro),
                }),
          };
        }),
      ),
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
  if (enTs.cobradoEnPesos !== enSql.cobrado) {
    diferencias.push(
      `cobrado en pesos: SQL ${String(enSql.cobrado)}, TS ${String(enTs.cobradoEnPesos)}`,
    );
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
        tesoros: escenario.tesoros,
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

type Objeto = Record<string, unknown>;

function copiaDeJson(valor: unknown): unknown {
  return JSON.parse(JSON.stringify(valor)) as unknown;
}

function comoObjeto(valor: unknown): Objeto | null {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
    ? (valor as Objeto)
    : null;
}

function comoLista(valor: unknown): Objeto[] {
  return Array.isArray(valor) ? (valor as Objeto[]) : [];
}

const FORMATOS_DEL_PRESUPUESTO: Formatos = {
  plata: (importe, moneda) => `${moneda === 'USD' ? 'US$' : '$'} ${String(importe / 100)}`,
  porcentaje: (puntos) => String(puntos / 100),
  modificaciones: (cantidad) =>
    `${String(cantidad)} ${cantidad === 1 ? 'modificación' : 'modificaciones'}`,
  meses: (cantidad) => `${String(cantidad)} ${cantidad === 1 ? 'mes' : 'meses'}`,
};

const TALLER_DEL_PRESUPUESTO: DatosDelTaller = {
  nombre: 'Taller de prueba',
  titular: 'Julián Ferro',
  cuit: '20-12345678-6',
  condicionFiscal: 'monotributo',
  domicilio: 'Pasaje Los Robles 450, CABA',
  telefono: '11 5555-0199',
  email: 'taller@ejemplo.com',
};

const OPCIONES_DEL_PRESUPUESTO: readonly OpcionDelTrabajo[] = [
  {
    id: '0199a1b2-0000-7000-8000-00000000000b',
    descripcion: 'Laqueado',
    monto: centavos(274_000_000),
  },
  {
    id: '0199a1b2-0000-7000-8000-00000000000a',
    descripcion: 'En melamina',
    monto: centavos(218_100_000),
  },
];

function borradorDelPresupuesto(): BorradorDelPresupuesto {
  const nuevo = borradorNuevo({
    titulo: 'Cocina en L',
    obra: 'Arenales 1840, Palermo',
    plantilla: PLANTILLA_DE_SIEMPRE,
    validezDias: 15,
    idNuevo: () => 'm1',
  });
  return {
    ...nuevo,
    descripcion: 'Cocina en L con bajomesada y alacena.',
    muebles: [
      {
        id: 'm1',
        nombre: 'Bajomesada',
        descripcion: 'Bajomesada en L con cajonera de tres cajones.',
      },
      { id: 'm2', nombre: 'Alacena', descripcion: 'Alacena con puertas rebatibles.' },
    ],
    herrajes: {
      mostrar: true,
      lista: [
        { id: 'h1', texto: 'Correderas telescópicas con cierre suave.' },
        { id: 'h2', texto: 'Bisagras cazoleta de 35 mm.' },
      ],
    },
    aTenerEnCuenta: {
      tildadas: ['no-mesada'],
      propias: [{ id: 'p1', texto: 'No incluye el retiro de los muebles existentes.' }],
    },
    formaDePago: {
      plantillaId: 'sena-y-entrega',
      texto: 'Seña del {sena} y el saldo contra entrega.',
    },
  };
}

function documentoDePrueba(
  valores: ValoresDelPresupuesto | null,
  abonado: number,
): DocumentoEnPesos {
  const documento = documentoDelPresupuesto(
    {
      borrador: borradorDelPresupuesto(),
      plantilla: PLANTILLA_DE_SIEMPRE,
      taller: TALLER_DEL_PRESUPUESTO,
      cliente: 'Paula Benítez',
      moneda: 'ARS',
      cobraEn: null,
      valores,
      senaBp: puntosBasicos(5000),
      abonado: centavos(abonado),
    },
    FORMATOS_DEL_PRESUPUESTO,
  );
  if (documento.forma !== 1) throw new Error('Un documento en pesos salió en otra forma.');
  return documento;
}

function alAzarConCambios(
  semilla: number,
  cantidad: number,
  base: () => unknown,
  cambios: readonly ((objeto: Objeto, siguiente: (tope: number) => number) => void)[],
): unknown[] {
  const siguiente = generador(semilla);
  const casos: unknown[] = [];
  for (let i = 0; i < cantidad; i++) {
    const caso = copiaDeJson(base()) as Objeto;
    for (let j = siguiente(3); j >= 0; j--) {
      const cambio = cambios[siguiente(cambios.length)];
      cambio?.(caso, siguiente);
    }
    casos.push(copiaDeJson(caso));
  }
  return casos;
}

function elegir<T>(siguiente: (tope: number) => number, opciones: readonly T[]): T {
  return opciones[siguiente(opciones.length)] as T;
}

function unoDeLaLista(siguiente: (tope: number) => number, valor: unknown): Objeto | undefined {
  const lista = comoLista(valor);
  return comoObjeto(lista[siguiente(Math.max(1, lista.length))]) ?? undefined;
}

const CAMBIOS_DE_LA_PLANTILLA: readonly ((
  plantilla: Objeto,
  siguiente: (tope: number) => number,
) => void)[] = [
  (p, s) => {
    p.forma = elegir(s, [2, '1', 1.5, true, null]);
  },
  (p, s) => {
    Reflect.deleteProperty(
      p,
      elegir(s, [
        'forma',
        'plazoDeFabricacion',
        'modificacionesIncluidas',
        'valorDeUnaModificacion',
        'garantiaMeses',
        'garantia',
        'formasDePago',
        'monedaDeLaModificacion',
        'clausulasDeLaMoneda',
        ...GRUPOS_DE_CLAUSULAS,
      ]),
    );
  },
  (p, s) => {
    p.monedaDeLaModificacion = elegir(s, ['ARS', 'USD', 'EUR', 'usd', null, 5]);
  },
  (p, s) => {
    p.clausulasDeLaMoneda = elegir(s, [null, {}, 'cláusulas', [], 5]);
  },
  (p, s) => {
    const clausulas = comoObjeto(p.clausulasDeLaMoneda);
    if (!clausulas) return;
    const combinacion = elegir(s, COMBINACIONES_DE_LA_MONEDA);
    if (s(5) === 0) Reflect.deleteProperty(clausulas, combinacion);
    else
      clausulas[combinacion] = elegir(s, [
        '',
        ' \n\t',
        'c'.repeat(2000),
        'c'.repeat(2001),
        '😀'.repeat(2000),
        '😀'.repeat(2001),
        5,
        null,
      ]);
  },
  (p, s) => {
    p.plazoDeFabricacion = elegir(s, [0, 1, 365, 366, -1, 1.5, '30', null, 2 ** 60]);
  },
  (p, s) => {
    p.modificacionesIncluidas = elegir(s, [-1, 0, 10, 11, 2.5, '2']);
  },
  (p, s) => {
    p.valorDeUnaModificacion = elegir(s, [-1, 0, 1_000_000_000_000, 1_000_000_000_001, 0.5, '5']);
  },
  (p, s) => {
    p.garantiaMeses = elegir(s, [5, 6, 120, 121, 6.5, null]);
  },
  (p, s) => {
    p[elegir(s, GRUPOS_DE_CLAUSULAS)] = elegir(s, [null, {}, 'cláusulas', 3, []]);
  },
  (p, s) => {
    p[elegir(s, GRUPOS_DE_CLAUSULAS)] = Array.from({ length: elegir(s, [20, 21, 25]) }, (_, i) => ({
      id: `c-${String(i)}`,
      titulo: null,
      texto: 'Una cláusula.',
      tildadaPorDefecto: true,
    }));
  },
  (p, s) => {
    const clausula = unoDeLaLista(s, p[elegir(s, GRUPOS_DE_CLAUSULAS)]);
    if (clausula) {
      clausula.id = elegir(s, [
        '',
        'A',
        'con espacio',
        'ñandú',
        'a'.repeat(60),
        'a'.repeat(61),
        'ok-1',
        7,
      ]);
    }
  },
  (p, s) => {
    const lista = comoLista(p[elegir(s, GRUPOS_DE_CLAUSULAS)]);
    const [primera, segunda] = lista;
    if (primera && segunda) segunda.id = primera.id;
  },
  (p, s) => {
    const clausula = unoDeLaLista(s, p[elegir(s, GRUPOS_DE_CLAUSULAS)]);
    if (!clausula) return;
    if (s(5) === 0) Reflect.deleteProperty(clausula, 'titulo');
    else
      clausula.titulo = elegir(s, [
        't'.repeat(120),
        't'.repeat(121),
        '😀'.repeat(121),
        '',
        5,
        true,
      ]);
  },
  (p, s) => {
    const clausula = unoDeLaLista(s, p[elegir(s, GRUPOS_DE_CLAUSULAS)]);
    if (clausula) {
      clausula.texto = elegir(s, [
        '',
        '  \n\t\v\f',
        ' ',
        'a'.repeat(2000),
        'a'.repeat(2001),
        '😀'.repeat(2000),
        '😀'.repeat(2001),
        5,
        null,
      ]);
    }
  },
  (p, s) => {
    const clausula = unoDeLaLista(s, p[elegir(s, GRUPOS_DE_CLAUSULAS)]);
    if (clausula) clausula.tildadaPorDefecto = elegir(s, ['true', 1, null, false]);
  },
  (p, s) => {
    const lista = comoLista(p[elegir(s, GRUPOS_DE_CLAUSULAS)]) as unknown[];
    lista.push(elegir(s, ['cláusula', 5, null, []]));
  },
  (p, s) => {
    p.formasDePago = elegir(s, [[], 'formas', null, {}]);
  },
  (p, s) => {
    p.formasDePago = Array.from({ length: elegir(s, [1, 6, 7]) }, (_, i) => ({
      id: `forma-${String(i)}`,
      nombre: `Forma ${String(i)}`,
      texto: 'Seña del {sena}.',
    }));
  },
  (p, s) => {
    const forma = unoDeLaLista(s, p.formasDePago);
    if (forma) forma.id = elegir(s, ['', 'Forma', 'f'.repeat(61), 'forma-ok', 3]);
  },
  (p, s) => {
    const [primera, segunda] = comoLista(p.formasDePago);
    if (primera && segunda) segunda.id = s(2) === 0 ? primera.id : 'otra-forma';
  },
  (p, s) => {
    const forma = unoDeLaLista(s, p.formasDePago);
    if (forma)
      forma.nombre = elegir(s, ['', '  ', 'n'.repeat(60), 'n'.repeat(61), '😀'.repeat(61), 5]);
  },
  (p, s) => {
    const forma = unoDeLaLista(s, p.formasDePago);
    if (forma) forma.texto = elegir(s, ['', ' ', 'f'.repeat(2000), 'f'.repeat(2001), 5]);
  },
  (p, s) => {
    const formas = comoLista(p.formasDePago) as unknown[];
    formas.push(elegir(s, ['forma', 5, null, { id: 'sola', nombre: 'Sola' }]));
  },
  (p, s) => {
    p.garantia = elegir(s, ['', ' \n', 'g'.repeat(2000), 'g'.repeat(2001), 5, null]);
  },
  (p) => {
    p.extra = 'se ignora';
  },
];

const CLAVES_DEL_BORRADOR = [
  'forma',
  'titulo',
  'obra',
  'descripcion',
  'muebles',
  'herrajes',
  'formaDePago',
  'plazoDeFabricacion',
  'validezDias',
  'clausulaDeLaMoneda',
  'modificacion',
  'monedaDeLoAbonado',
  ...GRUPOS_DE_CLAUSULAS,
] as const;

const CAMBIOS_DEL_BORRADOR: readonly ((
  borrador: Objeto,
  siguiente: (tope: number) => number,
) => void)[] = [
  (b, s) => {
    b.forma = elegir(s, [2, '1', null]);
  },
  (b, s) => {
    Reflect.deleteProperty(b, elegir(s, CLAVES_DEL_BORRADOR));
  },
  (b, s) => {
    b[elegir(s, ['titulo', 'obra', 'descripcion'])] = elegir(s, [5, null, true, []]);
  },
  (b, s) => {
    b.titulo = elegir(s, [
      't'.repeat(200),
      't'.repeat(201),
      '😀'.repeat(200),
      '😀'.repeat(201),
      '',
    ]);
  },
  (b, s) => {
    b.obra = elegir(s, ['o'.repeat(300), 'o'.repeat(301), ' ']);
  },
  (b, s) => {
    b.descripcion = elegir(s, ['d'.repeat(4000), 'd'.repeat(4001)]);
  },
  (b, s) => {
    b.muebles = elegir(s, [null, 'muebles', {}, []]);
  },
  (b, s) => {
    b.muebles = Array.from({ length: elegir(s, [30, 31]) }, (_, i) => ({
      id: `m${String(i)}`,
      nombre: '',
      descripcion: '',
    }));
  },
  (b, s) => {
    const mueble = unoDeLaLista(s, b.muebles);
    if (!mueble) return;
    const campo = elegir(s, ['id', 'nombre', 'descripcion']);
    if (s(3) === 0) Reflect.deleteProperty(mueble, campo);
    else mueble[campo] = elegir(s, [5, null, true]);
  },
  (b, s) => {
    const mueble = unoDeLaLista(s, b.muebles);
    if (mueble)
      mueble.id = elegir(s, ['', 'M1', 'a'.repeat(61), 'mueble 1', 'mueble-1', 'a'.repeat(60)]);
  },
  (b) => {
    const [primero, segundo] = comoLista(b.muebles);
    if (primero && segundo) segundo.id = primero.id;
  },
  (b, s) => {
    const mueble = unoDeLaLista(s, b.muebles);
    if (mueble) mueble.nombre = elegir(s, ['n'.repeat(120), 'n'.repeat(121), '😀'.repeat(121)]);
  },
  (b, s) => {
    const mueble = unoDeLaLista(s, b.muebles);
    if (mueble) mueble.descripcion = elegir(s, ['d'.repeat(4000), 'd'.repeat(4001), '   ']);
  },
  (b, s) => {
    (comoLista(b.muebles) as unknown[]).push(elegir(s, ['mueble', 5, null]));
  },
  (b, s) => {
    b.herrajes = elegir(s, [null, [], 'herrajes']);
  },
  (b, s) => {
    const herrajes = comoObjeto(b.herrajes);
    if (!herrajes) return;
    if (s(4) === 0) Reflect.deleteProperty(herrajes, elegir(s, ['mostrar', 'lista']));
    else herrajes.mostrar = elegir(s, ['true', 1, null, false]);
  },
  (b, s) => {
    const herrajes = comoObjeto(b.herrajes);
    if (herrajes) {
      herrajes.lista = Array.from({ length: elegir(s, [40, 41]) }, (_, i) => ({
        id: `h${String(i)}`,
        texto: 'Un herraje.',
      }));
    }
  },
  (b, s) => {
    const herraje = unoDeLaLista(s, comoObjeto(b.herrajes)?.lista);
    if (herraje) {
      herraje[elegir(s, ['id', 'texto'])] = elegir(s, [
        '',
        'H',
        'h'.repeat(200),
        'h'.repeat(201),
        5,
      ]);
    }
  },
  (b) => {
    const lista = comoLista(comoObjeto(b.herrajes)?.lista);
    const [primero, segundo] = lista;
    if (primero && segundo) segundo.id = primero.id;
  },
  (b, s) => {
    b[elegir(s, GRUPOS_DE_CLAUSULAS)] = elegir(s, [null, [], 'seleccion']);
  },
  (b, s) => {
    const seleccion = comoObjeto(b[elegir(s, GRUPOS_DE_CLAUSULAS)]);
    if (!seleccion) return;
    seleccion.tildadas = elegir(s, [
      null,
      'tildadas',
      [5],
      Array.from({ length: elegir(s, [20, 21]) }, (_, i) => `t-${String(i)}`),
      ['ok', 'ok'],
      ['MAL'],
      [''],
      ['incluye-visita'],
    ]);
  },
  (b, s) => {
    const seleccion = comoObjeto(b[elegir(s, GRUPOS_DE_CLAUSULAS)]);
    if (!seleccion) return;
    seleccion.propias = elegir(s, [
      null,
      Array.from({ length: elegir(s, [20, 21]) }, (_, i) => ({
        id: `p${String(i)}`,
        texto: 'Propia.',
      })),
      [{ id: 'p', texto: 'a'.repeat(1000) }],
      [{ id: 'p', texto: 'a'.repeat(1001) }],
      [{ id: 'p', texto: 5 }],
      [{ id: 'P', texto: 'x' }],
      [
        { id: 'p', texto: 'x' },
        { id: 'p', texto: 'y' },
      ],
      [{ texto: 'sin id' }],
      ['propia'],
    ]);
  },
  (b, s) => {
    b.formaDePago = elegir(s, [
      null,
      'forma',
      5,
      { plantillaId: 'sena-y-entrega' },
      { plantillaId: 'sena-y-entrega', texto: null },
      { plantillaId: 'SENA', texto: null },
      { plantillaId: 5, texto: null },
      { plantillaId: 'otra', texto: 'f'.repeat(2000) },
      { plantillaId: 'otra', texto: 'f'.repeat(2001) },
      { plantillaId: 'otra', texto: 5 },
    ]);
  },
  (b, s) => {
    b.plazoDeFabricacion = elegir(s, [0, 1, 365, 366, -5, 1.5, '30', null]);
  },
  (b, s) => {
    b.validezDias = elegir(s, [null, 0, 1, 365, 366, 1.5, '15']);
  },
  (b, s) => {
    b.clausulaDeLaMoneda = elegir(s, [
      null,
      '',
      'c'.repeat(2000),
      'c'.repeat(2001),
      '😀'.repeat(2001),
      5,
      [],
    ]);
  },
  (b, s) => {
    b.modificacion = elegir(s, [
      null,
      'modificación',
      5,
      {},
      [],
      { importe: 5_000_000, moneda: 'ARS' },
      { importe: 50_000, moneda: 'USD' },
      { importe: 0, moneda: 'USD' },
      { importe: -1, moneda: 'ARS' },
      { importe: 1_000_000_000_000, moneda: 'ARS' },
      { importe: 1_000_000_000_001, moneda: 'USD' },
      { importe: 1.5, moneda: 'ARS' },
      { importe: '5', moneda: 'ARS' },
      { importe: 5, moneda: 'EUR' },
      { importe: 5, moneda: null },
      { importe: 5 },
      { moneda: 'ARS' },
    ]);
  },
  (b, s) => {
    b.monedaDeLoAbonado = elegir(s, [null, 'ARS', 'USD', 'EUR', 5, []]);
  },
  (b) => {
    b.extra = 'se ignora';
  },
];

const CLAVES_DEL_DOCUMENTO = [
  'forma',
  'taller',
  'cliente',
  'titulo',
  'obra',
  'descripcion',
  'muebles',
  'herrajes',
  'aTenerEnCuenta',
  'incluye',
  'valores',
  'senaBp',
  'abonado',
  'formaDePago',
  'plazoDeFabricacion',
  'validezDias',
  'avisos',
  'condiciones',
  'garantia',
  'garantiaMeses',
  'clausulaDeLaMoneda',
  'cobraEn',
] as const;

const TOPES_DEL_TALLER = [
  ['nombre', 120],
  ['titular', 120],
  ['cuit', 13],
  ['domicilio', 300],
  ['telefono', 40],
  ['email', 200],
] as const;

const TOPES_DE_LOS_TEXTOS = [
  ['cliente', 200],
  ['titulo', 200],
  ['obra', 300],
  ['descripcion', 4000],
  ['garantia', 4000],
  ['formaDePago', 4000],
] as const;

function opcionesDelDocumento(cantidad: number): Objeto[] {
  return Array.from({ length: cantidad }, (_, i) => ({
    id: `0199a1b2-0000-7000-8000-${String(i).padStart(12, '0')}`,
    letra: letraDeLaOpcion(i),
    descripcion: `Opción ${String(i)}`,
    total: 1_000_000 + i,
  }));
}

const CAMBIOS_DEL_DOCUMENTO: readonly ((
  documento: Objeto,
  siguiente: (tope: number) => number,
) => void)[] = [
  (d, s) => {
    d.forma = elegir(s, [2, null, '1']);
  },
  (d, s) => {
    Reflect.deleteProperty(d, elegir(s, CLAVES_DEL_DOCUMENTO));
  },
  (d, s) => {
    d.taller = elegir(s, [null, 'taller', []]);
  },
  (d, s) => {
    const taller = comoObjeto(d.taller);
    if (!taller) return;
    const [campo] = elegir(s, TOPES_DEL_TALLER);
    if (s(3) === 0) Reflect.deleteProperty(taller, campo);
    else taller[campo] = elegir(s, [5, null]);
  },
  (d, s) => {
    const taller = comoObjeto(d.taller);
    if (!taller) return;
    if (s(4) === 0) Reflect.deleteProperty(taller, 'condicionFiscal');
    else {
      taller.condicionFiscal = elegir(s, [
        null,
        'monotributo',
        'responsable_inscripto',
        'exento',
        'otro',
        5,
        '',
      ]);
    }
  },
  (d, s) => {
    const taller = comoObjeto(d.taller);
    if (!taller) return;
    const [campo, tope] = elegir(s, TOPES_DEL_TALLER);
    taller[campo] = 'x'.repeat(tope + s(2));
  },
  (d, s) => {
    const [campo] = elegir(s, TOPES_DE_LOS_TEXTOS);
    d[campo] = elegir(s, [5, true, []]);
  },
  (d, s) => {
    const [campo, tope] = elegir(s, TOPES_DE_LOS_TEXTOS);
    d[campo] = elegir(s, ['x', '😀']).repeat(tope + s(2));
  },
  (d, s) => {
    d.muebles = elegir(s, [
      null,
      'muebles',
      [5],
      [{ nombre: 'Sin detalle' }],
      Array.from({ length: elegir(s, [30, 31]) }, () => ({ nombre: 'M', descripcion: 'D' })),
    ]);
  },
  (d, s) => {
    const mueble = unoDeLaLista(s, d.muebles);
    if (!mueble) return;
    if (s(2) === 0) mueble.nombre = 'n'.repeat(120 + s(2));
    else mueble.descripcion = 'd'.repeat(4000 + s(2));
  },
  (d, s) => {
    d.herrajes = elegir(s, [
      null,
      [5],
      Array.from({ length: elegir(s, [40, 41]) }, () => 'H'),
      ['h'.repeat(200)],
      ['h'.repeat(201)],
    ]);
  },
  (d, s) => {
    d[elegir(s, ['aTenerEnCuenta', 'incluye'])] = elegir(s, [
      null,
      [5],
      Array.from({ length: elegir(s, [40, 41]) }, () => 'T'),
      ['t'.repeat(4000)],
      ['t'.repeat(4001)],
    ]);
  },
  (d, s) => {
    d[elegir(s, ['avisos', 'condiciones'])] = elegir(s, [
      null,
      [5],
      [{ texto: 5 }],
      [{ titulo: 5, texto: 'x' }],
      [{ texto: 'Sin título.' }],
      [{ titulo: null, texto: 'x' }],
      Array.from({ length: elegir(s, [40, 41]) }, () => ({ titulo: null, texto: 'A' })),
      [{ titulo: 't'.repeat(120), texto: 'x' }],
      [{ titulo: 't'.repeat(121), texto: 'x' }],
      [{ titulo: null, texto: 'x'.repeat(4001) }],
    ]);
  },
  (d, s) => {
    d.valores = elegir(s, [
      null,
      'valores',
      {},
      { tipo: 'total' },
      { tipo: 'total', total: '5' },
      { tipo: 'total', total: 1.5 },
      { tipo: 'total', total: -1 },
      { tipo: 'total', total: 0 },
      { tipo: 'total', total: 1_000_000_000_000 },
      { tipo: 'total', total: 1_000_000_000_001 },
      { tipo: 'total', total: 5, opciones: 'se ignoran' },
      { tipo: 'otro', total: 5 },
      { tipo: 'opciones' },
      { tipo: 'opciones', opciones: [] },
      { tipo: 'opciones', opciones: 'opciones' },
      { tipo: 'opciones', opciones: opcionesDelDocumento(elegir(s, [1, 26, 27])) },
    ]);
  },
  (d, s) => {
    const valores = comoObjeto(d.valores);
    const opcion = unoDeLaLista(s, valores?.opciones);
    if (!opcion) return;
    const cambio = s(7);
    if (cambio === 0) Reflect.deleteProperty(opcion, 'letra');
    else if (cambio === 1) opcion.total = elegir(s, ['5', -1, 1_000_000_000_001, 2.5]);
    else if (cambio === 2) opcion.letra = elegir(s, ['ABC', 'ABCD', '']);
    else if (cambio === 3) opcion.descripcion = 'o'.repeat(500 + s(2));
    else if (cambio === 4) opcion.id = elegir(s, [5, null]);
    else if (cambio === 5) Reflect.deleteProperty(opcion, 'descripcion');
    else (comoLista(valores?.opciones) as unknown[]).push(elegir(s, ['opción', 5]));
  },
  (d, s) => {
    d.senaBp = elegir(s, [-1, 0, 10_000, 10_001, 1.5, '5000', null]);
  },
  (d, s) => {
    d.abonado = elegir(s, [-1, 0, 1_000_000_000_000, 1_000_000_000_001, 0.5]);
  },
  (d, s) => {
    d.formaDePago = elegir(s, [null, 5, '']);
  },
  (d, s) => {
    d.plazoDeFabricacion = elegir(s, [0, 1, 365, 366, '30']);
  },
  (d, s) => {
    d.validezDias = elegir(s, [null, 0, 1, 365, 366, '15']);
  },
  (d, s) => {
    d.garantiaMeses = elegir(s, [5, 6, 120, 121, 6.5, null]);
  },
  (d, s) => {
    d.clausulaDeLaMoneda = elegir(s, [
      null,
      '',
      'c'.repeat(4000),
      'c'.repeat(4001),
      '😀'.repeat(4001),
      5,
    ]);
  },
  (d, s) => {
    d.cobraEn = elegir(s, [
      ['ARS'],
      ['USD'],
      ['ARS', 'USD'],
      ['USD', 'ARS'],
      ['ARS', 'ARS'],
      ['EUR'],
      [],
      null,
      'ARS',
    ]);
  },
  (d, s) => {
    Object.assign(d, {
      forma: 2,
      moneda: 'USD',
      monedaDeLoAbonado: elegir(s, ['USD', 'ARS']),
      referencia: { cotizacion: 154_000, fecha: '2026-10-01' },
    });
  },
  (d, s) => {
    if (d.forma !== 2) return;
    const cambio = s(6);
    const referencia = comoObjeto(d.referencia);
    if (cambio === 0) d.moneda = elegir(s, ['ARS', 'EUR', null, 5]);
    else if (cambio === 1) d.monedaDeLoAbonado = elegir(s, ['EUR', null, 5]);
    else if (cambio === 2) d.referencia = elegir(s, [null, {}, 'referencia', []]);
    else if (cambio === 3 && referencia) {
      referencia.cotizacion = elegir(s, [99, 100, 10_000_000, 10_000_001, 1.5, '154000', null, -5]);
    } else if (cambio === 4 && referencia) {
      referencia.fecha = elegir(s, [
        '2026-02-29',
        '2028-02-29',
        '2026-09-31',
        '2026-13-01',
        '0050-01-01',
        '0100-01-01',
        '26-10-01',
        '2026-1-1',
        '2026-10-01T00:00',
        5,
        null,
      ]);
    } else Reflect.deleteProperty(d, elegir(s, ['moneda', 'monedaDeLoAbonado', 'referencia']));
  },
  (d) => {
    d.extra = 'se ignora';
  },
];

function documentoEnDolaresDePrueba(abonado: number): unknown {
  return copiaDeJson(
    documentoDelPresupuesto(
      {
        borrador: borradorDelPresupuesto(),
        plantilla: PLANTILLA_DE_SIEMPRE,
        taller: TALLER_DEL_PRESUPUESTO,
        cliente: 'Paula Benítez',
        moneda: 'USD',
        cobraEn: ['ARS', 'USD'],
        referencia: { cotizacion: cotizacion(154_000), fecha: '2026-10-01' },
        valores: valoresDelTrabajo(centavosEn('USD', 150_000), []),
        senaBp: puntosBasicos(5000),
        abonado: centavosEn('USD', abonado),
      },
      FORMATOS_DEL_PRESUPUESTO,
    ),
  );
}

interface CasoParaMandar {
  documento: DocumentoDelPresupuesto;
  revision: number;
  queCambio: string;
}

function paraMandarAlAzar(escala: number): CasoParaMandar[] {
  const siguiente = generador(20_261_004);
  const casos: CasoParaMandar[] = [];
  for (let i = 0; i < 1_500 * escala; i++) {
    const conOpciones = siguiente(3) === 0;
    const valores = conOpciones
      ? valoresDelTrabajo(
          null,
          OPCIONES_DEL_PRESUPUESTO.map((opcion) => ({
            ...opcion,
            monto: centavos(elegir(siguiente, [0, 1, 218_100_000])),
          })),
        )
      : elegir(siguiente, [
          null,
          valoresDelTrabajo(centavos(elegir(siguiente, [0, 1, 50_000_000])), []),
        ]);
    const base = documentoDePrueba(valores, 0);
    const documento: DocumentoDelPresupuesto = {
      ...base,
      titulo: elegir(siguiente, ['', ' \n', ' ', 'Cocina', base.titulo]),
      muebles: elegir(siguiente, [
        [],
        [{ nombre: 'Alacena', descripcion: '' }],
        [{ nombre: '', descripcion: ' \t ' }],
        [{ nombre: 'Alacena', descripcion: 'Con puertas rebatibles.' }],
        [
          { nombre: 'Bajomesada', descripcion: '' },
          { nombre: '', descripcion: 'Con cajonera.' },
        ],
        base.muebles,
      ]),
      valores:
        valores?.tipo === 'opciones' && siguiente(6) === 0
          ? { tipo: 'opciones', opciones: [] }
          : valores,
    };
    casos.push({
      documento,
      revision: elegir(siguiente, [1, 2, 3]),
      queCambio: elegir(siguiente, [
        '',
        '   ',
        '\v\f',
        ' ',
        'Cambié el color de la alacena.',
        'a'.repeat(280),
        'a'.repeat(281),
        ` ${'a'.repeat(280)} \n`,
        '😀'.repeat(280),
        '😀'.repeat(281),
      ]),
    });
  }
  return casos;
}

interface CasosDelPresupuesto {
  plantillas: unknown[];
  borradores: unknown[];
  documentos: unknown[];
  paraMandar: CasoParaMandar[];
}

function conTildadas(cantidad: number): unknown {
  return copiaDeJson({
    ...borradorDelPresupuesto(),
    avisos: {
      tildadas: Array.from({ length: cantidad }, (_, i) => `aviso-${String(i)}`),
      propias: [],
    },
  });
}

function conOpciones(cantidad: number): unknown {
  return copiaDeJson(
    documentoDePrueba(
      valoresDelTrabajo(
        null,
        Array.from({ length: cantidad }, (_, i) => ({
          id: `0199a1b2-0000-7000-8000-${String(i).padStart(12, '0')}`,
          descripcion: `Opción ${String(i)}`,
          monto: centavos(1_000_000 + i),
        })),
      ),
      0,
    ),
  );
}

function casosDelPresupuestoConEscala(escala: number): CasosDelPresupuesto {
  const fijos: unknown[] = [null, [], 'presupuesto', 5, {}, { forma: 1 }];
  return {
    plantillas: [
      ...fijos,
      copiaDeJson(PLANTILLA_DE_SIEMPRE),
      ...alAzarConCambios(
        20_261_001,
        1_500 * escala,
        () => PLANTILLA_DE_SIEMPRE,
        CAMBIOS_DE_LA_PLANTILLA,
      ),
    ],
    borradores: [
      ...fijos,
      copiaDeJson(borradorDelPresupuesto()),
      conTildadas(20),
      conTildadas(21),
      ...alAzarConCambios(20_261_002, 1_500 * escala, borradorDelPresupuesto, CAMBIOS_DEL_BORRADOR),
    ],
    documentos: [
      ...fijos,
      copiaDeJson(documentoDePrueba(null, 0)),
      conOpciones(26),
      conOpciones(27),
      ...alAzarConCambios(
        20_261_003,
        1_500 * escala,
        () =>
          documentoDePrueba(
            valoresDelTrabajo(centavos(218_100_000), OPCIONES_DEL_PRESUPUESTO),
            12_000_000,
          ),
        CAMBIOS_DEL_DOCUMENTO,
      ),
      ...alAzarConCambios(
        20_261_005,
        500 * escala,
        () => documentoDePrueba(valoresDelTrabajo(centavos(218_100_000), []), 0),
        CAMBIOS_DEL_DOCUMENTO,
      ),
      documentoEnDolaresDePrueba(0),
      ...alAzarConCambios(
        20_261_006,
        800 * escala,
        () => documentoEnDolaresDePrueba(8_276),
        CAMBIOS_DEL_DOCUMENTO,
      ),
    ],
    paraMandar: paraMandarAlAzar(escala),
  };
}

export function casosDelPresupuesto(escala = 1): number {
  const casos = casosDelPresupuestoConEscala(escala);
  return (
    casos.plantillas.length +
    casos.borradores.length +
    casos.documentos.length +
    casos.paraMandar.length
  );
}

export async function compararPresupuesto(cliente: pg.Client, escala = 1): Promise<string[]> {
  await cliente.query(RECHAZO_DE_LA_GEMELA);
  const casos = casosDelPresupuestoConEscala(escala);
  const deUnProblema = {
    enJson: (caso: unknown) => JSON.stringify(caso),
    deSql: (fila: Record<string, unknown>) =>
      typeof fila.problema === 'string' ? fila.problema : 'null',
    deTs: (problema: string | null) => String(problema),
  };

  const plantillas = await compararGemela<unknown, string | null>(cliente, {
    nombre: 'problema de la plantilla',
    casos: casos.plantillas,
    ts: problemaDeLaPlantilla,
    sql: `select private.problema_de_la_plantilla(c.caso) as problema
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          order by c.orden`,
    ...deUnProblema,
  });

  const borradores = await compararGemela<unknown, string | null>(cliente, {
    nombre: 'problema del borrador',
    casos: casos.borradores,
    ts: problemaDelBorrador,
    sql: `select private.problema_del_presupuesto(c.caso) as problema
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          order by c.orden`,
    ...deUnProblema,
  });

  const documentos = await compararGemela<unknown, string | null>(cliente, {
    nombre: 'problema del documento',
    casos: casos.documentos,
    ts: problemaDelDocumento,
    sql: `select private.problema_del_documento(c.caso) as problema
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          order by c.orden`,
    ...deUnProblema,
  });

  const paraMandar = await compararGemela<CasoParaMandar, string[]>(cliente, {
    nombre: 'lo que falta para mandar',
    casos: casos.paraMandar,
    ts: (caso) =>
      problemasParaMandar(caso.documento, caso.revision, caso.queCambio).map(({ campo }) => campo),
    sql: `select private.lo_que_falta_para_mandar(
            c.caso -> 'documento', (c.caso ->> 'revision')::integer, c.caso ->> 'queCambio'
          ) as falta
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          order by c.orden`,
    enJson: (caso) => JSON.stringify(caso),
    deSql: (fila) => JSON.stringify(fila.falta),
    deTs: (falta) => JSON.stringify(falta),
  });

  return [...plantillas, ...borradores, ...documentos, ...paraMandar];
}

const CUITS_PARA_COMPARAR: readonly string[] = (() => {
  const casos = [
    '',
    'abc',
    '20111111112',
    '20-11111111-2',
    ' 20-11111111-2 ',
    '20.11111111.2',
    '2011111111',
    '201111111123',
    '２０-11111111-2',
    '20-00000001-0',
  ];
  for (const prefijo of ['20', '21', '23', '24', '27', '30', '33', '34', '99']) {
    for (const cuerpo of ['11111111', '30123456', '71234567', '00000001', '28456123']) {
      for (let verificador = 0; verificador <= 9; verificador++) {
        casos.push(`${prefijo}-${cuerpo}-${String(verificador)}`);
      }
    }
  }
  return casos;
})();

interface CasoDelDocumento {
  condicion: CondicionDelReceptor;
  cuit: string;
  dni: string;
  operacion: number;
}

const CASOS_DEL_DOCUMENTO: readonly CasoDelDocumento[] = CONDICIONES_DEL_RECEPTOR.flatMap(
  (condicion) =>
    ['', '20-11111111-2', '20-11111111-3', '20-00000001-0', 'abc', '30-71234567-1'].flatMap(
      (cuit) =>
        ['', '1234567', '12345678', '123456', '123456789', '12.345.678', ' 12345678'].flatMap(
          (dni) =>
            [0, 999_999_999, 1_000_000_000, 5_000_000_000].map((operacion) => ({
              condicion,
              cuit,
              dni,
              operacion,
            })),
        ),
    ),
);

const TEXTOS_PARA_FACTURAR = ['', ' ', '\t\n', 'R', ' '] as const;

function casosDeLoQueFalta(): DatosParaFacturar[] {
  const opciones = {
    tallerCondicion: [null, 'monotributo', 'responsable_inscripto', 'exento'] as const,
    inicio: [null, '2019-03-01'] as const,
    moneda: ['ARS', 'USD'] as const,
    siNo: [false, true] as const,
    precio: [null, 0, 999_999_999, 1_000_000_000, 3_000_000_000] as const,
    cobrado: [0, 999_999_999, 1_000_000_000] as const,
    cuit: ['', '20-11111111-2', '20-11111111-3', 'abc', '30-71234567-1'] as const,
    dni: ['', '12345678', '123'] as const,
    domicilio: ['', ' ', 'Calle 1'] as const,
  };
  let semilla = 85;
  const elegir = <T>(lista: readonly T[]): T => {
    semilla = (semilla * 1_103_515_245 + 12_345) % 2_147_483_648;
    return lista[semilla % lista.length] as T;
  };
  const caso = (): DatosParaFacturar => {
    const precio = elegir(opciones.precio);
    return {
      taller: {
        condicion: elegir(opciones.tallerCondicion),
        razonSocial: elegir(TEXTOS_PARA_FACTURAR),
        domicilio: elegir(TEXTOS_PARA_FACTURAR),
        ingresosBrutos: elegir(TEXTOS_PARA_FACTURAR),
        inicioDeActividades: elegir(opciones.inicio),
      },
      trabajo: {
        moneda: elegir(opciones.moneda),
        borrado: elegir(opciones.siNo),
        precio: precio === null ? null : centavos(precio),
        cobrado: centavos(elegir(opciones.cobrado)),
      },
      pago: {
        moneda: elegir(opciones.moneda),
        borrado: elegir(opciones.siNo),
        yaEnLaApertura: elegir(opciones.siNo),
      },
      cliente: {
        condicion: elegir(CONDICIONES_DEL_RECEPTOR),
        cuit: elegir(opciones.cuit),
        dni: elegir(opciones.dni),
        domicilioFiscal: elegir(opciones.domicilio),
        direccion: elegir(opciones.domicilio),
      },
    };
  };
  const base: DatosParaFacturar = {
    taller: {
      condicion: 'monotributo',
      razonSocial: 'RIVAS MARTIN',
      domicilio: 'Pasaje Los Robles 450',
      ingresosBrutos: '20-11111111-2',
      inicioDeActividades: '2019-03-01',
    },
    trabajo: { moneda: 'ARS', borrado: false, precio: centavos(90_000_000), cobrado: centavos(0) },
    pago: { moneda: 'ARS', borrado: false, yaEnLaApertura: false },
    cliente: {
      condicion: 'consumidor_final',
      cuit: '',
      dni: '',
      domicilioFiscal: '',
      direccion: '',
    },
  };
  const casos: DatosParaFacturar[] = [base];
  for (const condicion of CONDICIONES_DEL_RECEPTOR) {
    for (const cuit of opciones.cuit) {
      casos.push({ ...base, cliente: { ...base.cliente, condicion, cuit } });
    }
  }
  for (let i = 0; i < 800; i++) casos.push(caso());
  return casos;
}

export async function compararFacturacion(cliente: pg.Client): Promise<string[]> {
  await cliente.query(RECHAZO_DE_LA_GEMELA);

  const condiciones = await compararGemela<CondicionDelReceptor, number>(cliente, {
    nombre: 'la condición frente al IVA del receptor',
    casos: CONDICIONES_DEL_RECEPTOR,
    ts: condicionIvaDelReceptor,
    sql: `select private.condicion_iva_del_receptor((c.caso #>> '{}')::public.condicion_fiscal) as condicion
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          order by c.orden`,
    enJson: (caso) => JSON.stringify(caso),
    deSql: (fila) => String(fila.condicion),
    deTs: (condicion) => String(condicion),
  });

  const cuits = await compararGemela<string, boolean>(cliente, {
    nombre: 'el CUIT válido para facturar',
    casos: CUITS_PARA_COMPARAR,
    ts: cuitValido,
    sql: `select private.cuit_valido(c.caso #>> '{}') as valido
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          order by c.orden`,
    enJson: (caso) => JSON.stringify(caso),
    deSql: (fila) => String(fila.valido),
    deTs: (valido) => String(valido),
  });

  const documentos = await compararGemela<CasoDelDocumento, unknown>(cliente, {
    nombre: 'el documento del receptor',
    casos: CASOS_DEL_DOCUMENTO,
    ts: (caso) =>
      documentoDelReceptor(
        { condicion: caso.condicion, cuit: caso.cuit, dni: caso.dni },
        centavos(caso.operacion),
      ),
    sql: `select private.documento_del_receptor(
            (c.caso ->> 'condicion')::public.condicion_fiscal, c.caso ->> 'cuit', c.caso ->> 'dni',
            (c.caso ->> 'operacion')::bigint
          ) as documento
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          order by c.orden`,
    enJson: (caso) => JSON.stringify(caso),
    deSql: (fila) => canonico(fila.documento),
    deTs: (documento) => canonico(documento),
  });

  const faltas = await compararGemela<DatosParaFacturar, string[]>(cliente, {
    nombre: 'lo que falta para facturar',
    casos: casosDeLoQueFalta(),
    ts: loQueFaltaParaFacturar,
    sql: `select private.lo_que_falta_para_facturar(c.caso) as falta
          from unnest($1::jsonb[]) with ordinality as c (caso, orden)
          order by c.orden`,
    enJson: (caso) => JSON.stringify(caso),
    deSql: (fila) => JSON.stringify(fila.falta),
    deTs: (falta) => JSON.stringify(falta),
  });

  return [...condiciones, ...cuits, ...documentos, ...faltas];
}

export async function compararDominioYSql(cliente: pg.Client): Promise<string[]> {
  return [
    ...(await compararFacturacion(cliente)),
    ...(await compararCascada(cliente)),
    ...(await compararTopes(cliente)),
    ...(await compararPagosPorDelante(cliente)),
    ...(await compararSenaEsperada(cliente)),
    ...(await compararConversiones(cliente)),
    ...(await compararFormasDeCobro(cliente)),
    ...(await compararLinkDeCobro(cliente)),
    ...(await compararLinkDeResena(cliente)),
    ...(await compararLinksDeLasRedes(cliente)),
    ...(await compararNombreDeNecesidad(cliente)),
    ...(await compararValidacionDeRespuestas(cliente)),
    ...(await compararValidacionDeRespuestasDeEntrega(cliente)),
    ...(await compararRangos(cliente)),
    ...(await compararFila(cliente)),
    ...(await compararPresupuesto(cliente)),
    ...(await compararEstados(cliente)),
    ...(await compararTransiciones(cliente)),
    ...(await compararLiquidaciones(cliente)),
    ...(await compararLibroMayor(cliente)),
    ...(await compararGuardadoDeProyecto(cliente)),
  ];
}

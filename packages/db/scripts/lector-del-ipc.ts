export const CSV_DEL_INDEC =
  'https://www.indec.gob.ar/ftp/cuadros/economia/serie_ipc_divisiones.csv';

export const API_DE_DATOS_GOB_AR =
  'https://apis.datos.gob.ar/series/api/series/?ids=148.3_INIVELNAL_DICI_M_26&format=json&limit=1000';

export const FUENTE_DEL_CSV =
  'INDEC, IPC nivel general nacional, base diciembre 2016 = 100 (serie_ipc_divisiones.csv)';

export const FUENTE_DE_LA_API =
  'INDEC por datos.gob.ar, serie 148.3_INIVELNAL_DICI_M_26, base diciembre 2016 = 100';

export const ENCABEZADO_DEL_CSV = [
  'Codigo',
  'Descripcion',
  'Clasificador',
  'Periodo',
  'Indice_IPC',
  'v_m_IPC',
  'v_i_a_IPC',
  'Region',
] as const;

export const PRIMER_MES = '2016-12';

export interface SerieDelIndice {
  desde: string;
  hasta: string;
  valores: number[];
}

export class FormaInesperada extends Error {
  override readonly name = 'FormaInesperada';
}

function mesSiguiente(mes: string): string {
  const anio = Number(mes.slice(0, 4));
  const numero = Number(mes.slice(5, 7));
  return numero === 12
    ? `${String(anio + 1)}-01`
    : `${String(anio)}-${String(numero + 1).padStart(2, '0')}`;
}

function valorDelIndice(texto: string, donde: string): number {
  if (!/^\d+(,\d+)?$/.test(texto)) {
    throw new FormaInesperada(`${donde}: el índice «${texto}» no es un número con coma decimal.`);
  }
  const valor = Number(texto.replace(',', '.'));
  if (valor <= 0) throw new FormaInesperada(`${donde}: el índice ${texto} no es positivo.`);
  return valor;
}

function serieEnOrden(meses: readonly [string, number][], origen: string): SerieDelIndice {
  if (meses.length === 0) throw new FormaInesperada(`${origen}: no trajo ningún mes.`);
  const ordenados = [...meses].sort(([uno], [otro]) => (uno < otro ? -1 : uno > otro ? 1 : 0));
  const [primero] = ordenados;
  if (primero?.[0] !== PRIMER_MES || primero[1] !== 100) {
    throw new FormaInesperada(
      `${origen}: la serie tiene que empezar en ${PRIMER_MES} con 100 (la base), y empieza en ${String(primero?.[0])} con ${String(primero?.[1])}.`,
    );
  }
  let esperado = PRIMER_MES;
  for (const [mes] of ordenados) {
    if (mes !== esperado) {
      throw new FormaInesperada(
        `${origen}: se esperaba ${esperado} y vino ${mes}: falta un mes o se repite uno.`,
      );
    }
    esperado = mesSiguiente(mes);
  }
  return {
    desde: PRIMER_MES,
    hasta: ordenados.at(-1)?.[0] ?? PRIMER_MES,
    valores: ordenados.map(([, valor]) => valor),
  };
}

export function leerElCsv(texto: string): SerieDelIndice {
  const renglones = texto
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((renglon) => renglon.trim() !== '');
  const [encabezado, ...filas] = renglones;
  if (encabezado !== ENCABEZADO_DEL_CSV.join(';')) {
    throw new FormaInesperada(
      `El CSV del INDEC cambió de forma: el encabezado es «${String(encabezado)}» y se esperaba «${ENCABEZADO_DEL_CSV.join(';')}».`,
    );
  }

  const meses: [string, number][] = [];
  for (const [indice, fila] of filas.entries()) {
    const campos = fila.split(';');
    if (campos.length !== ENCABEZADO_DEL_CSV.length) {
      throw new FormaInesperada(
        `El renglón ${String(indice + 2)} del CSV tiene ${String(campos.length)} campos y no ${String(ENCABEZADO_DEL_CSV.length)}.`,
      );
    }
    const [codigo, descripcion, , periodo = '', valor = '', , , region] = campos;
    if (codigo !== '0' || descripcion !== 'NIVEL GENERAL' || region !== 'Nacional') continue;
    if (!/^\d{4}(0[1-9]|1[0-2])$/.test(periodo)) {
      throw new FormaInesperada(`El período «${periodo}» del CSV no es AAAAMM.`);
    }
    const mes = `${periodo.slice(0, 4)}-${periodo.slice(4, 6)}`;
    meses.push([mes, valorDelIndice(valor, mes)]);
  }
  return serieEnOrden(meses, 'El CSV del INDEC');
}

export function leerLaApi(cuerpo: unknown): SerieDelIndice {
  const datos =
    typeof cuerpo === 'object' && cuerpo !== null ? (cuerpo as { data?: unknown }).data : undefined;
  if (!Array.isArray(datos)) {
    throw new FormaInesperada('La API de datos.gob.ar no devolvió `data` como una lista.');
  }
  const meses = (datos as readonly unknown[]).map((fila): [string, number] => {
    const [fecha, valor] = Array.isArray(fila) ? (fila as readonly unknown[]) : [];
    if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-01$/.test(fecha)) {
      throw new FormaInesperada(`La API trajo una fecha que no es AAAA-MM-01: ${String(fecha)}.`);
    }
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
      throw new FormaInesperada(`La API trajo un índice que no es positivo en ${fecha}.`);
    }
    return [fecha.slice(0, 7), valor];
  });
  return serieEnOrden(meses, 'La API de datos.gob.ar');
}

export function textoDelIndice(serie: SerieDelIndice, fuente: string): string {
  return [
    "import type { IndiceDePrecios } from './inflacion.ts';",
    '',
    'export const IPC: IndiceDePrecios = {',
    `  fuente: ${JSON.stringify(fuente)},`,
    `  desde: '${serie.desde}',`,
    `  hasta: '${serie.hasta}',`,
    `  valores: [${serie.valores.map(String).join(', ')}],`,
    '};',
    '',
  ].join('\n');
}

import { writeFileSync } from 'node:fs';
import path from 'node:path';

import * as prettier from 'prettier';

import { RAIZ } from './conexion.ts';
import {
  API_DE_DATOS_GOB_AR,
  CSV_DEL_INDEC,
  FUENTE_DE_LA_API,
  FUENTE_DEL_CSV,
  leerElCsv,
  leerLaApi,
  textoDelIndice,
  type SerieDelIndice,
} from './lector-del-ipc.ts';

const DESTINO = path.join(RAIZ, 'packages', 'domain', 'src', 'ipc.ts');
const ESPERA_MS = 30_000;

async function bajar(url: string): Promise<Response> {
  const respuesta = await fetch(url, { signal: AbortSignal.timeout(ESPERA_MS) });
  if (!respuesta.ok) throw new Error(`${url} devolvió ${String(respuesta.status)}.`);
  return respuesta;
}

async function delIndec(): Promise<SerieDelIndice> {
  const respuesta = await bajar(CSV_DEL_INDEC);
  return leerElCsv(Buffer.from(await respuesta.arrayBuffer()).toString('latin1'));
}

async function deDatosGobAr(): Promise<SerieDelIndice> {
  const respuesta = await bajar(API_DE_DATOS_GOB_AR);
  return leerLaApi(await respuesta.json());
}

let serie: SerieDelIndice;
let fuente: string;
try {
  serie = await delIndec();
  fuente = FUENTE_DEL_CSV;
} catch (error) {
  console.warn(
    `El CSV del INDEC no sirvió (${error instanceof Error ? error.message : String(error)}). Sigo con la API de datos.gob.ar.`,
  );
  serie = await deDatosGobAr();
  fuente = FUENTE_DE_LA_API;
}

const opciones = (await prettier.resolveConfig(DESTINO)) ?? {};
writeFileSync(
  DESTINO,
  await prettier.format(textoDelIndice(serie, fuente), { ...opciones, filepath: DESTINO }),
);
console.log(
  `Escrito ${path.relative(process.cwd(), DESTINO)}: ${String(serie.valores.length)} meses, de ${serie.desde} a ${serie.hasta}. Fuente: ${fuente}.`,
);

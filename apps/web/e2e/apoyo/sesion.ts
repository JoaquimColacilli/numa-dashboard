import { readFile, writeFile } from 'node:fs/promises';

import type { BrowserContext } from '@playwright/test';

import { ESTADO_DEL_TALLER_DE_PRUEBA, trabarLaFacturacion } from './facturacion';
import { iniciarSesionDePrueba, type SesionDePrueba } from './taller';

const VISTA_ANTES_DE_LA_A = '2099-12-30';
const MARGEN_DE_LA_SESION_GUARDADA_MS = 15 * 60_000;

interface EstadoGuardado {
  origins: { localStorage: { name: string; value: string }[] }[];
}

export async function entrarConLaSesion(
  context: BrowserContext,
  sesion: SesionDePrueba,
): Promise<void> {
  await trabarLaFacturacion(context, { estado: ESTADO_DEL_TALLER_DE_PRUEBA });
  await context.addInitScript(
    ({ guardada, vista }) => {
      if (localStorage.getItem('maun.sesion') === null) {
        localStorage.setItem('maun.sesion', guardada);
      }
      if (localStorage.getItem('maun:novedades-vistas') === null) {
        localStorage.setItem('maun:novedades-vistas', vista);
      }
    },
    { guardada: sesion.guardada, vista: VISTA_ANTES_DE_LA_A },
  );
}

export async function laSesionGuardadaVigente(ruta: string): Promise<string> {
  const estado = JSON.parse(await readFile(ruta, 'utf8')) as EstadoGuardado;
  const sesiones = estado.origins.flatMap((origen) =>
    origen.localStorage.filter((dato) => dato.name === 'maun.sesion'),
  );
  const vencen = sesiones.map(
    (dato) => ((JSON.parse(dato.value) as { expires_at?: number }).expires_at ?? 0) * 1000,
  );
  if (sesiones.length === 0 || Math.min(...vencen) - Date.now() > MARGEN_DE_LA_SESION_GUARDADA_MS) {
    return ruta;
  }
  const { guardada } = await iniciarSesionDePrueba();
  for (const dato of sesiones) dato.value = guardada;
  await writeFile(ruta, JSON.stringify(estado));
  return ruta;
}

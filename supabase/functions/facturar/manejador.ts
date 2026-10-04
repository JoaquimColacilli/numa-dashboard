import { ErrorDeLaBase, type FacturacionDelTaller } from './base.ts';
import {
  conectarElTaller,
  pedirElCertificado,
  subirElCertificado,
  type Contestado,
} from './conexion.ts';
import { controlar } from './control.ts';
import { trabajarLoPendiente, type Dependencias } from './emision.ts';
import { estadoDeLaConexion } from './estado.ts';

const CORS: Readonly<Record<string, string>> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function contestar<T>(contestado: Contestado<T>): Response {
  return contestado.ok
    ? json(contestado.valor)
    : json(
        contestado.esperarHasta === undefined
          ? { motivo: contestado.motivo }
          : { motivo: contestado.motivo, esperarHasta: contestado.esperarHasta },
        422,
      );
}

export function igualesEnTiempoConstante(uno: string, otro: string): boolean {
  const a = new TextEncoder().encode(uno);
  const b = new TextEncoder().encode(otro);
  let diferencia = a.length ^ b.length;
  for (let indice = 0; indice < Math.max(a.length, b.length); indice += 1) {
    diferencia |= (a[indice] ?? 0) ^ (b[indice] ?? 0);
  }
  return diferencia === 0;
}

function tokenDe(pedido: Request): string | null {
  const encontrado = /^Bearer\s+(\S+)$/i.exec(pedido.headers.get('authorization') ?? '');
  return encontrado?.[1] ?? null;
}

async function cuerpoDe(pedido: Request): Promise<Record<string, unknown>> {
  try {
    const cuerpo: unknown = await pedido.json();
    return typeof cuerpo === 'object' && cuerpo !== null ? (cuerpo as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

type Ruta = 'trabajo' | 'control' | 'estado' | 'certificado' | 'certificado/subir' | 'conectar';

function rutaDe(pedido: Request): Ruta | null {
  const camino = new URL(pedido.url).pathname.replace(/\/+$/, '');
  if (camino.endsWith('/certificado/subir')) return 'certificado/subir';
  for (const ruta of ['trabajo', 'control', 'estado', 'certificado', 'conectar'] as const) {
    if (camino.endsWith(`/${ruta}`)) return ruta;
  }
  return null;
}

function nombreDelError(error: unknown): string {
  if (error instanceof ErrorDeLaBase) return error.codigo;
  return error instanceof Error ? error.name : 'error';
}

export function crearManejador(dependencias: Dependencias): (pedido: Request) => Promise<Response> {
  const { configuracion, base } = dependencias;

  async function conSesion(
    pedido: Request,
    hacer: (usuarioId: string, taller: FacturacionDelTaller) => Promise<Response>,
  ): Promise<Response> {
    const token = tokenDe(pedido);
    const usuarioId = token === null ? null : await base.usuarioDelToken(token);
    if (usuarioId === null) return json({ error: 'Hace falta una sesión.' }, 401);
    const taller = await base.delUsuario(usuarioId);
    if (taller === null) return json({ error: 'Solo el dueño de un taller.' }, 403);
    return hacer(usuarioId, taller);
  }

  return async (pedido) => {
    if (pedido.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const ruta = rutaDe(pedido);
    if (ruta === null) return json({ error: 'No existe.' }, 404);
    const metodo = ruta === 'estado' ? 'GET' : 'POST';
    if (pedido.method !== metodo) return json({ error: 'Método no permitido.' }, 405);

    try {
      if (ruta === 'trabajo' || ruta === 'control') {
        const token = tokenDe(pedido);
        const secreto = configuracion.secretoDelTrabajo;
        if (secreto === null || token === null || !igualesEnTiempoConstante(token, secreto)) {
          return json({ error: 'No autorizado.' }, 401);
        }
        return json(
          ruta === 'trabajo'
            ? await trabajarLoPendiente(dependencias)
            : await controlar(dependencias),
        );
      }

      if (ruta === 'estado') {
        return await conSesion(pedido, async (_usuarioId, taller) =>
          json(await estadoDeLaConexion(dependencias, taller)),
        );
      }

      if (ruta === 'certificado') {
        return await conSesion(pedido, async (_usuarioId, taller) =>
          contestar(await pedirElCertificado(dependencias, taller)),
        );
      }

      if (ruta === 'certificado/subir') {
        return await conSesion(pedido, async (usuarioId, taller) =>
          contestar(
            await subirElCertificado(
              dependencias,
              usuarioId,
              taller,
              (await cuerpoDe(pedido)).certificado,
            ),
          ),
        );
      }

      return await conSesion(pedido, async (usuarioId, taller) =>
        contestar(
          await conectarElTaller(
            dependencias,
            usuarioId,
            taller,
            (await cuerpoDe(pedido)).puntoDeVenta,
          ),
        ),
      );
    } catch (error) {
      console.error('la facturación falló', nombreDelError(error));
      return json({ error: 'No se pudo procesar el pedido.' }, 500);
    }
  };
}

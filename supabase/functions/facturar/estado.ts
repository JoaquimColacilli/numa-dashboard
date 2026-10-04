import type { CertificadoResumido, FacturacionDelTaller } from './base.ts';
import { estaPrendido } from './entorno.ts';
import { firmanteDelTaller, type Dependencias } from './emision.ts';
import { SinRespuesta, type Ambiente } from './red.ts';
import { accesoAArca } from './wsaa.ts';
import { conversacion, servidorAndando, ultimoAutorizado } from './wsfe.ts';

export interface CertificadoDelEstado {
  estado: CertificadoResumido['estado'];
  vence: string | null;
}

export interface RespuestaDelEstado {
  conectada: boolean;
  prendido: boolean;
  ambiente?: Ambiente;
  servidor?: 'ok' | 'caido' | null;
  login?: 'ok' | 'esperando' | 'rechazado' | 'sin-certificado' | null;
  esperarHasta?: string | null;
  ultimoNumero?: number | null;
  certificadoVence?: string | null;
  certificado?: CertificadoDelEstado | null;
}

function resumido(certificado: CertificadoResumido | null): CertificadoDelEstado | null {
  return certificado === null ? null : { estado: certificado.estado, vence: certificado.vence };
}

export function estadoSinArca(
  dependencias: Pick<Dependencias, 'configuracion'>,
  taller: FacturacionDelTaller,
): RespuestaDelEstado {
  const { configuracion } = dependencias;
  const { activo, pendiente } = taller.certificados;
  if (taller.ambiente === null) {
    if (!estaPrendido(configuracion, 'produccion')) return { conectada: false, prendido: false };
    return { conectada: false, prendido: true, certificado: resumido(pendiente ?? activo) };
  }
  if (!estaPrendido(configuracion, taller.ambiente)) {
    return { conectada: true, ambiente: taller.ambiente, prendido: false };
  }
  return {
    conectada: true,
    ambiente: taller.ambiente,
    prendido: true,
    servidor: null,
    login: null,
    esperarHasta: null,
    ultimoNumero: null,
    certificadoVence:
      taller.ambiente === 'produccion'
        ? (activo?.vence ?? null)
        : (configuracion.pruebas?.vence ?? null),
    certificado: resumido(pendiente),
  };
}

export async function estadoDeLaConexion(
  dependencias: Dependencias,
  taller: FacturacionDelTaller,
): Promise<RespuestaDelEstado> {
  const sinArca = estadoSinArca(dependencias, taller);
  if (taller.ambiente === null || !sinArca.prendido) return sinArca;

  const ambiente = taller.ambiente;
  const firmante = await firmanteDelTaller(dependencias, ambiente, taller.householdId);
  const hablar = conversacion({
    ambiente,
    pedir: dependencias.pedir,
    anotar: (intercambio) =>
      dependencias.base.anotarElIntercambio(intercambio).catch(() => undefined),
    householdId: taller.householdId,
    comprobanteId: null,
    cuits: [firmante?.cuit ?? '', taller.cuit],
  });

  let servidor: 'ok' | 'caido';
  try {
    servidor = (await servidorAndando(hablar)) ? 'ok' : 'caido';
  } catch (error) {
    if (!(error instanceof SinRespuesta)) throw error;
    servidor = 'caido';
  }

  if (firmante === null) return { ...sinArca, servidor, login: 'sin-certificado' };

  const acceso = await accesoAArca(
    dependencias,
    ambiente,
    firmante,
    ambiente === 'produccion' ? taller.householdId : null,
  );
  if (!acceso.ok) {
    if (acceso.razon === 'esperar') {
      return { ...sinArca, servidor, login: 'esperando', esperarHasta: acceso.hasta };
    }
    if (acceso.razon === 'rechazado') return { ...sinArca, servidor, login: 'rechazado' };
    return { ...sinArca, servidor: 'caido', login: null };
  }

  const credencial =
    ambiente === 'produccion'
      ? { ...acceso.credencial, cuit: taller.cuit.replace(/\D/g, '') }
      : acceso.credencial;
  let ultimoNumero: number | null = null;
  if (taller.puntoDeVenta !== null) {
    try {
      const ultimo = await ultimoAutorizado(hablar, credencial, taller.puntoDeVenta, 'factura_c');
      ultimoNumero = 'numero' in ultimo ? ultimo.numero : null;
    } catch (error) {
      if (!(error instanceof SinRespuesta)) throw error;
    }
  }
  return { ...sinArca, servidor, login: 'ok', ultimoNumero };
}

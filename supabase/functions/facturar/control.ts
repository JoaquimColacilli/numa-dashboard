import { centavos, TIPOS_DE_COMPROBANTE, type Money, type TipoDeComprobante } from '@maun/domain';

import { ErrorDeLaBase, type ComprobanteARevisar, type TallerParaControlar } from './base.ts';
import { ambientesPrendidos } from './entorno.ts';
import { firmanteDelTaller, hoyEnLaArgentina, type Dependencias } from './emision.ts';
import { SinRespuesta } from './red.ts';
import { accesoAArca, type Credencial } from './wsaa.ts';
import { coincide, consultar, conversacion, ultimoAutorizado, type Hablar } from './wsfe.ts';

export const DIAS_DE_AVISO_DEL_CERTIFICADO = 30;

type Alerta = Record<string, unknown>;

function diasHasta(desde: string, hasta: string): number {
  return Math.round(
    (Date.parse(`${hasta}T12:00:00Z`) - Date.parse(`${desde}T12:00:00Z`)) / 86_400_000,
  );
}

async function ultimoEnArca(
  hablar: Hablar,
  credencial: Credencial,
  puntoDeVenta: number,
  tipo: TipoDeComprobante,
): Promise<number | null> {
  try {
    const ultimo = await ultimoAutorizado(hablar, credencial, puntoDeVenta, tipo);
    return 'numero' in ultimo ? ultimo.numero : null;
  } catch (error) {
    if (error instanceof SinRespuesta) return null;
    throw error;
  }
}

async function revisar(
  dependencias: Dependencias,
  hablar: Hablar,
  credencial: Credencial,
  comprobante: ComprobanteARevisar,
): Promise<Alerta | null> {
  const enNuma = {
    tipo: comprobante.tipo,
    puntoDeVenta: comprobante.puntoDeVenta,
    numero: comprobante.numero,
    importe: centavos(comprobante.importeCentavos) as Money,
    docTipo: comprobante.docTipo,
    docNro: comprobante.docNro,
  };
  let consulta;
  try {
    consulta = await consultar(
      hablar,
      credencial,
      comprobante.tipo,
      comprobante.puntoDeVenta,
      comprobante.numero,
    );
  } catch (error) {
    if (!(error instanceof SinRespuesta)) throw error;
    consulta = null;
  }
  if (consulta !== null && 'existe' in consulta) {
    if (consulta.existe && coincide(consulta.comprobante, enNuma)) {
      await dependencias.base.anotar(comprobante.id, {
        paso: 'autorizada',
        cae: consulta.comprobante.cae,
        caeVence: consulta.comprobante.caeVence ?? '',
        fecha: consulta.comprobante.fecha ?? '',
      });
      return null;
    }
    if (!consulta.existe) {
      const ultimo = await ultimoEnArca(
        hablar,
        credencial,
        comprobante.puntoDeVenta,
        comprobante.tipo,
      );
      if (ultimo !== null && ultimo < comprobante.numero) {
        await dependencias.base.anotar(comprobante.id, {
          paso: 'pedida',
          error: 'ARCA no lo tiene: se vuelve a pedir.',
        });
        return null;
      }
    }
  }
  return {
    codigo: 'a-revisar',
    comprobanteId: comprobante.id,
    proyectoId: comprobante.proyectoId,
    tipo: comprobante.tipo,
    puntoDeVenta: comprobante.puntoDeVenta,
    numero: comprobante.numero,
    cliente: comprobante.cliente,
  };
}

export async function controlarUnTaller(
  dependencias: Dependencias,
  taller: TallerParaControlar,
): Promise<boolean> {
  const { configuracion, base, pedir, ahora } = dependencias;
  const firmante = await firmanteDelTaller(dependencias, taller.ambiente, taller.householdId);
  if (firmante === null) return false;
  const acceso = await accesoAArca(
    dependencias,
    taller.ambiente,
    firmante,
    taller.ambiente === 'produccion' ? taller.householdId : null,
  );
  if (!acceso.ok) return false;
  const credencial: Credencial =
    taller.ambiente === 'produccion'
      ? { ...acceso.credencial, cuit: taller.cuit.replace(/\D/g, '') }
      : acceso.credencial;
  const hablar = conversacion({
    ambiente: taller.ambiente,
    pedir,
    anotar: (intercambio) => base.anotarElIntercambio(intercambio).catch(() => undefined),
    householdId: taller.householdId,
    comprobanteId: null,
    cuits: [firmante.cuit, taller.cuit],
  });

  const alertas: Alerta[] = [];
  for (const tipo of TIPOS_DE_COMPROBANTE) {
    const enArca = await ultimoEnArca(hablar, credencial, taller.puntoDeVenta, tipo);
    if (enArca === null) return false;
    const enNuma = taller.ultimos[tipo] ?? 0;
    if (enArca > enNuma) {
      alertas.push({
        codigo: 'fuera-de-numa',
        tipo,
        puntoDeVenta: taller.puntoDeVenta,
        numeroArca: enArca,
        numeroNuma: enNuma,
      });
    }
  }

  for (const comprobante of taller.aRevisar) {
    const alerta = await revisar(dependencias, hablar, credencial, comprobante);
    if (alerta !== null) alertas.push(alerta);
  }

  const vence =
    taller.ambiente === 'produccion'
      ? taller.certificadoVence
      : (configuracion.pruebas?.vence ?? null);
  if (
    vence !== null &&
    diasHasta(hoyEnLaArgentina(ahora()), vence) < DIAS_DE_AVISO_DEL_CERTIFICADO
  ) {
    alertas.push({ codigo: 'certificado-por-vencer', vence });
  }

  await base.anotarLasAlertas(taller.householdId, alertas);
  return true;
}

export async function controlar(
  dependencias: Dependencias,
): Promise<{ talleres: number; controlados: number }> {
  const ambientes = ambientesPrendidos(dependencias.configuracion);
  if (ambientes.length === 0) return { talleres: 0, controlados: 0 };
  const talleres = await dependencias.base.paraControlar(ambientes);
  let controlados = 0;
  for (const taller of talleres) {
    try {
      if (await controlarUnTaller(dependencias, taller)) controlados += 1;
    } catch (error) {
      console.error(
        'un taller no se pudo controlar',
        error instanceof ErrorDeLaBase
          ? error.codigo
          : error instanceof Error
            ? error.name
            : 'error',
      );
    }
  }
  return { talleres: talleres.length, controlados };
}

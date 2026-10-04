import {
  leerAlertasDeFacturacion,
  type AlertaDeFacturacion,
  type AlertaParaDescartar,
  type FilaDe,
  type Json,
} from '@/shared/api';

function crudasDe(ajustes: Partial<FilaDe<'ajustes'>> | undefined): readonly Json[] {
  const crudas = ajustes?.facturacion_alertas;
  return Array.isArray(crudas) ? crudas : [];
}

export function alertasDeLaFacturacion(
  ajustes: Partial<FilaDe<'ajustes'>> | undefined,
): AlertaDeFacturacion[] {
  return leerAlertasDeFacturacion(crudasDe(ajustes)).filter(
    (alerta) => alerta.codigo !== 'fuera-de-numa' || !alerta.descartada,
  );
}

function esLaAlerta(cruda: Json, alerta: AlertaParaDescartar): boolean {
  if (typeof cruda !== 'object' || cruda === null || Array.isArray(cruda)) return false;
  return cruda.codigo === alerta.codigo && cruda.numeroArca === alerta.numero;
}

export function conLaAlertaRevisada(
  ajustes: FilaDe<'ajustes'>,
  alerta: AlertaParaDescartar,
): FilaDe<'ajustes'> {
  const alertas = crudasDe(ajustes).map((cruda) =>
    esLaAlerta(cruda, alerta) &&
    typeof cruda === 'object' &&
    cruda !== null &&
    !Array.isArray(cruda)
      ? { ...cruda, descartada: true }
      : cruda,
  );
  return { ...ajustes, facturacion_alertas: alertas };
}

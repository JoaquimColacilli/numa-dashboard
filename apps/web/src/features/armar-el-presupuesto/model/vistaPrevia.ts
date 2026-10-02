import {
  cuentasDelPresupuesto,
  sumarDias,
  type DocumentoDelPresupuesto,
  type Idioma,
  type Money,
  type PresupuestoMandado,
} from '@maun/domain';

export function comoLoVeElCliente(
  documento: DocumentoDelPresupuesto,
  numero: string | null,
  revision: number,
  hoy: string,
  abonado: Money,
  idioma: Idioma,
): PresupuestoMandado {
  const cuentas =
    documento.valores === null
      ? []
      : cuentasDelPresupuesto(documento.valores, documento.senaBp, abonado);
  const [unica] = cuentas;
  return {
    etapa: 'mandado',
    numero: numero ?? '',
    revision,
    idioma,
    mandadoEl: hoy,
    documento,
    cuentas,
    queCambio: null,
    valeHasta: documento.validezDias === null ? null : sumarDias(hoy, documento.validezDias),
    vencio: null,
    pideLaSena:
      documento.valores?.tipo === 'total' && unica !== undefined && unica.faltaParaLaSena > 0,
  };
}

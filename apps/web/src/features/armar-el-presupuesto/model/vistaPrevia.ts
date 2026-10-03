import {
  cuentasDelPresupuesto,
  sumarDias,
  type DocumentoDelPresupuesto,
  type Idioma,
  type Moneda,
  type Money,
  type PresupuestoMandado,
} from '@maun/domain';

export function comoLoVeElCliente(
  documento: DocumentoDelPresupuesto,
  numero: string | null,
  revision: number,
  hoy: string,
  pagado: Money<Moneda>,
  idioma: Idioma,
): PresupuestoMandado {
  const cuentas =
    documento.valores === null
      ? []
      : cuentasDelPresupuesto<Moneda>(documento.valores, documento.senaBp, pagado);
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

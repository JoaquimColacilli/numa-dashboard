import {
  cuentasDelPresupuesto,
  mensajeParaElTaller,
  nombreDelArchivo,
  numeroVisible,
  sumarDias,
  type DocumentoDelPresupuesto,
  type Money,
  type PresupuestoMandado,
} from '@maun/domain';

export function comoLoVeElCliente(
  documento: DocumentoDelPresupuesto,
  numero: string | null,
  revision: number,
  hoy: string,
  abonado: Money,
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
    numeroVisible: numeroVisible(numero, revision),
    mandadoEl: hoy,
    documento,
    cuentas,
    nombreDelArchivo: nombreDelArchivo(documento, numero, revision),
    queCambio: null,
    valeHasta: documento.validezDias === null ? null : sumarDias(hoy, documento.validezDias),
    vencio: null,
    mensajeParaElTaller: numero === null ? '' : mensajeParaElTaller(numero, revision),
    pideLaSena:
      documento.valores?.tipo === 'total' && unica !== undefined && unica.faltaParaLaSena > 0,
  };
}

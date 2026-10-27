import {
  cuentasDelPresupuesto,
  diasParaMedir,
  sumarDias,
  type DocumentoDelPresupuesto,
  type Idioma,
  type Moneda,
  type Money,
  type PresupuestoMandado,
} from '@maun/domain';

const REVISION_DE_LA_VISTA_PREVIA = '00000000-0000-0000-0000-000000000000';

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
  const { listoPara, senaAntesDel } = documento;
  return {
    etapa: 'mandado',
    numero: numero ?? '',
    revision,
    idioma,
    mandadoEl: hoy,
    documento,
    cuentas,
    estimativo: documento.estimativo,
    queCambio: null,
    valeHasta: documento.validezDias === null ? null : sumarDias(hoy, documento.validezDias),
    vencio: null,
    pideLaSena:
      !documento.estimativo &&
      documento.valores?.tipo === 'total' &&
      unica !== undefined &&
      unica.faltaParaLaSena > 0,
    aprobacion:
      documento.valores === null
        ? { situacion: 'cerrada' }
        : {
            situacion: 'se-puede',
            revisionId: REVISION_DE_LA_VISTA_PREVIA,
            pideFecha: documento.pideFecha,
            dias: diasParaMedir(hoy),
          },
    fechas:
      documento.estimativo || listoPara === null || senaAntesDel === null
        ? null
        : { listoPara, senaAntesDel, vencioLaSena: false },
  };
}

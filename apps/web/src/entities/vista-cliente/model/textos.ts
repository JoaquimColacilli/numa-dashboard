import {
  estaAprobada,
  type DiaElegido,
  type EntregaDelTrabajo,
  type FranjaDeEntrega,
  type LoQueSePagoEnOtraMoneda,
  type Moneda,
  type PrecioEnPesos,
  type PropuestaDeEntrega,
  type RespuestaDeEntregaParaMandar,
  type SenaDeLaVista,
  type TitularDeLaVista,
  type VistaAprobada,
  type VistaDelCliente,
} from '@maun/domain';

import type { FormatosDelCliente, MensajesDelCliente } from '@/shared/idioma-del-cliente';

export interface Escritura {
  t: MensajesDelCliente['vista'];
  f: FormatosDelCliente;
  hoy: string;
}

export function fechaConFranja(
  fecha: string,
  franja: FranjaDeEntrega | null,
  { t, f, hoy }: Escritura,
): string {
  const dia = f.fechaLarga(fecha, hoy);
  return franja === null ? dia : t.coordinar.conFranja[franja](dia);
}

export function textoDelDiaElegido(dia: DiaElegido, { t, f, hoy }: Escritura): string {
  const fecha = f.fechaLarga(dia.fecha, hoy);
  const [una, otra] = dia.franjas;
  if (una === undefined) return fecha;
  return otra === undefined
    ? t.coordinar.conFranja[una](fecha)
    : t.coordinar.conLasDosFranjas(fecha);
}

export function anuncioDeLoMandado(
  respuesta: RespuestaDeEntregaParaMandar,
  propuesta: PropuestaDeEntrega,
  escritura: Escritura,
): string {
  const { coordinar } = escritura.t;
  if (respuesta.respuesta === 'mis_dias') return coordinar.listoTusDias;
  return propuesta.fecha === null
    ? coordinar.listoElDia
    : coordinar.listoTeEsperamos(fechaConFranja(propuesta.fecha, propuesta.franja, escritura));
}

export function textoDelTitular(titular: TitularDeLaVista, escritura: Escritura): string {
  if (typeof titular === 'string') return titular;
  const { fecha, franja } = titular.comprometida;
  return escritura.t.pagina.buenasNoticias(fechaConFranja(fecha, franja, escritura));
}

export function sinPagosTodavia(vista: VistaDelCliente, { t }: Escritura): string {
  if (vista.pagos.length > 0) return '';
  return estaAprobada(vista) ? t.pagina.pagos.sinPagosAprobado : '';
}

export function pieDeLosPagos(
  vista: VistaDelCliente,
  hayComoPagar: boolean,
  { t }: Escritura,
): string {
  const { pagos } = t.pagina;
  if (estaAprobada(vista) && vista.saldado) return pagos.noQuedaNada;
  if (hayComoPagar) return pagos.losAnotaElTaller;
  return `${pagos.elPagoSeCoordina} ${pagos.losAnotaElTaller}`;
}

export function lineaDeLaSena(
  sena: SenaDeLaVista,
  pagado: number,
  moneda: Moneda,
  { t, f }: Escritura,
): string {
  switch (sena.situacion) {
    case 'falta':
      return sena.aCuenta > 0 ? t.pagina.teQuedanParaLaSena(f.plata(sena.falta, moneda)) : '';
    case 'cubierta':
      return t.pagina.laSenaYaEstaCubierta;
    case 'sin-presupuesto':
      return pagado > 0 ? t.pagina.quedaACuenta : '';
  }
}

export function textoDeLaSenaAcordada(
  sena: SenaDeLaVista,
  moneda: Moneda,
  { t, f }: Escritura,
): string {
  const { datos } = t.pagina;
  switch (sena.situacion) {
    case 'cubierta':
      return datos.senaPagada(f.plata(sena.sena, moneda));
    case 'falta':
      return datos.senaQueFalta(f.plata(sena.sena, moneda), f.plata(sena.falta, moneda));
    case 'sin-presupuesto':
      return datos.aConfirmar;
  }
}

export function textoDelTotalPagado(vista: VistaAprobada, { t, f }: Escritura): string | null {
  if (!vista.saldado || vista.precio === null) return null;
  return t.pagina.datos.totalPagado(f.plata(vista.precio, vista.moneda));
}

export function textoDelPrecioEnPesos(
  precio: PrecioEnPesos | null,
  { t, f, hoy }: Escritura,
): string | null {
  if (precio === null) return null;
  const pesos = f.pesos(precio.pesos);
  const dolar = f.pesos(precio.cotizacion);
  return precio.deHoy
    ? t.pagina.precioEnPesos.deHoy(pesos, dolar)
    : t.pagina.precioEnPesos.delDia(pesos, dolar, f.diaYMes(precio.fecha, hoy));
}

export function textoDeLoQueSePago(
  enOtraMoneda: LoQueSePagoEnOtraMoneda,
  { t, f }: Escritura,
): string {
  const { pagado, cotizacion } = enOtraMoneda;
  return t.pagina.pagasteConElDolar(f.plata(pagado.importe, pagado.moneda), f.pesos(cotizacion));
}

export function claveDeLaEntrega(entrega: EntregaDelTrabajo, { t }: Escritura): string {
  const textos = t.pagina.entrega;
  switch (entrega.situacion) {
    case 'estimada':
      return textos.estimada;
    case 'confirmada':
      return textos.confirmada;
    case 'entregado':
      return textos.entregado;
    case 'a-coordinar':
    case 'a-confirmar':
      return textos.entrega;
  }
}

export function valorDeLaEntrega(entrega: EntregaDelTrabajo, escritura: Escritura): string {
  const { t, f, hoy } = escritura;
  switch (entrega.situacion) {
    case 'estimada':
      return entrega.fecha === null ? t.pagina.datos.aConfirmar : f.fechaLarga(entrega.fecha, hoy);
    case 'confirmada':
      return fechaConFranja(entrega.fecha, entrega.franja, escritura);
    case 'entregado':
      return entrega.fecha === null ? '—' : f.fechaLarga(entrega.fecha, hoy);
    case 'a-coordinar':
      return t.pagina.entrega.aCoordinar;
    case 'a-confirmar':
      return t.pagina.datos.aConfirmar;
  }
}

export function bajadaDeLaEntrega(entrega: EntregaDelTrabajo, { t, f, hoy }: Escritura): string {
  const textos = t.pagina.entrega;
  switch (entrega.situacion) {
    case 'estimada':
      return entrega.fecha === null ? '' : textos.fechaEstimada(f.fechaLarga(entrega.fecha, hoy));
    case 'confirmada':
      return textos.siNecesitasCambiarElDia;
    case 'a-coordinar':
      return textos.podemosEntregarlo;
    case 'entregado':
      return entrega.fecha === null ? '' : textos.entregadoEl(f.fechaLarga(entrega.fecha, hoy));
    case 'a-confirmar':
      return '';
  }
}

export interface SaldoDeLaVista {
  etiqueta: string;
  texto: string;
  tono: string;
}

export function saldoDeLaVista(vista: VistaAprobada, { t, f }: Escritura): SaldoDeLaVista {
  const { saldo } = t.pagina;
  if (vista.saldo === null) return { etiqueta: saldo.faltaElPresupuesto, texto: '—', tono: '' };
  if (vista.saldado) {
    return { etiqueta: saldo.estaSaldado, texto: f.plata(0, vista.moneda), tono: 'text-hogar' };
  }
  return { etiqueta: saldo.teFaltaPagar, texto: f.plata(vista.saldo, vista.moneda), tono: '' };
}

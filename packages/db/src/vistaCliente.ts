import {
  centavosEn,
  cobraEnLeido,
  cotizacionLeida,
  esCondicionDelReceptor,
  esFechaQueExiste,
  esFranja,
  esLinkDeLaRed,
  esLinkDeMercadoPago,
  esMoneda,
  esNumeroDePresupuesto,
  esTipoDeComprobante,
  FORMAS_DE_COBRO,
  FORMAS_DE_COORDINAR,
  idiomaLeido,
  INSTANCIAS_DE_PAGO,
  leerDocumento,
  MONEDA_DEL_TALLER,
  RESPUESTAS_DE_ENTREGA,
  TOPE_DE_LA_VIDRIERA,
  VIDRIERA_VACIA,
} from '@maun/domain';
import type {
  CobroDelTaller,
  ComprobanteAsociado,
  ComprometidaDelTrabajo,
  Cotizacion,
  CuentaParaTransferir,
  DiaQueLeQuedaBien,
  EmisorDeLaFactura,
  EntregaQueSeCoordina,
  ArchivoDelCliente,
  EstadoProyecto,
  FacturaDelCliente,
  FechasDelTrabajo,
  FormaDeCobro,
  FotoDeLaVidriera,
  ImporteDeUnPago,
  InstanciaDePago,
  Moneda,
  Money,
  PagoDelCliente,
  PagoOfrecido,
  PagoPendiente,
  PresupuestoDelTrabajo,
  PropuestaDeEntrega,
  ReceptorDeLaFactura,
  RedDelTaller,
  RedesDelTaller,
  ReferenciaEnPesos,
  RespuestaDelCliente,
  FranjaDeEntrega,
  TipoDeDocumento,
  TrabajoDelCliente,
  VidrieraDelTaller,
  VisitaDelTrabajo,
} from '@maun/domain';

import type { ClienteMaun } from './cliente.ts';
import { dinero } from './dinero.ts';
import { RespuestaInvalidaError } from './replica.ts';

function objeto(valor: unknown, que: string): Record<string, unknown> {
  if (typeof valor !== 'object' || valor === null) {
    throw new RespuestaInvalidaError(`La vista del cliente no devolvió ${que}.`);
  }
  return valor as Record<string, unknown>;
}

function texto(valor: unknown, que: string): string {
  if (typeof valor !== 'string') {
    throw new RespuestaInvalidaError(`La vista del cliente no devolvió ${que}.`);
  }
  return valor;
}

function fechaONada(valor: unknown, que: string): string | null {
  if (valor === null || valor === undefined) return null;
  return texto(valor, que);
}

function numeroONada(valor: unknown, que: string): number | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'number') {
    throw new RespuestaInvalidaError(`La vista del cliente no devolvió ${que}.`);
  }
  return valor;
}

function lista(valor: unknown, que: string): unknown[] {
  if (!Array.isArray(valor)) {
    throw new RespuestaInvalidaError(`La vista del cliente no devolvió ${que}.`);
  }
  return valor;
}

function monedaONada(valor: unknown): Moneda | null {
  if (valor === null || valor === undefined) return null;
  if (!esMoneda(valor)) {
    throw new RespuestaInvalidaError('La vista del cliente devolvió una moneda desconocida.');
  }
  return valor;
}

function enSuMoneda(moneda: Moneda, importe: number): Money<Moneda> {
  return centavosEn(moneda, importe);
}

function importeConSuDolar(
  moneda: Moneda,
  monto: number,
  cotizacion: Cotizacion | null,
): ImporteDeUnPago {
  return moneda === MONEDA_DEL_TALLER
    ? { moneda, monto: dinero(monto), cotizacion }
    : { moneda: 'USD', monto: centavosEn('USD', monto), cotizacion };
}

function loQueSeEntrego(
  pago: Record<string, unknown>,
  monedaDelTrabajo: Moneda,
  monto: number,
): ImporteDeUnPago {
  const cotizacion = cotizacionLeida(pago.cotizacion_centavos);
  const entregado = numeroONada(pago.pagado_centavos, 'lo que se entregó en un pago');
  if (entregado === null) return importeConSuDolar(monedaDelTrabajo, monto, cotizacion);
  const moneda = monedaONada(pago.moneda) ?? monedaDelTrabajo;
  return importeConSuDolar(moneda, entregado, cotizacion);
}

function pagos(valor: unknown, moneda: Moneda): PagoDelCliente[] {
  return lista(valor, 'los pagos').map((fila) => {
    const pago = objeto(fila, 'un pago');
    const monto = numeroONada(pago.monto_centavos, 'el importe de un pago');
    if (monto === null) throw new RespuestaInvalidaError('Un pago vino sin importe.');
    return {
      id: texto(pago.id, 'el id de un pago'),
      fecha: texto(pago.fecha, 'la fecha de un pago'),
      concepto: texto(pago.concepto, 'el concepto de un pago'),
      monto: enSuMoneda(moneda, monto),
      pagado: loQueSeEntrego(pago, moneda, monto),
    };
  });
}

function archivos(valor: unknown): ArchivoDelCliente[] {
  return lista(valor, 'los archivos').map((fila) => {
    const archivo = objeto(fila, 'un archivo');
    return {
      id: texto(archivo.id, 'el id de un archivo'),
      nombre: texto(archivo.nombre, 'el nombre de un archivo'),
      tipo: texto(archivo.tipo, 'el tipo de un archivo'),
      ancho: numeroONada(archivo.ancho, 'el ancho de un archivo'),
      alto: numeroONada(archivo.alto, 'el alto de un archivo'),
      fecha: texto(archivo.fecha, 'la fecha de un archivo'),
      ruta: texto(archivo.ruta, 'la ruta de un archivo'),
      rutaMini: texto(archivo.ruta_mini, 'la ruta de la miniatura de un archivo'),
    };
  });
}

function textoONada(valor: unknown, que: string): string | null {
  if (valor === null || valor === undefined) return null;
  const leido = texto(valor, que).trim();
  return leido === '' ? null : leido;
}

function linkDeCobro(valor: unknown): string | null {
  const leido = textoONada(valor, 'el link para pagar');
  return leido !== null && esLinkDeMercadoPago(leido) ? leido : null;
}

function cobro(valor: unknown): CobroDelTaller {
  if (valor === null || valor === undefined) {
    return { alias: null, cbu: null, titular: null, cuit: null, link: null };
  }
  const crudo = objeto(valor, 'los datos para transferir');
  return {
    alias: textoONada(crudo.alias, 'el alias del taller'),
    cbu: textoONada(crudo.cbu, 'el CBU del taller'),
    titular: textoONada(crudo.titular, 'el titular de la cuenta'),
    cuit: textoONada(crudo.cuit, 'el CUIT del titular'),
    link: linkDeCobro(crudo.link),
  };
}

function cuentaEnDolares(valor: unknown): CuentaParaTransferir {
  if (valor === null || valor === undefined) {
    return { alias: null, cbu: null, titular: null, cuit: null };
  }
  const crudo = objeto(valor, 'la cuenta en dólares');
  return {
    alias: textoONada(crudo.alias, 'el alias de la cuenta en dólares'),
    cbu: textoONada(crudo.cbu, 'el CBU de la cuenta en dólares'),
    titular: textoONada(crudo.titular, 'el titular de la cuenta en dólares'),
    cuit: textoONada(crudo.cuit, 'el CUIT del titular de la cuenta en dólares'),
  };
}

function dolarDelDia(valor: unknown): ReferenciaEnPesos | null {
  if (typeof valor !== 'object' || valor === null) return null;
  const crudo = valor as Record<string, unknown>;
  const cotizacion = cotizacionLeida(crudo.cotizacion_centavos);
  const { fecha } = crudo;
  if (cotizacion === null || typeof fecha !== 'string' || !esFechaQueExiste(fecha)) return null;
  return { cotizacion, fecha };
}

function esForma(valor: unknown): valor is FormaDeCobro {
  return FORMAS_DE_COBRO.some((forma) => forma === valor);
}

function formasEnDolares(valor: unknown, que: string): FormaDeCobro[] {
  if (valor === null || valor === undefined) return [];
  return lista(valor, que).filter(esForma);
}

const SIN_PAGO: PagoPendiente = {
  instancia: null,
  formas: [],
  formasEnDolares: [],
  monto: null,
  siguiente: null,
};

function instanciaDe(valor: unknown, que: string): InstanciaDePago | null {
  const leida = textoONada(valor, que);
  if (leida === null) return null;
  const conocida = INSTANCIAS_DE_PAGO.find((una) => una === leida);
  if (conocida === undefined) {
    throw new RespuestaInvalidaError('La vista del cliente devolvió un pago desconocido.');
  }
  return conocida;
}

function pagoOfrecido(valor: unknown, moneda: Moneda): PagoOfrecido | null {
  if (valor === null || valor === undefined) return null;
  const crudo = objeto(valor, 'el pago que sigue');
  const instancia = instanciaDe(crudo.instancia, 'la instancia del pago que sigue');
  if (instancia === null) return null;
  const monto = numeroONada(crudo.monto_centavos, 'el importe del pago que sigue');
  return {
    instancia,
    formas: lista(crudo.formas, 'las formas del pago que sigue').filter(esForma),
    formasEnDolares: formasEnDolares(
      crudo.formas_en_dolares,
      'las formas en dólares del pago que sigue',
    ),
    monto: monto === null ? null : enSuMoneda(moneda, monto),
  };
}

function pagoPendiente(valor: unknown, moneda: Moneda): PagoPendiente {
  if (valor === null || valor === undefined) return SIN_PAGO;
  const crudo = objeto(valor, 'el pago que toca');
  const monto = numeroONada(crudo.monto_centavos, 'el importe del pago que toca');
  return {
    instancia: instanciaDe(crudo.instancia, 'la instancia del pago'),
    formas: lista(crudo.formas, 'las formas de pago').filter(esForma),
    formasEnDolares: formasEnDolares(crudo.formas_en_dolares, 'las formas de pago en dólares'),
    monto: monto === null ? null : enSuMoneda(moneda, monto),
    siguiente: pagoOfrecido(crudo.siguiente, moneda),
  };
}

function fechas(valor: unknown): FechasDelTrabajo {
  const crudas = objeto(valor, 'las fechas');
  return {
    estimativo: fechaONada(crudas.estimativo, 'la fecha del estimativo'),
    presupuesto: fechaONada(crudas.presupuesto, 'la fecha del presupuesto'),
    aprobado: fechaONada(crudas.aprobado, 'la fecha de la aprobación'),
    inicio: fechaONada(crudas.inicio, 'la fecha de inicio'),
    entregaPautada: fechaONada(crudas.entrega_pautada, 'la entrega estimada'),
    listo: fechaONada(crudas.listo, 'el día en que quedó listo'),
    entregado: fechaONada(crudas.entregado, 'la fecha de entrega'),
    cobro: fechaONada(crudas.cobro, 'la fecha de cobro'),
    valeHasta: fechaONada(crudas.vale_hasta, 'hasta cuándo vale el presupuesto'),
  };
}

function importeONada(valor: unknown, que: string): Money | null {
  const importe = numeroONada(valor, que);
  return importe === null ? null : dinero(importe);
}

function importeEnSuMonedaONada(moneda: Moneda, valor: unknown, que: string): Money<Moneda> | null {
  const importe = numeroONada(valor, que);
  return importe === null ? null : enSuMoneda(moneda, importe);
}

const SIN_VISITA: VisitaDelTrabajo = { dia: null, hecha: false };

function visita(valor: unknown): VisitaDelTrabajo {
  if (valor === null || valor === undefined) return SIN_VISITA;
  const cruda = objeto(valor, 'la visita para medir');
  if (typeof cruda.hecha !== 'boolean') {
    throw new RespuestaInvalidaError('La vista del cliente no devolvió si ya se fue a medir.');
  }
  return { dia: fechaONada(cruda.dia, 'el día de la visita'), hecha: cruda.hecha };
}

const SIN_ENTREGA: EntregaQueSeCoordina = { comprometida: null, propuesta: null, respuesta: null };

function franja(valor: unknown): FranjaDeEntrega | null {
  return esFranja(valor) ? valor : null;
}

function comprometida(valor: unknown): ComprometidaDelTrabajo | null {
  if (valor === null || valor === undefined) return null;
  const cruda = objeto(valor, 'la entrega comprometida');
  return {
    fecha: texto(cruda.fecha, 'el día de la entrega comprometida'),
    franja: franja(cruda.franja),
  };
}

function propuesta(valor: unknown): PropuestaDeEntrega | null {
  if (valor === null || valor === undefined) return null;
  const cruda = objeto(valor, 'lo que te propone el taller');
  const forma = FORMAS_DE_COORDINAR.find((una) => una === cruda.forma);
  if (forma === undefined) return null;
  return {
    id: texto(cruda.id, 'el id de lo que te propone el taller'),
    forma,
    fecha: fechaONada(cruda.fecha, 'el día que te propone el taller'),
    franja: franja(cruda.franja),
  };
}

function diaQueLeQuedaBien(valor: unknown): DiaQueLeQuedaBien {
  const dia = objeto(valor, 'un día que te queda bien');
  return {
    fecha: texto(dia.fecha, 'la fecha de un día que te queda bien'),
    franjas: lista(dia.franjas, 'las franjas de un día que te queda bien').filter(esFranja),
  };
}

function respuesta(valor: unknown): RespuestaDelCliente | null {
  if (valor === null || valor === undefined) return null;
  const cruda = objeto(valor, 'lo que contestaste');
  const cual = RESPUESTAS_DE_ENTREGA.find((una) => una === cruda.respuesta);
  if (cual === undefined) return null;
  return {
    respuesta: cual,
    dias: lista(cruda.dias, 'los días que mandaste').map(diaQueLeQuedaBien),
    nota: texto(cruda.nota, 'la nota que mandaste'),
  };
}

function entrega(valor: unknown): EntregaQueSeCoordina {
  if (valor === null || valor === undefined) return SIN_ENTREGA;
  const cruda = objeto(valor, 'la entrega');
  return {
    comprometida: comprometida(cruda.comprometida),
    propuesta: propuesta(cruda.propuesta),
    respuesta: respuesta(cruda.respuesta),
  };
}

function numero(valor: unknown, que: string): number {
  const leido = numeroONada(valor, que);
  if (leido === null) throw new RespuestaInvalidaError(`La vista del cliente no devolvió ${que}.`);
  return leido;
}

function linkDeLaRed(red: RedDelTaller, valor: unknown, que: string): string | null {
  const leido = textoONada(valor, que);
  return leido !== null && esLinkDeLaRed(red, leido) ? leido : null;
}

function redes(valor: unknown): RedesDelTaller {
  if (valor === null || valor === undefined) return VIDRIERA_VACIA.redes;
  const crudas = objeto(valor, 'las redes del taller');
  return {
    instagram: linkDeLaRed('instagram', crudas.instagram, 'el Instagram del taller'),
    facebook: linkDeLaRed('facebook', crudas.facebook, 'el Facebook del taller'),
    tiktok: linkDeLaRed('tiktok', crudas.tiktok, 'el TikTok del taller'),
  };
}

function fotoDeLaVidriera(valor: unknown): FotoDeLaVidriera {
  const foto = objeto(valor, 'una foto de la vidriera');
  return {
    id: texto(foto.id, 'el id de una foto de la vidriera'),
    ruta: texto(foto.ruta, 'la ruta de una foto de la vidriera'),
    rutaMini: texto(foto.ruta_mini, 'la ruta de la miniatura de una foto de la vidriera'),
    ancho: numero(foto.ancho, 'el ancho de una foto de la vidriera'),
    alto: numero(foto.alto, 'el alto de una foto de la vidriera'),
  };
}

function vidriera(valor: unknown): VidrieraDelTaller {
  if (valor === null || valor === undefined) return VIDRIERA_VACIA;
  const cruda = objeto(valor, 'la vidriera del taller');
  const fotos =
    cruda.fotos === null || cruda.fotos === undefined
      ? []
      : lista(cruda.fotos, 'las fotos de la vidriera').slice(0, TOPE_DE_LA_VIDRIERA);
  return { redes: redes(cruda.redes), fotos: fotos.map(fotoDeLaVidriera) };
}

function textoQuePuedeFaltar(valor: unknown): string | null {
  return typeof valor === 'string' && valor !== '' ? valor : null;
}

function presupuesto(valor: unknown): PresupuestoDelTrabajo | null {
  if (typeof valor !== 'object' || valor === null) return null;
  const crudo = valor as Record<string, unknown>;
  const documento = leerDocumento(crudo.contenido);
  const revision = crudo.revision;
  if (
    documento === null ||
    !esNumeroDePresupuesto(crudo.numero) ||
    typeof revision !== 'number' ||
    !Number.isSafeInteger(revision) ||
    revision < 1 ||
    typeof crudo.mandado_el !== 'string'
  ) {
    return null;
  }
  return {
    numero: crudo.numero,
    revision,
    mandadoEl: crudo.mandado_el,
    queCambio: textoQuePuedeFaltar(crudo.que_cambio),
    documento,
    idioma: idiomaLeido(crudo.idioma),
    aceptadoEl: textoQuePuedeFaltar(crudo.aceptado_el),
    letra: textoQuePuedeFaltar(crudo.letra),
  };
}

function crudoONada(valor: unknown): Record<string, unknown> | null {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : null;
}

function esEnteroPositivo(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isSafeInteger(valor) && valor > 0;
}

function esDocumento(valor: unknown): valor is TipoDeDocumento {
  return valor === 80 || valor === 96 || valor === 99;
}

function comprobanteAsociado(valor: unknown): ComprobanteAsociado | null {
  const crudo = crudoONada(valor);
  if (crudo === null) return null;
  const { punto_de_venta: puntoDeVenta, numero: suNumero, fecha } = crudo;
  if (!esEnteroPositivo(puntoDeVenta) || !esEnteroPositivo(suNumero)) return null;
  if (typeof fecha !== 'string' || !esFechaQueExiste(fecha)) return null;
  return { puntoDeVenta, numero: suNumero, fecha };
}

function emisorDeLaFactura(valor: unknown): EmisorDeLaFactura | null {
  const crudo = crudoONada(valor);
  if (crudo === null) return null;
  const { nombreDelTaller, razonSocial, domicilio, cuit, ingresosBrutos, inicioDeActividades } =
    crudo;
  if (
    typeof nombreDelTaller !== 'string' ||
    typeof razonSocial !== 'string' ||
    typeof domicilio !== 'string' ||
    typeof cuit !== 'string' ||
    typeof ingresosBrutos !== 'string'
  ) {
    return null;
  }
  return {
    nombreDelTaller,
    razonSocial,
    domicilio,
    cuit,
    ingresosBrutos,
    inicioDeActividades:
      typeof inicioDeActividades === 'string' && esFechaQueExiste(inicioDeActividades)
        ? inicioDeActividades
        : null,
  };
}

function receptorDeLaFactura(valor: unknown): ReceptorDeLaFactura | null {
  const crudo = crudoONada(valor);
  if (crudo === null) return null;
  const { nombre, domicilio, condicion, doc_tipo: docTipo, doc_nro: docNro } = crudo;
  if (
    typeof nombre !== 'string' ||
    typeof domicilio !== 'string' ||
    !esCondicionDelReceptor(condicion) ||
    !esDocumento(docTipo) ||
    typeof docNro !== 'string'
  ) {
    return null;
  }
  return { nombre, condicion, docTipo, docNro, domicilio };
}

function facturaDelCliente(valor: unknown): FacturaDelCliente | null {
  const crudo = crudoONada(valor);
  if (crudo === null) return null;
  const { id, tipo, punto_de_venta: puntoDeVenta, numero: suNumero, fecha, detalle } = crudo;
  const { importe_centavos: importe, cae, cae_vence: caeVence, prueba } = crudo;
  const emisor = emisorDeLaFactura(crudo.emisor);
  const receptor = receptorDeLaFactura(crudo.receptor);
  if (
    typeof id !== 'string' ||
    !esTipoDeComprobante(tipo) ||
    !esEnteroPositivo(puntoDeVenta) ||
    !esEnteroPositivo(suNumero) ||
    typeof fecha !== 'string' ||
    !esFechaQueExiste(fecha) ||
    !esEnteroPositivo(importe) ||
    typeof detalle !== 'string' ||
    typeof cae !== 'string' ||
    typeof caeVence !== 'string' ||
    !esFechaQueExiste(caeVence) ||
    typeof prueba !== 'boolean' ||
    emisor === null ||
    receptor === null
  ) {
    return null;
  }
  return {
    id,
    tipo,
    puntoDeVenta,
    numero: suNumero,
    fecha,
    importe: dinero(importe),
    detalle,
    cae,
    caeVence,
    prueba,
    emisor,
    receptor,
    anuladaPor: tipo === 'factura_c' ? comprobanteAsociado(crudo.anulada_por) : null,
    anulaA: tipo === 'nota_de_credito_c' ? comprobanteAsociado(crudo.anula_a) : null,
  };
}

function facturas(valor: unknown): FacturaDelCliente[] {
  if (!Array.isArray(valor)) return [];
  return valor.map(facturaDelCliente).filter((factura) => factura !== null);
}

export function leerVistaDelCliente(valor: unknown): TrabajoDelCliente {
  const cuerpo = objeto(valor, 'el trabajo');
  const moneda = monedaONada(cuerpo.moneda) ?? MONEDA_DEL_TALLER;
  return {
    taller: texto(objeto(cuerpo.taller, 'el taller').nombre, 'el nombre del taller'),
    cliente: texto(objeto(cuerpo.cliente, 'el cliente').nombre, 'el nombre del cliente'),
    trabajo: texto(cuerpo.trabajo, 'el trabajo'),
    idioma: idiomaLeido(cuerpo.idioma),
    direccion: texto(cuerpo.direccion, 'la dirección'),
    estado: texto(cuerpo.estado, 'la etapa') as EstadoProyecto,
    moneda,
    cobraEn: cobraEnLeido(cuerpo.cobra_en),
    precio: importeEnSuMonedaONada(moneda, cuerpo.precio_centavos, 'el precio'),
    sena: importeEnSuMonedaONada(moneda, cuerpo.sena_centavos, 'la seña'),
    dolarDelDia: dolarDelDia(cuerpo.dolar_del_dia),
    fechas: fechas(cuerpo.fechas),
    visita: visita(cuerpo.visita),
    entrega: entrega(cuerpo.entrega),
    pago: pagoPendiente(cuerpo.pago, moneda),
    cobro: cobro(cuerpo.cobro),
    cobroEnDolares: cuentaEnDolares(cuerpo.cobro_en_dolares),
    pagos: pagos(cuerpo.pagos, moneda),
    archivos: archivos(cuerpo.archivos),
    vidriera: vidriera(cuerpo.vidriera),
    valorDelRelevamiento: importeONada(cuerpo.relevamiento_centavos, 'el valor del relevamiento'),
    presupuesto: presupuesto(cuerpo.presupuesto),
    facturas: facturas(cuerpo.facturas),
  };
}

export async function traerVistaDelCliente(
  cliente: ClienteMaun,
  proyectoId: string,
): Promise<TrabajoDelCliente> {
  const { data, error } = await cliente.rpc('vista_del_cliente', { p_proyecto_id: proyectoId });
  if (error) throw error;
  return leerVistaDelCliente(data);
}

export async function traerVistaCompartida(
  cliente: ClienteMaun,
  token: string,
): Promise<TrabajoDelCliente> {
  const { data, error } = await cliente.rpc('vista_compartida', { p_token: token });
  if (error) throw error;
  return leerVistaDelCliente(data);
}

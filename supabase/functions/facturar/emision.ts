import { centavos, type Money } from '@maun/domain';

import { ErrorDeLaBase, type Base, type Comprobante, type Paso } from './base.ts';
import { clavePemDescifrada } from './certificados.ts';
import {
  ambientesPrendidos,
  estaPrendido,
  type CertificadoParaFirmar,
  type Configuracion,
} from './entorno.ts';
import { SinRespuesta, type Ambiente, type Pedir } from './red.ts';
import { accesoAArca, type Acceso, type Credencial } from './wsaa.ts';
import {
  coincide,
  consultar,
  conversacion,
  delTicket,
  NUMERO_QUE_NO_SIGUE,
  pedirElCae,
  ultimoAutorizado,
  type ComprobanteParaArca,
  type Hablar,
} from './wsfe.ts';
import type { MensajeDeArca } from './xml.ts';

export interface Dependencias {
  configuracion: Configuracion;
  base: Base;
  pedir: Pedir;
  ahora: () => Date;
}

export const SEGUNDOS_DE_LA_TOMA = 120;
export const MINIMO_PARA_PEDIR_MS = 45_000;
export const VUELTA_MS = 60_000;

export type Desenlace =
  'autorizada' | 'rechazada' | 'a_revisar' | 'pedida' | 'soltada' | 'ocupada' | 'sin-certificado';

const FORMATO_DEL_DIA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
});

export function hoyEnLaArgentina(ahora: Date): string {
  return FORMATO_DEL_DIA.format(ahora);
}

export async function firmanteDelTaller(
  dependencias: Pick<Dependencias, 'configuracion' | 'base'>,
  ambiente: Ambiente,
  householdId: string,
): Promise<CertificadoParaFirmar | null> {
  const { configuracion, base } = dependencias;
  if (ambiente === 'homologacion') return configuracion.pruebas;
  const llave = configuracion.llaveDeProduccion;
  if (llave === null) return null;
  const { activo } = await base.certificados(householdId);
  if (
    activo === null ||
    activo.certificado === null ||
    activo.huella === null ||
    activo.vence === null
  ) {
    return null;
  }
  return {
    pem: activo.certificado,
    clavePem: await clavePemDescifrada(llave, activo.claveCifrada, activo.claveIv),
    cuit: activo.cuit.replace(/\D/g, ''),
    vence: activo.vence,
    claveDelTicket: activo.huella,
  };
}

function primerMensaje(mensajes: readonly MensajeDeArca[]): string {
  const primero = mensajes[0];
  return primero === undefined
    ? 'ARCA no dio un resultado.'
    : `${String(primero.codigo)} ${primero.mensaje}`;
}

interface EnLaMano {
  dependencias: Dependencias;
  fila: Comprobante;
  firmante: CertificadoParaFirmar;
  acceso: Extract<Acceso, { ok: true }>;
  hablar: Hablar;
  comprobante: ComprobanteParaArca;
}

async function anotar(
  enLaMano: EnLaMano,
  paso: Exclude<Paso, { paso: 'reservar' }>,
): Promise<Desenlace> {
  const { fila, dependencias } = enLaMano;
  const anotado = await dependencias.base.anotar(fila.id, paso);
  if (paso.paso === 'soltar' || !anotado.hecho) return 'soltada';
  return paso.paso;
}

function soltar(enLaMano: EnLaMano, error: string): Promise<Desenlace> {
  return anotar(enLaMano, { paso: 'soltar', intento: enLaMano.fila.intentos, error });
}

async function porElTicket(
  enLaMano: EnLaMano,
  errores: readonly MensajeDeArca[],
): Promise<Desenlace> {
  const { dependencias, fila, firmante, acceso } = enLaMano;
  if (acceso.nuevo && errores.some((error) => error.codigo === 601)) {
    await dependencias.base.anotarElAcceso(fila.ambiente, false, fila.household_id);
  } else {
    await dependencias.base.guardarElTicket(firmante.claveDelTicket, { borrar: true });
  }
  return soltar(enLaMano, `ARCA no aceptó el ticket: ${primerMensaje(errores)}`);
}

async function pedirYAnotar(
  enLaMano: EnLaMano,
  numero: number,
  fecha: string,
  emitiendoHasta: string | null,
  entroEnPedida: boolean,
): Promise<Desenlace> {
  const { dependencias, fila, hablar, acceso } = enLaMano;
  const comprobante = { ...enLaMano.comprobante, numero, fecha };
  const restante =
    emitiendoHasta === null ? 0 : Date.parse(emitiendoHasta) - dependencias.ahora().getTime();
  if (restante < MINIMO_PARA_PEDIR_MS) {
    return soltar(enLaMano, 'Quedaba poco tiempo de la toma: se pide en la vuelta siguiente.');
  }

  let respuesta;
  try {
    respuesta = await pedirElCae(hablar, acceso.credencial, comprobante);
  } catch (error) {
    if (error instanceof SinRespuesta)
      return soltar(enLaMano, `ARCA no contestó (${error.message}).`);
    throw error;
  }

  if (respuesta.resultado === 'A') {
    return anotar(enLaMano, {
      paso: 'autorizada',
      intento: fila.intentos,
      cae: respuesta.cae,
      caeVence: respuesta.caeVence,
      fecha: respuesta.fecha,
    });
  }

  if (respuesta.resultado === 'R') {
    const todos = [...respuesta.errores, ...respuesta.observaciones];
    if (todos.some((error) => error.codigo === NUMERO_QUE_NO_SIGUE)) {
      if (entroEnPedida) {
        return anotar(enLaMano, {
          paso: 'pedida',
          intento: fila.intentos,
          error: primerMensaje(todos),
        });
      }
      return consultarYResolver(
        enLaMano,
        numero,
        'ARCA dijo que el número no seguía al volver a pedirlo',
      );
    }
    return anotar(enLaMano, {
      paso: 'rechazada',
      intento: fila.intentos,
      rechazo: { errores: respuesta.errores, observaciones: respuesta.observaciones },
    });
  }

  if (delTicket(respuesta.errores)) return porElTicket(enLaMano, respuesta.errores);
  return soltar(enLaMano, `ARCA no dio un resultado: ${primerMensaje(respuesta.errores)}`);
}

async function consultarYResolver(
  enLaMano: EnLaMano,
  numero: number,
  siNoCoincide: string,
): Promise<Desenlace> {
  const { fila, hablar, acceso, comprobante } = enLaMano;
  let consulta;
  try {
    consulta = await consultar(hablar, acceso.credencial, fila.tipo, fila.punto_de_venta, numero);
  } catch (error) {
    if (error instanceof SinRespuesta)
      return soltar(enLaMano, `ARCA no contestó (${error.message}).`);
    throw error;
  }
  if ('errores' in consulta) {
    if (delTicket(consulta.errores)) return porElTicket(enLaMano, consulta.errores);
    return soltar(enLaMano, `No se pudo consultar el número: ${primerMensaje(consulta.errores)}`);
  }
  if (consulta.existe && coincide(consulta.comprobante, { ...comprobante, numero })) {
    const { cae, caeVence, fecha } = consulta.comprobante;
    return anotar(enLaMano, {
      paso: 'autorizada',
      intento: fila.intentos,
      cae,
      caeVence: caeVence ?? '',
      fecha: fecha ?? '',
    });
  }
  return anotar(enLaMano, {
    paso: 'a_revisar',
    intento: fila.intentos,
    motivo: consulta.existe
      ? `ARCA tiene el número ${String(numero)} con otros datos.`
      : `${siNoCoincide}, y ARCA no lo tiene.`,
  });
}

async function emitirNuevo(enLaMano: EnLaMano): Promise<Desenlace> {
  const { dependencias, fila, hablar, acceso } = enLaMano;
  let ultimo;
  try {
    ultimo = await ultimoAutorizado(hablar, acceso.credencial, fila.punto_de_venta, fila.tipo);
  } catch (error) {
    if (error instanceof SinRespuesta)
      return soltar(enLaMano, `ARCA no contestó (${error.message}).`);
    throw error;
  }
  if ('errores' in ultimo) {
    if (delTicket(ultimo.errores)) return porElTicket(enLaMano, ultimo.errores);
    return soltar(enLaMano, `No se pudo saber el último número: ${primerMensaje(ultimo.errores)}`);
  }
  const numero = ultimo.numero + 1;
  const fecha = hoyEnLaArgentina(dependencias.ahora());
  const reservado = await dependencias.base.anotar(fila.id, {
    paso: 'reservar',
    intento: fila.intentos,
    numero,
    fecha,
    segundos: SEGUNDOS_DE_LA_TOMA,
  });
  if (!reservado.hecho) return 'ocupada';
  return pedirYAnotar(enLaMano, numero, fecha, reservado.comprobante.emitiendo_hasta, true);
}

async function retomar(enLaMano: EnLaMano): Promise<Desenlace> {
  const { dependencias, fila, hablar, acceso, comprobante } = enLaMano;
  const numero = fila.numero ?? 0;
  let consulta;
  try {
    consulta = await consultar(hablar, acceso.credencial, fila.tipo, fila.punto_de_venta, numero);
  } catch (error) {
    if (error instanceof SinRespuesta)
      return soltar(enLaMano, `ARCA no contestó (${error.message}).`);
    throw error;
  }
  if ('errores' in consulta) {
    if (delTicket(consulta.errores)) return porElTicket(enLaMano, consulta.errores);
    return soltar(enLaMano, `No se pudo consultar el número: ${primerMensaje(consulta.errores)}`);
  }
  if (consulta.existe) {
    if (coincide(consulta.comprobante, { ...comprobante, numero })) {
      const { cae, caeVence, fecha } = consulta.comprobante;
      return anotar(enLaMano, {
        paso: 'autorizada',
        intento: fila.intentos,
        cae,
        caeVence: caeVence ?? '',
        fecha: fecha ?? '',
      });
    }
    return anotar(enLaMano, {
      paso: 'a_revisar',
      intento: fila.intentos,
      motivo: `ARCA tiene el número ${String(numero)} con otros datos.`,
    });
  }

  let ultimo;
  try {
    ultimo = await ultimoAutorizado(hablar, acceso.credencial, fila.punto_de_venta, fila.tipo);
  } catch (error) {
    if (error instanceof SinRespuesta)
      return soltar(enLaMano, `ARCA no contestó (${error.message}).`);
    throw error;
  }
  if ('errores' in ultimo) {
    if (delTicket(ultimo.errores)) return porElTicket(enLaMano, ultimo.errores);
    return soltar(enLaMano, `No se pudo saber el último número: ${primerMensaje(ultimo.errores)}`);
  }
  if (ultimo.numero !== numero - 1) {
    return anotar(enLaMano, {
      paso: 'a_revisar',
      intento: fila.intentos,
      motivo:
        ultimo.numero >= numero
          ? `ARCA no tiene el número ${String(numero)} y su último autorizado ya es el ${String(ultimo.numero)}.`
          : `ARCA no tiene el número ${String(numero)} y su último autorizado es el ${String(ultimo.numero)}: hay un hueco.`,
    });
  }

  const fecha = hoyEnLaArgentina(dependencias.ahora());
  const reservado = await dependencias.base.anotar(fila.id, {
    paso: 'reservar',
    intento: fila.intentos,
    numero,
    fecha,
    segundos: SEGUNDOS_DE_LA_TOMA,
  });
  if (!reservado.hecho) return 'ocupada';
  return pedirYAnotar(enLaMano, numero, fecha, reservado.comprobante.emitiendo_hasta, false);
}

export async function trabajarUno(dependencias: Dependencias, id: string): Promise<Desenlace> {
  const { configuracion, base, pedir } = dependencias;
  const fila = await base.tomar(id, SEGUNDOS_DE_LA_TOMA);
  if (fila === null) return 'ocupada';

  const soltarSinLaMano = async (error: string): Promise<Desenlace> => {
    await base.anotar(fila.id, { paso: 'soltar', intento: fila.intentos, error });
    return 'soltada';
  };

  if (!estaPrendido(configuracion, fila.ambiente)) {
    return soltarSinLaMano('Ese ambiente de ARCA no está prendido.');
  }

  const firmante = await firmanteDelTaller(dependencias, fila.ambiente, fila.household_id);
  if (firmante === null) {
    await base.anotarElAcceso(
      fila.ambiente,
      false,
      fila.ambiente === 'produccion' ? fila.household_id : null,
    );
    await soltarSinLaMano('El taller no tiene un certificado activo.');
    return 'sin-certificado';
  }

  const acceso = await accesoAArca(
    dependencias,
    fila.ambiente,
    firmante,
    fila.ambiente === 'produccion' ? fila.household_id : null,
  );
  if (!acceso.ok) {
    return soltarSinLaMano(
      acceso.razon === 'esperar'
        ? 'Esperando a que ARCA dé otro ticket.'
        : acceso.razon === 'rechazado'
          ? `ARCA no dejó entrar: ${acceso.motivo}`
          : 'ARCA no contestó al entrar.',
    );
  }

  const credencial: Credencial =
    fila.ambiente === 'produccion'
      ? { ...acceso.credencial, cuit: fila.cuit_emisor.replace(/\D/g, '') }
      : acceso.credencial;

  let asociado: ComprobanteParaArca['asociado'] = null;
  if (fila.asociado_id !== null) {
    asociado = await base.facturaAsociada(fila.asociado_id);
    if (asociado === null) return soltarSinLaMano('La factura que anula no tiene número.');
  }

  const enLaMano: EnLaMano = {
    dependencias,
    fila,
    firmante,
    acceso: { ...acceso, credencial },
    hablar: conversacion({
      ambiente: fila.ambiente,
      pedir,
      anotar: (intercambio) => base.anotarElIntercambio(intercambio).catch(() => undefined),
      householdId: fila.household_id,
      comprobanteId: fila.id,
      cuits: [firmante.cuit, fila.cuit_emisor],
    }),
    comprobante: {
      tipo: fila.tipo,
      puntoDeVenta: fila.punto_de_venta,
      numero: fila.numero ?? 0,
      fecha: fila.fecha ?? hoyEnLaArgentina(dependencias.ahora()),
      concepto: fila.concepto,
      importe: centavos(fila.importe_centavos) as Money,
      docTipo: fila.doc_tipo,
      docNro: fila.doc_nro,
      condicionIva: fila.condicion_iva_receptor,
      asociado,
    },
  };

  return fila.estado === 'pedida' ? emitirNuevo(enLaMano) : retomar(enLaMano);
}

export async function trabajarLoPendiente(
  dependencias: Dependencias,
): Promise<{ tomados: number; desenlaces: Partial<Record<Desenlace | 'error', number>> }> {
  const ambientes = ambientesPrendidos(dependencias.configuracion);
  const desenlaces: Partial<Record<Desenlace | 'error', number>> = {};
  if (ambientes.length === 0) return { tomados: 0, desenlaces };
  const ids = await dependencias.base.pendientes(ambientes);
  const inicio = dependencias.ahora().getTime();
  let tomados = 0;
  for (const id of ids) {
    if (dependencias.ahora().getTime() - inicio >= VUELTA_MS) break;
    tomados += 1;
    let desenlace: Desenlace | 'error';
    try {
      desenlace = await trabajarUno(dependencias, id);
    } catch (error) {
      console.error(
        'un comprobante no se pudo trabajar',
        error instanceof ErrorDeLaBase
          ? error.codigo
          : error instanceof Error
            ? error.name
            : 'error',
      );
      desenlace = 'error';
    }
    desenlaces[desenlace] = (desenlaces[desenlace] ?? 0) + 1;
  }
  return { tomados, desenlaces };
}

import {
  centavos,
  CODIGO_DE_ARCA,
  numeroDelComprobante,
  type Money,
  type TipoDeComprobante,
} from '@maun/domain';
import forge from 'node-forge';

import { armarElPedido } from './certificados.ts';
import { cuitDelCertificado } from './entorno.ts';
import { hoyEnLaArgentina } from './emision.ts';
import { SinRespuesta } from './red.ts';
import { entrarAArca, VENTANA_SIN_OTRO_TICKET_MS, type Credencial } from './wsaa.ts';
import {
  coincide,
  condicionesDelReceptor,
  consultar,
  conversacion,
  pedirElCae,
  puntosDeVenta,
  servidorAndando,
  ultimoAutorizado,
  type ComprobanteParaArca,
  type Hablar,
} from './wsfe.ts';
import { sinLosCuit, type MensajeDeArca } from './xml.ts';

const PUNTO_DEL_TALLER_DE_PRUEBA = 2;
const CUIT_INVENTADO = '20-11111111-2';
const MINUTOS_QUE_LE_TIENEN_QUE_QUEDAR = 10;

const CUITS_QUE_NO_SE_MUESTRAN: string[] = [];

interface Ticket {
  token: string;
  firma: string;
  vence: string;
}

interface Opciones {
  emitir: boolean;
  puntoDeVenta: number;
}

const HORA = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  dateStyle: 'short',
  timeStyle: 'short',
});

function leerLasOpciones(argumentos: readonly string[]): Opciones {
  const emitir = argumentos.includes('--emitir');
  const indice = argumentos.indexOf('--punto-de-venta');
  const texto = indice === -1 ? undefined : argumentos[indice + 1];
  if (emitir && texto === undefined) {
    throw new Error(
      'Con --emitir va --punto-de-venta <n>, uno que no sea el del taller de prueba.',
    );
  }
  const puntoDeVenta = texto === undefined ? 1 : Number(texto);
  if (!Number.isInteger(puntoDeVenta) || puntoDeVenta < 1 || puntoDeVenta > 99_998) {
    throw new Error('El punto de venta va de 1 a 99998.');
  }
  if (emitir && puntoDeVenta === PUNTO_DEL_TALLER_DE_PRUEBA) {
    throw new Error(
      `El ${String(PUNTO_DEL_TALLER_DE_PRUEBA)} es el del taller de prueba: lo que se emita ahí quedaría como una factura que NUMA no hizo.`,
    );
  }
  return { emitir, puntoDeVenta };
}

function variable(nombre: string): string {
  const valor = Deno.env.get(nombre)?.trim();
  if (valor === undefined || valor === '') throw new Error(`Falta ${nombre}.`);
  return valor;
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

async function leerElTicket(archivo: string): Promise<Ticket | null> {
  try {
    const guardado = JSON.parse(await Deno.readTextFile(archivo)) as Partial<Ticket>;
    if (
      typeof guardado.token !== 'string' ||
      typeof guardado.firma !== 'string' ||
      typeof guardado.vence !== 'string'
    ) {
      return null;
    }
    return { token: guardado.token, firma: guardado.firma, vence: guardado.vence };
  } catch {
    return null;
  }
}

function mensajesDeArca(mensajes: readonly MensajeDeArca[], cuits: readonly string[]): string {
  return mensajes
    .map((mensaje) => `${String(mensaje.codigo)} ${sinLosCuit(mensaje.mensaje, cuits)}`)
    .join(' · ');
}

async function entrar(
  pem: string,
  clavePem: string,
  cuit: string,
  archivoDelTicket: string,
): Promise<Credencial> {
  const guardado = await leerElTicket(archivoDelTicket);
  if (
    guardado !== null &&
    Date.parse(guardado.vence) - Date.now() > MINUTOS_QUE_LE_TIENEN_QUE_QUEDAR * 60_000
  ) {
    console.log(
      `Login: con el ticket guardado, que vence el ${HORA.format(new Date(guardado.vence))}.`,
    );
    return { token: guardado.token, firma: guardado.firma, cuit };
  }

  for (let vuelta = 0; vuelta < 2; vuelta += 1) {
    const login = await entrarAArca('homologacion', { pem, clavePem }, new Date(), fetch);
    const { resultado } = login;
    if (resultado.ok) {
      await Deno.writeTextFile(
        archivoDelTicket,
        JSON.stringify({ token: resultado.token, firma: resultado.firma, vence: resultado.vence }),
      );
      console.log(
        `Login: ticket nuevo en ${String(login.ms)} ms (HTTP ${String(login.http)}), vence el ${HORA.format(new Date(resultado.vence))}.`,
      );
      return { token: resultado.token, firma: resultado.firma, cuit };
    }
    if (!resultado.yaTieneTicket || vuelta === 1) {
      throw new Error(`ARCA no dejó entrar: ${sinLosCuit(resultado.motivo, [cuit])}`);
    }
    const minutos = (VENTANA_SIN_OTRO_TICKET_MS.homologacion + 60_000) / 60_000;
    console.log(
      `ARCA ya dio un ticket para este certificado hace poco: espero ${String(minutos)} minutos y pruebo de nuevo.`,
    );
    await esperar(VENTANA_SIN_OTRO_TICKET_MS.homologacion + 60_000);
  }
  throw new Error('ARCA no dio un ticket.');
}

async function ultimos(
  hablar: Hablar,
  credencial: Credencial,
  puntoDeVenta: number,
): Promise<void> {
  const lineas: string[] = [];
  for (const tipo of ['factura_c', 'nota_de_credito_c'] as const) {
    const ultimo = await ultimoAutorizado(hablar, credencial, puntoDeVenta, tipo);
    lineas.push(
      'numero' in ultimo
        ? `tipo ${String(CODIGO_DE_ARCA[tipo])}: ${String(ultimo.numero)}`
        : `tipo ${String(CODIGO_DE_ARCA[tipo])}: ${mensajesDeArca(ultimo.errores, [credencial.cuit])}`,
    );
  }
  console.log(
    `Últimos autorizados en el punto de venta ${String(puntoDeVenta)}: ${lineas.join(', ')}.`,
  );
}

async function emitirUno(
  hablar: Hablar,
  credencial: Credencial,
  nombre: string,
  comprobante: Omit<ComprobanteParaArca, 'numero' | 'fecha'>,
): Promise<{ numero: number; fecha: string } | null> {
  const ultimo = await ultimoAutorizado(
    hablar,
    credencial,
    comprobante.puntoDeVenta,
    comprobante.tipo,
  );
  if (!('numero' in ultimo)) {
    console.log(
      `${nombre}: no se pudo saber el último número (${mensajesDeArca(ultimo.errores, [credencial.cuit])}).`,
    );
    return null;
  }
  const pedido: ComprobanteParaArca = {
    ...comprobante,
    numero: ultimo.numero + 1,
    fecha: hoyEnLaArgentina(new Date()),
  };
  const respuesta = await pedirElCae(hablar, credencial, pedido);
  const numero = numeroDelComprobante(pedido.puntoDeVenta, pedido.numero);
  if (respuesta.resultado === 'A') {
    const observaciones =
      respuesta.observaciones.length === 0
        ? ''
        : `, con observaciones: ${mensajesDeArca(respuesta.observaciones, [credencial.cuit])}`;
    console.log(
      `${nombre}: ${numero} autorizada, CAE de prueba ${respuesta.cae}, vence el ${respuesta.caeVence}${observaciones}.`,
    );
    return { numero: pedido.numero, fecha: respuesta.fecha };
  }
  if (respuesta.resultado === 'R') {
    console.log(
      `${nombre}: ${numero} rechazada: ${mensajesDeArca([...respuesta.errores, ...respuesta.observaciones], [credencial.cuit])}.`,
    );
    return null;
  }
  console.log(
    `${nombre}: ${numero} sin resultado: ${mensajesDeArca(respuesta.errores, [credencial.cuit])}.`,
  );
  return null;
}

async function compararConLoPedido(
  hablar: Hablar,
  credencial: Credencial,
  tipo: TipoDeComprobante,
  comprobante: Pick<ComprobanteParaArca, 'puntoDeVenta' | 'importe' | 'docTipo' | 'docNro'> & {
    numero: number;
  },
): Promise<void> {
  const consulta = await consultar(
    hablar,
    credencial,
    tipo,
    comprobante.puntoDeVenta,
    comprobante.numero,
  );
  const numero = numeroDelComprobante(comprobante.puntoDeVenta, comprobante.numero);
  if ('errores' in consulta) {
    console.log(
      `Consulta de la ${numero}: ${mensajesDeArca(consulta.errores, [credencial.cuit])}.`,
    );
    return;
  }
  if (!consulta.existe) {
    console.log(`Consulta de la ${numero}: ARCA no la tiene.`);
    return;
  }
  const igual = coincide(consulta.comprobante, { tipo, ...comprobante });
  console.log(
    `Consulta de la ${numero}: ${igual ? 'coincide con lo pedido' : 'NO coincide con lo pedido'} (importe ${consulta.comprobante.importe}, documento ${String(consulta.comprobante.docTipo)} ${consulta.comprobante.docNro}, CAE ${consulta.comprobante.cae}).`,
  );
}

async function emitirLasDePrueba(
  hablar: Hablar,
  credencial: Credencial,
  puntoDeVenta: number,
): Promise<void> {
  const unPeso = centavos(100) as Money;
  const sinDocumento = {
    tipo: 'factura_c' as const,
    puntoDeVenta,
    concepto: 1,
    importe: unPeso,
    docTipo: 99,
    docNro: '0',
    condicionIva: 5,
    asociado: null,
  };

  const factura = await emitirUno(
    hablar,
    credencial,
    'Factura C a consumidor final sin documento',
    sinDocumento,
  );
  if (factura !== null) {
    await compararConLoPedido(hablar, credencial, 'factura_c', {
      ...sinDocumento,
      numero: factura.numero,
    });
    const nota = await emitirUno(hablar, credencial, 'Nota de Crédito C que la anula', {
      ...sinDocumento,
      tipo: 'nota_de_credito_c',
      asociado: { puntoDeVenta, numero: factura.numero, fecha: factura.fecha },
    });
    if (nota !== null) {
      await compararConLoPedido(hablar, credencial, 'nota_de_credito_c', {
        ...sinDocumento,
        numero: nota.numero,
      });
    }
  }

  await emitirUno(hablar, credencial, 'Factura C de servicios (concepto 2), con sus tres fechas', {
    ...sinDocumento,
    concepto: 2,
  });

  await emitirUno(
    hablar,
    credencial,
    'Factura C a consumidor final con CUIT (documento 80, condición 5)',
    {
      ...sinDocumento,
      docTipo: 80,
      docNro: CUIT_INVENTADO.replace(/-/g, ''),
    },
  );
}

async function armarElPedidoDePrueba(archivo: string): Promise<void> {
  const llave = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
  const { pedido } = await armarElPedido(CUIT_INVENTADO, 'TALLER DE PRUEBA ÑANDÚ Y CÍA', llave);
  await Deno.writeTextFile(archivo, pedido);
  console.log(
    `Pedido de certificado para el CUIT inventado ${CUIT_INVENTADO}: ${archivo} (verificalo con openssl req -in "${archivo}" -noout -verify -text).`,
  );
}

async function ensayar(): Promise<void> {
  const opciones = leerLasOpciones(Deno.args);
  const pem = await Deno.readTextFile(variable('ARCA_PRUEBA_CERT'));
  const clavePem = await Deno.readTextFile(variable('ARCA_PRUEBA_CLAVE'));
  const archivoDelTicket = variable('ARCA_PRUEBA_TICKET');
  const archivoDelPedido = variable('ARCA_PRUEBA_PEDIDO');

  const cuit = cuitDelCertificado(forge.pki.certificateFromPem(pem));
  if (cuit === '') throw new Error('El certificado de prueba no trae el CUIT en el subject.');
  CUITS_QUE_NO_SE_MUESTRAN.push(cuit);

  const hablar = conversacion({
    ambiente: 'homologacion',
    pedir: fetch,
    anotar: (intercambio) => {
      console.log(
        `  · ${intercambio.metodo}: ${intercambio.httpEstado === null ? 'sin respuesta' : `HTTP ${String(intercambio.httpEstado)}`} en ${String(intercambio.duracionMs ?? 0)} ms`,
      );
      return Promise.resolve();
    },
    householdId: null,
    comprobanteId: null,
    cuits: [cuit],
  });

  console.log('Ensayo contra la homologación de ARCA, sin la base.');
  console.log(
    `FEDummy: ${(await servidorAndando(hablar)) ? 'los tres servidores en OK' : 'algún servidor no está en OK'}.`,
  );

  const credencial = await entrar(pem, clavePem, cuit, archivoDelTicket);

  const condiciones = await condicionesDelReceptor(hablar, credencial);
  console.log(
    'condiciones' in condiciones
      ? `Condiciones frente al IVA para la clase C: ${condiciones.condiciones.map((condicion) => `${String(condicion.id)} ${condicion.descripcion}`).join(', ')}.`
      : `Condiciones frente al IVA: ${mensajesDeArca(condiciones.errores, [cuit])}.`,
  );

  const puntos = await puntosDeVenta(hablar, credencial);
  console.log(
    'puntos' in puntos
      ? puntos.puntos.length === 0
        ? 'Puntos de venta: ARCA no tiene ninguno dado de alta para web services.'
        : `Puntos de venta: ${puntos.puntos.map((punto) => `${String(punto.numero)} ${punto.emisionTipo}${punto.bloqueado ? ' (bloqueado)' : ''}${punto.deBaja ? ' (de baja)' : ''}`).join(', ')}.`
      : `Puntos de venta: ${mensajesDeArca(puntos.errores, [cuit])}.`,
  );

  await ultimos(hablar, credencial, opciones.puntoDeVenta);

  if (opciones.emitir) {
    await emitirLasDePrueba(hablar, credencial, opciones.puntoDeVenta);
    await ultimos(hablar, credencial, opciones.puntoDeVenta);
  }

  await armarElPedidoDePrueba(archivoDelPedido);
}

if (import.meta.main) {
  try {
    await ensayar();
  } catch (error) {
    console.error(
      sinLosCuit(
        error instanceof SinRespuesta
          ? `ARCA no contestó (${error.message}).`
          : error instanceof Error
            ? error.message
            : 'El ensayo falló.',
        CUITS_QUE_NO_SE_MUESTRAN,
      ),
    );
    Deno.exit(1);
  }
}

import assert from 'node:assert/strict';

import { centavos, cuitValido } from '@maun/domain';
import forge from 'node-forge';

import type {
  Anotado,
  Base,
  CertificadosDelTaller,
  Comprobante,
  FacturaAsociada,
  FacturacionDelTaller,
  Intercambio,
  Paso,
  TallerParaControlar,
  TicketParaGuardar,
  TomaDelLogin,
} from './base.ts';
import { ErrorDeLaBase } from './base.ts';
import { armarElPedido, clavePemDescifrada, titularDelPedido } from './certificados.ts';
import { controlar } from './control.ts';
import {
  configuracionDelEntorno,
  llaveDeProduccion,
  type Configuracion,
  type Entorno,
} from './entorno.ts';
import { trabajarLoPendiente, trabajarUno, type Dependencias } from './emision.ts';
import { crearManejador } from './manejador.ts';
import { FueraDeLaLista, HOSTS, pedirAArca, SERVICIOS, type Ambiente, type Pedir } from './red.ts';
import * as respuestas from './respuestas.ts';
import { pedidoDeLogin } from './wsaa.ts';
import { detalleDelPedido, leerElCae } from './wsfe.ts';
import { tapar } from './xml.ts';

const AHORA = new Date('2026-10-03T15:00:00Z');
const HOY = '2026-10-03';
const SECRETO = 'secreto-del-disparo-de-prueba-0123456789';
const CUIT_DE_LA_PRUEBA = '20222222223';
const CUIT_DE_LA_FILA = '20-11111111-2';
const CUIT_DE_PRODUCCION = '20-30123456-3';
const CUIT_DE_LA_RENOVACION = '27-30123456-8';
const CUIT_AJENO = '20111111112';

function binario(bytes: Uint8Array): string {
  let salida = '';
  for (const byte of bytes) salida += String.fromCharCode(byte);
  return salida;
}

interface Par {
  clave: forge.pki.rsa.PrivateKey;
  publica: forge.pki.rsa.PublicKey;
  pkcs8: Uint8Array<ArrayBuffer>;
}

async function parDeClaves(): Promise<Par> {
  const par = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', par.privateKey));
  const clave = forge.pki.privateKeyFromAsn1(
    forge.asn1.fromDer(binario(pkcs8)),
  ) as forge.pki.rsa.PrivateKey;
  return { clave, publica: forge.pki.setRsaPublicKey(clave.n, clave.e), pkcs8 };
}

function certificadoPara(
  publica: forge.pki.PublicKey,
  firmante: forge.pki.rsa.PrivateKey,
  cuit: string,
  hasta = new Date('2028-10-02T00:00:00Z'),
): string {
  const certificado = forge.pki.createCertificate();
  certificado.publicKey = publica;
  certificado.serialNumber = '0a';
  certificado.validity.notBefore = new Date('2026-01-01T00:00:00Z');
  certificado.validity.notAfter = hasta;
  certificado.setSubject([
    { shortName: 'C', value: 'AR' },
    { shortName: 'CN', value: 'numa' },
    { type: '2.5.4.5', value: `CUIT ${cuit}` },
  ]);
  certificado.setIssuer([{ shortName: 'CN', value: 'AC de prueba' }]);
  certificado.sign(firmante, forge.md.sha256.create());
  return forge.pki.certificateToPem(certificado);
}

const PAR_DE_LA_PRUEBA = await parDeClaves();
const PAR_DEL_TALLER = await parDeClaves();
const PAR_AJENO = await parDeClaves();
const PEM_DE_LA_PRUEBA = certificadoPara(
  PAR_DE_LA_PRUEBA.publica,
  PAR_DE_LA_PRUEBA.clave,
  CUIT_DE_LA_PRUEBA,
);
const PEM_DEL_TALLER = certificadoPara(
  PAR_DEL_TALLER.publica,
  PAR_DEL_TALLER.clave,
  CUIT_DE_PRODUCCION.replace(/-/g, ''),
);
const BYTES_DE_LA_LLAVE = crypto.getRandomValues(new Uint8Array(32));
const LLAVE = btoa(binario(BYTES_DE_LA_LLAVE));

function entornoDePrueba(extra: Record<string, string | undefined> = {}): Entorno {
  const valores: Record<string, string | undefined> = {
    SUPABASE_URL: 'https://proyecto.ejemplo.invalid',
    SUPABASE_SERVICE_ROLE_KEY: 'clave-del-servidor',
    FACTURAR_SECRETO: SECRETO,
    ARCA_HOMOLOGACION_CERT: btoa(PEM_DE_LA_PRUEBA),
    ARCA_HOMOLOGACION_CLAVE: btoa(forge.pki.privateKeyToPem(PAR_DE_LA_PRUEBA.clave)),
    ...extra,
  };
  return { get: (nombre) => valores[nombre] };
}

const CON_PRODUCCION = { ARCA_PRODUCCION_HABILITADA: 'si', ARCA_PRODUCCION_LLAVE: LLAVE };

const PRODUCCION_APAGADA: readonly Record<string, string>[] = [
  {},
  { ARCA_PRODUCCION_LLAVE: LLAVE },
  { ARCA_PRODUCCION_HABILITADA: 'SI', ARCA_PRODUCCION_LLAVE: LLAVE },
  { ARCA_PRODUCCION_HABILITADA: 'sí', ARCA_PRODUCCION_LLAVE: LLAVE },
  { ARCA_PRODUCCION_HABILITADA: 'si ', ARCA_PRODUCCION_LLAVE: LLAVE },
  { ARCA_PRODUCCION_HABILITADA: 'si' },
  { ARCA_PRODUCCION_HABILITADA: 'si', ARCA_PRODUCCION_LLAVE: btoa('dieciséis bytes!') },
];

async function cifrada(par: Par): Promise<{ claveCifrada: string; claveIv: string }> {
  const llave = await crypto.subtle.importKey(
    'raw',
    BYTES_DE_LA_LLAVE,
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, llave, par.pkcs8),
  );
  return { claveCifrada: btoa(binario(bytes)), claveIv: btoa(binario(iv)) };
}

const HUELLA_DEL_TALLER = 'a'.repeat(64);

async function certificadosDelTaller(): Promise<CertificadosDelTaller> {
  return {
    activo: {
      id: 'cert-activo',
      estado: 'activo',
      cuit: CUIT_DE_PRODUCCION,
      certificado: PEM_DEL_TALLER,
      huella: HUELLA_DEL_TALLER,
      vence: '2028-10-02',
      ...(await cifrada(PAR_DEL_TALLER)),
    },
    pendiente: null,
  };
}

function comprobante(extra: Partial<Comprobante> = {}): Comprobante {
  return {
    id: 'c1',
    household_id: 'h1',
    proyecto_id: 'p1',
    pago_id: 'g1',
    asociado_id: null,
    tipo: 'factura_c',
    ambiente: 'homologacion',
    estado: 'pedida',
    cuit_emisor: CUIT_DE_LA_FILA,
    punto_de_venta: 2,
    concepto: 1,
    numero: null,
    fecha: null,
    importe_centavos: 45_000_000,
    doc_tipo: 99,
    doc_nro: '0',
    condicion_iva_receptor: 5,
    receptor_nombre: 'Lucía Gómez',
    intentos: 1,
    emitiendo_hasta: new Date(AHORA.getTime() + 120_000).toISOString(),
    ...extra,
  };
}

function taller(extra: Partial<FacturacionDelTaller> = {}): FacturacionDelTaller {
  return {
    householdId: 'h1',
    ambiente: null,
    cuit: '',
    puntoDeVenta: null,
    desde: null,
    tallerCuit: CUIT_DE_PRODUCCION,
    tallerTitular: 'RIVAS MARTIN',
    tallerCondicionFiscal: 'monotributo',
    certificados: { activo: null, pendiente: null },
    ...extra,
  };
}

class BaseFalsa implements Base {
  filas = new Map<string, Comprobante>();
  pedidosDePendientes: Ambiente[][] = [];
  anotados: { id: string; paso: Paso }[] = [];
  tomaDelLogin: TomaDelLogin[] = [];
  ticketsGuardados: { certificado: string; ticket: TicketParaGuardar }[] = [];
  intercambios: Intercambio[] = [];
  accesos: { ambiente: Ambiente; ok: boolean; householdId: string | null }[] = [];
  alertas: { householdId: string; alertas: readonly Record<string, unknown>[] }[] = [];
  certificadosDelTaller: CertificadosDelTaller = { activo: null, pendiente: null };
  pedidosGuardados: unknown[][] = [];
  certificadosGuardados: unknown[][] = [];
  conexiones: unknown[][] = [];
  fallaAlConectar: ErrorDeLaBase | null = null;
  reservaHecha = true;
  segundosDeLaReserva: number | null = null;
  segundosQueQuedanDeLaToma: number | null = null;
  factura: FacturaAsociada | null = null;
  talleres: TallerParaControlar[] = [];
  pedidosParaControlar: Ambiente[][] = [];
  delTaller: FacturacionDelTaller | null = null;
  sesiones = new Map<string, string>();

  constructor(private readonly ahora: () => Date = () => AHORA) {}

  pendientes(ambientes: readonly Ambiente[]): Promise<string[]> {
    this.pedidosDePendientes.push([...ambientes]);
    return Promise.resolve(
      [...this.filas.values()]
        .filter((fila) => ambientes.includes(fila.ambiente))
        .map((fila) => fila.id),
    );
  }

  tomar(id: string): Promise<Comprobante | null> {
    const fila = this.filas.get(id);
    if (fila === undefined) return Promise.resolve(null);
    this.filas.delete(id);
    return Promise.resolve(fila);
  }

  anotar(id: string, paso: Paso): Promise<Anotado> {
    this.anotados.push({ id, paso });
    const base = comprobante({ id });
    if (paso.paso === 'reservar') {
      this.segundosDeLaReserva = paso.segundos;
      const segundos = this.segundosQueQuedanDeLaToma ?? paso.segundos;
      const hasta = new Date(this.ahora().getTime() + segundos * 1000).toISOString();
      return Promise.resolve({
        hecho: this.reservaHecha,
        comprobante: {
          ...base,
          estado: 'emitiendo',
          numero: paso.numero,
          fecha: paso.fecha,
          emitiendo_hasta: hasta,
        },
      });
    }
    return Promise.resolve({ hecho: true, comprobante: base });
  }

  facturaAsociada(): Promise<FacturaAsociada | null> {
    return Promise.resolve(this.factura);
  }

  tomarElLogin(): Promise<TomaDelLogin> {
    return Promise.resolve(this.tomaDelLogin.shift() ?? { pedir: true });
  }

  guardarElTicket(certificado: string, ticket: TicketParaGuardar): Promise<void> {
    this.ticketsGuardados.push({ certificado, ticket });
    return Promise.resolve();
  }

  certificados(): Promise<CertificadosDelTaller> {
    return Promise.resolve(this.certificadosDelTaller);
  }

  guardarElPedido(...argumentos: unknown[]): Promise<void> {
    this.pedidosGuardados.push(argumentos);
    return Promise.resolve();
  }

  guardarElCertificado(...argumentos: unknown[]): Promise<void> {
    this.certificadosGuardados.push(argumentos);
    return Promise.resolve();
  }

  conectar(...argumentos: unknown[]): Promise<void> {
    if (this.fallaAlConectar !== null) return Promise.reject(this.fallaAlConectar);
    this.conexiones.push(argumentos);
    return Promise.resolve();
  }

  anotarElIntercambio(intercambio: Intercambio): Promise<void> {
    this.intercambios.push(intercambio);
    return Promise.resolve();
  }

  anotarElAcceso(ambiente: Ambiente, ok: boolean, householdId: string | null): Promise<void> {
    this.accesos.push({ ambiente, ok, householdId });
    return Promise.resolve();
  }

  paraControlar(ambientes: readonly Ambiente[]): Promise<TallerParaControlar[]> {
    this.pedidosParaControlar.push([...ambientes]);
    return Promise.resolve(this.talleres);
  }

  anotarLasAlertas(
    householdId: string,
    alertas: readonly Record<string, unknown>[],
  ): Promise<void> {
    this.alertas.push({ householdId, alertas });
    return Promise.resolve();
  }

  delUsuario(): Promise<FacturacionDelTaller | null> {
    return Promise.resolve(this.delTaller);
  }

  usuarioDelToken(token: string): Promise<string | null> {
    return Promise.resolve(this.sesiones.get(token) ?? null);
  }
}

interface LlamadaAArca {
  url: string;
  metodo: string;
  cuerpo: string;
}

class ArcaFalsa {
  llamadas: LlamadaAArca[] = [];
  private colas = new Map<string, (string | Error | { estado: number; texto: string })[]>();

  responder(
    metodo: string,
    ...respuestas: (string | Error | { estado: number; texto: string })[]
  ): this {
    this.colas.set(metodo, [...(this.colas.get(metodo) ?? []), ...respuestas]);
    return this;
  }

  metodos(): string[] {
    return this.llamadas.map((llamada) => llamada.metodo);
  }

  pedir: Pedir = (url, init) => {
    const accion = new Headers(init.headers).get('SOAPAction') ?? '';
    const metodo =
      accion === '""'
        ? 'loginCms'
        : accion.replace(/^"http:\/\/ar\.gov\.afip\.dif\.FEV1\/(\w+)"$/, '$1');
    this.llamadas.push({ url, metodo, cuerpo: String(init.body ?? '') });
    const siguiente = this.colas.get(metodo)?.shift();
    if (siguiente === undefined)
      return Promise.reject(new Error(`ARCA falsa: nada para ${metodo}`));
    if (siguiente instanceof Error) return Promise.reject(siguiente);
    if (typeof siguiente === 'string')
      return Promise.resolve(new Response(siguiente, { status: 200 }));
    return Promise.resolve(new Response(siguiente.texto, { status: siguiente.estado }));
  };
}

const TICKET: TomaDelLogin = {
  ticket: { token: 'el-token', firma: 'la-firma', vence: '2026-10-04T03:00:00.000Z' },
};

async function preparar(
  extra: Record<string, string | undefined> = {},
): Promise<{
  dependencias: Dependencias;
  base: BaseFalsa;
  arca: ArcaFalsa;
  configuracion: Configuracion;
}> {
  const configuracion = await configuracionDelEntorno(entornoDePrueba(extra));
  const base = new BaseFalsa();
  const arca = new ArcaFalsa();
  return {
    dependencias: { configuracion, base, pedir: arca.pedir, ahora: () => AHORA },
    base,
    arca,
    configuracion,
  };
}

function cuerpoDe(arca: ArcaFalsa, metodo: string): string {
  return arca.llamadas.find((llamada) => llamada.metodo === metodo)?.cuerpo ?? '';
}

interface NodoAsn1 {
  value: string | NodoAsn1[];
}

function hijos(nodo: NodoAsn1 | undefined): NodoAsn1[] {
  return nodo !== undefined && Array.isArray(nodo.value) ? nodo.value : [];
}

function bytes(nodo: NodoAsn1 | undefined): string {
  return nodo !== undefined && typeof nodo.value === 'string' ? nodo.value : '';
}

function leerElCms(base64: string) {
  const mensaje = forge.pkcs7.messageFromAsn1(forge.asn1.fromDer(forge.util.decode64(base64))) as {
    certificates: forge.pki.Certificate[];
    rawCapture: { content: NodoAsn1; signerInfos: NodoAsn1[]; digestAlgorithm: string };
  };
  const contenido = bytes(hijos(mensaje.rawCapture.content)[0]);
  const firmante = mensaje.rawCapture.signerInfos[0];
  const atributos = hijos(hijos(firmante)[3]);
  const comoSet = forge.asn1.create(
    forge.asn1.Class.UNIVERSAL,
    forge.asn1.Type.SET,
    true,
    atributos,
  );
  const digestoDeLosAtributos = forge.md.sha256.create();
  digestoDeLosAtributos.update(forge.asn1.toDer(comoSet).getBytes());
  const certificado = mensaje.certificates[0];
  assert.ok(certificado !== undefined);
  const digestoDelContenido = forge.md.sha256.create();
  digestoDelContenido.update(contenido);
  const delAtributo = atributos.find(
    (atributo) => forge.asn1.derToOid(bytes(hijos(atributo)[0])) === forge.pki.oids.messageDigest,
  );
  return {
    contenido: forge.util.decodeUtf8(contenido),
    certificado: forge.pki.certificateToPem(certificado),
    algoritmoDelDigesto: forge.asn1.derToOid(mensaje.rawCapture.digestAlgorithm),
    atributos: atributos.map((atributo) => forge.asn1.derToOid(bytes(hijos(atributo)[0]))),
    digestoBien: bytes(hijos(hijos(delAtributo)[1])[0]) === digestoDelContenido.digest().getBytes(),
    firmaBien: (certificado.publicKey as forge.pki.rsa.PublicKey).verify(
      digestoDeLosAtributos.digest().getBytes(),
      bytes(hijos(firmante)[5]),
    ),
  };
}

Deno.test('los CUIT inventados de estos tests tienen bien el dígito verificador', () => {
  for (const cuit of [
    CUIT_DE_LA_PRUEBA,
    CUIT_DE_LA_FILA,
    CUIT_DE_PRODUCCION,
    CUIT_DE_LA_RENOVACION,
    CUIT_AJENO,
  ]) {
    const digitos = cuit.replace(/\D/g, '');
    assert.ok(
      cuitValido(`${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`),
      cuit,
    );
  }
  assert.ok(!cuitValido('20-30123456-4'));
});

// Las trabas 1 y 4 ------------------------------------------------------------------------------------------------

Deno.test(
  'traba 1: la producción existe solo con la bandera en «si», tal cual, y una llave de 32 bytes',
  async () => {
    for (const bandera of [undefined, 'SI', 'sí', 'si ', ' si', 'Si', 'yes']) {
      assert.equal(
        await llaveDeProduccion(
          entornoDePrueba({ ARCA_PRODUCCION_HABILITADA: bandera, ARCA_PRODUCCION_LLAVE: LLAVE }),
        ),
        null,
        `con ${String(bandera)}`,
      );
    }
    assert.equal(
      await llaveDeProduccion(entornoDePrueba({ ARCA_PRODUCCION_HABILITADA: 'si' })),
      null,
    );
    assert.equal(
      await llaveDeProduccion(
        entornoDePrueba({
          ARCA_PRODUCCION_HABILITADA: 'si',
          ARCA_PRODUCCION_LLAVE: btoa('treinta y un bytes no alcanzan!'),
        }),
      ),
      null,
    );
    assert.equal(
      await llaveDeProduccion(
        entornoDePrueba({
          ARCA_PRODUCCION_HABILITADA: 'si',
          ARCA_PRODUCCION_LLAVE: 'no es base64 ¡',
        }),
      ),
      null,
    );
    assert.notEqual(await llaveDeProduccion(entornoDePrueba(CON_PRODUCCION)), null);
  },
);

Deno.test('traba 1: la llave no se lee sin la bandera', async () => {
  const leidas: string[] = [];
  const entorno: Entorno = {
    get: (nombre) => {
      leidas.push(nombre);
      return nombre === 'ARCA_PRODUCCION_LLAVE' ? LLAVE : undefined;
    },
  };
  assert.equal(await llaveDeProduccion(entorno), null);
  assert.deepEqual(leidas, ['ARCA_PRODUCCION_HABILITADA']);
});

Deno.test(
  'traba 1: con la producción apagada, una fila de producción no llama a nadie',
  async () => {
    for (const extra of PRODUCCION_APAGADA) {
      const { dependencias, base, arca } = await preparar(extra);
      base.certificadosDelTaller = await certificadosDelTaller();
      base.filas.set(
        'c1',
        comprobante({ ambiente: 'produccion', cuit_emisor: CUIT_DE_PRODUCCION }),
      );
      const vuelta = await trabajarLoPendiente(dependencias);
      assert.deepEqual(base.pedidosDePendientes, [['homologacion']]);
      assert.equal(vuelta.tomados, 0);
      assert.equal(arca.llamadas.length, 0);
      assert.equal(await trabajarUno(dependencias, 'c1'), 'soltada');
      assert.equal(arca.llamadas.length, 0);
    }
  },
);

Deno.test('traba 1: con la bandera y sin la llave, tampoco', async () => {
  const { dependencias, base, arca } = await preparar({ ARCA_PRODUCCION_HABILITADA: 'si' });
  base.filas.set('c1', comprobante({ ambiente: 'produccion', cuit_emisor: CUIT_DE_PRODUCCION }));
  assert.equal(await trabajarUno(dependencias, 'c1'), 'soltada');
  assert.equal(arca.llamadas.length, 0);
});

Deno.test(
  'traba 1: con la producción apagada, las rutas del asistente contestan apagada sin hacer nada',
  async () => {
    for (const extra of PRODUCCION_APAGADA) {
      const { dependencias, base, arca } = await preparar(extra);
      base.sesiones.set('sesion', 'u1');
      base.delTaller = taller();
      const manejar = crearManejador(dependencias);
      for (const [ruta, cuerpo] of [
        ['certificado', {}],
        ['certificado/subir', { certificado: PEM_DEL_TALLER }],
        ['conectar', { puntoDeVenta: 3 }],
      ] as const) {
        const respuesta = await manejar(
          new Request(`https://x.invalid/functions/v1/facturar/${ruta}`, {
            method: 'POST',
            headers: { Authorization: 'Bearer sesion' },
            body: JSON.stringify(cuerpo),
          }),
        );
        assert.equal(respuesta.status, 422, ruta);
        assert.deepEqual(await respuesta.json(), { motivo: 'apagada' });
      }
      const estado = await manejar(
        new Request('https://x.invalid/functions/v1/facturar/estado', {
          headers: { Authorization: 'Bearer sesion' },
        }),
      );
      assert.deepEqual(await estado.json(), { conectada: false, prendido: false });
      assert.equal(arca.llamadas.length, 0);
      assert.equal(base.pedidosGuardados.length, 0);
      assert.equal(base.certificadosGuardados.length, 0);
      assert.equal(base.conexiones.length, 0);
    }
  },
);

Deno.test(
  'traba 4: una fila de homologación habla solo con los dos hosts de homologación',
  async () => {
    const { dependencias, base, arca } = await preparar(CON_PRODUCCION);
    base.filas.set('c1', comprobante());
    arca
      .responder('loginCms', respuestas.loginAceptado('t', 'f', '2026-10-04T03:00:00.000-03:00'))
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
      .responder(
        'FECAESolicitar',
        respuestas.caeAprobado({
          numero: 42,
          fecha: '20261003',
          cae: '76398765432109',
          vence: '20261013',
        }),
      );
    assert.equal(await trabajarUno(dependencias, 'c1'), 'autorizada');
    assert.ok(arca.llamadas.length >= 3);
    for (const llamada of arca.llamadas) {
      assert.ok(HOSTS.homologacion.includes(new URL(llamada.url).hostname), llamada.url);
    }
  },
);

Deno.test(
  'traba 4: una URL fuera de la lista del ambiente es un error antes de salir',
  async () => {
    const llamadas: string[] = [];
    const pedir: Pedir = (url) => {
      llamadas.push(url);
      return Promise.resolve(new Response('', { status: 200 }));
    };
    await assert.rejects(
      pedirAArca('homologacion', SERVICIOS.produccion.wsfe, '""', '', pedir),
      FueraDeLaLista,
    );
    await assert.rejects(
      pedirAArca('produccion', SERVICIOS.homologacion.wsaa, '""', '', pedir),
      FueraDeLaLista,
    );
    await assert.rejects(
      pedirAArca('homologacion', 'https://ejemplo.invalid/', '""', '', pedir),
      FueraDeLaLista,
    );
    await assert.rejects(
      pedirAArca(
        'homologacion',
        SERVICIOS.homologacion.wsfe.replace('https:', 'http:'),
        '""',
        '',
        pedir,
      ),
      FueraDeLaLista,
    );
    assert.deepEqual(llamadas, []);
  },
);

// El CUIT y el certificado ----------------------------------------------------------------------------------------

Deno.test(
  'en homologación, Auth lleva el CUIT del certificado de prueba y no el de la fila',
  async () => {
    const { dependencias, base, arca } = await preparar();
    base.filas.set('c1', comprobante());
    base.tomaDelLogin.push(TICKET);
    arca
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
      .responder(
        'FECAESolicitar',
        respuestas.caeAprobado({
          numero: 42,
          fecha: '20261003',
          cae: '76398765432109',
          vence: '20261013',
        }),
      );
    await trabajarUno(dependencias, 'c1');
    const pedido = cuerpoDe(arca, 'FECAESolicitar');
    assert.match(pedido, new RegExp(`<ar:Cuit>${CUIT_DE_LA_PRUEBA}</ar:Cuit>`));
    assert.doesNotMatch(pedido, /20111111112/);
  },
);

Deno.test(
  'en producción, Auth lleva el CUIT de la fila y el CMS va firmado con el certificado activo del taller',
  async () => {
    const { dependencias, base, arca } = await preparar(CON_PRODUCCION);
    base.certificadosDelTaller = await certificadosDelTaller();
    base.filas.set('c1', comprobante({ ambiente: 'produccion', cuit_emisor: CUIT_DE_PRODUCCION }));
    arca
      .responder('loginCms', respuestas.loginAceptado('t', 'f', '2026-10-04T03:00:00.000-03:00'))
      .responder('FECompUltimoAutorizado', respuestas.ultimo(0, 2))
      .responder(
        'FECAESolicitar',
        respuestas.caeAprobado({
          numero: 1,
          fecha: '20261003',
          cae: '76398765432109',
          vence: '20261013',
        }),
      );
    assert.equal(await trabajarUno(dependencias, 'c1'), 'autorizada');
    for (const llamada of arca.llamadas) {
      assert.ok(HOSTS.produccion.includes(new URL(llamada.url).hostname));
    }
    assert.match(cuerpoDe(arca, 'FECAESolicitar'), /<ar:Cuit>20301234563<\/ar:Cuit>/);
    const cms = leerElCms(
      /<wsaa:in0>([^<]+)<\/wsaa:in0>/.exec(cuerpoDe(arca, 'loginCms'))?.[1] ?? '',
    );
    assert.equal(
      cms.certificado,
      forge.pki.certificateToPem(forge.pki.certificateFromPem(PEM_DEL_TALLER)),
    );
    assert.ok(cms.firmaBien);
    assert.deepEqual(base.ticketsGuardados[0]?.certificado, HUELLA_DEL_TALLER);
  },
);

Deno.test(
  'en producción, sin certificado activo la fila no sale y el taller queda sin acceso',
  async () => {
    const { dependencias, base, arca } = await preparar(CON_PRODUCCION);
    base.filas.set('c1', comprobante({ ambiente: 'produccion', cuit_emisor: CUIT_DE_PRODUCCION }));
    assert.equal(await trabajarUno(dependencias, 'c1'), 'sin-certificado');
    assert.equal(arca.llamadas.length, 0);
    assert.deepEqual(base.accesos, [{ ambiente: 'produccion', ok: false, householdId: 'h1' }]);
    assert.equal(base.anotados[0]?.paso.paso, 'soltar');
  },
);

Deno.test(
  'lo anotado no tiene el bloque Auth, ningún Cuit ni el CMS, y del login no se anota la respuesta',
  async () => {
    const { dependencias, base, arca } = await preparar();
    base.filas.set('c1', comprobante());
    arca
      .responder('loginCms', respuestas.loginAceptado('t', 'f', '2026-10-04T03:00:00.000-03:00'))
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
      .responder(
        'FECAESolicitar',
        respuestas.caeAprobado({
          numero: 42,
          fecha: '20261003',
          cae: '76398765432109',
          vence: '20261013',
        }),
      );
    await trabajarUno(dependencias, 'c1');
    const login = base.intercambios.find((intercambio) => intercambio.metodo === 'loginCms');
    assert.ok(login !== undefined);
    assert.equal(login.pedido, null);
    assert.equal(login.respuesta, null);
    for (const intercambio of base.intercambios) {
      const todo = `${intercambio.pedido ?? ''}${intercambio.respuesta ?? ''}${intercambio.error ?? ''}`;
      assert.doesNotMatch(todo, /<(\w+:)?(Auth|Token|Sign|Cuit|in0)[ >/]/i);
      assert.doesNotMatch(todo, new RegExp(CUIT_DE_LA_PRUEBA));
      assert.doesNotMatch(todo, /20111111112/);
    }
    assert.ok(
      base.intercambios.some(
        (intercambio) =>
          intercambio.metodo === 'FECAESolicitar' && intercambio.comprobanteId === 'c1',
      ),
    );
  },
);

// La entrada ------------------------------------------------------------------------------------------------------

Deno.test(
  'sin el secreto, con otro o con uno parecido, el disparo da 401 sin tocar nada',
  async () => {
    const { dependencias, base } = await preparar();
    const manejar = crearManejador(dependencias);
    for (const autorizacion of [
      undefined,
      'Bearer otro',
      `Bearer ${SECRETO}x`,
      `Bearer ${SECRETO.slice(0, -1)}`,
      SECRETO,
    ]) {
      for (const ruta of ['trabajo', 'control']) {
        const respuesta = await manejar(
          new Request(`https://x.invalid/functions/v1/facturar/${ruta}`, {
            method: 'POST',
            headers: autorizacion === undefined ? {} : { Authorization: autorizacion },
          }),
        );
        assert.equal(respuesta.status, 401);
      }
    }
    assert.deepEqual(base.pedidosDePendientes, []);
  },
);

Deno.test('un error inesperado da 500 genérico y el registro no lleva datos', async () => {
  const { dependencias, base } = await preparar();
  base.pendientes = () =>
    Promise.reject(new Error(`falló con ${CUIT_DE_LA_FILA} y el token el-token`));
  const registrado: unknown[][] = [];
  const original = console.error;
  console.error = (...argumentos: unknown[]) => {
    registrado.push(argumentos);
  };
  try {
    const respuesta = await crearManejador(dependencias)(
      new Request('https://x.invalid/functions/v1/facturar/trabajo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${SECRETO}` },
      }),
    );
    assert.equal(respuesta.status, 500);
    assert.deepEqual(await respuesta.json(), { error: 'No se pudo procesar el pedido.' });
  } finally {
    console.error = original;
  }
  assert.deepEqual(registrado, [['la facturación falló', 'Error']]);
});

Deno.test('OPTIONS, una ruta que no existe y un método que no va', async () => {
  const { dependencias } = await preparar();
  const manejar = crearManejador(dependencias);
  const opciones = await manejar(
    new Request('https://x.invalid/functions/v1/facturar/conectar', { method: 'OPTIONS' }),
  );
  assert.equal(opciones.status, 204);
  assert.equal(opciones.headers.get('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');
  assert.equal(
    (await manejar(new Request('https://x.invalid/functions/v1/facturar/otra', { method: 'POST' })))
      .status,
    404,
  );
  assert.equal(
    (
      await manejar(
        new Request('https://x.invalid/functions/v1/facturar/estado', { method: 'POST' }),
      )
    ).status,
    405,
  );
  assert.equal(
    (await manejar(new Request('https://x.invalid/functions/v1/facturar/trabajo'))).status,
    405,
  );
});

Deno.test('con el secreto, el disparo trabaja lo pendiente', async () => {
  const { dependencias, base } = await preparar();
  const respuesta = await crearManejador(dependencias)(
    new Request('https://x.invalid/functions/v1/facturar/trabajo', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRETO}` },
    }),
  );
  assert.equal(respuesta.status, 200);
  assert.deepEqual(base.pedidosDePendientes, [['homologacion']]);
});

Deno.test('las rutas con sesión: 401 sin sesión y 403 si no es el dueño de un taller', async () => {
  const { dependencias, base } = await preparar(CON_PRODUCCION);
  base.sesiones.set('de-un-miembro', 'u2');
  const manejar = crearManejador(dependencias);
  for (const [ruta, metodo] of [
    ['estado', 'GET'],
    ['certificado', 'POST'],
    ['certificado/subir', 'POST'],
    ['conectar', 'POST'],
  ] as const) {
    const sinSesion = await manejar(
      new Request(`https://x.invalid/functions/v1/facturar/${ruta}`, { method: metodo }),
    );
    assert.equal(sinSesion.status, 401, ruta);
    const ajena = await manejar(
      new Request(`https://x.invalid/functions/v1/facturar/${ruta}`, {
        method: metodo,
        headers: { Authorization: 'Bearer de-un-miembro' },
      }),
    );
    assert.equal(ajena.status, 403, ruta);
  }
});

// El certificado ---------------------------------------------------------------------------------------------------

async function pedidoArmado(cuit: string, titular: string) {
  const llave = await llaveDeProduccion(entornoDePrueba(CON_PRODUCCION));
  assert.ok(llave !== null);
  return { llave, ...(await armarElPedido(cuit, titular, llave)) };
}

Deno.test(
  'el pedido del certificado lleva su subject, va firmado con SHA-256 y la clave cifrada se descifra igual',
  async () => {
    const { llave, pedido, claveCifrada, claveIv } = await pedidoArmado(
      CUIT_DE_PRODUCCION,
      'RIVAS MARTIN',
    );
    const leido = forge.pki.certificationRequestFromPem(pedido);
    assert.ok(leido.verify());
    assert.equal(leido.siginfo.algorithmOid, forge.pki.oids.sha256WithRSAEncryption);
    assert.equal(leido.subject.getField('C')?.value, 'AR');
    assert.equal(leido.subject.getField('O')?.value, 'RIVAS MARTIN');
    assert.equal(leido.subject.getField('CN')?.value, 'numa');
    assert.equal(leido.subject.getField({ type: '2.5.4.5' })?.value, 'CUIT 20301234563');
    const clave = forge.pki.privateKeyFromPem(
      await clavePemDescifrada(llave, claveCifrada, claveIv),
    ) as forge.pki.rsa.PrivateKey;
    const publica = leido.publicKey as forge.pki.rsa.PublicKey;
    assert.ok(clave.n.equals(publica.n));
    assert.doesNotMatch(claveCifrada, /PRIVATE KEY/);
    const otro = await armarElPedido(CUIT_DE_PRODUCCION, 'RIVAS MARTIN', llave);
    assert.notEqual(otro.claveIv, claveIv);
  },
);

Deno.test(
  'un titular con eñe y tildes va como UTF8String, y uno largo se recorta a 64',
  async () => {
    const { pedido } = await pedidoArmado(CUIT_DE_PRODUCCION, 'MUÑOZ ÁNGEL Y CÍA');
    const leido = forge.pki.certificationRequestFromPem(pedido);
    const organizacion = leido.subject.getField('O') as { value: string; valueTagClass: number };
    assert.equal(organizacion.valueTagClass, forge.asn1.Type.UTF8);
    assert.equal(forge.util.decodeUtf8(organizacion.value), 'MUÑOZ ÁNGEL Y CÍA');
    assert.ok(leido.verify());

    const largo = await pedidoArmado(CUIT_DE_PRODUCCION, `  ${'Ñ'.repeat(70)}  `);
    const recortado = forge.pki.certificationRequestFromPem(largo.pedido).subject.getField('O') as {
      value: string;
    };
    assert.equal(forge.util.decodeUtf8(recortado.value), 'Ñ'.repeat(64));
    assert.equal(Array.from(titularDelPedido('x'.repeat(80))).length, 64);
  },
);

async function conSesion(
  extra: Record<string, string | undefined>,
  delTaller: FacturacionDelTaller,
): Promise<{
  manejar: (ruta: string, cuerpo?: unknown, metodo?: string) => Promise<Response>;
  base: BaseFalsa;
  arca: ArcaFalsa;
}> {
  const { dependencias, base, arca } = await preparar(extra);
  base.sesiones.set('sesion', 'u1');
  base.delTaller = delTaller;
  const manejar = crearManejador(dependencias);
  return {
    base,
    arca,
    manejar: (ruta, cuerpo, metodo = 'POST') =>
      manejar(
        new Request(`https://x.invalid/functions/v1/facturar/${ruta}`, {
          method: metodo,
          headers: { Authorization: 'Bearer sesion' },
          ...(metodo === 'GET' ? {} : { body: JSON.stringify(cuerpo ?? {}) }),
        }),
      ),
  };
}

Deno.test(
  'pedir el certificado: guarda el pedido con la clave cifrada y devuelve solo el pedido',
  async () => {
    const { manejar, base } = await conSesion(CON_PRODUCCION, taller());
    const respuesta = await manejar('certificado');
    assert.equal(respuesta.status, 200);
    const cuerpo = (await respuesta.json()) as Record<string, unknown>;
    assert.deepEqual(Object.keys(cuerpo), ['pedido']);
    assert.match(String(cuerpo.pedido), /BEGIN CERTIFICATE REQUEST/);
    assert.equal(base.pedidosGuardados.length, 1);
    assert.equal(base.pedidosGuardados[0]?.[1], CUIT_DE_PRODUCCION);
    assert.doesNotMatch(JSON.stringify(cuerpo), /PRIVATE KEY|claveCifrada/);
  },
);

Deno.test('al renovar, el pedido sale con el CUIT de la conexión', async () => {
  const { manejar, base } = await conSesion(
    CON_PRODUCCION,
    taller({
      ambiente: 'produccion',
      cuit: CUIT_DE_LA_RENOVACION,
      puntoDeVenta: 3,
      tallerCuit: '',
    }),
  );
  const respuesta = await manejar('certificado');
  assert.equal(respuesta.status, 200);
  assert.equal(base.pedidosGuardados[0]?.[1], CUIT_DE_LA_RENOVACION);
  const pedido = forge.pki.certificationRequestFromPem(
    String(((await respuesta.json()) as { pedido: string }).pedido),
  );
  assert.equal(pedido.subject.getField({ type: '2.5.4.5' })?.value, 'CUIT 27301234568');
});

Deno.test('pedir el certificado: cada motivo de 422', async () => {
  for (const [delTaller, motivo] of [
    [taller({ ambiente: 'homologacion', cuit: CUIT_DE_LA_FILA, puntoDeVenta: 2 }), 'en-prueba'],
    [taller({ tallerCondicionFiscal: 'responsable_inscripto' }), 'no-monotributo'],
    [taller({ tallerCuit: '' }), 'taller-sin-cuit'],
    [taller({ tallerCuit: '20-30123456-4' }), 'taller-sin-cuit'],
    [taller({ tallerTitular: '  ' }), 'taller-sin-razon-social'],
  ] as const) {
    const { manejar, base } = await conSesion(CON_PRODUCCION, delTaller);
    const respuesta = await manejar('certificado');
    assert.equal(respuesta.status, 422);
    assert.deepEqual(await respuesta.json(), { motivo });
    assert.equal(base.pedidosGuardados.length, 0);
  }
});

async function conPedidoPendiente(cuit = CUIT_DE_PRODUCCION) {
  const armado = await pedidoArmado(cuit, 'RIVAS MARTIN');
  return {
    armado,
    pendiente: {
      id: 'cert-pendiente',
      estado: 'pedido' as const,
      cuit,
      pedido: armado.pedido,
      certificado: null,
      huella: null,
      vence: null,
      claveCifrada: armado.claveCifrada,
      claveIv: armado.claveIv,
    },
  };
}

Deno.test(
  'subir el certificado: controla que sea de este pedido, del mismo CUIT y que no esté vencido',
  async () => {
    const { armado, pendiente } = await conPedidoPendiente();
    const publica = forge.pki.certificationRequestFromPem(armado.pedido)
      .publicKey as forge.pki.PublicKey;
    const casos: [string, unknown, number, unknown][] = [
      ['no es un texto', 42, 422, { motivo: 'no-es-un-certificado' }],
      ['no es un certificado', 'hola', 422, { motivo: 'no-es-un-certificado' }],
      ['es el pedido', armado.pedido, 422, { motivo: 'no-es-un-certificado' }],
      [
        'de más de 20 KB',
        `${certificadoPara(publica, PAR_AJENO.clave, '20301234563')}${' '.repeat(20 * 1024)}`,
        422,
        { motivo: 'no-es-un-certificado' },
      ],
      [
        'de otra clave',
        certificadoPara(PAR_AJENO.publica, PAR_AJENO.clave, '20301234563'),
        422,
        { motivo: 'no-es-de-este-pedido' },
      ],
      [
        'de otro CUIT',
        certificadoPara(publica, PAR_AJENO.clave, CUIT_AJENO),
        422,
        { motivo: 'otro-cuit' },
      ],
      [
        'vencido',
        certificadoPara(publica, PAR_AJENO.clave, '20301234563', new Date('2026-10-01T00:00:00Z')),
        422,
        { motivo: 'vencido' },
      ],
    ];
    for (const [que, certificado, estado, cuerpo] of casos) {
      const { manejar, base } = await conSesion(CON_PRODUCCION, taller());
      base.certificadosDelTaller = { activo: null, pendiente };
      const respuesta = await manejar('certificado/subir', { certificado });
      assert.equal(respuesta.status, estado, que);
      assert.deepEqual(await respuesta.json(), cuerpo, que);
      assert.equal(base.certificadosGuardados.length, 0, que);
    }

    const bueno = certificadoPara(publica, PAR_AJENO.clave, '20301234563');
    const sinPedido = await conSesion(CON_PRODUCCION, taller());
    const sinPedidoRespuesta = await sinPedido.manejar('certificado/subir', {
      certificado: certificadoPara(publica, PAR_AJENO.clave, '20301234563'),
    });
    assert.deepEqual(await sinPedidoRespuesta.json(), { motivo: 'no-es-de-este-pedido' });

    const { manejar, base, arca } = await conSesion(CON_PRODUCCION, taller());
    base.certificadosDelTaller = { activo: null, pendiente };
    base.delTaller = taller({
      certificados: {
        activo: null,
        pendiente: {
          id: 'cert-pendiente',
          estado: 'subido',
          cuit: CUIT_DE_PRODUCCION,
          vence: '2028-10-02',
        },
      },
    });
    const respuesta = await manejar('certificado/subir', { certificado: bueno });
    assert.equal(respuesta.status, 200);
    assert.deepEqual(await respuesta.json(), {
      conectada: false,
      prendido: true,
      certificado: { estado: 'subido', vence: '2028-10-02' },
    });
    assert.equal(base.certificadosGuardados[0]?.[0], 'cert-pendiente');
    assert.match(String(base.certificadosGuardados[0]?.[2]), /^[0-9a-f]{64}$/);
    assert.equal(base.certificadosGuardados[0]?.[3], '2028-10-02');
    assert.equal(arca.llamadas.length, 0);
  },
);

Deno.test('subir el certificado acepta el DER en base64', async () => {
  const { armado, pendiente } = await conPedidoPendiente();
  const publica = forge.pki.certificationRequestFromPem(armado.pedido)
    .publicKey as forge.pki.PublicKey;
  const pem = certificadoPara(publica, PAR_AJENO.clave, '20301234563');
  const der = forge.util.encode64(
    forge.asn1.toDer(forge.pki.certificateToAsn1(forge.pki.certificateFromPem(pem))).getBytes(),
  );
  const { manejar, base } = await conSesion(CON_PRODUCCION, taller());
  base.certificadosDelTaller = { activo: null, pendiente };
  assert.equal((await manejar('certificado/subir', { certificado: der })).status, 200);
});

// La conexión ------------------------------------------------------------------------------------------------------

async function conCertificadoSubido(delTaller = taller()) {
  const contexto = await conSesion(CON_PRODUCCION, delTaller);
  contexto.base.certificadosDelTaller = {
    activo: null,
    pendiente: {
      id: 'cert-subido',
      estado: 'subido',
      cuit: CUIT_DE_PRODUCCION,
      certificado: PEM_DEL_TALLER,
      huella: HUELLA_DEL_TALLER,
      vence: '2028-10-02',
      ...(await cifrada(PAR_DEL_TALLER)),
    },
  };
  contexto.base.delTaller = delTaller;
  return contexto;
}

Deno.test(
  'conectar: entra con el certificado subido, encuentra el punto de venta y llama a facturacion_conectar',
  async () => {
    const { manejar, base, arca } = await conCertificadoSubido();
    arca
      .responder('loginCms', respuestas.loginAceptado('t', 'f', '2026-10-04T03:00:00.000-03:00'))
      .responder(
        'FEParamGetPtosVenta',
        respuestas.puntosDeVenta([
          { numero: 1, emisionTipo: 'CAE' },
          { numero: 3, emisionTipo: 'CAE - Factura Electrónica' },
        ]),
      )
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 3));
    const respuesta = await manejar('conectar', { puntoDeVenta: 3 });
    assert.equal(respuesta.status, 200);
    assert.deepEqual(base.conexiones, [['h1', 'cert-subido', 3]]);
    assert.deepEqual(arca.metodos(), ['loginCms', 'FEParamGetPtosVenta', 'FECompUltimoAutorizado']);
    for (const llamada of arca.llamadas)
      assert.ok(HOSTS.produccion.includes(new URL(llamada.url).hostname));
    assert.ok(
      base.accesos.some(
        (acceso) => acceso.ambiente === 'produccion' && acceso.ok && acceso.householdId === 'h1',
      ),
    );
    const cuerpo = (await respuesta.json()) as Record<string, unknown>;
    assert.equal(cuerpo.ultimoNumero, 41);
    assert.doesNotMatch(JSON.stringify(cuerpo), /20-30123456-3|20301234563/);
  },
);

Deno.test('conectar: cada motivo de 422, sin conectar nada', async () => {
  const casos: [
    string,
    (arca: ArcaFalsa, base: BaseFalsa) => void,
    unknown,
    FacturacionDelTaller?,
  ][] = [
    [
      'login-rechazado',
      (arca) => arca.responder('loginCms', respuestas.NO_AUTORIZADO),
      { motivo: 'login-rechazado' },
    ],
    [
      'esperando',
      (arca, base) => {
        arca.responder('loginCms', respuestas.YA_TIENE_TICKET);
        base.tomaDelLogin.push({ pedir: true }, { esperar: '2026-10-03T15:12:00.000Z' });
      },
      { motivo: 'esperando', esperarHasta: '2026-10-03T15:12:00.000Z' },
    ],
    [
      'sin punto de venta',
      (arca) =>
        arca
          .responder(
            'loginCms',
            respuestas.loginAceptado('t', 'f', '2026-10-04T03:00:00.000-03:00'),
          )
          .responder(
            'FEParamGetPtosVenta',
            respuestas.puntosDeVenta([{ numero: 1, emisionTipo: 'CAE' }]),
          ),
      { motivo: 'sin-punto-de-venta' },
    ],
    [
      'bloqueado',
      (arca) =>
        arca
          .responder(
            'loginCms',
            respuestas.loginAceptado('t', 'f', '2026-10-04T03:00:00.000-03:00'),
          )
          .responder(
            'FEParamGetPtosVenta',
            respuestas.puntosDeVenta([{ numero: 3, emisionTipo: 'CAE', bloqueado: 'S' }]),
          ),
      { motivo: 'sin-punto-de-venta' },
    ],
    [
      'de baja',
      (arca) =>
        arca
          .responder(
            'loginCms',
            respuestas.loginAceptado('t', 'f', '2026-10-04T03:00:00.000-03:00'),
          )
          .responder(
            'FEParamGetPtosVenta',
            respuestas.puntosDeVenta([{ numero: 3, emisionTipo: 'CAE', baja: '20260901' }]),
          ),
      { motivo: 'sin-punto-de-venta' },
    ],
    [
      'de otro sistema',
      (arca) =>
        arca
          .responder(
            'loginCms',
            respuestas.loginAceptado('t', 'f', '2026-10-04T03:00:00.000-03:00'),
          )
          .responder(
            'FEParamGetPtosVenta',
            respuestas.puntosDeVenta([{ numero: 3, emisionTipo: 'CAEA' }]),
          ),
      { motivo: 'sin-punto-de-venta' },
    ],
    [
      'arca-no-contesta',
      (arca) => arca.responder('loginCms', new TypeError('sin red')),
      { motivo: 'arca-no-contesta' },
    ],
  ];
  for (const [que, preparacion, esperado] of casos) {
    const { manejar, base, arca } = await conCertificadoSubido();
    preparacion(arca, base);
    const respuesta = await manejar('conectar', { puntoDeVenta: 3 });
    assert.equal(respuesta.status, 422, que);
    assert.deepEqual(await respuesta.json(), esperado, que);
    assert.deepEqual(base.conexiones, [], que);
  }

  for (const [hint, motivo] of [
    ['punto-de-venta-de-otro-taller', 'punto-de-venta-de-otro-taller'],
    ['comprobantes-en-vuelo', 'comprobantes-en-vuelo'],
    ['otro-cuit', 'otro-cuit'],
  ] as const) {
    const { manejar, base, arca } = await conCertificadoSubido();
    arca
      .responder('loginCms', respuestas.loginAceptado('t', 'f', '2026-10-04T03:00:00.000-03:00'))
      .responder(
        'FEParamGetPtosVenta',
        respuestas.puntosDeVenta([{ numero: 3, emisionTipo: 'CAE' }]),
      )
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 3));
    base.fallaAlConectar = new ErrorDeLaBase('22023', hint, 'facturacion_conectar');
    const respuesta = await manejar('conectar', { puntoDeVenta: 3 });
    assert.deepEqual(await respuesta.json(), { motivo }, hint);
  }

  const sinCertificado = await conSesion(CON_PRODUCCION, taller());
  const respuesta = await sinCertificado.manejar('conectar', { puntoDeVenta: 3 });
  assert.deepEqual(await respuesta.json(), { motivo: 'sin-certificado' });
  assert.equal(sinCertificado.arca.llamadas.length, 0);

  const enPrueba = await conSesion(
    CON_PRODUCCION,
    taller({ ambiente: 'homologacion', cuit: CUIT_DE_LA_FILA, puntoDeVenta: 2 }),
  );
  assert.deepEqual(await (await enPrueba.manejar('conectar', { puntoDeVenta: 3 })).json(), {
    motivo: 'en-prueba',
  });
});

Deno.test(
  'al renovar, el punto de venta tiene que ser el mismo y cambia solo el certificado',
  async () => {
    const conectado = taller({
      ambiente: 'produccion',
      cuit: CUIT_DE_PRODUCCION,
      puntoDeVenta: 3,
      desde: '2026-09-01',
    });
    const otro = await conCertificadoSubido(conectado);
    const distinto = await otro.manejar('conectar', { puntoDeVenta: 4 });
    assert.deepEqual(await distinto.json(), { motivo: 'otro-punto-de-venta' });
    assert.equal(otro.arca.llamadas.length, 0);

    const renovar = await conCertificadoSubido(conectado);
    renovar.arca
      .responder('loginCms', respuestas.loginAceptado('t', 'f', '2026-10-04T03:00:00.000-03:00'))
      .responder(
        'FEParamGetPtosVenta',
        respuestas.puntosDeVenta([{ numero: 3, emisionTipo: 'CAE' }]),
      )
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 3));
    assert.equal((await renovar.manejar('conectar', { puntoDeVenta: 3 })).status, 200);
    assert.deepEqual(renovar.base.conexiones, [['h1', 'cert-subido', 3]]);
  },
);

Deno.test('después de desconectar, vuelve a conectar con su certificado activo', async () => {
  const { manejar, base, arca } = await conSesion(CON_PRODUCCION, taller());
  base.certificadosDelTaller = await certificadosDelTaller();
  arca
    .responder('loginCms', respuestas.loginAceptado('t', 'f', '2026-10-04T03:00:00.000-03:00'))
    .responder('FEParamGetPtosVenta', respuestas.puntosDeVenta([{ numero: 3, emisionTipo: 'CAE' }]))
    .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 3));
  assert.equal((await manejar('conectar', { puntoDeVenta: 3 })).status, 200);
  assert.deepEqual(base.conexiones, [['h1', 'cert-activo', 3]]);
});

Deno.test('el estado, según la conexión y el certificado', async () => {
  const sinNada = await conSesion(CON_PRODUCCION, taller());
  assert.deepEqual(await (await sinNada.manejar('estado', undefined, 'GET')).json(), {
    conectada: false,
    prendido: true,
    certificado: null,
  });

  const conPedido = await conSesion(
    CON_PRODUCCION,
    taller({
      certificados: {
        activo: null,
        pendiente: { id: 'p', estado: 'pedido', cuit: CUIT_DE_PRODUCCION, vence: null },
      },
    }),
  );
  assert.deepEqual(await (await conPedido.manejar('estado', undefined, 'GET')).json(), {
    conectada: false,
    prendido: true,
    certificado: { estado: 'pedido', vence: null },
  });

  const desconectado = await conSesion(
    CON_PRODUCCION,
    taller({
      certificados: {
        activo: { id: 'a', estado: 'activo', cuit: CUIT_DE_PRODUCCION, vence: '2028-10-02' },
        pendiente: null,
      },
    }),
  );
  assert.deepEqual(await (await desconectado.manejar('estado', undefined, 'GET')).json(), {
    conectada: false,
    prendido: true,
    certificado: { estado: 'activo', vence: '2028-10-02' },
  });
  assert.equal(desconectado.arca.llamadas.length, 0);

  const enProduccion = await conSesion(
    CON_PRODUCCION,
    taller({
      ambiente: 'produccion',
      cuit: CUIT_DE_PRODUCCION,
      puntoDeVenta: 3,
      desde: '2026-09-01',
      certificados: {
        activo: {
          id: 'cert-activo',
          estado: 'activo',
          cuit: CUIT_DE_PRODUCCION,
          vence: '2028-10-02',
        },
        pendiente: {
          id: 'cert-nuevo',
          estado: 'subido',
          cuit: CUIT_DE_PRODUCCION,
          vence: '2030-10-02',
        },
      },
    }),
  );
  enProduccion.base.certificadosDelTaller = await certificadosDelTaller();
  enProduccion.base.tomaDelLogin.push(TICKET);
  enProduccion.arca
    .responder('FEDummy', respuestas.dummy())
    .responder('FECompUltimoAutorizado', respuestas.ultimo(7, 3));
  assert.deepEqual(await (await enProduccion.manejar('estado', undefined, 'GET')).json(), {
    conectada: true,
    ambiente: 'produccion',
    prendido: true,
    servidor: 'ok',
    login: 'ok',
    esperarHasta: null,
    ultimoNumero: 7,
    certificadoVence: '2028-10-02',
    certificado: { estado: 'subido', vence: '2030-10-02' },
  });
  for (const llamada of enProduccion.arca.llamadas)
    assert.ok(HOSTS.produccion.includes(new URL(llamada.url).hostname));
  assert.match(
    cuerpoDe(enProduccion.arca, 'FECompUltimoAutorizado'),
    /<ar:Cuit>20301234563<\/ar:Cuit><\/ar:Auth><ar:PtoVta>3<\/ar:PtoVta>/,
  );

  const apagado = await conSesion(
    {},
    taller({ ambiente: 'produccion', cuit: CUIT_DE_PRODUCCION, puntoDeVenta: 3 }),
  );
  assert.deepEqual(await (await apagado.manejar('estado', undefined, 'GET')).json(), {
    conectada: true,
    ambiente: 'produccion',
    prendido: false,
  });
  assert.equal(apagado.arca.llamadas.length, 0);

  const caido = await conSesion(
    {},
    taller({ ambiente: 'homologacion', cuit: CUIT_DE_LA_FILA, puntoDeVenta: 2 }),
  );
  caido.base.tomaDelLogin.push(TICKET);
  caido.arca
    .responder('FEDummy', respuestas.dummy('NO'))
    .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2));
  assert.equal(
    ((await (await caido.manejar('estado', undefined, 'GET')).json()) as Record<string, unknown>)
      .servidor,
    'caido',
  );

  const enPrueba = await conSesion(
    {},
    taller({ ambiente: 'homologacion', cuit: CUIT_DE_LA_FILA, puntoDeVenta: 2 }),
  );
  enPrueba.base.tomaDelLogin.push(TICKET);
  enPrueba.arca
    .responder('FEDummy', respuestas.dummy())
    .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2));
  const estado = (await (await enPrueba.manejar('estado', undefined, 'GET')).json()) as Record<
    string,
    unknown
  >;
  assert.equal(estado.conectada, true);
  assert.equal(estado.ambiente, 'homologacion');
  assert.equal(estado.servidor, 'ok');
  assert.equal(estado.login, 'ok');
  assert.equal(estado.ultimoNumero, 41);
  assert.equal(estado.certificadoVence, '2028-10-02');
  assert.doesNotMatch(JSON.stringify(estado), /20-11111111-2|20111111112|23000000005/);

  const esperando = await conSesion(
    {},
    taller({ ambiente: 'homologacion', cuit: CUIT_DE_LA_FILA, puntoDeVenta: 2 }),
  );
  esperando.base.tomaDelLogin.push({ esperar: '2026-10-03T15:42:00.000Z' });
  esperando.arca.responder('FEDummy', respuestas.dummy());
  const espera = (await (await esperando.manejar('estado', undefined, 'GET')).json()) as Record<
    string,
    unknown
  >;
  assert.equal(espera.login, 'esperando');
  assert.equal(espera.esperarHasta, '2026-10-03T15:42:00.000Z');

  const rechazado = await conSesion(
    {},
    taller({ ambiente: 'homologacion', cuit: CUIT_DE_LA_FILA, puntoDeVenta: 2 }),
  );
  rechazado.arca
    .responder('FEDummy', respuestas.dummy())
    .responder('loginCms', respuestas.NO_AUTORIZADO);
  assert.equal(
    (
      (await (await rechazado.manejar('estado', undefined, 'GET')).json()) as Record<
        string,
        unknown
      >
    ).login,
    'rechazado',
  );
});

// El login ---------------------------------------------------------------------------------------------------------

Deno.test(
  'el TRA: el servicio, el uniqueId y las fechas en la hora de la Argentina, diez minutos para cada lado',
  () => {
    const tra = pedidoDeLogin(AHORA);
    assert.match(tra, /<service>wsfe<\/service>/);
    assert.match(
      tra,
      new RegExp(`<uniqueId>${String(Math.floor(AHORA.getTime() / 1000))}</uniqueId>`),
    );
    assert.match(tra, /<generationTime>2026-10-03T11:50:00-03:00<\/generationTime>/);
    assert.match(tra, /<expirationTime>2026-10-03T12:10:00-03:00<\/expirationTime>/);
  },
);

Deno.test('el CMS lleva el TRA adentro, el certificado y SHA-256', async () => {
  const { dependencias, base, arca } = await preparar();
  base.filas.set('c1', comprobante());
  arca.responder('loginCms', respuestas.NO_AUTORIZADO);
  await trabajarUno(dependencias, 'c1');
  const cms = leerElCms(
    /<wsaa:in0>([^<]+)<\/wsaa:in0>/.exec(cuerpoDe(arca, 'loginCms'))?.[1] ?? '',
  );
  assert.equal(cms.contenido, pedidoDeLogin(AHORA));
  assert.equal(
    cms.certificado,
    forge.pki.certificateToPem(forge.pki.certificateFromPem(PEM_DE_LA_PRUEBA)),
  );
  assert.equal(cms.algoritmoDelDigesto, forge.pki.oids.sha256);
  assert.ok(cms.digestoBien);
  assert.ok(cms.firmaBien);
  assert.deepEqual(cms.atributos, [
    forge.pki.oids.contentType,
    forge.pki.oids.messageDigest,
    forge.pki.oids.signingTime,
  ]);
});

Deno.test('el ticket guardado se reusa, y con otro login en curso se espera', async () => {
  const conTicket = await preparar();
  conTicket.base.filas.set('c1', comprobante());
  conTicket.base.tomaDelLogin.push(TICKET);
  conTicket.arca
    .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
    .responder(
      'FECAESolicitar',
      respuestas.caeAprobado({
        numero: 42,
        fecha: '20261003',
        cae: '76398765432109',
        vence: '20261013',
      }),
    );
  await trabajarUno(conTicket.dependencias, 'c1');
  assert.ok(!conTicket.arca.metodos().includes('loginCms'));

  const esperando = await preparar();
  esperando.base.filas.set('c1', comprobante());
  esperando.base.tomaDelLogin.push({ esperar: '2026-10-03T15:01:00.000Z' });
  assert.equal(await trabajarUno(esperando.dependencias, 'c1'), 'soltada');
  assert.equal(esperando.arca.llamadas.length, 0);
});

Deno.test(
  '«ya posee un TA valido» deja el bloqueo con la ventana del manual más un minuto',
  async () => {
    const { dependencias, base, arca } = await preparar();
    base.filas.set('c1', comprobante());
    arca.responder('loginCms', { estado: 500, texto: respuestas.YA_TIENE_TICKET });
    assert.equal(await trabajarUno(dependencias, 'c1'), 'soltada');
    assert.deepEqual(base.ticketsGuardados, [
      {
        certificado: 'homologacion',
        ticket: { bloqueadoHasta: new Date(AHORA.getTime() + 11 * 60_000).toISOString() },
      },
    ]);
  },
);

Deno.test(
  'otro rechazo del WSAA pone sin-acceso: en homologación en todos, y el login que anda la saca',
  async () => {
    const { dependencias, base, arca } = await preparar();
    base.filas.set('c1', comprobante());
    arca.responder('loginCms', respuestas.NO_AUTORIZADO);
    await trabajarUno(dependencias, 'c1');
    assert.deepEqual(base.accesos, [{ ambiente: 'homologacion', ok: false, householdId: null }]);
    assert.deepEqual(base.ticketsGuardados, [
      { certificado: 'homologacion', ticket: { soltar: true } },
    ]);

    base.filas.set('c1', comprobante());
    arca
      .responder('loginCms', respuestas.loginAceptado('t', 'f', '2026-10-04T03:00:00.000-03:00'))
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
      .responder(
        'FECAESolicitar',
        respuestas.caeAprobado({
          numero: 42,
          fecha: '20261003',
          cae: '76398765432109',
          vence: '20261013',
        }),
      );
    await trabajarUno(dependencias, 'c1');
    assert.deepEqual(base.accesos.at(-1), {
      ambiente: 'homologacion',
      ok: true,
      householdId: null,
    });
  },
);

Deno.test(
  'en producción, el rechazo del login pone sin-acceso solo en el taller del certificado',
  async () => {
    const { dependencias, base, arca } = await preparar(CON_PRODUCCION);
    base.certificadosDelTaller = await certificadosDelTaller();
    base.filas.set('c1', comprobante({ ambiente: 'produccion', cuit_emisor: CUIT_DE_PRODUCCION }));
    arca.responder('loginCms', respuestas.NO_AUTORIZADO);
    await trabajarUno(dependencias, 'c1');
    assert.deepEqual(base.accesos, [{ ambiente: 'produccion', ok: false, householdId: 'h1' }]);
  },
);

Deno.test(
  'el 600 y el 601 borran el ticket; el 601 con un ticket recién sacado pone sin-acceso en ese taller',
  async () => {
    const guardado = await preparar();
    guardado.base.filas.set('c1', comprobante());
    guardado.base.tomaDelLogin.push(TICKET);
    guardado.arca.responder(
      'FECompUltimoAutorizado',
      respuestas.ultimoConErrores([
        { codigo: 600, mensaje: 'ValidacionDeToken: No validaron las fechas del token' },
      ]),
    );
    assert.equal(await trabajarUno(guardado.dependencias, 'c1'), 'soltada');
    assert.deepEqual(guardado.base.ticketsGuardados, [
      { certificado: 'homologacion', ticket: { borrar: true } },
    ]);

    const nuevo = await preparar();
    nuevo.base.filas.set('c1', comprobante());
    nuevo.arca
      .responder('loginCms', respuestas.loginAceptado('t', 'f', '2026-10-04T03:00:00.000-03:00'))
      .responder(
        'FECompUltimoAutorizado',
        respuestas.ultimoConErrores([
          { codigo: 601, mensaje: 'CUIT representada no incluida en Token' },
        ]),
      );
    await trabajarUno(nuevo.dependencias, 'c1');
    assert.deepEqual(nuevo.base.accesos.at(-1), {
      ambiente: 'homologacion',
      ok: false,
      householdId: 'h1',
    });
    assert.ok(
      !nuevo.base.ticketsGuardados.some((guardadoAhora) => 'borrar' in guardadoAhora.ticket),
    );
  },
);

// La emisión -------------------------------------------------------------------------------------------------------

async function emitir(fila: Comprobante, preparacion: (arca: ArcaFalsa, base: BaseFalsa) => void) {
  const contexto = await preparar();
  contexto.base.filas.set(fila.id, fila);
  contexto.base.tomaDelLogin.push(TICKET);
  preparacion(contexto.arca, contexto.base);
  const desenlace = await trabajarUno(contexto.dependencias, fila.id);
  return { ...contexto, desenlace, pasos: contexto.base.anotados.map((anotado) => anotado.paso) };
}

const APROBADA = respuestas.caeAprobado({
  numero: 42,
  fecha: '20261003',
  cae: '76398765432109',
  vence: '20261013',
});

Deno.test(
  'una pedida: el último más uno, reservado con la fecha de hoy y la toma extendida, y autorizada con su CAE',
  async () => {
    const { desenlace, pasos, base, arca } = await emitir(comprobante(), (arca) =>
      arca
        .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
        .responder('FECAESolicitar', APROBADA),
    );
    assert.equal(desenlace, 'autorizada');
    assert.deepEqual(pasos, [
      { paso: 'reservar', intento: 1, numero: 42, fecha: HOY, segundos: 120 },
      { paso: 'autorizada', intento: 1, cae: '76398765432109', caeVence: '2026-10-13', fecha: HOY },
    ]);
    assert.equal(base.segundosDeLaReserva, 120);
    assert.match(
      cuerpoDe(arca, 'FECAESolicitar'),
      /<ar:CbteDesde>42<\/ar:CbteDesde>.*<ar:CbteFch>20261003<\/ar:CbteFch>/,
    );
  },
);

Deno.test('aprobada con observaciones, vale', async () => {
  const { desenlace } = await emitir(comprobante(), (arca) =>
    arca
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
      .responder(
        'FECAESolicitar',
        respuestas.caeAprobado(
          { numero: 42, fecha: '20261003', cae: '76398765432109', vence: '20261013' },
          [{ codigo: 10217, mensaje: 'Observación de prueba' }],
        ),
      ),
  );
  assert.equal(desenlace, 'autorizada');
});

Deno.test('con 10016 en una que entró pedida, vuelve a pedida sin número', async () => {
  const { pasos } = await emitir(comprobante(), (arca) =>
    arca
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
      .responder(
        'FECAESolicitar',
        respuestas.caeRechazado({ numero: 42, fecha: '20261003' }, [
          { codigo: 10016, mensaje: 'El numero no es el proximo' },
        ]),
      ),
  );
  assert.equal(pasos.at(-1)?.paso, 'pedida');
});

Deno.test('rechazada con otro código, con lo que contestó ARCA', async () => {
  const { pasos } = await emitir(comprobante(), (arca) =>
    arca
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
      .responder(
        'FECAESolicitar',
        respuestas.caeRechazado({ numero: 42, fecha: '20261003' }, [
          { codigo: 10015, mensaje: 'El documento no es valido' },
        ]),
      ),
  );
  assert.deepEqual(pasos.at(-1), {
    paso: 'rechazada',
    intento: 1,
    rechazo: {
      errores: [],
      observaciones: [{ codigo: 10015, mensaje: 'El documento no es valido' }],
    },
  });
});

Deno.test(
  'rechazada con los códigos de la condición frente al IVA, del documento o cualquier otro',
  async () => {
    for (const codigo of [10242, 10243, 10246, 10015, 10013, 10048]) {
      const { pasos, desenlace } = await emitir(comprobante(), (arca) =>
        arca
          .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
          .responder(
            'FECAESolicitar',
            respuestas.caeRechazado({ numero: 42, fecha: '20261003' }, [{ codigo, mensaje: 'x' }]),
          ),
      );
      assert.equal(desenlace, 'rechazada', String(codigo));
      assert.deepEqual(pasos.at(-1), {
        paso: 'rechazada',
        intento: 1,
        rechazo: { errores: [], observaciones: [{ codigo, mensaje: 'x' }] },
      });
    }
  },
);

Deno.test('con el tiempo agotado, se suelta igual que sin respuesta', async () => {
  const { pasos } = await emitir(comprobante(), (arca) =>
    arca
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
      .responder('FECAESolicitar', new DOMException('Signal timed out.', 'TimeoutError')),
  );
  assert.deepEqual(
    pasos.map((paso) => paso.paso),
    ['reservar', 'soltar'],
  );
  assert.match((pasos.at(-1) as { error?: string } | undefined)?.error ?? '', /TimeoutError/);
});

Deno.test(
  'sin respuesta de ARCA, se suelta: queda emitiendo con su número para la vuelta siguiente',
  async () => {
    const { pasos } = await emitir(comprobante(), (arca) =>
      arca
        .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
        .responder('FECAESolicitar', new TypeError('corte')),
    );
    assert.deepEqual(
      pasos.map((paso) => paso.paso),
      ['reservar', 'soltar'],
    );
  },
);

Deno.test(
  'un 5xx sin respuesta de ARCA también se suelta, y un error de ARCA sin resultado',
  async () => {
    const caida = await emitir(comprobante(), (arca) =>
      arca
        .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
        .responder('FECAESolicitar', { estado: 503, texto: 'Service Unavailable' }),
    );
    assert.equal(caida.pasos.at(-1)?.paso, 'soltar');
    const sinResultado = await emitir(comprobante(), (arca) =>
      arca
        .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
        .responder(
          'FECAESolicitar',
          respuestas.caeSinResultado([{ codigo: 500, mensaje: 'Error interno' }]),
        ),
    );
    assert.equal(sinResultado.pasos.at(-1)?.paso, 'soltar');
  },
);

Deno.test('con menos de 45 segundos de toma, no se pide el CAE', async () => {
  const justo = await emitir(comprobante(), (arca, base) => {
    arca
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
      .responder('FECAESolicitar', APROBADA);
    base.segundosQueQuedanDeLaToma = 45;
  });
  assert.equal(justo.desenlace, 'autorizada');

  const poco = await emitir(comprobante(), (arca, base) => {
    arca.responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2));
    base.segundosQueQuedanDeLaToma = 44;
  });
  assert.ok(!poco.arca.metodos().includes('FECAESolicitar'));
  assert.deepEqual(
    poco.pasos.map((paso) => paso.paso),
    ['reservar', 'soltar'],
  );
});

Deno.test('si la reserva choca, no se pide nada más', async () => {
  const { desenlace, arca } = await emitir(comprobante(), (arca, base) => {
    arca.responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2));
    base.reservaHecha = false;
  });
  assert.equal(desenlace, 'ocupada');
  assert.ok(!arca.metodos().includes('FECAESolicitar'));
});

Deno.test('dos vueltas sobre la misma fila: la segunda no hace nada', async () => {
  const { dependencias, arca } = await emitir(comprobante(), (arca) =>
    arca
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
      .responder('FECAESolicitar', APROBADA),
  );
  const antes = arca.llamadas.length;
  assert.equal(await trabajarUno(dependencias, 'c1'), 'ocupada');
  assert.equal(arca.llamadas.length, antes);
});

const EMITIENDO = comprobante({ estado: 'emitiendo', numero: 42, fecha: '2026-10-02' });

const CONSULTADA = {
  tipo: 11,
  puntoDeVenta: 2,
  numero: 42,
  fecha: '20261002',
  importe: '450000.00',
  docTipo: 99,
  docNro: '0',
  cae: '76398765432109',
  vence: '20261012',
};

Deno.test(
  'una emitiendo se consulta antes de pedir: si ARCA la tiene y coincide, autorizada con lo que dice ARCA',
  async () => {
    const { pasos, arca } = await emitir(EMITIENDO, (arca) =>
      arca.responder('FECompConsultar', respuestas.consultaEncontrada(CONSULTADA)),
    );
    assert.deepEqual(pasos, [
      {
        paso: 'autorizada',
        intento: 1,
        cae: '76398765432109',
        caeVence: '2026-10-12',
        fecha: '2026-10-02',
      },
    ]);
    assert.deepEqual(arca.metodos(), ['FECompConsultar']);
  },
);

Deno.test('si ARCA la tiene con otros datos, a revisar', async () => {
  const { pasos } = await emitir(EMITIENDO, (arca) =>
    arca.responder(
      'FECompConsultar',
      respuestas.consultaEncontrada({ ...CONSULTADA, importe: '450001.00' }),
    ),
  );
  assert.equal(pasos[0]?.paso, 'a_revisar');
});

Deno.test(
  'si ARCA no la tiene y el último es el anterior, se vuelve a reservar y se pide otra vez',
  async () => {
    const { pasos } = await emitir(EMITIENDO, (arca) =>
      arca
        .responder('FECompConsultar', respuestas.CONSULTA_NO_EXISTE)
        .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
        .responder('FECAESolicitar', APROBADA),
    );
    assert.deepEqual(
      pasos.map((paso) => paso.paso),
      ['reservar', 'autorizada'],
    );
    assert.deepEqual(pasos[0], {
      paso: 'reservar',
      intento: 1,
      numero: 42,
      fecha: HOY,
      segundos: 120,
    });
  },
);

Deno.test('al volver a pedir, un 10016 no vuelve a pedida: se consulta de nuevo', async () => {
  const coincide = await emitir(EMITIENDO, (arca) =>
    arca
      .responder(
        'FECompConsultar',
        respuestas.CONSULTA_NO_EXISTE,
        respuestas.consultaEncontrada(CONSULTADA),
      )
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
      .responder(
        'FECAESolicitar',
        respuestas.caeRechazado({ numero: 42, fecha: '20261003' }, [
          { codigo: 10016, mensaje: 'x' },
        ]),
      ),
  );
  assert.deepEqual(
    coincide.pasos.map((paso) => paso.paso),
    ['reservar', 'autorizada'],
  );

  const noCoincide = await emitir(EMITIENDO, (arca) =>
    arca
      .responder('FECompConsultar', respuestas.CONSULTA_NO_EXISTE, respuestas.CONSULTA_NO_EXISTE)
      .responder('FECompUltimoAutorizado', respuestas.ultimo(41, 2))
      .responder(
        'FECAESolicitar',
        respuestas.caeRechazado({ numero: 42, fecha: '20261003' }, [
          { codigo: 10016, mensaje: 'x' },
        ]),
      ),
  );
  assert.deepEqual(
    noCoincide.pasos.map((paso) => paso.paso),
    ['reservar', 'a_revisar'],
  );
});

Deno.test(
  'si ARCA no la tiene y el último ya es ese número o más, o hay un hueco, a revisar',
  async () => {
    for (const ultimo of [42, 50, 30]) {
      const { pasos } = await emitir(EMITIENDO, (arca) =>
        arca
          .responder('FECompConsultar', respuestas.CONSULTA_NO_EXISTE)
          .responder('FECompUltimoAutorizado', respuestas.ultimo(ultimo, 2)),
      );
      assert.deepEqual(
        pasos.map((paso) => paso.paso),
        ['a_revisar'],
        `último ${String(ultimo)}`,
      );
    }
  },
);

Deno.test('la nota de crédito lleva su factura en CbtesAsoc, con el CUIT de Auth', async () => {
  const nota = comprobante({ id: 'n1', tipo: 'nota_de_credito_c', asociado_id: 'c1' });
  const { pasos, arca } = await emitir(nota, (arca, base) => {
    base.factura = { puntoDeVenta: 2, numero: 42, fecha: '2026-10-02' };
    arca
      .responder('FECompUltimoAutorizado', respuestas.ultimo(6, 2, 13))
      .responder(
        'FECAESolicitar',
        respuestas.caeAprobado({
          numero: 7,
          fecha: '20261003',
          cae: '76398765432110',
          vence: '20261013',
        }),
      );
  });
  const pedido = cuerpoDe(arca, 'FECAESolicitar');
  assert.match(pedido, /<ar:CbteTipo>13<\/ar:CbteTipo>/);
  assert.match(
    pedido,
    new RegExp(
      `<ar:CbtesAsoc><ar:CbteAsoc><ar:Tipo>11</ar:Tipo><ar:PtoVta>2</ar:PtoVta><ar:Nro>42</ar:Nro><ar:Cuit>${CUIT_DE_LA_PRUEBA}</ar:Cuit><ar:CbteFch>20261002</ar:CbteFch></ar:CbteAsoc></ar:CbtesAsoc>`,
    ),
  );
  assert.match(pedido, /<ar:CondicionIVAReceptorId>5<\/ar:CondicionIVAReceptorId><ar:CbtesAsoc>/);
  assert.equal(pasos.at(-1)?.paso, 'autorizada');
});

// El XML -----------------------------------------------------------------------------------------------------------

Deno.test(
  'el pedido: importes con dos decimales desde centavos grandes, el CUIT sin guiones y los campos del concepto 2',
  () => {
    const pedido = detalleDelPedido(
      { token: 't', firma: 'f', cuit: '20111111112' },
      {
        tipo: 'factura_c',
        puntoDeVenta: 3,
        numero: 1,
        fecha: '2026-10-03',
        concepto: 2,
        importe: centavos(123_456_789_012),
        docTipo: 80,
        docNro: '20111111112',
        condicionIva: 5,
        asociado: null,
      },
    );
    assert.match(pedido, /<ar:ImpTotal>1234567890\.12<\/ar:ImpTotal>/);
    assert.match(pedido, /<ar:ImpNeto>1234567890\.12<\/ar:ImpNeto>/);
    assert.match(pedido, /<ar:Cuit>20111111112<\/ar:Cuit>/);
    assert.match(
      pedido,
      /<ar:ImpIVA>0<\/ar:ImpIVA><ar:FchServDesde>20261003<\/ar:FchServDesde><ar:FchServHasta>20261003<\/ar:FchServHasta><ar:FchVtoPago>20261003<\/ar:FchVtoPago><ar:MonId>PES<\/ar:MonId>/,
    );
    assert.doesNotMatch(pedido, /<ar:Iva>|CanMisMonExt|CbtesAsoc/);
  },
);

Deno.test(
  'el pedido: el concepto 3 también lleva las tres fechas, el 1 ninguna, y un centavo va como 0.01',
  () => {
    const base = {
      tipo: 'factura_c' as const,
      puntoDeVenta: 3,
      numero: 1,
      fecha: '2026-10-03',
      importe: centavos(1),
      docTipo: 99,
      docNro: '0',
      condicionIva: 5,
      asociado: null,
    };
    const credencial = { token: 't', firma: 'f', cuit: '20111111112' };
    const productosYServicios = detalleDelPedido(credencial, { ...base, concepto: 3 });
    assert.match(productosYServicios, /<ar:Concepto>3<\/ar:Concepto>/);
    assert.match(
      productosYServicios,
      /<ar:FchServDesde>20261003<\/ar:FchServDesde><ar:FchServHasta>20261003<\/ar:FchServHasta><ar:FchVtoPago>20261003<\/ar:FchVtoPago>/,
    );
    const productos = detalleDelPedido(credencial, { ...base, concepto: 1 });
    assert.doesNotMatch(productos, /FchServ|FchVtoPago/);
    assert.match(productos, /<ar:ImpTotal>0\.01<\/ar:ImpTotal>/);
    assert.match(
      productos,
      /<ar:ImpIVA>0<\/ar:ImpIVA><ar:MonId>PES<\/ar:MonId><ar:MonCotiz>1<\/ar:MonCotiz><ar:CondicionIVAReceptorId>5<\/ar:CondicionIVAReceptorId><\/ar:FECAEDetRequest>/,
    );
  },
);

Deno.test('el pedido escapa el token y la firma', () => {
  const pedido = detalleDelPedido(
    { token: 'a<b&c', firma: 'd"e', cuit: '20111111112' },
    {
      tipo: 'factura_c',
      puntoDeVenta: 3,
      numero: 1,
      fecha: '2026-10-03',
      concepto: 1,
      importe: centavos(100),
      docTipo: 99,
      docNro: '0',
      condicionIva: 5,
      asociado: null,
    },
  );
  assert.match(pedido, /<ar:Token>a&lt;b&amp;c<\/ar:Token><ar:Sign>d&quot;e<\/ar:Sign>/);
});

Deno.test('la respuesta: Obs y Err con uno y con varios', () => {
  const comprobanteDePrueba = {
    tipo: 'factura_c' as const,
    puntoDeVenta: 2,
    numero: 42,
    fecha: '2026-10-03',
    concepto: 1,
    importe: centavos(45_000_000),
    docTipo: 99,
    docNro: '0',
    condicionIva: 5,
    asociado: null,
  };
  const uno = leerElCae(
    {
      http: 200,
      ms: 1,
      texto: respuestas.caeRechazado({ numero: 42, fecha: '20261003' }, [
        { codigo: 10015, mensaje: 'a' },
      ]),
    },
    comprobanteDePrueba,
  );
  assert.deepEqual(uno, {
    resultado: 'R',
    errores: [],
    observaciones: [{ codigo: 10015, mensaje: 'a' }],
  });
  const varios = leerElCae(
    {
      http: 200,
      ms: 1,
      texto: respuestas.caeRechazado(
        { numero: 42, fecha: '20261003' },
        [
          { codigo: 10015, mensaje: 'a' },
          { codigo: 10016, mensaje: 'b' },
        ],
        [
          { codigo: 10000, mensaje: 'c' },
          { codigo: 10001, mensaje: 'd' },
        ],
      ),
    },
    comprobanteDePrueba,
  );
  assert.deepEqual(varios, {
    resultado: 'R',
    errores: [
      { codigo: 10000, mensaje: 'c' },
      { codigo: 10001, mensaje: 'd' },
    ],
    observaciones: [
      { codigo: 10015, mensaje: 'a' },
      { codigo: 10016, mensaje: 'b' },
    ],
  });

  const unError = leerElCae(
    { http: 200, ms: 1, texto: respuestas.caeSinResultado([{ codigo: 10000, mensaje: 'e' }]) },
    comprobanteDePrueba,
  );
  assert.deepEqual(unError, { resultado: null, errores: [{ codigo: 10000, mensaje: 'e' }] });

  const dosDetalles = respuestas
    .caeAprobado({ numero: 42, fecha: '20261003', cae: '76398765432109', vence: '20261013' })
    .replace(
      '</FECAEDetResponse>',
      '</FECAEDetResponse><FECAEDetResponse><Resultado>R</Resultado></FECAEDetResponse>',
    );
  assert.deepEqual(leerElCae({ http: 200, ms: 1, texto: dosDetalles }, comprobanteDePrueba), {
    resultado: 'A',
    cae: '76398765432109',
    caeVence: '2026-10-13',
    fecha: '2026-10-03',
    observaciones: [],
  });

  const conObservaciones = leerElCae(
    {
      http: 200,
      ms: 1,
      texto: respuestas.caeAprobado(
        { numero: 42, fecha: '20261003', cae: '76398765432109', vence: '20261013' },
        [{ codigo: 10217, mensaje: 'f' }],
      ),
    },
    comprobanteDePrueba,
  );
  assert.deepEqual(conObservaciones.resultado === 'A' ? conObservaciones.observaciones : null, [
    { codigo: 10217, mensaje: 'f' },
  ]);
});

Deno.test('un CAE que no tiene 14 dígitos no es una autorización', () => {
  const comprobanteDePrueba = {
    tipo: 'factura_c' as const,
    puntoDeVenta: 2,
    numero: 42,
    fecha: '2026-10-03',
    concepto: 1,
    importe: centavos(45_000_000),
    docTipo: 99,
    docNro: '0',
    condicionIva: 5,
    asociado: null,
  };
  const corto = leerElCae(
    {
      http: 200,
      ms: 1,
      texto: respuestas.caeAprobado({
        numero: 42,
        fecha: '20261003',
        cae: '7639876543210',
        vence: '20261013',
      }),
    },
    comprobanteDePrueba,
  );
  assert.equal(corto.resultado, null);
});

Deno.test('tapar saca el bloque Auth, todo Cuit y el CMS, y el CUIT donde aparezca', () => {
  const tapado = tapar(
    '<a><ar:Auth><ar:Token>t</ar:Token><ar:Sign>s</ar:Sign><ar:Cuit>20111111112</ar:Cuit></ar:Auth><ar:CbteAsoc><ar:Cuit>20111111112</ar:Cuit></ar:CbteAsoc><Msg>la 20-11111111-2 no</Msg><AuthServer>OK</AuthServer><wsaa:in0>cms</wsaa:in0></a>',
    ['20111111112'],
  );
  assert.doesNotMatch(tapado, /<(\w+:)?(Auth|Token|Sign|Cuit|in0)[ >/]/i);
  assert.doesNotMatch(tapado, /20111111112|20-11111111-2/);
  assert.match(tapado, /<AuthServer>OK<\/AuthServer>/);
});

// El control -------------------------------------------------------------------------------------------------------

function tallerParaControlar(extra: Partial<TallerParaControlar> = {}): TallerParaControlar {
  return {
    householdId: 'h1',
    ambiente: 'homologacion',
    cuit: CUIT_DE_LA_FILA,
    puntoDeVenta: 2,
    certificadoVence: null,
    ultimos: { factura_c: 44, nota_de_credito_c: 2 },
    aRevisar: [],
    alertas: [],
    ...extra,
  };
}

Deno.test('el control: fuera-de-numa cuando ARCA va más adelante, y nada cuando no', async () => {
  const { dependencias, base, arca } = await preparar();
  base.talleres = [tallerParaControlar()];
  base.tomaDelLogin.push(TICKET);
  arca.responder(
    'FECompUltimoAutorizado',
    respuestas.ultimo(45, 2, 11),
    respuestas.ultimo(2, 2, 13),
  );
  assert.deepEqual(await controlar(dependencias), { talleres: 1, controlados: 1 });
  assert.deepEqual(base.alertas, [
    {
      householdId: 'h1',
      alertas: [
        {
          codigo: 'fuera-de-numa',
          tipo: 'factura_c',
          puntoDeVenta: 2,
          numeroArca: 45,
          numeroNuma: 44,
        },
      ],
    },
  ]);
});

Deno.test(
  'el control resuelve lo que está a revisar: autorizada si coincide, pedida si ARCA no lo tiene, y si no, la alerta',
  async () => {
    const aRevisar = {
      id: 'c9',
      tipo: 'factura_c' as const,
      ambiente: 'homologacion' as const,
      cuitEmisor: CUIT_DE_LA_FILA,
      puntoDeVenta: 2,
      numero: 42,
      fecha: '2026-10-02',
      importeCentavos: 45_000_000,
      docTipo: 99,
      docNro: '0',
      proyectoId: 'p1',
      cliente: 'Lucía Gómez',
    };
    const conUnoARevisar = tallerParaControlar({
      ultimos: { factura_c: 42, nota_de_credito_c: 2 },
      aRevisar: [aRevisar],
    });

    const coincide = await preparar();
    coincide.base.talleres = [conUnoARevisar];
    coincide.base.tomaDelLogin.push(TICKET);
    coincide.arca
      .responder('FECompUltimoAutorizado', respuestas.ultimo(42, 2), respuestas.ultimo(2, 2, 13))
      .responder('FECompConsultar', respuestas.consultaEncontrada(CONSULTADA));
    await controlar(coincide.dependencias);
    assert.deepEqual(coincide.base.anotados, [
      {
        id: 'c9',
        paso: {
          paso: 'autorizada',
          cae: '76398765432109',
          caeVence: '2026-10-12',
          fecha: '2026-10-02',
        },
      },
    ]);
    assert.deepEqual(coincide.base.alertas[0]?.alertas, []);

    const noLaTiene = await preparar();
    noLaTiene.base.talleres = [conUnoARevisar];
    noLaTiene.base.tomaDelLogin.push(TICKET);
    noLaTiene.arca
      .responder(
        'FECompUltimoAutorizado',
        respuestas.ultimo(41, 2),
        respuestas.ultimo(2, 2, 13),
        respuestas.ultimo(41, 2),
      )
      .responder('FECompConsultar', respuestas.CONSULTA_NO_EXISTE);
    await controlar(noLaTiene.dependencias);
    assert.deepEqual(noLaTiene.base.anotados, [
      { id: 'c9', paso: { paso: 'pedida', error: 'ARCA no lo tiene: se vuelve a pedir.' } },
    ]);
    assert.deepEqual(noLaTiene.base.alertas[0]?.alertas, []);

    const ocupado = await preparar();
    ocupado.base.talleres = [conUnoARevisar];
    ocupado.base.tomaDelLogin.push(TICKET);
    ocupado.arca
      .responder(
        'FECompUltimoAutorizado',
        respuestas.ultimo(42, 2),
        respuestas.ultimo(2, 2, 13),
        respuestas.ultimo(42, 2),
      )
      .responder('FECompConsultar', respuestas.CONSULTA_NO_EXISTE);
    await controlar(ocupado.dependencias);
    assert.deepEqual(ocupado.base.anotados, []);
    assert.equal(
      (ocupado.base.alertas[0]?.alertas[0] as { codigo?: string } | undefined)?.codigo,
      'a-revisar',
    );

    const sigue = await preparar();
    sigue.base.talleres = [conUnoARevisar];
    sigue.base.tomaDelLogin.push(TICKET);
    sigue.arca
      .responder('FECompUltimoAutorizado', respuestas.ultimo(42, 2), respuestas.ultimo(2, 2, 13))
      .responder(
        'FECompConsultar',
        respuestas.consultaEncontrada({ ...CONSULTADA, importe: '1.00' }),
      );
    await controlar(sigue.dependencias);
    assert.deepEqual(sigue.base.anotados, []);
    assert.deepEqual(sigue.base.alertas[0]?.alertas, [
      {
        codigo: 'a-revisar',
        comprobanteId: 'c9',
        proyectoId: 'p1',
        tipo: 'factura_c',
        puntoDeVenta: 2,
        numero: 42,
        cliente: 'Lucía Gómez',
      },
    ]);

    const sinRespuesta = await preparar();
    sinRespuesta.base.talleres = [conUnoARevisar];
    sinRespuesta.base.tomaDelLogin.push(TICKET);
    sinRespuesta.arca
      .responder('FECompUltimoAutorizado', respuestas.ultimo(42, 2), respuestas.ultimo(2, 2, 13))
      .responder('FECompConsultar', new TypeError('corte'));
    await controlar(sinRespuesta.dependencias);
    assert.deepEqual(sinRespuesta.base.anotados, []);
    assert.equal(
      (sinRespuesta.base.alertas[0]?.alertas[0] as { codigo?: string } | undefined)?.codigo,
      'a-revisar',
    );
  },
);

Deno.test(
  'el control: la nota de crédito también, y los números de NUMA los da la base, con las filas dadas de baja',
  async () => {
    const { dependencias, base, arca } = await preparar();
    base.talleres = [
      tallerParaControlar({ ultimos: { factura_c: null, nota_de_credito_c: null } }),
    ];
    base.tomaDelLogin.push(TICKET);
    arca.responder(
      'FECompUltimoAutorizado',
      respuestas.ultimo(0, 2, 11),
      respuestas.ultimo(3, 2, 13),
    );
    await controlar(dependencias);
    assert.deepEqual(base.alertas[0]?.alertas, [
      {
        codigo: 'fuera-de-numa',
        tipo: 'nota_de_credito_c',
        puntoDeVenta: 2,
        numeroArca: 3,
        numeroNuma: 0,
      },
    ]);
    assert.match(
      arca.llamadas[0]?.cuerpo ?? '',
      /<ar:PtoVta>2<\/ar:PtoVta><ar:CbteTipo>11<\/ar:CbteTipo>/,
    );
    assert.match(
      arca.llamadas[1]?.cuerpo ?? '',
      /<ar:PtoVta>2<\/ar:PtoVta><ar:CbteTipo>13<\/ar:CbteTipo>/,
    );
  },
);

Deno.test(
  'el control manda todas las fuera-de-numa con su número de ARCA: la base conserva la descartada si el número es el mismo',
  async () => {
    const { dependencias, base, arca } = await preparar();
    base.talleres = [
      tallerParaControlar({
        alertas: [
          {
            codigo: 'fuera-de-numa',
            tipo: 'factura_c',
            puntoDeVenta: 2,
            numeroArca: 45,
            numeroNuma: 44,
            descartada: true,
          },
        ],
      }),
    ];
    base.tomaDelLogin.push(TICKET);
    arca.responder(
      'FECompUltimoAutorizado',
      respuestas.ultimo(45, 2, 11),
      respuestas.ultimo(2, 2, 13),
    );
    await controlar(dependencias);
    assert.deepEqual(base.alertas[0]?.alertas, [
      {
        codigo: 'fuera-de-numa',
        tipo: 'factura_c',
        puntoDeVenta: 2,
        numeroArca: 45,
        numeroNuma: 44,
      },
    ]);
  },
);

Deno.test(
  'el control: si ARCA no contesta el último número, no toca las alertas de ese taller y sigue con el próximo',
  async () => {
    const { dependencias, base, arca } = await preparar();
    base.talleres = [
      tallerParaControlar(),
      tallerParaControlar({ householdId: 'h2', puntoDeVenta: 5 }),
    ];
    base.tomaDelLogin.push(TICKET, TICKET);
    arca.responder(
      'FECompUltimoAutorizado',
      new TypeError('corte'),
      respuestas.ultimo(44, 5, 11),
      respuestas.ultimo(2, 5, 13),
    );
    assert.deepEqual(await controlar(dependencias), { talleres: 2, controlados: 1 });
    assert.deepEqual(base.alertas, [{ householdId: 'h2', alertas: [] }]);
  },
);

Deno.test(
  'el control avisa el certificado por vencer: el activo en producción y el de prueba en homologación',
  async () => {
    const produccion = await preparar(CON_PRODUCCION);
    produccion.base.certificadosDelTaller = await certificadosDelTaller();
    produccion.base.talleres = [
      tallerParaControlar({
        ambiente: 'produccion',
        cuit: CUIT_DE_PRODUCCION,
        certificadoVence: '2026-10-25',
      }),
    ];
    produccion.base.tomaDelLogin.push(TICKET);
    produccion.arca.responder(
      'FECompUltimoAutorizado',
      respuestas.ultimo(44, 2),
      respuestas.ultimo(2, 2, 13),
    );
    await controlar(produccion.dependencias);
    assert.deepEqual(produccion.base.alertas[0]?.alertas, [
      { codigo: 'certificado-por-vencer', vence: '2026-10-25' },
    ]);
    for (const llamada of produccion.arca.llamadas)
      assert.ok(HOSTS.produccion.includes(new URL(llamada.url).hostname));

    const lejos = await preparar();
    lejos.base.talleres = [tallerParaControlar()];
    lejos.base.tomaDelLogin.push(TICKET);
    lejos.arca.responder(
      'FECompUltimoAutorizado',
      respuestas.ultimo(44, 2),
      respuestas.ultimo(2, 2, 13),
    );
    await controlar(lejos.dependencias);
    assert.deepEqual(lejos.base.alertas[0]?.alertas, []);

    const deLaPrueba = certificadoPara(
      PAR_DE_LA_PRUEBA.publica,
      PAR_DE_LA_PRUEBA.clave,
      CUIT_DE_LA_PRUEBA,
      new Date('2026-10-20T00:00:00Z'),
    );
    const homologacion = await preparar({ ARCA_HOMOLOGACION_CERT: btoa(deLaPrueba) });
    homologacion.base.talleres = [tallerParaControlar()];
    homologacion.base.tomaDelLogin.push(TICKET);
    homologacion.arca.responder(
      'FECompUltimoAutorizado',
      respuestas.ultimo(44, 2),
      respuestas.ultimo(2, 2, 13),
    );
    await controlar(homologacion.dependencias);
    assert.deepEqual(homologacion.base.alertas[0]?.alertas, [
      { codigo: 'certificado-por-vencer', vence: '2026-10-20' },
    ]);
  },
);

Deno.test(
  'el control, con la producción apagada, pide solo los talleres de homologación',
  async () => {
    for (const extra of PRODUCCION_APAGADA) {
      const { dependencias, base } = await preparar(extra);
      await controlar(dependencias);
      assert.deepEqual(base.pedidosParaControlar, [['homologacion']]);
    }
    const prendida = await preparar(CON_PRODUCCION);
    await controlar(prendida.dependencias);
    assert.deepEqual(prendida.base.pedidosParaControlar, [['homologacion', 'produccion']]);
  },
);

Deno.test('el control, sin poder entrar a ARCA, no reemplaza las alertas que había', async () => {
  const { dependencias, base, arca } = await preparar();
  base.talleres = [tallerParaControlar()];
  arca.responder('loginCms', respuestas.NO_AUTORIZADO);
  assert.deepEqual(await controlar(dependencias), { talleres: 1, controlados: 0 });
  assert.deepEqual(base.alertas, []);
});

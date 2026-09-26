import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import {
  chromium,
  devices,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type CDPSession,
  type Page,
} from '@playwright/test';
import { loadEnv } from 'vite';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const VITE = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));

type Escenario = 'frio' | 'tibio' | 'caliente';
type Perfil = 'escritorio' | 'celular';
type Caso = 'sin-sesion' | 'con-sesion' | 'con-bloqueo';

const ESCENARIOS: readonly Escenario[] = ['frio', 'tibio', 'caliente'];
const PERFILES: readonly Perfil[] = ['escritorio', 'celular'];
const CASOS: readonly Caso[] = ['sin-sesion', 'con-sesion', 'con-bloqueo'];

const CONTEXTO: Readonly<Record<Perfil, BrowserContextOptions>> = {
  escritorio: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
  celular: {
    ...devices['Desktop Chrome'],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
};

const RED_DEL_CELULAR = {
  offline: false,
  latency: 150,
  downloadThroughput: 1_600_000 / 8,
  uploadThroughput: 750_000 / 8,
};

const CPU_DEL_CELULAR = 4;
const VISTA_ANTES_DE_LA_A = '2099-12-30';
const TOPE_DE_UNA_CORRIDA_MS = 90_000;
const ESPERA_DE_LA_SINCRONIZACION_MS = 15_000;
const CUADROS_DE_LA_TIRA_MS = Array.from({ length: 13 }, (_, indice) => indice * 250);

interface Entorno {
  url: string;
  clave: string;
  email: string;
  contrasena: string;
}

interface Sesion {
  guardada: string;
  usuarioId: string;
}

interface Build {
  nombre: string;
  carpeta: string;
}

interface Pedido {
  sale: number;
  vuelve: number;
  comprimido: number | null;
  entero: number | null;
}

interface Corrida {
  primerPintado: number | null;
  primerContenido: number | null;
  raizConAlgo: number | null;
  renderDeReact: number | null;
  inicio: number | null;
  inicioPintado: number | null;
  bootstrap: Pedido | null;
  delta: Pedido | null;
  refresco: Pedido | null;
  jwks: Pedido | null;
  estados: { texto: string; instante: number }[];
}

interface Celda {
  build: string;
  escenario: Escenario;
  perfil: Perfil;
  corridas: Corrida[];
}

interface MarcasDelArranque {
  raizConAlgo?: number;
  renderDeReact?: number;
  inicio?: number;
  inicioPintado?: number;
  estados?: { texto: string; instante: number }[];
}

interface VentanaMedida {
  marcasDelArranque?: MarcasDelArranque;
}

interface Tiempos {
  pintura: Record<string, number>;
  recursos: { nombre: string; sale: number; vuelve: number }[];
  marcas: MarcasDelArranque;
}

const PEDIDOS = {
  bootstrap: /\/rest\/v1\/rpc\/bootstrap(\?|$)/,
  delta: /\/rest\/v1\/rpc\/delta(\?|$)/,
  refresco: /\/auth\/v1\/token\?grant_type=refresh_token/,
  jwks: /\/auth\/v1\/\.well-known\/jwks\.json/,
} as const;

type NombreDelPedido = keyof typeof PEDIDOS;

function exigir(valores: Record<string, string | undefined>, nombre: string): string {
  const valor = valores[nombre];
  if (valor === undefined || valor === '') {
    throw new Error(`Falta ${nombre} en apps/web/.env: es la cuenta de prueba del e2e.`);
  }
  return valor;
}

function leerEntorno(): Entorno {
  const valores: Record<string, string | undefined> = {
    ...loadEnv('development', RAIZ, ''),
    ...process.env,
  };
  return {
    url: exigir(valores, 'VITE_SUPABASE_URL').replace(/\/+$/, ''),
    clave: exigir(valores, 'VITE_SUPABASE_PUBLISHABLE_KEY'),
    email: exigir(valores, 'E2E_EMAIL'),
    contrasena: exigir(valores, 'E2E_PASSWORD'),
  };
}

async function iniciarSesion(entorno: Entorno): Promise<Sesion> {
  const respuesta = await fetch(`${entorno.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: entorno.clave, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: entorno.email, password: entorno.contrasena }),
  });
  const cuerpo = (await respuesta.json()) as { user?: { id?: string } };
  const usuarioId = cuerpo.user?.id;
  if (!respuesta.ok || usuarioId === undefined) {
    throw new Error(`La cuenta de prueba no pudo entrar: ${String(respuesta.status)}.`);
  }
  return { guardada: JSON.stringify(cuerpo), usuarioId };
}

function instrumentar({
  sesion,
  bloqueo,
  vista,
  vencida,
}: {
  sesion: string | null;
  bloqueo: string | null;
  vista: string;
  vencida: boolean;
}): void {
  if (sesion !== null && localStorage.getItem('maun.sesion') === null) {
    localStorage.setItem('maun.sesion', sesion);
  }
  const guardada = localStorage.getItem('maun.sesion');
  if (vencida && guardada !== null) {
    const conFecha = JSON.parse(guardada) as { expires_at?: number };
    conFecha.expires_at = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem('maun.sesion', JSON.stringify(conFecha));
  }
  if (bloqueo !== null && localStorage.getItem('maun:bloqueo') === null) {
    localStorage.setItem('maun:bloqueo', bloqueo);
  }
  if (localStorage.getItem('maun:novedades-vistas') === null) {
    localStorage.setItem('maun:novedades-vistas', vista);
  }
  const marcas: MarcasDelArranque = { estados: [] };
  (window as unknown as VentanaMedida).marcasDelArranque = marcas;
  let raiz: HTMLElement | null = null;
  let estadoVisto: Element | null = null;
  const alCambiarLaRaiz = new MutationObserver(() => {
    if (marcas.renderDeReact === undefined && document.readyState !== 'loading') {
      marcas.renderDeReact = performance.now();
    }
  });
  new MutationObserver(() => {
    if (raiz === null) {
      raiz = document.getElementById('root');
      if (raiz !== null) alCambiarLaRaiz.observe(raiz, { childList: true });
    }
    if (raiz !== null && marcas.raizConAlgo === undefined && raiz.childElementCount > 0) {
      marcas.raizConAlgo = performance.now();
    }
    const estado = raiz?.querySelector('[role="status"]') ?? null;
    if (estado !== null && estado !== estadoVisto && document.readyState !== 'loading') {
      estadoVisto = estado;
      marcas.estados?.push({ texto: estado.textContent.trim(), instante: performance.now() });
    }
    if (
      marcas.inicio === undefined &&
      document.querySelector('main#contenido h1')?.textContent === 'Inicio'
    ) {
      marcas.inicio = performance.now();
      requestAnimationFrame((cuadro) => {
        marcas.inicioPintado = cuadro;
      });
    }
  }).observe(document, { childList: true, subtree: true });
}

function bloqueoDe(usuarioId: string): string {
  return JSON.stringify({ usuarioId, credencial: null, desbloqueadaEn: 1, salioEn: 1 });
}

async function prepararContexto(
  navegador: Browser,
  perfil: Perfil,
  opciones: {
    sesion: Sesion | null;
    conBloqueo?: boolean;
    trabajadores?: 'allow' | 'block';
    tema?: 'light' | 'dark';
    vencida?: boolean;
  },
): Promise<BrowserContext> {
  const contexto = await navegador.newContext({
    ...CONTEXTO[perfil],
    serviceWorkers: opciones.trabajadores ?? 'allow',
    colorScheme: opciones.tema ?? 'light',
  });
  await contexto.addInitScript(instrumentar, {
    sesion: opciones.sesion?.guardada ?? null,
    bloqueo:
      opciones.conBloqueo === true && opciones.sesion !== null
        ? bloqueoDe(opciones.sesion.usuarioId)
        : null,
    vista: VISTA_ANTES_DE_LA_A,
    vencida: opciones.vencida ?? false,
  });
  return contexto;
}

async function frenar(
  contexto: BrowserContext,
  pagina: Page,
  perfil: Perfil,
  sinCache: boolean,
): Promise<CDPSession> {
  const cdp = await contexto.newCDPSession(pagina);
  await cdp.send('Network.enable');
  if (sinCache) await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (perfil === 'celular') {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_DEL_CELULAR });
    await cdp.send('Network.emulateNetworkConditions', RED_DEL_CELULAR);
  }
  return cdp;
}

function pedidoDe(
  tiempos: Tiempos,
  patron: RegExp,
  pesos: Map<string, { comprimido: number; entero: number | null }>,
): Pedido | null {
  const recurso = tiempos.recursos.find((entrada) => patron.test(entrada.nombre));
  if (recurso === undefined) return null;
  const peso = [...pesos].find(([url]) => patron.test(url))?.[1];
  return {
    sale: recurso.sale,
    vuelve: recurso.vuelve,
    comprimido: peso?.comprimido ?? null,
    entero: peso?.entero ?? null,
  };
}

function anotarPesos(pagina: Page): Map<string, { comprimido: number; entero: number | null }> {
  const pesos = new Map<string, { comprimido: number; entero: number | null }>();
  pagina.on('requestfinished', (pedido) => {
    const url = pedido.url();
    if (!Object.values(PEDIDOS).some((patron) => patron.test(url))) return;
    void (async () => {
      const tamanos = await pedido.sizes();
      const respuesta = await pedido.response();
      const cuerpo = await respuesta?.body().catch(() => null);
      pesos.set(url, {
        comprimido: tamanos.responseBodySize,
        entero: cuerpo === null || cuerpo === undefined ? null : cuerpo.length,
      });
    })();
  });
  return pesos;
}

async function leerTiempos(pagina: Page): Promise<Tiempos> {
  return pagina.evaluate(() => ({
    pintura: Object.fromEntries(
      performance.getEntriesByType('paint').map((entrada) => [entrada.name, entrada.startTime]),
    ),
    recursos: performance
      .getEntriesByType('resource')
      .filter((entrada): entrada is PerformanceResourceTiming => 'responseEnd' in entrada)
      .map((entrada) => ({
        nombre: entrada.name,
        sale: entrada.startTime,
        vuelve: entrada.responseEnd,
      })),
    marcas: (window as unknown as VentanaMedida).marcasDelArranque ?? {},
  }));
}

async function esperarInicio(pagina: Page): Promise<void> {
  await pagina.waitForFunction(
    () => (window as unknown as VentanaMedida).marcasDelArranque?.inicioPintado !== undefined,
    null,
    { timeout: TOPE_DE_UNA_CORRIDA_MS, polling: 50 },
  );
}

async function esperarLaSincronizacion(pagina: Page): Promise<void> {
  await pagina
    .waitForFunction(
      () =>
        performance
          .getEntriesByType('resource')
          .some(
            (entrada) =>
              /\/rest\/v1\/rpc\/(bootstrap|delta)(\?|$)/.test(entrada.name) &&
              'responseEnd' in entrada &&
              (entrada as PerformanceResourceTiming).responseEnd > 0,
          ),
      null,
      { timeout: ESPERA_DE_LA_SINCRONIZACION_MS, polling: 100 },
    )
    .catch(() => undefined);
  await pagina.waitForTimeout(300);
}

async function medirUnaCarga(
  contexto: BrowserContext,
  url: string,
  perfil: Perfil,
  sinCache: boolean,
): Promise<Corrida> {
  const pagina = await contexto.newPage();
  try {
    await frenar(contexto, pagina, perfil, sinCache);
    const pesos = anotarPesos(pagina);
    await pagina.goto(url, { waitUntil: 'commit' });
    await esperarInicio(pagina);
    await esperarLaSincronizacion(pagina);
    const tiempos = await leerTiempos(pagina);
    const pedido = (nombre: NombreDelPedido) => pedidoDe(tiempos, PEDIDOS[nombre], pesos);
    return {
      primerPintado: tiempos.pintura['first-paint'] ?? null,
      primerContenido: tiempos.pintura['first-contentful-paint'] ?? null,
      raizConAlgo: tiempos.marcas.raizConAlgo ?? null,
      renderDeReact: tiempos.marcas.renderDeReact ?? null,
      inicio: tiempos.marcas.inicio ?? null,
      inicioPintado: tiempos.marcas.inicioPintado ?? null,
      bootstrap: pedido('bootstrap'),
      delta: pedido('delta'),
      refresco: pedido('refresco'),
      jwks: pedido('jwks'),
      estados: tiempos.marcas.estados ?? [],
    };
  } finally {
    await pagina.close();
  }
}

async function esperarLaReplicaGuardada(pagina: Page): Promise<void> {
  await pagina.waitForFunction(
    () =>
      new Promise<boolean>((resolver) => {
        const pedido = indexedDB.open('maun');
        pedido.onerror = () => {
          resolver(false);
        };
        pedido.onsuccess = () => {
          const base = pedido.result;
          if (!base.objectStoreNames.contains('react-query')) {
            base.close();
            resolver(false);
            return;
          }
          const lectura = base.transaction('react-query').objectStore('react-query').get('cache');
          lectura.onsuccess = () => {
            const guardado = lectura.result as
              | { clientState?: { queries?: { queryKey: unknown[]; state: { data?: unknown } }[] } }
              | undefined;
            base.close();
            resolver(
              guardado?.clientState?.queries?.some(
                (consulta) => consulta.queryKey[0] === 'replica' && consulta.state.data != null,
              ) === true,
            );
          };
          lectura.onerror = () => {
            base.close();
            resolver(false);
          };
        };
      }),
    null,
    { timeout: TOPE_DE_UNA_CORRIDA_MS, polling: 250 },
  );
}

async function calentar(
  contexto: BrowserContext,
  url: string,
  conTrabajador: boolean,
): Promise<void> {
  const pagina = await contexto.newPage();
  try {
    await pagina.goto(url);
    await esperarInicio(pagina);
    await esperarLaReplicaGuardada(pagina);
    if (!conTrabajador) return;
    await pagina.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    await pagina.goto(url);
    await esperarInicio(pagina);
    const controlada = await pagina.evaluate(() => navigator.serviceWorker.controller !== null);
    if (!controlada) throw new Error('El service worker no quedó controlando la página.');
    await esperarLaReplicaGuardada(pagina);
  } finally {
    await pagina.close();
  }
}

async function medirCelda(
  navegador: Browser,
  build: string,
  url: string,
  escenario: Escenario,
  perfil: Perfil,
  corridas: number,
  sesion: Sesion,
  vencida: boolean,
): Promise<Celda> {
  const resultado: Corrida[] = [];
  if (escenario === 'frio') {
    for (let vuelta = 0; vuelta < corridas; vuelta += 1) {
      const contexto = await prepararContexto(navegador, perfil, { sesion, vencida });
      try {
        resultado.push(await medirUnaCarga(contexto, url, perfil, false));
      } finally {
        await contexto.close();
      }
      informar(build, escenario, perfil, vuelta, resultado.at(-1));
    }
    return { build, escenario, perfil, corridas: resultado };
  }

  const conTrabajador = escenario === 'caliente';
  const contexto = await prepararContexto(navegador, perfil, {
    sesion,
    trabajadores: conTrabajador ? 'allow' : 'block',
    vencida,
  });
  try {
    await calentar(contexto, url, conTrabajador);
    for (let vuelta = 0; vuelta < corridas; vuelta += 1) {
      resultado.push(await medirUnaCarga(contexto, url, perfil, !conTrabajador));
      informar(build, escenario, perfil, vuelta, resultado.at(-1));
    }
  } finally {
    await contexto.close();
  }
  return { build, escenario, perfil, corridas: resultado };
}

function informar(
  build: string,
  escenario: Escenario,
  perfil: Perfil,
  vuelta: number,
  corrida: Corrida | undefined,
): void {
  const inicio = corrida?.inicioPintado;
  console.log(
    `${build} · ${escenario} · ${perfil} · ${String(vuelta + 1)}: Inicio a los ${
      inicio === null || inicio === undefined ? '—' : String(Math.round(inicio))
    } ms`,
  );
}

async function levantar(build: Build, puerto: number): Promise<ChildProcess> {
  const servidor = spawn(
    process.execPath,
    [VITE, 'preview', '--outDir', build.carpeta, '--port', String(puerto), '--strictPort'],
    { cwd: RAIZ, stdio: 'ignore' },
  );
  const hasta = Date.now() + 30_000;
  while (Date.now() < hasta) {
    const respuesta = await fetch(`http://localhost:${String(puerto)}/`).catch(() => null);
    if (respuesta?.ok === true) return servidor;
    await new Promise((resolver) => setTimeout(resolver, 200));
  }
  servidor.kill();
  throw new Error(`vite preview no levantó ${build.carpeta} en el ${String(puerto)}.`);
}

function mediana(valores: (number | null | undefined)[]): number | null {
  const ordenados = valores
    .filter((valor): valor is number => typeof valor === 'number')
    .sort((a, b) => a - b);
  if (ordenados.length === 0) return null;
  const medio = Math.floor(ordenados.length / 2);
  const [izquierda, derecha] = [ordenados[medio - 1], ordenados[medio]];
  if (ordenados.length % 2 === 1 || izquierda === undefined) return derecha ?? null;
  return derecha === undefined ? izquierda : (izquierda + derecha) / 2;
}

function ms(valor: number | null): string {
  return valor === null ? '—' : String(Math.round(valor));
}

function kb(valor: number | null): string {
  return valor === null ? '—' : (valor / 1024).toFixed(1).replace('.', ',');
}

function resumen(celda: Celda) {
  const de = (clave: 'bootstrap' | 'delta' | 'refresco' | 'jwks', campo: keyof Pedido) =>
    mediana(celda.corridas.map((corrida) => corrida[clave]?.[campo]));
  return {
    primerPintado: mediana(celda.corridas.map((corrida) => corrida.primerPintado)),
    primerContenido: mediana(celda.corridas.map((corrida) => corrida.primerContenido)),
    renderDeReact: mediana(celda.corridas.map((corrida) => corrida.renderDeReact)),
    inicio: mediana(celda.corridas.map((corrida) => corrida.inicioPintado)),
    bootstrapSale: de('bootstrap', 'sale'),
    bootstrapVuelve: de('bootstrap', 'vuelve'),
    bootstrapComprimido: de('bootstrap', 'comprimido'),
    bootstrapEntero: de('bootstrap', 'entero'),
    deltaSale: de('delta', 'sale'),
    deltaVuelve: de('delta', 'vuelve'),
    jwksSale: de('jwks', 'sale'),
    jwksVuelve: de('jwks', 'vuelve'),
    refrescoSale: de('refresco', 'sale'),
    refrescoVuelve: de('refresco', 'vuelve'),
    conBootstrap: celda.corridas.filter((corrida) => corrida.bootstrap !== null).length,
    conRefresco: celda.corridas.filter((corrida) => corrida.refresco !== null).length,
    corridas: celda.corridas.length,
    estados: estadosEnMediana(celda.corridas),
  };
}

function estadosEnMediana(corridas: Corrida[]): { texto: string; instante: number | null }[] {
  const largo = Math.max(0, ...corridas.map((corrida) => corrida.estados.length));
  return Array.from({ length: largo }, (_, indice) => ({
    texto: corridas.find((corrida) => corrida.estados[indice])?.estados[indice]?.texto ?? '',
    instante: mediana(corridas.map((corrida) => corrida.estados[indice]?.instante)),
  }));
}

function tabla(celdas: Celda[]): string {
  const filas = celdas.map((celda) => {
    const r = resumen(celda);
    return `| ${celda.build} | ${celda.escenario} | ${celda.perfil} | ${ms(r.primerPintado)} | ${ms(
      r.primerContenido,
    )} | ${ms(r.renderDeReact)} | ${ms(r.inicio)} | ${
      r.conBootstrap === 0
        ? '—'
        : `${ms(r.bootstrapSale)} → ${ms(r.bootstrapVuelve)} (${kb(r.bootstrapComprimido)} / ${kb(
            r.bootstrapEntero,
          )} KB)`
    } | ${r.deltaSale === null ? '—' : `${ms(r.deltaSale)} → ${ms(r.deltaVuelve)}`} | ${
      r.jwksSale === null ? '—' : `${ms(r.jwksSale)} → ${ms(r.jwksVuelve)}`
    } | ${
      r.conRefresco === 0 ? '—' : `${ms(r.refrescoSale)} → ${ms(r.refrescoVuelve)}`
    } | ${String(r.corridas)} |`;
  });
  return [
    '| Build | Escenario | Perfil | Primer pintado | Primer contenido | Render de React | Inicio | `bootstrap` (comprimido / entero) | `delta` | JWKS | Refresco del token | Corridas |',
    '| --- | --- | --- | --: | --: | --: | --: | --- | --- | --- | --- | --: |',
    ...filas,
  ].join('\n');
}

function tablaDeEstados(celdas: Celda[]): string {
  const filas = celdas.map((celda) => {
    const estados = resumen(celda)
      .estados.map((estado) => `${estado.texto} (${ms(estado.instante)})`)
      .join(' → ');
    return `| ${celda.build} | ${celda.escenario} | ${celda.perfil} | ${estados === '' ? '—' : estados} |`;
  });
  return [
    '| Build | Escenario | Perfil | Cada estado de carga, cuando aparece (ms) |',
    '| --- | --- | --- | --- |',
    ...filas,
  ].join('\n');
}

function comparar(celdas: Celda[], referencia: string): string[] {
  const lineas: string[] = [];
  for (const celda of celdas) {
    if (celda.build === referencia || celda.escenario === 'frio') continue;
    const base = celdas.find(
      (otra) =>
        otra.build === referencia &&
        otra.escenario === celda.escenario &&
        otra.perfil === celda.perfil,
    );
    const antes = base === undefined ? null : resumen(base).inicio;
    const despues = resumen(celda).inicio;
    if (antes === null || despues === null) continue;
    const tolerancia = Math.max(150, antes * 0.1);
    const diferencia = despues - antes;
    lineas.push(
      `${celda.escenario} · ${celda.perfil}: ${referencia} ${ms(antes)} ms, ${celda.build} ${ms(
        despues,
      )} ms (${diferencia >= 0 ? '+' : ''}${ms(diferencia)}; tolerancia ${ms(tolerancia)}) → ${
        diferencia > tolerancia ? 'REGRESIÓN' : 'sin regresión'
      }`,
    );
  }
  return lineas;
}

async function tira(
  navegador: Browser,
  builds: { build: Build; url: string }[],
  sesion: Sesion,
  salida: string,
): Promise<void> {
  const filas: {
    nombre: string;
    cuadros: (string | null)[];
    inicio: { momento: number; cuadro: string | null } | null;
  }[] = [];
  for (const { build, url } of builds) {
    const contexto = await prepararContexto(navegador, 'celular', { sesion });
    try {
      const pagina = await contexto.newPage();
      const cdp = await frenar(contexto, pagina, 'celular', false);
      const cuadros: { instante: number; datos: string }[] = [];
      cdp.on('Page.screencastFrame', (cuadro) => {
        cuadros.push({ instante: cuadro.metadata.timestamp ?? 0, datos: cuadro.data });
        void cdp.send('Page.screencastFrameAck', { sessionId: cuadro.sessionId });
      });
      await cdp.send('Page.startScreencast', {
        format: 'jpeg',
        quality: 70,
        maxWidth: 390,
        maxHeight: 844,
        everyNthFrame: 1,
      });
      await pagina.goto(url, { waitUntil: 'commit' });
      await esperarInicio(pagina);
      await pagina.waitForTimeout(500);
      await cdp.send('Page.stopScreencast');
      const origen = await pagina.evaluate(() => performance.timeOrigin);
      const { marcas } = await leerTiempos(pagina);
      const hasta = (momento: number) =>
        cuadros.filter((cuadro) => cuadro.instante * 1000 - origen <= momento).at(-1)?.datos ??
        null;
      const inicio = marcas.inicioPintado;
      filas.push({
        nombre: build.nombre,
        cuadros: CUADROS_DE_LA_TIRA_MS.map(hasta),
        inicio:
          inicio === undefined
            ? null
            : {
                momento: inicio,
                cuadro:
                  cuadros.find((cuadro) => cuadro.instante * 1000 - origen >= inicio)?.datos ??
                  hasta(inicio + 1000),
              },
      });
    } finally {
      await contexto.close();
    }
  }

  const figura = (cuadro: string | null, leyenda: string) =>
    `<figure>${
      cuadro === null ? '<div class="vacio"></div>' : `<img src="data:image/jpeg;base64,${cuadro}">`
    }<figcaption>${leyenda}</figcaption></figure>`;
  const figuras = filas
    .map(
      (fila) =>
        `<div class="fila"><div class="nombre">${fila.nombre}</div>${fila.cuadros
          .map((cuadro, indice) =>
            figura(
              cuadro,
              `${String((CUADROS_DE_LA_TIRA_MS[indice] ?? 0) / 1000).replace('.', ',')} s`,
            ),
          )
          .join('')}${
          fila.inicio === null
            ? ''
            : figura(
                fila.inicio.cuadro,
                `Inicio, ${(fila.inicio.momento / 1000).toFixed(1).replace('.', ',')} s`,
              )
        }</div>`,
    )
    .join('');
  const contexto = await navegador.newContext({
    viewport: { width: 2050, height: 400 },
    deviceScaleFactor: 1,
  });
  try {
    const pagina = await contexto.newPage();
    await pagina.setContent(
      `<!doctype html><style>body{margin:0;padding:12px;background:#fff;font:13px system-ui}.fila{display:flex;gap:6px;align-items:flex-start;margin-bottom:12px}.nombre{width:80px;font-weight:600}figure{margin:0;display:flex;flex-direction:column;gap:4px;align-items:center}img,.vacio{width:130px;height:281px;border:1px solid #bbb;background:#fff;object-fit:cover}figcaption{color:#444}</style>${figuras}`,
    );
    await pagina.screenshot({ path: path.join(salida, 'tira-frio-celular.png'), fullPage: true });
  } finally {
    await contexto.close();
  }
}

async function primerCuadro(
  navegador: Browser,
  builds: { build: Build; url: string }[],
  sesion: Sesion,
  salida: string,
): Promise<void> {
  for (const { build, url } of builds) {
    for (const caso of CASOS) {
      for (const tema of ['light', 'dark'] as const) {
        const contexto = await prepararContexto(navegador, 'celular', {
          sesion: caso === 'sin-sesion' ? null : sesion,
          conBloqueo: caso === 'con-bloqueo',
          tema,
        });
        try {
          const pagina = await contexto.newPage();
          await pagina.route(/\/assets\/[^/]+\.js$/, (ruta) => ruta.abort());
          await pagina.goto(url, { waitUntil: 'load' });
          await pagina.evaluate(() => document.fonts.ready.then(() => undefined));
          await pagina.screenshot({
            path: path.join(
              salida,
              `primer-cuadro-${build.nombre}-${caso}-${tema === 'light' ? 'claro' : 'oscuro'}.png`,
            ),
          });
        } finally {
          await contexto.close();
        }
      }
    }
    for (const caso of ['sin-sesion', 'con-sesion'] as const) {
      const contexto = await prepararContexto(navegador, 'escritorio', {
        sesion: caso === 'sin-sesion' ? null : sesion,
      });
      try {
        const pagina = await contexto.newPage();
        await pagina.route(/\/assets\/[^/]+\.js$/, (ruta) => ruta.abort());
        await pagina.goto(url, { waitUntil: 'load' });
        await pagina.evaluate(() => document.fonts.ready.then(() => undefined));
        await pagina.screenshot({
          path: path.join(salida, `primer-cuadro-${build.nombre}-${caso}-escritorio.png`),
        });
      } finally {
        await contexto.close();
      }
    }
  }
}

function lista<T extends string>(texto: string | undefined, validos: readonly T[]): T[] {
  if (texto === undefined) return [...validos];
  const pedidos = texto.split(',').map((valor) => valor.trim());
  const desconocido = pedidos.find((valor) => !(validos as readonly string[]).includes(valor));
  if (desconocido !== undefined) throw new Error(`No conozco «${desconocido}».`);
  return pedidos as T[];
}

const { values: opciones } = parseArgs({
  options: {
    build: { type: 'string', multiple: true },
    corridas: { type: 'string', default: '10' },
    escenarios: { type: 'string' },
    perfiles: { type: 'string' },
    referencia: { type: 'string' },
    salida: { type: 'string', default: 'test-results/arranque' },
    puerto: { type: 'string', default: '4191' },
    tira: { type: 'boolean', default: false },
    'primer-cuadro': { type: 'boolean', default: false },
    'sin-medir': { type: 'boolean', default: false },
    'token-vencido': { type: 'boolean', default: false },
  },
});

const builds: Build[] = (opciones.build ?? []).map((texto) => {
  const [nombre, ...resto] = texto.split('=');
  const carpeta = resto.join('=');
  if (nombre === undefined || nombre === '' || carpeta === '') {
    throw new Error(`--build va como nombre=carpeta o nombre=https://…: «${texto}».`);
  }
  return { nombre, carpeta: /^https?:\/\//.test(carpeta) ? carpeta : path.resolve(carpeta) };
});
if (builds.length === 0) {
  throw new Error(
    'Pasale al menos un build: --build main=dist --build antes=C:/tmp/otro/dist, cada uno armado con vite build.',
  );
}

const corridas = Number(opciones.corridas);
const escenarios = lista(opciones.escenarios, ESCENARIOS);
const perfiles = lista(opciones.perfiles, PERFILES);
const salida = path.resolve(RAIZ, opciones.salida);
const puertoBase = Number(opciones.puerto);
const referencia = opciones.referencia ?? builds[0]?.nombre ?? '';
mkdirSync(salida, { recursive: true });

const entorno = leerEntorno();
const navegador = await chromium.launch({ channel: 'chromium' });
const servidores: ChildProcess[] = [];
const celdas: Celda[] = [];

try {
  const levantados = await Promise.all(
    builds.map(async (build, indice) => {
      if (/^https?:\/\//.test(build.carpeta)) {
        return { build, url: new URL('/', build.carpeta).toString() };
      }
      const puerto = puertoBase + indice;
      servidores.push(await levantar(build, puerto));
      return { build, url: `http://localhost:${String(puerto)}/` };
    }),
  );

  if (!opciones['sin-medir']) {
    for (const perfil of perfiles) {
      for (const escenario of escenarios) {
        for (const { build, url } of levantados) {
          const sesion = await iniciarSesion(entorno);
          celdas.push(
            await medirCelda(
              navegador,
              build.nombre,
              url,
              escenario,
              perfil,
              corridas,
              sesion,
              opciones['token-vencido'],
            ),
          );
        }
      }
    }
    const texto = `${tabla(celdas)}\n\n${tablaDeEstados(celdas)}`;
    const comparacion = comparar(celdas, referencia);
    writeFileSync(path.join(salida, 'mediciones.json'), JSON.stringify(celdas, null, 2));
    writeFileSync(path.join(salida, 'tabla.md'), `${texto}\n\n${comparacion.join('\n')}\n`);
    console.log(`\n${texto}\n`);
    for (const linea of comparacion) console.log(linea);
  }

  if (opciones.tira) await tira(navegador, levantados, await iniciarSesion(entorno), salida);
  if (opciones['primer-cuadro']) {
    await primerCuadro(navegador, levantados, await iniciarSesion(entorno), salida);
  }
} finally {
  await navegador.close();
  for (const servidor of servidores) servidor.kill();
}

import { centavos, puntosBasicos, type Fila } from '@maun/domain';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProveedorDeReplica } from '@/entities/replica';
import { ProveedorDeSesion } from '@/entities/sesion';
import { AjustesPage, ConectarConArcaPage, FacturacionPage } from '@/pages/ajustes';
import { FinanzasPage } from '@/pages/finanzas';
import { InicioPage } from '@/pages/inicio';
import { ProyectoFichaPage } from '@/pages/proyectos';
import {
  aplicarFilaLocal,
  TABLAS_REPLICADAS,
  type FilaDe,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';
import { usarIdioma } from '@/shared/idioma';
import { CLAVE_DEL_SEUDOIDIOMA } from '@/shared/lib';

vi.mock('@/shared/api', async (importar) => ({
  ...(await importar<typeof import('@/shared/api')>()),
  estadoDeLaFacturacion: () => new Promise(() => undefined),
}));

const HOY = '2026-10-02';

const HOGAR = '00000000-0000-7000-8000-000000000001';
const MAUN = '00000000-0000-7000-8000-000000000002';
const DIEZMO = '00000000-0000-7000-8000-000000000003';
const COCOS = '00000000-0000-7000-8000-000000000004';
const FIJOS = '00000000-0000-7000-8000-000000000010';
const DOLARES = '00000000-0000-7000-8000-000000000020';

const METADATOS = {
  household_id: 'h',
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
  deleted_at: null,
  version: 1,
} as const;

const FILA: Fila = {
  obligaciones: [{ tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso' }],
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(300_000_000),
      renglones: [],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: FIJOS,
      clase: 'fijos',
      tope: centavos(80_000_000),
      renglones: [{ nombre: 'Alquiler', monto: centavos(80_000_000), dia: null }],
      desde: '2026-09',
      modo: 'mes',
      hastaLaMeta: false,
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(5000), hastaLaMeta: false }],
  superavit: MAUN,
  sueldoPorTrabajo: false,
};

function tesoro(
  id: string,
  clave: FilaDe<'tesoros'>['clave'],
  nombre: string,
  tinta: string,
  moneda = 'ARS',
) {
  return {
    ...METADATOS,
    id,
    clave,
    nombre,
    descripcion: '',
    tinta,
    icono: 'vault',
    meta_centavos: null,
    rinde_anual_bp: null,
    orden: 0,
    archivado_at: null,
    moneda,
  } satisfies FilaDe<'tesoros'>;
}

const AJUSTES = {
  ...METADATOS,
  id: 'a1',
  sueldo_mensual_centavos: 300_000_000,
  costos_fijos_centavos: 80_000_000,
  meta_cocos_centavos: 0,
  tasa_cocos_anual_bp: 0,
  sena_bp: 5000,
  sueldo_tope_mensual: true,
  perdido_con_sueldo: false,
  perdido_con_diezmo: true,
  cobro_alias: 'taller.maun',
  cobro_cbu: '',
  cobro_titular: 'Eliseo Maun',
  cobro_cuit: '',
  cobro_link: '',
  cobro_dolares_cbu: '',
  cobro_dolares_alias: '',
  dolar_del_dia_centavos: 154_000,
  dolar_del_dia_el: HOY,
  resena_link: '',
  instagram_link: '',
  facebook_link: '',
  tiktok_link: '',
  fila: FILA as unknown as FilaDe<'ajustes'>['fila'],
  fila_version: 4,
  fila_guardada_at: null,
  presupuesto_vale_dias: 15,
  relevamiento_centavos: 12_000_000,
  taller_titular: '',
  taller_cuit: '',
  taller_condicion_fiscal: null,
  taller_domicilio: '',
  taller_telefono: '',
  taller_email: '',
  plantilla_del_presupuesto: null,
  plantilla_del_presupuesto_version: 0,
  idioma_de_los_clientes: 'es',
  facturacion_ambiente: 'homologacion',
  facturacion_cuit: '20-11111111-2',
  facturacion_punto_de_venta: 1,
  facturacion_desde: '2026-09-03',
  facturacion_alertas: [],
  facturacion_concepto: 1,
  facturacion_categoria: 'D',
  facturacion_ingresos_brutos: '',
  facturacion_inicio_de_actividades: null,
} satisfies FilaDe<'ajustes'>;

const CLIENTE = {
  ...METADATOS,
  id: 'c',
  nombre: 'Marcela Duarte',
  telefono: '1155556666',
  email: '',
  direccion: '',
  zona: 'Palermo',
  notas: '',
  cuit: '',
  dni: '',
  razon_social: '',
  domicilio_fiscal: '',
  condicion_fiscal: 'consumidor_final',
  origen_contacto: null,
  origen_detalle: '',
} satisfies FilaDe<'clientes'>;

const PROYECTO = {
  ...METADATOS,
  version: 3,
  id: 'p',
  cliente_id: 'c',
  titulo: 'Placard de tres puertas',
  descripcion: 'Melamina blanca con canto gris.',
  estado: 'en_curso',
  presupuesto_centavos: 240_000,
  sena_bp: 5000,
  forma_pago: null,
  cobro_sena: null,
  cobro_saldo: null,
  moneda: 'USD',
  cobra_en: ['ARS', 'USD'],
  costos_cotizacion_centavos: null,
  comprobante: 'sin_comprobante',
  fecha_visita: '2026-09-10',
  visita_hora: null,
  ultimo_contacto: null,
  fecha_inicio: '2026-09-20',
  entrega_estimada: '2026-10-20',
  entrega_hora: null,
  fecha_entrega: null,
  direccion_entrega: '',
  notas: 'Medidas tomadas.',
  vencimiento_presupuesto: null,
  costo_madera_centavos: null,
  costo_herrajes_centavos: null,
  costo_flete_centavos: null,
  costo_ayudante_centavos: null,
  fecha_cobro: null,
  dist_cobrado_centavos: null,
  dist_gastos_centavos: null,
  dist_diezmo_bp: null,
  dist_tope_sueldo_centavos: null,
  dist_tope_fijos_centavos: null,
  dist_diezmo_centavos: null,
  dist_sueldo_centavos: null,
  dist_fijos_centavos: null,
  dist_remanente_centavos: null,
  dist_objetivo_sueldo_centavos: null,
  dist_objetivo_fijos_centavos: null,
  dist_sueldo_mensual: null,
  dist_sueldo_previo_centavos: null,
  dist_fijos_previo_centavos: null,
  dist_liquidado_at: null,
  reapertura_objetivo_sueldo_centavos: null,
  reapertura_objetivo_fijos_centavos: null,
  reapertura_sueldo_mensual: null,
  reapertura_fecha_cobro: null,
  reapertura_fila: null,
  dist_fila_version: null,
  dist_fila: null,
  dist_previo: null,
  reparto_ya_en_la_apertura: false,
  presupuesto_vale_hasta: null,
  listo_el: null,
  entrega_comprometida: null,
  entrega_comprometida_franja: null,
  tipo_de_proyecto: null,
  presupuesto_diseno: false,
  presupuesto_despiece: false,
  presupuesto_cotizacion: false,
  presupuesto_pdf: false,
  visita_hecha: true,
  visita_importante: false,
  entrega_importante: false,
  presupuesto_importante: false,
} satisfies FilaDe<'proyectos'>;

const EN_PESOS = {
  ...PROYECTO,
  id: 'p2',
  titulo: 'Vanitory del baño',
  presupuesto_centavos: 96_000_000,
  moneda: 'ARS',
  cobra_en: ['ARS'],
} satisfies FilaDe<'proyectos'>;

const FACTURA = {
  ...METADATOS,
  id: 'f1',
  proyecto_id: 'p2',
  pago_id: 'pago-facturado',
  tipo: 'factura_c',
  ambiente: 'homologacion',
  estado: 'autorizada',
  punto_de_venta: 1,
  numero: 7,
  fecha: '2026-09-18',
  concepto: 1,
  importe_centavos: 45_000_000,
  moneda: 'ARS',
  detalle: 'Seña — Vanitory del baño',
  cuit_emisor: '20-11111111-2',
  emisor: {
    razonSocial: 'Eliseo Maun',
    nombreDelTaller: 'MAUN',
    domicilio: 'Calle Falsa 123, Rosario',
    cuit: '20-11111111-2',
    ingresosBrutos: '901-123456-7',
    inicioDeActividades: '2019-03-01',
  },
  receptor_nombre: 'Marcela Duarte',
  receptor_domicilio: '',
  receptor_condicion: 'consumidor_final',
  condicion_iva_receptor: 5,
  doc_tipo: 99,
  doc_nro: '0',
  asociado_id: null,
  cae: '86400944804384',
  cae_vence: '2026-09-28',
  autorizada_at: '2026-09-18T15:00:00Z',
  rechazo: null,
  intentos: 0,
  emitiendo_hasta: null,
  ultimo_error: null,
  pedida_at: '2026-09-18T14:59:00Z',
} satisfies FilaDe<'comprobantes'>;

function pago(id: string, extra: Partial<FilaDe<'pagos'>>) {
  return {
    ...METADATOS,
    id,
    proyecto_id: 'p',
    fecha: '2026-09-18',
    concepto: '',
    monto_centavos: 0,
    ya_en_la_apertura: false,
    moneda: 'ARS',
    cotizacion_centavos: null,
    tesoro_id: null,
    ...extra,
  } satisfies FilaDe<'pagos'>;
}

const COMPRA = {
  ...METADATOS,
  id: 'compra',
  fecha: '2026-09-28',
  tipo: 'cambio',
  desde_id: MAUN,
  hacia_id: DOLARES,
  monto_centavos: 72_500_000,
  monto_destino_centavos: 50_000,
  categoria: 'Oficial',
  descripcion: '',
  cubre_el_mes: null,
  proyecto_id: null,
  tesoro_origen: null,
  tesoro_destino: null,
} satisfies FilaDe<'movimientos'>;

function taller(): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.households = { h: { id: 'h', nombre: 'MAUN' } };
  let replica = { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
  replica = aplicarFilaLocal(replica, 'ajustes', AJUSTES);
  for (const uno of [
    tesoro(HOGAR, 'hogar', 'Hogar', 'hogar'),
    tesoro(MAUN, 'maun', 'Maun', 'maun'),
    tesoro(DIEZMO, 'diezmo', 'Diezmo', 'diezmo'),
    tesoro(COCOS, 'cocos', 'Cocos', 'cocos'),
    tesoro(FIJOS, null, 'Gastos fijos', 'grana'),
    tesoro(DOLARES, null, 'Dólares', 'grana', 'USD'),
  ]) {
    replica = aplicarFilaLocal(replica, 'tesoros', uno);
  }
  replica = aplicarFilaLocal(replica, 'clientes', CLIENTE);
  replica = aplicarFilaLocal(replica, 'proyectos', PROYECTO);
  replica = aplicarFilaLocal(
    replica,
    'pagos',
    pago('pago-pesos', {
      concepto: 'Seña de la visita',
      monto_centavos: 15_400_000,
      cotizacion_centavos: 154_000,
    }),
  );
  replica = aplicarFilaLocal(
    replica,
    'pagos',
    pago('pago-dolares', {
      fecha: '2026-09-20',
      concepto: 'Seña',
      monto_centavos: 100_000,
      moneda: 'USD',
      cotizacion_centavos: 154_000,
      tesoro_id: DOLARES,
    }),
  );
  replica = aplicarFilaLocal(replica, 'proyectos', EN_PESOS);
  replica = aplicarFilaLocal(
    replica,
    'pagos',
    pago('pago-facturado', { proyecto_id: 'p2', concepto: 'Seña', monto_centavos: 45_000_000 }),
  );
  replica = aplicarFilaLocal(replica, 'comprobantes', FACTURA);
  return aplicarFilaLocal(replica, 'movimientos', COMPRA);
}

function textosFueraDelCatalogo(raiz: HTMLElement): string[] {
  const conLetras = /\p{L}/u;
  const marcado = /[⟦⟧]/u;
  const afuera =
    '[translate="no"], [data-seudo], option, textarea, script, style, noscript, [hidden]';
  const sueltos: string[] = [];
  const caminante = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  for (let nodo = caminante.nextNode(); nodo !== null; nodo = caminante.nextNode()) {
    const texto = nodo.textContent ?? '';
    if (!conLetras.test(texto) || marcado.test(texto)) continue;
    if (nodo.parentElement?.closest(afuera) != null) continue;
    sueltos.push(texto.trim());
  }
  for (const elemento of raiz.querySelectorAll('[aria-label], [title], [placeholder], [alt]')) {
    if (elemento.closest('[translate="no"]') !== null) continue;
    for (const atributo of ['aria-label', 'title', 'placeholder', 'alt']) {
      const valor = elemento.getAttribute(atributo);
      if (valor !== null && conLetras.test(valor) && !marcado.test(valor)) {
        sueltos.push(`${atributo}=${valor}`);
      }
    }
  }
  return [...new Set(sueltos)];
}

function montar(ruta: string) {
  const { container } = render(
    <MemoryRouter initialEntries={[ruta]}>
      <QueryClientProvider client={new QueryClient()}>
        <ProveedorDeSesion
          sesion={{ usuarioId: 'u', email: 'taller@maun.com.ar', nombre: 'Eliseo Maun', foto: '' }}
        >
          <ProveedorDeReplica replica={taller()}>
            <Routes>
              <Route path="/" element={<InicioPage />} />
              <Route path="/finanzas" element={<FinanzasPage />} />
              <Route path="/ajustes" element={<AjustesPage />} />
              <Route path="/ajustes/facturacion" element={<FacturacionPage />} />
              <Route path="/ajustes/facturacion/conectar" element={<ConectarConArcaPage />} />
              <Route path="/proyectos/:id" element={<ProyectoFichaPage />} />
            </Routes>
          </ProveedorDeReplica>
        </ProveedorDeSesion>
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return container;
}

beforeAll(async () => {
  localStorage.setItem(CLAVE_DEL_SEUDOIDIOMA, 'activo');
  await usarIdioma('es', true);
});

afterAll(async () => {
  localStorage.removeItem(CLAVE_DEL_SEUDOIDIOMA);
  await usarIdioma('es');
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${HOY}T15:00:00`));
  onlineManager.setOnline(true);
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('con el seudoidioma, las pantallas principales', () => {
  it.each([
    ['Inicio', '/'],
    ['Finanzas', '/finanzas'],
    ['Ajustes', '/ajustes'],
    ['Ajustes › Facturación', '/ajustes/facturacion'],
    ['el asistente para conectar con ARCA', '/ajustes/facturacion/conectar'],
    ['la ficha de un trabajo en dólares', '/proyectos/p'],
    ['la ficha con un pago facturado', '/proyectos/p2'],
  ])('%s no tiene texto fuera del catálogo', (_pantalla, ruta) => {
    const raiz = montar(ruta);
    expect(raiz.textContent).toMatch(/[⟦⟧]/u);
    expect(textosFueraDelCatalogo(raiz)).toEqual([]);
  });
});

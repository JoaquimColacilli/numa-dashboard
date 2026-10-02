import { centavos, plata, puntosBasicos } from '@maun/domain';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FormasDeCobroDelTrabajo, Proyecto, ResumenDeProyecto } from '@/entities/proyecto';
import { CLAVE_DE_AJUSTES, ProveedorDeReplica, type EdicionDeAjustes } from '@/entities/replica';
import { TABLAS_REPLICADAS, type FilaDe, type Replica, type TablaReplicada } from '@/shared/api';
import { mensajes } from '@/shared/idioma';

import { ComoTePaga } from './ComoTePaga';

const {
  alMenosUna: AL_MENOS_UNA,
  nadaQueCobrar: NADA_QUE_COBRAR,
  sinDatosParaTransferir: SIN_DATOS_PARA_TRANSFERIR,
} = mensajes().compartirConElCliente.comoTePaga;

const AHORA = '2026-09-19T12:00:00Z';

const AJUSTES: FilaDe<'ajustes'> = {
  id: 'aj',
  household_id: 'h',
  sueldo_mensual_centavos: 0,
  costos_fijos_centavos: 0,
  meta_cocos_centavos: 0,
  tasa_cocos_anual_bp: 0,
  sueldo_tope_mensual: false,
  perdido_con_sueldo: false,
  perdido_con_diezmo: true,
  sena_bp: 5000,
  cobro_alias: 'maun.muebles',
  cobro_cbu: '',
  cobro_titular: '',
  cobro_cuit: '',
  cobro_link: '',
  cobro_dolares_cbu: '',
  cobro_dolares_alias: '',
  dolar_del_dia_centavos: null,
  dolar_del_dia_el: null,
  resena_link: '',
  instagram_link: '',
  facebook_link: '',
  tiktok_link: '',
  fila: null,
  fila_version: 0,
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
  created_at: AHORA,
  updated_at: AHORA,
  deleted_at: null,
  version: 1,
};

const PROYECTO: Proyecto = {
  id: 'p1',
  household_id: 'h',
  cliente_id: 'c1',
  titulo: 'Placard 3 puertas',
  descripcion: '',
  estado: 'en_curso',
  presupuesto_centavos: 100_000_000,
  forma_pago: null,
  cobro_sena: null,
  cobro_saldo: null,
  moneda: 'ARS',
  cobra_en: null,
  costos_cotizacion_centavos: null,
  comprobante: 'sin_comprobante',
  fecha_visita: null,
  ultimo_contacto: null,
  fecha_inicio: null,
  entrega_estimada: null,
  fecha_entrega: null,
  direccion_entrega: '',
  notas: '',
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
  vencimiento_presupuesto: null,
  presupuesto_diseno: false,
  presupuesto_despiece: false,
  presupuesto_cotizacion: false,
  presupuesto_pdf: false,
  visita_hecha: false,
  visita_importante: false,
  entrega_importante: false,
  presupuesto_importante: false,
  sena_bp: null,
  costo_madera_centavos: null,
  costo_herrajes_centavos: null,
  costo_flete_centavos: null,
  costo_ayudante_centavos: null,
  entrega_hora: null,
  visita_hora: null,
  created_at: AHORA,
  updated_at: AHORA,
  deleted_at: null,
  version: 3,
};

function resumen(proyecto: Partial<Proyecto> = {}, cobrado = 0): ResumenDeProyecto {
  const fila = { ...PROYECTO, ...proyecto };
  return {
    proyecto: fila,
    cliente: undefined,
    nombreDelCliente: 'Marcela Duarte',
    fase: 'activos',
    moneda: 'ARS',
    precio: plata('ARS', fila.presupuesto_centavos ?? 0),
    cobradoEnSuMoneda: plata('ARS', cobrado),
    cobradoEnPesos: centavos(cobrado),
    enMaun: centavos(cobrado),
    enDolares: [],
    gastos: centavos(0),
    saldo: plata('ARS', (fila.presupuesto_centavos ?? 0) - cobrado),
    entrega: { fecha: null, comprometida: false, franja: null, listo: null },
    urgencia: undefined,
  };
}

function conLosAjustes(cambios: Partial<FilaDe<'ajustes'>> = {}): Replica {
  const tablas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) tablas[tabla] = {};
  tablas.ajustes = { aj: { ...AJUSTES, ...cambios } };
  return { usuarioId: 'u1', cursor: '', reconciliadoEn: '', tablas } as unknown as Replica;
}

function montar(datos: ResumenDeProyecto, replica: Replica = conLosAjustes()) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ProveedorDeReplica replica={replica}>
          <ComoTePaga resumen={datos} />
        </ProveedorDeReplica>
      </QueryClientProvider>
    </MemoryRouter>,
  );
  const mutaciones = () => queryClient.getMutationCache().getAll();
  const deLosAjustes = (clave: unknown) =>
    JSON.stringify(clave) === JSON.stringify(CLAVE_DE_AJUSTES);
  return {
    loGuardado: (): FormasDeCobroDelTrabajo[] =>
      mutaciones()
        .filter((mutacion) => !deLosAjustes(mutacion.options.mutationKey))
        .map((mutacion) => mutacion.state.variables as FormasDeCobroDelTrabajo),
    loGuardadoEnLosAjustes: (): EdicionDeAjustes[] =>
      mutaciones()
        .filter((mutacion) => deLosAjustes(mutacion.options.mutationKey))
        .map((mutacion) => mutacion.state.variables as EdicionDeAjustes),
  };
}

function enDolares(proyecto: Partial<Proyecto> = {}): ResumenDeProyecto {
  const base = resumen({ moneda: 'USD', presupuesto_centavos: 200_000, ...proyecto });
  return {
    ...base,
    moneda: 'USD',
    precio: plata('USD', 200_000),
    cobradoEnSuMoneda: plata('USD', 0),
    saldo: plata('USD', 200_000),
  };
}

function fila(nombre: string) {
  return screen.getByRole('group', { name: `${nombre}: cómo te la paga` });
}

describe('cómo te paga', () => {
  it('con la seña pendiente ofrece las dos filas', () => {
    montar(resumen());

    expect(fila('La seña')).toBeInTheDocument();
    expect(fila('El saldo')).toBeInTheDocument();
  });

  it('con la seña cubierta solo queda el saldo', () => {
    montar(resumen({}, 60_000_000));

    expect(screen.queryByRole('group', { name: 'La seña: cómo te la paga' })).toBeNull();
    expect(fila('El saldo')).toBeInTheDocument();
  });

  it('saldado no ofrece nada y lo dice', () => {
    montar(resumen({}, 100_000_000));

    expect(screen.queryByRole('group', { name: /cómo te la paga/ })).toBeNull();
    expect(screen.getByText(NADA_QUE_COBRAR)).toBeInTheDocument();
  });

  it('sin nada guardado y con alias cargado, las dos formas vienen prendidas', () => {
    montar(resumen());

    for (const forma of ['Transferencia', 'Efectivo']) {
      expect(within(fila('La seña')).getByRole('checkbox', { name: forma })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    }
  });

  it('sin datos para transferir en Ajustes, solo efectivo y una línea que lleva a cargarlos', () => {
    montar(resumen(), conLosAjustes({ cobro_alias: '', cobro_cbu: '' }));

    expect(
      within(fila('La seña')).getByRole('checkbox', { name: 'Transferencia' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(within(fila('La seña')).getByRole('checkbox', { name: 'Efectivo' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByText(SIN_DATOS_PARA_TRANSFERIR)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cargalos en Ajustes' })).toHaveAttribute(
      'href',
      '/ajustes',
    );
  });

  it('con los datos cargados, esa línea no está', () => {
    montar(resumen());

    expect(screen.queryByText(SIN_DATOS_PARA_TRANSFERIR)).toBeNull();
  });

  it('apagar una de las dos guarda la otra sola, por su columna, con la versión que vio', () => {
    const { loGuardado } = montar(resumen());

    fireEvent.click(within(fila('La seña')).getByRole('checkbox', { name: 'Efectivo' }));

    expect(loGuardado()).toEqual([
      {
        id: 'p1',
        cambios: { cobro_sena: ['transferencia'] },
        previos: { cobro_sena: null, cobro_saldo: null },
        version: 3,
      },
    ]);
  });

  it('la seña por transferencia y el saldo en efectivo: cada instancia toca su columna', () => {
    const { loGuardado } = montar(
      resumen({
        cobro_sena: ['transferencia'],
        cobro_saldo: ['transferencia', 'efectivo'],
      }),
    );

    fireEvent.click(within(fila('El saldo')).getByRole('checkbox', { name: 'Transferencia' }));

    expect(loGuardado().at(-1)?.cambios).toEqual({ cobro_saldo: ['efectivo'] });
  });

  it('prender la que faltaba deja las dos, siempre en el mismo orden', () => {
    const { loGuardado } = montar(resumen({ cobro_sena: ['efectivo'] }));

    fireEvent.click(within(fila('La seña')).getByRole('checkbox', { name: 'Transferencia' }));

    expect(loGuardado().at(-1)?.cambios).toEqual({ cobro_sena: ['transferencia', 'efectivo'] });
  });

  it('no se puede dejar un pago sin ninguna forma: no guarda y lo explica', () => {
    const { loGuardado } = montar(resumen({ cobro_sena: ['efectivo'] }));

    fireEvent.click(within(fila('La seña')).getByRole('checkbox', { name: 'Efectivo' }));

    expect(loGuardado()).toEqual([]);
    expect(screen.getByRole('alert')).toHaveTextContent(AL_MENOS_UNA);
    expect(within(fila('La seña')).getByRole('checkbox', { name: 'Efectivo' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('el porcentaje de seña del trabajo pisa al del taller para decidir qué falta', () => {
    montar(resumen({ sena_bp: puntosBasicos(2000) }, 25_000_000));

    expect(screen.queryByRole('group', { name: 'La seña: cómo te la paga' })).toBeNull();
    expect(fila('El saldo')).toBeInTheDocument();
  });
});

function tePagaEn(nombre: string): HTMLElement {
  return within(screen.getByRole('group', { name: 'Te paga en' })).getByRole('radio', {
    name: nombre,
  });
}

function enUnRenglon(elemento: HTMLElement): string {
  return elemento.textContent.replace(/\s+/g, ' ');
}

describe('en qué te paga', () => {
  it('sin elegir paga en pesos, y elegir otra moneda la guarda con las formas, con la versión que vio', () => {
    const { loGuardado } = montar(resumen());

    expect(tePagaEn('Pesos')).toBeChecked();
    fireEvent.click(tePagaEn('Dólares'));

    expect(loGuardado()).toEqual([
      { id: 'p1', cambios: { cobra_en: ['USD'] }, previos: { cobra_en: null }, version: 3 },
    ]);
  });

  it('tocar la que ya está elegida no guarda nada, y las dos se leen como «Pesos o dólares»', () => {
    const { loGuardado } = montar(resumen({ cobra_en: ['ARS', 'USD'] }));

    expect(tePagaEn('Pesos o dólares')).toBeChecked();
    fireEvent.click(tePagaEn('Pesos o dólares'));
    expect(loGuardado()).toEqual([]);

    fireEvent.click(tePagaEn('Pesos'));
    expect(loGuardado()).toEqual([
      {
        id: 'p1',
        cambios: { cobra_en: ['ARS'] },
        previos: { cobra_en: ['ARS', 'USD'] },
        version: 3,
      },
    ]);
  });

  it('saldado no pregunta en qué te paga', () => {
    montar(resumen({}, 100_000_000));

    expect(screen.queryByRole('group', { name: 'Te paga en' })).toBeNull();
  });

  it('si acepta dólares y el taller no tiene cuenta en dólares, lo dice y lleva a Ajustes', () => {
    montar(resumen({ cobra_en: ['USD'] }));

    const aviso = screen.getByText(/Para recibir dólares por transferencia/u);
    expect(enUnRenglon(aviso)).toBe(
      'Para recibir dólares por transferencia, cargá tu cuenta en dólares en Ajustes.',
    );
    expect(
      screen.getByRole('link', { name: 'cargá tu cuenta en dólares en Ajustes' }),
    ).toHaveAttribute('href', '/ajustes');
    expect(screen.queryByText(SIN_DATOS_PARA_TRANSFERIR)).toBeNull();
    expect(
      within(fila('La seña')).getByRole('checkbox', { name: 'Transferencia' }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('con la cuenta en dólares cargada no avisa, y la transferencia viene prendida', () => {
    montar(resumen({ cobra_en: ['USD'] }), conLosAjustes({ cobro_dolares_alias: 'maun.dolares' }));

    expect(screen.queryByText(/Para recibir dólares por transferencia/u)).toBeNull();
    expect(
      within(fila('La seña')).getByRole('checkbox', { name: 'Transferencia' }),
    ).toHaveAttribute('aria-checked', 'true');
  });

  it('en pesos o dólares avisa de cada cuenta que falte', () => {
    montar(resumen({ cobra_en: ['ARS', 'USD'] }), conLosAjustes({ cobro_alias: '' }));

    expect(screen.getByText(SIN_DATOS_PARA_TRANSFERIR)).toBeInTheDocument();
    expect(screen.getByText(/Para recibir dólares por transferencia/u)).toBeInTheDocument();
  });
});

describe('el dólar del día, en un trabajo en dólares', () => {
  const DOLAR_DEL_DIA = 'Dólar del día (para todos tus trabajos)';

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(new Date('2026-09-19T15:00:00-03:00'));
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('un trabajo en pesos no lo pide', () => {
    montar(resumen());

    expect(screen.queryByRole('textbox', { name: DOLAR_DEL_DIA })).toBeNull();
  });

  it('muestra el que hay y para qué día vale', () => {
    montar(
      enDolares(),
      conLosAjustes({ dolar_del_dia_centavos: 145_000, dolar_del_dia_el: '2026-09-18' }),
    );

    const campo = screen.getByRole('textbox', { name: DOLAR_DEL_DIA });
    expect(campo).toHaveValue('1.450');
    expect(campo).toHaveAccessibleDescription(
      'Vale para el 18 de septiembre. Cargalo con la regla de tu presupuesto. Tus clientes ven cuántos pesos son hoy solo si lo cargaste hoy.',
    );
  });

  it('cambiarlo lo guarda en los ajustes con la fecha de hoy, después de una pausa', () => {
    const { loGuardadoEnLosAjustes } = montar(
      enDolares(),
      conLosAjustes({ dolar_del_dia_centavos: 145_000, dolar_del_dia_el: '2026-09-18' }),
    );

    const campo = screen.getByRole('textbox', { name: DOLAR_DEL_DIA });
    fireEvent.change(campo, { target: { value: '1.500' } });
    expect(campo).toHaveAccessibleDescription(/^Vale para hoy\./u);
    expect(loGuardadoEnLosAjustes()).toEqual([]);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(loGuardadoEnLosAjustes()).toEqual([
      {
        id: 'aj',
        cambios: { dolar_del_dia_centavos: 150_000, dolar_del_dia_el: '2026-09-19' },
        previos: { dolar_del_dia_centavos: 145_000, dolar_del_dia_el: '2026-09-18' },
      },
    ]);
  });

  it('uno fuera de rango no se guarda y lo explica', () => {
    const { loGuardadoEnLosAjustes } = montar(enDolares());

    const campo = screen.getByRole('textbox', { name: DOLAR_DEL_DIA });
    fireEvent.change(campo, { target: { value: '0,50' } });
    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(loGuardadoEnLosAjustes()).toEqual([]);
    expect(campo).toHaveAttribute('aria-invalid', 'true');
  });
});

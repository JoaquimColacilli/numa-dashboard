import { describe, expect, it } from 'vitest';

import type { FilaDe } from '@/shared/api';

import { cambiaElReparto } from './ajustes';

const AJUSTES = {
  sueldo_mensual_centavos: 180_000_000,
  costos_fijos_centavos: 25_000_000,
  sueldo_tope_mensual: true,
  perdido_con_sueldo: false,
  perdido_con_diezmo: true,
  sena_bp: 5000,
  fila: null,
  fila_version: 3,
} as unknown as FilaDe<'ajustes'>;

const CON_FILA = {
  ...AJUSTES,
  fila: { pasos: [], reparto: [], sueldoPorTrabajo: false },
} as unknown as FilaDe<'ajustes'>;

describe('la revisión de la fila que sube la fila optimista de Ajustes', () => {
  it('sin fila guardada, el sueldo y los costos fijos arman la fila de siempre: cambiarlos la cambia', () => {
    expect(cambiaElReparto(AJUSTES, { sueldo_mensual_centavos: 200_000_000 })).toBe(true);
    expect(cambiaElReparto(AJUSTES, { costos_fijos_centavos: 0 })).toBe(true);
  });

  it('con fila guardada, el sueldo de Ajustes ya no reparte nada', () => {
    expect(cambiaElReparto(CON_FILA, { sueldo_mensual_centavos: 200_000_000 })).toBe(false);
  });

  it('con o sin fila, lo del perdido cambia el reparto', () => {
    expect(cambiaElReparto(AJUSTES, { perdido_con_sueldo: true })).toBe(true);
    expect(cambiaElReparto(CON_FILA, { perdido_con_diezmo: false })).toBe(true);
  });

  it('mandar lo mismo, o cambiar otra cosa, no sube nada', () => {
    expect(cambiaElReparto(AJUSTES, { sueldo_mensual_centavos: 180_000_000 })).toBe(false);
    expect(cambiaElReparto(AJUSTES, { sena_bp: 3000 })).toBe(false);
    expect(cambiaElReparto(AJUSTES, {})).toBe(false);
  });

  it('una fila guardada antes de las columnas de la fila cuenta como sin fila', () => {
    const vieja = { ...AJUSTES } as Partial<FilaDe<'ajustes'>>;
    delete vieja.fila;
    expect(cambiaElReparto(vieja as FilaDe<'ajustes'>, { costos_fijos_centavos: 1 })).toBe(true);
  });
});

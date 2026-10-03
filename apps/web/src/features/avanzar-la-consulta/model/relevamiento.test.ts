import { describe, expect, it } from 'vitest';

import type { Proyecto, ValorDelPago } from '@/entities/proyecto';

import { conceptoDeLaSena } from './contacto';
import {
  cambiosAlPasarAPresupuestar,
  conElPagoDeLaVisita,
  conOtroDia,
  conOtroVencimiento,
  errorDelDia,
  erroresDelPagoDeLaVisita,
  pagoAntesDePresupuestar,
  pasoDelRelevamiento,
  valorDelPagoDeLaVisita,
  valoresDelRelevamiento,
} from './relevamiento';

const HOY = '2026-09-14';
const EN_PESOS = { moneda: 'ARS', cotizacion_centavos: null, tesoro_id: null } as const;

function contacto(fechaVisita: string | null): Proyecto {
  return { estado: 'relevamiento', fecha_visita: fechaVisita } as unknown as Proyecto;
}

function enPesos(monto: number | null): ValorDelPago {
  return { moneda: 'ARS', monto, cotizacion: null, tesoroId: null };
}

describe('el formulario de «Ya fui a relevar»', () => {
  it('arranca con el día de la visita si ya pasó, y con hoy si era para más adelante', () => {
    expect(valoresDelRelevamiento(contacto('2026-09-10'), HOY)).toEqual({
      dia: '2026-09-10',
      vencimiento: '2026-09-17',
      vencimientoAMano: false,
      pago: null,
      monedaDelPago: 'ARS',
      cotizacionDelPago: null,
      tesoroDelPago: null,
      pagoEnLaApertura: true,
    });
    expect(valoresDelRelevamiento(contacto('2026-09-18'), HOY).dia).toBe(HOY);
    expect(valoresDelRelevamiento(contacto(null), HOY)).toMatchObject({
      dia: HOY,
      vencimiento: '2026-09-21',
    });
  });

  it('cambiar el día corre el vencimiento hasta que se lo toca a mano', () => {
    const iniciales = valoresDelRelevamiento(contacto('2026-09-10'), HOY);
    const otroDia = conOtroDia(iniciales, '2026-09-07', HOY);
    expect(otroDia).toMatchObject({ dia: '2026-09-07', vencimiento: '2026-09-14' });

    const prometido = conOtroVencimiento(otroDia, '2026-09-25');
    expect(conOtroDia(prometido, '2026-09-11', HOY)).toMatchObject({
      dia: '2026-09-11',
      vencimiento: '2026-09-25',
      vencimientoAMano: true,
    });
  });

  it('un día a medio escribir o que todavía no llegó no mueve el vencimiento y no se puede anotar', () => {
    const iniciales = valoresDelRelevamiento(contacto('2026-09-10'), HOY);
    expect(conOtroDia(iniciales, '', HOY).vencimiento).toBe('2026-09-17');
    expect(conOtroDia(iniciales, '2026-09-20', HOY).vencimiento).toBe('2026-09-17');

    expect(errorDelDia({ ...iniciales, dia: '' }, HOY)).toBe('Poné el día que fuiste a relevar.');
    expect(errorDelDia({ ...iniciales, dia: '2026-09-20' }, HOY)).toMatch(/todavía no llegó/);
    expect(errorDelDia(iniciales, HOY)).toBeUndefined();
  });

  it('anotarlo pasa a presupuestar con el día, la visita hecha y el vencimiento, y la seña si la escribió', () => {
    const iniciales = valoresDelRelevamiento(contacto('2026-09-10'), HOY);
    expect(pasoDelRelevamiento(iniciales, 'pago')).toEqual({
      cambios: {
        estado: 'a_presupuestar',
        fecha_visita: '2026-09-10',
        visita_hecha: true,
        vencimiento_presupuesto: '2026-09-17',
      },
      pagos: [],
    });

    const conPago = pasoDelRelevamiento({ ...iniciales, pago: 3_000_000, vencimiento: '' }, 'pago');
    expect(conPago.cambios.vencimiento_presupuesto).toBeNull();
    expect(conPago.pagos).toEqual([
      {
        id: 'pago',
        fecha: '2026-09-10',
        concepto: conceptoDeLaSena(),
        monto_centavos: 3_000_000,
        ya_en_la_apertura: false,
        ...EN_PESOS,
      },
    ]);
  });

  it('una seña de una visita anterior a la apertura queda marcada, salvo que la destilde', () => {
    const antes = { ...valoresDelRelevamiento(contacto('2026-07-20'), HOY), pago: 3_000_000 };
    expect(pasoDelRelevamiento(antes, 'pago', '2026-09-14').pagos[0]).toMatchObject({
      fecha: '2026-07-20',
      ya_en_la_apertura: true,
    });
    expect(
      pasoDelRelevamiento({ ...antes, pagoEnLaApertura: false }, 'pago', '2026-09-14').pagos[0],
    ).toMatchObject({ ya_en_la_apertura: false });
    expect(pasoDelRelevamiento(antes, 'pago', null).pagos[0]).toMatchObject({
      ya_en_la_apertura: false,
    });
  });

  it('pasar a presupuestar desde el estimativo, con la visita ya pasada, la deja hecha; sin visita o con la visita por venir, no', () => {
    expect(cambiosAlPasarAPresupuestar(contacto('2026-09-10'), HOY)).toEqual({
      estado: 'a_presupuestar',
      visita_hecha: true,
    });
    expect(cambiosAlPasarAPresupuestar(contacto(HOY), HOY)).toMatchObject({ visita_hecha: true });
    expect(cambiosAlPasarAPresupuestar(contacto('2026-09-20'), HOY)).toEqual({
      estado: 'a_presupuestar',
    });
    expect(cambiosAlPasarAPresupuestar(contacto(null), HOY)).toEqual({ estado: 'a_presupuestar' });
  });

  it('pasar a presupuestar desde el estimativo lleva el pago con el día que se eligió, y cero es no tener pago', () => {
    expect(pagoAntesDePresupuestar(enPesos(null), 'p', HOY)).toEqual([]);
    expect(pagoAntesDePresupuestar(enPesos(0), 'p', HOY)).toEqual([]);
    expect(pagoAntesDePresupuestar(enPesos(2_000_000), 'p', '2026-09-12')).toEqual([
      {
        id: 'p',
        fecha: '2026-09-12',
        concepto: conceptoDeLaSena(),
        monto_centavos: 2_000_000,
        ya_en_la_apertura: false,
        ...EN_PESOS,
      },
    ]);
    expect(pagoAntesDePresupuestar(enPesos(2_000_000), 'p', '2026-07-12', true)[0]).toMatchObject({
      ya_en_la_apertura: true,
    });
  });
});

describe('el pago de la visita en un trabajo en dólares', () => {
  const DOLAR_DEL_DIA = { valor: 154_000, fecha: '2026-09-10' };
  const DOLARES = { id: 'usd', nombre: 'Dólares' };

  function enDolares(cobraEn: string[]): Proyecto {
    return {
      estado: 'relevamiento',
      fecha_visita: '2026-09-10',
      moneda: 'USD',
      cobra_en: cobraEn,
    } as unknown as Proyecto;
  }

  it('la visita se paga en pesos y viene con el dólar del día si es el del día del pago', () => {
    const valores = valoresDelRelevamiento(enDolares(['ARS']), HOY, {
      tesorosEnDolares: [DOLARES],
      dolarDelDia: DOLAR_DEL_DIA,
    });

    expect(valores).toMatchObject({
      dia: '2026-09-10',
      monedaDelPago: 'ARS',
      cotizacionDelPago: 154_000,
      tesoroDelPago: null,
    });
    expect(
      pasoDelRelevamiento({ ...valores, pago: 12_000_000 }, 'pago', null, 'USD').pagos,
    ).toEqual([
      {
        id: 'pago',
        fecha: '2026-09-10',
        concepto: conceptoDeLaSena(),
        monto_centavos: 12_000_000,
        ya_en_la_apertura: false,
        moneda: 'ARS',
        cotizacion_centavos: 154_000,
        tesoro_id: null,
      },
    ]);
  });

  it('con el dólar del día de otro día lo pide, y sin él no se anota', () => {
    const valores = valoresDelRelevamiento(enDolares(['ARS']), HOY, {
      tesorosEnDolares: [DOLARES],
      dolarDelDia: { ...DOLAR_DEL_DIA, fecha: HOY },
    });

    expect(valores.cotizacionDelPago).toBeNull();
    expect(erroresDelPagoDeLaVisita(valores, 'USD', [DOLARES])).toEqual({});
    expect(erroresDelPagoDeLaVisita({ ...valores, pago: 12_000_000 }, 'USD', [DOLARES])).toEqual({
      cotizacion: '¿A cuánto se tomó?',
    });
    expect(
      erroresDelPagoDeLaVisita(
        { ...valores, pago: 12_000_000, cotizacionDelPago: 150_000 },
        'USD',
        [DOLARES],
      ),
    ).toEqual({});
  });

  it('pagada en dólares entra al tesoro en dólares, con a cuánto se cuenta cada dólar', () => {
    const valores = valoresDelRelevamiento(enDolares(['USD']), HOY, {
      tesorosEnDolares: [DOLARES],
      dolarDelDia: DOLAR_DEL_DIA,
    });
    expect(valores).toMatchObject({ monedaDelPago: 'USD', tesoroDelPago: 'usd' });

    const pagado = conElPagoDeLaVisita(valores, {
      ...valorDelPagoDeLaVisita(valores),
      monto: 8_000,
      cotizacion: 150_000,
    });
    expect(pasoDelRelevamiento(pagado, 'pago', null, 'USD').pagos[0]).toMatchObject({
      monto_centavos: 8_000,
      moneda: 'USD',
      cotizacion_centavos: 150_000,
      tesoro_id: 'usd',
    });
  });

  it('pasar a presupuestar desde el estimativo también lleva la moneda, el dólar y el tesoro', () => {
    expect(
      pagoAntesDePresupuestar(
        { moneda: 'USD', monto: 8_000, cotizacion: 150_000, tesoroId: 'usd' },
        'p',
        HOY,
        false,
        'ARS',
      ),
    ).toEqual([
      {
        id: 'p',
        fecha: HOY,
        concepto: conceptoDeLaSena(),
        monto_centavos: 8_000,
        ya_en_la_apertura: false,
        moneda: 'USD',
        cotizacion_centavos: 150_000,
        tesoro_id: 'usd',
      },
    ]);
  });
});

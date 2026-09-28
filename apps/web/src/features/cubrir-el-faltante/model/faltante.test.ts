import {
  centavos,
  type FilaDelMes,
  type PasoDelMes,
  type VencimientoDeLaAgenda,
} from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  conArticulo,
  faltantesDeLosCompromisos,
  fraseDelFaltante,
  rangoDelFaltante,
} from './faltante';

const FIJOS = '01900000-0000-7000-8000-000000000005';
const ALQUILER = '01900000-0000-7000-8000-000000000006';
const STOCK = '01900000-0000-7000-8000-000000000007';

function paso(extra: Partial<PasoDelMes> & Pick<PasoDelMes, 'tesoro'>): PasoDelMes {
  return {
    clase: 'fijos',
    tipo: 'compromiso',
    modo: 'mes',
    objetivo: centavos(900_000),
    recibido: centavos(0),
    cubierto: centavos(0),
    lleva: centavos(0),
    falta: centavos(900_000),
    completo: false,
    aPagar: centavos(0),
    vencimientos: [],
    meta: null,
    ...extra,
  };
}

function delMes(pasos: PasoDelMes[]): FilaDelMes {
  return {
    mes: '2026-09',
    cobros: 0,
    ingreso: centavos(0),
    diezmo: centavos(0),
    apartado: centavos(0),
    obligaciones: [],
    pasos,
    reparto: [],
    superavit: { tesoro: 'maun', recibido: centavos(0) },
    enElTaller: centavos(0),
    repartoEmpezo: false,
  };
}

function vencimiento(
  tesoro: string,
  renglon: string,
  fecha: string,
  pagado = false,
): VencimientoDeLaAgenda {
  return {
    id: `vencimiento:${tesoro}:0:${fecha}`,
    tesoro,
    nombreDelTesoro: 'Alquiler',
    renglon,
    monto: centavos(50_000_000),
    fecha,
    pagado,
  };
}

describe('el faltante de los compromisos', () => {
  const MES = delMes([
    paso({ tesoro: FIJOS, falta: centavos(20_000_000) }),
    paso({
      tesoro: ALQUILER,
      modo: 'saldo',
      lleva: centavos(63_000_000),
      falta: centavos(27_000_000),
    }),
    paso({ tesoro: STOCK, clase: 'prioridad', tipo: 'ahorro-fijo', falta: centavos(1_000) }),
    paso({ tesoro: 'completo', falta: centavos(0), completo: true }),
  ]);

  it('mira los que se llenan por mes y los que se renuevan al pagar, no los ahorros', () => {
    expect(
      faltantesDeLosCompromisos(MES, [], '2026-09-05').map((uno) => [
        uno.tesoro,
        uno.modo,
        uno.falta,
      ]),
    ).toEqual([
      [FIJOS, 'mes', 20_000_000],
      [ALQUILER, 'saldo', 27_000_000],
    ]);
  });

  it('nombra el primer renglón sin pagar que vence en los próximos 7 días', () => {
    const vencimientos = [
      vencimiento(ALQUILER, 'Luz', '2026-09-20'),
      vencimiento(ALQUILER, 'Alquiler', '2026-09-10'),
      vencimiento(ALQUILER, 'Expensas', '2026-09-08', true),
      vencimiento(FIJOS, 'Seguro', '2026-09-01'),
    ];
    const [fijos, alquiler] = faltantesDeLosCompromisos(MES, vencimientos, '2026-09-05');
    expect(fijos?.vence).toBeNull();
    expect(alquiler?.vence?.renglon).toBe('Alquiler');
    expect(rangoDelFaltante('2026-09-28')).toEqual({ desde: '2026-09-28', hasta: '2026-10-05' });
  });

  it('lo dice con sus palabras', () => {
    expect(
      fraseDelFaltante(
        {
          nombre: 'alquiler',
          modo: 'saldo',
          falta: centavos(27_000_000),
          vence: { renglon: 'Alquiler', fecha: '2026-09-10' },
        },
        '2026-09',
      ).replace(/\s/g, ' '),
    ).toBe('Vence el alquiler el 10 y faltan $ 270.000.');
    expect(
      fraseDelFaltante(
        { nombre: 'gastos fijos', modo: 'mes', falta: centavos(20_000_000), vence: null },
        '2026-09',
      ).replace(/\s/g, ' '),
    ).toBe('Faltan $ 200.000 para gastos fijos de septiembre.');
    expect(
      fraseDelFaltante(
        { nombre: 'alquiler', modo: 'saldo', falta: centavos(27_000_000), vence: null },
        '2026-09',
      ).replace(/\s/g, ' '),
    ).toBe('Faltan $ 270.000 para alquiler.');
  });

  it('pone el artículo que corresponde al renglón', () => {
    expect(conArticulo('Alquiler')).toBe('el alquiler');
    expect(conArticulo('Luz')).toBe('la luz');
    expect(conArticulo('Gas')).toBe('el gas');
    expect(conArticulo('Expensas')).toBe('las expensas');
    expect(conArticulo('Sueldos')).toBe('los sueldos');
    expect(conArticulo('Cuota del auto')).toBe('la cuota del auto');
    expect(conArticulo('Comisiones')).toBe('las comisiones');
    expect(conArticulo('Agua')).toBe('el agua');
    expect(conArticulo('ABL')).toBe('el ABL');
  });
});

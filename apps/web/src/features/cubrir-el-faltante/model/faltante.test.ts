import {
  centavos,
  type FilaDelMes,
  type PasoDelMes,
  type VencimientoDeLaAgenda,
} from '@maun/domain';
import { describe, expect, it } from 'vitest';

import { faltantesDeLosCompromisos, fraseDelFaltante, rangoDelFaltante } from './faltante';

const FIJOS = '01900000-0000-7000-8000-000000000005';
const ALQUILER = '01900000-0000-7000-8000-000000000006';
const STOCK = '01900000-0000-7000-8000-000000000007';

function paso(extra: Partial<PasoDelMes> & Pick<PasoDelMes, 'tesoro'>): PasoDelMes {
  return {
    clase: 'fijos',
    tipo: 'compromiso',
    modo: 'mes',
    objetivo: centavos(900_000),
    ciclo: null,
    recibido: centavos(0),
    cubierto: centavos(0),
    lleva: centavos(0),
    falta: centavos(900_000),
    completo: false,
    aPagar: centavos(0),
    vencimientos: [],
    vencimiento: null,
    ultimoPago: null,
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
  renglon: string | null,
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
    pagoSolo: null,
  };
}

function delCiclo(
  tesoro: string,
  fecha: string,
  pagaSola: boolean,
  pusoMaun: number,
): Pick<PasoDelMes, 'tesoro' | 'ciclo' | 'vencimiento'> {
  return {
    tesoro,
    ciclo: { desde: '2026-09-10', hasta: fecha },
    vencimiento: {
      fecha,
      pagaSola,
      tope: centavos(90_000_000),
      pagado: centavos(0),
      saldo: centavos(90_000_000 - pusoMaun),
      pago: null,
      aPagar: centavos(90_000_000),
      pusoMaun: centavos(pusoMaun),
      vuelveAMaun: centavos(0),
    },
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

  it('un compromiso con día de pago falta por lo que pondría Maun, solo si vence en los próximos 7 días', () => {
    const conDia = delMes([
      paso({ ...delCiclo(ALQUILER, '2026-10-10', true, 27_000_000), falta: centavos(27_000_000) }),
      paso({ ...delCiclo(FIJOS, '2026-10-10', false, 0), falta: centavos(0) }),
      paso({ ...delCiclo(STOCK, '2026-10-30', true, 5_000_000), falta: centavos(5_000_000) }),
    ]);
    const vencimientos = [
      vencimiento(ALQUILER, null, '2026-10-10'),
      vencimiento(FIJOS, null, '2026-10-10'),
      vencimiento(STOCK, null, '2026-10-30'),
    ];
    expect(faltantesDeLosCompromisos(conDia, vencimientos, '2026-10-05')).toEqual([
      {
        tesoro: ALQUILER,
        modo: 'mes',
        falta: 27_000_000,
        vence: vencimientos[0],
        pagaSola: true,
      },
    ]);
    expect(faltantesDeLosCompromisos(conDia, [], '2026-10-05')).toEqual([]);
  });

  it('la frase de una deuda que se paga sola dice que el día de pago lo que falta lo pone Maun', () => {
    expect(
      fraseDelFaltante(
        {
          nombre: 'alquiler',
          modo: 'mes',
          falta: centavos(27_000_000),
          vence: { renglon: null, fecha: '2026-10-10' },
          pagaSola: true,
          maun: 'Maun',
        },
        '2026-10',
      ).replace(/\s/g, ' '),
    ).toBe('El 10 se paga el alquiler y faltan $ 270.000. Si no entra más plata, los pone Maun.');
    expect(
      fraseDelFaltante(
        {
          nombre: 'alquiler',
          modo: 'mes',
          falta: centavos(27_000_000),
          vence: { renglon: null, fecha: '2026-10-10' },
          pagaSola: false,
          maun: 'Maun',
        },
        '2026-10',
      ).replace(/\s/g, ' '),
    ).toBe('Vence el alquiler el 10 y faltan $ 270.000.');
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
});

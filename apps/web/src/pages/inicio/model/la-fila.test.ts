import {
  centavos,
  enPesos,
  puntosBasicos,
  tipoDelPaso,
  type FilaDelMes,
  type ObligacionDelMes,
  type ParteDelMes,
  type PasoDelMes,
  type VencimientoDeLaAgenda,
} from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { TesoroDelTaller } from '@/entities/tesoro';

import {
  cuantoLleva,
  faltaParaLosTopes,
  faltantesEnInicio,
  fraseDeLoQueSobra,
  fraseDeLosDiasQueQuedan,
  ingresoDelMes,
  nombreEnLaFrase,
  obligacionesEnInicio,
  pasosEnInicio,
  textoDeLaObligacion,
  textoDelEstado,
} from './la-fila';

function llano(texto: string): string {
  return texto.replace(/\s/g, ' ');
}

function tesoro(
  id: string,
  clave: TesoroDelTaller['clave'],
  nombre: string,
  tinta: TesoroDelTaller['tinta'],
): TesoroDelTaller {
  return {
    id,
    clave,
    moneda: 'ARS',
    nombre,
    descripcion: '',
    tinta,
    icono: 'vault',
    meta: null,
    rindeAnualBp: null,
    orden: 0,
    archivado: false,
    saldo: enPesos(centavos(0)),
  };
}

const TESOROS = [
  tesoro('hogar', 'hogar', 'Hogar', 'hogar'),
  tesoro('maun', 'maun', 'Maun', 'maun'),
  tesoro('diezmo', 'diezmo', 'Diezmo', 'diezmo'),
  tesoro('cocos', 'cocos', 'Cocos', 'cocos'),
  tesoro('iibb', null, 'Ingresos Brutos', 'petroleo'),
  tesoro('fijos', null, 'Gastos fijos', 'grana'),
  tesoro('materiales', null, 'Materiales', 'mostaza'),
  tesoro('inmuebles', null, 'Inmuebles', 'ciruela'),
  tesoro('superavit', null, 'Superávit', 'petroleo'),
];

function paso(
  tesoroId: string,
  clase: PasoDelMes['clase'],
  objetivo: number,
  recibido: number,
  extra: Partial<PasoDelMes> = {},
): PasoDelMes {
  const falta = Math.max(0, objetivo - recibido);
  return {
    tesoro: tesoroId,
    clase,
    tipo: tipoDelPaso(clase),
    modo: 'mes',
    objetivo: centavos(objetivo),
    recibido: centavos(recibido),
    cubierto: centavos(0),
    lleva: centavos(recibido),
    falta: centavos(falta),
    completo: falta === 0,
    aPagar: null,
    vencimientos: [],
    meta: null,
    ...extra,
  };
}

function parte(tesoroId: string, porcentaje: number, recibido = 0): ParteDelMes {
  return {
    tesoro: tesoroId,
    porcentaje: puntosBasicos(porcentaje),
    hastaLaMeta: false,
    recibido: centavos(recibido),
    meta: null,
  };
}

const DIEZMO: ObligacionDelMes = {
  tesoro: 'diezmo',
  porcentaje: puntosBasicos(1000),
  base: 'ingreso',
  diezmo: true,
  apartado: centavos(27_000_000),
  aPagar: centavos(27_000_000),
};

const SEPTIEMBRE: FilaDelMes = {
  mes: '2026-09',
  cobros: 2,
  ingreso: centavos(270_000_000),
  diezmo: centavos(27_000_000),
  apartado: centavos(27_000_000),
  obligaciones: [DIEZMO],
  pasos: [
    paso('hogar', 'sueldo', 180_000_000, 180_000_000),
    paso('fijos', 'fijos', 90_000_000, 63_000_000),
    paso('materiales', 'prioridad', 30_000_000, 0),
  ],
  reparto: [parte('cocos', 5000), parte('inmuebles', 3000)],
  superavit: { tesoro: 'maun', recibido: centavos(0) },
  enElTaller: centavos(0),
  repartoEmpezo: false,
};

describe('la fila del mes en Inicio, por tipo', () => {
  it('las obligaciones van primero, con su porcentaje, sobre qué se calculan y lo que queda a pagar', () => {
    const conIngresosBrutos: FilaDelMes = {
      ...SEPTIEMBRE,
      obligaciones: [
        {
          tesoro: 'iibb',
          porcentaje: puntosBasicos(350),
          base: 'cobrado',
          diezmo: false,
          apartado: centavos(9_450_000),
          aPagar: centavos(0),
        },
        DIEZMO,
      ],
    };
    const obligaciones = obligacionesEnInicio(conIngresosBrutos, TESOROS);
    expect(obligaciones.map((una) => [una.numero, una.nombre, una.regla])).toEqual([
      [1, 'Ingresos Brutos', '3,5% sobre lo que cobrás'],
      [2, 'Diezmo', '10% sobre el ingreso'],
    ]);
    expect(obligaciones.map((una) => llano(textoDeLaObligacion(una)))).toEqual([
      'Al día',
      'A pagar $ 270.000',
    ]);
    expect(pasosEnInicio(conIngresosBrutos, TESOROS).map((uno) => uno.numero)).toEqual([3, 4, 5]);
  });

  it('los pasos siguen el número de las obligaciones y dicen cómo se llenan', () => {
    const pasos = pasosEnInicio(SEPTIEMBRE, TESOROS);
    expect(pasos.map((uno) => [uno.numero, uno.tipo, uno.nombre, uno.clase, uno.tinta])).toEqual([
      [2, 'compromiso', 'Hogar', 'sueldo', 'hogar'],
      [3, 'compromiso', 'Gastos fijos', 'por mes', 'grana'],
      [4, 'ahorro-fijo', 'Materiales', 'por mes', 'mostaza'],
    ]);
    expect(pasos.map((uno) => [uno.lleva, uno.tope, uno.estado])).toEqual([
      [180_000_000, 180_000_000, 'cubierto'],
      [63_000_000, 90_000_000, 'falta'],
      [0, 30_000_000, 'espera'],
    ]);
    expect(pasos.map((uno) => llano(textoDelEstado(uno)))).toEqual([
      'Cubierto',
      'Faltan $ 270.000',
      'Espera su turno',
    ]);
  });

  it('un compromiso que se renueva, un ahorro por trabajo y uno que llegó a su meta', () => {
    const pasos = pasosEnInicio(
      {
        ...SEPTIEMBRE,
        pasos: [
          paso('fijos', 'fijos', 90_000_000, 0, {
            modo: 'saldo',
            lleva: centavos(63_000_000),
            falta: centavos(27_000_000),
          }),
          paso('materiales', 'prioridad', 10_000_000, 20_000_000, {
            modo: 'trabajo',
            lleva: centavos(0),
            falta: null,
          }),
          paso('inmuebles', 'prioridad', 30_000_000, 5_000_000, {
            falta: centavos(0),
            meta: {
              meta: centavos(30_000_000),
              saldo: centavos(30_000_000),
              falta: centavos(0),
              hastaLaMeta: true,
              llego: true,
            },
          }),
        ],
      },
      TESOROS,
    );
    expect(pasos.map((uno) => uno.clase)).toEqual([
      'se renueva al pagar',
      'por trabajo',
      'por mes · hasta la meta',
    ]);
    expect(pasos.map((uno) => llano(textoDelEstado(uno)))).toEqual([
      'Faltan $ 270.000',
      'Recibió $ 200.000 este mes',
      'Llegó a la meta',
    ]);
    expect(pasos.map((uno) => llano(cuantoLleva(uno)))).toEqual([
      '$ 630.000 de $ 900.000',
      '$ 100.000 por cobro',
      '$ 50.000 de $ 300.000',
    ]);
  });

  it('los costos fijos de la fila de siempre se nombran así', () => {
    const [maun] = pasosEnInicio(
      { ...SEPTIEMBRE, pasos: [paso('maun', 'fijos', 90_000_000, 0)] },
      TESOROS,
    );
    expect(maun).toMatchObject({ nombre: 'Maun', clase: 'costos fijos' });
  });

  it('un tesoro que ya no está se muestra igual, con un nombre genérico', () => {
    const [perdido] = pasosEnInicio(
      { ...SEPTIEMBRE, pasos: [paso('otro', 'prioridad', 100, 0)] },
      TESOROS,
    );
    expect(perdido).toMatchObject({ nombre: 'Tesoro', tinta: 'maun' });
  });

  it('cuenta el ingreso del mes en sus cobros', () => {
    expect(llano(ingresoDelMes(SEPTIEMBRE))).toBe('$ 2.700.000 de ingreso en 2 cobros');
    expect(llano(ingresoDelMes({ ...SEPTIEMBRE, cobros: 1 }))).toBe(
      '$ 2.700.000 de ingreso en un cobro',
    );
    expect(ingresoDelMes({ ...SEPTIEMBRE, cobros: 0, ingreso: centavos(0) })).toBe(
      'Todavía no hubo cobros este mes',
    );
  });
});

describe('lo que sobra', () => {
  it('dice cuánto falta para los compromisos y los ahorros fijos y cómo se va a repartir', () => {
    expect(faltaParaLosTopes(SEPTIEMBRE)).toBe(57_000_000);
    expect(llano(fraseDeLoQueSobra(SEPTIEMBRE, TESOROS))).toBe(
      'Se reparte cuando se llenan los compromisos y los ahorros fijos: faltan $ 570.000. Cocos 50%, Inmuebles 30% y Maun el resto.',
    );
  });

  it('con todo lleno, lo próximo se reparte', () => {
    const llenos = {
      ...SEPTIEMBRE,
      pasos: [paso('hogar', 'sueldo', 100, 100), paso('fijos', 'fijos', 50, 60)],
    };
    expect(llano(fraseDeLoQueSobra(llenos, TESOROS))).toBe(
      'Los compromisos ya están llenos: lo que deje el próximo cobro se reparte. Cocos 50%, Inmuebles 30% y Maun el resto.',
    );
  });

  it('cuando el reparto ya empezó, dice lo que ya se repartió', () => {
    const repartido: FilaDelMes = {
      ...SEPTIEMBRE,
      reparto: [parte('cocos', 5000, 30_000_000), parte('inmuebles', 3000, 18_000_000)],
      repartoEmpezo: true,
    };
    expect(llano(fraseDeLoQueSobra(repartido, TESOROS))).toBe(
      'Ya se repartieron $ 480.000: Cocos $ 300.000 y Inmuebles $ 180.000. El resto quedó en Maun.',
    );
  });

  it('con el superávit en otro tesoro, el resto va ahí', () => {
    const aparte: FilaDelMes = {
      ...SEPTIEMBRE,
      superavit: { tesoro: 'superavit', recibido: centavos(0) },
      reparto: [{ ...parte('inmuebles', 2000), hastaLaMeta: true, meta: null }],
    };
    expect(llano(fraseDeLoQueSobra(aparte, TESOROS))).toBe(
      'Se reparte cuando se llenan los compromisos y los ahorros fijos: faltan $ 570.000. Inmuebles 20% y Superávit el resto.',
    );
    expect(
      llano(
        fraseDeLoQueSobra(
          {
            ...aparte,
            reparto: [parte('inmuebles', 2000, 5_000_000)],
            repartoEmpezo: true,
          },
          TESOROS,
        ),
      ),
    ).toBe('Ya se repartieron $ 50.000: Inmuebles $ 50.000. El resto fue a Superávit.');
    expect(
      llano(
        fraseDeLoQueSobra(
          {
            ...aparte,
            reparto: [
              {
                ...parte('inmuebles', 2000),
                hastaLaMeta: true,
                meta: {
                  meta: centavos(30_000_000),
                  saldo: centavos(25_000_000),
                  falta: centavos(5_000_000),
                  hastaLaMeta: true,
                  llego: false,
                },
              },
            ],
          },
          TESOROS,
        ),
      ),
    ).toBe(
      'Se reparte cuando se llenan los compromisos y los ahorros fijos: faltan $ 570.000. Inmuebles 20% hasta su meta y Superávit el resto.',
    );
  });

  it('sin reparto, lo que sobra va al superávit', () => {
    const sinReparto = { ...SEPTIEMBRE, reparto: [] };
    expect(llano(fraseDeLoQueSobra(sinReparto, TESOROS))).toBe(
      'Cuando se llenan los compromisos y los ahorros fijos, lo que sobra queda en Maun: faltan $ 570.000.',
    );
    expect(fraseDeLoQueSobra({ ...sinReparto, pasos: [] }, TESOROS)).toBe(
      'Lo que sobra de cada cobro queda en Maun.',
    );
    expect(
      fraseDeLoQueSobra(
        {
          ...sinReparto,
          pasos: [paso('materiales', 'prioridad', 100, 100)],
          superavit: { tesoro: 'superavit', recibido: centavos(0) },
        },
        TESOROS,
      ),
    ).toBe('Los ahorros fijos ya están llenos: lo que sobra de cada cobro va a Superávit.');
  });

  it('con el reparto al 100%, el superávit no se nombra', () => {
    const entero: FilaDelMes = {
      ...SEPTIEMBRE,
      reparto: [parte('cocos', 6000), parte('inmuebles', 4000)],
    };
    expect(llano(fraseDeLoQueSobra(entero, TESOROS))).toBe(
      'Se reparte cuando se llenan los compromisos y los ahorros fijos: faltan $ 570.000. Cocos 60% y Inmuebles 40%.',
    );
  });
});

function vencimiento(fecha: string, pagado = false): VencimientoDeLaAgenda {
  return {
    id: `vencimiento:fijos:0:${fecha}`,
    tesoro: 'fijos',
    nombreDelTesoro: 'Gastos fijos',
    renglon: 'Alquiler',
    monto: centavos(50_000_000),
    fecha,
    pagado,
  };
}

describe('el faltante de los compromisos', () => {
  it('aparece solo con un compromiso de gastos fijos incompleto: el ahorro que falta espera su turno', () => {
    expect(faltantesEnInicio(SEPTIEMBRE, TESOROS, [], '2026-09-27')).toEqual([
      { tesoro: 'fijos', nombre: 'gastos fijos', modo: 'mes', falta: 27_000_000, vence: null },
    ]);

    const conLosFijosLlenos = {
      ...SEPTIEMBRE,
      pasos: [
        paso('hogar', 'sueldo', 180_000_000, 10_000_000),
        paso('fijos', 'fijos', 90_000_000, 90_000_000),
        paso('materiales', 'prioridad', 30_000_000, 0),
      ],
    };
    expect(faltantesEnInicio(conLosFijosLlenos, TESOROS, [], '2026-09-27')).toEqual([]);
  });

  it('mira también los que se renuevan al pagar y nombra lo que vence en los próximos 7 días', () => {
    const [alquiler] = faltantesEnInicio(
      {
        ...SEPTIEMBRE,
        pasos: [
          paso('fijos', 'fijos', 90_000_000, 0, {
            modo: 'saldo',
            lleva: centavos(63_000_000),
            falta: centavos(27_000_000),
          }),
        ],
      },
      TESOROS,
      [vencimiento('2026-09-03', true), vencimiento('2026-10-03')],
      '2026-09-28',
    );
    expect(alquiler).toMatchObject({ modo: 'saldo', falta: 27_000_000 });
    expect(alquiler?.vence?.fecha).toBe('2026-10-03');
  });

  it('nombra el paso en minúscula si es un nombre común, y a Maun por sus costos fijos', () => {
    expect(nombreEnLaFrase({ clave: null, nombre: 'Gastos fijos' })).toBe('gastos fijos');
    expect(nombreEnLaFrase({ clave: null, nombre: 'Alquiler del galpón' })).toBe(
      'alquiler del galpón',
    );
    expect(nombreEnLaFrase({ clave: null, nombre: 'AFIP' })).toBe('AFIP');
    expect(nombreEnLaFrase({ clave: 'cocos', nombre: 'Cocos' })).toBe('Cocos');
    expect(nombreEnLaFrase({ clave: 'maun', nombre: 'Maun' })).toBe('los costos fijos');
  });

  it('en la primera quincena no cuenta los días; después dice cuántos quedan', () => {
    expect(fraseDeLosDiasQueQuedan('2026-09-15')).toBeNull();
    expect(fraseDeLosDiasQueQuedan('2026-09-27')).toBe(
      'Quedan 3 días del mes. El próximo cobro los llena primero, o cubrilos ahora con otro tesoro.',
    );
    expect(fraseDeLosDiasQueQuedan('2026-09-29')).toBe(
      'Queda un día del mes. El próximo cobro los llena primero, o cubrilos ahora con otro tesoro.',
    );
    expect(fraseDeLosDiasQueQuedan('2026-09-30')).toBe(
      'Hoy es el último día del mes. El próximo cobro los llena primero, o cubrilos ahora con otro tesoro.',
    );
  });
});

import { centavos, puntosBasicos, type FilaDelMes, type PasoDelMes } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { TesoroDelTaller } from '@/entities/tesoro';

import {
  faltaParaLosTopes,
  faltantesEnInicio,
  fraseDeLoQueSobra,
  fraseDeLosDiasQueQuedan,
  gananciaDelMes,
  nombreEnLaFrase,
  pasosEnInicio,
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
    nombre,
    descripcion: '',
    tinta,
    icono: 'vault',
    meta: null,
    rindeAnualBp: null,
    orden: 0,
    archivado: false,
    saldo: centavos(0),
  };
}

const TESOROS = [
  tesoro('hogar', 'hogar', 'Hogar', 'hogar'),
  tesoro('maun', 'maun', 'Maun', 'maun'),
  tesoro('diezmo', 'diezmo', 'Diezmo', 'diezmo'),
  tesoro('cocos', 'cocos', 'Cocos', 'cocos'),
  tesoro('fijos', null, 'Gastos fijos', 'grana'),
  tesoro('materiales', null, 'Materiales', 'mostaza'),
  tesoro('inmuebles', null, 'Inmuebles', 'ciruela'),
];

function paso(
  tesoroId: string,
  clase: PasoDelMes['clase'],
  objetivo: number,
  recibido: number,
  cubierto = 0,
): PasoDelMes {
  const falta = Math.max(0, objetivo - recibido - cubierto);
  return {
    tesoro: tesoroId,
    clase,
    objetivo: centavos(objetivo),
    recibido: centavos(recibido),
    cubierto: centavos(cubierto),
    falta: centavos(falta),
    completo: falta === 0,
  };
}

const SEPTIEMBRE: FilaDelMes = {
  mes: '2026-09',
  cobros: 2,
  ganancia: centavos(270_000_000),
  diezmo: centavos(27_000_000),
  pasos: [
    paso('hogar', 'sueldo', 180_000_000, 180_000_000),
    paso('fijos', 'fijos', 90_000_000, 63_000_000),
    paso('materiales', 'prioridad', 30_000_000, 0),
  ],
  reparto: [
    { tesoro: 'cocos', porcentaje: puntosBasicos(5000), recibido: centavos(0) },
    { tesoro: 'inmuebles', porcentaje: puntosBasicos(3000), recibido: centavos(0) },
  ],
  enElTaller: centavos(0),
  repartoEmpezo: false,
};

describe('la fila del mes en Inicio', () => {
  it('sigue el orden de la fila, con el número de cada paso y su clase cuando no es su nombre', () => {
    const pasos = pasosEnInicio(SEPTIEMBRE, TESOROS);
    expect(pasos.map((uno) => [uno.numero, uno.nombre, uno.clase, uno.tinta])).toEqual([
      [1, 'Hogar', 'sueldo', 'hogar'],
      [2, 'Gastos fijos', null, 'grana'],
      [3, 'Materiales', 'prioridad', 'mostaza'],
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

  it('lo que se cubrió con otro tesoro cuenta para lo que lleva el paso', () => {
    const [fijos] = pasosEnInicio(
      { ...SEPTIEMBRE, pasos: [paso('fijos', 'fijos', 90_000_000, 63_000_000, 27_000_000)] },
      TESOROS,
    );
    expect(fijos).toMatchObject({ lleva: 90_000_000, falta: 0, estado: 'cubierto' });
  });

  it('un tesoro que ya no está se muestra igual, con un nombre genérico', () => {
    const [perdido] = pasosEnInicio(
      { ...SEPTIEMBRE, pasos: [paso('otro', 'prioridad', 100, 0)] },
      TESOROS,
    );
    expect(perdido).toMatchObject({ nombre: 'Tesoro', clase: 'prioridad', tinta: 'maun' });
  });

  it('cuenta la ganancia del mes en sus cobros', () => {
    expect(llano(gananciaDelMes(SEPTIEMBRE))).toBe('$ 2.700.000 de ganancia en 2 cobros');
    expect(llano(gananciaDelMes({ ...SEPTIEMBRE, cobros: 1 }))).toBe(
      '$ 2.700.000 de ganancia en un cobro',
    );
    expect(gananciaDelMes({ ...SEPTIEMBRE, cobros: 0, ganancia: centavos(0) })).toBe(
      'Todavía no hubo cobros este mes',
    );
  });

  it('lo que sobra dice cuánto falta para los topes y cómo se va a repartir', () => {
    expect(faltaParaLosTopes(SEPTIEMBRE)).toBe(57_000_000);
    expect(llano(fraseDeLoQueSobra(SEPTIEMBRE, TESOROS))).toBe(
      'Se reparte cuando se llenan los topes: faltan $ 570.000. Cocos 50%, Inmuebles 30% y Maun el resto.',
    );
  });

  it('con los topes llenos, lo próximo se reparte', () => {
    const llenos = {
      ...SEPTIEMBRE,
      pasos: [paso('hogar', 'sueldo', 100, 100), paso('fijos', 'fijos', 50, 60)],
    };
    expect(llano(fraseDeLoQueSobra(llenos, TESOROS))).toBe(
      'Los topes ya están llenos: lo que deje el próximo cobro se reparte. Cocos 50%, Inmuebles 30% y Maun el resto.',
    );
  });

  it('cuando el reparto ya empezó, dice lo que ya se repartió', () => {
    const repartido: FilaDelMes = {
      ...SEPTIEMBRE,
      reparto: [
        { tesoro: 'cocos', porcentaje: puntosBasicos(5000), recibido: centavos(30_000_000) },
        { tesoro: 'inmuebles', porcentaje: puntosBasicos(3000), recibido: centavos(18_000_000) },
      ],
      repartoEmpezo: true,
    };
    expect(llano(fraseDeLoQueSobra(repartido, TESOROS))).toBe(
      'Ya se repartieron $ 480.000: Cocos $ 300.000 y Inmuebles $ 180.000. El resto quedó en Maun.',
    );
  });

  it('sin reparto, lo que sobra queda en Maun', () => {
    const sinReparto = { ...SEPTIEMBRE, reparto: [] };
    expect(llano(fraseDeLoQueSobra(sinReparto, TESOROS))).toBe(
      'Cuando se llenan los topes, lo que sobra queda en Maun: faltan $ 570.000.',
    );
    expect(fraseDeLoQueSobra({ ...sinReparto, pasos: [] }, TESOROS)).toBe(
      'Los topes ya están llenos: lo que sobra de cada cobro queda en Maun.',
    );
  });

  it('con el reparto al 100%, Maun no se nombra', () => {
    const entero: FilaDelMes = {
      ...SEPTIEMBRE,
      reparto: [
        { tesoro: 'cocos', porcentaje: puntosBasicos(6000), recibido: centavos(0) },
        { tesoro: 'inmuebles', porcentaje: puntosBasicos(4000), recibido: centavos(0) },
      ],
    };
    expect(llano(fraseDeLoQueSobra(entero, TESOROS))).toBe(
      'Se reparte cuando se llenan los topes: faltan $ 570.000. Cocos 60% y Inmuebles 40%.',
    );
  });
});

describe('el faltante de los gastos fijos', () => {
  it('aparece solo con un paso de gastos fijos incompleto: la prioridad que falta espera su turno', () => {
    expect(faltantesEnInicio(SEPTIEMBRE, TESOROS)).toEqual([
      { tesoro: 'fijos', nombre: 'gastos fijos', falta: 27_000_000 },
    ]);

    const conLosFijosLlenos = {
      ...SEPTIEMBRE,
      pasos: [
        paso('hogar', 'sueldo', 180_000_000, 10_000_000),
        paso('fijos', 'fijos', 90_000_000, 63_000_000, 27_000_000),
        paso('materiales', 'prioridad', 30_000_000, 0),
      ],
    };
    expect(faltantesEnInicio(conLosFijosLlenos, TESOROS)).toEqual([]);
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

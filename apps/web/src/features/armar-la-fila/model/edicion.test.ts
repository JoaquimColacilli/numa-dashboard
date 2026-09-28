import { centavos, puntosBasicos, problemasDeLaFila, type Fila } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  clasesPosibles,
  conClase,
  moverUnLugar,
  porcentajeParaSumar,
  puedeIrAlReparto,
  sumarAlFinal,
  sumarComoPaso,
} from './edicion';
import { renglonDelCambio, textoDelProblema } from './textos';

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const COCOS = '01900000-0000-7000-8000-000000000004';
const MATERIALES = '01900000-0000-7000-8000-000000000006';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000007';

const TESOROS = [
  { id: HOGAR, clave: 'hogar' as const, archivado: false },
  { id: MAUN, clave: 'maun' as const, archivado: false },
  { id: COCOS, clave: 'cocos' as const, archivado: false },
  { id: MATERIALES, clave: null, archivado: false },
  { id: HERRAMIENTAS, clave: null, archivado: false },
];

const FILA: Fila = {
  pasos: [
    { tesoro: HOGAR, clase: 'sueldo', tope: centavos(100_000_000), renglones: [], desde: null },
    {
      tesoro: MATERIALES,
      clase: 'prioridad',
      tope: centavos(30_000_000),
      renglones: [],
      desde: null,
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(9500) }],
  sueldoPorTrabajo: false,
};

describe('editar la fila', () => {
  it('Hogar solo es sueldo, Maun solo gastos fijos y los demás eligen', () => {
    expect(clasesPosibles('hogar')).toEqual(['sueldo']);
    expect(clasesPosibles('maun')).toEqual(['fijos']);
    expect(clasesPosibles(null)).toEqual(['fijos', 'prioridad']);
  });

  it('pasar a gastos fijos arma un renglón con el tope, y la fila queda válida', () => {
    const fija = conClase(FILA, MATERIALES, 'fijos');
    expect(fija.pasos[1]).toMatchObject({
      clase: 'fijos',
      tope: 30_000_000,
      renglones: [{ nombre: 'Gasto fijo', monto: 30_000_000 }],
    });
    expect(problemasDeLaFila(fija, TESOROS)).toEqual([]);
    expect(conClase(fija, MATERIALES, 'prioridad').pasos[1]).toMatchObject({
      clase: 'prioridad',
      renglones: [],
      tope: 30_000_000,
    });
  });

  it('un tesoro que entra como paso es de prioridad con tope en cero, salvo Hogar', () => {
    const conHerramientas = sumarComoPaso(FILA, HERRAMIENTAS, null, HOGAR);
    expect(conHerramientas.pasos.map((paso) => paso.tesoro)).toEqual([
      HOGAR,
      HERRAMIENTAS,
      MATERIALES,
    ]);
    expect(conHerramientas.pasos[1]).toMatchObject({ clase: 'prioridad', tope: 0 });
    const sinHogar = { ...FILA, pasos: FILA.pasos.slice(1) };
    expect(sumarAlFinal(sinHogar, HOGAR, 'hogar').pasos.at(-1)?.clase).toBe('sueldo');
  });

  it('subir y bajar no se salen de la fila', () => {
    expect(moverUnLugar(FILA, HOGAR, -1)).toBe(FILA);
    expect(moverUnLugar(FILA, MATERIALES, 1)).toBe(FILA);
    expect(moverUnLugar(FILA, MATERIALES, -1).pasos[0]?.tesoro).toBe(MATERIALES);
  });

  it('al reparto entra con lo que queda libre, hasta 10%, y Hogar y Maun no entran', () => {
    expect(porcentajeParaSumar(FILA)).toBe(500);
    expect(porcentajeParaSumar({ ...FILA, reparto: [] })).toBe(1000);
    expect(puedeIrAlReparto(FILA, HERRAMIENTAS, null)).toBe(true);
    expect(puedeIrAlReparto(FILA, HOGAR, 'hogar')).toBe(false);
    expect(puedeIrAlReparto(FILA, MAUN, 'maun')).toBe(false);
    const lleno = { ...FILA, reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(10_000) }] };
    expect(puedeIrAlReparto(lleno, HERRAMIENTAS, null)).toBe(false);
  });
});

describe('los textos', () => {
  it('los problemas dicen lo que pasa con el nombre del tesoro', () => {
    expect(textoDelProblema('tesoro-archivado', 'Herramientas')).toBe(
      'Herramientas está archivado: sacalo de la fila.',
    );
    expect(textoDelProblema('reparto-pasa-de-cien')).toBe('Los porcentajes suman más de 100%.');
    expect(textoDelProblema('renglon-largo')).toBe(
      'El nombre del renglón es muy largo: hasta 40 letras.',
    );
  });

  it('cada cambio lleva su ícono', () => {
    expect(
      renglonDelCambio({
        tipo: 'cambia-el-tope',
        tesoro: MATERIALES,
        antes: centavos(30_000_000),
        despues: centavos(35_000_000),
      }).icono,
    ).toBe('ruler');
    expect(renglonDelCambio({ tipo: 'sale-de-la-fila', tesoro: MATERIALES }).icono).toBe('minus');
    expect(
      renglonDelCambio({
        tipo: 'cambia-el-porcentaje',
        tesoro: COCOS,
        antes: puntosBasicos(3000),
        despues: puntosBasicos(2500),
      }).despuesDelNombre,
    ).toBe(': de 30% a 25% de lo que sobra.');
  });
});

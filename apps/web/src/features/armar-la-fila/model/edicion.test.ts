import { centavos, puntosBasicos, problemasDeLaFila, type Fila } from '@maun/domain';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  clasesPosibles,
  conClase,
  moverUnLugar,
  pasoNuevo,
  porcentajeParaSumar,
  puedeIrAlReparto,
  puedeMoverse,
  sumarAlFinal,
  sumarAlReparto,
  sumarComoPaso,
  tiposPosibles,
} from './edicion';
import {
  renglonDelCambio,
  textoDelProblema,
  type ContextoDelCambio,
  type RenglonDelCambio,
} from './textos';

function despuesDelNombre(renglon: RenglonDelCambio): string {
  return renderToStaticMarkup(renglon.frase(() => null));
}

const HOGAR = '01900000-0000-7000-8000-000000000001';
const MAUN = '01900000-0000-7000-8000-000000000002';
const DIEZMO = '01900000-0000-7000-8000-000000000003';
const COCOS = '01900000-0000-7000-8000-000000000004';
const MATERIALES = '01900000-0000-7000-8000-000000000006';
const HERRAMIENTAS = '01900000-0000-7000-8000-000000000007';
const IIBB = '01900000-0000-7000-8000-000000000009';
const APARTE = '01900000-0000-7000-8000-000000000010';

const TESOROS = [
  { id: HOGAR, clave: 'hogar' as const, archivado: false, meta: null },
  { id: MAUN, clave: 'maun' as const, archivado: false, meta: null },
  { id: DIEZMO, clave: 'diezmo' as const, archivado: false, meta: null },
  { id: COCOS, clave: 'cocos' as const, archivado: false, meta: null },
  { id: MATERIALES, clave: null, archivado: false, meta: null },
  { id: HERRAMIENTAS, clave: null, archivado: false, meta: null },
];

const FILA: Fila = {
  obligaciones: [{ tesoro: DIEZMO, porcentaje: puntosBasicos(1000), base: 'ingreso' }],
  pasos: [
    {
      tesoro: HOGAR,
      clase: 'sueldo',
      tope: centavos(100_000_000),
      renglones: [],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    },
    {
      tesoro: MATERIALES,
      clase: 'prioridad',
      tope: centavos(30_000_000),
      renglones: [],
      desde: null,
      modo: 'mes',
      hastaLaMeta: false,
    },
  ],
  reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(9500), hastaLaMeta: false }],
  superavit: MAUN,
  sueldoPorTrabajo: false,
};

const NOMBRES: Readonly<Record<string, string>> = {
  [MAUN]: 'Maun',
  [APARTE]: 'Superávit',
};

function contexto(antes: Fila, despues: Fila): ContextoDelCambio {
  return { antes, despues, nombreDe: (tesoro) => NOMBRES[tesoro] ?? tesoro };
}

describe('editar la fila', () => {
  it('Hogar solo es sueldo, Maun solo gastos fijos y los demás eligen', () => {
    expect(clasesPosibles('hogar')).toEqual(['sueldo']);
    expect(clasesPosibles('maun')).toEqual(['fijos']);
    expect(clasesPosibles(null)).toEqual(['fijos', 'prioridad']);
    expect(tiposPosibles('hogar')).toEqual(['compromiso']);
    expect(tiposPosibles('maun')).toEqual(['compromiso']);
    expect(tiposPosibles(null)).toEqual(['compromiso', 'ahorro-fijo']);
  });

  it('pasar a gastos fijos arma un renglón con el tope, y la fila queda válida', () => {
    const fija = conClase(FILA, MATERIALES, 'fijos');
    expect(fija.pasos[1]).toMatchObject({
      clase: 'fijos',
      tope: 30_000_000,
      renglones: [{ nombre: 'Gasto fijo', monto: 30_000_000, dia: null }],
    });
    expect(problemasDeLaFila(fija, TESOROS)).toEqual([]);
    expect(conClase(fija, MATERIALES, 'prioridad').pasos[1]).toMatchObject({
      clase: 'prioridad',
      renglones: [],
      tope: 30_000_000,
    });
    expect(conClase(FILA, MATERIALES, 'prioridad')).toBe(FILA);
  });

  it('un tesoro que entra como paso es de prioridad con tope en cero, salvo Hogar', () => {
    const conHerramientas = sumarComoPaso(FILA, HERRAMIENTAS, null, HOGAR);
    expect(conHerramientas.pasos.map((paso) => paso.tesoro)).toEqual([
      HOGAR,
      HERRAMIENTAS,
      MATERIALES,
    ]);
    expect(conHerramientas.pasos[1]).toMatchObject({ clase: 'prioridad', tope: 0, modo: 'mes' });
    const sinHogar = { ...FILA, pasos: FILA.pasos.slice(1) };
    expect(sumarAlFinal(sinHogar, HOGAR, 'hogar').pasos.map((paso) => paso.tesoro)).toEqual([
      HOGAR,
      MATERIALES,
    ]);
  });

  it('un paso nuevo arranca con el modo y la meta de su tipo', () => {
    expect(pasoNuevo(MAUN, 'maun', centavos(100))).toMatchObject({
      clase: 'fijos',
      modo: 'mes',
      renglones: [{ nombre: 'Costos fijos', monto: 100, dia: null }],
    });
    expect(pasoNuevo(HERRAMIENTAS, null, centavos(100), { clase: 'fijos' })).toMatchObject({
      modo: 'saldo',
      hastaLaMeta: false,
    });
    expect(pasoNuevo(HERRAMIENTAS, null, centavos(100), { meta: centavos(5) })).toMatchObject({
      clase: 'prioridad',
      modo: 'mes',
      hastaLaMeta: true,
    });
  });

  it('subir y bajar no se salen de la fila ni de su tipo', () => {
    expect(moverUnLugar(FILA, HOGAR, -1)).toBe(FILA);
    expect(moverUnLugar(FILA, MATERIALES, 1)).toBe(FILA);
    expect(moverUnLugar(FILA, MATERIALES, -1)).toBe(FILA);
    expect(puedeMoverse(FILA, MATERIALES, -1)).toBe(false);
    const dosAhorros = sumarAlFinal(FILA, HERRAMIENTAS, null);
    expect(puedeMoverse(dosAhorros, HERRAMIENTAS, -1)).toBe(true);
    expect(moverUnLugar(dosAhorros, HERRAMIENTAS, -1).pasos.map((paso) => paso.tesoro)).toEqual([
      HOGAR,
      HERRAMIENTAS,
      MATERIALES,
    ]);
  });

  it('al reparto entra con lo que queda libre, hasta 10%, y Hogar, Maun y el superávit no entran', () => {
    expect(porcentajeParaSumar(FILA)).toBe(500);
    expect(porcentajeParaSumar({ ...FILA, reparto: [] })).toBe(1000);
    expect(puedeIrAlReparto(FILA, HERRAMIENTAS, null)).toBe(true);
    expect(puedeIrAlReparto(FILA, HOGAR, 'hogar')).toBe(false);
    expect(puedeIrAlReparto(FILA, MAUN, 'maun')).toBe(false);
    expect(puedeIrAlReparto({ ...FILA, superavit: APARTE }, APARTE, null)).toBe(false);
    const lleno: Fila = {
      ...FILA,
      reparto: [{ tesoro: COCOS, porcentaje: puntosBasicos(10_000), hastaLaMeta: false }],
    };
    expect(puedeIrAlReparto(lleno, HERRAMIENTAS, null)).toBe(false);
  });

  it('un tesoro con meta entra al reparto hasta la meta, y uno que ya estaba conserva lo suyo', () => {
    const conMeta = sumarAlReparto({ ...FILA, reparto: [] }, HERRAMIENTAS, undefined, centavos(1));
    expect(conMeta.reparto).toEqual([
      { tesoro: HERRAMIENTAS, porcentaje: 1000, hastaLaMeta: true },
    ]);
    expect(sumarAlReparto(FILA, COCOS, puntosBasicos(9000), centavos(1)).reparto).toEqual([
      { tesoro: COCOS, porcentaje: 9000, hastaLaMeta: false },
    ]);
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

  it('los problemas de los tipos se dicen tal cual', () => {
    expect(textoDelProblema('diezmo-en-la-fila')).toBe('El diezmo va entre las obligaciones.');
    expect(textoDelProblema('maun-en-el-reparto')).toBe(
      'Maun no va en el reparto: para que reciba lo que sobra, elegilo como superávit.',
    );
    expect(textoDelProblema('sin-diezmo')).toBe('Falta el diezmo entre las obligaciones.');
    expect(textoDelProblema('demasiadas-obligaciones')).toBe('Entran hasta 6 obligaciones.');
    expect(textoDelProblema('obligacion-invalida')).toBe(
      'Cada obligación necesita un porcentaje de 0,01% a 100% y sobre qué se calcula.',
    );
    expect(textoDelProblema('modo-invalido', 'Gastos fijos')).toBe(
      'Gastos fijos no puede llenarse de esa forma.',
    );
    expect(textoDelProblema('meta-sin-monto', 'Cocos')).toBe(
      'Cocos no tiene meta: ponele una o sacá «hasta la meta».',
    );
    expect(textoDelProblema('meta-fuera-de-ahorro')).toBe('Solo los ahorros van hasta la meta.');
    expect(textoDelProblema('obligacion-en-hogar-o-maun')).toBe(
      'Hogar y Maun no pueden ser obligación.',
    );
    expect(textoDelProblema('dia-invalido')).toBe('El día de pago va del 1 al 31.');
    expect(textoDelProblema('ahorro-antes-de-compromiso')).toBe(
      'Los ahorros van después de los compromisos.',
    );
    expect(textoDelProblema('superavit-invalido', 'Hogar')).toBe(
      'Lo que sobra no puede ir a Hogar.',
    );
    expect(textoDelProblema('superavit-en-la-fila', 'Cocos')).toBe(
      'Cocos recibe lo que sobra: no puede estar también en la fila.',
    );
  });

  it('cada cambio lleva su ícono', () => {
    const ambos = contexto(FILA, FILA);
    expect(
      renglonDelCambio(
        {
          tipo: 'cambia-el-tope',
          tesoro: MATERIALES,
          antes: centavos(30_000_000),
          despues: centavos(35_000_000),
        },
        ambos,
      ).icono,
    ).toBe('ruler');
    expect(renglonDelCambio({ tipo: 'sale-de-la-fila', tesoro: MATERIALES }, ambos).icono).toBe(
      'minus',
    );
    expect(
      despuesDelNombre(
        renglonDelCambio(
          {
            tipo: 'cambia-el-porcentaje',
            tesoro: COCOS,
            antes: puntosBasicos(3000),
            despues: puntosBasicos(2500),
          },
          ambos,
        ),
      ),
    ).toBe(': de 30% a 25% de lo que sobra.');
  });

  it('los cambios de los tipos se dicen con sus palabras', () => {
    const conIngresosBrutos: Fila = {
      ...FILA,
      obligaciones: [
        { tesoro: IIBB, porcentaje: puntosBasicos(350), base: 'cobrado' },
        ...FILA.obligaciones,
      ],
    };
    const ambos = contexto(FILA, conIngresosBrutos);
    const texto = (cambio: Parameters<typeof renglonDelCambio>[0]) =>
      despuesDelNombre(renglonDelCambio(cambio, ambos)).replace(/\s/g, ' ');

    expect(
      texto({
        tipo: 'entra-a-las-obligaciones',
        tesoro: IIBB,
        posicion: 0,
        porcentaje: puntosBasicos(350),
        base: 'cobrado',
      }),
    ).toBe(' entra como obligación 1, con el 3,5% sobre lo que cobrás.');
    expect(texto({ tipo: 'sale-de-las-obligaciones', tesoro: IIBB })).toBe(
      ' sale de las obligaciones y vuelve al estante.',
    );
    expect(
      texto({ tipo: 'cambia-de-lugar-la-obligacion', tesoro: IIBB, antes: 1, despues: 0 }),
    ).toBe(' pasa del 2 al 1 en la fila.');
    expect(
      texto({
        tipo: 'cambia-el-porcentaje-de-la-obligacion',
        tesoro: DIEZMO,
        antes: puntosBasicos(1000),
        despues: puntosBasicos(1200),
      }),
    ).toBe(': de 10% a 12%.');
    expect(
      texto({ tipo: 'cambia-la-base', tesoro: DIEZMO, antes: 'ingreso', despues: 'cobrado' }),
    ).toBe(' pasa a calcularse sobre lo que cobrás.');
    expect(
      texto({
        tipo: 'entra-a-la-fila',
        tesoro: HERRAMIENTAS,
        posicion: 1,
        clase: 'fijos',
        tope: centavos(50_000_000),
        modo: 'saldo',
        hastaLaMeta: false,
      }),
    ).toBe(' entra como compromiso 4, con $ 500.000, se renueva al pagar.');
    expect(
      texto({
        tipo: 'entra-a-la-fila',
        tesoro: HERRAMIENTAS,
        posicion: 2,
        clase: 'prioridad',
        tope: centavos(10_000_000),
        modo: 'mes',
        hastaLaMeta: true,
      }),
    ).toBe(' entra como ahorro fijo 5, con $ 100.000 por mes, hasta la meta.');
    expect(
      despuesDelNombre(
        renglonDelCambio(
          { tipo: 'cambia-de-lugar', tesoro: MATERIALES, antes: 1, despues: 0 },
          contexto(FILA, FILA),
        ),
      ),
    ).toBe(' pasa del 3 al 2 en la fila.');
    expect(
      texto({ tipo: 'cambia-la-clase', tesoro: MATERIALES, antes: 'prioridad', despues: 'fijos' }),
    ).toBe(' pasa a ser compromiso.');
    expect(texto({ tipo: 'cambian-los-dias', tesoro: MATERIALES })).toBe(
      ' cambia los días de pago.',
    );
    expect(
      texto({ tipo: 'cambia-el-modo', tesoro: MATERIALES, antes: 'mes', despues: 'saldo' }),
    ).toBe(' ahora se repone al usarlo.');
    expect(texto({ tipo: 'cambia-el-modo', tesoro: HOGAR, antes: 'saldo', despues: 'mes' })).toBe(
      ' ahora se llena por mes.',
    );
    expect(texto({ tipo: 'cambia-la-meta', tesoro: COCOS, hastaLaMeta: true })).toBe(
      ' junta hasta llegar a su meta.',
    );
    expect(texto({ tipo: 'cambia-la-meta', tesoro: COCOS, hastaLaMeta: false })).toBe(
      ' junta sin fin, aunque llegue a su meta.',
    );
    expect(
      texto({
        tipo: 'entra-al-reparto',
        tesoro: HERRAMIENTAS,
        porcentaje: puntosBasicos(2000),
        hastaLaMeta: true,
      }),
    ).toBe(' entra al reparto con el 20% de lo que sobra, hasta la meta.');
    expect(texto({ tipo: 'cambia-el-superavit', tesoro: APARTE, antes: MAUN })).toBe(
      ' recibe lo que sobra, en lugar de Maun.',
    );
    expect(
      renglonDelCambio({ tipo: 'cambia-el-superavit', tesoro: APARTE, antes: MAUN }, ambos).icono,
    ).toBe('coins');
  });

  it('el tope dice su unidad según cómo se llena', () => {
    const renueva: Fila = {
      ...FILA,
      pasos: FILA.pasos.map((paso) =>
        paso.tesoro === MATERIALES ? { ...paso, modo: 'saldo' as const } : paso,
      ),
    };
    const cambio = {
      tipo: 'cambia-el-tope' as const,
      tesoro: MATERIALES,
      antes: centavos(30_000_000),
      despues: centavos(35_000_000),
    };
    expect(
      despuesDelNombre(renglonDelCambio(cambio, contexto(FILA, FILA))).replace(/\s/g, ' '),
    ).toBe(': de $ 300.000 a $ 350.000 por mes.');
    expect(
      despuesDelNombre(renglonDelCambio(cambio, contexto(FILA, renueva))).replace(/\s/g, ' '),
    ).toBe(': de $ 300.000 a $ 350.000.');
  });
});

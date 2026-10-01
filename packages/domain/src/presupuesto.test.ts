import { describe, expect, it } from 'vitest';

import { DIAS_HABILES_DE_ENTREGA } from './fechas.ts';
import { cotizacion, type ImporteDeUnPago } from './cotizacion.ts';
import { centavos, centavosEn, puntosBasicos, type Money } from './money.ts';
import {
  abonadoEn,
  acordadoAlAprobar,
  borradorNuevo,
  CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE,
  clausulaDeLaMonedaDelTrabajo,
  cobraEnLeido,
  combinacionDeLaMoneda,
  completarHuecos,
  cuentasDelPresupuesto,
  documentoDelPresupuesto,
  esIdDelPresupuesto,
  esNumeroDePresupuesto,
  hayCambiosSinMandar,
  huecosDelPresupuesto,
  IMPORTE_MAXIMO_DEL_PRESUPUESTO,
  leerBorrador,
  leerDocumento,
  leerPlantilla,
  letraDeLaOpcion,
  mensajeParaElTaller,
  modificacionDelPresupuesto,
  monedaDeLoAbonado,
  monedaDeLoAbonadoDelDocumento,
  monedaDelDocumento,
  NOMBRE_DE_LA_CONDICION,
  nombreDelArchivo,
  numeroVisible,
  PLANTILLA_DE_SIEMPRE,
  plantillaDelTaller,
  plazoDelPresupuesto,
  problemaDeLaPlantilla,
  problemaDelBorrador,
  problemaDelDocumento,
  problemasParaMandar,
  recortado,
  resumenDeLosValores,
  soloLaAceptada,
  TEXTOS_DE_LO_QUE_FALTA,
  textoDeLaForma,
  textoDeLaGarantia,
  tildadasPorDefecto,
  tituloDelArchivo,
  totalPropuesto,
  usaElHueco,
  valoresDelTrabajo,
  type BorradorDelPresupuesto,
  type DatosDelTaller,
  type DocumentoDelPresupuesto,
  type EntradaDelDocumento,
  type Formatos,
  type PlantillaDelPresupuesto,
} from './presupuesto.ts';
import { calcularSena } from './sena.ts';

const FORMATOS: Formatos = {
  plata: (importe, moneda) => `${moneda === 'USD' ? 'US$' : '$'}${String(importe / 100)}`,
  porcentaje: (puntos) => String(puntos / 100),
};

const pesos = (importe: number): string => FORMATOS.plata(centavos(importe), 'ARS');

const TALLER: DatosDelTaller = {
  nombre: 'Taller de prueba',
  titular: 'Julián Ferro',
  cuit: '20-12345678-6',
  condicionFiscal: 'monotributo',
  domicilio: 'Pasaje Los Robles 450, CABA',
  telefono: '11 4000-1234',
  email: 'taller@ejemplo.com',
};

const TOTAL = centavos(218_100_000);
const RELEVAMIENTO = centavos(12_000_000);
const SENA_BP = puntosBasicos(5_000);

const OPCION_A = {
  id: '0199a1b2-0000-7000-8000-00000000000a',
  descripcion: 'Frentes en melamina Blanco (Egger) con cantos de ABS al tono.',
  monto: centavos(218_100_000),
};

const OPCION_B = {
  id: '0199a1b2-0000-7000-8000-00000000000b',
  descripcion: 'Con frentes laqueados blanco mate.',
  monto: centavos(274_000_000),
};

const BORRADOR: BorradorDelPresupuesto = {
  forma: 1,
  titulo: 'Cocina',
  obra: 'Arenales 1840, Palermo',
  descripcion: 'Cocina en L con bajomesada y alacena.',
  muebles: [
    {
      id: 'm1',
      nombre: 'Bajomesada en L',
      descripcion:
        'Bajomesada en L 2.07 x 1.83 altura 880mm en Melamina sobre Aglomerado de 18mm Blanco (Egger).',
    },
    {
      id: 'm2',
      nombre: 'Alacena',
      descripcion: 'Alacena 2.07 x 0.35, altura 700 mm, con puertas rebatibles.',
    },
  ],
  herrajes: {
    mostrar: true,
    lista: [
      { id: 'h1', texto: 'Correderas telescópicas 500mm con cierre suave.' },
      { id: 'h2', texto: 'Bisagras cazoleta de 35 mm.' },
    ],
  },
  aTenerEnCuenta: { tildadas: ['no-mesada'], propias: [] },
  incluye: tildadasPorDefecto(PLANTILLA_DE_SIEMPRE.incluye),
  formaDePago: { plantillaId: 'sena-y-entrega', texto: null },
  plazoDeFabricacion: 30,
  validezDias: 15,
  avisos: tildadasPorDefecto(PLANTILLA_DE_SIEMPRE.avisos),
  condiciones: tildadasPorDefecto(PLANTILLA_DE_SIEMPRE.condiciones),
  clausulaDeLaMoneda: null,
  modificacion: null,
  monedaDeLoAbonado: null,
};

type EntradaEnPesos = Extract<EntradaDelDocumento, { moneda: 'ARS' }>;

type EntradaEnDolares = Extract<EntradaDelDocumento, { moneda: 'USD' }>;

function entrada(cambios: Partial<EntradaEnPesos> = {}): EntradaEnPesos {
  return {
    borrador: BORRADOR,
    plantilla: PLANTILLA_DE_SIEMPRE,
    taller: TALLER,
    cliente: 'Paula Benítez',
    moneda: 'ARS',
    cobraEn: null,
    valores: valoresDelTrabajo(TOTAL, []),
    senaBp: SENA_BP,
    abonado: RELEVAMIENTO,
    ...cambios,
  };
}

function documento(cambios: Partial<EntradaEnPesos> = {}): DocumentoDelPresupuesto {
  return documentoDelPresupuesto(entrada(cambios), FORMATOS);
}

const REFERENCIA = { cotizacion: cotizacion(154_000), fecha: '2026-10-01' };

function entradaEnDolares(cambios: Partial<EntradaEnDolares> = {}): EntradaEnDolares {
  return {
    borrador: BORRADOR,
    plantilla: PLANTILLA_DE_SIEMPRE,
    taller: TALLER,
    cliente: 'Paula Benítez',
    moneda: 'USD',
    cobraEn: null,
    valores: valoresDelTrabajo(centavosEn('USD', 240_000), []),
    senaBp: SENA_BP,
    abonado: centavosEn('USD', 8_276),
    referencia: REFERENCIA,
    ...cambios,
  };
}

function textoDe(largo: number, letra = 'a'): string {
  return letra.repeat(largo);
}

function copia(valor: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(valor)) as Record<string, unknown>;
}

describe('la plantilla de siempre', () => {
  it('trae los textos de Eliseo tal cual, con sus números como huecos', () => {
    expect(PLANTILLA_DE_SIEMPRE.incluye.map(({ texto }) => texto)).toEqual([
      'Visita a domicilio para medición y definición de detalles.',
      'Diseño 3D según los requerimientos establecidos.',
      'Desarrollo y fabricación en base al diseño propuesto.',
      'Transporte y entrega.',
      'Instalación y terminaciones en el domicilio.',
    ]);
    expect(PLANTILLA_DE_SIEMPRE.avisos[0]?.texto).toMatch(
      /^El plazo estimado de fabricación es de \{plazo\} días hábiles a partir de acreditada la seña/,
    );
    expect(PLANTILLA_DE_SIEMPRE.avisos[2]?.texto).toBe(
      'Este presupuesto incluye diseño 3D y hasta {modificaciones}. Modificaciones adicionales (rediseño completo) tienen un valor estimativo de {valor_modificacion} c/u.',
    );
    expect(PLANTILLA_DE_SIEMPRE.condiciones[1]?.texto).toContain(
      'MAUN no se responsabiliza por daños derivados de perforaciones',
    );
    expect(PLANTILLA_DE_SIEMPRE.condiciones[0]?.titulo).toBe(
      'Condiciones del espacio de instalación',
    );
  });

  it('lleva los números de siempre', () => {
    expect(PLANTILLA_DE_SIEMPRE).toMatchObject({
      plazoDeFabricacion: 30,
      modificacionesIncluidas: 2,
      valorDeUnaModificacion: centavos(5_000_000),
      garantiaMeses: 6,
    });
  });

  it('incluye y los avisos van tildados; «a tener en cuenta», no', () => {
    expect(PLANTILLA_DE_SIEMPRE.incluye.every(({ tildadaPorDefecto }) => tildadaPorDefecto)).toBe(
      true,
    );
    expect(PLANTILLA_DE_SIEMPRE.avisos.every(({ tildadaPorDefecto }) => tildadaPorDefecto)).toBe(
      true,
    );
    expect(
      PLANTILLA_DE_SIEMPRE.aTenerEnCuenta.some(({ tildadaPorDefecto }) => tildadaPorDefecto),
    ).toBe(false);
  });

  it('pasa su propia validación y se lee igual', () => {
    expect(problemaDeLaPlantilla(PLANTILLA_DE_SIEMPRE)).toBeNull();
    expect(leerPlantilla(copia(PLANTILLA_DE_SIEMPRE))).toEqual(PLANTILLA_DE_SIEMPRE);
  });

  it('las condiciones fiscales tienen su nombre para el documento', () => {
    expect(NOMBRE_DE_LA_CONDICION.monotributo).toBe('Responsable Monotributo');
  });
});

describe('la plantilla del taller', () => {
  it('sin plantilla guardada, es la de siempre', () => {
    expect(plantillaDelTaller(null)).toBe(PLANTILLA_DE_SIEMPRE);
    expect(plantillaDelTaller({ forma: 2 })).toBe(PLANTILLA_DE_SIEMPRE);
  });

  it('con una guardada, se lee: un título vacío es sin título', () => {
    const guardada = copia(PLANTILLA_DE_SIEMPRE);
    guardada.plazoDeFabricacion = 35;
    guardada.avisos = [
      { id: 'aviso-agenda', titulo: '', texto: 'Reservamos la fecha.', tildadaPorDefecto: true },
    ];
    const leida = plantillaDelTaller(guardada);
    expect(leida.plazoDeFabricacion).toBe(35);
    expect(leida.avisos).toEqual([
      { id: 'aviso-agenda', titulo: null, texto: 'Reservamos la fecha.', tildadaPorDefecto: true },
    ]);
  });

  it('una cláusula sin la clave del título se lee sin título', () => {
    const guardada = copia(PLANTILLA_DE_SIEMPRE);
    guardada.incluye = [{ id: 'uno', texto: 'Traslados.', tildadaPorDefecto: true }];
    expect(leerPlantilla(guardada)?.incluye[0]?.titulo).toBeNull();
  });
});

describe('problemaDeLaPlantilla', () => {
  function conCambios(cambios: Record<string, unknown>): Record<string, unknown> {
    return { ...copia(PLANTILLA_DE_SIEMPRE), ...cambios };
  }

  function clausula(cambios: Record<string, unknown> = {}): Record<string, unknown> {
    return { id: 'una', titulo: null, texto: 'Un texto.', tildadaPorDefecto: true, ...cambios };
  }

  it('la forma que no es la de una plantilla', () => {
    expect(problemaDeLaPlantilla(null)).toBe('forma-invalida');
    expect(problemaDeLaPlantilla([])).toBe('forma-invalida');
    expect(problemaDeLaPlantilla(conCambios({ forma: 2 }))).toBe('forma-invalida');
    expect(problemaDeLaPlantilla(conCambios({ plazoDeFabricacion: '30' }))).toBe('forma-invalida');
    expect(problemaDeLaPlantilla(conCambios({ modificacionesIncluidas: 1.5 }))).toBe(
      'forma-invalida',
    );
    expect(problemaDeLaPlantilla(conCambios({ valorDeUnaModificacion: null }))).toBe(
      'forma-invalida',
    );
    expect(problemaDeLaPlantilla(conCambios({ garantiaMeses: undefined }))).toBe('forma-invalida');
    expect(problemaDeLaPlantilla(conCambios({ incluye: {} }))).toBe('forma-invalida');
    expect(problemaDeLaPlantilla(conCambios({ avisos: [clausula({ id: 3 })] }))).toBe(
      'forma-invalida',
    );
    expect(problemaDeLaPlantilla(conCambios({ avisos: [clausula({ texto: null })] }))).toBe(
      'forma-invalida',
    );
    expect(
      problemaDeLaPlantilla(conCambios({ avisos: [clausula({ tildadaPorDefecto: 'si' })] })),
    ).toBe('forma-invalida');
    expect(problemaDeLaPlantilla(conCambios({ avisos: [clausula({ titulo: 4 })] }))).toBe(
      'forma-invalida',
    );
    expect(problemaDeLaPlantilla(conCambios({ avisos: ['texto suelto'] }))).toBe('forma-invalida');
    expect(problemaDeLaPlantilla(conCambios({ formasDePago: 'A' }))).toBe('forma-invalida');
    expect(problemaDeLaPlantilla(conCambios({ formasDePago: [{ id: 'a', nombre: 'A' }] }))).toBe(
      'forma-invalida',
    );
    expect(problemaDeLaPlantilla(conCambios({ garantia: 6 }))).toBe('forma-invalida');
  });

  it('los números fuera de su rango, cada uno con su código', () => {
    expect(problemaDeLaPlantilla(conCambios({ plazoDeFabricacion: 0 }))).toBe(
      'plazo-fuera-de-rango',
    );
    expect(problemaDeLaPlantilla(conCambios({ plazoDeFabricacion: 366 }))).toBe(
      'plazo-fuera-de-rango',
    );
    expect(problemaDeLaPlantilla(conCambios({ modificacionesIncluidas: -1 }))).toBe(
      'modificaciones-fuera-de-rango',
    );
    expect(problemaDeLaPlantilla(conCambios({ modificacionesIncluidas: 11 }))).toBe(
      'modificaciones-fuera-de-rango',
    );
    expect(problemaDeLaPlantilla(conCambios({ valorDeUnaModificacion: -1 }))).toBe(
      'valor-fuera-de-rango',
    );
    expect(
      problemaDeLaPlantilla(
        conCambios({ valorDeUnaModificacion: IMPORTE_MAXIMO_DEL_PRESUPUESTO + 1 }),
      ),
    ).toBe('valor-fuera-de-rango');
    expect(problemaDeLaPlantilla(conCambios({ garantiaMeses: 5 }))).toBe('garantia-fuera-de-rango');
    expect(problemaDeLaPlantilla(conCambios({ garantiaMeses: 121 }))).toBe(
      'garantia-fuera-de-rango',
    );
  });

  it('los bordes de los rangos valen', () => {
    expect(
      problemaDeLaPlantilla(
        conCambios({
          plazoDeFabricacion: 365,
          modificacionesIncluidas: 0,
          valorDeUnaModificacion: 0,
          garantiaMeses: 120,
        }),
      ),
    ).toBeNull();
  });

  it('las cláusulas: cuántas, sus ids, sus títulos y sus textos', () => {
    const veintiuna = Array.from({ length: 21 }, (_, i) => clausula({ id: `c-${String(i)}` }));
    expect(problemaDeLaPlantilla(conCambios({ incluye: veintiuna }))).toBe('demasiadas-clausulas');
    expect(problemaDeLaPlantilla(conCambios({ incluye: veintiuna.slice(1) }))).toBeNull();
    expect(problemaDeLaPlantilla(conCambios({ aTenerEnCuenta: [clausula({ id: 'Mayus' })] }))).toBe(
      'id-invalido',
    );
    expect(problemaDeLaPlantilla(conCambios({ aTenerEnCuenta: [clausula({ id: '' })] }))).toBe(
      'id-invalido',
    );
    expect(
      problemaDeLaPlantilla(conCambios({ aTenerEnCuenta: [clausula({ id: textoDe(61) })] })),
    ).toBe('id-invalido');
    expect(
      problemaDeLaPlantilla(conCambios({ avisos: [clausula(), clausula({ texto: 'Otro.' })] })),
    ).toBe('id-repetido');
    expect(
      problemaDeLaPlantilla(conCambios({ condiciones: [clausula({ titulo: textoDe(121, 'ñ') })] })),
    ).toBe('titulo-largo');
    expect(
      problemaDeLaPlantilla(conCambios({ condiciones: [clausula({ titulo: textoDe(120, 'ñ') })] })),
    ).toBeNull();
    expect(
      problemaDeLaPlantilla(conCambios({ condiciones: [clausula({ texto: ' \n\t ' })] })),
    ).toBe('texto-vacio');
    expect(
      problemaDeLaPlantilla(conCambios({ condiciones: [clausula({ texto: textoDe(2001) })] })),
    ).toBe('texto-largo');
  });

  it('un espacio duro no es un texto vacío: los blancos son los de siempre', () => {
    expect(
      problemaDeLaPlantilla(conCambios({ condiciones: [clausula({ texto: ' ' })] })),
    ).toBeNull();
  });

  it('las formas de pago: de una a seis, con su nombre y su texto', () => {
    const forma = (cambios: Record<string, unknown> = {}) => ({
      id: 'una',
      nombre: 'Una',
      texto: 'Un texto.',
      ...cambios,
    });
    expect(problemaDeLaPlantilla(conCambios({ formasDePago: [] }))).toBe('sin-formas-de-pago');
    expect(
      problemaDeLaPlantilla(
        conCambios({
          formasDePago: Array.from({ length: 7 }, (_, i) => forma({ id: `f-${String(i)}` })),
        }),
      ),
    ).toBe('demasiadas-formas-de-pago');
    expect(problemaDeLaPlantilla(conCambios({ formasDePago: [forma({ id: 'A' })] }))).toBe(
      'id-invalido',
    );
    expect(problemaDeLaPlantilla(conCambios({ formasDePago: [forma(), forma()] }))).toBe(
      'id-repetido',
    );
    expect(problemaDeLaPlantilla(conCambios({ formasDePago: [forma({ nombre: '  ' })] }))).toBe(
      'nombre-vacio',
    );
    expect(
      problemaDeLaPlantilla(conCambios({ formasDePago: [forma({ nombre: textoDe(61) })] })),
    ).toBe('nombre-largo');
    expect(problemaDeLaPlantilla(conCambios({ formasDePago: [forma({ texto: '' })] }))).toBe(
      'texto-vacio',
    );
    expect(
      problemaDeLaPlantilla(conCambios({ formasDePago: [forma({ texto: textoDe(2001) })] })),
    ).toBe('texto-largo');
  });

  it('la garantía, que no se saca', () => {
    expect(problemaDeLaPlantilla(conCambios({ garantia: '' }))).toBe('garantia-vacia');
    expect(problemaDeLaPlantilla(conCambios({ garantia: textoDe(2001) }))).toBe('garantia-larga');
  });

  it('una plantilla que no se puede guardar no se lee', () => {
    expect(leerPlantilla(conCambios({ garantia: '' }))).toBeNull();
  });

  it('la moneda de la modificación es una de la lista, y sin ella es la del taller', () => {
    expect(problemaDeLaPlantilla(conCambios({ monedaDeLaModificacion: 'EUR' }))).toBe(
      'forma-invalida',
    );
    expect(problemaDeLaPlantilla(conCambios({ monedaDeLaModificacion: 'USD' }))).toBeNull();
    const sinMoneda = copia(PLANTILLA_DE_SIEMPRE);
    delete sinMoneda.monedaDeLaModificacion;
    expect(problemaDeLaPlantilla(sinMoneda)).toBeNull();
    expect(leerPlantilla(sinMoneda)?.monedaDeLaModificacion).toBe('ARS');
    expect(
      leerPlantilla(conCambios({ monedaDeLaModificacion: 'USD', valorDeUnaModificacion: 4_000 })),
    ).toMatchObject({ monedaDeLaModificacion: 'USD', valorDeUnaModificacion: 4_000 });
  });

  it('las cláusulas de la moneda: las cinco, ninguna vacía ni de más de 2000', () => {
    const conClausulas = (cambios: Record<string, unknown>) =>
      conCambios({
        clausulasDeLaMoneda: { ...CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE, ...cambios },
      });
    expect(problemaDeLaPlantilla(conCambios({ clausulasDeLaMoneda: 'una' }))).toBe(
      'forma-invalida',
    );
    expect(problemaDeLaPlantilla(conClausulas({ pesosEnDolares: undefined }))).toBe(
      'forma-invalida',
    );
    expect(problemaDeLaPlantilla(conClausulas({ dolaresEnPesos: 4 }))).toBe('forma-invalida');
    expect(problemaDeLaPlantilla(conClausulas({ dolaresEnDolares: '  ' }))).toBe(
      'clausula-de-la-moneda-vacia',
    );
    expect(problemaDeLaPlantilla(conClausulas({ pesosEnPesosODolares: textoDe(2001) }))).toBe(
      'clausula-de-la-moneda-larga',
    );
    expect(problemaDeLaPlantilla(conClausulas({ pesosEnPesosODolares: textoDe(2000) }))).toBeNull();
  });

  it('sin las cláusulas guardadas se leen las de fábrica; guardadas, las del taller', () => {
    const sinClausulas = copia(PLANTILLA_DE_SIEMPRE);
    delete sinClausulas.clausulasDeLaMoneda;
    expect(problemaDeLaPlantilla(sinClausulas)).toBeNull();
    expect(leerPlantilla(sinClausulas)?.clausulasDeLaMoneda).toEqual(
      CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE,
    );
    const propias = { ...CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE, dolaresEnPesos: 'Al dólar MEP.' };
    expect(
      leerPlantilla(conCambios({ clausulasDeLaMoneda: { ...propias, extra: 'x' } }))
        ?.clausulasDeLaMoneda,
    ).toEqual(propias);
  });
});

describe('las cláusulas de la moneda', () => {
  it('las de fábrica son los borradores de la investigación, tal cual', () => {
    expect(CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE.dolaresEnPesos).toBe(
      'Se paga en pesos. Cada pago se convierte al tipo de cambio vendedor del dólar billete del Banco de la Nación Argentina al cierre del día hábil anterior a la fecha del pago, y se descuenta del saldo en dólares.',
    );
    expect(CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE.pesosEnPesosODolares).toBe(
      'Si una parte se paga en dólares, se toma a la cotización que se acuerde ese día y se descuenta del saldo en pesos.',
    );
  });

  it('cada combinación de «Precio en» y «Te paga en» tiene la suya, menos pesos en pesos', () => {
    expect(combinacionDeLaMoneda('ARS', null)).toBeNull();
    expect(combinacionDeLaMoneda('ARS', ['ARS'])).toBeNull();
    expect(combinacionDeLaMoneda('ARS', ['USD'])).toBe('pesosEnDolares');
    expect(combinacionDeLaMoneda('ARS', ['ARS', 'USD'])).toBe('pesosEnPesosODolares');
    expect(combinacionDeLaMoneda('USD', null)).toBe('dolaresEnPesos');
    expect(combinacionDeLaMoneda('USD', ['ARS'])).toBe('dolaresEnPesos');
    expect(combinacionDeLaMoneda('USD', ['USD'])).toBe('dolaresEnDolares');
    expect(combinacionDeLaMoneda('USD', ['ARS', 'USD'])).toBe('dolaresEnPesosODolares');
  });

  it('«Te paga en» se lee solo en una de sus tres formas', () => {
    expect(cobraEnLeido(['ARS'])).toEqual(['ARS']);
    expect(cobraEnLeido(['USD'])).toEqual(['USD']);
    expect(cobraEnLeido(['ARS', 'USD'])).toEqual(['ARS', 'USD']);
    expect(cobraEnLeido(['USD', 'ARS'])).toBeNull();
    expect(cobraEnLeido([])).toBeNull();
    expect(cobraEnLeido(['ARS', 'ARS'])).toBeNull();
    expect(cobraEnLeido('ARS')).toBeNull();
  });

  it('la del trabajo: la del borrador si la retocó, si no la de la plantilla', () => {
    const retocada = { ...BORRADOR, clausulaDeLaMoneda: 'Al dólar MEP del día anterior.' };
    expect(clausulaDeLaMonedaDelTrabajo(PLANTILLA_DE_SIEMPRE, BORRADOR, 'USD', ['USD'])).toBe(
      CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE.dolaresEnDolares,
    );
    expect(clausulaDeLaMonedaDelTrabajo(PLANTILLA_DE_SIEMPRE, retocada, 'USD', ['USD'])).toBe(
      'Al dólar MEP del día anterior.',
    );
    expect(clausulaDeLaMonedaDelTrabajo(PLANTILLA_DE_SIEMPRE, retocada, 'ARS', null)).toBeNull();
  });
});

describe('valoresDelTrabajo', () => {
  it('sin opciones es el total, o nada si no hay presupuesto', () => {
    expect(valoresDelTrabajo(TOTAL, [])).toEqual({ tipo: 'total', total: TOTAL });
    expect(valoresDelTrabajo(null, [])).toBeNull();
  });

  it('con opciones, van en el orden de sus ids, con su letra', () => {
    expect(valoresDelTrabajo(TOTAL, [OPCION_B, OPCION_A])).toEqual({
      tipo: 'opciones',
      opciones: [
        { id: OPCION_A.id, letra: 'A', descripcion: OPCION_A.descripcion, total: OPCION_A.monto },
        { id: OPCION_B.id, letra: 'B', descripcion: OPCION_B.descripcion, total: OPCION_B.monto },
      ],
    });
  });

  it('las letras siguen hasta la Z y después van con número', () => {
    expect(letraDeLaOpcion(0)).toBe('A');
    expect(letraDeLaOpcion(25)).toBe('Z');
    expect(letraDeLaOpcion(26)).toBe('27');
  });
});

describe('borradorNuevo', () => {
  let ids = 0;
  const idNuevo = () => {
    ids += 1;
    return `nuevo-${String(ids)}`;
  };

  it('arranca con lo tildado de la plantilla, la primera forma de pago y un mueble vacío', () => {
    const borrador = borradorNuevo({
      titulo: '  Cocina  ',
      obra: 'Arenales 1840',
      plantilla: PLANTILLA_DE_SIEMPRE,
      validezDias: 15,
      idNuevo,
    });
    expect(borrador).toMatchObject({
      forma: 1,
      titulo: 'Cocina',
      obra: 'Arenales 1840',
      descripcion: '',
      herrajes: { mostrar: true, lista: [] },
      aTenerEnCuenta: { tildadas: [], propias: [] },
      formaDePago: { plantillaId: 'sena-y-entrega', texto: null },
      plazoDeFabricacion: 30,
      validezDias: 15,
    });
    expect(borrador.muebles).toHaveLength(1);
    expect(borrador.incluye.tildadas).toHaveLength(5);
    expect(problemaDelBorrador(borrador)).toBeNull();
  });

  it('corta un título o una dirección más largos que el borrador', () => {
    const borrador = borradorNuevo({
      titulo: textoDe(250),
      obra: textoDe(400),
      plantilla: PLANTILLA_DE_SIEMPRE,
      validezDias: null,
      idNuevo,
    });
    expect(borrador.titulo).toHaveLength(200);
    expect(borrador.obra).toHaveLength(300);
    expect(problemaDelBorrador(borrador)).toBeNull();
  });

  it('sin formas de pago en la plantilla, no la muestra', () => {
    const plantilla: PlantillaDelPresupuesto = { ...PLANTILLA_DE_SIEMPRE, formasDePago: [] };
    const borrador = borradorNuevo({
      titulo: 'Rack',
      obra: '',
      plantilla,
      validezDias: 15,
      idNuevo,
    });
    expect(borrador.formaDePago).toBeNull();
  });

  it('recortado cuenta letras y no unidades de UTF-16', () => {
    expect(recortado('ñandú🪚', 6)).toBe('ñandú🪚');
    expect(recortado('ñandú🪚', 5)).toBe('ñandú');
  });
});

describe('los huecos', () => {
  it('sabe si un texto usa un hueco', () => {
    expect(usaElHueco('El plazo es de {plazo} días.', 'plazo')).toBe(true);
    expect(usaElHueco('El plazo es de 30 días.', 'plazo')).toBe(false);
  });

  it('completa los conocidos y deja tal cual los que no conoce o no tienen valor', () => {
    expect(completarHuecos('{plazo} y {otro} y {meses}', { plazo: '30' })).toBe(
      '30 y {otro} y {meses}',
    );
  });

  it('los números van con su plural, la plata y el porcentaje con su formato', () => {
    const huecos = huecosDelPresupuesto(
      {
        plazoDeFabricacion: 35,
        plantilla: PLANTILLA_DE_SIEMPRE,
        modificacion: null,
        abonado: RELEVAMIENTO,
        monedaDeLoAbonado: 'ARS',
        senaBp: SENA_BP,
      },
      FORMATOS,
    );
    expect(huecos).toEqual({
      plazo: '35',
      modificaciones: '2 modificaciones',
      valor_modificacion: '$50000',
      relevamiento: '$120000',
      sena: '50%',
      meses: '6 meses',
    });
    const enSingular = huecosDelPresupuesto(
      {
        plazoDeFabricacion: 1,
        plantilla: {
          modificacionesIncluidas: 1,
          valorDeUnaModificacion: centavos(0),
          monedaDeLaModificacion: 'ARS',
          garantiaMeses: 1,
        },
        modificacion: null,
        abonado: centavos(0),
        monedaDeLoAbonado: 'ARS',
        senaBp: puntosBasicos(3_333),
      },
      FORMATOS,
    );
    expect(enSingular).toMatchObject({
      modificaciones: '1 modificación',
      meses: '1 mes',
      sena: '33.33%',
    });
  });

  it('el valor de una modificación y lo abonado van cada uno en su moneda', () => {
    const huecos = huecosDelPresupuesto(
      {
        plazoDeFabricacion: 30,
        plantilla: PLANTILLA_DE_SIEMPRE,
        modificacion: { importe: centavosEn('USD', 4_000), moneda: 'USD' },
        abonado: centavosEn('USD', 8_276),
        monedaDeLoAbonado: 'USD',
        senaBp: SENA_BP,
      },
      FORMATOS,
    );
    expect(huecos.valor_modificacion).toBe('US$40');
    expect(huecos.relevamiento).toBe('US$82.76');
  });

  it('la garantía dice sus meses', () => {
    expect(textoDeLaGarantia(PLANTILLA_DE_SIEMPRE)).toMatch(
      /^Garantía de 6 meses desde la entrega/,
    );
  });
});

describe('textoDeLaForma', () => {
  it('sin forma elegida, no hay texto', () => {
    expect(textoDeLaForma(PLANTILLA_DE_SIEMPRE, null)).toBeNull();
  });

  it('sigue a la plantilla mientras no se retoque', () => {
    expect(
      textoDeLaForma(PLANTILLA_DE_SIEMPRE, { plantillaId: 'todo-al-confirmar', texto: null }),
    ).toBe('Pago total al confirmar el trabajo.');
  });

  it('retocada, es el texto de este trabajo', () => {
    expect(
      textoDeLaForma(PLANTILLA_DE_SIEMPRE, { plantillaId: 'sena-y-cuotas', texto: 'En 3 cuotas.' }),
    ).toBe('En 3 cuotas.');
  });

  it('una forma que ya no está en la plantilla no tiene texto', () => {
    expect(textoDeLaForma(PLANTILLA_DE_SIEMPRE, { plantillaId: 'otra', texto: null })).toBeNull();
  });
});

describe('documentoDelPresupuesto', () => {
  it('arma el documento con los textos ya completados', () => {
    const hecho = documento();
    expect(hecho).toMatchObject({
      forma: 1,
      taller: TALLER,
      cliente: 'Paula Benítez',
      titulo: 'Cocina',
      obra: 'Arenales 1840, Palermo',
      valores: { tipo: 'total', total: TOTAL },
      senaBp: SENA_BP,
      abonado: RELEVAMIENTO,
      plazoDeFabricacion: 30,
      validezDias: 15,
      garantiaMeses: 6,
      aTenerEnCuenta: ['No incluye mesada.'],
      formaDePago: 'Seña del 50% para confirmar el trabajo y el saldo contra entrega.',
    });
    expect(hecho.herrajes).toEqual([
      'Correderas telescópicas 500mm con cierre suave.',
      'Bisagras cazoleta de 35 mm.',
    ]);
    expect(hecho.incluye).toHaveLength(5);
    expect(hecho.avisos[0]?.texto).toMatch(
      /^El plazo estimado de fabricación es de 30 días hábiles/,
    );
    expect(hecho.avisos[2]?.texto).toBe(
      'Este presupuesto incluye diseño 3D y hasta 2 modificaciones. Modificaciones adicionales (rediseño completo) tienen un valor estimativo de $50000 c/u.',
    );
    expect(hecho.avisos[3]?.texto).toContain('relevamiento técnico y diseño 3D ($120000)');
    expect(hecho.condiciones[0]).toEqual({
      titulo: 'Condiciones del espacio de instalación',
      texto: PLANTILLA_DE_SIEMPRE.condiciones[0]?.texto,
    });
    expect(hecho.garantia).toMatch(/^Garantía de 6 meses/);
    expect(problemaDelDocumento(hecho)).toBeNull();
  });

  it('sin nada pagado, el aviso del relevamiento no sale', () => {
    const hecho = documento({ abonado: centavos(0) });
    expect(hecho.avisos.some(({ texto }) => texto.includes('relevamiento técnico'))).toBe(false);
    expect(hecho.avisos).toHaveLength(4);
  });

  it('con opciones, las lleva con su letra', () => {
    const hecho = documento({ valores: valoresDelTrabajo(null, [OPCION_A, OPCION_B]) });
    expect(hecho.valores).toMatchObject({ tipo: 'opciones' });
    expect(problemaDelDocumento(hecho)).toBeNull();
  });

  it('limpia los blancos de más, saca lo vacío y suma lo propio de este trabajo', () => {
    const borrador: BorradorDelPresupuesto = {
      ...BORRADOR,
      titulo: '  Cocina   en L ',
      muebles: [...BORRADOR.muebles, { id: 'm3', nombre: '  ', descripcion: '\n' }],
      herrajes: { mostrar: true, lista: [{ id: 'h1', texto: '   ' }] },
      incluye: { tildadas: [], propias: [{ id: 'p1', texto: 'Retiro de los restos.' }] },
      condiciones: { tildadas: [], propias: [] },
    };
    const hecho = documento({ borrador, cliente: '  Paula   Benítez ' });
    expect(hecho.titulo).toBe('Cocina en L');
    expect(hecho.cliente).toBe('Paula Benítez');
    expect(hecho.muebles).toHaveLength(2);
    expect(hecho.herrajes).toEqual([]);
    expect(hecho.incluye).toEqual(['Retiro de los restos.']);
    expect(hecho.condiciones).toEqual([]);
  });

  it('los herrajes que no se muestran no van', () => {
    const borrador = { ...BORRADOR, herrajes: { ...BORRADOR.herrajes, mostrar: false } };
    expect(documento({ borrador }).herrajes).toEqual([]);
  });

  it('sin forma de pago, o con un texto en blanco, no la muestra', () => {
    expect(documento({ borrador: { ...BORRADOR, formaDePago: null } }).formaDePago).toBeNull();
    expect(
      documento({ borrador: { ...BORRADOR, formaDePago: { plantillaId: 'x', texto: '  ' } } })
        .formaDePago,
    ).toBeNull();
  });

  it('un nombre de cliente larguísimo se corta para que el documento se pueda mandar', () => {
    const hecho = documento({ cliente: textoDe(300) });
    expect(hecho.cliente).toHaveLength(200);
    expect(problemaDelDocumento(hecho)).toBeNull();
  });

  it('en pesos que cobra en pesos no lleva cláusula de la moneda, y dice la combinación', () => {
    const hecho = documento();
    expect(hecho.clausulaDeLaMoneda).toBeNull();
    expect(hecho.cobraEn).toEqual(['ARS']);
    expect(monedaDelDocumento(hecho)).toBe('ARS');
    expect(monedaDeLoAbonadoDelDocumento(hecho)).toBe('ARS');
  });

  it('en pesos que acepta dólares sigue en forma 1, con la cláusula de su combinación', () => {
    const hecho = documento({ cobraEn: ['ARS', 'USD'] });
    expect(hecho.forma).toBe(1);
    expect(hecho.clausulaDeLaMoneda).toBe(CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE.pesosEnPesosODolares);
    expect(hecho.cobraEn).toEqual(['ARS', 'USD']);
    expect(problemaDelDocumento(hecho)).toBeNull();
  });

  it('una cláusula retocada en blanco no sale', () => {
    const borrador = { ...BORRADOR, clausulaDeLaMoneda: '  \n ' };
    expect(documento({ borrador, cobraEn: ['USD'] }).clausulaDeLaMoneda).toBeNull();
  });

  it('en dólares es forma 2: la moneda, la referencia en pesos y lo abonado en su moneda', () => {
    const hecho = documentoDelPresupuesto(entradaEnDolares(), FORMATOS);
    expect(hecho).toMatchObject({
      forma: 2,
      moneda: 'USD',
      valores: { tipo: 'total', total: 240_000 },
      abonado: 8_276,
      monedaDeLoAbonado: 'USD',
      referencia: REFERENCIA,
      cobraEn: ['ARS'],
      clausulaDeLaMoneda: CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE.dolaresEnPesos,
    });
    expect(hecho.avisos[3]?.texto).toContain('relevamiento técnico y diseño 3D (US$82.76)');
    expect(monedaDelDocumento(hecho)).toBe('USD');
    expect(monedaDeLoAbonadoDelDocumento(hecho)).toBe('USD');
    expect(problemaDelDocumento(hecho)).toBeNull();
  });

  it('en dólares, lo abonado va en la moneda que eligió el borrador, y la modificación también', () => {
    const borrador: BorradorDelPresupuesto = {
      ...BORRADOR,
      monedaDeLoAbonado: 'ARS',
      modificacion: { importe: centavosEn('USD', 4_000), moneda: 'USD' },
    };
    const hecho = documentoDelPresupuesto(
      entradaEnDolares({ borrador, abonado: centavos(12_000_000) }),
      FORMATOS,
    );
    expect(hecho).toMatchObject({ monedaDeLoAbonado: 'ARS', abonado: 12_000_000 });
    expect(hecho.avisos[2]?.texto).toContain('un valor estimativo de US$40 c/u');
    expect(hecho.avisos[3]?.texto).toContain('($120000)');
  });

  it('en pesos, lo abonado va siempre en pesos aunque el borrador diga otra cosa', () => {
    expect(monedaDeLoAbonado({ monedaDeLoAbonado: 'USD' }, 'ARS')).toBe('ARS');
    expect(monedaDeLoAbonado({ monedaDeLoAbonado: null }, 'USD')).toBe('USD');
  });

  it('la modificación del borrador pisa la de la plantilla', () => {
    expect(modificacionDelPresupuesto(PLANTILLA_DE_SIEMPRE, null)).toEqual({
      importe: 5_000_000,
      moneda: 'ARS',
    });
    expect(
      modificacionDelPresupuesto(PLANTILLA_DE_SIEMPRE, {
        modificacion: { importe: centavosEn('USD', 4_000), moneda: 'USD' },
      }),
    ).toEqual({ importe: 4_000, moneda: 'USD' });
  });
});

describe('cuentasDelPresupuesto', () => {
  it('con un total: la seña, lo pagado, lo que falta y el saldo', () => {
    const [cuenta] = cuentasDelPresupuesto({ tipo: 'total', total: TOTAL }, SENA_BP, RELEVAMIENTO);
    expect(cuenta).toEqual({
      id: null,
      letra: null,
      descripcion: '',
      total: TOTAL,
      sena: centavos(109_050_000),
      pagado: RELEVAMIENTO,
      faltaParaLaSena: centavos(97_050_000),
      saldo: centavos(109_050_000),
    });
  });

  it('la seña de cada opción es la misma cuenta que calcularSena', () => {
    const cuentas = cuentasDelPresupuesto(
      valoresDelTrabajo(null, [OPCION_A, OPCION_B]) ?? { tipo: 'total', total: TOTAL },
      SENA_BP,
      RELEVAMIENTO,
    );
    for (const cuenta of cuentas) {
      const sena = calcularSena({
        presupuesto: cuenta.total,
        cobrado: RELEVAMIENTO,
        porcentajeDelTaller: SENA_BP,
        porcentajeDelTrabajo: null,
      });
      expect(sena.situacion).toBe('falta');
      if (sena.situacion === 'falta') {
        expect(cuenta.sena).toBe(sena.esperada);
        expect(cuenta.faltaParaLaSena).toBe(sena.falta);
      }
    }
    expect(cuentas.map(({ letra }) => letra)).toEqual(['A', 'B']);
  });

  it('con la seña cubierta no falta nada, y el saldo descuenta lo pagado de más', () => {
    const pagado = centavos(150_000_000);
    const [cuenta] = cuentasDelPresupuesto({ tipo: 'total', total: TOTAL }, SENA_BP, pagado);
    expect(cuenta?.faltaParaLaSena).toBe(0);
    expect(cuenta?.saldo).toBe(centavos(68_100_000));
  });

  it('pagado de más que el total, el saldo no queda negativo', () => {
    const [cuenta] = cuentasDelPresupuesto(
      { tipo: 'total', total: centavos(100) },
      SENA_BP,
      centavos(500),
    );
    expect(cuenta?.saldo).toBe(0);
  });
});

describe('la opción aceptada y lo acordado al aprobar', () => {
  const conOpciones = documento({ valores: valoresDelTrabajo(null, [OPCION_A, OPCION_B]) });

  it('deja solo la aceptada', () => {
    const aceptado = soloLaAceptada(conOpciones, OPCION_A.id);
    expect(aceptado.valores).toEqual({
      tipo: 'opciones',
      opciones: [
        { id: OPCION_A.id, letra: 'A', descripcion: OPCION_A.descripcion, total: OPCION_A.monto },
      ],
    });
  });

  it('con un total o sin opción, el documento queda como está', () => {
    const conTotal = documento();
    expect(soloLaAceptada(conTotal, OPCION_A.id)).toBe(conTotal);
    expect(soloLaAceptada(conOpciones, null)).toBe(conOpciones);
  });

  it('una opción que no estaba en lo mandado deja el documento sin valores', () => {
    expect(soloLaAceptada(conOpciones, 'otra').valores).toBeNull();
  });

  it('el total propuesto es el total o la única opción', () => {
    expect(totalPropuesto(null)).toBeNull();
    expect(totalPropuesto({ tipo: 'total', total: TOTAL })).toBe(TOTAL);
    expect(totalPropuesto(soloLaAceptada(conOpciones, OPCION_B.id).valores)).toBe(OPCION_B.monto);
    expect(totalPropuesto(conOpciones.valores)).toBeNull();
    expect(totalPropuesto({ tipo: 'opciones', opciones: [] })).toBeNull();
  });

  it('lo acordado al aprobar sale solo si no es lo que se mandó', () => {
    const aceptada = soloLaAceptada(conOpciones, OPCION_A.id).valores;
    expect(acordadoAlAprobar(aceptada, OPCION_A.monto)).toBeNull();
    expect(acordadoAlAprobar(aceptada, centavos(200_000_000))).toBe(200_000_000);
    expect(acordadoAlAprobar(null, centavos(200_000_000))).toBe(200_000_000);
    expect(acordadoAlAprobar(aceptada, null)).toBeNull();
  });
});

describe('el plazo del presupuesto', () => {
  it('con un presupuesto mandado es el suyo; sin, los 21 días hábiles de siempre', () => {
    expect(plazoDelPresupuesto({ plazoDeFabricacion: 35 })).toBe(35);
    expect(plazoDelPresupuesto(null)).toBe(DIAS_HABILES_DE_ENTREGA);
  });
});

describe('el número y el archivo', () => {
  it('el número visible lleva la revisión desde la segunda', () => {
    expect(numeroVisible(null, 1)).toBe('Sin número todavía');
    expect(numeroVisible('20260826-01', 1)).toBe('Nº 20260826-01');
    expect(numeroVisible('20260826-01', 2)).toBe('Nº 20260826-01 · Rev. 2');
  });

  it('el nombre del archivo lleva el número, la revisión y el cliente', () => {
    const conCliente = { cliente: 'Paula Benítez' };
    expect(nombreDelArchivo(conCliente, '20260826-01', 1)).toBe(
      'Presupuesto 20260826-01 - Paula Benítez.pdf',
    );
    expect(nombreDelArchivo(conCliente, '20260826-01', 2)).toBe(
      'Presupuesto 20260826-01 Rev 2 - Paula Benítez.pdf',
    );
    expect(nombreDelArchivo(conCliente, null, 1)).toBe(
      'Presupuesto (borrador) - Paula Benítez.pdf',
    );
  });

  it('sin caracteres que un sistema no deja en un nombre de archivo', () => {
    expect(nombreDelArchivo({ cliente: 'Ana/Luis: "Casa"*?<>|\\\u0007' }, '20260826-01', 1)).toBe(
      'Presupuesto 20260826-01 - Ana Luis Casa.pdf',
    );
    expect(nombreDelArchivo({ cliente: ' / ' }, '20260826-01', 1)).toBe(
      'Presupuesto 20260826-01.pdf',
    );
  });

  it('el título del archivo, como el pie del documento', () => {
    expect(tituloDelArchivo(null, 1)).toBe('Presupuesto (borrador)');
    expect(tituloDelArchivo('20260826-01', 1)).toBe('Presupuesto 20260826-01');
    expect(tituloDelArchivo('20260826-01', 2)).toBe('Presupuesto 20260826-01 · Rev. 2');
  });

  it('el mensaje para escribirle al taller nombra el presupuesto', () => {
    expect(mensajeParaElTaller('20260826-01', 1)).toBe(
      'Hola, te escribo por el presupuesto Nº 20260826-01.',
    );
    expect(mensajeParaElTaller('20260826-01', 3)).toBe(
      'Hola, te escribo por el presupuesto Nº 20260826-01 Rev. 3.',
    );
  });

  it('reconoce un número y un id del presupuesto', () => {
    expect(esNumeroDePresupuesto('20260826-01')).toBe(true);
    expect(esNumeroDePresupuesto('20260826-123')).toBe(true);
    expect(esNumeroDePresupuesto('20260826-1')).toBe(false);
    expect(esNumeroDePresupuesto(20260826)).toBe(false);
    expect(esIdDelPresupuesto('aviso-plazo')).toBe(true);
    expect(esIdDelPresupuesto('0199a1b2-0000-7000-8000-00000000000a')).toBe(true);
    expect(esIdDelPresupuesto('Aviso')).toBe(false);
    expect(esIdDelPresupuesto(3)).toBe(false);
  });
});

describe('problemasParaMandar', () => {
  it('un documento completo no tiene nada que falte', () => {
    expect(problemasParaMandar(documento(), 1, '')).toEqual([]);
    const conOpciones = documento({ valores: valoresDelTrabajo(null, [OPCION_A, OPCION_B]) });
    expect(problemasParaMandar(conOpciones, 1, '')).toEqual([]);
  });

  it('dice qué falta, en el orden de la pantalla', () => {
    const vacio = documento({
      borrador: {
        ...BORRADOR,
        titulo: ' ',
        muebles: [{ id: 'm1', nombre: 'Sin detalle', descripcion: '' }],
      },
      valores: null,
    });
    expect(problemasParaMandar(vacio, 2, '  ')).toEqual([
      { campo: 'titulo', texto: TEXTOS_DE_LO_QUE_FALTA.titulo },
      { campo: 'muebles', texto: TEXTOS_DE_LO_QUE_FALTA.muebles },
      { campo: 'valores', texto: TEXTOS_DE_LO_QUE_FALTA.total },
      { campo: 'queCambio', texto: TEXTOS_DE_LO_QUE_FALTA.queCambio },
    ]);
  });

  it('un total en cero falta; con opciones, cada una necesita su importe', () => {
    expect(
      problemasParaMandar(documento({ valores: { tipo: 'total', total: centavos(0) } }), 1, ''),
    ).toEqual([{ campo: 'valores', texto: TEXTOS_DE_LO_QUE_FALTA.total }]);
    const conUnaEnCero = valoresDelTrabajo(null, [OPCION_A, { ...OPCION_B, monto: centavos(0) }]);
    expect(problemasParaMandar(documento({ valores: conUnaEnCero }), 1, '')).toEqual([
      { campo: 'valores', texto: TEXTOS_DE_LO_QUE_FALTA.opciones },
    ]);
    expect(
      problemasParaMandar(documento({ valores: { tipo: 'opciones', opciones: [] } }), 1, ''),
    ).toEqual([{ campo: 'valores', texto: TEXTOS_DE_LO_QUE_FALTA.opciones }]);
  });

  it('desde la segunda revisión pide qué cambió, en 280 caracteres como mucho', () => {
    expect(problemasParaMandar(documento(), 2, 'Cambió el color.')).toEqual([]);
    expect(problemasParaMandar(documento(), 2, ` ${textoDe(280, 'é')} `)).toEqual([]);
    expect(problemasParaMandar(documento(), 2, textoDe(281))).toEqual([
      { campo: 'queCambio', texto: TEXTOS_DE_LO_QUE_FALTA.queCambioLargo },
    ]);
  });
});

describe('resumenDeLosValores y abonadoEn', () => {
  it('resume el total o las opciones', () => {
    expect(resumenDeLosValores(null, pesos)).toBeNull();
    expect(resumenDeLosValores({ tipo: 'total', total: TOTAL }, pesos)).toBe('$2181000');
    expect(resumenDeLosValores(valoresDelTrabajo(null, [OPCION_A, OPCION_B]), pesos)).toBe(
      'Opción A $2181000 · Opción B $2740000',
    );
  });

  const DOLAR = cotizacion(145_000);
  const PAGOS: ImporteDeUnPago[] = [
    { moneda: 'ARS', monto: centavos(12_000_000), cotizacion: DOLAR },
    { moneda: 'USD', monto: centavosEn('USD', 50_000), cotizacion: DOLAR },
  ];

  it('suma lo pagado en pesos en un trabajo en pesos', () => {
    expect(
      abonadoEn(
        [
          { moneda: 'ARS', monto: centavos(100), cotizacion: null },
          { moneda: 'ARS', monto: centavos(250), cotizacion: null },
        ],
        'ARS',
        'ARS',
      ),
    ).toBe(350);
  });

  it('en un trabajo en dólares, en dólares es lo que descontó y en pesos lo que valió cada pago', () => {
    expect(abonadoEn(PAGOS, 'USD', 'USD')).toBe(8_276 + 50_000);
    expect(abonadoEn(PAGOS, 'USD', 'ARS')).toBe(12_000_000 + 72_500_000);
  });

  it('en un trabajo en pesos, un pago en dólares cuenta lo que descontó en pesos', () => {
    expect(abonadoEn(PAGOS, 'ARS', 'ARS')).toBe(12_000_000 + 72_500_000);
  });
});

describe('hayCambiosSinMandar', () => {
  const mandado = documento();

  it('sin nada mandado, todo es nuevo', () => {
    expect(hayCambiosSinMandar(entrada(), null, FORMATOS)).toBe(true);
  });

  it('lo mismo que se mandó no es un cambio, aunque haya pagado algo más o cambien los datos del taller', () => {
    expect(
      hayCambiosSinMandar(
        entrada({ abonado: centavos(50_000_000), taller: { ...TALLER, telefono: '11 5555-0000' } }),
        mandado,
        FORMATOS,
      ),
    ).toBe(false);
  });

  it('un texto, un plazo o un importe distinto es un cambio', () => {
    expect(
      hayCambiosSinMandar(
        entrada({ borrador: { ...BORRADOR, plazoDeFabricacion: 35 } }),
        mandado,
        FORMATOS,
      ),
    ).toBe(true);
    expect(
      hayCambiosSinMandar(
        entrada({ valores: { tipo: 'total', total: centavos(1) } }),
        mandado,
        FORMATOS,
      ),
    ).toBe(true);
    expect(hayCambiosSinMandar(entrada({ valores: null }), mandado, FORMATOS)).toBe(true);
  });

  it('compara la forma entera: una lista que no es lista o una clave de más es otra cosa', () => {
    const conObjeto = { ...mandado, herrajes: {} } as unknown as DocumentoDelPresupuesto;
    expect(hayCambiosSinMandar(entrada(), conObjeto, FORMATOS)).toBe(true);
    const conOtraClave = { ...mandado, extra: 1 } as unknown as DocumentoDelPresupuesto;
    expect(hayCambiosSinMandar(entrada(), conOtraClave, FORMATOS)).toBe(true);
  });
});

describe('leerDocumento', () => {
  it('lee lo que se armó tal cual', () => {
    const hecho = documento({ valores: valoresDelTrabajo(null, [OPCION_A, OPCION_B]) });
    expect(leerDocumento(copia(hecho))).toEqual(hecho);
  });

  it('no lee lo que no es un documento', () => {
    expect(leerDocumento(null)).toBeNull();
    expect(leerDocumento('documento')).toBeNull();
    expect(leerDocumento({ forma: 2 })).toBeNull();
  });

  it('completa lo que falta con lo de siempre', () => {
    expect(leerDocumento({ forma: 1 })).toEqual({
      forma: 1,
      taller: {
        nombre: '',
        titular: '',
        cuit: '',
        condicionFiscal: null,
        domicilio: '',
        telefono: '',
        email: '',
      },
      cliente: '',
      titulo: '',
      obra: '',
      descripcion: '',
      muebles: [],
      herrajes: [],
      aTenerEnCuenta: [],
      incluye: [],
      valores: null,
      senaBp: 5_000,
      abonado: 0,
      formaDePago: null,
      clausulaDeLaMoneda: null,
      cobraEn: ['ARS'],
      plazoDeFabricacion: 30,
      validezDias: null,
      avisos: [],
      condiciones: [],
      garantia: '',
      garantiaMeses: 6,
    });
  });

  it('un documento de antes de los dólares se lee con la combinación de siempre, igual que uno nuevo', () => {
    const hecho = documento();
    const deAntes = copia(hecho);
    delete deAntes.clausulaDeLaMoneda;
    delete deAntes.cobraEn;
    expect(leerDocumento(deAntes)).toEqual(hecho);
  });

  it('lee un documento en dólares con su referencia, y sin referencia no lo lee', () => {
    const enDolares = documentoDelPresupuesto(entradaEnDolares(), FORMATOS);
    expect(leerDocumento(copia(enDolares))).toEqual(enDolares);
    expect(leerDocumento({ ...copia(enDolares), referencia: null })).toBeNull();
    expect(
      leerDocumento({ ...copia(enDolares), referencia: { cotizacion: 99, fecha: '2026-10-01' } }),
    ).toBeNull();
    expect(
      leerDocumento({
        ...copia(enDolares),
        referencia: { cotizacion: 154_000, fecha: '2026-02-30' },
      }),
    ).toBeNull();
    expect(leerDocumento({ ...copia(enDolares), moneda: 'ARS' })).toBeNull();
    expect(leerDocumento({ ...copia(enDolares), monedaDeLoAbonado: 'EUR' })).toMatchObject({
      monedaDeLoAbonado: 'USD',
    });
  });

  it('tolera cada pieza rota sin tirar el resto', () => {
    const leido = leerDocumento({
      forma: 1,
      taller: { nombre: 'Taller', condicionFiscal: 'otra' },
      muebles: ['no', { nombre: '', descripcion: '' }, { nombre: 'Rack' }],
      herrajes: ['Bisagras', 4, ''],
      valores: {
        tipo: 'opciones',
        opciones: [
          'no',
          { id: 3, total: 1 },
          { id: 'a', total: 1.5 },
          { id: 'b', total: 100, descripcion: 'Una', letra: '' },
        ],
      },
      senaBp: 10_001,
      abonado: 'mucho',
      plazoDeFabricacion: 0,
      validezDias: 366,
      avisos: [
        { texto: 'Un aviso.', titulo: '' },
        { texto: '' },
        'no',
        { titulo: 'T', texto: 'Dos.' },
      ],
      garantiaMeses: 3,
    });
    expect(leido).toMatchObject({
      taller: { nombre: 'Taller', condicionFiscal: null },
      muebles: [{ nombre: 'Rack', descripcion: '' }],
      herrajes: ['Bisagras'],
      valores: {
        tipo: 'opciones',
        opciones: [{ id: 'b', letra: 'D', descripcion: 'Una', total: 100 }],
      },
      senaBp: 5_000,
      abonado: 0,
      plazoDeFabricacion: 30,
      validezDias: null,
      avisos: [
        { titulo: null, texto: 'Un aviso.' },
        { titulo: 'T', texto: 'Dos.' },
      ],
      garantiaMeses: 6,
    });
  });

  it('valores rotos se leen como sin valores', () => {
    const conValores = (valores: unknown) => leerDocumento({ forma: 1, valores })?.valores;
    expect(conValores('total')).toBeNull();
    expect(conValores({ tipo: 'total', total: '1' })).toBeNull();
    expect(conValores({ tipo: 'total', total: 5 })).toEqual({ tipo: 'total', total: 5 });
    expect(conValores({ tipo: 'otro' })).toBeNull();
    expect(conValores({ tipo: 'opciones', opciones: {} })).toBeNull();
    expect(conValores({ tipo: 'opciones', opciones: [] })).toBeNull();
  });
});

describe('problemaDelBorrador', () => {
  function conCambios(cambios: Record<string, unknown>): Record<string, unknown> {
    return { ...copia(BORRADOR), ...cambios };
  }

  function seleccion(cambios: Record<string, unknown> = {}): Record<string, unknown> {
    return { tildadas: [], propias: [], ...cambios };
  }

  it('un borrador a medio armar se puede guardar', () => {
    expect(problemaDelBorrador(BORRADOR)).toBeNull();
    expect(
      problemaDelBorrador(
        conCambios({
          titulo: '',
          muebles: [],
          descripcion: '',
          formaDePago: null,
          validezDias: null,
        }),
      ),
    ).toBeNull();
    expect(
      problemaDelBorrador(
        conCambios({ formaDePago: { plantillaId: 'sena-y-cuotas', texto: 'Otro.' } }),
      ),
    ).toBeNull();
  });

  it('la forma que no es la de un borrador', () => {
    expect(problemaDelBorrador(null)).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ forma: 2 }))).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ titulo: 3 }))).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ obra: null }))).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ descripcion: undefined }))).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ muebles: {} }))).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ muebles: [{ id: 'm1', nombre: 'Rack' }] }))).toBe(
      'forma-invalida',
    );
    expect(problemaDelBorrador(conCambios({ herrajes: [] }))).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ herrajes: { mostrar: 'si', lista: [] } }))).toBe(
      'forma-invalida',
    );
    expect(
      problemaDelBorrador(conCambios({ herrajes: { mostrar: true, lista: [{ id: 'h' }] } })),
    ).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ incluye: [] }))).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ avisos: seleccion({ tildadas: [3] }) }))).toBe(
      'forma-invalida',
    );
    expect(
      problemaDelBorrador(conCambios({ avisos: seleccion({ propias: [{ texto: 'x' }] }) })),
    ).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ formaDePago: undefined }))).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ formaDePago: { plantillaId: 'a', texto: 3 } }))).toBe(
      'forma-invalida',
    );
    expect(problemaDelBorrador(conCambios({ formaDePago: 'a' }))).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ plazoDeFabricacion: '30' }))).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ validezDias: undefined }))).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ validezDias: 1.5 }))).toBe('forma-invalida');
  });

  it('los largos del título, la obra y la descripción', () => {
    expect(problemaDelBorrador(conCambios({ titulo: textoDe(201) }))).toBe('titulo-largo');
    expect(problemaDelBorrador(conCambios({ titulo: textoDe(200, '🪚') }))).toBeNull();
    expect(problemaDelBorrador(conCambios({ obra: textoDe(301) }))).toBe('obra-larga');
    expect(problemaDelBorrador(conCambios({ descripcion: textoDe(4001) }))).toBe(
      'descripcion-larga',
    );
  });

  it('los muebles', () => {
    const mueble = (cambios: Record<string, unknown> = {}) => ({
      id: 'm1',
      nombre: 'Rack',
      descripcion: '',
      ...cambios,
    });
    expect(
      problemaDelBorrador(
        conCambios({
          muebles: Array.from({ length: 31 }, (_, i) => mueble({ id: `m-${String(i)}` })),
        }),
      ),
    ).toBe('demasiados-muebles');
    expect(problemaDelBorrador(conCambios({ muebles: [mueble({ id: 'M1' })] }))).toBe(
      'id-invalido',
    );
    expect(problemaDelBorrador(conCambios({ muebles: [mueble(), mueble()] }))).toBe('id-repetido');
    expect(problemaDelBorrador(conCambios({ muebles: [mueble({ nombre: textoDe(121) })] }))).toBe(
      'nombre-del-mueble-largo',
    );
    expect(
      problemaDelBorrador(conCambios({ muebles: [mueble({ descripcion: textoDe(4001) })] })),
    ).toBe('detalle-del-mueble-largo');
  });

  it('los herrajes', () => {
    const herraje = (cambios: Record<string, unknown> = {}) => ({
      id: 'h1',
      texto: 'Bisagras',
      ...cambios,
    });
    const conLista = (lista: unknown[]) => conCambios({ herrajes: { mostrar: true, lista } });
    expect(
      problemaDelBorrador(
        conLista(Array.from({ length: 41 }, (_, i) => herraje({ id: `h-${String(i)}` }))),
      ),
    ).toBe('demasiados-herrajes');
    expect(problemaDelBorrador(conLista([herraje({ id: '' })]))).toBe('id-invalido');
    expect(problemaDelBorrador(conLista([herraje(), herraje()]))).toBe('id-repetido');
    expect(problemaDelBorrador(conLista([herraje({ texto: textoDe(201) })]))).toBe('herraje-largo');
  });

  it('las selecciones: lo tildado y lo propio', () => {
    const veintiuna = Array.from({ length: 21 }, (_, i) => `c-${String(i)}`);
    expect(problemaDelBorrador(conCambios({ avisos: seleccion({ tildadas: veintiuna }) }))).toBe(
      'demasiadas-tildadas',
    );
    expect(problemaDelBorrador(conCambios({ avisos: seleccion({ tildadas: ['Una'] }) }))).toBe(
      'id-invalido',
    );
    expect(
      problemaDelBorrador(conCambios({ avisos: seleccion({ tildadas: ['una', 'una'] }) })),
    ).toBe('id-repetido');
    const propia = (cambios: Record<string, unknown> = {}) => ({
      id: 'p1',
      texto: 'Algo.',
      ...cambios,
    });
    expect(
      problemaDelBorrador(
        conCambios({
          condiciones: seleccion({
            propias: Array.from({ length: 21 }, (_, i) => propia({ id: `p-${String(i)}` })),
          }),
        }),
      ),
    ).toBe('demasiadas-propias');
    expect(
      problemaDelBorrador(
        conCambios({ condiciones: seleccion({ propias: [propia({ id: '!' })] }) }),
      ),
    ).toBe('id-invalido');
    expect(
      problemaDelBorrador(
        conCambios({ condiciones: seleccion({ propias: [propia(), propia()] }) }),
      ),
    ).toBe('id-repetido');
    expect(
      problemaDelBorrador(
        conCambios({ condiciones: seleccion({ propias: [propia({ texto: textoDe(1001) })] }) }),
      ),
    ).toBe('propia-larga');
  });

  it('la forma de pago, el plazo y la validez', () => {
    expect(
      problemaDelBorrador(conCambios({ formaDePago: { plantillaId: 'A', texto: null } })),
    ).toBe('id-invalido');
    expect(
      problemaDelBorrador(conCambios({ formaDePago: { plantillaId: 'a', texto: textoDe(2001) } })),
    ).toBe('forma-de-pago-larga');
    expect(problemaDelBorrador(conCambios({ plazoDeFabricacion: 0 }))).toBe('plazo-fuera-de-rango');
    expect(problemaDelBorrador(conCambios({ plazoDeFabricacion: 366 }))).toBe(
      'plazo-fuera-de-rango',
    );
    expect(problemaDelBorrador(conCambios({ validezDias: 0 }))).toBe('validez-fuera-de-rango');
    expect(problemaDelBorrador(conCambios({ validezDias: 366 }))).toBe('validez-fuera-de-rango');
  });

  it('la cláusula de la moneda, la modificación y lo abonado: sus formas y sus topes', () => {
    expect(problemaDelBorrador(conCambios({ clausulaDeLaMoneda: 3 }))).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ clausulaDeLaMoneda: textoDe(2001) }))).toBe(
      'clausula-de-la-moneda-larga',
    );
    expect(problemaDelBorrador(conCambios({ clausulaDeLaMoneda: textoDe(2000) }))).toBeNull();
    expect(problemaDelBorrador(conCambios({ modificacion: { importe: 1 } }))).toBe(
      'forma-invalida',
    );
    expect(problemaDelBorrador(conCambios({ modificacion: { importe: 1.5, moneda: 'USD' } }))).toBe(
      'forma-invalida',
    );
    expect(
      problemaDelBorrador(
        conCambios({
          modificacion: { importe: IMPORTE_MAXIMO_DEL_PRESUPUESTO + 1, moneda: 'USD' },
        }),
      ),
    ).toBe('modificacion-fuera-de-rango');
    expect(problemaDelBorrador(conCambios({ modificacion: { importe: -1, moneda: 'ARS' } }))).toBe(
      'modificacion-fuera-de-rango',
    );
    expect(problemaDelBorrador(conCambios({ modificacion: { importe: 0, moneda: 'USD' } }))).toBe(
      null,
    );
    expect(problemaDelBorrador(conCambios({ monedaDeLoAbonado: 'EUR' }))).toBe('forma-invalida');
    expect(problemaDelBorrador(conCambios({ monedaDeLoAbonado: 'ARS' }))).toBeNull();
  });

  it('un borrador de antes de los dólares, sin las claves nuevas, se puede guardar', () => {
    const deAntes = copia(BORRADOR);
    delete deAntes.clausulaDeLaMoneda;
    delete deAntes.modificacion;
    delete deAntes.monedaDeLoAbonado;
    expect(problemaDelBorrador(deAntes)).toBeNull();
  });
});

describe('leerBorrador', () => {
  it('lee un borrador guardado tal cual', () => {
    expect(leerBorrador(copia(BORRADOR), PLANTILLA_DE_SIEMPRE)).toEqual(BORRADOR);
    const retocado: BorradorDelPresupuesto = {
      ...BORRADOR,
      formaDePago: { plantillaId: 'sena-y-cuotas', texto: 'En tres cuotas.' },
    };
    expect(leerBorrador(copia(retocado), PLANTILLA_DE_SIEMPRE)).toEqual(retocado);
  });

  it('no lee lo que no es un borrador', () => {
    expect(leerBorrador(null, PLANTILLA_DE_SIEMPRE)).toBeNull();
    expect(leerBorrador({ forma: 2 }, PLANTILLA_DE_SIEMPRE)).toBeNull();
  });

  it('completa lo que falta con lo de la plantilla', () => {
    expect(leerBorrador({ forma: 1 }, PLANTILLA_DE_SIEMPRE)).toEqual({
      forma: 1,
      titulo: '',
      obra: '',
      descripcion: '',
      muebles: [],
      herrajes: { mostrar: true, lista: [] },
      aTenerEnCuenta: tildadasPorDefecto(PLANTILLA_DE_SIEMPRE.aTenerEnCuenta),
      incluye: tildadasPorDefecto(PLANTILLA_DE_SIEMPRE.incluye),
      formaDePago: { plantillaId: 'sena-y-entrega', texto: null },
      plazoDeFabricacion: 30,
      validezDias: 15,
      avisos: tildadasPorDefecto(PLANTILLA_DE_SIEMPRE.avisos),
      condiciones: tildadasPorDefecto(PLANTILLA_DE_SIEMPRE.condiciones),
      clausulaDeLaMoneda: null,
      modificacion: null,
      monedaDeLoAbonado: null,
    });
  });

  it('lee la cláusula, la modificación y lo abonado de un trabajo en dólares', () => {
    const enDolares: BorradorDelPresupuesto = {
      ...BORRADOR,
      clausulaDeLaMoneda: 'Al dólar MEP.',
      modificacion: { importe: centavosEn('USD', 4_000), moneda: 'USD' },
      monedaDeLoAbonado: 'ARS',
    };
    expect(leerBorrador(copia(enDolares), PLANTILLA_DE_SIEMPRE)).toEqual(enDolares);
    expect(
      leerBorrador(
        { forma: 1, modificacion: { importe: 'x', moneda: 'USD' }, monedaDeLoAbonado: 'EUR' },
        PLANTILLA_DE_SIEMPRE,
      ),
    ).toMatchObject({ modificacion: null, monedaDeLoAbonado: null });
    expect(
      leerBorrador({ forma: 1, modificacion: { importe: 1, moneda: 'EUR' } }, PLANTILLA_DE_SIEMPRE)
        ?.modificacion,
    ).toBeNull();
  });

  it('tolera cada pieza rota', () => {
    const sinFormas: PlantillaDelPresupuesto = { ...PLANTILLA_DE_SIEMPRE, formasDePago: [] };
    const leido = leerBorrador(
      {
        forma: 1,
        muebles: ['no', { id: 'm1', nombre: 'Rack', descripcion: 'Rack flotante.' }],
        herrajes: { mostrar: false, lista: 'no' },
        avisos: { tildadas: 'no', propias: [{ id: 'p', texto: 'Propia.' }, { id: 3 }] },
        incluye: { tildadas: ['uno', 2], propias: 'no' },
        formaDePago: { plantillaId: 'sena-y-cuotas', texto: 4 },
        plazoDeFabricacion: 0,
        validezDias: null,
      },
      sinFormas,
    );
    expect(leido).toMatchObject({
      muebles: [{ id: 'm1', nombre: 'Rack', descripcion: 'Rack flotante.' }],
      herrajes: { mostrar: false, lista: [] },
      avisos: { tildadas: [], propias: [{ id: 'p', texto: 'Propia.' }] },
      incluye: { tildadas: ['uno'], propias: [] },
      formaDePago: { plantillaId: 'sena-y-cuotas', texto: null },
      plazoDeFabricacion: 30,
      validezDias: null,
    });
    expect(
      leerBorrador({ forma: 1, formaDePago: null }, PLANTILLA_DE_SIEMPRE)?.formaDePago,
    ).toBeNull();
    expect(leerBorrador({ forma: 1, validezDias: 400 }, PLANTILLA_DE_SIEMPRE)?.validezDias).toBe(
      15,
    );
    expect(leerBorrador({ forma: 1, formaDePago: 'x' }, sinFormas)?.formaDePago).toBeNull();
  });
});

describe('problemaDelDocumento', () => {
  const valido = documento({ valores: valoresDelTrabajo(null, [OPCION_A, OPCION_B]) });

  function conCambios(cambios: Record<string, unknown>): Record<string, unknown> {
    return { ...copia(valido), ...cambios };
  }

  it('un documento armado por la app se puede mandar, también sin valores', () => {
    expect(problemaDelDocumento(valido)).toBeNull();
    expect(
      problemaDelDocumento(conCambios({ valores: null, validezDias: null, formaDePago: null })),
    ).toBeNull();
  });

  it('la forma que no es la de un documento', () => {
    expect(problemaDelDocumento('documento')).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ forma: 0 }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ taller: null }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ taller: { ...TALLER, email: null } }))).toBe(
      'forma-invalida',
    );
    expect(
      problemaDelDocumento(conCambios({ taller: { ...TALLER, condicionFiscal: 'otra' } })),
    ).toBe('forma-invalida');
    expect(
      problemaDelDocumento(conCambios({ taller: { ...TALLER, condicionFiscal: null } })),
    ).toBeNull();
    const { condicionFiscal: _sinCondicion, ...tallerIncompleto } = TALLER;
    expect(problemaDelDocumento(conCambios({ taller: tallerIncompleto }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ cliente: 1 }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ muebles: [{ nombre: 'x' }] }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ herrajes: [1] }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ valores: 'total' }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ valores: { tipo: 'total', total: 1.5 } }))).toBe(
      'forma-invalida',
    );
    expect(problemaDelDocumento(conCambios({ valores: { tipo: 'total', total: 1 } }))).toBeNull();
    expect(
      problemaDelDocumento(conCambios({ valores: { tipo: 'opciones', opciones: [{ id: 'a' }] } })),
    ).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ valores: { tipo: 'otro' } }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ senaBp: '50' }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ abonado: undefined }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ formaDePago: 3 }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ plazoDeFabricacion: null }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ validezDias: undefined }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ avisos: [{ titulo: 3, texto: 'x' }] }))).toBe(
      'forma-invalida',
    );
    expect(
      problemaDelDocumento(conCambios({ avisos: [{ texto: 'Sin la clave del título.' }] })),
    ).toBeNull();
    expect(problemaDelDocumento(conCambios({ condiciones: ['x'] }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ garantia: null }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ garantiaMeses: '6' }))).toBe('forma-invalida');
  });

  it('los números fuera de su rango', () => {
    expect(problemaDelDocumento(conCambios({ senaBp: -1 }))).toBe('sena-fuera-de-rango');
    expect(problemaDelDocumento(conCambios({ senaBp: 10_001 }))).toBe('sena-fuera-de-rango');
    expect(problemaDelDocumento(conCambios({ abonado: -1 }))).toBe('abonado-fuera-de-rango');
    expect(problemaDelDocumento(conCambios({ abonado: IMPORTE_MAXIMO_DEL_PRESUPUESTO + 1 }))).toBe(
      'abonado-fuera-de-rango',
    );
    expect(problemaDelDocumento(conCambios({ plazoDeFabricacion: 0 }))).toBe(
      'plazo-fuera-de-rango',
    );
    expect(problemaDelDocumento(conCambios({ validezDias: 0 }))).toBe('validez-fuera-de-rango');
    expect(problemaDelDocumento(conCambios({ garantiaMeses: 5 }))).toBe('garantia-fuera-de-rango');
    expect(problemaDelDocumento(conCambios({ valores: { tipo: 'total', total: -5 } }))).toBe(
      'importe-fuera-de-rango',
    );
    const opcionCara = {
      id: 'a',
      letra: 'A',
      descripcion: '',
      total: IMPORTE_MAXIMO_DEL_PRESUPUESTO + 1,
    };
    expect(
      problemaDelDocumento(conCambios({ valores: { tipo: 'opciones', opciones: [opcionCara] } })),
    ).toBe('importe-fuera-de-rango');
  });

  it('los topes de las listas', () => {
    const mueble = { nombre: 'Rack', descripcion: '' };
    expect(
      problemaDelDocumento(conCambios({ muebles: Array.from({ length: 31 }, () => mueble) })),
    ).toBe('demasiados-muebles');
    expect(
      problemaDelDocumento(conCambios({ herrajes: Array.from({ length: 41 }, () => 'h') })),
    ).toBe('demasiados-herrajes');
    expect(
      problemaDelDocumento(conCambios({ incluye: Array.from({ length: 41 }, () => 'i') })),
    ).toBe('demasiadas-clausulas');
    const opcion = (i: number) => ({ id: `o-${String(i)}`, letra: 'A', descripcion: '', total: 1 });
    expect(
      problemaDelDocumento(
        conCambios({
          valores: { tipo: 'opciones', opciones: Array.from({ length: 27 }, (_, i) => opcion(i)) },
        }),
      ),
    ).toBe('demasiadas-opciones');
  });

  it('cualquier texto más largo que su tope', () => {
    expect(problemaDelDocumento(conCambios({ taller: { ...TALLER, cuit: textoDe(14) } }))).toBe(
      'texto-largo',
    );
    expect(problemaDelDocumento(conCambios({ cliente: textoDe(201) }))).toBe('texto-largo');
    expect(
      problemaDelDocumento(conCambios({ avisos: [{ titulo: textoDe(121), texto: 'x' }] })),
    ).toBe('texto-largo');
    expect(problemaDelDocumento(conCambios({ garantia: textoDe(4001) }))).toBe('texto-largo');
    expect(problemaDelDocumento(conCambios({ garantia: textoDe(4000) }))).toBeNull();
  });

  it('la cláusula de la moneda y la combinación, también en forma 1', () => {
    const deAntes = copia(valido);
    delete deAntes.clausulaDeLaMoneda;
    delete deAntes.cobraEn;
    expect(problemaDelDocumento(deAntes)).toBeNull();
    expect(problemaDelDocumento(conCambios({ clausulaDeLaMoneda: 4 }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ cobraEn: ['USD', 'ARS'] }))).toBe('forma-invalida');
    expect(problemaDelDocumento(conCambios({ cobraEn: ['USD'] }))).toBeNull();
    expect(problemaDelDocumento(conCambios({ clausulaDeLaMoneda: textoDe(4001) }))).toBe(
      'texto-largo',
    );
    expect(problemaDelDocumento(conCambios({ clausulaDeLaMoneda: textoDe(4000) }))).toBeNull();
  });

  describe('en dólares', () => {
    const enDolares = copia(documentoDelPresupuesto(entradaEnDolares(), FORMATOS));

    function conCambiosEnDolares(cambios: Record<string, unknown>): Record<string, unknown> {
      return { ...enDolares, ...cambios };
    }

    it('se puede mandar con su moneda, su referencia y la moneda de lo abonado', () => {
      expect(problemaDelDocumento(enDolares)).toBeNull();
    });

    it('le falta algo de lo suyo, o la moneda no es otra que la del taller', () => {
      expect(problemaDelDocumento(conCambiosEnDolares({ moneda: undefined }))).toBe(
        'forma-invalida',
      );
      expect(problemaDelDocumento(conCambiosEnDolares({ moneda: 'ARS' }))).toBe('forma-invalida');
      expect(problemaDelDocumento(conCambiosEnDolares({ moneda: 'EUR' }))).toBe('forma-invalida');
      expect(problemaDelDocumento(conCambiosEnDolares({ monedaDeLoAbonado: null }))).toBe(
        'forma-invalida',
      );
      expect(problemaDelDocumento(conCambiosEnDolares({ referencia: null }))).toBe(
        'forma-invalida',
      );
      expect(
        problemaDelDocumento(
          conCambiosEnDolares({ referencia: { cotizacion: '1540', fecha: '2026-10-01' } }),
        ),
      ).toBe('forma-invalida');
      expect(
        problemaDelDocumento(conCambiosEnDolares({ referencia: { cotizacion: 154_000 } })),
      ).toBe('forma-invalida');
      expect(
        problemaDelDocumento(
          conCambiosEnDolares({ referencia: { cotizacion: 154_000, fecha: '2026-13-01' } }),
        ),
      ).toBe('forma-invalida');
    });

    it('la cotización de la referencia va de $ 1 a $ 100.000 por dólar', () => {
      const conCotizacion = (cotizacion: number) =>
        problemaDelDocumento(
          conCambiosEnDolares({ referencia: { cotizacion, fecha: '2026-10-01' } }),
        );
      expect(conCotizacion(99)).toBe('cotizacion-fuera-de-rango');
      expect(conCotizacion(10_000_001)).toBe('cotizacion-fuera-de-rango');
      expect(conCotizacion(100)).toBeNull();
      expect(conCotizacion(10_000_000)).toBeNull();
    });
  });
});

describe('las cuentas no se apartan de la plata', () => {
  it('un importe es un entero de centavos', () => {
    const cuentas = cuentasDelPresupuesto(
      { tipo: 'total', total: centavos(333) },
      puntosBasicos(5_000),
      centavos(0),
    );
    const [cuenta] = cuentas;
    expect(Number.isSafeInteger(cuenta?.sena as Money)).toBe(true);
    expect(cuenta?.sena).toBe(167);
  });
});

import {
  centavos,
  centavosEn,
  CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE,
  PLANTILLA_DE_SIEMPRE,
  plantillaDeSiempre,
  problemaDeLaPlantilla,
  type PlantillaDelPresupuesto,
} from '@maun/domain';
import { describe, expect, it } from 'vitest';

import type { FilaDe, Json } from '@/shared/api';

import {
  borradorDeLaPantalla,
  borradorDeLosAjustes,
  cambiosDeLaPantalla,
  cobroParaUsar,
  cuantosCambios,
  datosDelTexto,
  diferenciasDeLosDatos,
  encabezadoDelPresupuesto,
  loQueSeDeshace,
  mismaPlantilla,
  moverEnLaLista,
  partesDelTexto,
  plantillaDeLosAjustes,
  plantillaDelBorrador,
  problemasDeLaPantalla,
  queFalta,
  sinLoQuitado,
  textoDeLosCambios,
  valoresDeMuestra,
  type BorradorDeLaPantalla,
} from './presupuestoDelTaller';

const AJUSTES = {
  id: 'a1',
  household_id: 'h',
  sena_bp: 5000,
  relevamiento_centavos: 12_000_000,
  cobro_titular: '',
  cobro_cuit: '',
  taller_titular: 'Ana Pérez',
  taller_cuit: '27-12345678-9',
  taller_condicion_fiscal: 'monotributo',
  taller_domicilio: 'Av. Siempreviva 742',
  taller_telefono: '',
  taller_email: '',
  plantilla_del_presupuesto: null,
  plantilla_del_presupuesto_version: 0,
} as unknown as FilaDe<'ajustes'>;

function ajustes(cambios: Record<string, unknown> = {}): FilaDe<'ajustes'> {
  return { ...AJUSTES, ...cambios };
}

const DE_SIEMPRE = borradorDeLosAjustes(AJUSTES, 'Taller de prueba');

function conAvisos(
  borrador: BorradorDeLaPantalla,
  avisos: BorradorDeLaPantalla['listas']['avisos'],
): BorradorDeLaPantalla {
  return { ...borrador, listas: { ...borrador.listas, avisos } };
}

describe('lo guardado en los ajustes', () => {
  it('sin plantilla propia, o con una que no se puede leer, son los textos de siempre', () => {
    expect(plantillaDeLosAjustes(AJUSTES)).toBe(PLANTILLA_DE_SIEMPRE);
    expect(plantillaDeLosAjustes(ajustes({ plantilla_del_presupuesto: { forma: 2 } }))).toBe(
      PLANTILLA_DE_SIEMPRE,
    );
    expect(plantillaDeLosAjustes(ajustes({ idioma_de_los_clientes: 'pt-BR' }))).toBe(
      plantillaDeSiempre('pt-BR'),
    );
    const propia: PlantillaDelPresupuesto = { ...PLANTILLA_DE_SIEMPRE, plazoDeFabricacion: 35 };
    expect(
      plantillaDeLosAjustes(ajustes({ plantilla_del_presupuesto: propia as unknown as Json }))
        .plazoDeFabricacion,
    ).toBe(35);
  });

  it('los datos del taller salen de sus columnas, y una condición desconocida queda vacía', () => {
    expect(DE_SIEMPRE.datos).toEqual({
      titular: 'Ana Pérez',
      cuit: '27-12345678-9',
      condicionFiscal: 'monotributo',
      domicilio: 'Av. Siempreviva 742',
      telefono: '',
      email: '',
    });
    expect(
      borradorDeLosAjustes(ajustes({ taller_condicion_fiscal: 'otra' }), 'x').datos.condicionFiscal,
    ).toBe('');
  });

  it('ofrece el titular y el CUIT de «Cómo te pagan» solo si hay algo cargado ahí', () => {
    expect(cobroParaUsar(AJUSTES)).toBeNull();
    expect(cobroParaUsar(ajustes({ cobro_titular: ' Mariano Ruiz ', cobro_cuit: '' }))).toEqual({
      titular: 'Mariano Ruiz',
      cuit: '',
    });
  });

  it('volver a armar la plantilla desde la pantalla sin tocar nada da la misma', () => {
    expect(plantillaDelBorrador(DE_SIEMPRE)).toEqual(PLANTILLA_DE_SIEMPRE);
    expect(mismaPlantilla(DE_SIEMPRE, borradorDeLosAjustes(AJUSTES, 'otro nombre'))).toBe(true);
  });
});

describe('los datos que se completan solos', () => {
  it('parte el texto en lo escrito y las fichas, y deja las llaves que no son un dato', () => {
    expect(partesDelTexto('Dura {meses} y {nada} más')).toEqual([
      { tipo: 'texto', texto: 'Dura ' },
      { tipo: 'dato', hueco: 'meses' },
      { tipo: 'texto', texto: ' y {nada} más' },
    ]);
    expect(datosDelTexto('{plazo} días y {sena}')).toEqual(['plazo', 'sena']);
  });

  it('los ejemplos salen de los números, y si uno no es válido, de lo guardado', () => {
    const valores = valoresDeMuestra(
      { plazo: '45', modificaciones: '', valor: null, garantia: '3' },
      DE_SIEMPRE.numeros,
      AJUSTES,
    );
    expect(valores.plazo).toBe('45');
    expect(valores.modificaciones).toBe('2 modificaciones');
    expect(valores.meses).toBe('6 meses');
    expect(valores.valor_modificacion.replace(/\s/g, ' ')).toBe('$ 50.000');
    expect(valores.sena).toBe('50%');
    expect(valores.relevamiento.replace(/\s/g, ' ')).toBe('$ 120.000');
    expect(
      valoresDeMuestra(
        { plazo: '1', modificaciones: '1', valor: 0, garantia: '1' },
        DE_SIEMPRE.numeros,
        ajustes({ relevamiento_centavos: null }),
      ),
    ).toMatchObject({ modificaciones: '1 modificación', meses: '6 meses' });
  });

  it('en otro idioma de los clientes, los ejemplos se escriben como los lee el cliente', () => {
    const enIngles = ajustes({ idioma_de_los_clientes: 'en' });
    const valores = valoresDeMuestra(
      borradorDeLosAjustes(enIngles, 'x').numeros,
      DE_SIEMPRE.numeros,
      enIngles,
    );
    expect(valores).toMatchObject({
      modificaciones: '2 modifications',
      meses: '6 months',
      sena: '50%',
    });
    expect(valores.valor_modificacion.replace(/\s/g, ' ')).toBe('ARS 50,000');
  });
});

describe('lo que cambió en la pantalla', () => {
  it('cuenta lo nuevo, lo cambiado, lo quitado, el orden, las tildes, los datos y los números', () => {
    const [primero, segundo, ...resto] = DE_SIEMPRE.listas.avisos;
    if (primero === undefined || segundo === undefined) throw new Error('faltan avisos');
    const cambiado: BorradorDeLaPantalla = {
      ...conAvisos(DE_SIEMPRE, [
        { ...segundo, tildadaPorDefecto: !segundo.tildadaPorDefecto },
        { ...primero, texto: `${primero.texto} Algo más.` },
        ...resto.map((aviso, indice) => (indice === 0 ? { ...aviso, quitada: true } : aviso)),
        { id: 'nuevo', titulo: '', texto: 'Uno nuevo.', tildadaPorDefecto: true, quitada: false },
      ]),
      datos: { ...DE_SIEMPRE.datos, telefono: '11 5555-0000' },
      numeros: { ...DE_SIEMPRE.numeros, plazo: '40' },
    };
    const cambios = cambiosDeLaPantalla(cambiado, DE_SIEMPRE);
    expect(cambios).toEqual({
      datos: true,
      numeros: true,
      nuevas: 1,
      cambiadas: 1,
      quitadas: 1,
      orden: true,
      tildes: true,
      hay: true,
    });
    expect(textoDeLosCambios(cambios)).toBe(
      'tus datos, los números, un texto nuevo, uno cambiado, uno quitado, el orden y lo que sale tildado',
    );
    expect(cuantosCambios(cambios)).toBe('7 cambios');
    expect(cambiosDeLaPantalla(DE_SIEMPRE, DE_SIEMPRE).hay).toBe(false);
    expect(cuantosCambios({ ...cambiosDeLaPantalla(DE_SIEMPRE, DE_SIEMPRE), datos: true })).toBe(
      '1 cambio',
    );
  });

  it('quitar lo que está tachado y mover salteando lo tachado', () => {
    const [primero, segundo, tercero] = DE_SIEMPRE.listas.avisos;
    if (primero === undefined || segundo === undefined || tercero === undefined) {
      throw new Error('faltan avisos');
    }
    const filas = [primero, { ...segundo, quitada: true }, tercero];
    expect(moverEnLaLista(filas, tercero.id, -1).map(({ id }) => id)).toEqual([
      tercero.id,
      primero.id,
      segundo.id,
    ]);
    expect(moverEnLaLista(filas, primero.id, -1)).toEqual(filas);
    expect(sinLoQuitado(conAvisos(DE_SIEMPRE, filas)).listas.avisos).toEqual([primero, tercero]);
  });

  it('un texto de varios cuenta en plural desde el segundo tipo', () => {
    const cambios = {
      ...cambiosDeLaPantalla(DE_SIEMPRE, DE_SIEMPRE),
      nuevas: 2,
      quitadas: 3,
      hay: true,
    };
    expect(textoDeLosCambios(cambios)).toBe('2 textos nuevos y 3 quitados');
  });
});

describe('lo que frena el guardado', () => {
  it('sin nada mal, no hay problemas', () => {
    expect(problemasDeLaPantalla(DE_SIEMPRE)).toEqual([]);
  });

  it('cada campo dice qué revisar, en el orden de la pantalla', () => {
    const [aviso] = DE_SIEMPRE.listas.avisos;
    if (aviso === undefined) throw new Error('falta un aviso');
    const mal: BorradorDeLaPantalla = {
      ...conAvisos(DE_SIEMPRE, [{ ...aviso, texto: '   ' }]),
      datos: { ...DE_SIEMPRE.datos, cuit: '27-1234', email: 'no es un mail' },
      numeros: { plazo: '0', modificaciones: '11', valor: null, garantia: '3' },
      formas: DE_SIEMPRE.formas.map((forma) => ({ ...forma, quitada: true })),
      garantia: ' ',
    };
    const problemas = problemasDeLaPantalla(mal);
    expect(problemas.map(({ campo }) => campo)).toEqual([
      'cuit',
      'email',
      'plazo',
      'garantia',
      'modificaciones',
      'valor',
      `texto:${aviso.id}`,
      'formas',
      'texto-de-la-garantia',
    ]);
    expect(problemas.find(({ campo }) => campo === 'garantia')?.mensaje).toBe(
      'La ley pide por lo menos 6 meses.',
    );
    expect(
      problemasDeLaPantalla({ ...DE_SIEMPRE, numeros: { ...DE_SIEMPRE.numeros, garantia: 'x' } })[0]
        ?.mensaje,
    ).toBe('Escribí los meses de garantía, entre 6 y 120.');
  });

  it('una forma de pago sin nombre o sin texto, y un texto demasiado largo', () => {
    const [forma] = DE_SIEMPRE.formas;
    const [condicion] = DE_SIEMPRE.listas.condiciones;
    if (forma === undefined || condicion === undefined) throw new Error('faltan textos');
    const problemas = problemasDeLaPantalla({
      ...DE_SIEMPRE,
      formas: [{ ...forma, nombre: ' ', texto: '' }],
      listas: {
        ...DE_SIEMPRE.listas,
        condiciones: [{ ...condicion, texto: 'x'.repeat(2001) }],
      },
      garantia: 'y'.repeat(2001),
    });
    expect(problemas.map(({ campo }) => campo)).toEqual([
      `texto:${condicion.id}`,
      `nombre:${forma.id}`,
      `texto:${forma.id}`,
      'texto-de-la-garantia',
    ]);
    expect(problemas[0]?.queRevisar).toBe('un texto muy largo');
  });

  it('los datos más largos de lo que guarda la base también frenan', () => {
    const problemas = problemasDeLaPantalla({
      ...DE_SIEMPRE,
      datos: {
        ...DE_SIEMPRE.datos,
        titular: 'n'.repeat(121),
        domicilio: 'd'.repeat(301),
        telefono: '1'.repeat(41),
      },
    });
    expect(problemas.map(({ campo }) => campo)).toEqual(['titular', 'domicilio', 'telefono']);
  });
});

describe('el membrete y lo que se guarda de los datos', () => {
  it('arma los renglones como el PDF y dice qué falta de lo que pide la ley', () => {
    expect(encabezadoDelPresupuesto(DE_SIEMPRE.datos)).toEqual({
      renglones: [
        ['Ana Pérez', 'CUIT 27-12345678-9'],
        ['Responsable Monotributo'],
        ['Av. Siempreviva 742'],
      ],
      faltan: [],
    });
    const vacios = encabezadoDelPresupuesto({
      titular: '',
      cuit: '',
      condicionFiscal: '',
      domicilio: '',
      telefono: '11 5555-0000',
      email: 'taller@ejemplo.com',
    });
    expect(vacios.renglones).toEqual([['11 5555-0000', 'taller@ejemplo.com']]);
    expect(queFalta(vacios.faltan)).toBe('tu CUIT y tu domicilio');
    expect(queFalta(['tu CUIT'])).toBe('tu CUIT');
  });

  it('manda solo las columnas que cambiaron, con el CUIT con guiones y la condición vacía en null', () => {
    expect(
      diferenciasDeLosDatos(AJUSTES, {
        ...DE_SIEMPRE.datos,
        cuit: '20301112220',
        condicionFiscal: '',
        email: ' taller@ejemplo.com ',
      }),
    ).toEqual({
      cambios: {
        taller_cuit: '20-30111222-0',
        taller_condicion_fiscal: null,
        taller_email: 'taller@ejemplo.com',
      },
      previos: {
        taller_cuit: '27-12345678-9',
        taller_condicion_fiscal: 'monotributo',
        taller_email: '',
      },
    });
    expect(diferenciasDeLosDatos(AJUSTES, DE_SIEMPRE.datos).cambios).toEqual({});
  });
});

describe('volver a los textos de siempre', () => {
  it('con los de siempre no hay nada que deshacer', () => {
    const valores = valoresDeMuestra(DE_SIEMPRE.numeros, DE_SIEMPRE.numeros, AJUSTES);
    expect(loQueSeDeshace(PLANTILLA_DE_SIEMPRE, valores, PLANTILLA_DE_SIEMPRE)).toEqual([]);
  });

  it('dice cada cosa que vuelve: lo agregado se va, lo quitado vuelve y los números vuelven', () => {
    const valores = valoresDeMuestra(DE_SIEMPRE.numeros, DE_SIEMPRE.numeros, AJUSTES);
    const [primerAviso, ...otrosAvisos] = PLANTILLA_DE_SIEMPRE.avisos;
    const [incluye] = PLANTILLA_DE_SIEMPRE.incluye;
    if (primerAviso === undefined || incluye === undefined) throw new Error('faltan textos');
    const propia: PlantillaDelPresupuesto = {
      ...PLANTILLA_DE_SIEMPRE,
      plazoDeFabricacion: 35,
      valorDeUnaModificacion: centavos(6_000_000),
      garantiaMeses: 12,
      incluye: [{ ...incluye, tildadaPorDefecto: false }, ...PLANTILLA_DE_SIEMPRE.incluye.slice(1)],
      avisos: [
        ...otrosAvisos,
        {
          id: 'reserva',
          titulo: null,
          texto: 'La fecha de producción se reserva con la seña.',
          tildadaPorDefecto: true,
        },
      ],
      formasDePago: PLANTILLA_DE_SIEMPRE.formasDePago.slice(0, 2),
      garantia: 'Otra garantía.',
    };
    const cosas = loQueSeDeshace(propia, valores, PLANTILLA_DE_SIEMPRE);
    expect(cosas.map(({ icono }) => icono)).toEqual([
      'list-checks',
      'minus',
      'plus',
      'wallet',
      'shield',
      'calendar',
      'pencil-ruler',
      'shield',
    ]);
    expect(cosas[1]?.texto).toBe(
      'Se va el aviso que agregaste: «La fecha de producción se reserva con la seña.»',
    );
  });
});

describe('las cláusulas de los dólares y la moneda de una modificación', () => {
  it('arrancan en las de siempre, una por combinación, y la modificación en pesos', () => {
    expect(DE_SIEMPRE.clausulasDeLaMoneda).toEqual(CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE);
    expect(DE_SIEMPRE.monedaDelValor).toBe('ARS');
    const enPortugues = borradorDeLosAjustes(ajustes({ idioma_de_los_clientes: 'pt-BR' }), 'x');
    expect(enPortugues.clausulasDeLaMoneda).toEqual(
      plantillaDeSiempre('pt-BR').clausulasDeLaMoneda,
    );
  });

  it('lo guardado es lo que se escribió, sin los blancos de las puntas, y la moneda del valor', () => {
    const propia = plantillaDelBorrador({
      ...DE_SIEMPRE,
      monedaDelValor: 'USD',
      numeros: { ...DE_SIEMPRE.numeros, valor: 4_000 },
      clausulasDeLaMoneda: {
        ...DE_SIEMPRE.clausulasDeLaMoneda,
        dolaresEnPesos: '  Se paga en pesos al dólar MEP del día anterior.  ',
      },
    });
    expect(propia.clausulasDeLaMoneda.dolaresEnPesos).toBe(
      'Se paga en pesos al dólar MEP del día anterior.',
    );
    expect(propia).toMatchObject({ monedaDeLaModificacion: 'USD', valorDeUnaModificacion: 4_000 });
    expect(problemaDeLaPlantilla(propia)).toBeNull();
    expect(
      plantillaDeLosAjustes(ajustes({ plantilla_del_presupuesto: propia as unknown as Json })),
    ).toMatchObject({
      monedaDeLaModificacion: 'USD',
      clausulasDeLaMoneda: propia.clausulasDeLaMoneda,
    });
  });

  it('una cláusula cambiada cuenta como un texto cambiado, y la moneda del valor como los números', () => {
    const conOtraClausula: BorradorDeLaPantalla = {
      ...DE_SIEMPRE,
      clausulasDeLaMoneda: { ...DE_SIEMPRE.clausulasDeLaMoneda, pesosEnDolares: 'Otra.' },
    };
    expect(cambiosDeLaPantalla(conOtraClausula, DE_SIEMPRE)).toMatchObject({
      cambiadas: 1,
      numeros: false,
      hay: true,
    });
    expect(cambiosDeLaPantalla({ ...DE_SIEMPRE, monedaDelValor: 'USD' }, DE_SIEMPRE)).toMatchObject(
      { numeros: true, cambiadas: 0, hay: true },
    );
  });

  it('una cláusula vacía o demasiado larga frena el guardado y dice cuál', () => {
    const problemas = problemasDeLaPantalla({
      ...DE_SIEMPRE,
      clausulasDeLaMoneda: {
        ...DE_SIEMPRE.clausulasDeLaMoneda,
        dolaresEnDolares: '  ',
        pesosEnPesosODolares: 'x'.repeat(2001),
      },
    });
    expect(problemas).toEqual([
      {
        campo: 'clausula:dolaresEnDolares',
        mensaje: 'Escribí cómo se toma el dólar en esta combinación.',
        queRevisar: 'una cláusula de los dólares',
      },
      {
        campo: 'clausula:pesosEnPesosODolares',
        mensaje: 'Un texto entra en 2000 caracteres.',
        queRevisar: 'una cláusula de los dólares',
      },
    ]);
  });

  it('el ejemplo del valor de una modificación va en su moneda', () => {
    const valores = valoresDeMuestra(DE_SIEMPRE.numeros, DE_SIEMPRE.numeros, AJUSTES, 'USD');
    expect(valores.valor_modificacion.replace(/\s/g, ' ')).toBe('US$ 50.000');
  });

  it('volver a los de siempre dice que vuelven las cláusulas y la modificación en pesos', () => {
    const valores = valoresDeMuestra(DE_SIEMPRE.numeros, DE_SIEMPRE.numeros, AJUSTES);
    const propia: PlantillaDelPresupuesto = {
      ...PLANTILLA_DE_SIEMPRE,
      valorDeUnaModificacion: centavosEn('USD', 5_000_000),
      monedaDeLaModificacion: 'USD',
      clausulasDeLaMoneda: { ...CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE, dolaresEnPesos: 'Otra.' },
    };
    const cosas = loQueSeDeshace(propia, valores, PLANTILLA_DE_SIEMPRE);
    expect(cosas.map(({ texto }) => texto.replace(/\s/g, ' '))).toEqual([
      'Las cláusulas de los dólares vuelven a sus textos de siempre.',
      'Vuelven a entrar 2 modificaciones, y cada una de más vale $ 50.000.',
    ]);
  });
});

describe('el borrador de la pantalla', () => {
  it('lleva una fila por cláusula, sin tachar, y las formas de pago en su orden', () => {
    const borrador = borradorDeLaPantalla(
      {
        nombre: 'Taller',
        titular: '',
        cuit: '',
        condicionFiscal: null,
        domicilio: '',
        telefono: '',
        email: '',
      },
      PLANTILLA_DE_SIEMPRE,
      'es',
    );
    expect(borrador.listas.incluye).toHaveLength(PLANTILLA_DE_SIEMPRE.incluye.length);
    expect(borrador.listas.incluye.every(({ quitada }) => !quitada)).toBe(true);
    expect(borrador.formas.map(({ id }) => id)).toEqual(
      PLANTILLA_DE_SIEMPRE.formasDePago.map(({ id }) => id),
    );
    expect(borrador.datos.condicionFiscal).toBe('');
  });
});

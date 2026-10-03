import { describe, expect, it } from 'vitest';

import { analisisDeEntregas, type CambioDeFechaParaElAnalisis } from './analitico.ts';
import { SIN_ESTIMAR, type CostosEstimados } from './costos.ts';
import { cotizacion } from './cotizacion.ts';
import {
  baseDeLasEstadisticas,
  deCadaCien,
  estadisticasDelPeriodo,
  ETAPAS_ANOTADAS_DESDE,
  hayAlgoParaContar,
  lasConsultas,
  lasEntregas,
  lasEntregasNormales,
  lasOpiniones,
  loQueGastaste,
  loQueTeDejaron,
  loQueViene,
  PRIMEROS_DE_LO_QUE_MAS_USAS,
  resumenDelPeriodo,
  UMBRAL_DE_COMPARACION,
  UMBRAL_DEL_EMBUDO,
  type BaseDeLasEstadisticas,
  type CambioDeEstadoParaLasEstadisticas,
  type ContextoDeLasEstadisticas,
  type DatosDeLasEstadisticas,
  type GastoDelTaller,
  type GastoDeUnTrabajo,
  type LiquidacionParaLasEstadisticas,
  type NecesidadParaLasEstadisticas,
  type TrabajoParaLasEstadisticas,
} from './estadisticas.ts';
import type { EstadoProyecto } from './estados.ts';
import { correrMes, mesDe, mesesDelRango, sumarDias } from './fechas.ts';
import { filaDelMes, filaDeSiempre, type LiquidacionDelMes } from './fila.ts';
import type { IndiceDePrecios } from './inflacion.ts';
import { centavos, centavosEn } from './money.ts';
import {
  resumenDeOpiniones,
  type DatosDeLasOpiniones,
  type EncuestaGuardada,
  type PreguntaDeLaEncuesta,
  type PreguntaGuardada,
  type RespuestaGuardada,
  type TextosDeLasEscalas,
  type ValorGuardado,
} from './opiniones.ts';
import {
  columnasDelPeriodo,
  resolverElPeriodo,
  type LargoDelPeriodo,
  type PeriodoResuelto,
} from './periodos.ts';

const HOY = '2027-06-18';

function pesos(cantidad: number) {
  return centavos(cantidad * 100);
}

const PLANO: IndiceDePrecios = {
  fuente: 'de prueba',
  desde: '2026-01',
  hasta: '2027-04',
  valores: Array.from({ length: 16 }, () => 100),
};

const CON_INFLACION: IndiceDePrecios = {
  fuente: 'de prueba',
  desde: '2027-01',
  hasta: '2027-04',
  valores: [100, 100, 100, 125],
};

const VIEJO: IndiceDePrecios = {
  fuente: 'de prueba',
  desde: '2027-01',
  hasta: '2027-03',
  valores: [100, 100, 50],
};

const PALABRAS: TextosDeLasEscalas = {
  conformidad: {
    1: { etiqueta: 'Nada conforme', corta: 'Nada' },
    2: { etiqueta: 'Poco conforme', corta: 'Poco' },
    3: { etiqueta: 'Más o menos', corta: 'Más o menos' },
    4: { etiqueta: 'Conforme', corta: 'Conforme' },
    5: { etiqueta: 'Muy conforme', corta: 'Muy conforme' },
  },
  tiempos: {
    1: { etiqueta: 'Muy tarde', corta: 'Muy tarde' },
    2: { etiqueta: 'Tarde', corta: 'Tarde' },
    3: { etiqueta: 'Más o menos', corta: 'Más o menos' },
    4: { etiqueta: 'A tiempo', corta: 'A tiempo' },
    5: { etiqueta: 'Antes', corta: 'Antes' },
  },
  trato: {
    1: { etiqueta: 'Malo', corta: 'Malo' },
    2: { etiqueta: 'Regular', corta: 'Regular' },
    3: { etiqueta: 'Bien', corta: 'Bien' },
    4: { etiqueta: 'Muy bien', corta: 'Muy bien' },
    5: { etiqueta: 'Excelente', corta: 'Excelente' },
  },
  sitalvezno: {
    1: { etiqueta: 'No', corta: 'No' },
    2: { etiqueta: 'Tal vez', corta: 'Tal vez' },
    3: { etiqueta: 'Sí', corta: 'Sí' },
  },
};

const SIN_OPINIONES: DatosDeLasOpiniones = {
  preguntas: [],
  encuestas: [],
  respuestas: [],
  trabajos: [],
};

function contexto(indice: IndiceDePrecios = PLANO, hoy = HOY): ContextoDeLasEstadisticas {
  return { hoy, indice, escalas: PALABRAS };
}

function datos(parcial: Partial<DatosDeLasEstadisticas> = {}): DatosDeLasEstadisticas {
  return {
    liquidaciones: [],
    gastosDeLosTrabajos: [],
    gastosDelTaller: [],
    necesidades: [],
    trabajos: [],
    cambiosDeEstado: [],
    cambiosDeFecha: [],
    ...parcial,
  };
}

function liquidacion(
  id: string,
  fecha: string,
  neta: number,
  cambios: Partial<LiquidacionParaLasEstadisticas> = {},
): LiquidacionParaLasEstadisticas {
  return {
    id,
    titulo: `Trabajo ${id}`,
    estado: 'cobrado',
    fecha,
    cobrado: pesos(neta * 2),
    gastos: pesos(neta),
    moneda: 'ARS',
    precio: pesos(neta * 2),
    costos: SIN_ESTIMAR,
    cotizacionDeLosCostos: null,
    ...cambios,
  };
}

function trabajo(
  id: string,
  cambios: Partial<TrabajoParaLasEstadisticas> = {},
): TrabajoParaLasEstadisticas {
  return {
    id,
    titulo: `Trabajo ${id}`,
    tipo: null,
    estado: 'en_curso',
    inicio: null,
    listo: null,
    entregado: null,
    clienteId: `cliente-${id}`,
    moneda: 'ARS',
    precio: null,
    descontado: centavos(0),
    entregaEstimada: null,
    entregaComprometida: null,
    ...cambios,
  };
}

function cambioDeEstado(
  id: string,
  proyectoId: string,
  desde: EstadoProyecto | null,
  hacia: EstadoProyecto,
  ocurrioEl: string,
  anotadoEn = `${ocurrioEl}T12:00:00Z`,
): CambioDeEstadoParaLasEstadisticas {
  return { id, proyectoId, desde, hacia, ocurrioEl, anotadoEn };
}

function comprometida(id: string, proyectoId: string, fecha: string): CambioDeFechaParaElAnalisis {
  return {
    id,
    proyectoId,
    tipo: 'comprometida',
    fecha,
    origen: 'taller',
    creadoEn: `${fecha}T00:00:00Z`,
    trabajosEnCurso: 1,
  };
}

function gasto(
  id: string,
  fecha: string,
  monto: number,
  categoria: GastoDeUnTrabajo['categoria'] = null,
): GastoDeUnTrabajo {
  return { id, proyectoId: 'p1', fecha, monto: pesos(monto), categoria };
}

function delTaller(id: string, fecha: string, monto: number, categoria: string): GastoDelTaller {
  return { id, fecha, monto: pesos(monto), categoria };
}

function necesidad(
  proyectoId: string,
  nombre: string,
  alta: string,
  tipo: NecesidadParaLasEstadisticas['tipo'] = 'material',
): NecesidadParaLasEstadisticas {
  return { proyectoId, tipo, nombre, alta };
}

function periodo(
  base: BaseDeLasEstadisticas,
  meses: LargoDelPeriodo,
  hasta: string,
  hoy = HOY,
): PeriodoResuelto {
  return resolverElPeriodo({ meses, hasta }, hoy, base.primerMes);
}

function dejaron(
  base: BaseDeLasEstadisticas,
  resuelto: PeriodoResuelto,
  indice: IndiceDePrecios = PLANO,
  hoy = HOY,
) {
  return loQueTeDejaron(
    base,
    resuelto,
    columnasDelPeriodo(resuelto, mesDe(hoy), base.primerMes),
    contexto(indice, hoy),
  );
}

function generador(semilla: number): (tope: number) => number {
  let estado = semilla;
  return (tope) => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4_294_967_296) * tope);
  };
}

function diaAlAzar(azar: (tope: number) => number, desde: string, dias: number): string {
  return sumarDias(desde, azar(dias));
}

describe('la base, armada una vez por réplica', () => {
  it('el primer mes es el más viejo de todo lo que cuenta la página', () => {
    expect(baseDeLasEstadisticas(datos(), SIN_OPINIONES).primerMes).toBeNull();
    const base = baseDeLasEstadisticas(
      datos({
        liquidaciones: [liquidacion('a', '2026-11-10', 100)],
        gastosDelTaller: [delTaller('g', '2026-09-03', 10, 'Herramientas')],
      }),
      SIN_OPINIONES,
    );
    expect(base.primerMes).toBe('2026-09');
  });

  it('cada fuente puede ser la del primer mes', () => {
    const fuentes: Partial<DatosDeLasEstadisticas>[] = [
      { liquidaciones: [liquidacion('a', '2025-03-10', 100)] },
      { gastosDeLosTrabajos: [gasto('g', '2025-03-10', 10)] },
      { gastosDelTaller: [delTaller('g', '2025-03-10', 10, 'Otro')] },
      {
        trabajos: [trabajo('p1')],
        necesidades: [necesidad('p1', 'Melamina', '2025-03-10')],
      },
      {
        trabajos: [trabajo('p1', { estado: 'entregado', entregado: '2025-03-10' })],
      },
      {
        trabajos: [trabajo('p1', { estado: 'contacto' })],
        cambiosDeEstado: [cambioDeEstado('c', 'p1', null, 'contacto', '2025-03-10')],
      },
    ];
    for (const fuente of fuentes) {
      expect(baseDeLasEstadisticas(datos(fuente), SIN_OPINIONES).primerMes).toBe('2025-03');
    }
    const conUnaEncuesta = baseDeLasEstadisticas(datos(), {
      ...SIN_OPINIONES,
      encuestas: [encuesta('e', 'p1', '2025-03-10')],
    });
    expect(conUnaEncuesta.primerMes).toBe('2025-03');
  });

  it('ordena las liquidaciones por fecha, título e id, y las agrupa por mes', () => {
    const base = baseDeLasEstadisticas(
      datos({
        liquidaciones: [
          liquidacion('c', '2027-05-09', 100, { titulo: 'B' }),
          liquidacion('b', '2027-05-09', 100, { titulo: 'A' }),
          liquidacion('a', '2027-05-09', 100, { titulo: 'B' }),
          liquidacion('d', '2027-04-01', 100),
        ],
      }),
      SIN_OPINIONES,
    );
    expect(base.liquidaciones.map((una) => una.id)).toEqual(['d', 'b', 'a', 'c']);
    expect(base.liquidacionesPorMes.get('2027-05')?.map((una) => una.id)).toEqual(['b', 'a', 'c']);
    expect(base.liquidaciones[0]?.neta).toBe(pesos(100));
  });
});

describe('① lo que te dejaron los trabajos', () => {
  const actuales = [
    liquidacion('abr', '2027-04-10', 1_000_000),
    liquidacion('may1', '2027-05-09', 2_260_000, {
      cobrado: pesos(3_900_000),
      gastos: pesos(1_640_000),
      precio: pesos(3_900_000),
      costos: {
        madera: pesos(1_200_000),
        herrajes: pesos(300_000),
        flete: pesos(100_000),
        ayudante: pesos(272_000),
      },
    }),
    liquidacion('may2', '2027-05-17', 1_190_000),
    liquidacion('may3', '2027-05-28', 1_750_000),
    liquidacion('jun1', '2027-06-02', 500_000, {
      estado: 'perdido',
      cobrado: pesos(500_000),
      gastos: pesos(0),
    }),
    liquidacion('jun2', '2027-06-05', 800_000, {
      moneda: 'USD',
      cobrado: pesos(1_000_000),
      gastos: pesos(200_000),
      precio: centavosEn('USD', 100_000),
      costos: {
        madera: pesos(300_000),
        herrajes: pesos(0),
        flete: pesos(0),
        ayudante: pesos(0),
      },
      cotizacionDeLosCostos: cotizacion(100_000),
    }),
  ];
  const anteriores = [
    liquidacion('ene', '2027-01-10', 1_000_000),
    liquidacion('feb1', '2027-02-10', 1_200_000),
    liquidacion('feb2', '2027-02-20', 1_000_000),
    liquidacion('mar1', '2027-03-05', 800_000),
    liquidacion('mar2', '2027-03-15', 1_000_000),
    liquidacion('mar3', '2027-03-25', 9_000_000),
  ];
  const base = baseDeLasEstadisticas(
    datos({ liquidaciones: [...actuales, ...anteriores] }),
    SIN_OPINIONES,
  );

  it('suma la neta de lo cobrado y de la seña de los perdidos, como pasó', () => {
    const resultado = dejaron(base, periodo(base, 3, '2027-06'));
    expect(resultado.total).toBe(pesos(7_500_000));
    expect(resultado.cobrado).toBe(pesos(13_280_000));
    expect(resultado.deCada100).toBe(56);
    expect(resultado.cobrados).toBe(5);
    expect(resultado.perdidos).toBe(1);
    expect(resultado.enDolares).toBe(1);
  });

  it('la suma de la lista del período es la cifra', () => {
    const resultado = dejaron(base, periodo(base, 3, '2027-06'));
    const suma = resultado.liquidaciones.reduce((total, una) => total + una.neta, 0);
    expect(suma).toBe(resultado.total);
    expect(resultado.liquidaciones.map((una) => una.id)).toEqual([
      'abr',
      'may1',
      'may2',
      'may3',
      'jun1',
      'jun2',
    ]);
    const enLasColumnas = resultado.columnas
      .filter((columna) => columna.enElPeriodo)
      .reduce((total, columna) => total + columna.comoSeCobro, 0);
    expect(enLasColumnas).toBe(resultado.total);
  });

  it('las columnas van mes por mes, con los de antes del período de contexto', () => {
    const resultado = dejaron(base, periodo(base, 3, '2027-06'), CON_INFLACION);
    expect(resultado.columnas).toHaveLength(12);
    const marzo = resultado.columnas.find((columna) => columna.clave === '2027-03');
    expect(marzo?.enElPeriodo).toBe(false);
    expect(marzo?.comoSeCobro).toBe(pesos(10_800_000));
    expect(marzo?.enPesosDeHoy).toBe(pesos(13_500_000));
    const mayo = resultado.columnas.find((columna) => columna.clave === '2027-05');
    expect(mayo?.liquidaciones).toHaveLength(3);
    expect(mayo?.enPesosDeHoy).toBe(pesos(5_200_000));
    expect(resultado.deflactado).toBe(true);
  });

  it('el mejor mes se elige en pesos de hoy, entre los meses del período con algo', () => {
    const resultado = dejaron(base, periodo(base, 3, '2027-06'), CON_INFLACION);
    expect(resultado.mejor?.clave).toBe('2027-05');
    const soloMayo = baseDeLasEstadisticas(
      datos({ liquidaciones: actuales.slice(1, 4) }),
      SIN_OPINIONES,
    );
    expect(dejaron(soloMayo, periodo(soloMayo, 3, '2027-06')).mejor).toBeNull();
  });

  it('contra el período anterior, en pesos de hoy y hasta el mismo día', () => {
    expect(dejaron(base, periodo(base, 3, '2027-06'), CON_INFLACION).cambio).toEqual({
      modo: 'porcentaje',
      porcentaje: 20,
      sentido: 'mas',
    });
    expect(dejaron(base, periodo(base, 3, '2027-06')).cambio).toEqual({
      modo: 'porcentaje',
      porcentaje: 50,
      sentido: 'mas',
    });
  });

  it('con el índice viejo compara en pesos de cada mes', () => {
    const resultado = dejaron(base, periodo(base, 3, '2027-06'), VIEJO);
    expect(resultado.deflactado).toBe(false);
    expect(resultado.cambio).toMatchObject({ modo: 'porcentaje', porcentaje: 50 });
  });

  it('con menos de 5 liquidaciones en alguno de los dos, dice la plata de antes y cuántos faltan', () => {
    expect(UMBRAL_DE_COMPARACION).toBe(5);
    const pocasAhora = baseDeLasEstadisticas(
      datos({ liquidaciones: [...actuales.slice(0, 3), ...anteriores] }),
      SIN_OPINIONES,
    );
    expect(dejaron(pocasAhora, periodo(pocasAhora, 3, '2027-06')).cambio).toEqual({
      modo: 'plata',
      total: pesos(5_000_000),
      trabajos: 5,
      faltanCasos: true,
    });
    const pocasAntes = baseDeLasEstadisticas(
      datos({ liquidaciones: [...actuales, ...anteriores.slice(0, 2)] }),
      SIN_OPINIONES,
    );
    expect(dejaron(pocasAntes, periodo(pocasAntes, 3, '2027-06')).cambio).toEqual({
      modo: 'plata',
      total: pesos(2_200_000),
      trabajos: 2,
      faltanCasos: true,
    });
  });

  it('con un período anterior en pérdida, no hay porcentaje: dice la plata, sin pedir más casos', () => {
    const enPerdida = anteriores
      .slice(0, 5)
      .map((una) => ({ ...una, cobrado: pesos(100), gastos: pesos(1_000) }));
    const conPerdida = baseDeLasEstadisticas(
      datos({ liquidaciones: [...actuales, ...enPerdida] }),
      SIN_OPINIONES,
    );
    expect(dejaron(conPerdida, periodo(conPerdida, 3, '2027-06')).cambio).toEqual({
      modo: 'plata',
      total: pesos(-4_500),
      trabajos: 5,
      faltanCasos: false,
    });
  });

  it('sin nada antes, lo dice; con «todo», no compara', () => {
    const sinAntes = baseDeLasEstadisticas(datos({ liquidaciones: actuales }), SIN_OPINIONES);
    expect(dejaron(sinAntes, periodo(sinAntes, 3, '2027-06')).cambio).toEqual({
      modo: 'sin-anterior',
    });
    expect(dejaron(base, periodo(base, 'todo', '2027-06')).cambio).toEqual({
      modo: 'sin-comparacion',
    });
  });

  it('si los gastos se comieron lo cobrado, no hay «de cada $ 100»', () => {
    const perdida = baseDeLasEstadisticas(
      datos({
        liquidaciones: [
          liquidacion('a', '2027-06-01', 100, { cobrado: pesos(100), gastos: pesos(300) }),
        ],
      }),
      SIN_OPINIONES,
    );
    const resultado = dejaron(perdida, periodo(perdida, 3, '2027-06'));
    expect(resultado.total).toBe(pesos(-200));
    expect(resultado.deCada100).toBeNull();
  });

  it('lo estimado contra lo que te quedó: solo cobrados con los cuatro costos, de mayor a menor', () => {
    const resultado = dejaron(base, periodo(base, 3, '2027-06'));
    expect(resultado.estimado).toEqual([
      { id: 'jun2', titulo: 'Trabajo jun2', estimado: 70, real: 80 },
      { id: 'may1', titulo: 'Trabajo may1', estimado: 52, real: 58 },
    ]);
  });

  it('deja afuera lo que no se puede estimar bien', () => {
    const cuatro: CostosEstimados = {
      madera: pesos(100),
      herrajes: pesos(100),
      flete: pesos(100),
      ayudante: pesos(100),
    };
    const casos = [
      liquidacion('tres-costos', '2027-06-01', 1_000, {
        costos: { ...cuatro, ayudante: null },
      }),
      liquidacion('sin-precio', '2027-06-01', 1_000, { costos: cuatro, precio: null }),
      liquidacion('precio-cero', '2027-06-01', 1_000, { costos: cuatro, precio: pesos(0) }),
      liquidacion('sin-costos', '2027-06-01', 1_000),
      liquidacion('perdido', '2027-06-01', 1_000, { costos: cuatro, estado: 'perdido' }),
      liquidacion('sin-cobrar', '2027-06-01', 0, { costos: cuatro, cobrado: pesos(0) }),
      liquidacion('dolares-sin-dolar', '2027-06-01', 1_000, {
        costos: cuatro,
        moneda: 'USD',
        precio: centavosEn('USD', 10_000),
      }),
      liquidacion('dolares-sin-precio', '2027-06-01', 1_000, {
        costos: cuatro,
        moneda: 'USD',
        precio: null,
        cotizacionDeLosCostos: cotizacion(100_000),
      }),
    ];
    const sinNada = baseDeLasEstadisticas(datos({ liquidaciones: casos }), SIN_OPINIONES);
    expect(dejaron(sinNada, periodo(sinNada, 3, '2027-06')).estimado).toEqual([]);
  });

  it('a igual porcentaje, ordena por título y después por id', () => {
    const cuatro: CostosEstimados = {
      madera: pesos(100),
      herrajes: pesos(100),
      flete: pesos(100),
      ayudante: pesos(100),
    };
    const iguales = [
      liquidacion('c', '2027-06-01', 1_000, { titulo: 'Rack', costos: cuatro }),
      liquidacion('b', '2027-06-01', 1_000, { titulo: 'Mesa', costos: cuatro }),
      liquidacion('a', '2027-06-02', 1_000, { titulo: 'Rack', costos: cuatro }),
    ];
    const base3 = baseDeLasEstadisticas(datos({ liquidaciones: iguales }), SIN_OPINIONES);
    expect(dejaron(base3, periodo(base3, 3, '2027-06')).estimado.map((una) => una.id)).toEqual([
      'b',
      'a',
      'c',
    ]);
  });

  it('atadura: la cifra de un período es la suma del ingreso de sus meses en la fila del mes', () => {
    const azar = generador(20_261_003);
    const sistema = { hogar: 'hogar', maun: 'maun', diezmo: 'diezmo' };
    const fila = filaDeSiempre(
      { sueldoMensual: pesos(0), costosFijos: pesos(0), sueldoTopeMensual: true },
      sistema,
    );
    for (let vuelta = 0; vuelta < 30; vuelta += 1) {
      const liquidaciones = Array.from({ length: 1 + azar(40) }, (_, indice) =>
        liquidacion(`l${String(indice)}`, diaAlAzar(azar, '2025-12-01', 560), 0, {
          estado: azar(4) === 0 ? 'perdido' : 'cobrado',
          cobrado: centavos(azar(500_000_000)),
          gastos: centavos(azar(300_000_000)),
        }),
      );
      const delMes: LiquidacionDelMes[] = liquidaciones.map((una) => ({
        fecha: una.fecha,
        neta: centavos(una.cobrado - una.gastos),
        diezmo: centavos(0),
        aportes: [],
        remanente: centavos(0),
      }));
      const datosDelMes = {
        liquidaciones: delMes,
        coberturas: [],
        saldos: new Map(),
        metas: new Map(),
        gastos: [],
      };
      const unaBase = baseDeLasEstadisticas(datos({ liquidaciones }), SIN_OPINIONES);
      const largos: readonly LargoDelPeriodo[] = [3, 6, 12, 'todo'];
      const largo = largos[azar(4)] ?? 3;
      const resuelto = periodo(unaBase, largo, correrMes('2027-06', -azar(10)));
      const ingreso = resuelto.meses.reduce(
        (suma, mes) => suma + filaDelMes(fila, sistema, datosDelMes, mes).ingreso,
        0,
      );
      expect(dejaron(unaBase, resuelto).total).toBe(ingreso);
    }
  });
});

describe('② en qué se te va la plata', () => {
  it('los gastos de los trabajos van por su categoría, con «Otro» y «Sin categoría» al final', () => {
    const base = baseDeLasEstadisticas(
      datos({
        gastosDeLosTrabajos: [
          gasto('1', '2027-04-05', 4_900_000, 'madera'),
          gasto('2', '2027-05-05', 900_000, 'herrajes'),
          gasto('3', '2027-05-06', 900_000, 'herrajes'),
          gasto('4', '2027-05-07', 1_800_000, 'flete'),
          gasto('5', '2027-05-08', 300_000, 'otro'),
          gasto('6', '2027-05-09', 900_000, null),
          gasto('7', '2027-06-09', 600_000, 'ayudante'),
          gasto('8', '2027-03-31', 999_999, 'madera'),
        ],
      }),
      SIN_OPINIONES,
    );
    const resultado = loQueGastaste(base, periodo(base, 3, '2027-06'));
    expect(resultado.enLosTrabajos).toBe(pesos(10_300_000));
    expect(resultado.sinCategoria).toBe(pesos(900_000));
    expect(
      resultado.trabajos.map(({ categoria, monto, gastos }) => [categoria, monto, gastos]),
    ).toEqual([
      ['madera', pesos(4_900_000), 1],
      ['herrajes', pesos(1_800_000), 2],
      ['flete', pesos(1_800_000), 1],
      ['ayudante', pesos(600_000), 1],
      ['otro', pesos(300_000), 1],
      [null, pesos(900_000), 1],
    ]);
    expect(resultado.trabajos[0]?.deCada100).toBe(48);
  });

  it('los del taller van por su categoría tal como se guardó, con «Otro» y la vacía al final', () => {
    const base = baseDeLasEstadisticas(
      datos({
        gastosDelTaller: [
          delTaller('1', '2027-04-02', 420_000, 'Herramientas'),
          delTaller('2', '2027-04-03', 380_000, 'Costos fijos'),
          delTaller('3', '2027-04-04', 380_000, 'Publicidad'),
          delTaller('4', '2027-04-05', 120_000, 'Otro'),
          delTaller('5', '2027-04-06', 50_000, '  '),
          delTaller('6', '2027-04-07', 100_000, 'Materiales/insumos'),
          delTaller('7', '2027-04-08', 30_000, 'Herramientas '),
        ],
      }),
      SIN_OPINIONES,
    );
    const resultado = loQueGastaste(base, periodo(base, 3, '2027-06'));
    expect(resultado.enElTaller).toBe(pesos(1_480_000));
    expect(resultado.taller.map(({ categoria, monto }) => [categoria, monto])).toEqual([
      ['Herramientas', pesos(450_000)],
      ['Costos fijos', pesos(380_000)],
      ['Publicidad', pesos(380_000)],
      ['Materiales/insumos', pesos(100_000)],
      ['Otro', pesos(120_000)],
      ['', pesos(50_000)],
    ]);
    expect(resultado.total).toBe(resultado.enElTaller);
    expect(resultado.sinCategoria).toBe(pesos(0));
  });

  it('«de cada $ 100» de lo gastado, y sin nada gastado es cero', () => {
    expect(deCadaCien(25, 100)).toBe(25);
    expect(deCadaCien(25, 0)).toBe(0);
  });

  it('atadura: lo de los trabajos es la suma de los gastos con fecha en el período', () => {
    const azar = generador(4_242);
    for (let vuelta = 0; vuelta < 20; vuelta += 1) {
      const gastos = Array.from({ length: azar(60) }, (_, indice) =>
        gasto(
          String(indice),
          diaAlAzar(azar, '2026-01-01', 540),
          1 + azar(900_000),
          [null, 'madera', 'herrajes', 'flete', 'ayudante', 'otro'][azar(6)] as
            GastoDeUnTrabajo['categoria'] | undefined,
        ),
      );
      const base = baseDeLasEstadisticas(
        datos({
          gastosDeLosTrabajos: gastos.map((uno) => ({ ...uno, categoria: uno.categoria ?? null })),
        }),
        SIN_OPINIONES,
      );
      const resuelto = periodo(base, 6, correrMes('2027-06', -azar(12)));
      const esperado = gastos
        .filter(({ fecha }) => fecha >= resuelto.dias.desde && fecha <= resuelto.dias.hasta)
        .reduce((suma, uno) => suma + uno.monto, 0);
      const resultado = loQueGastaste(base, resuelto);
      expect(resultado.enLosTrabajos).toBe(esperado);
      expect(resultado.trabajos.reduce((suma, uno) => suma + uno.monto, 0)).toBe(esperado);
    }
  });

  it('lo que más usás: en cuántos trabajos, con la forma escrita más usada', () => {
    const trabajos = [
      trabajo('p1'),
      trabajo('p2', { estado: 'entregado' }),
      trabajo('p3', { estado: 'cobrado' }),
      trabajo('p4', { estado: 'contacto' }),
    ];
    const base = baseDeLasEstadisticas(
      datos({
        trabajos,
        necesidades: [
          necesidad('p1', 'Melamina blanca 18 mm', '2027-04-01'),
          necesidad('p1', 'melamina blanca 18 mm', '2027-04-02'),
          necesidad('p2', 'Melamina Blanca 18 MM', '2027-04-03'),
          necesidad('p3', 'Melamina blanca 18 mm', '2027-04-04'),
          necesidad('p4', 'Melamina blanca 18 mm', '2027-04-05'),
          necesidad('p1', 'MDF crudo', '2027-05-01'),
          necesidad('p2', 'mdf crudo', '2027-05-02'),
          necesidad('p3', '   ', '2027-05-03'),
          necesidad('p1', 'Bisagra cazoleta 35 mm', '2027-05-04', 'herraje'),
          necesidad('p1', 'Sierra circular', '2027-05-04', 'herramienta'),
          necesidad('p1', 'Fibrofácil', '2027-01-04'),
        ],
      }),
      SIN_OPINIONES,
    );
    const resultado = loQueGastaste(base, periodo(base, 3, '2027-06'));
    expect(resultado.materiales).toEqual({
      primeros: [
        { clave: 'melamina blanca 18 mm', nombre: 'Melamina blanca 18 mm', trabajos: 3 },
        { clave: 'mdf crudo', nombre: 'mdf crudo', trabajos: 2 },
      ],
      mas: 0,
    });
    expect(resultado.herrajes.primeros).toEqual([
      { clave: 'bisagra cazoleta 35 mm', nombre: 'Bisagra cazoleta 35 mm', trabajos: 1 },
    ]);
  });

  it('cinco por lista y cuántos más; a igual uso, por nombre', () => {
    const trabajos = [trabajo('p1'), trabajo('p2')];
    const nombres = ['Ñandú', 'Abedul', 'Cedro', 'Pino', 'Roble', 'Guatambú', 'Lenga'];
    const base = baseDeLasEstadisticas(
      datos({
        trabajos,
        necesidades: [
          ...nombres.map((nombre) => necesidad('p1', nombre, '2027-05-01')),
          necesidad('p2', 'Lenga', '2027-05-01'),
        ],
      }),
      SIN_OPINIONES,
    );
    const { materiales } = loQueGastaste(base, periodo(base, 3, '2027-06'));
    expect(PRIMEROS_DE_LO_QUE_MAS_USAS).toBe(5);
    expect(materiales.primeros.map((uso) => uso.nombre)).toEqual([
      'Lenga',
      'Abedul',
      'Cedro',
      'Guatambú',
      'Ñandú',
    ]);
    expect(materiales.mas).toBe(2);
  });

  it('a igual cantidad de veces gana la forma más reciente, y a igual fecha la primera por nombre', () => {
    const base = baseDeLasEstadisticas(
      datos({
        trabajos: [trabajo('p1'), trabajo('p2'), trabajo('p3'), trabajo('p4')],
        necesidades: [
          necesidad('p1', 'pino', '2027-05-01'),
          necesidad('p2', 'Pino', '2027-05-03'),
          necesidad('p3', 'roble', '2027-05-01'),
          necesidad('p4', 'Roble', '2027-05-01'),
        ],
      }),
      SIN_OPINIONES,
    );
    const { materiales } = loQueGastaste(base, periodo(base, 3, '2027-06'));
    expect(materiales.primeros.map((uso) => uso.nombre)).toEqual(['Pino', 'roble']);
  });
});

describe('③ llego a tiempo', () => {
  function entregado(
    id: string,
    inicio: string | null,
    entregadoEl: string,
    tipo: string | null = null,
  ): TrabajoParaLasEstadisticas {
    return trabajo(id, { estado: 'entregado', inicio, entregado: entregadoEl, tipo });
  }

  it('con menos de 5, los casos de a uno, con lo que falta', () => {
    const base = baseDeLasEstadisticas(
      datos({
        trabajos: [
          entregado('a', '2027-05-01', '2027-05-20'),
          entregado('b', '2027-04-20', '2027-05-16'),
          entregado('c', '2027-04-10', '2027-05-13'),
          entregado('sin-inicio', null, '2027-05-14'),
          entregado('fuera', '2027-01-01', '2027-02-01'),
        ],
        cambiosDeFecha: [
          comprometida('x', 'a', '2027-05-25'),
          comprometida('y', 'c', '2027-05-11'),
        ],
      }),
      SIN_OPINIONES,
    );
    const resultado = lasEntregas(base, periodo(base, 3, '2027-06'));
    expect(resultado.entregados).toBe(4);
    expect(resultado.demora).toEqual({ modo: 'casos', n: 3, valores: [19, 26, 33] });
    expect(resultado.faltan).toBe(2);
    expect(resultado.puntos.map(({ id, como, atraso }) => [id, como, atraso])).toEqual([
      ['a', 'a-tiempo', 0],
      ['b', 'sin-fecha', 0],
      ['c', 'tarde', 2],
    ]);
    expect(resultado.aTiempo).toEqual({ k: 1, n: 2, porcentaje: null });
    expect(resultado.porTipo).toEqual([]);
    expect(resultado.deAUno).toEqual([]);
  });

  it('desde 5, la mediana; por tipo, los que llegan a 5 con su mediana y los demás de a uno', () => {
    const placares = [14, 20, 22, 24, 31].map((dias, indice) =>
      entregado(`pl${String(indice)}`, sumarDias('2027-05-01', -dias), '2027-05-01', 'Placares'),
    );
    const otros = [
      entregado('cocina', '2027-04-01', '2027-05-09', 'Cocina'),
      entregado('suelto', '2027-04-20', '2027-05-10'),
      entregado('empate', '2027-04-09', '2027-05-01', 'Placares'),
    ];
    const base = baseDeLasEstadisticas(datos({ trabajos: [...placares, ...otros] }), SIN_OPINIONES);
    const resultado = lasEntregas(base, periodo(base, 3, '2027-06'));
    expect(resultado.demora).toEqual({
      modo: 'mediana',
      n: 8,
      mediana: 22,
      minimo: 14,
      maximo: 38,
    });
    expect(resultado.faltan).toBe(0);
    expect(resultado.porTipo).toHaveLength(1);
    expect(resultado.porTipo[0]?.mediana).toBe(22);
    expect(resultado.porTipo[0]?.dias).toEqual([14, 20, 22, 22, 24, 31]);
    expect(resultado.deAUno.map((punto) => punto.id)).toEqual(['suelto', 'cocina']);
    expect(resultado.puntos.slice(1, 5).map((punto) => punto.id)).toEqual([
      'pl1',
      'suelto',
      'empate',
      'pl2',
    ]);
  });

  it('atadura: en «todo», lo de ③ es lo del analítico', () => {
    const azar = generador(99);
    const trabajos = Array.from({ length: 40 }, (_, indice) => {
      const inicio = diaAlAzar(azar, '2026-09-01', 200);
      return trabajo(`t${String(indice)}`, {
        estado: azar(3) === 0 ? 'cobrado' : 'entregado',
        tipo: ['Placard', 'placard', 'Cocina', null][azar(4)] ?? null,
        inicio: azar(8) === 0 ? null : inicio,
        entregado: azar(10) === 0 ? null : sumarDias(inicio, 5 + azar(60)),
      });
    });
    const cambios = trabajos.flatMap((uno, indice) =>
      azar(2) === 0 || uno.entregado === null
        ? []
        : [comprometida(`f${String(indice)}`, uno.id, sumarDias(uno.entregado, azar(9) - 4))],
    );
    const base = baseDeLasEstadisticas(datos({ trabajos, cambiosDeFecha: cambios }), SIN_OPINIONES);
    const hoy = '2027-06-18';
    const resultado = lasEntregas(base, periodo(base, 'todo', '2027-06', hoy));
    const analitico = analisisDeEntregas(trabajos, cambios);
    expect(resultado.resumen.porTipo).toEqual(analitico.porTipo);
    expect(resultado.resumen.precision.cumplidas).toEqual(analitico.precision.cumplidas);
    expect(resultado.resumen.trabajos).toEqual(analitico.trabajos);
    expect(resultado.entregados).toBe(analitico.trabajos.length);
    expect(resultado.aTiempo.n).toBe(
      analitico.trabajos.filter((fila) => fila.cumplida !== null).length,
    );
  });
});

describe('④ cuántos presupuestos te aprueban', () => {
  const hoy = '2026-10-02';
  const trabajos = [
    trabajo('k1', { estado: 'en_curso' }),
    trabajo('k2', { estado: 'presupuesto_enviado' }),
    trabajo('k3', { estado: 'entregado' }),
    trabajo('k4', { estado: 'perdido' }),
    trabajo('k5', { estado: 'perdido' }),
    trabajo('k6', { estado: 'en_curso' }),
    trabajo('k7', { estado: 'relevamiento' }),
    trabajo('k8', { estado: 'contacto' }),
    trabajo('k10', { estado: 'contacto' }),
  ];
  const cambios = [
    cambioDeEstado('a1', 'k1', null, 'contacto', '2026-09-20'),
    cambioDeEstado('a2', 'k1', 'contacto', 'relevamiento', '2026-09-22'),
    cambioDeEstado('a3', 'k1', 'relevamiento', 'presupuesto_enviado', '2026-09-28'),
    cambioDeEstado('a4', 'k1', 'presupuesto_enviado', 'en_curso', '2026-10-01'),
    cambioDeEstado('b2', 'k2', 'presupuesto_enviado', 'en_seguimiento', '2026-09-25', 'igual'),
    cambioDeEstado('b1', 'k2', null, 'presupuesto_enviado', '2026-09-25', 'igual'),
    cambioDeEstado('b3', 'k2', 'en_seguimiento', 'presupuesto_enviado', '2026-10-01', 'luego'),
    cambioDeEstado('c1', 'k3', null, 'contacto', '2026-09-26'),
    cambioDeEstado('c2', 'k3', 'contacto', 'en_curso', '2026-09-27'),
    cambioDeEstado('c3', 'k3', 'en_curso', 'entregado', '2026-09-30'),
    cambioDeEstado('d1', 'k4', null, 'contacto', '2026-09-19'),
    cambioDeEstado('d2', 'k4', 'contacto', 'perdido', '2026-09-24'),
    cambioDeEstado('e1', 'k5', null, 'contacto', '2026-09-20'),
    cambioDeEstado('e2', 'k5', 'contacto', 'presupuesto_enviado', '2026-09-21'),
    cambioDeEstado('e3', 'k5', 'presupuesto_enviado', 'en_curso', '2026-09-23'),
    cambioDeEstado('e4', 'k5', 'en_curso', 'perdido', '2026-09-30'),
    cambioDeEstado('f1', 'k6', null, 'en_curso', '2026-09-20'),
    cambioDeEstado('g1', 'k7', 'contacto', 'relevamiento', '2026-09-20'),
    cambioDeEstado('h1', 'k8', null, 'contacto', '2026-07-15'),
    cambioDeEstado('i1', 'k9', null, 'contacto', '2026-09-20'),
    cambioDeEstado('j1', 'k10', null, 'contacto', '2026-09-20'),
  ];
  const base = baseDeLasEstadisticas(datos({ trabajos, cambiosDeEstado: cambios }), SIN_OPINIONES);

  it('la cohorte son los trabajos que nacieron como consulta en el período', () => {
    const resultado = lasConsultas(base, periodo(base, 3, '2026-10', hoy));
    expect(resultado.cohorte.map((consulta) => consulta.proyectoId)).toEqual([
      'k3',
      'k2',
      'k1',
      'k10',
      'k5',
      'k4',
    ]);
    expect(resultado.consultas).toBe(6);
  });

  it('cuenta lo que llegó al presupuesto y dónde está cada una hoy', () => {
    const resultado = lasConsultas(base, periodo(base, 3, '2026-10', hoy));
    expect(resultado).toMatchObject({
      presupuestos: 4,
      trabajos: 2,
      perdidas: 2,
      perdidasDespues: 1,
      perdidasAntes: 1,
      abiertas: 2,
      aprobados: 2,
      perdidos: 1,
      esperan: 1,
      aprobadas: { k: 2, n: 4, porcentaje: null },
      modo: 'casos',
      modoDeLosPresupuestos: 'puntos',
      antesDelRegistro: true,
    });
  });

  it('los dos tiempos dicen su base: sin lo que nació presupuestado ni lo aprobado directo', () => {
    const resultado = lasConsultas(base, periodo(base, 3, '2026-10', hoy));
    expect(resultado.alPresupuesto.n).toBe(2);
    expect(
      [...(resultado.alPresupuesto.modo === 'casos' ? resultado.alPresupuesto.valores : [])].sort(),
    ).toEqual([1, 8]);
    expect(resultado.aLaRespuesta.n).toBe(2);
  });

  it('la lista va de la más nueva a la más vieja; a igual día, por título y por id', () => {
    const empatados = baseDeLasEstadisticas(
      datos({
        trabajos: [
          trabajo('z2', { estado: 'contacto', titulo: 'Rack' }),
          trabajo('z1', { estado: 'contacto', titulo: 'Rack' }),
        ],
        cambiosDeEstado: [
          cambioDeEstado('1', 'z2', null, 'contacto', '2026-09-20'),
          cambioDeEstado('2', 'z1', null, 'contacto', '2026-09-20'),
        ],
      }),
      SIN_OPINIONES,
    );
    const resultado = lasConsultas(empatados, periodo(empatados, 3, '2026-10', hoy));
    expect(resultado.cohorte.map((consulta) => consulta.proyectoId)).toEqual(['z1', 'z2']);
  });

  it('un período que arranca después del registro no lo avisa', () => {
    expect(ETAPAS_ANOTADAS_DESDE).toBe('2026-09-18');
    const resultado = lasConsultas(base, periodo(base, 3, '2027-01', '2027-01-15'));
    expect(resultado.antesDelRegistro).toBe(false);
    expect(resultado.consultas).toBe(0);
  });

  it('desde 10 consultas va el embudo, y desde 41 presupuestos la barra', () => {
    expect(UMBRAL_DEL_EMBUDO).toBe(10);
    const muchos = Array.from({ length: 41 }, (_, indice) => `m${String(indice)}`);
    const conMuchas = baseDeLasEstadisticas(
      datos({
        trabajos: muchos.map((id) => trabajo(id, { estado: 'presupuesto_enviado' })),
        cambiosDeEstado: muchos.map((id) =>
          cambioDeEstado(`x${id}`, id, null, 'presupuesto_enviado', '2026-09-20'),
        ),
      }),
      SIN_OPINIONES,
    );
    const resultado = lasConsultas(conMuchas, periodo(conMuchas, 3, '2026-10', hoy));
    expect(resultado.modo).toBe('embudo');
    expect(resultado.modoDeLosPresupuestos).toBe('barra');
    expect(resultado.aprobadas.porcentaje).toBe(0);
  });
});

describe('⑤ qué opinan tus clientes', () => {
  function pregunta(id: string, cambios: Partial<PreguntaGuardada> = {}): PreguntaGuardada {
    return {
      id,
      serie: id,
      numero: 1,
      proyectoId: null,
      titular: false,
      orden: 10,
      texto: `Pregunta ${id}`,
      tipo: 'escala5',
      escala: 'conformidad',
      obligatoria: false,
      opciones: null,
      archivadaEl: null,
      creadaEl: '2026-09-21',
      ...cambios,
    };
  }

  const CONFORME = pregunta('q-conforme', { titular: true, orden: 10 });
  const TIEMPOS = pregunta('q-tiempos', { orden: 20, escala: 'tiempos' });
  const TRATO = pregunta('q-trato', { orden: 30, escala: 'trato' });
  const MEJOR = pregunta('q-mejor', { orden: 50, tipo: 'texto', escala: null });

  function contesto(
    id: string,
    encuestaId: string,
    valores: readonly [PreguntaGuardada, ValorGuardado][],
  ): RespuestaGuardada {
    return {
      id,
      encuestaId,
      contestadaEl: '2027-06-01',
      contestadaA: '2027-06-01T15:00:00+00:00',
      leidaEl: null,
      renglones: valores.map(([de, valor]) => ({
        preguntaId: de.id,
        preguntaTexto: de.texto,
        valor,
      })),
    };
  }

  const opiniones: DatosDeLasOpiniones = {
    preguntas: [CONFORME, TIEMPOS, TRATO, MEJOR],
    encuestas: [
      encuesta('e1', 'p1', '2027-04-10'),
      encuesta('e2', 'p2', '2027-05-01'),
      encuesta('e3', 'p3', '2027-05-20'),
      encuesta('e4', 'p4', '2027-01-10'),
      encuesta('e5', 'p5', '2027-06-01', { revocadaEl: '2027-06-02' }),
    ],
    respuestas: [
      contesto('r1', 'e1', [
        [CONFORME, 5],
        [TIEMPOS, 4],
        [TRATO, 5],
        [MEJOR, 'Nada'],
      ]),
      contesto('r2', 'e2', [
        [CONFORME, 3],
        [TIEMPOS, 2],
        [TRATO, 4],
      ]),
      contesto('r4', 'e4', [[CONFORME, 1]]),
    ],
    trabajos: [],
  };

  it('las encuestas mandadas en el período, y de las contestadas, cuántos quedaron conformes', () => {
    const base = baseDeLasEstadisticas(datos(), opiniones);
    const resultado = lasOpiniones(base, periodo(base, 3, '2027-06'), contexto());
    expect(resultado.enviadas).toBe(3);
    expect(resultado.contestadas).toBe(2);
    expect(resultado.titular?.n).toBe(2);
    expect(resultado.titular?.modo).toBe('puntos');
    expect(resultado.conformes).toEqual({ k: 1, n: 2, porcentaje: null });
    expect(resultado.tiempos?.conformes).toEqual({ k: 1, n: 2, porcentaje: null });
    expect(resultado.trato?.conformes).toEqual({ k: 2, n: 2, porcentaje: null });
  });

  it('son los números de Resultados cuando el período lo abarca todo', () => {
    const base = baseDeLasEstadisticas(datos(), opiniones);
    const resultado = lasOpiniones(base, periodo(base, 'todo', '2027-06'), contexto());
    const deResultados = resumenDeOpiniones(opiniones, HOY, PALABRAS);
    expect(resultado.enviadas).toBe(deResultados.enviadas);
    expect(resultado.contestadas).toBe(deResultados.contestadas);
    expect(resultado.titular).toEqual(deResultados.preguntas.find((una) => una.pregunta.titular));
  });

  it('una respuesta a una versión vieja de la titular no cuenta en la vigente', () => {
    const nueva = pregunta('q-conforme-2', {
      serie: 'q-conforme',
      numero: 2,
      titular: true,
      creadaEl: '2027-05-15',
    });
    const conVersion = { ...opiniones, preguntas: [...opiniones.preguntas, nueva] };
    const base = baseDeLasEstadisticas(datos(), conVersion);
    const resultado = lasOpiniones(base, periodo(base, 3, '2027-06'), contexto());
    expect(resultado.titular?.pregunta.id).toBe('q-conforme-2');
    expect(resultado.titular?.n).toBe(0);
    expect(resultado.conformes).toEqual({ k: 0, n: 0, porcentaje: null });
  });

  it('una titular que no es de cinco pasos no tiene «conformes»; sin trato, no va', () => {
    const otra = pregunta('q-conforme', {
      titular: true,
      tipo: 'sitalvezno',
      escala: null,
    });
    const base = baseDeLasEstadisticas(datos(), {
      ...opiniones,
      preguntas: [otra, TIEMPOS],
    });
    const resultado = lasOpiniones(base, periodo(base, 3, '2027-06'), contexto());
    expect(resultado.titular).not.toBeNull();
    expect(resultado.conformes).toBeNull();
    expect(resultado.trato).toBeNull();
  });

  it('sin titular, no hay nada que mostrar de ella', () => {
    const base = baseDeLasEstadisticas(datos(), { ...opiniones, preguntas: [TIEMPOS] });
    const resultado = lasOpiniones(base, periodo(base, 3, '2027-06'), contexto());
    expect(resultado.titular).toBeNull();
    expect(resultado.conformes).toBeNull();
  });
});

describe('el resumen', () => {
  it('sin nada en el período, las cuatro tarjetas quedan vacías', () => {
    const base = baseDeLasEstadisticas(datos(), SIN_OPINIONES);
    const resuelto = periodo(base, 3, '2027-06');
    const resumen = resumenDelPeriodo(
      estadisticasDelPeriodo(
        base,
        resuelto,
        columnasDelPeriodo(resuelto, '2027-06', null),
        contexto(),
      ),
    );
    expect(resumen.gastaste).toBeNull();
    expect(resumen.entrega).toBeNull();
    expect(resumen.presupuestos).toBeNull();
    expect(resumen.conformes).toBeNull();
    expect(resumen.dejaron.total).toBe(pesos(0));
  });

  it('con pocos casos, las tarjetas llevan un punto por caso', () => {
    const trabajos = [
      trabajo('a', { estado: 'entregado', inicio: '2027-05-01', entregado: '2027-05-20' }),
      trabajo('b', { estado: 'entregado', inicio: '2027-05-01', entregado: '2027-05-21' }),
      trabajo('c', { estado: 'entregado', inicio: '2027-05-01', entregado: '2027-05-22' }),
      trabajo('d', { estado: 'perdido' }),
      trabajo('e', { estado: 'presupuesto_enviado' }),
    ];
    const base = baseDeLasEstadisticas(
      datos({
        trabajos,
        cambiosDeFecha: [
          comprometida('x', 'a', '2027-05-25'),
          comprometida('y', 'b', '2027-05-01'),
        ],
        cambiosDeEstado: [
          cambioDeEstado('1', 'a', null, 'presupuesto_enviado', '2027-04-02'),
          cambioDeEstado('2', 'a', 'presupuesto_enviado', 'en_curso', '2027-04-05'),
          cambioDeEstado('3', 'd', null, 'presupuesto_enviado', '2027-04-02'),
          cambioDeEstado('4', 'e', null, 'presupuesto_enviado', '2027-04-02'),
        ],
        gastosDelTaller: [delTaller('g', '2027-04-02', 10, 'Otro')],
      }),
      SIN_OPINIONES,
    );
    const resuelto = periodo(base, 3, '2027-06');
    const resumen = resumenDelPeriodo(
      estadisticasDelPeriodo(
        base,
        resuelto,
        columnasDelPeriodo(resuelto, '2027-06', base.primerMes),
        contexto(),
      ),
    );
    expect(resumen.gastaste).toBe(pesos(10));
    expect(resumen.entrega?.puntos).toEqual(['a-tiempo', 'tarde']);
    expect(resumen.presupuestos?.puntos).toEqual(['trabajo', 'perdida', 'abierta']);
    expect(resumen.presupuestos?.esperan).toBe(1);
  });

  it('desde 20 casos, el porcentaje y ningún punto', () => {
    const ids = Array.from({ length: 20 }, (_, indice) => `t${String(indice)}`);
    const base = baseDeLasEstadisticas(
      datos({
        trabajos: ids.map((id) =>
          trabajo(id, { estado: 'entregado', inicio: '2027-05-01', entregado: '2027-05-20' }),
        ),
        cambiosDeFecha: ids.map((id) => comprometida(`c${id}`, id, '2027-05-25')),
        cambiosDeEstado: ids.map((id) =>
          cambioDeEstado(`e${id}`, id, null, 'presupuesto_enviado', '2027-04-02'),
        ),
      }),
      SIN_OPINIONES,
    );
    const resuelto = periodo(base, 3, '2027-06');
    const resumen = resumenDelPeriodo(
      estadisticasDelPeriodo(
        base,
        resuelto,
        columnasDelPeriodo(resuelto, '2027-06', base.primerMes),
        contexto(),
      ),
    );
    expect(resumen.entrega?.aTiempo).toEqual({ k: 20, n: 20, porcentaje: 100 });
    expect(resumen.entrega?.puntos).toEqual([]);
    expect(resumen.presupuestos?.puntos).toEqual([]);
  });

  it('sin respuestas a la titular en el período, «conformes» queda vacía', () => {
    const titular: PreguntaGuardada = {
      id: 'q',
      serie: 'q',
      numero: 1,
      proyectoId: null,
      titular: true,
      orden: 1,
      texto: '¿Conforme?',
      tipo: 'escala5',
      escala: 'conformidad',
      obligatoria: true,
      opciones: null,
      archivadaEl: null,
      creadaEl: '2026-09-21',
    };
    const base = baseDeLasEstadisticas(datos(), {
      ...SIN_OPINIONES,
      preguntas: [titular],
      encuestas: [encuesta('e', 'p', '2027-05-01')],
    });
    const resuelto = periodo(base, 3, '2027-06');
    const estadisticas = estadisticasDelPeriodo(
      base,
      resuelto,
      columnasDelPeriodo(resuelto, '2027-06', base.primerMes),
      contexto(),
    );
    expect(estadisticas.opiniones.conformes).toEqual({ k: 0, n: 0, porcentaje: null });
    expect(resumenDelPeriodo(estadisticas).conformes).toBeNull();
  });

  it('conformes, solo si hubo respuestas a la titular', () => {
    const titular: PreguntaGuardada = {
      id: 'q',
      serie: 'q',
      numero: 1,
      proyectoId: null,
      titular: true,
      orden: 1,
      texto: '¿Conforme?',
      tipo: 'escala5',
      escala: 'conformidad',
      obligatoria: true,
      opciones: null,
      archivadaEl: null,
      creadaEl: '2026-09-21',
    };
    const conRespuesta: DatosDeLasOpiniones = {
      preguntas: [titular],
      encuestas: [encuesta('e', 'p', '2027-05-01')],
      respuestas: [
        {
          id: 'r',
          encuestaId: 'e',
          contestadaEl: '2027-05-02',
          contestadaA: '2027-05-02T12:00:00Z',
          leidaEl: null,
          renglones: [{ preguntaId: 'q', preguntaTexto: '¿Conforme?', valor: 4 }],
        },
      ],
      trabajos: [],
    };
    const base = baseDeLasEstadisticas(datos(), conRespuesta);
    const resuelto = periodo(base, 3, '2027-06');
    const resumen = resumenDelPeriodo(
      estadisticasDelPeriodo(
        base,
        resuelto,
        columnasDelPeriodo(resuelto, '2027-06', null),
        contexto(),
      ),
    );
    expect(resumen.conformes).toEqual({ k: 1, n: 1, porcentaje: null });
  });
});

describe('⑥ lo que viene', () => {
  function entregadoHace(id: string, dias: number, entregadoEl: string) {
    return trabajo(id, {
      estado: 'entregado',
      inicio: sumarDias(entregadoEl, -dias),
      entregado: entregadoEl,
      precio: pesos(100),
      descontado: pesos(100),
    });
  }

  const recientes = [
    entregadoHace('r1', 14, '2027-01-10'),
    entregadoHace('r2', 20, '2027-02-10'),
    entregadoHace('r3', 23, '2027-03-10'),
    entregadoHace('r4', 30, '2027-04-10'),
    entregadoHace('r5', 40, '2027-05-10'),
    entregadoHace('viejo', 90, '2026-05-10'),
    entregadoHace('futuro', 90, '2027-06-30'),
    trabajo('sin-inicio', { estado: 'entregado', entregado: '2027-05-10' }),
  ];

  it('lo que tardás normalmente es la mediana de las entregas de los últimos 12 meses', () => {
    const base = baseDeLasEstadisticas(datos({ trabajos: recientes }), SIN_OPINIONES);
    expect(lasEntregasNormales(base, HOY)).toMatchObject({ modo: 'mediana', mediana: 23 });
    const pocas = baseDeLasEstadisticas(
      datos({ trabajos: [...recientes.slice(0, 4), trabajo('largo', { inicio: '2026-01-01' })] }),
      SIN_OPINIONES,
    );
    const viene = loQueViene(pocas, HOY);
    expect(viene.normal).toBeNull();
    expect(viene.enCurso[0]?.estado).toBeNull();
  });

  it('cada trabajo en curso con sus días, su fecha prometida y su estado', () => {
    const enCurso = [
      trabajo('pasado', {
        titulo: 'Placard',
        inicio: '2027-05-23',
        entregaComprometida: '2027-06-24',
      }),
      trabajo('listo', {
        titulo: 'Vanitory',
        inicio: '2027-05-29',
        listo: '2027-06-15',
        entregaComprometida: '2027-06-21',
      }),
      trabajo('a-tiempo', {
        titulo: 'Cocina',
        inicio: '2027-06-03',
        entregaEstimada: '2027-07-30',
      }),
      trabajo('atrasado', {
        titulo: 'Biblioteca',
        inicio: '2027-06-09',
        entregaComprometida: '2027-06-15',
      }),
      trabajo('sin-nada', { titulo: 'Mesa' }),
      trabajo('empate-b', { titulo: 'Aparador', entregaComprometida: '2027-06-24' }),
      trabajo('empate-a', { titulo: 'Aparador', entregaComprometida: '2027-06-24' }),
    ];
    const base = baseDeLasEstadisticas(
      datos({ trabajos: [...recientes, ...enCurso] }),
      SIN_OPINIONES,
    );
    const viene = loQueViene(base, HOY);
    expect(viene.normal).toBe(23);
    expect(viene.enCurso.map(({ id, dias, estado }) => [id, dias, estado])).toEqual([
      ['atrasado', 9, { cual: 'atrasado', dias: 3 }],
      ['listo', 20, { cual: 'listo' }],
      ['empate-a', null, null],
      ['empate-b', null, null],
      ['pasado', 26, { cual: 'paso', dias: 23 }],
      ['a-tiempo', 15, null],
      ['sin-nada', null, null],
    ]);
    expect(viene.enCurso.find((uno) => uno.id === 'a-tiempo')?.prometido).toEqual({
      fecha: '2027-07-30',
      cual: 'estimada',
    });
    expect(viene.enCurso.find((uno) => uno.id === 'pasado')?.hastaLaPromesa).toBe(32);
    expect(viene.enCurso.find((uno) => uno.id === 'sin-nada')?.hastaLaPromesa).toBeNull();
    expect(viene.listos).toBe(1);
  });

  it('lo que te deben, del más viejo al más nuevo, por moneda y nunca sumado', () => {
    const entregados = [
      trabajo('pesos', {
        estado: 'entregado',
        entregado: '2027-06-06',
        precio: pesos(3_200_000),
        descontado: pesos(1_800_000),
      }),
      trabajo('dolares', {
        estado: 'entregado',
        entregado: '2027-06-15',
        moneda: 'USD',
        precio: centavosEn('USD', 200_000),
        descontado: centavosEn('USD', 80_000),
      }),
      trabajo('sin-precio', { estado: 'entregado', entregado: '2027-06-01' }),
      trabajo('migrado', { estado: 'entregado', precio: pesos(500_000) }),
      trabajo('pagado', {
        estado: 'entregado',
        entregado: '2027-06-01',
        precio: pesos(100),
        descontado: pesos(100),
      }),
      trabajo('en-curso', { precio: pesos(900), estado: 'en_curso' }),
    ];
    const viene = loQueViene(
      baseDeLasEstadisticas(datos({ trabajos: entregados }), SIN_OPINIONES),
      HOY,
    );
    expect(viene.porCobrar.map(({ id, dias, saldo }) => [id, dias, saldo])).toEqual([
      ['pesos', 12, { importe: pesos(1_400_000), moneda: 'ARS' }],
      ['dolares', 3, { importe: 120_000, moneda: 'USD' }],
      ['migrado', null, { importe: pesos(500_000), moneda: 'ARS' }],
    ]);
    expect(viene.teDeben).toEqual([
      { importe: pesos(1_900_000), moneda: 'ARS' },
      { importe: 120_000, moneda: 'USD' },
    ]);
  });

  it('lo que no tiene fecha va al final aunque venga primero', () => {
    const viene = loQueViene(
      baseDeLasEstadisticas(
        datos({
          trabajos: [
            trabajo('sin-fecha', { titulo: 'A' }),
            trabajo('con-fecha', { titulo: 'B', entregaEstimada: '2027-07-01' }),
            trabajo('migrado', { titulo: 'A', estado: 'entregado', precio: pesos(1) }),
            trabajo('fechado', {
              titulo: 'B',
              estado: 'entregado',
              entregado: '2027-06-01',
              precio: pesos(1),
            }),
          ],
        }),
        SIN_OPINIONES,
      ),
      HOY,
    );
    expect(viene.enCurso.map((uno) => uno.id)).toEqual(['con-fecha', 'sin-fecha']);
    expect(viene.porCobrar.map((uno) => uno.id)).toEqual(['fechado', 'migrado']);
  });

  it('dos sin fecha de entrega van por título, y a igual título por id', () => {
    const viene = loQueViene(
      baseDeLasEstadisticas(
        datos({
          trabajos: [
            trabajo('b', { titulo: 'B', estado: 'entregado', precio: pesos(1) }),
            trabajo('c', { titulo: 'A', estado: 'entregado', precio: pesos(1) }),
            trabajo('a', { titulo: 'A', estado: 'entregado', precio: pesos(1) }),
          ],
        }),
        SIN_OPINIONES,
      ),
      HOY,
    );
    expect(viene.porCobrar.map((uno) => uno.id)).toEqual(['a', 'c', 'b']);
  });

  it('hay algo para contar con cualquier dato, un trabajo en curso o algo por cobrar', () => {
    const vacia = baseDeLasEstadisticas(datos(), SIN_OPINIONES);
    expect(hayAlgoParaContar(vacia, loQueViene(vacia, HOY))).toBe(false);
    const conDato = baseDeLasEstadisticas(
      datos({ gastosDelTaller: [delTaller('g', '2027-01-01', 1, 'Otro')] }),
      SIN_OPINIONES,
    );
    expect(hayAlgoParaContar(conDato, loQueViene(conDato, HOY))).toBe(true);
    const enCurso = baseDeLasEstadisticas(datos({ trabajos: [trabajo('a')] }), SIN_OPINIONES);
    expect(hayAlgoParaContar(enCurso, loQueViene(enCurso, HOY))).toBe(true);
    const porCobrar = baseDeLasEstadisticas(
      datos({ trabajos: [trabajo('a', { estado: 'entregado', precio: pesos(1) })] }),
      SIN_OPINIONES,
    );
    expect(hayAlgoParaContar(porCobrar, loQueViene(porCobrar, HOY))).toBe(true);
  });
});

describe('los meses del período, para cada atadura', () => {
  it('cubren los días del período', () => {
    const base = baseDeLasEstadisticas(datos(), SIN_OPINIONES);
    const resuelto = periodo(base, 6, '2027-03');
    expect(mesesDelRango(mesDe(resuelto.dias.desde), mesDe(resuelto.dias.hasta))).toEqual(
      resuelto.meses,
    );
  });
});

function encuesta(
  id: string,
  proyectoId: string,
  dia: string,
  cambios: Partial<EncuestaGuardada> = {},
): EncuestaGuardada {
  const preguntas: PreguntaDeLaEncuesta[] = [];
  return {
    id,
    proyectoId,
    enviadaEl: dia,
    enviadaA: `${dia}T12:00:00+00:00`,
    recordadaEl: null,
    revocadaEl: null,
    preguntas,
    ...cambios,
  };
}

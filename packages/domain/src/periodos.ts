import { correrMes, diaDelMes, esMes, mesDe, mesesDelRango } from './fechas.ts';

export const LARGOS_DEL_PERIODO = [3, 6, 12, 'todo'] as const;

export type LargoDelPeriodo = (typeof LARGOS_DEL_PERIODO)[number];

export type LargoFijo = Exclude<LargoDelPeriodo, 'todo'>;

export const LARGO_POR_DEFECTO: LargoFijo = 3;

export const LUGARES_DE_LAS_COLUMNAS = 12;

export const MESES_HASTA_LOS_TRIMESTRES = 12;

export const MESES_HASTA_LOS_ANIOS = 36;

export interface Periodo {
  readonly meses: LargoDelPeriodo;
  readonly hasta: string;
}

export type Agrupado = 'mes' | 'trimestre' | 'anio';

export interface RangoDeDias {
  readonly desde: string;
  readonly hasta: string;
}

export interface PeriodoAnterior {
  readonly desde: string;
  readonly hasta: string;
  readonly meses: readonly string[];
  readonly dias: RangoDeDias;
  readonly hastaElMismoDia: boolean;
}

export interface PeriodoResuelto {
  readonly largo: LargoDelPeriodo;
  readonly desde: string;
  readonly hasta: string;
  readonly meses: readonly string[];
  readonly dias: RangoDeDias;
  readonly incluyeHoy: boolean;
  readonly anterior: PeriodoAnterior | null;
  readonly agrupado: Agrupado;
}

export interface ColumnaDelPeriodo {
  readonly clave: string;
  readonly agrupado: Agrupado;
  readonly meses: readonly string[];
  readonly enElPeriodo: boolean;
  readonly enCurso: boolean;
  readonly sinRegistro: boolean;
}

export interface ParametrosDelPeriodo {
  readonly meses: string | null;
  readonly hasta: string | null;
}

export function largoLeido(texto: string | null): LargoDelPeriodo | null {
  return LARGOS_DEL_PERIODO.find((largo) => String(largo) === texto) ?? null;
}

export function mesLeido(texto: string | null, mesEnCurso: string): string | null {
  return texto !== null && esMes(texto) && texto <= mesEnCurso ? texto : null;
}

export function periodoDeLaUrl(
  meses: string | null,
  hasta: string | null,
  mesEnCurso: string,
): Periodo {
  const largo = largoLeido(meses) ?? LARGO_POR_DEFECTO;
  if (largo === 'todo') return { meses: largo, hasta: mesEnCurso };
  return { meses: largo, hasta: mesLeido(hasta, mesEnCurso) ?? mesEnCurso };
}

export function parametrosDelPeriodo(periodo: Periodo, mesEnCurso: string): ParametrosDelPeriodo {
  return {
    meses: periodo.meses === LARGO_POR_DEFECTO ? null : String(periodo.meses),
    hasta: periodo.meses === 'todo' || periodo.hasta >= mesEnCurso ? null : periodo.hasta,
  };
}

export function conOtroLargo(
  periodo: Periodo,
  meses: LargoDelPeriodo,
  mesEnCurso: string,
): Periodo {
  return {
    meses,
    hasta: meses === 'todo' || periodo.meses === 'todo' ? mesEnCurso : periodo.hasta,
  };
}

export function correrElPeriodo(periodo: Periodo, sentido: -1 | 1, mesEnCurso: string): Periodo {
  if (periodo.meses === 'todo') return periodo;
  const hasta = correrMes(periodo.hasta, sentido * periodo.meses);
  return { meses: periodo.meses, hasta: hasta > mesEnCurso ? mesEnCurso : hasta };
}

export function haySiguiente(periodo: Periodo, mesEnCurso: string): boolean {
  return periodo.meses !== 'todo' && periodo.hasta < mesEnCurso;
}

export function hayAnterior(periodo: Periodo, primerMes: string | null): boolean {
  if (periodo.meses === 'todo' || primerMes === null) return false;
  return correrMes(periodo.hasta, 1 - periodo.meses) > primerMes;
}

function ultimoDia(mes: string): string {
  return diaDelMes(mes, 31);
}

function diasDe(desde: string, hasta: string): RangoDeDias {
  return { desde: `${desde}-01`, hasta: ultimoDia(hasta) };
}

export function agrupadoPara(meses: number): Agrupado {
  if (meses <= MESES_HASTA_LOS_TRIMESTRES) return 'mes';
  return meses <= MESES_HASTA_LOS_ANIOS ? 'trimestre' : 'anio';
}

export function resolverElPeriodo(
  periodo: Periodo,
  hoy: string,
  primerMes: string | null,
): PeriodoResuelto {
  const mesEnCurso = mesDe(hoy);
  if (periodo.meses === 'todo') {
    const desde = primerMes === null || primerMes > mesEnCurso ? mesEnCurso : primerMes;
    const meses = mesesDelRango(desde, mesEnCurso);
    return {
      largo: 'todo',
      desde,
      hasta: mesEnCurso,
      meses,
      dias: diasDe(desde, mesEnCurso),
      incluyeHoy: true,
      anterior: null,
      agrupado: agrupadoPara(meses.length),
    };
  }

  const hasta = periodo.hasta > mesEnCurso ? mesEnCurso : periodo.hasta;
  const desde = correrMes(hasta, 1 - periodo.meses);
  const incluyeHoy = hasta === mesEnCurso;
  const desdeAntes = correrMes(desde, -periodo.meses);
  const hastaAntes = correrMes(desde, -1);
  return {
    largo: periodo.meses,
    desde,
    hasta,
    meses: mesesDelRango(desde, hasta),
    dias: diasDe(desde, hasta),
    incluyeHoy,
    anterior: {
      desde: desdeAntes,
      hasta: hastaAntes,
      meses: mesesDelRango(desdeAntes, hastaAntes),
      dias: {
        desde: `${desdeAntes}-01`,
        hasta: incluyeHoy ? diaDelMes(hastaAntes, Number(hoy.slice(8, 10))) : ultimoDia(hastaAntes),
      },
      hastaElMismoDia: incluyeHoy,
    },
    agrupado: 'mes',
  };
}

export function claveDelGrupo(mes: string, agrupado: Agrupado): string {
  if (agrupado === 'mes') return mes;
  const anio = mes.slice(0, 4);
  if (agrupado === 'anio') return anio;
  return `${anio}-T${String(Math.floor((Number(mes.slice(5, 7)) - 1) / 3) + 1)}`;
}

export function columnasDelPeriodo(
  resuelto: PeriodoResuelto,
  mesEnCurso: string,
  primerMes: string | null,
): ColumnaDelPeriodo[] {
  if (resuelto.largo === 'todo') {
    const columnas: { clave: string; meses: string[] }[] = [];
    for (const mes of resuelto.meses) {
      const clave = claveDelGrupo(mes, resuelto.agrupado);
      const ultima = columnas.at(-1);
      if (ultima?.clave === clave) ultima.meses.push(mes);
      else columnas.push({ clave, meses: [mes] });
    }
    return columnas.map(({ clave, meses }) => ({
      clave,
      agrupado: resuelto.agrupado,
      meses,
      enElPeriodo: true,
      enCurso: meses.includes(mesEnCurso),
      sinRegistro: primerMes === null,
    }));
  }

  return mesesDelRango(correrMes(resuelto.hasta, 1 - LUGARES_DE_LAS_COLUMNAS), resuelto.hasta).map(
    (mes) => ({
      clave: mes,
      agrupado: 'mes',
      meses: [mes],
      enElPeriodo: resuelto.meses.includes(mes),
      enCurso: mes === mesEnCurso,
      sinRegistro: primerMes === null || mes < primerMes,
    }),
  );
}

export function estaEnElRango(fecha: string, rango: RangoDeDias): boolean {
  return fecha >= rango.desde && fecha <= rango.hasta;
}

import {
  CERO,
  modosPosibles,
  sumarTodos,
  tipoDelPaso,
  type BaseDeLaObligacion,
  type ClaseDePaso,
  type Fila,
  type FilaDelMes,
  type MetaDelMes,
  type ModoDePaso,
  type Money,
  type TesoroDeLaFila,
  type TipoDelPaso,
  type TipoDeTesoro,
} from '@maun/domain';

export const NOMBRE_DEL_TIPO: Readonly<Record<TipoDeTesoro, string>> = {
  obligacion: 'Obligación',
  compromiso: 'Compromiso',
  'ahorro-fijo': 'Ahorro fijo',
  'ahorro-por-porcentaje': 'Ahorro',
  superavit: 'Superávit',
};

export const GRUPOS_DE_LA_FILA = ['obligaciones', 'compromisos', 'ahorros', 'superavit'] as const;

export type GrupoDeLaFila = (typeof GRUPOS_DE_LA_FILA)[number];

export const NOMBRE_DEL_GRUPO: Readonly<Record<GrupoDeLaFila, string>> = {
  obligaciones: 'Obligaciones',
  compromisos: 'Compromisos',
  ahorros: 'Ahorros',
  superavit: 'Superávit',
};

const GRUPO_DEL_TIPO: Readonly<Record<TipoDeTesoro, GrupoDeLaFila>> = {
  obligacion: 'obligaciones',
  compromiso: 'compromisos',
  'ahorro-fijo': 'ahorros',
  'ahorro-por-porcentaje': 'ahorros',
  superavit: 'superavit',
};

export function grupoDelTipo(tipo: TipoDeTesoro): GrupoDeLaFila {
  return GRUPO_DEL_TIPO[tipo];
}

export const DESCRIPCION_DEL_TIPO: Readonly<Record<TipoDeTesoro, string>> = {
  obligacion: 'obligación',
  compromiso: 'compromiso',
  'ahorro-fijo': 'ahorro',
  'ahorro-por-porcentaje': 'ahorro',
  superavit: 'superávit',
};

export const DESCRIPCION_DE_LOS_INSUMOS = 'insumos';

export function tiposDelTesoro(fila: Fila, tesoro: string): TipoDeTesoro[] {
  const tipos: TipoDeTesoro[] = [];
  if (fila.obligaciones.some((obligacion) => obligacion.tesoro === tesoro)) {
    tipos.push('obligacion');
  }
  const paso = fila.pasos.find((candidato) => candidato.tesoro === tesoro);
  if (paso !== undefined) tipos.push(tipoDelPaso(paso.clase));
  if (fila.reparto.some((parte) => parte.tesoro === tesoro)) tipos.push('ahorro-por-porcentaje');
  if (fila.superavit === tesoro) tipos.push('superavit');
  return tipos;
}

export function nombreDelTipoDe(fila: Fila, tesoro: string): string | null {
  const [tipo] = tiposDelTesoro(fila, tesoro);
  return tipo === undefined ? null : NOMBRE_DEL_TIPO[tipo];
}

export function tituloDelModo(tipo: TipoDelPaso): string {
  return tipo === 'compromiso' ? 'Cómo se llena' : 'Cómo se aparta';
}

export function modoEnPalabras(modo: ModoDePaso, tipo: TipoDelPaso): string {
  if (modo === 'saldo')
    return tipo === 'compromiso' ? 'se renueva al pagar' : 'se repone al usarlo';
  return modo === 'trabajo' ? 'por trabajo' : 'por mes';
}

export interface OpcionDelModo {
  id: ModoDePaso;
  etiqueta: string;
}

export function modosDelPaso(clase: ClaseDePaso, clave: TesoroDeLaFila['clave']): OpcionDelModo[] {
  const tipo = tipoDelPaso(clase);
  return modosPosibles(clase, clave).map((modo) => {
    const texto = modoEnPalabras(modo, tipo);
    return { id: modo, etiqueta: `${texto.charAt(0).toUpperCase()}${texto.slice(1)}` };
  });
}

export const BASE_EN_PALABRAS: Readonly<Record<BaseDeLaObligacion, string>> = {
  cobrado: 'sobre lo que cobrás',
  ingreso: 'sobre el ingreso',
};

export const ETIQUETA_DE_LA_BASE: Readonly<Record<BaseDeLaObligacion, string>> = {
  cobrado: 'Lo que cobrás',
  ingreso: 'El ingreso',
};

export type TipoQueSePaga = Extract<TipoDeTesoro, 'obligacion' | 'compromiso'>;

export interface LoQueHayQuePagar {
  tesoro: string;
  tipo: TipoQueSePaga;
  aPagar: Money;
}

export function loQueHayQuePagar(delMes: FilaDelMes): LoQueHayQuePagar[] {
  const deLasObligaciones = delMes.obligaciones.map((obligacion) => ({
    tesoro: obligacion.tesoro,
    tipo: 'obligacion' as const,
    aPagar: obligacion.aPagar,
  }));
  const deLosCompromisos = delMes.pasos.flatMap((paso) =>
    paso.tipo === 'compromiso' && paso.aPagar !== null
      ? [{ tesoro: paso.tesoro, tipo: 'compromiso' as const, aPagar: paso.aPagar }]
      : [],
  );
  return [...deLasObligaciones, ...deLosCompromisos];
}

export function aPagarDe(delMes: FilaDelMes, tesoro: string): Money | null {
  return loQueHayQuePagar(delMes).find((renglon) => renglon.tesoro === tesoro)?.aPagar ?? null;
}

export function totalAPagar(delMes: FilaDelMes): Money {
  return sumarTodos(loQueHayQuePagar(delMes).map((renglon) => renglon.aPagar));
}

export interface MetaDeLaFila {
  tesoro: string;
  tipo: Extract<TipoDeTesoro, 'ahorro-fijo' | 'ahorro-por-porcentaje'>;
  meta: MetaDelMes;
}

export function metasDeLaFila(delMes: FilaDelMes): MetaDeLaFila[] {
  const deLosPasos = delMes.pasos.flatMap((paso) =>
    paso.meta === null
      ? []
      : [{ tesoro: paso.tesoro, tipo: 'ahorro-fijo' as const, meta: paso.meta }],
  );
  const deLasPartes = delMes.reparto.flatMap((parte) =>
    parte.meta === null
      ? []
      : [{ tesoro: parte.tesoro, tipo: 'ahorro-por-porcentaje' as const, meta: parte.meta }],
  );
  return [...deLosPasos, ...deLasPartes];
}

export function ahorradoEnLaFila(delMes: FilaDelMes, saldos: ReadonlyMap<string, Money>): Money {
  const ahorros = new Set([
    ...delMes.pasos.filter((paso) => paso.tipo === 'ahorro-fijo').map((paso) => paso.tesoro),
    ...delMes.reparto.map((parte) => parte.tesoro),
  ]);
  return sumarTodos([...ahorros].map((tesoro) => saldos.get(tesoro) ?? CERO));
}

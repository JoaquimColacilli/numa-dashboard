export type TipoDeFicha = 'obligacion' | 'paso' | 'parte' | 'estante';

export type Ficha =
  | { tipo: TipoDeFicha; tesoro: string }
  | {
      tipo: 'diezmo' | 'reparto' | 'resto' | 'origen' | 'nuevo' | 'titulo' | 'insumos';
      tesoro: null;
    };

export const FICHA_DEL_DIEZMO = 'diezmo';
export const FICHA_DEL_REPARTO = 'reparto';
export const FICHA_DEL_RESTO = 'resto';
export const FICHA_DEL_ORIGEN = 'origen';
export const FICHA_NUEVA = 'nuevo';
export const FICHA_DEL_TITULO = 'titulo-del-estante';
export const FICHA_DE_LOS_INSUMOS = 'insumos';

export function fichaDeLaObligacion(tesoro: string): string {
  return `obligacion-${tesoro}`;
}

export function fichaDelPaso(tesoro: string): string {
  return `paso-${tesoro}`;
}

export function fichaDeLaParte(tesoro: string): string {
  return `parte-${tesoro}`;
}

export function fichaDelEstante(tesoro: string): string {
  return `estante-${tesoro}`;
}

const TIPOS_CON_TESORO: readonly TipoDeFicha[] = ['obligacion', 'paso', 'parte', 'estante'];

export function queFichaEs(id: string): Ficha | null {
  const guion = id.indexOf('-');
  if (guion > 0) {
    const tipo = id.slice(0, guion);
    if ((TIPOS_CON_TESORO as readonly string[]).includes(tipo)) {
      return { tipo: tipo as TipoDeFicha, tesoro: id.slice(guion + 1) };
    }
  }
  if (id === FICHA_DEL_DIEZMO) return { tipo: 'diezmo', tesoro: null };
  if (id === FICHA_DEL_REPARTO) return { tipo: 'reparto', tesoro: null };
  if (id === FICHA_DEL_RESTO) return { tipo: 'resto', tesoro: null };
  if (id === FICHA_DEL_ORIGEN) return { tipo: 'origen', tesoro: null };
  if (id === FICHA_NUEVA) return { tipo: 'nuevo', tesoro: null };
  if (id === FICHA_DEL_TITULO) return { tipo: 'titulo', tesoro: null };
  if (id === FICHA_DE_LOS_INSUMOS) return { tipo: 'insumos', tesoro: null };
  return null;
}

export function fichaEnElLugar(
  lugar: 'obligacion' | 'compromiso' | 'ahorro-fijo' | 'reparto' | 'superavit',
  tesoro: string,
  diezmo: string,
): string {
  switch (lugar) {
    case 'obligacion':
      return tesoro === diezmo ? FICHA_DEL_DIEZMO : fichaDeLaObligacion(tesoro);
    case 'compromiso':
    case 'ahorro-fijo':
      return fichaDelPaso(tesoro);
    case 'reparto':
      return fichaDeLaParte(tesoro);
    case 'superavit':
      return FICHA_DEL_RESTO;
  }
}

export function tesoroDeLaFicha(id: string | null): string | null {
  if (id === null) return null;
  return queFichaEs(id)?.tesoro ?? null;
}

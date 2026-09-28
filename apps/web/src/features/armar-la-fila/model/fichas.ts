export type TipoDeFicha = 'paso' | 'parte' | 'estante';

export type Ficha =
  | { tipo: TipoDeFicha; tesoro: string }
  | { tipo: 'diezmo' | 'reparto' | 'resto' | 'origen' | 'nuevo' | 'titulo'; tesoro: null };

export const FICHA_DEL_DIEZMO = 'diezmo';
export const FICHA_DEL_REPARTO = 'reparto';
export const FICHA_DEL_RESTO = 'resto';
export const FICHA_DEL_ORIGEN = 'origen';
export const FICHA_NUEVA = 'nuevo';
export const FICHA_DEL_TITULO = 'titulo-del-estante';

export function fichaDelPaso(tesoro: string): string {
  return `paso-${tesoro}`;
}

export function fichaDeLaParte(tesoro: string): string {
  return `parte-${tesoro}`;
}

export function fichaDelEstante(tesoro: string): string {
  return `estante-${tesoro}`;
}

const TIPOS_CON_TESORO: readonly TipoDeFicha[] = ['paso', 'parte', 'estante'];

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
  return null;
}

export function tesoroDeLaFicha(id: string | null): string | null {
  if (id === null) return null;
  return queFichaEs(id)?.tesoro ?? null;
}

export const CONCEPTOS_DE_SIEMPRE = {
  senaDeLaVisita: 'Seña de la visita',
  senaAlAprobar: 'Seña',
  saldoFinal: 'Saldo final en la entrega',
} as const;

export type ConceptoDeSiempre = keyof typeof CONCEPTOS_DE_SIEMPRE;

export const CLAVES_DE_LOS_CONCEPTOS = Object.keys(CONCEPTOS_DE_SIEMPRE) as ConceptoDeSiempre[];

export function conceptoDeSiempre(guardado: string): ConceptoDeSiempre | null {
  const limpio = guardado.trim();
  return CLAVES_DE_LOS_CONCEPTOS.find((clave) => CONCEPTOS_DE_SIEMPRE[clave] === limpio) ?? null;
}

export function conceptoParaGuardar(
  escrito: string,
  enPantalla: Readonly<Record<ConceptoDeSiempre, string>>,
): string {
  const limpio = escrito.trim();
  const clave = CLAVES_DE_LOS_CONCEPTOS.find((una) => enPantalla[una].trim() === limpio);
  return clave === undefined ? limpio : CONCEPTOS_DE_SIEMPRE[clave];
}

export function conceptoEnPantalla(
  guardado: string,
  enPantalla: Readonly<Record<ConceptoDeSiempre, string>>,
): string {
  const clave = conceptoDeSiempre(guardado);
  return clave === null ? guardado : enPantalla[clave];
}

import { centavos, type Money } from './money.ts';

export const CATEGORIAS_DEL_MONOTRIBUTO = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
] as const;

export type CategoriaDelMonotributo = (typeof CATEGORIAS_DEL_MONOTRIBUTO)[number];

export const CATEGORIA_MAXIMA: CategoriaDelMonotributo = 'K';

export interface EscalaDelMonotributo {
  vigenteDesde: string;
  fuente: string;
  topesCentavos: Readonly<Record<CategoriaDelMonotributo, Money>>;
  precioUnitarioMaximoCentavos: Money;
}

export const ESCALAS_DEL_MONOTRIBUTO: readonly EscalaDelMonotributo[] = [
  {
    vigenteDesde: '2026-08-01',
    fuente: 'https://www.afip.gob.ar/monotributo/categorias.asp',
    topesCentavos: {
      A: centavos(1_200_941_045),
      B: centavos(1_759_518_274),
      C: centavos(2_467_049_431),
      D: centavos(3_062_865_143),
      E: centavos(3_602_823_133),
      F: centavos(4_515_165_941),
      G: centavos(5_399_579_887),
      H: centavos(8_192_466_037),
      I: centavos(9_169_976_190),
      J: centavos(10_501_251_920),
      K: centavos(12_661_083_875),
    },
    precioUnitarioMaximoCentavos: centavos(71_684_077),
  },
];

export function esCategoriaDelMonotributo(valor: unknown): valor is CategoriaDelMonotributo {
  return (
    typeof valor === 'string' && (CATEGORIAS_DEL_MONOTRIBUTO as readonly string[]).includes(valor)
  );
}

export function categoriaLeida(valor: unknown): CategoriaDelMonotributo | null {
  return esCategoriaDelMonotributo(valor) ? valor : null;
}

export function escalaVigente(
  hoy: string,
  escalas: readonly EscalaDelMonotributo[] = ESCALAS_DEL_MONOTRIBUTO,
): EscalaDelMonotributo {
  const enOrden = [...escalas].sort((una, otra) =>
    una.vigenteDesde < otra.vigenteDesde ? -1 : una.vigenteDesde > otra.vigenteDesde ? 1 : 0,
  );
  const [primera] = enOrden;
  if (primera === undefined) throw new RangeError('No hay ninguna escala del monotributo.');
  return enOrden.filter((escala) => escala.vigenteDesde <= hoy).at(-1) ?? primera;
}

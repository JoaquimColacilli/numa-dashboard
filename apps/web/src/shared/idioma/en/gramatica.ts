const ORDINALES = new Intl.PluralRules('en-US', { type: 'ordinal' });

const SUFIJOS: Readonly<Record<Intl.LDMLPluralRule, string>> = {
  zero: 'th',
  one: 'st',
  two: 'nd',
  few: 'rd',
  many: 'th',
  other: 'th',
};

export function ordinal(numero: number): string {
  return `${String(numero)}${SUFIJOS[ORDINALES.select(numero)]}`;
}

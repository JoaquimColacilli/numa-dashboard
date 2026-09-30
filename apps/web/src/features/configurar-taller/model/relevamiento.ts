import type { CambiosDeAjustes, FilaDe } from '@/shared/api';

export const VALOR_DEL_RELEVAMIENTO_DE_SIEMPRE = 12_000_000;

type ConElRelevamiento = { relevamiento_centavos?: number | null };

export function valorDelRelevamiento(ajustes: FilaDe<'ajustes'>): number | null {
  const { relevamiento_centavos: valor } = ajustes as ConElRelevamiento;
  return valor === undefined ? VALOR_DEL_RELEVAMIENTO_DE_SIEMPRE : valor;
}

export function cambioDelRelevamiento(
  ajustes: FilaDe<'ajustes'>,
  valor: number | null,
): CambiosDeAjustes {
  const nuevo = valor === null || valor <= 0 ? null : valor;
  return nuevo === valorDelRelevamiento(ajustes) ? {} : { relevamiento_centavos: nuevo };
}

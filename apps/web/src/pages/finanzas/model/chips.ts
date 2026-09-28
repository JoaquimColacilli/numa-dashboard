export interface TesoroDelChip {
  id: string;
  archivado: boolean;
}

export function tesorosDeLosChips<T extends TesoroDelChip>(
  tesoros: readonly T[],
  conMovimiento: ReadonlySet<string>,
  elegido: string,
): T[] {
  const vivos = tesoros.filter((tesoro) => !tesoro.archivado);
  const archivados = tesoros.filter(
    (tesoro) => tesoro.archivado && (conMovimiento.has(tesoro.id) || tesoro.id === elegido),
  );
  return [...vivos, ...archivados];
}

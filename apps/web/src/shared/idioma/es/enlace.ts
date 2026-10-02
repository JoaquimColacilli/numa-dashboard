export const enlace = {
  vecesQueLoAbrio: (veces: number) =>
    veces === 0
      ? 'Todavía no lo abrió'
      : veces === 1
        ? 'Lo abrió una vez'
        : `Lo abrió ${String(veces)} veces`,
} as const;

export type NumeroDeSeccion = 1 | 2 | 3 | 4 | 5 | 6;

export function idDeLaSeccion(numero: NumeroDeSeccion): string {
  return `estadisticas-${String(numero)}`;
}

export function idDelTitulo(numero: NumeroDeSeccion): string {
  return `${idDeLaSeccion(numero)}-titulo`;
}

function sinMovimiento(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function irALaSeccion(numero: NumeroDeSeccion): void {
  const seccion = document.getElementById(idDeLaSeccion(numero));
  if (seccion === null) return;
  seccion.scrollIntoView({ block: 'start', behavior: sinMovimiento() ? 'instant' : 'smooth' });
  document.getElementById(idDelTitulo(numero))?.focus({ preventScroll: true });
}

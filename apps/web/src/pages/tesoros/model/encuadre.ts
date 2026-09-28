export interface Limites {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface Relleno {
  arriba: number;
  abajo: number;
  izquierda: number;
  derecha: number;
}

export interface Encuadre {
  x: number;
  y: number;
  zoom: number;
}

export type Alineado = 'centro' | 'arriba';

export const ZOOM_MINIMO = 0.3;
export const ZOOM_DEL_AJUSTE = 1;

interface ConCaja {
  position: { x: number; y: number };
  width?: number;
  height?: number;
}

export function limitesDe(nodos: readonly ConCaja[]): Limites | null {
  if (nodos.length === 0) return null;
  let izquierda = Infinity;
  let arriba = Infinity;
  let derecha = -Infinity;
  let abajo = -Infinity;
  for (const nodo of nodos) {
    izquierda = Math.min(izquierda, nodo.position.x);
    arriba = Math.min(arriba, nodo.position.y);
    derecha = Math.max(derecha, nodo.position.x + (nodo.width ?? 0));
    abajo = Math.max(abajo, nodo.position.y + (nodo.height ?? 0));
  }
  return { x: izquierda, y: arriba, ancho: derecha - izquierda, alto: abajo - arriba };
}

export function encuadreDe(
  limites: Limites,
  ancho: number,
  alto: number,
  relleno: Relleno,
  alineado: Alineado = 'centro',
): Encuadre {
  const util = {
    ancho: Math.max(1, ancho - relleno.izquierda - relleno.derecha),
    alto: Math.max(1, alto - relleno.arriba - relleno.abajo),
  };
  const zoom = Math.min(
    ZOOM_DEL_AJUSTE,
    Math.max(
      ZOOM_MINIMO,
      Math.min(util.ancho / Math.max(1, limites.ancho), util.alto / Math.max(1, limites.alto)),
    ),
  );
  const x = relleno.izquierda + (util.ancho - limites.ancho * zoom) / 2 - limites.x * zoom;
  const sobra = util.alto - limites.alto * zoom;
  const y = relleno.arriba + (alineado === 'arriba' ? 0 : sobra / 2) - limites.y * zoom;
  return { x, y, zoom };
}

export function entraEnLaVista(
  limites: Limites,
  encuadre: Encuadre,
  ancho: number,
  alto: number,
): boolean {
  const izquierda = encuadre.x + limites.x * encuadre.zoom;
  const arriba = encuadre.y + limites.y * encuadre.zoom;
  const derecha = izquierda + limites.ancho * encuadre.zoom;
  const abajo = arriba + limites.alto * encuadre.zoom;
  const holgura = 0.5;
  return (
    izquierda >= -holgura &&
    arriba >= -holgura &&
    derecha <= ancho + holgura &&
    abajo <= alto + holgura
  );
}

export function formaDelPlano(nodos: readonly (ConCaja & { id: string })[]): string {
  return nodos
    .map((nodo) => `${nodo.id}:${String(nodo.position.x)}:${String(nodo.height ?? 0)}`)
    .join('|');
}

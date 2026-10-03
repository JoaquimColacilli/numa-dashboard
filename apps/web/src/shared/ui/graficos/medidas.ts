export interface MarcaExplorable {
  clave: string;
  nombre: string;
  izquierda: number;
  arriba: number;
  ancho: number;
  alto: number;
}

export type ModoDeCercania = 'horizontal' | 'en-el-plano';

export function marcaMasCercana(
  marcas: readonly MarcaExplorable[],
  x: number,
  y: number,
  modo: ModoDeCercania,
): MarcaExplorable | null {
  let mejor: MarcaExplorable | null = null;
  let distancia = Number.POSITIVE_INFINITY;
  for (const marca of marcas) {
    const cx = marca.izquierda + marca.ancho / 2;
    const cy = marca.arriba + marca.alto / 2;
    const adentro =
      x >= marca.izquierda &&
      x <= marca.izquierda + marca.ancho &&
      y >= marca.arriba &&
      y <= marca.arriba + marca.alto;
    if (modo === 'en-el-plano' && !adentro) continue;
    const esta = modo === 'horizontal' ? Math.abs(x - cx) : Math.hypot(x - cx, y - cy);
    if (esta < distancia) {
      mejor = marca;
      distancia = esta;
    }
  }
  return mejor;
}

export function altoUtilDeLasColumnas(ancho: number): number {
  return ancho < 360 ? 150 : 176;
}

export const ANCHO_DE_LAS_PESAS_ANGOSTAS = 520;

export function nombreQueEntra(nombre: string, ancho: number): string {
  const caben = Math.max(4, Math.floor(ancho / 7));
  return nombre.length <= caben ? nombre : `${nombre.slice(0, caben - 1).trimEnd()}…`;
}

export const RADIO_DEL_PUNTO = 5;

export const PISO_DE_LOS_PUNTOS = RADIO_DEL_PUNTO * 2 + 3;

export function lineaBaseDelEje(pisoMasAlto: number): number {
  return Math.max(66, 46 + pisoMasAlto * PISO_DE_LOS_PUNTOS);
}

export const ANCHO_DE_LOS_RENGLONES_ANGOSTOS = 420;

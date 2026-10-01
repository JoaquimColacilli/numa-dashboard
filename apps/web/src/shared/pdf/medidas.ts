export const COLOR = {
  ink: '#141414',
  text2: '#5c5c5c',
  text3: '#6d6d6d',
  border: '#d9d9d9',
  hairline: '#e6e4df',
  mesa: '#f2f1ed',
  paper: '#ffffff',
};

export const ANCHO_DE_LA_HOJA = 595.28;
export const MARGEN = 56;
export const CUERPO = 10.5;
export const INTERLINEADO = 1.45;
export const HILO = 0.6;
export const EJE = 8;
export const SANGRIA = 24;
export const LETRA_MAS_CHICA = 7.5;
export const INTERLETRADO_MAXIMO_EM = 0.06;

export const ANCHO_DEL_CENTRO = 104;
export const ANCHO_DEL_ROTULO = 189.6;
export const ANCHO_DE_LA_REVISION = 32;
export const ANCHO_DE_LA_OPCION = 45;

export const ASCENDENTE = 1.025;
const MAYUSCULA = 0.698;
const MINUSCULA = 0.516;
export const CENTRO_DE_LA_MAYUSCULA = CUERPO * (ASCENDENTE - MAYUSCULA / 2);
export const CENTRO_DE_LA_MINUSCULA = CUERPO * (ASCENDENTE - MINUSCULA / 2);

export function centrarMayuscula(alto: number, tamano: number): number {
  return (alto - tamano * MAYUSCULA) / 2 - tamano * (ASCENDENTE - MAYUSCULA);
}

export const RENGLONES_POR_HOJA = 38;

export function renglones(texto: string, caracteresPorRenglon: number): number {
  return texto
    .split('\n')
    .reduce(
      (suma, parrafo) => suma + Math.max(1, Math.ceil(parrafo.length / caracteresPorRenglon)),
      0,
    );
}

export const PRESENCIA = 3 * CUERPO * INTERLINEADO;

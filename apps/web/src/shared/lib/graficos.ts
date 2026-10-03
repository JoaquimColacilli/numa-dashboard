import { MONEDA_DEL_TALLER, type Idioma } from '@maun/domain';

import { idiomaActual } from './idioma';
import { adornosDelCampo, separadoresDelCampo } from './plata';

export const BANDA_MINIMA = 24;

export const LUGARES_MINIMOS = 6;

export const BANDA_CON_TODOS_LOS_ROTULOS = 34;

export const CANALETA_DEL_EJE = 38;

export const AREA_DE_UN_PUNTO = 24;

export type Escala = (valor: number) => number;

export function escalaLineal(
  [desde, hasta]: readonly [number, number],
  [inicio, fin]: readonly [number, number],
): Escala {
  const largo = hasta - desde;
  return (valor) => (largo === 0 ? inicio : inicio + ((valor - desde) / largo) * (fin - inicio));
}

const PASOS_REDONDOS = [1, 2, 2.5, 3, 4, 5, 6, 8] as const;

export function techoRedondo(maximo: number): number {
  if (!(maximo > 0)) return 1;
  const potencia = 10 ** Math.floor(Math.log10(maximo));
  const paso = PASOS_REDONDOS.find((candidato) => candidato * potencia >= maximo) ?? 10;
  return paso * potencia;
}

export function lugaresQueEntran(anchoUtil: number, total: number): number {
  return Math.min(total, Math.max(LUGARES_MINIMOS, Math.floor(anchoUtil / BANDA_MINIMA)));
}

export function anchoDeLaColumna(banda: number, chica = false): number {
  return Math.min(chica ? 14 : 24, Math.max(4, banda * (chica ? 0.56 : 0.6)));
}

export function caminoDeLaColumna(
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number,
  haciaAbajo = false,
): string {
  if (alto <= 0 || ancho <= 0) return '';
  const punta = Math.min(radio, ancho / 2, alto);
  const [izquierda, derecha] = [String(x), String(x + ancho)];
  const [adentroIzquierda, adentroDerecha] = [String(x + punta), String(x + ancho - punta)];
  if (haciaAbajo) {
    const [base, fin, antesDelFin] = [String(y), String(y + alto), String(y + alto - punta)];
    return `M${izquierda} ${base}V${antesDelFin}Q${izquierda} ${fin} ${adentroIzquierda} ${fin}H${adentroDerecha}Q${derecha} ${fin} ${derecha} ${antesDelFin}V${base}Z`;
  }
  const [base, fin, despuesDelFin] = [String(y + alto), String(y), String(y + punta)];
  return `M${izquierda} ${base}V${despuesDelFin}Q${izquierda} ${fin} ${adentroIzquierda} ${fin}H${adentroDerecha}Q${derecha} ${fin} ${derecha} ${despuesDelFin}V${base}Z`;
}

export function rotuloVisible(
  indice: number,
  cantidad: number,
  banda: number,
  siempre: boolean,
): boolean {
  return banda >= BANDA_CON_TODOS_LOS_ROTULOS || indice % 2 === (cantidad - 1) % 2 || siempre;
}

export function pisosDeLosPuntos(xs: readonly number[], separacion: number): number[] {
  const orden = xs.map((x, indice) => ({ x, indice })).sort((uno, otro) => uno.x - otro.x);
  const ultimoDeCadaPiso: number[] = [];
  const pisos = xs.map(() => 0);
  for (const { x, indice } of orden) {
    const libre = ultimoDeCadaPiso.findIndex((ultimo) => x - ultimo >= separacion);
    const piso = libre === -1 ? ultimoDeCadaPiso.length : libre;
    ultimoDeCadaPiso[piso] = x;
    pisos[indice] = piso;
  }
  return pisos;
}

export function techoDeDias(dias: readonly number[], minimo = 30): number {
  return Math.max(minimo, Math.ceil(Math.max(0, ...dias) / 10) * 10);
}

export function marcasCada(hasta: number, paso: number, desde = 0): number[] {
  const marcas: number[] = [];
  for (let marca = desde; marca <= hasta; marca += paso) marcas.push(marca);
  return marcas;
}

export function ejeDeDecenas(valores: readonly number[]): readonly [number, number] {
  const menor = Math.min(...valores);
  const mayor = Math.max(...valores);
  let desde = Math.floor(menor / 10) * 10;
  let hasta = Math.ceil(mayor / 10) * 10;
  if (hasta - desde < 20) {
    desde = menor >= 0 ? Math.max(0, desde - 10) : desde - 10;
    hasta = mayor <= 100 ? Math.min(100, hasta + 10) : hasta + 10;
  }
  if (hasta - desde < 20) hasta = desde + 20;
  return [desde, hasta];
}

export interface Cota {
  lineas: string;
  flechas: string;
}

export function cota(desde: number, hasta: number, y: number, flecha = 6): Cota {
  const a = String(desde);
  const b = String(hasta);
  return {
    lineas: `M${a} ${String(y - 5)}v10M${b} ${String(y - 5)}v10M${a} ${String(y)}H${b}`,
    flechas: `M${a} ${String(y)}l${String(flecha)} -3v6zM${b} ${String(y)}l-${String(flecha)} -3v6z`,
  };
}

function conMiles(entero: number, miles: string): string {
  return String(entero).replace(/\B(?=(\d{3})+(?!\d))/gu, miles);
}

export function plataCompacta(centavos: number, idioma: Idioma = idiomaActual()): string {
  const pesos = Math.abs(centavos) / 100;
  const enPesos = Math.round(pesos);
  if (enPesos === 0) return '0';
  const { antes } = adornosDelCampo(MONEDA_DEL_TALLER, idioma);
  const signo = centavos < 0 ? '−' : '';
  if (enPesos < 1000) return `${signo}${antes} ${String(enPesos)}`;
  const enMiles = Math.round(pesos / 1000);
  if (enMiles < 1000) return `${signo}${antes} ${String(enMiles)} k`;
  const { miles, decimal } = separadoresDelCampo(idioma);
  const decimas = Math.round(pesos / 100_000);
  const entero = conMiles(Math.trunc(decimas / 10), miles);
  const decimo = decimas % 10;
  return `${signo}${antes} ${decimo === 0 ? entero : `${entero}${decimal}${String(decimo)}`} M`;
}

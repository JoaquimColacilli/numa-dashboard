import {
  admiteLaMeta,
  cambiarElPaso,
  cambiarLaClase,
  cambiarLaObligacion,
  cambiarLaParte,
  CERO,
  lugarLibreDelReparto,
  modoInicial,
  moverObligacion,
  moverPaso,
  ponerDespues,
  ponerElSuperavit,
  ponerEnElReparto,
  ponerObligacion,
  ponerPaso,
  puntosBasicos,
  sacarDeLaFila,
  sumaDelReparto,
  tipoDelPaso,
  TOPE_DE_RENGLONES,
  type BaseDeLaObligacion,
  type ClaseDePaso,
  type Fila,
  type ModoDePaso,
  type Money,
  type PasoDeLaFila,
  type PuntosBasicos,
  type Renglon,
  type TipoDelPaso,
} from '@maun/domain';

import type { Tesoro } from '@/shared/api';
import { mensajes, textosDelIdioma } from '@/shared/idioma';

export { entraOtroPaso, puedeIrAlReparto } from '@/entities/fila';

export const NOMBRE_DE_LA_CLASE: Readonly<Record<ClaseDePaso, string>> = textosDelIdioma(
  () => mensajes().armarLaFila.clases,
);

const PORCENTAJE_AL_SUMAR = 1000;

export const RENGLON_DE_UN_COMPROMISO = 'Gasto fijo';

function tieneMeta(meta: Money | null | undefined): boolean {
  return meta !== null && meta !== undefined && meta > 0;
}

export function clasesPosibles(clave: Tesoro | null): ClaseDePaso[] {
  if (clave === 'hogar') return ['sueldo'];
  if (clave === 'maun') return ['fijos'];
  return ['fijos', 'prioridad'];
}

export function tiposPosibles(clave: Tesoro | null): TipoDelPaso[] {
  return clasesPosibles(clave).some((clase) => clase === 'prioridad')
    ? ['compromiso', 'ahorro-fijo']
    : ['compromiso'];
}

function claseDelTipo(tipo: TipoDelPaso, clave: Tesoro | null): ClaseDePaso {
  if (tipo === 'ahorro-fijo') return 'prioridad';
  return clave === 'hogar' ? 'sueldo' : 'fijos';
}

function claseDeSiempre(clave: Tesoro | null): ClaseDePaso {
  if (clave === 'hogar') return 'sueldo';
  if (clave === 'maun') return 'fijos';
  return 'prioridad';
}

export interface OpcionesDelPasoNuevo {
  clase?: ClaseDePaso;
  meta?: Money | null;
  renglon?: string;
}

export function pasoNuevo(
  tesoro: string,
  clave: Tesoro | null,
  tope: Money = CERO,
  { clase = claseDeSiempre(clave), meta = null, renglon }: OpcionesDelPasoNuevo = {},
): PasoDeLaFila {
  const nombre = renglon ?? (clave === 'maun' ? 'Costos fijos' : RENGLON_DE_UN_COMPROMISO);
  return {
    tesoro,
    clase,
    tope,
    renglones: clase === 'fijos' ? [{ nombre, monto: tope, dia: null }] : [],
    desde: null,
    modo: modoInicial(clase, clave),
    hastaLaMeta: admiteLaMeta(clase) && tieneMeta(meta),
  };
}

export function renglonNuevo(): Renglon {
  return { nombre: '', monto: CERO, dia: null };
}

export function lugarDelPaso(fila: Fila, tesoro: string): number {
  return fila.pasos.findIndex((paso) => paso.tesoro === tesoro);
}

export function pasoDe(fila: Fila, tesoro: string): PasoDeLaFila | undefined {
  return fila.pasos.find((paso) => paso.tesoro === tesoro);
}

export function sumarComoPaso(
  fila: Fila,
  tesoro: string,
  clave: Tesoro | null,
  despuesDe: string | null,
  tope: Money = CERO,
  opciones: OpcionesDelPasoNuevo = {},
): Fila {
  return ponerDespues(fila, despuesDe, pasoNuevo(tesoro, clave, tope, opciones));
}

export function sumarAlFinal(
  fila: Fila,
  tesoro: string,
  clave: Tesoro | null,
  tope: Money = CERO,
  opciones: OpcionesDelPasoNuevo = {},
): Fila {
  const sin = sacarDeLaFila(fila, tesoro);
  return ponerPaso(sin, pasoNuevo(tesoro, clave, tope, opciones), sin.pasos.length);
}

export interface OpcionesDelTipo {
  meta?: Money | null;
  renglon?: string;
  despuesDe?: string | null;
}

export function sumarComoTipo(
  fila: Fila,
  tipo: TipoDelPaso,
  tesoro: string,
  clave: Tesoro | null,
  tope: Money = CERO,
  { despuesDe, ...opciones }: OpcionesDelTipo = {},
): Fila {
  const deLaClase = { ...opciones, clase: claseDelTipo(tipo, clave) };
  return despuesDe === undefined
    ? sumarAlFinal(fila, tesoro, clave, tope, deLaClase)
    : sumarComoPaso(fila, tesoro, clave, despuesDe, tope, deLaClase);
}

export function sumarComoCompromiso(
  fila: Fila,
  tesoro: string,
  clave: Tesoro | null,
  tope: Money = CERO,
  opciones: OpcionesDelTipo = {},
): Fila {
  return sumarComoTipo(fila, 'compromiso', tesoro, clave, tope, opciones);
}

export function sumarComoAhorroFijo(
  fila: Fila,
  tesoro: string,
  clave: Tesoro | null,
  tope: Money = CERO,
  opciones: OpcionesDelTipo = {},
): Fila {
  return sumarComoTipo(fila, 'ahorro-fijo', tesoro, clave, tope, opciones);
}

export function lugarDelDiezmo(fila: Fila, diezmo: string): number {
  return fila.obligaciones.findIndex((obligacion) => obligacion.tesoro === diezmo);
}

export interface ObligacionNueva {
  porcentaje?: PuntosBasicos;
  base?: BaseDeLaObligacion;
  posicion?: number;
}

export function sumarComoObligacion(
  fila: Fila,
  tesoro: string,
  { porcentaje = puntosBasicos(0), base = 'ingreso', posicion }: ObligacionNueva = {},
): Fila {
  const sin = sacarDeLaFila(fila, tesoro);
  const lugar = Math.min(Math.max(0, posicion ?? sin.obligaciones.length), sin.obligaciones.length);
  return ponerObligacion(sin, { tesoro, porcentaje, base }, lugar);
}

export function puedeMoverseLaObligacion(fila: Fila, tesoro: string, hacia: -1 | 1): boolean {
  const lugar = fila.obligaciones.findIndex((obligacion) => obligacion.tesoro === tesoro);
  const destino = lugar + hacia;
  return lugar !== -1 && destino >= 0 && destino < fila.obligaciones.length;
}

export function moverLaObligacion(fila: Fila, tesoro: string, hacia: -1 | 1): Fila {
  if (!puedeMoverseLaObligacion(fila, tesoro, hacia)) return fila;
  const lugar = fila.obligaciones.findIndex((obligacion) => obligacion.tesoro === tesoro);
  return moverObligacion(fila, tesoro, lugar + hacia);
}

export function conPorcentajeDeLaObligacion(
  fila: Fila,
  tesoro: string,
  porcentaje: PuntosBasicos,
): Fila {
  if (!fila.obligaciones.some((obligacion) => obligacion.tesoro === tesoro)) return fila;
  return cambiarLaObligacion(fila, tesoro, { porcentaje });
}

export function conBase(fila: Fila, tesoro: string, base: BaseDeLaObligacion): Fila {
  if (!fila.obligaciones.some((obligacion) => obligacion.tesoro === tesoro)) return fila;
  return cambiarLaObligacion(fila, tesoro, { base });
}

export function puedeSalirDeLaFila(tesoro: string, diezmo: string): boolean {
  return tesoro !== diezmo;
}

export function porcentajeParaSumar(fila: Fila): PuntosBasicos {
  return puntosBasicos(Math.min(lugarLibreDelReparto(fila), PORCENTAJE_AL_SUMAR));
}

export function sumarAlReparto(
  fila: Fila,
  tesoro: string,
  porcentaje?: PuntosBasicos,
  meta?: Money | null,
): Fila {
  const yaEsta = fila.reparto.some((parte) => parte.tesoro === tesoro);
  return ponerEnElReparto(
    fila,
    tesoro,
    porcentaje ?? porcentajeParaSumar(fila),
    yaEsta ? undefined : tieneMeta(meta),
  );
}

export function puedeMoverse(fila: Fila, tesoro: string, hacia: -1 | 1): boolean {
  const lugar = lugarDelPaso(fila, tesoro);
  const paso = fila.pasos[lugar];
  const vecino = fila.pasos[lugar + hacia];
  if (paso === undefined || vecino === undefined) return false;
  return tipoDelPaso(paso.clase) === tipoDelPaso(vecino.clase);
}

export function moverUnLugar(fila: Fila, tesoro: string, hacia: -1 | 1): Fila {
  if (!puedeMoverse(fila, tesoro, hacia)) return fila;
  return moverPaso(fila, tesoro, lugarDelPaso(fila, tesoro) + hacia);
}

export function conClase(
  fila: Fila,
  tesoro: string,
  clase: ClaseDePaso,
  meta?: Money | null,
): Fila {
  const paso = pasoDe(fila, tesoro);
  if (paso === undefined || paso.clase === clase) return fila;
  const renglones: Renglon[] =
    clase === 'fijos' ? [{ nombre: RENGLON_DE_UN_COMPROMISO, monto: paso.tope, dia: null }] : [];
  const cambiada = cambiarLaClase(fila, tesoro, clase, renglones);
  if (!admiteLaMeta(clase) || !tieneMeta(meta)) return cambiada;
  return cambiarElPaso(cambiada, tesoro, { hastaLaMeta: true });
}

export function conTipo(
  fila: Fila,
  tesoro: string,
  tipo: TipoDelPaso,
  clave: Tesoro | null,
  meta?: Money | null,
): Fila {
  return conClase(fila, tesoro, claseDelTipo(tipo, clave), meta);
}

export function conTope(fila: Fila, tesoro: string, tope: Money): Fila {
  return cambiarElPaso(fila, tesoro, { tope });
}

export function conRenglones(fila: Fila, tesoro: string, renglones: readonly Renglon[]): Fila {
  return cambiarElPaso(fila, tesoro, { renglones });
}

export function conDia(fila: Fila, tesoro: string, indice: number, dia: number | null): Fila {
  const paso = pasoDe(fila, tesoro);
  if (paso?.renglones[indice] === undefined) return fila;
  return cambiarElPaso(fila, tesoro, {
    renglones: paso.renglones.map((renglon, i) => (i === indice ? { ...renglon, dia } : renglon)),
  });
}

export function conModo(fila: Fila, tesoro: string, modo: ModoDePaso): Fila {
  const paso = pasoDe(fila, tesoro);
  if (paso === undefined || paso.modo === modo) return fila;
  return cambiarElPaso(fila, tesoro, { modo });
}

export function conHastaLaMeta(fila: Fila, tesoro: string, hastaLaMeta: boolean): Fila {
  const paso = pasoDe(fila, tesoro);
  if (paso !== undefined) {
    return paso.hastaLaMeta === hastaLaMeta ? fila : cambiarElPaso(fila, tesoro, { hastaLaMeta });
  }
  const parte = fila.reparto.find((candidata) => candidata.tesoro === tesoro);
  if (parte === undefined || parte.hastaLaMeta === hastaLaMeta) return fila;
  return cambiarLaParte(fila, tesoro, { hastaLaMeta });
}

export function conSuperavit(fila: Fila, tesoro: string): Fila {
  return fila.superavit === tesoro ? fila : ponerElSuperavit(fila, tesoro);
}

export function sePuedeSumarUnRenglon(paso: PasoDeLaFila): boolean {
  return paso.renglones.length < TOPE_DE_RENGLONES;
}

export function conPorcentaje(fila: Fila, tesoro: string, porcentaje: PuntosBasicos): Fila {
  return ponerEnElReparto(fila, tesoro, porcentaje);
}

export function libreParaLaParte(fila: Fila, tesoro: string): number {
  const propia = fila.reparto.find((parte) => parte.tesoro === tesoro)?.porcentaje ?? 0;
  return Math.max(0, 10_000 - sumaDelReparto(fila) + propia);
}

export function sacar(fila: Fila, tesoro: string): Fila {
  return sacarDeLaFila(fila, tesoro);
}

export type LugarParaElTesoro = 'obligacion' | TipoDelPaso | 'reparto' | 'superavit';

export interface TesoroQueSeSuma {
  id: string;
  clave: Tesoro | null;
  meta: Money | null;
}

export function sumarEnElLugar(
  fila: Fila,
  tesoro: TesoroQueSeSuma,
  lugar: LugarParaElTesoro,
  despuesDe?: string | null,
): Fila {
  switch (lugar) {
    case 'obligacion': {
      const posicion =
        despuesDe === undefined
          ? undefined
          : despuesDe === null
            ? 0
            : fila.obligaciones.findIndex((obligacion) => obligacion.tesoro === despuesDe) + 1;
      return sumarComoObligacion(fila, tesoro.id, posicion === undefined ? {} : { posicion });
    }
    case 'compromiso':
    case 'ahorro-fijo':
      return sumarComoTipo(fila, lugar, tesoro.id, tesoro.clave, CERO, {
        meta: tesoro.meta,
        ...(despuesDe === undefined ? {} : { despuesDe }),
      });
    case 'reparto':
      return sumarAlReparto(fila, tesoro.id, undefined, tesoro.meta);
    case 'superavit':
      return conSuperavit(
        tesoro.clave === 'maun' ? fila : sacarDeLaFila(fila, tesoro.id),
        tesoro.id,
      );
  }
}

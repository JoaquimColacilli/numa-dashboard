import {
  tipoDelPaso,
  type CambioDeLaFila,
  type ClaseDePaso,
  type Fila,
  type ProblemaDeLaFila,
  type ProblemaEnLaFila,
} from '@maun/domain';
import type { ReactNode } from 'react';

import { mensajes } from '@/shared/idioma';
import { formatearPesos, formatearPorcentaje, type Envoltorio } from '@/shared/lib';
import type { NombreDeIcono } from '@/shared/ui';

const PROBLEMAS_CON_NOMBRE = [
  'tesoro-archivado',
  'tesoro-repetido',
  'modo-invalido',
  'meta-sin-monto',
  'superavit-invalido',
  'superavit-en-la-fila',
] as const satisfies readonly ProblemaDeLaFila[];

type ProblemaConNombre = (typeof PROBLEMAS_CON_NOMBRE)[number];

function esConNombre(problema: ProblemaDeLaFila): problema is ProblemaConNombre {
  return (PROBLEMAS_CON_NOMBRE as readonly ProblemaDeLaFila[]).includes(problema);
}

export function textoDelProblema(problema: ProblemaDeLaFila, nombre?: string): string {
  const textos = mensajes().armarLaFila;
  if (esConNombre(problema)) return textos.problemasConNombre[problema](nombre ?? null);
  return textos.problemas[problema];
}

export type LugarDelProblema =
  | 'tope'
  | 'renglones'
  | 'reparto'
  | 'tesoro'
  | 'fila'
  | 'obligacion'
  | 'modo'
  | 'meta'
  | 'superavit';

const LUGAR_DEL_PROBLEMA: Readonly<Record<ProblemaDeLaFila, LugarDelProblema>> = {
  'forma-invalida': 'fila',
  'demasiadas-obligaciones': 'obligacion',
  'demasiados-pasos': 'fila',
  'demasiadas-partes': 'reparto',
  'tesoro-desconocido': 'tesoro',
  'tesoro-archivado': 'tesoro',
  'tesoro-en-otra-moneda': 'tesoro',
  'tesoro-repetido': 'tesoro',
  'obligacion-en-hogar-o-maun': 'obligacion',
  'obligacion-invalida': 'obligacion',
  'sin-diezmo': 'obligacion',
  'diezmo-en-la-fila': 'tesoro',
  'hogar-no-es-sueldo': 'tesoro',
  'sueldo-no-es-hogar': 'tesoro',
  'maun-no-es-fijos': 'tesoro',
  'tope-fuera-de-rango': 'tope',
  'renglones-en-otra-clase': 'renglones',
  'fijos-sin-renglones': 'renglones',
  'demasiados-renglones': 'renglones',
  'renglon-sin-nombre': 'renglones',
  'renglon-largo': 'renglones',
  'renglon-fuera-de-rango': 'renglones',
  'dia-invalido': 'renglones',
  'tope-no-es-la-suma': 'renglones',
  'desde-invalido': 'tope',
  'modo-invalido': 'modo',
  'meta-fuera-de-ahorro': 'meta',
  'meta-sin-monto': 'meta',
  'ahorro-antes-de-compromiso': 'fila',
  'maun-en-el-reparto': 'reparto',
  'hogar-en-el-reparto': 'reparto',
  'porcentaje-invalido': 'reparto',
  'reparto-pasa-de-cien': 'reparto',
  'superavit-invalido': 'superavit',
  'superavit-en-la-fila': 'superavit',
  'sueldo-por-trabajo': 'fila',
};

export function lugarDelProblema(problema: ProblemaDeLaFila): LugarDelProblema {
  return LUGAR_DEL_PROBLEMA[problema];
}

export function problemasDe(
  problemas: readonly ProblemaEnLaFila[],
  tesoro: string | null,
  lugares: readonly LugarDelProblema[],
): ProblemaEnLaFila[] {
  return problemas.filter(
    (problema) =>
      (tesoro === null || problema.tesoro === tesoro) &&
      lugares.includes(lugarDelProblema(problema.problema)),
  );
}

export function porciento(bp: number): string {
  return `${formatearPorcentaje(bp)}%`;
}

export interface RenglonDelCambio {
  icono: NombreDeIcono;
  frase: (Nombre: Envoltorio) => ReactNode;
}

export interface ContextoDelCambio {
  antes: Fila;
  despues: Fila;
  nombreDe: (tesoro: string) => string;
}

function numeroDelPaso(fila: Fila, posicion: number): number {
  return fila.obligaciones.length + posicion + 1;
}

function claseEn(contexto: ContextoDelCambio, tesoro: string): ClaseDePaso {
  const paso =
    contexto.despues.pasos.find((candidato) => candidato.tesoro === tesoro) ??
    contexto.antes.pasos.find((candidato) => candidato.tesoro === tesoro);
  return paso?.clase ?? 'fijos';
}

export function renglonDelCambio(
  cambio: CambioDeLaFila,
  contexto: ContextoDelCambio,
): RenglonDelCambio {
  const textos = mensajes().armarLaFila.cambios;
  const nombre = contexto.nombreDe(cambio.tesoro);
  switch (cambio.tipo) {
    case 'entra-a-las-obligaciones':
      return {
        icono: 'plus',
        frase: (Nombre) =>
          textos.entraALasObligaciones(
            Nombre,
            nombre,
            cambio.posicion + 1,
            porciento(cambio.porcentaje),
            cambio.base,
          ),
      };
    case 'sale-de-las-obligaciones':
      return { icono: 'minus', frase: (Nombre) => textos.saleDeLasObligaciones(Nombre, nombre) };
    case 'cambia-de-lugar-la-obligacion':
      return {
        icono: 'arrow-up-down',
        frase: (Nombre) =>
          textos.cambiaDeLugar(Nombre, nombre, cambio.antes + 1, cambio.despues + 1),
      };
    case 'cambia-el-porcentaje-de-la-obligacion':
      return {
        icono: 'percent',
        frase: (Nombre) =>
          textos.cambiaElPorcentajeDeLaObligacion(
            Nombre,
            nombre,
            porciento(cambio.antes),
            porciento(cambio.despues),
          ),
      };
    case 'cambia-la-base':
      return {
        icono: 'receipt',
        frase: (Nombre) => textos.cambiaLaBase(Nombre, nombre, cambio.despues),
      };
    case 'entra-a-la-fila': {
      const tipo = tipoDelPaso(cambio.clase);
      const numero = numeroDelPaso(contexto.despues, cambio.posicion);
      const monto = formatearPesos(cambio.tope);
      return {
        icono: 'plus',
        frase: (Nombre) =>
          cambio.hastaLaMeta
            ? textos.entraALaFilaHastaLaMeta(Nombre, nombre, tipo, numero, monto, cambio.modo)
            : textos.entraALaFila(Nombre, nombre, tipo, numero, monto, cambio.modo),
      };
    }
    case 'sale-de-la-fila':
      return { icono: 'minus', frase: (Nombre) => textos.saleDeLaFila(Nombre, nombre) };
    case 'cambia-de-lugar':
      return {
        icono: 'arrow-up-down',
        frase: (Nombre) =>
          textos.cambiaDeLugar(
            Nombre,
            nombre,
            numeroDelPaso(contexto.antes, cambio.antes),
            numeroDelPaso(contexto.despues, cambio.despues),
          ),
      };
    case 'cambia-la-clase':
      return {
        icono: 'pencil-line',
        frase: (Nombre) => textos.cambiaLaClase(Nombre, nombre, tipoDelPaso(cambio.despues)),
      };
    case 'cambia-el-tope': {
      const paso = contexto.despues.pasos.find((candidato) => candidato.tesoro === cambio.tesoro);
      const antes = formatearPesos(cambio.antes);
      const despues = formatearPesos(cambio.despues);
      return {
        icono: 'ruler',
        frase: (Nombre) =>
          paso === undefined || paso.modo === 'saldo'
            ? textos.cambiaElTope(Nombre, nombre, antes, despues)
            : textos.cambiaElTopeConSuModo(
                Nombre,
                nombre,
                antes,
                despues,
                tipoDelPaso(paso.clase),
                paso.modo,
              ),
      };
    }
    case 'cambian-los-renglones':
      return {
        icono: 'list-checks',
        frase: (Nombre) => textos.cambianLosRenglones(Nombre, nombre),
      };
    case 'cambian-los-dias':
      return { icono: 'calendar', frase: (Nombre) => textos.cambianLosDias(Nombre, nombre) };
    case 'cambia-el-modo':
      return {
        icono: 'refresh-cw',
        frase: (Nombre) =>
          textos.cambiaElModo(
            Nombre,
            nombre,
            tipoDelPaso(claseEn(contexto, cambio.tesoro)),
            cambio.despues,
          ),
      };
    case 'cambia-la-meta':
      return {
        icono: 'trending-up',
        frase: (Nombre) =>
          cambio.hastaLaMeta
            ? textos.juntaHastaLaMeta(Nombre, nombre)
            : textos.juntaSinFin(Nombre, nombre),
      };
    case 'entra-al-reparto':
      return {
        icono: 'plus',
        frase: (Nombre) =>
          cambio.hastaLaMeta
            ? textos.entraAlRepartoHastaLaMeta(Nombre, nombre, porciento(cambio.porcentaje))
            : textos.entraAlReparto(Nombre, nombre, porciento(cambio.porcentaje)),
      };
    case 'sale-del-reparto':
      return { icono: 'minus', frase: (Nombre) => textos.saleDelReparto(Nombre, nombre) };
    case 'cambia-el-porcentaje':
      return {
        icono: 'percent',
        frase: (Nombre) =>
          textos.cambiaElPorcentaje(
            Nombre,
            nombre,
            porciento(cambio.antes),
            porciento(cambio.despues),
          ),
      };
    case 'cambia-el-superavit':
      return {
        icono: 'coins',
        frase: (Nombre) =>
          textos.cambiaElSuperavit(Nombre, nombre, contexto.nombreDe(cambio.antes)),
      };
  }
}

export function describirCambios(cuantos: number): string {
  return mensajes().armarLaFila.cuantosCambios(cuantos);
}

export function cuantasCosas(cuantas: number): string {
  return mensajes().armarLaFila.cuantasCosas(cuantas);
}

import {
  tipoDelPaso,
  type CambioDeLaFila,
  type ClaseDePaso,
  type Fila,
  type ModoDePaso,
  type ProblemaDeLaFila,
  type ProblemaEnLaFila,
} from '@maun/domain';

import { BASE_EN_PALABRAS, modoEnPalabras, NOMBRE_DEL_TIPO } from '@/entities/fila';
import { formatearPesos, formatearPorcentaje } from '@/shared/lib';
import type { NombreDeIcono } from '@/shared/ui';

const TEXTO_DEL_PROBLEMA: Readonly<Record<ProblemaDeLaFila, string>> = {
  'forma-invalida': 'La fila no se pudo leer.',
  'demasiadas-obligaciones': 'Entran hasta 6 obligaciones.',
  'demasiados-pasos': 'Entran hasta 12 pasos.',
  'demasiadas-partes': 'El reparto admite hasta 8 tesoros.',
  'tesoro-desconocido': 'Uno de los tesoros ya no existe.',
  'tesoro-archivado': '{nombre} está archivado: sacalo de la fila.',
  'tesoro-repetido': '{nombre} está dos veces: cada tesoro va una sola vez.',
  'obligacion-en-hogar-o-maun': 'Hogar y Maun no pueden ser obligación.',
  'obligacion-invalida':
    'Cada obligación necesita un porcentaje de 0,01% a 100% y sobre qué se calcula.',
  'sin-diezmo': 'Falta el diezmo entre las obligaciones.',
  'diezmo-en-la-fila': 'El diezmo va entre las obligaciones.',
  'hogar-no-es-sueldo': 'Hogar solo recibe el sueldo.',
  'sueldo-no-es-hogar': 'El sueldo va siempre a Hogar.',
  'maun-no-es-fijos': 'Maun solo puede ser un paso de gastos fijos.',
  'tope-fuera-de-rango': 'El tope no puede ser negativo ni tan grande.',
  'renglones-en-otra-clase': 'Solo los gastos fijos tienen renglones.',
  'fijos-sin-renglones': 'Los gastos fijos necesitan al menos un renglón.',
  'demasiados-renglones': 'Entran hasta 12 renglones.',
  'renglon-sin-nombre': 'Cada renglón necesita un nombre.',
  'renglon-largo': 'El nombre del renglón es muy largo: hasta 40 letras.',
  'renglon-fuera-de-rango': 'Cada renglón necesita un monto mayor que cero.',
  'dia-invalido': 'El día de pago va del 1 al 31.',
  'tope-no-es-la-suma': 'El tope tiene que ser la suma de los renglones.',
  'desde-invalido': 'La fecha del tope no se pudo leer.',
  'modo-invalido': '{nombre} no puede llenarse de esa forma.',
  'meta-fuera-de-ahorro': 'Solo los ahorros van hasta la meta.',
  'meta-sin-monto': '{nombre} no tiene meta: ponele una o sacá «hasta la meta».',
  'ahorro-antes-de-compromiso': 'Los ahorros van después de los compromisos.',
  'maun-en-el-reparto':
    'Maun no va en el reparto: para que reciba lo que sobra, elegilo como superávit.',
  'hogar-en-el-reparto': 'Hogar no va en el reparto: recibe el sueldo.',
  'porcentaje-invalido': 'Cada porcentaje va de 0,01% a 100%.',
  'reparto-pasa-de-cien': 'Los porcentajes suman más de 100%.',
  'superavit-invalido': 'Lo que sobra no puede ir a {nombre}.',
  'superavit-en-la-fila': '{nombre} recibe lo que sobra: no puede estar también en la fila.',
  'sueldo-por-trabajo': 'La fila cuenta el sueldo por mes.',
};

export function textoDelProblema(problema: ProblemaDeLaFila, nombre = 'Ese tesoro'): string {
  return TEXTO_DEL_PROBLEMA[problema].replace('{nombre}', nombre);
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
  despuesDelNombre: string;
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

function montoConSuModo(tope: number, modo: ModoDePaso, clase: ClaseDePaso): string {
  const pesos = formatearPesos(tope);
  return modo === 'saldo'
    ? `${pesos}, ${modoEnPalabras(modo, tipoDelPaso(clase))}`
    : `${pesos} ${modoEnPalabras(modo, tipoDelPaso(clase))}`;
}

function comoSeLlena(modo: ModoDePaso, clase: ClaseDePaso): string {
  const tipo = tipoDelPaso(clase);
  if (modo === 'saldo') return modoEnPalabras(modo, tipo);
  const verbo = tipo === 'compromiso' ? 'se llena' : 'se aparta';
  return `${verbo} ${modoEnPalabras(modo, tipo)}`;
}

function nombreDelTipoDelPaso(clase: ClaseDePaso): string {
  return NOMBRE_DEL_TIPO[tipoDelPaso(clase)].toLowerCase();
}

export function renglonDelCambio(
  cambio: CambioDeLaFila,
  contexto: ContextoDelCambio,
): RenglonDelCambio {
  switch (cambio.tipo) {
    case 'entra-a-las-obligaciones':
      return {
        icono: 'plus',
        despuesDelNombre: ` entra como obligación ${String(cambio.posicion + 1)}, con el ${porciento(cambio.porcentaje)} ${BASE_EN_PALABRAS[cambio.base]}.`,
      };
    case 'sale-de-las-obligaciones':
      return { icono: 'minus', despuesDelNombre: ' sale de las obligaciones y vuelve al estante.' };
    case 'cambia-de-lugar-la-obligacion':
      return {
        icono: 'arrow-up-down',
        despuesDelNombre: ` pasa del ${String(cambio.antes + 1)} al ${String(cambio.despues + 1)} en la fila.`,
      };
    case 'cambia-el-porcentaje-de-la-obligacion':
      return {
        icono: 'percent',
        despuesDelNombre: `: de ${porciento(cambio.antes)} a ${porciento(cambio.despues)}.`,
      };
    case 'cambia-la-base':
      return {
        icono: 'receipt',
        despuesDelNombre: ` pasa a calcularse ${BASE_EN_PALABRAS[cambio.despues]}.`,
      };
    case 'entra-a-la-fila':
      return {
        icono: 'plus',
        despuesDelNombre: ` entra como ${nombreDelTipoDelPaso(cambio.clase)} ${String(numeroDelPaso(contexto.despues, cambio.posicion))}, con ${montoConSuModo(cambio.tope, cambio.modo, cambio.clase)}${cambio.hastaLaMeta ? ', hasta la meta' : ''}.`,
      };
    case 'sale-de-la-fila':
      return { icono: 'minus', despuesDelNombre: ' vuelve al estante con lo que tiene.' };
    case 'cambia-de-lugar':
      return {
        icono: 'arrow-up-down',
        despuesDelNombre: ` pasa del ${String(numeroDelPaso(contexto.antes, cambio.antes))} al ${String(numeroDelPaso(contexto.despues, cambio.despues))} en la fila.`,
      };
    case 'cambia-la-clase':
      return {
        icono: 'pencil-line',
        despuesDelNombre: ` pasa a ser ${nombreDelTipoDelPaso(cambio.despues)}.`,
      };
    case 'cambia-el-tope': {
      const paso = contexto.despues.pasos.find((candidato) => candidato.tesoro === cambio.tesoro);
      const unidad =
        paso === undefined || paso.modo === 'saldo'
          ? ''
          : ` ${modoEnPalabras(paso.modo, tipoDelPaso(paso.clase))}`;
      return {
        icono: 'ruler',
        despuesDelNombre: `: de ${formatearPesos(cambio.antes)} a ${formatearPesos(cambio.despues)}${unidad}.`,
      };
    }
    case 'cambian-los-renglones':
      return {
        icono: 'list-checks',
        despuesDelNombre: ' cambia sus renglones y el tope sigue igual.',
      };
    case 'cambian-los-dias':
      return { icono: 'calendar', despuesDelNombre: ' cambia los días de pago.' };
    case 'cambia-el-modo':
      return {
        icono: 'refresh-cw',
        despuesDelNombre: ` ahora ${comoSeLlena(cambio.despues, claseEn(contexto, cambio.tesoro))}.`,
      };
    case 'cambia-la-meta':
      return {
        icono: 'trending-up',
        despuesDelNombre: cambio.hastaLaMeta
          ? ' junta hasta llegar a su meta.'
          : ' junta sin fin, aunque llegue a su meta.',
      };
    case 'entra-al-reparto':
      return {
        icono: 'plus',
        despuesDelNombre: ` entra al reparto con el ${porciento(cambio.porcentaje)} de lo que sobra${cambio.hastaLaMeta ? ', hasta la meta' : ''}.`,
      };
    case 'sale-del-reparto':
      return { icono: 'minus', despuesDelNombre: ' sale del reparto y vuelve al estante.' };
    case 'cambia-el-porcentaje':
      return {
        icono: 'percent',
        despuesDelNombre: `: de ${porciento(cambio.antes)} a ${porciento(cambio.despues)} de lo que sobra.`,
      };
    case 'cambia-el-superavit':
      return {
        icono: 'coins',
        despuesDelNombre: ` recibe lo que sobra, en lugar de ${contexto.nombreDe(cambio.antes)}.`,
      };
  }
}

export function describirCambios(cuantos: number): string {
  if (cuantos === 0) return 'Sin cambios todavía';
  return cuantos === 1 ? '1 cambio sin guardar' : `${String(cuantos)} cambios sin guardar`;
}

export function cuantasCosas(cuantas: number): string {
  return cuantas === 1 ? 'Cambia una cosa' : `Cambian ${String(cuantas)} cosas`;
}

export function mesYAnio(mes: string, nombre: string): string {
  return `${nombre.toLowerCase()} de ${mes.slice(0, 4)}`;
}

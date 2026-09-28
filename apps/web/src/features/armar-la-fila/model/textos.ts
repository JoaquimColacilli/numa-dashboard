import type { CambioDeLaFila, ProblemaDeLaFila, ProblemaEnLaFila } from '@maun/domain';

import { formatearPesos, formatearPorcentaje } from '@/shared/lib';
import type { NombreDeIcono } from '@/shared/ui';

const TEXTO_DEL_PROBLEMA: Readonly<Record<ProblemaDeLaFila, string>> = {
  'forma-invalida': 'La fila no se pudo leer.',
  'demasiados-pasos': 'Entran hasta 12 pasos.',
  'demasiadas-partes': 'El reparto admite hasta 8 tesoros.',
  'tesoro-desconocido': 'Uno de los tesoros ya no existe.',
  'tesoro-archivado': '{nombre} está archivado: sacalo de la fila.',
  'tesoro-repetido': '{nombre} está dos veces: cada tesoro va una sola vez.',
  'diezmo-en-la-fila': 'El diezmo no se mueve: sale siempre primero.',
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
  'tope-no-es-la-suma': 'El tope tiene que ser la suma de los renglones.',
  'desde-invalido': 'La fecha del tope no se pudo leer.',
  'maun-en-el-reparto': 'Maun no va en el reparto: se queda con lo que sobra.',
  'hogar-en-el-reparto': 'Hogar no va en el reparto: recibe el sueldo.',
  'porcentaje-invalido': 'Cada porcentaje va de 0,01% a 100%.',
  'reparto-pasa-de-cien': 'Los porcentajes suman más de 100%.',
  'sueldo-por-trabajo': 'La fila cuenta el sueldo por mes.',
};

export function textoDelProblema(problema: ProblemaDeLaFila, nombre = 'Ese tesoro'): string {
  return TEXTO_DEL_PROBLEMA[problema].replace('{nombre}', nombre);
}

export type LugarDelProblema = 'tope' | 'renglones' | 'reparto' | 'tesoro' | 'fila';

const LUGAR_DEL_PROBLEMA: Readonly<Record<ProblemaDeLaFila, LugarDelProblema>> = {
  'forma-invalida': 'fila',
  'demasiados-pasos': 'fila',
  'demasiadas-partes': 'reparto',
  'tesoro-desconocido': 'tesoro',
  'tesoro-archivado': 'tesoro',
  'tesoro-repetido': 'tesoro',
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
  'tope-no-es-la-suma': 'renglones',
  'desde-invalido': 'tope',
  'maun-en-el-reparto': 'reparto',
  'hogar-en-el-reparto': 'reparto',
  'porcentaje-invalido': 'reparto',
  'reparto-pasa-de-cien': 'reparto',
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

export function renglonDelCambio(cambio: CambioDeLaFila): RenglonDelCambio {
  switch (cambio.tipo) {
    case 'entra-a-la-fila':
      return {
        icono: 'plus',
        despuesDelNombre: ` entra como paso ${String(cambio.posicion + 1)}, con ${formatearPesos(cambio.tope)} por mes.`,
      };
    case 'sale-de-la-fila':
      return { icono: 'minus', despuesDelNombre: ' vuelve al estante con lo que tiene.' };
    case 'cambia-de-lugar':
      return {
        icono: 'arrow-up-down',
        despuesDelNombre: ` pasa del paso ${String(cambio.antes + 1)} al ${String(cambio.despues + 1)}.`,
      };
    case 'cambia-el-tope':
      return {
        icono: 'ruler',
        despuesDelNombre: `: de ${formatearPesos(cambio.antes)} a ${formatearPesos(cambio.despues)} por mes.`,
      };
    case 'cambian-los-renglones':
      return {
        icono: 'list-checks',
        despuesDelNombre: ' cambia sus renglones y el tope sigue igual.',
      };
    case 'entra-al-reparto':
      return {
        icono: 'plus',
        despuesDelNombre: ` entra al reparto con el ${porciento(cambio.porcentaje)} de lo que sobra.`,
      };
    case 'sale-del-reparto':
      return { icono: 'minus', despuesDelNombre: ' sale del reparto y vuelve al estante.' };
    case 'cambia-el-porcentaje':
      return {
        icono: 'percent',
        despuesDelNombre: `: de ${porciento(cambio.antes)} a ${porciento(cambio.despues)} de lo que sobra.`,
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

import type { CategoriaDeAgenda } from '@maun/domain';

import type { NombreDeIcono } from '@/shared/ui';

export type FormaDeLaMarca =
  'cuadrado' | 'punteado' | 'rombo' | 'circulo' | 'barra' | 'triangulo' | 'reloj';

export interface DatosDeLaCategoria {
  icono: NombreDeIcono;
  forma: FormaDeLaMarca;
  texto: string;
  fondo: string;
  borde: string;
}

export const CATEGORIA: Readonly<Record<CategoriaDeAgenda, DatosDeLaCategoria>> = {
  entrega: {
    icono: 'truck',
    forma: 'cuadrado',
    texto: 'text-ag-entrega',
    fondo: 'bg-ag-entrega',
    borde: 'border-ag-entrega',
  },
  presupuesto: {
    icono: 'file-text',
    forma: 'punteado',
    texto: 'text-ag-presupuesto',
    fondo: 'bg-ag-presupuesto',
    borde: 'border-ag-presupuesto',
  },
  visita: {
    icono: 'map-pin',
    forma: 'rombo',
    texto: 'text-ag-visita',
    fondo: 'bg-ag-visita',
    borde: 'border-ag-visita',
  },
  seguimiento: {
    icono: 'message-circle',
    forma: 'triangulo',
    texto: 'text-ag-seguimiento',
    fondo: 'bg-ag-seguimiento',
    borde: 'border-ag-seguimiento',
  },
  vencimiento: {
    icono: 'receipt',
    forma: 'reloj',
    texto: 'text-ag-vencimiento',
    fondo: 'bg-ag-vencimiento',
    borde: 'border-ag-vencimiento',
  },
  materiales: {
    icono: 'package',
    forma: 'circulo',
    texto: 'text-ag-materiales',
    fondo: 'bg-ag-materiales',
    borde: 'border-ag-materiales',
  },
  taller: {
    icono: 'pencil-ruler',
    forma: 'barra',
    texto: 'text-ag-taller',
    fondo: 'bg-ag-taller',
    borde: 'border-ag-taller',
  },
};

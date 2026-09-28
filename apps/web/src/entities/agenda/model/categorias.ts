import type {
  CategoriaDeAgenda,
  CategoriaDerivada,
  CategoriaPropia,
  FranjaDeEntrega,
} from '@maun/domain';

import type { NombreDeIcono } from '@/shared/ui';

export type FormaDeLaMarca =
  'cuadrado' | 'punteado' | 'rombo' | 'circulo' | 'barra' | 'triangulo' | 'reloj';

export interface DatosDeLaCategoria {
  etiqueta: string;
  icono: NombreDeIcono;
  forma: FormaDeLaMarca;
  texto: string;
  fondo: string;
  borde: string;
}

export const CATEGORIA: Readonly<Record<CategoriaDeAgenda, DatosDeLaCategoria>> = {
  entrega: {
    etiqueta: 'Entrega',
    icono: 'truck',
    forma: 'cuadrado',
    texto: 'text-ag-entrega',
    fondo: 'bg-ag-entrega',
    borde: 'border-ag-entrega',
  },
  presupuesto: {
    etiqueta: 'Presupuesto',
    icono: 'file-text',
    forma: 'punteado',
    texto: 'text-ag-presupuesto',
    fondo: 'bg-ag-presupuesto',
    borde: 'border-ag-presupuesto',
  },
  visita: {
    etiqueta: 'Visita',
    icono: 'map-pin',
    forma: 'rombo',
    texto: 'text-ag-visita',
    fondo: 'bg-ag-visita',
    borde: 'border-ag-visita',
  },
  seguimiento: {
    etiqueta: 'Seguimiento',
    icono: 'message-circle',
    forma: 'triangulo',
    texto: 'text-ag-seguimiento',
    fondo: 'bg-ag-seguimiento',
    borde: 'border-ag-seguimiento',
  },
  vencimiento: {
    etiqueta: 'Vencimiento',
    icono: 'receipt',
    forma: 'reloj',
    texto: 'text-ag-vencimiento',
    fondo: 'bg-ag-vencimiento',
    borde: 'border-ag-vencimiento',
  },
  materiales: {
    etiqueta: 'Materiales',
    icono: 'package',
    forma: 'circulo',
    texto: 'text-ag-materiales',
    fondo: 'bg-ag-materiales',
    borde: 'border-ag-materiales',
  },
  taller: {
    etiqueta: 'Taller',
    icono: 'pencil-ruler',
    forma: 'barra',
    texto: 'text-ag-taller',
    fondo: 'bg-ag-taller',
    borde: 'border-ag-taller',
  },
};

export interface DatosDeLaDerivada {
  accion: string;
  corta: string;
  conector: string;
  origen: string;
  queCambia: string;
  abrir: string;
  hecha: string;
}

export const DERIVADA: Readonly<Record<CategoriaDerivada, DatosDeLaDerivada>> = {
  entrega: {
    accion: 'Entregar',
    corta: 'Entrega',
    conector: ': ',
    origen: 'Sale de la entrega estimada del proyecto',
    queCambia: 'la entrega estimada del proyecto',
    abrir: 'Abrir el proyecto',
    hecha: 'entregada',
  },
  visita: {
    accion: 'Relevamiento',
    corta: 'Relevamiento',
    conector: ': ',
    origen: 'Sale de la fecha de visita del contacto',
    queCambia: 'el día de la visita',
    abrir: 'Abrir el contacto',
    hecha: 'ya fuiste',
  },
  presupuesto: {
    accion: 'Entregar presupuesto',
    corta: 'Presupuesto',
    conector: ': ',
    origen: 'Sale de la fecha límite del presupuesto del contacto',
    queCambia: 'el plazo del presupuesto',
    abrir: 'Abrir el contacto',
    hecha: 'enviado',
  },
  seguimiento: {
    accion: 'Volver a escribirle a',
    corta: 'Escribirle a',
    conector: ' ',
    origen: 'Sale del seguimiento del trabajo',
    queCambia: 'el día en que le volvés a escribir',
    abrir: 'Abrir el seguimiento',
    hecha: 'ya le escribiste',
  },
};

export interface DatosDelVencimiento {
  accion: string;
  corta: string;
  conector: string;
  origen: string;
  hecha: string;
  pagado: string;
  registrar: string;
  verEnTesoros: string;
  masAdelante: string;
}

export const VENCIMIENTO: DatosDelVencimiento = {
  accion: 'Vence',
  corta: 'Vence',
  conector: ': ',
  origen: 'Sale del día de pago de un compromiso de la fila',
  hecha: 'pagado',
  pagado: 'Pagado',
  registrar: 'Registrar el pago',
  verEnTesoros: 'Ver en Tesoros',
  masAdelante: 'El pago se registra desde el mes en que vence.',
};

export const ESTA_COMPROMETIDA =
  'Está comprometida con el cliente. Para cambiarla, abrí el proyecto.';

export const FRANJA_DEL_EVENTO: Readonly<Record<FranjaDeEntrega, string>> = {
  manana: 'a la mañana',
  tarde: 'a la tarde',
};

export const AYUDA_DE_LA_PROPIA: Readonly<Record<CategoriaPropia, string>> = {
  materiales: 'comprar, encargar, retirar',
  taller: 'trabajo, mandados, cobros',
};

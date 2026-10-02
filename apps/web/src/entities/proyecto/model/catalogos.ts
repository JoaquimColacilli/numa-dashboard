import { ESTADOS, ESTADOS_DE_CONSULTA, type EstadoProyecto, type Fase } from '@maun/domain';

import type { FilaDe } from '@/shared/api';
import { mensajes, textosDelIdioma } from '@/shared/idioma';

export type Proyecto = FilaDe<'proyectos'>;
export type Pago = FilaDe<'pagos'>;
export type Gasto = FilaDe<'gastos'>;
export type FormaDePago = NonNullable<Proyecto['forma_pago']>;
export type Comprobante = Proyecto['comprobante'];

export interface DatosDelEstado {
  id: EstadoProyecto;
  etiqueta: string;
  tono: string;
}

function estado(id: EstadoProyecto, tono: string): DatosDelEstado {
  return {
    id,
    tono,
    get etiqueta() {
      return mensajes().proyecto.estados[id];
    },
  };
}

export const ESTADO: Readonly<Record<EstadoProyecto, DatosDelEstado>> = {
  contacto: estado('contacto', 'border-border text-text-2'),
  presupuesto_estimativo: estado('presupuesto_estimativo', 'border-border text-text-2'),
  relevamiento: estado('relevamiento', 'border-border text-text-2'),
  a_presupuestar: estado('a_presupuestar', 'border-border text-text-2'),
  presupuesto_enviado: estado('presupuesto_enviado', 'border-border text-text-2'),
  en_seguimiento: estado('en_seguimiento', 'border-border text-text-2'),
  perdido: estado('perdido', 'border-border text-text-3'),
  en_curso: estado('en_curso', 'border-ink bg-ink text-paper'),
  entregado: estado('entregado', 'border-atencion bg-atencion-tint text-atencion'),
  cobrado: estado('cobrado', 'border-hogar bg-hogar-tint text-hogar'),
};

export const ESTADOS_EN_ORDEN: readonly EstadoProyecto[] = ESTADOS;

export const FORMA_DE_PAGO: Readonly<Record<FormaDePago, string>> = textosDelIdioma(
  () => mensajes().proyecto.formasDePago,
);

export const FORMAS_EN_ORDEN = [
  'efectivo',
  'transferencia',
  'cuotas',
  'mixto',
] as const satisfies readonly FormaDePago[];

export const COMPROBANTE: Readonly<Record<Comprobante, string>> = textosDelIdioma(
  () => mensajes().proyecto.comprobantes,
);

export const COMPROBANTES_EN_ORDEN = [
  'factura_a',
  'factura_b',
  'factura_c',
  'remito',
  'sin_comprobante',
] as const satisfies readonly Comprobante[];

const POR_CONDICION: Readonly<Record<string, Comprobante>> = {
  consumidor_final: 'remito',
  monotributo: 'factura_c',
  responsable_inscripto: 'factura_a',
  exento: 'factura_b',
};

export function comprobanteDeLaCondicion(condicion: string): Comprobante {
  return POR_CONDICION[condicion] ?? 'sin_comprobante';
}

export interface Etapa {
  id: Fase;
  etiqueta: string;
  ruta: string;
}

function etapa(id: Fase, ruta: string): Etapa {
  return {
    id,
    ruta,
    get etiqueta() {
      return mensajes().proyecto.etapas[id];
    },
  };
}

export const ETAPAS: readonly Etapa[] = [
  etapa('consultas', '/consultas'),
  etapa('seguimiento', '/proyectos?etapa=seguimiento'),
  etapa('activos', '/proyectos'),
  etapa('historial', '/proyectos?etapa=historial'),
];

export const FILTROS_POR_ETAPA: Readonly<Record<Fase, readonly EstadoProyecto[]>> = {
  consultas: ESTADOS_DE_CONSULTA,
  seguimiento: ['en_seguimiento'],
  activos: ['en_curso', 'entregado'],
  historial: ['cobrado', 'perdido'],
};

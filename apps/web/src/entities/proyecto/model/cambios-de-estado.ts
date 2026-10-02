import {
  ESTADOS,
  estaLiquidado,
  faseDe,
  TRANSICIONES,
  type EstadoLiquidado,
  type EstadoProyecto,
} from '@maun/domain';

import type { CambiosDeProyecto } from '@/shared/api';
import { mensajes } from '@/shared/idioma';

import type { Proyecto } from './catalogos';

export type EstadoSinLiquidar = Exclude<EstadoProyecto, EstadoLiquidado>;

export type SentidoDelCambio = 'adelante' | 'atras';

export interface CambioDeEstado {
  hacia: EstadoSinLiquidar;
  etiqueta: string;
  sentido: SentidoDelCambio;
  camino: 'guardar' | 'pasaje';
}

function sinLiquidar(estado: EstadoProyecto): estado is EstadoSinLiquidar {
  return !estaLiquidado(estado);
}

function etiquetaDelCambio(desde: EstadoProyecto, hacia: EstadoSinLiquidar): string {
  const cambios = mensajes().proyecto.cambios;
  switch (hacia) {
    case 'contacto':
      return cambios.volverAContacto;
    case 'presupuesto_estimativo':
      return cambios.mandeUnEstimativo;
    case 'relevamiento':
      return cambios.pasarARelevamiento;
    case 'a_presupuestar':
      return cambios.pasarAPresupuestar;
    case 'presupuesto_enviado':
      return faseDe(desde) === 'consultas'
        ? cambios.mandeElPresupuesto
        : cambios.volvioAPresupuesto;
    case 'en_curso':
      return faseDe(desde) === 'consultas' ? cambios.yaLoAprobo : cambios.volvioAlTaller;
    case 'en_seguimiento':
      return cambios.porAhoraNo;
    case 'entregado':
      return cambios.yaLoEntregue;
  }
}

export function cambiosDeEstado(desde: EstadoProyecto): CambioDeEstado[] {
  const posicion = ESTADOS.indexOf(desde);
  return TRANSICIONES[desde].filter(sinLiquidar).map((hacia): CambioDeEstado => ({
    hacia,
    etiqueta: etiquetaDelCambio(desde, hacia),
    sentido: ESTADOS.indexOf(hacia) > posicion ? 'adelante' : 'atras',
    camino: faseDe(desde) === 'consultas' && faseDe(hacia) === 'activos' ? 'pasaje' : 'guardar',
  }));
}

export function cambiosAlPasar(
  proyecto: Proyecto,
  hacia: EstadoSinLiquidar,
  hoy: string,
): CambiosDeProyecto {
  if (hacia === 'entregado') {
    return { estado: hacia, fecha_entrega: hoy };
  }
  if (proyecto.estado === 'entregado') return { estado: hacia, fecha_entrega: null };
  return { estado: hacia };
}

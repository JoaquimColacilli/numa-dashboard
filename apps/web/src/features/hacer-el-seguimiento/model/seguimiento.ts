import type { EstadoDeConsulta, EstadoProyecto } from '@maun/domain';

import {
  datosActualesDelProyecto,
  guardadoDeUnPaso,
  type GuardadoDeProyecto,
  type ProximoContacto,
  type Proyecto,
} from '@/entities/proyecto';
import type { ProximoParaGuardar } from '@/shared/api';
import { mensajes } from '@/shared/idioma';

const UN_DIA = /^\d{4}-\d{2}-\d{2}$/;

export const LARGO_MAXIMO_DE_LA_NOTA = 500;

export interface ValoresDelSeguimiento {
  fecha: string;
  nota: string;
}

export function errorDelProximoContacto(fecha: string, hoy: string): string | undefined {
  const { errores } = mensajes().hacerElSeguimiento;
  if (!UN_DIA.test(fecha)) return errores.sinProximoContacto;
  if (fecha < hoy) return errores.proximoContactoQuePaso;
  return undefined;
}

export function errorDelDiaQueLeEscribiste(dia: string, hoy: string): string | undefined {
  const { errores } = mensajes().hacerElSeguimiento;
  if (!UN_DIA.test(dia)) return errores.sinDiaQueLeEscribiste;
  if (dia > hoy) return errores.diaQueNoLlego;
  return undefined;
}

export function errorDeLaNota(nota: string): string | undefined {
  return nota.trim().length > LARGO_MAXIMO_DE_LA_NOTA
    ? mensajes().hacerElSeguimiento.errores.notaLarga(LARGO_MAXIMO_DE_LA_NOTA)
    : undefined;
}

function pendienteNuevo(
  id: string,
  valores: ValoresDelSeguimiento,
  etapaPrevia: EstadoProyecto,
): ProximoParaGuardar {
  return {
    id,
    fecha: valores.fecha,
    nota: valores.nota.trim(),
    etapa_previa: etapaPrevia,
    hecho_el: null,
    resultado: null,
    respuesta: '',
  };
}

export function guardadoParaPonerEnSeguimiento(
  proyecto: Proyecto,
  valores: ValoresDelSeguimiento,
  hoy: string,
  id: string,
): GuardadoDeProyecto {
  const paso = guardadoDeUnPaso(proyecto, { estado: 'en_seguimiento' }, hoy);
  return {
    pedido: { ...paso.pedido, proximos: [pendienteNuevo(id, valores, proyecto.estado)] },
    previos: { ...paso.previos, proximos: [] },
  };
}

export type SalidaDelContacto =
  | { que: 'vuelve'; etapa: EstadoDeConsulta }
  | { que: 'otra_fecha'; siguiente: ValoresDelSeguimiento }
  | { que: 'no_va' };

export interface ValoresDelRegistro {
  dia: string;
  respuesta: string;
  salida: SalidaDelContacto;
}

function registrado(
  pendiente: ProximoContacto,
  dia: string,
  respuesta: string,
  resultado: 'reactivado' | 'otra_fecha',
): ProximoParaGuardar {
  return {
    id: pendiente.id,
    fecha: pendiente.fecha,
    nota: pendiente.nota,
    etapa_previa: pendiente.etapa_previa,
    hecho_el: dia,
    resultado,
    respuesta: respuesta.trim(),
  };
}

export function guardadoDelRegistro(
  proyecto: Proyecto,
  pendiente: ProximoContacto,
  valores: ValoresDelRegistro,
  hoy: string,
  idDelSiguiente: string,
): GuardadoDeProyecto {
  const previos = {
    proyecto,
    pagos: [],
    gastos: [],
    opciones: [],
    necesidades: [],
    proximos: [pendiente],
  };
  const { salida } = valores;

  if (salida.que === 'vuelve') {
    const paso = guardadoDeUnPaso(proyecto, { estado: salida.etapa }, hoy, valores.dia);
    return {
      pedido: {
        ...paso.pedido,
        proximos: [registrado(pendiente, valores.dia, valores.respuesta, 'reactivado')],
      },
      previos,
    };
  }

  if (salida.que === 'otra_fecha') {
    return {
      pedido: {
        id: proyecto.id,
        version: proyecto.version,
        datos: { ...datosActualesDelProyecto(proyecto), ultimo_contacto: valores.dia },
        pagos: [],
        gastos: [],
        proximos: [
          registrado(pendiente, valores.dia, valores.respuesta, 'otra_fecha'),
          pendienteNuevo(idDelSiguiente, salida.siguiente, pendiente.etapa_previa),
        ],
      },
      previos,
    };
  }

  return {
    pedido: {
      id: proyecto.id,
      version: proyecto.version,
      datos: datosActualesDelProyecto(proyecto),
      pagos: [],
      gastos: [],
      proximos: [
        {
          id: pendiente.id,
          fecha: pendiente.fecha,
          nota: pendiente.nota,
          etapa_previa: pendiente.etapa_previa,
          hecho_el: null,
          resultado: null,
          respuesta: valores.respuesta.trim(),
        },
      ],
    },
    previos,
  };
}

import { mensajes } from '@/shared/idioma';
import { fechaLarga, formatearLaPlata } from '@/shared/lib';
import type { NombreDeIcono, TonoDelPaso } from '@/shared/ui';

import { fechaConSuFranja, type TonoDeEntrega } from './entrega';
import type { ResumenDeProyecto } from './resumen';

export interface SituacionDeLaObra {
  proximoPaso: string;
  detalle: string;
  icono: NombreDeIcono;
  tono: TonoDelPaso;
}

const TONO_DE_LA_ENTREGA: Readonly<Record<TonoDeEntrega, TonoDelPaso>> = {
  ok: 'normal',
  atencion: 'atencion',
  vencida: 'alerta',
};

export function situacionDeLaObra(
  resumen: ResumenDeProyecto,
  hoy: string,
): SituacionDeLaObra | undefined {
  const { proyecto, urgencia, saldo, entrega } = resumen;
  const textos = mensajes().proyecto.obra;

  if (proyecto.estado === 'en_curso') {
    if (entrega.comprometida && entrega.fecha !== null && urgencia !== undefined) {
      return {
        proximoPaso: textos.faltaEntregarlo,
        detalle: textos.entregaComprometida(
          fechaConSuFranja(entrega.fecha, entrega.franja, hoy),
          urgencia.texto,
        ),
        icono: urgencia.tono === 'ok' ? 'truck' : urgencia.icono,
        tono: TONO_DE_LA_ENTREGA[urgencia.tono],
      };
    }
    if (entrega.listo !== null) {
      return {
        proximoPaso: textos.faltaAcordarLaEntrega,
        detalle: textos.listoDesde(fechaLarga(entrega.listo, hoy)),
        icono: 'calendar-days',
        tono: 'normal',
      };
    }
    if (proyecto.entrega_estimada === null || urgencia === undefined) {
      return {
        proximoPaso: textos.faltaEntregarlo,
        detalle: textos.sinEntregaEstimada,
        icono: 'calendar',
        tono: 'normal',
      };
    }
    return {
      proximoPaso: textos.faltaEntregarlo,
      detalle: textos.entregaEstimada(urgencia.texto),
      icono: urgencia.icono,
      tono: TONO_DE_LA_ENTREGA[urgencia.tono],
    };
  }

  if (proyecto.estado === 'entregado') {
    return {
      proximoPaso:
        saldo !== null && saldo.importe > 0
          ? textos.faltaCobrar(formatearLaPlata(saldo))
          : textos.faltaCobrarloYRepartir,
      detalle:
        proyecto.fecha_entrega === null
          ? textos.entregadoSinFecha
          : textos.entregadoEl(fechaLarga(proyecto.fecha_entrega, hoy)),
      icono: 'calendar-check',
      tono: 'normal',
    };
  }

  return undefined;
}

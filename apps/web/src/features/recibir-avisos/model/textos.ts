import {
  ANTICIPACIONES,
  type Anticipacion,
  type AvisoDeLaAgenda,
  type CategoriaDeAgenda,
  type Idioma,
} from '@maun/domain';

import type { ResultadoDeLaPrueba } from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import {
  diasHasta,
  etiquetaActual,
  fechaLarga,
  hoyLocal,
  idiomaActual,
  type TonoDelAviso,
} from '@/shared/lib';

export interface DatosDelAviso {
  etiqueta: string;
  detalle: string;
  categoria: CategoriaDeAgenda;
  anticipaciones: readonly Anticipacion[];
}

function datosDelAviso(
  aviso: AvisoDeLaAgenda,
  categoria: CategoriaDeAgenda,
  anticipaciones: readonly Anticipacion[],
): DatosDelAviso {
  return {
    get etiqueta() {
      return mensajes().recibirAvisos.queAvisa[aviso].etiqueta;
    },
    get detalle() {
      return mensajes().recibirAvisos.queAvisa[aviso].detalle;
    },
    categoria,
    anticipaciones,
  };
}

export const QUE_AVISA: Readonly<Record<AvisoDeLaAgenda, DatosDelAviso>> = {
  entregas: datosDelAviso('entregas', 'entrega', [0, 1, 2, 3]),
  visitas: datosDelAviso('visitas', 'visita', [0, 1, 2, 3]),
  presupuestos: datosDelAviso('presupuestos', 'presupuesto', [0, 1, 2, 3]),
  seguimientos: datosDelAviso('seguimientos', 'seguimiento', [0, 1]),
  vencimientos: datosDelAviso('vencimientos', 'vencimiento', [0, 1, 2, 3]),
  anotaciones: datosDelAviso('anotaciones', 'taller', [0, 1]),
};

export function anticipacionEnPalabras(anticipacion: Anticipacion): string {
  const textos = mensajes().recibirAvisos;
  if (anticipacion === 0) return textos.laMananaDelDia;
  if (anticipacion === 1) return textos.elDiaAnterior;
  return textos.diasAntes({ dias: anticipacion });
}

export function anticipacionesDe(
  aviso: AvisoDeLaAgenda,
  actual: Anticipacion,
): readonly Anticipacion[] {
  const posibles = QUE_AVISA[aviso].anticipaciones;
  return ANTICIPACIONES.filter(
    (anticipacion) => posibles.includes(anticipacion) || anticipacion === actual,
  );
}

export const HORA_INICIAL = '07:30';

export const HORAS_SUGERIDAS = ['06:30', '07:30', '13:00', '20:00'] as const;

export function esHora(valor: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
}

const OPCIONES_DE_LA_HORA: Readonly<Record<Idioma, Intl.DateTimeFormatOptions>> = {
  es: { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
  en: { hour: 'numeric', minute: '2-digit', hourCycle: 'h12' },
  'pt-BR': { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
};

function formatoDeLaHora(zona?: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(etiquetaActual(), {
    ...OPCIONES_DE_LA_HORA[idiomaActual()],
    ...(zona === undefined ? {} : { timeZone: zona }),
  });
}

export function horaEnPantalla(hora: string): string {
  if (!esHora(hora)) return hora;
  const [horas = 0, minutos = 0] = hora.split(':').map(Number);
  return formatoDeLaHora('UTC').format(new Date(Date.UTC(2000, 0, 1, horas, minutos)));
}

export function cuandoSalio(ultimoEnvio: string | null, ahora: Date = new Date()): string {
  const textos = mensajes().recibirAvisos;
  const momento = ultimoEnvio === null ? null : new Date(ultimoEnvio);
  if (momento === null || Number.isNaN(momento.getTime())) return textos.todaviaNoSalioNinguno;
  const dia = hoyLocal(momento);
  const hoy = hoyLocal(ahora);
  const hora = formatoDeLaHora().format(momento);
  const atras = diasHasta(hoy, dia);
  if (atras === 0) return textos.salioHoy({ hora });
  if (atras === 1) return textos.salioAyer({ hora });
  return textos.salioElDia({ fecha: fechaLarga(dia, hoy), hora });
}

export function otrosDispositivos(dispositivos: number): string {
  const otros = dispositivos - 1;
  if (otros <= 0) return '';
  return ` ${mensajes().recibirAvisos.tambienLlegan({ otros })}`;
}

export function avisoDeLaPrueba(resultado: ResultadoDeLaPrueba): {
  tono: TonoDelAviso;
  texto: string;
} {
  const textos = mensajes().recibirAvisos;
  if (!resultado.configurado) {
    return { tono: 'error', texto: textos.elServidorTodaviaNoPuede };
  }
  if (resultado.mandados > 0) {
    return { tono: 'hecho', texto: textos.teMandamosUnaPrueba };
  }
  if (resultado.podados > 0) {
    return { tono: 'error', texto: textos.loSacamosDeLaLista };
  }
  return { tono: 'error', texto: textos.elServicioNoRespondio };
}

export function pasosEnElIphone(): readonly string[] {
  const pasos = mensajes().recibirAvisos.pasosEnElIphone;
  return [pasos.compartir, pasos.agregarAInicio, pasos.abrirDesdeElIcono];
}

export function pasosParaDesbloquear(comoApp: boolean): readonly string[] {
  const textos = mensajes().recibirAvisos;
  return comoApp
    ? [
        textos.pasosEnLaApp.abrirLosAjustes,
        textos.pasosEnLaApp.buscarNuma,
        textos.pasosEnLaApp.permitir,
      ]
    : [
        textos.pasosEnElNavegador.tocarElIcono,
        textos.pasosEnElNavegador.buscarNotificaciones,
        textos.pasosEnElNavegador.volver,
      ];
}

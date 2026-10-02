import {
  ESTADOS_DE_CONSULTA,
  faseDe,
  puedeCambiarEstado,
  vencimientoDelPresupuesto,
  vencioElPresupuesto,
  type EstadoProyecto,
} from '@maun/domain';

import { filasDe, visitaHecha, type Replica } from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import { diasHasta, fechaLarga, hoyLocal, relativa } from '@/shared/lib';

import type { Proyecto } from './catalogos';
import type { ResumenDeProyecto } from './resumen';
import { presupuestoArmado, TAREAS_DEL_PRESUPUESTO, tareasHechas } from './tareas';
import { vigenciaDelPresupuesto } from './vigencia';

export type EtapaDeConsulta = (typeof ESTADOS_DE_CONSULTA)[number];

export const DIAS_PARA_ENFRIARSE = 7;

export type SugerenciaDelContacto =
  | 'agendar-la-visita'
  | 'poner-fecha-a-la-visita'
  | 'ir-a-relevar'
  | 'cargar-lo-relevado'
  | 'mandar-el-estimativo'
  | 'presupuestar'
  | 'mandar-el-presupuesto'
  | 'pasar-a-presupuestar'
  | 'llamar';

export interface SituacionDelContacto {
  sugerencia: SugerenciaDelContacto;
  proximoPaso: string;
  espera: string;
  dias: number;
  fria: boolean;
  vencido: boolean;
  agendada: boolean;
}

export interface ContactoEnLista {
  resumen: ResumenDeProyecto;
  situacion: SituacionDelContacto;
  ultimoContacto: string;
  ultimaActividad: string;
}

export function esEtapaDeConsulta(estado: EstadoProyecto): estado is EtapaDeConsulta {
  return faseDe(estado) === 'consultas';
}

export function diaDeLaMarca(marca: string): string {
  return hoyLocal(new Date(marca));
}

export function diaDelUltimoContacto(proyecto: Proyecto, ultimaActividad: string): string {
  return proyecto.ultimo_contacto ?? diaDeLaMarca(ultimaActividad);
}

export function ultimoContactoAlGuardar(
  actual: Proyecto | undefined,
  estado: EstadoProyecto,
  hoy: string,
  dia: string = hoy,
): string | null {
  if (actual === undefined || actual.estado !== estado) return dia < hoy ? dia : hoy;
  return actual.ultimo_contacto;
}

export function vencimientoPropuesto(
  actual: Proyecto | undefined,
  estado: EstadoProyecto,
  visita: string | null,
  hoy: string,
): string | null {
  const vigente = actual?.vencimiento_presupuesto ?? null;
  if (estado !== 'a_presupuestar' || actual?.estado === 'a_presupuestar') return vigente;
  const vieneDelEstimativo = actual?.estado === 'presupuesto_estimativo';
  if (vigente !== null && !vieneDelEstimativo) return vigente;
  const relevado = visita !== null && visita !== '' && visita <= hoy;
  return vencimientoDelPresupuesto(relevado && !vieneDelEstimativo ? visita : hoy);
}

export function yaSeRelevo(proyecto: Proyecto, hoy: string): boolean {
  return (
    proyecto.fecha_visita !== null &&
    proyecto.fecha_visita <= hoy &&
    (visitaHecha(proyecto) ||
      proyecto.estado === 'presupuesto_estimativo' ||
      proyecto.estado === 'a_presupuestar' ||
      proyecto.estado === 'presupuesto_enviado')
  );
}

export function ultimasActividades(replica: Replica): Map<string, string> {
  const ultimas = new Map<string, string>();
  const anotar = (id: string, marca: string) => {
    const previa = ultimas.get(id);
    if (previa === undefined || marca > previa) ultimas.set(id, marca);
  };

  for (const proyecto of filasDe(replica, 'proyectos')) anotar(proyecto.id, proyecto.updated_at);
  for (const pago of filasDe(replica, 'pagos')) anotar(pago.proyecto_id, pago.updated_at);
  for (const gasto of filasDe(replica, 'gastos')) anotar(gasto.proyecto_id, gasto.updated_at);
  return ultimas;
}

export function situacionDelContacto(
  proyecto: Proyecto,
  ultimaActividad: string,
  hoy: string,
  cobrado: number,
): SituacionDelContacto {
  const textos = mensajes().proyecto.consultas;
  const dia = diaDelUltimoContacto(proyecto, ultimaActividad);
  const dias = Math.max(0, -diasHasta(dia, hoy));
  const cuando = relativa(dias === 0 ? hoy : dia, hoy);
  const conEspera = (
    sugerencia: SugerenciaDelContacto,
    proximoPaso: string,
    espera: string,
  ): SituacionDelContacto => ({
    sugerencia,
    proximoPaso,
    espera,
    dias,
    fria: dias >= DIAS_PARA_ENFRIARSE,
    vencido: false,
    agendada: false,
  });

  const visita = proyecto.fecha_visita;

  const hastaLaVisita = (): SituacionDelContacto | undefined => {
    if (visita === null) return undefined;
    const faltan = diasHasta(visita, hoy);
    if (faltan > 0) {
      return {
        sugerencia: 'ir-a-relevar',
        proximoPaso: textos.irARelevarEl(fechaLarga(visita, hoy)),
        espera: textos.visitaDentroDe(relativa(visita, hoy)),
        dias,
        fria: false,
        vencido: false,
        agendada: true,
      };
    }
    if (faltan === 0) {
      return conEspera('ir-a-relevar', textos.irARelevarHoy, textos.laVisitaEsHoy);
    }
    return undefined;
  };

  switch (proyecto.estado) {
    case 'presupuesto_estimativo': {
      const espera =
        dias === 0 ? textos.estimativoEnviadoHoy : textos.estimativoSinRespuesta(cuando);
      if (visita === null) {
        return conEspera('agendar-la-visita', textos.siAvanzaFaltaAgendar, espera);
      }
      return (
        hastaLaVisita() ??
        conEspera(
          'pasar-a-presupuestar',
          cobrado > 0 ? textos.yaPagoLaVisita : textos.faltaQueApruebeElEstimativo,
          espera,
        )
      );
    }
    case 'relevamiento': {
      if (visita === null) {
        return conEspera(
          'poner-fecha-a-la-visita',
          textos.faltaPonerleFecha,
          textos.relevamientoSinFecha(cuando),
        );
      }
      return (
        hastaLaVisita() ??
        conEspera(
          'cargar-lo-relevado',
          textos.faltaPasarLoRelevado,
          textos.laVisitaFue(relativa(visita, hoy)),
        )
      );
    }
    case 'a_presupuestar': {
      const espera = textos.aPresupuestarDesde(cuando);
      const hechas = tareasHechas(proyecto);
      if (presupuestoArmado(proyecto)) {
        return conEspera('mandar-el-presupuesto', textos.yaEstaArmado, espera);
      }
      if (hechas > 0) {
        return conEspera(
          'presupuestar',
          textos.faltaPresupuestarConTareas(hechas, TAREAS_DEL_PRESUPUESTO.length),
          espera,
        );
      }
      if (cobrado > 0) return conEspera('presupuestar', textos.faltaPresupuestar, espera);
      return conEspera('mandar-el-estimativo', textos.faltaElEstimativo, espera);
    }
    case 'presupuesto_enviado': {
      const valeHasta = vigenciaDelPresupuesto(proyecto);
      if (valeHasta !== null && vencioElPresupuesto(valeHasta, hoy)) {
        return {
          ...conEspera(
            'llamar',
            textos.vencioElPresupuesto,
            textos.valiaHasta(fechaLarga(valeHasta, hoy)),
          ),
          vencido: true,
        };
      }
      return conEspera(
        'llamar',
        textos.faltaLlamar,
        dias === 0 ? textos.presupuestoEnviadoHoy : textos.presupuestoSinRespuesta(cuando),
      );
    }
    default:
      return conEspera(
        'agendar-la-visita',
        textos.faltaAgendarLaVisita,
        textos.contactoSinVisita(cuando),
      );
  }
}

function compararContactos(uno: ContactoEnLista, otro: ContactoEnLista): number {
  if (uno.situacion.agendada !== otro.situacion.agendada) return uno.situacion.agendada ? 1 : -1;

  if (uno.situacion.agendada) {
    const visitaUno = uno.resumen.proyecto.fecha_visita ?? '';
    const visitaOtro = otro.resumen.proyecto.fecha_visita ?? '';
    if (visitaUno !== visitaOtro) return visitaUno < visitaOtro ? -1 : 1;
  } else if (uno.ultimoContacto !== otro.ultimoContacto) {
    return uno.ultimoContacto < otro.ultimoContacto ? -1 : 1;
  } else if (uno.ultimaActividad !== otro.ultimaActividad) {
    return uno.ultimaActividad < otro.ultimaActividad ? -1 : 1;
  }

  return uno.resumen.proyecto.id < otro.resumen.proyecto.id ? -1 : 1;
}

export function contactosEnOrden(
  resumenes: readonly ResumenDeProyecto[],
  replica: Replica,
  hoy: string,
): ContactoEnLista[] {
  const ultimas = ultimasActividades(replica);
  return resumenes
    .filter((resumen) => resumen.fase === 'consultas')
    .map((resumen) => {
      const ultimaActividad = ultimas.get(resumen.proyecto.id) ?? resumen.proyecto.updated_at;
      return {
        resumen,
        ultimoContacto: diaDelUltimoContacto(resumen.proyecto, ultimaActividad),
        ultimaActividad,
        situacion: situacionDelContacto(resumen.proyecto, ultimaActividad, hoy, resumen.cobrado),
      };
    })
    .sort(compararContactos);
}

export function etapaAlGuardarElContacto(
  actual: Proyecto | undefined,
  visita: string,
  hoy: string,
): EstadoProyecto {
  const fecha = visita.trim();
  if (actual !== undefined && actual.estado === 'presupuesto_estimativo') {
    const agendaLaVisita = actual.fecha_visita === null && fecha !== '' && fecha >= hoy;
    return agendaLaVisita ? 'relevamiento' : actual.estado;
  }
  if (actual !== undefined && actual.estado !== 'contacto') return actual.estado;
  if (fecha === '') return 'contacto';
  return fecha >= hoy ? 'relevamiento' : 'a_presupuestar';
}

export type CaminoDelPaso =
  'agendar' | 'relevar' | 'presupuesto' | 'pasar-a-presupuestar' | 'guardar' | 'pasaje' | 'armar';

export type PresupuestoDelContacto = 'sin-borrador' | 'borrador' | 'mandado';

export interface PasoDelContacto {
  hacia: EstadoProyecto;
  etiqueta: string;
  camino: CaminoDelPaso;
}

function pasosDeLaSugerencia(
  etapa: EtapaDeConsulta,
  sugerencia: SugerenciaDelContacto,
): PasoDelContacto[] {
  const textos = mensajes().proyecto.consultas.pasos;
  const aprobar: PasoDelContacto = {
    hacia: 'en_curso',
    etiqueta: textos.yaLoAprobo,
    camino: 'pasaje',
  };
  const relevar: PasoDelContacto = {
    hacia: 'a_presupuestar',
    etiqueta: textos.yaFuiARelevar,
    camino: 'relevar',
  };
  const presupuesto: PasoDelContacto = {
    hacia: 'presupuesto_enviado',
    etiqueta: textos.mandeElPresupuesto,
    camino: 'presupuesto',
  };

  switch (sugerencia) {
    case 'agendar-la-visita': {
      const agendar: PasoDelContacto = {
        hacia: 'relevamiento',
        etiqueta: textos.agendarLaVisita,
        camino: 'agendar',
      };
      return etapa === 'contacto'
        ? [
            agendar,
            {
              hacia: 'presupuesto_estimativo',
              etiqueta: textos.mandeUnEstimativo,
              camino: 'guardar',
            } satisfies PasoDelContacto,
            aprobar,
          ]
        : [agendar, aprobar];
    }
    case 'poner-fecha-a-la-visita':
    case 'ir-a-relevar':
    case 'cargar-lo-relevado':
      return [relevar, aprobar];
    case 'mandar-el-estimativo':
      return [
        {
          hacia: 'presupuesto_estimativo',
          etiqueta: textos.mandeElEstimativo,
          camino: 'guardar',
        } satisfies PasoDelContacto,
        presupuesto,
        aprobar,
      ];
    case 'presupuestar':
    case 'mandar-el-presupuesto':
      return [presupuesto, aprobar];
    case 'pasar-a-presupuestar':
      return [
        {
          hacia: 'a_presupuestar',
          etiqueta: textos.pasarAPresupuestar,
          camino: 'pasar-a-presupuestar',
        } satisfies PasoDelContacto,
        aprobar,
      ];
    case 'llamar':
      return [{ ...aprobar, etiqueta: textos.loAproboPasarAProyectos }];
  }
}

export function pasosDelContacto(
  etapa: EtapaDeConsulta,
  situacion: SituacionDelContacto,
  presupuesto: PresupuestoDelContacto = 'mandado',
): PasoDelContacto[] {
  const pasos = pasosDeLaSugerencia(etapa, situacion.sugerencia).filter((paso) =>
    puedeCambiarEstado(etapa, paso.hacia),
  );
  if (etapa !== 'a_presupuestar' || presupuesto === 'mandado') return pasos;
  const textos = mensajes().proyecto.consultas.pasos;
  const armar: PasoDelContacto = {
    hacia: 'presupuesto_enviado',
    etiqueta: presupuesto === 'borrador' ? textos.seguirArmandolo : textos.armarElPresupuesto,
    camino: 'armar',
  };
  return [armar, ...pasos];
}

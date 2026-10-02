import {
  activarAvisosEnElServidor,
  apagarAvisosEnElServidor,
  esFalloDeRed,
  mensajeDeSincronizacion,
  type EstadoDeLosAvisos,
} from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import {
  datosDeLaSuscripcion,
  suscribirElDispositivo,
  suscripcionDelDispositivo,
  type DatosDeLaSuscripcion,
} from '@/shared/lib';

export type DesenlaceDeLaActivacion =
  | { tipo: 'activos'; estado: EstadoDeLosAvisos; endpoint: string }
  | { tipo: 'denegado' }
  | { tipo: 'no-se-pudo'; mensaje: string };

export type DesenlaceDelApagado = { tipo: 'apagados' } | { tipo: 'no-se-pudo'; mensaje: string };

interface SuscripcionDelNavegador {
  endpoint: string;
  toJSON: () => PushSubscriptionJSON;
}

interface SuscripcionQueSeCancela {
  unsubscribe: () => Promise<boolean>;
}

export interface PasosDeLaActivacion {
  suscribir: (clavePublica: string) => Promise<SuscripcionDelNavegador>;
  registrar: (suscripcion: DatosDeLaSuscripcion, zona: string) => Promise<EstadoDeLosAvisos>;
}

export interface PasosDelApagado {
  darDeBaja: (endpoint: string) => Promise<boolean>;
  suscripcionLocal: () => Promise<SuscripcionQueSeCancela | null>;
}

const PASOS_DE_LA_ACTIVACION: PasosDeLaActivacion = {
  suscribir: suscribirElDispositivo,
  registrar: activarAvisosEnElServidor,
};

const PASOS_DEL_APAGADO: PasosDelApagado = {
  darDeBaja: apagarAvisosEnElServidor,
  suscripcionLocal: suscripcionDelDispositivo,
};

export async function terminarDeActivar(
  permiso: Promise<NotificationPermission>,
  clavePublica: string,
  zona: string,
  pasos: PasosDeLaActivacion = PASOS_DE_LA_ACTIVACION,
): Promise<DesenlaceDeLaActivacion> {
  let respuesta: NotificationPermission;
  try {
    respuesta = await permiso;
  } catch {
    return { tipo: 'no-se-pudo', mensaje: mensajes().recibirAvisos.elNavegadorNoDejoPedir };
  }
  if (respuesta === 'denied') return { tipo: 'denegado' };
  if (respuesta !== 'granted') {
    return { tipo: 'no-se-pudo', mensaje: mensajes().recibirAvisos.noElegisteNada };
  }

  let suscripcion: DatosDeLaSuscripcion;
  try {
    suscripcion = datosDeLaSuscripcion(await pasos.suscribir(clavePublica));
  } catch {
    return { tipo: 'no-se-pudo', mensaje: mensajes().recibirAvisos.elNavegadorNoPudoAnotarse };
  }

  try {
    const estado = await pasos.registrar(suscripcion, zona);
    return { tipo: 'activos', estado, endpoint: suscripcion.endpoint };
  } catch (error) {
    return {
      tipo: 'no-se-pudo',
      mensaje: esFalloDeRed(error)
        ? mensajes().recibirAvisos.sinSenalParaActivar
        : mensajeDeSincronizacion(error),
    };
  }
}

export async function olvidarLaSuscripcionLocal(
  pasos: PasosDelApagado = PASOS_DEL_APAGADO,
): Promise<void> {
  await pasos
    .suscripcionLocal()
    .then((local) => local?.unsubscribe())
    .catch(() => false);
}

export async function apagarEnEsteDispositivo(
  endpoint: string,
  pasos: PasosDelApagado = PASOS_DEL_APAGADO,
): Promise<DesenlaceDelApagado> {
  try {
    await pasos.darDeBaja(endpoint);
  } catch (error) {
    return {
      tipo: 'no-se-pudo',
      mensaje: esFalloDeRed(error)
        ? mensajes().recibirAvisos.sinSenalParaApagar
        : mensajeDeSincronizacion(error),
    };
  }
  await olvidarLaSuscripcionLocal(pasos);
  return { tipo: 'apagados' };
}

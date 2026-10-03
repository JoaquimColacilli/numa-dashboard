import { onlineManager } from '@tanstack/react-query';

import { codigoDeAcceso, esFalloDeRed, mensajeDeAcceso, registrarHuella } from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import { activarBloqueo, conUnaSolaCeremonia, pedirHuella } from '@/shared/lib';

const YA_REGISTRADA = new Set([
  'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED',
  'webauthn_credential_exists',
]);

export type ResultadoDeActivar =
  { tipo: 'activada' } | { tipo: 'no-se-pudo'; mensaje: string } | { tipo: 'interrumpida' };

export async function activarHuella(
  usuarioId: string,
  signal?: AbortSignal,
): Promise<ResultadoDeActivar> {
  if (!onlineManager.isOnline()) {
    return { tipo: 'no-se-pudo', mensaje: mensajes().activarHuella.sinSenalParaActivar };
  }

  const registro = await conUnaSolaCeremonia(
    (senal) => registrarHuella(senal),
    signal === undefined ? {} : { signal },
  );

  switch (registro.tipo) {
    case 'terminada':
      activarBloqueo(usuarioId, null);
      return { tipo: 'activada' };
    case 'cancelada-por-la-app':
      return { tipo: 'interrumpida' };
    case 'sin-respuesta':
      return { tipo: 'no-se-pudo', mensaje: mensajes().activarHuella.elRegistroNoRespondio };
    case 'fallida':
      break;
  }

  const fallo = registro.error;
  if (!YA_REGISTRADA.has(codigoDeAcceso(fallo))) {
    return {
      tipo: 'no-se-pudo',
      mensaje: esFalloDeRed(fallo)
        ? mensajes().activarHuella.sinSenalParaActivar
        : mensajeDeAcceso(fallo),
    };
  }
  const confirmada = await pedirHuella(null, signal);
  if (confirmada.tipo === 'interrumpida') return { tipo: 'interrumpida' };
  if (confirmada.tipo !== 'confirmada') {
    return { tipo: 'no-se-pudo', mensaje: mensajes().activarHuella.noSeConfirmo };
  }
  activarBloqueo(usuarioId, confirmada.credencial);
  return { tipo: 'activada' };
}

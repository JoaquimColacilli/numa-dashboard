import { useQueryClient } from '@tanstack/react-query';

import { atenderLaRespuesta, type RespuestaDelCliente } from '@/entities/presupuesto';
import { metaDeAvisos } from '@/shared/lib';

export function useAtenderLaRespuesta(): (respuesta: RespuestaDelCliente) => void {
  const cliente = useQueryClient();
  return (respuesta) => {
    atenderLaRespuesta(
      cliente,
      respuesta.fila,
      metaDeAvisos('respuestaAtendida', { silencioso: true }),
    );
  };
}

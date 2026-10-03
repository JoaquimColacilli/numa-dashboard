import type { Idioma } from '@maun/domain';
import { useEffect, useState } from 'react';

import {
  cargarMensajesDelCliente,
  MENSAJES_DEL_CLIENTE_EN_CASTELLANO,
  mensajesDelClienteListos,
  type MensajesDelCliente,
} from '@/shared/idioma-del-cliente';

import type { TextosDelWhatsapp } from './mensajes';

interface Cargados {
  idioma: Idioma;
  m: MensajesDelCliente;
}

export function useWhatsappDeLaEncuesta(idioma: Idioma): TextosDelWhatsapp {
  const [cargados, setCargados] = useState<Cargados | null>(null);
  const listos =
    mensajesDelClienteListos(idioma) ?? (cargados?.idioma === idioma ? cargados.m : undefined);

  useEffect(() => {
    if (listos !== undefined) return;
    let vigente = true;
    cargarMensajesDelCliente(idioma).then(
      (m) => {
        if (vigente) setCargados({ idioma, m });
      },
      () => undefined,
    );
    return () => {
      vigente = false;
    };
  }, [idioma, listos]);

  return (listos ?? MENSAJES_DEL_CLIENTE_EN_CASTELLANO).whatsappDeLaEncuesta;
}

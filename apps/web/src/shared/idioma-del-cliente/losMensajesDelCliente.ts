import { IDIOMA_BASE, type Idioma } from '@maun/domain';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import type { MensajesDelCliente } from './es';
import {
  cargarMensajesDelCliente,
  idiomaQueSeEscribe,
  mensajesDelClienteListos,
  suscribirseALosMensajesDelCliente,
} from './mensajes';

export interface LosMensajesDelCliente {
  idioma: Idioma;
  m: MensajesDelCliente;
}

export function useLosMensajesDelCliente(idioma: Idioma): LosMensajesDelCliente | undefined {
  const [sinCargar, setSinCargar] = useState<Idioma | null>(null);
  const pedido = sinCargar === idioma ? IDIOMA_BASE : idioma;
  const leer = () => mensajesDelClienteListos(pedido);
  const m = useSyncExternalStore(suscribirseALosMensajesDelCliente, leer, leer);

  useEffect(() => {
    if (m !== undefined) return;
    let vigente = true;
    cargarMensajesDelCliente(pedido).catch(() => {
      if (vigente) setSinCargar(pedido);
    });
    return () => {
      vigente = false;
    };
  }, [pedido, m]);

  const escrito = idiomaQueSeEscribe(pedido);
  return useMemo(() => (m === undefined ? undefined : { idioma: escrito, m }), [escrito, m]);
}

export function useMensajesDelClienteEn(idioma: Idioma): MensajesDelCliente | undefined {
  return useLosMensajesDelCliente(idioma)?.m;
}

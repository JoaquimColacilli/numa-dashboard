import { ETIQUETAS_DE_IDIOMA, IDIOMA_BASE, type Idioma } from '@maun/domain';
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';

import { ContextoDelCliente } from './contexto';
import { formatosDelCliente } from './formatos';
import {
  cargarMensajesDelCliente,
  idiomaQueSeEscribe,
  mensajesDelClienteListos,
  suscribirseALosMensajesDelCliente,
} from './mensajes';

export interface ConElIdiomaDelClienteProps {
  idioma: Idioma;
  children: ReactNode;
  mientrasCarga?: ReactNode;
}

export function ConElIdiomaDelCliente({
  idioma,
  children,
  mientrasCarga = null,
}: ConElIdiomaDelClienteProps) {
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
  const valor = useMemo(
    () => (m === undefined ? null : { idioma: escrito, m, f: formatosDelCliente(escrito) }),
    [escrito, m],
  );

  if (valor === null) return mientrasCarga;
  return (
    <ContextoDelCliente.Provider value={valor}>
      <div lang={ETIQUETAS_DE_IDIOMA[escrito]} className="contents">
        {children}
      </div>
    </ContextoDelCliente.Provider>
  );
}

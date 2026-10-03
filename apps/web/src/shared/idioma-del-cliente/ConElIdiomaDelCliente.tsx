import { ETIQUETAS_DE_IDIOMA, type Idioma } from '@maun/domain';
import { useMemo, type ReactNode } from 'react';

import { ContextoDelCliente } from './contexto';
import { formatosDelCliente } from './formatos';
import { useLosMensajesDelCliente } from './losMensajesDelCliente';

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
  const listos = useLosMensajesDelCliente(idioma);
  const valor = useMemo(
    () =>
      listos === undefined
        ? null
        : { idioma: listos.idioma, m: listos.m, f: formatosDelCliente(listos.idioma) },
    [listos],
  );

  if (valor === null) return mientrasCarga;
  return (
    <ContextoDelCliente.Provider value={valor}>
      <div lang={ETIQUETAS_DE_IDIOMA[valor.idioma]} className="contents">
        {children}
      </div>
    </ContextoDelCliente.Provider>
  );
}

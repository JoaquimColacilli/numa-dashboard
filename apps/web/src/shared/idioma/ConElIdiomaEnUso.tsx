import { Fragment, type ReactNode } from 'react';

import { useEstadoDeLosMensajes } from './mensajes';

export function ConElIdiomaEnUso({ children }: { children: ReactNode }) {
  const { idioma, seudo } = useEstadoDeLosMensajes();
  return <Fragment key={`${idioma}:${String(seudo)}`}>{children}</Fragment>;
}

import { createElement, type ReactNode } from 'react';

import type { Centinelas } from '../centinelas';

function Enlace({ children }: { children: ReactNode }) {
  return createElement('a', { 'data-centinela': '' }, children);
}

export const centinelas: Centinelas = {
  'paginaAcceso.noTenesCuenta': {
    llamar: (m) => m.paginaAcceso.noTenesCuenta({ Enlace }),
    tieneQueDecir: ['data-centinela'],
  },
};

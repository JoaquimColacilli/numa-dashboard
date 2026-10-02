import { createElement, type ReactNode } from 'react';

import type { Centinelas } from '../centinelas';

function Enlace({ children }: { children: ReactNode }) {
  return createElement('a', { 'data-centinela': '' }, children);
}

export const centinelas: Centinelas = {
  'paginaRecuperar.teAcordaste': {
    llamar: (m) => m.paginaRecuperar.teAcordaste({ Enlace }),
    tieneQueDecir: ['data-centinela'],
  },
};

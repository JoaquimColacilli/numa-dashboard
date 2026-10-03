import { createElement, type ReactNode } from 'react';

import type { Centinelas } from '../centinelas';

function Enlace({ children }: { children: ReactNode }) {
  return createElement('a', { 'data-centinela': '' }, children);
}

export const centinelas: Centinelas = {
  'paginaCrearCuenta.yaTenesCuenta': {
    llamar: (m) => m.paginaCrearCuenta.yaTenesCuenta({ Enlace }),
    tieneQueDecir: ['data-centinela'],
  },
};

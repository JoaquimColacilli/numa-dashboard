import { createElement, type ReactNode } from 'react';

import type { Centinelas } from '../centinelas';

function Fuerte({ children }: { children: ReactNode }) {
  return createElement('strong', { 'data-centinela': '' }, children);
}

export const centinelas: Centinelas = {
  'paginaNuevaContrasena.esPara': {
    llamar: (m) => m.paginaNuevaContrasena.esPara({ email: '«MAIL»', Fuerte }),
    tieneQueDecir: ['«MAIL»', 'data-centinela'],
  },
};

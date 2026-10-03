import { createElement, type ReactNode } from 'react';

import type { Centinelas } from '../centinelas';

function Junto({ children }: { children: ReactNode }) {
  return createElement('b', { 'data-centinela': '' }, children);
}

export const centinelas: Centinelas = {
  'paginaAjustes.ultimaSincronizacion': {
    llamar: (m) => m.paginaAjustes.ultimaSincronizacion({ cuando: '«CUÁNDO»' }),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'paginaAjustes.verElSujeto': {
    llamar: (m) => m.paginaAjustes.verElSujeto({ sujeto: '«SUJETO»' }),
    tieneQueDecir: ['«SUJETO»'],
  },
  'paginaAjustes.espacioUsado': {
    llamar: (m) => m.paginaAjustes.espacioUsado({ usado: '«USADO»', total: '«TOTAL»', Junto }),
    tieneQueDecir: ['«USADO»', '«TOTAL»', 'data-centinela'],
  },
};

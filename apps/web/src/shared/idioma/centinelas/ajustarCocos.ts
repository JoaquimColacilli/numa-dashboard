import { createElement } from 'react';

import type { Envoltorio } from '@/shared/lib';

import type { Centinelas } from '../centinelas';

const NEGRITA: Envoltorio = ({ children }) => createElement('b', null, children);

export const centinelas: Centinelas = {
  'ajustarCocos.anotado': {
    llamar: (m) => m.ajustarCocos.anotado('«AJUSTE»', '«SALDO»'),
    tieneQueDecir: ['«AJUSTE»', '«SALDO»'],
  },
  'ajustarCocos.explicacion': {
    llamar: (m) => m.ajustarCocos.explicacion(NEGRITA),
    tieneQueDecir: ['<b>'],
  },
  'ajustarCocos.vaAAnotar': {
    llamar: (m) => m.ajustarCocos.vaAAnotar(NEGRITA, '«AJUSTE»', '«CONCEPTO»'),
    tieneQueDecir: ['<b>«AJUSTE»</b>', '«CONCEPTO»'],
  },
};

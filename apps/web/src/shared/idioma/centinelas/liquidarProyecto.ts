import { createElement } from 'react';

import type { Envoltorio } from '@/shared/lib';

import type { Centinelas } from '../centinelas';

const NEGRITA: Envoltorio = ({ children }) => createElement('b', null, children);

export const centinelas: Centinelas = {
  'liquidarProyecto.pantalla.cobrado.titulo': {
    llamar: (m) => m.liquidarProyecto.pantalla.cobrado.titulo('«TRABAJO»'),
    tieneQueDecir: ['«TRABAJO»'],
  },
  'liquidarProyecto.pantalla.cobrado.verboConMonto': {
    llamar: (m) => m.liquidarProyecto.pantalla.cobrado.verboConMonto('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'liquidarProyecto.pantalla.cobrado.ayudaDelDia': {
    llamar: (m) => m.liquidarProyecto.pantalla.cobrado.ayudaDelDia('«MES»', '«AÑO»'),
    tieneQueDecir: ['«MES»', '«AÑO»'],
  },
  'liquidarProyecto.pantalla.perdido.titulo': {
    llamar: (m) => m.liquidarProyecto.pantalla.perdido.titulo('«TRABAJO»'),
    tieneQueDecir: ['«TRABAJO»'],
  },
  'liquidarProyecto.pantalla.perdido.verboConMonto': {
    llamar: (m) => m.liquidarProyecto.pantalla.perdido.verboConMonto('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'liquidarProyecto.pantalla.perdido.ayudaDelDia': {
    llamar: (m) => m.liquidarProyecto.pantalla.perdido.ayudaDelDia('«MES»', '«AÑO»'),
    tieneQueDecir: ['«MES»', '«AÑO»'],
  },
  'liquidarProyecto.pantalla.registrarElPagoFinalDe': {
    llamar: (m) => m.liquidarProyecto.pantalla.registrarElPagoFinalDe('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'liquidarProyecto.pantalla.montoATesoro': {
    llamar: (m) => m.liquidarProyecto.pantalla.montoATesoro('«MONTO»', '«TESORO»'),
    tieneQueDecir: ['«MONTO»', '«TESORO»'],
  },
  'liquidarProyecto.pantalla.vanACadaTesoro': {
    llamar: (m) => m.liquidarProyecto.pantalla.vanACadaTesoro('«LISTA»', 3),
    tieneQueDecir: ['«LISTA»'],
  },
  'liquidarProyecto.pantalla.seReparteElIngreso': {
    llamar: (m) => m.liquidarProyecto.pantalla.seReparteElIngreso('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'liquidarProyecto.pantalla.sena.retenida': {
    llamar: (m) => m.liquidarProyecto.pantalla.sena.retenida('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'liquidarProyecto.pantalla.sena.diezmo': {
    llamar: (m) => m.liquidarProyecto.pantalla.sena.diezmo('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'liquidarProyecto.pantalla.sena.otrasObligaciones': {
    llamar: (m) => m.liquidarProyecto.pantalla.sena.otrasObligaciones('«LISTA»'),
    tieneQueDecir: ['«LISTA»'],
  },
  'liquidarProyecto.pantalla.sena.loQueSobraVaA': {
    llamar: (m) => m.liquidarProyecto.pantalla.sena.loQueSobraVaA('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'liquidarProyecto.pantalla.sena.gastosComoPerdida': {
    llamar: (m) => m.liquidarProyecto.pantalla.sena.gastosComoPerdida('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'liquidarProyecto.reversion.elMesDe': {
    llamar: (m) => m.liquidarProyecto.reversion.elMesDe('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'liquidarProyecto.reversion.vuelveAEntregado': {
    llamar: (m) => m.liquidarProyecto.reversion.vuelveAEntregado(NEGRITA, '«FECHA»'),
    tieneQueDecir: ['<b>', '«FECHA»'],
  },
  'liquidarProyecto.reversion.vuelveAEntregadoSinFecha': {
    llamar: (m) => m.liquidarProyecto.reversion.vuelveAEntregadoSinFecha(NEGRITA),
    tieneQueDecir: ['<b>'],
  },
  'liquidarProyecto.reversion.noGuardaLaFecha': {
    llamar: (m) => m.liquidarProyecto.reversion.noGuardaLaFecha(NEGRITA),
    tieneQueDecir: ['<b>'],
  },
};

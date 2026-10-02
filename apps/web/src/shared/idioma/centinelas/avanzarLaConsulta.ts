import { createElement } from 'react';

import type { Envoltorio } from '@/shared/lib';

import type { Centinelas } from '../centinelas';

const ENLACE: Envoltorio = ({ children }) => createElement('a', null, children);

export const centinelas: Centinelas = {
  'avanzarLaConsulta.tareas.hechasDe': {
    llamar: (m) => m.avanzarLaConsulta.tareas.hechasDe('«HECHAS»', '«TOTAL»'),
    tieneQueDecir: ['«HECHAS»', '«TOTAL»'],
  },
  'avanzarLaConsulta.contacto.variosPagos': {
    llamar: (m) => m.avanzarLaConsulta.contacto.variosPagos(3),
    tieneQueDecir: ['3'],
  },
  'avanzarLaConsulta.contacto.errores.largo': {
    llamar: (m) => m.avanzarLaConsulta.contacto.errores.largo(200),
    tieneQueDecir: ['200'],
  },
  'avanzarLaConsulta.pasaje.titulo': {
    llamar: (m) => m.avanzarLaConsulta.pasaje.titulo('«TRABAJO»'),
    tieneQueDecir: ['«TRABAJO»'],
  },
  'avanzarLaConsulta.pasaje.corregirLaOpcion': {
    llamar: (m) => m.avanzarLaConsulta.pasaje.corregirLaOpcion(ENLACE),
    tieneQueDecir: ['<a>'],
  },
  'avanzarLaConsulta.pasaje.porcentajeDelPresupuesto': {
    llamar: (m) => m.avanzarLaConsulta.pasaje.porcentajeDelPresupuesto('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'avanzarLaConsulta.pasaje.ayudaDeLaEntrega': {
    llamar: (m) => m.avanzarLaConsulta.pasaje.ayudaDeLaEntrega(21),
    tieneQueDecir: ['21'],
  },
  'avanzarLaConsulta.pasaje.ayudaDeLaEntregaDelPresupuesto': {
    llamar: (m) => m.avanzarLaConsulta.pasaje.ayudaDeLaEntregaDelPresupuesto(30),
    tieneQueDecir: ['30'],
  },
  'avanzarLaConsulta.pasaje.acordado.noEstaEn': {
    llamar: (m) => m.avanzarLaConsulta.pasaje.acordado.noEstaEn('«NÚMERO»'),
    tieneQueDecir: ['«NÚMERO»'],
  },
  'avanzarLaConsulta.pasaje.acordado.elQueLeMandasteDice': {
    llamar: (m) => m.avanzarLaConsulta.pasaje.acordado.elQueLeMandasteDice('«IMPORTE»'),
    tieneQueDecir: ['«IMPORTE»'],
  },
  'avanzarLaConsulta.pasaje.acordado.dice': {
    llamar: (m) => m.avanzarLaConsulta.pasaje.acordado.dice('«NÚMERO»', '«IMPORTE»'),
    tieneQueDecir: ['«NÚMERO»', '«IMPORTE»'],
  },
  'avanzarLaConsulta.pasaje.acordado.siLoApruebasAsi': {
    llamar: (m) => m.avanzarLaConsulta.pasaje.acordado.siLoApruebasAsi('«ACORDADO»'),
    tieneQueDecir: ['«ACORDADO»'],
  },
};

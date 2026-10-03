import { createElement } from 'react';

import type { Envoltorio } from '@/shared/lib';

import type { Centinelas } from '../centinelas';

const ENLACE: Envoltorio = ({ children }) => createElement('a', null, children);

export const centinelas: Centinelas = {
  'compartirConElCliente.comoTePaga.valeParaElDia': {
    llamar: (m) => m.compartirConElCliente.comoTePaga.valeParaElDia('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'compartirConElCliente.comoTePaga.sinCuentaEnDolares': {
    llamar: (m) => m.compartirConElCliente.comoTePaga.sinCuentaEnDolares(ENLACE),
    tieneQueDecir: ['<a>'],
  },
  'compartirConElCliente.activo.creadoEl': {
    llamar: (m) => m.compartirConElCliente.activo.creadoEl('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'compartirConElCliente.activo.noVeNingunArchivo': {
    llamar: (m) => m.compartirConElCliente.activo.noVeNingunArchivo(7),
    tieneQueDecir: ['0', '7'],
  },
  'compartirConElCliente.activo.archivosQueVe': {
    llamar: (m) => m.compartirConElCliente.activo.archivosQueVe(3, 7),
    tieneQueDecir: ['3', '7'],
  },
  'compartirConElCliente.activo.visitas': {
    llamar: (m) => m.compartirConElCliente.activo.visitas('«VECES»'),
    tieneQueDecir: ['«VECES»'],
  },
  'compartirConElCliente.activo.visitasYLaUltima': {
    llamar: (m) => m.compartirConElCliente.activo.visitasYLaUltima('«VECES»', '«FECHA»'),
    tieneQueDecir: ['«VECES»', '«FECHA»'],
  },
  'compartirConElCliente.archivos.cuantosVe': {
    llamar: (m) => m.compartirConElCliente.archivos.cuantosVe(3, 7),
    tieneQueDecir: ['3', '7'],
  },
  'compartirConElCliente.archivos.noVeNinguno': {
    llamar: (m) => m.compartirConElCliente.archivos.noVeNinguno(7),
    tieneQueDecir: ['7'],
  },
  'compartirConElCliente.archivos.compartir': {
    llamar: (m) => m.compartirConElCliente.archivos.compartir('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'compartirConElCliente.qr.codigoDelEnlace': {
    llamar: (m) => m.compartirConElCliente.qr.codigoDelEnlace('«TRABAJO»'),
    tieneQueDecir: ['«TRABAJO»'],
  },
};

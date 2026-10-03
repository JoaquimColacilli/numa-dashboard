import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'coordinarLaEntrega.laAcepto': {
    llamar: (m) => m.coordinarLaEntrega.laAcepto('«CLIENTE»'),
    tieneQueDecir: ['«CLIENTE»'],
  },
  'coordinarLaEntrega.lePropusisteEl': {
    llamar: (m) => m.coordinarLaEntrega.lePropusisteEl('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'coordinarLaEntrega.verComoLoVe': {
    llamar: (m) => m.coordinarLaEntrega.verComoLoVe('«CLIENTE»'),
    tieneQueDecir: ['«CLIENTE»'],
  },
  'coordinarLaEntrega.respuesta.teDejoUnaNota': {
    llamar: (m) => m.coordinarLaEntrega.respuesta.teDejoUnaNota('«CLIENTE»'),
    tieneQueDecir: ['«CLIENTE»'],
  },
  'coordinarLaEntrega.respuesta.tePasoSusDias': {
    llamar: (m) => m.coordinarLaEntrega.respuesta.tePasoSusDias('«CLIENTE»'),
    tieneQueDecir: ['«CLIENTE»'],
  },
  'coordinarLaEntrega.respuesta.confirmarEl': {
    llamar: (m) => m.coordinarLaEntrega.respuesta.confirmarEl('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'coordinarLaEntrega.hojas.propuesta.tuCliente': {
    llamar: (m) => m.coordinarLaEntrega.hojas.propuesta.tuCliente('«TRABAJO»'),
    tieneQueDecir: ['«TRABAJO»'],
  },
};

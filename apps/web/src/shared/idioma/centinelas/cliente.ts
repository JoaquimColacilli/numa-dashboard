import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'cliente.formulario.largoMaximo': {
    llamar: (m) => m.cliente.formulario.largoMaximo(37),
    tieneQueDecir: ['37'],
  },
  'cliente.formulario.cuitIncompleto': {
    llamar: (m) => m.cliente.formulario.cuitIncompleto(11),
    tieneQueDecir: ['11'],
  },
  'cliente.contacto.llamarA': {
    llamar: (m) => m.cliente.contacto.llamarA('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'cliente.contacto.escribirleA': {
    llamar: (m) => m.cliente.contacto.escribirleA('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'cliente.contacto.llamarASinTelefono': {
    llamar: (m) => m.cliente.contacto.llamarASinTelefono('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'cliente.contacto.escribirleASinTelefono': {
    llamar: (m) => m.cliente.contacto.escribirleASinTelefono('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'cliente.combobox.cambiar': {
    llamar: (m) => m.cliente.combobox.cambiar('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'cliente.combobox.crear': {
    llamar: (m) => m.cliente.combobox.crear('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
};

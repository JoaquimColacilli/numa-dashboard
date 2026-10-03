import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'pdf.titulo.numero': {
    llamar: (m) => m.pdf.titulo.numero('«NÚMERO»'),
    tieneQueDecir: ['«NÚMERO»'],
  },
  'pdf.titulo.conRevision': {
    llamar: (m) => m.pdf.titulo.conRevision('«NÚMERO»', 7),
    tieneQueDecir: ['«NÚMERO»', '7'],
  },
  'pdf.titulo.enBorrador': {
    llamar: (m) => m.pdf.titulo.enBorrador('«TÍTULO»'),
    tieneQueDecir: ['«TÍTULO»'],
  },
  'pdf.archivo.numero': {
    llamar: (m) => m.pdf.archivo.numero('«NÚMERO»'),
    tieneQueDecir: ['«NÚMERO»'],
  },
  'pdf.archivo.conRevision': {
    llamar: (m) => m.pdf.archivo.conRevision('«NÚMERO»', 7),
    tieneQueDecir: ['«NÚMERO»', '7'],
  },
  'pdf.pagina': {
    llamar: (m) => m.pdf.pagina('«TÍTULO»', 3, 9),
    tieneQueDecir: ['«TÍTULO»', '3', '9'],
  },
  'pdf.rotulo.dias': {
    llamar: (m) => m.pdf.rotulo.dias(15),
    tieneQueDecir: ['15'],
  },
  'pdf.valores.elegiConLoAbonado': {
    llamar: (m) => m.pdf.valores.elegiConLoAbonado('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'pdf.plazo': {
    llamar: (m) => m.pdf.plazo(30),
    tieneQueDecir: ['30'],
  },
  'pdf.validez.dias': {
    llamar: (m) => m.pdf.validez.dias(15),
    tieneQueDecir: ['15'],
  },
  'pdf.validez.hasta': {
    llamar: (m) => m.pdf.validez.hasta('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'pdf.aceptado.sinFechaConOpcion': {
    llamar: (m) => m.pdf.aceptado.sinFechaConOpcion('«LETRA»'),
    tieneQueDecir: ['«LETRA»'],
  },
  'pdf.aceptado.el': {
    llamar: (m) => m.pdf.aceptado.el('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'pdf.aceptado.elConOpcion': {
    llamar: (m) => m.pdf.aceptado.elConOpcion('«FECHA»', '«LETRA»'),
    tieneQueDecir: ['«FECHA»', '«LETRA»'],
  },
};

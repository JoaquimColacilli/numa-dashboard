import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'presupuesto.vencido.cuando': {
    llamar: (m) => m.presupuesto.vencido.cuando('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'presupuesto.queCambio': {
    llamar: (m) => m.presupuesto.queCambio(7),
    tieneQueDecir: ['7'],
  },
  'presupuesto.valores.opcion': {
    llamar: (m) => m.presupuesto.valores.opcion('«LETRA»'),
    tieneQueDecir: ['«LETRA»'],
  },
  'presupuesto.valores.sena': {
    llamar: (m) => m.presupuesto.valores.sena('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'presupuesto.valores.acordado': {
    llamar: (m) => m.presupuesto.valores.acordado('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'presupuesto.valores.referencia': {
    llamar: (m) => m.presupuesto.valores.referencia('«PESOS»', '«DOLAR»', '«FECHA»'),
    tieneQueDecir: ['«PESOS»', '«DOLAR»', '«FECHA»'],
  },
  'presupuesto.valores.referenciaConLaSena': {
    llamar: (m) =>
      m.presupuesto.valores.referenciaConLaSena('«PESOS»', '«SENA»', '«DOLAR»', '«FECHA»'),
    tieneQueDecir: ['«PESOS»', '«SENA»', '«DOLAR»', '«FECHA»'],
  },
  'presupuesto.diasHabiles': {
    llamar: (m) => m.presupuesto.diasHabiles(30),
    tieneQueDecir: ['30'],
  },
  'presupuesto.validez.vencio': {
    llamar: (m) => m.presupuesto.validez.vencio('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'presupuesto.validez.hasta': {
    llamar: (m) => m.presupuesto.validez.hasta('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'presupuesto.meses': {
    llamar: (m) => m.presupuesto.meses(18),
    tieneQueDecir: ['18'],
  },
  'presupuesto.mensajeAlTaller.numero': {
    llamar: (m) => m.presupuesto.mensajeAlTaller.numero('«NÚMERO»'),
    tieneQueDecir: ['«NÚMERO»'],
  },
  'presupuesto.mensajeAlTaller.conRevision': {
    llamar: (m) => m.presupuesto.mensajeAlTaller.conRevision('«NÚMERO»', 7),
    tieneQueDecir: ['«NÚMERO»', '7'],
  },
  'presupuesto.aprobar.tituloDeLaOpcion': {
    llamar: (m) => m.presupuesto.aprobar.tituloDeLaOpcion('«LETRA»'),
    tieneQueDecir: ['«LETRA»'],
  },
  'presupuesto.aprobar.loLee': {
    llamar: (m) => m.presupuesto.aprobar.loLee('«TALLER»'),
    tieneQueDecir: ['«TALLER»'],
  },
  'presupuesto.aprobar.contador': {
    llamar: (m) => m.presupuesto.aprobar.contador(7, 300),
    tieneQueDecir: ['7', '300'],
  },
  'presupuesto.aprobar.aprobasteLaOpcion': {
    llamar: (m) => m.presupuesto.aprobar.aprobasteLaOpcion('«LETRA»', '«FECHA»'),
    tieneQueDecir: ['«LETRA»', '«FECHA»'],
  },
  'presupuesto.aprobar.loAprobaste': {
    llamar: (m) => m.presupuesto.aprobar.loAprobaste('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'presupuesto.aprobar.propusiste.manana': {
    llamar: (m) => m.presupuesto.aprobar.propusiste.manana('«DÍA»', '«TALLER»'),
    tieneQueDecir: ['«DÍA»', '«TALLER»'],
  },
  'presupuesto.aprobar.propusiste.tarde': {
    llamar: (m) => m.presupuesto.aprobar.propusiste.tarde('«DÍA»', '«TALLER»'),
    tieneQueDecir: ['«DÍA»', '«TALLER»'],
  },
  'presupuesto.aprobar.propusiste.me_da_igual': {
    llamar: (m) => m.presupuesto.aprobar.propusiste.me_da_igual('«DÍA»', '«TALLER»'),
    tieneQueDecir: ['«DÍA»', '«TALLER»'],
  },
  'presupuesto.aprobar.laSenaVaAntesDel': {
    llamar: (m) => m.presupuesto.aprobar.laSenaVaAntesDel('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'presupuesto.aprobar.teEquivocaste': {
    llamar: (m) => m.presupuesto.aprobar.teEquivocaste('«TALLER»'),
    tieneQueDecir: ['«TALLER»'],
  },
};

import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'vista.delDominio.proyeccion.vencio': {
    llamar: (m) => m.vista.delDominio.proyeccion.vencio('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'vista.delDominio.proyeccion.siLoAprobasAntesDel': {
    llamar: (m) => m.vista.delDominio.proyeccion.siLoAprobasAntesDel('«ANTES»', '«LISTO»'),
    tieneQueDecir: ['«ANTES»', '«LISTO»'],
  },
  'vista.delDominio.proyeccion.siDejasLaSenaAntesDel': {
    llamar: (m) => m.vista.delDominio.proyeccion.siDejasLaSenaAntesDel('«ANTES»', '«LISTO»'),
    tieneQueDecir: ['«ANTES»', '«LISTO»'],
  },
  'vista.delDominio.nota.fuimosAMedirEl': {
    llamar: (m) => m.vista.delDominio.nota.fuimosAMedirEl('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'vista.delDominio.nota.medidoEl': {
    llamar: (m) => m.vista.delDominio.nota.medidoEl('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'vista.delDominio.nota.quedamosEnIrEl': {
    llamar: (m) => m.vista.delDominio.nota.quedamosEnIrEl('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
};

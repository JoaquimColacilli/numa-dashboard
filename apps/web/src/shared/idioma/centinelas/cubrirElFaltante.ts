import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'cubrirElFaltante.paraCubrir': {
    llamar: (m) => m.cubrirElFaltante.paraCubrir('«TESORO»', '«MES»'),
    tieneQueDecir: ['«TESORO»', '«MES»'],
  },
  'cubrirElFaltante.vence': {
    llamar: (m) => m.cubrirElFaltante.vence('«RENGLÓN»', 23, '«FALTA»'),
    tieneQueDecir: ['«RENGLÓN»', '23', '«FALTA»'],
  },
  'cubrirElFaltante.faltanParaElSaldo': {
    llamar: (m) => m.cubrirElFaltante.faltanParaElSaldo('«FALTA»', '«TESORO»'),
    tieneQueDecir: ['«FALTA»', '«TESORO»'],
  },
  'cubrirElFaltante.faltanParaElMes': {
    llamar: (m) => m.cubrirElFaltante.faltanParaElMes('«FALTA»', '«TESORO»', '«MES»'),
    tieneQueDecir: ['«FALTA»', '«TESORO»', '«MES»'],
  },
  'cubrirElFaltante.bajadaDelSaldo': {
    llamar: (m) => m.cubrirElFaltante.bajadaDelSaldo('«FALTA»'),
    tieneQueDecir: ['«FALTA»'],
  },
  'cubrirElFaltante.bajadaDelMes': {
    llamar: (m) => m.cubrirElFaltante.bajadaDelMes('«FALTA»', '«MES»'),
    tieneQueDecir: ['«FALTA»', '«MES»'],
  },
  'cubrirElFaltante.eligeDelMes': {
    llamar: (m) => m.cubrirElFaltante.eligeDelMes('«MES»'),
    tieneQueDecir: ['«MES»'],
  },
  'cubrirElFaltante.tiene': {
    llamar: (m) => m.cubrirElFaltante.tiene('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
  'cubrirElFaltante.cuantoSaleDe': {
    llamar: (m) => m.cubrirElFaltante.cuantoSaleDe('«TESORO»'),
    tieneQueDecir: ['«TESORO»'],
  },
  'cubrirElFaltante.noAlcanza': {
    llamar: (m) => m.cubrirElFaltante.noAlcanza('«TESORO»', '«SALDO»'),
    tieneQueDecir: ['«TESORO»', '«SALDO»'],
  },
  'cubrirElFaltante.quedaEn': {
    llamar: (m) => m.cubrirElFaltante.quedaEn('«TESORO»', '«SALDO»'),
    tieneQueDecir: ['«TESORO»', '«SALDO»'],
  },
  'cubrirElFaltante.cubiertoDe': {
    llamar: (m) => m.cubrirElFaltante.cubiertoDe('«CUBIERTO»', '«FALTA»'),
    tieneQueDecir: ['«CUBIERTO»', '«FALTA»'],
  },
  'cubrirElFaltante.tePasas': {
    llamar: (m) => m.cubrirElFaltante.tePasas('«DE MÁS»', '«FALTA»'),
    tieneQueDecir: ['«DE MÁS»', '«FALTA»'],
  },
  'cubrirElFaltante.pasar': {
    llamar: (m) => m.cubrirElFaltante.pasar('«MONTO»', '«TESORO»'),
    tieneQueDecir: ['«MONTO»', '«TESORO»'],
  },
};

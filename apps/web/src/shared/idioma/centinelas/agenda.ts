import type { Centinelas } from '../centinelas';

const DERIVADAS = ['entrega', 'visita', 'presupuesto', 'seguimiento'] as const;

const DE_LAS_DERIVADAS: Centinelas = Object.fromEntries(
  DERIVADAS.flatMap((categoria) =>
    (['nombre', 'corto', 'abrirUno'] as const).map((funcion) => [
      `agenda.derivadas.${categoria}.${funcion}`,
      {
        llamar: (m) => m.agenda.derivadas[categoria][funcion]('«TÍTULO»'),
        tieneQueDecir: ['«TÍTULO»'],
      },
    ]),
  ),
);

const DIA = '«DÍA»';
const CUENTA = '«CUENTA»';

export const centinelas: Centinelas = {
  ...DE_LAS_DERIVADAS,
  'agenda.vencimiento.nombre': {
    llamar: (m) => m.agenda.vencimiento.nombre('«RENGLÓN»'),
    tieneQueDecir: ['«RENGLÓN»'],
  },
  'agenda.vencimiento.corto': {
    llamar: (m) => m.agenda.vencimiento.corto('«RENGLÓN»'),
    tieneQueDecir: ['«RENGLÓN»'],
  },
  'agenda.vencimiento.monto': {
    llamar: (m) => m.agenda.vencimiento.monto('«MONTO»', '«TESORO»'),
    tieneQueDecir: ['«MONTO»', '«TESORO»'],
  },
  'agenda.borrar': {
    llamar: (m) => m.agenda.borrar('«TEXTO»'),
    tieneQueDecir: ['«TEXTO»'],
  },
  'agenda.urgencia.vencio': {
    llamar: (m) => m.agenda.urgencia.vencio('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'agenda.urgencia.atrasada': {
    llamar: (m) => m.agenda.urgencia.atrasada('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'agenda.mesConAnio': {
    llamar: (m) => m.agenda.mesConAnio('«MES»', '«AÑO»'),
    tieneQueDecir: ['«MES»', '«AÑO»'],
  },
  'agenda.cuentas.citas': { llamar: (m) => m.agenda.cuentas.citas(7), tieneQueDecir: ['7'] },
  'agenda.cuentas.vencimientos': {
    llamar: (m) => m.agenda.cuentas.vencimientos(7),
    tieneQueDecir: ['7'],
  },
  'agenda.cuentas.anotaciones': {
    llamar: (m) => m.agenda.cuentas.anotaciones(7),
    tieneQueDecir: ['7'],
  },
  'agenda.cuentas.cosasAnotadas': {
    llamar: (m) => m.agenda.cuentas.cosasAnotadas(7),
    tieneQueDecir: ['7'],
  },
  'agenda.cuentas.hechas': { llamar: (m) => m.agenda.cuentas.hechas(7), tieneQueDecir: ['7'] },
  'agenda.cuentas.cosas': { llamar: (m) => m.agenda.cuentas.cosas(7), tieneQueDecir: ['7'] },
  'agenda.cuentas.cosasYHechas': {
    llamar: (m) => m.agenda.cuentas.cosasYHechas(7, 9),
    tieneQueDecir: ['7', '9'],
  },
  'agenda.dia.pendienteDel': {
    llamar: (m) => m.agenda.dia.pendienteDel(DIA),
    tieneQueDecir: [DIA],
  },
  'agenda.grilla.celda': {
    llamar: (m) => m.agenda.grilla.celda(DIA, CUENTA),
    tieneQueDecir: [DIA, CUENTA],
  },
  'agenda.grilla.celdaDeHoy': {
    llamar: (m) => m.agenda.grilla.celdaDeHoy(DIA, CUENTA),
    tieneQueDecir: [DIA, CUENTA],
  },
  'agenda.grilla.celdaMarcada': {
    llamar: (m) => m.agenda.grilla.celdaMarcada(DIA, CUENTA),
    tieneQueDecir: [DIA, CUENTA],
  },
  'agenda.grilla.celdaDeHoyMarcada': {
    llamar: (m) => m.agenda.grilla.celdaDeHoyMarcada(DIA, CUENTA),
    tieneQueDecir: [DIA, CUENTA],
  },
  'agenda.grilla.verTodas': {
    llamar: (m) => m.agenda.grilla.verTodas(7, DIA),
    tieneQueDecir: ['7', DIA],
  },
  'agenda.grilla.mas': { llamar: (m) => m.agenda.grilla.mas(7), tieneQueDecir: ['7'] },
  'agenda.tira.dia': {
    llamar: (m) => m.agenda.tira.dia(DIA, CUENTA),
    tieneQueDecir: [DIA, CUENTA],
  },
  'agenda.tira.diaMarcado': {
    llamar: (m) => m.agenda.tira.diaMarcado(DIA, CUENTA),
    tieneQueDecir: [DIA, CUENTA],
  },
  'agenda.arrastre.loDejaste': {
    llamar: (m) => m.agenda.arrastre.loDejaste(DIA),
    tieneQueDecir: [DIA],
  },
  'agenda.arrastre.moviste': {
    llamar: (m) => m.agenda.arrastre.moviste('«NOMBRE»', DIA),
    tieneQueDecir: ['«NOMBRE»', DIA],
  },
  'agenda.arrastre.agarrasteConTeclado': {
    llamar: (m) => m.agenda.arrastre.agarrasteConTeclado('«NOMBRE»', DIA),
    tieneQueDecir: ['«NOMBRE»', DIA],
  },
  'agenda.arrastre.agarraste': {
    llamar: (m) => m.agenda.arrastre.agarraste('«NOMBRE»', DIA),
    tieneQueDecir: ['«NOMBRE»', DIA],
  },
  'agenda.arrastre.sobre': {
    llamar: (m) => m.agenda.arrastre.sobre('«NOMBRE»', DIA),
    tieneQueDecir: ['«NOMBRE»', DIA],
  },
};

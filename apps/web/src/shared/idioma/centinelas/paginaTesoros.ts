import { createElement } from 'react';

import type { Envoltorio } from '@/shared/lib';

import type { Centinelas } from '../centinelas';

const TACHADO: Envoltorio = ({ children }) => createElement('s', null, children);

const TESORO = '«TESORO»';

export const centinelas: Centinelas = {
  'paginaTesoros.menu.alPrincipio': {
    llamar: (m) => m.paginaTesoros.menu.alPrincipio('«LUGAR»'),
    tieneQueDecir: ['«LUGAR»'],
  },
  'paginaTesoros.menu.despuesDe': {
    llamar: (m) => m.paginaTesoros.menu.despuesDe('«LUGAR»', TESORO),
    tieneQueDecir: ['«LUGAR»', TESORO],
  },
  'paginaTesoros.menu.sumarUnTesoro': {
    llamar: (m) => m.paginaTesoros.menu.sumarUnTesoro('«ENCABEZADO»'),
    tieneQueDecir: ['«ENCABEZADO»'],
  },
  'paginaTesoros.menu.tiene': {
    llamar: (m) => m.paginaTesoros.menu.tiene('«SALDO»'),
    tieneQueDecir: ['«SALDO»'],
  },
  'paginaTesoros.union.soltaAlReparto': {
    llamar: (m) => m.paginaTesoros.union.soltaAlReparto(TESORO),
    tieneQueDecir: [TESORO],
  },
  'paginaTesoros.union.soltaYPasaASer': {
    llamar: (m) => m.paginaTesoros.union.soltaYPasaASer(TESORO, 'obligacion', 37),
    tieneQueDecir: [TESORO, '37'],
  },
  'paginaTesoros.union.soltaYEntraComo': {
    llamar: (m) => m.paginaTesoros.union.soltaYEntraComo(TESORO, 'ahorro-fijo', 37),
    tieneQueDecir: [TESORO, '37'],
  },
  'paginaTesoros.union.yaEsElPrimero': {
    llamar: (m) => m.paginaTesoros.union.yaEsElPrimero(TESORO, 'compromiso'),
    tieneQueDecir: [TESORO],
  },
  'paginaTesoros.union.yaEsElUltimo': {
    llamar: (m) => m.paginaTesoros.union.yaEsElUltimo(TESORO, 'obligacion'),
    tieneQueDecir: [TESORO],
  },
  'paginaTesoros.union.pasaASer': {
    llamar: (m) => m.paginaTesoros.union.pasaASer(TESORO, 'ahorro-fijo', 37, 38),
    tieneQueDecir: [TESORO, '37', '38'],
  },
  'paginaTesoros.plano.eraEl': {
    llamar: (m) => m.paginaTesoros.plano.eraEl(37),
    tieneQueDecir: ['37'],
  },
  'paginaTesoros.plano.etiquetaDeLaObligacion': {
    llamar: (m) =>
      m.paginaTesoros.plano.etiquetaDeLaObligacion(
        37,
        38,
        TESORO,
        '«PORCENTAJE»',
        'cobrado',
        '«A PAGAR»',
      ),
    tieneQueDecir: ['37', '38', TESORO, '«PORCENTAJE»', '«A PAGAR»'],
  },
  'paginaTesoros.plano.etiquetaDelDiezmo': {
    llamar: (m) =>
      m.paginaTesoros.plano.etiquetaDelDiezmo(
        37,
        38,
        TESORO,
        '«PORCENTAJE»',
        'ingreso',
        '«A PAGAR»',
      ),
    tieneQueDecir: ['37', '38', TESORO, '«PORCENTAJE»', '«A PAGAR»'],
  },
  'paginaTesoros.plano.etiquetaDelPaso': {
    llamar: (m) => m.paginaTesoros.plano.etiquetaDelPaso('«ENCABEZADO»', '«CIFRA»', '«ESTADO»'),
    tieneQueDecir: ['«ENCABEZADO»', '«CIFRA»', '«ESTADO»'],
  },
  'paginaTesoros.plano.encabezadoDelPaso': {
    llamar: (m) => m.paginaTesoros.plano.encabezadoDelPaso('compromiso', 37, 38, TESORO),
    tieneQueDecir: ['37', '38', TESORO],
  },
  'paginaTesoros.plano.encabezadoDelSueldo': {
    llamar: (m) => m.paginaTesoros.plano.encabezadoDelSueldo('compromiso', 37, 38, TESORO),
    tieneQueDecir: ['37', '38', TESORO],
  },
  'paginaTesoros.plano.cifraPorTrabajo': {
    llamar: (m) => m.paginaTesoros.plano.cifraPorTrabajo('ahorro-fijo', '«TOPE»'),
    tieneQueDecir: ['«TOPE»'],
  },
  'paginaTesoros.plano.cifraDelSaldo': {
    llamar: (m) => m.paginaTesoros.plano.cifraDelSaldo('compromiso', '«TOPE»'),
    tieneQueDecir: ['«TOPE»'],
  },
  'paginaTesoros.plano.cifraDelMes': {
    llamar: (m) => m.paginaTesoros.plano.cifraDelMes('ahorro-fijo', '«TOPE»'),
    tieneQueDecir: ['«TOPE»'],
  },
  'paginaTesoros.plano.enElMesRecibio': {
    llamar: (m) => m.paginaTesoros.plano.enElMesRecibio('«RECIBIDO»'),
    tieneQueDecir: ['«RECIBIDO»'],
  },
  'paginaTesoros.plano.aPagarYFaltan': {
    llamar: (m) => m.paginaTesoros.plano.aPagarYFaltan('«LLEVA»', '«FALTA»'),
    tieneQueDecir: ['«LLEVA»', '«FALTA»'],
  },
  'paginaTesoros.plano.aPagarCompleto': {
    llamar: (m) => m.paginaTesoros.plano.aPagarCompleto('«LLEVA»'),
    tieneQueDecir: ['«LLEVA»'],
  },
  'paginaTesoros.plano.tieneYFaltan': {
    llamar: (m) => m.paginaTesoros.plano.tieneYFaltan('«LLEVA»', '«FALTA»'),
    tieneQueDecir: ['«LLEVA»', '«FALTA»'],
  },
  'paginaTesoros.plano.tieneCompleto': {
    llamar: (m) => m.paginaTesoros.plano.tieneCompleto('«LLEVA»'),
    tieneQueDecir: ['«LLEVA»'],
  },
  'paginaTesoros.plano.llevaYFaltan': {
    llamar: (m) => m.paginaTesoros.plano.llevaYFaltan('«LLEVA»', '«FALTA»'),
    tieneQueDecir: ['«LLEVA»', '«FALTA»'],
  },
  'paginaTesoros.plano.llevaCompleto': {
    llamar: (m) => m.paginaTesoros.plano.llevaCompleto('«LLEVA»'),
    tieneQueDecir: ['«LLEVA»'],
  },
  'paginaTesoros.plano.etiquetaDeLaParte': {
    llamar: (m) => m.paginaTesoros.plano.etiquetaDeLaParte(TESORO, '«PORCENTAJE»'),
    tieneQueDecir: [TESORO, '«PORCENTAJE»'],
  },
  'paginaTesoros.plano.etiquetaDeLaParteConMeta': {
    llamar: (m) =>
      m.paginaTesoros.plano.etiquetaDeLaParteConMeta(TESORO, '«PORCENTAJE»', '«SALDO»', '«META»'),
    tieneQueDecir: [TESORO, '«PORCENTAJE»', '«SALDO»', '«META»'],
  },
  'paginaTesoros.plano.etiquetaDeLaParteHastaLaMeta': {
    llamar: (m) =>
      m.paginaTesoros.plano.etiquetaDeLaParteHastaLaMeta(
        TESORO,
        '«PORCENTAJE»',
        '«SALDO»',
        '«META»',
      ),
    tieneQueDecir: [TESORO, '«PORCENTAJE»', '«SALDO»', '«META»'],
  },
  'paginaTesoros.plano.pruebaDeUnTrabajo': {
    llamar: (m) => m.paginaTesoros.plano.pruebaDeUnTrabajo('«DEJA»'),
    tieneQueDecir: ['«DEJA»'],
  },
  'paginaTesoros.plano.ingresoDelMes': {
    llamar: (m) => m.paginaTesoros.plano.ingresoDelMes('«MES»', '«INGRESO»', 37),
    tieneQueDecir: ['«MES»', '«INGRESO»', '37'],
  },
  'paginaTesoros.plano.trabajosEnCurso': {
    llamar: (m) => m.paginaTesoros.plano.trabajosEnCurso(37),
    tieneQueDecir: ['37'],
  },
  'paginaTesoros.plano.etiquetaDeLosInsumos': {
    llamar: (m) => m.paginaTesoros.plano.etiquetaDeLosInsumos('«TOTAL»', 37),
    tieneQueDecir: ['«TOTAL»', '37'],
  },
  'paginaTesoros.plano.parteDelReparto': {
    llamar: (m) => m.paginaTesoros.plano.parteDelReparto(TESORO, '«PORCENTAJE»'),
    tieneQueDecir: [TESORO, '«PORCENTAJE»'],
  },
  'paginaTesoros.plano.etiquetaDelReparto': {
    llamar: (m) => m.paginaTesoros.plano.etiquetaDelReparto(['«UNA»', '«OTRA»']),
    tieneQueDecir: ['«UNA»', '«OTRA»'],
  },
  'paginaTesoros.plano.etiquetaDelResto': {
    llamar: (m) => m.paginaTesoros.plano.etiquetaDelResto(TESORO, '«PORCENTAJE»'),
    tieneQueDecir: [TESORO, '«PORCENTAJE»'],
  },
  'paginaTesoros.plano.restoConPorcentaje': {
    llamar: (m) => m.paginaTesoros.plano.restoConPorcentaje('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'paginaTesoros.plano.etiquetaDelEstante': {
    llamar: (m) => m.paginaTesoros.plano.etiquetaDelEstante(TESORO, '«SALDO»'),
    tieneQueDecir: [TESORO, '«SALDO»'],
  },
  'paginaTesoros.fichas.antes': {
    llamar: (m) => m.paginaTesoros.fichas.antes(TACHADO, '«ANTES»'),
    tieneQueDecir: ['<s>«ANTES»</s>'],
  },
  'paginaTesoros.fichas.faltan': {
    llamar: (m) => m.paginaTesoros.fichas.faltan('«FALTA»'),
    tieneQueDecir: ['«FALTA»'],
  },
  'paginaTesoros.fichas.venceEl': {
    llamar: (m) => m.paginaTesoros.fichas.venceEl(23),
    tieneQueDecir: ['23'],
  },
  'paginaTesoros.fichas.suMeta': {
    llamar: (m) => m.paginaTesoros.fichas.suMeta(TESORO),
    tieneQueDecir: [TESORO],
  },
  'paginaTesoros.fichas.avanceDeLaMeta': {
    llamar: (m) => m.paginaTesoros.fichas.avanceDeLaMeta('«AVANCE»', '«META»'),
    tieneQueDecir: ['«AVANCE»', '«META»'],
  },
  'paginaTesoros.fichas.enElMes': {
    llamar: (m) => m.paginaTesoros.fichas.enElMes('«MES»'),
    tieneQueDecir: ['«MES»'],
  },
  'paginaTesoros.fichas.recibeEnCadaCobro': {
    llamar: (m) => m.paginaTesoros.fichas.recibeEnCadaCobro('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'paginaTesoros.fichas.aPagarMonto': {
    llamar: (m) => m.paginaTesoros.fichas.aPagarMonto('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'paginaTesoros.fichas.tieneMonto': {
    llamar: (m) => m.paginaTesoros.fichas.tieneMonto('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'paginaTesoros.fichas.llevaMonto': {
    llamar: (m) => m.paginaTesoros.fichas.llevaMonto('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'paginaTesoros.fichas.nivelDelSaldo': {
    llamar: (m) => m.paginaTesoros.fichas.nivelDelSaldo(TESORO),
    tieneQueDecir: [TESORO],
  },
  'paginaTesoros.fichas.nivelDelMes': {
    llamar: (m) => m.paginaTesoros.fichas.nivelDelMes(TESORO, '«MES»'),
    tieneQueDecir: [TESORO, '«MES»'],
  },
  'paginaTesoros.fichas.deTotal': {
    llamar: (m) => m.paginaTesoros.fichas.deTotal('«PARTE»', '«TOTAL»'),
    tieneQueDecir: ['«PARTE»', '«TOTAL»'],
  },
  'paginaTesoros.fichas.yMas': {
    llamar: (m) => m.paginaTesoros.fichas.yMas(37),
    tieneQueDecir: ['37'],
  },
  'paginaTesoros.planoCompleto.rotulo': {
    llamar: (m) => m.paginaTesoros.planoCompleto.rotulo(37, '«RIGE»'),
    tieneQueDecir: ['37', '«RIGE»'],
  },
  'paginaTesoros.planoVertical.lugarDe': {
    llamar: (m) => m.paginaTesoros.planoVertical.lugarDe(TESORO),
    tieneQueDecir: [TESORO],
  },
  'paginaTesoros.celular.loQueQuedaDeLaSena': {
    llamar: (m) => m.paginaTesoros.celular.loQueQuedaDeLaSena(37),
    tieneQueDecir: ['37'],
  },
};

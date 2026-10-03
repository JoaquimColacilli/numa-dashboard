import { createElement } from 'react';

import type { Envoltorio } from '@/shared/lib';

import type { Centinelas } from '../centinelas';

const NEGRITA: Envoltorio = ({ children }) => createElement('b', null, children);

const TESORO = '«TESORO»';
const EN_NEGRITA = `<b>${TESORO}</b>`;

export const centinelas: Centinelas = {
  'armarLaFila.problemasConNombre.tesoro-archivado': {
    llamar: (m) => m.armarLaFila.problemasConNombre['tesoro-archivado'](TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.problemasConNombre.tesoro-repetido': {
    llamar: (m) => m.armarLaFila.problemasConNombre['tesoro-repetido'](TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.problemasConNombre.modo-invalido': {
    llamar: (m) => m.armarLaFila.problemasConNombre['modo-invalido'](TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.problemasConNombre.meta-sin-monto': {
    llamar: (m) => m.armarLaFila.problemasConNombre['meta-sin-monto'](TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.problemasConNombre.superavit-invalido': {
    llamar: (m) => m.armarLaFila.problemasConNombre['superavit-invalido'](TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.problemasConNombre.superavit-en-la-fila': {
    llamar: (m) => m.armarLaFila.problemasConNombre['superavit-en-la-fila'](TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.cambios.entraALasObligaciones': {
    llamar: (m) =>
      m.armarLaFila.cambios.entraALasObligaciones(NEGRITA, TESORO, 37, '«PORCENTAJE»', 'cobrado'),
    tieneQueDecir: [EN_NEGRITA, '37', '«PORCENTAJE»'],
  },
  'armarLaFila.cambios.saleDeLasObligaciones': {
    llamar: (m) => m.armarLaFila.cambios.saleDeLasObligaciones(NEGRITA, TESORO),
    tieneQueDecir: [EN_NEGRITA],
  },
  'armarLaFila.cambios.cambiaDeLugar': {
    llamar: (m) => m.armarLaFila.cambios.cambiaDeLugar(NEGRITA, TESORO, 37, 38),
    tieneQueDecir: [EN_NEGRITA, '37', '38'],
  },
  'armarLaFila.cambios.cambiaElPorcentajeDeLaObligacion': {
    llamar: (m) =>
      m.armarLaFila.cambios.cambiaElPorcentajeDeLaObligacion(
        NEGRITA,
        TESORO,
        '«ANTES»',
        '«DESPUÉS»',
      ),
    tieneQueDecir: [EN_NEGRITA, '«ANTES»', '«DESPUÉS»'],
  },
  'armarLaFila.cambios.cambiaLaBase': {
    llamar: (m) => m.armarLaFila.cambios.cambiaLaBase(NEGRITA, TESORO, 'ingreso'),
    tieneQueDecir: [EN_NEGRITA],
  },
  'armarLaFila.cambios.entraALaFila': {
    llamar: (m) =>
      m.armarLaFila.cambios.entraALaFila(NEGRITA, TESORO, 'compromiso', 37, '«MONTO»', 'mes'),
    tieneQueDecir: [EN_NEGRITA, '37', '«MONTO»'],
  },
  'armarLaFila.cambios.entraALaFilaHastaLaMeta': {
    llamar: (m) =>
      m.armarLaFila.cambios.entraALaFilaHastaLaMeta(
        NEGRITA,
        TESORO,
        'ahorro-fijo',
        37,
        '«MONTO»',
        'saldo',
      ),
    tieneQueDecir: [EN_NEGRITA, '37', '«MONTO»'],
  },
  'armarLaFila.cambios.saleDeLaFila': {
    llamar: (m) => m.armarLaFila.cambios.saleDeLaFila(NEGRITA, TESORO),
    tieneQueDecir: [EN_NEGRITA],
  },
  'armarLaFila.cambios.cambiaLaClase': {
    llamar: (m) => m.armarLaFila.cambios.cambiaLaClase(NEGRITA, TESORO, 'ahorro-fijo'),
    tieneQueDecir: [EN_NEGRITA],
  },
  'armarLaFila.cambios.cambiaElTope': {
    llamar: (m) => m.armarLaFila.cambios.cambiaElTope(NEGRITA, TESORO, '«ANTES»', '«DESPUÉS»'),
    tieneQueDecir: [EN_NEGRITA, '«ANTES»', '«DESPUÉS»'],
  },
  'armarLaFila.cambios.cambiaElTopeConSuModo': {
    llamar: (m) =>
      m.armarLaFila.cambios.cambiaElTopeConSuModo(
        NEGRITA,
        TESORO,
        '«ANTES»',
        '«DESPUÉS»',
        'compromiso',
        'trabajo',
      ),
    tieneQueDecir: [EN_NEGRITA, '«ANTES»', '«DESPUÉS»'],
  },
  'armarLaFila.cambios.cambianLosRenglones': {
    llamar: (m) => m.armarLaFila.cambios.cambianLosRenglones(NEGRITA, TESORO),
    tieneQueDecir: [EN_NEGRITA],
  },
  'armarLaFila.cambios.cambianLosDias': {
    llamar: (m) => m.armarLaFila.cambios.cambianLosDias(NEGRITA, TESORO),
    tieneQueDecir: [EN_NEGRITA],
  },
  'armarLaFila.cambios.cambiaElModo': {
    llamar: (m) => m.armarLaFila.cambios.cambiaElModo(NEGRITA, TESORO, 'ahorro-fijo', 'mes'),
    tieneQueDecir: [EN_NEGRITA],
  },
  'armarLaFila.cambios.juntaHastaLaMeta': {
    llamar: (m) => m.armarLaFila.cambios.juntaHastaLaMeta(NEGRITA, TESORO),
    tieneQueDecir: [EN_NEGRITA],
  },
  'armarLaFila.cambios.juntaSinFin': {
    llamar: (m) => m.armarLaFila.cambios.juntaSinFin(NEGRITA, TESORO),
    tieneQueDecir: [EN_NEGRITA],
  },
  'armarLaFila.cambios.entraAlReparto': {
    llamar: (m) => m.armarLaFila.cambios.entraAlReparto(NEGRITA, TESORO, '«PORCENTAJE»'),
    tieneQueDecir: [EN_NEGRITA, '«PORCENTAJE»'],
  },
  'armarLaFila.cambios.entraAlRepartoHastaLaMeta': {
    llamar: (m) => m.armarLaFila.cambios.entraAlRepartoHastaLaMeta(NEGRITA, TESORO, '«PORCENTAJE»'),
    tieneQueDecir: [EN_NEGRITA, '«PORCENTAJE»'],
  },
  'armarLaFila.cambios.saleDelReparto': {
    llamar: (m) => m.armarLaFila.cambios.saleDelReparto(NEGRITA, TESORO),
    tieneQueDecir: [EN_NEGRITA],
  },
  'armarLaFila.cambios.cambiaElPorcentaje': {
    llamar: (m) =>
      m.armarLaFila.cambios.cambiaElPorcentaje(NEGRITA, TESORO, '«ANTES»', '«DESPUÉS»'),
    tieneQueDecir: [EN_NEGRITA, '«ANTES»', '«DESPUÉS»'],
  },
  'armarLaFila.cambios.cambiaElSuperavit': {
    llamar: (m) => m.armarLaFila.cambios.cambiaElSuperavit(NEGRITA, TESORO, '«ANTES»'),
    tieneQueDecir: [EN_NEGRITA, '«ANTES»'],
  },
  'armarLaFila.cuantosCambios': {
    llamar: (m) => m.armarLaFila.cuantosCambios(37),
    tieneQueDecir: ['37'],
  },
  'armarLaFila.cuantosCambiosYCuandoValen': {
    llamar: (m) => m.armarLaFila.cuantosCambiosYCuandoValen(37),
    tieneQueDecir: ['37'],
  },
  'armarLaFila.paraGuardar': {
    llamar: (m) => m.armarLaFila.paraGuardar('«PROBLEMA»'),
    tieneQueDecir: ['«PROBLEMA»'],
  },
  'armarLaFila.cuantasCosas': {
    llamar: (m) => m.armarLaFila.cuantasCosas(37),
    tieneQueDecir: ['37'],
  },
  'armarLaFila.prueba.leFaltan': {
    llamar: (m) => m.armarLaFila.prueba.leFaltan('«FALTA»'),
    tieneQueDecir: ['«FALTA»'],
  },
  'armarLaFila.ficha.lugarEnLaFila': {
    llamar: (m) => m.armarLaFila.ficha.lugarEnLaFila(37, 38),
    tieneQueDecir: ['37', '38'],
  },
  'armarLaFila.ficha.delPaso': {
    llamar: (m) => m.armarLaFila.ficha.delPaso('«TIPO»', '«LUGAR»'),
    tieneQueDecir: ['«TIPO»', '«LUGAR»'],
  },
  'armarLaFila.ficha.delSueldo': {
    llamar: (m) => m.armarLaFila.ficha.delSueldo('«TIPO»', '«LUGAR»'),
    tieneQueDecir: ['«TIPO»', '«LUGAR»'],
  },
  'armarLaFila.ficha.deLaObligacion': {
    llamar: (m) => m.armarLaFila.ficha.deLaObligacion('«LUGAR»'),
    tieneQueDecir: ['«LUGAR»'],
  },
  'armarLaFila.editar': {
    llamar: (m) => m.armarLaFila.editar(TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.guardar.revision': {
    llamar: (m) => m.armarLaFila.guardar.revision(37),
    tieneQueDecir: ['37'],
  },
  'armarLaFila.guardar.conUnCobroDe': {
    llamar: (m) => m.armarLaFila.guardar.conUnCobroDe('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'armarLaFila.guardar.comparacion': {
    llamar: (m) => m.armarLaFila.guardar.comparacion('«MES»'),
    tieneQueDecir: ['«MES»'],
  },
  'armarLaFila.guardar.quedaEnCero': {
    llamar: (m) => m.armarLaFila.guardar.quedaEnCero(NEGRITA, TESORO, '«CERO»'),
    tieneQueDecir: [EN_NEGRITA, '«CERO»'],
  },
  'armarLaFila.guardar.cuandoValen': {
    llamar: (m) => m.armarLaFila.guardar.cuandoValen('«MES»'),
    tieneQueDecir: ['«MES»'],
  },
  'armarLaFila.probador.sobran': {
    llamar: (m) => m.armarLaFila.probador.sobran(NEGRITA, '«MONTO»'),
    tieneQueDecir: ['<b>«MONTO»</b>'],
  },
  'armarLaFila.probador.sobranYMira': {
    llamar: (m) => m.armarLaFila.probador.sobranYMira(NEGRITA, '«MONTO»'),
    tieneQueDecir: ['<b>«MONTO»</b>'],
  },
  'armarLaFila.probador.conPorcentaje': {
    llamar: (m) => m.armarLaFila.probador.conPorcentaje(TESORO, '«PORCENTAJE»'),
    tieneQueDecir: [TESORO, '«PORCENTAJE»'],
  },
  'armarLaFila.probador.elResto': {
    llamar: (m) => m.armarLaFila.probador.elResto(TESORO, '«PORCENTAJE»'),
    tieneQueDecir: [TESORO, '«PORCENTAJE»'],
  },
  'armarLaFila.panel.numeroDeCuantos': {
    llamar: (m) => m.armarLaFila.panel.numeroDeCuantos(NEGRITA, 37, 38),
    tieneQueDecir: ['<b>37</b>', '38'],
  },
  'armarLaFila.panel.registrarElPagoDe': {
    llamar: (m) => m.armarLaFila.panel.registrarElPagoDe('«RENGLÓN»'),
    tieneQueDecir: ['«RENGLÓN»'],
  },
  'armarLaFila.panel.porcentajeDe': {
    llamar: (m) => m.armarLaFila.panel.porcentajeDe(TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.panel.sobreQueSeCalculaDe': {
    llamar: (m) => m.armarLaFila.panel.sobreQueSeCalculaDe(TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.panel.enElMes': {
    llamar: (m) => m.armarLaFila.panel.enElMes('«MES»'),
    tieneQueDecir: ['«MES»'],
  },
  'armarLaFila.panel.diaDePagoDe': {
    llamar: (m) => m.armarLaFila.panel.diaDePagoDe('«RENGLÓN»'),
    tieneQueDecir: ['«RENGLÓN»'],
  },
  'armarLaFila.panel.renglonDe': {
    llamar: (m) => m.armarLaFila.panel.renglonDe(37, TESORO),
    tieneQueDecir: ['37', TESORO],
  },
  'armarLaFila.panel.sacarElRenglon': {
    llamar: (m) => m.armarLaFila.panel.sacarElRenglon('«RENGLÓN»'),
    tieneQueDecir: ['«RENGLÓN»'],
  },
  'armarLaFila.panel.sacarElRenglonNumero': {
    llamar: (m) => m.armarLaFila.panel.sacarElRenglonNumero(37),
    tieneQueDecir: ['37'],
  },
  'armarLaFila.panel.montoDe': {
    llamar: (m) => m.armarLaFila.panel.montoDe(TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.panel.montoDelRenglon': {
    llamar: (m) => m.armarLaFila.panel.montoDelRenglon(37),
    tieneQueDecir: ['37'],
  },
  'armarLaFila.panel.venceElDia': {
    llamar: (m) => m.armarLaFila.panel.venceElDia(23),
    tieneQueDecir: ['23'],
  },
  'armarLaFila.panel.rigeDesde': {
    llamar: (m) => m.armarLaFila.panel.rigeDesde('«MES»', '«AÑO»'),
    tieneQueDecir: ['«MES»', '«AÑO»'],
  },
  'armarLaFila.panel.comoSeLlenaDe': {
    llamar: (m) => m.armarLaFila.panel.comoSeLlenaDe('compromiso', TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.panel.leFaltan': {
    llamar: (m) => m.armarLaFila.panel.leFaltan('«FALTA»'),
    tieneQueDecir: ['«FALTA»'],
  },
  'armarLaFila.panel.deTotal': {
    llamar: (m) => m.armarLaFila.panel.deTotal('«PARTE»', '«TOTAL»'),
    tieneQueDecir: ['«PARTE»', '«TOTAL»'],
  },
  'armarLaFila.panel.recibeEnCadaCobro': {
    llamar: (m) => m.armarLaFila.panel.recibeEnCadaCobro('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'armarLaFila.panel.nivelApartado': {
    llamar: (m) => m.armarLaFila.panel.nivelApartado(TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.panel.nivelDelMes': {
    llamar: (m) => m.armarLaFila.panel.nivelDelMes(TESORO, '«MES»'),
    tieneQueDecir: [TESORO, '«MES»'],
  },
  'armarLaFila.panel.faltan': {
    llamar: (m) => m.armarLaFila.panel.faltan('«FALTA»'),
    tieneQueDecir: ['«FALTA»'],
  },
  'armarLaFila.panel.queEsDe': {
    llamar: (m) => m.armarLaFila.panel.queEsDe(TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.panel.tipoDelSueldo': {
    llamar: (m) => m.armarLaFila.panel.tipoDelSueldo('«TIPO»'),
    tieneQueDecir: ['«TIPO»'],
  },
  'armarLaFila.panel.sacarDelReparto': {
    llamar: (m) => m.armarLaFila.panel.sacarDelReparto(TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.panel.hastaLaMetaDe': {
    llamar: (m) => m.armarLaFila.panel.hastaLaMetaDe(TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.panel.elResto': {
    llamar: (m) => m.armarLaFila.panel.elResto(TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.panel.repartoEnCien': {
    llamar: (m) => m.armarLaFila.panel.repartoEnCien(TESORO),
    tieneQueDecir: [TESORO],
  },
  'armarLaFila.panel.repartoConLibre': {
    llamar: (m) => m.armarLaFila.panel.repartoConLibre('«SUMA»', '«LIBRE»', TESORO),
    tieneQueDecir: ['«SUMA»', '«LIBRE»', TESORO],
  },
  'armarLaFila.panel.superavitRecibe': {
    llamar: (m) => m.armarLaFila.panel.superavitRecibe('«LIBRE»'),
    tieneQueDecir: ['«LIBRE»'],
  },
  'armarLaFila.panel.caeEn': {
    llamar: (m) => m.armarLaFila.panel.caeEn(NEGRITA, TESORO),
    tieneQueDecir: [EN_NEGRITA],
  },
  'armarLaFila.panel.deLaMeta': {
    llamar: (m) => m.armarLaFila.panel.deLaMeta('«PORCENTAJE»', '«META»'),
    tieneQueDecir: ['«PORCENTAJE»', '«META»'],
  },
  'armarLaFila.panel.enTrabajos': {
    llamar: (m) => m.armarLaFila.panel.enTrabajos(37),
    tieneQueDecir: ['37'],
  },
  'armarLaFila.panel.entroYGastado': {
    llamar: (m) => m.armarLaFila.panel.entroYGastado('«ENTRÓ»', '«GASTADO»'),
    tieneQueDecir: ['«ENTRÓ»', '«GASTADO»'],
  },
  'armarLaFila.panel.lugarDeLaObligacion': {
    llamar: (m) => m.armarLaFila.panel.lugarDeLaObligacion('«PORCENTAJE»', 'cobrado'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'armarLaFila.panel.lugarDelSueldo': {
    llamar: (m) => m.armarLaFila.panel.lugarDelSueldo('saldo'),
    tieneQueDecir: [],
  },
  'armarLaFila.panel.lugarConElResto': {
    llamar: (m) => m.armarLaFila.panel.lugarConElResto('ahorro-fijo', 'trabajo'),
    tieneQueDecir: [],
  },
  'armarLaFila.panel.lugarDeLaParte': {
    llamar: (m) => m.armarLaFila.panel.lugarDeLaParte('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'armarLaFila.panel.lugarDeLaParteHastaLaMeta': {
    llamar: (m) => m.armarLaFila.panel.lugarDeLaParteHastaLaMeta('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'armarLaFila.panel.deMas': {
    llamar: (m) => m.armarLaFila.panel.deMas('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'armarLaFila.panel.numeroEnLaFila': {
    llamar: (m) => m.armarLaFila.panel.numeroEnLaFila(37),
    tieneQueDecir: ['37'],
  },
  'armarLaFila.panel.ingresoEnCobros': {
    llamar: (m) => m.armarLaFila.panel.ingresoEnCobros(37),
    tieneQueDecir: ['37'],
  },
};

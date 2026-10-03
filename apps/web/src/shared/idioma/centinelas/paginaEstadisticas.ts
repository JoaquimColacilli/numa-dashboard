import { createElement } from 'react';

import type { Envoltorio } from '@/shared/lib';

import type { Centinelas } from '../centinelas';

const NEGRITA: Envoltorio = ({ children }) => createElement('b', null, children);

const CHICO: Envoltorio = ({ children }) => createElement('small', null, children);

export const centinelas: Centinelas = {
  'paginaEstadisticas.queEs': {
    llamar: (m) => m.paginaEstadisticas.queEs('«QUÉ»'),
    tieneQueDecir: ['«QUÉ»'],
  },
  'paginaEstadisticas.periodo.anteriores': {
    llamar: (m) => m.paginaEstadisticas.periodo.anteriores(6),
    tieneQueDecir: ['6'],
  },
  'paginaEstadisticas.periodo.siguientes': {
    llamar: (m) => m.paginaEstadisticas.periodo.siguientes(6),
    tieneQueDecir: ['6'],
  },
  'paginaEstadisticas.periodo.entre': {
    llamar: (m) => m.paginaEstadisticas.periodo.entre('«DESDE»', '«HASTA»'),
    tieneQueDecir: ['«DESDE»', '«HASTA»'],
  },
  'paginaEstadisticas.periodo.mesYAnio': {
    llamar: (m) => m.paginaEstadisticas.periodo.mesYAnio('«MES»', '«AÑO»'),
    tieneQueDecir: ['«MES»', '«AÑO»'],
  },
  'paginaEstadisticas.periodo.mesDeOtroAnio': {
    llamar: (m) => m.paginaEstadisticas.periodo.mesDeOtroAnio('«MES»', '«AÑO»'),
    tieneQueDecir: ['«MES»', '«AÑO»'],
  },
  'paginaEstadisticas.periodo.desde': {
    llamar: (m) => m.paginaEstadisticas.periodo.desde('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'paginaEstadisticas.periodo.contra': {
    llamar: (m) => m.paginaEstadisticas.periodo.contra('«RANGO»'),
    tieneQueDecir: ['«RANGO»'],
  },
  'paginaEstadisticas.periodo.contraHastaElMismoDia': {
    llamar: (m) => m.paginaEstadisticas.periodo.contraHastaElMismoDia('«RANGO»'),
    tieneQueDecir: ['«RANGO»'],
  },
  'paginaEstadisticas.periodo.enLaFrase': {
    llamar: (m) => m.paginaEstadisticas.periodo.enLaFrase('«DESDE»', '«HASTA»'),
    tieneQueDecir: ['«DESDE»', '«HASTA»'],
  },
  'paginaEstadisticas.periodo.desdeEnLaFrase': {
    llamar: (m) => m.paginaEstadisticas.periodo.desdeEnLaFrase('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'paginaEstadisticas.periodo.trimestre': {
    llamar: (m) => m.paginaEstadisticas.periodo.trimestre(2),
    tieneQueDecir: ['2'],
  },
  'paginaEstadisticas.ayudas.dejaron': {
    llamar: (m) => m.paginaEstadisticas.ayudas.dejaron('«HASTA»'),
    tieneQueDecir: ['«HASTA»'],
  },
  'paginaEstadisticas.ayudas.dejaronConElIndiceViejo': {
    llamar: (m) => m.paginaEstadisticas.ayudas.dejaronConElIndiceViejo('«HASTA»'),
    tieneQueDecir: ['«HASTA»'],
  },
  'paginaEstadisticas.ayudas.consultas': {
    llamar: (m) => m.paginaEstadisticas.ayudas.consultas('2026-09-18'),
    tieneQueDecir: ['18', '2026'],
  },
  'paginaEstadisticas.resumen.mas': {
    llamar: (m) => m.paginaEstadisticas.resumen.mas('«PORCENTAJE»', '«RANGO»'),
    tieneQueDecir: ['«PORCENTAJE»', '«RANGO»'],
  },
  'paginaEstadisticas.resumen.menos': {
    llamar: (m) => m.paginaEstadisticas.resumen.menos('«PORCENTAJE»', '«RANGO»'),
    tieneQueDecir: ['«PORCENTAJE»', '«RANGO»'],
  },
  'paginaEstadisticas.resumen.igual': {
    llamar: (m) => m.paginaEstadisticas.resumen.igual('«RANGO»'),
    tieneQueDecir: ['«RANGO»'],
  },
  'paginaEstadisticas.resumen.teDejaron': {
    llamar: (m) => m.paginaEstadisticas.resumen.teDejaron('«RANGO»', '«MONTO»', 3),
    tieneQueDecir: ['«RANGO»', '«MONTO»', '3'],
  },
  'paginaEstadisticas.resumen.conCasosVas': {
    llamar: (m) => m.paginaEstadisticas.resumen.conCasosVas(5),
    tieneQueDecir: ['5'],
  },
  'paginaEstadisticas.resumen.sinCobrarAntes': {
    llamar: (m) => m.paginaEstadisticas.resumen.sinCobrarAntes('«RANGO»'),
    tieneQueDecir: ['«RANGO»'],
  },
  'paginaEstadisticas.resumen.deCada100': {
    llamar: (m) => m.paginaEstadisticas.resumen.deCada100(NEGRITA, '«CIEN»', '«QUEDARON»'),
    tieneQueDecir: ['«CIEN»', '«QUEDARON»'],
  },
  'paginaEstadisticas.resumen.base': {
    llamar: (m) => m.paginaEstadisticas.resumen.base(8, 3, 2),
    tieneQueDecir: ['8', '3', '2'],
  },
  'paginaEstadisticas.tarjetas.kDeN': {
    llamar: (m) => m.paginaEstadisticas.tarjetas.kDeN(CHICO, 6, 15),
    tieneQueDecir: ['6', '15'],
  },
  'paginaEstadisticas.tarjetas.porcentaje': {
    llamar: (m) => m.paginaEstadisticas.tarjetas.porcentaje('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'paginaEstadisticas.tarjetas.entrega.dias': {
    llamar: (m) => m.paginaEstadisticas.tarjetas.entrega.dias(CHICO, '«NÚMERO»', 23),
    tieneQueDecir: ['«NÚMERO»'],
  },
  'paginaEstadisticas.tarjetas.entrega.entre': {
    llamar: (m) => m.paginaEstadisticas.tarjetas.entrega.entre(CHICO, '«DESDE»', '«HASTA»'),
    tieneQueDecir: ['«DESDE»', '«HASTA»'],
  },
  'paginaEstadisticas.tarjetas.entrega.aTiempo': {
    llamar: (m) => m.paginaEstadisticas.tarjetas.entrega.aTiempo(8, 13),
    tieneQueDecir: ['8', '13'],
  },
  'paginaEstadisticas.tarjetas.entrega.aTiempoConPorcentaje': {
    llamar: (m) =>
      m.paginaEstadisticas.tarjetas.entrega.aTiempoConPorcentaje('«PORCENTAJE»', 16, 23),
    tieneQueDecir: ['«PORCENTAJE»', '16', '23'],
  },
  'paginaEstadisticas.tarjetas.entrega.deAUna': {
    llamar: (m) => m.paginaEstadisticas.tarjetas.entrega.deAUna(4),
    tieneQueDecir: ['4'],
  },
  'paginaEstadisticas.tarjetas.aprobaron.debajo': {
    llamar: (m) => m.paginaEstadisticas.tarjetas.aprobaron.debajo(4),
    tieneQueDecir: ['4'],
  },
  'paginaEstadisticas.tarjetas.aprobaron.debajoConCuenta': {
    llamar: (m) => m.paginaEstadisticas.tarjetas.aprobaron.debajoConCuenta(16, 23, 4),
    tieneQueDecir: ['16', '23', '4'],
  },
  'paginaEstadisticas.tarjetas.conformes.debajoConCuenta': {
    llamar: (m) => m.paginaEstadisticas.tarjetas.conformes.debajoConCuenta(18, 23),
    tieneQueDecir: ['18', '23'],
  },
  'paginaEstadisticas.dejaron.frase': {
    llamar: (m) => m.paginaEstadisticas.dejaron.frase(NEGRITA, 8, '«TOTAL»'),
    tieneQueDecir: ['8', '«TOTAL»'],
  },
  'paginaEstadisticas.dejaron.fraseSoloSenas': {
    llamar: (m) => m.paginaEstadisticas.dejaron.fraseSoloSenas(NEGRITA, 3, '«TOTAL»'),
    tieneQueDecir: ['3', '«TOTAL»'],
  },
  'paginaEstadisticas.dejaron.mejorMes': {
    llamar: (m) => m.paginaEstadisticas.dejaron.mejorMes(NEGRITA, '«MES»', '«MONTO»', 3),
    tieneQueDecir: ['«MES»', '«MONTO»', '3'],
  },
  'paginaEstadisticas.dejaron.mejorTrimestre': {
    llamar: (m) =>
      m.paginaEstadisticas.dejaron.mejorTrimestre(NEGRITA, '«TRIMESTRE»', '«MONTO»', 3),
    tieneQueDecir: ['«TRIMESTRE»', '«MONTO»', '3'],
  },
  'paginaEstadisticas.dejaron.mejorAnio': {
    llamar: (m) => m.paginaEstadisticas.dejaron.mejorAnio(NEGRITA, '«AÑO»', '«MONTO»', 3),
    tieneQueDecir: ['«AÑO»', '«MONTO»', '3'],
  },
  'paginaEstadisticas.dejaron.lectura': {
    llamar: (m) => m.paginaEstadisticas.dejaron.lectura(NEGRITA, '«MONTO»', '«CUÁNDO»', 3),
    tieneQueDecir: ['«MONTO»', '«CUÁNDO»', '3'],
  },
  'paginaEstadisticas.dejaron.lecturaConHoy': {
    llamar: (m) =>
      m.paginaEstadisticas.dejaron.lecturaConHoy(NEGRITA, '«HOY»', '«CUÁNDO»', '«COBRADO»', 3),
    tieneQueDecir: ['«HOY»', '«CUÁNDO»', '«COBRADO»', '3'],
  },
  'paginaEstadisticas.dejaron.lecturaSinTrabajos': {
    llamar: (m) => m.paginaEstadisticas.dejaron.lecturaSinTrabajos('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'paginaEstadisticas.dejaron.verLosDe': {
    llamar: (m) => m.paginaEstadisticas.dejaron.verLosDe(3, '«CUÁNDO»'),
    tieneQueDecir: ['3', '«CUÁNDO»'],
  },
  'paginaEstadisticas.dejaron.columna': {
    llamar: (m) => m.paginaEstadisticas.dejaron.columna('«CUÁNDO»', '«MONTO»', 3),
    tieneQueDecir: ['«CUÁNDO»', '«MONTO»', '3'],
  },
  'paginaEstadisticas.dejaron.columnaEnPesosDeCadaMes': {
    llamar: (m) => m.paginaEstadisticas.dejaron.columnaEnPesosDeCadaMes('«CUÁNDO»', '«MONTO»', 3),
    tieneQueDecir: ['«CUÁNDO»', '«MONTO»', '3'],
  },
  'paginaEstadisticas.dejaron.columnaVacia': {
    llamar: (m) => m.paginaEstadisticas.dejaron.columnaVacia('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'paginaEstadisticas.dejaron.hastaHoy': {
    llamar: (m) => m.paginaEstadisticas.dejaron.hastaHoy('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'paginaEstadisticas.dejaron.trabajosDe': {
    llamar: (m) => m.paginaEstadisticas.dejaron.trabajosDe('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'paginaEstadisticas.dejaron.cobradoEl': {
    llamar: (m) => m.paginaEstadisticas.dejaron.cobradoEl('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'paginaEstadisticas.dejaron.cuenta': {
    llamar: (m) => m.paginaEstadisticas.dejaron.cuenta('«COBRADO»', '«GASTOS»'),
    tieneQueDecir: ['«COBRADO»', '«GASTOS»'],
  },
  'paginaEstadisticas.dejaron.totalDe': {
    llamar: (m) => m.paginaEstadisticas.dejaron.totalDe('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'paginaEstadisticas.dejaron.verLosDelPeriodo': {
    llamar: (m) => m.paginaEstadisticas.dejaron.verLosDelPeriodo(8),
    tieneQueDecir: ['8'],
  },
  'paginaEstadisticas.dejaron.vacio': {
    llamar: (m) => m.paginaEstadisticas.dejaron.vacio('«RANGO»'),
    tieneQueDecir: ['«RANGO»'],
  },
  'paginaEstadisticas.dejaron.estimado.deCadaCien': {
    llamar: (m) => m.paginaEstadisticas.dejaron.estimado.deCadaCien('«CIEN»'),
    tieneQueDecir: ['«CIEN»'],
  },
  'paginaEstadisticas.dejaron.estimado.descripcion': {
    llamar: (m) =>
      m.paginaEstadisticas.dejaron.estimado.descripcion(
        '«TÍTULO»',
        '«ESTIMADO»',
        '«REAL»',
        '«CIEN»',
      ),
    tieneQueDecir: ['«TÍTULO»', '«ESTIMADO»', '«REAL»', '«CIEN»'],
  },
  'paginaEstadisticas.dejaron.estimado.verTodos': {
    llamar: (m) => m.paginaEstadisticas.dejaron.estimado.verTodos(8),
    tieneQueDecir: ['8'],
  },
  'paginaEstadisticas.dejaron.tabla.hastaHoy': {
    llamar: (m) => m.paginaEstadisticas.dejaron.tabla.hastaHoy('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'paginaEstadisticas.gastos.frase': {
    llamar: (m) =>
      m.paginaEstadisticas.gastos.frase(
        NEGRITA,
        '«CUÁNDO»',
        '«TOTAL»',
        '«EN LOS TRABAJOS»',
        '«EN EL TALLER»',
      ),
    tieneQueDecir: ['«CUÁNDO»', '«TOTAL»', '«EN LOS TRABAJOS»', '«EN EL TALLER»'],
  },
  'paginaEstadisticas.gastos.fraseSoloTrabajos': {
    llamar: (m) => m.paginaEstadisticas.gastos.fraseSoloTrabajos(NEGRITA, '«CUÁNDO»', '«TOTAL»'),
    tieneQueDecir: ['«CUÁNDO»', '«TOTAL»'],
  },
  'paginaEstadisticas.gastos.fraseSoloTaller': {
    llamar: (m) => m.paginaEstadisticas.gastos.fraseSoloTaller(NEGRITA, '«CUÁNDO»', '«TOTAL»'),
    tieneQueDecir: ['«CUÁNDO»', '«TOTAL»'],
  },
  'paginaEstadisticas.gastos.falta': {
    llamar: (m) => m.paginaEstadisticas.gastos.falta('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'paginaEstadisticas.gastos.enTrabajos': {
    llamar: (m) => m.paginaEstadisticas.gastos.enTrabajos(CHICO, 7),
    tieneQueDecir: ['7'],
  },
  'paginaEstadisticas.gastos.yMas': {
    llamar: (m) => m.paginaEstadisticas.gastos.yMas(4),
    tieneQueDecir: ['4'],
  },
  'paginaEstadisticas.gastos.vacio': {
    llamar: (m) => m.paginaEstadisticas.gastos.vacio('«RANGO»'),
    tieneQueDecir: ['«RANGO»'],
  },
  'paginaEstadisticas.gastos.tabla.deCadaCien': {
    llamar: (m) => m.paginaEstadisticas.gastos.tabla.deCadaCien('«CIEN»'),
    tieneQueDecir: ['«CIEN»'],
  },
  'paginaEstadisticas.gastos.tabla.enLosTrabajos': {
    llamar: (m) => m.paginaEstadisticas.gastos.tabla.enLosTrabajos('«CATEGORÍA»'),
    tieneQueDecir: ['«CATEGORÍA»'],
  },
  'paginaEstadisticas.gastos.tabla.enElTaller': {
    llamar: (m) => m.paginaEstadisticas.gastos.tabla.enElTaller('«CATEGORÍA»'),
    tieneQueDecir: ['«CATEGORÍA»'],
  },
  'paginaEstadisticas.entregas.frase': {
    llamar: (m) => m.paginaEstadisticas.entregas.frase(NEGRITA, 8, 13, '«TARDÁS»'),
    tieneQueDecir: ['8', '13', '«TARDÁS»'],
  },
  'paginaEstadisticas.entregas.fraseConPorcentaje': {
    llamar: (m) =>
      m.paginaEstadisticas.entregas.fraseConPorcentaje(NEGRITA, 16, 23, '«PORCENTAJE»', '«TARDÁS»'),
    tieneQueDecir: ['16', '23', '«PORCENTAJE»', '«TARDÁS»'],
  },
  'paginaEstadisticas.entregas.fraseSinPromesas': {
    llamar: (m) => m.paginaEstadisticas.entregas.fraseSinPromesas(NEGRITA, '«TARDÁS»'),
    tieneQueDecir: ['«TARDÁS»'],
  },
  'paginaEstadisticas.entregas.fraseConPocos': {
    llamar: (m) => m.paginaEstadisticas.entregas.fraseConPocos(NEGRITA, 3, '«TARDASTE»', 2),
    tieneQueDecir: ['3', '«TARDASTE»', '2'],
  },
  'paginaEstadisticas.entregas.subtitulo': {
    llamar: (m) => m.paginaEstadisticas.entregas.subtitulo(13, '«CUÁNDO»'),
    tieneQueDecir: ['13', '«CUÁNDO»'],
  },
  'paginaEstadisticas.entregas.mediana': {
    llamar: (m) => m.paginaEstadisticas.entregas.mediana('«DÍAS»'),
    tieneQueDecir: ['«DÍAS»'],
  },
  'paginaEstadisticas.entregas.cota': {
    llamar: (m) => m.paginaEstadisticas.entregas.cota('«DESDE»', '«HASTA»'),
    tieneQueDecir: ['«DESDE»', '«HASTA»'],
  },
  'paginaEstadisticas.entregas.diasCortos': {
    llamar: (m) => m.paginaEstadisticas.entregas.diasCortos('«DÍAS»'),
    tieneQueDecir: ['«DÍAS»'],
  },
  'paginaEstadisticas.entregas.atraso': {
    llamar: (m) => m.paginaEstadisticas.entregas.atraso(3),
    tieneQueDecir: ['3'],
  },
  'paginaEstadisticas.entregas.tardeDias': {
    llamar: (m) => m.paginaEstadisticas.entregas.tardeDias(3),
    tieneQueDecir: ['3'],
  },
  'paginaEstadisticas.entregas.punto': {
    llamar: (m) => m.paginaEstadisticas.entregas.punto('«TÍTULO»', '«DÍAS»', '«CÓMO»'),
    tieneQueDecir: ['«TÍTULO»', '«DÍAS»', '«CÓMO»'],
  },
  'paginaEstadisticas.entregas.lectura': {
    llamar: (m) => m.paginaEstadisticas.entregas.lectura(NEGRITA, '«TÍTULO»', '«DÍAS»', '«CÓMO»'),
    tieneQueDecir: ['«TÍTULO»', '«DÍAS»', '«CÓMO»'],
  },
  'paginaEstadisticas.entregas.medianaDesde': {
    llamar: (m) => m.paginaEstadisticas.entregas.medianaDesde(5),
    tieneQueDecir: ['5'],
  },
  'paginaEstadisticas.entregas.tabla.tarde': {
    llamar: (m) => m.paginaEstadisticas.entregas.tabla.tarde(3),
    tieneQueDecir: ['3'],
  },
  'paginaEstadisticas.entregas.vacio': {
    llamar: (m) => m.paginaEstadisticas.entregas.vacio('«RANGO»'),
    tieneQueDecir: ['«RANGO»'],
  },
  'paginaEstadisticas.consultas.frase': {
    llamar: (m) => m.paginaEstadisticas.consultas.frase(NEGRITA, 26, 15, 7, 4, '«DESDE»'),
    tieneQueDecir: ['26', '15', '7', '4', '«DESDE»'],
  },
  'paginaEstadisticas.consultas.subtitulo': {
    llamar: (m) => m.paginaEstadisticas.consultas.subtitulo('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'paginaEstadisticas.consultas.antesDelRegistro': {
    llamar: (m) => m.paginaEstadisticas.consultas.antesDelRegistro('2026-09-18'),
    tieneQueDecir: ['18', '2026'],
  },
  'paginaEstadisticas.consultas.cuenta': {
    llamar: (m) => m.paginaEstadisticas.consultas.cuenta(NEGRITA, 15, 26),
    tieneQueDecir: ['15', '26'],
  },
  'paginaEstadisticas.consultas.primera': {
    llamar: (m) => m.paginaEstadisticas.consultas.primera(NEGRITA, 26),
    tieneQueDecir: ['26'],
  },
  'paginaEstadisticas.consultas.perdiste': {
    llamar: (m) => m.paginaEstadisticas.consultas.perdiste(7, 5, 2),
    tieneQueDecir: ['7', '5', '2'],
  },
  'paginaEstadisticas.consultas.siguenAbiertas': {
    llamar: (m) => m.paginaEstadisticas.consultas.siguenAbiertas(13),
    tieneQueDecir: ['13'],
  },
  'paginaEstadisticas.consultas.aprobados': {
    llamar: (m) => m.paginaEstadisticas.consultas.aprobados(NEGRITA, 6),
    tieneQueDecir: ['6'],
  },
  'paginaEstadisticas.consultas.perdidos': {
    llamar: (m) => m.paginaEstadisticas.consultas.perdidos(NEGRITA, 5),
    tieneQueDecir: ['5'],
  },
  'paginaEstadisticas.consultas.esperan': {
    llamar: (m) => m.paginaEstadisticas.consultas.esperan(NEGRITA, 4),
    tieneQueDecir: ['4'],
  },
  'paginaEstadisticas.consultas.medianaDe': {
    llamar: (m) => m.paginaEstadisticas.consultas.medianaDe(12),
    tieneQueDecir: ['12'],
  },
  'paginaEstadisticas.consultas.faltan': {
    llamar: (m) => m.paginaEstadisticas.consultas.faltan(10, 'ambos', 5),
    tieneQueDecir: ['10', '5'],
  },
  'paginaEstadisticas.consultas.verLas': {
    llamar: (m) => m.paginaEstadisticas.consultas.verLas(26),
    tieneQueDecir: ['26'],
  },
  'paginaEstadisticas.consultas.entro': {
    llamar: (m) => m.paginaEstadisticas.consultas.entro('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'paginaEstadisticas.consultas.vacio': {
    llamar: (m) => m.paginaEstadisticas.consultas.vacio('«RANGO»'),
    tieneQueDecir: ['«RANGO»'],
  },
  'paginaEstadisticas.opiniones.frase': {
    llamar: (m) => m.paginaEstadisticas.opiniones.frase(NEGRITA, 9, 13),
    tieneQueDecir: ['9', '13'],
  },
  'paginaEstadisticas.opiniones.fraseConPorcentaje': {
    llamar: (m) =>
      m.paginaEstadisticas.opiniones.fraseConPorcentaje(NEGRITA, 18, 23, '«PORCENTAJE»'),
    tieneQueDecir: ['18', '23', '«PORCENTAJE»'],
  },
  'paginaEstadisticas.opiniones.fraseConPocos': {
    llamar: (m) => m.paginaEstadisticas.opiniones.fraseConPocos(NEGRITA, 3, 2, false),
    tieneQueDecir: ['3', '2'],
  },
  'paginaEstadisticas.opiniones.fraseSinEscala': {
    llamar: (m) => m.paginaEstadisticas.opiniones.fraseSinEscala(NEGRITA, 3),
    tieneQueDecir: ['3'],
  },
  'paginaEstadisticas.opiniones.sinRespuestas': {
    llamar: (m) => m.paginaEstadisticas.opiniones.sinRespuestas(3),
    tieneQueDecir: ['3'],
  },
  'paginaEstadisticas.opiniones.subtitulo': {
    llamar: (m) => m.paginaEstadisticas.opiniones.subtitulo(13, '«CUÁNDO»', 9),
    tieneQueDecir: ['13', '«CUÁNDO»', '9'],
  },
  'paginaEstadisticas.opiniones.subtituloSinEncuestas': {
    llamar: (m) => m.paginaEstadisticas.opiniones.subtituloSinEncuestas('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'paginaEstadisticas.opiniones.kDeN': {
    llamar: (m) => m.paginaEstadisticas.opiniones.kDeN(8, 13),
    tieneQueDecir: ['8', '13'],
  },
  'paginaEstadisticas.opiniones.kDeNConPorcentaje': {
    llamar: (m) => m.paginaEstadisticas.opiniones.kDeNConPorcentaje(16, 23, '«PORCENTAJE»'),
    tieneQueDecir: ['16', '23', '«PORCENTAJE»'],
  },
  'paginaEstadisticas.opiniones.vacio': {
    llamar: (m) => m.paginaEstadisticas.opiniones.vacio('«RANGO»'),
    tieneQueDecir: ['«RANGO»'],
  },
  'paginaEstadisticas.viene.frase': {
    llamar: (m) => m.paginaEstadisticas.viene.frase(NEGRITA, 4, 3, '«TE DEBEN»', 2),
    tieneQueDecir: ['4', '3', '«TE DEBEN»', '2'],
  },
  'paginaEstadisticas.viene.yEnDolares': {
    llamar: (m) => m.paginaEstadisticas.viene.yEnDolares('«PESOS»', '«DÓLARES»'),
    tieneQueDecir: ['«PESOS»', '«DÓLARES»'],
  },
  'paginaEstadisticas.viene.subtitulo': {
    llamar: (m) => m.paginaEstadisticas.viene.subtitulo('«HOY»'),
    tieneQueDecir: ['«HOY»'],
  },
  'paginaEstadisticas.viene.loNormal': {
    llamar: (m) => m.paginaEstadisticas.viene.loNormal('«DÍAS»'),
    tieneQueDecir: ['«DÍAS»'],
  },
  'paginaEstadisticas.viene.detalle': {
    llamar: (m) => m.paginaEstadisticas.viene.detalle('«DÍAS»', '«CUÁNDO»'),
    tieneQueDecir: ['«DÍAS»', '«CUÁNDO»'],
  },
  'paginaEstadisticas.viene.prometidoParaElDia': {
    llamar: (m) => m.paginaEstadisticas.viene.prometidoParaElDia('2026-09-24'),
    tieneQueDecir: ['24'],
  },
  'paginaEstadisticas.viene.prometidoPara': {
    llamar: (m) => m.paginaEstadisticas.viene.prometidoPara('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'paginaEstadisticas.viene.estimadoParaElDia': {
    llamar: (m) => m.paginaEstadisticas.viene.estimadoParaElDia('2026-09-24'),
    tieneQueDecir: ['24'],
  },
  'paginaEstadisticas.viene.estimadoPara': {
    llamar: (m) => m.paginaEstadisticas.viene.estimadoPara('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'paginaEstadisticas.viene.atrasado': {
    llamar: (m) => m.paginaEstadisticas.viene.atrasado(3),
    tieneQueDecir: ['3'],
  },
  'paginaEstadisticas.viene.paso': {
    llamar: (m) => m.paginaEstadisticas.viene.paso('«DÍAS»'),
    tieneQueDecir: ['«DÍAS»'],
  },
  'paginaEstadisticas.viene.entregado': {
    llamar: (m) => m.paginaEstadisticas.viene.entregado('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
};

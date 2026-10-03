import type { Centinelas, LlamadaCentinela } from '../centinelas';

const PASOS = ['ambos', 'compromisos', 'ahorros'] as const;
const DESTINOS = ['queda', 'va'] as const;

const TESORO = '«TESORO»';
const FALTA = '«FALTA»';
const MONTO = '«MONTO»';
const MES = '«MES»';

const DE_LO_QUE_SOBRA: Centinelas = Object.fromEntries([
  ...DESTINOS.flatMap((destino) =>
    PASOS.map((pasos): [string, LlamadaCentinela] => [
      `paginaInicio.laFila.sobra.cuandoSeLlenan.${destino}.${pasos}`,
      {
        llamar: (m) => m.paginaInicio.laFila.sobra.cuandoSeLlenan[destino][pasos](TESORO, FALTA),
        tieneQueDecir: [TESORO, FALTA],
      },
    ]),
  ),
  ...DESTINOS.flatMap((destino) =>
    PASOS.map((pasos): [string, LlamadaCentinela] => [
      `paginaInicio.laFila.sobra.yaLlenos.${destino}.${pasos}`,
      {
        llamar: (m) => m.paginaInicio.laFila.sobra.yaLlenos[destino][pasos](TESORO),
        tieneQueDecir: [TESORO],
      },
    ]),
  ),
  ...DESTINOS.map((destino): [string, LlamadaCentinela] => [
    `paginaInicio.laFila.sobra.deCadaCobro.${destino}`,
    {
      llamar: (m) => m.paginaInicio.laFila.sobra.deCadaCobro[destino](TESORO),
      tieneQueDecir: [TESORO],
    },
  ]),
  ...DESTINOS.map((destino): [string, LlamadaCentinela] => [
    `paginaInicio.laFila.sobra.yaSeRepartieron.${destino}`,
    {
      llamar: (m) =>
        m.paginaInicio.laFila.sobra.yaSeRepartieron[destino]('«REPARTIDO»', '«LISTA»', TESORO),
      tieneQueDecir: ['«REPARTIDO»', '«LISTA»', TESORO],
    },
  ]),
  ...PASOS.map((pasos): [string, LlamadaCentinela] => [
    `paginaInicio.laFila.sobra.seReparteCuandoSeLlenan.${pasos}`,
    {
      llamar: (m) => m.paginaInicio.laFila.sobra.seReparteCuandoSeLlenan[pasos](FALTA),
      tieneQueDecir: [FALTA],
    },
  ]),
]);

export const centinelas: Centinelas = {
  ...DE_LO_QUE_SOBRA,
  'paginaInicio.tuCuentaConOpinionesNuevas': {
    llamar: (m) => m.paginaInicio.tuCuentaConOpinionesNuevas(7),
    tieneQueDecir: ['7'],
  },
  'paginaInicio.lista': {
    llamar: (m) => m.paginaInicio.lista(['«UNO»', '«DOS»', '«TRES»']),
    tieneQueDecir: ['«UNO»', '«DOS»', '«TRES»'],
  },
  'paginaInicio.mensajeDelMes.hogarEnNegativo': {
    llamar: (m) => m.paginaInicio.mensajeDelMes.hogarEnNegativo(MONTO),
    tieneQueDecir: [MONTO],
  },
  'paginaInicio.mensajeDelMes.sinMovimiento': {
    llamar: (m) => m.paginaInicio.mensajeDelMes.sinMovimiento(MES),
    tieneQueDecir: [MES],
  },
  'paginaInicio.mensajeDelMes.compromisosYAhorrosCubiertos': {
    llamar: (m) => m.paginaInicio.mensajeDelMes.compromisosYAhorrosCubiertos(MES),
    tieneQueDecir: [MES],
  },
  'paginaInicio.mensajeDelMes.faltanParaLlenar': {
    llamar: (m) => m.paginaInicio.mensajeDelMes.faltanParaLlenar(MONTO, MES),
    tieneQueDecir: [MONTO, MES],
  },
  'paginaInicio.mensajeDelMes.sueldoCubierto': {
    llamar: (m) => m.paginaInicio.mensajeDelMes.sueldoCubierto(MES),
    tieneQueDecir: [MES],
  },
  'paginaInicio.mensajeDelMes.facturoYNoEntro': {
    llamar: (m) => m.paginaInicio.mensajeDelMes.facturoYNoEntro(MONTO, MES),
    tieneQueDecir: [MONTO, MES],
  },
  'paginaInicio.mensajeDelMes.faltanParaElSueldo': {
    llamar: (m) => m.paginaInicio.mensajeDelMes.faltanParaElSueldo(MONTO, MES),
    tieneQueDecir: [MONTO, MES],
  },
  'paginaInicio.comparacion.subio': {
    llamar: (m) => m.paginaInicio.comparacion.subio(7, MES),
    tieneQueDecir: ['7', MES],
  },
  'paginaInicio.comparacion.bajo': {
    llamar: (m) => m.paginaInicio.comparacion.bajo(7, MES),
    tieneQueDecir: ['7', MES],
  },
  'paginaInicio.comprometida': {
    llamar: (m) => m.paginaInicio.comprometida('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'paginaInicio.proyectosEnCurso': {
    llamar: (m) => m.paginaInicio.proyectosEnCurso(7),
    tieneQueDecir: ['7'],
  },
  'paginaInicio.diaDelMes': {
    llamar: (m) => m.paginaInicio.diaDelMes(7, 30),
    tieneQueDecir: ['7', '30'],
  },
  'paginaInicio.panorama.enElTesoro': {
    llamar: (m) => m.paginaInicio.panorama.enElTesoro(TESORO),
    tieneQueDecir: [TESORO],
  },
  'paginaInicio.panorama.enElTesoroQueNoAlcanza': {
    llamar: (m) => m.paginaInicio.panorama.enElTesoroQueNoAlcanza(TESORO),
    tieneQueDecir: [TESORO],
  },
  'paginaInicio.panorama.deTrabajos': {
    llamar: (m) => m.paginaInicio.panorama.deTrabajos(7),
    tieneQueDecir: ['7'],
  },
  'paginaInicio.panorama.enTesoros': {
    llamar: (m) => m.paginaInicio.panorama.enTesoros(7),
    tieneQueDecir: ['7'],
  },
  'paginaInicio.laFila.titulo': {
    llamar: (m) => m.paginaInicio.laFila.titulo(MES),
    tieneQueDecir: [MES],
  },
  'paginaInicio.laFila.ingresoEnCobros': {
    llamar: (m) => m.paginaInicio.laFila.ingresoEnCobros(MONTO, 7),
    tieneQueDecir: [MONTO, '7'],
  },
  'paginaInicio.laFila.regla.cobrado': {
    llamar: (m) => m.paginaInicio.laFila.regla.cobrado('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'paginaInicio.laFila.regla.ingreso': {
    llamar: (m) => m.paginaInicio.laFila.regla.ingreso('«PORCENTAJE»'),
    tieneQueDecir: ['«PORCENTAJE»'],
  },
  'paginaInicio.laFila.apartado': {
    llamar: (m) => m.paginaInicio.laFila.apartado(MONTO),
    tieneQueDecir: [MONTO],
  },
  'paginaInicio.laFila.aPagar': {
    llamar: (m) => m.paginaInicio.laFila.aPagar(MONTO),
    tieneQueDecir: [MONTO],
  },
  'paginaInicio.laFila.hastaLaMeta': {
    llamar: (m) => m.paginaInicio.laFila.hastaLaMeta('«MODO»'),
    tieneQueDecir: ['«MODO»'],
  },
  'paginaInicio.laFila.paso': {
    llamar: (m) => m.paginaInicio.laFila.paso(7, TESORO),
    tieneQueDecir: ['7', TESORO],
  },
  'paginaInicio.laFila.porCobro': {
    llamar: (m) => m.paginaInicio.laFila.porCobro(MONTO),
    tieneQueDecir: [MONTO],
  },
  'paginaInicio.laFila.deTope': {
    llamar: (m) => m.paginaInicio.laFila.deTope('«LLEVA»', '«TOPE»'),
    tieneQueDecir: ['«LLEVA»', '«TOPE»'],
  },
  'paginaInicio.laFila.recibioEsteMes': {
    llamar: (m) => m.paginaInicio.laFila.recibioEsteMes(MONTO),
    tieneQueDecir: [MONTO],
  },
  'paginaInicio.laFila.faltan': {
    llamar: (m) => m.paginaInicio.laFila.faltan(MONTO),
    tieneQueDecir: [MONTO],
  },
  'paginaInicio.laFila.sobra.reparto': {
    llamar: (m) => m.paginaInicio.laFila.sobra.reparto('«LISTA»'),
    tieneQueDecir: ['«LISTA»'],
  },
  'paginaInicio.laFila.sobra.parte': {
    llamar: (m) => m.paginaInicio.laFila.sobra.parte(TESORO, '«PORCENTAJE»'),
    tieneQueDecir: [TESORO, '«PORCENTAJE»'],
  },
  'paginaInicio.laFila.sobra.parteHastaSuMeta': {
    llamar: (m) => m.paginaInicio.laFila.sobra.parteHastaSuMeta(TESORO, '«PORCENTAJE»'),
    tieneQueDecir: [TESORO, '«PORCENTAJE»'],
  },
  'paginaInicio.laFila.sobra.elResto': {
    llamar: (m) => m.paginaInicio.laFila.sobra.elResto(TESORO),
    tieneQueDecir: [TESORO],
  },
  'paginaInicio.laFila.sobra.recibio': {
    llamar: (m) => m.paginaInicio.laFila.sobra.recibio(TESORO, MONTO),
    tieneQueDecir: [TESORO, MONTO],
  },
  'paginaInicio.laFila.diasQueQuedan': {
    llamar: (m) => m.paginaInicio.laFila.diasQueQuedan(7),
    tieneQueDecir: ['7'],
  },
  'paginaInicio.laFila.tesoroEnLaFrase': {
    llamar: (m) => m.paginaInicio.laFila.tesoroEnLaFrase(TESORO),
    tieneQueDecir: [TESORO],
  },
  'paginaInicio.faltante.faltaPara': {
    llamar: (m) => m.paginaInicio.faltante.faltaPara(TESORO),
    tieneQueDecir: [TESORO],
  },
  'paginaInicio.perfil.proximo': {
    llamar: (m) => m.paginaInicio.perfil.proximo('«CUÁNDO»', '«EVENTO»'),
    tieneQueDecir: ['«CUÁNDO»', '«EVENTO»'],
  },
  'paginaInicio.perfil.nuevas': {
    llamar: (m) => m.paginaInicio.perfil.nuevas(7),
    tieneQueDecir: ['7'],
  },
  'paginaInicio.perfil.opino': {
    llamar: (m) => m.paginaInicio.perfil.opino('«CLIENTE»'),
    tieneQueDecir: ['«CLIENTE»'],
  },
  'paginaInicio.perfil.opinaron': {
    llamar: (m) => m.paginaInicio.perfil.opinaron('«CLIENTES»'),
    tieneQueDecir: ['«CLIENTES»'],
  },
  'paginaInicio.perfil.yMas': {
    llamar: (m) => m.paginaInicio.perfil.yMas(7),
    tieneQueDecir: ['7'],
  },
  'paginaInicio.hoyEnLaAgenda.yMas': {
    llamar: (m) => m.paginaInicio.hoyEnLaAgenda.yMas(7),
    tieneQueDecir: ['7'],
  },
  'paginaInicio.metas.deLaMeta': {
    llamar: (m) => m.paginaInicio.metas.deLaMeta('«SALDO»', '«META»'),
    tieneQueDecir: ['«SALDO»', '«META»'],
  },
  'paginaInicio.portada.elCorte': {
    llamar: (m) => m.paginaInicio.portada.elCorte(MES),
    tieneQueDecir: [MES],
  },
  'paginaInicio.respuestas.laEntregaDeSu': {
    llamar: (m) => m.paginaInicio.respuestas.laEntregaDeSu('escritorio'),
    tieneQueDecir: ['escritorio'],
  },
  'paginaInicio.respuestas.tePasoSusDias': {
    llamar: (m) => m.paginaInicio.respuestas.tePasoSusDias('«CLIENTE»'),
    tieneQueDecir: ['«CLIENTE»'],
  },
  'paginaInicio.respuestas.aceptoElDiaQueLePropusiste': {
    llamar: (m) => m.paginaInicio.respuestas.aceptoElDiaQueLePropusiste('«CLIENTE»'),
    tieneQueDecir: ['«CLIENTE»'],
  },
  'paginaInicio.respuestas.aceptoEl': {
    llamar: (m) => m.paginaInicio.respuestas.aceptoEl('«CLIENTE»', '«FECHA»'),
    tieneQueDecir: ['«CLIENTE»', '«FECHA»'],
  },
  'paginaInicio.respuestas.tuClienteAceptoEl': {
    llamar: (m) => m.paginaInicio.respuestas.tuClienteAceptoEl('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'paginaInicio.ultimaOpinion.opinoDeSu': {
    llamar: (m) => m.paginaInicio.ultimaOpinion.opinoDeSu('«CLIENTE»', 'escritorio'),
    tieneQueDecir: ['«CLIENTE»', 'escritorio'],
  },
  'paginaInicio.ultimaOpinion.unClienteOpinoDeSu': {
    llamar: (m) => m.paginaInicio.ultimaOpinion.unClienteOpinoDeSu('escritorio'),
    tieneQueDecir: ['escritorio'],
  },
  'paginaInicio.ultimaOpinion.comentario': {
    llamar: (m) => m.paginaInicio.ultimaOpinion.comentario('«COMENTARIO»'),
    tieneQueDecir: ['«COMENTARIO»'],
  },
  'paginaInicio.tarjetas.tipos': {
    llamar: (m) => m.paginaInicio.tarjetas.tipos(['«UNO»', '«DOS»']),
    tieneQueDecir: ['«UNO»', '«DOS»'],
  },
  'paginaInicio.tarjetas.pusoEnLosTrabajos': {
    llamar: (m) => m.paginaInicio.tarjetas.pusoEnLosTrabajos(MONTO),
    tieneQueDecir: [MONTO],
  },
  'paginaInicio.tarjetas.noAlcanzaParaLosInsumos': {
    llamar: (m) => m.paginaInicio.tarjetas.noAlcanzaParaLosInsumos(MONTO),
    tieneQueDecir: [MONTO],
  },
  'paginaInicio.tarjetas.sonInsumos': {
    llamar: (m) => m.paginaInicio.tarjetas.sonInsumos(MONTO),
    tieneQueDecir: [MONTO],
  },
  'paginaInicio.tarjetas.deLaMeta': {
    llamar: (m) => m.paginaInicio.tarjetas.deLaMeta(7),
    tieneQueDecir: ['7'],
  },
};

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
  'vista.comoPagar.despues': {
    llamar: (m) => m.vista.comoPagar.despues('«NOMBRE»', '«CÓMO»'),
    tieneQueDecir: ['«NOMBRE»', '«CÓMO»'],
  },
  'vista.comoPagar.despuesConElImporte': {
    llamar: (m) => m.vista.comoPagar.despuesConElImporte('«NOMBRE»', '«IMPORTE»', '«CÓMO»'),
    tieneQueDecir: ['«NOMBRE»', '«IMPORTE»', '«CÓMO»'],
  },
  'vista.comoPagar.vencio': {
    llamar: (m) => m.vista.comoPagar.vencio('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'vista.comoPagar.hoySon': {
    llamar: (m) => m.vista.comoPagar.hoySon('«PESOS»', '«DÓLAR»'),
    tieneQueDecir: ['«PESOS»', '«DÓLAR»'],
  },
  'vista.pagina.pagasteConElDolar': {
    llamar: (m) => m.vista.pagina.pagasteConElDolar('«PAGADO»', '«DÓLAR»'),
    tieneQueDecir: ['«PAGADO»', '«DÓLAR»'],
  },
  'vista.pagina.precioEnPesos.deHoy': {
    llamar: (m) => m.vista.pagina.precioEnPesos.deHoy('«PESOS»', '«DÓLAR»'),
    tieneQueDecir: ['«PESOS»', '«DÓLAR»'],
  },
  'vista.pagina.precioEnPesos.delDia': {
    llamar: (m) => m.vista.pagina.precioEnPesos.delDia('«PESOS»', '«DÓLAR»', '«FECHA»'),
    tieneQueDecir: ['«PESOS»', '«DÓLAR»', '«FECHA»'],
  },
  'vista.pagina.archivos': {
    llamar: (m) => m.vista.pagina.archivos(7),
    tieneQueDecir: ['7'],
  },
  'vista.pagina.ver': {
    llamar: (m) => m.vista.pagina.ver('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'vista.pagina.buenasNoticias': {
    llamar: (m) => m.vista.pagina.buenasNoticias('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'vista.pagina.opciones': {
    llamar: (m) => m.vista.pagina.opciones(7),
    tieneQueDecir: ['7'],
  },
  'vista.pagina.miraLasOpciones': {
    llamar: (m) => m.vista.pagina.miraLasOpciones(2),
    tieneQueDecir: [],
  },
  'vista.pagina.presupuestoVencido': {
    llamar: (m) => m.vista.pagina.presupuestoVencido('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'vista.pagina.valorDelRelevamiento': {
    llamar: (m) => m.vista.pagina.valorDelRelevamiento('«VALOR»'),
    tieneQueDecir: ['«VALOR»'],
  },
  'vista.pagina.teQuedanParaLaSena': {
    llamar: (m) => m.vista.pagina.teQuedanParaLaSena('«FALTA»'),
    tieneQueDecir: ['«FALTA»'],
  },
  'vista.pagina.datos.senaPagada': {
    llamar: (m) => m.vista.pagina.datos.senaPagada('«SEÑA»'),
    tieneQueDecir: ['«SEÑA»'],
  },
  'vista.pagina.datos.senaQueFalta': {
    llamar: (m) => m.vista.pagina.datos.senaQueFalta('«SEÑA»', '«FALTA»'),
    tieneQueDecir: ['«SEÑA»', '«FALTA»'],
  },
  'vista.pagina.datos.totalPagado': {
    llamar: (m) => m.vista.pagina.datos.totalPagado('«TOTAL»'),
    tieneQueDecir: ['«TOTAL»'],
  },
  'vista.pagina.entrega.fechaEstimada': {
    llamar: (m) => m.vista.pagina.entrega.fechaEstimada('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'vista.pagina.entrega.entregadoEl': {
    llamar: (m) => m.vista.pagina.entrega.entregadoEl('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'vista.coordinar.horarioDel': {
    llamar: (m) => m.vista.coordinar.horarioDel('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'vista.coordinar.sacar': {
    llamar: (m) => m.vista.coordinar.sacar('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'vista.coordinar.conFranja.manana': {
    llamar: (m) => m.vista.coordinar.conFranja.manana('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'vista.coordinar.conFranja.tarde': {
    llamar: (m) => m.vista.coordinar.conFranja.tarde('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'vista.coordinar.conLasDosFranjas': {
    llamar: (m) => m.vista.coordinar.conLasDosFranjas('«DÍA»'),
    tieneQueDecir: ['«DÍA»'],
  },
  'vista.coordinar.listoTeEsperamos': {
    llamar: (m) => m.vista.coordinar.listoTeEsperamos('«CUÁNDO»'),
    tieneQueDecir: ['«CUÁNDO»'],
  },
  'vista.coordinar.calendario.dia': {
    llamar: (m) => m.vista.coordinar.calendario.dia(3, 17, 9),
    tieneQueDecir: ['17'],
  },
  'vista.vidriera.foto': {
    llamar: (m) => m.vista.vidriera.foto(7, 12),
    tieneQueDecir: ['7', '12'],
  },
  'vista.vidriera.enInstagram': {
    llamar: (m) => m.vista.vidriera.enInstagram('«USUARIO»'),
    tieneQueDecir: ['«USUARIO»'],
  },
};

import { createElement } from 'react';

import type { Envoltorio } from '@/shared/lib';

import type { Centinelas, LlamadaCentinela } from '../centinelas';

const Marca: Envoltorio = ({ children }) => createElement('mark', null, children);

const GRUPOS = ['aTenerEnCuenta', 'incluye', 'avisos', 'condiciones'] as const;

const QUIEN = ['taller', 'trabajo'] as const;

function deLasCasillas(): [string, LlamadaCentinela][] {
  return GRUPOS.flatMap((grupo): [string, LlamadaCentinela][] => [
    [
      `armarElPresupuesto.casillas.${grupo}.propia`,
      {
        llamar: (m) => m.armarElPresupuesto.casillas[grupo].propia(37),
        tieneQueDecir: ['37'],
      },
    ],
    [
      `armarElPresupuesto.casillas.${grupo}.sacarLaPropia`,
      {
        llamar: (m) => m.armarElPresupuesto.casillas[grupo].sacarLaPropia(37),
        tieneQueDecir: ['37'],
      },
    ],
  ]);
}

function deLaSena(): [string, LlamadaCentinela][] {
  return QUIEN.flatMap((quien): [string, LlamadaCentinela][] => [
    [
      `armarElPresupuesto.sena.conElTotal.${quien}`,
      {
        llamar: (m) => m.armarElPresupuesto.sena.conElTotal[quien]('«PORCENTAJE»'),
        tieneQueDecir: ['«PORCENTAJE»'],
      },
    ],
    [
      `armarElPresupuesto.sena.conElTotalYLoPagado.${quien}`,
      {
        llamar: (m) =>
          m.armarElPresupuesto.sena.conElTotalYLoPagado[quien]('«PORCENTAJE»', '«PAGADO»'),
        tieneQueDecir: ['«PORCENTAJE»', '«PAGADO»'],
      },
    ],
    [
      `armarElPresupuesto.sena.senaDel.${quien}`,
      {
        llamar: (m) => m.armarElPresupuesto.sena.senaDel[quien]('«PORCENTAJE»'),
        tieneQueDecir: ['«PORCENTAJE»'],
      },
    ],
    [
      `armarElPresupuesto.sena.segunLaQueElija.${quien}`,
      {
        llamar: (m) => m.armarElPresupuesto.sena.segunLaQueElija[quien]('«PORCENTAJE»'),
        tieneQueDecir: ['«PORCENTAJE»'],
      },
    ],
  ]);
}

export const centinelas: Centinelas = {
  'armarElPresupuesto.guardado.el': {
    llamar: (m) => m.armarElPresupuesto.guardado.el('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'armarElPresupuesto.mandarLaRevision': {
    llamar: (m) => m.armarElPresupuesto.mandarLaRevision(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.opcion': {
    llamar: (m) => m.armarElPresupuesto.opcion('«LETRA»'),
    tieneQueDecir: ['«LETRA»'],
  },
  'armarElPresupuesto.encabezado.numeroYProxima': {
    llamar: (m) => m.armarElPresupuesto.encabezado.numeroYProxima('«NUMERO»', 37),
    tieneQueDecir: ['«NUMERO»', '37'],
  },
  'armarElPresupuesto.encabezado.llevaElDia': {
    llamar: (m) => m.armarElPresupuesto.encabezado.llevaElDia('«EJEMPLO»'),
    tieneQueDecir: ['«EJEMPLO»'],
  },
  'armarElPresupuesto.validez.dias': {
    llamar: (m) => m.armarElPresupuesto.validez.dias(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.validez.valeHasta': {
    llamar: (m) => m.armarElPresupuesto.validez.valeHasta('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'armarElPresupuesto.validez.salenDeAjustes': {
    llamar: (m) => m.armarElPresupuesto.validez.salenDeAjustes(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.detalle.cuantos': {
    llamar: (m) => m.armarElPresupuesto.detalle.cuantos(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.detalle.conDescripcion': {
    llamar: (m) => m.armarElPresupuesto.detalle.conDescripcion(37, 41),
    tieneQueDecir: ['37', '41'],
  },
  'armarElPresupuesto.detalle.quiteElMuebleLlamado': {
    llamar: (m) => m.armarElPresupuesto.detalle.quiteElMuebleLlamado('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'armarElPresupuesto.detalle.mueble.nombre': {
    llamar: (m) => m.armarElPresupuesto.detalle.mueble.nombre(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.detalle.mueble.subir': {
    llamar: (m) => m.armarElPresupuesto.detalle.mueble.subir(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.detalle.mueble.subirLlamado': {
    llamar: (m) => m.armarElPresupuesto.detalle.mueble.subirLlamado('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'armarElPresupuesto.detalle.mueble.bajar': {
    llamar: (m) => m.armarElPresupuesto.detalle.mueble.bajar(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.detalle.mueble.bajarLlamado': {
    llamar: (m) => m.armarElPresupuesto.detalle.mueble.bajarLlamado('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'armarElPresupuesto.detalle.mueble.quitar': {
    llamar: (m) => m.armarElPresupuesto.detalle.mueble.quitar(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.detalle.mueble.quitarLlamado': {
    llamar: (m) => m.armarElPresupuesto.detalle.mueble.quitarLlamado('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'armarElPresupuesto.herrajes.cuantos': {
    llamar: (m) => m.armarElPresupuesto.herrajes.cuantos(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.herrajes.cuantosSinMostrar': {
    llamar: (m) => m.armarElPresupuesto.herrajes.cuantosSinMostrar(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.herrajes.herraje': {
    llamar: (m) => m.armarElPresupuesto.herrajes.herraje(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.herrajes.sacarElHerraje': {
    llamar: (m) => m.armarElPresupuesto.herrajes.sacarElHerraje(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.herrajes.traje': {
    llamar: (m) => m.armarElPresupuesto.herrajes.traje(37),
    tieneQueDecir: ['37'],
  },
  ...Object.fromEntries(deLasCasillas()),
  'armarElPresupuesto.casillas.van': {
    llamar: (m) => m.armarElPresupuesto.casillas.van(37, 41),
    tieneQueDecir: ['37', '41'],
  },
  ...Object.fromEntries(deLaSena()),
  'armarElPresupuesto.sena.yaPagoSeDescuenta': {
    llamar: (m) => m.armarElPresupuesto.sena.yaPagoSeDescuenta(Marca, '«MONTO»'),
    tieneQueDecir: ['<mark>«MONTO»</mark>'],
  },
  'armarElPresupuesto.valores.opciones': {
    llamar: (m) => m.armarElPresupuesto.valores.opciones(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.valores.queIncluye': {
    llamar: (m) => m.armarElPresupuesto.valores.queIncluye('«LETRA»'),
    tieneQueDecir: ['«LETRA»'],
  },
  'armarElPresupuesto.valores.importe': {
    llamar: (m) => m.armarElPresupuesto.valores.importe('«LETRA»'),
    tieneQueDecir: ['«LETRA»'],
  },
  'armarElPresupuesto.valores.quitar': {
    llamar: (m) => m.armarElPresupuesto.valores.quitar('«LETRA»'),
    tieneQueDecir: ['«LETRA»'],
  },
  'armarElPresupuesto.formaDePago.laSenaDeEsteTrabajo': {
    llamar: (m) => m.armarElPresupuesto.formaDePago.laSenaDeEsteTrabajo('«SENA»'),
    tieneQueDecir: ['«SENA»'],
  },
  'armarElPresupuesto.garantia.meses': {
    llamar: (m) => m.armarElPresupuesto.garantia.meses(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.mandar.numeroYCliente': {
    llamar: (m) => m.armarElPresupuesto.mandar.numeroYCliente('«NUMERO»', '«CLIENTE»'),
    tieneQueDecir: ['«NUMERO»', '«CLIENTE»'],
  },
  'armarElPresupuesto.mandar.valeHasta': {
    llamar: (m) => m.armarElPresupuesto.mandar.valeHasta('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'armarElPresupuesto.mandar.pasaA': {
    llamar: (m) => m.armarElPresupuesto.mandar.pasaA('«ESTADO»'),
    tieneQueDecir: ['«ESTADO»'],
  },
  'armarElPresupuesto.mandar.quedaGuardada': {
    llamar: (m) => m.armarElPresupuesto.mandar.quedaGuardada(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.mandar.contador': {
    llamar: (m) => m.armarElPresupuesto.mandar.contador(37, 41),
    tieneQueDecir: ['37', '41'],
  },
  'armarElPresupuesto.mandar.listo.numero': {
    llamar: (m) => m.armarElPresupuesto.mandar.listo.numero('«NUMERO»'),
    tieneQueDecir: ['«NUMERO»'],
  },
  'armarElPresupuesto.mandar.listo.numeroYRevision': {
    llamar: (m) => m.armarElPresupuesto.mandar.listo.numeroYRevision('«NUMERO»', 37),
    tieneQueDecir: ['«NUMERO»', '37'],
  },
  'armarElPresupuesto.mandar.listo.yaLoPuedeVer': {
    llamar: (m) => m.armarElPresupuesto.mandar.listo.yaLoPuedeVer('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'armarElPresupuesto.mandar.listo.yaVeLaRevision': {
    llamar: (m) => m.armarElPresupuesto.mandar.listo.yaVeLaRevision('«NOMBRE»', 37),
    tieneQueDecir: ['«NOMBRE»', '37'],
  },
  'armarElPresupuesto.mandar.listo.tuClienteYaVeLaRevision': {
    llamar: (m) => m.armarElPresupuesto.mandar.listo.tuClienteYaVeLaRevision(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.mandar.listo.conElEnlace': {
    llamar: (m) => m.armarElPresupuesto.mandar.listo.conElEnlace(Marca, '«MENSAJE»'),
    tieneQueDecir: ['<mark>«MENSAJE»</mark>'],
  },
  'armarElPresupuesto.mandar.anotado.laRevision': {
    llamar: (m) => m.armarElPresupuesto.mandar.anotado.laRevision(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.mandar.anotado.quedoEnLaCola': {
    llamar: (m) => m.armarElPresupuesto.mandar.anotado.quedoEnLaCola('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'armarElPresupuesto.tarjeta.acordadoAlAprobar': {
    llamar: (m) => m.armarElPresupuesto.tarjeta.acordadoAlAprobar('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'armarElPresupuesto.tarjeta.rev': {
    llamar: (m) => m.armarElPresupuesto.tarjeta.rev(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.tarjeta.guardadoElSinNumero': {
    llamar: (m) => m.armarElPresupuesto.tarjeta.guardadoElSinNumero('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'armarElPresupuesto.tarjeta.mandado': {
    llamar: (m) => m.armarElPresupuesto.tarjeta.mandado('«CUANDO»'),
    tieneQueDecir: ['«CUANDO»'],
  },
  'armarElPresupuesto.tarjeta.vencio': {
    llamar: (m) => m.armarElPresupuesto.tarjeta.vencio('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'armarElPresupuesto.tarjeta.queCambioEnLaRevision': {
    llamar: (m) => m.armarElPresupuesto.tarjeta.queCambioEnLaRevision(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.tarjeta.cambiosSinMandar': {
    llamar: (m) => m.armarElPresupuesto.tarjeta.cambiosSinMandar(37),
    tieneQueDecir: ['37'],
  },
  'armarElPresupuesto.tarjeta.loAcepto': {
    llamar: (m) => m.armarElPresupuesto.tarjeta.loAcepto('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'armarElPresupuesto.tarjeta.loAceptoConLaOpcion': {
    llamar: (m) => m.armarElPresupuesto.tarjeta.loAceptoConLaOpcion('«FECHA»', '«LETRA»'),
    tieneQueDecir: ['«FECHA»', '«LETRA»'],
  },
};

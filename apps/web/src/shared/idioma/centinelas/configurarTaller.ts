import { createElement } from 'react';

import type { Envoltorio } from '@/shared/lib';

import type { Centinelas, LlamadaCentinela } from '../centinelas';

const Marca: Envoltorio = ({ children }) => createElement('mark', null, children);

const GRUPOS = ['aTenerEnCuenta', 'incluye', 'avisos', 'condiciones'] as const;

const HUECOS = [
  'plazo',
  'modificaciones',
  'valor_modificacion',
  'relevamiento',
  'sena',
  'meses',
] as const;

const CAMBIOS = ['nuevos', 'cambiados', 'quitados'] as const;

const LUGARES = ['primero', 'despues'] as const;

function deLosGrupos(): [string, LlamadaCentinela][] {
  return GRUPOS.flatMap((grupo): [string, LlamadaCentinela][] => [
    [
      `configurarTaller.presupuesto.grupos.${grupo}.resumen`,
      {
        llamar: (m) => m.configurarTaller.presupuesto.grupos[grupo].resumen(37, 21),
        tieneQueDecir: ['37', '21'],
      },
    ],
    [
      `configurarTaller.presupuesto.grupos.${grupo}.tildadaCon`,
      {
        llamar: (m) => m.configurarTaller.presupuesto.grupos[grupo].tildadaCon('«TEXTO»'),
        tieneQueDecir: ['«TEXTO»'],
      },
    ],
    [
      `configurarTaller.presupuesto.grupos.${grupo}.lleno`,
      {
        llamar: (m) => m.configurarTaller.presupuesto.grupos[grupo].lleno(37),
        tieneQueDecir: ['37'],
      },
    ],
    [
      `configurarTaller.presupuesto.grupos.${grupo}.seVaUna`,
      {
        llamar: (m) => m.configurarTaller.presupuesto.grupos[grupo].seVaUna('«TEXTO»'),
        tieneQueDecir: ['«TEXTO»'],
      },
    ],
    [
      `configurarTaller.presupuesto.grupos.${grupo}.seVanVarias`,
      {
        llamar: (m) => m.configurarTaller.presupuesto.grupos[grupo].seVanVarias(37),
        tieneQueDecir: ['37'],
      },
    ],
  ]);
}

function deLosHuecos(): [string, LlamadaCentinela][] {
  return HUECOS.map((hueco): [string, LlamadaCentinela] => [
    `configurarTaller.presupuesto.huecos.${hueco}.explicacion`,
    {
      llamar: (m) => m.configurarTaller.presupuesto.huecos[hueco].explicacion(Marca, '«VALOR»'),
      tieneQueDecir: ['<mark>«VALOR»</mark>'],
    },
  ]);
}

function deLosCambios(): [string, LlamadaCentinela][] {
  return LUGARES.flatMap((lugar) =>
    CAMBIOS.map((cambio): [string, LlamadaCentinela] => [
      `configurarTaller.presupuesto.cambios.${lugar}.${cambio}`,
      {
        llamar: (m) => m.configurarTaller.presupuesto.cambios[lugar][cambio](37),
        tieneQueDecir: ['37'],
      },
    ]),
  );
}

export const centinelas: Centinelas = {
  'configurarTaller.cuit': {
    llamar: (m) => m.configurarTaller.cuit('«NUMERO»'),
    tieneQueDecir: ['«NUMERO»'],
  },
  'configurarTaller.configuracion.errores.nombre': {
    llamar: (m) => m.configurarTaller.configuracion.errores.nombre(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.configuracion.errores.vigencia': {
    llamar: (m) => m.configurarTaller.configuracion.errores.vigencia(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.cobro.errores.titularLargo': {
    llamar: (m) => m.configurarTaller.cobro.errores.titularLargo(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.cobro.errores.linkLargo': {
    llamar: (m) => m.configurarTaller.cobro.errores.linkLargo(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.cobro.errores.linkDeOtroSitio': {
    llamar: (m) => m.configurarTaller.cobro.errores.linkDeOtroSitio('«SITIOS»'),
    tieneQueDecir: ['«SITIOS»'],
  },
  ...Object.fromEntries(deLosGrupos()),
  'configurarTaller.presupuesto.lista.subir': {
    llamar: (m) => m.configurarTaller.presupuesto.lista.subir('«TEXTO»'),
    tieneQueDecir: ['«TEXTO»'],
  },
  'configurarTaller.presupuesto.lista.bajar': {
    llamar: (m) => m.configurarTaller.presupuesto.lista.bajar('«TEXTO»'),
    tieneQueDecir: ['«TEXTO»'],
  },
  ...Object.fromEntries(deLosHuecos()),
  'configurarTaller.presupuesto.formas.cuantas': {
    llamar: (m) => m.configurarTaller.presupuesto.formas.cuantas(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.presupuesto.formas.lleno': {
    llamar: (m) => m.configurarTaller.presupuesto.formas.lleno(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.presupuesto.datos.enComoTePagan': {
    llamar: (m) => m.configurarTaller.presupuesto.datos.enComoTePagan(Marca, '«QUIEN»'),
    tieneQueDecir: ['<mark>«QUIEN»</mark>'],
  },
  'configurarTaller.presupuesto.problemas.titularLargo': {
    llamar: (m) => m.configurarTaller.presupuesto.problemas.titularLargo(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.presupuesto.problemas.domicilioLargo': {
    llamar: (m) => m.configurarTaller.presupuesto.problemas.domicilioLargo(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.presupuesto.problemas.telefonoLargo': {
    llamar: (m) => m.configurarTaller.presupuesto.problemas.telefonoLargo(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.presupuesto.problemas.textoLargo': {
    llamar: (m) => m.configurarTaller.presupuesto.problemas.textoLargo(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.presupuesto.problemas.garantiaLarga': {
    llamar: (m) => m.configurarTaller.presupuesto.problemas.garantiaLarga(37),
    tieneQueDecir: ['37'],
  },
  ...Object.fromEntries(deLosCambios()),
  'configurarTaller.presupuesto.cambios.cuantos': {
    llamar: (m) => m.configurarTaller.presupuesto.cambios.cuantos(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.presupuesto.barra.conLosCambios': {
    llamar: (m) => m.configurarTaller.presupuesto.barra.conLosCambios('«CAMBIOS»'),
    tieneQueDecir: ['«CAMBIOS»'],
  },
  'configurarTaller.presupuesto.barra.noSeGuardo': {
    llamar: (m) => m.configurarTaller.presupuesto.barra.noSeGuardo('«QUE»'),
    tieneQueDecir: ['«QUE»'],
  },
  'configurarTaller.presupuesto.seDeshace.vuelve': {
    llamar: (m) => m.configurarTaller.presupuesto.seDeshace.vuelve('«TEXTO»'),
    tieneQueDecir: ['«TEXTO»'],
  },
  'configurarTaller.presupuesto.seDeshace.vuelveASuTexto': {
    llamar: (m) => m.configurarTaller.presupuesto.seDeshace.vuelveASuTexto('«TEXTO»'),
    tieneQueDecir: ['«TEXTO»'],
  },
  'configurarTaller.presupuesto.seDeshace.vuelveTildado': {
    llamar: (m) => m.configurarTaller.presupuesto.seDeshace.vuelveTildado('«TEXTO»'),
    tieneQueDecir: ['«TEXTO»'],
  },
  'configurarTaller.presupuesto.seDeshace.vuelveSinTildar': {
    llamar: (m) => m.configurarTaller.presupuesto.seDeshace.vuelveSinTildar('«TEXTO»'),
    tieneQueDecir: ['«TEXTO»'],
  },
  'configurarTaller.presupuesto.seDeshace.elPlazoVuelve': {
    llamar: (m) => m.configurarTaller.presupuesto.seDeshace.elPlazoVuelve(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.presupuesto.seDeshace.vuelvenLasModificaciones': {
    llamar: (m) => m.configurarTaller.presupuesto.seDeshace.vuelvenLasModificaciones(37, '«VALOR»'),
    tieneQueDecir: ['37', '«VALOR»'],
  },
  'configurarTaller.presupuesto.seDeshace.laGarantiaVuelve': {
    llamar: (m) => m.configurarTaller.presupuesto.seDeshace.laGarantiaVuelve(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.presupuesto.textosDeSiempre.cambiaste': {
    llamar: (m) => m.configurarTaller.presupuesto.textosDeSiempre.cambiaste(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.presupuesto.textosDeSiempre.seDeshacen': {
    llamar: (m) => m.configurarTaller.presupuesto.textosDeSiempre.seDeshacen(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.presupuesto.resumen.faltan': {
    llamar: (m) => m.configurarTaller.presupuesto.resumen.faltan(2, '«QUE»'),
    tieneQueDecir: ['«QUE»'],
  },
  'configurarTaller.presupuesto.resumen.diasHabiles': {
    llamar: (m) => m.configurarTaller.presupuesto.resumen.diasHabiles(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.presupuesto.resumen.meses': {
    llamar: (m) => m.configurarTaller.presupuesto.resumen.meses(37),
    tieneQueDecir: ['37'],
  },
  'configurarTaller.presupuesto.resumen.cuantosTextos': {
    llamar: (m) => m.configurarTaller.presupuesto.resumen.cuantosTextos(37, 41, 53),
    tieneQueDecir: ['37', '41', '53'],
  },
  'configurarTaller.cobro.dolarDeOtroDia': {
    llamar: (m) => m.configurarTaller.cobro.dolarDeOtroDia('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
};

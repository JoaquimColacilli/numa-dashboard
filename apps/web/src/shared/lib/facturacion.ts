import { UMBRAL_DE_IDENTIFICACION_CENTAVOS, type LoQueFaltaParaFacturar } from '@maun/domain';

import { enLista } from './idioma';
import { formatearPesos } from './plata';
import { textosDeLib } from './textos';

type DatoDelTaller = 'razonSocial' | 'domicilio' | 'ingresosBrutos' | 'inicio';

const DATO_DEL_TALLER: Readonly<Partial<Record<LoQueFaltaParaFacturar, DatoDelTaller>>> = {
  'taller-sin-razon-social': 'razonSocial',
  'taller-sin-domicilio': 'domicilio',
  'taller-sin-ingresos-brutos': 'ingresosBrutos',
  'taller-sin-inicio-de-actividades': 'inicio',
};

export type ClaveDeLoQueFalta =
  | Exclude<
      LoQueFaltaParaFacturar,
      | 'taller-sin-razon-social'
      | 'taller-sin-domicilio'
      | 'taller-sin-ingresos-brutos'
      | 'taller-sin-inicio-de-actividades'
    >
  | 'taller';

export interface FraseDeLoQueFalta {
  clave: ClaveDeLoQueFalta;
  texto: string;
}

export function frasesDeLoQueFaltaParaFacturar(
  codigos: readonly LoQueFaltaParaFacturar[],
  cliente: string | null,
): FraseDeLoQueFalta[] {
  const textos = textosDeLib().loQueFaltaParaFacturar;
  const quien = cliente === null || cliente.trim() === '' ? textos.tuCliente : cliente;
  const datosDelTaller = codigos.flatMap((codigo) => {
    const dato = DATO_DEL_TALLER[codigo];
    return dato === undefined ? [] : [textos.datosDelTaller[dato]];
  });
  const frases: FraseDeLoQueFalta[] = [];
  for (const codigo of codigos) {
    if (DATO_DEL_TALLER[codigo] !== undefined) {
      if (!frases.some((frase) => frase.clave === 'taller')) {
        frases.push({ clave: 'taller', texto: textos.taller(enLista(datosDelTaller)) });
      }
      continue;
    }
    switch (codigo) {
      case 'taller-no-monotributo':
        frases.push({ clave: codigo, texto: textos.tallerNoMonotributo });
        break;
      case 'pago-borrado':
        frases.push({ clave: codigo, texto: textos.pagoBorrado });
        break;
      case 'en-dolares':
        frases.push({ clave: codigo, texto: textos.enDolares });
        break;
      case 'de-la-apertura':
        frases.push({ clave: codigo, texto: textos.deLaApertura });
        break;
      case 'cliente-sin-cuit':
        frases.push({ clave: codigo, texto: textos.clienteSinCuit(quien) });
        break;
      case 'cliente-cuit-invalido':
        frases.push({ clave: codigo, texto: textos.clienteCuitInvalido(quien) });
        break;
      case 'cliente-sin-domicilio':
        frases.push({ clave: codigo, texto: textos.clienteSinDomicilio(quien) });
        break;
      case 'cliente-sin-dni':
        frases.push({
          clave: codigo,
          texto: textos.clienteSinDni(formatearPesos(UMBRAL_DE_IDENTIFICACION_CENTAVOS)),
        });
        break;
      default:
        break;
    }
  }
  return frases;
}

import {
  claveBancariaDe,
  digitosDeCbu,
  formatearCbu,
  formatearCuit,
  HOSTS_DE_MERCADO_PAGO,
  LARGO_MAXIMO_DEL_LINK,
  normalizarAlias,
  normalizarLinkDeCobro,
  revisarAlias,
  revisarCbu,
  revisarCuit,
  revisarLinkDeCobro,
} from '@maun/domain';

import type { CambiosDeAjustes, FilaDe } from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import { errorDelDolar } from '@/shared/ui';

export type CampoDeCobro =
  'alias' | 'cbu' | 'titular' | 'cuit' | 'link' | 'aliasEnDolares' | 'cbuEnDolares' | 'dolarDelDia';

export interface DatosDeCobro {
  alias: string;
  cbu: string;
  titular: string;
  cuit: string;
  link: string;
  aliasEnDolares: string;
  cbuEnDolares: string;
  dolarDelDia: number | null;
  dolarDelDiaEl: string | null;
}

export interface ErrorDeCobro {
  campo: CampoDeCobro;
  mensaje: string;
}

export const LARGO_DEL_TITULAR = 200;

type ColumnaQuePuedeFaltar =
  | 'cobro_link'
  | 'cobro_dolares_alias'
  | 'cobro_dolares_cbu'
  | 'dolar_del_dia_centavos'
  | 'dolar_del_dia_el';

export type AjustesGuardados = Omit<FilaDe<'ajustes'>, ColumnaQuePuedeFaltar> &
  Partial<Pick<FilaDe<'ajustes'>, ColumnaQuePuedeFaltar>>;

export function cobroDeLosAjustes(ajustes: AjustesGuardados): DatosDeCobro {
  return {
    alias: ajustes.cobro_alias,
    cbu: formatearCbu(ajustes.cobro_cbu),
    titular: ajustes.cobro_titular,
    cuit: ajustes.cobro_cuit,
    link: ajustes.cobro_link ?? '',
    aliasEnDolares: ajustes.cobro_dolares_alias ?? '',
    cbuEnDolares: formatearCbu(ajustes.cobro_dolares_cbu ?? ''),
    dolarDelDia: ajustes.dolar_del_dia_centavos ?? null,
    dolarDelDiaEl: ajustes.dolar_del_dia_el ?? null,
  };
}

export function cambiosDeCobro(datos: DatosDeCobro): CambiosDeAjustes {
  return {
    cobro_alias: normalizarAlias(datos.alias),
    cobro_cbu: digitosDeCbu(datos.cbu),
    cobro_titular: datos.titular.trim(),
    cobro_cuit: formatearCuit(datos.cuit),
    cobro_link: normalizarLinkDeCobro(datos.link),
    cobro_dolares_alias: normalizarAlias(datos.aliasEnDolares),
    cobro_dolares_cbu: digitosDeCbu(datos.cbuEnDolares),
    dolar_del_dia_centavos: datos.dolarDelDia,
    dolar_del_dia_el: datos.dolarDelDia === null ? null : datos.dolarDelDiaEl,
  };
}

function errorDelAlias(
  alias: string,
  campo: 'alias' | 'aliasEnDolares' = 'alias',
): ErrorDeCobro | null {
  const revision = revisarAlias(alias);
  if (revision.estado !== 'invalido') return null;
  const { errores } = mensajes().configurarTaller.cobro;
  return {
    campo,
    mensaje:
      revision.motivo === 'caracteres' ? errores.aliasConOtrosCaracteres : errores.aliasDeOtroLargo,
  };
}

function errorDelCbu(cbu: string, campo: 'cbu' | 'cbuEnDolares' = 'cbu'): ErrorDeCobro | null {
  const revision = revisarCbu(cbu);
  if (revision.estado !== 'invalido') return null;
  const { errores } = mensajes().configurarTaller.cobro;
  return {
    campo,
    mensaje:
      revision.motivo === 'largo'
        ? errores.cbuDeOtroLargo
        : revision.motivo === 'banco'
          ? errores.cbuConOtroBanco
          : errores.cbuConOtraCuenta,
  };
}

function errorDelCuit(cuit: string): ErrorDeCobro | null {
  const revision = revisarCuit(cuit);
  if (revision.estado !== 'invalido' || revision.motivo !== 'largo') return null;
  return {
    campo: 'cuit',
    mensaje: mensajes().configurarTaller.errorDelCuit,
  };
}

function errorDelTitular(titular: string): ErrorDeCobro | null {
  if (titular.trim().length <= LARGO_DEL_TITULAR) return null;
  return {
    campo: 'titular',
    mensaje: mensajes().configurarTaller.cobro.errores.titularLargo(LARGO_DEL_TITULAR),
  };
}

function errorDelLink(link: string): ErrorDeCobro | null {
  const revision = revisarLinkDeCobro(link);
  if (revision.estado !== 'invalido') return null;
  const { errores } = mensajes().configurarTaller.cobro;
  return {
    campo: 'link',
    mensaje:
      revision.motivo === 'largo'
        ? errores.linkLargo(LARGO_MAXIMO_DEL_LINK)
        : revision.motivo === 'sin-https'
          ? errores.linkSinHttps
          : errores.linkDeOtroSitio(HOSTS_DE_MERCADO_PAGO.join(', ')),
  };
}

function errorDelDolarDelDia(valor: number | null): ErrorDeCobro | null {
  const mensaje = errorDelDolar(valor, false);
  return mensaje === undefined ? null : { campo: 'dolarDelDia', mensaje };
}

export function errorDeCobro(datos: DatosDeCobro): ErrorDeCobro | null {
  return (
    errorDelAlias(datos.alias) ??
    errorDelCbu(datos.cbu) ??
    errorDelTitular(datos.titular) ??
    errorDelCuit(datos.cuit) ??
    errorDelLink(datos.link) ??
    errorDelAlias(datos.aliasEnDolares, 'aliasEnDolares') ??
    errorDelCbu(datos.cbuEnDolares, 'cbuEnDolares') ??
    errorDelDolarDelDia(datos.dolarDelDia)
  );
}

export function avisoDelAlias(alias: string): string | undefined {
  const revision = revisarAlias(alias);
  if (revision.estado !== 'valido' || revision.aviso === null) return undefined;
  const { avisos } = mensajes().configurarTaller.cobro;
  return revision.aviso === 'separador-en-la-punta'
    ? avisos.aliasConSeparadorEnLaPunta
    : avisos.aliasConSeparadoresSeguidos;
}

export function avisoDelCuitDelTaller(cuit: string): string | undefined {
  const revision = revisarCuit(cuit);
  const { avisos } = mensajes().configurarTaller.cobro;
  if (revision.estado === 'ambiguo') return avisos.cuitAmbiguo;
  if (revision.estado === 'invalido' && revision.motivo === 'prefijo') {
    return avisos.cuitConOtroPrefijo;
  }
  if (revision.estado === 'invalido' && revision.motivo === 'verificador') {
    return avisos.cuitConOtroVerificador;
  }
  return undefined;
}

export function etiquetaDeLaClave(cbu: string): string {
  const textos = mensajes().configurarTaller.cobro;
  return revisarCbu(cbu).estado === 'valido' && claveBancariaDe(cbu) === 'cvu'
    ? textos.cvuDeLaBilletera
    : textos.cbuOCvu;
}

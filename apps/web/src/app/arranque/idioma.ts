import { IDIOMA_BASE, idiomaDeLaEtiqueta, idiomaDelNavegador, type Idioma } from '@maun/domain';

import { claimsGuardados } from '@/shared/api';
import { esUnaPaginaPublica, estadoDelSeudoidioma, idiomaGuardadoDe } from '@/shared/lib';

export const ATRIBUTO_DEL_IDIOMA_DEL_TALLER = 'data-idioma-del-taller';

function delNavegadorDeEsteAparato(): Idioma {
  const preferidos = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  return idiomaDelNavegador(preferidos);
}

export function idiomaAlArrancar(ruta: string): Idioma {
  if (esUnaPaginaPublica(ruta)) {
    const raiz = document.documentElement;
    if (raiz.hasAttribute(ATRIBUTO_DEL_IDIOMA_DEL_TALLER)) {
      return idiomaDeLaEtiqueta(raiz.lang) ?? IDIOMA_BASE;
    }
    return delNavegadorDeEsteAparato();
  }
  const sesion = claimsGuardados();
  if (sesion === undefined) return delNavegadorDeEsteAparato();
  return idiomaGuardadoDe(sesion.usuarioId) ?? sesion.idioma ?? IDIOMA_BASE;
}

export function seudoidiomaAlArrancar(ruta: string): boolean {
  return !esUnaPaginaPublica(ruta) && estadoDelSeudoidioma() === 'activo';
}

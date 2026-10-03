import type { Idioma } from '@maun/domain';

import { useElIdiomaDelClienteSiHay } from '@/shared/idioma-del-cliente';

import type { Mensajes } from './es';
import { useIdioma, useMensajes } from './mensajes';

export type TextosDeLaUiQueVeElCliente = Pick<
  Mensajes['ui'],
  'hoja' | 'copiar' | 'rotulo' | 'visor'
>;

export function useTextosDeLaUi(): TextosDeLaUiQueVeElCliente {
  const app = useMensajes().ui;
  const delCliente = useElIdiomaDelClienteSiHay();
  return delCliente === null ? app : delCliente.m.ui;
}

export function useIdiomaDeLaUi(): Idioma {
  const app = useIdioma();
  const delCliente = useElIdiomaDelClienteSiHay();
  return delCliente === null ? app : delCliente.idioma;
}

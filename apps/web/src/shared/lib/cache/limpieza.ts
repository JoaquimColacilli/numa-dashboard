import type { QueryClient } from '@tanstack/react-query';

import { olvidarLosTokens } from '../enlaces';
import { olvidarBloqueo } from '../huella';
import { olvidarElIdioma } from '../idioma';
import { borrarCacheLocal } from './persister';

export async function limpiarDatosLocales(queryClient: QueryClient): Promise<void> {
  olvidarBloqueo();
  olvidarElIdioma();
  olvidarLosTokens();
  queryClient.getMutationCache().clear();
  queryClient.clear();
  await borrarCacheLocal();
}

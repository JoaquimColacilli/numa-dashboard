import { idiomaLeido, type Idioma } from '@maun/domain';

import { ajustesDe, type Replica } from '@/shared/api';

export function idiomaDeLosClientes(replica: Replica | undefined): Idioma {
  const ajustes = replica === undefined ? undefined : ajustesDe(replica);
  return idiomaLeido(
    (ajustes as { idioma_de_los_clientes?: unknown } | undefined)?.idioma_de_los_clientes,
  );
}

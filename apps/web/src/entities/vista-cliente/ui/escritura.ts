import { useFormatosDelCliente, useMensajesDelCliente } from '@/shared/idioma-del-cliente';

import type { Escritura } from '../model/textos';

export function useEscritura(hoy: string): Escritura {
  const t = useMensajesDelCliente().vista;
  const f = useFormatosDelCliente();
  return { t, f, hoy };
}

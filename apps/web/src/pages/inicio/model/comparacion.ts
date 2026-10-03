import type { Money } from '@maun/domain';

import type { Mensajes } from '@/shared/idioma';
import { mesAnterior, mesEnUnaFrase } from '@/shared/lib';

export function comparacionConElMesAnterior(
  valor: Money,
  previo: Money,
  mes: string,
  textos: Mensajes['paginaInicio'],
): string {
  if (previo <= 0) return '';
  const variacion = Math.round(((valor - previo) / previo) * 100);
  const anterior = mesEnUnaFrase(mesAnterior(mes));
  return variacion >= 0
    ? textos.comparacion.subio(Math.abs(variacion), anterior)
    : textos.comparacion.bajo(Math.abs(variacion), anterior);
}

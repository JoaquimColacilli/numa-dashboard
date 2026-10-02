import { primeraPalabra } from '@maun/domain';

import { mensajes } from '@/shared/idioma';

const NOMBRADOS_COMO_MUCHO = 3;

export function quienesOpinaron(nombres: readonly string[]): string {
  const { lista, perfil } = mensajes().paginaInicio;
  const unicos = [...new Set(nombres.map(primeraPalabra).filter((nombre) => nombre !== ''))];
  const [primero] = unicos;
  if (primero === undefined) return '';
  if (unicos.length === 1) return perfil.opino(primero);
  const nombrados =
    unicos.length <= NOMBRADOS_COMO_MUCHO
      ? unicos
      : [...unicos.slice(0, 2), perfil.yMas(unicos.length - 2)];
  return perfil.opinaron(lista(nombrados));
}

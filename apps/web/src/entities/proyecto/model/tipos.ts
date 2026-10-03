import { claveDelNombre } from '@maun/domain';

import { mensajes, textosDelIdioma } from '@/shared/idioma';
import { compararTextos } from '@/shared/lib';

import type { Proyecto } from './catalogos';
import { tipoDelTrabajo } from './entrega';

const DE_ARRANQUE = [
  'cocina',
  'placard',
  'vestidor',
  'vanitory',
  'muebleDeTv',
  'biblioteca',
  'escritorio',
] as const;

export const TIPOS_DE_ARRANQUE: readonly string[] = textosDelIdioma(() =>
  DE_ARRANQUE.map((tipo) => mensajes().proyecto.tiposDeArranque[tipo]),
);

export function tiposParaSugerir(proyectos: readonly Proyecto[]): string[] {
  const cuantos = new Map<string, { nombre: string; veces: number }>();
  for (const proyecto of proyectos) {
    const tipo = tipoDelTrabajo(proyecto)?.trim() ?? '';
    if (tipo === '') continue;
    const clave = claveDelNombre(tipo);
    const previo = cuantos.get(clave);
    cuantos.set(clave, { nombre: previo?.nombre ?? tipo, veces: (previo?.veces ?? 0) + 1 });
  }
  const usados = [...cuantos.values()]
    .sort((uno, otro) => otro.veces - uno.veces || compararTextos(uno.nombre, otro.nombre))
    .map((tipo) => tipo.nombre);
  const deArranque = TIPOS_DE_ARRANQUE.filter((tipo) => !cuantos.has(claveDelNombre(tipo)));
  return [...usados, ...deArranque];
}

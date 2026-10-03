import { RUTA_DE_LAS_ESTADISTICAS } from '@/shared/lib';
import type { NombreDeIcono } from '@/shared/ui';

export type IdDeSeccion =
  | 'inicio'
  | 'agenda'
  | 'consultas'
  | 'proyectos'
  | 'clientes'
  | 'finanzas'
  | 'tesoros'
  | 'opiniones'
  | 'diezmo'
  | 'estadisticas'
  | 'ajustes';

export interface Destino {
  id: IdDeSeccion;
  ruta: string;
  icono: NombreDeIcono;
  alternativa?: IdDeSeccion;
}

export const DESTINOS: Readonly<Record<IdDeSeccion, Destino>> = {
  inicio: { id: 'inicio', ruta: '/', icono: 'house' },
  agenda: { id: 'agenda', ruta: '/agenda', icono: 'calendar-days', alternativa: 'inicio' },
  consultas: { id: 'consultas', ruta: '/consultas', icono: 'route', alternativa: 'proyectos' },
  proyectos: { id: 'proyectos', ruta: '/proyectos', icono: 'folder-kanban' },
  clientes: { id: 'clientes', ruta: '/clientes', icono: 'users' },
  finanzas: { id: 'finanzas', ruta: '/finanzas', icono: 'wallet' },
  tesoros: { id: 'tesoros', ruta: '/tesoros', icono: 'gem', alternativa: 'inicio' },
  opiniones: {
    id: 'opiniones',
    ruta: '/opiniones',
    icono: 'message-square-quote',
    alternativa: 'inicio',
  },
  diezmo: { id: 'diezmo', ruta: '/diezmo', icono: 'church', alternativa: 'inicio' },
  estadisticas: {
    id: 'estadisticas',
    ruta: RUTA_DE_LAS_ESTADISTICAS,
    icono: 'chart-no-axes-column',
    alternativa: 'inicio',
  },
  ajustes: { id: 'ajustes', ruta: '/ajustes', icono: 'settings', alternativa: 'inicio' },
};

export const NAV_MOVIL: readonly IdDeSeccion[] = ['inicio', 'proyectos', 'clientes', 'finanzas'];

export const NAV_TABLET: readonly IdDeSeccion[] = [
  'inicio',
  'agenda',
  'proyectos',
  'clientes',
  'finanzas',
  'tesoros',
  'opiniones',
  'diezmo',
  'estadisticas',
];

export const NAV_ESCRITORIO: readonly IdDeSeccion[] = [
  'inicio',
  'agenda',
  'consultas',
  'proyectos',
  'clientes',
  'finanzas',
  'tesoros',
  'opiniones',
  'diezmo',
  'estadisticas',
  'ajustes',
];

export type IdDeAccion = 'anotar' | 'movimiento' | 'cobro' | 'proyectoNuevo' | 'consultaNueva';

export interface AccionRapida {
  id: IdDeAccion;
  icono: NombreDeIcono;
  ruta: string;
}

export const ACCIONES_RAPIDAS: readonly AccionRapida[] = [
  { id: 'anotar', icono: 'pencil-line', ruta: '/agenda/anotar' },
  { id: 'movimiento', icono: 'arrow-left-right', ruta: '/finanzas/nuevo' },
  { id: 'cobro', icono: 'hand-coins', ruta: '/proyectos' },
  { id: 'proyectoNuevo', icono: 'folder-plus', ruta: '/proyectos/nuevo' },
  { id: 'consultaNueva', icono: 'user-plus', ruta: '/consultas/nueva' },
];

export function seccionDeLaRuta(ruta: string): IdDeSeccion {
  for (const destino of Object.values(DESTINOS)) {
    if (destino.ruta === '/') continue;
    if (ruta === destino.ruta || ruta.startsWith(`${destino.ruta}/`)) return destino.id;
  }
  return 'inicio';
}

export function destinoResaltado(
  seccion: IdDeSeccion,
  visibles: readonly IdDeSeccion[],
): IdDeSeccion | undefined {
  if (visibles.includes(seccion)) return seccion;
  const alternativa = DESTINOS[seccion].alternativa;
  return alternativa !== undefined && visibles.includes(alternativa) ? alternativa : undefined;
}

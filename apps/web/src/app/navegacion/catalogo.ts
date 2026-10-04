import { matchPath } from 'react-router';

import { mensajes, type Mensajes } from '@/shared/idioma';

export type Forma = 'pantalla' | 'capa' | 'hoja';

export type NombreDeLaPantalla = keyof Mensajes['appNavegacion']['pantallas'];

export type SeccionDelCelular = 'inicio' | 'proyectos' | 'clientes' | 'finanzas';

export type GrupoDePestanas = 'proyectos' | 'opiniones';

export interface Pantalla {
  id: string;
  patron: string;
  etapa?: string | null;
  nombre: NombreDeLaPantalla;
  seccion: SeccionDelCelular;
  raiz: boolean;
  profundidad: number;
  forma: Forma;
  pestana?: { grupo: GrupoDePestanas; orden: number };
  indice?: true;
  redireccion?: true;
}

export const CATALOGO: readonly Pantalla[] = [
  {
    id: 'inicio',
    patron: '/',
    nombre: 'inicio',
    seccion: 'inicio',
    raiz: true,
    profundidad: 0,
    forma: 'pantalla',
    indice: true,
  },
  {
    id: 'agenda',
    patron: '/agenda',
    nombre: 'agenda',
    seccion: 'inicio',
    raiz: false,
    profundidad: 1,
    forma: 'pantalla',
  },
  {
    id: 'anotar',
    patron: '/agenda/anotar',
    nombre: 'agenda',
    seccion: 'inicio',
    raiz: false,
    profundidad: 1,
    forma: 'hoja',
  },
  {
    id: 'consultas',
    patron: '/consultas',
    nombre: 'consultas',
    seccion: 'proyectos',
    raiz: true,
    profundidad: 0,
    forma: 'pantalla',
    pestana: { grupo: 'proyectos', orden: 0 },
  },
  {
    id: 'consulta-nueva',
    patron: '/consultas/nueva',
    nombre: 'consultas',
    seccion: 'proyectos',
    raiz: false,
    profundidad: 0,
    forma: 'hoja',
  },
  {
    id: 'seguimiento-viejo',
    patron: '/seguimiento',
    nombre: 'consultas',
    seccion: 'proyectos',
    raiz: false,
    profundidad: 0,
    forma: 'pantalla',
    redireccion: true,
  },
  {
    id: 'seguimiento-nuevo-viejo',
    patron: '/seguimiento/nuevo',
    nombre: 'consultas',
    seccion: 'proyectos',
    raiz: false,
    profundidad: 0,
    forma: 'pantalla',
    redireccion: true,
  },
  {
    id: 'seguimiento',
    patron: '/proyectos',
    etapa: 'seguimiento',
    nombre: 'seguimiento',
    seccion: 'proyectos',
    raiz: true,
    profundidad: 0,
    forma: 'pantalla',
    pestana: { grupo: 'proyectos', orden: 1 },
  },
  {
    id: 'activos',
    patron: '/proyectos',
    etapa: null,
    nombre: 'proyectos',
    seccion: 'proyectos',
    raiz: true,
    profundidad: 0,
    forma: 'pantalla',
    pestana: { grupo: 'proyectos', orden: 2 },
  },
  {
    id: 'historial',
    patron: '/proyectos',
    etapa: 'historial',
    nombre: 'historial',
    seccion: 'proyectos',
    raiz: true,
    profundidad: 0,
    forma: 'pantalla',
    pestana: { grupo: 'proyectos', orden: 3 },
  },
  {
    id: 'proyecto-nuevo',
    patron: '/proyectos/nuevo',
    nombre: 'proyectoNuevo',
    seccion: 'proyectos',
    raiz: false,
    profundidad: 1,
    forma: 'capa',
  },
  {
    id: 'analitico',
    patron: '/proyectos/analitico',
    nombre: 'analitico',
    seccion: 'proyectos',
    raiz: false,
    profundidad: 1,
    forma: 'pantalla',
  },
  {
    id: 'ficha',
    patron: '/proyectos/:id',
    nombre: 'proyectos',
    seccion: 'proyectos',
    raiz: false,
    profundidad: 1,
    forma: 'pantalla',
  },
  {
    id: 'editar',
    patron: '/proyectos/:id/editar',
    nombre: 'editarProyecto',
    seccion: 'proyectos',
    raiz: false,
    profundidad: 2,
    forma: 'capa',
  },
  {
    id: 'presupuesto',
    patron: '/proyectos/:id/presupuesto',
    nombre: 'presupuesto',
    seccion: 'proyectos',
    raiz: false,
    profundidad: 2,
    forma: 'capa',
  },
  {
    id: 'aprobar',
    patron: '/proyectos/:id/aprobar',
    nombre: 'aprobar',
    seccion: 'proyectos',
    raiz: false,
    profundidad: 2,
    forma: 'pantalla',
  },
  {
    id: 'compartir',
    patron: '/proyectos/:id/compartir',
    nombre: 'mostrarleAlCliente',
    seccion: 'proyectos',
    raiz: false,
    profundidad: 2,
    forma: 'pantalla',
  },
  {
    id: 'vista-cliente',
    patron: '/proyectos/:id/vista-cliente',
    nombre: 'loQueVeElCliente',
    seccion: 'proyectos',
    raiz: false,
    profundidad: 3,
    forma: 'pantalla',
  },
  {
    id: 'cobrar',
    patron: '/proyectos/:id/cobrar',
    nombre: 'cobrar',
    seccion: 'proyectos',
    raiz: false,
    profundidad: 2,
    forma: 'pantalla',
  },
  {
    id: 'cerrar',
    patron: '/proyectos/:id/cerrar',
    nombre: 'darPorPerdido',
    seccion: 'proyectos',
    raiz: false,
    profundidad: 2,
    forma: 'pantalla',
  },
  {
    id: 'clientes',
    patron: '/clientes',
    nombre: 'clientes',
    seccion: 'clientes',
    raiz: true,
    profundidad: 0,
    forma: 'pantalla',
  },
  {
    id: 'cliente',
    patron: '/clientes/:id',
    nombre: 'clientes',
    seccion: 'clientes',
    raiz: false,
    profundidad: 1,
    forma: 'pantalla',
  },
  {
    id: 'finanzas',
    patron: '/finanzas',
    nombre: 'finanzas',
    seccion: 'finanzas',
    raiz: true,
    profundidad: 0,
    forma: 'pantalla',
  },
  {
    id: 'movimiento-nuevo',
    patron: '/finanzas/nuevo',
    nombre: 'finanzas',
    seccion: 'finanzas',
    raiz: false,
    profundidad: 0,
    forma: 'hoja',
  },
  {
    id: 'movimiento',
    patron: '/finanzas/:id',
    nombre: 'finanzas',
    seccion: 'finanzas',
    raiz: false,
    profundidad: 0,
    forma: 'hoja',
  },
  {
    id: 'tesoros',
    patron: '/tesoros',
    nombre: 'tesoros',
    seccion: 'inicio',
    raiz: false,
    profundidad: 1,
    forma: 'pantalla',
  },
  {
    id: 'resultados',
    patron: '/opiniones',
    nombre: 'opiniones',
    seccion: 'inicio',
    raiz: false,
    profundidad: 1,
    forma: 'pantalla',
    pestana: { grupo: 'opiniones', orden: 0 },
  },
  {
    id: 'preguntas',
    patron: '/opiniones/preguntas',
    nombre: 'opiniones',
    seccion: 'inicio',
    raiz: false,
    profundidad: 1,
    forma: 'pantalla',
    pestana: { grupo: 'opiniones', orden: 1 },
  },
  {
    id: 'diezmo',
    patron: '/diezmo',
    nombre: 'diezmo',
    seccion: 'inicio',
    raiz: false,
    profundidad: 1,
    forma: 'pantalla',
  },
  {
    id: 'estadisticas',
    patron: '/estadisticas',
    nombre: 'estadisticas',
    seccion: 'inicio',
    raiz: false,
    profundidad: 1,
    forma: 'pantalla',
  },
  {
    id: 'ajustes',
    patron: '/ajustes',
    nombre: 'ajustes',
    seccion: 'inicio',
    raiz: false,
    profundidad: 1,
    forma: 'pantalla',
  },
  {
    id: 'avisos',
    patron: '/ajustes/avisos',
    nombre: 'avisos',
    seccion: 'inicio',
    raiz: false,
    profundidad: 2,
    forma: 'pantalla',
  },
  {
    id: 'presupuesto-del-taller',
    patron: '/ajustes/presupuesto',
    nombre: 'tuPresupuesto',
    seccion: 'inicio',
    raiz: false,
    profundidad: 2,
    forma: 'pantalla',
  },
  {
    id: 'facturacion',
    patron: '/ajustes/facturacion',
    nombre: 'facturacion',
    seccion: 'inicio',
    raiz: false,
    profundidad: 2,
    forma: 'pantalla',
  },
  {
    id: 'conectar-con-arca',
    patron: '/ajustes/facturacion/conectar',
    nombre: 'conectarConArca',
    seccion: 'inicio',
    raiz: false,
    profundidad: 3,
    forma: 'pantalla',
  },
];

const ESPECIFICAS_PRIMERO = [...CATALOGO].sort(
  (una, otra) => Number(una.patron.includes(':')) - Number(otra.patron.includes(':')),
);

export interface Direccion {
  pathname: string;
  search: string;
}

export function direccionDe(url: string): Direccion {
  const sinHash = url.split('#')[0] ?? url;
  const [pathname = '/', busqueda = ''] = sinHash.split('?');
  return {
    pathname: pathname === '' ? '/' : pathname,
    search: busqueda === '' ? '' : `?${busqueda}`,
  };
}

export function pantallaDe(url: string): Pantalla | undefined {
  const { pathname, search } = direccionDe(url);
  const etapa = new URLSearchParams(search).get('etapa');
  return ESPECIFICAS_PRIMERO.find((pantalla) => {
    if (matchPath({ path: pantalla.patron, end: true }, pathname) === null) return false;
    if (pantalla.etapa === undefined) return true;
    const pedida = etapa === 'seguimiento' || etapa === 'historial' ? etapa : null;
    return pantalla.etapa === pedida;
  });
}

export function proyectoDeLaFicha(url: string): string | null {
  const pantalla = pantallaDe(url);
  if (pantalla?.id !== 'ficha') return null;
  return matchPath(pantalla.patron, direccionDe(url).pathname)?.params.id ?? null;
}

export function nombreDeLaPantalla(pantalla: Pantalla): string {
  return mensajes().appNavegacion.pantallas[pantalla.nombre];
}

export function nombreDe(url: string): string | undefined {
  const pantalla = pantallaDe(url);
  return pantalla === undefined ? undefined : nombreDeLaPantalla(pantalla);
}

export function esLaMismaPantalla(una: string, otra: string): boolean {
  const primera = pantallaDe(una);
  return primera !== undefined && primera.id === pantallaDe(otra)?.id;
}

export function sonPestanasDelMismoGrupo(una: string, otra: string): boolean {
  const primera = pantallaDe(una)?.pestana;
  const segunda = pantallaDe(otra)?.pestana;
  return (
    primera !== undefined &&
    segunda !== undefined &&
    primera.grupo === segunda.grupo &&
    primera.orden !== segunda.orden
  );
}

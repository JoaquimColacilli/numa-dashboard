import { mensajes, type Mensajes } from '@/shared/idioma';

export type LugarDeLaZona = keyof Mensajes['recibirAvisos']['zonas'];

export interface ZonaHoraria {
  id: string;
  lugar: LugarDeLaZona;
}

export interface OpcionDeZona {
  id: string;
  etiqueta: string;
}

export const ZONAS_HORARIAS: readonly ZonaHoraria[] = [
  { id: 'America/Argentina/Buenos_Aires', lugar: 'argentina' },
  { id: 'America/Argentina/Cordoba', lugar: 'cordoba' },
  { id: 'America/Montevideo', lugar: 'uruguay' },
  { id: 'America/Santiago', lugar: 'chile' },
  { id: 'America/La_Paz', lugar: 'bolivia' },
  { id: 'Europe/Madrid', lugar: 'espana' },
];

export function desfaseDeLaZona(zona: string, ahora: Date): string {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zona,
    timeZoneName: 'shortOffset',
  }).formatToParts(ahora);
  const desfase = partes.find((parte) => parte.type === 'timeZoneName')?.value ?? 'GMT';
  return desfase.replace('-', '−');
}

export function opcionesDeZona(guardada: string | null, ahora: Date): OpcionDeZona[] {
  const textos = mensajes().recibirAvisos;
  const conocidas = ZONAS_HORARIAS.map((zona) => ({
    id: zona.id,
    lugar: textos.zonas[zona.lugar],
  }));
  const conocida = guardada === null || ZONAS_HORARIAS.some((zona) => zona.id === guardada);
  const zonas = conocida
    ? conocidas
    : [...conocidas, { id: guardada, lugar: guardada.replaceAll('_', ' ') }];
  return zonas.map((zona) => ({
    id: zona.id,
    etiqueta: textos.zonaConDesfase({
      lugar: zona.lugar,
      desfase: desfaseDeLaZona(zona.id, ahora),
    }),
  }));
}

export type RedDelTaller = 'instagram' | 'facebook' | 'tiktok';

export const REDES_DEL_TALLER: readonly RedDelTaller[] = ['instagram', 'facebook', 'tiktok'];

export const TOPE_DE_LA_VIDRIERA = 12;

export const SEGMENTOS_QUE_NO_SON_UN_PERFIL: Readonly<Record<RedDelTaller, readonly string[]>> = {
  instagram: ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct', 'tv'],
  facebook: [
    'share',
    'sharer.php',
    'people',
    'story.php',
    'photo.php',
    'permalink.php',
    'groups',
    'events',
    'watch',
    'marketplace',
    'login',
    'profile.php',
  ],
  tiktok: [],
};

export type MotivoDeLaRed = 'otra-red' | 'no-es-un-perfil' | 'usuario';

export type RevisionDeLaRed =
  | { estado: 'vacio' }
  | { estado: 'valido'; link: string }
  | { estado: 'invalido'; motivo: MotivoDeLaRed };

type Lectura =
  | { tipo: 'vacio' }
  | { tipo: 'usuario'; usuario: string }
  | { tipo: 'link'; host: string; segmentos: readonly string[]; consulta: string };

const LINK = /^(?:https?:\/\/)?([^/?#\s]+)(\/[^?#\s]*)?(?:\?([^#\s]*))?(?:#\S*)?$/i;
const CON_ESQUEMA = /^https?:\/\//i;
const HOST_DE_UNA_RED = /^(?:[a-z0-9-]+\.)*(?:instagram|facebook|tiktok)\.com$/i;

const USUARIO_DE_INSTAGRAM = /^[a-z0-9._]{1,30}$/;
const USUARIO_DE_TIKTOK = /^[a-z0-9._]{2,24}$/;
const NOMBRE_DE_FACEBOOK = /^[a-z0-9.]{5,50}$/;
const ID_DE_FACEBOOK = /^[0-9]{5,20}$/;

const HOSTS_DE_INSTAGRAM = ['instagram.com', 'www.instagram.com'];
const HOSTS_DE_TIKTOK = ['tiktok.com', 'www.tiktok.com'];
const LINKS_CORTOS_DE_TIKTOK = ['vm.tiktok.com', 'vt.tiktok.com'];
const HOSTS_DE_FACEBOOK = [
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'web.facebook.com',
];

const LINK_DE_INSTAGRAM = /^https:\/\/www\.instagram\.com\/([a-z0-9._]{1,30})\/$/;
const LINK_DE_TIKTOK = /^https:\/\/www\.tiktok\.com\/@([a-z0-9._]{2,24})$/;
const LINK_DE_FACEBOOK = /^https:\/\/www\.facebook\.com\/([a-z0-9.]{5,50})$/;
const PERFIL_DE_FACEBOOK_POR_ID = /^https:\/\/www\.facebook\.com\/profile\.php\?id=[0-9]{5,20}$/;

const VACIO: RevisionDeLaRed = { estado: 'vacio' };

function invalido(motivo: MotivoDeLaRed): RevisionDeLaRed {
  return { estado: 'invalido', motivo };
}

function leer(texto: string): Lectura {
  const limpio = texto.trim();
  if (limpio === '') return { tipo: 'vacio' };
  if (limpio.startsWith('@')) return { tipo: 'usuario', usuario: limpio.slice(1).toLowerCase() };
  const partes = LINK.exec(limpio);
  if (partes === null) return { tipo: 'usuario', usuario: limpio.toLowerCase() };
  const host = String(partes[1]).toLowerCase();
  const camino = partes[2];
  if (!CON_ESQUEMA.test(limpio) && camino === undefined && !HOST_DE_UNA_RED.test(host)) {
    return { tipo: 'usuario', usuario: limpio.toLowerCase() };
  }
  return {
    tipo: 'link',
    host,
    segmentos: (camino ?? '').split('/').filter((segmento) => segmento !== ''),
    consulta: partes[3] ?? '',
  };
}

function noEsUnPerfil(red: RedDelTaller, segmento: string): boolean {
  return SEGMENTOS_QUE_NO_SON_UN_PERFIL[red].includes(segmento);
}

export function revisarInstagram(texto: string): RevisionDeLaRed {
  const lectura = leer(texto);
  if (lectura.tipo === 'vacio') return VACIO;
  let usuario = lectura.tipo === 'usuario' ? lectura.usuario : '';
  if (lectura.tipo === 'link') {
    if (!HOSTS_DE_INSTAGRAM.includes(lectura.host)) return invalido('otra-red');
    usuario = (lectura.segmentos[0] ?? '').toLowerCase();
  }
  if (noEsUnPerfil('instagram', usuario)) return invalido('no-es-un-perfil');
  if (!USUARIO_DE_INSTAGRAM.test(usuario)) return invalido('usuario');
  return { estado: 'valido', link: `https://www.instagram.com/${usuario}/` };
}

export function revisarTiktok(texto: string): RevisionDeLaRed {
  const lectura = leer(texto);
  if (lectura.tipo === 'vacio') return VACIO;
  let usuario = lectura.tipo === 'usuario' ? lectura.usuario : '';
  if (lectura.tipo === 'link') {
    if (LINKS_CORTOS_DE_TIKTOK.includes(lectura.host)) return invalido('no-es-un-perfil');
    if (!HOSTS_DE_TIKTOK.includes(lectura.host)) return invalido('otra-red');
    const [primero = '', ...resto] = lectura.segmentos;
    if (primero === '') return invalido('usuario');
    if (!primero.startsWith('@') || resto.length > 0) return invalido('no-es-un-perfil');
    usuario = primero.slice(1).toLowerCase();
  }
  if (!USUARIO_DE_TIKTOK.test(usuario)) return invalido('usuario');
  return { estado: 'valido', link: `https://www.tiktok.com/@${usuario}` };
}

function idDelPerfil(consulta: string): string {
  const par = consulta.split('&').find((uno) => uno.toLowerCase().startsWith('id='));
  return par === undefined ? '' : par.slice(3);
}

export function revisarFacebook(texto: string): RevisionDeLaRed {
  const lectura = leer(texto);
  if (lectura.tipo === 'vacio') return VACIO;
  let nombre = lectura.tipo === 'usuario' ? lectura.usuario : '';
  if (lectura.tipo === 'link') {
    if (!HOSTS_DE_FACEBOOK.includes(lectura.host)) return invalido('otra-red');
    const [primero = '', ...resto] = lectura.segmentos.map((segmento) => segmento.toLowerCase());
    if (primero === 'profile.php' && resto.length === 0) {
      const id = idDelPerfil(lectura.consulta);
      return ID_DE_FACEBOOK.test(id)
        ? { estado: 'valido', link: `https://www.facebook.com/profile.php?id=${id}` }
        : invalido('usuario');
    }
    if (noEsUnPerfil('facebook', primero) || resto.length > 0) return invalido('no-es-un-perfil');
    nombre = primero;
  }
  if (ID_DE_FACEBOOK.test(nombre)) {
    return { estado: 'valido', link: `https://www.facebook.com/profile.php?id=${nombre}` };
  }
  if (noEsUnPerfil('facebook', nombre)) return invalido('no-es-un-perfil');
  if (!NOMBRE_DE_FACEBOOK.test(nombre)) return invalido('usuario');
  return { estado: 'valido', link: `https://www.facebook.com/${nombre}` };
}

const REVISAR: Readonly<Record<RedDelTaller, (texto: string) => RevisionDeLaRed>> = {
  instagram: revisarInstagram,
  facebook: revisarFacebook,
  tiktok: revisarTiktok,
};

export function revisarLaRed(red: RedDelTaller, texto: string): RevisionDeLaRed {
  return REVISAR[red](texto);
}

export function normalizarLaRed(red: RedDelTaller, texto: string): string {
  const revision = revisarLaRed(red, texto);
  if (revision.estado === 'valido') return revision.link;
  return revision.estado === 'vacio' ? '' : texto.trim();
}

export function esLinkDeInstagram(texto: string): boolean {
  const usuario = LINK_DE_INSTAGRAM.exec(texto)?.[1];
  return usuario !== undefined && !noEsUnPerfil('instagram', usuario);
}

export function esLinkDeTiktok(texto: string): boolean {
  return LINK_DE_TIKTOK.test(texto);
}

export function esLinkDeFacebook(texto: string): boolean {
  if (PERFIL_DE_FACEBOOK_POR_ID.test(texto)) return true;
  const nombre = LINK_DE_FACEBOOK.exec(texto)?.[1];
  return nombre !== undefined && !noEsUnPerfil('facebook', nombre);
}

const ES_LINK_DE: Readonly<Record<RedDelTaller, (texto: string) => boolean>> = {
  instagram: esLinkDeInstagram,
  facebook: esLinkDeFacebook,
  tiktok: esLinkDeTiktok,
};

export function esLinkDeLaRed(red: RedDelTaller, texto: string): boolean {
  return ES_LINK_DE[red](texto);
}

export function comoSeMuestraLaRed(red: RedDelTaller, link: string): string {
  if (red === 'facebook') return 'Facebook';
  const usuario = (red === 'instagram' ? LINK_DE_INSTAGRAM : LINK_DE_TIKTOK).exec(link)?.[1];
  return usuario === undefined ? link : `@${usuario}`;
}

export function formaCortaDeLaRed(red: RedDelTaller, link: string): string {
  if (link === '' || red === 'facebook' || !esLinkDeLaRed(red, link)) return link;
  return comoSeMuestraLaRed(red, link);
}

export interface RedesDelTaller {
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
}

export interface FotoDeLaVidriera {
  id: string;
  ruta: string;
  rutaMini: string;
  ancho: number;
  alto: number;
}

export interface VidrieraDelTaller {
  redes: RedesDelTaller;
  fotos: readonly FotoDeLaVidriera[];
}

export const VIDRIERA_VACIA: VidrieraDelTaller = {
  redes: { instagram: null, facebook: null, tiktok: null },
  fotos: [],
};

export interface RedALaVista {
  red: RedDelTaller;
  link: string;
  nombre: string;
}

export function redesALaVista(redes: RedesDelTaller): RedALaVista[] {
  return REDES_DEL_TALLER.flatMap((red) => {
    const link = redes[red];
    return link === null ? [] : [{ red, link, nombre: comoSeMuestraLaRed(red, link) }];
  });
}

export function hayAlgoEnLaVidriera(vidriera: VidrieraDelTaller): boolean {
  return vidriera.fotos.length > 0 || redesALaVista(vidriera.redes).length > 0;
}

export function redParaCompartir(redes: RedesDelTaller): string | null {
  return redesALaVista(redes)[0]?.link ?? null;
}

export function lugaresLibres(cantidad: number): number {
  return Math.max(0, TOPE_DE_LA_VIDRIERA - cantidad);
}

export interface FilaEnLaVidriera {
  id: string;
  orden: number;
  creadaEn: string;
}

export interface CambioDeOrden {
  id: string;
  orden: number;
}

function antes(una: FilaEnLaVidriera, otra: FilaEnLaVidriera): number {
  if (una.orden !== otra.orden) return una.orden - otra.orden;
  if (una.creadaEn !== otra.creadaEn) return una.creadaEn < otra.creadaEn ? -1 : 1;
  return una.id < otra.id ? -1 : una.id > otra.id ? 1 : 0;
}

export function enOrden<T extends FilaEnLaVidriera>(filas: readonly T[]): T[] {
  return [...filas].sort(antes);
}

export function ordenAlFinal(filas: readonly FilaEnLaVidriera[]): number {
  return filas.reduce((mayor, fila) => Math.max(mayor, fila.orden + 1), 0);
}

export type HaciaDondeSeMueve = 'antes' | 'despues';

export function moverEnLaVidriera(
  filas: readonly FilaEnLaVidriera[],
  id: string,
  hacia: HaciaDondeSeMueve,
): CambioDeOrden[] {
  const ordenadas = enOrden(filas);
  const indice = ordenadas.findIndex((fila) => fila.id === id);
  const vecino = hacia === 'antes' ? indice - 1 : indice + 1;
  const laQueSeMueve = ordenadas[indice];
  const laDeAlLado = ordenadas[vecino];
  if (laQueSeMueve === undefined || laDeAlLado === undefined) return [];

  const repetidos = new Set(ordenadas.map((fila) => fila.orden)).size < ordenadas.length;

  return ordenadas.flatMap((fila, posicion) => {
    const queda = posicion === indice ? laDeAlLado : posicion === vecino ? laQueSeMueve : fila;
    const orden = repetidos ? posicion : fila.orden;
    return queda.orden === orden ? [] : [{ id: queda.id, orden }];
  });
}

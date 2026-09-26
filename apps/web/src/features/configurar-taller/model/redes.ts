import {
  formaCortaDeLaRed,
  REDES_DEL_TALLER,
  revisarLaRed,
  type MotivoDeLaRed,
  type RedDelTaller,
} from '@maun/domain';

import type { CambiosDeAjustes, FilaDe } from '@/shared/api';

export type TextosDeLasRedes = Record<RedDelTaller, string>;

type ColumnaDeLaRed = 'instagram_link' | 'facebook_link' | 'tiktok_link';

const COLUMNA_DE_LA_RED: Readonly<Record<RedDelTaller, ColumnaDeLaRed>> = {
  instagram: 'instagram_link',
  facebook: 'facebook_link',
  tiktok: 'tiktok_link',
};

export const NOMBRE_DE_LA_RED: Readonly<Record<RedDelTaller, string>> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};

export const MENSAJE_DE_LA_RED: Readonly<
  Record<RedDelTaller, Readonly<Record<MotivoDeLaRed, string>>>
> = {
  instagram: {
    'otra-red':
      'Ese enlace no es de Instagram. Pegá el de tu perfil, o escribí tu usuario con la @.',
    'no-es-un-perfil':
      'Ese enlace no es el de tu perfil: es de una publicación, un reel, una historia u otra parte de Instagram. Pegá el de tu perfil, o escribí tu usuario con la @.',
    usuario:
      'Escribí tu usuario de Instagram, con la @ o sin ella: letras, números, puntos y guiones bajos, sin espacios.',
  },
  facebook: {
    'otra-red': 'Ese enlace no es de Facebook. Pegá el de la página o el perfil del taller.',
    'no-es-un-perfil':
      'Ese enlace no es el de tu página: es de una publicación, un grupo o algo para compartir. Entrá a la página del taller y copiá su dirección.',
    usuario:
      'Pegá la dirección de la página del taller, como facebook.com/tutaller: el nombre va sin espacios, con letras, números o puntos.',
  },
  tiktok: {
    'otra-red': 'Ese enlace no es de TikTok. Pegá el de tu perfil, o escribí tu usuario con la @.',
    'no-es-un-perfil':
      'Ese enlace no es el de tu perfil: es de un video, un enlace corto u otra parte de TikTok. Pegá el de tu perfil, que lleva tu usuario con la @, o escribí tu usuario.',
    usuario:
      'Escribí tu usuario de TikTok, con la @ o sin ella: letras, números, puntos y guiones bajos, sin espacios.',
  },
};

export function redesDeLosAjustes(ajustes: FilaDe<'ajustes'>): TextosDeLasRedes {
  const guardadas = ajustes as Partial<FilaDe<'ajustes'>>;
  return {
    instagram: guardadas.instagram_link ?? '',
    facebook: guardadas.facebook_link ?? '',
    tiktok: guardadas.tiktok_link ?? '',
  };
}

export function hayRedesCargadas(ajustes: FilaDe<'ajustes'> | undefined): boolean {
  if (!ajustes) return false;
  return Object.values(redesDeLosAjustes(ajustes)).some((link) => link !== '');
}

export function comoSeEscriben(links: TextosDeLasRedes): TextosDeLasRedes {
  return {
    instagram: formaCortaDeLaRed('instagram', links.instagram),
    facebook: formaCortaDeLaRed('facebook', links.facebook),
    tiktok: formaCortaDeLaRed('tiktok', links.tiktok),
  };
}

export interface CambiosDeLasRedes {
  links: TextosDeLasRedes;
  cambios: CambiosDeAjustes;
  previos: CambiosDeAjustes;
  errores: Partial<Record<RedDelTaller, string>>;
}

export function cambiosDeLasRedes(
  ajustes: FilaDe<'ajustes'>,
  textos: TextosDeLasRedes,
): CambiosDeLasRedes {
  const guardadas = redesDeLosAjustes(ajustes);
  const links = { ...guardadas };
  const cambios: CambiosDeAjustes = {};
  const previos: CambiosDeAjustes = {};
  const errores: Partial<Record<RedDelTaller, string>> = {};

  for (const red of REDES_DEL_TALLER) {
    const revision = revisarLaRed(red, textos[red]);
    if (revision.estado === 'invalido') {
      errores[red] = MENSAJE_DE_LA_RED[red][revision.motivo];
      continue;
    }
    const link = revision.estado === 'valido' ? revision.link : '';
    links[red] = link;
    if (link === guardadas[red]) continue;
    cambios[COLUMNA_DE_LA_RED[red]] = link;
    previos[COLUMNA_DE_LA_RED[red]] = guardadas[red];
  }

  return { links, cambios, previos, errores };
}

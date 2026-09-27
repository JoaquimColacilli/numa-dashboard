import { describe, expect, it } from 'vitest';

import {
  comoSeMuestraLaRed,
  enOrden,
  esLinkDeFacebook,
  esLinkDeInstagram,
  esLinkDeLaRed,
  esLinkDeTiktok,
  formaCortaDeLaRed,
  hayAlgoEnLaVidriera,
  lugaresLibres,
  moverEnLaVidriera,
  normalizarLaRed,
  ordenAlFinal,
  redesALaVista,
  redParaCompartir,
  REDES_DEL_TALLER,
  revisarFacebook,
  revisarInstagram,
  revisarLaRed,
  revisarTiktok,
  SEGMENTOS_QUE_NO_SON_UN_PERFIL,
  TOPE_DE_LA_VIDRIERA,
  VIDRIERA_VACIA,
  type FilaEnLaVidriera,
  type RedDelTaller,
} from './vidriera.ts';

interface Caso {
  red: RedDelTaller;
  escrito: string;
  guardado: string;
  mostrado: string;
}

const LO_QUE_SE_ACEPTA: readonly Caso[] = [
  {
    red: 'instagram',
    escrito: '@taller.maun',
    guardado: 'https://www.instagram.com/taller.maun/',
    mostrado: '@taller.maun',
  },
  {
    red: 'instagram',
    escrito: 'Taller_Maun',
    guardado: 'https://www.instagram.com/taller_maun/',
    mostrado: '@taller_maun',
  },
  {
    red: 'instagram',
    escrito: 'instagram.com/taller.maun',
    guardado: 'https://www.instagram.com/taller.maun/',
    mostrado: '@taller.maun',
  },
  {
    red: 'instagram',
    escrito: 'https://www.instagram.com/Taller.Maun/?igsh=MWQ1ZGUxMzBkMA==',
    guardado: 'https://www.instagram.com/taller.maun/',
    mostrado: '@taller.maun',
  },
  {
    red: 'instagram',
    escrito: '  http://instagram.com/taller.maun/reels/  ',
    guardado: 'https://www.instagram.com/taller.maun/',
    mostrado: '@taller.maun',
  },
  {
    red: 'tiktok',
    escrito: '@taller.maun',
    guardado: 'https://www.tiktok.com/@taller.maun',
    mostrado: '@taller.maun',
  },
  {
    red: 'tiktok',
    escrito: 'tallermaun',
    guardado: 'https://www.tiktok.com/@tallermaun',
    mostrado: '@tallermaun',
  },
  {
    red: 'tiktok',
    escrito: 'https://www.tiktok.com/@Taller.Maun?lang=es',
    guardado: 'https://www.tiktok.com/@taller.maun',
    mostrado: '@taller.maun',
  },
  {
    red: 'tiktok',
    escrito: 'tiktok.com/@taller.maun/',
    guardado: 'https://www.tiktok.com/@taller.maun',
    mostrado: '@taller.maun',
  },
  {
    red: 'facebook',
    escrito: 'tallermaun',
    guardado: 'https://www.facebook.com/tallermaun',
    mostrado: 'Facebook',
  },
  {
    red: 'facebook',
    escrito: '@Taller.Maun',
    guardado: 'https://www.facebook.com/taller.maun',
    mostrado: 'Facebook',
  },
  {
    red: 'facebook',
    escrito: 'https://m.facebook.com/TallerMaun/?mibextid=abc',
    guardado: 'https://www.facebook.com/tallermaun',
    mostrado: 'Facebook',
  },
  {
    red: 'facebook',
    escrito: 'web.facebook.com/tallermaun',
    guardado: 'https://www.facebook.com/tallermaun',
    mostrado: 'Facebook',
  },
  {
    red: 'facebook',
    escrito: 'https://www.facebook.com/profile.php?id=100012345678&mibextid=abc',
    guardado: 'https://www.facebook.com/profile.php?id=100012345678',
    mostrado: 'Facebook',
  },
  {
    red: 'facebook',
    escrito: '100012345678',
    guardado: 'https://www.facebook.com/profile.php?id=100012345678',
    mostrado: 'Facebook',
  },
];

const LO_QUE_SE_RECHAZA: readonly {
  red: RedDelTaller;
  escrito: string;
  motivo: 'otra-red' | 'no-es-un-perfil' | 'usuario';
}[] = [
  { red: 'instagram', escrito: 'https://www.instagram.com/p/C1abcDEF/', motivo: 'no-es-un-perfil' },
  { red: 'instagram', escrito: 'instagram.com/reel/C1abc', motivo: 'no-es-un-perfil' },
  {
    red: 'instagram',
    escrito: 'https://instagram.com/stories/taller.maun/123',
    motivo: 'no-es-un-perfil',
  },
  { red: 'instagram', escrito: '@explore', motivo: 'no-es-un-perfil' },
  { red: 'instagram', escrito: 'https://www.facebook.com/tallermaun', motivo: 'otra-red' },
  { red: 'instagram', escrito: 'instagram.com', motivo: 'usuario' },
  { red: 'instagram', escrito: 'taller maun', motivo: 'usuario' },
  { red: 'instagram', escrito: '@taller-maun', motivo: 'usuario' },
  { red: 'instagram', escrito: `@${'a'.repeat(31)}`, motivo: 'usuario' },
  {
    red: 'tiktok',
    escrito: 'https://www.tiktok.com/@taller.maun/video/7300000000000000000',
    motivo: 'no-es-un-perfil',
  },
  { red: 'tiktok', escrito: 'https://vm.tiktok.com/ZMabc123/', motivo: 'no-es-un-perfil' },
  { red: 'tiktok', escrito: 'tiktok.com/discover/muebles', motivo: 'no-es-un-perfil' },
  { red: 'tiktok', escrito: 'tiktok.com', motivo: 'usuario' },
  { red: 'tiktok', escrito: 'https://www.instagram.com/taller.maun/', motivo: 'otra-red' },
  { red: 'tiktok', escrito: '@a', motivo: 'usuario' },
  { red: 'tiktok', escrito: `@${'a'.repeat(25)}`, motivo: 'usuario' },
  {
    red: 'facebook',
    escrito: 'https://www.facebook.com/share/p/1AbCdEf/',
    motivo: 'no-es-un-perfil',
  },
  {
    red: 'facebook',
    escrito: 'facebook.com/tallermaun/posts/123456789',
    motivo: 'no-es-un-perfil',
  },
  { red: 'facebook', escrito: 'facebook.com/groups/muebles', motivo: 'no-es-un-perfil' },
  { red: 'facebook', escrito: 'facebook.com/watch', motivo: 'no-es-un-perfil' },
  { red: 'facebook', escrito: 'marketplace', motivo: 'no-es-un-perfil' },
  { red: 'facebook', escrito: 'https://www.facebook.com/profile.php', motivo: 'usuario' },
  { red: 'facebook', escrito: 'https://fb.me/tallermaun', motivo: 'otra-red' },
  { red: 'facebook', escrito: 'facebook.com', motivo: 'usuario' },
  { red: 'facebook', escrito: 'maun', motivo: 'usuario' },
  { red: 'facebook', escrito: 'taller_maun', motivo: 'usuario' },
];

describe('las redes del taller', () => {
  it.each(LO_QUE_SE_ACEPTA)(
    '$red: «$escrito» se guarda como $guardado y se muestra «$mostrado»',
    ({ red, escrito, guardado, mostrado }) => {
      expect(revisarLaRed(red, escrito)).toEqual({ estado: 'valido', link: guardado });
      expect(normalizarLaRed(red, escrito)).toBe(guardado);
      expect(esLinkDeLaRed(red, guardado)).toBe(true);
      expect(comoSeMuestraLaRed(red, guardado)).toBe(mostrado);
    },
  );

  it.each(LO_QUE_SE_RECHAZA)(
    '$red: «$escrito» se rechaza por $motivo',
    ({ red, escrito, motivo }) => {
      expect(revisarLaRed(red, escrito)).toEqual({ estado: 'invalido', motivo });
      expect(normalizarLaRed(red, escrito)).toBe(escrito.trim());
    },
  );

  it('vacío, o solo espacios, es no tener esa red', () => {
    for (const red of REDES_DEL_TALLER) {
      expect(revisarLaRed(red, '   ')).toEqual({ estado: 'vacio' });
      expect(normalizarLaRed(red, '')).toBe('');
    }
  });

  it('cada red tiene su revisión, la misma que la general', () => {
    expect(revisarInstagram('@maun.muebles')).toEqual(revisarLaRed('instagram', '@maun.muebles'));
    expect(revisarTiktok('@maun.muebles')).toEqual(revisarLaRed('tiktok', '@maun.muebles'));
    expect(revisarFacebook('maun.muebles')).toEqual(revisarLaRed('facebook', 'maun.muebles'));
  });

  it('esLinkDe… acepta solo la forma que se guarda, que es lo que exige el check de la base', () => {
    expect(esLinkDeInstagram('https://www.instagram.com/taller.maun/')).toBe(true);
    expect(esLinkDeInstagram('https://instagram.com/taller.maun/')).toBe(false);
    expect(esLinkDeInstagram('https://www.instagram.com/taller.maun')).toBe(false);
    expect(esLinkDeInstagram('https://www.instagram.com/Taller.Maun/')).toBe(false);
    expect(esLinkDeInstagram('https://www.instagram.com/reels/')).toBe(false);
    expect(esLinkDeTiktok('https://www.tiktok.com/@taller.maun')).toBe(true);
    expect(esLinkDeTiktok('https://www.tiktok.com/taller.maun')).toBe(false);
    expect(esLinkDeTiktok('https://www.tiktok.com/@taller.maun/')).toBe(false);
    expect(esLinkDeFacebook('https://www.facebook.com/tallermaun')).toBe(true);
    expect(esLinkDeFacebook('https://www.facebook.com/profile.php?id=12345')).toBe(true);
    expect(esLinkDeFacebook('https://www.facebook.com/profile.php?id=1234')).toBe(false);
    expect(esLinkDeFacebook('https://www.facebook.com/sharer.php')).toBe(false);
    expect(esLinkDeFacebook('https://m.facebook.com/tallermaun')).toBe(false);
    expect(esLinkDeFacebook('https://www.facebook.com/tallermaun/')).toBe(false);
  });

  it('los segmentos que no son un perfil son los de la lista, en las dos puntas', () => {
    for (const segmento of SEGMENTOS_QUE_NO_SON_UN_PERFIL.instagram) {
      expect(esLinkDeInstagram(`https://www.instagram.com/${segmento}/`)).toBe(false);
    }
    for (const segmento of SEGMENTOS_QUE_NO_SON_UN_PERFIL.facebook) {
      expect(esLinkDeFacebook(`https://www.facebook.com/${segmento}`)).toBe(false);
    }
    expect(SEGMENTOS_QUE_NO_SON_UN_PERFIL.tiktok).toEqual([]);
  });

  it('Instagram y TikTok se muestran como @usuario, Facebook por su nombre', () => {
    expect(comoSeMuestraLaRed('facebook', 'https://www.facebook.com/profile.php?id=12345')).toBe(
      'Facebook',
    );
    expect(comoSeMuestraLaRed('instagram', 'no es un link')).toBe('no es un link');
  });

  it('la forma corta es la del @usuario para Instagram y TikTok, y el link para Facebook', () => {
    expect(formaCortaDeLaRed('instagram', 'https://www.instagram.com/taller.maun/')).toBe(
      '@taller.maun',
    );
    expect(formaCortaDeLaRed('tiktok', 'https://www.tiktok.com/@taller.maun')).toBe('@taller.maun');
    expect(formaCortaDeLaRed('facebook', 'https://www.facebook.com/tallermaun')).toBe(
      'https://www.facebook.com/tallermaun',
    );
    expect(formaCortaDeLaRed('instagram', '')).toBe('');
    expect(formaCortaDeLaRed('tiktok', 'algo raro')).toBe('algo raro');
  });
});

describe('la vidriera', () => {
  it('tiene un tope de 12 fotos, y los lugares libres nunca son negativos', () => {
    expect(TOPE_DE_LA_VIDRIERA).toBe(12);
    expect(lugaresLibres(0)).toBe(12);
    expect(lugaresLibres(7)).toBe(5);
    expect(lugaresLibres(12)).toBe(0);
    expect(lugaresLibres(14)).toBe(0);
  });

  it('las redes van en el orden de siempre y solo las que hay', () => {
    expect(redesALaVista(VIDRIERA_VACIA.redes)).toEqual([]);
    expect(
      redesALaVista({
        instagram: 'https://www.instagram.com/taller.maun/',
        facebook: 'https://www.facebook.com/tallermaun',
        tiktok: 'https://www.tiktok.com/@taller.maun',
      }).map((red) => red.nombre),
    ).toEqual(['@taller.maun', 'Facebook', '@taller.maun']);
  });

  it('se comparte la primera red que haya: Instagram, después Facebook, después TikTok', () => {
    expect(redParaCompartir(VIDRIERA_VACIA.redes)).toBeNull();
    expect(
      redParaCompartir({
        instagram: null,
        facebook: 'https://www.facebook.com/tallermaun',
        tiktok: 'https://www.tiktok.com/@taller.maun',
      }),
    ).toBe('https://www.facebook.com/tallermaun');
    expect(
      redParaCompartir({ instagram: null, facebook: null, tiktok: 'https://www.tiktok.com/@x.y' }),
    ).toBe('https://www.tiktok.com/@x.y');
  });

  it('hay algo que mostrar con una foto o con una red', () => {
    expect(hayAlgoEnLaVidriera(VIDRIERA_VACIA)).toBe(false);
    expect(
      hayAlgoEnLaVidriera({
        ...VIDRIERA_VACIA,
        fotos: [{ id: 'f', ruta: 'r', rutaMini: 'm', ancho: 3, alto: 4 }],
      }),
    ).toBe(true);
    expect(
      hayAlgoEnLaVidriera({
        ...VIDRIERA_VACIA,
        redes: { instagram: null, facebook: null, tiktok: 'https://www.tiktok.com/@x.y' },
      }),
    ).toBe(true);
  });
});

function fila(id: string, orden: number, creadaEn = '2026-09-26T10:00:00Z'): FilaEnLaVidriera {
  return { id, orden, creadaEn };
}

describe('el orden de la vidriera', () => {
  it('se ordena por orden, después por cuándo se sumó y después por id, como la base', () => {
    const filas = [
      fila('c', 1),
      fila('b', 0, '2026-09-26T11:00:00Z'),
      fila('a', 0, '2026-09-26T11:00:00Z'),
      fila('z', 0, '2026-09-26T09:00:00Z'),
      fila('y', 1),
    ];
    expect(enOrden(filas).map((una) => una.id)).toEqual(['z', 'a', 'b', 'c', 'y']);
    expect(enOrden([fila('b', 0), fila('a', 0), fila('a', 0)]).map((una) => una.id)).toEqual([
      'a',
      'a',
      'b',
    ]);
    expect(
      enOrden([fila('x', 0, '2026-09-26T12:00:00Z'), fila('w', 0, '2026-09-26T08:00:00Z')]).map(
        (una) => una.id,
      ),
    ).toEqual(['w', 'x']);
    expect(
      enOrden([fila('w', 0, '2026-09-26T08:00:00Z'), fila('x', 0, '2026-09-26T12:00:00Z')]).map(
        (una) => una.id,
      ),
    ).toEqual(['w', 'x']);
  });

  it('lo que se suma va al final', () => {
    expect(ordenAlFinal([])).toBe(0);
    expect(ordenAlFinal([fila('a', 0), fila('b', 4), fila('c', 2)])).toBe(5);
  });

  it('mover antes o después cambia el orden de las dos y de nadie más', () => {
    const filas = [fila('a', 0), fila('b', 1), fila('c', 5), fila('d', 7)];
    expect(moverEnLaVidriera(filas, 'c', 'antes')).toEqual([
      { id: 'c', orden: 1 },
      { id: 'b', orden: 5 },
    ]);
    expect(moverEnLaVidriera(filas, 'c', 'despues')).toEqual([
      { id: 'd', orden: 5 },
      { id: 'c', orden: 7 },
    ]);
  });

  it('en las puntas, o con una que no está, no cambia nada', () => {
    const filas = [fila('a', 0), fila('b', 1)];
    expect(moverEnLaVidriera(filas, 'a', 'antes')).toEqual([]);
    expect(moverEnLaVidriera(filas, 'b', 'despues')).toEqual([]);
    expect(moverEnLaVidriera(filas, 'x', 'antes')).toEqual([]);
  });

  it('con órdenes repetidos, dos aparatos sumando a la vez, mover renumera la lista entera', () => {
    const filas = [fila('a', 0), fila('b', 3), fila('c', 3), fila('d', 3)];
    expect(moverEnLaVidriera(filas, 'd', 'antes')).toEqual([
      { id: 'b', orden: 1 },
      { id: 'd', orden: 2 },
    ]);
  });
});

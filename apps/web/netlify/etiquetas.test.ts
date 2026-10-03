import { ETIQUETAS_DE_IDIOMA, IDIOMAS, idiomaDeLaEtiqueta } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import FUENTE from '../index.html?raw';
import {
  claseDelEnlace,
  conElIdiomaDelTaller,
  conLasEtiquetas,
  DESCRIPCION_DE_LA_ENCUESTA,
  DESCRIPCION_DE_LA_VISTA,
  escapar,
  ETIQUETA_DEL_IDIOMA,
  etiquetasGenericas,
  ICONO_DEL_TALLER_EN_LUGAR_DE,
  ICONOS_DEL_TALLER,
  idiomaDelEnlace,
  TEXTOS_DEL_ENLACE,
  tituloDeLaEncuesta,
  tituloDeLaVista,
  tokenDeLaRuta,
  TITULO_GENERICO,
  type EtiquetasDeLaVista,
  type IdiomaDelEnlace,
} from './etiquetas';

const URL_DE_LA_VISTA = 'https://numa-dashboard.netlify.app/v/tZEFrYutatg5xhw1mcrUKIAFXk';
const IMAGEN = 'https://numa-dashboard.netlify.app/taller-512.png';

// Lo que sirve Netlify no es el index.html del repo: vite-plugin-pwa le agrega el link al
// manifiesto al final del head. La función de borde trabaja sobre eso, así que el fixture es el
// archivo de verdad más esa línea.
const HTML = FUENTE.replace('</head>', '<link rel="manifest" href="/manifest.webmanifest"></head>');

const LA_ETIQUETA_DEL_MANIFIESTO = /<link\s[^>]*rel=["']manifest["']/i;

function etiquetas(cambios: Partial<EtiquetasDeLaVista> = {}): EtiquetasDeLaVista {
  return {
    titulo: 'Cocina Lucas · MAUN Muebles',
    descripcion: DESCRIPCION_DE_LA_VISTA,
    url: URL_DE_LA_VISTA,
    imagen: IMAGEN,
    ...cambios,
  };
}

function contenido(html: string, propiedad: string): string | null {
  const patron = new RegExp(`<meta (?:property|name)="${propiedad}" content="([^"]*)" ?/?>`, 'i');
  return patron.exec(html)?.[1] ?? null;
}

describe('el token sale de la ruta', () => {
  it('lo lee de /v/<token>', () => {
    expect(tokenDeLaRuta('/v/tZEFrYutatg5xhw1mcrUKIAFXk')).toBe('tZEFrYutatg5xhw1mcrUKIAFXk');
    expect(tokenDeLaRuta('/v/tZEFrYutatg5xhw1mcrUKIAFXk/')).toBe('tZEFrYutatg5xhw1mcrUKIAFXk');
  });

  it('lo que no tiene forma de token no es un token', () => {
    expect(tokenDeLaRuta('/v/corto')).toBeNull();
    expect(tokenDeLaRuta('/v/')).toBeNull();
    expect(tokenDeLaRuta('/v/con espacios y acentos áé')).toBeNull();
    expect(tokenDeLaRuta('/v/../../etc/passwd')).toBeNull();
    expect(tokenDeLaRuta('/')).toBeNull();
  });
});

describe('el título que sale en la vista previa', () => {
  it('es el trabajo y el taller, separados por un punto medio', () => {
    expect(tituloDeLaVista('Cocina Lucas', 'MAUN Muebles')).toBe('Cocina Lucas · MAUN Muebles');
  });

  it('aguanta que falte cualquiera de los dos', () => {
    expect(tituloDeLaVista('Cocina Lucas', '')).toBe('Cocina Lucas');
    expect(tituloDeLaVista('  ', 'MAUN Muebles')).toBe('MAUN Muebles');
    expect(tituloDeLaVista('', '')).toBe(TITULO_GENERICO);
  });
});

describe('el escapado', () => {
  it('escapa los cinco caracteres que rompen una etiqueta', () => {
    expect(escapar(`Cocina "Lucas" & Cía. <b> el 100% de O'Higgins`)).toBe(
      'Cocina &quot;Lucas&quot; &amp; Cía. &lt;b&gt; el 100% de O&#39;Higgins',
    );
  });

  it('las tildes y la eñe pasan tal cual: el documento es UTF-8', () => {
    expect(escapar('Cocina del Ñandú, con diseño')).toBe('Cocina del Ñandú, con diseño');
  });

  it('no escapa de más', () => {
    expect(escapar('Placard 3 puertas')).toBe('Placard 3 puertas');
  });
});

describe('el head que sale por el enlace', () => {
  const reescrito = conLasEtiquetas(HTML, etiquetas());

  it('pone las etiquetas al principio del head, antes que nada de la app', () => {
    const apertura = reescrito.indexOf('<head>');
    expect(reescrito.indexOf('<title>')).toBe(apertura + '<head>'.length);
    expect(reescrito.indexOf('og:title')).toBeLessThan(reescrito.indexOf('charset'));
    expect(reescrito.indexOf('og:image')).toBeLessThan(reescrito.indexOf('charset'));
  });

  it('el título de la pestaña y el og:title dicen lo mismo', () => {
    expect(/<title>([^<]*)<\/title>/.exec(reescrito)?.[1]).toBe('Cocina Lucas · MAUN Muebles');
    expect(contenido(reescrito, 'og:title')).toBe('Cocina Lucas · MAUN Muebles');
  });

  it('la descripción es fija y no es la de la app', () => {
    expect(HTML).toContain('Nuevas maneras de gestionar el taller.');
    expect(contenido(reescrito, 'og:description')).toBe(DESCRIPCION_DE_LA_VISTA);
    expect(contenido(reescrito, 'description')).toBe(DESCRIPCION_DE_LA_VISTA);
    expect(reescrito).not.toContain('Nuevas maneras');
  });

  it('el og:url apunta a esta página y no a la raíz', () => {
    expect(contenido(reescrito, 'og:url')).toBe(URL_DE_LA_VISTA);
  });

  it('la imagen es el ícono del taller, con dirección absoluta', () => {
    expect(contenido(reescrito, 'og:image')).toBe(IMAGEN);
  });

  it('los íconos son los del taller, no los de la app', () => {
    expect(HTML).toContain('href="/numa.svg"');
    for (const vieja of Object.keys(ICONO_DEL_TALLER_EN_LUGAR_DE)) {
      expect(reescrito).not.toContain(`href="${vieja}"`);
    }
    expect(reescrito).toContain('<link rel="icon" href="/taller.ico" sizes="48x48" />');
    expect(reescrito).toContain('<link rel="icon" href="/taller.svg" type="image/svg+xml" />');
    expect(reescrito).toContain('<link rel="apple-touch-icon" href="/taller-180.png" />');
    expect(reescrito.match(/<link rel="(?:icon|apple-touch-icon)"/g)).toHaveLength(
      ICONOS_DEL_TALLER.length,
    );
    expect(reescrito.indexOf('taller.svg')).toBeLessThan(reescrito.indexOf('charset'));
  });

  it('sin imagen, no hay etiqueta de imagen', () => {
    expect(conLasEtiquetas(HTML, etiquetas({ imagen: null }))).not.toContain('og:image');
  });

  it('el noindex sigue estando', () => {
    expect(contenido(reescrito, 'robots')).toContain('noindex');
  });

  it('le saca el manifiesto: el cliente no se baja la app del taller', () => {
    expect(HTML).toMatch(LA_ETIQUETA_DEL_MANIFIESTO);
    expect(reescrito).not.toMatch(LA_ETIQUETA_DEL_MANIFIESTO);
  });

  it('no queda ni el título ni la descripción de la app', () => {
    expect(HTML).toContain('<title>NUMA</title>');
    expect(reescrito).not.toContain('<title>NUMA</title>');
    expect(reescrito).not.toContain('NUMA');
    expect(reescrito.match(/<title>/g)).toHaveLength(1);
    expect(reescrito.match(/name="description"/g)).toHaveLength(1);
  });

  it('el resto del documento no se toca', () => {
    expect(reescrito).toContain('<div id="root"></div>');
    expect(reescrito).toContain("location.pathname.indexOf('/v/') === 0");
  });
});

describe('un título con caracteres que rompen', () => {
  const bravo = 'Cocina "Lucas" & Cía. <b> el 100% de O\'Higgins — Ñandú con diseño';
  const reescrito = conLasEtiquetas(HTML, etiquetas({ titulo: bravo }));

  it('sale escapado en las dos etiquetas', () => {
    const esperado =
      'Cocina &quot;Lucas&quot; &amp; Cía. &lt;b&gt; el 100% de O&#39;Higgins — Ñandú con diseño';
    expect(reescrito).toContain(`<title>${esperado}</title>`);
    expect(reescrito).toContain(`<meta property="og:title" content="${esperado}" />`);
  });

  it('y no deja ningún caracter suelto que corte la etiqueta', () => {
    const laEtiqueta = /<meta property="og:title" content="([^"]*)"/.exec(reescrito);
    expect(laEtiqueta).not.toBeNull();
    expect(laEtiqueta?.[1]).not.toContain('<');
    expect(laEtiqueta?.[1]).not.toContain('>');
  });
});

describe('las etiquetas genéricas', () => {
  it('son iguales para el enlace inválido, el dado de baja y el que no existe', () => {
    const genericas = etiquetasGenericas(URL_DE_LA_VISTA, IMAGEN);
    expect(genericas.titulo).toBe(TITULO_GENERICO);
    expect(genericas.descripcion).toBe(DESCRIPCION_DE_LA_VISTA);
    const reescrito = conLasEtiquetas(HTML, genericas);
    expect(/<title>([^<]*)<\/title>/.exec(reescrito)?.[1]).toBe('MAUN');
    expect(reescrito).not.toContain('Nuevas maneras');
    expect(reescrito).not.toContain('NUMA');
  });
});

describe('el enlace de la encuesta', () => {
  const URL_DE_LA_ENCUESTA = 'https://numa-dashboard.netlify.app/o/tZEFrYutatg5xhw1mcrUKIAFXk';

  it('se reconoce por su prefijo y el token sale igual que en la vista', () => {
    expect(claseDelEnlace('/o/tZEFrYutatg5xhw1mcrUKIAFXk')).toBe('encuesta');
    expect(claseDelEnlace('/v/tZEFrYutatg5xhw1mcrUKIAFXk')).toBe('vista');
    expect(claseDelEnlace('/opiniones')).toBeNull();
    expect(tokenDeLaRuta('/o/tZEFrYutatg5xhw1mcrUKIAFXk/')).toBe('tZEFrYutatg5xhw1mcrUKIAFXk');
    expect(tokenDeLaRuta('/o/../../etc/passwd')).toBeNull();
    expect(tokenDeLaRuta('/opiniones/preguntas')).toBeNull();
  });

  it('el título dice de qué taller es y que es una encuesta, sin el cliente ni el trabajo', () => {
    expect(tituloDeLaEncuesta('MAUN Muebles')).toBe('Encuesta de MAUN Muebles');
    expect(tituloDeLaEncuesta('  ')).toBe('Una encuesta del taller');
  });

  it('el head no lleva nombres ni montos, y el genérico no cambia si el enlace no sirve', () => {
    const reescrito = conLasEtiquetas(HTML, {
      titulo: tituloDeLaEncuesta('MAUN Muebles'),
      descripcion: DESCRIPCION_DE_LA_ENCUESTA,
      url: URL_DE_LA_ENCUESTA,
      imagen: IMAGEN,
    });
    expect(contenido(reescrito, 'og:title')).toBe('Encuesta de MAUN Muebles');
    expect(contenido(reescrito, 'og:description')).toBe(DESCRIPCION_DE_LA_ENCUESTA);
    expect(reescrito).not.toMatch(/\$\s?\d/);
    expect(etiquetasGenericas(URL_DE_LA_ENCUESTA, IMAGEN, 'encuesta')).toEqual({
      titulo: TITULO_GENERICO,
      descripcion: DESCRIPCION_DE_LA_ENCUESTA,
      url: URL_DE_LA_ENCUESTA,
      imagen: IMAGEN,
    });
  });
});

describe('el arranque del documento, cuando la función de borde no corre', () => {
  it('cambia los mismos íconos por los mismos del taller', () => {
    const cambios = /var delTaller = \{([^}]*)\}/.exec(FUENTE)?.[1] ?? '';
    const pares = Object.fromEntries(
      [...cambios.matchAll(/'([^']+)': '([^']+)'/g)].map(([, vieja = '', nueva = '']) => [
        vieja,
        nueva,
      ]),
    );
    expect(pares).toEqual(ICONO_DEL_TALLER_EN_LUGAR_DE);
    expect(Object.values(pares).sort()).toEqual(
      ICONOS_DEL_TALLER.map((icono) => icono.href).sort(),
    );
    expect(FUENTE).toContain("icono.setAttribute('sizes', '48x48')");
  });
});

async function laSeccionDelCliente(idioma: IdiomaDelEnlace): Promise<unknown> {
  const modulo: unknown = await import(`../src/shared/idioma-del-cliente/${idioma}/enlace.ts`);
  return typeof modulo === 'object' && modulo !== null ? Reflect.get(modulo, 'enlace') : null;
}

describe('los textos del enlace, en el idioma de los clientes del taller', () => {
  it('son los de la sección del enlace que leen los clientes, en los tres idiomas', async () => {
    for (const idioma of IDIOMAS) {
      const textos = TEXTOS_DEL_ENLACE[idioma];
      const seccion = await laSeccionDelCliente(idioma);
      expect(seccion, idioma).toMatchObject({
        descripcionDeLaVista: textos.descripcionDeLaVista,
        descripcionDeLaEncuesta: textos.descripcionDeLaEncuesta,
        unaEncuestaDelTaller: textos.unaEncuestaDelTaller,
      });
      const encuestaDe: unknown =
        typeof seccion === 'object' && seccion !== null ? Reflect.get(seccion, 'encuestaDe') : null;
      if (typeof encuestaDe !== 'function') throw new Error(`Falta encuestaDe en ${idioma}.`);
      const titulo: unknown = Reflect.apply(encuestaDe, undefined, ['MAUN Muebles']);
      expect(titulo, idioma).toBe(textos.encuestaDe('MAUN Muebles'));
    }
  });

  it('la etiqueta de cada idioma es la de la app', () => {
    expect(ETIQUETA_DEL_IDIOMA).toEqual(ETIQUETAS_DE_IDIOMA);
  });

  it('lo que no es uno de los tres idiomas se lee como castellano', () => {
    for (const idioma of IDIOMAS) expect(idiomaDelEnlace(idioma)).toBe(idioma);
    expect(idiomaDelEnlace('fr')).toBe('es');
    expect(idiomaDelEnlace('pt')).toBe('es');
    expect(idiomaDelEnlace(null)).toBe('es');
    expect(idiomaDelEnlace(undefined)).toBe('es');
  });

  it('el título de la encuesta y las genéricas salen en inglés y en portugués', () => {
    const URL_DE_LA_ENCUESTA = 'https://numa-dashboard.netlify.app/o/tZEFrYutatg5xhw1mcrUKIAFXk';
    expect(tituloDeLaEncuesta('MAUN Muebles', 'en')).toBe('Survey from MAUN Muebles');
    expect(tituloDeLaEncuesta('  ', 'en')).toBe('A survey from the shop');
    expect(tituloDeLaEncuesta('MAUN Muebles', 'pt-BR')).toBe(
      'Pesquisa de satisfação de MAUN Muebles',
    );
    expect(tituloDeLaEncuesta('', 'pt-BR')).toBe('Uma pesquisa de satisfação da marcenaria');
    expect(etiquetasGenericas(URL_DE_LA_VISTA, IMAGEN, 'vista', 'en')).toEqual({
      titulo: TITULO_GENERICO,
      descripcion: TEXTOS_DEL_ENLACE.en.descripcionDeLaVista,
      url: URL_DE_LA_VISTA,
      imagen: IMAGEN,
    });
    expect(etiquetasGenericas(URL_DE_LA_ENCUESTA, IMAGEN, 'encuesta', 'pt-BR')).toEqual({
      titulo: TITULO_GENERICO,
      descripcion: TEXTOS_DEL_ENLACE['pt-BR'].descripcionDeLaEncuesta,
      url: URL_DE_LA_ENCUESTA,
      imagen: IMAGEN,
    });
  });

  it('una descripción con apóstrofos sale escapada y entera', () => {
    const reescrito = conLasEtiquetas(
      HTML,
      etiquetas({ descripcion: TEXTOS_DEL_ENLACE.en.descripcionDeLaVista }),
    );
    expect(contenido(reescrito, 'og:description')).toBe(
      escapar(TEXTOS_DEL_ENLACE.en.descripcionDeLaVista),
    );
  });

  it('el html dice el idioma del taller, con la marca que lee la app al arrancar', () => {
    const enPortugues = conElIdiomaDelTaller(HTML, 'pt-BR');
    expect(enPortugues).toContain(
      '<html lang="pt-BR" data-idioma-del-taller="pt-BR" data-theme="system">',
    );
    expect(enPortugues.match(/<html[^>]*\slang=/g)).toHaveLength(1);
    expect(idiomaDeLaEtiqueta(/<html lang="([^"]*)"/.exec(enPortugues)?.[1] ?? '')).toBe('pt-BR');
    expect(enPortugues.replace(/<html[^>]*>/, '')).toBe(HTML.replace(/<html[^>]*>/, ''));
  });

  it('marcarlo de nuevo no duplica nada: queda el último idioma', () => {
    const dosVeces = conElIdiomaDelTaller(conElIdiomaDelTaller(HTML, 'en'), 'es');
    expect(/<html[^>]*>/.exec(dosVeces)?.[0]).toBe(
      '<html lang="es-AR" data-idioma-del-taller="es" data-theme="system">',
    );
  });

  it('un html sin la etiqueta html queda como vino', () => {
    expect(conElIdiomaDelTaller('<head></head><body>hola</body>', 'en')).toBe(
      '<head></head><body>hola</body>',
    );
  });
});

describe('un html sin head no rompe nada', () => {
  it('devuelve el documento como vino', () => {
    expect(conLasEtiquetas('<html><body>hola</body></html>', etiquetas())).toBe(
      '<html><body>hola</body></html>',
    );
  });
});

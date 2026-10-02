import { afterEach, describe, expect, it, vi } from 'vitest';

import FUENTE from '../index.html?raw';
import vistaPrevia from './edge-functions/vista-previa.ts';
import { escapar, TEXTOS_DEL_ENLACE, TITULO_GENERICO } from './etiquetas';

const TOKEN = 'tZEFrYutatg5xhw1mcrUKIAFXk';

const VARIABLES: Readonly<Record<string, string>> = {
  VITE_SUPABASE_URL: 'https://base.example.com',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_de_prueba',
};

function conLaBase(responde: unknown): void {
  vi.stubGlobal('Netlify', { env: { get: (clave: string) => VARIABLES[clave] } });
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(responde)))),
  );
}

async function pedir(ruta: string): Promise<string> {
  const respuesta = await vistaPrevia(new Request(`https://numa-dashboard.netlify.app${ruta}`), {
    next: () => Promise.resolve(new Response(FUENTE, { headers: { 'content-type': 'text/html' } })),
  });
  if (respuesta === undefined) throw new Error('La función de borde no devolvió la página.');
  return respuesta.text();
}

function laApertura(html: string): string {
  return /<html[^>]*>/.exec(html)?.[0] ?? '';
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('la vista previa sale en el idioma de los clientes del taller', () => {
  it('un trabajo de un taller que escribe en inglés', async () => {
    conLaBase({ trabajo: 'Kitchen', taller: 'MAUN Muebles', idioma: 'en' });
    const html = await pedir(`/v/${TOKEN}`);

    expect(laApertura(html)).toBe(
      '<html lang="en-US" data-idioma-del-taller="en" data-theme="system">',
    );
    expect(html).toContain('<title>Kitchen · MAUN Muebles</title>');
    expect(html).toContain(
      `<meta property="og:description" content="${escapar(TEXTOS_DEL_ENLACE.en.descripcionDeLaVista)}" />`,
    );
  });

  it('la encuesta de un taller que escribe en portugués', async () => {
    conLaBase({ taller: 'MAUN Muebles', idioma: 'pt-BR', preguntas: [] });
    const html = await pedir(`/o/${TOKEN}`);

    expect(laApertura(html)).toBe(
      '<html lang="pt-BR" data-idioma-del-taller="pt-BR" data-theme="system">',
    );
    expect(html).toContain('<title>Pesquisa de satisfação de MAUN Muebles</title>');
    expect(html).toContain(TEXTOS_DEL_ENLACE['pt-BR'].descripcionDeLaEncuesta);
  });

  it('en castellano dice lo de siempre, y la página queda en el idioma del taller', async () => {
    conLaBase({ trabajo: 'Cocina Lucas', taller: 'MAUN Muebles', idioma: 'es' });
    const html = await pedir(`/v/${TOKEN}`);

    expect(laApertura(html)).toBe(
      '<html lang="es-AR" data-idioma-del-taller="es" data-theme="system">',
    );
    expect(html).toContain(TEXTOS_DEL_ENLACE.es.descripcionDeLaVista);
  });

  it('si el enlace no sirve, las genéricas en castellano y la página sin marcar', async () => {
    conLaBase(null);
    const html = await pedir(`/v/${TOKEN}`);

    expect(laApertura(html)).toBe('<html lang="es-AR" data-theme="system">');
    expect(html).toContain(`<title>${TITULO_GENERICO}</title>`);
    expect(html).toContain(TEXTOS_DEL_ENLACE.es.descripcionDeLaVista);
  });
});

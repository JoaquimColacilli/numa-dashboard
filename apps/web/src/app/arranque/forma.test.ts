import { afterEach, describe, expect, it, vi } from 'vitest';

import { CLAVE_DE_SESION } from '@/shared/api';
import {
  CLAVE_DEL_BLOQUEO,
  CORTE_DE_CELULAR,
  PREFIJO_DE_LA_ENCUESTA_PUBLICA,
  PREFIJO_DE_LA_VISTA_PUBLICA,
} from '@/shared/lib';

import HTML from '../../../index.html?raw';

const SCRIPT_DEL_HEAD = /<script>([\s\S]*?)<\/script>/.exec(HTML)?.[1] ?? '';

const USUARIO = '0199aaaa-0000-7000-8000-000000000001';
const OTRO = '0199bbbb-0000-7000-8000-000000000002';

const SESIONES: readonly (string | null)[] = [
  JSON.stringify({ access_token: 'x', user: { id: USUARIO, email: 'a@b.c' } }),
  null,
  '{roto',
  JSON.stringify({ user: {} }),
  JSON.stringify({ user: { id: 42 } }),
  'null',
  '"texto"',
];

const BLOQUEOS: readonly (string | null)[] = [
  null,
  JSON.stringify({ usuarioId: USUARIO, credencial: null }),
  JSON.stringify({ usuarioId: OTRO, credencial: 'c' }),
  JSON.stringify([USUARIO]),
  '{roto',
];

const PANTALLAS = [
  { ancho: 390, alto: 844 },
  { ancho: 844, alto: 390 },
  { ancho: 1440, alto: 900 },
  { ancho: 768, alto: 1024 },
] as const;

const RUTAS = ['/', '/proyectos', '/acceso', '/v/abc', '/o/abc'] as const;

function ponerLaPantalla(ancho: number, alto: number): void {
  Object.defineProperty(window.screen, 'width', { configurable: true, get: () => ancho });
  Object.defineProperty(window.screen, 'height', { configurable: true, get: () => alto });
}

function guardar(clave: string, valor: string | null): void {
  if (valor === null) localStorage.removeItem(clave);
  else localStorage.setItem(clave, valor);
}

function correrElScriptDelHead(): string | undefined {
  const raiz = document.documentElement;
  delete raiz.dataset.arranque;
  delete raiz.dataset.vista;
  const script = document.createElement('script');
  script.textContent = SCRIPT_DEL_HEAD;
  document.head.append(script);
  script.remove();
  return raiz.dataset.arranque;
}

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.arranque;
  delete document.documentElement.dataset.vista;
  window.history.replaceState(null, '', '/');
});

describe('el script del head elige la forma con las mismas claves que la app', () => {
  it('lee la sesión y el bloqueo por sus constantes, y mide el celular con el mismo corte', () => {
    expect(SCRIPT_DEL_HEAD).toContain(`localStorage.getItem('${CLAVE_DE_SESION}')`);
    expect(SCRIPT_DEL_HEAD).toContain(`localStorage.getItem('${CLAVE_DEL_BLOQUEO}')`);
    expect(SCRIPT_DEL_HEAD).toContain(
      `Math.min(screen.width, screen.height) < ${String(CORTE_DE_CELULAR)}`,
    );
    expect(SCRIPT_DEL_HEAD).toContain('document.documentElement.dataset.arranque = forma');
  });

  it('en las páginas del cliente no elige ninguna', () => {
    expect(SCRIPT_DEL_HEAD).toContain(
      `location.pathname.indexOf('${PREFIJO_DE_LA_VISTA_PUBLICA}') === 0`,
    );
    expect(SCRIPT_DEL_HEAD).toContain(
      `location.pathname.indexOf('${PREFIJO_DE_LA_ENCUESTA_PUBLICA}') === 0`,
    );
  });
});

describe('el script del head y React eligen la misma forma', () => {
  it.each(PANTALLAS)(
    'con la pantalla de $ancho × $alto, en cada ruta, sesión y bloqueo',
    async ({ ancho, alto }) => {
      ponerLaPantalla(ancho, alto);
      vi.resetModules();
      const { formaDelArranque } = await import('./forma');

      for (const ruta of RUTAS) {
        for (const sesion of SESIONES) {
          for (const bloqueo of BLOQUEOS) {
            window.history.replaceState(null, '', ruta);
            guardar(CLAVE_DE_SESION, sesion);
            guardar(CLAVE_DEL_BLOQUEO, bloqueo);

            const delScript = correrElScriptDelHead() ?? null;
            const deReact = formaDelArranque(window.location.pathname);

            expect(
              { ruta, sesion, bloqueo, forma: delScript },
              'el script del head eligió otra forma que React',
            ).toEqual({ ruta, sesion, bloqueo, forma: deReact });
          }
        }
      }
    },
  );

  it('sin sesión va el acceso; con sesión, el marco; y el bloqueo solo en un celular del mismo usuario', async () => {
    ponerLaPantalla(390, 844);
    vi.resetModules();
    const { formaDelArranque } = await import('./forma');

    guardar(CLAVE_DE_SESION, null);
    expect(formaDelArranque('/')).toBe('acceso');

    guardar(CLAVE_DE_SESION, SESIONES[0] ?? null);
    expect(formaDelArranque('/')).toBe('marco');

    guardar(CLAVE_DEL_BLOQUEO, BLOQUEOS[1] ?? null);
    expect(formaDelArranque('/')).toBe('bloqueo');
    expect(formaDelArranque('/v/abc')).toBeNull();
    expect(formaDelArranque('/o/abc')).toBeNull();

    ponerLaPantalla(1440, 900);
    vi.resetModules();
    const enLaCompu = await import('./forma');
    expect(enLaCompu.formaDelArranque('/')).toBe('marco');
  });
});

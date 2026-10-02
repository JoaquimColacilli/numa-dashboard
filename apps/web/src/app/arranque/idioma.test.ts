import { ETIQUETAS_DE_IDIOMA } from '@maun/domain';
import { afterEach, describe, expect, it } from 'vitest';

import { CLAVE_DE_SESION } from '@/shared/api';
import { CLAVE_DEL_IDIOMA, CLAVE_DEL_SEUDOIDIOMA } from '@/shared/lib';

import HTML from '../../../index.html?raw';
import { ATRIBUTO_DEL_IDIOMA_DEL_TALLER, idiomaAlArrancar, seudoidiomaAlArrancar } from './idioma';

const SCRIPT_DEL_HEAD = /<script>([\s\S]*?)<\/script>/.exec(HTML)?.[1] ?? '';

const USUARIO = '0199aaaa-0000-7000-8000-000000000001';
const OTRO = '0199bbbb-0000-7000-8000-000000000002';

const SESIONES: readonly (string | null)[] = [
  JSON.stringify({ user: { id: USUARIO, user_metadata: { idioma: 'pt-BR', nombre: 'Ana' } } }),
  JSON.stringify({ user: { id: USUARIO, user_metadata: { idioma: 'fr' } } }),
  JSON.stringify({ user: { id: USUARIO, user_metadata: null } }),
  JSON.stringify({ user: { id: USUARIO } }),
  null,
  '{roto',
  JSON.stringify({ user: {} }),
  JSON.stringify({ user: { id: 42, user_metadata: { idioma: 'en' } } }),
  'null',
];

const COPIAS: readonly (string | null)[] = [
  null,
  JSON.stringify({ usuarioId: USUARIO, idioma: 'en' }),
  JSON.stringify({ usuarioId: OTRO, idioma: 'en' }),
  JSON.stringify({ usuarioId: USUARIO, idioma: 'xx' }),
  '{roto',
  'null',
];

const NAVEGADORES: readonly (readonly string[])[] = [
  ['es-AR'],
  ['en-GB', 'es'],
  ['pt-PT'],
  ['fr-FR'],
  ['fr-FR', 'pt-BR'],
  [],
];

const RUTAS = ['/', '/acceso', '/v/abc', '/o/abc'] as const;

function ponerElNavegador(etiquetas: readonly string[]): void {
  Object.defineProperty(navigator, 'languages', { configurable: true, get: () => etiquetas });
  Object.defineProperty(navigator, 'language', {
    configurable: true,
    get: () => etiquetas[0] ?? '',
  });
}

function guardar(clave: string, valor: string | null): void {
  if (valor === null) localStorage.removeItem(clave);
  else localStorage.setItem(clave, valor);
}

function correrElScriptDelHead(): string {
  const script = document.createElement('script');
  script.textContent = SCRIPT_DEL_HEAD;
  document.head.append(script);
  script.remove();
  return document.documentElement.lang;
}

afterEach(() => {
  localStorage.clear();
  ponerElNavegador(['es-AR', 'es']);
  const raiz = document.documentElement;
  raiz.removeAttribute(ATRIBUTO_DEL_IDIOMA_DEL_TALLER);
  raiz.lang = 'es-AR';
  delete raiz.dataset.arranque;
  delete raiz.dataset.vista;
  window.history.replaceState(null, '', '/');
});

describe('el script del head elige el idioma con las mismas claves que la app', () => {
  it('lee la sesión, la copia del idioma y la marca del taller por sus constantes', () => {
    expect(SCRIPT_DEL_HEAD).toContain(`localStorage.getItem('${CLAVE_DE_SESION}')`);
    expect(SCRIPT_DEL_HEAD).toContain(`localStorage.getItem('${CLAVE_DEL_IDIOMA}')`);
    expect(SCRIPT_DEL_HEAD).toContain(`hasAttribute('${ATRIBUTO_DEL_IDIOMA_DEL_TALLER}')`);
    const comoClave = (idioma: string) => (/^[a-z]+$/u.test(idioma) ? idioma : `'${idioma}'`);
    for (const [idioma, etiqueta] of Object.entries(ETIQUETAS_DE_IDIOMA)) {
      expect(SCRIPT_DEL_HEAD).toContain(`${comoClave(idioma)}: '${etiqueta}'`);
    }
  });
});

describe('el script del head y React eligen el mismo idioma', () => {
  it.each(RUTAS)('en %s, con cada sesión, copia y navegador', (ruta) => {
    for (const sesion of SESIONES) {
      for (const copia of COPIAS) {
        for (const navegador of NAVEGADORES) {
          window.history.replaceState(null, '', ruta);
          guardar(CLAVE_DE_SESION, sesion);
          guardar(CLAVE_DEL_IDIOMA, copia);
          ponerElNavegador(navegador);
          document.documentElement.lang = '';

          const delScript = correrElScriptDelHead();
          const deReact = ETIQUETAS_DE_IDIOMA[idiomaAlArrancar(window.location.pathname)];

          expect(
            { ruta, sesion, copia, navegador, lang: delScript },
            'el script del head eligió otro idioma que React',
          ).toEqual({ ruta, sesion, copia, navegador, lang: deReact });
        }
      }
    }
  });

  it('en la página del cliente, el idioma que puso la función de borde no se toca', () => {
    for (const ruta of ['/v/abc', '/o/abc']) {
      window.history.replaceState(null, '', ruta);
      ponerElNavegador(['en-US']);
      document.documentElement.setAttribute(ATRIBUTO_DEL_IDIOMA_DEL_TALLER, '');
      document.documentElement.lang = 'pt-BR';

      expect(correrElScriptDelHead()).toBe('pt-BR');
      expect(idiomaAlArrancar(ruta)).toBe('pt-BR');
    }
  });

  it('con sesión manda la persona y no el navegador: la cuenta de Eliseo sigue en castellano', () => {
    window.history.replaceState(null, '', '/');
    ponerElNavegador(['en-US']);
    guardar(CLAVE_DE_SESION, JSON.stringify({ user: { id: USUARIO, user_metadata: {} } }));
    expect(idiomaAlArrancar('/')).toBe('es');
    expect(correrElScriptDelHead()).toBe('es-AR');
  });
});

describe('el seudoidioma al arrancar', () => {
  it('se prende con la clave del aparato, y nunca en la página del cliente', () => {
    expect(seudoidiomaAlArrancar('/')).toBe(false);
    localStorage.setItem(CLAVE_DEL_SEUDOIDIOMA, 'disponible');
    expect(seudoidiomaAlArrancar('/')).toBe(false);
    localStorage.setItem(CLAVE_DEL_SEUDOIDIOMA, 'activo');
    expect(seudoidiomaAlArrancar('/')).toBe(true);
    expect(seudoidiomaAlArrancar('/v/abc')).toBe(false);
  });
});

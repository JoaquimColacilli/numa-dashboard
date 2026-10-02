import { isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { seudoCatalogo } from '@/shared/lib';

import { en } from './en';
import { es, type Mensajes } from './es';
import { ptBR } from './pt-BR';

const CATALOGOS: Readonly<Record<string, Mensajes>> = { es, en, 'pt-BR': ptBR };

interface LlamadaCentinela {
  llamar: (m: Mensajes) => unknown;
  tieneQueDecir: readonly string[];
}

const LLAMADAS: Readonly<Record<string, LlamadaCentinela>> = {};

function hojas(valor: unknown, camino = ''): Map<string, unknown> {
  const salida = new Map<string, unknown>();
  if (typeof valor === 'object' && valor !== null && !Array.isArray(valor)) {
    for (const [clave, adentro] of Object.entries(valor)) {
      for (const [ruta, hoja] of hojas(adentro, camino === '' ? clave : `${camino}.${clave}`)) {
        salida.set(ruta, hoja);
      }
    }
  } else {
    salida.set(camino, valor);
  }
  return salida;
}

function comoTexto(resultado: unknown): string {
  return isValidElement(resultado) ? renderToStaticMarkup(resultado) : String(resultado);
}

describe('los catálogos de la app', () => {
  const base = hojas(es);

  it.each(Object.keys(CATALOGOS))(
    '%s tiene las mismas rutas que el castellano, y nada vacío',
    (idioma) => {
      const otro = hojas(CATALOGOS[idioma]);
      expect([...otro.keys()].sort()).toEqual([...base.keys()].sort());
      for (const [ruta, hoja] of otro) {
        expect(typeof hoja, ruta).toBe(typeof base.get(ruta));
        if (typeof hoja === 'string') expect(hoja.trim(), ruta).not.toBe('');
      }
    },
  );

  it.each(Object.keys(CATALOGOS))('%s usa cada dato que recibe', (idioma) => {
    const m = CATALOGOS[idioma];
    if (m === undefined) throw new Error(idioma);
    for (const [ruta, { llamar, tieneQueDecir }] of Object.entries<LlamadaCentinela>(LLAMADAS)) {
      const texto = comoTexto(llamar(m));
      for (const dato of tieneQueDecir) expect(texto, `${idioma} ${ruta}`).toContain(dato);
    }
  });

  it('cada función del catálogo tiene su llamada centinela', () => {
    const funciones = [...base]
      .filter(([, hoja]) => typeof hoja === 'function')
      .map(([ruta]) => ruta);
    expect(funciones.sort()).toEqual(Object.keys(LLAMADAS).sort());
  });

  it('el seudoidioma pasa por todas las hojas', () => {
    for (const [ruta, hoja] of hojas(seudoCatalogo(es))) {
      if (typeof hoja === 'string') expect(hoja, ruta).toMatch(/^⟦.*⟧$/su);
    }
  });
});

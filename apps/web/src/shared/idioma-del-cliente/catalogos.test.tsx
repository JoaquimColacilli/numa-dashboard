import { isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { seudoCatalogo } from '@/shared/lib';

import type { Centinelas, LlamadaCentinela } from './centinelas';
import { en } from './en';
import { es, type MensajesDelCliente } from './es';
import { ptBR } from './pt-BR';

const CATALOGOS: Readonly<Record<string, MensajesDelCliente>> = { es, en, 'pt-BR': ptBR };

const POR_SECCION = import.meta.glob<{ centinelas: Centinelas }>('./centinelas/*.ts', {
  eager: true,
});

const LLAMADAS: Centinelas = Object.assign(
  {},
  ...Object.values(POR_SECCION).map((seccion) => seccion.centinelas),
) as Centinelas;

const HACE_CUANTO: Readonly<Record<string, RegExp>> = {
  es: /[Hh]ace \d/,
  en: /\d+ (days?|weeks?|months?) ago/i,
  'pt-BR': /[Hh]á \d/,
};

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

function textosDe(m: MensajesDelCliente): string[] {
  const sueltos = [...hojas(m).values()].flatMap((hoja) =>
    typeof hoja === 'string' ? [hoja] : Array.isArray(hoja) ? hoja.map(String) : [],
  );
  const llamados = Object.values<LlamadaCentinela>(LLAMADAS).map(({ llamar }) =>
    comoTexto(llamar(m)),
  );
  return [...sueltos, ...llamados];
}

describe('los catálogos de lo que ve el cliente', () => {
  const base = hojas(es);

  it.each(Object.keys(CATALOGOS))(
    '%s tiene las mismas rutas que el castellano, y nada vacío',
    (idioma) => {
      const otro = hojas(CATALOGOS[idioma]);
      expect([...otro.keys()].sort()).toEqual([...base.keys()].sort());
      for (const [ruta, hoja] of otro) {
        expect(typeof hoja, ruta).toBe(typeof base.get(ruta));
        if (typeof hoja === 'string') expect(hoja.trim(), ruta).not.toBe('');
        if (Array.isArray(hoja)) {
          expect(hoja.length, ruta).toBe((base.get(ruta) as readonly unknown[]).length);
        }
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

  it.each(Object.keys(CATALOGOS))(
    'en %s, al cliente nunca se le dice hace cuánto pasó algo (ADR 0046)',
    (idioma) => {
      const m = CATALOGOS[idioma];
      const regla = HACE_CUANTO[idioma];
      if (m === undefined || regla === undefined) throw new Error(idioma);
      for (const texto of textosDe(m)) expect(texto).not.toMatch(regla);
    },
  );

  it.each(Object.keys(CATALOGOS))('en %s, lo que sigue no lleva números', (idioma) => {
    const m = CATALOGOS[idioma];
    if (m === undefined) throw new Error(idioma);
    const { delDominio } = m.vista;
    const sigue = [
      ...Object.values(delDominio.sigue),
      ...Object.values(delDominio.sigueListo),
      ...Object.values(delDominio.sigueFaltaMedir),
      delDominio.sigueConLaComprometida,
      delDominio.sigueConElPresupuestoMandado,
      delDominio.sigueConLaSenaCubierta,
      delDominio.sigueConElPresupuestoVencido,
      delDominio.sigueFaltaLaSena,
    ];
    for (const texto of sigue) expect(texto).not.toMatch(/\d/);
  });
});

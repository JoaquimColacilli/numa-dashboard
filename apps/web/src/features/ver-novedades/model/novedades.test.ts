import { IDIOMAS, type Idioma } from '@maun/domain';
import { describe, expect, it } from 'vitest';

import {
  lineasDeLaNovedad,
  NOVEDADES,
  NOVEDADES_DE_ANTES,
  NOVEDADES_EN_LOS_TRES_IDIOMAS,
  novedadesEnElIdioma,
} from './novedades';
import { compararVersiones, partesDeLaVersion } from './version';

const LINEAS_POR_VERSION = 4;
const LARGO_DE_UNA_LINEA = 200;

const LA_ULTIMA_DE_ANTES = '2026-10-01';

const PALABRAS_QUE_NO_VAN: Readonly<Record<Idioma, readonly string[]>> = {
  es: [
    'ia',
    'inteligencia artificial',
    'claude',
    'anthropic',
    'openai',
    'chatgpt',
    'gpt',
    'copilot',
    'supabase',
    'postgres',
    'bucket',
    'migración',
    'base de datos',
    'réplica',
    'react',
    'vite',
    'pnpm',
    'npm',
    'commit',
    'pull request',
    'deploy',
    'netlify',
    'refactor',
    'gracias',
  ],
  en: [
    'ai',
    'artificial intelligence',
    'claude',
    'anthropic',
    'openai',
    'chatgpt',
    'gpt',
    'copilot',
    'supabase',
    'postgres',
    'migration',
    'database',
    'replica',
    'react',
    'vite',
    'pnpm',
    'npm',
    'commit',
    'pull request',
    'deploy',
    'netlify',
    'refactor',
    'thanks',
  ],
  'pt-BR': [
    'inteligência artificial',
    'claude',
    'anthropic',
    'openai',
    'chatgpt',
    'gpt',
    'copilot',
    'supabase',
    'postgres',
    'bucket',
    'migração',
    'banco de dados',
    'réplica',
    'react',
    'vite',
    'pnpm',
    'npm',
    'commit',
    'pull request',
    'deploy',
    'netlify',
    'refactor',
    'obrigado',
  ],
};

function contiene(texto: string, palabra: string): boolean {
  const escapada = palabra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}])${escapada}($|[^\\p{L}])`, 'iu').test(texto);
}

describe('el archivo de novedades', () => {
  it('tiene al menos una versión', () => {
    expect(NOVEDADES.length).toBeGreaterThan(0);
  });

  it('cada versión es una fecha real, con un número si hay otra el mismo día, y van de la más nueva a la más vieja', () => {
    for (const novedad of NOVEDADES) {
      expect(partesDeLaVersion(novedad.version), novedad.version).not.toBeNull();
    }
    for (let indice = 1; indice < NOVEDADES.length; indice += 1) {
      const anterior = NOVEDADES[indice - 1]?.version ?? '';
      const esta = NOVEDADES[indice]?.version ?? '';
      expect(compararVersiones(anterior, esta), `${anterior} antes que ${esta}`).toBeGreaterThan(0);
    }
  });

  it('las de antes quedan como estaban, en castellano: toda novedad nueva va en los tres idiomas', () => {
    expect(NOVEDADES_DE_ANTES[0]?.version).toBe(LA_ULTIMA_DE_ANTES);
    for (const novedad of NOVEDADES_EN_LOS_TRES_IDIOMAS) {
      expect(compararVersiones(novedad.version, LA_ULTIMA_DE_ANTES)).toBeGreaterThan(0);
      for (const idioma of IDIOMAS) {
        expect(novedad.lineas[idioma].length, `${novedad.version} ${idioma}`).toBe(
          novedad.lineas.es.length,
        );
      }
    }
  });

  it.each(IDIOMAS)(
    'en %s, cada versión dice de una a cuatro cosas, cortas y terminadas en punto',
    (idioma) => {
      for (const novedad of novedadesEnElIdioma(NOVEDADES, idioma)) {
        const lineas = lineasDeLaNovedad(novedad, idioma);
        expect(lineas.length, novedad.version).toBeGreaterThan(0);
        expect(lineas.length, novedad.version).toBeLessThanOrEqual(LINEAS_POR_VERSION);
        for (const linea of lineas) {
          expect(linea.length, linea).toBeLessThanOrEqual(LARGO_DE_UNA_LINEA);
          expect(linea, linea).toMatch(/\.$/);
          expect(linea, linea).toBe(linea.trim());
        }
      }
    },
  );

  it.each(IDIOMAS)(
    'en %s está escrito para quien usa la app: sin emojis, sin nombres técnicos y sin mencionar a una IA',
    (idioma) => {
      for (const novedad of novedadesEnElIdioma(NOVEDADES, idioma)) {
        for (const linea of lineasDeLaNovedad(novedad, idioma)) {
          expect(linea, linea).not.toMatch(/\p{Extended_Pictographic}/u);
          for (const palabra of PALABRAS_QUE_NO_VAN[idioma]) {
            expect(contiene(linea, palabra), `«${palabra}» en: ${linea}`).toBe(false);
          }
        }
      }
    },
  );

  it('el control de palabras encuentra la palabra suelta y no adentro de otra', () => {
    expect(contiene('Lo hizo una IA.', 'ia')).toBe(true);
    expect(contiene('La familia y el día.', 'ia')).toBe(false);
    expect(contiene('Se agregó una migración.', 'migración')).toBe(true);
  });

  it('en inglés y en portugués, la lista empieza en la primera que tiene ese idioma', () => {
    const nueva = {
      version: '2026-10-02',
      lineas: { es: ['Una.'], en: ['One.'], 'pt-BR': ['Uma.'] },
    };
    const vieja = { version: '2026-10-01', lineas: ['Una vieja.'] };
    expect(novedadesEnElIdioma([nueva, vieja], 'es')).toEqual([nueva, vieja]);
    expect(novedadesEnElIdioma([nueva, vieja], 'en')).toEqual([nueva]);
    expect(lineasDeLaNovedad(nueva, 'pt-BR')).toEqual(['Uma.']);
    expect(lineasDeLaNovedad(vieja, 'pt-BR')).toEqual([]);
  });
});

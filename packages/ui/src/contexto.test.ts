import { describe, expect, it } from 'vitest';

import tema from './styles/theme.css?raw';

function valoresDe(token: string): string[] {
  return [...tema.matchAll(new RegExp(`--color-${token}: (#[0-9a-f]{6});`, 'g'))].map(
    ([, valor]) => valor ?? '',
  );
}

function canal(valor: number): number {
  const s = valor / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
}

function contraste(uno: string, otro: string): number {
  const [claro = 0, oscuro = 0] = [luminancia(uno), luminancia(otro)].sort((a, b) => b - a);
  return (claro + 0.05) / (oscuro + 0.05);
}

describe('el gris de contexto', () => {
  it('tiene un valor para el tema claro y otro para el oscuro', () => {
    expect(valoresDe('contexto')).toEqual(['#8f8f8f', '#707070']);
    expect(valoresDe('paper')).toHaveLength(2);
    expect(valoresDe('ink')).toHaveLength(2);
  });

  it('se ve contra el papel en los dos temas (3:1, WCAG 1.4.11) y no se confunde con la tinta', () => {
    const [contextoClaro = '', contextoOscuro = ''] = valoresDe('contexto');
    const [papelClaro = '', papelOscuro = ''] = valoresDe('paper');
    const [tintaClara = '', tintaOscura = ''] = valoresDe('ink');

    expect(Math.round(contraste(contextoClaro, papelClaro) * 100) / 100).toBe(3.23);
    expect(Math.round(contraste(contextoOscuro, papelOscuro) * 100) / 100).toBe(3.62);
    expect(contraste(contextoClaro, tintaClara)).toBeGreaterThanOrEqual(3);
    expect(contraste(contextoOscuro, tintaOscura)).toBeGreaterThanOrEqual(3);
  });

  it('el borde, que usaba la comparación del mes, no llega a 3:1 contra el papel claro', () => {
    const [bordeClaro = ''] = valoresDe('border');
    const [papelClaro = ''] = valoresDe('paper');
    expect(contraste(bordeClaro, papelClaro)).toBeLessThan(3);
  });
});

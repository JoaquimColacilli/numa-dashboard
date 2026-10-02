import { describe, expect, it } from 'vitest';

import type { Replica } from '@/shared/api';

import { idiomaDeLosClientes } from './idioma';

function conAjustes(ajustes: Record<string, unknown>): Replica {
  return { tablas: { ajustes } } as unknown as Replica;
}

function conElIdioma(idioma: unknown): Replica {
  return conAjustes({ a1: { id: 'a1', idioma_de_los_clientes: idioma } });
}

describe('el idioma de los clientes del taller', () => {
  it('sale de los ajustes de la réplica', () => {
    expect(idiomaDeLosClientes(conElIdioma('pt-BR'))).toBe('pt-BR');
    expect(idiomaDeLosClientes(conElIdioma('en'))).toBe('en');
  });

  it('sin réplica, sin ajustes o con un valor que no conoce, es el castellano', () => {
    expect(idiomaDeLosClientes(undefined)).toBe('es');
    expect(idiomaDeLosClientes(conAjustes({}))).toBe('es');
    expect(idiomaDeLosClientes(conElIdioma('fr'))).toBe('es');
    expect(idiomaDeLosClientes(conElIdioma(undefined))).toBe('es');
  });
});

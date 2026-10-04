import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const RAIZ = path.resolve(import.meta.dirname, '../../..');
const DENO = createRequire(import.meta.url).resolve('deno/bin.cjs');
const TOPE_MS = 300_000;

const FUNCIONES = [
  { nombre: 'avisos', aparte: [] },
  { nombre: 'facturar', aparte: ['ensayo.ts'] },
] as const;

function deno(argumentos: string[]): { codigo: number | null; salida: string } {
  const resultado = spawnSync(process.execPath, [DENO, ...argumentos], {
    cwd: RAIZ,
    encoding: 'utf8',
    timeout: TOPE_MS,
    env: { ...process.env, NO_COLOR: '1' },
  });
  return { codigo: resultado.status, salida: `${resultado.stdout}\n${resultado.stderr}` };
}

describe.each(FUNCIONES)('la función de borde $nombre, en su runtime', ({ nombre, aparte }) => {
  const funcion = `supabase/functions/${nombre}`;
  const configuracion = `${funcion}/deno.json`;

  it(
    'pasa el chequeo de tipos de Deno, dominio incluido',
    () => {
      const { codigo, salida } = deno([
        'check',
        '--config',
        configuracion,
        `${funcion}/index.ts`,
        ...aparte.map((archivo) => `${funcion}/${archivo}`),
      ]);
      expect(codigo, salida).toBe(0);
    },
    TOPE_MS,
  );

  it(
    'pasa sus tests con Deno, sin red y sin archivos',
    () => {
      const { codigo, salida } = deno([
        'test',
        '--config',
        configuracion,
        '--allow-env',
        '--no-prompt',
        funcion,
      ]);
      expect(codigo, salida).toBe(0);
    },
    TOPE_MS,
  );
});

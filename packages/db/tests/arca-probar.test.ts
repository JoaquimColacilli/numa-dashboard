import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  archivosDelEnsayo,
  argumentosDelEnsayo,
  ENSAYO,
  HOSTS_DE_HOMOLOGACION,
} from '../scripts/arca/argumentos.ts';

const RAIZ = path.resolve(import.meta.dirname, '../../..');
const TEMPORAL = path.resolve('/tmp/ensayo');
const ARCHIVOS = archivosDelEnsayo(
  {
    ARCA_PRUEBA_CERT: '/arca-pruebas/numa-pruebas.crt',
    ARCA_PRUEBA_CLAVE: '/arca-pruebas/numa-pruebas.key',
  },
  TEMPORAL,
);

describe('arca:probar corre el ensayo con Deno y solo puede hablar con homologación', () => {
  it('el permiso de red es exactamente el de los dos hosts de homologación', () => {
    const argumentos = argumentosDelEnsayo(ARCHIVOS, ['--emitir', '--punto-de-venta', '3']);
    const red = argumentos.filter((argumento) => argumento.startsWith('--allow-net'));
    expect(red).toEqual(['--allow-net=wsaahomo.afip.gov.ar,wswhomo.afip.gov.ar']);
    expect(
      argumentos.some((argumento) =>
        /^--allow-all$|^-A$|^--allow-run|^--allow-ffi|^--allow-sys/.test(argumento),
      ),
    ).toBe(false);
    expect(argumentos.slice(-4)).toEqual([ENSAYO, '--emitir', '--punto-de-venta', '3']);
  });

  it('lee el certificado, la clave y el ticket, y escribe solo el ticket y el pedido de prueba', () => {
    const argumentos = argumentosDelEnsayo(ARCHIVOS, []);
    expect(argumentos).toContain(
      `--allow-read=${path.resolve('/arca-pruebas/numa-pruebas.crt')},${path.resolve('/arca-pruebas/numa-pruebas.key')},${path.join(TEMPORAL, 'numa-ensayo-ticket.json')}`,
    );
    expect(argumentos).toContain(
      `--allow-write=${path.join(TEMPORAL, 'numa-ensayo-ticket.json')},${path.join(TEMPORAL, 'numa-ensayo-pedido.csr')}`,
    );
    expect(argumentos).toContain(
      '--allow-env=ARCA_PRUEBA_CERT,ARCA_PRUEBA_CLAVE,ARCA_PRUEBA_TICKET,ARCA_PRUEBA_PEDIDO',
    );
  });

  it('sin las rutas del certificado y de la clave no arranca', () => {
    expect(() => archivosDelEnsayo({}, TEMPORAL)).toThrow(/ARCA_PRUEBA_CERT y ARCA_PRUEBA_CLAVE/);
    expect(() =>
      archivosDelEnsayo({ ARCA_PRUEBA_CERT: 'a.crt', ARCA_PRUEBA_CLAVE: ' ' }, TEMPORAL),
    ).toThrow();
  });

  it('los hosts son los de homologación de la función', () => {
    const red = readFileSync(path.join(RAIZ, 'supabase/functions/facturar/red.ts'), 'utf8');
    expect(red).toContain(
      `homologacion: [${HOSTS_DE_HOMOLOGACION.map((host) => `'${host}'`).join(', ')}]`,
    );
  });
});

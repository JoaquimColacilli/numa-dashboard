import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';

import { archivosDelEnsayo, argumentosDelEnsayo } from './arca/argumentos.ts';
import { RAIZ } from './conexion.ts';

const DENO = createRequire(import.meta.url).resolve('deno/bin.cjs');

try {
  const archivos = archivosDelEnsayo(process.env, os.tmpdir());
  const resultado = spawnSync(
    process.execPath,
    [DENO, ...argumentosDelEnsayo(archivos, process.argv.slice(2))],
    {
      cwd: RAIZ,
      stdio: 'inherit',
      env: {
        ...process.env,
        NO_COLOR: '1',
        ARCA_PRUEBA_CERT: archivos.certificado,
        ARCA_PRUEBA_CLAVE: archivos.clave,
        ARCA_PRUEBA_TICKET: archivos.ticket,
        ARCA_PRUEBA_PEDIDO: archivos.pedido,
      },
    },
  );
  if (resultado.error) throw resultado.error;
  process.exitCode = resultado.status ?? 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

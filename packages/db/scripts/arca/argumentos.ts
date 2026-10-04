import path from 'node:path';

export const HOSTS_DE_HOMOLOGACION = ['wsaahomo.afip.gov.ar', 'wswhomo.afip.gov.ar'] as const;

export const ENSAYO = 'supabase/functions/facturar/ensayo.ts';

export const CONFIGURACION_DE_LA_FUNCION = 'supabase/functions/facturar/deno.json';

export const VARIABLES_DEL_ENSAYO = [
  'ARCA_PRUEBA_CERT',
  'ARCA_PRUEBA_CLAVE',
  'ARCA_PRUEBA_TICKET',
  'ARCA_PRUEBA_PEDIDO',
] as const;

export interface ArchivosDelEnsayo {
  certificado: string;
  clave: string;
  ticket: string;
  pedido: string;
}

export function archivosDelEnsayo(
  entorno: Readonly<Record<string, string | undefined>>,
  temporal: string,
): ArchivosDelEnsayo {
  const certificado = entorno.ARCA_PRUEBA_CERT?.trim();
  const clave = entorno.ARCA_PRUEBA_CLAVE?.trim();
  if (!certificado || !clave) {
    throw new Error(
      'Faltan ARCA_PRUEBA_CERT y ARCA_PRUEBA_CLAVE: las rutas del certificado y de la clave de prueba.',
    );
  }
  return {
    certificado: path.resolve(certificado),
    clave: path.resolve(clave),
    ticket: path.join(temporal, 'numa-ensayo-ticket.json'),
    pedido: path.join(temporal, 'numa-ensayo-pedido.csr'),
  };
}

export function argumentosDelEnsayo(
  archivos: ArchivosDelEnsayo,
  delUsuario: readonly string[],
): string[] {
  return [
    'run',
    '--config',
    CONFIGURACION_DE_LA_FUNCION,
    `--allow-net=${HOSTS_DE_HOMOLOGACION.join(',')}`,
    `--allow-env=${VARIABLES_DEL_ENSAYO.join(',')}`,
    `--allow-read=${archivos.certificado},${archivos.clave},${archivos.ticket}`,
    `--allow-write=${archivos.ticket},${archivos.pedido}`,
    '--no-prompt',
    ENSAYO,
    ...delUsuario,
  ];
}

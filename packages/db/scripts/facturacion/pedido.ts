import { parseArgs } from 'node:util';

export const CUIT_DE_PRUEBA = '20-11111111-2';

export type ResolucionAMano =
  { como: 'autorizada'; cae: string; vence: string; fecha: string } | { como: 'rechazada' };

export type PedidoDeLaFacturacion =
  | { tarea: 'listar' }
  | { tarea: 'vault' }
  | { tarea: 'conectar'; email: string; puntoDeVenta: number; desde: string }
  | { tarea: 'desconectar'; email: string; forzar: boolean }
  | { tarea: 'resolver'; id: string; resolucion: ResolucionAMano };

export interface EntornoDelPedido {
  emailDeLosE2e: string | undefined;
  hoy: string;
}

export const USO = [
  'Uso: pnpm --filter @maun/db db:facturacion <tarea>, sin «--» antes de las opciones:',
  '  --listar',
  '  --vault  (con FACTURAR_URL y FACTURAR_SECRETO en el entorno)',
  '  --conectar --email <mail> --ambiente homologacion --punto-de-venta <n> [--desde <AAAA-MM-DD>]',
  '  --desconectar --email <mail> [--forzar]',
  '  --resolver <id> --como autorizada --cae <cae> --vence <AAAA-MM-DD> --fecha <AAAA-MM-DD>',
  '  --resolver <id> --como rechazada',
].join('\n');

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function exigirFecha(valor: string | undefined, que: string): string {
  if (valor === undefined || !FECHA.test(valor) || Number.isNaN(Date.parse(`${valor}T12:00:00Z`))) {
    throw new Error(`${que} va como AAAA-MM-DD.`);
  }
  return valor;
}

function exigirEmail(valor: string | undefined): string {
  if (valor === undefined || !valor.includes('@')) throw new Error('Falta --email <mail>.');
  return valor;
}

function tareas(valores: Record<string, unknown>): string[] {
  return ['listar', 'vault', 'conectar', 'desconectar'].filter((tarea) => valores[tarea] === true);
}

export function leerElPedido(
  argumentos: readonly string[],
  entorno: EntornoDelPedido,
): PedidoDeLaFacturacion {
  const { values: valores } = parseArgs({
    args: [...argumentos],
    strict: true,
    allowPositionals: false,
    options: {
      listar: { type: 'boolean', default: false },
      vault: { type: 'boolean', default: false },
      conectar: { type: 'boolean', default: false },
      desconectar: { type: 'boolean', default: false },
      resolver: { type: 'string' },
      email: { type: 'string' },
      ambiente: { type: 'string' },
      'punto-de-venta': { type: 'string' },
      desde: { type: 'string' },
      forzar: { type: 'boolean', default: false },
      como: { type: 'string' },
      cae: { type: 'string' },
      vence: { type: 'string' },
      fecha: { type: 'string' },
    },
  });

  const pedidas = tareas(valores);
  if (pedidas.length + (valores.resolver === undefined ? 0 : 1) !== 1) throw new Error(USO);

  if (valores.listar) return { tarea: 'listar' };
  if (valores.vault) return { tarea: 'vault' };

  if (valores.conectar) {
    if (valores.ambiente === 'produccion') {
      throw new Error(
        'La producción no se conecta desde acá: la conecta cada taller desde Ajustes › Facturación › «Conectar con ARCA», con su propio certificado.',
      );
    }
    if (valores.ambiente !== 'homologacion') {
      throw new Error('Falta --ambiente homologacion: es el único que se conecta desde acá.');
    }
    const email = exigirEmail(valores.email);
    const deLosE2e = entorno.emailDeLosE2e;
    if (
      deLosE2e === undefined ||
      deLosE2e === '' ||
      email.toLowerCase() !== deLosE2e.toLowerCase()
    ) {
      throw new Error(
        'En prueba se conecta solo el taller de la cuenta de los e2e: el mail tiene que ser el E2E_EMAIL de apps/web/.env.',
      );
    }
    const puntoDeVenta = Number(valores['punto-de-venta']);
    if (!Number.isInteger(puntoDeVenta) || puntoDeVenta < 1 || puntoDeVenta > 99_998) {
      throw new Error('Falta --punto-de-venta, de 1 a 99998.');
    }
    const desde =
      valores.desde === undefined ? entorno.hoy : exigirFecha(valores.desde, 'La fecha de --desde');
    return { tarea: 'conectar', email, puntoDeVenta, desde };
  }

  if (valores.desconectar) {
    return { tarea: 'desconectar', email: exigirEmail(valores.email), forzar: valores.forzar };
  }

  const id = valores.resolver ?? '';
  if (!ID.test(id)) throw new Error('--resolver lleva el id del comprobante.');
  if (valores.como === 'rechazada')
    return { tarea: 'resolver', id, resolucion: { como: 'rechazada' } };
  if (valores.como !== 'autorizada') {
    throw new Error('--como es autorizada (con --cae, --vence y --fecha) o rechazada.');
  }
  const cae = valores.cae ?? '';
  if (!/^\d{14}$/.test(cae)) throw new Error('--cae lleva los 14 dígitos del CAE.');
  return {
    tarea: 'resolver',
    id,
    resolucion: {
      como: 'autorizada',
      cae,
      vence: exigirFecha(valores.vence, 'El vencimiento del CAE (--vence)'),
      fecha: exigirFecha(valores.fecha, 'La fecha del comprobante (--fecha)'),
    },
  };
}

export function cuitTapado(cuit: string): string {
  const coincidencia = /^(\d{2})-\d{8}-(\d)$/.exec(cuit);
  return coincidencia === null ? '' : `${coincidencia[1] ?? ''}-••••••••-${coincidencia[2] ?? ''}`;
}

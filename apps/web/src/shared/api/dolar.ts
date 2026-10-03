import { cotizacionLeida, type Cotizacion } from '@maun/domain';

export interface DolarDeLaApi {
  compra: Cotizacion;
  venta: Cotizacion;
}

export interface SugerenciaDelDolar {
  mep: DolarDeLaApi | null;
  blue: DolarDeLaApi | null;
  hora: string | null;
}

interface DolarLeido {
  dolar: DolarDeLaApi;
  fecha: string;
}

export const RUTAS_DEL_DOLAR = {
  mep: 'https://dolarapi.com/v1/dolares/bolsa',
  blue: 'https://dolarapi.com/v1/dolares/blue',
} as const;

const ESPERA_MAXIMA = 4_000;
const VALE_POR = 5 * 60_000;

let ultimo: { cuando: number; sugerencia: SugerenciaDelDolar | null } | null = null;
let enCamino: Promise<SugerenciaDelDolar | null> | null = null;

function enCentavos(valor: unknown): Cotizacion | null {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return null;
  return cotizacionLeida(Math.round(valor * 100));
}

export function leerElDolar(cuerpo: unknown): DolarLeido | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) return null;
  const { compra, venta, fechaActualizacion } = cuerpo as Record<string, unknown>;
  const deCompra = enCentavos(compra);
  const deVenta = enCentavos(venta);
  if (deCompra === null || deVenta === null) return null;
  if (typeof fechaActualizacion !== 'string' || Number.isNaN(Date.parse(fechaActualizacion))) {
    return null;
  }
  return { dolar: { compra: deCompra, venta: deVenta }, fecha: fechaActualizacion };
}

async function pedirUno(ruta: string): Promise<DolarLeido | null> {
  const controlador = new AbortController();
  const reloj = setTimeout(() => {
    controlador.abort();
  }, ESPERA_MAXIMA);
  try {
    const respuesta = await fetch(ruta, { signal: controlador.signal, cache: 'no-store' });
    if (!respuesta.ok) return null;
    return leerElDolar(await respuesta.json());
  } catch {
    return null;
  } finally {
    clearTimeout(reloj);
  }
}

export function sugerenciaDelDolarGuardada(ahora: number = Date.now()): SugerenciaDelDolar | null {
  return ultimo !== null && ahora - ultimo.cuando < VALE_POR ? ultimo.sugerencia : null;
}

export function pedirLaSugerenciaDelDolar(
  ahora: number = Date.now(),
): Promise<SugerenciaDelDolar | null> {
  if (ultimo !== null && ahora - ultimo.cuando < VALE_POR) {
    return Promise.resolve(ultimo.sugerencia);
  }
  enCamino ??= Promise.all([pedirUno(RUTAS_DEL_DOLAR.mep), pedirUno(RUTAS_DEL_DOLAR.blue)])
    .then(([mep, blue]) => {
      const fechas = [mep?.fecha, blue?.fecha].filter((fecha) => fecha !== undefined).sort();
      const sugerencia =
        mep === null && blue === null
          ? null
          : { mep: mep?.dolar ?? null, blue: blue?.dolar ?? null, hora: fechas.at(-1) ?? null };
      ultimo = { cuando: ahora, sugerencia };
      return sugerencia;
    })
    .finally(() => {
      enCamino = null;
    });
  return enCamino;
}

export function olvidarLaSugerenciaDelDolar(): void {
  ultimo = null;
  enCamino = null;
}

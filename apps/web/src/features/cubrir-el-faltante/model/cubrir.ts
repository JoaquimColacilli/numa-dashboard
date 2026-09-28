import type { TesoroDelTaller } from '@/entities/tesoro';
import type { MovimientoNuevo } from '@/shared/api';
import { nombreDelMes } from '@/shared/lib';

export interface Fuente {
  id: string;
  monto: number | null;
}

export const CATEGORIA_DE_LA_COBERTURA = 'Cubrir el mes';

export function candidatosParaCubrir(
  tesoros: readonly TesoroDelTaller[],
  pasoId: string,
): TesoroDelTaller[] {
  const posibles = tesoros.filter(
    (tesoro) => !tesoro.archivado && tesoro.id !== pasoId && tesoro.clave !== 'diezmo',
  );
  return [
    ...posibles.filter((tesoro) => tesoro.clave === 'maun'),
    ...posibles.filter((tesoro) => tesoro.clave !== 'maun'),
  ];
}

export function notaDelCandidato(tesoro: Pick<TesoroDelTaller, 'clave'>): string | null {
  if (tesoro.clave === 'cocos') return 'Es el ahorro invertido: si lo usás, la meta se atrasa.';
  if (tesoro.clave === 'hogar') return 'Es la plata de la familia.';
  return null;
}

export function fuentesIniciales(
  candidatos: readonly TesoroDelTaller[],
  faltante: number,
): Fuente[] {
  const maun = candidatos.find((tesoro) => tesoro.clave === 'maun');
  if (!maun) return [];
  const monto = Math.min(faltante, maun.saldo);
  return monto > 0 ? [{ id: maun.id, monto }] : [];
}

export interface RevisionDeLaCobertura {
  cubierto: number;
  deMas: number;
  sinSaldo: ReadonlySet<string>;
  completo: boolean;
  sePuede: boolean;
}

export function revisarLaCobertura(
  fuentes: readonly Fuente[],
  candidatos: readonly TesoroDelTaller[],
  faltante: number,
): RevisionDeLaCobertura {
  let cubierto = 0;
  const sinSaldo = new Set<string>();
  for (const fuente of fuentes) {
    const monto = fuente.monto ?? 0;
    cubierto += monto;
    const tesoro = candidatos.find((candidato) => candidato.id === fuente.id);
    if (!tesoro || monto > Math.max(0, tesoro.saldo)) sinSaldo.add(fuente.id);
  }
  const deMas = Math.max(0, cubierto - faltante);
  return {
    cubierto,
    deMas,
    sinSaldo,
    completo: cubierto === faltante && faltante > 0,
    sePuede: cubierto > 0 && deMas === 0 && sinSaldo.size === 0,
  };
}

function idParaLaBase(tesoro: Pick<TesoroDelTaller, 'id' | 'clave'>): string | null {
  return tesoro.id === tesoro.clave ? null : tesoro.id;
}

export function mesEnPalabras(mes: string): string {
  return nombreDelMes(mes).toLowerCase();
}

export function movimientosParaCubrir({
  fuentes,
  candidatos,
  paso,
  mes,
  hoy,
  nuevoId,
}: {
  fuentes: readonly Fuente[];
  candidatos: readonly TesoroDelTaller[];
  paso: TesoroDelTaller;
  mes: string;
  hoy: string;
  nuevoId: () => string;
}): MovimientoNuevo[] {
  const movimientos: MovimientoNuevo[] = [];
  for (const fuente of fuentes) {
    const monto = fuente.monto ?? 0;
    const desde = candidatos.find((candidato) => candidato.id === fuente.id);
    if (!desde || monto <= 0) continue;
    movimientos.push({
      id: nuevoId(),
      fecha: hoy,
      tipo: 'transferencia',
      tesoro_origen: desde.clave,
      tesoro_destino: paso.clave,
      desde_id: idParaLaBase(desde),
      hacia_id: idParaLaBase(paso),
      cubre_el_mes: `${mes}-01`,
      monto_centavos: monto,
      categoria: CATEGORIA_DE_LA_COBERTURA,
      descripcion: `Para cubrir ${paso.nombre} de ${mesEnPalabras(mes)}`,
    });
  }
  return movimientos;
}

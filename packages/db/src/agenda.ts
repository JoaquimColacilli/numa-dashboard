import {
  esMes,
  leerLaFila,
  mesDe,
  vencimientosDeLaFila,
  type CategoriaDelTrabajo,
  type CategoriaPropia,
  type DatosDeLaAgenda,
  type GastoDeUnTesoro,
  type RangoDeLaAgenda,
  type VencimientoDeLaAgenda,
} from '@maun/domain';

import { filasDe, type FilaDe, type Replica } from './replica.ts';

export interface FilasDeLaAgenda {
  proyectos: readonly FilaDe<'proyectos'>[];
  clientes: readonly FilaDe<'clientes'>[];
  anotaciones: readonly FilaDe<'anotaciones'>[];
  proximos_contactos?: readonly FilaDe<'proximos_contactos'>[];
  ajustes?: readonly FilaDe<'ajustes'>[];
  tesoros?: readonly FilaDe<'tesoros'>[];
  movimientos?: readonly FilaDe<'movimientos'>[];
}

export const COLUMNAS_DE_MARCAS = [
  'presupuesto_importante',
  'visita_importante',
  'entrega_importante',
] as const;

export type ColumnaDeMarca = (typeof COLUMNAS_DE_MARCAS)[number];

export const COLUMNA_DE_LA_MARCA: Readonly<Record<CategoriaDelTrabajo, ColumnaDeMarca>> = {
  presupuesto: 'presupuesto_importante',
  visita: 'visita_importante',
  entrega: 'entrega_importante',
};

export const COLUMNAS_DE_LA_FECHA = [
  'vencimiento_presupuesto',
  'fecha_visita',
  'entrega_estimada',
] as const;

export type ColumnaDeLaFecha = (typeof COLUMNAS_DE_LA_FECHA)[number];

// De dónde sale la fecha de cada evento derivado, que es también la única columna donde esa fecha
// puede vivir: arrastrarlo en la agenda escribe acá (ADR 0045).
export const COLUMNA_DE_LA_FECHA: Readonly<Record<CategoriaDelTrabajo, ColumnaDeLaFecha>> = {
  presupuesto: 'vencimiento_presupuesto',
  visita: 'fecha_visita',
  entrega: 'entrega_estimada',
};

type FilaQuizasSinLoHechoNiLasMarcas = Partial<
  Pick<
    FilaDe<'proyectos'>,
    | 'visita_hecha'
    | 'entrega_hora'
    | 'visita_hora'
    | 'entrega_comprometida'
    | 'entrega_comprometida_franja'
    | ColumnaDeMarca
  >
>;

export function visitaHecha(proyecto: FilaDe<'proyectos'>): boolean {
  return (proyecto as FilaQuizasSinLoHechoNiLasMarcas).visita_hecha === true;
}

export function marcadaComoImportante(
  proyecto: FilaDe<'proyectos'>,
  categoria: CategoriaDelTrabajo,
): boolean {
  return (proyecto as FilaQuizasSinLoHechoNiLasMarcas)[COLUMNA_DE_LA_MARCA[categoria]] === true;
}

function horaSinSegundos(hora: string | null | undefined): string | null {
  return hora === null || hora === undefined ? null : hora.slice(0, 5);
}

export function horaDeLaEntrega(proyecto: FilaDe<'proyectos'>): string | null {
  return horaSinSegundos((proyecto as FilaQuizasSinLoHechoNiLasMarcas).entrega_hora);
}

export function horaDeLaVisita(proyecto: FilaDe<'proyectos'>): string | null {
  return horaSinSegundos((proyecto as FilaQuizasSinLoHechoNiLasMarcas).visita_hora);
}

export function entregaComprometida(proyecto: FilaDe<'proyectos'>): string | null {
  return (proyecto as FilaQuizasSinLoHechoNiLasMarcas).entrega_comprometida ?? null;
}

export function franjaDeLaEntrega(
  proyecto: FilaDe<'proyectos'>,
): FilaDe<'proyectos'>['entrega_comprometida_franja'] {
  return (proyecto as FilaQuizasSinLoHechoNiLasMarcas).entrega_comprometida_franja ?? null;
}

function sinBorrar(fila: { deleted_at?: string | null }): boolean {
  return (fila.deleted_at ?? null) === null;
}

export function gastosDeLosTesoros(
  movimientos: readonly FilaDe<'movimientos'>[],
  tesoros: readonly FilaDe<'tesoros'>[],
): GastoDeUnTesoro[] {
  const gastos: GastoDeUnTesoro[] = [];
  for (const movimiento of movimientos) {
    if (!sinBorrar(movimiento) || movimiento.tipo !== 'gasto') continue;
    const origen = movimiento.tesoro_origen;
    const tesoro =
      (movimiento as Partial<FilaDe<'movimientos'>>).desde_id ??
      (origen === null ? null : (tesoros.find((uno) => uno.clave === origen)?.id ?? origen));
    if (tesoro === null) continue;
    gastos.push({ tesoro, categoria: movimiento.categoria, fecha: movimiento.fecha });
  }
  return gastos;
}

const PARTES_DEL_MES = { year: 'numeric', month: '2-digit' } as const;

function formatoDelMes(zona: string | undefined): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat('en-CA', { ...PARTES_DEL_MES, timeZone: zona });
  } catch {
    return new Intl.DateTimeFormat('en-CA', PARTES_DEL_MES);
  }
}

export function mesEnLaZona(instante: string, zona?: string): string | null {
  const momento = new Date(instante);
  if (Number.isNaN(momento.getTime())) return null;
  const partes = formatoDelMes(zona).formatToParts(momento);
  const anio = partes.find((parte) => parte.type === 'year')?.value ?? '';
  const mes = partes.find((parte) => parte.type === 'month')?.value ?? '';
  const valor = `${anio}-${mes}`;
  return esMes(valor) ? valor : null;
}

function vencimientosDeLasFilas(
  filas: FilasDeLaAgenda,
  rango: RangoDeLaAgenda,
  zona: string | undefined,
): VencimientoDeLaAgenda[] {
  const desde = mesDe(rango.desde);
  const hasta = mesDe(rango.hasta);
  const ajustes = (filas.ajustes ?? []).find(sinBorrar) as Partial<FilaDe<'ajustes'>> | undefined;
  const guardada = ajustes?.fila ?? null;
  if (guardada === null) return [];

  const tesoros = filas.tesoros ?? [];
  const idDe = (clave: 'diezmo' | 'maun') =>
    tesoros.find((tesoro) => tesoro.clave === clave)?.id ?? clave;
  const fila = leerLaFila(guardada, { diezmo: idDe('diezmo'), maun: idDe('maun') });
  if (fila === null) return [];

  const guardadaEn = ajustes?.fila_guardada_at ?? null;
  return vencimientosDeLaFila(
    {
      fila,
      nombres: new Map(tesoros.map((tesoro) => [tesoro.id, tesoro.nombre])),
      guardada: guardadaEn === null ? null : mesEnLaZona(guardadaEn, zona),
      gastos: gastosDeLosTesoros(filas.movimientos ?? [], tesoros).filter((gasto) => {
        const mes = gasto.fecha.slice(0, 7);
        return mes >= desde && mes <= hasta;
      }),
    },
    { desde, hasta },
  );
}

export function datosDeLaAgenda(
  filas: FilasDeLaAgenda,
  rango: RangoDeLaAgenda,
  zona?: string,
): DatosDeLaAgenda {
  return {
    proyectos: filas.proyectos.map((proyecto) => ({
      id: proyecto.id,
      clienteId: proyecto.cliente_id,
      titulo: proyecto.titulo,
      estado: proyecto.estado,
      fechaVisita: proyecto.fecha_visita,
      visitaHora: horaDeLaVisita(proyecto),
      visitaHecha: visitaHecha(proyecto),
      entregaEstimada: proyecto.entrega_estimada,
      entregaHora: horaDeLaEntrega(proyecto),
      entregaComprometida: entregaComprometida(proyecto),
      entregaFranja: franjaDeLaEntrega(proyecto),
      vencimientoPresupuesto: proyecto.vencimiento_presupuesto,
      direccionEntrega: proyecto.direccion_entrega,
      importante: {
        presupuesto: marcadaComoImportante(proyecto, 'presupuesto'),
        visita: marcadaComoImportante(proyecto, 'visita'),
        entrega: marcadaComoImportante(proyecto, 'entrega'),
      },
    })),
    clientes: filas.clientes.map((cliente) => ({
      id: cliente.id,
      nombre: cliente.nombre,
      zona: cliente.zona,
    })),
    anotaciones: filas.anotaciones.map((anotacion) => ({
      id: anotacion.id,
      fecha: anotacion.fecha,
      hora: horaSinSegundos(anotacion.hora),
      texto: anotacion.texto,
      categoria: anotacion.categoria satisfies CategoriaPropia,
      proyectoId: anotacion.proyecto_id,
      hecha: anotacion.hecha,
      importante: anotacion.importante,
    })),
    proximos: (filas.proximos_contactos ?? [])
      .filter((proximo) => proximo.deleted_at === null)
      .map((proximo) => ({
        id: proximo.id,
        proyectoId: proximo.proyecto_id,
        fecha: proximo.fecha,
        hechoEl: proximo.hecho_el,
        nota: proximo.nota,
        importante: proximo.importante,
      })),
    vencimientos: vencimientosDeLasFilas(filas, rango, zona),
  };
}

export function datosDeLaAgendaDeLaReplica(
  replica: Replica,
  rango: RangoDeLaAgenda,
  zona?: string,
): DatosDeLaAgenda {
  return datosDeLaAgenda(
    {
      proyectos: filasDe(replica, 'proyectos'),
      clientes: filasDe(replica, 'clientes'),
      anotaciones: filasDe(replica, 'anotaciones'),
      proximos_contactos: filasDe(replica, 'proximos_contactos'),
      ajustes: filasDe(replica, 'ajustes'),
      tesoros: filasDe(replica, 'tesoros'),
      movimientos: filasDe(replica, 'movimientos'),
    },
    rango,
    zona,
  );
}

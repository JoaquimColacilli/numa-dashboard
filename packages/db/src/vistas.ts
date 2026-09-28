import {
  analisisDeEntregas,
  fechaDeApertura,
  filaDeSiempre,
  leerLaFila,
  restar,
  saldosDelLibro,
  saldosDelLibroPorId,
  sumar,
  type AnalisisDeEntregas,
  type AporteDelMes,
  type CambioDeFechaParaElAnalisis,
  type Cobertura,
  type DatosDelLibro,
  type EstadoLiquidado,
  type Fila,
  type LiquidacionDelMes,
  type LiquidacionRegistrada,
  type Money,
  type SaldosPorId,
  type SaldosPorTesoro,
  type Tesoro,
  type TrabajoParaElAnalisis,
} from '@maun/domain';

import { dinero } from './dinero.ts';
import { ajustesDe, filasDe, type FilaDe, type Replica } from './replica.ts';

const ORDEN_DE_LOS_DE_SIEMPRE: readonly Tesoro[] = ['hogar', 'maun', 'diezmo', 'cocos'];

export interface TesoroDeLaReplica {
  id: string;
  clave: Tesoro | null;
  nombre: string;
  descripcion: string;
  tinta: string;
  icono: string;
  meta: Money | null;
  rindeAnualBp: number | null;
  orden: number;
  archivado: boolean;
}

function lugarDelTesoro(fila: FilaDe<'tesoros'>): number {
  return fila.clave === null
    ? ORDEN_DE_LOS_DE_SIEMPRE.length
    : ORDEN_DE_LOS_DE_SIEMPRE.indexOf(fila.clave);
}

export function tesorosDeLaReplica(replica: Replica): TesoroDeLaReplica[] {
  const ajustes = ajustesDe(replica);
  return filasDe(replica, 'tesoros')
    .sort(
      (a, b) =>
        lugarDelTesoro(a) - lugarDelTesoro(b) ||
        a.orden - b.orden ||
        (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0) ||
        (a.id < b.id ? -1 : 1),
    )
    .map((fila) => {
      const deCocos = fila.clave === 'cocos';
      const metaDeCocos = ajustes?.meta_cocos_centavos ?? 0;
      return {
        id: fila.id,
        clave: fila.clave,
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        tinta: fila.tinta,
        icono: fila.icono,
        meta: deCocos
          ? metaDeCocos > 0
            ? dinero(metaDeCocos)
            : null
          : fila.meta_centavos === null
            ? null
            : dinero(fila.meta_centavos),
        rindeAnualBp: deCocos ? (ajustes?.tasa_cocos_anual_bp ?? 0) : fila.rinde_anual_bp,
        orden: fila.orden,
        archivado: fila.archivado_at !== null,
      };
    });
}

export function idDeLaClave(replica: Replica, clave: Tesoro): string {
  return filasDe(replica, 'tesoros').find((fila) => fila.clave === clave)?.id ?? clave;
}

function movimientoConIds(replica: Replica, movimiento: FilaDe<'movimientos'>) {
  const quizas = movimiento as Partial<FilaDe<'movimientos'>>;
  return {
    desdeId:
      quizas.desde_id ??
      (movimiento.tesoro_origen === null ? null : idDeLaClave(replica, movimiento.tesoro_origen)),
    haciaId:
      quizas.hacia_id ??
      (movimiento.tesoro_destino === null ? null : idDeLaClave(replica, movimiento.tesoro_destino)),
  };
}

export function datosDelLibro(replica: Replica): DatosDelLibro {
  return {
    tesoros: filasDe(replica, 'tesoros').map((tesoro) => ({ id: tesoro.id, clave: tesoro.clave })),
    movimientos: filasDe(replica, 'movimientos').map((movimiento) => ({
      id: movimiento.id,
      fecha: movimiento.fecha,
      tipo: movimiento.tipo,
      tesoroOrigen: movimiento.tesoro_origen,
      tesoroDestino: movimiento.tesoro_destino,
      ...movimientoConIds(replica, movimiento),
      monto: dinero(movimiento.monto_centavos),
      categoria: movimiento.categoria,
      descripcion: movimiento.descripcion,
      proyectoId: movimiento.proyecto_id,
    })),
    pagos: filasDe(replica, 'pagos').map((pago) => ({
      id: pago.id,
      proyectoId: pago.proyecto_id,
      fecha: pago.fecha,
      concepto: pago.concepto,
      monto: dinero(pago.monto_centavos),
      yaEnLaApertura: (pago as Partial<typeof pago>).ya_en_la_apertura === true,
    })),
    gastos: filasDe(replica, 'gastos').map((gasto) => ({
      id: gasto.id,
      proyectoId: gasto.proyecto_id,
      fecha: gasto.fecha,
      descripcion: gasto.descripcion,
      monto: dinero(gasto.monto_centavos),
    })),
    proyectos: filasDe(replica, 'proyectos').map((proyecto) => ({
      id: proyecto.id,
      titulo: proyecto.titulo,
      estado: proyecto.estado,
      fechaCobro: proyecto.fecha_cobro,
      diezmo: dinero(proyecto.dist_diezmo_centavos ?? 0),
      sueldo: dinero(proyecto.dist_sueldo_centavos ?? 0),
      repartoYaEnLaApertura:
        (proyecto as Partial<typeof proyecto>).reparto_ya_en_la_apertura === true,
    })),
    repartos: filasDe(replica, 'repartos').map((reparto) => ({
      id: reparto.id,
      proyectoId: reparto.proyecto_id,
      tesoroId: reparto.tesoro_id,
      clase: reparto.clase,
      monto: dinero(reparto.monto_centavos),
      fecha: reparto.fecha,
      yaEnLaApertura: reparto.ya_en_la_apertura,
    })),
  };
}

export function saldosDeLaReplica(replica: Replica): SaldosPorTesoro {
  return saldosDelLibro(datosDelLibro(replica));
}

export function saldosPorIdDeLaReplica(replica: Replica): SaldosPorId {
  return saldosDelLibroPorId(datosDelLibro(replica));
}

export function aperturaDeLaReplica(replica: Replica): string | null {
  return fechaDeApertura(datosDelLibro(replica).movimientos);
}

export interface TotalesDelProyecto {
  cobrado: Money;
  gastos: Money;
}

export function totalesPorProyecto(replica: Replica): Map<string, TotalesDelProyecto> {
  const cobrado = new Map<string, number>();
  const gastos = new Map<string, number>();

  for (const pago of filasDe(replica, 'pagos')) {
    cobrado.set(pago.proyecto_id, (cobrado.get(pago.proyecto_id) ?? 0) + pago.monto_centavos);
  }
  for (const gasto of filasDe(replica, 'gastos')) {
    gastos.set(gasto.proyecto_id, (gastos.get(gasto.proyecto_id) ?? 0) + gasto.monto_centavos);
  }

  const totales = new Map<string, TotalesDelProyecto>();
  for (const proyecto of filasDe(replica, 'proyectos')) {
    totales.set(proyecto.id, {
      cobrado: dinero(cobrado.get(proyecto.id) ?? 0),
      gastos: dinero(gastos.get(proyecto.id) ?? 0),
    });
  }
  return totales;
}

export function totalesDelProyecto(replica: Replica, proyectoId: string): TotalesDelProyecto {
  return totalesPorProyecto(replica).get(proyectoId) ?? { cobrado: dinero(0), gastos: dinero(0) };
}

function liquidacionDe(proyecto: FilaDe<'proyectos'>): LiquidacionRegistrada | undefined {
  const {
    estado,
    fecha_cobro: fecha,
    dist_liquidado_at: liquidadaEn,
    dist_sueldo_centavos: sueldo,
    dist_fijos_centavos: fijos,
    dist_objetivo_sueldo_centavos: objetivoSueldo,
    dist_objetivo_fijos_centavos: objetivoFijos,
    dist_sueldo_mensual: sueldoMensual,
  } = proyecto;

  if (estado !== 'cobrado' && estado !== 'perdido') return undefined;
  if (
    fecha === null ||
    liquidadaEn === null ||
    sueldo === null ||
    fijos === null ||
    objetivoSueldo === null ||
    objetivoFijos === null ||
    sueldoMensual === null
  ) {
    return undefined;
  }

  return {
    estado: estado satisfies EstadoLiquidado,
    fecha,
    liquidadaEn: Date.parse(liquidadaEn),
    sueldo: dinero(sueldo),
    fijos: dinero(fijos),
    objetivoSueldo: dinero(objetivoSueldo),
    objetivoFijos: dinero(objetivoFijos),
    sueldoMensual,
  };
}

export function liquidacionesDeLaReplica(
  replica: Replica,
  excepto?: string,
): LiquidacionRegistrada[] {
  const liquidaciones: LiquidacionRegistrada[] = [];
  for (const proyecto of filasDe(replica, 'proyectos')) {
    if (proyecto.id === excepto) continue;
    const liquidacion = liquidacionDe(proyecto);
    if (liquidacion) liquidaciones.push(liquidacion);
  }
  return liquidaciones;
}

export function porLaFila(proyecto: FilaDe<'proyectos'>): boolean {
  return ((proyecto as Partial<FilaDe<'proyectos'>>).dist_fila_version ?? null) !== null;
}

export function repartosDelProyecto(replica: Replica, proyectoId: string): FilaDe<'repartos'>[] {
  return filasDe(replica, 'repartos')
    .filter((reparto) => reparto.proyecto_id === proyectoId)
    .sort((a, b) => a.posicion - b.posicion);
}

export function liquidacionesDelMesDeLaReplica(
  replica: Replica,
  excepto?: string,
): LiquidacionDelMes[] {
  const hogar = idDeLaClave(replica, 'hogar');
  const maun = idDeLaClave(replica, 'maun');
  const repartos = new Map<string, FilaDe<'repartos'>[]>();
  for (const reparto of filasDe(replica, 'repartos')) {
    repartos.set(reparto.proyecto_id, [...(repartos.get(reparto.proyecto_id) ?? []), reparto]);
  }

  const liquidaciones: LiquidacionDelMes[] = [];
  for (const proyecto of filasDe(replica, 'proyectos')) {
    if (proyecto.id === excepto) continue;
    if (proyecto.estado !== 'cobrado' && proyecto.estado !== 'perdido') continue;
    if (proyecto.fecha_cobro === null || proyecto.dist_cobrado_centavos === null) continue;

    const neta = dinero(proyecto.dist_cobrado_centavos - (proyecto.dist_gastos_centavos ?? 0));
    const diezmo = dinero(proyecto.dist_diezmo_centavos ?? 0);

    if (porLaFila(proyecto)) {
      const aportes: AporteDelMes[] = (repartos.get(proyecto.id) ?? []).map((reparto) => ({
        tesoro: reparto.tesoro_id,
        monto: dinero(reparto.monto_centavos),
      }));
      let repartido = dinero(0);
      for (const aporte of aportes) repartido = sumar(repartido, aporte.monto);
      liquidaciones.push({
        fecha: proyecto.fecha_cobro,
        neta,
        diezmo,
        aportes,
        remanente: restar(restar(neta, diezmo), repartido),
      });
      continue;
    }

    const aportes: AporteDelMes[] = [];
    const sueldo = proyecto.dist_sueldo_centavos ?? 0;
    const fijos = proyecto.dist_fijos_centavos ?? 0;
    if (sueldo !== 0) aportes.push({ tesoro: hogar, monto: dinero(sueldo) });
    if (fijos !== 0) aportes.push({ tesoro: maun, monto: dinero(fijos) });
    liquidaciones.push({
      fecha: proyecto.fecha_cobro,
      neta,
      diezmo,
      aportes,
      remanente: dinero(proyecto.dist_remanente_centavos ?? 0),
    });
  }
  return liquidaciones;
}

export function coberturasDeLaReplica(replica: Replica): Cobertura[] {
  const coberturas: Cobertura[] = [];
  for (const movimiento of filasDe(replica, 'movimientos')) {
    const cubre = (movimiento as Partial<FilaDe<'movimientos'>>).cubre_el_mes ?? null;
    if (cubre === null) continue;
    const { haciaId } = movimientoConIds(replica, movimiento);
    if (haciaId === null) continue;
    coberturas.push({
      tesoro: haciaId,
      mes: cubre.slice(0, 7),
      monto: dinero(movimiento.monto_centavos),
    });
  }
  return coberturas;
}

export interface FilaDelTaller {
  fila: Fila;
  version: number;
  guardada: boolean;
  guardadaEn: string | null;
}

export function filaDelTaller(replica: Replica): FilaDelTaller {
  const ajustes = ajustesDe(replica) as Partial<FilaDe<'ajustes'>> | undefined;
  const guardada = leerLaFila(ajustes?.fila ?? null);
  return {
    fila:
      guardada ??
      filaDeSiempre(
        {
          sueldoMensual: dinero(ajustes?.sueldo_mensual_centavos ?? 0),
          costosFijos: dinero(ajustes?.costos_fijos_centavos ?? 0),
          sueldoTopeMensual: ajustes?.sueldo_tope_mensual ?? true,
        },
        { hogar: idDeLaClave(replica, 'hogar'), maun: idDeLaClave(replica, 'maun') },
      ),
    version: ajustes?.fila_version ?? 0,
    guardada: guardada !== null,
    guardadaEn: ajustes?.fila_guardada_at ?? null,
  };
}

export interface FilaParaLiquidar {
  fila: Fila;
  version: number;
}

function laReaperturaDeLaFila(valor: unknown): FilaParaLiquidar | null {
  if (typeof valor !== 'object' || valor === null) return null;
  const { version, fila } = valor as Record<string, unknown>;
  const leida = leerLaFila(fila);
  if (leida === null || typeof version !== 'number' || !Number.isInteger(version)) return null;
  return { fila: leida, version };
}

export function filaParaLiquidar(
  replica: Replica,
  proyecto: FilaDe<'proyectos'>,
  destino: EstadoLiquidado,
): FilaParaLiquidar {
  if (destino === 'cobrado') {
    const reapertura = laReaperturaDeLaFila(
      (proyecto as Partial<FilaDe<'proyectos'>>).reapertura_fila ?? null,
    );
    if (reapertura !== null) return reapertura;

    const {
      reapertura_fecha_cobro: fecha,
      reapertura_objetivo_sueldo_centavos: sueldo,
      reapertura_objetivo_fijos_centavos: fijos,
      reapertura_sueldo_mensual: mensual,
    } = proyecto;
    if (fecha !== null && sueldo !== null && fijos !== null && mensual !== null) {
      return {
        fila: filaDeSiempre(
          { sueldoMensual: dinero(sueldo), costosFijos: dinero(fijos), sueldoTopeMensual: mensual },
          { hogar: idDeLaClave(replica, 'hogar'), maun: idDeLaClave(replica, 'maun') },
        ),
        version: 0,
      };
    }
  }

  const { fila, version } = filaDelTaller(replica);
  return { fila, version };
}

export interface DatosDelAnalisis {
  trabajos: TrabajoParaElAnalisis[];
  cambios: CambioDeFechaParaElAnalisis[];
}

export function datosDelAnalisis(replica: Replica): DatosDelAnalisis {
  return {
    trabajos: filasDe(replica, 'proyectos').map((proyecto) => {
      const quizas = proyecto as Partial<typeof proyecto>;
      return {
        id: proyecto.id,
        titulo: proyecto.titulo,
        tipo: quizas.tipo_de_proyecto ?? null,
        estado: proyecto.estado,
        inicio: proyecto.fecha_inicio,
        listo: quizas.listo_el ?? null,
        entregado: proyecto.fecha_entrega,
      };
    }),
    cambios: filasDe(replica, 'cambios_de_fecha').map((cambio) => ({
      id: cambio.id,
      proyectoId: cambio.proyecto_id,
      tipo: cambio.tipo,
      fecha: cambio.fecha,
      origen: cambio.origen,
      creadoEn: cambio.created_at,
      trabajosEnCurso: cambio.trabajos_en_curso,
    })),
  };
}

export function analisisDeLaReplica(replica: Replica): AnalisisDeEntregas {
  const { trabajos, cambios } = datosDelAnalisis(replica);
  return analisisDeEntregas(trabajos, cambios);
}

export function objetivosDeLaReplica(replica: Replica): {
  sueldoMensual: Money;
  costosFijos: Money;
} {
  const ajustes = ajustesDe(replica);
  return {
    sueldoMensual: dinero(ajustes?.sueldo_mensual_centavos ?? 0),
    costosFijos: dinero(ajustes?.costos_fijos_centavos ?? 0),
  };
}

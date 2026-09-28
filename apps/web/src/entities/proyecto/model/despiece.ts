import {
  centavos,
  esAnteriorALaApertura,
  estaLiquidado,
  puntosBasicos,
  restar,
  sumar,
  type AjustesDeLiquidacion,
  type Distribucion,
  type Money,
  type Reapertura,
} from '@maun/domain';

import {
  ajustesDe,
  dinero,
  filasDe,
  idDeLaClave,
  porLaFila,
  repartosDelProyecto,
  tesorosDeLaReplica,
  type Replica,
} from '@/shared/api';
import {
  formatearPorcentaje,
  iconoDelTesoro,
  TESORO,
  TESOROS_EN_ORDEN,
  tintaDelTesoro,
  type TintaDeTesoro,
} from '@/shared/lib';
import type { NombreDeIcono } from '@/shared/ui';

import type { Proyecto } from './catalogos';
import { cobroPorLaFila, type CobroPorLaFila } from './por-la-fila';

export type TipoDePieza = 'diezmo' | 'paso' | 'parte' | 'resto';

export interface PiezaDelDespiece {
  id: string;
  tipo: TipoDePieza;
  etiqueta: string;
  tesoro: string;
  nombre: string;
  tinta: TintaDeTesoro;
  icono: NombreDeIcono;
  monto: Money;
  falta: Money;
  cubierto: boolean;
  parte: number;
}

export interface Despiece {
  modo: 'real' | 'proyeccion';
  cobrado: Money;
  gastos: Money;
  neta: Money;
  piezas: readonly PiezaDelDespiece[];
}

export interface MontoDelTesoro {
  tesoro: string;
  nombre: string;
  tinta: TintaDeTesoro;
  icono: NombreDeIcono;
  monto: Money;
}

const AJUSTES_EN_CERO: AjustesDeLiquidacion = {
  sueldoMensual: centavos(0),
  costosFijos: centavos(0),
  sueldoTopeMensual: false,
  perdidoConSueldo: false,
  perdidoConDiezmo: true,
};

export function ajustesDeLaReplica(replica: Replica): AjustesDeLiquidacion {
  const ajustes = ajustesDe(replica);
  if (!ajustes) return AJUSTES_EN_CERO;
  return {
    sueldoMensual: dinero(ajustes.sueldo_mensual_centavos),
    costosFijos: dinero(ajustes.costos_fijos_centavos),
    sueldoTopeMensual: ajustes.sueldo_tope_mensual,
    perdidoConSueldo: ajustes.perdido_con_sueldo,
    perdidoConDiezmo: ajustes.perdido_con_diezmo,
  };
}

export function reaperturaDe(proyecto: Proyecto): Reapertura | null {
  const {
    reapertura_fecha_cobro: fecha,
    reapertura_objetivo_sueldo_centavos: sueldo,
    reapertura_objetivo_fijos_centavos: fijos,
    reapertura_sueldo_mensual: mensual,
  } = proyecto;
  if (fecha === null || sueldo === null || fijos === null || mensual === null) return null;
  return {
    fecha,
    objetivoSueldo: dinero(sueldo),
    objetivoFijos: dinero(fijos),
    sueldoMensual: mensual,
  };
}

export function fechaDelCobroPropuesta(
  replica: Replica,
  proyecto: Proyecto,
  hoy: string,
  pagoFinal: string | null = null,
): string {
  const reapertura = reaperturaDe(proyecto);
  if (reapertura !== null) return reapertura.fecha;

  let ultima: string | null = pagoFinal !== null && pagoFinal !== '' ? pagoFinal : null;
  for (const pago of filasDe(replica, 'pagos')) {
    if (pago.proyecto_id !== proyecto.id) continue;
    if (ultima === null || pago.fecha > ultima) ultima = pago.fecha;
  }
  if (ultima === null || ultima > hoy) return hoy;
  return ultima;
}

export function repartoEnLaAperturaPropuesto(
  proyecto: Proyecto,
  fecha: string,
  apertura: string | null,
): boolean {
  if (!esAnteriorALaApertura(fecha, apertura)) return false;
  if (reaperturaDe(proyecto) === null) return true;
  return (proyecto as Partial<Proyecto>).reparto_ya_en_la_apertura === true;
}

const NOMBRE_DE_LA_CLASE: Readonly<Record<string, string>> = {
  sueldo: 'Sueldo',
  fijos: 'Gastos fijos',
  prioridad: 'Prioridad',
};

interface DatosDelTesoro {
  nombre: string;
  tinta: TintaDeTesoro;
  icono: NombreDeIcono;
}

type DatosPorId = (id: string) => DatosDelTesoro;

function datosDeLosTesoros(replica: Replica): DatosPorId {
  const porId = new Map(tesorosDeLaReplica(replica).map((tesoro) => [tesoro.id, tesoro]));
  return (id) => {
    const tesoro = porId.get(id);
    if (tesoro !== undefined) {
      return {
        nombre: tesoro.nombre,
        tinta: tintaDelTesoro(tesoro.tinta),
        icono: iconoDelTesoro(tesoro.icono),
      };
    }
    const clave = TESOROS_EN_ORDEN.find((una) => una === id);
    if (clave !== undefined) {
      const datos = TESORO[clave];
      return { nombre: datos.nombre, tinta: clave, icono: datos.icono };
    }
    return { nombre: 'Tesoro', tinta: 'maun', icono: 'vault' };
  };
}

interface PasoDelCorte {
  tesoro: string;
  nombre: string | null;
  clase: string | null;
  objetivo: Money;
  tope: Money;
  monto: Money;
}

interface ParteDelCorte {
  tesoro: string;
  nombre: string | null;
  porcentaje: number;
  monto: Money;
}

interface Corte {
  cobrado: Money;
  gastos: Money;
  neta: Money;
  diezmoBp: number;
  diezmo: Money;
  pasos: readonly PasoDelCorte[];
  partes: readonly ParteDelCorte[];
  resto: Money;
}

function despieceDelCorte(replica: Replica, modo: Despiece['modo'], corte: Corte): Despiece {
  const datos = datosDeLosTesoros(replica);
  const base = corte.neta > 0 ? corte.neta : 0;
  const parte = (monto: Money) => (base === 0 || monto <= 0 ? 0 : monto / base);
  const conNombre = (tesoro: string, nombre: string | null): DatosDelTesoro => {
    const propios = datos(tesoro);
    return nombre === null || nombre.trim() === '' ? propios : { ...propios, nombre };
  };

  const diezmo = idDeLaClave(replica, 'diezmo');
  const maun = idDeLaClave(replica, 'maun');

  const piezas: PiezaDelDespiece[] = [
    {
      id: 'diezmo',
      tipo: 'diezmo',
      etiqueta: `Diezmo ${formatearPorcentaje(corte.diezmoBp)}%`,
      tesoro: diezmo,
      ...datos(diezmo),
      monto: corte.diezmo,
      falta: centavos(0),
      cubierto: false,
      parte: parte(corte.diezmo),
    },
    ...corte.pasos.map((paso) => ({
      id: `paso-${paso.tesoro}`,
      tipo: 'paso' as const,
      etiqueta:
        (paso.clase === null ? undefined : NOMBRE_DE_LA_CLASE[paso.clase]) ?? 'Tope del mes',
      tesoro: paso.tesoro,
      ...conNombre(paso.tesoro, paso.nombre),
      monto: paso.monto,
      falta: paso.tope > paso.monto ? restar(paso.tope, paso.monto) : centavos(0),
      cubierto: paso.objetivo > 0 && paso.tope === 0,
      parte: parte(paso.monto),
    })),
    ...corte.partes.map((una) => ({
      id: `parte-${una.tesoro}`,
      tipo: 'parte' as const,
      etiqueta: `${formatearPorcentaje(una.porcentaje)}% de lo que sobra`,
      tesoro: una.tesoro,
      ...conNombre(una.tesoro, una.nombre),
      monto: una.monto,
      falta: centavos(0),
      cubierto: false,
      parte: parte(una.monto),
    })),
    {
      id: 'resto',
      tipo: 'resto',
      etiqueta: 'El resto',
      tesoro: maun,
      ...datos(maun),
      monto: corte.resto,
      falta: centavos(0),
      cubierto: false,
      parte: parte(corte.resto),
    },
  ];

  return { modo, cobrado: corte.cobrado, gastos: corte.gastos, neta: corte.neta, piezas };
}

export function despieceDelCobro(replica: Replica, { liquidacion }: CobroPorLaFila): Despiece {
  return despieceDelCorte(replica, 'proyeccion', {
    cobrado: liquidacion.cobrado,
    gastos: liquidacion.gastos,
    neta: liquidacion.neta,
    diezmoBp: liquidacion.diezmoBp,
    diezmo: liquidacion.diezmo,
    pasos: liquidacion.pasos.map((paso) => ({
      tesoro: paso.tesoro,
      nombre: null,
      clase: paso.clase,
      objetivo: paso.objetivo,
      tope: paso.tope,
      monto: paso.monto,
    })),
    partes: liquidacion.reparto.map((una) => ({
      tesoro: una.tesoro,
      nombre: null,
      porcentaje: una.porcentaje,
      monto: una.monto,
    })),
    resto: liquidacion.remanente,
  });
}

export function distribucionCongelada(proyecto: Proyecto): Distribucion | null {
  if (!estaLiquidado(proyecto.estado) || proyecto.dist_cobrado_centavos === null) return null;
  return {
    cobrado: dinero(proyecto.dist_cobrado_centavos),
    gastos: dinero(proyecto.dist_gastos_centavos ?? 0),
    diezmoBp: puntosBasicos(proyecto.dist_diezmo_bp ?? 0),
    topeSueldo: dinero(proyecto.dist_tope_sueldo_centavos ?? 0),
    topeFijos: dinero(proyecto.dist_tope_fijos_centavos ?? 0),
    neta: dinero(proyecto.dist_cobrado_centavos - (proyecto.dist_gastos_centavos ?? 0)),
    diezmo: dinero(proyecto.dist_diezmo_centavos ?? 0),
    sueldo: dinero(proyecto.dist_sueldo_centavos ?? 0),
    fijos: dinero(proyecto.dist_fijos_centavos ?? 0),
    remanente: dinero(proyecto.dist_remanente_centavos ?? 0),
    faltaSueldo: dinero(
      (proyecto.dist_tope_sueldo_centavos ?? 0) - (proyecto.dist_sueldo_centavos ?? 0),
    ),
    faltaFijos: dinero(
      (proyecto.dist_tope_fijos_centavos ?? 0) - (proyecto.dist_fijos_centavos ?? 0),
    ),
  };
}

function corteDeLosRepartos(replica: Replica, proyecto: Proyecto, congelada: Distribucion): Corte {
  const repartos = repartosDelProyecto(replica, proyecto.id);
  let repartido = centavos(0);
  for (const reparto of repartos) repartido = sumar(repartido, dinero(reparto.monto_centavos));
  return {
    cobrado: congelada.cobrado,
    gastos: congelada.gastos,
    neta: congelada.neta,
    diezmoBp: congelada.diezmoBp,
    diezmo: congelada.diezmo,
    pasos: repartos
      .filter((reparto) => reparto.tipo === 'paso')
      .map((reparto) => ({
        tesoro: reparto.tesoro_id,
        nombre: reparto.nombre,
        clase: reparto.clase,
        objetivo: dinero(reparto.objetivo_centavos ?? 0),
        tope: dinero(reparto.tope_centavos ?? reparto.monto_centavos),
        monto: dinero(reparto.monto_centavos),
      })),
    partes: repartos
      .filter((reparto) => reparto.tipo === 'parte')
      .map((reparto) => ({
        tesoro: reparto.tesoro_id,
        nombre: reparto.nombre,
        porcentaje: reparto.porcentaje_bp ?? 0,
        monto: dinero(reparto.monto_centavos),
      })),
    resto: restar(restar(congelada.neta, congelada.diezmo), repartido),
  };
}

function corteDeLasColumnas(replica: Replica, proyecto: Proyecto, congelada: Distribucion): Corte {
  return {
    cobrado: congelada.cobrado,
    gastos: congelada.gastos,
    neta: congelada.neta,
    diezmoBp: congelada.diezmoBp,
    diezmo: congelada.diezmo,
    pasos: [
      {
        tesoro: idDeLaClave(replica, 'hogar'),
        nombre: null,
        clase: 'sueldo',
        objetivo: dinero(proyecto.dist_objetivo_sueldo_centavos ?? 0),
        tope: congelada.topeSueldo,
        monto: congelada.sueldo,
      },
      {
        tesoro: idDeLaClave(replica, 'maun'),
        nombre: null,
        clase: 'fijos',
        objetivo: dinero(proyecto.dist_objetivo_fijos_centavos ?? 0),
        tope: congelada.topeFijos,
        monto: congelada.fijos,
      },
    ],
    partes: [],
    resto: congelada.remanente,
  };
}

function despieceCongelado(replica: Replica, proyecto: Proyecto): Despiece | null {
  const congelada = distribucionCongelada(proyecto);
  if (congelada === null) return null;
  return despieceDelCorte(
    replica,
    'real',
    porLaFila(proyecto)
      ? corteDeLosRepartos(replica, proyecto, congelada)
      : corteDeLasColumnas(replica, proyecto, congelada),
  );
}

export function despieceDelProyecto(replica: Replica, proyecto: Proyecto, hoy: string): Despiece {
  return (
    despieceCongelado(replica, proyecto) ??
    despieceDelCobro(
      replica,
      cobroPorLaFila(replica, proyecto, fechaDelCobroPropuesta(replica, proyecto, hoy)),
    )
  );
}

export function loQueRecibeCadaTesoro(despiece: Despiece): MontoDelTesoro[] {
  const porTesoro = new Map<string, MontoDelTesoro>();
  for (const pieza of despiece.piezas) {
    if (pieza.monto <= 0) continue;
    const previo = porTesoro.get(pieza.tesoro);
    porTesoro.set(
      pieza.tesoro,
      previo === undefined
        ? {
            tesoro: pieza.tesoro,
            nombre: pieza.nombre,
            tinta: pieza.tinta,
            icono: pieza.icono,
            monto: pieza.monto,
          }
        : { ...previo, monto: sumar(previo.monto, pieza.monto) },
    );
  }
  return [...porTesoro.values()];
}

export function loQueVuelveAlReabrir(replica: Replica, proyecto: Proyecto): MontoDelTesoro[] {
  const congelado = despieceCongelado(replica, proyecto);
  if (congelado === null) return [];
  const maun = idDeLaClave(replica, 'maun');
  return loQueRecibeCadaTesoro(congelado).filter((tesoro) => tesoro.tesoro !== maun);
}

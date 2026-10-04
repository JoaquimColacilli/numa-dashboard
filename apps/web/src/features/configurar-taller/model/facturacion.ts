import {
  categoriaLeida,
  conceptoLeido,
  esAmbienteDeArca,
  numeroConCeros,
  puntoDeVentaConCeros,
  type AmbienteDeArca,
  type CategoriaDelMonotributo,
  type ConceptoDeArca,
} from '@maun/domain';

import type { CambiosDeAjustes, EstadoDeLaFacturacion, FilaDe } from '@/shared/api';
import type { Mensajes } from '@/shared/idioma';
import { fechaCorta, horaEnElTaller } from '@/shared/lib';

export const LARGO_MAXIMO_DE_INGRESOS_BRUTOS = 40;

type AjustesQuePuedenFaltar = Partial<FilaDe<'ajustes'>> | undefined;

export interface ConexionDelTaller {
  ambiente: AmbienteDeArca | null;
  cuit: string;
  puntoDeVenta: number | null;
  desde: string | null;
}

export function conexionDelTaller(ajustes: AjustesQuePuedenFaltar): ConexionDelTaller {
  const ambiente = ajustes?.facturacion_ambiente;
  return {
    ambiente: esAmbienteDeArca(ambiente) ? ambiente : null,
    cuit: ajustes?.facturacion_cuit ?? '',
    puntoDeVenta: ajustes?.facturacion_punto_de_venta ?? null,
    desde: ajustes?.facturacion_desde ?? null,
  };
}

export function puntoDeVentaEscrito(puntoDeVenta: number | null): string {
  return puntoDeVenta === null ? '' : puntoDeVentaConCeros(puntoDeVenta);
}

export interface DatosDeLaFacturacion {
  ingresosBrutos: string;
  inicioDeActividades: string;
  concepto: ConceptoDeArca;
  categoria: CategoriaDelMonotributo | null;
}

export function datosDeLaFacturacion(ajustes: AjustesQuePuedenFaltar): DatosDeLaFacturacion {
  return {
    ingresosBrutos: ajustes?.facturacion_ingresos_brutos ?? '',
    inicioDeActividades: ajustes?.facturacion_inicio_de_actividades ?? '',
    concepto: conceptoLeido(ajustes?.facturacion_concepto),
    categoria: categoriaLeida(ajustes?.facturacion_categoria),
  };
}

export type CampoDeLaFacturacion = keyof DatosDeLaFacturacion;

const CAMPOS: readonly CampoDeLaFacturacion[] = [
  'ingresosBrutos',
  'inicioDeActividades',
  'concepto',
  'categoria',
];

function columnas(datos: DatosDeLaFacturacion): CambiosDeAjustes {
  return {
    facturacion_ingresos_brutos: datos.ingresosBrutos.trim(),
    facturacion_inicio_de_actividades:
      datos.inicioDeActividades === '' ? null : datos.inicioDeActividades,
    facturacion_concepto: datos.concepto,
    facturacion_categoria: datos.categoria,
  };
}

const COLUMNA_DEL_CAMPO: Readonly<Record<CampoDeLaFacturacion, keyof CambiosDeAjustes>> = {
  ingresosBrutos: 'facturacion_ingresos_brutos',
  inicioDeActividades: 'facturacion_inicio_de_actividades',
  concepto: 'facturacion_concepto',
  categoria: 'facturacion_categoria',
};

export interface CambiosDeLaFacturacion {
  campos: CampoDeLaFacturacion[];
  cambios: CambiosDeAjustes;
  previos: CambiosDeAjustes;
}

export function cambiosDeLaFacturacion(
  guardados: DatosDeLaFacturacion,
  ahora: DatosDeLaFacturacion,
): CambiosDeLaFacturacion {
  const antes = columnas(guardados);
  const despues = columnas(ahora);
  const campos = CAMPOS.filter(
    (campo) => antes[COLUMNA_DEL_CAMPO[campo]] !== despues[COLUMNA_DEL_CAMPO[campo]],
  );
  const cambios: CambiosDeAjustes = {};
  const previos: CambiosDeAjustes = {};
  for (const campo of campos) {
    const columna = COLUMNA_DEL_CAMPO[campo];
    Object.assign(cambios, { [columna]: despues[columna] });
    Object.assign(previos, { [columna]: antes[columna] });
  }
  return { campos, cambios, previos };
}

export function problemaDeLaFacturacion(
  datos: DatosDeLaFacturacion,
): 'ingresos-brutos-largo' | null {
  return datos.ingresosBrutos.trim().length > LARGO_MAXIMO_DE_INGRESOS_BRUTOS
    ? 'ingresos-brutos-largo'
    : null;
}

export function enPesosEnteros(centavos: number): number {
  return Math.trunc(centavos / 100) * 100;
}

export type TonoDeLaPrueba = 'bien' | 'atencion' | 'alerta';

export interface RespuestaDeLaPrueba {
  tono: TonoDeLaPrueba;
  texto: string;
  vence: string | null;
}

export function respuestaDeLaPrueba(
  estado: EstadoDeLaFacturacion,
  m: Mensajes['facturacion']['conexion'],
): RespuestaDeLaPrueba {
  const vence =
    estado.certificadoVence === null ? null : m.vence(fechaCorta(estado.certificadoVence));
  if (!estado.prendido) return { tono: 'atencion', texto: m.apagada, vence: null };
  if (estado.login === 'esperando' && estado.esperarHasta !== null) {
    return { tono: 'atencion', texto: m.esperando(horaEnElTaller(estado.esperarHasta)), vence };
  }
  if (estado.login === 'rechazado' || estado.login === 'sin-certificado') {
    return { tono: 'alerta', texto: m.noEntra, vence };
  }
  if (estado.login === 'ok' && estado.servidor === 'ok') {
    const ultimo = estado.ultimoNumero ?? 0;
    return {
      tono: 'bien',
      texto: ultimo > 0 ? m.anda(numeroConCeros(ultimo)) : m.andaSinFacturas,
      vence,
    };
  }
  return { tono: 'alerta', texto: m.noContesta, vence };
}

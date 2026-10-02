import {
  calcularSena,
  centavosEn,
  MONEDA_DEL_TALLER,
  unaSolaForma,
  type FormaDeCobro,
  type Moneda,
  type PuntosBasicos,
  type SenaDelTrabajo,
} from '@maun/domain';

import {
  aprobacionDeUnaOpcion,
  datosActualesDelProyecto,
  opcionAprobada,
  ultimoContactoAlGuardar,
  type Comprobante,
  type FormaDePago,
  type GuardadoDeProyecto,
  type OpcionDePresupuesto,
  type Proyecto,
} from '@/entities/proyecto';
import { monedaDelTrabajo, type DatosDeProyecto, type PagoParaGuardar } from '@/shared/api';
import { mensajes } from '@/shared/idioma';

import { clavesDelPago } from './pagoDeLaConsulta';

export interface ValoresDelPasaje {
  presupuesto: number | null;
  opcion: string | null;
  sena: number | null;
  monedaDeLaSena: Moneda;
  cotizacionDeLaSena: number | null;
  tesoroDeLaSena: string | null;
  forma: FormaDePago;
  comprobante: Comprobante;
  inicio: string;
  entrega: string;
  direccion: string;
  diaDeLaSena: string;
  senaEnLaApertura: boolean;
}

type LoQueDecideElPresupuesto = Pick<ValoresDelPasaje, 'presupuesto' | 'opcion'>;

export function opcionElegida(
  opciones: readonly OpcionDePresupuesto[],
  id: string | null,
): OpcionDePresupuesto | undefined {
  return opciones.find((opcion) => opcion.id === id);
}

export function presupuestoDelPasaje(
  opciones: readonly OpcionDePresupuesto[],
  valores: LoQueDecideElPresupuesto,
): number | null {
  if (opciones.length === 0) return valores.presupuesto;
  return opcionElegida(opciones, valores.opcion)?.monto_centavos ?? null;
}

export function errorDelPasaje(
  opciones: readonly OpcionDePresupuesto[],
  valores: LoQueDecideElPresupuesto,
  moneda: Moneda = MONEDA_DEL_TALLER,
): string | undefined {
  const { errores } = mensajes().avanzarLaConsulta.pasaje;
  if (opciones.length > 0) {
    return opcionElegida(opciones, valores.opcion) === undefined ? errores.opcion : undefined;
  }
  if (valores.presupuesto !== null) return undefined;
  return moneda === MONEDA_DEL_TALLER ? errores.presupuesto : errores.presupuestoEnDolares;
}

export function senaDelPasaje(
  aprobado: number | null,
  cobrado: number,
  porcentajeDelTaller: PuntosBasicos,
  porcentajeDelTrabajo: PuntosBasicos | null,
  moneda: Moneda = MONEDA_DEL_TALLER,
): SenaDelTrabajo<Moneda> {
  return calcularSena<Moneda>({
    presupuesto: aprobado === null ? null : centavosEn(moneda, aprobado),
    cobrado: centavosEn(moneda, cobrado),
    porcentajeDelTaller,
    porcentajeDelTrabajo,
  });
}

export function senaSugerida(sena: SenaDelTrabajo<Moneda>): number | null {
  return sena.situacion === 'falta' ? sena.falta : null;
}

export interface ResumenDelPasaje {
  antes: number;
  ahora: number;
  cobrado: number;
  saldo: number | null;
}

export function resumenDelPasaje(
  aprobado: number | null,
  antes: number,
  sena: number | null,
): ResumenDelPasaje {
  const ahora = sena === null || sena <= 0 ? 0 : sena;
  const cobrado = antes + ahora;
  return {
    antes,
    ahora,
    cobrado,
    saldo: aprobado === null ? null : Math.max(0, aprobado - cobrado),
  };
}

export function formaSugerida(
  guardada: FormaDePago | null,
  formasDeLaSena: readonly FormaDeCobro[],
): FormaDePago {
  if (guardada !== null) return guardada;
  return unaSolaForma(formasDeLaSena) ?? 'transferencia';
}

export function haySenaAhora(sena: number | null): boolean {
  return sena !== null && sena > 0;
}

function pagoDeLaSena(
  valores: ValoresDelPasaje,
  id: string,
  delTrabajo: Moneda,
): PagoParaGuardar[] {
  if (valores.sena === null || !haySenaAhora(valores.sena)) return [];
  return [
    {
      id,
      fecha: valores.diaDeLaSena,
      concepto: mensajes().avanzarLaConsulta.conceptos.senaAlAprobar,
      monto_centavos: valores.sena,
      ya_en_la_apertura: valores.senaEnLaApertura,
      ...clavesDelPago(
        {
          moneda: valores.monedaDeLaSena,
          cotizacion: valores.cotizacionDeLaSena,
          tesoroId: valores.tesoroDeLaSena,
        },
        delTrabajo,
      ),
    },
  ];
}

export function guardadoDelPasaje(
  proyecto: Proyecto,
  opciones: readonly OpcionDePresupuesto[],
  valores: ValoresDelPasaje,
  hoy: string,
  idDelPago: string,
): GuardadoDeProyecto {
  const datos: DatosDeProyecto = {
    ...datosActualesDelProyecto(proyecto),
    estado: 'en_curso',
    ultimo_contacto: ultimoContactoAlGuardar(proyecto, 'en_curso', hoy),
    presupuesto_centavos: presupuestoDelPasaje(opciones, valores),
    forma_pago: valores.forma,
    comprobante: valores.comprobante,
    fecha_inicio: valores.inicio === '' ? null : valores.inicio,
    entrega_estimada: valores.entrega === '' ? null : valores.entrega,
    direccion_entrega: valores.direccion.trim(),
  };

  const pagos = pagoDeLaSena(valores, idDelPago, monedaDelTrabajo(proyecto));

  const elegida = opcionElegida(opciones, valores.opcion);
  if (elegida === undefined || elegida.id === opcionAprobada(opciones)?.id) {
    return {
      pedido: { id: proyecto.id, version: proyecto.version, datos, pagos, gastos: [] },
      previos: { proyecto, pagos: [], gastos: [], opciones: [], necesidades: [] },
    };
  }

  const aprobacion = aprobacionDeUnaOpcion(proyecto, opciones, elegida.id, true);
  return { ...aprobacion, pedido: { ...aprobacion.pedido, datos, pagos } };
}

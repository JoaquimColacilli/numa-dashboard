import { CERO, maximo, mesDe, restar, sumar, sumarTodos, type Money } from '@maun/domain';

import {
  filasDe,
  idDeLaClave,
  liquidacionesDelMesDeLaReplica,
  tesorosDeLaReplica,
  type Replica,
  type Tesoro,
} from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import {
  etiquetaActual,
  mesEnUnaFrase,
  nombreDelMes,
  TESORO,
  TESOROS_EN_ORDEN,
  tintaDelTesoro,
  type TintaDeTesoro,
} from '@/shared/lib';
import type { PiezaDelTablero } from '@/shared/ui';

import { distribucionCongelada } from './despiece';
import { porcentaje } from './porcentaje';

export interface ParteDelCorte {
  tesoro: string;
  clave: Tesoro | null;
  nombre: string;
  tinta: TintaDeTesoro;
  monto: Money;
}

export interface CorteDelMes {
  trabajos: number;
  tablero: Money;
  partes: readonly ParteDelCorte[];
  gastos: Money;
}

interface DatosDeLaParte {
  clave: Tesoro | null;
  nombre: string;
  tinta: TintaDeTesoro;
  lugar: number;
}

function datosDeLasPartes(replica: Replica): (id: string) => DatosDeLaParte {
  const tesoros = tesorosDeLaReplica(replica);
  return (id) => {
    const lugar = tesoros.findIndex((tesoro) => tesoro.id === id);
    const tesoro = tesoros[lugar];
    if (tesoro !== undefined) {
      return {
        clave: tesoro.clave,
        nombre: tesoro.nombre,
        tinta: tintaDelTesoro(tesoro.tinta),
        lugar,
      };
    }
    const clave = TESOROS_EN_ORDEN.find((una) => una === id);
    if (clave !== undefined) {
      return {
        clave,
        nombre: TESORO[clave].nombre,
        tinta: clave,
        lugar: TESOROS_EN_ORDEN.indexOf(clave),
      };
    }
    return {
      clave: null,
      nombre: mensajes().proyecto.tesoroSinNombre,
      tinta: 'maun',
      lugar: Number.MAX_SAFE_INTEGER,
    };
  };
}

function loQueRecibioCadaTesoro(replica: Replica, mes: string): Map<string, Money> {
  const diezmo = idDeLaClave(replica, 'diezmo');
  const maun = idDeLaClave(replica, 'maun');
  const recibido = new Map<string, Money>();
  const sumarAl = (tesoro: string, monto: Money) => {
    if (monto <= 0) return;
    recibido.set(tesoro, sumar(recibido.get(tesoro) ?? CERO, monto));
  };

  for (const liquidacion of liquidacionesDelMesDeLaReplica(replica)) {
    if (mesDe(liquidacion.fecha) !== mes) continue;
    sumarAl(diezmo, liquidacion.diezmo);
    for (const aporte of liquidacion.aportes) sumarAl(aporte.tesoro, aporte.monto);
    sumarAl(maun, maximo(liquidacion.remanente, CERO));
  }
  return recibido;
}

export function corteDelMes(replica: Replica, mes: string): CorteDelMes | null {
  let trabajos = 0;
  let tablero = CERO;
  for (const proyecto of filasDe(replica, 'proyectos')) {
    if (proyecto.fecha_cobro === null || mesDe(proyecto.fecha_cobro) !== mes) continue;
    const distribucion = distribucionCongelada(proyecto);
    if (distribucion === null) continue;
    trabajos += 1;
    tablero = sumar(tablero, distribucion.cobrado);
  }
  if (trabajos === 0) return null;

  const datosDe = datosDeLasPartes(replica);
  const partes = [...loQueRecibioCadaTesoro(replica, mes)]
    .map(([tesoro, monto]) => ({ tesoro, monto, datos: datosDe(tesoro) }))
    .sort((una, otra) => otra.monto - una.monto || una.datos.lugar - otra.datos.lugar)
    .map(({ tesoro, monto, datos: { clave, nombre, tinta } }) => ({
      tesoro,
      clave,
      nombre,
      tinta,
      monto,
    }));

  return {
    trabajos,
    tablero,
    partes,
    gastos: restar(tablero, sumarTodos(partes.map((parte) => parte.monto))),
  };
}

export function piezasDelCorte(corte: CorteDelMes): PiezaDelTablero[] {
  if (corte.tablero === 0) return [];
  const piezas: { id: string; tono: PiezaDelTablero['tono']; nombre: string; monto: Money }[] = [
    ...corte.partes.map((parte) => ({
      id: parte.clave ?? parte.tesoro,
      tono: parte.tinta,
      nombre: parte.nombre,
      monto: parte.monto,
    })),
    {
      id: 'gastos',
      tono: 'sobrante',
      nombre: mensajes().proyecto.corte.gastos,
      monto: corte.gastos,
    },
  ];

  return piezas
    .filter((pieza) => pieza.monto > 0)
    .map(({ monto, ...pieza }) => {
      const parte = monto / corte.tablero;
      return { ...pieza, parte, porcentaje: porcentaje(parte) };
    });
}

function parteDelTablero(monto: Money, tablero: Money): string {
  const texto = porcentaje(monto / tablero);
  return texto === '0%' ? mensajes().proyecto.corte.menosDelUno : texto;
}

function aDondeVa(parte: ParteDelCorte, cuanto: string): string {
  const textos = mensajes().proyecto.corte;
  switch (parte.clave) {
    case 'hogar':
      return textos.alHogar(cuanto);
    case 'maun':
      return textos.alTaller(cuanto);
    case 'diezmo':
      return textos.alDiezmo(cuanto);
    default:
      return textos.aOtroTesoro(cuanto, parte.nombre);
  }
}

export function fraseDelCorte(corte: CorteDelMes | null, mes: string): string {
  const textos = mensajes().proyecto.corte;
  if (corte === null) return textos.sinCorte(nombreDelMes(mes));

  const enElMes = mesEnUnaFrase(mes);
  if (corte.tablero === 0) return textos.sinNadaCobrado(corte.trabajos, enElMes);

  const partes = corte.partes
    .filter((parte) => parte.monto > 0)
    .map((parte) => aDondeVa(parte, parteDelTablero(parte.monto, corte.tablero)));
  if (partes.length === 0) return textos.sinIngreso(corte.trabajos, enElMes);

  const lista = new Intl.ListFormat(etiquetaActual(), { type: 'conjunction' }).format(partes);
  return corte.gastos > 0
    ? textos.repartidoConGastos(corte.trabajos, enElMes, lista)
    : textos.repartido(corte.trabajos, enElMes, lista);
}

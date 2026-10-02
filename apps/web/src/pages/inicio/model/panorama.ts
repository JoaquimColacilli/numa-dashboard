import {
  CERO,
  centavosEn,
  claveDelNombre,
  enPesos,
  esDeLaMoneda,
  importeDelTaller,
  maximo,
  plataEn,
  restar,
  sumar,
  sumarTodos,
  tipoDelPaso,
  type Fila,
  type FilaDelMes,
  type Money,
  type MovimientoDelLibro,
  type Plata,
  type TesorosDelSistema,
} from '@maun/domain';

import { loQueHayQuePagar, tiposDelTesoro } from '@/entities/fila';
import { equivalenteEnPesos, ultimoCambioEntre, type UltimoCambio } from '@/entities/movimiento';
import { saldoEnPesos, type TesoroDelTaller } from '@/entities/tesoro';
import { mensajes } from '@/shared/idioma';

export const AYUDA_DEL_PANORAMA = 'Dónde está la plata y para qué la podés usar.';

export interface EntradaDelPanorama {
  fila: Fila;
  delMes: FilaDelMes;
  sistema: TesorosDelSistema;
  tesoros: readonly TesoroDelTaller[];
  movimientos: readonly MovimientoDelLibro[];
  insumos: Money;
  trabajosConInsumos: number;
}

export interface DolaresDelTaller {
  total: Money<'USD'>;
  tesoros: number;
  ultimoCambio: UltimoCambio | null;
}

export interface PanoramaDelTaller {
  paraPagar: Money;
  ahorros: Money;
  superavit: Money;
  insumos: Money;
  compromisoDeMaun: Money;
  tesorosParaPagar: number;
  tesorosDeAhorro: number;
  tesoroDelSuperavit: string;
  trabajosConInsumos: number;
  enDolares?: DolaresDelTaller | null;
}

export function gastadoEnLosRenglones(
  movimientos: readonly MovimientoDelLibro[],
  tesoro: string,
  renglones: readonly string[],
  mes: string,
): Money {
  const claves = new Set(
    renglones.map((renglon) => claveDelNombre(renglon)).filter((clave) => clave !== ''),
  );
  return sumarTodos(
    movimientos
      .filter(
        (movimiento) =>
          movimiento.tipo === 'gasto' &&
          movimiento.desdeId === tesoro &&
          movimiento.fecha.startsWith(`${mes}-`) &&
          claves.has(claveDelNombre(movimiento.categoria)),
      )
      .map((movimiento) => importeDelTaller(movimiento.monto)),
  );
}

export function compromisoDeMaun({
  fila,
  delMes,
  sistema,
  movimientos,
}: Pick<EntradaDelPanorama, 'fila' | 'delMes' | 'sistema' | 'movimientos'>): Money {
  const paso = fila.pasos.find(
    (candidato) =>
      candidato.tesoro === sistema.maun && tipoDelPaso(candidato.clase) === 'compromiso',
  );
  const delPaso = delMes.pasos.find((candidato) => candidato.tesoro === sistema.maun);
  if (paso === undefined || delPaso === undefined) return CERO;
  const gastado = gastadoEnLosRenglones(
    movimientos,
    sistema.maun,
    paso.renglones.map((renglon) => renglon.nombre),
    delMes.mes,
  );
  return maximo(CERO, restar(delPaso.lleva, gastado));
}

function esDeAhorro(
  fila: Fila,
  sistema: TesorosDelSistema,
  tesoro: Pick<TesoroDelTaller, 'id'>,
): boolean {
  if (tesoro.id === fila.superavit) return false;
  if (tesoro.id === sistema.hogar || tesoro.id === sistema.maun) return false;
  if (tesoro.id === sistema.diezmo) return false;
  const tipos = tiposDelTesoro(fila, tesoro.id);
  if (tipos.includes('obligacion') || tipos.includes('compromiso')) return false;
  return true;
}

function dolaresDelTaller(
  tesoros: readonly TesoroDelTaller[],
  movimientos: readonly MovimientoDelLibro[],
): DolaresDelTaller | null {
  const saldos = tesoros.flatMap((tesoro) =>
    !tesoro.archivado && esDeLaMoneda(tesoro.saldo, 'USD') ? [tesoro.saldo.importe] : [],
  );
  if (saldos.length === 0) return null;
  return {
    total: saldos.reduce((suma, saldo) => sumar(suma, saldo), centavosEn('USD', 0)),
    tesoros: saldos.length,
    ultimoCambio: ultimoCambioEntre(movimientos, tesoros),
  };
}

export function panoramaDelTaller(entrada: EntradaDelPanorama): PanoramaDelTaller {
  const { fila, delMes, sistema, tesoros, insumos } = entrada;
  const deMaun = compromisoDeMaun(entrada);
  const aPagar = loQueHayQuePagar(delMes).map((renglon) => renglon.aPagar);
  const ahorros = tesoros.flatMap((tesoro) => {
    if (tesoro.archivado || !esDeAhorro(fila, sistema, tesoro)) return [];
    const saldo = saldoEnPesos(tesoro);
    return saldo === null ? [] : [saldo];
  });

  const delTesoro = tesoros.find((tesoro) => tesoro.id === fila.superavit);
  const delSuperavit = (delTesoro === undefined ? null : saldoEnPesos(delTesoro)) ?? CERO;
  const superavit =
    fila.superavit === sistema.maun ? restar(restar(delSuperavit, insumos), deMaun) : delSuperavit;

  return {
    paraPagar: sumarTodos([...aPagar, deMaun]),
    ahorros: sumarTodos(ahorros),
    superavit,
    insumos,
    compromisoDeMaun: deMaun,
    tesorosParaPagar: [...aPagar, deMaun].filter((monto) => monto > 0).length,
    tesorosDeAhorro: ahorros.length,
    tesoroDelSuperavit: fila.superavit,
    trabajosConInsumos: entrada.trabajosConInsumos,
    enDolares: dolaresDelTaller(tesoros, entrada.movimientos),
  };
}

function enTesoros(cuantos: number): string {
  return cuantos === 1 ? 'en un tesoro' : `en ${String(cuantos)} tesoros`;
}

export interface CifraDelPanorama {
  id: 'para-pagar' | 'ahorros' | 'superavit' | 'insumos' | 'en-dolares';
  etiqueta: string;
  monto: Plata;
  detalle: string;
  equivalente: string | null;
}

export function cifrasDelPanorama(
  panorama: PanoramaDelTaller,
  nombreDelSuperavit: string,
): CifraDelPanorama[] {
  const trabajos = panorama.trabajosConInsumos;
  const cifras: CifraDelPanorama[] = [
    {
      id: 'para-pagar',
      etiqueta: 'Para pagar',
      monto: enPesos(panorama.paraPagar),
      detalle:
        panorama.tesorosParaPagar === 0 ? 'nada pendiente' : enTesoros(panorama.tesorosParaPagar),
      equivalente: null,
    },
    {
      id: 'ahorros',
      etiqueta: 'Ahorros',
      monto: enPesos(panorama.ahorros),
      detalle:
        panorama.tesorosDeAhorro === 0
          ? 'todavía sin ahorros'
          : enTesoros(panorama.tesorosDeAhorro),
      equivalente: null,
    },
    {
      id: 'superavit',
      etiqueta: 'Superávit',
      monto: enPesos(panorama.superavit),
      detalle:
        panorama.superavit < 0
          ? `en ${nombreDelSuperavit}, que no alcanza`
          : `en ${nombreDelSuperavit}`,
      equivalente: null,
    },
    {
      id: 'insumos',
      etiqueta: 'Insumos de los trabajos',
      monto: enPesos(panorama.insumos),
      detalle:
        trabajos === 0
          ? 'sin trabajos en curso'
          : trabajos === 1
            ? 'de un trabajo'
            : `de ${String(trabajos)} trabajos`,
      equivalente: null,
    },
  ];
  const { enDolares } = panorama;
  if (enDolares !== undefined && enDolares !== null) {
    cifras.push({
      id: 'en-dolares',
      etiqueta: mensajes().inicio.panorama.enDolares,
      monto: plataEn('USD', enDolares.total),
      detalle: enTesoros(enDolares.tesoros),
      equivalente: equivalenteEnPesos(enDolares.total, enDolares.ultimoCambio),
    });
  }
  return cifras;
}

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

import { loQueEs } from '@/entities/fila';
import { equivalenteEnPesos, ultimoCambioEntre, type UltimoCambio } from '@/entities/movimiento';
import { saldoEnPesos, type TesoroDelTaller } from '@/entities/tesoro';
import { mensajes } from '@/shared/idioma';

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
  metas: Money;
  cajas: Money;
  insumos: Money;
  compromisoDeMaun: Money;
  tesorosParaPagar: number;
  tesorosDeMetas: number;
  tesorosDeCajas: number;
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
  const { fila, sistema, tesoros, insumos } = entrada;
  const deMaun = compromisoDeMaun(entrada);
  const paraPagar: Money[] = [];
  const metas: Money[] = [];
  const cajas: Money[] = [];
  for (const tesoro of tesoros) {
    if (tesoro.archivado) continue;
    const saldo = saldoEnPesos(tesoro);
    if (saldo === null) continue;
    const queEs = loQueEs(fila, tesoro);
    if (queEs === 'deuda-destinada' || queEs === 'deuda-obligatoria') {
      paraPagar.push(maximo(CERO, saldo));
    } else if (queEs === 'meta') {
      metas.push(saldo);
    } else if (tesoro.id === sistema.maun) {
      cajas.push(restar(restar(saldo, insumos), deMaun));
    } else {
      cajas.push(saldo);
    }
  }
  const conElDeMaun = [...paraPagar, deMaun];

  return {
    paraPagar: sumarTodos(conElDeMaun),
    metas: sumarTodos(metas),
    cajas: sumarTodos(cajas),
    insumos,
    compromisoDeMaun: deMaun,
    tesorosParaPagar: conElDeMaun.filter((monto) => monto > 0).length,
    tesorosDeMetas: metas.length,
    tesorosDeCajas: cajas.length,
    trabajosConInsumos: entrada.trabajosConInsumos,
    enDolares: dolaresDelTaller(tesoros, entrada.movimientos),
  };
}

export interface CifraDelPanorama {
  id: 'para-pagar' | 'metas' | 'cajas' | 'insumos' | 'en-dolares';
  etiqueta: string;
  monto: Plata;
  detalle: string;
  equivalente: string | null;
}

export function cifrasDelPanorama(panorama: PanoramaDelTaller): CifraDelPanorama[] {
  const textos = mensajes().paginaInicio.panorama;
  const trabajos = panorama.trabajosConInsumos;
  const cifras: CifraDelPanorama[] = [
    {
      id: 'para-pagar',
      etiqueta: textos.paraPagar,
      monto: enPesos(panorama.paraPagar),
      detalle:
        panorama.tesorosParaPagar === 0
          ? textos.nadaPendiente
          : textos.enTesoros(panorama.tesorosParaPagar),
      equivalente: null,
    },
    {
      id: 'metas',
      etiqueta: textos.metas,
      monto: enPesos(panorama.metas),
      detalle:
        panorama.tesorosDeMetas === 0
          ? textos.todaviaSinMetas
          : textos.enTesoros(panorama.tesorosDeMetas),
      equivalente: null,
    },
    {
      id: 'cajas',
      etiqueta: textos.cajas,
      monto: enPesos(panorama.cajas),
      detalle:
        panorama.cajas < 0 && (panorama.insumos > 0 || panorama.compromisoDeMaun > 0)
          ? textos.noAlcanzanParaLosInsumos
          : textos.sinLosInsumos(panorama.tesorosDeCajas),
      equivalente: null,
    },
    {
      id: 'insumos',
      etiqueta: textos.insumos,
      monto: enPesos(panorama.insumos),
      detalle: trabajos === 0 ? textos.sinTrabajosEnCurso : textos.deTrabajos(trabajos),
      equivalente: null,
    },
  ];
  const { enDolares } = panorama;
  if (enDolares !== undefined && enDolares !== null) {
    cifras.push({
      id: 'en-dolares',
      etiqueta: textos.enDolares,
      monto: plataEn('USD', enDolares.total),
      detalle: textos.enTesoros(enDolares.tesoros),
      equivalente: equivalenteEnPesos(enDolares.total, enDolares.ultimoCambio),
    });
  }
  return cifras;
}

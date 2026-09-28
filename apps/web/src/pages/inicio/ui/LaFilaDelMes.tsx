import type { FilaDelMes } from '@maun/domain';

import { Globo } from '@/entities/fila';
import type { TesoroDelTaller } from '@/entities/tesoro';
import {
  diaDelMes,
  diasDelMes,
  formatearPesos,
  Ir,
  nombreDelMes,
  RUTA_DE_TESOROS,
  TINTA,
  type TintaDeTesoro,
} from '@/shared/lib';
import { Ayuda, Icono } from '@/shared/ui';

import {
  fraseDeLoQueSobra,
  gananciaDelMes,
  pasosEnInicio,
  textoDelEstado,
  type PasoEnInicio,
} from '../model/la-fila';

const TONO_DEL_ESTADO: Readonly<Record<PasoEnInicio['estado'], string>> = {
  cubierto: 'text-text-2',
  falta: 'font-semibold text-ink',
  espera: 'text-text-3',
};

function BarraDelPaso({ paso, dia }: { paso: PasoEnInicio; dia: number }) {
  const lleno = paso.tope <= 0 ? 100 : Math.min(100, (paso.lleva / paso.tope) * 100);
  const cuanto = `${formatearPesos(paso.lleva)} de ${formatearPesos(paso.tope)}`;
  const estado = textoDelEstado(paso);
  return (
    <li className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-3 gap-y-1.5">
      <Globo numero={paso.numero} className="mt-0.5" />
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 text-label">
        <span className="font-medium">
          {paso.nombre}
          {paso.clase !== null && <span className="text-text-3"> · {paso.clase}</span>}
        </span>
        <span className="text-text-2 tabular-nums">{cuanto}</span>
      </div>
      <span />
      <div>
        <div
          role="progressbar"
          aria-label={`Paso ${String(paso.numero)}: ${paso.nombre}`}
          aria-valuenow={Math.round(lleno)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${cuanto}. ${estado}`}
          className="relative h-1.5 rounded-control bg-surface-2"
        >
          <div
            className={`h-full rounded-control ${TINTA[paso.tinta].fondo}`}
            style={{ width: `${String(lleno)}%` }}
          />
          <span
            aria-hidden
            data-dia-del-mes
            className="absolute -top-1 h-3.5 w-px bg-ink/40"
            style={{ left: `${String(dia)}%` }}
          />
        </div>
        <p className={`mt-1 flex items-center gap-1 text-meta ${TONO_DEL_ESTADO[paso.estado]}`}>
          {paso.estado === 'cubierto' && <Icono nombre="check" tamano={12} grosor={2.25} />}
          {estado}
        </p>
      </div>
    </li>
  );
}

export interface LaFilaDelMesProps {
  delMes: FilaDelMes;
  tesoros: readonly TesoroDelTaller[];
  diezmo: TintaDeTesoro;
  hoy: string;
}

export function LaFilaDelMes({ delMes, tesoros, diezmo, hoy }: LaFilaDelMesProps) {
  const titulo = `La fila de ${nombreDelMes(delMes.mes).toLowerCase()}`;
  const dia = (diaDelMes(hoy) / diasDelMes(delMes.mes)) * 100;
  return (
    <section
      aria-label={titulo}
      className="@container flex flex-col gap-4 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-label font-semibold">
            {titulo}
            <Ayuda que="Qué es la fila del mes">
              Así va el mes: cada cobro llena los topes en este orden y lo que sobra se reparte. La
              raya fina marca el día de hoy.
            </Ayuda>
          </h2>
          <p className="mt-0.5 text-meta text-text-2">{gananciaDelMes(delMes)}</p>
        </div>
        <Ir
          a={RUTA_DE_TESOROS}
          className="-my-2 -mr-2 flex min-h-tap flex-none items-center gap-1 rounded-pill px-2 text-label font-medium text-ink hover:bg-surface"
        >
          Ver la fila
          <Icono nombre="chevron-right" tamano={16} />
        </Ir>
      </div>
      <ol aria-label="Los pasos, en orden" className="flex flex-col gap-3.5">
        <li className="grid grid-cols-[24px_minmax(0,1fr)] items-baseline gap-x-3">
          <span aria-hidden className="flex justify-center">
            <span className={`size-2 rounded-pill ${TINTA[diezmo].fondo}`} />
          </span>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-label">
            <span className="font-medium">
              Diezmo <span className="text-text-3">· primero</span>
            </span>
            <span className="text-text-2 tabular-nums">
              {formatearPesos(delMes.diezmo)} apartado
            </span>
          </div>
        </li>
        {pasosEnInicio(delMes, tesoros).map((paso) => (
          <BarraDelPaso key={paso.tesoro} paso={paso} dia={dia} />
        ))}
      </ol>
      <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-3 border-t border-hairline pt-3.5">
        <span aria-hidden className="flex justify-center pt-0.5 text-text-2">
          <Icono nombre="split" tamano={16} />
        </span>
        <div className="text-label">
          <p className="font-medium">Lo que sobra</p>
          <p className="mt-0.5 text-text-2">{fraseDeLoQueSobra(delMes, tesoros)}</p>
        </div>
      </div>
    </section>
  );
}

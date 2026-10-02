import type { FilaDelMes } from '@maun/domain';
import type { ReactNode } from 'react';

import { AyudaDelGrupo, Globo, NOMBRE_DEL_GRUPO, type GrupoDeLaFila } from '@/entities/fila';
import type { TesoroDelTaller } from '@/entities/tesoro';
import { useMensajes } from '@/shared/idioma';
import {
  diaDelMes,
  diasDelMes,
  formatearPesos,
  Ir,
  mesEnUnaFrase,
  RUTA_DE_TESOROS,
  TINTA,
} from '@/shared/lib';
import { Ayuda, Icono } from '@/shared/ui';

import {
  cuantoLleva,
  fraseDeLoQueSobra,
  ingresoDelMes,
  obligacionesEnInicio,
  pasosEnInicio,
  textoDeLaObligacion,
  textoDelEstado,
  type ObligacionEnInicio,
  type PasoEnInicio,
} from '../model/la-fila';

const TONO_DEL_ESTADO: Readonly<Record<PasoEnInicio['estado'], string>> = {
  cubierto: 'text-text-2',
  meta: 'text-text-2',
  falta: 'font-semibold text-ink',
  espera: 'text-text-3',
  'por-trabajo': 'text-text-2',
};

function GrupoEnLaFila({
  grupo,
  desde,
  children,
}: {
  grupo: GrupoDeLaFila;
  desde: number;
  children: ReactNode;
}) {
  const titulo = NOMBRE_DEL_GRUPO[grupo];
  return (
    <div role="group" aria-label={titulo} className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-1 text-meta font-semibold text-text-3">
        {titulo}
        <AyudaDelGrupo grupo={grupo} />
      </h3>
      <ol start={desde} className="flex flex-col gap-3.5">
        {children}
      </ol>
    </div>
  );
}

function RenglonDeLaObligacion({ obligacion }: { obligacion: ObligacionEnInicio }) {
  const m = useMensajes();
  return (
    <li className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-3 gap-y-1">
      <Globo numero={obligacion.numero} className="mt-0.5" />
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 text-label">
        <span className="font-medium">
          <span translate="no">{obligacion.nombre}</span>
          <span className="text-text-3"> · {obligacion.regla}</span>
        </span>
        <span className="text-text-2 tabular-nums">
          {m.paginaInicio.laFila.apartado(formatearPesos(obligacion.apartado))}
        </span>
      </div>
      <span />
      <p
        className={`text-meta ${obligacion.aPagar > 0 ? 'font-semibold text-ink' : 'text-text-2'}`}
      >
        {textoDeLaObligacion(obligacion)}
      </p>
    </li>
  );
}

function BarraDelPaso({ paso, dia }: { paso: PasoEnInicio; dia: number }) {
  const m = useMensajes();
  const lleno = paso.tope <= 0 ? 100 : Math.min(100, (paso.lleva / paso.tope) * 100);
  const cuanto = cuantoLleva(paso);
  const estado = textoDelEstado(paso);
  return (
    <li className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-3 gap-y-1.5">
      <Globo numero={paso.numero} className="mt-0.5" />
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 text-label">
        <span className="font-medium">
          <span translate="no">{paso.nombre}</span>
          {paso.clase !== null && <span className="text-text-3"> · {paso.clase}</span>}
        </span>
        <span className="text-text-2 tabular-nums">{cuanto}</span>
      </div>
      <span />
      <div>
        {paso.estado !== 'por-trabajo' && (
          <div
            role="progressbar"
            aria-label={m.paginaInicio.laFila.paso(paso.numero, paso.nombre)}
            aria-valuenow={Math.round(lleno)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${cuanto}. ${estado}`}
            className="relative mb-1 h-1.5 rounded-control bg-surface-2"
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
        )}
        <p className={`flex items-center gap-1 text-meta ${TONO_DEL_ESTADO[paso.estado]}`}>
          {(paso.estado === 'cubierto' || paso.estado === 'meta') && (
            <Icono nombre="check" tamano={12} grosor={2.25} />
          )}
          {estado}
        </p>
      </div>
    </li>
  );
}

export interface LaFilaDelMesProps {
  delMes: FilaDelMes;
  tesoros: readonly TesoroDelTaller[];
  hoy: string;
}

export function LaFilaDelMes({ delMes, tesoros, hoy }: LaFilaDelMesProps) {
  const m = useMensajes();
  const textos = m.paginaInicio.laFila;
  const titulo = textos.titulo(mesEnUnaFrase(delMes.mes));
  const dia = (diaDelMes(hoy) / diasDelMes(delMes.mes)) * 100;
  const obligaciones = obligacionesEnInicio(delMes, tesoros);
  const pasos = pasosEnInicio(delMes, tesoros, obligaciones.length);
  const compromisos = pasos.filter((paso) => paso.tipo === 'compromiso');
  const ahorros = pasos.filter((paso) => paso.tipo === 'ahorro-fijo');

  return (
    <section
      aria-label={titulo}
      className="@container flex flex-col gap-4 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-label font-semibold">
            {titulo}
            <Ayuda que={textos.queEs}>{textos.ayuda}</Ayuda>
          </h2>
          <p className="mt-0.5 text-meta text-text-2">{ingresoDelMes(delMes)}</p>
        </div>
        <Ir
          a={RUTA_DE_TESOROS}
          className="-my-2 -mr-2 flex min-h-tap flex-none items-center gap-1 rounded-pill px-2 text-label font-medium text-ink hover:bg-surface"
        >
          {textos.verLaFila}
          <Icono nombre="chevron-right" tamano={16} />
        </Ir>
      </div>
      {obligaciones.length > 0 && (
        <GrupoEnLaFila grupo="obligaciones" desde={1}>
          {obligaciones.map((obligacion) => (
            <RenglonDeLaObligacion key={obligacion.tesoro} obligacion={obligacion} />
          ))}
        </GrupoEnLaFila>
      )}
      {compromisos.length > 0 && (
        <GrupoEnLaFila grupo="compromisos" desde={compromisos[0]?.numero ?? 1}>
          {compromisos.map((paso) => (
            <BarraDelPaso key={paso.tesoro} paso={paso} dia={dia} />
          ))}
        </GrupoEnLaFila>
      )}
      {ahorros.length > 0 && (
        <GrupoEnLaFila grupo="ahorros" desde={ahorros[0]?.numero ?? 1}>
          {ahorros.map((paso) => (
            <BarraDelPaso key={paso.tesoro} paso={paso} dia={dia} />
          ))}
        </GrupoEnLaFila>
      )}
      <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-3 border-t border-hairline pt-3.5">
        <span aria-hidden className="flex justify-center pt-0.5 text-text-2">
          <Icono nombre="split" tamano={16} />
        </span>
        <div className="text-label">
          <p className="font-medium">{textos.loQueSobra}</p>
          <p className="mt-0.5 text-text-2">{fraseDeLoQueSobra(delMes, tesoros)}</p>
        </div>
      </div>
    </section>
  );
}

import type { Hueco } from '@maun/domain';
import type { ReactNode } from 'react';

import { Button, Icono } from '@/shared/ui';

import { DATO, type Marca, type Valores } from '../../model/presupuestoDelTaller';
import { DATO_EN_EL_TEXTO } from './TextoConDatos';

const BOTON_DE_MOVER =
  'flex size-11 flex-none items-center justify-center rounded-pill text-text-2 hover:bg-surface hover:text-ink disabled:text-text-3 disabled:opacity-40 disabled:hover:bg-transparent';

interface BotonesDeMoverProps {
  que: string;
  primera: boolean;
  ultima: boolean;
  alMover: (hacia: -1 | 1) => void;
}

function BotonesDeMover({ que, primera, ultima, alMover }: BotonesDeMoverProps) {
  return (
    <span className="flex flex-none">
      <button
        type="button"
        data-mover="arriba"
        aria-label={`Subir ${que}`}
        disabled={primera}
        onClick={() => {
          alMover(-1);
        }}
        className={BOTON_DE_MOVER}
      >
        <Icono nombre="chevron-up" tamano={18} />
      </button>
      <button
        type="button"
        data-mover="abajo"
        aria-label={`Bajar ${que}`}
        disabled={ultima}
        onClick={() => {
          alMover(1);
        }}
        className={BOTON_DE_MOVER}
      >
        <Icono nombre="chevron-down" tamano={18} />
      </button>
    </span>
  );
}

export function FilaParaOrdenar({
  id,
  texto,
  que,
  primera,
  ultima,
  movida,
  alMover,
}: {
  id: string;
  texto: ReactNode;
  que: string;
  primera: boolean;
  ultima: boolean;
  movida: boolean;
  alMover: (hacia: -1 | 1) => void;
}) {
  return (
    <li
      data-clausula={id}
      data-movida={movida ? '' : undefined}
      className="border-t border-hairline-soft py-0.5 first:border-t-0"
    >
      <span
        className={`flex items-center gap-2 rounded-field pl-2.5 ${movida ? 'bg-surface' : ''}`}
      >
        <span className="min-w-0 flex-1 py-2">
          <span className="line-clamp-2 text-body leading-normal text-ink @min-[40rem]/lista:line-clamp-1">
            {texto}
          </span>
        </span>
        <BotonesDeMover que={que} primera={primera} ultima={ultima} alMover={alMover} />
      </span>
    </li>
  );
}

export function CabeceraDeLaLista({
  resumen,
  ordenando,
  sePuedeOrdenar,
  ayudaAlOrdenar = 'Subí o bajá cada uno: así salen en el presupuesto.',
  alOrdenar,
}: {
  resumen: string;
  ordenando: boolean;
  sePuedeOrdenar: boolean;
  ayudaAlOrdenar?: string;
  alOrdenar: (ordenando: boolean) => void;
}) {
  return (
    <div className="flex min-h-tap items-center justify-between gap-3 border-b border-hairline-soft pb-1">
      <p aria-live="polite" className="min-w-0 text-label leading-snug text-text-2">
        {ordenando ? ayudaAlOrdenar : resumen}
      </p>
      {sePuedeOrdenar &&
        (ordenando ? (
          <Button
            variant="secundario"
            size="chico"
            className="flex-none px-4"
            onClick={() => {
              alOrdenar(false);
            }}
          >
            Listo
          </Button>
        ) : (
          <button
            type="button"
            onClick={() => {
              alOrdenar(true);
            }}
            className="-mr-1.5 inline-flex min-h-tap flex-none items-center gap-1.5 rounded-pill px-1.5 text-label font-semibold text-ink underline underline-offset-3 hover:bg-surface"
          >
            <Icono nombre="arrow-up-down" tamano={15} />
            Ordenar
          </button>
        ))}
    </div>
  );
}

export function MarcaSinGuardar({ marca, nuevo }: { marca: Marca; nuevo: string }) {
  if (marca === null) return null;
  return (
    <span className="mt-1 flex items-center gap-1.5 text-meta text-text-2">
      <Icono nombre="clock" tamano={13} />
      {marca === 'nueva' ? `${nuevo}, sin guardar` : 'Cambiado, sin guardar'}
    </span>
  );
}

export function FilaQuitada({ texto, alDeshacer }: { texto: ReactNode; alDeshacer: () => void }) {
  return (
    <li
      data-quitada=""
      className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-1 border-t border-hairline-soft py-1 first:border-t-0"
    >
      <span className="flex size-11 items-center justify-center text-text-3">
        <Icono nombre="trash-2" tamano={17} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5 px-1.5 py-2">
        <span className="line-clamp-2 text-body leading-normal text-text-3 line-through">
          {texto}
        </span>
        <span className="text-meta text-text-2">Se va cuando guardes.</span>
      </span>
      <Button variant="terciario" size="chico" onClick={alDeshacer} className="min-h-tap">
        Deshacer
      </Button>
    </li>
  );
}

export function LeyendaDeLosDatos({
  datos,
  valores,
}: {
  datos: readonly Hueco[];
  valores: Valores;
}) {
  if (datos.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label font-semibold text-text-2">Lo marcado se completa solo</p>
      <ul className="flex flex-col gap-1.5">
        {datos.map((hueco) => (
          <li key={hueco} className="text-label leading-relaxed text-text-2">
            <span className={DATO_EN_EL_TEXTO}>{valores[hueco]}</span> {DATO[hueco].explicacion}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SumarUnDato({
  datos,
  alSumar,
}: {
  datos: readonly Hueco[];
  alSumar: (hueco: Hueco) => void;
}) {
  if (datos.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label text-text-2">Sumar un dato que se completa solo</p>
      <div className="flex flex-wrap gap-2">
        {datos.map((hueco) => (
          <button
            key={hueco}
            type="button"
            onMouseDown={(evento) => {
              evento.preventDefault();
            }}
            onClick={() => {
              alSumar(hueco);
            }}
            className="inline-flex min-h-tap items-center gap-1.5 rounded-pill border border-dashed border-border bg-paper px-3.5 text-label font-medium text-ink hover:bg-surface"
          >
            <Icono nombre="plus" tamano={15} />
            {DATO[hueco].nombre}
          </button>
        ))}
      </div>
    </div>
  );
}

export type LugarEnElPresupuesto =
  'datos' | 'aTenerEnCuenta' | 'incluye' | 'formasDePago' | 'avisos' | 'condiciones' | 'garantia';

function tinta(activo: boolean): string {
  return activo ? 'bg-ink' : 'bg-border';
}

export function Ubicacion({ lugar }: { lugar: LugarEnElPresupuesto }) {
  const es = (otro: LugarEnElPresupuesto) => lugar === otro;
  return (
    <span
      aria-hidden
      data-ubicacion={lugar}
      className="flex h-15 w-10.5 flex-none flex-col gap-[3px] rounded-[3px] border border-border bg-paper px-[5px] py-[6px]"
    >
      <span className="flex items-start justify-between">
        <span className={`h-[4px] w-[45%] rounded-[1px] ${tinta(es('datos'))}`} />
        <span className={`h-[4px] w-[18%] rounded-[1px] ${tinta(es('datos'))}`} />
      </span>
      <span className="h-[2px] w-full rounded-[1px] bg-border" />
      <span
        className={`h-[5px] w-full rounded-[1px] border ${
          es('aTenerEnCuenta') ? 'border-ink bg-ink' : 'border-border'
        }`}
      />
      <span className={`h-[2px] w-[62%] rounded-[1px] ${tinta(es('incluye'))}`} />
      <span className={`h-[2px] w-[48%] rounded-[1px] ${tinta(es('incluye'))}`} />
      <span className="h-[3px] w-[34%] self-end rounded-[1px] bg-border" />
      <span className={`h-[2px] w-[55%] rounded-[1px] ${tinta(es('formasDePago'))}`} />
      <span className={`h-[2px] w-full rounded-[1px] ${tinta(es('avisos'))}`} />
      <span className={`h-[2px] w-[78%] rounded-[1px] ${tinta(es('avisos'))}`} />
      <span className={`h-[2px] w-[70%] rounded-[1px] ${tinta(es('condiciones'))}`} />
      <span className={`h-[2px] w-[52%] rounded-[1px] ${tinta(es('garantia'))}`} />
      <span className={`mt-auto h-[2px] w-[64%] rounded-[1px] ${tinta(es('datos'))}`} />
    </span>
  );
}

export function BajadaConUbicacion({
  lugar,
  children,
}: {
  lugar: LugarEnElPresupuesto;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-label leading-relaxed text-text-2">
        {children}
      </div>
      <Ubicacion lugar={lugar} />
    </div>
  );
}

export function EnTramos({ partes }: { partes: readonly string[] }) {
  return (
    <>
      {partes.map((parte, indice) => (
        <span key={parte}>
          <span className="whitespace-nowrap">
            {parte}
            {indice < partes.length - 1 ? ' ·' : ''}
          </span>
          {indice < partes.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  );
}

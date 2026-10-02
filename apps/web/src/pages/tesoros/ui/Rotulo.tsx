import type { ReactNode } from 'react';

import { useMensajes } from '@/shared/idioma';
import { Icono, type NombreDeIcono } from '@/shared/ui';

function Casilla({
  titulo,
  valor,
  valorTraducible = false,
  className = '',
}: {
  titulo: string;
  valor: string;
  valorTraducible?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex flex-none items-baseline gap-1.5 px-3 ${className}`}>
      <span className="text-[10px] text-text-3">{titulo}</span>
      <span
        translate={valorTraducible ? undefined : 'no'}
        className="font-semibold text-ink tabular-nums"
      >
        {valor}
      </span>
    </span>
  );
}

export function BotonDelZoom({
  icono,
  etiqueta,
  alTocar,
}: {
  icono: NombreDeIcono;
  etiqueta: string;
  alTocar?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      disabled={alTocar === undefined}
      onClick={alTocar}
      className="apretable flex size-11 items-center justify-center text-ink [--transicion-propia:background-color_var(--dur-fast)_var(--ease-out)] hover:bg-surface disabled:text-text-3 disabled:hover:bg-transparent"
    >
      <Icono nombre={icono} tamano={18} />
    </button>
  );
}

export function ControlesQuietos() {
  const textos = useMensajes().paginaTesoros.rotulo;
  return (
    <div role="group" aria-label={textos.controles} className="flex divide-x divide-hairline">
      <BotonDelZoom icono="minus" etiqueta={textos.alejar} />
      <BotonDelZoom icono="plus" etiqueta={textos.acercar} />
      <BotonDelZoom icono="scan" etiqueta={textos.verTodaLaFila} />
    </div>
  );
}

export interface RotuloDelLienzoProps {
  revision: number;
  rige: string;
  escala?: string;
  controles?: ReactNode;
}

export function RotuloDelLienzo({ revision, rige, escala, controles }: RotuloDelLienzoProps) {
  const textos = useMensajes().paginaTesoros.rotulo;
  return (
    <div
      role="group"
      aria-label={textos.rotuloDelPlano}
      className="rotulo-del-plano box-content flex h-11 flex-none items-stretch justify-between border-t border-border bg-paper text-badge text-text-2 uppercase"
    >
      <div className="flex min-w-0 items-center divide-x divide-hairline overflow-hidden">
        <Casilla
          titulo={textos.plano}
          valor={textos.laFilaDeLosTesoros}
          valorTraducible
          className="pl-4"
        />
        <Casilla titulo={textos.revision} valor={String(revision)} />
        <Casilla titulo={textos.rige} valor={rige} />
        {escala !== undefined && <Casilla titulo={textos.escala} valor={escala} />}
      </div>
      {controles !== undefined && <div className="flex border-l border-hairline">{controles}</div>}
    </div>
  );
}

export function CuadriculaQuieta({ pie }: { pie?: ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col">
      <div aria-hidden className="cuadricula min-h-0 flex-1" />
      {pie}
    </div>
  );
}

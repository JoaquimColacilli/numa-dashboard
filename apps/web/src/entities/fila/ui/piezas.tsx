import type { ReactNode } from 'react';

import { TINTA, type TintaDeTesoro } from '@/shared/lib';

export function Globo({ numero, className = '' }: { numero: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex size-6 flex-none items-center justify-center rounded-pill border-[1.5px] border-ink bg-paper text-badge font-semibold text-ink tabular-nums ${className}`}
    >
      {numero}
    </span>
  );
}

export function GloboConGuia({ numero }: { numero: number }) {
  return (
    <span aria-hidden className="absolute top-3 right-full flex items-center">
      <Globo numero={numero} />
      <span className="h-px w-3.5 bg-ink" />
      <span className="-ml-0.5 size-1.25 rounded-pill bg-ink" />
    </span>
  );
}

export function MarcasDeCorte() {
  const esquinas = [
    'left-0 top-0 -translate-x-full -translate-y-full',
    'right-0 top-0 translate-x-full -translate-y-full rotate-90',
    'right-0 bottom-0 translate-x-full translate-y-full rotate-180',
    'left-0 bottom-0 -translate-x-full translate-y-full -rotate-90',
  ];
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {esquinas.map((esquina) => (
        <svg
          key={esquina}
          viewBox="0 0 14 14"
          className={`absolute size-3.5 overflow-visible text-ink ${esquina}`}
        >
          <path d="M0 14 H9 M14 0 V9" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      ))}
    </span>
  );
}

export function RotuloDelPlano({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`rotulo-del-plano text-badge font-medium text-text-2 uppercase ${className}`}>
      {children}
    </span>
  );
}

export interface NivelDelMesProps {
  tinta: TintaDeTesoro;
  lleva: number;
  prueba?: number;
  tope: number;
  etiqueta: string;
  texto: string;
}

export function NivelDelMes({ tinta, lleva, prueba = 0, tope, etiqueta, texto }: NivelDelMesProps) {
  const clases = TINTA[tinta];
  const lleno = tope <= 0 ? 0 : Math.min(100, (lleva / tope) * 100);
  const fantasma = tope <= 0 ? 0 : Math.min(100 - lleno, (prueba / tope) * 100);
  return (
    <div
      role="meter"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(lleno)}
      aria-valuetext={texto}
      className="relative flex h-3 items-center"
    >
      <span aria-hidden className="absolute top-0 left-0 h-3 w-px bg-text-3" />
      <span aria-hidden className="absolute top-0 right-0 h-3 w-px bg-text-3" />
      <span
        aria-hidden
        className="relative mx-px h-1.5 flex-1 overflow-hidden rounded-[2px] bg-surface-2"
      >
        <span
          className={`absolute inset-y-0 left-0 ${clases.fondo}`}
          style={{ width: `${String(lleno)}%` }}
        />
        {fantasma > 0 && (
          <span
            data-prueba
            className="absolute inset-y-0"
            style={{
              left: `${String(lleno)}%`,
              width: `${String(fantasma)}%`,
              backgroundImage: `repeating-linear-gradient(135deg, ${clases.color} 0 1.5px, transparent 1.5px 4px)`,
              boxShadow: `inset 0 0 0 1px ${clases.color}`,
            }}
          />
        )}
      </span>
    </div>
  );
}

export function LineaDePuntos({
  izquierda,
  derecha,
  className = '',
}: {
  izquierda: ReactNode;
  derecha: ReactNode;
  className?: string;
}) {
  return (
    <span className={`flex min-w-0 items-baseline gap-1.5 ${className}`}>
      <span className="truncate">{izquierda}</span>
      <span aria-hidden className="min-w-3 flex-1 border-b border-dotted border-text-3" />
      <span className="flex-none tabular-nums">{derecha}</span>
    </span>
  );
}

export function MarcaDeRevision({ numero }: { numero: number }) {
  return (
    <span
      aria-hidden
      className="absolute -top-3.5 -right-3 z-10 flex size-7 items-center justify-center text-ink"
    >
      <svg viewBox="0 0 28 26" className="absolute inset-0 size-7 overflow-visible">
        <path
          d="M14 2.5 L26 23.5 H2 Z"
          fill="var(--color-paper)"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
      <span className="relative mt-[7px] text-[10px] leading-none font-semibold tabular-nums">
        {numero}
      </span>
    </span>
  );
}

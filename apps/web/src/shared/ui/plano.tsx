import type { ReactNode } from 'react';

import { Icono, type NombreDeIcono } from '@maun/ui';

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

export function MarcaDeRevision({ numero, suelta = false }: { numero: number; suelta?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-7 flex-none items-center justify-center text-ink ${
        suelta ? 'relative' : 'absolute -top-3.5 -right-3 z-10'
      }`}
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

export interface CasillaDelRotulo {
  titulo: string;
  valor: string;
  tono?: 'normal' | 'atencion' | 'hecho';
}

const TONO_DE_LA_CASILLA: Readonly<
  Record<NonNullable<CasillaDelRotulo['tono']>, { valor: string; icono: NombreDeIcono | null }>
> = {
  normal: { valor: 'text-ink', icono: null },
  atencion: { valor: 'text-atencion', icono: 'triangle-alert' },
  hecho: { valor: 'text-hogar', icono: 'check' },
};

export function RotuloEnCasillas({
  casillas,
  etiqueta,
  className = '',
}: {
  casillas: readonly CasillaDelRotulo[];
  etiqueta: string;
  className?: string;
}) {
  return (
    <div className={`@container/rotulo min-w-0 ${className}`}>
      <dl
        aria-label={etiqueta}
        className="rotulo-del-plano grid grid-cols-2 gap-px overflow-hidden rounded-field border border-border bg-hairline text-badge uppercase @min-[31rem]/rotulo:inline-grid @min-[31rem]/rotulo:auto-cols-max @min-[31rem]/rotulo:grid-flow-col @min-[31rem]/rotulo:grid-cols-none"
      >
        {casillas.map((casilla, indice) => {
          const tono = TONO_DE_LA_CASILLA[casilla.tono ?? 'normal'];
          const sola = casillas.length % 2 === 1 && indice === casillas.length - 1;
          return (
            <div
              key={casilla.titulo}
              className={`flex min-w-0 flex-col gap-1 bg-paper px-3 pt-2 pb-2.5 @min-[31rem]/rotulo:pr-4 ${
                sola ? 'col-span-2 @min-[31rem]/rotulo:col-span-1' : ''
              }`}
            >
              <dt className="text-[10px] leading-none text-text-3">{casilla.titulo}</dt>
              <dd
                className={`flex items-center gap-1 leading-none font-semibold tabular-nums ${tono.valor}`}
              >
                {tono.icono !== null && <Icono nombre={tono.icono} tamano={12} grosor={2} />}
                {casilla.valor}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

import type { ReactNode } from 'react';

import { FondoDelElegido } from '@/shared/ui';

export interface SeccionProps {
  titulo: string;
  ayuda?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Seccion({ titulo, ayuda, children, className = '' }: SeccionProps) {
  return (
    <section
      aria-label={titulo}
      className={`flex flex-col gap-2.5 border-t border-hairline py-4 first:border-t-0 ${className}`}
    >
      <h3 className="rotulo-del-plano flex min-h-5 items-center gap-1.5 text-badge font-semibold text-text-2 uppercase">
        {titulo}
        {ayuda}
      </h3>
      {children}
    </section>
  );
}

export interface OpcionDelSegmentado<T extends string> {
  id: T;
  etiqueta: string;
}

export interface SegmentadoProps<T extends string> {
  etiqueta: string;
  opciones: readonly OpcionDelSegmentado<T>[];
  elegido: T;
  alElegir: (opcion: T) => void;
  chico?: boolean;
}

export function Segmentado<T extends string>({
  etiqueta,
  opciones,
  elegido,
  alElegir,
  chico = false,
}: SegmentadoProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      className="relative grid auto-cols-fr grid-flow-col gap-0.5 rounded-pill bg-ink/6 p-1"
    >
      <FondoDelElegido elegido={elegido} />
      {opciones.map((opcion) => (
        <button
          key={opcion.id}
          type="button"
          role="radio"
          aria-checked={elegido === opcion.id}
          data-opcion={opcion.id}
          onClick={() => {
            alElegir(opcion.id);
          }}
          className={`relative rounded-pill px-2 text-label ${chico ? 'min-h-9' : 'min-h-tap'} ${
            elegido === opcion.id ? 'font-semibold text-ink' : 'font-medium text-text-2'
          }`}
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  );
}

export function ProblemasDeLaSeccion({ textos }: { textos: readonly string[] }) {
  if (textos.length === 0) return null;
  return (
    <ul role="alert" className="flex flex-col gap-1">
      {textos.map((texto) => (
        <li key={texto} className="text-label font-medium text-alerta">
          {texto}
        </li>
      ))}
    </ul>
  );
}

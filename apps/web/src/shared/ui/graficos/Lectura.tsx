import type { ReactNode } from 'react';

export interface AccionDeLaLectura {
  texto: string;
  alTocar: () => void;
  abierta?: boolean;
  controla?: string;
}

export interface LecturaProps {
  children: ReactNode;
  accion?: AccionDeLaLectura | null;
}

export function Lectura({ children, accion = null }: LecturaProps) {
  return (
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-field bg-ink/6 px-3 py-2">
      <span className="text-label text-text-2 [&_b]:text-body [&_b]:font-semibold [&_b]:text-ink">
        {children}
      </span>
      {accion !== null && (
        <button
          type="button"
          onClick={accion.alTocar}
          aria-expanded={accion.abierta}
          aria-controls={accion.controla}
          className="inline-flex min-h-tap items-center gap-1 rounded-pill border border-hairline bg-paper px-3 text-label font-semibold"
        >
          {accion.texto}
        </button>
      )}
    </div>
  );
}

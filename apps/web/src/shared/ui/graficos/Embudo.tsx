import type { ReactNode } from 'react';

export interface PasoDelEmbudo {
  clave: string;
  nombre: string;
  cantidad: number;
  cuenta: ReactNode;
  fuerte?: boolean;
}

export interface EmbudoProps {
  pasos: readonly PasoDelEmbudo[];
}

export function Embudo({ pasos }: EmbudoProps) {
  const tope = Math.max(1, pasos[0]?.cantidad ?? 0);
  return (
    <ol className="flex list-none flex-col gap-3 p-0">
      {pasos.map((paso) => (
        <li key={paso.clave} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2.5">
            <span className={`text-body-sm ${paso.fuerte === true ? 'font-semibold' : ''}`}>
              {paso.nombre}
            </span>
            <span className="text-label whitespace-nowrap text-text-2 tabular-nums">
              {paso.cuenta}
            </span>
          </div>
          <span aria-hidden className="relative h-4.5">
            <span
              data-barra
              style={{ width: `${String(Math.max(0, (paso.cantidad / tope) * 100))}%` }}
              className={`absolute inset-y-0 left-0 rounded-r-[4px] ${
                paso.fuerte === true ? 'bg-ink' : 'bg-contexto'
              }`}
            />
          </span>
        </li>
      ))}
    </ol>
  );
}

import { useId, type ReactNode } from 'react';

import { Icono } from '@maun/ui';

export interface BloquePlegableProps {
  titulo: string;
  abiertoAlPrincipio?: boolean;
  resumen?: ReactNode;
  ayuda?: string;
  children: ReactNode;
  enTarjeta?: boolean;
  enRenglon?: boolean;
  className?: string;
  nivel?: 'h2' | 'h3';
  claseDelTitulo?: string;
}

export function BloquePlegable({
  titulo,
  abiertoAlPrincipio = true,
  resumen,
  ayuda,
  children,
  enTarjeta = true,
  enRenglon = false,
  className = '',
  nivel: Titulo = 'h2',
  claseDelTitulo = 'text-section font-semibold',
}: BloquePlegableProps) {
  const id = useId();

  return (
    <details
      open={abiertoAlPrincipio}
      className={`group ${
        enTarjeta ? 'rounded-panel border border-hairline bg-paper px-4 md:px-5' : ''
      } ${className}`}
    >
      <summary
        aria-describedby={ayuda === undefined ? undefined : id}
        className={`flex ${
          enTarjeta
            ? 'min-h-14 items-center'
            : enRenglon
              ? 'min-h-12 items-center'
              : 'min-h-tap items-baseline'
        } cursor-pointer list-none gap-3 rounded-field [&::-webkit-details-marker]:hidden`}
      >
        <span
          className={`flex min-w-0 flex-1 gap-2 ${enRenglon ? 'items-center' : 'items-baseline'}`}
        >
          <Icono
            nombre="chevron-right"
            tamano={16}
            className={`flex-none text-text-3 transition-transform [details[open]>summary_&]:rotate-90 [:where(html[data-vista=publica],[data-quieta])_&]:transition-none ${
              enRenglon ? '' : 'translate-y-0.5'
            }`}
          />
          <Titulo className={claseDelTitulo}>{titulo}</Titulo>
        </span>
        {resumen !== undefined && (
          <span className="flex-none text-label text-text-2 tabular-nums">{resumen}</span>
        )}
      </summary>
      {ayuda !== undefined && (
        <p id={id} className="mt-0.5 mb-1 ml-6 text-meta leading-normal text-text-3">
          {ayuda}
        </p>
      )}
      <div className={enTarjeta ? 'mt-1.5 pb-4' : 'mt-1.5'}>{children}</div>
    </details>
  );
}

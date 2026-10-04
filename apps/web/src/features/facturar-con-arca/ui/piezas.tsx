import type { ReactNode } from 'react';

import { Icono, type NombreDeIcono } from '@/shared/ui';

export function Nota({ icono, children }: { icono: NombreDeIcono; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-label leading-normal text-text-2">
      <Icono nombre={icono} tamano={16} className="mt-px flex-none text-text-3" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

export function Bloque({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label font-medium text-text-2">{etiqueta}</span>
      {children}
    </div>
  );
}

export function CuerpoDeLaHoja({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
      {children}
    </div>
  );
}

export function PieDeLaHoja({ children }: { children: ReactNode }) {
  return (
    <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
      {children}
    </footer>
  );
}

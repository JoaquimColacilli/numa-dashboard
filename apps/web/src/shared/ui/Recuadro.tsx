import type { ReactNode } from 'react';

import { Icono, type NombreDeIcono } from '@maun/ui';

export type TonoDelRecuadro = 'info' | 'atencion' | 'alerta';

const TONO: Readonly<
  Record<TonoDelRecuadro, { caja: string; icono: string; nombre: NombreDeIcono }>
> = {
  info: { caja: 'border-border', icono: 'text-text-2', nombre: 'info' },
  atencion: {
    caja: 'border-atencion bg-atencion-tint',
    icono: 'text-atencion',
    nombre: 'triangle-alert',
  },
  alerta: { caja: 'border-alerta bg-alerta-tint', icono: 'text-alerta', nombre: 'triangle-alert' },
};

export interface RecuadroProps {
  tono?: TonoDelRecuadro;
  icono?: NombreDeIcono;
  titulo?: ReactNode;
  role?: 'status' | 'alert';
  className?: string;
  children?: ReactNode;
}

export function Recuadro({
  tono = 'info',
  icono,
  titulo,
  role,
  className = '',
  children,
}: RecuadroProps) {
  const estilo = TONO[tono];
  return (
    <div
      role={role}
      className={`flex items-start gap-2.5 rounded-field border px-3 py-2.5 text-label leading-normal text-ink ${estilo.caja} ${className}`}
    >
      <Icono
        nombre={icono ?? estilo.nombre}
        tamano={18}
        className={`mt-px flex-none ${estilo.icono}`}
      />
      <div className="flex min-w-0 flex-col gap-1.5">
        {titulo !== undefined && <p className="text-body-sm font-semibold">{titulo}</p>}
        {children}
      </div>
    </div>
  );
}

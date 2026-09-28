import type { TesoroDelTaller } from '@/entities/tesoro';
import { Icono } from '@/shared/ui';

export interface BotonEditarTesoroProps {
  tesoro: Pick<TesoroDelTaller, 'id' | 'nombre'>;
  alEditar: (tesoro: string) => void;
  className?: string;
}

export function BotonEditarTesoro({ tesoro, alEditar, className = '' }: BotonEditarTesoroProps) {
  return (
    <button
      type="button"
      aria-label={`Editar ${tesoro.nombre}`}
      title={`Editar ${tesoro.nombre}`}
      onClick={() => {
        alEditar(tesoro.id);
      }}
      className={`flex size-11 flex-none items-center justify-center rounded-field text-text-2 hover:bg-surface hover:text-ink ${className}`}
    >
      <Icono nombre="pencil" tamano={18} />
    </button>
  );
}

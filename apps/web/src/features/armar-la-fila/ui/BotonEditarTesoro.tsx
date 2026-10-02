import type { TesoroDelTaller } from '@/entities/tesoro';
import { useMensajes } from '@/shared/idioma';
import { Icono } from '@/shared/ui';

export interface BotonEditarTesoroProps {
  tesoro: Pick<TesoroDelTaller, 'id' | 'nombre'>;
  alEditar: (tesoro: string) => void;
  className?: string;
}

export function BotonEditarTesoro({ tesoro, alEditar, className = '' }: BotonEditarTesoroProps) {
  const etiqueta = useMensajes().armarLaFila.editar(tesoro.nombre);
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      onClick={() => {
        alEditar(tesoro.id);
      }}
      className={`flex size-11 flex-none items-center justify-center rounded-field text-text-2 hover:bg-surface hover:text-ink ${className}`}
    >
      <Icono nombre="pencil" tamano={18} />
    </button>
  );
}

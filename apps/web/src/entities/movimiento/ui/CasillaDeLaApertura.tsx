import { esAnteriorALaApertura } from '@maun/domain';

import { useMensajes } from '@/shared/idioma';

const UN_DIA = /^\d{4}-\d{2}-\d{2}$/;

export interface CasillaDeLaAperturaProps {
  fecha: string;
  apertura: string | null;
  marcada: boolean;
  alCambiar: (marcada: boolean) => void;
  etiqueta?: string;
  disabled?: boolean;
  className?: string;
}

export function CasillaDeLaApertura({
  fecha,
  apertura,
  marcada,
  alCambiar,
  etiqueta,
  disabled = false,
  className = '',
}: CasillaDeLaAperturaProps) {
  const m = useMensajes();
  if (!UN_DIA.test(fecha) || !esAnteriorALaApertura(fecha, apertura)) return null;

  return (
    <label
      className={`flex min-h-tap items-center gap-2.5 text-label leading-snug text-text-2 ${className}`}
    >
      <input
        type="checkbox"
        checked={marcada}
        disabled={disabled}
        onChange={(evento) => {
          alCambiar(evento.target.checked);
        }}
        className="size-4 flex-none accent-ink"
      />
      {etiqueta ?? m.movimiento.casillaDeLaApertura}
    </label>
  );
}

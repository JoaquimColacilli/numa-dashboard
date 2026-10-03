import { useMensajes } from '@/shared/idioma';
import { Button, type ButtonSize } from '@/shared/ui';

import { useSalir } from './useSalir';

export interface BotonSalirProps {
  size?: ButtonSize;
  className?: string;
}

export function BotonSalir({ size = 'chico', className }: BotonSalirProps) {
  const m = useMensajes();
  const { pendientes, confirmando, saliendo, error, confirmar, cerrar } = useSalir();

  if (pendientes > 0 && !confirmando) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-meta text-atencion">
          {m.cerrarSesion.hayCambiosSinSincronizar({ cantidad: pendientes })}
        </p>
        <Button variant="secundario" size={size} className={className} onClick={confirmar}>
          {m.cerrarSesion.cerrarSesionIgual}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="secundario"
        size={size}
        className={className}
        cargando={saliendo}
        onClick={() => {
          void cerrar();
        }}
      >
        {saliendo ? m.cerrarSesion.cerrando : m.cerrarSesion.cerrarSesion}
      </Button>
      {error !== '' && (
        <p role="alert" className="text-meta font-medium text-alerta">
          {error}
        </p>
      )}
    </div>
  );
}

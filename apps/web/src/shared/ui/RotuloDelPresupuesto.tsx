import { useMensajes } from '@/shared/idioma';

import { RotuloEnCasillas } from './plano';
import { casillasDelPresupuesto, type DatosDelRotulo } from './rotulo';

export interface RotuloDelPresupuestoProps extends DatosDelRotulo {
  className?: string;
}

export function RotuloDelPresupuesto({ className, ...datos }: RotuloDelPresupuestoProps) {
  const { etiqueta } = useMensajes().ui.rotulo;
  return (
    <RotuloEnCasillas
      casillas={casillasDelPresupuesto(datos)}
      etiqueta={etiqueta}
      className={className}
    />
  );
}

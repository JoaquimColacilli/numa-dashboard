import { RotuloEnCasillas } from './plano';
import { casillasDelPresupuesto, type DatosDelRotulo } from './rotulo';

export interface RotuloDelPresupuestoProps extends DatosDelRotulo {
  className?: string;
}

export function RotuloDelPresupuesto({ className, ...datos }: RotuloDelPresupuestoProps) {
  return (
    <RotuloEnCasillas
      casillas={casillasDelPresupuesto(datos)}
      etiqueta="Rótulo del presupuesto"
      className={className}
    />
  );
}

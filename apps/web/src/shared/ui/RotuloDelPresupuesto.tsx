import { useIdiomaDeLaUi, useTextosDeLaUi } from '@/shared/idioma';

import { RotuloEnCasillas } from './plano';
import { casillasDelPresupuesto, type DatosDelRotulo } from './rotulo';

export interface RotuloDelPresupuestoProps extends DatosDelRotulo {
  className?: string;
}

export function RotuloDelPresupuesto({ className, ...datos }: RotuloDelPresupuestoProps) {
  const { rotulo } = useTextosDeLaUi();
  const idioma = useIdiomaDeLaUi();
  return (
    <RotuloEnCasillas
      casillas={casillasDelPresupuesto(datos, rotulo, idioma)}
      etiqueta={rotulo.etiqueta}
      className={className}
    />
  );
}

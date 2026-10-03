import { filaPorId, type Replica } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { Ir } from '@/shared/lib';
import { Icono } from '@/shared/ui';

import { useLiquidacionesEnVuelo } from '../api/liquidacion';
import { rutaDelProyecto } from '../model/rutas';

export interface LiquidacionesSinConfirmarProps {
  replica: Replica;
}

export function LiquidacionesSinConfirmar({ replica }: LiquidacionesSinConfirmarProps) {
  const textos = useMensajes().proyecto.liquidacionesSinConfirmar;
  const enVuelo = useLiquidacionesEnVuelo();
  if (enVuelo.length === 0) return null;

  const proyectos = enVuelo.map((pendiente) => {
    const titulo = filaPorId(replica, 'proyectos', pendiente.proyectoId)?.titulo;
    return {
      id: pendiente.proyectoId,
      titulo: titulo ?? textos.unProyecto,
      conocido: titulo !== undefined,
    };
  });

  return (
    <p
      role="status"
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-field bg-atencion-tint px-3 py-2 text-meta leading-relaxed text-atencion"
    >
      <Icono nombre="cloud-off" tamano={14} />
      <span>{textos.cuentan(proyectos.length)}</span>
      {proyectos.map((proyecto, indice) => (
        <span key={proyecto.id}>
          <Ir
            a={rutaDelProyecto(proyecto.id)}
            translate={proyecto.conocido ? 'no' : undefined}
            className="font-semibold underline underline-offset-2"
          >
            {proyecto.titulo}
          </Ir>
          {indice < proyectos.length - 1 ? ',' : ''}
        </span>
      ))}
    </p>
  );
}

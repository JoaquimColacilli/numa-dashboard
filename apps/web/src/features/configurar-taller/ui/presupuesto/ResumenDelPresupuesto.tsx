import { formatearCuit } from '@maun/domain';
import type { ReactNode } from 'react';

import type { FilaDe } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { Ir, RUTA_DEL_PRESUPUESTO_EN_AJUSTES } from '@/shared/lib';
import { Icono } from '@/shared/ui';

import {
  datosDelTaller,
  datosEditables,
  encabezadoDelPresupuesto,
  plantillaDeLosAjustes,
  queFalta,
} from '../../model/presupuestoDelTaller';

function Renglon({ clave, children }: { clave: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-3 border-t border-hairline-soft py-2.5 text-body first:border-t-0">
      <dt className="text-text-3">{clave}</dt>
      <dd className="min-w-0 leading-snug font-medium">{children}</dd>
    </div>
  );
}

export interface ResumenDelPresupuestoProps {
  household: FilaDe<'households'>;
  ajustes: FilaDe<'ajustes'>;
}

export function ResumenDelPresupuesto({ household, ajustes }: ResumenDelPresupuestoProps) {
  const { configurarTaller } = useMensajes();
  const m = configurarTaller.presupuesto.resumen;
  const plantilla = plantillaDeLosAjustes(ajustes);
  const datos = datosEditables(datosDelTaller(ajustes, household.nombre));
  const { faltan } = encabezadoDelPresupuesto(datos);
  const titular = datos.titular.trim();

  return (
    <>
      <dl className="-mt-1 flex flex-col">
        <Renglon clave={m.tusDatos}>
          {faltan.length > 0 ? (
            <span className="flex items-start gap-2 font-normal text-atencion">
              <Icono nombre="info" tamano={17} className="mt-0.5 flex-none" />
              <span>{m.faltan(faltan.length, queFalta(faltan))}</span>
            </span>
          ) : (
            <span translate="no" className="tabular-nums">
              {titular === '' ? '' : `${titular}, `}
              <span className="whitespace-nowrap">
                {configurarTaller.cuit(formatearCuit(datos.cuit))}
              </span>
            </span>
          )}
        </Renglon>
        <Renglon clave={m.plazo}>
          <span className="tabular-nums">{m.diasHabiles(plantilla.plazoDeFabricacion)}</span>
        </Renglon>
        <Renglon clave={m.garantia}>
          <span className="tabular-nums">{m.meses(plantilla.garantiaMeses)}</span>
        </Renglon>
        <Renglon clave={m.textos}>
          {m.cuantosTextos(
            plantilla.incluye.length,
            plantilla.avisos.length,
            plantilla.condiciones.length,
          )}
        </Renglon>
      </dl>
      <Ir
        a={RUTA_DEL_PRESUPUESTO_EN_AJUSTES}
        className="inline-flex min-h-tap items-center gap-1.5 self-start rounded-field text-body font-semibold underline underline-offset-3"
      >
        <Icono nombre="file-text" tamano={18} />
        {m.cambiar}
      </Ir>
    </>
  );
}

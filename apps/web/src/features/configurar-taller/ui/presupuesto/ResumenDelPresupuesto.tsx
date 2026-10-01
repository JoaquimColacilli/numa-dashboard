import { formatearCuit } from '@maun/domain';
import type { ReactNode } from 'react';

import type { FilaDe } from '@/shared/api';
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

function cuantas(cantidad: number, singular: string, plural: string): string {
  return `${String(cantidad)}\u00a0${cantidad === 1 ? singular : plural}`;
}

export interface ResumenDelPresupuestoProps {
  household: FilaDe<'households'>;
  ajustes: FilaDe<'ajustes'>;
}

export function ResumenDelPresupuesto({ household, ajustes }: ResumenDelPresupuestoProps) {
  const plantilla = plantillaDeLosAjustes(ajustes);
  const datos = datosEditables(datosDelTaller(ajustes, household.nombre));
  const { faltan } = encabezadoDelPresupuesto(datos);
  const titular = datos.titular.trim();

  return (
    <>
      <dl className="-mt-1 flex flex-col">
        <Renglon clave="Tus datos">
          {faltan.length > 0 ? (
            <span className="flex items-start gap-2 font-normal text-atencion">
              <Icono nombre="info" tamano={17} className="mt-0.5 flex-none" />
              <span>
                {faltan.length === 1 ? 'Falta' : 'Faltan'} {queFalta(faltan)}, que la ley pide en un
                presupuesto.
              </span>
            </span>
          ) : (
            <span className="tabular-nums">
              {titular === '' ? '' : `${titular}, `}
              <span className="whitespace-nowrap">CUIT {formatearCuit(datos.cuit)}</span>
            </span>
          )}
        </Renglon>
        <Renglon clave="Plazo">
          <span className="tabular-nums">
            {cuantas(plantilla.plazoDeFabricacion, 'día hábil', 'días hábiles')}
          </span>
        </Renglon>
        <Renglon clave="Garantía">
          <span className="tabular-nums">{cuantas(plantilla.garantiaMeses, 'mes', 'meses')}</span>
        </Renglon>
        <Renglon clave="Textos">
          {cuantas(plantilla.incluye.length, 'cosa que incluye', 'cosas que incluye')},{' '}
          {cuantas(plantilla.avisos.length, 'aviso', 'avisos')} y{' '}
          {cuantas(plantilla.condiciones.length, 'condición', 'condiciones')}
        </Renglon>
      </dl>
      <Ir
        a={RUTA_DEL_PRESUPUESTO_EN_AJUSTES}
        className="inline-flex min-h-tap items-center gap-1.5 self-start rounded-field text-body font-semibold underline underline-offset-3"
      >
        <Icono nombre="file-text" tamano={18} />
        Cambiar lo que va en tus presupuestos
      </Ir>
    </>
  );
}

import { puedeCerrarPerdido, puedeCobrar, type EstadoLiquidado } from '@maun/domain';
import { useState } from 'react';
import { Navigate, useParams } from 'react-router';

import { resumenDeProyecto, rutaDelProyecto } from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { HojaDeCliente } from '@/features/editar-cliente';
import { PantallaDeLiquidacion } from '@/features/liquidar-proyecto';
import { hoyLocal } from '@/shared/lib';
import { ConSalida } from '@/shared/ui';

export interface ProyectoLiquidacionPageProps {
  destino: EstadoLiquidado;
}

export function ProyectoLiquidacionPage({ destino }: ProyectoLiquidacionPageProps) {
  const replica = useReplicaDelTaller();
  const { id = '' } = useParams();
  const [editandoCliente, setEditandoCliente] = useState(false);
  const resumen = resumenDeProyecto(replica, id, hoyLocal());

  if (!resumen) return <Navigate to="/proyectos" replace />;

  const permitido =
    destino === 'cobrado'
      ? puedeCobrar(resumen.proyecto.estado)
      : puedeCerrarPerdido(resumen.proyecto.estado);

  if (!permitido) return <Navigate to={rutaDelProyecto(id)} replace />;

  return (
    <>
      <PantallaDeLiquidacion
        resumen={resumen}
        destino={destino}
        alEditarElCliente={() => {
          setEditandoCliente(true);
        }}
      />
      <ConSalida valor={editandoCliente && resumen.cliente !== undefined ? resumen.cliente : null}>
        {(cliente) => (
          <HojaDeCliente
            cliente={cliente}
            alCerrar={() => {
              setEditandoCliente(false);
            }}
          />
        )}
      </ConSalida>
    </>
  );
}

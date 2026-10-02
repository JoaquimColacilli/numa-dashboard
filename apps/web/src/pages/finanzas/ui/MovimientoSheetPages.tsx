import { useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router';

import { CLASES_EN_ORDEN, renglonesPorTesoro, type ClaseDeMovimiento } from '@/entities/movimiento';
import { useReplicaDelTaller } from '@/entities/replica';
import { tesorosDelTaller, tesorosSincronizados } from '@/entities/tesoro';
import { HojaDeMovimiento } from '@/features/registrar-movimiento';
import { ajustesDe, filaDelTaller, filaPorId } from '@/shared/api';
import { movimientoPropuesto, RUTA_DE_FINANZAS, useCerrarHoja } from '@/shared/lib';

function esClase(valor: string | undefined): valor is ClaseDeMovimiento {
  return valor !== undefined && (CLASES_EN_ORDEN as readonly string[]).includes(valor);
}

export function MovimientoNuevoPage() {
  const replica = useReplicaDelTaller();
  const cerrar = useCerrarHoja();
  const [parametros] = useSearchParams();
  const propuesto = movimientoPropuesto(parametros);

  return (
    <HojaDeMovimiento
      claseInicial={esClase(propuesto.clase) ? propuesto.clase : undefined}
      tesoroInicial={propuesto.tesoro}
      haciaInicial={propuesto.hacia}
      montoInicial={propuesto.monto}
      categoriaInicial={propuesto.categoria}
      fechaInicial={propuesto.fecha}
      renglones={renglonesPorTesoro(filaDelTaller(replica).fila)}
      tesoros={tesorosDelTaller(replica)}
      tesorosSincronizados={tesorosSincronizados(replica)}
      metaCocos={ajustesDe(replica)?.meta_cocos_centavos ?? 0}
      alCerrar={cerrar}
    />
  );
}

export function MovimientoEdicionPage() {
  const replica = useReplicaDelTaller();
  const cerrar = useCerrarHoja();
  const { id = '' } = useParams();
  const encontrado = filaPorId(replica, 'movimientos', id);
  const [alAbrir] = useState(encontrado);
  const movimiento = encontrado ?? alAbrir;

  if (!movimiento) return <Navigate to={RUTA_DE_FINANZAS} replace />;

  return (
    <HojaDeMovimiento
      movimiento={movimiento}
      renglones={renglonesPorTesoro(filaDelTaller(replica).fila)}
      tesoros={tesorosDelTaller(replica)}
      tesorosSincronizados={tesorosSincronizados(replica)}
      metaCocos={ajustesDe(replica)?.meta_cocos_centavos ?? 0}
      alCerrar={cerrar}
    />
  );
}

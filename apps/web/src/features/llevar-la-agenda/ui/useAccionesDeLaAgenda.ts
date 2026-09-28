import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router';

import {
  fechaDelPagoPropuesta,
  idDelProximoContacto,
  rutaDelVencimiento,
  type AccionesDeLaAgenda,
} from '@/entities/agenda';
import { rutaParaRegistrarElPago } from '@/entities/movimiento';
import { useReplicaDelTaller } from '@/entities/replica';
import { tesoroPorId, tesorosDelTaller } from '@/entities/tesoro';
import { filaPorId } from '@/shared/api';
import { conFondo, hoyLocal, rutaDelProyecto, useIr } from '@/shared/lib';

import {
  borrar,
  marcar,
  marcarDelTrabajo,
  marcarElSeguimiento,
  tildar,
  type Avisador,
} from '../model/acciones';

export function useAccionesDeLaAgenda(avisar?: Avisador): AccionesDeLaAgenda {
  const cliente = useQueryClient();
  const replica = useReplicaDelTaller();
  const ir = useIr();
  const location = useLocation();

  return {
    alAbrirTrabajo: (evento) => {
      ir(rutaDelProyecto(evento.proyectoId));
    },
    alTildar: (evento) => {
      tildar(cliente, evento, avisar);
    },
    alMarcar: (evento) => {
      if (evento.clase === 'propia') {
        marcar(cliente, evento, avisar);
        return;
      }
      if (evento.clase === 'vencimiento') return;
      const proximo = idDelProximoContacto(evento);
      if (proximo !== null) {
        marcarElSeguimiento(cliente, evento, proximo, avisar);
        return;
      }
      const proyecto = filaPorId(replica, 'proyectos', evento.proyectoId);
      if (proyecto) marcarDelTrabajo(cliente, evento, proyecto, avisar);
    },
    alBorrar: (evento) => {
      const fila = filaPorId(replica, 'anotaciones', evento.id);
      if (fila) borrar(cliente, fila, avisar);
    },
    alRegistrarElPago: (evento) => {
      const tesoro = tesoroPorId(tesorosDelTaller(replica), evento.tesoro);
      ir(
        rutaParaRegistrarElPago({
          tesoro: { id: evento.tesoro, clave: tesoro?.clave ?? null },
          monto: evento.monto,
          categoria: evento.renglon,
          fecha: fechaDelPagoPropuesta(evento, hoyLocal()),
        }),
        { state: conFondo(location) },
      );
    },
    alAbrirVencimiento: (evento) => {
      ir(rutaDelVencimiento(evento));
    },
  };
}

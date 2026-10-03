import { useLocation, useParams } from 'react-router';

import { PantallaDeProyecto } from '@/features/editar-proyecto';

import { ConTesoroEnDolaresNuevo } from './ConTesoroEnDolaresNuevo';

export function ProyectoEdicionPage() {
  const { id = '' } = useParams();
  const estado: unknown = useLocation().state;
  const conLaPrimeraOpcion =
    typeof estado === 'object' && estado !== null && 'primeraOpcion' in estado;
  return (
    <ConTesoroEnDolaresNuevo>
      {(pedir) => (
        <PantallaDeProyecto
          proyectoId={id}
          agregarUnaOpcion={conLaPrimeraOpcion}
          alCrearUnTesoroEnDolares={pedir}
        />
      )}
    </ConTesoroEnDolaresNuevo>
  );
}

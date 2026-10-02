import { useSearchParams } from 'react-router';

import { PantallaDeProyecto } from '@/features/editar-proyecto';
import { fechaDelEnlace, PARAMETRO_DE_ENTREGA } from '@/shared/lib';

import { ConTesoroEnDolaresNuevo } from './ConTesoroEnDolaresNuevo';

export function ProyectoNuevoPage() {
  const [busqueda] = useSearchParams();
  return (
    <ConTesoroEnDolaresNuevo>
      {(pedir) => (
        <PantallaDeProyecto
          clienteInicial={busqueda.get('cliente') ?? undefined}
          entregaInicial={fechaDelEnlace(busqueda.get(PARAMETRO_DE_ENTREGA))}
          alCrearUnTesoroEnDolares={pedir}
        />
      )}
    </ConTesoroEnDolaresNuevo>
  );
}

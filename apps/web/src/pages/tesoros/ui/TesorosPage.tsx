import { useAnchoDePantalla } from '@/shared/lib';

import { usePantallaDeTesoros, useTabletAncha } from '../model/pantalla';
import { HojasDeTesoros } from './HojasDeTesoros';
import { TesorosEnElCelular } from './TesorosEnElCelular';
import { TesorosEnLaCompu } from './TesorosEnLaCompu';

export function TesorosPage() {
  const ancho = useAnchoDePantalla();
  const ancha = useTabletAncha();
  const pantalla = usePantallaDeTesoros();
  return (
    <>
      {ancho === 'movil' ? (
        <TesorosEnElCelular pantalla={pantalla} />
      ) : (
        <TesorosEnLaCompu
          pantalla={pantalla}
          ancho={ancho === 'escritorio' ? 'compu' : ancha ? 'tablet-ancha' : 'tablet'}
        />
      )}
      <HojasDeTesoros pantalla={pantalla} />
    </>
  );
}

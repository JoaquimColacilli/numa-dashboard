import { Suspense } from 'react';
import { Outlet } from 'react-router';

import { EsqueletoDeArranque } from '../arranque/EsqueletoDeArranque';
import { useTextosDelArranque } from '../arranque/textos';
import { AvisoActualizacion } from './AvisoActualizacion';

export function Shell() {
  const textos = useTextosDelArranque();

  return (
    <>
      <Suspense fallback={<EsqueletoDeArranque que={textos.abriendoLaPantalla} forma="acceso" />}>
        <Outlet />
      </Suspense>
      <AvisoActualizacion />
    </>
  );
}

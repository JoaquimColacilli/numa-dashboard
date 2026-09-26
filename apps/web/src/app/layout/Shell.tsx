import { Suspense } from 'react';
import { Outlet } from 'react-router';

import { EsqueletoDeArranque } from '../arranque/EsqueletoDeArranque';
import { ABRIENDO_LA_PANTALLA } from '../arranque/esqueleto';
import { AvisoActualizacion } from './AvisoActualizacion';

export function Shell() {
  return (
    <>
      <Suspense fallback={<EsqueletoDeArranque que={ABRIENDO_LA_PANTALLA} forma="acceso" />}>
        <Outlet />
      </Suspense>
      <AvisoActualizacion />
    </>
  );
}

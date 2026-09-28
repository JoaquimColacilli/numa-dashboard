import { lazy, Suspense } from 'react';

import type { LienzoProps } from './lienzo/Lienzo';
import { ControlesQuietos, CuadriculaQuieta, RotuloDelLienzo } from './Rotulo';

const Lienzo = lazy(async () => import('./lienzo/Lienzo'));

export function LienzoPerezoso(props: LienzoProps) {
  return (
    <Suspense
      fallback={
        <CuadriculaQuieta
          pie={
            props.pie === 'rotulo' ? (
              <RotuloDelLienzo
                revision={props.revision}
                rige={props.rige}
                escala="—"
                controles={<ControlesQuietos />}
              />
            ) : undefined
          }
        />
      }
    >
      <Lienzo {...props} />
    </Suspense>
  );
}

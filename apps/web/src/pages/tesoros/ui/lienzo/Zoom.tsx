import { useReactFlow, useStore } from '@xyflow/react';
import { useEffect } from 'react';

import { escalaDelZoom } from '../../model/rotulo';
import { BotonDelZoom, RotuloDelLienzo } from '../Rotulo';

export function ControlesDelZoom({ alVerTodo }: { alVerTodo: () => void }) {
  const { zoomIn, zoomOut } = useReactFlow();
  return (
    <div role="group" aria-label="Controles del plano" className="flex divide-x divide-hairline">
      <BotonDelZoom
        icono="minus"
        etiqueta="Alejar"
        alTocar={() => {
          void zoomOut({ duration: 0 });
        }}
      />
      <BotonDelZoom
        icono="plus"
        etiqueta="Acercar"
        alTocar={() => {
          void zoomIn({ duration: 0 });
        }}
      />
      <BotonDelZoom icono="scan" etiqueta="Ver toda la fila" alTocar={alVerTodo} />
    </div>
  );
}

function useEscala(): string {
  return escalaDelZoom(useStore((estado) => estado.transform[2]));
}

export function RotuloConZoom({
  revision,
  rige,
  alVerTodo,
}: {
  revision: number;
  rige: string;
  alVerTodo: () => void;
}) {
  const escala = useEscala();
  return (
    <RotuloDelLienzo
      revision={revision}
      rige={rige}
      escala={escala}
      controles={<ControlesDelZoom alVerTodo={alVerTodo} />}
    />
  );
}

export function ZoomFlotante({ alVerTodo }: { alVerTodo: () => void }) {
  const escala = useEscala();
  return (
    <div className="flex items-stretch overflow-hidden rounded-field border border-border bg-paper shadow-float">
      <span className="rotulo-del-plano flex items-center gap-1.5 border-r border-hairline px-3 text-badge text-text-2 uppercase">
        Esc.
        <span className="font-semibold text-ink tabular-nums">{escala}</span>
      </span>
      <ControlesDelZoom alVerTodo={alVerTodo} />
    </div>
  );
}

export function ZoomEnCss() {
  const zoom = useStore((estado) => estado.transform[2]);
  const lienzo = useStore((estado) => estado.domNode);
  useEffect(() => {
    lienzo?.style.setProperty('--zoom-del-lienzo', String(zoom));
  }, [zoom, lienzo]);
  return null;
}

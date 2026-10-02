import { useReactFlow, useStore } from '@xyflow/react';
import { useEffect } from 'react';

import { useMensajes } from '@/shared/idioma';

import { escalaDelZoom } from '../../model/rotulo';
import { BotonDelZoom, RotuloDelLienzo } from '../Rotulo';

export function ControlesDelZoom({ alVerTodo }: { alVerTodo: () => void }) {
  const textos = useMensajes().paginaTesoros.rotulo;
  const { zoomIn, zoomOut } = useReactFlow();
  return (
    <div role="group" aria-label={textos.controles} className="flex divide-x divide-hairline">
      <BotonDelZoom
        icono="minus"
        etiqueta={textos.alejar}
        alTocar={() => {
          void zoomOut({ duration: 0 });
        }}
      />
      <BotonDelZoom
        icono="plus"
        etiqueta={textos.acercar}
        alTocar={() => {
          void zoomIn({ duration: 0 });
        }}
      />
      <BotonDelZoom icono="scan" etiqueta={textos.verTodaLaFila} alTocar={alVerTodo} />
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
  const textos = useMensajes().paginaTesoros.rotulo;
  const escala = useEscala();
  return (
    <div className="flex items-stretch overflow-hidden rounded-field border border-border bg-paper shadow-float">
      <span className="rotulo-del-plano flex items-center gap-1.5 border-r border-hairline px-3 text-badge text-text-2 uppercase">
        {textos.escala}
        <span translate="no" className="font-semibold text-ink tabular-nums">
          {escala}
        </span>
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

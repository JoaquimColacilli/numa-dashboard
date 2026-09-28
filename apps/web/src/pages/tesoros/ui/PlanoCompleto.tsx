import { useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useAlgoEnCurso } from '@/shared/lib';
import { Ayuda, Icono } from '@/shared/ui';

import type { PantallaDeTesoros } from '../model/pantalla';
import { rigeDesde } from '../model/rotulo';
import { LienzoPerezoso } from './LienzoPerezoso';

const RELLENO = { arriba: 24, abajo: 96, izquierda: 36, derecha: 16 };

const SIN_ELEGIR = () => undefined;

export function PlanoCompleto({
  pantalla,
  alCerrar,
}: {
  pantalla: PantallaDeTesoros;
  alCerrar: () => void;
}) {
  const { vista } = pantalla;
  const titulo = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const cerrar = useRef<HTMLButtonElement>(null);
  const rige = rigeDesde(vista.delTaller.guardada, vista.delTaller.guardadaEn);
  useAlgoEnCurso(true);

  useLayoutEffect(() => {
    const elemento = dialogo.current;
    if (elemento === null) return;
    if (!elemento.open) elemento.showModal();
    cerrar.current?.focus();
    return () => {
      if (elemento.open) elemento.close();
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialogo}
      aria-labelledby={titulo}
      onCancel={(evento) => {
        evento.preventDefault();
        alCerrar();
      }}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none flex-col bg-paper p-0 text-ink backdrop:bg-transparent open:flex"
    >
      <header className="flex flex-none items-center justify-between gap-3 border-b border-hairline pt-[calc(0.5rem+env(safe-area-inset-top))] pr-2 pb-2 pl-4">
        <div className="flex min-w-0 flex-col">
          <h2
            id={titulo}
            className="flex items-center gap-1.5 text-body-lg leading-snug font-semibold"
          >
            El plano de la fila
            <Ayuda que="Cómo se mira el plano">
              Arrastrá con un dedo para moverte y juntá dos dedos para acercar, o usá los botones de
              abajo. Para cambiar la fila, cerrá el plano y tocá Editar.
            </Ayuda>
          </h2>
          <p className="rotulo-del-plano text-badge text-text-2 uppercase">
            Rev. {vista.delTaller.version} · Rige {rige} · Solo para mirar
          </p>
        </div>
        <button
          ref={cerrar}
          type="button"
          aria-label="Cerrar el plano"
          onClick={alCerrar}
          className="flex size-11 flex-none items-center justify-center rounded-field text-text-2 hover:bg-surface"
        >
          <Icono nombre="x" tamano={20} />
        </button>
      </header>
      <div className="min-h-0 flex-1">
        <LienzoPerezoso
          vista={vista}
          resultado={pantalla.resultado}
          elegido={null}
          alElegir={SIN_ELEGIR}
          modo="mirar"
          pie="flotante"
          revision={vista.delTaller.version}
          rige={rige}
          relleno={RELLENO}
        />
      </div>
    </dialog>,
    document.body,
  );
}

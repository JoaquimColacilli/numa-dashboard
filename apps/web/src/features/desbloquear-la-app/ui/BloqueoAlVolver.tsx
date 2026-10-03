import { useLayoutEffect, useRef, type ReactNode } from 'react';

import { useMensajes } from '@/shared/idioma';
import { useAlgoEnCurso } from '@/shared/lib';

import { PantallaDeBloqueo } from './PantallaDeBloqueo';

export function BloqueoAlVolver({ otraCuenta }: { otraCuenta?: ReactNode }) {
  const m = useMensajes();
  const dialogo = useRef<HTMLDialogElement>(null);
  const saliendo = useRef(false);
  useAlgoEnCurso(true);

  useLayoutEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    saliendo.current = false;
    if (!elemento.open) elemento.showModal();
    return () => {
      saliendo.current = true;
      if (elemento.open) elemento.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogo}
      aria-label={m.desbloquearLaApp.laAppEstaBloqueada}
      onCancel={(evento) => {
        evento.preventDefault();
      }}
      onClose={() => {
        if (!saliendo.current) dialogo.current?.showModal();
      }}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none bg-mesa p-0 text-ink backdrop:bg-mesa"
    >
      <PantallaDeBloqueo otraCuenta={otraCuenta} />
    </dialog>
  );
}

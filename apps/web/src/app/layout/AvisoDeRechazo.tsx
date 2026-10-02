import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router';

import { useMensajes } from '@/shared/idioma';
import { descartarAviso, useAvisos, useIr } from '@/shared/lib';
import { Icono } from '@/shared/ui';

export function AvisoDeRechazo() {
  const m = useMensajes();
  const avisos = useAvisos();
  const queryClient = useQueryClient();
  const ir = useIr();
  const { pathname } = useLocation();

  const rechazo = avisos.findLast((aviso) => aviso.tipo === 'rechazo');
  if (!rechazo) return null;
  if (rechazo.ruta !== null && pathname === rechazo.ruta) return null;

  return (
    <div
      role="alert"
      className="pointer-events-auto rounded-panel border border-alerta bg-paper px-3.5 py-3 shadow-menu"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex-none text-alerta">
          <Icono nombre="triangle-alert" tamano={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-label font-semibold text-alerta">
            {m.appLayout.rechazado({ operacion: rechazo.operacion, sujeto: rechazo.sujeto })}
          </p>
          <p className="mt-0.5 text-meta leading-relaxed text-text-2">{rechazo.titulo}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {rechazo.ruta !== null && (
              <button
                type="button"
                className="text-meta font-semibold text-ink underline underline-offset-3"
                onClick={() => {
                  ir(rechazo.ruta ?? '/proyectos');
                }}
              >
                {m.appLayout.verElProyecto}
              </button>
            )}
            <button
              type="button"
              className="text-meta font-medium text-text-2 underline underline-offset-3"
              onClick={() => {
                void descartarAviso(queryClient, rechazo.id);
              }}
            >
              {m.appLayout.descartar}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

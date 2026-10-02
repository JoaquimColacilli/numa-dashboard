import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';

import { useSesion } from '@/entities/sesion';
import { FormularioDeIngreso } from '@/features/iniciar-sesion';
import { errorDelEnlace } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { Ir, useIr } from '@/shared/lib';
import { ENLACE_DE_ACCESO, ENLACE_DE_CAMPO, PantallaDeAcceso } from '@/shared/ui';

function CrearUna({ children }: { children: ReactNode }) {
  return (
    <Ir a="/acceso/crear-cuenta" className={ENLACE_DE_ACCESO}>
      {children}
    </Ir>
  );
}

export function AccesoPage() {
  const m = useMensajes();
  const sesion = useSesion();
  const vencida = sesion.tipo === 'anonimo' && sesion.vencida;
  const ir = useIr();
  const { pathname } = useLocation();
  const [delEnlace] = useState(() => errorDelEnlace(window.location.href));

  useEffect(() => {
    if (delEnlace !== undefined) ir(pathname, { como: 'reemplazar' });
  }, [delEnlace, ir, pathname]);

  return (
    <PantallaDeAcceso
      titulo={m.paginaAcceso.entraAlTaller}
      pose="trabajando"
      nota={m.paginaAcceso.unaVezAdentro}
      pie={<p>{m.paginaAcceso.noTenesCuenta({ Enlace: CrearUna })}</p>}
    >
      {vencida && (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-field bg-atencion-tint px-3.5 py-3 text-label leading-relaxed text-atencion"
        >
          <p className="font-medium">{m.paginaAcceso.laSesionSeCerro}</p>
          <p>{m.paginaAcceso.entraDeNuevo}</p>
        </div>
      )}
      {delEnlace !== undefined && (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-field bg-alerta-tint px-3.5 py-3 text-label leading-relaxed text-alerta"
        >
          <p className="font-medium">{delEnlace}</p>
          <p>{m.paginaAcceso.siYaHabiasConfirmado}</p>
        </div>
      )}
      <FormularioDeIngreso
        olvido={
          <Ir a="/acceso/recuperar" className={ENLACE_DE_CAMPO}>
            {m.paginaAcceso.laOlvidaste}
          </Ir>
        }
      />
    </PantallaDeAcceso>
  );
}

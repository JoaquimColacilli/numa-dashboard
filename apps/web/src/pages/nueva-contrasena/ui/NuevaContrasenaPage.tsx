import { useState, type ReactNode } from 'react';

import { useSesion } from '@/entities/sesion';
import { FormularioDeNuevaContrasena } from '@/features/recuperar-acceso';
import { errorDelEnlace } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { useEstadoSync, Ir, useIr } from '@/shared/lib';
import { Button, ENLACE_DE_ACCESO, PantallaDeAcceso } from '@/shared/ui';

function Fuerte({ children }: { children: ReactNode }) {
  return (
    <strong translate="no" className="font-medium text-ink">
      {children}
    </strong>
  );
}

export function NuevaContrasenaPage() {
  const m = useMensajes();
  const sesion = useSesion();
  const estadoSync = useEstadoSync();
  const ir = useIr();
  const [listo, setListo] = useState(false);
  const [delEnlace] = useState(() => errorDelEnlace(window.location.href));

  if (listo) {
    return (
      <PantallaDeAcceso
        titulo={m.paginaNuevaContrasena.listoYaEntraste}
        pose="pulgar"
        animarElDibujo
        bajada={m.paginaNuevaContrasena.guardamosLaContrasena}
      >
        <Button
          size="grande"
          className="w-full"
          onClick={() => {
            ir('/', { como: 'reemplazar' });
          }}
        >
          {m.paginaNuevaContrasena.irAlTaller}
        </Button>
      </PantallaDeAcceso>
    );
  }

  if (sesion.tipo === 'cargando') {
    return (
      <PantallaDeAcceso
        titulo={m.paginaNuevaContrasena.unSegundo}
        pose="pensando"
        bajada={m.paginaNuevaContrasena.estamosValidando}
      >
        <p role="status" aria-busy="true" className="text-body text-text-2">
          {m.paginaNuevaContrasena.verificandoElEnlace}
        </p>
      </PantallaDeAcceso>
    );
  }

  if (sesion.tipo === 'anonimo') {
    const sinConexion = estadoSync.tipo === 'sin-conexion';
    return (
      <PantallaDeAcceso
        titulo={
          sinConexion ? m.paginaNuevaContrasena.sinSenal : m.paginaNuevaContrasena.esteEnlaceNoSirve
        }
        pose="pensando"
        bajada={
          sinConexion
            ? m.paginaNuevaContrasena.seValidaContraElServidor
            : (delEnlace ?? m.paginaNuevaContrasena.losEnlacesDelCorreo)
        }
        pie={
          <Ir a="/acceso/recuperar" className={ENLACE_DE_ACCESO}>
            {m.paginaNuevaContrasena.pedirOtroEnlace}
          </Ir>
        }
      >
        <p className="text-body leading-relaxed text-text-2">
          {sinConexion ? m.paginaNuevaContrasena.buscaSenal : m.paginaNuevaContrasena.pediUnoNuevo}
        </p>
      </PantallaDeAcceso>
    );
  }

  if (!sesion.porRecuperacion) {
    return (
      <PantallaDeAcceso
        titulo={m.paginaNuevaContrasena.seAbreDesdeElCorreo}
        pose="pensando"
        bajada={m.paginaNuevaContrasena.paraCambiarLaContrasena}
        pie={
          <Ir a="/" className={ENLACE_DE_ACCESO}>
            {m.paginaNuevaContrasena.volverAlTaller}
          </Ir>
        }
      >
        <p className="text-body leading-relaxed text-text-2">{m.paginaNuevaContrasena.asiNadie}</p>
      </PantallaDeAcceso>
    );
  }

  return (
    <PantallaDeAcceso
      titulo={m.paginaNuevaContrasena.poneUnaContrasenaNueva}
      pose="pensando"
      bajada={m.paginaNuevaContrasena.esPara({ email: sesion.email, Fuerte })}
    >
      <FormularioDeNuevaContrasena
        alCambiar={() => {
          setListo(true);
        }}
      />
    </PantallaDeAcceso>
  );
}

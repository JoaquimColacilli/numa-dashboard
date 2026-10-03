import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';

import { ProveedorDeReplica, useCambiosEnVivo, useReplica } from '@/entities/replica';
import { ProveedorDeSesion, useSesion, useSesionActiva } from '@/entities/sesion';
import { EntrarConOtraCuenta } from '@/features/cerrar-sesion';
import { BloqueoAlVolver, PantallaDeBloqueo } from '@/features/desbloquear-la-app';
import { householdDe, tieneAcceso } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { esCelular, useAppBloqueada, useVueltaPorUnAviso, vigilarElBloqueo } from '@/shared/lib';

import { EsqueletoDeArranque } from '../arranque/EsqueletoDeArranque';
import { IdiomaDeLaCuenta } from '../arranque/IdiomaDeLaCuenta';
import { useTextosDelArranque } from '../arranque/textos';
import { CargaQueTarda, ErrorDeCarga } from '../layout/ErrorDeCarga';
import { ProveedorDeLaPuerta } from '../navegacion/ProveedorDeLaPuerta';

const TOPE_DE_LA_PRIMERA_CARGA_MS = 15_000;

function useTardaMasDe(milisegundos: number): boolean {
  const [tarda, setTarda] = useState(false);
  useEffect(() => {
    const reloj = setTimeout(() => {
      setTarda(true);
    }, milisegundos);
    return () => {
      clearTimeout(reloj);
    };
  }, [milisegundos]);
  return tarda;
}

export function RutaPublica() {
  const sesion = useSesion();
  const textos = useTextosDelArranque();

  if (sesion.tipo === 'cargando') return <EsqueletoDeArranque que={textos.abriendoLaApp} />;
  if (sesion.tipo === 'activa') return <Navigate to="/" replace />;
  return <Outlet />;
}

function ConBloqueo({ usuarioId }: { usuarioId: string }) {
  const bloqueada = useAppBloqueada(usuarioId) && esCelular();
  const [yaSeAbrio, setYaSeAbrio] = useState(!bloqueada);
  if (!bloqueada && !yaSeAbrio) setYaSeAbrio(true);
  useEffect(() => vigilarElBloqueo(), []);
  useVueltaPorUnAviso();

  return (
    <>
      {bloqueada && !yaSeAbrio ? (
        <PantallaDeBloqueo otraCuenta={<EntrarConOtraCuenta />} />
      ) : (
        <Outlet />
      )}
      {bloqueada && yaSeAbrio && <BloqueoAlVolver otraCuenta={<EntrarConOtraCuenta />} />}
    </>
  );
}

export function RutaConSesion() {
  const sesion = useSesion();
  const textos = useTextosDelArranque();

  if (sesion.tipo === 'cargando') return <EsqueletoDeArranque que={textos.abriendoLaApp} />;
  if (sesion.tipo === 'anonimo') return <Navigate to="/acceso" replace />;

  return (
    <ProveedorDeSesion
      sesion={{
        usuarioId: sesion.usuarioId,
        email: sesion.email,
        nombre: sesion.nombre,
        foto: sesion.foto,
        idioma: sesion.idioma,
      }}
    >
      <IdiomaDeLaCuenta />
      <ProveedorDeLaPuerta>
        <ConBloqueo usuarioId={sesion.usuarioId} />
      </ProveedorDeLaPuerta>
    </ProveedorDeSesion>
  );
}

export function RutaConAcceso() {
  const m = useMensajes();
  const { usuarioId } = useSesionActiva();
  const replica = useReplica(usuarioId);
  const tarda = useTardaMasDe(TOPE_DE_LA_PRIMERA_CARGA_MS);
  const textos = useTextosDelArranque();
  useCambiosEnVivo(usuarioId, replica.data ? (householdDe(replica.data)?.id ?? null) : null);
  const reintentar = () => {
    void replica.refetch();
  };

  if (replica.data) {
    if (tieneAcceso(replica.data)) {
      return (
        <ProveedorDeReplica replica={replica.data}>
          <Outlet />
        </ProveedorDeReplica>
      );
    }
    return (
      <ErrorDeCarga
        error={new Error(m.appRouter.sinTaller)}
        detalle={m.appRouter.elTallerSeCreaSolo}
        reintentar={reintentar}
      />
    );
  }

  if (replica.isPaused || replica.isError) {
    return <ErrorDeCarga error={replica.error} reintentar={reintentar} />;
  }

  return (
    <EsqueletoDeArranque que={textos.trayendoLosDatos} visible forma="marco">
      {tarda && <CargaQueTarda reintentar={reintentar} />}
    </EsqueletoDeArranque>
  );
}

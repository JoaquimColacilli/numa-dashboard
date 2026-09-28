import { conDesde, type Fila, type PasoDelMes } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';

import { useReplicaDelTaller } from '@/entities/replica';
import {
  editarLaFila,
  empezarAEditar,
  empezarElBorrador,
  fichaDeLaParte,
  fichaDelEstante,
  fichaDelPaso,
  fichaVigente,
  loQueEstabaGuardado,
  MUTACION_DE_LA_FILA,
  probarLaFila,
  SIN_PRUEBA,
  sumarAlReparto,
  sumarComoPaso,
  useBorradorDeLaFila,
  vistaDeLaFila,
  type GuardadoDeLaFila,
  type PruebaEnPantalla,
  type VistaDeLaFila,
} from '@/features/armar-la-fila';
import { MUTACION_DE_AJUSTES } from '@/features/configurar-taller';
import type { DondeVa, EdicionDeLoDeCocos, LugarDelTesoro } from '@/features/editar-tesoro';
import { ajustesDe, type Replica, type TesoroNuevo } from '@/shared/api';
import { hoyEnElTaller, metaDeAvisos, useAlgoEnCurso } from '@/shared/lib';

import { anotarQueSeEntendio, yaSeEntendio } from './rotulo';

export type HojaDeTesoros =
  | { tipo: 'nuevo'; lugar: LugarDelTesoro; despuesDe: string | null | undefined }
  | { tipo: 'editar'; tesoro: string }
  | { tipo: 'cubrir'; paso: PasoDelMes }
  | { tipo: 'guardar' }
  | { tipo: 'ficha'; id: string };

export function ubicarElNuevo(
  fila: Fila,
  tesoro: string,
  dondeVa: DondeVa,
  despuesDe: string | null | undefined,
): { fila: Fila; elegir: string } {
  if (dondeVa.lugar === 'paso') {
    const antes = despuesDe === undefined ? (fila.pasos.at(-1)?.tesoro ?? null) : despuesDe;
    return {
      fila: sumarComoPaso(fila, tesoro, null, antes, dondeVa.tope),
      elegir: fichaDelPaso(tesoro),
    };
  }
  if (dondeVa.lugar === 'reparto') {
    return {
      fila: sumarAlReparto(fila, tesoro, dondeVa.porcentaje),
      elegir: fichaDeLaParte(tesoro),
    };
  }
  return { fila, elegir: fichaDelEstante(tesoro) };
}

function guardarDeUna(
  replica: Replica,
  vista: VistaDeLaFila,
  fila: Fila,
  mutar: (variables: GuardadoDeLaFila) => void,
): void {
  if (vista.ajustesId === null) return;
  mutar({
    ajustesId: vista.ajustesId,
    version: vista.delTaller.version,
    fila: conDesde(vista.delTaller.fila, fila, vista.mes),
    guardadaEn: new Date().toISOString(),
    previa: loQueEstabaGuardado(replica),
  });
}

function suscribirAlAncho(avisar: () => void): () => void {
  const consulta = globalThis.matchMedia('(min-width: 1024px)');
  consulta.addEventListener('change', avisar);
  return () => {
    consulta.removeEventListener('change', avisar);
  };
}

function esAncha(): boolean {
  return globalThis.matchMedia('(min-width: 1024px)').matches;
}

export function useTabletAncha(): boolean {
  return useSyncExternalStore(suscribirAlAncho, esAncha, esAncha);
}

export function usePantallaDeTesoros() {
  const replica = useReplicaDelTaller();
  const hoy = hoyEnElTaller();
  const ajustesId = ajustesDe(replica)?.id ?? null;
  const borrador = useBorradorDeLaFila(ajustesId);
  const vista = useMemo(() => vistaDeLaFila(replica, borrador, hoy), [replica, borrador, hoy]);
  const [pedido, setElegido] = useState<string | null>(null);
  const elegido = useMemo(() => fichaVigente(vista, pedido), [vista, pedido]);
  const [prueba, setPrueba] = useState<PruebaEnPantalla>(SIN_PRUEBA);
  const [hoja, setHoja] = useState<HojaDeTesoros | null>(null);
  const [entendido, setEntendido] = useState(yaSeEntendio);
  const resultado = useMemo(
    () => probarLaFila(replica, vista.fila, prueba, hoy),
    [replica, vista.fila, prueba, hoy],
  );

  useAlgoEnCurso(vista.armando && vista.cuantos > 0);

  const guardarLaFila = useMutation({ ...MUTACION_DE_LA_FILA, meta: metaDeAvisos('filaGuardada') });
  const guardarLoDeCocos = useMutation({
    ...MUTACION_DE_AJUSTES,
    meta: metaDeAvisos('tesoroEditado'),
  });

  const elegir = useCallback((id: string | null) => {
    setElegido(id);
  }, []);

  const abrir = useCallback((siguiente: HojaDeTesoros) => {
    setHoja(siguiente);
  }, []);

  const cerrar = useCallback(() => {
    setHoja(null);
  }, []);

  const empezar = useCallback(() => {
    empezarAEditar(vista);
  }, [vista]);

  const entender = useCallback(() => {
    anotarQueSeEntendio();
    setEntendido(true);
  }, []);

  const alCrear = useCallback(
    (tesoro: TesoroNuevo, dondeVa: DondeVa, despuesDe: string | null | undefined) => {
      const ubicado = ubicarElNuevo(vista.fila, tesoro.id, dondeVa, despuesDe);
      setElegido(ubicado.elegir);
      if (dondeVa.lugar === 'estante') return;
      if (vista.armando) {
        editarLaFila(vista, (fila) => ubicarElNuevo(fila, tesoro.id, dondeVa, despuesDe).fila);
        return;
      }
      if (vista.delTaller.fila.sueldoPorTrabajo) {
        if (vista.ajustesId === null) return;
        empezarElBorrador(vista.ajustesId, vista.delTaller.version, vista.delTaller.fila);
        editarLaFila(vista, (fila) => ubicarElNuevo(fila, tesoro.id, dondeVa, despuesDe).fila);
        return;
      }
      guardarDeUna(replica, vista, ubicado.fila, (variables) => {
        guardarLaFila.mutate(variables);
      });
    },
    [replica, vista, guardarLaFila],
  );

  const alGuardarLoDeCocos = useCallback(
    (edicion: EdicionDeLoDeCocos) => {
      guardarLoDeCocos.mutate(edicion);
    },
    [guardarLoDeCocos],
  );

  return {
    replica,
    vista,
    elegido,
    elegir,
    prueba,
    probar: setPrueba,
    resultado,
    hoja,
    abrir,
    cerrar,
    empezar,
    primeraVez: !vista.delTaller.guardada && !entendido && !vista.armando,
    entender,
    alCrear,
    alGuardarLoDeCocos,
  };
}

export type PantallaDeTesoros = ReturnType<typeof usePantallaDeTesoros>;

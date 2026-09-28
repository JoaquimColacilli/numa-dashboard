import { centavos, conDesde, type Fila, type Money, type PasoDelMes } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { useLocation, useSearchParams } from 'react-router';

import { rutaParaRegistrarElPago, type PagoParaRegistrar } from '@/entities/movimiento';
import { insumosDeLosTrabajos } from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import {
  editarLaFila,
  empezarAEditar,
  empezarElBorrador,
  FICHA_DEL_RESTO,
  fichaDeLaObligacion,
  fichaDeLaParte,
  fichaDelEstante,
  fichaDelPaso,
  fichaDelTesoro,
  fichaVigente,
  lugarDelDiezmo,
  loQueEstabaGuardado,
  MUTACION_DE_LA_FILA,
  probarLaFila,
  SIN_PRUEBA,
  sumarAlReparto,
  sumarComoAhorroFijo,
  sumarComoCompromiso,
  sumarComoObligacion,
  conSuperavit,
  useBorradorDeLaFila,
  vistaDeLaFila,
  type GuardadoDeLaFila,
  type PruebaEnPantalla,
  type VistaDeLaFila,
} from '@/features/armar-la-fila';
import { MUTACION_DE_AJUSTES } from '@/features/configurar-taller';
import type { DondeVa, EdicionDeLoDeCocos, LugarDelTesoro } from '@/features/editar-tesoro';
import { ajustesDe, type Replica, type TesoroNuevo } from '@/shared/api';
import {
  conFondo,
  hoyEnElTaller,
  metaDeAvisos,
  PARAMETRO_DE_TESORO,
  useAlgoEnCurso,
  useIr,
} from '@/shared/lib';

import type { InsumosEnElPlano } from './disposicion';
import { anotarQueSeEntendio, yaSeEntendio } from './rotulo';

export type HojaDeTesoros =
  | { tipo: 'nuevo'; lugar: LugarDelTesoro; despuesDe?: string | null }
  | { tipo: 'editar'; tesoro: string }
  | { tipo: 'cubrir'; paso: PasoDelMes }
  | { tipo: 'guardar' }
  | { tipo: 'ficha'; id: string };

export interface ElNuevo {
  id: string;
  nombre: string;
  meta: Money | null;
}

function posicionDeLaObligacion(
  fila: Fila,
  diezmo: string,
  antesDelDiezmo: boolean,
  despuesDe: string | null | undefined,
): number {
  if (antesDelDiezmo) {
    const lugar = lugarDelDiezmo(fila, diezmo);
    return lugar === -1 ? 0 : lugar;
  }
  if (despuesDe === undefined) return fila.obligaciones.length;
  if (despuesDe === null) return 0;
  return fila.obligaciones.findIndex((obligacion) => obligacion.tesoro === despuesDe) + 1;
}

export function ubicarElNuevo(
  fila: Fila,
  nuevo: ElNuevo,
  dondeVa: DondeVa,
  despuesDe: string | null | undefined,
  diezmo: string,
): { fila: Fila; elegir: string } {
  switch (dondeVa.lugar) {
    case 'estante':
      return { fila, elegir: fichaDelEstante(nuevo.id) };
    case 'obligacion':
      return {
        fila: sumarComoObligacion(fila, nuevo.id, {
          porcentaje: dondeVa.porcentaje,
          base: dondeVa.base,
          posicion: posicionDeLaObligacion(fila, diezmo, dondeVa.antesDelDiezmo, despuesDe),
        }),
        elegir: fichaDeLaObligacion(nuevo.id),
      };
    case 'compromiso':
      return {
        fila: sumarComoCompromiso(fila, nuevo.id, null, dondeVa.monto, {
          ...(despuesDe === undefined ? {} : { despuesDe }),
          renglon: nuevo.nombre,
        }),
        elegir: fichaDelPaso(nuevo.id),
      };
    case 'ahorro-fijo':
      return {
        fila: sumarComoAhorroFijo(fila, nuevo.id, null, dondeVa.monto, {
          ...(despuesDe === undefined ? {} : { despuesDe }),
          meta: nuevo.meta,
        }),
        elegir: fichaDelPaso(nuevo.id),
      };
    case 'reparto':
      return {
        fila: sumarAlReparto(fila, nuevo.id, dondeVa.porcentaje, nuevo.meta),
        elegir: fichaDeLaParte(nuevo.id),
      };
    case 'superavit':
      return { fila: conSuperavit(fila, nuevo.id), elegir: FICHA_DEL_RESTO };
  }
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

export function fichaDelParametro(
  vista: Pick<VistaDeLaFila, 'fila' | 'estante' | 'sistema' | 'tesoros'>,
  valor: string | null,
): string | null {
  if (valor === null || valor === '') return null;
  const tesoro =
    vista.tesoros.find((uno) => uno.id === valor) ??
    vista.tesoros.find((uno) => uno.clave !== null && uno.clave === valor);
  return tesoro === undefined ? null : fichaDelTesoro(vista, tesoro.id);
}

export function usePantallaDeTesoros() {
  const replica = useReplicaDelTaller();
  const hoy = hoyEnElTaller();
  const ajustesId = ajustesDe(replica)?.id ?? null;
  const borrador = useBorradorDeLaFila(ajustesId);
  const vista = useMemo(() => vistaDeLaFila(replica, borrador, hoy), [replica, borrador, hoy]);
  const [parametros] = useSearchParams();
  const location = useLocation();
  const ir = useIr();
  const [desdeElEnlace] = useState(() =>
    fichaDelParametro(vista, parametros.get(PARAMETRO_DE_TESORO)),
  );
  const [pedido, setElegido] = useState<string | null>(desdeElEnlace);
  const elegido = useMemo(() => fichaVigente(vista, pedido), [vista, pedido]);
  const [prueba, setPrueba] = useState<PruebaEnPantalla>(SIN_PRUEBA);
  const [hoja, setHoja] = useState<HojaDeTesoros | null>(null);
  const [entendido, setEntendido] = useState(yaSeEntendio);
  const resultado = useMemo(
    () => probarLaFila(replica, vista.fila, prueba, hoy),
    [replica, vista.fila, prueba, hoy],
  );
  const insumos = useMemo(() => insumosDeLosTrabajos(replica), [replica]);
  const insumosEnElPlano = useMemo<InsumosEnElPlano>(
    () => ({ total: insumos.total, trabajos: insumos.trabajos.length }),
    [insumos],
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

  const registrarElPago = useCallback(
    (pago: PagoParaRegistrar) => {
      ir(rutaParaRegistrarElPago(pago), { state: conFondo(location) });
    },
    [ir, location],
  );

  const alCrear = useCallback(
    (tesoro: TesoroNuevo, dondeVa: DondeVa, despuesDe: string | null | undefined) => {
      const nuevo: ElNuevo = {
        id: tesoro.id,
        nombre: tesoro.nombre,
        meta: tesoro.meta_centavos === null ? null : centavos(tesoro.meta_centavos),
      };
      const diezmo = vista.sistema.diezmo;
      const ubicado = ubicarElNuevo(vista.fila, nuevo, dondeVa, despuesDe, diezmo);
      setElegido(ubicado.elegir);
      if (dondeVa.lugar === 'estante') return;
      const ubicar = (fila: Fila) => ubicarElNuevo(fila, nuevo, dondeVa, despuesDe, diezmo).fila;
      if (vista.armando) {
        editarLaFila(vista, ubicar);
        return;
      }
      if (vista.delTaller.fila.sueldoPorTrabajo) {
        if (vista.ajustesId === null) return;
        empezarElBorrador(vista.ajustesId, vista.delTaller.version, vista.delTaller.fila);
        editarLaFila(vista, ubicar);
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
    desdeElEnlace,
    prueba,
    probar: setPrueba,
    resultado,
    insumos,
    insumosEnElPlano,
    hoja,
    abrir,
    cerrar,
    empezar,
    primeraVez: !vista.delTaller.guardada && !entendido && !vista.armando,
    entender,
    alCrear,
    alGuardarLoDeCocos,
    registrarElPago,
  };
}

export type PantallaDeTesoros = ReturnType<typeof usePantallaDeTesoros>;

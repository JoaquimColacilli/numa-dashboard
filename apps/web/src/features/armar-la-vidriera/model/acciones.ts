import { moverEnLaVidriera, type HaciaDondeSeMueve } from '@maun/domain';
import { onlineManager, type MutationOptions, type QueryClient } from '@tanstack/react-query';

import { ESPERA_ANTES_DE_QUITAR_DEL_BUCKET_MS, rutasEnLaVidriera } from '@/entities/archivo';
import {
  filaPorId,
  quitarDelBucketDeArchivos,
  type FotoDeLaVidrieraNueva,
  type Replica,
} from '@/shared/api';
import { avisarEnPantalla, claveDeTodaReplica, metaDeAvisos, type NuevoAviso } from '@/shared/lib';

import {
  MUTACION_DE_BAJA_DE_LA_VIDRIERA,
  MUTACION_DE_FOTO_DE_LA_VIDRIERA,
  MUTACION_DE_ORDEN_DE_LA_VIDRIERA,
  type AltaEnLaVidriera,
  type BajaDeLaVidriera,
  type FotoEnLaVidriera,
  type OrdenEnLaVidriera,
} from '../api/mutacion';
import { filaParaOrdenar } from './vidriera';

export type Mandar = <TVariables>(
  opciones: MutationOptions<FotoEnLaVidriera, unknown, TVariables>,
  variables: TVariables,
) => void;

export interface OpcionesDeLaBaja {
  avisar: (aviso: NuevoAviso) => void;
  quitarDelBucket: (rutas: readonly string[]) => Promise<void>;
  enLinea: () => boolean;
  sigueSacada: () => boolean;
  programar: (hacer: () => void, esperaMs: number) => ReturnType<typeof setTimeout>;
  cancelar: (reloj: ReturnType<typeof setTimeout>) => void;
}

export function mandarALaCola(cliente: QueryClient): Mandar {
  return (opciones, variables) => {
    void cliente
      .getMutationCache()
      .build(cliente, opciones)
      .execute(variables)
      .catch(() => undefined);
  };
}

function datosDe(foto: FotoEnLaVidriera): FotoDeLaVidrieraNueva {
  return {
    id: foto.id,
    orden: foto.orden,
    tipo: foto.tipo,
    bytes: foto.bytes,
    ancho: foto.ancho,
    alto: foto.alto,
    archivo_de_origen: foto.archivo_de_origen,
  };
}

export function sumarLaFoto(mandar: Mandar, nueva: FotoDeLaVidrieraNueva): void {
  mandar<AltaEnLaVidriera>(
    {
      ...MUTACION_DE_FOTO_DE_LA_VIDRIERA,
      meta: metaDeAvisos('fotoDeLaVidriera', { silencioso: true }),
    },
    { nueva, previa: null },
  );
}

export function moverLaFoto(
  mandar: Mandar,
  fotos: readonly FotoEnLaVidriera[],
  id: string,
  hacia: HaciaDondeSeMueve,
): boolean {
  const cambios = moverEnLaVidriera(fotos.map(filaParaOrdenar), id, hacia);
  for (const cambio of cambios) {
    const previa = fotos.find((foto) => foto.id === cambio.id);
    mandar<OrdenEnLaVidriera>(
      {
        ...MUTACION_DE_ORDEN_DE_LA_VIDRIERA,
        meta: metaDeAvisos('fotoDeLaVidrieraMovida', { silencioso: true }),
      },
      { id: cambio.id, orden: cambio.orden, previo: previa?.orden ?? cambio.orden },
    );
  }
  return cambios.length > 0;
}

export function sacarLaFoto(
  mandar: Mandar,
  foto: FotoEnLaVidriera,
  opciones: OpcionesDeLaBaja,
): void {
  mandar<BajaDeLaVidriera>(
    {
      ...MUTACION_DE_BAJA_DE_LA_VIDRIERA,
      meta: metaDeAvisos('fotoDeLaVidrieraSacada', { silencioso: true }),
    },
    { id: foto.id, sacadaEn: new Date().toISOString(), previa: foto },
  );

  let deshecho = false;
  const reloj = opciones.programar(() => {
    if (deshecho || !opciones.enLinea() || !opciones.sigueSacada()) return;
    void opciones.quitarDelBucket(rutasEnLaVidriera(foto)).catch(() => undefined);
  }, ESPERA_ANTES_DE_QUITAR_DEL_BUCKET_MS);

  opciones.avisar({
    clave: `foto-de-la-vidriera-sacada-${foto.id}`,
    tono: 'hecho',
    texto: 'Sacaste una foto de tu vidriera.',
    accion: {
      etiqueta: 'Deshacer',
      alTocar: () => {
        deshecho = true;
        opciones.cancelar(reloj);
        mandar<AltaEnLaVidriera>(
          {
            ...MUTACION_DE_FOTO_DE_LA_VIDRIERA,
            meta: metaDeAvisos('fotoDeLaVidriera', { silencioso: true }),
          },
          { nueva: datosDe(foto), previa: foto },
        );
      },
    },
  });
}

function sigueSacadaEnLaReplica(cliente: QueryClient, id: string): boolean {
  return cliente
    .getQueriesData<Replica>({ queryKey: claveDeTodaReplica() })
    .every(
      ([, replica]) =>
        replica === undefined || filaPorId(replica, 'fotos_de_la_vidriera', id) === undefined,
    );
}

export function opcionesDeLaBaja(cliente: QueryClient, foto: FotoEnLaVidriera): OpcionesDeLaBaja {
  return {
    avisar: avisarEnPantalla,
    quitarDelBucket: quitarDelBucketDeArchivos,
    enLinea: () => onlineManager.isOnline(),
    sigueSacada: () => sigueSacadaEnLaReplica(cliente, foto.id),
    programar: (hacer, esperaMs) => setTimeout(hacer, esperaMs),
    cancelar: (reloj) => {
      clearTimeout(reloj);
    },
  };
}

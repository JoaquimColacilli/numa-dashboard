import { nombreDelArchivo, tituloDelArchivo } from '@maun/domain';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  compartirElArchivo,
  descargarElArchivo,
  esUnIphoneConLaAppInstalada,
  sePuedenCompartirArchivos,
  TIPO_DEL_PDF,
} from './entregar';
import { generarEnElTrabajador } from './pedir';
import type { PresupuestoEnPdf } from './tipos';

export type EstadoDelPdf = 'sin-preparar' | 'preparando' | 'listo' | 'fallo';

export type BotonDelPdf = 'descargar' | 'compartir';

export interface PdfDelPresupuesto {
  estado: EstadoDelPdf;
  esperando: BotonDelPdf | null;
  nombre: string;
  descargar: () => void;
  compartir: () => void;
}

export interface OpcionesDelPdf {
  alAbrir?: boolean;
  generar?: (presupuesto: PresupuestoEnPdf) => Promise<Blob>;
}

export const PREPARANDO_EL_PDF = 'Preparando el PDF…';

export const NO_SE_PUDO_ARMAR_EL_PDF =
  'No pudimos armar el PDF. Tocá de nuevo para probar otra vez.';

export const DEMORA_PARA_PREPARAR_MS = 700;

const CUANTOS_SE_GUARDAN = 6;

const guardados = new Map<string, Blob>();

const enCamino = new Map<string, Promise<Blob>>();

function guardar(firma: string, archivo: Blob): void {
  guardados.delete(firma);
  guardados.set(firma, archivo);
  for (const firmaVieja of guardados.keys()) {
    if (guardados.size <= CUANTOS_SE_GUARDAN) break;
    guardados.delete(firmaVieja);
  }
}

export function olvidarLosPdfGuardados(): void {
  guardados.clear();
  enCamino.clear();
}

function pedir(
  firma: string,
  presupuesto: PresupuestoEnPdf,
  generar: (presupuesto: PresupuestoEnPdf) => Promise<Blob>,
): Promise<Blob> {
  const guardado = guardados.get(firma);
  if (guardado !== undefined) return Promise.resolve(guardado);
  const yaPedido = enCamino.get(firma);
  if (yaPedido !== undefined) return yaPedido;
  const pedido = generar(presupuesto)
    .then((archivo) => {
      guardar(firma, archivo);
      return archivo;
    })
    .finally(() => {
      enCamino.delete(firma);
    });
  enCamino.set(firma, pedido);
  return pedido;
}

function nombreDe(presupuesto: PresupuestoEnPdf): string {
  return nombreDelArchivo(
    presupuesto.documento,
    presupuesto.borrador ? null : presupuesto.numero,
    presupuesto.revision,
  );
}

function tituloDe(presupuesto: PresupuestoEnPdf): string {
  return tituloDelArchivo(presupuesto.borrador ? null : presupuesto.numero, presupuesto.revision);
}

function archivoDe(archivo: Blob, presupuesto: PresupuestoEnPdf): File {
  return new File([archivo], nombreDe(presupuesto), { type: TIPO_DEL_PDF });
}

function entregarLaDescarga(archivo: Blob, presupuesto: PresupuestoEnPdf): void {
  const elArchivo = archivoDe(archivo, presupuesto);
  if (esUnIphoneConLaAppInstalada() && sePuedenCompartirArchivos(elArchivo)) {
    compartirElArchivo(elArchivo, tituloDe(presupuesto));
    return;
  }
  descargarElArchivo(elArchivo);
}

interface Estado {
  firma: string;
  estado: EstadoDelPdf;
  esperando: BotonDelPdf | null;
}

function inicial(firma: string): Estado {
  return { firma, estado: guardados.has(firma) ? 'listo' : 'sin-preparar', esperando: null };
}

export function usePdfDelPresupuesto(
  presupuesto: PresupuestoEnPdf | null,
  { alAbrir = false, generar = generarEnElTrabajador }: OpcionesDelPdf = {},
): PdfDelPresupuesto {
  const firma = useMemo(
    () => (presupuesto === null ? '' : JSON.stringify(presupuesto)),
    [presupuesto],
  );
  const [guardado, setEstado] = useState<Estado>(() => inicial(firma));
  const actual = guardado.firma === firma ? guardado : inicial(firma);
  const ultimo = useRef({ presupuesto, firma, generar });
  const bajarAlTerminar = useRef(false);

  useEffect(() => {
    ultimo.current = { presupuesto, firma, generar };
  });

  useEffect(() => {
    bajarAlTerminar.current = false;
  }, [firma]);

  const preparar = useCallback((boton: BotonDelPdf | null) => {
    const { presupuesto: deAhora, firma: laDeAhora, generar: conQue } = ultimo.current;
    if (deAhora === null) return;
    setEstado({ firma: laDeAhora, estado: 'preparando', esperando: boton });
    pedir(laDeAhora, deAhora, conQue).then(
      (archivo) => {
        setEstado((antes) =>
          antes.firma === laDeAhora
            ? { firma: laDeAhora, estado: 'listo', esperando: null }
            : antes,
        );
        if (bajarAlTerminar.current && ultimo.current.firma === laDeAhora) {
          bajarAlTerminar.current = false;
          descargarElArchivo(archivoDe(archivo, deAhora));
        }
      },
      () => {
        bajarAlTerminar.current = false;
        setEstado((antes) =>
          antes.firma === laDeAhora
            ? { firma: laDeAhora, estado: 'fallo', esperando: null }
            : antes,
        );
      },
    );
  }, []);

  useEffect(() => {
    if (!alAbrir || firma === '') return;
    const reloj = setTimeout(() => {
      preparar(null);
    }, DEMORA_PARA_PREPARAR_MS);
    return () => {
      clearTimeout(reloj);
    };
  }, [alAbrir, firma, preparar]);

  const descargar = useCallback(() => {
    const { presupuesto: deAhora, firma: laDeAhora } = ultimo.current;
    if (deAhora === null) return;
    const listo = guardados.get(laDeAhora);
    if (listo !== undefined) {
      entregarLaDescarga(listo, deAhora);
      return;
    }
    bajarAlTerminar.current = !esUnIphoneConLaAppInstalada();
    preparar('descargar');
  }, [preparar]);

  const compartir = useCallback(() => {
    const { presupuesto: deAhora, firma: laDeAhora } = ultimo.current;
    if (deAhora === null) return;
    const listo = guardados.get(laDeAhora);
    if (listo !== undefined) {
      compartirElArchivo(archivoDe(listo, deAhora), tituloDe(deAhora));
      return;
    }
    bajarAlTerminar.current = false;
    preparar('compartir');
  }, [preparar]);

  return {
    estado: actual.estado,
    esperando: actual.esperando,
    nombre: presupuesto === null ? '' : nombreDe(presupuesto),
    descargar,
    compartir,
  };
}

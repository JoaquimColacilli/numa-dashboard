import { nombreDelArchivoDeLaFactura, nombreDelComprobante } from '@maun/domain';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  compartirElArchivo,
  descargarElArchivo,
  esUnIphoneConLaAppInstalada,
  sePuedenCompartirArchivos,
  TIPO_DEL_PDF,
} from './entregar';
import { generarLaFacturaEnElTrabajador } from './pedir';
import type { FacturaEnPdf } from './tipos';
import type { BotonDelPdf, EstadoDelPdf } from './usePdf';

export interface PdfDeLaFactura {
  estado: EstadoDelPdf;
  esperando: BotonDelPdf | null;
  nombre: string;
  descargar: () => void;
  compartir: () => void;
}

export interface OpcionesDelPdfDeLaFactura {
  generar?: (factura: FacturaEnPdf) => Promise<Blob>;
}

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

export function olvidarLasFacturasGuardadas(): void {
  guardados.clear();
  enCamino.clear();
}

function pedir(
  firma: string,
  factura: FacturaEnPdf,
  generar: (factura: FacturaEnPdf) => Promise<Blob>,
): Promise<Blob> {
  const guardado = guardados.get(firma);
  if (guardado !== undefined) return Promise.resolve(guardado);
  const yaPedido = enCamino.get(firma);
  if (yaPedido !== undefined) return yaPedido;
  const pedido = generar(factura)
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

export function nombreDelArchivoDe(factura: FacturaEnPdf): string {
  return nombreDelArchivoDeLaFactura({
    tipo: factura.tipo,
    puntoDeVenta: factura.puntoDeVenta,
    numero: factura.numero,
    receptorNombre: factura.receptor.nombre,
  });
}

function archivoDe(archivo: Blob, factura: FacturaEnPdf): File {
  return new File([archivo], nombreDelArchivoDe(factura), { type: TIPO_DEL_PDF });
}

function tituloDe(factura: FacturaEnPdf): string {
  return nombreDelComprobante(factura.tipo, factura.puntoDeVenta, factura.numero);
}

function entregarLaDescarga(archivo: Blob, factura: FacturaEnPdf): void {
  const elArchivo = archivoDe(archivo, factura);
  if (esUnIphoneConLaAppInstalada() && sePuedenCompartirArchivos(elArchivo)) {
    compartirElArchivo(elArchivo, tituloDe(factura));
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

export function usePdfDeLaFactura(
  factura: FacturaEnPdf | null,
  { generar = generarLaFacturaEnElTrabajador }: OpcionesDelPdfDeLaFactura = {},
): PdfDeLaFactura {
  const firma = useMemo(() => (factura === null ? '' : JSON.stringify(factura)), [factura]);
  const [guardado, setEstado] = useState<Estado>(() => inicial(firma));
  const actual = guardado.firma === firma ? guardado : inicial(firma);
  const ultimo = useRef({ factura, firma, generar });
  const bajarAlTerminar = useRef(false);

  useEffect(() => {
    ultimo.current = { factura, firma, generar };
  });

  useEffect(() => {
    bajarAlTerminar.current = false;
  }, [firma]);

  const preparar = useCallback((boton: BotonDelPdf) => {
    const { factura: deAhora, firma: laDeAhora, generar: conQue } = ultimo.current;
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

  const descargar = useCallback(() => {
    const { factura: deAhora, firma: laDeAhora } = ultimo.current;
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
    const { factura: deAhora, firma: laDeAhora } = ultimo.current;
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
    nombre: factura === null ? '' : nombreDelArchivoDe(factura),
    descargar,
    compartir,
  };
}

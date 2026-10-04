import { conceptoDeSiempre, conceptoEnPantalla, type Moneda } from '@maun/domain';
import { useState } from 'react';

import {
  comprobantesDelTaller,
  facturacionDelTaller,
  LineaDeLaFactura,
  situacionDelPago,
  usePedidosEnLaCola,
  type Comprobante,
} from '@/entities/factura';
import { efectoDelPago, loQueHizoElPago, plataDelPago, type Pago } from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { ajustesDe, importeDelPago } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { diaYMes, fechaLarga, formatearLaPlata, useHaySenal } from '@/shared/lib';
import { ConSalida } from '@/shared/ui';

import { anuncioDeLosCambios, firmaDeLosEstados } from '../model/anuncios';
import { HojaDeFacturar } from './HojaDeFacturar';
import { HojaDeLaFactura } from './HojaDeLaFactura';

type HojaAbierta = { tipo: 'facturar'; pagoId: string } | { tipo: 'factura'; facturaId: string };

function EfectoDelPago({ pago, moneda }: { pago: Pago; moneda: Moneda }) {
  const efecto = efectoDelPago(importeDelPago(pago), moneda);
  if (efecto === null) return null;
  return (
    <span translate="no" className="mt-0.5 block text-meta text-text-2">
      {loQueHizoElPago(efecto)}
    </span>
  );
}

function useAnuncio(comprobantes: readonly Comprobante[]): string {
  const [vistos, setVistos] = useState(comprobantes);
  const [anuncio, setAnuncio] = useState('');
  if (firmaDeLosEstados(comprobantes) !== firmaDeLosEstados(vistos)) {
    const nuevo = anuncioDeLosCambios(vistos, comprobantes);
    setVistos(comprobantes);
    if (nuevo !== null) setAnuncio(nuevo);
  }
  return anuncio;
}

export interface ListaDePagosProps {
  pagos: readonly Pago[];
  moneda: Moneda;
  hoy: string;
  alEditarElCliente?: ((clienteId: string) => void) | undefined;
}

export function ListaDePagos({ pagos, moneda, hoy, alEditarElCliente }: ListaDePagosProps) {
  const m = useMensajes();
  const textos = m.paginaProyectos.ficha;
  const conceptos = m.proyecto.conceptosDeSiempre;
  const replica = useReplicaDelTaller();
  const enLaCola = usePedidosEnLaCola();
  const haySenal = useHaySenal();
  const [hoja, setHoja] = useState<HojaAbierta | null>(null);
  const taller = facturacionDelTaller(ajustesDe(replica));
  const ids = new Set(pagos.map((pago) => pago.id));
  const comprobantes = comprobantesDelTaller(replica).filter((comprobante) =>
    ids.has(comprobante.pago_id),
  );
  const anuncio = useAnuncio(comprobantes);

  return (
    <>
      <ol className="list-none">
        {pagos.map((pago, indice) => {
          const plata = plataDelPago(pago);
          const situacion = situacionDelPago({
            pago: { id: pago.id, moneda: pago.moneda, yaEnLaApertura: pago.ya_en_la_apertura },
            monedaDelTrabajo: moneda,
            comprobantes: comprobantes.filter((comprobante) => comprobante.pago_id === pago.id),
            taller,
            enLaCola,
            haySenal,
          });
          return (
            <li key={pago.id} className="grid grid-cols-[20px_1fr_auto] items-start gap-x-3">
              <span aria-hidden className="flex h-full flex-col items-center">
                <span
                  className={`h-3.5 w-px flex-none ${indice === 0 ? 'bg-transparent' : 'bg-border'}`}
                />
                <span className="size-2.5 flex-none rounded-pill bg-hogar" />
                <span
                  className={`w-px flex-1 ${
                    indice === pagos.length - 1 ? 'bg-transparent' : 'bg-border'
                  }`}
                />
              </span>
              <div className="min-w-0 py-2.5">
                <span
                  translate={
                    pago.concepto.trim() === '' || conceptoDeSiempre(pago.concepto) !== null
                      ? undefined
                      : 'no'
                  }
                  className="block text-body-lg font-medium"
                >
                  {pago.concepto.trim() === ''
                    ? textos.pago
                    : conceptoEnPantalla(pago.concepto, conceptos)}
                </span>
                <span translate="no" className="mt-0.5 block text-meta text-text-3">
                  {fechaLarga(pago.fecha, hoy)}
                </span>
                <EfectoDelPago pago={pago} moneda={moneda} />
                <LineaDeLaFactura
                  situacion={situacion}
                  nombreDeFacturar={m.facturacion.renglon.facturarElPago(
                    formatearLaPlata(plata),
                    diaYMes(pago.fecha, hoy),
                  )}
                  alFacturar={() => {
                    setHoja({ tipo: 'facturar', pagoId: pago.id });
                  }}
                  alAbrirLaFactura={(facturaId) => {
                    setHoja({ tipo: 'factura', facturaId });
                  }}
                />
              </div>
              <span
                translate="no"
                className="py-2.5 text-body-lg font-semibold tabular-nums whitespace-nowrap"
              >
                {formatearLaPlata(plata)}
              </span>
            </li>
          );
        })}
      </ol>
      <p aria-live="polite" className="sr-only">
        {anuncio}
      </p>

      <ConSalida valor={hoja}>
        {(abierta) =>
          abierta.tipo === 'facturar' ? (
            <HojaDeFacturar
              pagoId={abierta.pagoId}
              alCerrar={() => {
                setHoja(null);
              }}
              alEditarElCliente={alEditarElCliente}
            />
          ) : (
            <HojaDeLaFactura
              facturaId={abierta.facturaId}
              alCerrar={() => {
                setHoja(null);
              }}
            />
          )
        }
      </ConSalida>
    </>
  );
}

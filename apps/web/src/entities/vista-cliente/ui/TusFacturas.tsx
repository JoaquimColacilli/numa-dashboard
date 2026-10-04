import { nombreDelComprobante, numeroDelComprobante, type FacturaDelCliente } from '@maun/domain';
import { useId, useMemo, useState } from 'react';

import { useFormatosDelCliente, useMensajesDelCliente } from '@/shared/idioma-del-cliente';
import { sePuedenCompartirArchivos, usePdfDeLaFactura, type BotonDelPdf } from '@/shared/pdf';
import { Button, Icono } from '@/shared/ui';

import { facturaEnPdf } from '../model/facturas';

const TARJETA = 'rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5';

const CAPSULA =
  'inline-block flex-none rounded-pill border border-border px-2 py-0.5 text-badge font-semibold whitespace-nowrap text-text-2';

function RenglonDeLaFactura({
  factura,
  hoy,
  compartible,
}: {
  factura: FacturaDelCliente;
  hoy: string;
  compartible: boolean;
}) {
  const m = useMensajesDelCliente().facturas;
  const f = useFormatosDelCliente();
  const pdf = usePdfDeLaFactura(useMemo(() => facturaEnPdf(factura), [factura]));
  const nombre = nombreDelComprobante(factura.tipo, factura.puntoDeVenta, factura.numero);
  const numero = numeroDelComprobante(factura.puntoDeVenta, factura.numero);
  const tipo = nombre.slice(0, nombre.length - numero.length).trimEnd();
  const esperando = (boton: BotonDelPdf) => pdf.estado === 'preparando' && pdf.esperando === boton;
  const estado =
    pdf.estado === 'preparando'
      ? m.preparando
      : pdf.estado === 'listo' && pdf.esperando === null
        ? m.listo
        : '';
  return (
    <li className="border-t border-hairline-soft py-2.5">
      <div className="flex min-h-12 items-baseline gap-3">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span translate="no" className="text-body font-medium">
              {tipo} <span className="whitespace-nowrap">{numero}</span>
            </span>
            {factura.anuladaPor !== null && <span className={CAPSULA}>{m.anulada}</span>}
            {factura.prueba && <span className={CAPSULA}>{m.prueba}</span>}
          </span>
          <span translate="no" className="block text-label text-text-3 tabular-nums">
            {f.fechaLarga(factura.fecha, hoy)}
          </span>
          {factura.anulaA !== null && (
            <span className="block text-label leading-normal text-pretty text-text-2">
              {m.anulaA(numeroDelComprobante(factura.anulaA.puntoDeVenta, factura.anulaA.numero))}
            </span>
          )}
        </span>
        <span translate="no" className="flex-none text-body font-semibold tabular-nums">
          {f.pesos(factura.importe)}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <Button
          variant="secundario"
          size="chico"
          className="max-md:min-h-tap"
          onClick={pdf.descargar}
        >
          <Icono nombre="download" tamano={16} />
          {esperando('descargar') ? m.preparando : m.descargar}{' '}
          <span translate="no" className="sr-only">
            {nombre}
          </span>
        </Button>
        {compartible && (
          <Button
            variant="secundario"
            size="chico"
            className="max-md:min-h-tap"
            onClick={pdf.compartir}
          >
            <Icono nombre="share-2" tamano={16} />
            {esperando('compartir') ? m.preparando : m.compartir}{' '}
            <span translate="no" className="sr-only">
              {nombre}
            </span>
          </Button>
        )}
      </div>
      <p role="status" className="sr-only">
        {estado}
      </p>
      {pdf.estado === 'fallo' && (
        <p role="alert" className="mt-1.5 text-label leading-normal text-alerta">
          {m.noSePudo}
        </p>
      )}
    </li>
  );
}

export interface TusFacturasProps {
  facturas: readonly FacturaDelCliente[];
  hoy: string;
}

export function TusFacturas({ facturas, hoy }: TusFacturasProps) {
  const m = useMensajesDelCliente().facturas;
  const titulo = useId();
  const [compartible] = useState(() => sePuedenCompartirArchivos());
  if (facturas.length === 0) return null;
  return (
    <section aria-labelledby={titulo} className={TARJETA}>
      <h2 id={titulo} className="mb-1.5 text-section font-semibold">
        {m.titulo}
      </h2>
      <ul className="list-none">
        {facturas.map((factura) => (
          <RenglonDeLaFactura
            key={factura.id}
            factura={factura}
            hoy={hoy}
            compartible={compartible}
          />
        ))}
      </ul>
    </section>
  );
}

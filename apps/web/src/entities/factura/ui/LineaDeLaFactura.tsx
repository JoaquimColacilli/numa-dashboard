import type { ReactNode } from 'react';

import { useMensajes } from '@/shared/idioma';
import { Button, Icono, type NombreDeIcono } from '@/shared/ui';

import { nombreDe, numeroDe } from '../model/nombres';
import { motivoDelRechazo } from '../model/rechazo';
import type { Comprobante, SituacionDelPago } from '../model/situacion';
import { CapsulaDePrueba } from './CapsulaDePrueba';

const ESTADO = 'inline-flex items-start gap-1.5 text-left text-label leading-snug';

const QUE_SE_TOCA = 'min-h-8 underline underline-offset-3 max-md:min-h-tap';

function Estado({
  icono,
  tono = 'text-text-2',
  children,
}: {
  icono?: NombreDeIcono;
  tono?: string;
  children: ReactNode;
}) {
  return (
    <span className={`${ESTADO} ${tono}`}>
      {icono !== undefined && <Icono nombre={icono} tamano={16} className="mt-px flex-none" />}
      <span>{children}</span>
    </span>
  );
}

function Numero({ children }: { children: string }) {
  return (
    <span translate="no" className="whitespace-nowrap">
      {children}
    </span>
  );
}

function BotonDeLaFactura({
  comprobante,
  tono,
  icono,
  alAbrir,
  children,
}: {
  comprobante: Comprobante;
  tono: string;
  icono?: NombreDeIcono;
  alAbrir: (facturaId: string) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        alAbrir(comprobante.id);
      }}
      className={`${ESTADO} ${QUE_SE_TOCA} items-center rounded-control ${tono}`}
    >
      {icono !== undefined && (
        <Icono nombre={icono} tamano={16} grosor={2.25} className="flex-none" />
      )}
      <span>{children}</span>
    </button>
  );
}

export interface LineaDeLaFacturaProps {
  situacion: SituacionDelPago;
  nombreDeFacturar: string;
  alFacturar: () => void;
  alAbrirLaFactura: (facturaId: string) => void;
}

export function LineaDeLaFactura({
  situacion,
  nombreDeFacturar,
  alFacturar,
  alAbrirLaFactura,
}: LineaDeLaFacturaProps) {
  const m = useMensajes().facturacion.renglon;
  if (situacion.tipo === 'nada') return null;

  const facturar = (texto: string) => (
    <Button
      variant="secundario"
      size="chico"
      aria-label={texto === m.facturar ? nombreDeFacturar : undefined}
      className="max-md:min-h-tap"
      onClick={alFacturar}
    >
      {texto}
    </Button>
  );
  const prueba = 'prueba' in situacion && situacion.prueba ? <CapsulaDePrueba /> : null;

  let contenido: ReactNode;
  switch (situacion.tipo) {
    case 'sin-facturar':
      contenido = (
        <>
          <Estado tono="text-text-3">{m.sinFacturar}</Estado>
          {facturar(m.facturar)}
        </>
      );
      break;
    case 'en-dolares':
      contenido = <Estado tono="text-text-3">{m.enDolares}</Estado>;
      break;
    case 'en-cola':
      contenido = <Estado icono="cloud-off">{m.enCola}</Estado>;
      break;
    case 'pidiendo':
      contenido = situacion.demora ? (
        <Estado icono="clock">{m.demora}</Estado>
      ) : (
        <Estado icono="arrow-up-down">{m.pidiendo}</Estado>
      );
      break;
    case 'autorizada':
      contenido = (
        <BotonDeLaFactura
          comprobante={situacion.factura}
          tono="font-semibold text-hogar"
          icono="check"
          alAbrir={alAbrirLaFactura}
        >
          <Numero>{nombreDe(situacion.factura)}</Numero>
        </BotonDeLaFactura>
      );
      break;
    case 'anulando':
      contenido = <Estado icono="arrow-up-down">{m.anulando(numeroDe(situacion.factura))}</Estado>;
      break;
    case 'nota-rechazada':
      contenido = (
        <span className="flex flex-col items-start gap-1">
          <BotonDeLaFactura
            comprobante={situacion.factura}
            tono="font-semibold text-hogar"
            icono="check"
            alAbrir={alAbrirLaFactura}
          >
            <Numero>{nombreDe(situacion.factura)}</Numero>
          </BotonDeLaFactura>
          <Estado icono="triangle-alert" tono="text-alerta">
            {m.noAnulo(motivoDelRechazo(situacion.nota.rechazo))}
          </Estado>
        </span>
      );
      break;
    case 'anulada':
      contenido = (
        <>
          <BotonDeLaFactura
            comprobante={situacion.factura}
            tono="text-text-2"
            alAbrir={alAbrirLaFactura}
          >
            {m.anulada(nombreDe(situacion.factura))}
          </BotonDeLaFactura>
          {situacion.facturable && facturar(m.facturar)}
        </>
      );
      break;
    case 'rechazada':
      contenido = (
        <>
          <Estado icono="triangle-alert" tono="text-alerta">
            {m.rechazada(motivoDelRechazo(situacion.factura.rechazo))}
          </Estado>
          {situacion.facturable && facturar(m.volverAPedir)}
        </>
      );
      break;
    case 'a-revisar':
      contenido = (
        <BotonDeLaFactura
          comprobante={situacion.factura}
          tono="text-atencion"
          icono="triangle-alert"
          alAbrir={alAbrirLaFactura}
        >
          {m.aRevisar}
        </BotonDeLaFactura>
      );
      break;
  }

  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
      {contenido}
      {prueba}
    </span>
  );
}

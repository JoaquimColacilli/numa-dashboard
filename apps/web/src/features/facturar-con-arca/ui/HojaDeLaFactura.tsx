import { esCondicionDelReceptor, formatearCuit } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import {
  CapsulaDePrueba,
  comprobantesDelPago,
  esDePrueba,
  facturaEnPdf,
  motivoDelRechazo,
  MUTACION_DE_LA_NOTA_DE_CREDITO,
  nombreDe,
  notasDeLaFactura,
  numeroDe,
  usePedidosEnLaCola,
  type Comprobante,
} from '@/entities/factura';
import { useReplicaDelTaller } from '@/entities/replica';
import { filaPorId } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { fechaCorta, formatearPesos, metaDeAvisos, useAnchoDePantalla, uuidv7 } from '@/shared/lib';
import { sePuedenCompartirArchivos, usePdfDeLaFactura } from '@/shared/pdf';
import {
  Button,
  ConSalida,
  FilaDeAcciones,
  Hoja,
  Icono,
  Recuadro,
  RotuloEnCasillas,
} from '@/shared/ui';

import { Bloque, CuerpoDeLaHoja, PieDeLaHoja } from './piezas';

function estadoDe(comprobante: Comprobante | undefined): string | null {
  return comprobante === undefined ? null : comprobante.estado;
}

function AnularLaFactura({
  factura,
  alCancelar,
  alEmitir,
}: {
  factura: Comprobante;
  alCancelar: () => void;
  alEmitir: () => void;
}) {
  const t = useMensajes().facturacion.anular;
  return (
    <Hoja
      titulo={t.pregunta(numeroDe(factura))}
      rol="alertdialog"
      ancho="angosto"
      alCerrar={alCancelar}
    >
      <div className="flex flex-col gap-3.5 px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-6 md:pb-5">
        <p className="text-body leading-relaxed text-text-2">
          {t.texto(formatearPesos(factura.importe_centavos), factura.receptor_nombre)}
        </p>
        <FilaDeAcciones>
          <Button variant="secundario" onClick={alCancelar}>
            {t.dejarla}
          </Button>
          <Button variant="peligro" onClick={alEmitir}>
            {t.emitir}
          </Button>
        </FilaDeAcciones>
      </div>
    </Hoja>
  );
}

export interface HojaDeLaFacturaProps {
  facturaId: string;
  alCerrar: () => void;
}

export function HojaDeLaFactura({ facturaId, alCerrar }: HojaDeLaFacturaProps) {
  const m = useMensajes();
  const t = m.facturacion.factura;
  const replica = useReplicaDelTaller();
  const enLaCola = usePedidosEnLaCola();
  const enCelular = useAnchoDePantalla() === 'movil';
  const [anulando, setAnulando] = useState(false);
  const factura = filaPorId(replica, 'comprobantes', facturaId);
  const notas =
    factura === undefined
      ? []
      : notasDeLaFactura(comprobantesDelPago(replica, factura.pago_id), factura.id);
  const ultimaNota = notas.at(-1);
  const notaAutorizada = notas.filter((nota) => nota.estado === 'autorizada').at(-1) ?? null;
  const pdf = usePdfDeLaFactura(factura === undefined ? null : facturaEnPdf(factura));
  const pdfDeLaNota = usePdfDeLaFactura(
    factura === undefined || notaAutorizada === null ? null : facturaEnPdf(notaAutorizada, factura),
  );
  const pedirLaNota = useMutation({
    ...MUTACION_DE_LA_NOTA_DE_CREDITO,
    meta: metaDeAvisos('notaDeCreditoPedida', { sujeto: factura?.receptor_nombre ?? '' }),
  });

  if (factura === undefined) return null;

  const estadoDeLaNota = estadoDe(ultimaNota);
  const notaEnCamino =
    enLaCola.notas.has(factura.id) || estadoDeLaNota === 'pedida' || estadoDeLaNota === 'emitiendo';
  const anulada = factura.estado === 'anulada';
  const aRevisar = factura.estado === 'a_revisar';
  const notaARevisar = !anulada && ultimaNota !== undefined && estadoDeLaNota === 'a_revisar';
  const notaRechazada =
    factura.estado === 'autorizada' && ultimaNota !== undefined && estadoDeLaNota === 'rechazada';
  const sePuedeAnular = factura.estado === 'autorizada' && !notaEnCamino && !notaARevisar;
  const condicion = esCondicionDelReceptor(factura.receptor_condicion)
    ? m.cliente.condiciones[factura.receptor_condicion].etiqueta
    : '';
  const documento =
    factura.doc_tipo === 80
      ? m.facturacion.facturar.cuit(formatearCuit(factura.doc_nro))
      : factura.doc_tipo === 96
        ? m.facturacion.facturar.dni(factura.doc_nro)
        : null;
  const preparando = (esperando: 'descargar' | 'compartir' | null, cual: typeof pdf) =>
    cual.estado === 'preparando' && cual.esperando === esperando;

  function emitirLaNota(): void {
    if (factura === undefined) return;
    pedirLaNota.mutate({
      pedido: { id: uuidv7(), facturaId: factura.id },
      pagoId: factura.pago_id,
      proyectoId: factura.proyecto_id,
    });
    setAnulando(false);
    alCerrar();
  }

  return (
    <Hoja
      titulo={nombreDe(factura)}
      marca={esDePrueba(factura) ? <CapsulaDePrueba /> : undefined}
      alCerrar={alCerrar}
      desdeAbajo={enCelular}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CuerpoDeLaHoja>
          {aRevisar ? (
            <Recuadro tono="atencion">{t.aRevisar(numeroDe(factura))}</Recuadro>
          ) : (
            <RotuloEnCasillas
              etiqueta={t.rotulo}
              casillas={[
                { titulo: t.fecha, valor: factura.fecha === null ? '' : fechaCorta(factura.fecha) },
                { titulo: t.cae, valor: factura.cae ?? '' },
                {
                  titulo: t.venceElCae,
                  valor: factura.cae_vence === null ? '' : fechaCorta(factura.cae_vence),
                },
                { titulo: t.importe, valor: formatearPesos(factura.importe_centavos) },
              ]}
            />
          )}
          <Bloque etiqueta={t.para}>
            <span translate="no" className="text-body font-semibold">
              {factura.receptor_nombre}
            </span>
            <span className="text-label text-text-2">
              {[condicion, documento].filter((parte) => parte !== null && parte !== '').join(' · ')}
            </span>
          </Bloque>
          <Bloque etiqueta={t.detalle}>
            <span translate="no" className="text-body-sm">
              {factura.detalle}
            </span>
          </Bloque>
          {anulada && notaAutorizada !== null && notaAutorizada.fecha !== null && (
            <Recuadro icono="x">
              {t.anuladaCon(numeroDe(notaAutorizada), fechaCorta(notaAutorizada.fecha))}
            </Recuadro>
          )}
          {notaRechazada && (
            <Recuadro tono="alerta">
              {m.facturacion.renglon.noAnulo(motivoDelRechazo(ultimaNota.rechazo))}
            </Recuadro>
          )}
          {notaARevisar && (
            <Recuadro tono="atencion">{t.notaARevisar(numeroDe(ultimaNota))}</Recuadro>
          )}
          {notaEnCamino && !anulada && (
            <p className="flex items-start gap-1.5 text-label text-text-2">
              <Icono nombre="arrow-up-down" tamano={16} className="mt-px flex-none" />
              {m.facturacion.renglon.anulando(numeroDe(factura))}
            </p>
          )}
          {(pdf.estado === 'fallo' || pdfDeLaNota.estado === 'fallo') && (
            <p role="alert" className="text-label font-medium text-alerta">
              {m.pdf.noSePudo}
            </p>
          )}
        </CuerpoDeLaHoja>
        {!aRevisar && (
          <PieDeLaHoja>
            <div className="flex flex-col gap-2">
              <FilaDeAcciones>
                <Button onClick={pdf.descargar}>
                  <Icono nombre="file-text" tamano={18} />
                  {preparando('descargar', pdf) ? m.pdf.preparando : t.verElPdf}
                </Button>
                {anulada && notaAutorizada !== null && (
                  <Button variant="secundario" onClick={pdfDeLaNota.descargar}>
                    <Icono nombre="file-text" tamano={18} />
                    {preparando('descargar', pdfDeLaNota) ? m.pdf.preparando : t.verElPdfDeLaNota}
                  </Button>
                )}
                {sePuedenCompartirArchivos() && (
                  <Button variant="secundario" onClick={pdf.compartir}>
                    <Icono nombre="share-2" tamano={18} />
                    {preparando('compartir', pdf) ? m.pdf.preparando : t.compartir}
                  </Button>
                )}
              </FilaDeAcciones>
              {sePuedeAnular && (
                <button
                  type="button"
                  className="apretable -ml-3 inline-flex min-h-button items-center self-start rounded-pill px-3 text-body font-medium text-alerta underline underline-offset-3"
                  onClick={() => {
                    setAnulando(true);
                  }}
                >
                  {t.anular}
                </button>
              )}
            </div>
          </PieDeLaHoja>
        )}
      </div>

      <ConSalida valor={anulando}>
        {() => (
          <AnularLaFactura
            factura={factura}
            alCancelar={() => {
              setAnulando(false);
            }}
            alEmitir={emitirLaNota}
          />
        )}
      </ConSalida>
    </Hoja>
  );
}

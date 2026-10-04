import { numeroConCeros, numeroDelComprobante, puntoDeVentaConCeros } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { Fragment, useId, type ReactNode } from 'react';

import {
  alertasDeLaFacturacion,
  facturacionDelTaller,
  MUTACION_DE_LA_ALERTA_REVISADA,
} from '@/entities/factura';
import { rutaDelProyecto } from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { ajustesDe, type AlertaDeFacturacion } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import {
  fechaCorta,
  Ir,
  metaDeAvisos,
  RUTA_DE_LA_FACTURACION,
  RUTA_DEL_ASISTENTE_DE_ARCA,
} from '@/shared/lib';
import { Button, Icono } from '@/shared/ui';

const ACCION =
  'inline-flex min-h-button-sm items-center self-start rounded-pill border border-border bg-paper px-3.5 text-label font-medium text-ink no-underline hover:bg-surface max-md:min-h-tap';

function Alerta({
  tono,
  titulo,
  texto,
  children,
}: {
  tono: 'atencion' | 'alerta';
  titulo: string;
  texto: string;
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className={`flex items-start gap-3 rounded-panel border px-4 py-3.5 ${
        tono === 'alerta' ? 'border-alerta bg-alerta-tint' : 'border-atencion bg-atencion-tint'
      }`}
    >
      <Icono
        nombre="triangle-alert"
        tamano={20}
        className={`mt-0.5 flex-none ${tono === 'alerta' ? 'text-alerta' : 'text-atencion'}`}
      />
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 id={id} className="text-body font-semibold">
          {titulo}
        </h2>
        <p className="text-label leading-relaxed text-ink">{texto}</p>
        {children}
      </div>
    </section>
  );
}

function claveDe(alerta: AlertaDeFacturacion): string {
  switch (alerta.codigo) {
    case 'fuera-de-numa':
      return `${alerta.codigo}:${alerta.tipo}:${String(alerta.numeroArca)}`;
    case 'a-revisar':
      return `${alerta.codigo}:${alerta.comprobanteId}`;
    default:
      return alerta.codigo;
  }
}

export function AlertasDeLaFacturacion() {
  const m = useMensajes().facturacion.alertas;
  const replica = useReplicaDelTaller();
  const ajustes = ajustesDe(replica);
  const taller = facturacionDelTaller(ajustes);
  const revisar = useMutation({
    ...MUTACION_DE_LA_ALERTA_REVISADA,
    meta: metaDeAvisos('alertaRevisada'),
  });
  if (!taller.conectado || ajustes === undefined) return null;
  const alertas = alertasDeLaFacturacion(ajustes);
  if (alertas.length === 0) return null;

  function contenido(alerta: AlertaDeFacturacion): ReactNode {
    if (ajustes === undefined) return null;
    switch (alerta.codigo) {
      case 'fuera-de-numa': {
        const esNota = alerta.tipo === 'nota_de_credito_c';
        const documento = esNota ? m.laNota : m.laFactura;
        const puntoDeVenta = puntoDeVentaConCeros(alerta.puntoDeVenta);
        const deArca = numeroConCeros(alerta.numeroArca);
        return (
          <Alerta
            tono="atencion"
            titulo={esNota ? m.fueraDeNuma.tituloDeLaNota : m.fueraDeNuma.tituloDeLaFactura}
            texto={
              alerta.numeroNuma === null
                ? m.fueraDeNuma.sinNinguna(documento, puntoDeVenta, deArca)
                : m.fueraDeNuma.texto(
                    documento,
                    puntoDeVenta,
                    deArca,
                    numeroConCeros(alerta.numeroNuma),
                  )
            }
          >
            <Button
              variant="secundario"
              size="chico"
              className="self-start max-md:min-h-tap"
              onClick={() => {
                revisar.mutate({
                  alerta: { codigo: 'fuera-de-numa', numero: alerta.numeroArca },
                  previos: ajustes,
                });
              }}
            >
              {m.fueraDeNuma.yaLoRevise}
            </Button>
          </Alerta>
        );
      }
      case 'a-revisar': {
        const esNota = alerta.tipo === 'nota_de_credito_c';
        return (
          <Alerta
            tono="atencion"
            titulo={esNota ? m.aRevisar.tituloDeLaNota : m.aRevisar.tituloDeLaFactura}
            texto={m.aRevisar.texto(
              esNota ? m.laNota : m.laFactura,
              numeroDelComprobante(alerta.puntoDeVenta, alerta.numero),
              alerta.cliente,
            )}
          >
            {alerta.proyectoId !== null && (
              <Ir a={rutaDelProyecto(alerta.proyectoId)} className={ACCION}>
                {m.aRevisar.verElTrabajo}
              </Ir>
            )}
          </Alerta>
        );
      }
      case 'certificado-por-vencer':
        return (
          <Alerta
            tono="atencion"
            titulo={m.certificado.titulo(fechaCorta(alerta.vence))}
            texto={m.certificado.texto}
          >
            {taller.ambiente === 'produccion' && (
              <Ir a={RUTA_DEL_ASISTENTE_DE_ARCA} className={ACCION}>
                {m.certificado.renovar}
              </Ir>
            )}
          </Alerta>
        );
      case 'sin-acceso':
        return (
          <Alerta tono="alerta" titulo={m.sinAcceso.titulo} texto={m.sinAcceso.texto}>
            <Ir a={RUTA_DE_LA_FACTURACION} className={ACCION}>
              {m.sinAcceso.probar}
            </Ir>
          </Alerta>
        );
    }
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {alertas.map((alerta) => (
        <Fragment key={claveDe(alerta)}>{contenido(alerta)}</Fragment>
      ))}
    </div>
  );
}

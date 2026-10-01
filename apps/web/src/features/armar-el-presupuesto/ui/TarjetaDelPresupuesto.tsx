import type { DocumentoDelPresupuesto, Money } from '@maun/domain';
import { useId, type ReactNode } from 'react';

import type { Proyecto } from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import {
  fechaLarga,
  formatearPesos,
  hoyEnElTaller,
  Ir,
  relativa,
  rutaDelPresupuesto,
  rutaDeLaVistaDelCliente,
  useIr,
} from '@/shared/lib';
import {
  PREPARANDO_EL_PDF,
  usePdfDelPresupuesto,
  type PdfDelPresupuesto,
  type PresupuestoEnPdf,
} from '@/shared/pdf';
import {
  BloquePlegable,
  Button,
  FilaDeAcciones,
  Globo,
  Icono,
  LineaDePuntos,
  MarcaDeRevision,
  RotuloDelPresupuesto,
} from '@/shared/ui';

import { numeroDeLaRevision, pdfDeLaRevision, pdfDeLaTarjeta } from '../model/pdf';
import { estadoDeLaTarjeta, sePuedeMandarOtra, type RevisionLeida } from '../model/tarjeta';

const TARJETA =
  'flex flex-col gap-3 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5';

function Valores({
  documento,
  acordado = null,
}: {
  documento: DocumentoDelPresupuesto;
  acordado?: Money | null;
}) {
  const valores = documento.valores;
  if (valores === null) return <p className="text-label text-text-2">Todavía sin total.</p>;
  if (valores.tipo === 'total') {
    return (
      <div className="flex flex-col gap-1">
        <LineaDePuntos
          className="text-body"
          izquierda="Total"
          derecha={<span className="font-semibold">{formatearPesos(valores.total)}</span>}
        />
        {acordado !== null && (
          <p className="text-label font-semibold">
            Acordado al aprobar: {formatearPesos(acordado)}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      {valores.opciones.map((opcion) => (
        <LineaDePuntos
          key={opcion.id}
          className="text-body"
          izquierda={`Opción ${opcion.letra}`}
          derecha={<span className="font-semibold">{formatearPesos(opcion.total)}</span>}
        />
      ))}
      {acordado !== null && (
        <p className="text-label font-semibold">Acordado al aprobar: {formatearPesos(acordado)}</p>
      )}
    </div>
  );
}

function Muebles({ documento }: { documento: DocumentoDelPresupuesto }) {
  if (documento.muebles.length === 0) {
    return <p className="text-label text-text-2">Todavía sin muebles.</p>;
  }
  return (
    <ol aria-label="Muebles" className="flex list-none flex-wrap gap-x-5 gap-y-2">
      {documento.muebles.map((mueble, indice) => (
        <li
          key={`${String(indice)}-${mueble.nombre}`}
          className="flex items-center gap-2 text-body"
        >
          <Globo numero={indice + 1} />
          {mueble.nombre === '' ? 'Sin nombre' : mueble.nombre}
        </li>
      ))}
    </ol>
  );
}

function BotonDelPdf({
  pdf,
  size = 'normal',
  etiqueta = 'Ver el PDF',
}: {
  pdf: PdfDelPresupuesto;
  size?: 'normal' | 'chico';
  etiqueta?: string;
}) {
  return (
    <Button variant="secundario" size={size} className="flex-none" onClick={pdf.descargar}>
      <Icono nombre="file-text" tamano={size === 'chico' ? 15 : 16} />
      {pdf.estado === 'preparando' && pdf.esperando === 'descargar' ? PREPARANDO_EL_PDF : etiqueta}
    </Button>
  );
}

function RevisionAnterior({ revision }: { revision: RevisionLeida }) {
  const hoy = hoyEnElTaller();
  const pdf = usePdfDelPresupuesto(pdfDeLaRevision(revision, revision.fila.vale_hasta));
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-hairline-soft py-2.5 first:border-t-0">
      <div className="min-w-0 flex-[1_1_14rem]">
        <p className="text-body font-medium">
          Rev. {revision.fila.revision}{' '}
          <span className="font-normal text-text-2">
            · {fechaLarga(revision.fila.mandado_el, hoy)}
          </span>
        </p>
        <p className="text-label leading-relaxed text-text-2">
          {revision.fila.que_cambio ?? 'La primera que le mandaste.'}
        </p>
      </div>
      <BotonDelPdf pdf={pdf} size="chico" />
    </li>
  );
}

function Anteriores({ revisiones }: { revisiones: readonly RevisionLeida[] }) {
  if (revisiones.length === 0) return null;
  return (
    <BloquePlegable
      titulo="Revisiones anteriores"
      resumen={String(revisiones.length)}
      abiertoAlPrincipio={false}
      enTarjeta={false}
      enRenglon
      nivel="h3"
      claseDelTitulo="text-body font-semibold"
      className="-mb-1 border-t border-hairline-soft pt-1"
    >
      <ol className="list-none pb-1 pl-6">
        {revisiones.map((revision) => (
          <RevisionAnterior key={revision.fila.id} revision={revision} />
        ))}
      </ol>
    </BloquePlegable>
  );
}

function Encabezado({ id, dato }: { id: string; dato?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 id={id} className="text-section font-semibold">
        El presupuesto
      </h2>
      {dato}
    </div>
  );
}

function usePdfDeLaTarjeta(pedido: PresupuestoEnPdf | null): PdfDelPresupuesto {
  return usePdfDelPresupuesto(pedido, { alAbrir: pedido !== null });
}

export interface TarjetaDelPresupuestoProps {
  proyecto: Proyecto;
}

export function TarjetaDelPresupuesto({ proyecto }: TarjetaDelPresupuestoProps) {
  const replica = useReplicaDelTaller();
  const ir = useIr();
  const id = useId();
  const hoy = hoyEnElTaller();
  const estado = estadoDeLaTarjeta(replica, proyecto, hoy);
  const alEditor = rutaDelPresupuesto(proyecto.id);

  const pdf = usePdfDeLaTarjeta(pdfDeLaTarjeta(estado));

  if (
    (estado.cual === 'sin-borrador' || estado.cual === 'borrador') &&
    !sePuedeMandarOtra(proyecto.estado)
  ) {
    return null;
  }

  if (estado.cual === 'sin-borrador') {
    return (
      <section aria-labelledby={id} className={TARJETA}>
        <div className="flex flex-col gap-1">
          <Encabezado id={id} />
          <p className="max-w-[560px] text-label leading-relaxed text-text-2">
            Armalo acá y tu cliente lo ve en su página: el detalle, lo que incluye, las condiciones
            y el total. También lo puede bajar en PDF.
          </p>
        </div>
        <Button
          variant="secundario"
          className="self-start"
          onClick={() => {
            ir(alEditor);
          }}
        >
          <Icono nombre="pencil-ruler" tamano={16} />
          Armar el presupuesto
        </Button>
      </section>
    );
  }

  if (estado.cual === 'borrador') {
    const { documento, presupuesto } = estado;
    const guardadoEl = hoyEnElTaller(new Date(presupuesto.updated_at));
    return (
      <section aria-labelledby={id} className={TARJETA}>
        <Encabezado
          id={id}
          dato={
            <span className="rounded-pill border border-border px-2 py-0.5 text-badge font-semibold text-text-2">
              Borrador
            </span>
          }
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-body-lg leading-snug font-semibold">
            {documento.titulo === '' ? 'Sin título todavía' : documento.titulo}
          </p>
          {documento.obra !== '' && <p className="text-label text-text-2">{documento.obra}</p>}
        </div>
        <Muebles documento={documento} />
        <Valores documento={documento} />
        <p className="text-meta text-text-3">
          {guardadoEl === hoy ? 'Guardado hoy' : `Guardado el ${fechaLarga(guardadoEl, hoy)}`} ·
          Todavía sin número
        </p>
        <FilaDeAcciones>
          <Button
            variant="secundario"
            onClick={() => {
              ir(alEditor);
            }}
          >
            <Icono nombre="pencil-ruler" tamano={16} />
            Seguir armándolo
          </Button>
          <BotonDelPdf pdf={pdf} />
        </FilaDeAcciones>
      </section>
    );
  }

  if (estado.cual === 'mandado') {
    const { ultima, presupuesto, valeHasta, vencido, cambiosSinMandar, anteriores, seMandaOtra } =
      estado;
    const numero = numeroDeLaRevision(ultima) ?? presupuesto.numero;
    const siguiente = ultima.fila.revision + 1;
    return (
      <section aria-labelledby={id} className={TARJETA}>
        <Encabezado
          id={id}
          dato={
            <span className="text-label text-text-2">
              Mandado {relativa(ultima.fila.mandado_el, hoy)}
            </span>
          }
        />
        <RotuloDelPresupuesto
          numero={numero}
          revision={ultima.fila.revision}
          emitido={ultima.fila.mandado_el}
          valeHasta={valeHasta}
          vencido={vencido}
        />
        {numero === null && (
          <p className="flex items-start gap-2 text-label leading-relaxed text-text-2">
            <Icono nombre="cloud-off" tamano={16} className="mt-px flex-none" />
            Se numera cuando vuelva la señal.
          </p>
        )}
        {vencido && valeHasta !== null && (
          <p className="flex items-start gap-2 text-label font-semibold text-atencion">
            <Icono nombre="triangle-alert" tamano={16} className="mt-px flex-none" />
            Venció el {fechaLarga(valeHasta, hoy)}. Mandá una revisión o cambiale la fecha.
          </p>
        )}
        {ultima.fila.que_cambio !== null && (
          <div className="flex items-start gap-3 rounded-field bg-surface px-3.5 py-3">
            <MarcaDeRevision numero={ultima.fila.revision} suelta />
            <div className="min-w-0">
              <p className="text-label font-semibold">
                Qué cambió en la revisión {ultima.fila.revision}
              </p>
              <p className="text-body leading-relaxed text-text-2">{ultima.fila.que_cambio}</p>
            </div>
          </div>
        )}
        <Valores documento={ultima.documento} />
        {cambiosSinMandar && (
          <p className="flex items-start gap-2 text-label leading-relaxed font-medium text-atencion">
            <Icono nombre="pencil-line" tamano={16} className="mt-px flex-none" />
            Tenés cambios sin mandar: tu cliente sigue viendo la revisión {ultima.fila.revision}.
          </p>
        )}
        <FilaDeAcciones>
          {seMandaOtra && (
            <Button
              variant="secundario"
              onClick={() => {
                ir(alEditor, cambiosSinMandar ? { senal: 'mandarElPresupuesto' } : undefined);
              }}
            >
              <Icono nombre={cambiosSinMandar ? 'send' : 'pencil-ruler'} tamano={16} />
              {cambiosSinMandar ? `Mandar la revisión ${String(siguiente)}` : 'Hacer cambios'}
            </Button>
          )}
          <BotonDelPdf pdf={pdf} />
        </FilaDeAcciones>
        <Ir
          a={rutaDeLaVistaDelCliente(proyecto.id)}
          className="-my-1 inline-flex min-h-tap items-center gap-1.5 self-start rounded-field text-label font-medium underline underline-offset-3"
        >
          <Icono nombre="eye" tamano={16} />
          Ver cómo lo ve tu cliente
        </Ir>
        <Anteriores revisiones={anteriores} />
      </section>
    );
  }

  const { ultima, presupuesto, aceptadoEl, opcion, documento, anteriores, acordado } = estado;
  return (
    <section aria-labelledby={id} className={TARJETA}>
      <Encabezado
        id={id}
        dato={
          <span className="flex items-center gap-1 text-label font-semibold text-hogar">
            <Icono nombre="check" tamano={15} />
            Aceptado
          </span>
        }
      />
      <RotuloDelPresupuesto
        numero={numeroDeLaRevision(ultima) ?? presupuesto.numero}
        revision={ultima.fila.revision}
        emitido={ultima.fila.mandado_el}
        aceptado={{ el: aceptadoEl, letra: opcion?.letra ?? null }}
      />
      {aceptadoEl !== null && (
        <p className="text-label leading-relaxed text-text-2">
          Lo aceptó el {fechaLarga(aceptadoEl, hoy)}
          {opcion === null ? '' : `, con la opción ${opcion.letra}`}: es el presupuesto del trabajo.
        </p>
      )}
      <div className="flex flex-col gap-1">
        <Valores documento={documento} acordado={acordado} />
        {opcion !== null && opcion.descripcion !== '' && (
          <p className="text-label leading-relaxed text-text-2">{opcion.descripcion}</p>
        )}
      </div>
      <div className="self-start">
        <BotonDelPdf pdf={pdf} />
      </div>
      <Anteriores revisiones={anteriores} />
    </section>
  );
}

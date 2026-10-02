import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useCallback, useId, useRef, useState, type ChangeEvent } from 'react';

import {
  ArchivoRechazado,
  archivosDelProyecto,
  destinoDelTrabajo,
  esImagen,
  loQueVeElCliente,
  pesoLegible,
  prepararImagen,
  rutaDeLaMiniatura,
  rutaDelArchivo,
  sinSenalParaArchivos,
  subirUnArchivo,
  TIPOS_QUE_SE_ELIGEN,
  type Archivo,
  type DependenciasDeLaSubida,
} from '@/entities/archivo';
import { useReplicaDelTaller } from '@/entities/replica';
import {
  esFalloDeRed,
  householdDe,
  mensajeDeAcceso,
  subirAlBucketDeArchivos,
  urlDelArchivo,
} from '@/shared/api';
import { mensajes, useMensajes } from '@/shared/idioma';
import {
  avisarEnPantalla,
  decodificarImagen,
  ImagenIlegible,
  rutaDeCompartir,
  uuidv7,
  Ir,
} from '@/shared/lib';
import { Button, ConSalida, Icono, VisorDeImagenes } from '@/shared/ui';

import { anotarArchivo, borrarArchivo, mandarALaCola, opcionesDelBorrado } from '../model/acciones';

const DEPENDENCIAS: DependenciasDeLaSubida = {
  subir: subirAlBucketDeArchivos,
  decodificar: decodificarImagen,
  preparar: (imagen) => prepararImagen(imagen),
  nuevoId: uuidv7,
};

interface RecienSubido {
  nombre: string;
  original: number;
  subido: number;
}

type Subida = { fase: 'quieta' } | { fase: 'subiendo'; actual: number; total: number };

function motivoDelFallo(nombre: string, fallo: unknown): string {
  const textos = mensajes().archivo;
  if (fallo instanceof ArchivoRechazado) return fallo.message;
  if (fallo instanceof ImagenIlegible) return textos.conElNombre(nombre, fallo.message);
  if (esFalloDeRed(fallo)) return sinSenalParaArchivos();
  return textos.noSeSubio(nombre, mensajeDeAcceso(fallo));
}

export interface ArchivosDelTrabajoProps {
  proyectoId: string;
}

export function ArchivosDelTrabajo({ proyectoId }: ArchivosDelTrabajoProps) {
  const textos = useMensajes().adjuntarArchivos;
  const replica = useReplicaDelTaller();
  const cliente = useQueryClient();
  const idTitulo = useId();
  const selector = useRef<HTMLInputElement>(null);
  const [subida, setSubida] = useState<Subida>({ fase: 'quieta' });
  const [problemas, setProblemas] = useState<string[]>([]);
  const [recienSubidos, setRecienSubidos] = useState<RecienSubido[]>([]);
  const [enElVisor, setEnElVisor] = useState<string | null>(null);

  const archivos = archivosDelProyecto(replica, proyectoId);
  const imagenes = archivos.filter(esImagen);
  const documentos = archivos.filter((archivo) => !esImagen(archivo));
  const vistos = loQueVeElCliente(archivos);
  const household = householdDe(replica);
  const subiendo = subida.fase === 'subiendo';

  const cerrarElVisor = useCallback(() => {
    setEnElVisor(null);
  }, []);

  function borrar(archivo: Archivo): void {
    if (enElVisor !== null && imagenes.length <= 1) setEnElVisor(null);
    borrarArchivo(mandarALaCola(cliente), archivo, opcionesDelBorrado(cliente, archivo));
  }

  function elegir(): void {
    if (!onlineManager.isOnline()) {
      setProblemas([sinSenalParaArchivos()]);
      return;
    }
    setProblemas([]);
    selector.current?.click();
  }

  async function alElegir(evento: ChangeEvent<HTMLInputElement>): Promise<void> {
    const elegidos = [...(evento.target.files ?? [])];
    evento.target.value = '';
    if (elegidos.length === 0 || household === undefined) return;
    if (!onlineManager.isOnline()) {
      setProblemas([sinSenalParaArchivos()]);
      return;
    }

    const encontrados: string[] = [];
    const subidos: RecienSubido[] = [];
    setProblemas([]);
    setRecienSubidos([]);

    for (const [indice, elegido] of elegidos.entries()) {
      setSubida({ fase: 'subiendo', actual: indice + 1, total: elegidos.length });
      try {
        const resultado = await subirUnArchivo(
          elegido,
          destinoDelTrabajo(household.id, proyectoId),
          DEPENDENCIAS,
        );
        anotarArchivo(mandarALaCola(cliente), {
          id: resultado.id,
          proyecto_id: proyectoId,
          nombre: resultado.nombre,
          tipo: resultado.tipo,
          bytes: resultado.bytes,
          ancho: resultado.ancho,
          alto: resultado.alto,
        });
        subidos.push({
          nombre: resultado.nombre,
          original: resultado.original,
          subido: resultado.subido,
        });
      } catch (fallo) {
        const motivo = motivoDelFallo(elegido.name, fallo);
        if (!encontrados.includes(motivo)) encontrados.push(motivo);
        if (esFalloDeRed(fallo)) break;
      }
    }

    setSubida({ fase: 'quieta' });
    setProblemas(encontrados);
    setRecienSubidos(subidos);
    if (subidos.length > 0) {
      avisarEnPantalla({
        clave: `archivos-subidos-${proyectoId}`,
        tono: 'hecho',
        texto: mensajes().adjuntarArchivos.subidos(subidos.length),
      });
    }
  }

  return (
    <section
      aria-labelledby={idTitulo}
      className="rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 id={idTitulo} className="text-section font-semibold">
          {textos.titulo}
        </h2>
        {vistos.total > 0 && (
          <span className="text-label text-text-2 tabular-nums">
            {vistos.todos
              ? textos.queVeElClienteTodos(vistos.total)
              : textos.queVeElCliente(vistos.total, vistos.compartidos)}
          </span>
        )}
      </div>
      <p className="text-meta leading-relaxed text-text-3">{textos.queSeSube}</p>

      {vistos.ninguno && (
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-hairline-soft py-3 text-label leading-relaxed text-text-2">
          <Icono nombre="eye-off" tamano={15} className="flex-none translate-y-0.5 text-text-3" />
          <span>{textos.noVeNinguno}</span>
          <Ir
            a={rutaDeCompartir(proyectoId)}
            className="font-medium text-ink underline decoration-hairline underline-offset-3 hover:decoration-ink"
          >
            {textos.elegirCualesVe}
          </Ir>
        </p>
      )}

      {archivos.length === 0 && (
        <p className="mt-2 border-t border-hairline-soft py-3 text-label text-text-2">
          {textos.sinArchivos}
        </p>
      )}

      {imagenes.length > 0 && (
        <div className="@container mt-2.5">
          <ul
            aria-label={textos.fotosEImagenes}
            className="grid grid-cols-3 gap-2 @md:grid-cols-4 @xl:grid-cols-5"
          >
            {imagenes.map((imagen) => (
              <li key={imagen.id}>
                <button
                  type="button"
                  aria-label={textos.ver(imagen.nombre)}
                  onClick={() => {
                    setEnElVisor(imagen.id);
                  }}
                  className="block aspect-square w-full overflow-hidden rounded-field bg-surface"
                >
                  <img
                    src={urlDelArchivo(rutaDeLaMiniatura(imagen))}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {documentos.length > 0 && (
        <ul aria-label={textos.documentos} className="mt-2.5">
          {documentos.map((documento) => (
            <li
              key={documento.id}
              className="flex min-h-12 items-center gap-2.5 border-t border-hairline-soft"
            >
              <Icono nombre="file-text" tamano={18} className="flex-none text-text-2" />
              <a
                href={urlDelArchivo(rutaDelArchivo(documento))}
                target="_blank"
                rel="noopener noreferrer"
                translate="no"
                className="min-w-0 flex-1 truncate text-body font-medium underline decoration-hairline underline-offset-3 hover:decoration-ink"
              >
                {documento.nombre}
              </a>
              <span translate="no" className="flex-none text-meta text-text-3 tabular-nums">
                {pesoLegible(documento.bytes)}
              </span>
              <button
                type="button"
                aria-label={textos.borrarUno(documento.nombre)}
                onClick={() => {
                  borrar(documento);
                }}
                className="flex size-tap flex-none items-center justify-center rounded-pill text-text-3 hover:bg-surface hover:text-alerta"
              >
                <Icono nombre="trash-2" tamano={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="secundario" className="mt-3 w-full" cargando={subiendo} onClick={elegir}>
        <Icono nombre="plus" tamano={16} />
        {textos.subir}
      </Button>
      <input
        ref={selector}
        type="file"
        multiple
        accept={TIPOS_QUE_SE_ELIGEN}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(evento) => {
          void alElegir(evento);
        }}
      />

      {subida.fase === 'subiendo' && (
        <p role="status" className="mt-2 text-label text-text-2">
          {textos.subiendo(subida.actual, subida.total)}
        </p>
      )}

      {recienSubidos.length > 0 && (
        <ul
          aria-label={textos.recienSubidos}
          className="mt-2 text-meta leading-relaxed text-text-3"
        >
          {recienSubidos.map((subido) => (
            <li key={`${subido.nombre}-${String(subido.subido)}`}>
              <span translate="no">{subido.nombre}</span>:{' '}
              <span translate="no" className="whitespace-nowrap">
                {subido.original === subido.subido
                  ? pesoLegible(subido.subido)
                  : `${pesoLegible(subido.original)} → ${pesoLegible(subido.subido)}`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {problemas.map((problema) => (
        <p
          key={problema}
          role="alert"
          className="mt-2 text-label leading-relaxed font-medium text-alerta"
        >
          {problema}
        </p>
      ))}

      <ConSalida valor={enElVisor}>
        {(inicial) => (
          <VisorDeImagenes
            imagenes={imagenes.map((imagen) => ({
              ...imagen,
              url: urlDelArchivo(rutaDelArchivo(imagen)),
            }))}
            inicial={inicial}
            alCerrar={cerrarElVisor}
            detalle={(imagen) => pesoLegible(imagen.bytes)}
            acciones={({ url: _url, ...archivo }) => (
              <Button
                variant="secundario"
                size="chico"
                onClick={() => {
                  borrar(archivo);
                }}
              >
                <Icono nombre="trash-2" tamano={15} />
                {textos.borrar}
              </Button>
            )}
          />
        )}
      </ConSalida>
    </section>
  );
}

import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import {
  aprobacionDeUnaOpcion,
  MUTACION_DE_PROYECTO,
  opcionAprobada,
  opcionesDelProyecto,
  rutaDeEdicion,
  type OpcionDePresupuesto,
  type Proyecto,
} from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { monedaDelTrabajo } from '@/shared/api';
import { mensajes, useMensajes } from '@/shared/idioma';
import { avisarEnPantalla, formatearPlata, metaDeAvisos, useIr } from '@/shared/lib';
import { Button, Icono } from '@/shared/ui';

export interface OpcionesDelTrabajoProps {
  proyecto: Proyecto;
  ofreceCargarLaPrimera?: boolean;
}

export function OpcionesDelTrabajo({
  proyecto,
  ofreceCargarLaPrimera = false,
}: OpcionesDelTrabajoProps) {
  const replica = useReplicaDelTaller();
  const ir = useIr();
  const textos = useMensajes().editarProyecto.opcionesDelTrabajo;
  const opciones = opcionesDelProyecto(replica, proyecto.id);

  const ultimo = useRef({ proyecto, opciones });
  useEffect(() => {
    ultimo.current = { proyecto, opciones };
  });

  const guardar = useMutation({
    ...MUTACION_DE_PROYECTO,
    meta: metaDeAvisos('proyectoGuardado', { silencioso: true }),
  });

  if (opciones.length === 0) {
    if (!ofreceCargarLaPrimera) return null;
    return (
      <section
        aria-label={textos.titulo}
        className="rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
      >
        <h2 className="text-section font-semibold">{textos.titulo}</h2>
        <p className="mt-1.5 text-meta leading-normal text-text-3">{textos.cargarLaPrimera}</p>
        <Button
          variant="secundario"
          className="mt-2.5"
          onClick={() => {
            ir(rutaDeEdicion(proyecto.id), { state: { primeraOpcion: true } });
          }}
        >
          <Icono nombre="plus" tamano={16} />
          {textos.cargarLasOpciones}
        </Button>
      </section>
    );
  }

  const aprobada = opcionAprobada(opciones);

  function tildar(id: string, valor: boolean): void {
    const actual = ultimo.current;
    guardar.mutate(aprobacionDeUnaOpcion(actual.proyecto, actual.opciones, id, valor));
  }

  function alTildar(opcion: OpcionDePresupuesto, valor: boolean): void {
    const previo = opcionAprobada(ultimo.current.opciones);
    const avisos = mensajes().editarProyecto.opcionesDelTrabajo;
    tildar(opcion.id, valor);

    avisarEnPantalla({
      clave: `opcion:${proyecto.id}`,
      tono: 'hecho',
      texto: valor
        ? avisos.aprobaste(formatearPlata(opcion.monto_centavos, monedaDelTrabajo(proyecto)))
        : avisos.sacasteLaAprobacion,
      accion: {
        etiqueta: avisos.deshacer,
        alTocar: () => {
          if (previo === undefined) tildar(opcion.id, false);
          else tildar(previo.id, true);
        },
      },
    });
  }

  return (
    <section
      aria-label={textos.titulo}
      className="rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <h2 className="text-section font-semibold">{textos.titulo}</h2>
        <span className="text-label text-text-2 tabular-nums">
          {textos.cuantas(opciones.length)}
        </span>
      </div>
      <p className="mb-1 text-meta leading-normal text-text-3">
        {aprobada === undefined ? textos.sinAprobar : textos.conAprobada}
      </p>

      <ul className="list-none">
        {opciones.map((opcion) => {
          const esLaAprobada = opcion.aprobada;
          const sinDetalle = opcion.descripcion.trim() === '';
          return (
            <li
              key={opcion.id}
              className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t py-2.5 ${
                esLaAprobada ? 'border-hogar' : 'border-hairline-soft'
              }`}
            >
              <span className="min-w-0 flex-1 basis-[12rem]">
                <span
                  translate={sinDetalle ? undefined : 'no'}
                  className="block text-body-lg leading-snug font-medium"
                >
                  {sinDetalle ? textos.sinDetalle : opcion.descripcion}
                </span>
                {esLaAprobada && (
                  <span className="mt-0.5 flex items-center gap-1 text-meta font-semibold text-hogar">
                    <Icono nombre="check" tamano={14} />
                    {textos.esElPresupuesto}
                  </span>
                )}
              </span>
              <span
                translate="no"
                className={`flex-none text-money font-semibold tabular-nums ${
                  esLaAprobada ? 'text-hogar' : ''
                }`}
              >
                {formatearPlata(opcion.monto_centavos, monedaDelTrabajo(proyecto))}
              </span>
              <button
                type="button"
                aria-pressed={esLaAprobada}
                onClick={() => {
                  alTildar(opcion, !esLaAprobada);
                }}
                className={`apretable flex min-h-tap flex-none items-center gap-1.5 rounded-pill border px-3 text-label font-medium ${
                  esLaAprobada
                    ? 'border-hogar bg-hogar-tint text-hogar'
                    : 'border-border text-text-2 hover:bg-surface'
                }`}
              >
                <Icono nombre={esLaAprobada ? 'check' : 'plus'} tamano={16} />
                {esLaAprobada ? textos.estaAprobada : textos.laAprobo}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import { respuestaPendiente, type RespuestaDelCliente } from '@/entities/presupuesto';
import type { Proyecto } from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { useMensajes } from '@/shared/idioma';
import { fechaEnUnaFrase, fechaLarga, hoyEnElTaller, whatsappCon } from '@/shared/lib';
import { Button, FilaDeAcciones, Icono } from '@/shared/ui';

import { useAtenderLaRespuesta } from './useAtenderLaRespuesta';

export interface VisitaPropuesta {
  dia: string;
  hora: string | null;
}

export interface TarjetaDeLaRespuestaProps {
  proyecto: Proyecto;
  nombre: string;
  telefono: string;
  alAgendar?: (visita: VisitaPropuesta) => void;
  alAprobar?: () => void;
  alReactivar?: () => void;
}

function quien(nombre: string, tuCliente: string): string {
  return nombre.trim().split(/\s+/)[0] ?? tuCliente;
}

function titular(
  respuesta: RespuestaDelCliente,
  nombre: string,
  m: ReturnType<typeof useMensajes>['atenderLaRespuesta'],
): string {
  if (respuesta.letra !== null) return m.aproboLaOpcion(nombre, respuesta.letra);
  return respuesta.documento?.estimativo === true
    ? m.aproboElEstimativo(nombre)
    : m.aproboElPresupuesto(nombre);
}

export function TarjetaDeLaRespuesta({
  proyecto,
  nombre,
  telefono,
  alAgendar,
  alAprobar,
  alReactivar,
}: TarjetaDeLaRespuestaProps) {
  const m = useMensajes().atenderLaRespuesta;
  const replica = useReplicaDelTaller();
  const atender = useAtenderLaRespuesta();
  const respuesta = respuestaPendiente(replica, proyecto.id);
  if (respuesta === null) return null;

  const hoy = hoyEnElTaller();
  const { fila, franja, hora } = respuesta;
  const dia = fila.dia;
  const nota = fila.nota.trim();
  const estimativo = respuesta.documento?.estimativo === true;
  const enSeguimiento = proyecto.estado === 'en_seguimiento';
  const agendar =
    !enSeguimiento && dia !== null && alAgendar !== undefined
      ? () => {
          alAgendar({ dia, hora });
        }
      : null;
  const aprobar = !enSeguimiento && !estimativo && alAprobar !== undefined ? alAprobar : null;
  const reactivar = enSeguimiento && alReactivar !== undefined ? alReactivar : null;
  const primario = reactivar ?? agendar ?? aprobar;

  return (
    <section
      aria-label={m.titulo}
      className="flex flex-col gap-3 rounded-panel border border-hogar bg-paper px-4 py-4 md:px-5"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-8 flex-none items-center justify-center rounded-pill bg-hogar-tint text-hogar"
        >
          <Icono nombre="circle-check" tamano={18} />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-section leading-snug font-semibold">
            {titular(respuesta, quien(nombre, m.tuCliente), m)}
          </h2>
          <p className="text-label text-text-2">
            {m.respondioEl(fechaLarga(fila.respondida_el, hoy))}
          </p>
        </div>
      </div>

      {dia !== null && franja !== null && (
        <p className="text-body leading-relaxed font-medium first-letter:uppercase">
          {m.propone[franja](fechaEnUnaFrase(dia, hoy))}
        </p>
      )}

      {nota !== '' && (
        <div className="rounded-field bg-surface px-3.5 py-2.5">
          <p className="text-label font-medium text-text-2">{m.nota}</p>
          <p translate="no" className="mt-0.5 text-body leading-relaxed text-pretty">
            {nota}
          </p>
        </div>
      )}

      <FilaDeAcciones>
        {primario === reactivar && reactivar !== null && (
          <Button onClick={reactivar}>
            <Icono nombre="rotate-ccw" tamano={16} />
            {m.reactivar}
          </Button>
        )}
        {agendar !== null && (
          <Button variant={primario === agendar ? 'primario' : 'secundario'} onClick={agendar}>
            <Icono nombre="calendar" tamano={16} />
            {m.agendarElRelevamiento}
          </Button>
        )}
        {aprobar !== null && (
          <Button variant={primario === aprobar ? 'primario' : 'secundario'} onClick={aprobar}>
            <Icono nombre="check" tamano={16} />
            {m.aprobarConLaSena}
          </Button>
        )}
        <a
          href={whatsappCon(telefono, '')}
          target="_blank"
          rel="noopener noreferrer"
          className="apretable inline-flex min-h-button items-center justify-center gap-2 rounded-pill border border-border bg-paper px-[18px] py-1.5 text-body font-medium text-ink hover:bg-surface"
        >
          <Icono nombre="message-circle" tamano={16} />
          {m.escribirle}
        </a>
        <Button
          variant="terciario"
          onClick={() => {
            atender(respuesta);
          }}
        >
          {m.listo}
        </Button>
      </FilaDeAcciones>
    </section>
  );
}

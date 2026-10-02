import { eventosDeLaAgenda } from '@maun/domain';

import { MarcaConAnillo, nombreDelEvento, rutaDelVencimiento } from '@/entities/agenda';
import { datosDeLaAgendaDeLaReplica, type Replica } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { formatearPesos, RUTA_DE_AGENDA, rutaDelProyecto, Ir } from '@/shared/lib';
import { Icono } from '@/shared/ui';

const MAXIMO = 3;

const ENLACE =
  'flex min-h-tap min-w-0 flex-1 items-center gap-2 text-body underline decoration-hairline underline-offset-2 hover:decoration-ink';

export function HoyEnLaAgenda({ replica, hoy }: { replica: Replica; hoy: string }) {
  const m = useMensajes();
  const textos = m.paginaInicio.hoyEnLaAgenda;
  const rango = { desde: hoy, hasta: hoy };
  const pendientes = eventosDeLaAgenda(datosDeLaAgendaDeLaReplica(replica, rango), rango).filter(
    (evento) => !evento.hecha,
  );

  return (
    <section
      aria-labelledby="titulo-hoy-en-la-agenda"
      className="rounded-panel border border-hairline bg-paper px-4 pt-1.5 pb-3"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="titulo-hoy-en-la-agenda" className="text-section font-semibold">
          {textos.titulo}
        </h2>
        <Ir
          a={RUTA_DE_AGENDA}
          className="-mr-1.5 flex min-h-tap items-center gap-1 rounded-pill px-1.5 text-label font-medium text-text-2"
        >
          {textos.verLaAgenda}
          <Icono nombre="chevron-right" tamano={16} />
        </Ir>
      </div>
      {pendientes.length === 0 ? (
        <p className="text-label text-text-2">{textos.nadaParaHoy}</p>
      ) : (
        <ul className="flex flex-col">
          {pendientes.slice(0, MAXIMO).map((evento) => (
            <li key={evento.id} className="flex items-center gap-2.5 py-1">
              <MarcaConAnillo
                categoria={evento.categoria}
                importante={evento.clase === 'propia' && evento.importante}
              />
              {evento.clase === 'derivada' ? (
                <Ir a={rutaDelProyecto(evento.proyectoId)} className={ENLACE}>
                  <span className="truncate">{nombreDelEvento(evento)}</span>
                </Ir>
              ) : evento.clase === 'vencimiento' ? (
                <Ir a={rutaDelVencimiento(evento)} className={ENLACE}>
                  <span className="truncate">{nombreDelEvento(evento)}</span>
                  <span
                    translate="no"
                    className="ml-auto flex-none text-label text-text-2 tabular-nums"
                  >
                    {formatearPesos(evento.monto)}
                  </span>
                </Ir>
              ) : (
                <span translate="no" className="min-w-0 flex-1 truncate text-body">
                  {nombreDelEvento(evento)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {pendientes.length > MAXIMO && (
        <p className="mt-1 text-meta text-text-3">{textos.yMas(pendientes.length - MAXIMO)}</p>
      )}
    </section>
  );
}

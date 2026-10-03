import {
  DIAS_DE_ACIERTO,
  UMBRAL_MEDIANA,
  type AnalisisDeEntregas,
  type FilaDelAnalisis,
  type GrupoPorTipo,
} from '@maun/domain';
import { useId, useMemo, useState, type ReactNode } from 'react';

import {
  cuantosTrabajos,
  desvioEnPalabras,
  enDias,
  fraseDeLasCumplidas,
  fraseDeLosAciertos,
  fraseDelDesvio,
  hayAlgoPorCarga,
  nombreDeLaCarga,
  resumenDeLosDias,
  resumenDelDesvio,
} from '@/entities/entrega';
import { useReplicaDelTaller } from '@/entities/replica';
import { analisisDeLaReplica } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import {
  fechaLarga,
  hoyLocal,
  Ir,
  RUTA_DEL_HISTORIAL,
  rutaDelProyecto,
  useVolver,
} from '@/shared/lib';
import { Button, EstadoVacio, Icono, Pagina } from '@/shared/ui';

const TARJETA = 'rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5';

function Seccion({
  titulo,
  bajada,
  children,
}: {
  titulo: string;
  bajada?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={TARJETA}>
      <h2 id={id} className="text-section font-semibold">
        {titulo}
      </h2>
      {bajada !== undefined && (
        <p className="mt-0.5 text-label leading-relaxed text-text-2">{bajada}</p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Dato({ clave, valor }: { clave: string; valor: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-t border-hairline-soft py-2.5 first:border-t-0">
      <dt className="text-label text-text-2">{clave}</dt>
      <dd className="text-body font-medium tabular-nums">{valor}</dd>
    </div>
  );
}

function Precision({ analisis }: { analisis: AnalisisDeEntregas }) {
  const textos = useMensajes().paginaAnalitico.precision;
  const { precision } = analisis;
  return (
    <Seccion titulo={textos.titulo} bajada={textos.bajada}>
      <p className="text-body-lg leading-snug font-medium text-pretty">
        {fraseDelDesvio(precision.desvio)}
      </p>
      {precision.desvio.modo === 'mediana' && (
        <p className="mt-1.5 text-label leading-relaxed text-text-2">
          {textos.extremos(
            desvioEnPalabras(precision.desvio.minimo),
            desvioEnPalabras(precision.desvio.maximo),
          )}
        </p>
      )}
      {precision.aciertos !== null && (
        <p className="mt-2 text-body leading-relaxed">
          {fraseDeLosAciertos(precision.aciertos)}{' '}
          <span className="text-text-2">{textos.acertarEs(DIAS_DE_ACIERTO)}</span>
        </p>
      )}
      {precision.cumplidas !== null && (
        <p className="mt-2 text-body leading-relaxed">{fraseDeLasCumplidas(precision.cumplidas)}</p>
      )}
      {precision.importadas > 0 && (
        <p className="mt-2 text-label leading-relaxed text-text-3">
          {textos.importadas(precision.importadas)}
        </p>
      )}
    </Seccion>
  );
}

function Grupo({ grupo }: { grupo: GrupoPorTipo }) {
  const textos = useMensajes().paginaAnalitico.porTipo;
  return (
    <li className="border-t border-hairline-soft py-3 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-3">
        <span translate="no" className="text-body-lg font-semibold">
          {grupo.nombre}
        </span>
        <span className="text-label text-text-2 tabular-nums">
          {cuantosTrabajos(grupo.trabajos)}
        </span>
      </div>
      <dl className="mt-1">
        {grupo.demora.n > 0 && (
          <Dato clave={textos.delArranqueALaEntrega} valor={resumenDeLosDias(grupo.demora)} />
        )}
        {grupo.fabricacion.n > 0 && (
          <Dato clave={textos.delArranqueAListo} valor={resumenDeLosDias(grupo.fabricacion)} />
        )}
        {grupo.desvio.n > 0 && (
          <Dato clave={textos.contraLoEstimado} valor={resumenDelDesvio(grupo.desvio)} />
        )}
      </dl>
    </li>
  );
}

function PorTipo({ analisis }: { analisis: AnalisisDeEntregas }) {
  const textos = useMensajes().paginaAnalitico.porTipo;
  const { porTipo, sinTipo } = analisis;
  return (
    <Seccion titulo={textos.titulo} bajada={textos.bajada(UMBRAL_MEDIANA)}>
      {porTipo.length === 0 ? (
        <p className="text-body leading-relaxed text-text-2">{textos.ninguno}</p>
      ) : (
        <ul className="list-none">
          {porTipo.map((grupo) => (
            <Grupo key={grupo.clave} grupo={grupo} />
          ))}
        </ul>
      )}
      {sinTipo !== null && porTipo.length > 0 && (
        <p className="mt-3 text-label leading-relaxed text-text-2">
          {textos.sinTipo(sinTipo.trabajos)}
        </p>
      )}
    </Seccion>
  );
}

function PorCarga({ analisis }: { analisis: AnalisisDeEntregas }) {
  const textos = useMensajes().paginaAnalitico.porCarga;
  if (!hayAlgoPorCarga(analisis.porCarga)) return null;
  return (
    <Seccion titulo={textos.titulo} bajada={textos.bajada}>
      <dl>
        {analisis.porCarga
          .filter((grupo) => grupo.demora.n > 0)
          .map((grupo) => (
            <Dato
              key={grupo.nombre}
              clave={nombreDeLaCarga(grupo)}
              valor={resumenDeLosDias(grupo.demora)}
            />
          ))}
      </dl>
    </Seccion>
  );
}

function FilaDelTrabajo({ fila, hoy }: { fila: FilaDelAnalisis; hoy: string }) {
  const textos = useMensajes().paginaAnalitico.trabajoPorTrabajo;
  return (
    <li className="border-t border-hairline-soft py-3 first:border-t-0 first:pt-0">
      <Ir
        a={rutaDelProyecto(fila.id)}
        translate="no"
        className="text-body font-semibold underline decoration-hairline underline-offset-2 hover:decoration-ink"
      >
        {fila.titulo}
      </Ir>
      {fila.tipo === null ? (
        <span className="ml-2 text-label text-text-3">{textos.sinTipo}</span>
      ) : (
        <span translate="no" className="ml-2 text-label text-text-3">
          {fila.tipo}
        </span>
      )}
      <dl className="mt-1 grid grid-cols-1 gap-x-6 gap-y-0.5 text-label @md:grid-cols-2">
        <div className="flex gap-1.5">
          <dt className="text-text-2">{textos.estimada}</dt>
          {fila.primeraEstimada === null ? (
            <dd className="font-medium tabular-nums">{textos.sinFecha}</dd>
          ) : (
            <dd translate="no" className="font-medium tabular-nums">
              {fechaLarga(fila.primeraEstimada, hoy)}
            </dd>
          )}
        </div>
        <div className="flex gap-1.5">
          <dt className="text-text-2">{textos.entregado}</dt>
          {fila.desvio === null ? (
            <dd translate="no" className="font-medium tabular-nums">
              {fechaLarga(fila.entregado, hoy)}
            </dd>
          ) : (
            <dd className="font-medium tabular-nums">
              {textos.entregadoConDesvio(
                fechaLarga(fila.entregado, hoy),
                desvioEnPalabras(fila.desvio),
              )}
            </dd>
          )}
        </div>
        {fila.comprometida !== null && (
          <div className="flex gap-1.5">
            <dt className="text-text-2">{textos.comprometida}</dt>
            <dd className="font-medium tabular-nums">
              {fila.cumplida === true
                ? textos.cumplida(fechaLarga(fila.comprometida, hoy))
                : textos.noCumplida(fechaLarga(fila.comprometida, hoy))}
            </dd>
          </div>
        )}
        {fila.demora !== null && (
          <div className="flex gap-1.5">
            <dt className="text-text-2">{textos.tardo}</dt>
            <dd className="font-medium tabular-nums">{enDias(fila.demora)}</dd>
          </div>
        )}
      </dl>
    </li>
  );
}

function TrabajoPorTrabajo({ analisis, hoy }: { analisis: AnalisisDeEntregas; hoy: string }) {
  const textos = useMensajes().paginaAnalitico.trabajoPorTrabajo;
  const pocos = analisis.trabajos.length < UMBRAL_MEDIANA;
  const [elegido, setElegido] = useState<boolean | null>(null);
  const abierto = pocos || (elegido ?? false);
  const id = useId();
  return (
    <Seccion titulo={textos.titulo} bajada={textos.bajada(analisis.trabajos.length)}>
      {!pocos && (
        <Button
          variant="secundario"
          size="chico"
          aria-expanded={abierto}
          aria-controls={id}
          onClick={() => {
            setElegido(!abierto);
          }}
        >
          <Icono nombre={abierto ? 'chevron-up' : 'chevron-down'} tamano={16} />
          {abierto ? textos.esconder : textos.ver}
        </Button>
      )}
      <div id={id} hidden={!abierto} className={`@container ${pocos ? '' : 'mt-3'}`}>
        <ul className="list-none">
          {analisis.trabajos.map((fila) => (
            <FilaDelTrabajo key={fila.id} fila={fila} hoy={hoy} />
          ))}
        </ul>
        {analisis.sinFecha > 0 && (
          <p className="mt-3 text-label leading-relaxed text-text-3">
            {textos.sinDiaDeEntrega(analisis.sinFecha)}
          </p>
        )}
      </div>
    </Seccion>
  );
}

export function AnaliticoPage() {
  const textos = useMensajes().paginaAnalitico;
  const replica = useReplicaDelTaller();
  const hoy = hoyLocal();
  const analisis = useMemo(() => analisisDeLaReplica(replica), [replica]);
  const vuelta = useVolver(RUTA_DEL_HISTORIAL, textos.volver);

  return (
    <Pagina className="gap-3 md:gap-4">
      <Ir
        a={RUTA_DEL_HISTORIAL}
        alTocar={vuelta.volver}
        className="-ml-1 flex min-h-tap w-fit items-center gap-1 rounded-pill pr-3 pl-1 text-body font-medium text-text-2 hover:bg-ink/5"
      >
        <Icono nombre="chevron-left" tamano={20} />
        {vuelta.etiqueta}
      </Ir>
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-h1 leading-tight lg:text-h1-lg">{textos.titulo}</h1>
        <p className="max-w-[60ch] text-body leading-relaxed text-text-2">{textos.bajada}</p>
      </header>

      {analisis.trabajos.length === 0 ? (
        <EstadoVacio
          ilustracion="sin-historial"
          titulo={textos.vacio.titulo}
          detalle={textos.vacio.detalle}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-3 md:gap-4">
            <Precision analisis={analisis} />
            <PorTipo analisis={analisis} />
            <PorCarga analisis={analisis} />
          </div>
          <TrabajoPorTrabajo analisis={analisis} hoy={hoy} />
        </div>
      )}
    </Pagina>
  );
}

import {
  agregarLaPregunta,
  cambiarLaPregunta,
  LARGOS_DE_LAS_PREGUNTAS,
  leerLasPreguntas,
  moverLaPregunta,
  PREGUNTA_DEL_DOMICILIO,
  quitarLaPregunta,
  sePuedeAgregarUnaPregunta,
  sePuedeMover,
  TOPE_DE_PREGUNTAS,
  type PreguntaDeLaConsulta,
} from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { MUTACION_DE_AJUSTES } from '@/entities/replica';
import { mensajeDeSincronizacion, type FilaDe, type Json } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { idiomaActual, metaDeAvisos, useAlgoEnCurso } from '@/shared/lib';
import { Button, EstadoDeGuardado, Icono } from '@/shared/ui';

import {
  conLaBorrada,
  mismasPreguntas,
  preguntaNueva,
  preguntasParaGuardar,
  type PreguntaBorrada,
} from '../model/preguntas';
import { BotonesDeMover } from './presupuesto/piezas';

const DEMORA_DE_LAS_PREGUNTAS_MS = 900;

const CAMPO =
  'h-field w-full min-w-0 rounded-field border border-border bg-paper px-3.5 text-body-lg text-ink placeholder:text-text-3';

export interface PreguntasDeLaConsultaProps {
  ajustes: FilaDe<'ajustes'>;
}

export function PreguntasDeLaConsulta({ ajustes }: PreguntasDeLaConsultaProps) {
  const m = useMensajes().configurarTaller.preguntas;
  const [lista, setLista] = useState(() =>
    leerLasPreguntas(ajustes.preguntas_de_la_consulta, idiomaActual()),
  );
  const [borrada, setBorrada] = useState<PreguntaBorrada | null>(null);
  const [sinGuardar, setSinGuardar] = useState(false);
  useAlgoEnCurso(sinGuardar);
  const guardar = useMutation({
    ...MUTACION_DE_AJUSTES,
    meta: metaDeAvisos('preguntasDeLaConsulta', { silencioso: true }),
  });

  const ultimo = useRef({ ajustes, lista });
  useEffect(() => {
    ultimo.current = { ajustes, lista };
  });
  const reloj = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const porEnfocar = useRef<string | null>(null);

  function mandar(siguiente: readonly PreguntaDeLaConsulta[]): void {
    clearTimeout(reloj.current);
    reloj.current = undefined;
    setSinGuardar(false);
    const paraGuardar = preguntasParaGuardar(siguiente);
    if (paraGuardar === null) return;
    const actuales = ultimo.current.ajustes;
    const guardadas = leerLasPreguntas(actuales.preguntas_de_la_consulta, idiomaActual());
    if (mismasPreguntas(guardadas, paraGuardar)) return;
    guardar.mutate({
      id: actuales.id,
      cambios: { preguntas_de_la_consulta: paraGuardar as unknown as Json },
      previos: { preguntas_de_la_consulta: actuales.preguntas_de_la_consulta },
    });
  }

  const guardarAhora = useRef(() => {
    if (reloj.current !== undefined) mandar(ultimo.current.lista);
  });
  useEffect(() => {
    guardarAhora.current = () => {
      if (reloj.current !== undefined) mandar(ultimo.current.lista);
    };
  });
  useEffect(
    () => () => {
      guardarAhora.current();
    },
    [],
  );

  function cambiarDespues(siguiente: PreguntaDeLaConsulta[]): void {
    setLista(siguiente);
    setSinGuardar(true);
    clearTimeout(reloj.current);
    reloj.current = setTimeout(() => {
      mandar(ultimo.current.lista);
    }, DEMORA_DE_LAS_PREGUNTAS_MS);
  }

  function cambiarYa(siguiente: PreguntaDeLaConsulta[]): void {
    setLista(siguiente);
    mandar(siguiente);
  }

  function sumar(): void {
    const nueva = preguntaNueva();
    setBorrada(null);
    porEnfocar.current = nueva.id;
    setLista(agregarLaPregunta(lista, nueva));
  }

  function borrar(pregunta: PreguntaDeLaConsulta, lugar: number): void {
    setBorrada(pregunta.rotulo.trim() === '' ? null : { pregunta, lugar });
    cambiarYa(quitarLaPregunta(lista, pregunta.id));
  }

  function deshacer(): void {
    if (borrada === null) return;
    setBorrada(null);
    cambiarYa(conLaBorrada(lista, borrada));
  }

  const sePuedeSumar = sePuedeAgregarUnaPregunta(lista);
  const filas: ReactNode[] = [];
  lista.forEach((pregunta, lugar) => {
    if (borrada !== null && borrada.lugar === lugar) {
      filas.push(
        <FilaBorrada
          key="borrada"
          rotulo={borrada.pregunta.rotulo}
          sePuedeDeshacer={sePuedeSumar}
          alDeshacer={deshacer}
        />,
      );
    }
    filas.push(
      <FilaDePregunta
        key={pregunta.id}
        pregunta={pregunta}
        numero={lugar + 1}
        sube={sePuedeMover(lista, pregunta.id, -1)}
        baja={sePuedeMover(lista, pregunta.id, 1)}
        alMontar={(campo) => {
          if (campo === null || porEnfocar.current !== pregunta.id) return;
          porEnfocar.current = null;
          campo.focus();
        }}
        alCambiar={(cambios) => {
          cambiarDespues(cambiarLaPregunta(lista, pregunta.id, cambios));
        }}
        alMover={(hacia) => {
          setBorrada(null);
          cambiarYa(moverLaPregunta(lista, pregunta.id, hacia));
        }}
        alBorrar={() => {
          borrar(pregunta, lugar);
        }}
      />,
    );
  });
  if (borrada !== null && borrada.lugar >= lista.length) {
    filas.push(
      <FilaBorrada
        key="borrada"
        rotulo={borrada.pregunta.rotulo}
        sePuedeDeshacer={sePuedeSumar}
        alDeshacer={deshacer}
      />,
    );
  }

  return (
    <div className="@container/preguntas flex flex-col gap-2">
      <div className="flex min-h-5 justify-end">
        <EstadoDeGuardado
          sinGuardar={sinGuardar}
          enPausa={guardar.isPaused}
          enVuelo={guardar.isPending && !guardar.isPaused}
          conError={guardar.isError}
          guardado={guardar.isSuccess}
        />
      </div>
      <ol className="flex flex-col">{filas}</ol>
      {guardar.isError && (
        <p role="alert" className="text-label font-medium text-alerta">
          {mensajeDeSincronizacion(guardar.error)}
        </p>
      )}
      {sePuedeSumar ? (
        <Button type="button" variant="secundario" onClick={sumar} className="self-start">
          <Icono nombre="plus" tamano={18} />
          {m.sumar}
        </Button>
      ) : (
        <p className="text-label text-text-2">{m.lleno(TOPE_DE_PREGUNTAS)}</p>
      )}
    </div>
  );
}

interface FilaDePreguntaProps {
  pregunta: PreguntaDeLaConsulta;
  numero: number;
  sube: boolean;
  baja: boolean;
  alMontar: (campo: HTMLInputElement | null) => void;
  alCambiar: (cambios: Partial<Pick<PreguntaDeLaConsulta, 'rotulo' | 'ayuda'>>) => void;
  alMover: (hacia: -1 | 1) => void;
  alBorrar: () => void;
}

function FilaDePregunta({
  pregunta,
  numero,
  sube,
  baja,
  alMontar,
  alCambiar,
  alMover,
  alBorrar,
}: FilaDePreguntaProps) {
  const m = useMensajes().configurarTaller.preguntas;
  const esElDomicilio = pregunta.id === PREGUNTA_DEL_DOMICILIO;
  const sinRotulo = pregunta.rotulo.trim() === '';
  const nombre = sinRotulo ? m.laNueva : pregunta.rotulo.trim();

  return (
    <li
      data-pregunta={pregunta.id}
      className="flex flex-col gap-1.5 border-t border-hairline-soft py-3 first:border-t-0"
    >
      <div className="flex items-start gap-1">
        <div className="grid min-w-0 flex-1 gap-2 @lg/preguntas:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <input
            ref={alMontar}
            aria-label={m.pregunta(numero)}
            value={pregunta.rotulo}
            maxLength={LARGOS_DE_LAS_PREGUNTAS.rotulo}
            placeholder={m.escribiLaPregunta}
            aria-invalid={esElDomicilio && sinRotulo ? true : undefined}
            onChange={(evento) => {
              alCambiar({ rotulo: evento.target.value });
            }}
            className={`${CAMPO} font-medium`}
          />
          <input
            aria-label={m.ayudaDe(nombre)}
            value={pregunta.ayuda}
            maxLength={LARGOS_DE_LAS_PREGUNTAS.ayuda}
            placeholder={m.ayudaOpcional}
            onChange={(evento) => {
              alCambiar({ ayuda: evento.target.value });
            }}
            className={CAMPO}
          />
        </div>
        {!esElDomicilio && (
          <>
            <BotonesDeMover
              etiquetas={{ subir: m.subir(nombre), bajar: m.bajar(nombre) }}
              primera={!sube}
              ultima={!baja}
              alMover={alMover}
            />
            <button
              type="button"
              aria-label={m.borrar(nombre)}
              onClick={alBorrar}
              className="flex size-11 flex-none items-center justify-center rounded-pill text-text-2 hover:bg-surface hover:text-ink"
            >
              <Icono nombre="trash-2" tamano={18} />
            </button>
          </>
        )}
      </div>
      {esElDomicilio && (
        <p className={`text-meta ${sinRotulo ? 'font-medium text-alerta' : 'text-text-3'}`}>
          {sinRotulo ? m.sinNombre : m.elDomicilio}
        </p>
      )}
      {!esElDomicilio && sinRotulo && (
        <p className="text-meta text-text-2">{m.escribilaParaQueSeGuarde}</p>
      )}
    </li>
  );
}

function FilaBorrada({
  rotulo,
  sePuedeDeshacer,
  alDeshacer,
}: {
  rotulo: string;
  sePuedeDeshacer: boolean;
  alDeshacer: () => void;
}) {
  const m = useMensajes().configurarTaller.preguntas;
  return (
    <li
      data-borrada=""
      className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-1 border-t border-hairline-soft py-1 first:border-t-0"
    >
      <span className="flex size-11 items-center justify-center text-text-3">
        <Icono nombre="trash-2" tamano={17} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5 px-1.5 py-2">
        <span translate="no" className="text-body leading-normal text-text-3">
          {m.borraste(rotulo.trim())}
        </span>
        <span className="text-meta text-text-2">{m.loContestadoQueda}</span>
      </span>
      {sePuedeDeshacer && (
        <Button variant="terciario" size="chico" onClick={alDeshacer} className="min-h-tap">
          {m.deshacer}
        </Button>
      )}
    </li>
  );
}

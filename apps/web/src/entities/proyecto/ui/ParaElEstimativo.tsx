import {
  contestadas,
  LARGOS_DE_LAS_PREGUNTAS,
  leerLasRespuestas,
  PREGUNTA_DEL_DOMICILIO,
  respuestaA,
  type PreguntaDeLaConsulta,
  type RespuestaDeLaConsulta,
} from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';

import { mensajeDeSincronizacion } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { metaDeAvisos, useAlgoEnCurso } from '@/shared/lib';
import { BloquePlegable, CampoQueCrece, EstadoDeGuardado } from '@/shared/ui';

import { MUTACION_DE_PROYECTO, MUTACION_DE_RESPUESTAS_DE_LA_CONSULTA } from '../api/mutacion';
import { marcaDelCampo } from '../model/campos';
import type { Proyecto } from '../model/catalogos';
import { guardadoDeLaDireccion } from '../model/direccion';
import { filaConLasRespuestas, filaDespuesDelGuardado, useFilaEnCamino } from '../model/enCamino';
import {
  mismasRespuestas,
  preguntasConLasDeAntes,
  respuestasConLoEscrito,
  type RespuestasEscritas,
} from '../model/preguntas';

const DEMORA_DEL_ESTIMATIVO_MS = 900;
const LARGO_DEL_DOMICILIO = 500;

export interface RenglonesDelEstimativoProps {
  preguntas: readonly PreguntaDeLaConsulta[];
  respuestas: readonly RespuestaDeLaConsulta[];
  domicilio: string;
  domicilioDelCliente: string;
  alResponder: (pregunta: PreguntaDeLaConsulta, texto: string) => void;
  alCambiarElDomicilio: (texto: string) => void;
}

export function RenglonesDelEstimativo({
  preguntas,
  respuestas,
  domicilio,
  domicilioDelCliente,
  alResponder,
  alCambiarElDomicilio,
}: RenglonesDelEstimativoProps) {
  const textos = useMensajes().proyecto.paraElEstimativo;
  const id = useId();
  const delCliente = domicilioDelCliente.trim();

  return (
    <div className="@container/estimativo flex flex-col">
      {preguntas.map((pregunta, lugar) => {
        const esElDomicilio = pregunta.id === PREGUNTA_DEL_DOMICILIO;
        const valor = esElDomicilio ? domicilio : respuestaA(respuestas, pregunta);
        const idDelCampo = `${id}-${pregunta.id}`;
        return (
          <div
            key={pregunta.id}
            {...(esElDomicilio ? marcaDelCampo('direccion') : {})}
            data-pregunta={pregunta.id}
            className={`flex flex-col gap-1.5 py-2.5 @lg/estimativo:flex-row @lg/estimativo:gap-4 ${
              lugar === 0 ? '' : 'border-t border-hairline-soft'
            }`}
          >
            <label
              htmlFor={idDelCampo}
              translate="no"
              className="text-label text-text-2 @lg/estimativo:w-44 @lg/estimativo:flex-none @lg/estimativo:pt-3"
            >
              {pregunta.rotulo}
            </label>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <CampoQueCrece
                id={idDelCampo}
                translate="no"
                value={valor}
                maxLength={esElDomicilio ? LARGO_DEL_DOMICILIO : LARGOS_DE_LAS_PREGUNTAS.respuesta}
                placeholder={pregunta.ayuda === '' ? undefined : pregunta.ayuda}
                onChange={(texto) => {
                  if (esElDomicilio) alCambiarElDomicilio(texto);
                  else alResponder(pregunta, texto);
                }}
              />
              {esElDomicilio && domicilio.trim() === '' && delCliente !== '' && (
                <button
                  type="button"
                  onClick={() => {
                    alCambiarElDomicilio(delCliente);
                  }}
                  className="flex min-h-tap items-center self-start rounded-field text-left text-label font-semibold text-ink underline underline-offset-3"
                >
                  {textos.usarLaDelCliente(delCliente)}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface ParaElEstimativoProps {
  proyecto: Proyecto;
  preguntas: readonly PreguntaDeLaConsulta[];
  domicilioDelCliente: string;
  abiertoAlPrincipio?: boolean;
}

export function ParaElEstimativo({
  proyecto,
  preguntas,
  domicilioDelCliente,
  abiertoAlPrincipio = true,
}: ParaElEstimativoProps) {
  const textos = useMensajes().proyecto.paraElEstimativo;
  const guardarLasRespuestas = useMutation({
    ...MUTACION_DE_RESPUESTAS_DE_LA_CONSULTA,
    meta: metaDeAvisos('respuestasDeLaConsulta', { silencioso: true, sujeto: proyecto.titulo }),
  });
  const guardarElDomicilio = useMutation({
    ...MUTACION_DE_PROYECTO,
    meta: metaDeAvisos('proyectoGuardado', { silencioso: true, sujeto: proyecto.titulo }),
  });
  const [visibles] = useState(() =>
    preguntasConLasDeAntes(preguntas, leerLasRespuestas(proyecto.respuestas_de_la_consulta)),
  );
  const [escritas, setEscritas] = useState<RespuestasEscritas>({});
  const [domicilio, setDomicilio] = useState<string | null>(null);
  const [respuestasSinGuardar, setRespuestasSinGuardar] = useState(false);
  const [domicilioSinGuardar, setDomicilioSinGuardar] = useState(false);
  useAlgoEnCurso(respuestasSinGuardar || domicilioSinGuardar);

  const enCamino = useFilaEnCamino();
  const ultimo = useRef({ proyecto, escritas, domicilio, visibles });
  useEffect(() => {
    ultimo.current = { proyecto, escritas, domicilio, visibles };
  });
  const relojDeLasRespuestas = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const relojDelDomicilio = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function mandarLasRespuestas(): void {
    clearTimeout(relojDeLasRespuestas.current);
    relojDeLasRespuestas.current = undefined;
    setRespuestasSinGuardar(false);
    const actual = enCamino.masNueva(ultimo.current.proyecto) ?? ultimo.current.proyecto;
    const previas = leerLasRespuestas(actual.respuestas_de_la_consulta);
    const respuestas = respuestasConLoEscrito(
      previas,
      ultimo.current.visibles,
      ultimo.current.escritas,
      true,
    );
    if (mismasRespuestas(previas, respuestas)) return;
    const soltar = enCamino.anotar(filaConLasRespuestas(actual, respuestas));
    guardarLasRespuestas.mutate(
      { id: actual.id, respuestas, previas, version: actual.version },
      { onSettled: soltar },
    );
  }

  function mandarElDomicilio(): void {
    clearTimeout(relojDelDomicilio.current);
    relojDelDomicilio.current = undefined;
    setDomicilioSinGuardar(false);
    const actual = enCamino.masNueva(ultimo.current.proyecto) ?? ultimo.current.proyecto;
    const escrito = ultimo.current.domicilio;
    if (escrito === null || escrito.trim() === actual.direccion_entrega.trim()) return;
    const guardado = guardadoDeLaDireccion(actual, escrito);
    const soltar = enCamino.anotar(filaDespuesDelGuardado(actual, guardado.pedido.datos));
    guardarElDomicilio.mutate(guardado, { onSettled: soltar });
  }

  const guardarAhora = useRef(() => {
    if (relojDeLasRespuestas.current !== undefined) mandarLasRespuestas();
    if (relojDelDomicilio.current !== undefined) mandarElDomicilio();
  });
  useEffect(() => {
    guardarAhora.current = () => {
      if (relojDeLasRespuestas.current !== undefined) mandarLasRespuestas();
      if (relojDelDomicilio.current !== undefined) mandarElDomicilio();
    };
  });
  useEffect(
    () => () => {
      guardarAhora.current();
    },
    [],
  );

  function responder(pregunta: PreguntaDeLaConsulta, texto: string): void {
    setEscritas((previas) => ({ ...previas, [pregunta.id]: texto }));
    setRespuestasSinGuardar(true);
    clearTimeout(relojDeLasRespuestas.current);
    relojDeLasRespuestas.current = setTimeout(mandarLasRespuestas, DEMORA_DEL_ESTIMATIVO_MS);
  }

  function cambiarElDomicilio(texto: string): void {
    setDomicilio(texto);
    setDomicilioSinGuardar(true);
    clearTimeout(relojDelDomicilio.current);
    relojDelDomicilio.current = setTimeout(mandarElDomicilio, DEMORA_DEL_ESTIMATIVO_MS);
  }

  const guardadas = leerLasRespuestas(proyecto.respuestas_de_la_consulta);
  const respuestas = respuestasConLoEscrito(guardadas, visibles, escritas);
  const domicilioVisible = domicilio ?? proyecto.direccion_entrega;
  const cuenta = contestadas(preguntas, respuestas, domicilioVisible);
  const conError = guardarLasRespuestas.isError || guardarElDomicilio.isError;

  return (
    <BloquePlegable
      titulo={textos.titulo}
      abiertoAlPrincipio={abiertoAlPrincipio}
      ayuda={textos.ayuda}
      resumen={
        <span className="flex items-center gap-2.5">
          <span>{textos.contestadas(cuenta.contestadas, cuenta.total)}</span>
          <EstadoDeGuardado
            sinGuardar={respuestasSinGuardar || domicilioSinGuardar}
            enPausa={guardarLasRespuestas.isPaused || guardarElDomicilio.isPaused}
            enVuelo={
              (guardarLasRespuestas.isPending && !guardarLasRespuestas.isPaused) ||
              (guardarElDomicilio.isPending && !guardarElDomicilio.isPaused)
            }
            conError={conError}
            guardado={guardarLasRespuestas.isSuccess || guardarElDomicilio.isSuccess}
          />
        </span>
      }
    >
      <RenglonesDelEstimativo
        preguntas={visibles}
        respuestas={respuestas}
        domicilio={domicilioVisible}
        domicilioDelCliente={domicilioDelCliente}
        alResponder={responder}
        alCambiarElDomicilio={cambiarElDomicilio}
      />
      {conError && (
        <p role="alert" className="mt-1.5 text-label font-medium text-alerta">
          {mensajeDeSincronizacion(guardarLasRespuestas.error ?? guardarElDomicilio.error)}
        </p>
      )}
    </BloquePlegable>
  );
}

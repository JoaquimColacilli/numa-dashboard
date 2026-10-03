import {
  comoGuardar,
  limpiarBorrador,
  revisarBorrador,
  TIPOS_DE_PREGUNTA,
  type PreguntaEditable,
  type ProblemaDelBorrador,
  type TipoDePregunta,
  type UsoDeLaPregunta,
} from '@maun/domain';
import { useEffect, useId, useRef, useState } from 'react';

import { TIPO, type FilaDePregunta } from '@/entities/opinion';
import { useMensajes } from '@/shared/idioma';
import { hayCambios, useAlgoEnCurso } from '@/shared/lib';
import { Button, FilaDeAcciones, Icono, Interruptor } from '@/shared/ui';

import type { ModoDeGuardar } from '../model/acciones';

function editableDe(pregunta: FilaDePregunta): PreguntaEditable {
  return {
    texto: pregunta.texto,
    tipo: pregunta.tipo,
    escala: pregunta.escala,
    obligatoria: pregunta.obligatoria,
    opciones: pregunta.opciones,
  };
}

const NUEVA: PreguntaEditable = {
  texto: '',
  tipo: 'escala5',
  escala: null,
  obligatoria: false,
  opciones: null,
};

function conTipo(borrador: PreguntaEditable, tipo: TipoDePregunta): PreguntaEditable {
  const conOpciones = tipo === 'una' || tipo === 'varias';
  return {
    ...borrador,
    tipo,
    opciones: conOpciones ? (borrador.opciones ?? ['', '']) : borrador.opciones,
  };
}

export interface EditorDeUnaPreguntaProps {
  pregunta: FilaDePregunta | null;
  uso: UsoDeLaPregunta;
  enfocarAlAbrir?: boolean;
  alGuardar: (borrador: PreguntaEditable, modo: ModoDeGuardar) => void;
  alCancelar: () => void;
}

export function EditorDeUnaPregunta({
  pregunta,
  uso,
  enfocarAlAbrir = false,
  alGuardar,
  alCancelar,
}: EditorDeUnaPreguntaProps) {
  const textos = useMensajes().editarLaEncuesta.editor;
  const mensajeDel = (cual: ProblemaDelBorrador): string => textos.problemas[cual];
  const id = useId();
  const original = pregunta === null ? NUEVA : editableDe(pregunta);
  const [borrador, setBorrador] = useState<PreguntaEditable>(original);
  const [modoDeLaVersion, setModoDeLaVersion] = useState<'nueva' | 'misma'>('nueva');
  const [problema, setProblema] = useState<ProblemaDelBorrador | null>(null);
  const texto = useRef<HTMLTextAreaElement>(null);
  const opciones = useRef<HTMLDivElement>(null);
  useAlgoEnCurso(hayCambios(original, borrador));

  useEffect(() => {
    if (enfocarAlAbrir) texto.current?.focus();
  }, [enfocarAlAbrir]);

  const como =
    pregunta === null ? ({ modo: 'en-el-lugar' } as const) : comoGuardar(original, borrador, uso);
  const avisar = como.modo !== 'en-el-lugar' && como.respuestas > 0;
  const obligadaANueva = como.modo === 'version-nueva';
  const conOpciones = borrador.tipo === 'una' || borrador.tipo === 'varias';
  const errorDelTexto = problema === 'sin-texto' || problema === 'texto-largo';
  const errorDeOpciones = problema !== null && !errorDelTexto;

  function cambiar(cambios: Partial<PreguntaEditable>): void {
    setBorrador((previo) => ({ ...previo, ...cambios }));
    setProblema(null);
  }

  function guardar(): void {
    const encontrado = revisarBorrador(borrador);
    if (encontrado !== null) {
      setProblema(encontrado);
      if (encontrado === 'sin-texto' || encontrado === 'texto-largo') texto.current?.focus();
      else opciones.current?.querySelector('input')?.focus();
      return;
    }
    const limpio = limpiarBorrador(borrador);
    let modo: ModoDeGuardar = 'en-el-lugar';
    if (como.modo === 'version-nueva') modo = 'version-nueva';
    if (como.modo === 'preguntar' && modoDeLaVersion === 'nueva') modo = 'version-nueva';
    alGuardar(limpio, modo);
  }

  return (
    <div className="flex max-w-[760px] flex-col gap-4 pt-1 pb-5 pl-10">
      <div className="flex flex-col gap-1.75 text-label text-text-2">
        <label htmlFor={`${id}-texto`}>{textos.queSePregunta}</label>
        <textarea
          id={`${id}-texto`}
          ref={texto}
          value={borrador.texto}
          rows={2}
          aria-invalid={errorDelTexto || undefined}
          aria-describedby={errorDelTexto ? `${id}-error-texto` : undefined}
          onChange={(evento) => {
            cambiar({ texto: evento.target.value });
          }}
          className={`resize-y rounded-field border bg-paper px-3 py-2.5 text-body-lg leading-normal text-ink focus:border-ink ${
            errorDelTexto ? 'border-alerta' : 'border-border'
          }`}
        />
        {errorDelTexto && (
          <span id={`${id}-error-texto`} role="alert" className="font-medium text-alerta">
            {mensajeDel(problema)}
          </span>
        )}
      </div>

      <fieldset className="m-0 flex min-w-0 flex-col gap-1.75 border-0 p-0">
        <legend className="mb-1.75 p-0 text-label text-text-2">{textos.comoContesta}</legend>
        <div className="@container">
          <div className="grid grid-cols-1 gap-2 @lg:grid-cols-2">
            {TIPOS_DE_PREGUNTA.map((tipo) => {
              const elegido = borrador.tipo === tipo;
              return (
                <label
                  key={tipo}
                  className={`flex min-h-14.5 cursor-pointer items-center gap-2.5 rounded-field border px-3 py-2.25 text-left has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
                    elegido ? 'border-ink bg-surface' : 'border-border bg-paper'
                  }`}
                >
                  <input
                    type="radio"
                    name={`${id}-tipo`}
                    value={tipo}
                    checked={elegido}
                    onChange={() => {
                      setBorrador((previo) => conTipo(previo, tipo));
                      setProblema(null);
                    }}
                    className="sr-only"
                  />
                  <Icono nombre={TIPO[tipo].icono} tamano={18} />
                  <span className="min-w-0">
                    <span
                      className={`block text-body-sm leading-tight ${elegido ? 'font-semibold' : 'font-medium'}`}
                    >
                      {TIPO[tipo].etiqueta}
                    </span>
                    <span className="block text-meta leading-snug text-text-2">
                      {TIPO[tipo].descripcion}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </fieldset>

      {conOpciones && (
        <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
          <legend className="mb-2 p-0 text-label text-text-2">{textos.lasOpciones}</legend>
          <div ref={opciones} className="flex flex-col gap-2">
            {(borrador.opciones ?? []).map((opcion, indice) => (
              <div key={indice} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`size-4.5 flex-none border-[1.5px] border-border ${
                    borrador.tipo === 'varias' ? 'rounded-[4px]' : 'rounded-pill'
                  }`}
                />
                <input
                  value={opcion}
                  aria-label={textos.opcion(indice + 1)}
                  aria-invalid={errorDeOpciones || undefined}
                  aria-describedby={errorDeOpciones ? `${id}-error-opciones` : undefined}
                  onChange={(evento) => {
                    const siguientes = [...(borrador.opciones ?? [])];
                    siguientes[indice] = evento.target.value;
                    cambiar({ opciones: siguientes });
                  }}
                  className="h-11.5 min-w-0 flex-1 rounded-field border border-border bg-paper px-3 text-body text-ink focus:border-ink"
                />
                <button
                  type="button"
                  aria-label={textos.borrarLaOpcion(indice + 1)}
                  onClick={() => {
                    cambiar({
                      opciones: (borrador.opciones ?? []).filter((_, otra) => otra !== indice),
                    });
                  }}
                  className="flex size-11 flex-none items-center justify-center rounded-pill text-text-3 hover:bg-surface hover:text-alerta"
                >
                  <Icono nombre="x" tamano={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              cambiar({ opciones: [...(borrador.opciones ?? []), ''] });
            }}
            className="flex h-11 w-fit items-center gap-2 rounded-pill border border-dashed border-border px-3.5 text-body-sm font-medium hover:bg-surface"
          >
            <Icono nombre="plus" tamano={16} />
            {textos.agregarUnaOpcion}
          </button>
          {errorDeOpciones && (
            <span
              id={`${id}-error-opciones`}
              role="alert"
              className="text-label font-medium text-alerta"
            >
              {mensajeDel(problema)}
            </span>
          )}
        </fieldset>
      )}

      <Interruptor
        activo={borrador.obligatoria}
        alCambiar={(obligatoria) => {
          cambiar({ obligatoria });
        }}
        className="min-h-13 rounded-field border border-border bg-paper px-3 py-2"
      >
        <span className="text-body-sm leading-tight">
          {textos.queTengaQueContestarla}
          <span className="block text-meta text-text-2">{textos.siNoPuedeSaltearla}</span>
        </span>
      </Interruptor>

      {avisar && (
        <div className="flex flex-col gap-2.5 rounded-field border border-atencion bg-atencion-tint px-4 py-3.5">
          <span className="flex items-center gap-2.25 text-body font-semibold">
            <Icono nombre="history" tamano={18} />
            {textos.yaLaContestaron(como.respuestas)}
          </span>
          <p className="text-body-sm leading-relaxed text-text-2">
            {obligadaANueva ? textos.cambiasteComoSeContesta : textos.siLeCambiasElSentido}
          </p>
          {!obligadaANueva && (
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="sr-only">{textos.queHacemos}</legend>
              {(
                [
                  {
                    valor: 'nueva',
                    etiqueta: textos.empezarDeCero,
                    detalle: textos.empezarDeCeroDetalle(como.respuestas),
                  },
                  {
                    valor: 'misma',
                    etiqueta: textos.esLaMisma,
                    detalle: textos.esLaMismaDetalle,
                  },
                ] as const
              ).map((opcion) => {
                const elegida = modoDeLaVersion === opcion.valor;
                return (
                  <label
                    key={opcion.valor}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-field border px-3 py-2.75 text-left has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
                      elegida ? 'border-ink bg-paper' : 'border-border'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${id}-version`}
                      value={opcion.valor}
                      checked={elegida}
                      onChange={() => {
                        setModoDeLaVersion(opcion.valor);
                      }}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={`mt-0.25 flex size-4.5 flex-none items-center justify-center rounded-pill border-[1.5px] ${
                        elegida ? 'border-ink' : 'border-border'
                      }`}
                    >
                      {elegida && <span className="size-2.25 rounded-pill bg-ink" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-body-sm leading-snug font-semibold">
                        {opcion.etiqueta}
                      </span>
                      <span className="block text-label leading-normal text-text-2">
                        {opcion.detalle}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
          )}
        </div>
      )}

      <FilaDeAcciones>
        <Button onClick={guardar}>{textos.guardar}</Button>
        <Button variant="secundario" onClick={alCancelar}>
          {textos.cancelar}
        </Button>
      </FilaDeAcciones>
    </div>
  );
}

import type { Hueco } from '@maun/domain';
import { useCallback, useId, useRef, useState } from 'react';

import { Button, Campo, Casilla, FilaDeAcciones, Icono } from '@/shared/ui';

import {
  cuantasPuedenSer,
  datosDelTexto,
  GRUPO,
  marcaDeLaFila,
  moverEnLaLista,
  resumenDelTexto,
  vivas,
  type FilaEditable,
  type GrupoDeClausulas,
  type Marca,
  type Valores,
} from '../../model/presupuestoDelTaller';
import { EditorConDatos } from './EditorConDatos';
import {
  CabeceraDeLaLista,
  FilaParaOrdenar,
  FilaQuitada,
  LeyendaDeLosDatos,
  MarcaSinGuardar,
  SumarUnDato,
} from './piezas';
import { TextoConDatos } from './TextoConDatos';

interface FilaDeClausulaProps {
  grupo: GrupoDeClausulas;
  fila: FilaEditable;
  marca: Marca;
  abierta: boolean;
  valores: Valores;
  problema: string | undefined;
  enfocarAlAbrir: boolean;
  alAbrir: () => void;
  alCerrar: () => void;
  alCambiar: (cambios: Partial<FilaEditable>) => void;
  alQuitar: () => void;
}

function FilaDeClausula({
  grupo,
  fila,
  marca,
  abierta,
  valores,
  problema,
  enfocarAlAbrir,
  alAbrir,
  alCerrar,
  alCambiar,
  alQuitar,
}: FilaDeClausulaProps) {
  const textos = GRUPO[grupo];
  const id = useId();
  const insertar = useRef<((hueco: Hueco) => void) | null>(null);
  const registrar = useCallback((funcion: ((hueco: Hueco) => void) | null) => {
    insertar.current = funcion;
  }, []);

  if (!abierta) {
    return (
      <li
        data-clausula={fila.id}
        className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-x-1 border-t border-hairline-soft py-1 first:border-t-0"
      >
        <Casilla
          forma="suelta"
          tildada={fila.tildadaPorDefecto}
          etiqueta={`${textos.tildada}: ${resumenDelTexto(fila.texto, valores)}`}
          alCambiar={(tildadaPorDefecto) => {
            alCambiar({ tildadaPorDefecto });
          }}
        />
        <button
          type="button"
          aria-expanded={false}
          onClick={alAbrir}
          className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-field py-2.5 pr-2 pl-1.5 text-left hover:bg-surface"
        >
          <span className="flex min-w-0 flex-col items-start">
            <span className="sr-only">Cambiar: </span>
            {fila.titulo.trim() !== '' && (
              <span className="text-body leading-normal font-semibold text-ink">{fila.titulo}</span>
            )}
            <span className="line-clamp-3 max-w-[36rem] text-body leading-normal text-pretty text-ink">
              <TextoConDatos texto={fila.texto} valores={valores} />
            </span>
            {problema !== undefined && (
              <span className="mt-1 text-label font-medium text-alerta">{problema}</span>
            )}
            <MarcaSinGuardar marca={marca} nuevo={textos.nuevo} />
          </span>
          <Icono nombre="pencil-line" tamano={16} className="mt-0.5 text-text-3" />
        </button>
      </li>
    );
  }

  return (
    <li
      data-clausula={fila.id}
      data-abierta=""
      className="border-t border-hairline-soft py-2 first:border-t-0"
    >
      <div className="rounded-field bg-surface px-3.5 pt-3.5 pb-4 md:px-4">
        <div className="flex max-w-[42rem] flex-col gap-4">
          {textos.conTitulo && (
            <Campo
              etiqueta="Título (opcional)"
              value={fila.titulo}
              maxLength={120}
              ayuda="Va en negrita, arriba del texto."
              onChange={(evento) => {
                alCambiar({ titulo: evento.target.value });
              }}
            />
          )}
          <div className="flex flex-col gap-1.5">
            <span className="text-label text-text-2">
              <span id={`${id}-etiqueta`}>{textos.etiquetaDelTexto}</span>
              <span className="text-text-3"> · así lo lee tu cliente</span>
            </span>
            <EditorConDatos
              texto={fila.texto}
              valores={valores}
              etiquetadoPor={`${id}-etiqueta`}
              descritoPor={problema === undefined ? undefined : `${id}-error`}
              invalido={problema !== undefined}
              enfocarAlAbrir={enfocarAlAbrir}
              placeholder="Escribilo como querés que lo lea tu cliente…"
              registrar={registrar}
              alCambiar={(texto) => {
                alCambiar({ texto });
              }}
            />
            {problema !== undefined && (
              <span id={`${id}-error`} role="alert" className="text-label font-medium text-alerta">
                {problema}
              </span>
            )}
          </div>
          <LeyendaDeLosDatos datos={datosDelTexto(fila.texto)} valores={valores} />
          <SumarUnDato
            datos={textos.datos}
            alSumar={(hueco) => {
              insertar.current?.(hueco);
            }}
          />
          <Casilla
            forma="con-etiqueta"
            tildada={fila.tildadaPorDefecto}
            etiqueta={textos.tildada}
            alCambiar={(tildadaPorDefecto) => {
              alCambiar({ tildadaPorDefecto });
            }}
          />
          <FilaDeAcciones>
            <Button variant="secundario" onClick={alQuitar}>
              <Icono nombre="trash-2" tamano={16} />
              {textos.quitar}
            </Button>
            <Button variant="secundario" onClick={alCerrar}>
              Listo
            </Button>
          </FilaDeAcciones>
        </div>
      </div>
    </li>
  );
}

export interface ListaDeClausulasProps {
  grupo: GrupoDeClausulas;
  filas: readonly FilaEditable[];
  guardadas: readonly FilaEditable[];
  valores: Valores;
  abierta: string | null;
  recienAgregada: string | null;
  problemas: Readonly<Record<string, string>>;
  alAbrir: (id: string | null) => void;
  alCambiarLaLista: (filas: FilaEditable[]) => void;
  alAgregar: () => void;
}

export function ListaDeClausulas({
  grupo,
  filas,
  guardadas,
  valores,
  abierta,
  recienAgregada,
  problemas,
  alAbrir,
  alCambiarLaLista,
  alAgregar,
}: ListaDeClausulasProps) {
  const textos = GRUPO[grupo];
  const lista = useRef<HTMLUListElement>(null);
  const [ordenando, setOrdenando] = useState(false);
  const [movida, setMovida] = useState<string | null>(null);
  const enLaLista = vivas(filas);
  const tildadas = enLaLista.filter(({ tildadaPorDefecto }) => tildadaPorDefecto).length;
  const lleno = enLaLista.length >= cuantasPuedenSer(grupo);

  function cambiar(id: string, cambios: Partial<FilaEditable>): void {
    alCambiarLaLista(filas.map((fila) => (fila.id === id ? { ...fila, ...cambios } : fila)));
  }

  return (
    <>
      <CabeceraDeLaLista
        resumen={`${textos.cuantas(enLaLista.length)} · ${textos.cuantasTildadas(tildadas, enLaLista.length)}`}
        ordenando={ordenando}
        sePuedeOrdenar={enLaLista.length > 1}
        alOrdenar={(sigue) => {
          if (sigue) alAbrir(null);
          setOrdenando(sigue);
          setMovida(null);
        }}
      />
      <ul
        ref={lista}
        aria-label={textos.titulo}
        className="-mt-2 flex list-none flex-col @container/lista"
      >
        {ordenando
          ? enLaLista.map((fila, posicion) => (
              <FilaParaOrdenar
                key={fila.id}
                id={fila.id}
                texto={
                  fila.titulo.trim() === '' ? (
                    <TextoConDatos texto={fila.texto} valores={valores} />
                  ) : (
                    fila.titulo
                  )
                }
                que={resumenDelTexto(fila.titulo.trim() === '' ? fila.texto : fila.titulo, valores)}
                primera={posicion === 0}
                ultima={posicion === enLaLista.length - 1}
                movida={movida === fila.id}
                alMover={(hacia) => {
                  setMovida(fila.id);
                  alCambiarLaLista(moverEnLaLista(filas, fila.id, hacia));
                  requestAnimationFrame(() => {
                    lista.current
                      ?.querySelector<HTMLButtonElement>(
                        `[data-clausula="${fila.id}"] [data-mover="${hacia === -1 ? 'arriba' : 'abajo'}"]:not(:disabled), [data-clausula="${fila.id}"] [data-mover]:not(:disabled)`,
                      )
                      ?.focus();
                  });
                }}
              />
            ))
          : filas.map((fila) =>
              fila.quitada ? (
                <FilaQuitada
                  key={fila.id}
                  texto={<TextoConDatos texto={fila.texto} valores={valores} />}
                  alDeshacer={() => {
                    cambiar(fila.id, { quitada: false });
                  }}
                />
              ) : (
                <FilaDeClausula
                  key={fila.id}
                  grupo={grupo}
                  fila={fila}
                  marca={marcaDeLaFila(fila, guardadas)}
                  abierta={abierta === fila.id}
                  valores={valores}
                  problema={problemas[`texto:${fila.id}`]}
                  enfocarAlAbrir={recienAgregada === fila.id}
                  alAbrir={() => {
                    alAbrir(fila.id);
                  }}
                  alCerrar={() => {
                    alAbrir(null);
                  }}
                  alCambiar={(cambios) => {
                    cambiar(fila.id, cambios);
                  }}
                  alQuitar={() => {
                    const esNueva = !guardadas.some(({ id }) => id === fila.id);
                    alAbrir(null);
                    if (esNueva) {
                      alCambiarLaLista(filas.filter(({ id }) => id !== fila.id));
                      return;
                    }
                    cambiar(fila.id, { quitada: true });
                  }}
                />
              ),
            )}
      </ul>
      {!ordenando && (
        <button
          type="button"
          disabled={lleno}
          onClick={alAgregar}
          className="inline-flex min-h-tap items-center gap-2 self-start rounded-pill border border-dashed border-border bg-paper px-4 text-body font-medium text-ink hover:bg-surface disabled:text-text-3 disabled:hover:bg-paper"
        >
          <Icono nombre="plus" tamano={17} />
          {textos.agregar}
        </button>
      )}
      {!ordenando && lleno && (
        <p className="-mt-1.5 text-meta text-text-3">
          Entran {String(cuantasPuedenSer(grupo))} como mucho: para sumar{' '}
          {textos.nuevo === 'Nuevo' ? 'otro, quitá uno' : 'otra, quitá una'}.
        </p>
      )}
    </>
  );
}

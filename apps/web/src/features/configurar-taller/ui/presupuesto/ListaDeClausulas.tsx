import type { Hueco } from '@maun/domain';
import { useCallback, useId, useRef, useState } from 'react';

import { useMensajes } from '@/shared/idioma';
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
  const m = useMensajes().configurarTaller.presupuesto;
  const textos = m.grupos[grupo];
  const configuracion = GRUPO[grupo];
  const id = useId();
  const insertar = useRef<((hueco: Hueco) => void) | null>(null);
  const registrar = useCallback((funcion: ((hueco: Hueco) => void) | null) => {
    insertar.current = funcion;
  }, []);

  if (!abierta) {
    const resumen = resumenDelTexto(fila.texto, valores);
    return (
      <li
        data-clausula={fila.id}
        className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-x-1 border-t border-hairline-soft py-1 first:border-t-0"
      >
        <Casilla
          forma="suelta"
          tildada={fila.tildadaPorDefecto}
          etiqueta={resumen === null ? textos.tildadaElTextoNuevo : textos.tildadaCon(resumen)}
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
            <span className="sr-only">{m.lista.cambiar} </span>
            {fila.titulo.trim() !== '' && (
              <span translate="no" className="text-body leading-normal font-semibold text-ink">
                {fila.titulo}
              </span>
            )}
            <span
              translate="no"
              className="line-clamp-3 max-w-[36rem] text-body leading-normal text-pretty text-ink"
            >
              <TextoConDatos texto={fila.texto} valores={valores} />
            </span>
            {problema !== undefined && (
              <span className="mt-1 text-label font-medium text-alerta">{problema}</span>
            )}
            <MarcaSinGuardar marca={marca} nueva={textos.nuevaSinGuardar} />
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
          {configuracion.conTitulo && (
            <Campo
              etiqueta={m.lista.tituloOpcional}
              value={fila.titulo}
              maxLength={120}
              ayuda={m.lista.ayudaDelTitulo}
              onChange={(evento) => {
                alCambiar({ titulo: evento.target.value });
              }}
            />
          )}
          <div className="flex flex-col gap-1.5">
            <span className="text-label text-text-2">
              <span id={`${id}-etiqueta`}>{textos.etiquetaDelTexto}</span>
              <span className="text-text-3"> · {m.lista.asiLoLeeTuCliente}</span>
            </span>
            <EditorConDatos
              texto={fila.texto}
              valores={valores}
              etiquetadoPor={`${id}-etiqueta`}
              descritoPor={problema === undefined ? undefined : `${id}-error`}
              invalido={problema !== undefined}
              enfocarAlAbrir={enfocarAlAbrir}
              placeholder={m.lista.ejemploDelTexto}
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
            datos={configuracion.datos}
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
              {m.lista.listo}
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
  const m = useMensajes().configurarTaller.presupuesto;
  const textos = m.grupos[grupo];
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
        resumen={textos.resumen(enLaLista.length, tildadas)}
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
          ? enLaLista.map((fila, posicion) => {
              const que = resumenDelTexto(
                fila.titulo.trim() === '' ? fila.texto : fila.titulo,
                valores,
              );
              return (
                <FilaParaOrdenar
                  key={fila.id}
                  id={fila.id}
                  texto={
                    <span translate="no">
                      {fila.titulo.trim() === '' ? (
                        <TextoConDatos texto={fila.texto} valores={valores} />
                      ) : (
                        fila.titulo
                      )}
                    </span>
                  }
                  etiquetas={
                    que === null
                      ? { subir: m.lista.subirElTextoNuevo, bajar: m.lista.bajarElTextoNuevo }
                      : { subir: m.lista.subir(que), bajar: m.lista.bajar(que) }
                  }
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
              );
            })
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
        <p className="-mt-1.5 text-meta text-text-3">{textos.lleno(cuantasPuedenSer(grupo))}</p>
      )}
    </>
  );
}

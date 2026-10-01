import type { Hueco } from '@maun/domain';
import { useCallback, useId, useRef, useState } from 'react';

import { Button, Campo, FilaDeAcciones, Icono } from '@/shared/ui';

import {
  cuantasPuedenSer,
  datosDelTexto,
  marcaDeLaForma,
  moverEnLaLista,
  vivas,
  type FormaEditable,
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

const DATOS_DE_UNA_FORMA: readonly Hueco[] = ['sena'];

interface FilaDeFormaProps {
  forma: FormaEditable;
  marca: Marca;
  abierta: boolean;
  primera: boolean;
  valores: Valores;
  problemaDelNombre: string | undefined;
  problemaDelTexto: string | undefined;
  enfocarAlAbrir: boolean;
  alAbrir: () => void;
  alCerrar: () => void;
  alCambiar: (cambios: Partial<FormaEditable>) => void;
  alQuitar: () => void;
}

function LaQueVaElegida() {
  return (
    <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-pill bg-ink/6 px-2.5 py-0.5 text-meta font-medium text-ink">
      <Icono nombre="check" tamano={13} grosor={2.25} />
      Va elegida de entrada
    </span>
  );
}

function FilaDeForma({
  forma,
  marca,
  abierta,
  primera,
  valores,
  problemaDelNombre,
  problemaDelTexto,
  enfocarAlAbrir,
  alAbrir,
  alCerrar,
  alCambiar,
  alQuitar,
}: FilaDeFormaProps) {
  const id = useId();
  const insertar = useRef<((hueco: Hueco) => void) | null>(null);
  const registrar = useCallback((funcion: ((hueco: Hueco) => void) | null) => {
    insertar.current = funcion;
  }, []);
  if (!abierta) {
    return (
      <li data-forma={forma.id} className="border-t border-hairline-soft py-1 first:border-t-0">
        <button
          type="button"
          aria-expanded={false}
          onClick={alAbrir}
          className="-ml-1.5 grid w-[calc(100%+0.375rem)] min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-field py-2.5 pr-2 pl-1.5 text-left hover:bg-surface"
        >
          <span className="flex min-w-0 flex-col items-start">
            <span className="text-body leading-normal font-semibold text-ink">
              <span className="sr-only">Cambiar la forma de pago </span>
              {forma.nombre.trim() === '' ? 'Sin nombre' : forma.nombre}
            </span>
            <span className="max-w-[36rem] text-body leading-normal text-pretty text-text-2">
              <TextoConDatos texto={forma.texto} valores={valores} />
            </span>
            {(problemaDelNombre ?? problemaDelTexto) !== undefined && (
              <span className="mt-1 text-label font-medium text-alerta">
                {problemaDelNombre ?? problemaDelTexto}
              </span>
            )}
            {primera && <LaQueVaElegida />}
            <MarcaSinGuardar marca={marca} nuevo="Nueva" />
          </span>
          <Icono nombre="pencil-line" tamano={16} className="mt-0.5 text-text-3" />
        </button>
      </li>
    );
  }

  return (
    <li
      data-forma={forma.id}
      data-abierta=""
      className="border-t border-hairline-soft py-2 first:border-t-0"
    >
      <div className="rounded-field bg-surface px-3.5 pt-3.5 pb-4 md:px-4">
        <div className="flex max-w-[42rem] flex-col gap-4">
          <Campo
            etiqueta="Nombre"
            value={forma.nombre}
            maxLength={60}
            ayuda="Es para vos, para elegirla en cada presupuesto. Tu cliente lee el texto de abajo."
            error={problemaDelNombre}
            onChange={(evento) => {
              alCambiar({ nombre: evento.target.value });
            }}
          />
          <div className="flex flex-col gap-1.5">
            <span id={`${id}-etiqueta`} className="text-label text-text-2">
              Lo que lee tu cliente
            </span>
            <EditorConDatos
              texto={forma.texto}
              valores={valores}
              etiquetadoPor={`${id}-etiqueta`}
              descritoPor={problemaDelTexto === undefined ? undefined : `${id}-error`}
              invalido={problemaDelTexto !== undefined}
              enfocarAlAbrir={enfocarAlAbrir}
              placeholder="Por ejemplo: seña del 50% y el saldo en dos cuotas…"
              registrar={registrar}
              alCambiar={(texto) => {
                alCambiar({ texto });
              }}
            />
            {problemaDelTexto !== undefined && (
              <span id={`${id}-error`} role="alert" className="text-label font-medium text-alerta">
                {problemaDelTexto}
              </span>
            )}
          </div>
          <LeyendaDeLosDatos datos={datosDelTexto(forma.texto)} valores={valores} />
          <SumarUnDato
            datos={DATOS_DE_UNA_FORMA}
            alSumar={(hueco) => {
              insertar.current?.(hueco);
            }}
          />
          <FilaDeAcciones>
            <Button variant="secundario" onClick={alQuitar}>
              <Icono nombre="trash-2" tamano={16} />
              Quitar esta forma de pago
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

export interface FormasDePagoProps {
  formas: readonly FormaEditable[];
  guardadas: readonly FormaEditable[];
  valores: Valores;
  abierta: string | null;
  recienAgregada: string | null;
  problemas: Readonly<Record<string, string>>;
  alAbrir: (id: string | null) => void;
  alCambiarLaLista: (formas: FormaEditable[]) => void;
  alAgregar: () => void;
}

export function FormasDePago({
  formas,
  guardadas,
  valores,
  abierta,
  recienAgregada,
  problemas,
  alAbrir,
  alCambiarLaLista,
  alAgregar,
}: FormasDePagoProps) {
  const lista = useRef<HTMLUListElement>(null);
  const [ordenando, setOrdenando] = useState(false);
  const [movida, setMovida] = useState<string | null>(null);
  const enLaLista = vivas(formas);
  const lleno = enLaLista.length >= cuantasPuedenSer('formas');
  const sinNinguna = problemas.formas;

  function cambiar(id: string, cambios: Partial<FormaEditable>): void {
    alCambiarLaLista(formas.map((forma) => (forma.id === id ? { ...forma, ...cambios } : forma)));
  }

  return (
    <>
      <CabeceraDeLaLista
        resumen={
          enLaLista.length === 1 ? '1 forma de pago' : `${String(enLaLista.length)} formas de pago`
        }
        ordenando={ordenando}
        sePuedeOrdenar={enLaLista.length > 1}
        ayudaAlOrdenar="Subí o bajá cada una: la primera va elegida en cada presupuesto nuevo."
        alOrdenar={(sigue) => {
          if (sigue) alAbrir(null);
          setOrdenando(sigue);
          setMovida(null);
        }}
      />
      <ul
        ref={lista}
        aria-label="Formas de pago"
        className="-mt-2 flex list-none flex-col @container/lista"
      >
        {ordenando &&
          enLaLista.map((forma, posicion) => (
            <FilaParaOrdenar
              key={forma.id}
              id={forma.id}
              texto={forma.nombre.trim() === '' ? 'Sin nombre' : forma.nombre}
              que={forma.nombre.trim() === '' ? 'la forma de pago nueva' : `«${forma.nombre}»`}
              primera={posicion === 0}
              ultima={posicion === enLaLista.length - 1}
              movida={movida === forma.id}
              alMover={(hacia) => {
                setMovida(forma.id);
                alCambiarLaLista(moverEnLaLista(formas, forma.id, hacia));
                requestAnimationFrame(() => {
                  lista.current
                    ?.querySelector<HTMLButtonElement>(
                      `[data-clausula="${forma.id}"] [data-mover="${hacia === -1 ? 'arriba' : 'abajo'}"]:not(:disabled), [data-clausula="${forma.id}"] [data-mover]:not(:disabled)`,
                    )
                    ?.focus();
                });
              }}
            />
          ))}
        {!ordenando &&
          formas.map((forma) => {
            if (forma.quitada) {
              return (
                <FilaQuitada
                  key={forma.id}
                  texto={forma.nombre}
                  alDeshacer={() => {
                    cambiar(forma.id, { quitada: false });
                  }}
                />
              );
            }
            const posicion = enLaLista.findIndex(({ id }) => id === forma.id);
            return (
              <FilaDeForma
                key={forma.id}
                forma={forma}
                marca={marcaDeLaForma(forma, guardadas)}
                abierta={abierta === forma.id}
                primera={posicion === 0}
                valores={valores}
                problemaDelNombre={problemas[`nombre:${forma.id}`]}
                problemaDelTexto={problemas[`texto:${forma.id}`]}
                enfocarAlAbrir={recienAgregada === forma.id}
                alAbrir={() => {
                  alAbrir(forma.id);
                }}
                alCerrar={() => {
                  alAbrir(null);
                }}
                alCambiar={(cambios) => {
                  cambiar(forma.id, cambios);
                }}
                alQuitar={() => {
                  const esNueva = !guardadas.some(({ id }) => id === forma.id);
                  alAbrir(null);
                  if (esNueva) {
                    alCambiarLaLista(formas.filter(({ id }) => id !== forma.id));
                    return;
                  }
                  cambiar(forma.id, { quitada: true });
                }}
              />
            );
          })}
      </ul>
      {sinNinguna !== undefined && (
        <p role="alert" className="text-label font-medium text-alerta">
          {sinNinguna}
        </p>
      )}
      {!ordenando && (
        <button
          type="button"
          disabled={lleno}
          onClick={alAgregar}
          className="inline-flex min-h-tap items-center gap-2 self-start rounded-pill border border-dashed border-border bg-paper px-4 text-body font-medium text-ink hover:bg-surface disabled:text-text-3 disabled:hover:bg-paper"
        >
          <Icono nombre="plus" tamano={17} />
          Agregar una forma de pago
        </button>
      )}
      {!ordenando && lleno && (
        <p className="-mt-1.5 text-meta text-text-3">
          Entran {String(cuantasPuedenSer('formas'))} como mucho: para sumar otra, quitá una.
        </p>
      )}
    </>
  );
}

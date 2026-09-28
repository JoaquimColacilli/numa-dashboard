import type { LiquidacionPorLaFila } from '@maun/domain';
import type { KeyboardEvent, ReactNode } from 'react';

import {
  editarLaFila,
  FICHA_DEL_DIEZMO,
  FICHA_DEL_REPARTO,
  moverUnLugar,
  type VistaDeLaFila,
} from '@/features/armar-la-fila';
import { Icono } from '@/shared/ui';

import { armarElPlano, type AristaDelPlano, type NodoDelPlano } from '../model/disposicion';
import {
  CuerpoDeLaParte,
  CuerpoDelDiezmo,
  CuerpoDelEstante,
  CuerpoDelOrigen,
  CuerpoDelPaso,
  CuerpoDelReparto,
  CuerpoNuevoTesoro,
  TituloDelEstante,
} from './Fichas';

function Punta() {
  return (
    <svg aria-hidden viewBox="0 0 9 8" className="block h-2 w-[9px] text-text-3">
      <polygon points="0,0 9,0 4.5,8" fill="currentColor" />
    </svg>
  );
}

function Conector({
  arista,
  alSumar,
}: {
  arista: AristaDelPlano | undefined;
  alSumar?: (boton: HTMLElement) => void;
}) {
  const datos = arista?.data;
  const probando = datos?.monto !== null && datos?.monto !== undefined;
  const vacia = datos?.vacia === true;
  return (
    <div className="relative flex h-9 flex-col items-center">
      <span
        aria-hidden
        className={`w-0 flex-1 border-l-[1.5px] ${
          vacia ? 'border-dashed border-text-3' : probando ? 'border-ink' : 'border-text-3'
        }`}
      />
      <Punta />
      {probando && datos.etiqueta !== null && alSumar === undefined && (
        <span
          aria-hidden
          className={`absolute top-1/2 left-1/2 ml-3 -translate-y-1/2 rounded-control border bg-paper px-1.5 py-px text-badge whitespace-nowrap tabular-nums ${
            vacia ? 'border-hairline text-text-3' : 'border-ink/30 font-semibold text-ink'
          }`}
        >
          {datos.etiqueta}
        </span>
      )}
      {alSumar !== undefined && (
        <button
          type="button"
          onClick={(evento) => {
            alSumar(evento.currentTarget);
          }}
          className="absolute top-1/2 left-1/2 flex h-7 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-pill border border-ink bg-paper px-2.5 text-meta font-medium whitespace-nowrap text-ink before:absolute before:-inset-y-2 before:inset-x-0"
        >
          <Icono nombre="plus" tamano={14} grosor={2} />
          Sumar un paso
        </button>
      )}
    </div>
  );
}

function Controles({
  nombre,
  arriba,
  abajo,
  alSubir,
  alBajar,
  alEditar,
}: {
  nombre: string;
  arriba: boolean;
  abajo: boolean;
  alSubir: () => void;
  alBajar: () => void;
  alEditar: () => void;
}) {
  const boton =
    'flex min-h-11 flex-1 items-center justify-center gap-1.5 text-label font-medium text-ink disabled:text-text-3';
  return (
    <div
      role="group"
      aria-label={`Lugar de ${nombre}`}
      className="mt-2 flex divide-x divide-hairline overflow-hidden rounded-field border border-border bg-paper"
    >
      <button type="button" className={boton} disabled={!arriba} onClick={alSubir}>
        <Icono nombre="arrow-up" tamano={16} />
        Subir
      </button>
      <button type="button" className={boton} disabled={!abajo} onClick={alBajar}>
        <Icono nombre="arrow-down" tamano={16} />
        Bajar
      </button>
      <button type="button" className={boton} onClick={alEditar}>
        <Icono nombre="pencil" tamano={15} />
        Editar
      </button>
    </div>
  );
}

function Tocable({
  nodo,
  alTocar,
  children,
}: {
  nodo: NodoDelPlano;
  alTocar: (id: string) => void;
  children: ReactNode;
}) {
  const alTeclear = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key !== 'Enter' && evento.key !== ' ') return;
    evento.preventDefault();
    alTocar(nodo.id);
  };
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={nodo.ariaLabel}
      aria-roledescription={nodo.domAttributes?.['aria-roledescription']}
      onClick={() => {
        alTocar(nodo.id);
      }}
      onKeyDown={alTeclear}
      className="block w-full cursor-pointer rounded-lamina text-left"
    >
      {children}
    </div>
  );
}

export interface PlanoVerticalProps {
  vista: VistaDeLaFila;
  resultado: LiquidacionPorLaFila | null;
  elegido: string | null;
  alTocar: (id: string) => void;
  alSumar: (despuesDe: string | null, boton: HTMLElement) => void;
  alNuevo: () => void;
}

export function PlanoVertical({
  vista,
  resultado,
  elegido,
  alTocar,
  alSumar,
  alNuevo,
}: PlanoVerticalProps) {
  const { nodos, aristas } = armarElPlano({ vista, prueba: resultado, elegido });
  const armando = vista.armando;
  const hacia = (id: string) => aristas.find((arista) => arista.target === id);
  const de = <T extends NodoDelPlano['type']>(tipo: T) =>
    nodos.filter((nodo): nodo is Extract<NodoDelPlano, { type: T }> => nodo.type === tipo);
  const origen = de('origen')[0];
  const diezmo = de('diezmo')[0];
  const reparto = de('reparto')[0];
  const titulo = de('titulo')[0];
  const pasos = de('paso');
  const partes = de('parte');
  const estante = de('estante');
  const hayResultado = resultado !== null;

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="La fila"
        className="cuadricula rounded-panel border border-hairline px-4 pt-5 pb-5"
      >
        {origen !== undefined && (
          <div className="h-14">
            <CuerpoDelOrigen data={origen.data} />
          </div>
        )}
        <Conector arista={hacia(FICHA_DEL_DIEZMO)} />
        {diezmo !== undefined && (
          <Tocable nodo={diezmo} alTocar={alTocar}>
            <CuerpoDelDiezmo data={diezmo.data} elegida={false} />
          </Tocable>
        )}
        {pasos.map((paso, indice) => {
          const tesoro = paso.data.paso.tesoro;
          const anterior = indice === 0 ? null : (pasos[indice - 1]?.data.paso.tesoro ?? null);
          return (
            <div key={paso.id}>
              <Conector
                arista={hacia(paso.id)}
                alSumar={
                  armando
                    ? (boton) => {
                        alSumar(anterior, boton);
                      }
                    : undefined
                }
              />
              <Tocable nodo={paso} alTocar={alTocar}>
                <CuerpoDelPaso data={paso.data} elegida={false} enLienzo={false} />
              </Tocable>
              {armando && (
                <Controles
                  nombre={paso.data.tesoro.nombre}
                  arriba={indice > 0}
                  abajo={indice < pasos.length - 1}
                  alSubir={() => {
                    editarLaFila(vista, (fila) => moverUnLugar(fila, tesoro, -1));
                  }}
                  alBajar={() => {
                    editarLaFila(vista, (fila) => moverUnLugar(fila, tesoro, 1));
                  }}
                  alEditar={() => {
                    alTocar(paso.id);
                  }}
                />
              )}
            </div>
          );
        })}
        <Conector
          arista={aristas.find((arista) => arista.target === FICHA_DEL_REPARTO)}
          alSumar={
            armando
              ? (boton) => {
                  alSumar(pasos.at(-1)?.data.paso.tesoro ?? null, boton);
                }
              : undefined
          }
        />
        {reparto !== undefined && (
          <Tocable nodo={reparto} alTocar={alTocar}>
            <CuerpoDelReparto data={reparto.data} elegida={false} />
          </Tocable>
        )}
        <ul className="relative ml-4 flex flex-col gap-3 pt-3">
          {partes.map((parte, indice) => {
            const arista = hacia(parte.id);
            const ultima = indice === partes.length - 1;
            const viva = hayResultado && arista?.data !== undefined && !arista.data.vacia;
            return (
              <li key={parte.id} className="relative pl-7">
                <span
                  aria-hidden
                  className={`absolute -top-3 left-0 w-0 border-l-[1.5px] ${viva ? 'border-ink' : 'border-text-3'} ${
                    ultima ? 'h-[49px]' : 'bottom-0'
                  }`}
                />
                <span
                  aria-hidden
                  className="absolute top-[37px] left-0 flex -translate-y-1/2 items-center"
                >
                  <span
                    className={`h-0 w-5 border-t-[1.5px] ${viva ? 'border-ink' : 'border-text-3'}`}
                  />
                  <svg
                    viewBox="0 0 8 9"
                    className={`h-[9px] w-2 ${viva ? 'text-ink' : 'text-text-3'}`}
                  >
                    <polygon points="0,0 8,4.5 0,9" fill="currentColor" />
                  </svg>
                </span>
                <Tocable nodo={parte} alTocar={alTocar}>
                  <CuerpoDeLaParte data={parte.data} elegida={false} />
                </Tocable>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Estante" className="flex flex-col gap-2.5">
        {titulo !== undefined && (
          <div className="h-5 px-1">
            <TituloDelEstante data={titulo.data} />
          </div>
        )}
        {estante.map((suelto) => (
          <Tocable key={suelto.id} nodo={suelto} alTocar={alTocar}>
            <CuerpoDelEstante data={suelto.data} elegida={false} conFlechas={false} />
          </Tocable>
        ))}
        <div className="h-14">
          <CuerpoNuevoTesoro alTocar={alNuevo} deshabilitado={!vista.sincronizados} />
        </div>
      </section>
    </div>
  );
}

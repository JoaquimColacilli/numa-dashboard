import type { LiquidacionPorLaFila } from '@maun/domain';
import type { KeyboardEvent, ReactNode } from 'react';

import {
  editarLaFila,
  FICHA_DEL_REPARTO,
  FICHA_DEL_ORIGEN,
  moverLaObligacion,
  moverUnLugar,
  puedeMoverse,
  puedeMoverseLaObligacion,
  type VistaDeLaFila,
} from '@/features/armar-la-fila';
import { useMensajes } from '@/shared/idioma';
import { formatearPesos } from '@/shared/lib';
import { Icono } from '@/shared/ui';

import {
  armarElPlano,
  SIN_INSUMOS,
  type AristaDelPlano,
  type GrupoConFranja,
  type InsumosEnElPlano,
  type LugarDelTramo,
  type NodoDeLaObligacion,
  type NodoDelPaso,
  type NodoDelPlano,
} from '../model/disposicion';
import {
  CuerpoDeLaObligacion,
  CuerpoDeLaParte,
  CuerpoDelEstante,
  CuerpoDelIngreso,
  CuerpoDelPaso,
  CuerpoDelReparto,
  CuerpoNuevoTesoro,
  RotuloDelFlujo,
  TituloDelEstante,
  TituloDelGrupo,
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
  const textos = useMensajes().paginaTesoros.planoVertical;
  const datos = arista?.data;
  const monto = datos?.monto ?? null;
  const probando = monto !== null;
  const vacia = datos?.vacia === true;
  const flujo = datos?.flujo ?? null;
  return (
    <div className={`relative flex flex-col items-center ${flujo === null ? 'h-9' : 'h-11'}`}>
      <span
        aria-hidden
        className={`w-0 flex-1 border-l-[1.5px] ${
          vacia ? 'border-dashed border-text-3' : probando ? 'border-ink' : 'border-text-3'
        }`}
      />
      <Punta />
      {flujo !== null && (
        <span
          className={`absolute top-1/2 -translate-y-1/2 ${
            alSumar === undefined ? 'left-1/2 ml-3' : 'left-0'
          }`}
        >
          <RotuloDelFlujo flujo={flujo} monto={null} />
        </span>
      )}
      {flujo !== null && monto !== null && (
        <span
          translate="no"
          className={`absolute top-1/2 -translate-y-1/2 rounded-control border bg-paper px-1.5 py-px text-badge whitespace-nowrap tabular-nums ${
            alSumar === undefined ? 'right-1/2 mr-3' : 'right-0'
          } ${vacia ? 'border-hairline text-text-3' : 'border-ink/30 font-semibold text-ink'}`}
        >
          {formatearPesos(monto)}
        </span>
      )}
      {flujo === null &&
        datos !== undefined &&
        probando &&
        datos.etiqueta !== null &&
        alSumar === undefined && (
          <span
            aria-hidden
            translate="no"
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
          {textos.sumarAca}
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
  const textos = useMensajes().paginaTesoros.planoVertical;
  const boton =
    'flex min-h-11 flex-1 items-center justify-center gap-1.5 text-label font-medium text-ink disabled:text-text-3';
  return (
    <div
      role="group"
      aria-label={textos.lugarDe(nombre)}
      className="mt-2 flex divide-x divide-hairline overflow-hidden rounded-field border border-border bg-paper"
    >
      <button type="button" className={boton} disabled={!arriba} onClick={alSubir}>
        <Icono nombre="arrow-up" tamano={16} />
        {textos.subir}
      </button>
      <button type="button" className={boton} disabled={!abajo} onClick={alBajar}>
        <Icono nombre="arrow-down" tamano={16} />
        {textos.bajar}
      </button>
      <button type="button" className={boton} onClick={alEditar}>
        <Icono nombre="pencil" tamano={15} />
        {textos.editar}
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
      data-ficha={nodo.id}
      aria-label={nodo.ariaLabel}
      aria-roledescription={nodo.domAttributes?.['aria-roledescription']}
      onClick={() => {
        alTocar(nodo.id);
      }}
      onKeyDown={alTeclear}
      className="block w-full scroll-mt-24 cursor-pointer rounded-lamina text-left"
    >
      {children}
    </div>
  );
}

export interface PlanoVerticalProps {
  vista: VistaDeLaFila;
  resultado: LiquidacionPorLaFila | null;
  elegido: string | null;
  insumos?: InsumosEnElPlano;
  alTocar: (id: string) => void;
  alSumar: (tramo: LugarDelTramo, boton: HTMLElement) => void;
  alNuevo: () => void;
}

type FichaDeLaCadena = NodoDeLaObligacion | NodoDelPaso;

function grupoDe(nodo: FichaDeLaCadena): GrupoConFranja {
  if (nodo.type === 'obligacion') return 'obligaciones';
  return nodo.data.tipo === 'compromiso' ? 'compromisos' : 'ahorros';
}

export function PlanoVertical({
  vista,
  resultado,
  elegido,
  insumos = SIN_INSUMOS,
  alTocar,
  alSumar,
  alNuevo,
}: PlanoVerticalProps) {
  const textos = useMensajes().paginaTesoros.planoVertical;
  const { nodos, aristas } = armarElPlano({ vista, prueba: resultado, elegido, insumos });
  const armando = vista.armando;
  const hacia = (id: string) => aristas.find((arista) => arista.target === id);
  const de = <T extends NodoDelPlano['type']>(tipo: T) =>
    nodos.filter((nodo): nodo is Extract<NodoDelPlano, { type: T }> => nodo.type === tipo);
  const ingreso = de('ingreso')[0];
  const reparto = de('reparto')[0];
  const titulo = de('titulo')[0];
  const cadena: FichaDeLaCadena[] = nodos.filter(
    (nodo): nodo is FichaDeLaCadena => nodo.type === 'obligacion' || nodo.type === 'paso',
  );
  const partes = de('parte');
  const estante = de('estante');
  const hayResultado = resultado !== null;
  const conSumar = (arista: AristaDelPlano | undefined) => {
    const lugar = arista?.data?.lugar ?? null;
    return armando && lugar !== null
      ? (boton: HTMLElement) => {
          alSumar(lugar, boton);
        }
      : undefined;
  };
  const hayAhorrosSueltos =
    vista.fila.reparto.length > 0 && !cadena.some((nodo) => grupoDe(nodo) === 'ahorros');

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label={textos.laFila}
        className="cuadricula rounded-panel border border-hairline px-4 pt-5 pb-5"
      >
        {ingreso !== undefined && (
          <div className="h-[72px]">
            <CuerpoDelIngreso data={ingreso.data} />
          </div>
        )}
        {cadena.map((nodo, indice) => {
          const anterior = cadena[indice - 1];
          const grupo = grupoDe(nodo);
          const empiezaElGrupo = anterior === undefined || grupoDe(anterior) !== grupo;
          const arista = aristas.find(
            (candidata) =>
              candidata.target === nodo.id &&
              candidata.source === (anterior?.id ?? FICHA_DEL_ORIGEN),
          );
          const tesoro =
            nodo.type === 'obligacion' ? nodo.data.obligacion.tesoro : nodo.data.paso.tesoro;
          const esObligacion = nodo.type === 'obligacion';
          const puede = esObligacion ? puedeMoverseLaObligacion : puedeMoverse;
          const mover = esObligacion ? moverLaObligacion : moverUnLugar;
          return (
            <div key={nodo.id}>
              <Conector arista={arista} alSumar={conSumar(arista)} />
              {empiezaElGrupo && <TituloDelGrupo grupo={grupo} />}
              <Tocable nodo={nodo} alTocar={alTocar}>
                {nodo.type === 'obligacion' ? (
                  <CuerpoDeLaObligacion
                    data={nodo.data}
                    elegida={elegido === nodo.id}
                    enLienzo={false}
                  />
                ) : (
                  <CuerpoDelPaso data={nodo.data} elegida={elegido === nodo.id} enLienzo={false} />
                )}
              </Tocable>
              {armando && (
                <Controles
                  nombre={nodo.data.tesoro.nombre}
                  arriba={puede(vista.fila, tesoro, -1)}
                  abajo={puede(vista.fila, tesoro, 1)}
                  alSubir={() => {
                    editarLaFila(vista, (fila) => mover(fila, tesoro, -1));
                  }}
                  alBajar={() => {
                    editarLaFila(vista, (fila) => mover(fila, tesoro, 1));
                  }}
                  alEditar={() => {
                    alTocar(nodo.id);
                  }}
                />
              )}
            </div>
          );
        })}
        {(() => {
          const arista = hacia(FICHA_DEL_REPARTO);
          return <Conector arista={arista} alSumar={conSumar(arista)} />;
        })()}
        {hayAhorrosSueltos && <TituloDelGrupo grupo="ahorros" />}
        {reparto !== undefined && (
          <Tocable nodo={reparto} alTocar={alTocar}>
            <CuerpoDelReparto data={reparto.data} elegida={elegido === reparto.id} />
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
                  <CuerpoDeLaParte data={parte.data} elegida={elegido === parte.id} />
                </Tocable>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label={textos.estante} className="flex flex-col gap-2.5">
        {titulo !== undefined && (
          <div className="h-5 px-1">
            <TituloDelEstante data={titulo.data} />
          </div>
        )}
        {estante.map((suelto) => (
          <Tocable key={suelto.id} nodo={suelto} alTocar={alTocar}>
            <CuerpoDelEstante
              data={suelto.data}
              elegida={elegido === suelto.id}
              conFlechas={false}
            />
          </Tocable>
        ))}
        <div className="h-14">
          <CuerpoNuevoTesoro alTocar={alNuevo} deshabilitado={!vista.sincronizados} />
        </div>
      </section>
    </div>
  );
}

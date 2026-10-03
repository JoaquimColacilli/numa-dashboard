import type { Conteo, TipoDePregunta } from '@maun/domain';

import { fondoDelPaso } from '../model/polos';

import { Carita } from './Carita';

const COLUMNAS: Readonly<Record<TipoDePregunta, string>> = {
  escala5: 'grid-cols-2 @lg:grid-cols-5',
  sitalvezno: 'grid-cols-2 @lg:grid-cols-3',
  una: 'grid-cols-2 @lg:grid-cols-4',
  varias: 'grid-cols-2 @lg:grid-cols-4',
  texto: 'grid-cols-2',
};

export function PuntosPorPersona({
  conteos,
  tipo,
}: {
  conteos: readonly Conteo[];
  tipo: TipoDePregunta;
}) {
  return (
    <div className="@container">
      <ul className={`grid list-none gap-x-2 gap-y-2.5 p-0 ${COLUMNAS[tipo]}`}>
        {conteos.map(({ paso, n }) => (
          <li key={paso.valor} className="flex min-w-0 flex-col gap-1.75">
            <span aria-hidden className="flex min-h-3.5 flex-wrap items-center gap-0.75">
              {n === 0 ? (
                <span className="h-px w-2.5 bg-border" />
              ) : (
                Array.from({ length: n }, (_, indice) => (
                  <span
                    key={indice}
                    className={`size-2.5 flex-none rounded-pill ${fondoDelPaso(paso)}`}
                  />
                ))
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <Carita paso={paso} tamano={15} />
              <span className="text-meta leading-tight text-text-2">{paso.etiqueta}</span>
            </span>
            <span
              className={`text-label font-semibold tabular-nums ${n > 0 ? 'text-ink' : 'text-text-3'}`}
            >
              {n}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

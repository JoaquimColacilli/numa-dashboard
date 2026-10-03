import type { Conteo } from '@maun/domain';

import { FONDO_DEL_POLO, fondoDelPaso } from '../model/polos';

interface Tramo {
  conteo: Conteo;
  ancho: number;
  debil: boolean;
}

function tramos(conteos: readonly Conteo[]): { izquierda: Tramo[]; derecha: Tramo[] } {
  const total = Math.max(
    1,
    conteos.reduce((suma, { n }) => suma + n, 0),
  );
  const ordenados = [...conteos].sort((a, b) => a.paso.valor - b.paso.valor);
  const mal = ordenados.filter(({ paso }) => paso.polo === 'mal');
  const bien = ordenados.filter(({ paso }) => paso.polo === 'bien');
  const neutro = ordenados.find(({ paso }) => paso.polo === 'neutro');
  const medio = (conteo: Conteo | undefined): Tramo[] =>
    conteo === undefined ? [] : [{ conteo, ancho: (conteo.n / total) * 50, debil: false }];
  return {
    izquierda: [
      ...mal.map((conteo, indice) => ({
        conteo,
        ancho: (conteo.n / total) * 100,
        debil: mal.length > 1 && indice === mal.length - 1,
      })),
      ...medio(neutro),
    ],
    derecha: [
      ...medio(neutro),
      ...bien.map((conteo, indice) => ({
        conteo,
        ancho: (conteo.n / total) * 100,
        debil: bien.length > 1 && indice === 0,
      })),
    ],
  };
}

function Segmento({ tramo }: { tramo: Tramo }) {
  const { paso } = tramo.conteo;
  if (tramo.ancho === 0 || paso.polo === null) return null;
  return (
    <span
      style={{ width: `${String(tramo.ancho)}%` }}
      className={`h-full ${FONDO_DEL_POLO[paso.polo]} ${tramo.debil ? 'opacity-55' : ''}`}
    />
  );
}

export function BarraDivergente({ conteos }: { conteos: readonly Conteo[] }) {
  const { izquierda, derecha } = tramos(conteos);
  const debiles = new Set(
    [...izquierda, ...derecha]
      .filter((tramo) => tramo.debil)
      .map((tramo) => tramo.conteo.paso.valor),
  );

  return (
    <div>
      <div aria-hidden className="grid h-6.5 grid-cols-2 items-center">
        <div className="flex h-full justify-end gap-0.5">
          {izquierda.map((tramo) => (
            <Segmento key={tramo.conteo.paso.valor} tramo={tramo} />
          ))}
        </div>
        <div className="flex h-full justify-start gap-0.5">
          {derecha.map((tramo) => (
            <Segmento key={tramo.conteo.paso.valor} tramo={tramo} />
          ))}
        </div>
      </div>
      <div aria-hidden className="relative h-3">
        <span className="absolute -top-7.5 left-1/2 h-8.5 w-px bg-text-3" />
      </div>
      <ul className="mt-0.5 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
        {conteos.map(({ paso, n }) => (
          <li key={paso.valor} className="flex items-center gap-1.5 text-meta text-text-2">
            <span
              aria-hidden
              className={`size-2.75 flex-none ${fondoDelPaso(paso)} ${
                debiles.has(paso.valor) ? 'opacity-55' : ''
              } ${paso.polo === 'neutro' ? 'rounded-pill' : ''}`}
            />
            {paso.etiqueta} ({n})
          </li>
        ))}
      </ul>
    </div>
  );
}

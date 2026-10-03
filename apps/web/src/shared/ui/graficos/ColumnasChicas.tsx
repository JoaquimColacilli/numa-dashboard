import { anchoDeLaColumna, caminoDeLaColumna, techoRedondo } from '@/shared/lib';

import { anchoDelTexto, useAnchoDelLienzo } from './lienzo';

export interface ColumnaChica {
  clave: string;
  valor: number;
  enPeriodo: boolean;
  enCurso: boolean;
  sinRegistro: boolean;
}

export interface ColumnasChicasProps {
  columnas: readonly ColumnaChica[];
  primerRotulo: string;
  rotuloDelPeriodo: string | null;
}

const ARRIBA = 4;
const ALTO_UTIL = 46;
const ABAJO = 18;
const ALTO = ARRIBA + ALTO_UTIL + ABAJO;

export function ColumnasChicas(props: ColumnasChicasProps) {
  const [medirAl, ancho] = useAnchoDelLienzo();
  return (
    <div ref={medirAl} className="w-full min-w-0" style={{ height: ALTO }}>
      {ancho > 0 && <DibujoChico {...props} ancho={ancho} />}
    </div>
  );
}

function DibujoChico({
  columnas,
  primerRotulo,
  rotuloDelPeriodo,
  ancho,
}: ColumnasChicasProps & { ancho: number }) {
  const cantidad = Math.max(1, columnas.length);
  const banda = ancho / cantidad;
  const anchoDeColumna = anchoDeLaColumna(banda, true);
  const techo = techoRedondo(Math.max(1, ...columnas.map((columna) => columna.valor)));
  const base = ARRIBA + ALTO_UTIL;
  const alto = (valor: number) => (Math.max(0, valor) / techo) * ALTO_UTIL;
  const izquierdaDe = (indice: number) => banda * indice + banda / 2 - anchoDeColumna / 2;

  const primera = Math.max(
    0,
    columnas.findIndex((columna) => !columna.sinRegistro),
  );
  const delPeriodo = columnas.flatMap((columna, indice) => (columna.enPeriodo ? [indice] : []));
  const desde = delPeriodo[0];
  const hasta = delPeriodo[delPeriodo.length - 1];
  const anchoDelPrimerRotulo = anchoDelTexto(primerRotulo);
  const xPrimerRotulo = Math.max(0, Math.min(izquierdaDe(primera), ancho - anchoDelPrimerRotulo));
  const finDelPrimerRotulo = xPrimerRotulo + anchoDelPrimerRotulo;
  const llave =
    rotuloDelPeriodo === null || desde === undefined || hasta === undefined
      ? null
      : {
          a: izquierdaDe(desde),
          b: izquierdaDe(hasta) + anchoDeColumna,
          rotulo: rotuloDelPeriodo,
        };
  const llaveQueEntra =
    llave !== null && llave.b - anchoDelTexto(llave.rotulo) > finDelPrimerRotulo + 6 ? llave : null;

  return (
    <svg
      aria-hidden
      focusable="false"
      width={ancho}
      height={ALTO}
      className="block overflow-visible"
    >
      <line x1={0} x2={ancho} y1={base} y2={base} strokeWidth={1} className="stroke-border" />
      {columnas.map((columna, indice) => {
        if (columna.sinRegistro) return null;
        const x = izquierdaDe(indice);
        const altoDeLaColumna = alto(columna.valor);
        const tinta = columna.enPeriodo ? 'fill-ink' : 'fill-contexto';
        if (altoDeLaColumna < 2) {
          return (
            <line
              key={columna.clave}
              x1={x}
              x2={x + anchoDeColumna}
              y1={base - 1}
              y2={base - 1}
              strokeWidth={columna.enCurso ? 1.5 : 2}
              strokeDasharray={columna.enCurso ? '4 3' : undefined}
              className={columna.enCurso || columna.enPeriodo ? 'stroke-ink' : 'stroke-contexto'}
            />
          );
        }
        const camino = caminoDeLaColumna(
          x,
          base - altoDeLaColumna,
          anchoDeColumna,
          altoDeLaColumna,
          2,
        );
        return columna.enCurso ? (
          <g key={columna.clave}>
            <path d={camino} className={`${tinta} opacity-18`} />
            <path
              d={caminoDeLaColumna(
                x + 0.75,
                base - altoDeLaColumna + 0.75,
                anchoDeColumna - 1.5,
                altoDeLaColumna - 0.75,
                2,
              )}
              fill="none"
              strokeWidth={1.25}
              strokeDasharray="4 3"
              className="stroke-ink"
            />
          </g>
        ) : (
          <path key={columna.clave} d={camino} className={tinta} />
        );
      })}
      <text x={xPrimerRotulo} y={ALTO - 2} className="fill-text-3 text-meta">
        {primerRotulo}
      </text>
      {llaveQueEntra !== null && (
        <g data-llave>
          <path
            d={`M${String(llaveQueEntra.a)} ${String(ALTO - 15)}v4H${String(llaveQueEntra.b)}v-4`}
            fill="none"
            strokeWidth={1}
            className="stroke-text-3"
          />
          <text x={llaveQueEntra.b} y={ALTO - 1} textAnchor="end" className="fill-text-2 text-meta">
            {llaveQueEntra.rotulo}
          </text>
        </g>
      )}
    </svg>
  );
}

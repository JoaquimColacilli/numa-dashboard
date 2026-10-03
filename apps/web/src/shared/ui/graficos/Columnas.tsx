import {
  anchoDeLaColumna,
  caminoDeLaColumna,
  CANALETA_DEL_EJE,
  lugaresQueEntran,
  rotuloVisible,
  techoRedondo,
} from '@/shared/lib';

import type { Eleccion } from './eleccion';
import { anchoDelTexto, useAnchoDelLienzo } from './lienzo';
import { MarcasExplorables } from './MarcasExplorables';
import { altoUtilDeLasColumnas, type MarcaExplorable } from './medidas';

export interface ColumnaDelGrafico {
  clave: string;
  etiqueta: string;
  anio: string | null;
  valor: number;
  valorTexto: string;
  enPeriodo: boolean;
  enCurso: boolean;
  sinRegistro: boolean;
  nombre: string;
}

export interface ColumnasProps {
  nombre: string;
  columnas: readonly ColumnaDelGrafico[];
  eleccion: Eleccion;
  formatoDelEje: (valor: number) => string;
  sinRegistro: string;
  nota?: string | null;
  alAbrir?: (clave: string) => void;
}

const ARRIBA = 22;
const ABAJO = 30;
const RADIO = 4;

export function Columnas({ nota = null, ...props }: ColumnasProps) {
  const [medirAl, ancho] = useAnchoDelLienzo();
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div
        ref={medirAl}
        className="relative w-full min-w-0"
        style={{ minHeight: ARRIBA + altoUtilDeLasColumnas(0) + ABAJO }}
      >
        {ancho > 0 && <DibujoDeLasColumnas {...props} ancho={ancho} />}
      </div>
      {nota !== null && <p className="text-meta text-text-3">{nota}</p>}
    </div>
  );
}

type DibujoProps = Omit<ColumnasProps, 'nota'> & { ancho: number };

function DibujoDeLasColumnas({
  nombre,
  columnas: todas,
  eleccion,
  formatoDelEje,
  sinRegistro,
  alAbrir,
  ancho,
}: DibujoProps) {
  const columnas = todas.slice(
    todas.length - lugaresQueEntran(ancho - CANALETA_DEL_EJE, todas.length),
  );
  const cantidad = columnas.length;
  const altoUtil = altoUtilDeLasColumnas(ancho);
  const alto = ARRIBA + altoUtil + ABAJO;
  const conDato = columnas.filter((columna) => !columna.sinRegistro);
  const techo = techoRedondo(Math.max(1, ...conDato.map((columna) => columna.valor)));
  const menor = Math.min(0, ...conDato.map((columna) => columna.valor));
  const piso = menor < 0 ? -techoRedondo(-menor) : 0;
  const banda = (ancho - CANALETA_DEL_EJE) / Math.max(1, cantidad);
  const anchoDeColumna = anchoDeLaColumna(banda);
  const y = (valor: number) => ARRIBA + ((techo - valor) / (techo - piso)) * altoUtil;
  const base = y(0);
  const centro = (indice: number) => CANALETA_DEL_EJE + banda * indice + banda / 2;
  const primeraConDato = columnas.findIndex((columna) => !columna.sinRegistro);
  const mayor = conDato.reduce<ColumnaDelGrafico | null>(
    (hasta, columna) => (columna.valor > (hasta?.valor ?? 0) ? columna : hasta),
    null,
  );
  const marcasDelEje = piso < 0 ? [piso, 0, techo / 2, techo] : [0, techo / 2, techo];

  const marcas: MarcaExplorable[] = columnas.flatMap((columna, indice) =>
    columna.sinRegistro
      ? []
      : [
          {
            clave: columna.clave,
            nombre: columna.nombre,
            izquierda: CANALETA_DEL_EJE + banda * indice,
            arriba: 0,
            ancho: banda,
            alto,
          },
        ],
  );

  const finDelVacio = CANALETA_DEL_EJE + primeraConDato * banda - 4;
  const inicioDelVacio = CANALETA_DEL_EJE + 2;
  const conTextoDelVacio = finDelVacio - inicioDelVacio >= anchoDelTexto(sinRegistro) + 8;

  return (
    <div className="relative" style={{ height: alto }}>
      <svg
        aria-hidden
        focusable="false"
        width={ancho}
        height={alto}
        className="block overflow-visible"
      >
        {marcasDelEje.map((marca) => (
          <g key={marca}>
            <line
              x1={CANALETA_DEL_EJE}
              x2={ancho}
              y1={y(marca)}
              y2={y(marca)}
              strokeWidth={1}
              className={marca === 0 ? 'stroke-border' : 'stroke-hairline'}
            />
            <text x={0} y={y(marca) + 4} className="fill-text-3 text-meta tabular-nums">
              {formatoDelEje(marca)}
            </text>
          </g>
        ))}

        {primeraConDato > 0 && finDelVacio > inicioDelVacio && (
          <g data-vacio>
            <line
              x1={inicioDelVacio}
              x2={finDelVacio}
              y1={base}
              y2={base}
              strokeWidth={2}
              className="stroke-paper"
            />
            <line
              x1={inicioDelVacio}
              x2={finDelVacio}
              y1={base}
              y2={base}
              strokeWidth={1}
              strokeDasharray="2 3"
              className="stroke-contexto"
            />
            {conTextoDelVacio && (
              <text
                x={(inicioDelVacio + finDelVacio) / 2}
                y={base - 10}
                textAnchor="middle"
                className="fill-text-3 text-meta"
              >
                {sinRegistro}
              </text>
            )}
          </g>
        )}

        {columnas.map((columna, indice) => {
          if (columna.sinRegistro) return null;
          const cx = centro(indice);
          const x = cx - anchoDeColumna / 2;
          const mostrada = columna.clave === eleccion.mostrada;
          const tinta = columna.enPeriodo ? 'fill-ink' : 'fill-contexto';
          const negativo = columna.valor < 0;
          const altoDeLaColumna = Math.abs(y(columna.valor) - base);
          const arribaDeLaColumna = negativo ? base : y(columna.valor);
          const camino = caminoDeLaColumna(
            x,
            arribaDeLaColumna,
            anchoDeColumna,
            altoDeLaColumna,
            RADIO,
            negativo,
          );
          const conValor = mostrada || columna.clave === mayor?.clave;
          return (
            <g key={columna.clave} data-columna={columna.clave}>
              {mostrada && (
                <rect
                  data-franja
                  x={cx - banda / 2 + 1}
                  y={ARRIBA - 18}
                  width={banda - 2}
                  height={altoUtil + 22}
                  rx={8}
                  className="fill-ink/6"
                />
              )}
              {columna.enCurso ? (
                altoDeLaColumna > 0 ? (
                  <>
                    <path d={camino} className={`${tinta} opacity-18`} />
                    <path
                      d={caminoDeLaColumna(
                        x + 0.75,
                        arribaDeLaColumna + (negativo ? 0 : 0.75),
                        anchoDeColumna - 1.5,
                        altoDeLaColumna - 0.75,
                        RADIO,
                        negativo,
                      )}
                      fill="none"
                      strokeWidth={1.25}
                      strokeDasharray="4 3"
                      className="stroke-ink"
                    />
                  </>
                ) : (
                  <line
                    x1={x}
                    x2={x + anchoDeColumna}
                    y1={base - 1}
                    y2={base - 1}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    className="stroke-ink"
                  />
                )
              ) : altoDeLaColumna < 2 ? (
                <line
                  x1={x}
                  x2={x + anchoDeColumna}
                  y1={base - 1}
                  y2={base - 1}
                  strokeWidth={2}
                  className={columna.enPeriodo ? 'stroke-ink' : 'stroke-contexto'}
                />
              ) : (
                <path d={camino} className={tinta} />
              )}
              {conValor && columna.valor !== 0 && (
                <text
                  x={cx}
                  y={negativo ? base + altoDeLaColumna + 14 : y(columna.valor) - 6}
                  textAnchor="middle"
                  className="fill-ink text-meta font-semibold tabular-nums"
                >
                  {columna.valorTexto}
                </text>
              )}
            </g>
          );
        })}

        {columnas.map((columna, indice) => {
          const fuerte = columna.enPeriodo || columna.clave === eleccion.mostrada;
          const visible = rotuloVisible(indice, cantidad, banda, fuerte);
          const anterior = columnas[indice - 1];
          const empiezaElAnio =
            columna.anio !== null &&
            (indice === Math.max(0, primeraConDato) || anterior?.anio !== columna.anio);
          const lugarDelAnio = visible || indice + 1 >= cantidad ? indice : indice + 1;
          return (
            <g key={columna.clave}>
              {visible && (
                <text
                  x={centro(indice)}
                  y={ARRIBA + altoUtil + 16}
                  textAnchor="middle"
                  className={`text-meta ${fuerte ? 'fill-ink font-semibold' : 'fill-text-3'}`}
                >
                  {columna.enCurso ? `${columna.etiqueta}*` : columna.etiqueta}
                </text>
              )}
              {empiezaElAnio && !columna.sinRegistro && (
                <text
                  x={centro(lugarDelAnio)}
                  y={ARRIBA + altoUtil + 28}
                  textAnchor="middle"
                  className="fill-text-3 text-meta"
                >
                  {columna.anio}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <MarcasExplorables
        nombre={nombre}
        marcas={marcas}
        eleccion={eleccion}
        modo="horizontal"
        alAbrir={alAbrir}
      />
    </div>
  );
}

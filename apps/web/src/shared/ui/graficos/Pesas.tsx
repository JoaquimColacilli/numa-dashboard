import { ejeDeDecenas, escalaLineal, marcasCada } from '@/shared/lib';

import { useAnchoDelLienzo } from './lienzo';
import { ANCHO_DE_LAS_PESAS_ANGOSTAS, nombreQueEntra } from './medidas';

export interface PesaDelGrafico {
  clave: string;
  nombre: string;
  estimado: number;
  real: number;
  realTexto: string;
  descripcion: string;
}

export interface PesasProps {
  filas: readonly PesaDelGrafico[];
  formatoDelEje: (valor: number) => string;
}

export function Pesas({ filas, formatoDelEje }: PesasProps) {
  const [medirAl, ancho] = useAnchoDelLienzo();
  return (
    <div ref={medirAl} className="w-full min-w-0">
      {ancho > 0 && filas.length > 0 && (
        <DibujoDeLasPesas filas={filas} formatoDelEje={formatoDelEje} ancho={ancho} />
      )}
      <ul className="sr-only">
        {filas.map((fila) => (
          <li key={fila.clave}>{fila.descripcion}</li>
        ))}
      </ul>
    </div>
  );
}

function DibujoDeLasPesas({ filas, formatoDelEje, ancho }: PesasProps & { ancho: number }) {
  const angosto = ancho < ANCHO_DE_LAS_PESAS_ANGOSTAS;
  const columnaDelNombre = angosto ? 0 : Math.min(200, ancho * 0.36);
  const inicio = columnaDelNombre + (angosto ? 4 : 12);
  const fin = ancho - 34;
  const altoDeLaFila = angosto ? 44 : 30;
  const altoDeLasFilas = filas.length * altoDeLaFila;
  const [desde, hasta] = ejeDeDecenas(filas.flatMap((fila) => [fila.estimado, fila.real]));
  const x = escalaLineal([desde, hasta], [inicio, fin]);
  const marcas = marcasCada(hasta, 10, desde);

  return (
    <svg
      aria-hidden
      focusable="false"
      width={ancho}
      height={altoDeLasFilas + 24}
      className="block overflow-visible"
    >
      {marcas.map((marca) => (
        <g key={marca}>
          {angosto ? (
            filas.map((fila, indice) => (
              <line
                key={fila.clave}
                x1={x(marca)}
                x2={x(marca)}
                y1={indice * altoDeLaFila + 21}
                y2={indice * altoDeLaFila + 39}
                strokeWidth={1}
                className="stroke-hairline"
              />
            ))
          ) : (
            <line
              x1={x(marca)}
              x2={x(marca)}
              y1={0}
              y2={altoDeLasFilas}
              strokeWidth={1}
              className="stroke-hairline"
            />
          )}
          <text
            x={x(marca)}
            y={altoDeLasFilas + 16}
            textAnchor="middle"
            className="fill-text-3 text-meta tabular-nums"
          >
            {formatoDelEje(marca)}
          </text>
        </g>
      ))}
      {filas.map((fila, indice) => {
        const arriba = indice * altoDeLaFila;
        const cy = angosto ? arriba + 30 : arriba + altoDeLaFila / 2;
        return (
          <g key={fila.clave} data-pesa={fila.clave}>
            <text
              x={angosto ? inicio - 4 : 0}
              y={angosto ? arriba + 14 : cy + 4}
              className="fill-ink text-label"
            >
              {angosto ? fila.nombre : nombreQueEntra(fila.nombre, columnaDelNombre - 8)}
            </text>
            <line
              x1={x(fila.estimado)}
              x2={x(fila.real)}
              y1={cy}
              y2={cy}
              strokeWidth={2}
              className="stroke-ink opacity-35"
            />
            <circle
              data-estimado
              cx={x(fila.estimado)}
              cy={cy}
              r={4.25}
              strokeWidth={1.5}
              className="fill-paper stroke-ink"
            />
            <circle
              data-real
              cx={x(fila.real)}
              cy={cy}
              r={5}
              strokeWidth={2}
              className="fill-ink stroke-paper"
            />
            <text
              x={ancho}
              y={cy + 4}
              textAnchor="end"
              className="fill-ink text-meta font-semibold tabular-nums"
            >
              {fila.realTexto}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

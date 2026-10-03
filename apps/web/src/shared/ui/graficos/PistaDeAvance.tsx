import { useAnchoDelLienzo } from './lienzo';

export interface PistaDeAvanceProps {
  dias: number;
  prometido: number | null;
  mediana: number | null;
  maximo: number;
}

const ALTO = 18;
const MEDIO = ALTO / 2;

export function PistaDeAvance(props: PistaDeAvanceProps) {
  const [medirAl, ancho] = useAnchoDelLienzo();
  return (
    <div ref={medirAl} className="w-full min-w-0" style={{ height: ALTO }}>
      {ancho > 0 && <DibujoDeLaPista {...props} ancho={ancho} />}
    </div>
  );
}

function DibujoDeLaPista({
  dias,
  prometido,
  mediana,
  maximo,
  ancho,
}: PistaDeAvanceProps & { ancho: number }) {
  const tope = Math.max(1, maximo);
  const x = (valor: number) => (Math.min(Math.max(0, valor), tope) / tope) * (ancho - 2) + 1;
  const hoy = x(dias);
  const punta = Math.min(3, Math.max(0, hoy - 1));
  return (
    <svg
      aria-hidden
      focusable="false"
      width={ancho}
      height={ALTO}
      className="block overflow-visible"
    >
      <line
        x1={1}
        x2={ancho - 1}
        y1={MEDIO}
        y2={MEDIO}
        strokeWidth={1}
        className="stroke-hairline"
      />
      {mediana !== null && (
        <line
          data-mediana
          x1={x(mediana)}
          x2={x(mediana)}
          y1={0}
          y2={ALTO}
          strokeWidth={1}
          strokeDasharray="6 2 1.5 2"
          className="stroke-ink"
        />
      )}
      {hoy > 1 && (
        <path
          data-hasta-hoy
          d={`M1 ${String(MEDIO - 3)}H${String(hoy - punta)}Q${String(hoy)} ${String(MEDIO - 3)} ${String(hoy)} ${String(MEDIO)}Q${String(hoy)} ${String(MEDIO + 3)} ${String(hoy - punta)} ${String(MEDIO + 3)}H1Z`}
          className="fill-ink"
        />
      )}
      {prometido !== null && (
        <>
          {x(prometido) > hoy + 3 && (
            <line
              data-hasta-lo-prometido
              x1={hoy + 3}
              x2={x(prometido)}
              y1={MEDIO}
              y2={MEDIO}
              strokeWidth={1.25}
              strokeDasharray="4 3"
              className="stroke-ink"
            />
          )}
          <path
            data-prometido
            d={`M${String(x(prometido))} 3v12`}
            strokeWidth={1.5}
            className="stroke-ink"
          />
        </>
      )}
    </svg>
  );
}

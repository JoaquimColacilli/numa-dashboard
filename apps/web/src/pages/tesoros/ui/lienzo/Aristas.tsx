import { EdgeLabelRenderer, getSmoothStepPath, Position, type EdgeProps } from '@xyflow/react';
import { useContext } from 'react';

import { formatearPesos } from '@/shared/lib';
import { Icono } from '@/shared/ui';

import { PUNTA_DE_LA_FLECHA as PUNTA, type AristaDelPlano } from '../../model/disposicion';
import { RotuloDelFlujo } from '../Fichas';
import { ContextoDeLasAristas } from './contextos';

const MEDIA_PUNTA = 4.5;

function punta(x: number, y: number, hacia: Position): string {
  if (hacia === Position.Left) {
    return `${String(x - PUNTA)},${String(y - MEDIA_PUNTA)} ${String(x - PUNTA)},${String(y + MEDIA_PUNTA)} ${String(x)},${String(y)}`;
  }
  return `${String(x - MEDIA_PUNTA)},${String(y - PUNTA)} ${String(x + MEDIA_PUNTA)},${String(y - PUNTA)} ${String(x)},${String(y)}`;
}

export function AristaDePlata({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<AristaDelPlano>) {
  const { sumarEn } = useContext(ContextoDeLasAristas);
  const deCostado = targetPosition === Position.Left;
  const [camino, xMedio, yMedio] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX: deCostado ? targetX - PUNTA : targetX,
    targetY: deCostado ? targetY : targetY - PUNTA,
    sourcePosition,
    targetPosition,
    borderRadius: 10,
    offset: 20,
    centerY: data?.centro,
  });
  if (data === undefined) return null;

  const probando = data.monto !== null;
  const conBanda = probando && !data.vacia && data.grosor > 2;
  const tinta = probando && !data.vacia ? 'var(--color-ink)' : 'var(--color-text-3)';
  const lugar = data.lugar;
  const conBoton = data.armando && lugar !== null && sumarEn !== null;
  const horizontal = data.tramo === 'hacia-el-reparto' || data.tramo === 'hacia-los-insumos';

  let xDeLaEtiqueta = xMedio;
  let yDeLaEtiqueta = yMedio;
  let corrimiento = '-50%, -50%';
  if (data.tramo === 'reparto') {
    xDeLaEtiqueta = targetX;
    yDeLaEtiqueta = targetY - 19;
  } else if (horizontal) {
    xDeLaEtiqueta = (sourceX + targetX) / 2;
    corrimiento = conBoton ? '-50%, calc(-100% - 16px)' : '-50%, calc(-100% - 6px)';
  } else if (conBoton) {
    corrimiento = '18px, -50%';
  }
  const xDelBoton = horizontal ? xDeLaEtiqueta : xMedio;
  const montoAparte = horizontal && data.monto !== null;

  return (
    <>
      {conBanda && (
        <path
          d={camino}
          fill="none"
          stroke="color-mix(in srgb, var(--color-ink) 17%, var(--color-lamina))"
          strokeWidth={data.grosor}
          strokeLinejoin="round"
        />
      )}
      <path
        d={camino}
        fill="none"
        stroke={tinta}
        strokeWidth={probando && !data.vacia ? 1.25 : 1.5}
        strokeDasharray={data.vacia ? '4 3' : undefined}
        className="react-flow__edge-path"
      />
      <polygon points={punta(targetX, targetY, targetPosition)} fill={tinta} />
      <EdgeLabelRenderer>
        {data.flujo !== null ? (
          <>
            <div
              className="nodrag nopan absolute"
              style={{
                transform: `translate(${corrimiento}) translate(${String(xDeLaEtiqueta)}px, ${String(yDeLaEtiqueta)}px)`,
              }}
            >
              <RotuloDelFlujo flujo={data.flujo} monto={montoAparte ? null : data.monto} enLienzo />
            </div>
            {montoAparte && data.monto !== null && (
              <div
                className={`nodrag nopan absolute rounded-control border bg-paper px-1.5 py-px text-badge whitespace-nowrap tabular-nums ${
                  data.vacia
                    ? 'border-hairline text-text-3'
                    : 'border-ink/30 font-semibold text-ink'
                }`}
                style={{
                  transform: `translate(-50%, ${conBoton ? '16px' : '6px'}) translate(${String(xDeLaEtiqueta)}px, ${String(yDeLaEtiqueta)}px)`,
                }}
              >
                {formatearPesos(data.monto)}
              </div>
            )}
          </>
        ) : (
          data.etiqueta !== null && (
            <div
              aria-hidden
              className={`nodrag nopan absolute rounded-control border bg-paper px-1.5 py-px text-badge whitespace-nowrap tabular-nums ${
                probando && data.vacia
                  ? 'border-hairline text-text-3'
                  : probando
                    ? 'border-ink/30 font-semibold text-ink'
                    : 'border-hairline font-semibold text-ink'
              }`}
              style={{
                transform: `translate(${corrimiento}) translate(${String(xDeLaEtiqueta)}px, ${String(yDeLaEtiqueta)}px)`,
              }}
            >
              {data.etiqueta}
            </div>
          )
        )}
        {conBoton && (
          <button
            type="button"
            aria-label="Sumar un tesoro acá"
            title="Sumar un tesoro acá"
            className="nodrag nopan pointer-events-auto absolute flex size-6 items-center justify-center rounded-pill border border-ink bg-paper text-ink before:absolute before:-inset-2.5 hover:bg-ink hover:text-paper"
            style={{
              transform: `translate(-50%, -50%) translate(${String(xDelBoton)}px, ${String(yMedio)}px)`,
            }}
            onClick={(evento) => {
              sumarEn(lugar, evento.currentTarget);
            }}
          >
            <Icono nombre="plus" tamano={14} grosor={2} />
          </button>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

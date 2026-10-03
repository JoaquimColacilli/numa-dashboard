import { AREA_DE_UN_PUNTO, cota, escalaLineal, marcasCada, pisosDeLosPuntos } from '@/shared/lib';

import type { Eleccion } from './eleccion';
import { anchoDelTexto, useAnchoDelLienzo } from './lienzo';
import { MarcasExplorables } from './MarcasExplorables';
import {
  ANCHO_DE_LOS_RENGLONES_ANGOSTOS,
  lineaBaseDelEje,
  PISO_DE_LOS_PUNTOS,
  RADIO_DEL_PUNTO,
  type MarcaExplorable,
} from './medidas';

export type FormaDelPunto = 'a-tiempo' | 'tarde' | 'sin-fecha';

export interface PuntoDelEje {
  clave: string;
  dias: number;
  forma: FormaDelPunto;
  etiqueta: string | null;
  nombre: string;
}

export interface MedianaDelEje {
  dias: number;
  texto: string;
}

export interface CotaDelEje {
  desde: number;
  hasta: number;
  texto: string;
}

export interface PuntosEnUnEjeProps {
  nombre: string;
  puntos: readonly PuntoDelEje[];
  maximo: number;
  mediana: MedianaDelEje | null;
  cota: CotaDelEje | null;
  eleccion: Eleccion;
  alAbrir?: (clave: string) => void;
}

const SEPARACION = RADIO_DEL_PUNTO * 2 + 2;
const MARGEN = 8;
const FLECHA_DE_LA_COTA = 12;

export function PuntosEnUnEje(props: PuntosEnUnEjeProps) {
  const [medirAl, ancho] = useAnchoDelLienzo();
  return (
    <div ref={medirAl} className="relative w-full min-w-0" style={{ minHeight: 124 }}>
      {ancho > 0 && <DibujoDeLosPuntos {...props} ancho={ancho} />}
    </div>
  );
}

function DibujoDeLosPuntos({
  nombre,
  puntos,
  maximo,
  mediana,
  cota: laCota,
  eleccion,
  alAbrir,
  ancho,
}: PuntosEnUnEjeProps & { ancho: number }) {
  const x = escalaLineal([0, maximo], [MARGEN, ancho - MARGEN]);
  const xs = puntos.map((punto) => x(punto.dias));
  const pisos = pisosDeLosPuntos(xs, SEPARACION);
  const lineaBase = lineaBaseDelEje(Math.max(0, ...pisos));
  const ubicados = puntos.map((punto, indice) => ({
    ...punto,
    cx: xs[indice] ?? 0,
    cy: lineaBase - 10 - (pisos[indice] ?? 0) * PISO_DE_LOS_PUNTOS,
  }));
  const medio = AREA_DE_UN_PUNTO / 2;
  const marcas: MarcaExplorable[] = ubicados.map((punto) => ({
    clave: punto.clave,
    nombre: punto.nombre,
    izquierda: punto.cx - medio,
    arriba: punto.cy - medio,
    ancho: AREA_DE_UN_PUNTO,
    alto: AREA_DE_UN_PUNTO,
  }));

  const xMediana = mediana === null ? 0 : x(mediana.dias);
  const medianaALaIzquierda =
    mediana !== null && xMediana + 6 + anchoDelTexto(mediana.texto) > ancho;
  const yCota = lineaBase + 36;
  const caminos = laCota === null ? null : cota(x(laCota.desde), x(laCota.hasta), yCota);
  const anchoDelRotulo = laCota === null ? 0 : anchoDelTexto(laCota.texto) + 12;
  const largoDeLaCota = laCota === null ? 0 : x(laCota.hasta) - x(laCota.desde);
  const rotuloAdentro = anchoDelRotulo + 2 * FLECHA_DE_LA_COTA <= largoDeLaCota;
  const medioDeLaCota =
    laCota === null
      ? 0
      : Math.min(
          Math.max((x(laCota.desde) + x(laCota.hasta)) / 2, anchoDelRotulo / 2),
          ancho - anchoDelRotulo / 2,
        );
  const alto = lineaBase + (laCota === null ? 26 : rotuloAdentro ? 58 : 72);

  return (
    <div className="relative" style={{ height: alto }}>
      <svg
        aria-hidden
        focusable="false"
        width={ancho}
        height={alto}
        className="block overflow-visible"
      >
        <line
          x1={MARGEN}
          x2={ancho - MARGEN}
          y1={lineaBase}
          y2={lineaBase}
          strokeWidth={1}
          className="stroke-border"
        />
        {marcasCada(maximo, 10).map((marca) => (
          <g key={marca}>
            <line
              x1={x(marca)}
              x2={x(marca)}
              y1={lineaBase}
              y2={lineaBase + 4}
              strokeWidth={1}
              className="stroke-border"
            />
            <text
              x={x(marca)}
              y={lineaBase + 16}
              textAnchor="middle"
              className="fill-text-3 text-meta tabular-nums"
            >
              {String(marca)}
            </text>
          </g>
        ))}
        {mediana !== null && (
          <g data-mediana>
            <line
              x1={xMediana}
              x2={xMediana}
              y1={8}
              y2={lineaBase + 2}
              strokeWidth={1}
              strokeDasharray="12 3 2 3"
              className="stroke-ink"
            />
            <text
              x={medianaALaIzquierda ? xMediana - 6 : xMediana + 6}
              y={12}
              textAnchor={medianaALaIzquierda ? 'end' : 'start'}
              className="fill-ink text-meta font-semibold"
            >
              {mediana.texto}
            </text>
          </g>
        )}
        {ubicados.map((punto) => {
          const mostrado = punto.clave === eleccion.mostrada;
          return (
            <g key={punto.clave} data-punto={punto.clave}>
              {mostrado && (
                <circle
                  data-realce
                  cx={punto.cx}
                  cy={punto.cy}
                  r={RADIO_DEL_PUNTO + 4}
                  className="fill-ink/6 stroke-ink"
                  strokeWidth={1.25}
                />
              )}
              {punto.forma === 'a-tiempo' ? (
                <circle
                  cx={punto.cx}
                  cy={punto.cy}
                  r={RADIO_DEL_PUNTO}
                  strokeWidth={2}
                  className="fill-ink stroke-paper"
                />
              ) : punto.forma === 'tarde' ? (
                <circle
                  cx={punto.cx}
                  cy={punto.cy}
                  r={RADIO_DEL_PUNTO - 0.5}
                  strokeWidth={1.5}
                  className="fill-paper stroke-ink"
                />
              ) : (
                <circle
                  cx={punto.cx}
                  cy={punto.cy}
                  r={RADIO_DEL_PUNTO - 1}
                  strokeWidth={2}
                  className="fill-contexto stroke-paper"
                />
              )}
              {punto.etiqueta !== null && (
                <text
                  x={punto.cx}
                  y={punto.cy - 10}
                  textAnchor="middle"
                  className="fill-ink text-meta font-semibold tabular-nums"
                >
                  {punto.etiqueta}
                </text>
              )}
            </g>
          );
        })}
        {laCota !== null && caminos !== null && (
          <g data-cota>
            <path d={caminos.lineas} fill="none" strokeWidth={0.9} className="stroke-text-2" />
            <path d={caminos.flechas} className="fill-text-2" />
            {rotuloAdentro && (
              <rect
                x={medioDeLaCota - anchoDelRotulo / 2}
                y={yCota - 8}
                width={anchoDelRotulo}
                height={16}
                className="fill-paper"
              />
            )}
            <text
              x={medioDeLaCota}
              y={rotuloAdentro ? yCota + 4 : yCota + 20}
              textAnchor="middle"
              className="fill-text-2 text-meta"
            >
              {laCota.texto}
            </text>
          </g>
        )}
      </svg>
      <MarcasExplorables
        nombre={nombre}
        marcas={marcas}
        eleccion={eleccion}
        modo="en-el-plano"
        alAbrir={alAbrir}
      />
    </div>
  );
}

export interface RenglonDePuntos {
  clave: string;
  nombre: string;
  detalle: string;
  dias: readonly number[];
  mediana: number;
  medianaTexto: string;
}

export interface RenglonesDePuntosProps {
  renglones: readonly RenglonDePuntos[];
  maximo: number;
}

const COLUMNA_DEL_NOMBRE = 110;
const COLUMNA_DEL_VALOR = 70;

export function RenglonesDePuntos({ renglones, maximo }: RenglonesDePuntosProps) {
  const [medirAl, ancho] = useAnchoDelLienzo();
  const angosto = ancho < ANCHO_DE_LOS_RENGLONES_ANGOSTOS;
  const anchoDeLaPista = Math.max(
    0,
    ancho - (angosto ? 0 : COLUMNA_DEL_NOMBRE + 8) - COLUMNA_DEL_VALOR - 8,
  );
  const x = escalaLineal([0, maximo], [4, anchoDeLaPista - 4]);
  return (
    <ul ref={medirAl} className="flex list-none flex-col gap-2 p-0">
      {renglones.map((renglon) => (
        <li
          key={renglon.clave}
          className={`grid items-center gap-x-2 gap-y-0.5 ${
            angosto
              ? 'grid-cols-[minmax(0,1fr)_4.375rem]'
              : 'grid-cols-[6.875rem_minmax(0,1fr)_4.375rem]'
          }`}
        >
          <span
            translate="no"
            className={`min-w-0 truncate text-label text-ink ${angosto ? 'col-span-2' : ''}`}
          >
            {angosto ? `${renglon.nombre} · ${renglon.detalle}` : renglon.nombre}
          </span>
          <svg
            aria-hidden
            focusable="false"
            width={anchoDeLaPista}
            height={18}
            className="block overflow-visible"
          >
            {anchoDeLaPista > 0 && (
              <>
                <line
                  x1={4}
                  x2={anchoDeLaPista - 4}
                  y1={9}
                  y2={9}
                  strokeWidth={1}
                  className="stroke-hairline"
                />
                {renglon.dias.map((dias, indice) => (
                  <circle
                    key={indice}
                    cx={x(dias)}
                    cy={9}
                    r={4}
                    strokeWidth={1.5}
                    className="fill-ink stroke-paper"
                  />
                ))}
                <line
                  data-mediana
                  x1={x(renglon.mediana)}
                  x2={x(renglon.mediana)}
                  y1={0}
                  y2={18}
                  strokeWidth={1}
                  strokeDasharray="6 2 1.5 2"
                  className="stroke-ink"
                />
              </>
            )}
          </svg>
          <span className="text-right text-meta font-semibold text-ink tabular-nums">
            {renglon.medianaTexto}
          </span>
        </li>
      ))}
    </ul>
  );
}

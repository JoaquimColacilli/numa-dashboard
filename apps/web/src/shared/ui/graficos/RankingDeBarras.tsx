import type { CSSProperties, ReactNode } from 'react';

export interface RenglonDelRanking {
  clave: string;
  nombre: string;
  valor: number;
  valorTexto: ReactNode;
  sinDato?: boolean;
  esDato?: boolean;
}

export interface GrupoDelRanking {
  clave: string;
  nombre: string | null;
  totalTexto?: ReactNode;
  renglones: readonly RenglonDelRanking[];
}

export type FormaDelRanking = 'en-una-linea' | 'nombre-arriba';

export interface RankingDeBarrasProps {
  grupos: readonly GrupoDelRanking[];
  forma: FormaDelRanking;
}

const RENGLON: Readonly<Record<FormaDelRanking, string>> = {
  'en-una-linea':
    'grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2.5 gap-y-1 [grid-template-areas:"nombre_valor"_"barra_barra"] @min-[20rem]/ranking:grid-cols-[6.5rem_minmax(0,1fr)_max(6.25rem,var(--ancho-del-valor,0px))] @min-[20rem]/ranking:items-center @min-[20rem]/ranking:[grid-template-areas:"nombre_barra_valor"]',
  'nombre-arriba':
    'grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2.5 gap-y-1 [grid-template-areas:"nombre_valor"_"barra_barra"] @min-[30rem]/ranking:grid-cols-[8.5rem_minmax(0,1fr)_6.5rem] @min-[30rem]/ranking:items-center @min-[30rem]/ranking:[grid-template-areas:"nombre_barra_valor"]',
};

function largoDelTexto(texto: ReactNode): number {
  return typeof texto === 'string' ? texto.length : 0;
}

export function RankingDeBarras({ grupos, forma }: RankingDeBarrasProps) {
  const tope = Math.max(
    1,
    ...grupos.flatMap((grupo) => grupo.renglones.map((renglon) => Math.abs(renglon.valor))),
  );
  const largo = Math.max(
    0,
    ...grupos.flatMap((grupo) =>
      grupo.renglones.map((renglon) => largoDelTexto(renglon.valorTexto)),
    ),
  );
  const ancho: CSSProperties & Record<'--ancho-del-valor', string> = {
    '--ancho-del-valor': `${String(largo)}ch`,
  };
  return (
    <ul style={ancho} className="@container/ranking flex list-none flex-col gap-2.5 p-0">
      {grupos.map((grupo) => [
        grupo.nombre === null ? null : (
          <li
            key={`grupo-${grupo.clave}`}
            className="flex items-baseline justify-between gap-3 pt-1 text-label font-semibold"
          >
            <span>{grupo.nombre}</span>
            <span className="tabular-nums">{grupo.totalTexto}</span>
          </li>
        ),
        ...grupo.renglones.map((renglon) => (
          <li key={`${grupo.clave}-${renglon.clave}`} className={RENGLON[forma]}>
            <span
              translate={renglon.esDato === true ? 'no' : undefined}
              className={`min-w-0 truncate text-body-sm [grid-area:nombre] ${
                renglon.sinDato === true ? 'text-text-2' : 'text-ink'
              }`}
            >
              {renglon.nombre}
            </span>
            <span aria-hidden className="relative h-1.5 [grid-area:barra]">
              <span
                data-barra
                style={{ width: `${String(Math.max(1, (Math.abs(renglon.valor) / tope) * 100))}%` }}
                className={`absolute inset-y-0 left-0 min-w-0.5 rounded-r-[4px] ${
                  renglon.sinDato === true
                    ? 'shadow-[inset_0_0_0_1.25px_var(--color-text-3)]'
                    : 'bg-ink'
                }`}
              />
            </span>
            <span className="text-right text-label font-semibold whitespace-nowrap text-ink tabular-nums [grid-area:valor]">
              {renglon.valorTexto}
            </span>
          </li>
        )),
      ])}
    </ul>
  );
}

import type { ReactNode } from 'react';

export type FormaDeCaso = 'lleno' | 'hueco' | 'cruz' | 'contexto';

export function Forma({ forma, radio = 4 }: { forma: FormaDeCaso; radio?: number }) {
  const lado = radio * 2 + 3;
  const medio = lado / 2;
  return (
    <svg
      aria-hidden
      focusable="false"
      width={lado}
      height={lado}
      data-forma={forma}
      className="block flex-none"
    >
      {forma === 'lleno' && <circle cx={medio} cy={medio} r={radio} className="fill-ink" />}
      {forma === 'hueco' && (
        <circle
          cx={medio}
          cy={medio}
          r={radio - 0.75}
          strokeWidth={1.5}
          className="fill-paper stroke-ink"
        />
      )}
      {forma === 'contexto' && (
        <circle cx={medio} cy={medio} r={radio - 1} className="fill-contexto" />
      )}
      {forma === 'cruz' && (
        <path
          d={`M${String(medio - radio + 1)} ${String(medio - radio + 1)}L${String(medio + radio - 1)} ${String(medio + radio - 1)}M${String(medio + radio - 1)} ${String(medio - radio + 1)}L${String(medio - radio + 1)} ${String(medio + radio - 1)}`}
          fill="none"
          strokeWidth={1.75}
          strokeLinecap="round"
          className="stroke-ink"
        />
      )}
    </svg>
  );
}

export interface GrupoDeCasos {
  clave: string;
  forma: Exclude<FormaDeCaso, 'contexto'>;
  cantidad: number;
  rotulo: ReactNode;
}

export interface PuntosDeCasosProps {
  nombre: string;
  grupos: readonly GrupoDeCasos[];
  maximoDePuntos: number;
  sinCasos: string;
}

const TRAMO: Readonly<Record<GrupoDeCasos['forma'], string>> = {
  lleno: 'bg-ink',
  cruz: 'bg-contexto',
  hueco: 'shadow-[inset_0_0_0_1.25px_var(--color-ink)]',
};

export function PuntosDeCasos({ nombre, grupos, maximoDePuntos, sinCasos }: PuntosDeCasosProps) {
  const total = grupos.reduce((suma, grupo) => suma + grupo.cantidad, 0);
  if (total > maximoDePuntos) {
    return (
      <div role="group" aria-label={nombre} className="flex flex-col gap-2">
        <div aria-hidden className="flex h-4.5 gap-0.5">
          {grupos
            .filter((grupo) => grupo.cantidad > 0)
            .map((grupo) => (
              <span
                key={grupo.clave}
                data-tramo={grupo.clave}
                style={{ flexGrow: grupo.cantidad, flexBasis: 0 }}
                className={`h-full min-w-0.5 rounded-[2px] ${TRAMO[grupo.forma]}`}
              />
            ))}
        </div>
        <ul className="flex list-none flex-wrap gap-x-4.5 gap-y-1.5 p-0">
          {grupos.map((grupo) => (
            <li key={grupo.clave} className="flex items-center gap-1.5 text-meta text-text-2">
              <Forma forma={grupo.forma} />
              <span>{grupo.rotulo}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <ul aria-label={nombre} className="flex list-none flex-wrap gap-4.5 p-0">
      {grupos.map((grupo) => (
        <li key={grupo.clave} className="flex flex-col gap-1.5">
          <span aria-hidden className="flex min-h-3 flex-wrap items-center gap-1">
            {grupo.cantidad === 0 ? (
              <span className="text-meta text-text-3">{sinCasos}</span>
            ) : (
              Array.from({ length: grupo.cantidad }, (_, indice) => (
                <Forma key={indice} forma={grupo.forma} />
              ))
            )}
          </span>
          <span className="text-meta text-text-2">{grupo.rotulo}</span>
        </li>
      ))}
    </ul>
  );
}

export type Puntito = 'lleno' | 'hueco' | 'cruz';

export function Puntitos({ puntos }: { puntos: readonly Puntito[] }) {
  if (puntos.length === 0) return null;
  return (
    <span aria-hidden className="mt-0.75 flex flex-wrap gap-0.75">
      {puntos.map((punto, indice) =>
        punto === 'cruz' ? (
          <span key={indice} data-puntito={punto} className="relative block size-2">
            <span className="absolute top-[3.25px] -left-px h-[1.5px] w-[9px] rotate-45 rounded-[1px] bg-ink" />
            <span className="absolute top-[3.25px] -left-px h-[1.5px] w-[9px] -rotate-45 rounded-[1px] bg-ink" />
          </span>
        ) : (
          <span
            key={indice}
            data-puntito={punto}
            className={`block size-2 rounded-pill ${
              punto === 'lleno' ? 'bg-ink' : 'shadow-[inset_0_0_0_1.25px_var(--color-ink)]'
            }`}
          />
        ),
      )}
    </span>
  );
}

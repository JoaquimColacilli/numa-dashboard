import { TINTA, type TintaDeTesoro } from '@/shared/lib';

export interface ParteDeLaEscala {
  tesoro: string;
  tinta: TintaDeTesoro;
  porcentaje: number;
  resto: boolean;
}

export interface EscalaDelRepartoProps {
  partes: readonly ParteDeLaEscala[];
  conNumeros?: boolean;
}

const TODO = 10_000;

export function EscalaDelReparto({ partes, conNumeros = true }: EscalaDelRepartoProps) {
  let acumulado = 0;
  const marcas = [0];
  for (const parte of partes) {
    acumulado += parte.porcentaje;
    if (parte.porcentaje > 0) marcas.push(Math.min(TODO, acumulado));
  }
  return (
    <div aria-hidden className="relative">
      <div className="flex h-2.5 overflow-hidden rounded-[2px] border border-ink">
        {partes.map((parte) =>
          parte.porcentaje <= 0 ? null : (
            <span
              key={`${parte.tesoro}-${String(parte.resto)}`}
              className={`h-full border-r border-ink last:border-r-0 ${parte.resto ? '' : TINTA[parte.tinta].fondo}`}
              style={{
                width: `${String(Math.min(TODO, parte.porcentaje) / 100)}%`,
                backgroundImage: parte.resto
                  ? `repeating-linear-gradient(135deg, ${TINTA[parte.tinta].color} 0 1px, transparent 1px 3.5px)`
                  : undefined,
              }}
            />
          ),
        )}
      </div>
      {conNumeros && (
        <div className="relative h-4 text-[10px] leading-none text-text-2 tabular-nums">
          {[...new Set(marcas)].map((marca, indice) => {
            const alFinal = marca >= TODO;
            const alPrincipio = indice === 0;
            return (
              <span
                key={marca}
                className={`absolute top-0 flex flex-col gap-0.5 ${
                  alPrincipio
                    ? 'items-start'
                    : alFinal
                      ? '-translate-x-full items-end'
                      : '-translate-x-1/2 items-center'
                }`}
                style={{ left: `${String(marca / 100)}%` }}
              >
                <span className="h-1 w-px bg-ink" />
                {String(marca / 100).replace('.', ',')}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

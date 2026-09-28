import type { EstadoDelDiezmo, Money } from '@maun/domain';

import type { TesoroDelTaller } from '@/entities/tesoro';
import { formatearPesos, TINTA, type TintaDeTesoro } from '@/shared/lib';

import { tesorosConMeta } from '../model/tesoros';

function porcentaje(parte: Money, total: Money): number {
  return total <= 0 ? 0 : Math.round((parte / total) * 100);
}

function Barra({
  etiqueta,
  texto,
  pct,
  tinta,
}: {
  etiqueta: string;
  texto: string;
  pct: number;
  tinta: TintaDeTesoro;
}) {
  const lleno = Math.min(100, Math.max(0, pct));
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-label">
        <span className="font-medium">{etiqueta}</span>
        <span className="text-text-2 tabular-nums">{texto}</span>
      </div>
      <div
        role="progressbar"
        aria-label={etiqueta}
        aria-valuenow={lleno}
        aria-valuetext={texto}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 overflow-hidden rounded-control bg-surface-2"
      >
        <div
          className={`h-full rounded-control ${TINTA[tinta].fondo}`}
          style={{ width: `${String(lleno)}%` }}
        />
      </div>
    </div>
  );
}

export interface MetasProps {
  tesoros: readonly TesoroDelTaller[];
  diezmo: EstadoDelDiezmo;
  tintaDelDiezmo: TintaDeTesoro;
}

export function Metas({ tesoros, diezmo, tintaDelDiezmo }: MetasProps) {
  return (
    <section
      aria-label="Metas"
      className="flex flex-col gap-4 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <h2 className="text-label font-semibold">Metas</h2>
      {tesorosConMeta(tesoros).map(({ tesoro, meta }) => (
        <Barra
          key={tesoro.id}
          etiqueta={tesoro.nombre}
          texto={`${formatearPesos(tesoro.saldo)} de ${formatearPesos(meta)}`}
          pct={porcentaje(tesoro.saldo, meta)}
          tinta={tesoro.tinta}
        />
      ))}
      <Barra
        etiqueta="Diezmo pagado"
        texto={`${formatearPesos(diezmo.pagado)} de ${formatearPesos(diezmo.generado)}`}
        pct={porcentaje(diezmo.pagado, diezmo.generado)}
        tinta={tintaDelDiezmo}
      />
    </section>
  );
}

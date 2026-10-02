import type { EstadoDelDiezmo } from '@maun/domain';

import type { TesoroDelTaller } from '@/entities/tesoro';
import { useMensajes } from '@/shared/idioma';
import { formatearLaPlata, formatearPesos, TINTA, type TintaDeTesoro } from '@/shared/lib';

import { tesorosConMeta } from '../model/tesoros';

function porcentaje(parte: number, total: number): number {
  return total <= 0 ? 0 : Math.round((parte / total) * 100);
}

function Barra({
  etiqueta,
  etiquetaTalCual = false,
  texto,
  pct,
  tinta,
}: {
  etiqueta: string;
  etiquetaTalCual?: boolean;
  texto: string;
  pct: number;
  tinta: TintaDeTesoro;
}) {
  const lleno = Math.min(100, Math.max(0, pct));
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-label">
        <span translate={etiquetaTalCual ? 'no' : undefined} className="font-medium">
          {etiqueta}
        </span>
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
  const m = useMensajes();
  const textos = m.paginaInicio.metas;
  return (
    <section
      aria-label={textos.titulo}
      className="flex flex-col gap-4 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <h2 className="text-label font-semibold">{textos.titulo}</h2>
      {tesorosConMeta(tesoros).map(({ tesoro, meta }) => (
        <Barra
          key={tesoro.id}
          etiqueta={tesoro.nombre}
          etiquetaTalCual
          texto={textos.deLaMeta(formatearLaPlata(tesoro.saldo), formatearLaPlata(meta))}
          pct={porcentaje(tesoro.saldo.importe, meta.importe)}
          tinta={tesoro.tinta}
        />
      ))}
      <Barra
        etiqueta={textos.diezmoPagado}
        texto={textos.deLaMeta(formatearPesos(diezmo.pagado), formatearPesos(diezmo.generado))}
        pct={porcentaje(diezmo.pagado, diezmo.generado)}
        tinta={tintaDelDiezmo}
      />
    </section>
  );
}

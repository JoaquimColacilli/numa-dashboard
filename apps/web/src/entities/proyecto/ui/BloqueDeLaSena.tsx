import type { Moneda, SenaDelTrabajo } from '@maun/domain';

import { useMensajes } from '@/shared/idioma';
import { formatearPlata, formatearPorcentaje } from '@/shared/lib';

export interface BloqueDeLaSenaProps {
  sena: SenaDelTrabajo<Moneda>;
  moneda: Moneda;
  propia: boolean;
}

function Numero({
  clave,
  valor,
  tono = '',
  dato = true,
}: {
  clave: string;
  valor: string;
  tono?: string;
  dato?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 @min-[28rem]:block">
      <dt className="text-meta text-text-2">{clave}</dt>
      <dd
        translate={dato ? 'no' : undefined}
        className={`text-body-lg font-semibold tabular-nums whitespace-nowrap @min-[28rem]:mt-0.5 ${tono}`}
      >
        {valor}
      </dd>
    </div>
  );
}

export function BloqueDeLaSena({ sena, moneda, propia }: BloqueDeLaSenaProps) {
  const textos = useMensajes().proyecto.sena;

  if (sena.situacion === 'sin-presupuesto') {
    return (
      <section
        aria-label={textos.titulo}
        className="rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
      >
        <h2 className="text-section font-semibold">{textos.titulo}</h2>
        <p className="mt-1 text-label leading-relaxed text-text-2">{textos.sinPresupuesto}</p>
      </section>
    );
  }

  const porcentaje = formatearPorcentaje(sena.porcentaje);

  return (
    <section
      aria-label={textos.titulo}
      className="@container rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-section font-semibold">{textos.titulo}</h2>
        <span className="text-meta text-text-3">
          {propia ? textos.delTrabajo(porcentaje) : textos.delTaller(porcentaje)}
        </span>
      </div>

      <dl className="mt-2.5 grid grid-cols-1 gap-1.5 @min-[28rem]:grid-cols-3 @min-[28rem]:gap-x-3">
        <Numero clave={textos.sena} valor={formatearPlata(sena.esperada, moneda)} />
        <Numero
          clave={textos.cobrado}
          valor={formatearPlata(sena.cobrado, moneda)}
          tono="text-hogar"
        />
        {sena.situacion === 'falta' ? (
          <Numero clave={textos.falta} valor={formatearPlata(sena.falta, moneda)} />
        ) : (
          <Numero clave={textos.falta} valor={textos.nada} tono="text-hogar" dato={false} />
        )}
      </dl>

      {sena.situacion === 'cubierta' && (
        <p className="mt-2 text-label leading-relaxed text-hogar">
          {sena.deMas > 0
            ? textos.cubiertaDeMas(formatearPlata(sena.deMas, moneda))
            : textos.cubierta}
        </p>
      )}
    </section>
  );
}

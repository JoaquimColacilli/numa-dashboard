import { AyudaDeLosInsumos } from '@/entities/fila';
import { fraseDeLosInsumos, type InsumosDeUnTrabajo } from '@/entities/proyecto';
import { useMensajes } from '@/shared/idioma';
import { formatearPesos } from '@/shared/lib';

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

export function InsumosDelTrabajo({ insumos }: { insumos: InsumosDeUnTrabajo }) {
  const textos = useMensajes().paginaProyectos.insumos;
  const puso = fraseDeLosInsumos(insumos);
  return (
    <section
      aria-label={textos.insumosDelTrabajo}
      className="@container rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-1.5 text-section font-semibold">
          {textos.insumos}
          <AyudaDeLosInsumos />
        </h2>
        <span className="text-meta text-text-3">{textos.enMaun}</span>
      </div>

      <dl className="mt-2.5 grid grid-cols-1 gap-1.5 @min-[28rem]:grid-cols-3 @min-[28rem]:gap-x-3">
        <Numero clave={textos.entro} valor={formatearPesos(insumos.entro)} tono="text-hogar" />
        <Numero clave={textos.gastado} valor={formatearPesos(insumos.gastado)} />
        {insumos.queda > 0 ? (
          <Numero clave={textos.queda} valor={formatearPesos(insumos.queda)} />
        ) : (
          <Numero clave={textos.queda} valor={textos.nada} tono="text-text-2" dato={false} />
        )}
      </dl>

      {puso !== null && (
        <p className="mt-2 text-label leading-relaxed font-medium text-atencion">{puso}</p>
      )}
    </section>
  );
}

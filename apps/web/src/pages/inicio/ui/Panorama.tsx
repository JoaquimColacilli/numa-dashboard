import { useMensajes } from '@/shared/idioma';
import { formatearLaPlata } from '@/shared/lib';
import { Ayuda, caracteresDe, MontoQueEntra } from '@/shared/ui';

import { cifrasDelPanorama, type PanoramaDelTaller } from '../model/panorama';

export interface PanoramaProps {
  panorama: PanoramaDelTaller;
  nombreDelSuperavit: string;
}

export function Panorama({ panorama, nombreDelSuperavit }: PanoramaProps) {
  const m = useMensajes();
  const textos = m.paginaInicio.panorama;
  const cifras = cifrasDelPanorama(panorama, nombreDelSuperavit);
  const caracteres = caracteresDe(...cifras.map((cifra) => formatearLaPlata(cifra.monto)));

  return (
    <section
      aria-label={textos.titulo}
      className="@container rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <h2 className="flex items-center gap-1.5 text-label font-semibold">
        {textos.titulo}
        <Ayuda que={textos.queEs}>{textos.ayuda}</Ayuda>
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4 @min-[34rem]:grid-cols-4 @min-[34rem]:gap-x-4">
        {cifras.map((cifra) => (
          <div
            key={cifra.id}
            data-cifra-del-panorama={cifra.id}
            className="@container row-span-3 grid min-w-0 grid-rows-subgrid gap-y-0.5"
          >
            <dt className="self-end text-meta leading-tight text-text-2">{cifra.etiqueta}</dt>
            <dd translate="no" className="flex min-w-0 flex-col">
              <MontoQueEntra
                caracteres={caracteres}
                className={`leading-tight font-semibold ${cifra.monto.importe < 0 ? 'text-alerta' : ''}`}
              >
                {formatearLaPlata(cifra.monto)}
              </MontoQueEntra>
            </dd>
            <dd className="text-meta text-text-3">
              {cifra.detalle}
              {cifra.equivalente !== null && (
                <span data-equivalente-en-pesos className="block text-text-2">
                  {cifra.equivalente}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

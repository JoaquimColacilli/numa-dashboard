import { formatearPesos } from '@/shared/lib';
import { Ayuda, caracteresDe, MontoQueEntra } from '@/shared/ui';

import { AYUDA_DEL_PANORAMA, cifrasDelPanorama, type PanoramaDelTaller } from '../model/panorama';

export interface PanoramaProps {
  panorama: PanoramaDelTaller;
  nombreDelSuperavit: string;
}

export function Panorama({ panorama, nombreDelSuperavit }: PanoramaProps) {
  const cifras = cifrasDelPanorama(panorama, nombreDelSuperavit);
  const caracteres = caracteresDe(...cifras.map((cifra) => formatearPesos(cifra.monto)));

  return (
    <section
      aria-label="Panorama"
      className="@container rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <h2 className="flex items-center gap-1.5 text-label font-semibold">
        Panorama
        <Ayuda que="Qué es el panorama">{AYUDA_DEL_PANORAMA}</Ayuda>
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4 @min-[34rem]:grid-cols-4 @min-[34rem]:gap-x-4">
        {cifras.map((cifra) => (
          <div
            key={cifra.id}
            data-cifra-del-panorama={cifra.id}
            className="@container row-span-3 grid min-w-0 grid-rows-subgrid gap-y-0.5"
          >
            <dt className="self-end text-meta leading-tight text-text-2">{cifra.etiqueta}</dt>
            <dd className="flex min-w-0 flex-col">
              <MontoQueEntra
                caracteres={caracteres}
                className={`leading-tight font-semibold ${cifra.monto < 0 ? 'text-alerta' : ''}`}
              >
                {formatearPesos(cifra.monto)}
              </MontoQueEntra>
            </dd>
            <dd className="text-meta text-text-3">{cifra.detalle}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

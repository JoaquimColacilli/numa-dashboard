import { ETIQUETAS_DE_IDIOMA, type Idioma } from '@maun/domain';

import { textosDelDocumento } from '@/shared/idioma-del-cliente';
import { IDIOMA_DE_LA_LEYENDA, LETRA_DE_ARCA, LEYENDA_DE_ARCA_EN_UNA_FRASE } from '@/shared/pdf';

export function CabeceraDelDocumento({ nombre, idioma }: { nombre: string; idioma: Idioma }) {
  const { lema, leyendaDeArca } = textosDelDocumento(idioma);
  return (
    <div
      translate="no"
      lang={ETIQUETAS_DE_IDIOMA[idioma]}
      className="flex flex-col items-start gap-2.5 @min-[16rem]/membrete:flex-row @min-[16rem]/membrete:justify-between @min-[16rem]/membrete:gap-4"
    >
      <div className="flex min-w-0 flex-col">
        <p className="font-display text-body-lg leading-tight">{nombre}</p>
        <p className="text-meta text-text-3">{lema}</p>
      </div>
      <div aria-hidden className="flex flex-none items-center gap-2">
        <span className="rotulo-del-plano w-[5.75rem] text-badge leading-tight font-semibold text-text-2 uppercase @min-[16rem]/membrete:text-right">
          <span lang={IDIOMA_DE_LA_LEYENDA}>{LEYENDA_DE_ARCA_EN_UNA_FRASE}</span>
          {leyendaDeArca.aclarar && (
            <span className="mt-0.5 block font-normal tracking-normal text-text-3 normal-case">
              {leyendaDeArca.aclaracion}
            </span>
          )}
        </span>
        <span className="flex size-8 flex-none items-center justify-center rounded-[4px] border-[1.5px] border-ink text-body-lg leading-none font-semibold">
          {LETRA_DE_ARCA}
        </span>
      </div>
    </div>
  );
}

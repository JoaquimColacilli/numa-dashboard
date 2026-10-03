import { AvisosDelDispositivo } from '@/features/recibir-avisos';
import { useMensajes } from '@/shared/idioma';
import { Ir, RUTA_DE_AJUSTES, useVolver } from '@/shared/lib';
import { Icono, Pagina } from '@/shared/ui';

export function AvisosPage() {
  const m = useMensajes();
  const vuelta = useVolver(RUTA_DE_AJUSTES, m.paginaAjustes.titulo);
  return (
    <Pagina className="gap-3 md:gap-4">
      <header className="flex flex-col items-start gap-1.5">
        <Ir
          a={RUTA_DE_AJUSTES}
          alTocar={vuelta.volver}
          className="-ml-1 flex min-h-tap items-center gap-1 rounded-pill pr-3 pl-1 text-body font-medium text-text-2 hover:bg-ink/5"
        >
          <Icono nombre="chevron-left" tamano={20} />
          {vuelta.etiqueta}
        </Ir>
        <h1 className="font-display text-h1 leading-tight lg:text-h1-lg">
          {m.paginaAjustes.avisos}
        </h1>
        <p className="max-w-[520px] text-body leading-relaxed text-text-2">
          {m.paginaAjustes.unRecordatorioConLoQueTenes}
        </p>
      </header>
      <AvisosDelDispositivo />
    </Pagina>
  );
}

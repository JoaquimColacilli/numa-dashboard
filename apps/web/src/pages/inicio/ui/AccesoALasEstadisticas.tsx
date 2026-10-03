import { useMensajes } from '@/shared/idioma';
import { Ir, RUTA_DE_LAS_ESTADISTICAS } from '@/shared/lib';
import { Icono } from '@/shared/ui';

export function AccesoALasEstadisticas() {
  const textos = useMensajes().paginaInicio.estadisticas;
  return (
    <Ir
      a={RUTA_DE_LAS_ESTADISTICAS}
      className="flex items-center gap-3 rounded-panel border border-hairline bg-paper px-4 py-3.5 text-ink no-underline hover:bg-surface"
    >
      <span
        aria-hidden
        className="flex size-10 flex-none items-center justify-center rounded-field bg-surface text-text-2"
      >
        <Icono nombre="chart-no-axes-column" tamano={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold">{textos.comoVieneElTaller}</span>
        <span className="mt-0.5 block text-label leading-snug text-text-2">
          {textos.verLasEstadisticas}
        </span>
      </span>
      <span aria-hidden className="flex-none text-text-3">
        <Icono nombre="chevron-right" tamano={18} />
      </span>
    </Ir>
  );
}

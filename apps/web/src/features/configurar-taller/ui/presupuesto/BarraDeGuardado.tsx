import { Button, Icono } from '@/shared/ui';

export interface BarraDeGuardadoProps {
  cambios: string;
  cuantos: string;
  queRevisar: string | null;
  guardando: boolean;
  alGuardar: () => void;
}

export function BarraDeGuardado({
  cambios,
  cuantos,
  queRevisar,
  guardando,
  alGuardar,
}: BarraDeGuardadoProps) {
  return (
    <div data-barra-de-guardado="" className="sticky bottom-3 z-10 mt-1 @container/barra">
      <div className="flex items-center gap-3 rounded-panel border border-hairline bg-paper py-2.5 pr-2.5 pl-4 shadow-float md:py-3 md:pr-3 md:pl-5">
        <div role="status" className="flex min-w-0 flex-1 items-start gap-2.5">
          {queRevisar === null ? (
            <>
              <Icono nombre="clock" tamano={17} className="mt-0.5 flex-none text-text-2" />
              <p className="flex min-w-0 flex-col text-label leading-snug @min-[36rem]/barra:block">
                <span className="font-semibold text-ink">Sin guardar</span>
                <span className="text-text-2 @min-[36rem]/barra:hidden">{cuantos}</span>
                <span className="hidden text-text-2 @min-[36rem]/barra:inline">: {cambios}</span>
              </p>
            </>
          ) : (
            <>
              <Icono nombre="triangle-alert" tamano={17} className="mt-0.5 flex-none text-alerta" />
              <p className="min-w-0 text-label leading-snug font-medium text-alerta">
                No se guardó: revisá {queRevisar}.
              </p>
            </>
          )}
        </div>
        <Button cargando={guardando} onClick={alGuardar} className="flex-none">
          Guardar los cambios
        </Button>
      </div>
    </div>
  );
}

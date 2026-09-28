import { ChipDelTesoro } from '@/entities/tesoro';
import { Button, FilaDeAcciones, Hoja, Icono } from '@/shared/ui';

import { FICHA_DE_LOS_INSUMOS } from '../model/fichas';
import { encabezadoDeLaFicha } from '../model/vista';
import { PanelDeDetalle, type PanelDeDetalleProps } from './PanelDeDetalle';

export interface HojaDeLaFichaProps extends Omit<
  PanelDeDetalleProps,
  'enHoja' | 'arriba' | 'conFlechas'
> {
  alCerrar: () => void;
}

export function HojaDeLaFicha({ alCerrar, ...props }: HojaDeLaFichaProps) {
  const encabezado = encabezadoDeLaFicha(props.vista, props.elegido, false);
  const tesoro = encabezado.tesoro;
  return (
    <Hoja
      titulo={encabezado.titulo}
      bajada={encabezado.bajada}
      desdeAbajo
      antes={
        tesoro === null ? (
          <span
            aria-hidden
            className="flex size-7 flex-none items-center justify-center rounded-control bg-surface-2 text-ink"
          >
            <Icono
              nombre={props.elegido === FICHA_DE_LOS_INSUMOS ? 'hand-coins' : 'split'}
              tamano={16}
            />
          </span>
        ) : (
          <ChipDelTesoro tesoro={tesoro} />
        )
      }
      alCerrar={alCerrar}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-2 md:px-6">
          <PanelDeDetalle {...props} enHoja conFlechas={false} />
        </div>
        <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
          <FilaDeAcciones>
            {tesoro !== null && props.vista.sincronizados && (
              <Button
                variant="secundario"
                onClick={() => {
                  props.alEditarTesoro(tesoro.id);
                }}
              >
                <Icono nombre="pencil" tamano={17} />
                Editar {tesoro.nombre}
              </Button>
            )}
            <Button onClick={alCerrar}>Listo</Button>
          </FilaDeAcciones>
        </footer>
      </div>
    </Hoja>
  );
}

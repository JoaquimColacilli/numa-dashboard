import { conceptoEnPantalla } from '@maun/domain';

import { useMensajes } from '@/shared/idioma';
import { diaYMes, formatearPesos, useAnchoDePantalla } from '@/shared/lib';
import { Button, Hoja } from '@/shared/ui';

import type { CobroSinFacturar } from '../model/monotributo';
import { CuerpoDeLaHoja } from './piezas';

export interface HojaDeCobrosSinFacturarProps {
  cobros: readonly CobroSinFacturar[];
  desde: string;
  hoy: string;
  alFacturar: (pagoId: string) => void;
  alCerrar: () => void;
}

export function HojaDeCobrosSinFacturar({
  cobros,
  desde,
  hoy,
  alFacturar,
  alCerrar,
}: HojaDeCobrosSinFacturarProps) {
  const m = useMensajes();
  const t = m.facturacion.cobrosSinFacturar;
  const enCelular = useAnchoDePantalla() === 'movil';
  return (
    <Hoja titulo={t.titulo} alCerrar={alCerrar} desdeAbajo={enCelular}>
      <CuerpoDeLaHoja>
        <p className="text-body-sm leading-relaxed text-text-2">
          {cobros.length === 0 ? t.vacia(desde) : t.bajada(desde)}
        </p>
        {cobros.length > 0 && (
          <ul className="flex list-none flex-col">
            {cobros.map(({ pago, proyecto }) => {
              const dia = diaYMes(pago.fecha, hoy);
              const monto = formatearPesos(pago.monto_centavos);
              return (
                <li
                  key={pago.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t border-hairline-soft py-3 first:border-t-0"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span translate="no" className="text-body-sm font-medium">
                      {pago.concepto.trim() === ''
                        ? m.paginaProyectos.ficha.pago
                        : conceptoEnPantalla(pago.concepto, m.proyecto.conceptosDeSiempre)}
                    </span>
                    <span translate="no" className="text-meta text-text-3">
                      {t.detalle(proyecto.titulo, dia)}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <span translate="no" className="text-body-sm font-semibold tabular-nums">
                      {monto}
                    </span>
                    <Button
                      variant="secundario"
                      size="chico"
                      className="max-md:min-h-tap"
                      aria-label={m.facturacion.renglon.facturarElPago(monto, dia)}
                      onClick={() => {
                        alFacturar(pago.id);
                      }}
                    >
                      {m.facturacion.renglon.facturar}
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CuerpoDeLaHoja>
    </Hoja>
  );
}

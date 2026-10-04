import { CapsulaDePrueba } from '@/entities/factura';
import type { FilaDe } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { Ir, RUTA_DE_LA_FACTURACION } from '@/shared/lib';
import { Icono } from '@/shared/ui';

import { conexionDelTaller, puntoDeVentaEscrito } from '../../model/facturacion';

export interface ResumenDeLaFacturacionProps {
  ajustes: FilaDe<'ajustes'>;
}

export function ResumenDeLaFacturacion({ ajustes }: ResumenDeLaFacturacionProps) {
  const m = useMensajes().facturacion.resumen;
  const conexion = conexionDelTaller(ajustes);
  return (
    <>
      <p className="max-w-[42rem] text-body leading-relaxed text-text-2">
        {conexion.ambiente === null ? (
          m.sinConectar
        ) : (
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="tabular-nums">
              {m.conectada(puntoDeVentaEscrito(conexion.puntoDeVenta))}
            </span>
            {conexion.ambiente === 'homologacion' && <CapsulaDePrueba />}
          </span>
        )}
      </p>
      <Ir
        a={RUTA_DE_LA_FACTURACION}
        className="inline-flex min-h-tap items-center gap-1.5 self-start rounded-field text-body font-semibold underline underline-offset-3"
      >
        <Icono nombre="receipt" tamano={18} />
        {m.ver}
      </Ir>
    </>
  );
}

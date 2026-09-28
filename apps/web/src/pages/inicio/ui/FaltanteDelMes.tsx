import { useState } from 'react';

import { HojaDeCubrir } from '@/features/cubrir-el-faltante';
import { formatearPesos, nombreDelMes } from '@/shared/lib';
import { Button, ConSalida, Icono } from '@/shared/ui';

import { fraseDeLosDiasQueQuedan, type FaltanteEnInicio } from '../model/la-fila';

export interface FaltanteDelMesProps {
  faltantes: readonly FaltanteEnInicio[];
  mes: string;
  hoy: string;
  sePuedeCubrir: boolean;
}

export function FaltanteDelMes({ faltantes, mes, hoy, sePuedeCubrir }: FaltanteDelMesProps) {
  const [cubriendo, setCubriendo] = useState<FaltanteEnInicio | null>(null);
  const enElMes = nombreDelMes(mes).toLowerCase();
  const dias = fraseDeLosDiasQueQuedan(hoy);

  return (
    <>
      {faltantes.map((faltante) => (
        <section
          key={faltante.tesoro}
          aria-label={`Falta para ${faltante.nombre}`}
          className="@container rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
        >
          <div className="flex flex-col gap-3 @min-[36rem]:flex-row @min-[36rem]:items-center @min-[36rem]:gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <span aria-hidden className="mt-2 size-2 flex-none rounded-pill bg-atencion" />
              <div className="min-w-0">
                <p className="text-body-lg leading-normal">
                  Faltan{' '}
                  <span className="font-semibold tabular-nums">
                    {formatearPesos(faltante.falta)}
                  </span>{' '}
                  para {faltante.nombre} de {enElMes}.
                </p>
                {dias !== null && <p className="mt-0.5 text-label text-text-2">{dias}</p>}
              </div>
            </div>
            {sePuedeCubrir && (
              <Button
                variant="secundario"
                className="flex-none"
                onClick={() => {
                  setCubriendo(faltante);
                }}
              >
                <Icono nombre="arrow-left-right" tamano={16} />
                Elegir de qué tesoro sacar
              </Button>
            )}
          </div>
        </section>
      ))}
      <ConSalida valor={cubriendo}>
        {(faltante) => (
          <HojaDeCubrir
            tesoroDelPaso={faltante.tesoro}
            mes={mes}
            faltante={faltante.falta}
            alCerrar={() => {
              setCubriendo(null);
            }}
          />
        )}
      </ConSalida>
    </>
  );
}

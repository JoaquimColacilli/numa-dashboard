import { useState } from 'react';

import { useAnchoDePantalla } from '@/shared/lib';
import { Button, ConSalida, FilaDeAcciones, Hoja, Icono } from '@/shared/ui';

import type { LoQueSeDeshace } from '../../model/presupuestoDelTaller';

export interface LosTextosDeSiempreProps {
  loQueSeDeshace: readonly LoQueSeDeshace[];
  conCambiosSinGuardar: boolean;
  alVolver: () => void;
}

export function LosTextosDeSiempre({
  loQueSeDeshace,
  conCambiosSinGuardar,
  alVolver,
}: LosTextosDeSiempreProps) {
  const [preguntando, setPreguntando] = useState(false);
  const enCelular = useAnchoDePantalla() === 'movil';
  const cuantas = loQueSeDeshace.length;

  if (cuantas === 0) {
    return (
      <p className="max-w-[42rem] text-body leading-relaxed text-text-2">
        Estás usando los textos de siempre, los de tu planilla. Lo que cambies arriba queda como
        tuyo, y desde acá vas a poder volver a estos cuando quieras.
      </p>
    );
  }

  return (
    <>
      <p className="max-w-[42rem] text-body leading-relaxed text-text-2">
        Cambiaste {cuantas === 1 ? '1 cosa' : `${String(cuantas)} cosas`} de los textos de tu
        planilla, con los que arrancó la app. Si te arrepentís, podés volver a ellos: tus datos no
        se tocan.
      </p>
      <Button
        variant="secundario"
        className="self-start"
        onClick={() => {
          setPreguntando(true);
        }}
      >
        <Icono nombre="rotate-ccw" tamano={17} />
        Volver a los textos de siempre
      </Button>

      <ConSalida valor={preguntando}>
        {() => (
          <Hoja
            titulo="¿Volvés a los textos de siempre?"
            bajada="Los de tu planilla, con los que arrancó la app"
            rol="alertdialog"
            ancho="normal"
            desdeAbajo={enCelular}
            alCerrar={() => {
              setPreguntando(false);
            }}
          >
            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-6 md:pb-5">
              <section aria-labelledby="lo-que-se-deshace" className="flex flex-col gap-2.5">
                <h3 id="lo-que-se-deshace" className="text-label font-medium text-text-2">
                  {cuantas === 1 ? 'Se deshace 1 cosa' : `Se deshacen ${String(cuantas)} cosas`}
                </h3>
                <ul className="flex flex-col gap-2">
                  {loQueSeDeshace.map((cosa) => (
                    <li key={cosa.texto} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="mt-px flex size-7 flex-none items-center justify-center rounded-control bg-surface-2 text-ink"
                      >
                        <Icono nombre={cosa.icono} tamano={15} />
                      </span>
                      <span className="min-w-0 text-body leading-relaxed">{cosa.texto}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <p className="text-label leading-relaxed text-text-2">
                {conCambiosSinGuardar
                  ? 'Lo que cambiaste de los textos y todavía no guardaste también se pierde. '
                  : ''}
                Tus datos no cambian, y los presupuestos que ya mandaste quedan como salieron.
              </p>
              <FilaDeAcciones>
                <Button
                  variant="secundario"
                  onClick={() => {
                    setPreguntando(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="peligro"
                  onClick={() => {
                    setPreguntando(false);
                    alVolver();
                  }}
                >
                  Volver a los de siempre
                </Button>
              </FilaDeAcciones>
            </div>
          </Hoja>
        )}
      </ConSalida>
    </>
  );
}

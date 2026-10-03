import { useState } from 'react';

import { useMensajes } from '@/shared/idioma';
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
  const m = useMensajes().configurarTaller.presupuesto.textosDeSiempre;
  const [preguntando, setPreguntando] = useState(false);
  const enCelular = useAnchoDePantalla() === 'movil';
  const cuantas = loQueSeDeshace.length;

  if (cuantas === 0) {
    return <p className="max-w-[42rem] text-body leading-relaxed text-text-2">{m.sinCambios}</p>;
  }

  return (
    <>
      <p className="max-w-[42rem] text-body leading-relaxed text-text-2">{m.cambiaste(cuantas)}</p>
      <Button
        variant="secundario"
        className="self-start"
        onClick={() => {
          setPreguntando(true);
        }}
      >
        <Icono nombre="rotate-ccw" tamano={17} />
        {m.volver}
      </Button>

      <ConSalida valor={preguntando}>
        {() => (
          <Hoja
            titulo={m.pregunta}
            bajada={m.bajadaDeLaPregunta}
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
                  {m.seDeshacen(cuantas)}
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
                {conCambiosSinGuardar ? m.tambienSePierde : m.tusDatosNoCambian}
              </p>
              <FilaDeAcciones>
                <Button
                  variant="secundario"
                  onClick={() => {
                    setPreguntando(false);
                  }}
                >
                  {m.cancelar}
                </Button>
                <Button
                  variant="peligro"
                  onClick={() => {
                    setPreguntando(false);
                    alVolver();
                  }}
                >
                  {m.volverALosDeSiempre}
                </Button>
              </FilaDeAcciones>
            </div>
          </Hoja>
        )}
      </ConSalida>
    </>
  );
}

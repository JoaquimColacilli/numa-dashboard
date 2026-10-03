import {
  hayAnterior,
  haySiguiente,
  LARGOS_DEL_PERIODO,
  type LargoDelPeriodo,
  type Periodo,
  type PeriodoResuelto,
} from '@maun/domain';
import { useId } from 'react';

import { useMensajes } from '@/shared/idioma';
import { FondoDelElegido, Icono } from '@/shared/ui';

import { comparacionDelPeriodo, rangoDelPeriodo } from '../model/textos';

const NOMBRE_DEL_LARGO = { 3: 'tres', 6: 'seis', 12: 'doce', todo: 'todo' } as const;

const FLECHA =
  'flex size-11 flex-none items-center justify-center rounded-pill border border-hairline bg-paper text-ink aria-disabled:cursor-default aria-disabled:text-text-3 aria-disabled:opacity-45';

export interface ElPeriodoProps {
  periodo: Periodo;
  resuelto: PeriodoResuelto;
  primerMes: string | null;
  mesEnCurso: string;
  alElegir: (largo: LargoDelPeriodo) => void;
  alCorrer: (sentido: -1 | 1) => void;
}

export function ElPeriodo({
  periodo,
  resuelto,
  primerMes,
  mesEnCurso,
  alElegir,
  alCorrer,
}: ElPeriodoProps) {
  const textos = useMensajes().paginaEstadisticas.periodo;
  const nombre = useId();
  const comparacion = comparacionDelPeriodo(resuelto);
  const meses = periodo.meses;
  const sinAnterior = !hayAnterior(periodo, primerMes);
  const sinSiguiente = !haySiguiente(periodo, mesEnCurso);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <fieldset className="w-full max-w-[26rem] min-w-0">
        <legend className="sr-only">{textos.leyenda}</legend>
        <div className="relative grid grid-cols-4 gap-0.5 rounded-pill bg-ink/6 p-1">
          <FondoDelElegido elegido={String(meses)} />
          {LARGOS_DEL_PERIODO.map((largo) => (
            <label
              key={largo}
              data-opcion={String(largo)}
              className="relative flex min-h-tap cursor-pointer items-center justify-center rounded-pill px-1 text-center text-label leading-tight font-medium whitespace-nowrap text-text-2 has-checked:font-semibold has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
            >
              <input
                type="radio"
                name={nombre}
                value={String(largo)}
                checked={meses === largo}
                onChange={() => {
                  alElegir(largo);
                }}
                className="sr-only"
              />
              {textos.largos[NOMBRE_DEL_LARGO[largo]]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex w-full max-w-[26rem] items-center gap-1 md:w-auto">
        {meses !== 'todo' && (
          <button
            type="button"
            aria-label={textos.anteriores(meses)}
            aria-disabled={sinAnterior}
            onClick={() => {
              if (!sinAnterior) alCorrer(-1);
            }}
            className={FLECHA}
          >
            <Icono nombre="chevron-left" tamano={20} grosor={2} />
          </button>
        )}
        <p
          aria-live="polite"
          className="flex min-w-0 flex-1 flex-col px-2 text-center leading-tight md:min-w-44 md:flex-none"
        >
          <span className="text-body font-semibold">{rangoDelPeriodo(resuelto)}</span>
          {comparacion !== null && <span className="text-meta text-text-3">{comparacion}</span>}
        </p>
        {meses !== 'todo' && (
          <button
            type="button"
            aria-label={textos.siguientes(meses)}
            aria-disabled={sinSiguiente}
            onClick={() => {
              if (!sinSiguiente) alCorrer(1);
            }}
            className={FLECHA}
          >
            <Icono nombre="chevron-right" tamano={20} grosor={2} />
          </button>
        )}
      </div>
    </div>
  );
}

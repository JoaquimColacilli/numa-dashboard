import { plata, type Plata } from '@maun/domain';

import { useMensajes } from '@/shared/idioma';
import { fechaLarga, formatearLaPlata } from '@/shared/lib';

import type { DiaDelLibro, LineaDelTaller } from '../model/libro';
import { FilaDelLibro } from './FilaDelLibro';

function neto(uno: Plata): string {
  return `${uno.importe > 0 ? '+' : '−'}${formatearLaPlata(plata(uno.moneda, Math.abs(uno.importe)))}`;
}

export interface ListaDelLibroProps {
  dias: readonly DiaDelLibro[];
  tesoro: string;
  hoy: string;
  sinConfirmar: (linea: LineaDelTaller) => boolean;
  alAbrir: (linea: LineaDelTaller) => void;
}

export function ListaDelLibro({ dias, tesoro, hoy, sinConfirmar, alAbrir }: ListaDelLibroProps) {
  const m = useMensajes();
  return (
    <div className="flex flex-col gap-4">
      {dias.map((dia) => (
        <section
          key={dia.fecha}
          aria-label={fechaLarga(dia.fecha, hoy)}
          className="flex flex-col gap-2"
        >
          <div className="flex items-baseline justify-between gap-3 px-1">
            <span translate="no" className="text-label font-semibold">
              {fechaLarga(dia.fecha, hoy)}
            </span>
            <span
              translate={dia.netos.length === 0 ? undefined : 'no'}
              className="text-meta text-text-2 tabular-nums"
            >
              {dia.netos.length === 0
                ? m.movimiento.libro.sinEfectoEnLosSaldos
                : dia.netos.map((uno) => neto(uno)).join(' · ')}
            </span>
          </div>
          <ul className="list-none rounded-panel border border-hairline bg-paper px-4">
            {dia.lineas.map((linea) => (
              <li key={linea.clave} className="border-t border-hairline-soft first:border-t-0">
                <FilaDelLibro
                  linea={linea}
                  tesoro={tesoro}
                  sinConfirmar={sinConfirmar(linea)}
                  alAbrir={() => {
                    alAbrir(linea);
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

import { useId, type ReactNode } from 'react';

import type { TesoroDelTaller } from '@/entities/tesoro';
import { useMensajes } from '@/shared/idioma';
import { diaYMes, formatearPesos, type Envoltorio } from '@/shared/lib';
import { Icono } from '@/shared/ui';

import type { QueHacerConLaPlata, QueSePagaSolo } from '../model/pagaSola';

export interface LoQueSePagaSoloProps {
  pago: QueSePagaSolo;
  tesoro: TesoroDelTaller;
  maun: TesoroDelTaller;
  otros: readonly TesoroDelTaller[];
  hoy: string;
  elegido: QueHacerConLaPlata | undefined;
  Nombre: Envoltorio;
  alElegir: (elegido: QueHacerConLaPlata) => void;
}

function Opcion({
  nombre,
  marcada,
  alMarcar,
  children,
}: {
  nombre: string;
  marcada: boolean;
  alMarcar: () => void;
  children: ReactNode;
}) {
  return (
    <label className="flex min-h-tap cursor-pointer items-start gap-3 py-1">
      <input
        type="radio"
        name={nombre}
        checked={marcada}
        onChange={alMarcar}
        className="mt-0.5 size-5 flex-none accent-ink"
      />
      <span className="flex min-w-0 flex-col gap-0.5 text-body">{children}</span>
    </label>
  );
}

export function LoQueSePagaSolo({
  pago,
  tesoro,
  maun,
  otros,
  hoy,
  elegido,
  Nombre,
  alElegir,
}: LoQueSePagaSoloProps) {
  const textos = useMensajes().armarLaFila.guardar;
  const id = useId();
  const conPlata = pago.plataDeAntes > 0;

  return (
    <li className="flex flex-col gap-2">
      <p className="flex items-start gap-2.5 text-label leading-relaxed text-text-2">
        <Icono nombre="calendar-check" tamano={16} className="mt-0.5 flex-none" />
        <span>
          {textos.sePagaSolo(Nombre, tesoro.nombre, diaYMes(pago.desde, hoy), maun.nombre)}
        </span>
      </p>
      {conPlata && (
        <fieldset className="flex flex-col gap-0.5 rounded-field border border-hairline px-3.5 py-2.5">
          <legend className="float-left w-full pb-1 text-label leading-relaxed text-ink">
            {textos.plataDeAntes(Nombre, tesoro.nombre, formatearPesos(pago.plataDeAntes))}
          </legend>
          <Opcion
            nombre={id}
            marcada={elegido?.que === 'maun'}
            alMarcar={() => {
              alElegir({ que: 'maun' });
            }}
          >
            {textos.pasarlaA(maun.nombre)}
          </Opcion>
          {otros.length > 0 && (
            <Opcion
              nombre={id}
              marcada={elegido?.que === 'otro'}
              alMarcar={() => {
                alElegir({ que: 'otro', hacia: null });
              }}
            >
              {textos.pasarlaAOtro}
            </Opcion>
          )}
          {elegido?.que === 'otro' && otros.length > 0 && (
            <select
              aria-label={textos.aCual(tesoro.nombre)}
              value={elegido.hacia ?? ''}
              onChange={(evento) => {
                const hacia = evento.target.value;
                alElegir({ que: 'otro', hacia: hacia === '' ? null : hacia });
              }}
              className="mb-1 ml-8 h-11 min-w-0 rounded-field border border-border bg-paper px-2 text-body text-ink"
            >
              <option value="">{textos.elegiUno}</option>
              {otros.map((otro) => (
                <option key={otro.id} value={otro.id}>
                  {otro.nombre}
                </option>
              ))}
            </select>
          )}
          <Opcion
            nombre={id}
            marcada={elegido?.que === 'ya-no-esta'}
            alMarcar={() => {
              alElegir({ que: 'ya-no-esta' });
            }}
          >
            <span>{textos.yaNoEsta}</span>
            <span className="text-meta text-text-3">{textos.ayudaDeYaNoEsta}</span>
          </Opcion>
        </fieldset>
      )}
    </li>
  );
}

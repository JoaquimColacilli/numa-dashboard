import type { Moneda } from '@maun/domain';
import { useId } from 'react';

import { BotonDeLaMoneda } from '@/entities/proyecto';
import { useMensajes } from '@/shared/idioma';
import { Campo, CamposJuntos, MoneyInput } from '@/shared/ui';

import type { NumerosEditables } from '../../model/presupuestoDelTaller';

export interface NumerosDelPresupuestoProps {
  numeros: NumerosEditables;
  monedaDelValor: Moneda;
  problemas: Readonly<Record<string, string>>;
  alCambiar: (cambios: Partial<NumerosEditables>) => void;
  alCambiarLaMoneda: (moneda: Moneda) => void;
}

function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, '').slice(0, 3);
}

function ValorDeUnaModificacion({
  valor,
  moneda,
  ayuda,
  error,
  alCambiar,
  alCambiarLaMoneda,
}: {
  valor: number | null;
  moneda: Moneda;
  ayuda: string | undefined;
  error: string | undefined;
  alCambiar: (valor: number | null) => void;
  alCambiarLaMoneda: (moneda: Moneda) => void;
}) {
  const m = useMensajes().configurarTaller.presupuesto.numeros;
  const id = useId();
  const descripcion = [
    ayuda === undefined ? '' : `${id}-ayuda`,
    error === undefined ? '' : `${id}-error`,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-valor`} className="text-label text-text-2">
        {m.valor}
      </label>
      <span
        className={`flex h-field min-w-0 items-center gap-1.5 rounded-field border bg-paper px-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink ${
          error === undefined ? 'border-border' : 'border-alerta'
        }`}
      >
        <BotonDeLaMoneda moneda={moneda} alCambiar={alCambiarLaMoneda} />
        <MoneyInput
          id={`${id}-valor`}
          moneda={moneda}
          value={valor}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={descripcion === '' ? undefined : descripcion}
          onChange={alCambiar}
          className="min-w-0 flex-1 bg-transparent text-body-lg text-ink outline-none"
        />
      </span>
      {ayuda !== undefined && (
        <span id={`${id}-ayuda`} className="text-meta text-text-3">
          {ayuda}
        </span>
      )}
      {error !== undefined && (
        <span id={`${id}-error`} role="alert" className="text-label font-medium text-alerta">
          {error}
        </span>
      )}
    </div>
  );
}

export function NumerosDelPresupuesto({
  numeros,
  monedaDelValor,
  problemas,
  alCambiar,
  alCambiarLaMoneda,
}: NumerosDelPresupuestoProps) {
  const m = useMensajes().configurarTaller.presupuesto.numeros;
  return (
    <>
      <CamposJuntos campoMinimo="14rem">
        <Campo
          etiqueta={m.plazo}
          inputMode="numeric"
          className="tabular-nums"
          value={numeros.plazo}
          ayuda={problemas.plazo === undefined ? m.ayudaDelPlazo : undefined}
          error={problemas.plazo}
          onChange={(evento) => {
            alCambiar({ plazo: soloDigitos(evento.target.value) });
          }}
        />
        <Campo
          etiqueta={m.garantia}
          inputMode="numeric"
          className="tabular-nums"
          value={numeros.garantia}
          ayuda={problemas.garantia === undefined ? m.ayudaDeLaGarantia : undefined}
          error={problemas.garantia}
          onChange={(evento) => {
            alCambiar({ garantia: soloDigitos(evento.target.value) });
          }}
        />
      </CamposJuntos>
      <CamposJuntos campoMinimo="14rem">
        <Campo
          etiqueta={m.modificaciones}
          inputMode="numeric"
          className="tabular-nums"
          value={numeros.modificaciones}
          ayuda={problemas.modificaciones === undefined ? m.ayudaDeLasModificaciones : undefined}
          error={problemas.modificaciones}
          onChange={(evento) => {
            alCambiar({ modificaciones: soloDigitos(evento.target.value) });
          }}
        />
        <ValorDeUnaModificacion
          valor={numeros.valor}
          moneda={monedaDelValor}
          ayuda={problemas.valor === undefined ? m.ayudaDelValor : undefined}
          error={problemas.valor}
          alCambiar={(valor) => {
            alCambiar({ valor });
          }}
          alCambiarLaMoneda={alCambiarLaMoneda}
        />
      </CamposJuntos>
    </>
  );
}

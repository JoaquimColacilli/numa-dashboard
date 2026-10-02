import { useId, type Ref } from 'react';

import type { DolarDeLaApi } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { formatearPesos, horaEnElTaller } from '@/shared/lib';

import { useSugerenciaDelDolar } from './dolar';
import { MoneyInput } from './Plata';

export interface DolarDelDiaParaSugerir {
  valor: number;
}

export interface CampoDelDolarProps {
  value: number | null;
  onChange: (valor: number | null) => void;
  etiqueta?: string;
  error?: string;
  ayuda?: string;
  delDia?: DolarDelDiaParaSugerir | null;
  conSugerencia?: boolean;
  id?: string;
  ref?: Ref<HTMLInputElement>;
}

function Valor({
  valor,
  etiqueta,
  alElegir,
}: {
  valor: number;
  etiqueta: string;
  alElegir: (valor: number) => void;
}) {
  return (
    <button
      type="button"
      translate="no"
      aria-label={etiqueta}
      title={etiqueta}
      onClick={() => {
        alElegir(valor);
      }}
      className="-my-1 rounded-pill px-1 py-1 font-medium text-ink tabular-nums underline decoration-border underline-offset-2 hover:bg-surface"
    >
      {formatearPesos(valor)}
    </button>
  );
}

function DeUnaCasa({
  casa,
  dolar,
  alElegir,
}: {
  casa: string;
  dolar: DolarDeLaApi;
  alElegir: (valor: number) => void;
}) {
  const textos = useMensajes().ui.dolar;
  return (
    <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
      <span translate="no">{casa}</span>
      <Valor
        valor={dolar.compra}
        etiqueta={textos.usarLaCompra(casa, formatearPesos(dolar.compra))}
        alElegir={alElegir}
      />
      <span aria-hidden>/</span>
      <Valor
        valor={dolar.venta}
        etiqueta={textos.usarLaVenta(casa, formatearPesos(dolar.venta))}
        alElegir={alElegir}
      />
    </span>
  );
}

export function CampoDelDolar({
  value,
  onChange,
  etiqueta,
  error,
  ayuda,
  delDia = null,
  conSugerencia = true,
  id,
  ref,
}: CampoDelDolarProps) {
  const textos = useMensajes().ui.dolar;
  const propio = useId();
  const sugerencia = useSugerenciaDelDolar(conSugerencia);
  const partes = [
    ...(delDia === null ? [] : ['delDia' as const]),
    ...(sugerencia?.mep ? ['mep' as const] : []),
    ...(sugerencia?.blue ? ['blue' as const] : []),
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <MoneyInput
        ref={ref}
        id={id ?? propio}
        etiqueta={etiqueta ?? textos.etiqueta}
        value={value}
        onChange={onChange}
        error={error}
        ayuda={ayuda}
        placeholder="0"
      />
      {partes.length > 0 && (
        <p
          aria-label={textos.sugerencias}
          className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-meta text-text-2"
        >
          {partes.map((parte, indice) => (
            <span key={parte} className="inline-flex items-baseline gap-1.5">
              {indice > 0 && <span aria-hidden>·</span>}
              {parte === 'delDia' && delDia !== null && (
                <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
                  <span>{textos.delDia}</span>
                  <Valor
                    valor={delDia.valor}
                    etiqueta={textos.usarElDelDia(formatearPesos(delDia.valor))}
                    alElegir={onChange}
                  />
                </span>
              )}
              {parte === 'mep' && sugerencia?.mep && (
                <DeUnaCasa casa={textos.mep} dolar={sugerencia.mep} alElegir={onChange} />
              )}
              {parte === 'blue' && sugerencia?.blue && (
                <DeUnaCasa casa={textos.blue} dolar={sugerencia.blue} alElegir={onChange} />
              )}
            </span>
          ))}
          {sugerencia?.hora !== undefined && sugerencia.hora !== null && (
            <span className="inline-flex items-baseline gap-1.5" translate="no">
              <span aria-hidden>·</span>
              {horaEnElTaller(sugerencia.hora)}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

import { useMensajes } from '@/shared/idioma';
import { Campo, CamposJuntos, MoneyInput } from '@/shared/ui';

import type { NumerosEditables } from '../../model/presupuestoDelTaller';

export interface NumerosDelPresupuestoProps {
  numeros: NumerosEditables;
  problemas: Readonly<Record<string, string>>;
  alCambiar: (cambios: Partial<NumerosEditables>) => void;
}

function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, '').slice(0, 3);
}

export function NumerosDelPresupuesto({
  numeros,
  problemas,
  alCambiar,
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
        <MoneyInput
          etiqueta={m.valor}
          value={numeros.valor}
          ayuda={problemas.valor === undefined ? m.ayudaDelValor : undefined}
          error={problemas.valor}
          onChange={(valor) => {
            alCambiar({ valor });
          }}
        />
      </CamposJuntos>
    </>
  );
}

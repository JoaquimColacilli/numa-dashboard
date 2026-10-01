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
  return (
    <>
      <CamposJuntos campoMinimo="14rem">
        <Campo
          etiqueta="Plazo de fabricación (días hábiles)"
          inputMode="numeric"
          className="tabular-nums"
          value={numeros.plazo}
          ayuda={
            problemas.plazo === undefined
              ? 'El que arranca en cada presupuesto nuevo. En cada uno lo podés cambiar.'
              : undefined
          }
          error={problemas.plazo}
          onChange={(evento) => {
            alCambiar({ plazo: soloDigitos(evento.target.value) });
          }}
        />
        <Campo
          etiqueta="Garantía (meses)"
          inputMode="numeric"
          className="tabular-nums"
          value={numeros.garantia}
          ayuda={problemas.garantia === undefined ? 'La ley pide por lo menos 6 meses.' : undefined}
          error={problemas.garantia}
          onChange={(evento) => {
            alCambiar({ garantia: soloDigitos(evento.target.value) });
          }}
        />
      </CamposJuntos>
      <CamposJuntos campoMinimo="14rem">
        <Campo
          etiqueta="Modificaciones incluidas"
          inputMode="numeric"
          className="tabular-nums"
          value={numeros.modificaciones}
          ayuda={
            problemas.modificaciones === undefined
              ? 'Las del diseño 3D que entran en el precio.'
              : undefined
          }
          error={problemas.modificaciones}
          onChange={(evento) => {
            alCambiar({ modificaciones: soloDigitos(evento.target.value) });
          }}
        />
        <MoneyInput
          etiqueta="Valor de una modificación de más"
          value={numeros.valor}
          ayuda={
            problemas.valor === undefined ? 'Lo que cobrás cada una que pase de esas.' : undefined
          }
          error={problemas.valor}
          onChange={(valor) => {
            alCambiar({ valor });
          }}
        />
      </CamposJuntos>
    </>
  );
}

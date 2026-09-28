import type { ReactNode } from 'react';

import type { FraseDelDiezmo } from '@/entities/movimiento';
import { CantoDelTesoro, type TesoroDelTaller } from '@/entities/tesoro';
import {
  formatearPesos,
  RUTA_DE_DIEZMO,
  rutaDeFinanzasDelTesoro,
  TINTA,
  useIr,
} from '@/shared/lib';
import { caracteresDe, Icono, MontoQueEntra, Tablero } from '@/shared/ui';

import { detalleDeLaTarjeta, TESOROS_EN_UNA_FILA } from '../model/tesoros';

function encabezado(frase: FraseDelDiezmo): string {
  return frase.despues === '' ? frase.antes : `${frase.antes} ${frase.despues}`;
}

function Tarjeta({
  tesoro,
  diezmo,
  caracteres,
  alElegir,
}: {
  tesoro: TesoroDelTaller;
  diezmo: FraseDelDiezmo;
  caracteres: number;
  alElegir: () => void;
}) {
  const esElDiezmo = tesoro.clave === 'diezmo';
  const enNegativo = tesoro.saldo < 0 && !esElDiezmo;
  const detalle = enNegativo ? 'gastó más de lo que entró' : detalleDeLaTarjeta(tesoro, diezmo);

  return (
    <button
      type="button"
      onClick={alElegir}
      className={`relative row-span-3 grid min-h-[118px] min-w-0 grid-rows-subgrid gap-y-0 overflow-hidden rounded-panel p-3 text-left @min-[20rem]:p-3.5 ${
        enNegativo
          ? 'border border-negativo-borde bg-negativo-bg text-negativo-texto'
          : 'border border-hairline bg-paper pb-4 @min-[20rem]:pb-[18px]'
      }`}
    >
      <span className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1 self-start pb-3">
        <span
          className={`flex min-w-0 items-center gap-2 text-label font-semibold ${
            enNegativo ? 'text-negativo-texto' : TINTA[tesoro.tinta].texto
          }`}
        >
          <Icono nombre={enNegativo ? 'triangle-alert' : tesoro.icono} tamano={18} />
          {tesoro.nombre}
        </span>
        {enNegativo && (
          <span className="rounded-control border border-current px-1.5 text-badge font-semibold whitespace-nowrap">
            en negativo
          </span>
        )}
      </span>
      <span className="@container flex min-w-0 flex-col justify-end gap-0.5">
        {!esElDiezmo ? (
          <MontoQueEntra caracteres={caracteres} className="font-semibold">
            {formatearPesos(tesoro.saldo)}
          </MontoQueEntra>
        ) : diezmo.importe === null ? (
          <span className="text-body-lg leading-tight font-semibold">{encabezado(diezmo)}</span>
        ) : (
          <>
            <span className="text-label leading-tight font-medium">{encabezado(diezmo)}</span>
            <MontoQueEntra caracteres={caracteres} className="font-semibold">
              {diezmo.importe}
            </MontoQueEntra>
          </>
        )}
      </span>
      <span
        title={esElDiezmo ? undefined : detalle}
        className={`min-w-0 pt-0.5 text-meta ${esElDiezmo ? '' : 'line-clamp-1'} ${
          enNegativo ? 'text-negativo-texto/80' : 'text-text-2'
        }`}
      >
        {detalle}
      </span>
      {!enNegativo && <CantoDelTesoro tinta={tesoro.tinta} />}
    </button>
  );
}

export interface TarjetasDeLosTesorosProps {
  tesoros: readonly TesoroDelTaller[];
  diezmo: FraseDelDiezmo;
}

export function TarjetasDeLosTesoros({ tesoros, diezmo }: TarjetasDeLosTesorosProps) {
  const ir = useIr();

  const caracteres = caracteresDe(
    ...tesoros.flatMap((tesoro) =>
      tesoro.clave === 'diezmo'
        ? diezmo.importe === null
          ? []
          : [diezmo.importe]
        : [formatearPesos(tesoro.saldo)],
    ),
  );

  const tarjetas: ReactNode = tesoros.map((tesoro) => (
    <Tarjeta
      key={tesoro.id}
      tesoro={tesoro}
      diezmo={diezmo}
      caracteres={caracteres}
      alElegir={() => {
        ir(tesoro.clave === 'diezmo' ? RUTA_DE_DIEZMO : rutaDeFinanzasDelTesoro(tesoro));
      }}
    />
  ));

  const clases = '@container grid-cols-2 gap-3 md:gap-4';

  return tesoros.length <= TESOROS_EN_UNA_FILA ? (
    <Tablero enUnaFila como="section" etiqueta="Tesoros" className={clases}>
      {tarjetas}
    </Tablero>
  ) : (
    <Tablero
      tarjetaMinima="13.25rem"
      completar
      como="section"
      etiqueta="Tesoros"
      className={clases}
    >
      {tarjetas}
    </Tablero>
  );
}

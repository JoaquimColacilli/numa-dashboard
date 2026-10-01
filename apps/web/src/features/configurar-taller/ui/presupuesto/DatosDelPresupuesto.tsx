import { CONDICIONES_FISCALES, formatearCuit, NOMBRE_DE_LA_CONDICION } from '@maun/domain';
import { useId, useState } from 'react';

import { Button, Campo, CamposJuntos, Icono } from '@/shared/ui';

import { avisoDelCuitDelTaller } from '../../model/cobro';
import {
  encabezadoDelPresupuesto,
  LARGOS_DE_LOS_DATOS,
  type DatosDeCobroParaUsar,
  type DatosEditables,
} from '../../model/presupuestoDelTaller';
import { EnTramos } from './piezas';

function Membrete({ nombre, datos }: { nombre: string; datos: DatosEditables }) {
  const { renglones } = encabezadoDelPresupuesto(datos);
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-label text-text-2">
        Así sale arriba de cada presupuesto
      </figcaption>
      <div className="flex flex-col gap-3 rounded-field bg-surface px-4 pt-3.5 pb-4 @container/membrete">
        <div className="flex flex-col items-start gap-2.5 @min-[16rem]/membrete:flex-row @min-[16rem]/membrete:justify-between @min-[16rem]/membrete:gap-4">
          <div className="flex min-w-0 flex-col">
            <p className="font-display text-body-lg leading-tight">{nombre}</p>
            <p className="text-meta text-text-3">Muebles a medida</p>
          </div>
          <div aria-hidden className="flex flex-none items-center gap-2">
            <span className="rotulo-del-plano w-[5.75rem] text-badge leading-tight font-semibold text-text-2 uppercase @min-[16rem]/membrete:text-right">
              Documento no válido como factura
            </span>
            <span className="flex size-8 flex-none items-center justify-center rounded-[4px] border-[1.5px] border-ink text-body-lg leading-none font-semibold">
              X
            </span>
          </div>
        </div>
        {renglones.length === 0 ? (
          <p className="text-label leading-relaxed text-text-3">
            Acá van tu nombre o razón social, tu CUIT, tu condición fiscal y tu domicilio.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {renglones.map((partes) => (
              <p
                key={partes.join('·')}
                className="text-label leading-snug text-text-2 tabular-nums"
              >
                <EnTramos partes={partes} />
              </p>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}

function UsarElCobro({ cobro, alUsar }: { cobro: DatosDeCobroParaUsar; alUsar: () => void }) {
  const id = useId();
  const cuit = cobro.cuit === '' ? null : `CUIT ${formatearCuit(cobro.cuit)}`;
  return (
    <div className="flex flex-col items-start gap-3 rounded-field border border-dashed border-border px-4 py-3.5">
      <p id={id} className="text-body leading-relaxed text-pretty text-text-2">
        En «Cómo te pagan» tenés a{' '}
        <span className="font-medium text-ink">
          {cobro.titular}
          {cobro.titular !== '' && cuit !== null ? ', ' : ''}
          {cuit !== null && <span className="whitespace-nowrap">{cuit}</span>}
        </span>
        . Si presupuestás a ese nombre, no hace falta que los escribas de nuevo.
      </p>
      <Button variant="secundario" size="chico" aria-describedby={id} onClick={alUsar}>
        Usar el titular y el CUIT
      </Button>
    </div>
  );
}

export interface DatosDelPresupuestoProps {
  nombre: string;
  datos: DatosEditables;
  cobro: DatosDeCobroParaUsar | null;
  problemas: Readonly<Record<string, string>>;
  alCambiar: (cambios: Partial<DatosEditables>) => void;
}

export function DatosDelPresupuesto({
  nombre,
  datos,
  cobro,
  problemas,
  alCambiar,
}: DatosDelPresupuestoProps) {
  const id = useId();
  const vacios = datos.titular.trim() === '' && datos.cuit.trim() === '';
  const errorDelCuit = problemas.cuit;
  const [abiertos, setAbiertos] = useState(() => encabezadoDelPresupuesto(datos).faltan.length > 0);
  const conProblemas = ['titular', 'cuit', 'domicilio', 'telefono', 'email'].some(
    (campo) => problemas[campo] !== undefined,
  );

  if (!abiertos && !conProblemas) {
    return (
      <>
        <Membrete nombre={nombre} datos={datos} />
        <Button
          variant="secundario"
          size="chico"
          className="self-start"
          onClick={() => {
            setAbiertos(true);
          }}
        >
          <Icono nombre="pencil-line" tamano={16} />
          Cambiar tus datos
        </Button>
      </>
    );
  }

  return (
    <>
      <Membrete nombre={nombre} datos={datos} />
      {vacios && cobro !== null && (
        <UsarElCobro
          cobro={cobro}
          alUsar={() => {
            alCambiar({ titular: cobro.titular, cuit: formatearCuit(cobro.cuit) });
          }}
        />
      )}
      <CamposJuntos campoMinimo="14rem">
        <Campo
          etiqueta="Nombre o razón social"
          autoComplete="organization"
          maxLength={LARGOS_DE_LOS_DATOS.titular}
          ayuda="A nombre de quién está el CUIT."
          value={datos.titular}
          error={problemas.titular}
          onChange={(evento) => {
            alCambiar({ titular: evento.target.value });
          }}
        />
        <Campo
          etiqueta="CUIT"
          inputMode="numeric"
          placeholder="20-12345678-9"
          className="tabular-nums"
          ayuda={
            errorDelCuit === undefined
              ? (avisoDelCuitDelTaller(datos.cuit) ?? 'Sale al lado de tu nombre.')
              : undefined
          }
          value={datos.cuit}
          error={errorDelCuit}
          onChange={(evento) => {
            alCambiar({ cuit: formatearCuit(evento.target.value) });
          }}
        />
      </CamposJuntos>
      <CamposJuntos campoMinimo="14rem">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-condicion`} className="text-label text-text-2">
            Condición fiscal
          </label>
          <select
            id={`${id}-condicion`}
            value={datos.condicionFiscal}
            onChange={(evento) => {
              const elegida = CONDICIONES_FISCALES.find((una) => una === evento.target.value);
              alCambiar({ condicionFiscal: elegida ?? '' });
            }}
            className="h-field rounded-field border border-border bg-paper px-3 text-body-lg text-ink"
          >
            <option value="">Elegila</option>
            {CONDICIONES_FISCALES.map((condicion) => (
              <option key={condicion} value={condicion}>
                {NOMBRE_DE_LA_CONDICION[condicion]}
              </option>
            ))}
          </select>
          <span className="text-meta text-text-3">Sale debajo de tu CUIT.</span>
        </div>
        <Campo
          etiqueta="Domicilio"
          autoComplete="street-address"
          maxLength={LARGOS_DE_LOS_DATOS.domicilio}
          placeholder="Calle y número, localidad"
          ayuda="El del taller, con la localidad."
          value={datos.domicilio}
          error={problemas.domicilio}
          onChange={(evento) => {
            alCambiar({ domicilio: evento.target.value });
          }}
        />
      </CamposJuntos>
      <CamposJuntos campoMinimo="14rem">
        <Campo
          etiqueta="Teléfono"
          inputMode="tel"
          autoComplete="tel"
          maxLength={LARGOS_DE_LOS_DATOS.telefono}
          ayuda="Con el teléfono, tu cliente tiene un botón para escribirte por WhatsApp."
          value={datos.telefono}
          error={problemas.telefono}
          onChange={(evento) => {
            alCambiar({ telefono: evento.target.value });
          }}
        />
        <Campo
          etiqueta="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={LARGOS_DE_LOS_DATOS.email}
          ayuda="Sale al lado del teléfono."
          value={datos.email}
          error={problemas.email}
          onChange={(evento) => {
            alCambiar({ email: evento.target.value });
          }}
        />
      </CamposJuntos>
    </>
  );
}

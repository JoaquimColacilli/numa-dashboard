import {
  CONDICIONES_FISCALES,
  formatearCuit,
  NOMBRE_DE_LA_CONDICION,
  type Idioma,
} from '@maun/domain';
import { useId, useState, type ReactNode } from 'react';

import { useMensajes } from '@/shared/idioma';
import { Button, Campo, CamposJuntos, Icono } from '@/shared/ui';

import { avisoDelCuitDelTaller } from '../../model/cobro';
import {
  encabezadoDelPresupuesto,
  LARGOS_DE_LOS_DATOS,
  type DatosDeCobroParaUsar,
  type DatosEditables,
} from '../../model/presupuestoDelTaller';
import { CabeceraDelDocumento } from './CabeceraDelDocumento';
import { EnTramos } from './piezas';

function Membrete({
  nombre,
  idioma,
  datos,
}: {
  nombre: string;
  idioma: Idioma;
  datos: DatosEditables;
}) {
  const m = useMensajes().configurarTaller.presupuesto.datos;
  const { renglones } = encabezadoDelPresupuesto(datos);
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-label text-text-2">{m.asiSale}</figcaption>
      <div className="flex flex-col gap-3 rounded-field bg-surface px-4 pt-3.5 pb-4 @container/membrete">
        <CabeceraDelDocumento nombre={nombre} idioma={idioma} />
        {renglones.length === 0 ? (
          <p className="text-label leading-relaxed text-text-3">{m.vacio}</p>
        ) : (
          <div translate="no" className="flex flex-col gap-0.5">
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

function DatosDelCobro({ children }: { children: ReactNode }) {
  return (
    <span translate="no" className="font-medium text-ink">
      {children}
    </span>
  );
}

function UsarElCobro({ cobro, alUsar }: { cobro: DatosDeCobroParaUsar; alUsar: () => void }) {
  const { configurarTaller } = useMensajes();
  const m = configurarTaller.presupuesto.datos;
  const id = useId();
  const cuit = cobro.cuit === '' ? null : configurarTaller.cuit(formatearCuit(cobro.cuit));
  return (
    <div className="flex flex-col items-start gap-3 rounded-field border border-dashed border-border px-4 py-3.5">
      <p id={id} className="text-body leading-relaxed text-pretty text-text-2">
        {m.enComoTePagan(
          DatosDelCobro,
          <>
            {cobro.titular}
            {cobro.titular !== '' && cuit !== null ? ', ' : ''}
            {cuit !== null && <span className="whitespace-nowrap">{cuit}</span>}
          </>,
        )}
      </p>
      <Button variant="secundario" size="chico" aria-describedby={id} onClick={alUsar}>
        {m.usarElCobro}
      </Button>
    </div>
  );
}

export interface DatosDelPresupuestoProps {
  nombre: string;
  idioma: Idioma;
  datos: DatosEditables;
  cobro: DatosDeCobroParaUsar | null;
  problemas: Readonly<Record<string, string>>;
  alCambiar: (cambios: Partial<DatosEditables>) => void;
}

export function DatosDelPresupuesto({
  nombre,
  idioma,
  datos,
  cobro,
  problemas,
  alCambiar,
}: DatosDelPresupuestoProps) {
  const m = useMensajes().configurarTaller.presupuesto.datos;
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
        <Membrete nombre={nombre} idioma={idioma} datos={datos} />
        <Button
          variant="secundario"
          size="chico"
          className="self-start"
          onClick={() => {
            setAbiertos(true);
          }}
        >
          <Icono nombre="pencil-line" tamano={16} />
          {m.cambiarTusDatos}
        </Button>
      </>
    );
  }

  return (
    <>
      <Membrete nombre={nombre} idioma={idioma} datos={datos} />
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
          etiqueta={m.nombreORazonSocial}
          autoComplete="organization"
          maxLength={LARGOS_DE_LOS_DATOS.titular}
          ayuda={m.ayudaDelNombre}
          value={datos.titular}
          error={problemas.titular}
          onChange={(evento) => {
            alCambiar({ titular: evento.target.value });
          }}
        />
        <Campo
          etiqueta={m.cuit}
          inputMode="numeric"
          placeholder="20-12345678-9"
          className="tabular-nums"
          ayuda={
            errorDelCuit === undefined
              ? (avisoDelCuitDelTaller(datos.cuit) ?? m.ayudaDelCuit)
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
            {m.condicionFiscal}
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
            <option value="">{m.elegila}</option>
            {CONDICIONES_FISCALES.map((condicion) => (
              <option key={condicion} value={condicion} translate="no">
                {NOMBRE_DE_LA_CONDICION[condicion]}
              </option>
            ))}
          </select>
          <span className="text-meta text-text-3">{m.ayudaDeLaCondicion}</span>
        </div>
        <Campo
          etiqueta={m.domicilio}
          autoComplete="street-address"
          maxLength={LARGOS_DE_LOS_DATOS.domicilio}
          placeholder={m.ejemploDelDomicilio}
          ayuda={m.ayudaDelDomicilio}
          value={datos.domicilio}
          error={problemas.domicilio}
          onChange={(evento) => {
            alCambiar({ domicilio: evento.target.value });
          }}
        />
      </CamposJuntos>
      <CamposJuntos campoMinimo="14rem">
        <Campo
          etiqueta={m.telefono}
          inputMode="tel"
          autoComplete="tel"
          maxLength={LARGOS_DE_LOS_DATOS.telefono}
          ayuda={m.ayudaDelTelefono}
          value={datos.telefono}
          error={problemas.telefono}
          onChange={(evento) => {
            alCambiar({ telefono: evento.target.value });
          }}
        />
        <Campo
          etiqueta={m.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={LARGOS_DE_LOS_DATOS.email}
          ayuda={m.ayudaDelEmail}
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

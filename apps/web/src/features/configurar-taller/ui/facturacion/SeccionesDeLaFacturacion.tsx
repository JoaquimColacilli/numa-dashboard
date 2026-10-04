import {
  CATEGORIAS_DEL_MONOTRIBUTO,
  CONCEPTOS_DE_ARCA,
  escalaVigente,
  NOMBRE_DE_LA_CONDICION,
  type CategoriaDelMonotributo,
  type ConceptoDeArca,
  type CondicionFiscal,
} from '@maun/domain';
import { useId, type ReactNode } from 'react';

import { useMensajes } from '@/shared/idioma';
import { formatearPesos, hoyEnElTaller } from '@/shared/lib';
import { Campo, CamposJuntos, FondoDelElegido, Icono } from '@/shared/ui';

import {
  enPesosEnteros,
  LARGO_MAXIMO_DE_INGRESOS_BRUTOS,
  type DatosDeLaFacturacion,
} from '../../model/facturacion';

const AYUDA = 'max-w-[42rem] text-meta leading-normal text-text-3';

function Lectura({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-hairline-soft py-2 text-body-sm first:border-t-0 first:pt-0 last:pb-0">
      <dt className="text-label text-text-2">{titulo}</dt>
      <dd className="min-w-0 text-ink">{children}</dd>
    </div>
  );
}

export interface DatosDelTallerEnLasFacturas {
  titular: string;
  domicilio: string;
  condicion: CondicionFiscal | null;
}

export interface DatosEnLasFacturasProps {
  taller: DatosDelTallerEnLasFacturas;
  datos: DatosDeLaFacturacion;
  errorDeIngresosBrutos: boolean;
  enlaceAlPresupuesto: ReactNode;
  alCambiar: (cambios: Partial<DatosDeLaFacturacion>) => void;
}

export function DatosEnLasFacturas({
  taller,
  datos,
  errorDeIngresosBrutos,
  enlaceAlPresupuesto,
  alCambiar,
}: DatosEnLasFacturasProps) {
  const m = useMensajes().facturacion.datos;
  const sinCargar = <span className="text-text-3">{m.sinCargar}</span>;
  return (
    <>
      <dl className="flex flex-col">
        <Lectura titulo={m.nombre}>
          {taller.titular.trim() === '' ? sinCargar : <span translate="no">{taller.titular}</span>}
        </Lectura>
        <Lectura titulo={m.domicilio}>
          {taller.domicilio.trim() === '' ? (
            sinCargar
          ) : (
            <span translate="no">{taller.domicilio}</span>
          )}
        </Lectura>
        <Lectura titulo={m.condicion}>
          {taller.condicion === 'monotributo' ? (
            m.monotributo
          ) : (
            <span className="flex flex-col gap-0.5 font-medium text-alerta">
              {taller.condicion === null ? (
                <span>{m.sinCargar}</span>
              ) : (
                <span translate="no">{NOMBRE_DE_LA_CONDICION[taller.condicion]}</span>
              )}
              <span>{m.soloMonotributo}</span>
            </span>
          )}
        </Lectura>
      </dl>
      {enlaceAlPresupuesto}
      <CamposJuntos campoMinimo="14rem" className="max-w-[34rem]">
        <Campo
          etiqueta={m.ingresosBrutos}
          className="tabular-nums"
          value={datos.ingresosBrutos}
          error={
            errorDeIngresosBrutos
              ? m.ingresosBrutosLargo(LARGO_MAXIMO_DE_INGRESOS_BRUTOS)
              : undefined
          }
          onChange={(evento) => {
            alCambiar({ ingresosBrutos: evento.target.value });
          }}
        />
        <Campo
          etiqueta={m.inicio}
          type="date"
          max={hoyEnElTaller()}
          className="tabular-nums"
          value={datos.inicioDeActividades}
          onChange={(evento) => {
            alCambiar({ inicioDeActividades: evento.target.value });
          }}
        />
      </CamposJuntos>
      <p className={AYUDA}>{m.ayuda}</p>
    </>
  );
}

export interface QueFacturasProps {
  idDelTitulo: string;
  concepto: ConceptoDeArca;
  alCambiar: (concepto: ConceptoDeArca) => void;
}

export function QueFacturas({ idDelTitulo, concepto, alCambiar }: QueFacturasProps) {
  const m = useMensajes().facturacion.concepto;
  const nombre = useId();
  const idDeLaAyuda = `${nombre}-ayuda`;
  const precioMaximo = escalaVigente(hoyEnElTaller()).precioUnitarioMaximoCentavos;
  return (
    <>
      <div
        role="radiogroup"
        aria-labelledby={idDelTitulo}
        aria-describedby={idDeLaAyuda}
        className="relative grid max-w-[30rem] grid-cols-3 gap-0.5 rounded-pill bg-ink/6 p-1"
      >
        <FondoDelElegido elegido={String(concepto)} />
        {CONCEPTOS_DE_ARCA.map((opcion) => (
          <label
            key={opcion}
            data-opcion={String(opcion)}
            className="relative flex min-h-tap cursor-pointer items-center justify-center rounded-pill px-2 text-center text-label leading-tight font-medium text-text-2 has-checked:font-semibold has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
          >
            <input
              type="radio"
              name={nombre}
              value={String(opcion)}
              checked={concepto === opcion}
              onChange={() => {
                alCambiar(opcion);
              }}
              className="sr-only"
            />
            {m.opciones[opcion]}
          </label>
        ))}
      </div>
      <p id={idDeLaAyuda} className={AYUDA}>
        {m.ayuda}
      </p>
      {concepto !== 2 && (
        <p className="flex max-w-[42rem] items-start gap-2 text-label leading-normal text-text-2">
          <Icono nombre="info" tamano={16} className="mt-px flex-none text-text-3" />
          <span>{m.muebles(formatearPesos(precioMaximo))}</span>
        </p>
      )}
    </>
  );
}

export interface CategoriaDelMonotributoProps {
  idDelTitulo: string;
  categoria: CategoriaDelMonotributo | null;
  alCambiar: (categoria: CategoriaDelMonotributo | null) => void;
}

export function CategoriaDelMonotributo({
  idDelTitulo,
  categoria,
  alCambiar,
}: CategoriaDelMonotributoProps) {
  const m = useMensajes().facturacion.categoria;
  const id = useId();
  const topes = escalaVigente(hoyEnElTaller()).topesCentavos;
  return (
    <>
      <select
        id={id}
        aria-labelledby={idDelTitulo}
        aria-describedby={`${id}-ayuda`}
        value={categoria ?? ''}
        onChange={(evento) => {
          const elegida = CATEGORIAS_DEL_MONOTRIBUTO.find((una) => una === evento.target.value);
          alCambiar(elegida ?? null);
        }}
        className="h-field w-full max-w-[26rem] rounded-field border border-border bg-paper px-3 text-body-lg text-ink tabular-nums"
      >
        <option value="">{m.sinElegir}</option>
        {CATEGORIAS_DEL_MONOTRIBUTO.map((letra) => (
          <option key={letra} value={letra}>
            {m.opcion(letra, formatearPesos(enPesosEnteros(topes[letra])))}
          </option>
        ))}
      </select>
      <p id={`${id}-ayuda`} className={AYUDA}>
        {m.ayuda}
      </p>
    </>
  );
}

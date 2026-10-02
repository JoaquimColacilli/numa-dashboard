import { MONEDA_DEL_TALLER, necesitaCotizacion, type Moneda } from '@maun/domain';
import { useId } from 'react';

import { useMensajes } from '@/shared/idioma';
import { adornosDelCampo, useIdiomaEnUso } from '@/shared/lib';
import { Button, CampoDelDolar, MoneyInput } from '@/shared/ui';

import {
  ayudaDelDolarDelPago,
  conOtraMoneda,
  efectoDelPago,
  importeDelValor,
  loQueHaceElPago,
  type ErroresDelPago,
  type TesoroQueRecibeDolares,
  type ValorDelPago,
} from '../model/pago';

export interface BotonDeLaMonedaProps {
  moneda: Moneda;
  alCambiar: (moneda: Moneda) => void;
  deshabilitado?: boolean;
  className?: string;
}

export function BotonDeLaMoneda({
  moneda,
  alCambiar,
  deshabilitado = false,
  className = '',
}: BotonDeLaMonedaProps) {
  const textos = useMensajes().proyecto.pago;
  const { idioma } = useIdiomaEnUso();
  const otra: Moneda = moneda === MONEDA_DEL_TALLER ? 'USD' : MONEDA_DEL_TALLER;
  return (
    <button
      type="button"
      translate="no"
      disabled={deshabilitado}
      aria-label={otra === MONEDA_DEL_TALLER ? textos.pasarAPesos : textos.pasarADolares}
      title={otra === MONEDA_DEL_TALLER ? textos.pasarAPesos : textos.pasarADolares}
      onClick={() => {
        alCambiar(otra);
      }}
      className={`-mx-1 flex-none rounded-pill px-1.5 py-1 font-medium text-text-2 underline decoration-dotted underline-offset-3 hover:bg-surface hover:text-ink disabled:no-underline disabled:hover:bg-transparent ${className}`}
    >
      {adornosDelCampo(moneda, idioma).antes}
    </button>
  );
}

export interface DetalleDelPagoProps {
  valor: ValorDelPago;
  alCambiar: (valor: ValorDelPago) => void;
  monedaDelTrabajo: Moneda;
  tesorosEnDolares: readonly TesoroQueRecibeDolares[];
  dolarDelDia?: number | null;
  alCrearUnTesoroEnDolares?: () => void;
  errores?: ErroresDelPago;
  deshabilitado?: boolean;
}

export function DetalleDelPago({
  valor,
  alCambiar,
  monedaDelTrabajo,
  tesorosEnDolares,
  dolarDelDia = null,
  alCrearUnTesoroEnDolares,
  errores = {},
  deshabilitado = false,
}: DetalleDelPagoProps) {
  const textos = useMensajes().proyecto.pago;
  const id = useId();
  const conDolar = necesitaCotizacion(valor.moneda, monedaDelTrabajo);
  const importe = importeDelValor(valor);
  const efecto = importe === null ? null : efectoDelPago(importe, monedaDelTrabajo);
  const enDolares = valor.moneda !== MONEDA_DEL_TALLER;
  const unico = tesorosEnDolares.length === 1 ? tesorosEnDolares[0] : undefined;

  if (!conDolar && !enDolares) return null;

  return (
    <div className="flex flex-col gap-2">
      {conDolar && (
        <CampoDelDolar
          value={valor.cotizacion}
          onChange={(cotizacion) => {
            alCambiar({ ...valor, cotizacion });
          }}
          delDia={
            valor.moneda === MONEDA_DEL_TALLER && dolarDelDia !== null
              ? { valor: dolarDelDia }
              : null
          }
          ayuda={
            errores.cotizacion === undefined
              ? ayudaDelDolarDelPago(valor.moneda, monedaDelTrabajo)
              : undefined
          }
          error={errores.cotizacion}
          conSugerencia={!deshabilitado}
        />
      )}
      {efecto !== null && (
        <p className="text-label leading-normal font-medium text-text-2">
          {loQueHaceElPago(efecto)}
        </p>
      )}
      {enDolares &&
        (tesorosEnDolares.length === 0 ? (
          <div className="flex flex-col items-start gap-1.5 rounded-field bg-atencion-tint px-3 py-2.5">
            <p className="text-label leading-normal text-atencion">{textos.sinTesoroEnDolares}</p>
            {alCrearUnTesoroEnDolares !== undefined && (
              <Button
                type="button"
                variant="secundario"
                size="chico"
                disabled={deshabilitado}
                onClick={alCrearUnTesoroEnDolares}
              >
                {textos.crearUnTesoroEnDolares}
              </Button>
            )}
          </div>
        ) : unico !== undefined ? (
          <p className="text-label leading-normal text-text-2">
            {textos.entraAlTesoro(unico.nombre)}
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-tesoro`} className="text-label text-text-2">
              {textos.entraA}
            </label>
            <select
              id={`${id}-tesoro`}
              value={valor.tesoroId ?? ''}
              disabled={deshabilitado}
              aria-invalid={errores.tesoro === undefined ? undefined : true}
              onChange={(evento) => {
                alCambiar({
                  ...valor,
                  tesoroId: evento.target.value === '' ? null : evento.target.value,
                });
              }}
              className={`h-11 rounded-field border bg-paper px-3 text-body text-ink ${
                errores.tesoro === undefined ? 'border-border' : 'border-alerta'
              }`}
            >
              <option value="" disabled>
                {textos.elegiElTesoro}
              </option>
              {tesorosEnDolares.map((tesoro) => (
                <option key={tesoro.id} value={tesoro.id} translate="no">
                  {tesoro.nombre}
                </option>
              ))}
            </select>
          </div>
        ))}
      {errores.tesoro !== undefined && tesorosEnDolares.length !== 1 && (
        <span role="alert" className="text-label font-medium text-alerta">
          {errores.tesoro}
        </span>
      )}
    </div>
  );
}

export interface CamposDelPagoProps extends DetalleDelPagoProps {
  etiqueta?: string;
  errorDelMonto?: string;
  ayudaDelMonto?: string;
  placeholder?: string;
}

export function CamposDelPago({
  etiqueta,
  errorDelMonto,
  ayudaDelMonto,
  placeholder = '0',
  ...detalle
}: CamposDelPagoProps) {
  const textos = useMensajes().proyecto.pago;
  const id = useId();
  const { valor, alCambiar, tesorosEnDolares, deshabilitado = false } = detalle;
  const describe =
    errorDelMonto !== undefined
      ? `${id}-error`
      : ayudaDelMonto !== undefined
        ? `${id}-ayuda`
        : undefined;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-monto`} className="text-label text-text-2">
          {etiqueta ?? textos.tePago}
        </label>
        <div
          className={`flex h-field items-center gap-1.5 rounded-field border bg-paper px-3 ${
            errorDelMonto === undefined ? 'border-border' : 'border-alerta'
          }`}
        >
          <BotonDeLaMoneda
            moneda={valor.moneda}
            deshabilitado={deshabilitado}
            alCambiar={(moneda) => {
              alCambiar(conOtraMoneda(valor, moneda, tesorosEnDolares));
            }}
          />
          <MoneyInput
            id={`${id}-monto`}
            moneda={valor.moneda}
            value={valor.monto}
            placeholder={placeholder}
            disabled={deshabilitado}
            aria-invalid={errorDelMonto === undefined ? undefined : true}
            aria-describedby={describe}
            onChange={(monto) => {
              alCambiar({ ...valor, monto });
            }}
            className="min-w-0 flex-1 bg-transparent text-body-lg font-semibold tabular-nums outline-none"
          />
        </div>
        {errorDelMonto !== undefined ? (
          <span id={`${id}-error`} role="alert" className="text-label font-medium text-alerta">
            {errorDelMonto}
          </span>
        ) : (
          ayudaDelMonto !== undefined && (
            <span id={`${id}-ayuda`} className="text-meta leading-normal text-text-3">
              {ayudaDelMonto}
            </span>
          )
        )}
      </div>
      <DetalleDelPago {...detalle} />
    </div>
  );
}

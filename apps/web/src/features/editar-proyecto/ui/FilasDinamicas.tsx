import { MONEDA_DEL_TALLER, type Moneda } from '@maun/domain';
import { useEffect, useRef, useState } from 'react';
import type {
  Control,
  FieldErrors,
  UseFieldArrayReturn,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';

import { CasillaDeLaApertura } from '@/entities/movimiento';
import {
  BotonDeLaMoneda,
  conOtraMoneda,
  DetalleDelPago,
  dolarDelDiaParaUnPago,
  filaVacia,
  pagoVacio,
  totalDeLasFilas,
  totalesDeLosPagos,
  type DolarDelDiaDelTaller,
  type FilaDePago,
  type FilaDinamica,
  type FormularioDeProyecto,
  type TesoroQueRecibeDolares,
  type ValorDelPago,
} from '@/entities/proyecto';
import { useMensajes } from '@/shared/idioma';
import { formatearPesos, formatearPlata, hoyEnElTaller, uuidv7 } from '@/shared/lib';
import { AdornoDePlata, Button, Icono, MoneyInput } from '@/shared/ui';

type Lista = 'pagos' | 'gastos';

export interface LoDeLosPagos {
  monedaDelTrabajo: Moneda;
  monedaNueva: Moneda;
  tesorosEnDolares: readonly TesoroQueRecibeDolares[];
  dolarDelDia: DolarDelDiaDelTaller | null;
  alCrearUnTesoroEnDolares?: (alCrear: (tesoroId: string) => void) => void;
}

export interface FilasDinamicasProps {
  lista: Lista;
  control: Control<FormularioDeProyecto>;
  register: UseFormRegister<FormularioDeProyecto>;
  setValue?: UseFormSetValue<FormularioDeProyecto>;
  errores: FieldErrors<FormularioDeProyecto>;
  campos: UseFieldArrayReturn<FormularioDeProyecto, Lista, 'clave'>;
  bloqueado: boolean;
  apertura?: string | null;
  delPago?: LoDeLosPagos;
}

interface Deshacer {
  indice: number;
  fila: FilaDinamica | FilaDePago;
  descripcion: string | null;
}

function esPago(fila: FilaDinamica | FilaDePago | undefined): fila is FilaDePago {
  return fila !== undefined && 'moneda' in fila;
}

function dolarDelDiaParaElPago(
  pago: Pick<FilaDePago, 'moneda' | 'fecha'>,
  delPago: LoDeLosPagos,
): number | null {
  return dolarDelDiaParaUnPago(pago, delPago.monedaDelTrabajo, delPago.dolarDelDia);
}

export function FilasDinamicas({
  lista,
  control,
  register,
  setValue,
  errores,
  campos,
  bloqueado,
  apertura = null,
  delPago,
}: FilasDinamicasProps) {
  const filasDelFormulario = useMensajes().editarProyecto.filas;
  const textosDelFormulario = useMensajes().proyecto.formulario;
  const textos = filasDelFormulario[lista];
  const [deshacer, setDeshacer] = useState<Deshacer | null>(null);
  const contenedor = useRef<HTMLDivElement>(null);

  const filas = useWatch({ control, name: lista }) as readonly (FilaDinamica | FilaDePago)[];
  const pagos = lista === 'pagos' && delPago !== undefined ? delPago : null;
  const total =
    pagos === null
      ? formatearPesos(totalDeLasFilas(filas))
      : formatearPlata(
          totalesDeLosPagos(filas.filter(esPago), pagos.monedaDelTrabajo).enSuMoneda,
          pagos.monedaDelTrabajo,
        );
  const hayTotal = filas.some((fila) => (fila.monto ?? 0) > 0);

  useEffect(() => {
    if (deshacer === null) return;
    const reloj = setTimeout(() => {
      setDeshacer(null);
    }, 7000);
    return () => {
      clearTimeout(reloj);
    };
  }, [deshacer]);

  function agregar(): void {
    const hoy = hoyEnElTaller();
    const nueva =
      pagos === null
        ? filaVacia(uuidv7(), hoy)
        : pagoVacio(
            uuidv7(),
            hoy,
            pagos.monedaNueva,
            dolarDelDiaParaElPago({ moneda: pagos.monedaNueva, fecha: hoy }, pagos),
          );
    campos.append(nueva);
    requestAnimationFrame(() => {
      contenedor.current
        ?.querySelector(`[data-fila="${nueva.id}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  function quitar(indice: number): void {
    const fila = filas[indice];
    const tieneDatos = fila !== undefined && (fila.detalle.trim() !== '' || (fila.monto ?? 0) > 0);

    if (fila !== undefined && tieneDatos) {
      setDeshacer({
        indice,
        fila,
        descripcion:
          fila.detalle.trim() === ''
            ? fila.monto === null
              ? null
              : formatearPlata(fila.monto, esPago(fila) ? fila.moneda : MONEDA_DEL_TALLER)
            : fila.detalle.trim(),
      });
    }
    campos.remove(indice);
  }

  function cambiarElPago(indice: number, anterior: FilaDePago, valor: ValorDelPago): void {
    if (setValue === undefined) return;
    const opciones = { shouldDirty: true };
    if (valor.moneda !== anterior.moneda)
      setValue(`pagos.${indice}.moneda`, valor.moneda, opciones);
    if (valor.cotizacion !== anterior.cotizacion) {
      setValue(`pagos.${indice}.cotizacion`, valor.cotizacion, opciones);
    }
    if (valor.tesoroId !== anterior.tesoroId) {
      setValue(`pagos.${indice}.tesoroId`, valor.tesoroId, opciones);
    }
  }

  const erroresDeLista = errores[lista];

  return (
    <section
      aria-label={textos.titulo}
      className="@container/filas flex flex-col gap-2 rounded-panel border border-hairline bg-paper px-4 pb-4 md:px-5"
      ref={contenedor}
    >
      <div className="flex flex-col gap-2 bg-paper pt-4 md:sticky md:top-17 md:z-10 md:border-b md:border-hairline-soft md:pb-2.5">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-section font-semibold">{textos.titulo}</h2>
            <span role="status" translate="no" className="text-label text-text-2 tabular-nums">
              {hayTotal ? total : ''}
            </span>
          </div>
          <p className="text-meta leading-normal text-text-3">{textos.ayuda}</p>
        </div>
        <Button
          type="button"
          variant="secundario"
          size="chico"
          onClick={agregar}
          disabled={bloqueado}
          className="w-full border-dashed md:w-auto md:self-start"
        >
          <Icono nombre="plus" tamano={16} />
          {textos.agregar}
        </Button>
      </div>

      {campos.fields.length === 0 && <p className="text-label text-text-2">{textos.vacio}</p>}

      <ul className="flex list-none flex-col">
        {campos.fields.map((campo, indice) => {
          const errorDeFila = erroresDeLista?.[indice] as
            (FieldErrors<FilaDePago> & FieldErrors<FilaDinamica>) | undefined;
          const fila = filas[indice];
          const pago = pagos !== null && esPago(fila) ? fila : null;
          const moneda = pago?.moneda ?? MONEDA_DEL_TALLER;
          const errorDelMonto =
            errorDeFila?.monto === undefined
              ? undefined
              : moneda === MONEDA_DEL_TALLER
                ? textosDelFormulario.sinMonto
                : textosDelFormulario.sinMontoEnDolares;
          return (
            <li
              key={campo.clave}
              data-fila={campo.id}
              className="grid grid-cols-[minmax(8rem,1fr)_minmax(0,1fr)_44px] items-center gap-2 border-t border-hairline-soft py-2.5 @lg/filas:grid-cols-[minmax(0,1fr)_10.5rem_9rem_44px]"
            >
              <input
                {...register(`${lista}.${indice}.detalle` as const)}
                aria-label={textos.detalle(indice + 1)}
                placeholder={textos.placeholder}
                disabled={bloqueado}
                className="col-span-2 h-11 min-w-0 rounded-field border border-border bg-paper px-3 text-body-lg text-ink @lg/filas:col-span-1"
              />
              <input
                {...register(`${lista}.${indice}.fecha` as const)}
                type="date"
                max={lista === 'pagos' ? hoyEnElTaller() : undefined}
                aria-label={filasDelFormulario.fecha(indice + 1)}
                disabled={bloqueado}
                className={`h-11 min-w-0 rounded-field border bg-paper px-2.5 text-body text-ink ${
                  errorDeFila?.fecha ? 'border-alerta' : 'border-border'
                }`}
              />
              <div
                className={`col-span-2 flex h-11 min-w-0 items-center gap-1 rounded-field border bg-paper px-2.5 @lg/filas:col-span-1 ${
                  errorDeFila?.monto ? 'border-alerta' : 'border-border'
                }`}
              >
                {pago !== null && pagos !== null ? (
                  <BotonDeLaMoneda
                    moneda={pago.moneda}
                    deshabilitado={bloqueado}
                    alCambiar={(otra) => {
                      cambiarElPago(
                        indice,
                        pago,
                        conOtraMoneda(pago, otra, pagos.tesorosEnDolares),
                      );
                    }}
                  />
                ) : (
                  <AdornoDePlata className="text-text-3" />
                )}
                <Controller
                  control={control}
                  name={`${lista}.${indice}.monto` as const}
                  render={({ field }) => (
                    <MoneyInput
                      ref={field.ref}
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      moneda={moneda}
                      aria-label={filasDelFormulario.monto(indice + 1)}
                      placeholder="0"
                      disabled={bloqueado}
                      className="min-w-0 flex-1 bg-transparent text-right text-body font-semibold outline-none"
                    />
                  )}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  quitar(indice);
                }}
                disabled={bloqueado}
                aria-label={textos.quitar(indice + 1)}
                className="col-start-3 row-start-1 flex size-11 items-center justify-center justify-self-center rounded-pill text-text-3 hover:bg-surface hover:text-alerta @lg/filas:col-start-auto @lg/filas:row-start-auto"
              >
                <Icono nombre="trash-2" tamano={18} />
              </button>
              {(errorDelMonto ?? errorDeFila?.fecha) && (
                <span
                  role="alert"
                  className="col-span-3 text-label font-medium text-alerta @lg/filas:col-span-4"
                >
                  {errorDelMonto ?? errorDeFila?.fecha?.message}
                </span>
              )}
              {pago !== null && pagos !== null && (
                <div className="col-span-3 @lg/filas:col-span-4">
                  <DetalleDelPago
                    valor={pago}
                    alCambiar={(valor) => {
                      cambiarElPago(indice, pago, valor);
                    }}
                    monedaDelTrabajo={pagos.monedaDelTrabajo}
                    tesorosEnDolares={pagos.tesorosEnDolares}
                    dolarDelDia={dolarDelDiaParaElPago(pago, pagos)}
                    alCrearUnTesoroEnDolares={
                      pagos.alCrearUnTesoroEnDolares === undefined
                        ? undefined
                        : () => {
                            pagos.alCrearUnTesoroEnDolares?.((tesoroId) => {
                              cambiarElPago(indice, pago, { ...pago, tesoroId });
                            });
                          }
                    }
                    errores={{
                      cotizacion: errorDeFila?.cotizacion?.message,
                      tesoro: errorDeFila?.tesoroId?.message,
                    }}
                    deshabilitado={bloqueado}
                  />
                </div>
              )}
              {lista === 'pagos' && (
                <Controller
                  control={control}
                  name={`pagos.${indice}.enLaApertura` as const}
                  render={({ field }) => (
                    <CasillaDeLaApertura
                      className="col-span-3 @lg/filas:col-span-4"
                      fecha={filas[indice]?.fecha ?? ''}
                      apertura={apertura}
                      marcada={field.value}
                      alCambiar={field.onChange}
                      disabled={bloqueado}
                    />
                  )}
                />
              )}
            </li>
          );
        })}
      </ul>

      {deshacer !== null && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-field bg-ink px-3 py-2 text-label text-paper"
        >
          <span className="min-w-0 truncate">
            {deshacer.descripcion === null
              ? filasDelFormulario.quiteLaFila
              : filasDelFormulario.quite(deshacer.descripcion)}
          </span>
          <button
            type="button"
            onClick={() => {
              campos.insert(deshacer.indice, deshacer.fila);
              setDeshacer(null);
            }}
            className="min-h-tap flex-none px-2 font-semibold underline underline-offset-2"
          >
            {filasDelFormulario.deshacer}
          </button>
        </div>
      )}
    </section>
  );
}

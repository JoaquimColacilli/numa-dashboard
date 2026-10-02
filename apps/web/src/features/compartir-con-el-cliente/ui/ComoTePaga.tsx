import {
  conLaForma,
  FORMAS_DE_COBRO,
  MONEDA_DEL_TALLER,
  ofrece,
  type FormaDeCobro,
} from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useId, useState, type ReactNode } from 'react';

import {
  cambioDeFormas,
  ETIQUETA_DE_LA_FORMA,
  formasComoEstan,
  MUTACION_DE_FORMAS_DE_COBRO,
  NOMBRE_DE_LA_INSTANCIA,
  type ResumenDeProyecto,
} from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { ajustesDe, mensajeDeSincronizacion } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { metaDeAvisos, RUTA_DE_AJUSTES, Ir } from '@/shared/lib';
import { FondoDelElegido, Icono } from '@/shared/ui';

import {
  cambioDelCobro,
  cobroElegido,
  COBROS_DEL_TRABAJO,
  cuentasQueFaltan,
  filasDeCobro,
  type CobroDelTrabajo,
} from '../model/comoTePaga';
import { DolarDelDia } from './DolarDelDia';

function EnlaceAAjustes({ children }: { children: ReactNode }) {
  return (
    <Ir a={RUTA_DE_AJUSTES} className="font-semibold underline">
      {children}
    </Ir>
  );
}

export interface ComoTePagaProps {
  resumen: ResumenDeProyecto;
}

export function ComoTePaga({ resumen }: ComoTePagaProps) {
  const t = useMensajes().compartirConElCliente.comoTePaga;
  const id = useId();
  const replica = useReplicaDelTaller();
  const ajustes = ajustesDe(replica);
  const guardar = useMutation({
    ...MUTACION_DE_FORMAS_DE_COBRO,
    meta: metaDeAvisos('formasDeCobro', { errorEnPantalla: true }),
  });
  const [insistiendo, setInsistiendo] = useState<string | null>(null);

  const filas = filasDeCobro(resumen, ajustes);
  const faltan = cuentasQueFaltan(resumen.proyecto, ajustes);
  const elegido = cobroElegido(resumen.proyecto);

  function tocar(
    instancia: 'sena' | 'saldo',
    forma: FormaDeCobro,
    formas: readonly FormaDeCobro[],
  ) {
    const siguiente = conLaForma(formas, forma, !ofrece(formas, forma));
    if (siguiente === null) {
      setInsistiendo(`${instancia}:${forma}`);
      return;
    }
    setInsistiendo(null);
    guardar.mutate({
      id: resumen.proyecto.id,
      cambios: cambioDeFormas(instancia, siguiente),
      previos: formasComoEstan(resumen.proyecto),
      version: resumen.proyecto.version,
    });
  }

  function elegir(cobro: CobroDelTrabajo) {
    const cambio = cambioDelCobro(resumen.proyecto, cobro);
    if (cambio === null) return;
    setInsistiendo(null);
    guardar.mutate(cambio);
  }

  return (
    <section
      aria-label={t.titulo}
      className="rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <h2 className="text-section font-semibold">{t.titulo}</h2>
      <p className="mt-1.5 mb-3 max-w-[520px] text-body leading-normal text-text-2">{t.elegi}</p>

      {filas.length > 0 && (
        <fieldset className="flex flex-col gap-1.5 pb-3">
          <legend className="mb-1.5 text-label text-text-2">{t.tePagaEn}</legend>
          <div className="relative grid max-w-[30rem] grid-cols-3 gap-0.5 rounded-pill bg-ink/6 p-1">
            <FondoDelElegido elegido={elegido} />
            {COBROS_DEL_TRABAJO.map((cobro) => (
              <label
                key={cobro}
                data-opcion={cobro}
                className="relative flex min-h-tap cursor-pointer items-center justify-center rounded-pill px-1 text-center text-label leading-tight font-medium text-text-2 has-checked:font-semibold has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
              >
                <input
                  type="radio"
                  name={`${id}-te-paga-en`}
                  value={cobro}
                  checked={cobro === elegido}
                  onChange={() => {
                    elegir(cobro);
                  }}
                  className="sr-only"
                />
                {t.monedas[cobro]}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {filas.length > 0 && resumen.moneda !== MONEDA_DEL_TALLER && <DolarDelDia />}

      {filas.length === 0 ? (
        <p className="border-t border-hairline py-3.5 text-body text-text-2">{t.nadaQueCobrar}</p>
      ) : (
        <ul className="list-none">
          {filas.map(({ instancia, formas }) => (
            <li
              key={instancia}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-hairline-soft py-3"
            >
              <span className="min-w-0 flex-1 text-body font-medium">
                {NOMBRE_DE_LA_INSTANCIA[instancia]}
              </span>
              <div
                role="group"
                aria-label={t.comoTeLaPaga[instancia]}
                className="flex flex-none gap-1 rounded-pill bg-ink/6 p-1"
              >
                {FORMAS_DE_COBRO.map((forma) => {
                  const elegida = ofrece(formas, forma);
                  return (
                    <button
                      key={forma}
                      type="button"
                      role="checkbox"
                      aria-checked={elegida}
                      onClick={() => {
                        tocar(instancia, forma, formas);
                      }}
                      className={`flex min-h-tap items-center gap-1.5 rounded-pill px-3 text-label ${
                        elegida
                          ? 'bg-elevado font-semibold text-ink shadow-float'
                          : 'font-medium text-text-2'
                      }`}
                    >
                      <Icono
                        nombre={elegida ? 'check' : 'plus'}
                        tamano={14}
                        className={elegida ? '' : 'text-text-3'}
                      />
                      {ETIQUETA_DE_LA_FORMA[forma]}
                    </button>
                  );
                })}
              </div>
              {FORMAS_DE_COBRO.some((forma) => insistiendo === `${instancia}:${forma}`) && (
                <p role="alert" className="w-full text-label leading-normal text-atencion">
                  {t.alMenosUna}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {faltan.enPesos && filas.length > 0 && (
        <p className="mt-2.5 flex flex-wrap items-baseline gap-x-1.5 text-label leading-normal text-text-2">
          <Icono nombre="circle-alert" tamano={14} className="translate-y-0.5 text-atencion" />
          <span>{t.sinDatosParaTransferir}</span>
          <Ir a={RUTA_DE_AJUSTES} className="font-semibold underline">
            {t.cargalosEnAjustes}
          </Ir>
        </p>
      )}

      {faltan.enDolares && filas.length > 0 && (
        <p className="mt-2.5 flex flex-wrap items-baseline gap-x-1.5 text-label leading-normal text-text-2">
          <Icono nombre="circle-alert" tamano={14} className="translate-y-0.5 text-atencion" />
          <span>{t.sinCuentaEnDolares(EnlaceAAjustes)}</span>
        </p>
      )}

      {guardar.isError && (
        <p role="alert" className="mt-2 text-label font-medium text-alerta">
          {mensajeDeSincronizacion(guardar.error, {
            operacion: 'proyecto',
            sujeto: resumen.proyecto.titulo,
          })}
        </p>
      )}
    </section>
  );
}

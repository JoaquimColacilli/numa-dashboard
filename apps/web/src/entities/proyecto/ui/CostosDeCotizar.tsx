import {
  centavos,
  centavosEn,
  dolaresDePesos,
  esCotizacion,
  faseDe,
  MONEDA_DEL_TALLER,
  pesosDeDolares,
  type CategoriaDeCosto,
  type Cotizacion,
  type Moneda,
} from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';

import { mensajeDeSincronizacion, monedaDelTrabajo } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { formatearPlata, metaDeAvisos, useAlgoEnCurso } from '@/shared/lib';
import {
  BloquePlegable,
  CampoDelDolar,
  errorDelDolar,
  EstadoDeGuardado,
  MoneyInput,
} from '@/shared/ui';

import { MUTACION_DE_COSTOS } from '../api/mutacion';
import type { Proyecto } from '../model/catalogos';
import {
  cambiosDeCostos,
  costoGuardado,
  COSTOS_DEL_TRABAJO,
  cotizacionDeLosCostos,
  margenEnSuMoneda,
  type MargenEnSuMoneda,
} from '../model/costos';
import { BotonDeLaMoneda } from './CamposDelPago';

const DEMORA_DE_LOS_COSTOS_MS = 900;

type Escritos = Record<CategoriaDeCosto, number | null>;

type MonedasDeLosCostos = Record<CategoriaDeCosto, Moneda>;

const TODOS_EN_PESOS: MonedasDeLosCostos = {
  madera: MONEDA_DEL_TALLER,
  herrajes: MONEDA_DEL_TALLER,
  flete: MONEDA_DEL_TALLER,
  ayudante: MONEDA_DEL_TALLER,
};

function loGuardado(proyecto: Proyecto): Escritos {
  const escritos = {} as Escritos;
  for (const costo of COSTOS_DEL_TRABAJO) {
    escritos[costo.categoria] = costoGuardado(proyecto, costo.columna);
  }
  return escritos;
}

function Renglon({ clave, valor, tono = '' }: { clave: string; valor: string; tono?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-hairline py-2">
      <span className="text-label text-text-2">{clave}</span>
      <span
        translate="no"
        className={`text-money font-semibold tabular-nums whitespace-nowrap ${tono}`}
      >
        {valor}
      </span>
    </div>
  );
}

function Margen({ deLaMoneda, sinAprobar }: { deLaMoneda: MargenEnSuMoneda; sinAprobar: boolean }) {
  const textos = useMensajes().proyecto.costosDeCotizar;
  const { moneda, margen } = deLaMoneda;
  const enSuMoneda = (importe: number) => formatearPlata(importe, moneda);
  if (margen.situacion === 'sin-estimar') return null;

  if (margen.situacion === 'sin-cotizacion') {
    return (
      <>
        <Renglon
          clave={textos.costoEstimado}
          valor={formatearPlata(margen.estimado, MONEDA_DEL_TALLER)}
        />
        <p className="pt-1.5 text-meta leading-normal text-text-3">{textos.faltaElDolar}</p>
      </>
    );
  }

  if (margen.situacion === 'sin-presupuesto') {
    return (
      <>
        <Renglon clave={textos.costoEstimado} valor={enSuMoneda(margen.estimado)} />
        <p className="pt-1.5 text-meta leading-normal text-text-3">{textos.sinPresupuesto}</p>
      </>
    );
  }

  const enContra = margen.margen < 0;
  return (
    <>
      <Renglon clave={textos.costoEstimado} valor={enSuMoneda(margen.estimado)} />
      <Renglon clave={textos.presupuesto} valor={enSuMoneda(margen.presupuesto)} />
      <Renglon
        clave={sinAprobar ? textos.teQuedaSiTeLoAprueban : textos.teQueda}
        valor={enSuMoneda(margen.margen)}
        tono={enContra ? 'text-alerta' : 'text-hogar'}
      />
      {enContra && (
        <p className="pt-1.5 text-meta leading-normal font-medium text-alerta">{textos.enContra}</p>
      )}
    </>
  );
}

interface CampoDeCostoProps {
  etiqueta: string;
  pesos: number | null;
  moneda: Moneda;
  cotizacion: Cotizacion | null;
  alCambiarLaMoneda: (moneda: Moneda) => void;
  alEscribir: (pesos: number | null) => void;
}

function CampoDeCosto({
  etiqueta,
  pesos,
  moneda,
  cotizacion,
  alCambiarLaMoneda,
  alEscribir,
}: CampoDeCostoProps) {
  const textos = useMensajes().proyecto.costosDeCotizar;
  const id = useId();
  const enDolares = moneda === 'USD' && cotizacion !== null;
  const suya: Moneda = enDolares ? 'USD' : MONEDA_DEL_TALLER;
  const dolares =
    pesos === null || cotizacion === null ? null : dolaresDePesos(centavos(pesos), cotizacion);
  const otra =
    pesos === null || dolares === null
      ? null
      : enDolares
        ? formatearPlata(pesos, MONEDA_DEL_TALLER)
        : formatearPlata(dolares, 'USD');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label text-text-2">
        {etiqueta}
      </label>
      <div className="flex h-field items-center gap-1.5 rounded-field border border-border bg-paper px-3">
        <BotonDeLaMoneda
          moneda={suya}
          deshabilitado={cotizacion === null}
          alCambiar={alCambiarLaMoneda}
        />
        <MoneyInput
          id={id}
          moneda={suya}
          value={enDolares ? dolares : pesos}
          placeholder={textos.sinEstimar}
          onChange={(valor) => {
            if (valor === null || !enDolares) {
              alEscribir(valor);
              return;
            }
            alEscribir(pesosDeDolares(centavosEn('USD', valor), cotizacion));
          }}
          className="min-w-0 flex-1 bg-transparent text-body-lg font-semibold tabular-nums outline-none"
        />
      </div>
      {otra !== null && (
        <span translate="no" className="text-meta leading-normal text-text-3">
          {textos.aproximado(otra)}
        </span>
      )}
    </div>
  );
}

export interface CostosDeCotizarProps {
  proyecto: Proyecto;
  abiertoAlPrincipio?: boolean;
  anidado?: boolean;
}

export function CostosDeCotizar({
  proyecto,
  abiertoAlPrincipio = true,
  anidado = false,
}: CostosDeCotizarProps) {
  const textos = useMensajes().proyecto.costosDeCotizar;
  const guardar = useMutation({
    ...MUTACION_DE_COSTOS,
    meta: metaDeAvisos('costosEstimados', { silencioso: true, sujeto: proyecto.titulo }),
  });
  const [escritos, setEscritos] = useState<Escritos | null>(null);
  const [cotizacionEscrita, setCotizacionEscrita] = useState<number | null | undefined>(undefined);
  const [monedas, setMonedas] = useState<MonedasDeLosCostos>(TODOS_EN_PESOS);
  const [sinGuardar, setSinGuardar] = useState(false);
  const reloj = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useAlgoEnCurso(sinGuardar);

  useEffect(
    () => () => {
      clearTimeout(reloj.current);
    },
    [],
  );

  const enDolares = monedaDelTrabajo(proyecto) !== MONEDA_DEL_TALLER;
  const cotizacionGuardada = cotizacionDeLosCostos(proyecto);
  const cotizacionVisible =
    cotizacionEscrita === undefined ? cotizacionGuardada : cotizacionEscrita;
  const errorDeLaCotizacion = enDolares ? errorDelDolar(cotizacionVisible, false) : undefined;
  const cotizacion = enDolares && esCotizacion(cotizacionVisible) ? cotizacionVisible : null;

  const visibles = escritos ?? loGuardado(proyecto);
  const deLaMoneda = margenEnSuMoneda({
    ...proyecto,
    ...cambiosDeCostos(visibles, enDolares ? cotizacion : undefined),
  } satisfies Proyecto);
  const cargadas = COSTOS_DEL_TRABAJO.filter((costo) => visibles[costo.categoria] !== null).length;

  function guardarDespues(costos: Escritos, cotizacionNueva: number | null): void {
    setSinGuardar(true);
    clearTimeout(reloj.current);
    reloj.current = setTimeout(() => {
      setSinGuardar(false);
      guardar.mutate({
        id: proyecto.id,
        cambios: cambiosDeCostos(costos, enDolares ? cotizacionNueva : undefined),
        previos: cambiosDeCostos(loGuardado(proyecto), enDolares ? cotizacionGuardada : undefined),
        version: proyecto.version,
      });
    }, DEMORA_DE_LOS_COSTOS_MS);
  }

  function alEscribir(categoria: CategoriaDeCosto, valor: number | null): void {
    const siguientes = { ...visibles, [categoria]: valor };
    setEscritos(siguientes);
    guardarDespues(siguientes, cotizacion ?? cotizacionGuardada);
  }

  function alEscribirLaCotizacion(valor: number | null): void {
    setCotizacionEscrita(valor);
    if (valor !== null && !esCotizacion(valor)) return;
    guardarDespues(visibles, valor);
  }

  return (
    <BloquePlegable
      titulo={textos.titulo}
      abiertoAlPrincipio={abiertoAlPrincipio}
      enTarjeta={!anidado}
      ayuda={textos.ayuda}
      resumen={
        <span className="flex items-center gap-2.5">
          {cargadas > 0 && <span>{textos.cargadas(cargadas, COSTOS_DEL_TRABAJO.length)}</span>}
          <EstadoDeGuardado
            sinGuardar={sinGuardar}
            enPausa={guardar.isPaused}
            enVuelo={guardar.isPending && !guardar.isPaused}
            conError={guardar.isError}
            guardado={guardar.isSuccess}
          />
        </span>
      }
    >
      {enDolares && (
        <div className="mb-3 max-w-[22rem]">
          <CampoDelDolar
            etiqueta={textos.dolarParaLosCostos}
            value={cotizacionVisible}
            onChange={alEscribirLaCotizacion}
            error={errorDeLaCotizacion}
            ayuda={errorDeLaCotizacion === undefined ? textos.ayudaDelDolar : undefined}
          />
        </div>
      )}

      <div className="@container/costos">
        <div className="grid grid-cols-1 gap-3 @sm/costos:grid-cols-2">
          {COSTOS_DEL_TRABAJO.map((costo) =>
            enDolares ? (
              <CampoDeCosto
                key={costo.columna}
                etiqueta={costo.etiqueta}
                pesos={visibles[costo.categoria]}
                moneda={monedas[costo.categoria]}
                cotizacion={cotizacion}
                alCambiarLaMoneda={(moneda) => {
                  setMonedas({ ...monedas, [costo.categoria]: moneda });
                }}
                alEscribir={(valor) => {
                  alEscribir(costo.categoria, valor);
                }}
              />
            ) : (
              <MoneyInput
                key={costo.columna}
                etiqueta={costo.etiqueta}
                placeholder={textos.sinEstimar}
                value={visibles[costo.categoria]}
                onChange={(valor) => {
                  alEscribir(costo.categoria, valor);
                }}
              />
            ),
          )}
        </div>
      </div>

      <div className="mt-3.5">
        <Margen
          deLaMoneda={deLaMoneda}
          sinAprobar={
            faseDe(proyecto.estado) === 'consultas' || faseDe(proyecto.estado) === 'seguimiento'
          }
        />
      </div>

      {guardar.isError && (
        <p role="alert" className="mt-1.5 text-label font-medium text-alerta">
          {mensajeDeSincronizacion(guardar.error)}
        </p>
      )}
    </BloquePlegable>
  );
}

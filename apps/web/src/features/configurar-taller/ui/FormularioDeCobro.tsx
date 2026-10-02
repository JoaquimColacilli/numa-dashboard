import { useMutation } from '@tanstack/react-query';
import { useState, type SyntheticEvent } from 'react';

import { formatearCbu, formatearCuit } from '@maun/domain';

import { mensajeDeSincronizacion, type FilaDe } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { useEstadoSync } from '@/shared/lib';
import { Button, Campo, CamposJuntos } from '@/shared/ui';

import { MUTACION_DE_AJUSTES } from '../api/mutacion';
import { diferencias } from '../model/cambios';
import {
  avisoDelAlias,
  avisoDelCuitDelTaller,
  cambiosDeCobro,
  cobroDeLosAjustes,
  errorDeCobro,
  etiquetaDeLaClave,
  LARGO_DEL_TITULAR,
  type DatosDeCobro,
  type ErrorDeCobro,
} from '../model/cobro';

export const COSTOS_DE_MERCADO_PAGO =
  'https://www.mercadopago.com.ar/herramientas-para-vender/link-de-pago';

export function FormularioDeCobro({ ajustes }: { ajustes: FilaDe<'ajustes'> }) {
  const { configurarTaller } = useMensajes();
  const m = configurarTaller.cobro;
  const [datos, setDatos] = useState<DatosDeCobro>(() => cobroDeLosAjustes(ajustes));
  const [error, setError] = useState<ErrorDeCobro | undefined>(undefined);

  const guardar = useMutation(MUTACION_DE_AJUSTES);
  const estadoSync = useEstadoSync();

  const guardando = guardar.isPending;
  const guardado =
    !guardando && !guardar.isError && guardar.isSuccess && estadoSync.tipo === 'sincronizado';

  const cambiar = (campo: keyof DatosDeCobro, valor: string) => {
    setDatos((previos) => ({ ...previos, [campo]: valor }));
  };

  function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();

    const problema = errorDeCobro(datos);
    if (problema) {
      setError(problema);
      return;
    }
    setError(undefined);

    const { cambios, previos } = diferencias(ajustes, cambiosDeCobro(datos));
    if (Object.keys(cambios).length === 0) return;
    guardar.mutate({ id: ajustes.id, cambios, previos });
  }

  return (
    <form noValidate className="flex flex-col gap-3" onSubmit={enviar}>
      <CamposJuntos>
        <div className="flex min-w-0 flex-col gap-3">
          <Campo
            etiqueta={m.alias}
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            ayuda={m.ayudaDelAlias}
            value={datos.alias}
            error={error?.campo === 'alias' ? error.mensaje : undefined}
            onChange={(evento) => {
              cambiar('alias', evento.target.value);
            }}
          />
          {error?.campo !== 'alias' && avisoDelAlias(datos.alias) !== undefined && (
            <p className="-mt-1.5 text-label leading-normal text-atencion">
              {avisoDelAlias(datos.alias)}
            </p>
          )}
        </div>
        <Campo
          etiqueta={etiquetaDeLaClave(datos.cbu)}
          inputMode="numeric"
          ayuda={m.ayudaDelCbu}
          value={datos.cbu}
          error={error?.campo === 'cbu' ? error.mensaje : undefined}
          onChange={(evento) => {
            cambiar('cbu', formatearCbu(evento.target.value));
          }}
        />
      </CamposJuntos>
      <CamposJuntos>
        <Campo
          etiqueta={m.titular}
          maxLength={LARGO_DEL_TITULAR}
          ayuda={m.ayudaDelTitular}
          value={datos.titular}
          error={error?.campo === 'titular' ? error.mensaje : undefined}
          onChange={(evento) => {
            cambiar('titular', evento.target.value);
          }}
        />
        <Campo
          etiqueta={m.cuitDelTitular}
          inputMode="numeric"
          ayuda={
            error?.campo === 'cuit'
              ? undefined
              : (avisoDelCuitDelTaller(datos.cuit) ?? m.ayudaDelCuit)
          }
          value={datos.cuit}
          error={error?.campo === 'cuit' ? error.mensaje : undefined}
          onChange={(evento) => {
            cambiar('cuit', formatearCuit(evento.target.value));
          }}
        />
      </CamposJuntos>
      <Campo
        etiqueta={m.link}
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        ayuda={m.ayudaDelLink}
        value={datos.link}
        error={error?.campo === 'link' ? error.mensaje : undefined}
        onChange={(evento) => {
          cambiar('link', evento.target.value);
        }}
      />
      <p className="-mt-1.5 text-label leading-normal text-atencion">
        {m.comision}{' '}
        <a
          href={COSTOS_DE_MERCADO_PAGO}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-3"
        >
          {m.verLosCostos}
        </a>
      </p>

      {guardar.isError && (
        <p role="alert" className="text-label font-medium text-alerta">
          {mensajeDeSincronizacion(guardar.error)}
        </p>
      )}
      {guardando && estadoSync.tipo === 'sin-conexion' && (
        <p className="text-label text-atencion">{configurarTaller.enLaCola}</p>
      )}
      {guardado && <p className="text-label text-hogar">{configurarTaller.guardado}</p>}

      <Button type="submit" cargando={guardando} className="mt-1 self-start">
        {m.guardar}
      </Button>
    </form>
  );
}

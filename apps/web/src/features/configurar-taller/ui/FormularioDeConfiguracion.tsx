import { useMutation } from '@tanstack/react-query';
import { useState, type SyntheticEvent } from 'react';

import { diasQueValeElPresupuesto } from '@/entities/proyecto';
import { mensajeDeSincronizacion, type CambiosDeAjustes, type FilaDe } from '@/shared/api';
import { useMensajes, type Mensajes } from '@/shared/idioma';
import {
  formatearPorcentaje,
  parsearPorcentaje,
  SENA_MAXIMA_BP,
  useEstadoSync,
} from '@/shared/lib';
import { Button, Campo, CamposJuntos, MoneyInput } from '@/shared/ui';

import { MUTACION_DE_AJUSTES, MUTACION_DEL_NOMBRE } from '../api/mutacion';
import { diferencias } from '../model/cambios';
import { cambioDelRelevamiento, valorDelRelevamiento } from '../model/relevamiento';
import { DIAS_MAXIMOS_DE_UN_PRESUPUESTO, parsearDias } from '../model/vigencia';

const LARGO_DEL_NOMBRE = 120;

export type ParteDeLaConfiguracion = 'taller' | 'reparto' | 'cocos';

const TODAS_LAS_PARTES: readonly ParteDeLaConfiguracion[] = ['taller', 'reparto', 'cocos'];

type CampoDelFormulario = 'nombre' | 'sueldo' | 'fijos' | 'meta' | 'tasa' | 'sena' | 'vigencia';

type ErroresDeLaConfiguracion = Mensajes['configurarTaller']['configuracion']['errores'];

function mensajeDelCampo(campo: CampoDelFormulario, errores: ErroresDeLaConfiguracion): string {
  switch (campo) {
    case 'tasa':
      return errores.tasa;
    case 'sena':
      return errores.sena;
    case 'vigencia':
      return errores.vigencia(DIAS_MAXIMOS_DE_UN_PRESUPUESTO);
    default:
      return errores.importe;
  }
}

type ValorDelFormulario = [CampoDelFormulario, keyof CambiosDeAjustes, number | null | undefined];

interface ErrorDelFormulario {
  campo: CampoDelFormulario;
  mensaje: string;
}

export interface FormularioDeConfiguracionProps {
  household: FilaDe<'households'>;
  ajustes: FilaDe<'ajustes'>;
  partes?: readonly ParteDeLaConfiguracion[];
}

export function FormularioDeConfiguracion({
  household,
  ajustes,
  partes = TODAS_LAS_PARTES,
}: FormularioDeConfiguracionProps) {
  const { configurarTaller } = useMensajes();
  const m = configurarTaller.configuracion;
  const [nombre, setNombre] = useState(household.nombre);
  const [sueldo, setSueldo] = useState<number | null>(ajustes.sueldo_mensual_centavos);
  const [fijos, setFijos] = useState<number | null>(ajustes.costos_fijos_centavos);
  const [meta, setMeta] = useState<number | null>(ajustes.meta_cocos_centavos);
  const [tasa, setTasa] = useState(() => formatearPorcentaje(ajustes.tasa_cocos_anual_bp));
  const [sena, setSena] = useState(() => formatearPorcentaje(ajustes.sena_bp));
  const [relevamiento, setRelevamiento] = useState(() => valorDelRelevamiento(ajustes));
  const [vigencia, setVigencia] = useState(() => String(diasQueValeElPresupuesto(ajustes)));
  const [error, setError] = useState<ErrorDelFormulario | undefined>(undefined);

  const mutacionDeAjustes = useMutation(MUTACION_DE_AJUSTES);
  const mutacionDelNombre = useMutation(MUTACION_DEL_NOMBRE);
  const estadoSync = useEstadoSync();

  const conElTaller = partes.includes('taller');
  const conElReparto = partes.includes('reparto');
  const conCocos = partes.includes('cocos');
  const cuantos = (conElTaller ? 4 : 0) + (conElReparto ? 2 : 0) + (conCocos ? 2 : 0);

  const guardando = mutacionDeAjustes.isPending || mutacionDelNombre.isPending;
  const hayFallo = mutacionDeAjustes.isError || mutacionDelNombre.isError;
  const fallo = mutacionDeAjustes.isError ? mutacionDeAjustes.error : mutacionDelNombre.error;
  const guardado =
    !guardando &&
    !hayFallo &&
    (mutacionDeAjustes.isSuccess || mutacionDelNombre.isSuccess) &&
    estadoSync.tipo === 'sincronizado';

  function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();

    const nombreLimpio = nombre.trim();
    if (conElTaller && (nombreLimpio === '' || nombreLimpio.length > LARGO_DEL_NOMBRE)) {
      setError({
        campo: 'nombre',
        mensaje: m.errores.nombre(LARGO_DEL_NOMBRE),
      });
      return;
    }

    const faltante: ValorDelFormulario[] = [];
    if (conElReparto) {
      faltante.push(
        ['sueldo', 'sueldo_mensual_centavos', sueldo],
        ['fijos', 'costos_fijos_centavos', fijos],
      );
    }
    if (conCocos) {
      faltante.push(
        ['meta', 'meta_cocos_centavos', meta],
        ['tasa', 'tasa_cocos_anual_bp', parsearPorcentaje(tasa)],
      );
    }
    if (conElTaller) {
      faltante.push(
        ['sena', 'sena_bp', parsearPorcentaje(sena, SENA_MAXIMA_BP)],
        ['vigencia', 'presupuesto_vale_dias', parsearDias(vigencia)],
      );
    }
    const invalido = faltante.find(([, , valor]) => valor === undefined || valor === null);
    if (invalido) {
      setError({
        campo: invalido[0],
        mensaje: mensajeDelCampo(invalido[0], m.errores),
      });
      return;
    }

    setError(undefined);
    const valores = Object.fromEntries(
      faltante.map(([, columna, valor]) => [columna, valor]),
    ) as CambiosDeAjustes;
    const { cambios, previos } = diferencias(
      ajustes,
      conElTaller ? { ...valores, ...cambioDelRelevamiento(ajustes, relevamiento) } : valores,
    );

    if (Object.keys(cambios).length > 0) {
      mutacionDeAjustes.mutate({ id: ajustes.id, cambios, previos });
    }
    if (conElTaller && nombreLimpio !== household.nombre) {
      mutacionDelNombre.mutate({
        id: household.id,
        nombre: nombreLimpio,
        previo: household.nombre,
      });
    }
  }

  return (
    <form noValidate className="flex flex-col gap-3" onSubmit={enviar}>
      <CamposJuntos columnas={cuantos > 2 ? 3 : 2} deADos campoMinimo="12rem">
        {conElTaller && (
          <Campo
            etiqueta={m.nombreDelTaller}
            value={nombre}
            maxLength={LARGO_DEL_NOMBRE}
            error={error?.campo === 'nombre' ? error.mensaje : undefined}
            onChange={(evento) => {
              setNombre(evento.target.value);
            }}
          />
        )}
        {conElReparto && (
          <MoneyInput
            etiqueta={m.sueldo}
            ayuda={
              ajustes.sueldo_tope_mensual ? m.ayudaDelSueldoPorMes : m.ayudaDelSueldoPorTrabajo
            }
            value={sueldo}
            error={error?.campo === 'sueldo' ? error.mensaje : undefined}
            onChange={setSueldo}
          />
        )}
        {conElReparto && (
          <MoneyInput
            etiqueta={m.costosFijos}
            ayuda={m.ayudaDeLosCostosFijos}
            value={fijos}
            error={error?.campo === 'fijos' ? error.mensaje : undefined}
            onChange={setFijos}
          />
        )}
        {conCocos && (
          <MoneyInput
            etiqueta={m.metaDeCocos}
            ayuda={m.ayudaDeLaMeta}
            value={meta}
            error={error?.campo === 'meta' ? error.mensaje : undefined}
            onChange={setMeta}
          />
        )}
        {conElTaller && (
          <Campo
            etiqueta={m.sena}
            inputMode="decimal"
            ayuda={m.ayudaDeLaSena}
            value={sena}
            error={error?.campo === 'sena' ? error.mensaje : undefined}
            onChange={(evento) => {
              setSena(evento.target.value);
            }}
          />
        )}
        {conElTaller && (
          <MoneyInput
            etiqueta={m.relevamiento}
            ayuda={m.ayudaDelRelevamiento}
            value={relevamiento}
            onChange={setRelevamiento}
          />
        )}
        {conElTaller && (
          <Campo
            etiqueta={m.vigencia}
            inputMode="numeric"
            ayuda={m.ayudaDeLaVigencia}
            value={vigencia}
            error={error?.campo === 'vigencia' ? error.mensaje : undefined}
            onChange={(evento) => {
              setVigencia(evento.target.value);
            }}
          />
        )}
        {conCocos && (
          <Campo
            etiqueta={m.tasa}
            inputMode="decimal"
            ayuda={m.ayudaDeLaTasa}
            value={tasa}
            error={error?.campo === 'tasa' ? error.mensaje : undefined}
            onChange={(evento) => {
              setTasa(evento.target.value);
            }}
          />
        )}
      </CamposJuntos>

      {hayFallo && (
        <p role="alert" className="text-label font-medium text-alerta">
          {mensajeDeSincronizacion(fallo)}
        </p>
      )}
      {guardando && estadoSync.tipo === 'sin-conexion' && (
        <p className="text-label text-atencion">{configurarTaller.enLaCola}</p>
      )}
      {guardado && <p className="text-label text-hogar">{configurarTaller.guardado}</p>}

      <Button type="submit" cargando={guardando} className="mt-1 self-start">
        {conElTaller ? m.guardarTodo : m.guardarElReparto}
      </Button>
    </form>
  );
}

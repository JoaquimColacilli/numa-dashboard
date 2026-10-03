import { Icono, type NombreDeIcono } from '@maun/ui';

import { useMensajes, type Mensajes } from '@/shared/idioma';

export interface EstadoDeGuardadoProps {
  enPausa: boolean;
  enVuelo: boolean;
  conError: boolean;
  guardado: boolean;
  sinGuardar?: boolean;
}

interface Aspecto {
  texto: string;
  icono: NombreDeIcono;
  tono: string;
}

function aspectoDe(
  { enPausa, enVuelo, conError, guardado, sinGuardar }: EstadoDeGuardadoProps,
  textos: Mensajes['ui']['guardado'],
): Aspecto | undefined {
  if (sinGuardar === true) return { texto: textos.sinGuardar, icono: 'clock', tono: 'text-text-2' };
  if (enPausa) return { texto: textos.sinSenal, icono: 'cloud-off', tono: 'text-text-2' };
  if (enVuelo) return { texto: textos.guardando, icono: 'arrow-up-down', tono: 'text-text-2' };
  if (conError) return { texto: textos.noSePudo, icono: 'triangle-alert', tono: 'text-alerta' };
  if (guardado) return { texto: textos.guardado, icono: 'check', tono: 'text-hogar' };
  return undefined;
}

export function EstadoDeGuardado(props: EstadoDeGuardadoProps) {
  const { guardado: textos } = useMensajes().ui;
  const aspecto = aspectoDe(props, textos);
  if (aspecto === undefined) return null;

  return (
    <span role="status" className={`flex items-center gap-1.5 text-meta ${aspecto.tono}`}>
      <Icono nombre={aspecto.icono} tamano={13} />
      {aspecto.texto}
    </span>
  );
}

import { normalizarLinkDeResena, revisarLinkDeResena } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useState, type SyntheticEvent } from 'react';

import { MUTACION_DE_AJUSTES } from '@/entities/replica';
import { mensajeDeSincronizacion, type FilaDe } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { useEstadoSync } from '@/shared/lib';
import { Button, Campo } from '@/shared/ui';

export function FormularioDeResena({ ajustes }: { ajustes: FilaDe<'ajustes'> }) {
  const { configurarTaller } = useMensajes();
  const m = configurarTaller.resena;
  const [link, setLink] = useState(ajustes.resena_link);
  const [error, setError] = useState<string | undefined>(undefined);
  const guardar = useMutation(MUTACION_DE_AJUSTES);
  const estadoSync = useEstadoSync();

  const guardando = guardar.isPending;
  const guardado =
    !guardando && !guardar.isError && guardar.isSuccess && estadoSync.tipo === 'sincronizado';

  function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();
    const revision = revisarLinkDeResena(link);
    if (revision.estado === 'invalido') {
      setError(m.errores[revision.motivo]);
      return;
    }
    setError(undefined);
    const nuevo = revision.estado === 'vacio' ? '' : normalizarLinkDeResena(link);
    if (nuevo === ajustes.resena_link) return;
    guardar.mutate({
      id: ajustes.id,
      cambios: { resena_link: nuevo },
      previos: { resena_link: ajustes.resena_link },
    });
  }

  return (
    <form noValidate className="flex flex-col gap-3" onSubmit={enviar}>
      <Campo
        etiqueta={m.enlace}
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        ayuda={m.ayuda}
        value={link}
        error={error}
        onChange={(evento) => {
          setLink(evento.target.value);
          setError(undefined);
        }}
      />
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

import { REDES_DEL_TALLER, type RedDelTaller } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useState, type SyntheticEvent } from 'react';

import { MUTACION_DE_AJUSTES } from '@/entities/replica';
import { mensajeDeSincronizacion, type FilaDe } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { useEstadoSync } from '@/shared/lib';
import { Button, Campo, CamposJuntos } from '@/shared/ui';

import {
  cambiosDeLasRedes,
  comoSeEscriben,
  NOMBRE_DE_LA_RED,
  redesDeLosAjustes,
  type TextosDeLasRedes,
} from '../model/redes';

export function FormularioDeRedes({ ajustes }: { ajustes: FilaDe<'ajustes'> }) {
  const { configurarTaller } = useMensajes();
  const m = configurarTaller.redes;
  const [textos, setTextos] = useState<TextosDeLasRedes>(() =>
    comoSeEscriben(redesDeLosAjustes(ajustes)),
  );
  const [errores, setErrores] = useState<Partial<Record<RedDelTaller, string>>>({});
  const guardar = useMutation(MUTACION_DE_AJUSTES);
  const estadoSync = useEstadoSync();

  const guardando = guardar.isPending;
  const guardado =
    !guardando && !guardar.isError && guardar.isSuccess && estadoSync.tipo === 'sincronizado';

  function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();
    const { links, cambios, previos, errores: encontrados } = cambiosDeLasRedes(ajustes, textos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setTextos(comoSeEscriben(links));
    if (Object.keys(cambios).length === 0) return;
    guardar.mutate({ id: ajustes.id, cambios, previos });
  }

  return (
    <form noValidate className="flex flex-col gap-3" onSubmit={enviar}>
      <p className="text-label leading-relaxed text-text-2">{m.ayuda}</p>
      <CamposJuntos columnas={3} campoMinimo="12rem">
        {REDES_DEL_TALLER.map((red) => (
          <Campo
            key={red}
            etiqueta={NOMBRE_DE_LA_RED[red]}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={m.ejemplos[red]}
            value={textos[red]}
            error={errores[red]}
            onChange={(evento) => {
              const valor = evento.target.value;
              setTextos((previos) => ({ ...previos, [red]: valor }));
              setErrores((previos) => ({ ...previos, [red]: undefined }));
            }}
          />
        ))}
      </CamposJuntos>

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

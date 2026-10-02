import { ETIQUETAS_DE_IDIOMA, IDIOMAS, type Idioma } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useId } from 'react';

import {
  MUTACION_DEL_IDIOMA_DE_LA_PERSONA,
  useIdiomaDeLaPersona,
  useSesionActiva,
} from '@/entities/sesion';
import { NOMBRE_PROPIO_DEL_IDIOMA, useMensajes, usarIdioma } from '@/shared/idioma';
import { guardarElIdioma, metaDeAvisos, seudoidiomaPrendido } from '@/shared/lib';
import { FondoDelElegido } from '@/shared/ui';

export function SelectorDeIdioma() {
  const m = useMensajes();
  const textos = m.elegirIdioma;
  const nombre = useId();
  const { usuarioId } = useSesionActiva();
  const idioma = useIdiomaDeLaPersona();
  const guardar = useMutation({
    ...MUTACION_DEL_IDIOMA_DE_LA_PERSONA,
    meta: metaDeAvisos('perfil', { silencioso: true }),
  });

  function elegir(opcion: Idioma): void {
    guardarElIdioma(usuarioId, opcion);
    if (opcion !== idioma) guardar.mutate({ idioma: opcion });
    void usarIdioma(opcion, seudoidiomaPrendido()).catch(() => false);
  }

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-label text-text-2">{textos.idioma}</legend>
      <div className="relative grid max-w-[30rem] grid-cols-3 gap-0.5 rounded-pill bg-ink/6 p-1">
        <FondoDelElegido elegido={idioma} />
        {IDIOMAS.map((opcion) => (
          <label
            key={opcion}
            data-opcion={opcion}
            className="relative flex min-h-tap cursor-pointer items-center justify-center gap-1.5 rounded-pill px-1 text-center text-label leading-tight font-medium text-text-2 has-checked:font-semibold has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
          >
            <input
              type="radio"
              name={nombre}
              value={opcion}
              checked={idioma === opcion}
              onChange={() => {
                elegir(opcion);
              }}
              className="sr-only"
            />
            <span lang={ETIQUETAS_DE_IDIOMA[opcion]} translate="no">
              {NOMBRE_PROPIO_DEL_IDIOMA[opcion]}
            </span>
          </label>
        ))}
      </div>
      <span className="text-meta text-text-3">{textos.valeEnTodosTusAparatos}</span>
    </fieldset>
  );
}

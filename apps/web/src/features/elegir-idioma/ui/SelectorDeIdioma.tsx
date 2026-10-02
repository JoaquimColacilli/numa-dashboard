import { ETIQUETAS_DE_IDIOMA, IDIOMAS, type Idioma } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useId, useState } from 'react';

import {
  MUTACION_DEL_IDIOMA_DE_LA_PERSONA,
  useIdiomaDeLaPersona,
  useSesionActiva,
} from '@/entities/sesion';
import {
  NOMBRE_PROPIO_DEL_IDIOMA,
  useIdiomaQueSeVe,
  useMensajes,
  usarIdioma,
} from '@/shared/idioma';
import {
  estadoDelSeudoidioma,
  fijarElSeudoidioma,
  guardarElIdioma,
  metaDeAvisos,
} from '@/shared/lib';
import { FondoDelElegido } from '@/shared/ui';

const SEUDO = 'seudo';

type OpcionDeIdioma = Idioma | typeof SEUDO;

function conElSeudoidioma(): boolean {
  return import.meta.env.DEV || estadoDelSeudoidioma() !== null;
}

export function SelectorDeIdioma() {
  const m = useMensajes();
  const textos = m.elegirIdioma;
  const nombre = useId();
  const { usuarioId } = useSesionActiva();
  const idioma = useIdiomaDeLaPersona();
  const queSeVe = useIdiomaQueSeVe();
  const guardar = useMutation({
    ...MUTACION_DEL_IDIOMA_DE_LA_PERSONA,
    meta: metaDeAvisos('perfil', { silencioso: true }),
  });
  const [ofreceElSeudo] = useState(conElSeudoidioma);

  const elegido: OpcionDeIdioma = queSeVe.seudo ? SEUDO : idioma;
  const opciones: readonly OpcionDeIdioma[] = ofreceElSeudo ? [...IDIOMAS, SEUDO] : IDIOMAS;

  function elegir(opcion: OpcionDeIdioma): void {
    if (opcion === SEUDO) {
      fijarElSeudoidioma('activo');
      void usarIdioma(idioma, true).catch(() => false);
      return;
    }
    if (estadoDelSeudoidioma() === 'activo') fijarElSeudoidioma('disponible');
    guardarElIdioma(usuarioId, opcion);
    if (opcion !== idioma) guardar.mutate({ idioma: opcion });
    void usarIdioma(opcion).catch(() => false);
  }

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-label text-text-2">{textos.idioma}</legend>
      <div
        className={`relative grid max-w-[30rem] gap-0.5 rounded-pill bg-ink/6 p-1 ${
          opciones.length > IDIOMAS.length ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
        }`}
      >
        <FondoDelElegido elegido={elegido} />
        {opciones.map((opcion) => (
          <label
            key={opcion}
            data-opcion={opcion}
            className="relative flex min-h-tap cursor-pointer items-center justify-center gap-1.5 rounded-pill px-1 text-center text-label leading-tight font-medium text-text-2 has-checked:font-semibold has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
          >
            <input
              type="radio"
              name={nombre}
              value={opcion}
              checked={elegido === opcion}
              onChange={() => {
                elegir(opcion);
              }}
              className="sr-only"
            />
            {opcion === SEUDO ? (
              textos.seudoidioma
            ) : (
              <span lang={ETIQUETAS_DE_IDIOMA[opcion]} translate="no">
                {NOMBRE_PROPIO_DEL_IDIOMA[opcion]}
              </span>
            )}
          </label>
        ))}
      </div>
      <span className="text-meta text-text-3">
        {elegido === SEUDO ? textos.soloEnEsteAparato : textos.valeEnTodosTusAparatos}
      </span>
    </fieldset>
  );
}

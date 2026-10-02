import { ETIQUETAS_DE_IDIOMA, IDIOMA_BASE, IDIOMAS, type Idioma } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useId } from 'react';

import { idiomaDeLosClientes, MUTACION_DE_AJUSTES, useReplicaDelTaller } from '@/entities/replica';
import { filasDe, mensajeDeSincronizacion, type FilaDe } from '@/shared/api';
import { NOMBRE_PROPIO_DEL_IDIOMA, useMensajes } from '@/shared/idioma';
import { metaDeAvisos } from '@/shared/lib';
import { FondoDelElegido } from '@/shared/ui';

export function IdiomaDeLosClientes({ ajustes }: { ajustes: FilaDe<'ajustes'> }) {
  const textos = useMensajes().configurarTaller.idiomaDeLosClientes;
  const replica = useReplicaDelTaller();
  const nombre = useId();
  const guardar = useMutation({
    ...MUTACION_DE_AJUSTES,
    meta: metaDeAvisos('idiomaDeLosClientes'),
  });

  const elegido = idiomaDeLosClientes(replica);
  const conTextosPropios =
    ((ajustes as Partial<FilaDe<'ajustes'>>).plantilla_del_presupuesto ?? null) !== null ||
    filasDe(replica, 'preguntas').some((pregunta) => pregunta.deleted_at === null);

  function elegir(idioma: Idioma): void {
    if (idioma === elegido) return;
    guardar.mutate({
      id: ajustes.id,
      cambios: { idioma_de_los_clientes: idioma },
      previos: { idioma_de_los_clientes: elegido },
    });
  }

  return (
    <fieldset className="flex flex-col gap-1.5 border-t border-hairline-soft pt-3.5">
      <legend className="mb-1.5 text-body font-semibold">{textos.tusClientesLeenEn}</legend>
      <div className="relative grid max-w-[30rem] grid-cols-3 gap-0.5 rounded-pill bg-ink/6 p-1">
        <FondoDelElegido elegido={elegido} />
        {IDIOMAS.map((idioma) => (
          <label
            key={idioma}
            data-opcion={idioma}
            className="relative flex min-h-tap cursor-pointer items-center justify-center rounded-pill px-1 text-center text-label leading-tight font-medium text-text-2 has-checked:font-semibold has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
          >
            <input
              type="radio"
              name={nombre}
              value={idioma}
              checked={elegido === idioma}
              onChange={() => {
                elegir(idioma);
              }}
              className="sr-only"
            />
            <span lang={ETIQUETAS_DE_IDIOMA[idioma]} translate="no">
              {NOMBRE_PROPIO_DEL_IDIOMA[idioma]}
            </span>
          </label>
        ))}
      </div>
      <p className="max-w-[42rem] text-meta leading-normal text-text-3">{textos.ayuda}</p>
      {elegido !== IDIOMA_BASE && conTextosPropios && (
        <p className="max-w-[42rem] text-label leading-normal font-medium text-atencion">
          {textos.revisaTusTextos(textos.enUnaFrase[elegido])}
        </p>
      )}
      {guardar.isError && (
        <p role="alert" className="text-label font-medium text-alerta">
          {mensajeDeSincronizacion(guardar.error)}
        </p>
      )}
    </fieldset>
  );
}

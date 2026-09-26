import { TOPE_DE_LA_VIDRIERA, type HaciaDondeSeMueve } from '@maun/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useId, useLayoutEffect, useRef, useState } from 'react';

import { rutaEnLaVidriera } from '@/entities/archivo';
import { useReplicaDelTaller } from '@/entities/replica';
import { urlDelArchivo } from '@/shared/api';
import { Button, ConSalida, Icono, type NombreDeIcono } from '@/shared/ui';

import type { FotoEnLaVidriera } from '../api/mutacion';
import { mandarALaCola, moverLaFoto, opcionesDeLaBaja, sacarLaFoto } from '../model/acciones';
import { fotosDeLaVidriera, origenDeLaFoto } from '../model/vidriera';
import { HojaDeSumarFotos } from './HojaDeSumarFotos';

export const SIN_NADA_EN_LA_VIDRIERA =
  'Todavía no hay nada en tu vidriera. Tus clientes la ven cuando sumes una foto o cargues una red.';

export const SIN_FOTOS_EN_LA_VIDRIERA =
  'Todavía no sumaste fotos: tus clientes ven solo tus redes.';

type Accion = HaciaDondeSeMueve | 'sacar';

const ETIQUETA: Readonly<Record<Accion, string>> = {
  antes: 'Mover antes',
  despues: 'Mover después',
  sacar: 'Sacar',
};

const ICONO: Readonly<Record<Accion, NombreDeIcono>> = {
  antes: 'arrow-up',
  despues: 'arrow-down',
  sacar: 'x',
};

interface BotonDeLaFotoProps {
  accion: Accion;
  apagado?: boolean;
  describe: string;
  alTocar: () => void;
}

function BotonDeLaFoto({ accion, apagado = false, describe, alTocar }: BotonDeLaFotoProps) {
  return (
    <button
      type="button"
      data-accion={accion}
      aria-label={ETIQUETA[accion]}
      aria-describedby={describe}
      aria-disabled={apagado || undefined}
      onClick={() => {
        if (!apagado) alTocar();
      }}
      className="flex size-tap flex-none items-center justify-center rounded-pill text-text-2 hover:bg-ink/5 hover:text-ink aria-disabled:text-text-3 aria-disabled:opacity-40 aria-disabled:hover:bg-transparent"
    >
      <Icono nombre={ICONO[accion]} tamano={18} />
    </button>
  );
}

export const LA_VIDRIERA_ESTA_LLENA = `Tu vidriera ya tiene sus ${String(TOPE_DE_LA_VIDRIERA)} fotos. Sacá una para sumar otra.`;

export interface FotosDeLaVidrieraProps {
  hayRedes: boolean;
}

export function FotosDeLaVidriera({ hayRedes }: FotosDeLaVidrieraProps) {
  const replica = useReplicaDelTaller();
  const cliente = useQueryClient();
  const base = useId();
  const lista = useRef<HTMLOListElement>(null);
  const porEnfocar = useRef<{ id: string; accion: HaciaDondeSeMueve } | null>(null);
  const [sumando, setSumando] = useState(false);
  const fotos = fotosDeLaVidriera(replica);
  const llena = fotos.length >= TOPE_DE_LA_VIDRIERA;

  useLayoutEffect(() => {
    const pendiente = porEnfocar.current;
    if (pendiente === null) return;
    const boton = lista.current?.querySelector<HTMLElement>(
      `[data-foto="${pendiente.id}"] [data-accion="${pendiente.accion}"]`,
    );
    if (!boton) return;
    porEnfocar.current = null;
    if (document.activeElement !== boton) boton.focus();
  });

  function mover(foto: FotoEnLaVidriera, hacia: HaciaDondeSeMueve): void {
    porEnfocar.current = { id: foto.id, accion: hacia };
    moverLaFoto(mandarALaCola(cliente), fotos, foto.id, hacia);
  }

  function sacar(foto: FotoEnLaVidriera): void {
    sacarLaFoto(mandarALaCola(cliente), foto, opcionesDeLaBaja(cliente, foto));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-body font-semibold">Fotos</h3>
        <span className="text-label text-text-2 tabular-nums">
          {fotos.length} de {TOPE_DE_LA_VIDRIERA}
        </span>
      </div>

      {fotos.length === 0 ? (
        <p className="border-t border-hairline-soft py-3 text-body leading-relaxed text-text-2">
          {hayRedes ? SIN_FOTOS_EN_LA_VIDRIERA : SIN_NADA_EN_LA_VIDRIERA}
        </p>
      ) : (
        <ol
          ref={lista}
          aria-label="Las fotos de tu vidriera, en el orden en que las ve tu cliente"
          className="flex flex-col"
        >
          {fotos.map((foto, indice) => {
            const describe = `${base}-${foto.id}`;
            return (
              <li
                key={foto.id}
                data-foto={foto.id}
                className="flex min-h-18 items-center gap-3 border-t border-hairline-soft py-2"
              >
                <img
                  src={urlDelArchivo(rutaEnLaVidriera(foto, true))}
                  alt=""
                  width={48}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-12 flex-none rounded-field bg-surface object-cover"
                />
                <p id={describe} className="min-w-0 flex-1 leading-normal">
                  <span className="block text-body font-medium tabular-nums">
                    Foto {indice + 1} de {fotos.length}
                  </span>
                  <span className="block truncate text-label text-text-2">
                    {origenDeLaFoto(replica, foto)}
                  </span>
                </p>
                <BotonDeLaFoto
                  accion="antes"
                  apagado={indice === 0}
                  describe={describe}
                  alTocar={() => {
                    mover(foto, 'antes');
                  }}
                />
                <BotonDeLaFoto
                  accion="despues"
                  apagado={indice === fotos.length - 1}
                  describe={describe}
                  alTocar={() => {
                    mover(foto, 'despues');
                  }}
                />
                <BotonDeLaFoto
                  accion="sacar"
                  describe={describe}
                  alTocar={() => {
                    sacar(foto);
                  }}
                />
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-col items-start gap-1.5 pt-1">
        <Button
          variant="secundario"
          disabled={llena}
          onClick={() => {
            setSumando(true);
          }}
        >
          <Icono nombre="plus" tamano={16} />
          Sumar fotos
        </Button>
        {llena && (
          <p className="text-label leading-relaxed text-text-2">{LA_VIDRIERA_ESTA_LLENA}</p>
        )}
      </div>

      <ConSalida valor={sumando}>
        {() => (
          <HojaDeSumarFotos
            alCerrar={() => {
              setSumando(false);
            }}
          />
        )}
      </ConSalida>
    </div>
  );
}

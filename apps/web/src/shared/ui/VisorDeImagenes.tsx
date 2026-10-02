import { useState, type KeyboardEvent, type ReactNode } from 'react';

import { Button, Icono } from '@maun/ui';

import { useTextosDeLaUi } from '@/shared/idioma';

import { Hoja } from './Hoja';

export interface ImagenDelVisor {
  id: string;
  nombre: string;
  url: string;
  ancho: number | null;
  alto: number | null;
}

export interface VisorDeImagenesProps<T extends ImagenDelVisor> {
  imagenes: readonly T[];
  inicial: string;
  alCerrar: () => void;
  titulo?: string;
  detalle?: (imagen: T) => string;
  acciones?: (imagen: T) => ReactNode;
}

export function VisorDeImagenes<T extends ImagenDelVisor>({
  imagenes,
  inicial,
  alCerrar,
  titulo,
  detalle,
  acciones,
}: VisorDeImagenesProps<T>) {
  const { visor: textos } = useTextosDeLaUi();
  const [elegido, setElegido] = useState(inicial);
  const indice = Math.max(
    0,
    imagenes.findIndex((imagen) => imagen.id === elegido),
  );
  const imagen = imagenes[indice];
  const total = imagenes.length;

  function mover(paso: number): void {
    const siguiente = imagenes[(indice + paso + total) % total];
    if (siguiente) setElegido(siguiente.id);
  }

  function alTeclear(evento: KeyboardEvent<HTMLDialogElement>): void {
    if (total < 2) return;
    if (evento.key === 'ArrowRight') mover(1);
    if (evento.key === 'ArrowLeft') mover(-1);
  }

  if (imagen === undefined) return null;
  const cuenta = total > 1 ? textos.cuenta(String(indice + 1), String(total)) : '';
  const aparte = detalle?.(imagen) ?? '';

  return (
    <Hoja titulo={titulo ?? imagen.nombre} ancho="visor" alCerrar={alCerrar} alTeclear={alTeclear}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-4 md:pb-4">
        <div className="flex min-h-0 flex-auto items-center justify-center overflow-hidden rounded-field bg-surface">
          <img
            key={imagen.id}
            src={imagen.url}
            alt={imagen.nombre}
            width={imagen.ancho ?? undefined}
            height={imagen.alto ?? undefined}
            decoding="async"
            className="h-auto max-h-[68dvh] w-auto max-w-full object-contain"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-meta text-text-2 tabular-nums">
            {cuenta}
            {cuenta !== '' && aparte !== '' && ' · '}
            {aparte !== '' && <span translate="no">{aparte}</span>}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {total > 1 && (
              <>
                <Button
                  variant="secundario"
                  size="chico"
                  aria-label={textos.anterior}
                  onClick={() => {
                    mover(-1);
                  }}
                >
                  <Icono nombre="chevron-left" tamano={16} />
                </Button>
                <Button
                  variant="secundario"
                  size="chico"
                  aria-label={textos.siguiente}
                  onClick={() => {
                    mover(1);
                  }}
                >
                  <Icono nombre="chevron-right" tamano={16} />
                </Button>
              </>
            )}
            <a
              href={imagen.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-tap items-center gap-1.5 rounded-pill px-2 text-label font-medium underline underline-offset-3"
            >
              <Icono nombre="maximize-2" tamano={15} />
              {textos.abrirAparte}
            </a>
            {acciones?.(imagen)}
          </div>
        </div>
      </div>
    </Hoja>
  );
}

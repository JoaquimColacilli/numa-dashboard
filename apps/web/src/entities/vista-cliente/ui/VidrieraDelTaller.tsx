import {
  hayAlgoEnLaVidriera,
  redesALaVista,
  redParaCompartir,
  type RedALaVista,
  type VidrieraDelTaller as Vidriera,
} from '@maun/domain';
import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';

import { urlDelArchivo } from '@/shared/api';
import { copiar } from '@/shared/lib';
import {
  ConSalida,
  DatoCopiable,
  Icono,
  IconoDeRed,
  Tilde,
  useVisor,
  VisorDeImagenes,
} from '@/shared/ui';

import { compartirDelSistema, compartirLaRed } from '../model/compartir';

const TARJETA = 'rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5';

const ESPERA_SIN_SCROLLEND_MS = 120;

const MUESTRA_DEL_COPIADO_MS = 4_000;

export const MAS_TRABAJOS_DEL_TALLER = 'Más trabajos del taller';

export const EL_TALLER_EN_LAS_REDES = 'El taller en las redes';

interface Carrusel {
  hayMas: boolean;
  alPrincipio: boolean;
  alFinal: boolean;
}

const QUIETO: Carrusel = { hayMas: false, alPrincipio: true, alFinal: true };

function medirElCarrusel(lista: HTMLElement): Carrusel {
  const tope = lista.scrollWidth - lista.clientWidth;
  return {
    hayMas: tope > 1,
    alPrincipio: lista.scrollLeft <= 1,
    alFinal: lista.scrollLeft >= tope - 1,
  };
}

function mostrarLaFotoEnfocada(lista: HTMLElement, enfocada: EventTarget): void {
  if (!(enfocada instanceof HTMLElement) || !enfocada.matches(':focus-visible')) return;
  const borde = lista.getBoundingClientRect();
  const caja = enfocada.getBoundingClientRect();
  if (caja.left >= borde.left - 1 && caja.right <= borde.right + 1) return;
  enfocada.scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'instant' });
}

function nombreDeLaFoto(indice: number, total: number): string {
  return `Foto ${String(indice + 1)} de ${String(total)}`;
}

function mismoCarrusel(uno: Carrusel, otro: Carrusel): boolean {
  return (
    uno.hayMas === otro.hayMas &&
    uno.alPrincipio === otro.alPrincipio &&
    uno.alFinal === otro.alFinal
  );
}

function useCarrusel(lista: RefObject<HTMLUListElement | null>, cantidad: number): Carrusel {
  const [carrusel, setCarrusel] = useState<Carrusel>(QUIETO);

  useLayoutEffect(() => {
    const elemento = lista.current;
    if (!elemento) return;
    const medir = () => {
      const medido = medirElCarrusel(elemento);
      setCarrusel((previo) => (mismoCarrusel(previo, medido) ? previo : medido));
    };
    medir();

    let reloj: ReturnType<typeof setTimeout> | undefined;
    const alScrollear = () => {
      clearTimeout(reloj);
      reloj = setTimeout(medir, ESPERA_SIN_SCROLLEND_MS);
    };
    const conScrollend = 'onscrollend' in globalThis;
    if (conScrollend) elemento.addEventListener('scrollend', medir);
    else elemento.addEventListener('scroll', alScrollear, { passive: true });
    const observador = 'ResizeObserver' in globalThis ? new ResizeObserver(medir) : null;
    observador?.observe(elemento);

    return () => {
      clearTimeout(reloj);
      elemento.removeEventListener('scrollend', medir);
      elemento.removeEventListener('scroll', alScrollear);
      observador?.disconnect();
    };
  }, [lista, cantidad]);

  return carrusel;
}

function BotonDelCarrusel({
  hacia,
  controla,
  apagado,
  alTocar,
}: {
  hacia: 'antes' | 'despues';
  controla: string;
  apagado: boolean;
  alTocar: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={hacia === 'antes' ? 'Fotos anteriores' : 'Fotos siguientes'}
      aria-controls={controla}
      aria-disabled={apagado || undefined}
      onClick={() => {
        if (!apagado) alTocar();
      }}
      className="flex size-tap flex-none items-center justify-center rounded-pill text-ink hover:bg-ink/5 aria-disabled:text-text-3 aria-disabled:opacity-40 aria-disabled:hover:bg-transparent"
    >
      <Icono nombre={hacia === 'antes' ? 'chevron-left' : 'chevron-right'} tamano={20} />
    </button>
  );
}

function nombreDelEnlace(red: RedALaVista): string {
  switch (red.red) {
    case 'instagram':
      return `${red.nombre} en Instagram`;
    case 'facebook':
      return 'Facebook del taller';
    case 'tiktok':
      return 'TikTok del taller';
  }
}

function EnlaceALaRed({ red }: { red: RedALaVista }) {
  return (
    <a
      href={red.link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={nombreDelEnlace(red)}
      className="flex min-h-tap max-w-full min-w-tap items-center justify-center gap-2 rounded-pill px-1.5 hover:bg-ink/5"
    >
      <IconoDeRed red={red.red} className="flex-none text-ink" />
      {red.red === 'instagram' && (
        <span className="min-w-0 pr-1 text-body font-medium break-all">{red.nombre}</span>
      )}
    </a>
  );
}

type ComoQuedoElBoton = 'quieto' | 'copiado' | 'fallo';

function CompartirLasRedes({ taller, url }: { taller: string; url: string }) {
  const [quedo, setQuedo] = useState<ComoQuedoElBoton>('quieto');

  useEffect(() => {
    if (quedo !== 'copiado') return;
    const reloj = setTimeout(() => {
      setQuedo('quieto');
    }, MUESTRA_DEL_COPIADO_MS);
    return () => {
      clearTimeout(reloj);
    };
  }, [quedo]);

  function alTocar(): void {
    void compartirLaRed(
      { title: taller, url },
      { delSistema: compartirDelSistema(), copiar: (texto) => copiar(texto) },
    ).then((resultado) => {
      if (resultado === 'copiado') setQuedo('copiado');
      if (resultado === 'fallo') setQuedo('fallo');
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={alTocar}
        className={`ml-auto flex min-h-tap flex-none items-center gap-1.5 rounded-pill border px-3.5 text-label font-semibold ${
          quedo === 'copiado'
            ? 'border-hogar text-hogar'
            : 'border-border hover:border-ink hover:bg-surface'
        }`}
      >
        {quedo === 'copiado' ? (
          <Tilde dibujar tamano={16} grosor={2} />
        ) : (
          <Icono nombre="share-2" tamano={16} />
        )}
        {quedo === 'copiado' ? 'Copiado' : 'Compartir'}
      </button>
      <span role="status" className="sr-only">
        {quedo === 'copiado' ? 'Copiado' : ''}
      </span>
      {quedo === 'fallo' && (
        <div className="w-full">
          <DatoCopiable
            etiqueta="Para compartir, este enlace"
            valor={url}
            nombre="Copiar el enlace"
          />
        </div>
      )}
    </>
  );
}

export interface VidrieraDelTallerProps {
  vidriera: Vidriera;
  taller: string;
}

export function VidrieraDelTaller({ vidriera, taller }: VidrieraDelTallerProps) {
  const base = useId();
  const lista = useRef<HTMLUListElement>(null);
  const visor = useVisor();
  const { fotos } = vidriera;
  const redes = redesALaVista(vidriera.redes);
  const paraCompartir = redParaCompartir(vidriera.redes);
  const carrusel = useCarrusel(lista, fotos.length);
  const idTitulo = `${base}-titulo`;
  const idLista = `${base}-fotos`;

  if (!hayAlgoEnLaVidriera(vidriera)) return null;

  function correr(sentido: 1 | -1): void {
    const elemento = lista.current;
    if (!elemento) return;
    elemento.scrollBy({ left: sentido * elemento.clientWidth, behavior: 'instant' });
  }

  return (
    <section aria-labelledby={idTitulo} data-vidriera className={TARJETA}>
      <div className="flex min-h-tap items-center justify-between gap-3">
        <h2 id={idTitulo} className="text-section font-semibold">
          {fotos.length > 0 ? MAS_TRABAJOS_DEL_TALLER : EL_TALLER_EN_LAS_REDES}
        </h2>
        {carrusel.hayMas && (
          <div className="-mr-2 flex flex-none">
            <BotonDelCarrusel
              hacia="antes"
              controla={idLista}
              apagado={carrusel.alPrincipio}
              alTocar={() => {
                correr(-1);
              }}
            />
            <BotonDelCarrusel
              hacia="despues"
              controla={idLista}
              apagado={carrusel.alFinal}
              alTocar={() => {
                correr(1);
              }}
            />
          </div>
        )}
      </div>

      {fotos.length > 0 && (
        <ul
          ref={lista}
          id={idLista}
          role="list"
          aria-label="Fotos de otros trabajos del taller"
          onFocus={(evento) => {
            mostrarLaFotoEnfocada(evento.currentTarget, evento.target);
          }}
          className="-mx-4 mt-2 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:-mx-5 md:scroll-px-5 md:px-5 [&::-webkit-scrollbar]:hidden"
        >
          {fotos.map((foto, indice) => (
            <li key={foto.id} className="flex-none snap-start">
              <button
                type="button"
                aria-label={nombreDeLaFoto(indice, fotos.length)}
                onClick={(evento) => {
                  visor.abrir(foto.id, evento.currentTarget);
                }}
                className="block h-32 w-24 overflow-hidden rounded-lamina bg-surface"
              >
                <img
                  src={urlDelArchivo(foto.rutaMini)}
                  alt=""
                  width={foto.ancho}
                  height={foto.alto}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConSalida valor={visor.abierta}>
        {(inicial) => (
          <VisorDeImagenes
            titulo={MAS_TRABAJOS_DEL_TALLER}
            imagenes={fotos.map((foto, indice) => ({
              id: foto.id,
              nombre: nombreDeLaFoto(indice, fotos.length),
              url: urlDelArchivo(foto.ruta),
              ancho: foto.ancho,
              alto: foto.alto,
            }))}
            inicial={inicial}
            alCerrar={visor.cerrar}
          />
        )}
      </ConSalida>

      {redes.length > 0 && (
        <div
          className={`flex flex-wrap items-center gap-x-1 gap-y-2 ${
            fotos.length > 0 ? 'mt-3.5 border-t border-hairline-soft pt-3' : 'mt-1'
          }`}
        >
          {redes.map((red) => (
            <EnlaceALaRed key={red.red} red={red} />
          ))}
          {paraCompartir !== null && <CompartirLasRedes taller={taller} url={paraCompartir} />}
        </div>
      )}
    </section>
  );
}

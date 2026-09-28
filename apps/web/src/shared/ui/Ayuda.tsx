import { Icono } from '@maun/ui';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

export const DEMORA_DE_LA_AYUDA_MS = 350;
export const RESPIRO_DE_LA_AYUDA_MS = 200;
const MARGEN = 12;

function ubicar(boton: HTMLElement, globo: HTMLElement): void {
  const caja = boton.getBoundingClientRect();
  const ancho = globo.offsetWidth;
  const alto = globo.offsetHeight;
  const abajo = caja.bottom + 8 + alto <= window.innerHeight - MARGEN;
  const izquierda = Math.min(
    Math.max(MARGEN, caja.left + caja.width / 2 - ancho / 2),
    window.innerWidth - ancho - MARGEN,
  );
  globo.style.left = `${String(Math.round(izquierda))}px`;
  globo.style.top = `${String(Math.round(abajo ? caja.bottom + 8 : caja.top - 8 - alto))}px`;
  globo.dataset.lado = abajo ? 'abajo' : 'arriba';
}

export interface AyudaProps {
  que: string;
  children: ReactNode;
  className?: string;
}

export function Ayuda({ que, children, className = '' }: AyudaProps) {
  const id = useId();
  const boton = useRef<HTMLButtonElement>(null);
  const globo = useRef<HTMLDivElement>(null);
  const reloj = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abiertaConElMouse = useRef(false);
  const abierta = useRef(false);

  useLayoutEffect(() => {
    const elemento = globo.current;
    const disparador = boton.current;
    if (!elemento || !disparador) return;
    const antesDeAbrir = (evento: Event) => {
      if ((evento as ToggleEvent).newState === 'open') {
        requestAnimationFrame(() => {
          ubicar(disparador, elemento);
        });
      }
    };
    const alCambiar = (evento: Event) => {
      abierta.current = (evento as ToggleEvent).newState === 'open';
      if (!abierta.current) abiertaConElMouse.current = false;
    };
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape' || !abierta.current) return;
      evento.preventDefault();
      elemento.hidePopover();
    };
    elemento.addEventListener('beforetoggle', antesDeAbrir);
    elemento.addEventListener('toggle', alCambiar);
    document.addEventListener('keydown', alTeclear, true);
    return () => {
      elemento.removeEventListener('beforetoggle', antesDeAbrir);
      elemento.removeEventListener('toggle', alCambiar);
      document.removeEventListener('keydown', alTeclear, true);
    };
  }, []);

  useEffect(
    () => () => {
      clearTimeout(reloj.current);
    },
    [],
  );

  const mostrar = () => {
    if (abierta.current) return;
    abiertaConElMouse.current = true;
    globo.current?.showPopover();
  };
  const esconder = () => {
    if (!abiertaConElMouse.current) return;
    abiertaConElMouse.current = false;
    globo.current?.hidePopover();
  };
  const alEntrar = (evento: PointerEvent) => {
    if (evento.pointerType !== 'mouse') return;
    clearTimeout(reloj.current);
    reloj.current = setTimeout(mostrar, DEMORA_DE_LA_AYUDA_MS);
  };
  const alSalir = (evento: PointerEvent) => {
    if (evento.pointerType !== 'mouse') return;
    clearTimeout(reloj.current);
    reloj.current = setTimeout(esconder, RESPIRO_DE_LA_AYUDA_MS);
  };
  const alQuedarseEnElGlobo = () => {
    clearTimeout(reloj.current);
  };

  return (
    <>
      <button
        ref={boton}
        type="button"
        popoverTarget={id}
        aria-label={que}
        onPointerEnter={alEntrar}
        onPointerLeave={alSalir}
        onClick={() => {
          clearTimeout(reloj.current);
          abiertaConElMouse.current = false;
        }}
        className={`relative inline-flex size-5 flex-none items-center justify-center rounded-pill text-text-2 after:absolute after:-inset-3 hover:text-ink ${className}`}
      >
        <Icono nombre="info" tamano={16} />
      </button>
      {createPortal(
        <div
          ref={globo}
          id={id}
          popover="auto"
          onPointerEnter={alQuedarseEnElGlobo}
          onPointerLeave={alSalir}
          className="m-0 w-[min(300px,calc(100vw-24px))] rounded-field border border-border bg-paper px-3.5 py-3 text-left text-label leading-relaxed font-normal tracking-normal text-ink normal-case shadow-menu"
        >
          {children}
        </div>,
        document.body,
      )}
    </>
  );
}

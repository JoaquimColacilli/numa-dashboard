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
const SEPARACION = 8;
const MOVIMIENTO_QUE_LA_CIERRA = 1;

interface LoQueSeVe {
  arriba: number;
  izquierda: number;
  alto: number;
  ancho: number;
}

function loQueSeVe(): LoQueSeVe {
  const vista = window.visualViewport;
  if (vista) {
    return {
      arriba: vista.offsetTop,
      izquierda: vista.offsetLeft,
      alto: vista.height,
      ancho: vista.width,
    };
  }
  return { arriba: 0, izquierda: 0, alto: window.innerHeight, ancho: window.innerWidth };
}

function medidaDeLoQueSeVe(): string {
  const { arriba, izquierda, alto, ancho } = loQueSeVe();
  return [arriba, izquierda, alto, ancho, window.innerHeight, window.innerWidth].join(' ');
}

function ubicar(boton: HTMLElement, globo: HTMLElement): void {
  globo.style.maxHeight = '';
  const caja = boton.getBoundingClientRect();
  const vista = loQueSeVe();
  const ancho = globo.offsetWidth;
  const alto = globo.offsetHeight;
  const techo = vista.arriba + MARGEN;
  const piso = vista.arriba + vista.alto - MARGEN;
  const abajo = caja.bottom + SEPARACION + alto <= piso;
  const arriba = !abajo && caja.top - SEPARACION - alto >= techo;
  const izquierda = Math.min(
    Math.max(vista.izquierda + MARGEN, caja.left + caja.width / 2 - ancho / 2),
    vista.izquierda + vista.ancho - ancho - MARGEN,
  );
  let desde = abajo ? caja.bottom + SEPARACION : caja.top - SEPARACION - alto;
  if (!abajo && !arriba) {
    const entra = alto <= piso - techo;
    desde = entra ? Math.min(Math.max(techo, caja.bottom + SEPARACION), piso - alto) : techo;
    if (!entra) globo.style.maxHeight = `${String(Math.round(piso - techo))}px`;
  }
  globo.style.left = `${String(Math.round(izquierda))}px`;
  globo.style.top = `${String(Math.round(desde))}px`;
  globo.dataset.lado = abajo ? 'abajo' : arriba ? 'arriba' : 'adentro';
}

function vigilarElAncla(boton: HTMLElement, globo: HTMLElement, cerrar: () => void): () => void {
  let donde = boton.getBoundingClientRect();
  let medida = medidaDeLoQueSeVe();
  let cuadro = 0;
  const reubicar = () => {
    ubicar(boton, globo);
    donde = boton.getBoundingClientRect();
    medida = medidaDeLoQueSeVe();
  };
  const mirar = () => {
    if (medidaDeLoQueSeVe() !== medida) {
      reubicar();
    } else {
      const ahora = boton.getBoundingClientRect();
      if (
        Math.abs(ahora.top - donde.top) > MOVIMIENTO_QUE_LA_CIERRA ||
        Math.abs(ahora.left - donde.left) > MOVIMIENTO_QUE_LA_CIERRA
      ) {
        cerrar();
        return;
      }
    }
    cuadro = requestAnimationFrame(mirar);
  };
  const alDesplazar = (evento: Event) => {
    if (evento.target instanceof Node && globo.contains(evento.target)) return;
    cerrar();
  };
  cuadro = requestAnimationFrame(mirar);
  document.addEventListener('scroll', alDesplazar, { capture: true, passive: true });
  window.addEventListener('resize', reubicar);
  window.visualViewport?.addEventListener('resize', reubicar);
  return () => {
    cancelAnimationFrame(cuadro);
    document.removeEventListener('scroll', alDesplazar, { capture: true });
    window.removeEventListener('resize', reubicar);
    window.visualViewport?.removeEventListener('resize', reubicar);
  };
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
    let soltar: (() => void) | null = null;
    const cerrar = () => {
      if (abierta.current) elemento.hidePopover();
    };
    const antesDeAbrir = (evento: Event) => {
      if ((evento as ToggleEvent).newState === 'open') {
        requestAnimationFrame(() => {
          ubicar(disparador, elemento);
        });
      }
    };
    const alCambiar = (evento: Event) => {
      abierta.current = (evento as ToggleEvent).newState === 'open';
      soltar?.();
      soltar = abierta.current ? vigilarElAncla(disparador, elemento, cerrar) : null;
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
      soltar?.();
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
          className="m-0 w-[min(300px,calc(100vw-24px))] overflow-y-auto overscroll-contain rounded-field border border-border bg-paper px-3.5 py-3 text-left text-label leading-relaxed font-normal tracking-normal text-ink normal-case shadow-menu"
        >
          {children}
        </div>,
        document.body,
      )}
    </>
  );
}

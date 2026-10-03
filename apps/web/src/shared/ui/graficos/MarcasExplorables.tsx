import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import type { Eleccion } from './eleccion';
import { marcaMasCercana, type MarcaExplorable, type ModoDeCercania } from './medidas';

export interface MarcasExplorablesProps {
  nombre: string;
  marcas: readonly MarcaExplorable[];
  eleccion: Eleccion;
  modo: ModoDeCercania;
  alAbrir?: (clave: string) => void;
}

export function MarcasExplorables({
  nombre,
  marcas,
  eleccion,
  modo,
  alAbrir,
}: MarcasExplorablesProps) {
  const opciones = useRef<(HTMLDivElement | null)[]>([]);
  const [enfocable, setEnfocable] = useState(0);
  if (marcas.length === 0) return null;

  const elegida = marcas.findIndex((marca) => marca.clave === eleccion.elegida);
  const activa = elegida === -1 ? Math.min(enfocable, marcas.length - 1) : elegida;

  function ir(indice: number): void {
    opciones.current[Math.max(0, Math.min(marcas.length - 1, indice))]?.focus();
  }

  function alTeclear(evento: KeyboardEvent<HTMLDivElement>): void {
    const destinos: Partial<Record<string, number>> = {
      ArrowRight: activa + 1,
      ArrowDown: activa + 1,
      ArrowLeft: activa - 1,
      ArrowUp: activa - 1,
      Home: 0,
      End: marcas.length - 1,
    };
    const destino = destinos[evento.key];
    if (destino !== undefined) {
      evento.preventDefault();
      ir(destino);
      return;
    }
    if (evento.key === 'Enter' && eleccion.elegida !== null && alAbrir !== undefined) {
      evento.preventDefault();
      alAbrir(eleccion.elegida);
      return;
    }
    if (evento.key === 'Escape' && eleccion.elegida !== null) {
      evento.preventDefault();
      eleccion.elegir(null);
    }
  }

  function bajoElPuntero(evento: PointerEvent<HTMLDivElement>): MarcaExplorable | null {
    const caja = evento.currentTarget.getBoundingClientRect();
    return marcaMasCercana(marcas, evento.clientX - caja.left, evento.clientY - caja.top, modo);
  }

  return (
    <div
      role="listbox"
      aria-label={nombre}
      aria-orientation="horizontal"
      className="absolute inset-0 touch-pan-y"
      onKeyDown={alTeclear}
      onPointerDown={(evento) => {
        const marca = bajoElPuntero(evento);
        if (marca !== null) eleccion.elegir(marca.clave);
      }}
      onPointerMove={(evento) => {
        const marca = bajoElPuntero(evento);
        if (evento.pointerType === 'mouse' && evento.buttons === 0) {
          eleccion.senalar(marca?.clave ?? null);
          return;
        }
        if (marca !== null) eleccion.elegir(marca.clave);
      }}
      onPointerLeave={(evento) => {
        if (evento.pointerType === 'mouse') eleccion.senalar(null);
      }}
    >
      {marcas.map((marca, indice) => (
        <div
          key={marca.clave}
          ref={(elemento) => {
            opciones.current[indice] = elemento;
          }}
          role="option"
          aria-label={marca.nombre}
          aria-selected={marca.clave === eleccion.elegida}
          tabIndex={indice === activa ? 0 : -1}
          data-marca={marca.clave}
          className="pointer-events-none absolute rounded-field"
          style={{
            left: marca.izquierda,
            top: marca.arriba,
            width: marca.ancho,
            height: marca.alto,
          }}
          onFocus={() => {
            setEnfocable(indice);
            eleccion.elegir(marca.clave);
          }}
        />
      ))}
    </div>
  );
}

import { createElement, useLayoutEffect, type ReactNode } from 'react';

import { esqueletoDeArranque, type Nodo } from './esqueleto';
import { formaDelArranque, type FormaDelArranque } from './forma';

export interface EsqueletoDeArranqueProps {
  que: string;
  visible?: boolean;
  forma?: FormaDelArranque;
  children?: ReactNode;
}

function aReact(nodo: Nodo, ranura: ReactNode): ReactNode {
  if (typeof nodo === 'string') return nodo;
  if ('ranura' in nodo) return ranura;
  const props = Object.fromEntries(
    Object.entries(nodo.atributos).map(([nombre, valor]) => [
      nombre === 'class' ? 'className' : nombre,
      valor,
    ]),
  );
  return createElement(nodo.etiqueta, props, ...nodo.hijos.map((hijo) => aReact(hijo, ranura)));
}

export function EsqueletoDeArranque({
  que,
  visible = false,
  forma,
  children,
}: EsqueletoDeArranqueProps) {
  const elegida = forma ?? formaDelArranque(globalThis.location.pathname);

  useLayoutEffect(() => {
    const raiz = document.documentElement;
    if (elegida === null) delete raiz.dataset.arranque;
    else raiz.dataset.arranque = elegida;
  }, [elegida]);

  return aReact(esqueletoDeArranque({ que, visible }), children);
}

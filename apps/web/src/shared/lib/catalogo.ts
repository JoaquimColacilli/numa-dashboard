import type { ReactNode } from 'react';

export type Envoltorio = (props: { children: ReactNode }) => ReactNode;

export type Ensanchar<T> = T extends string
  ? string
  : T extends (...argumentos: never[]) => unknown
    ? T
    : { readonly [Clave in keyof T]: Ensanchar<T[Clave]> };

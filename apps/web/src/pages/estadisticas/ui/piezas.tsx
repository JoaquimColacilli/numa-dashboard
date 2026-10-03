import type { ReactNode } from 'react';

import { useMensajes } from '@/shared/idioma';
import { Ir, rutaDelProyecto } from '@/shared/lib';
import { Ayuda, Globo, Icono } from '@/shared/ui';

import { idDeLaSeccion, idDelTitulo, type NumeroDeSeccion } from '../model/secciones';

export function Fuerte({ children }: { children: ReactNode }) {
  return <strong className="font-semibold">{children}</strong>;
}

export function Negrita({ children }: { children: ReactNode }) {
  return <b>{children}</b>;
}

export function Chico({ children }: { children: ReactNode }) {
  return <span className="text-[0.68em] font-medium text-text-2">{children}</span>;
}

export function Dato({ children }: { children: ReactNode }) {
  return <span translate="no">{children}</span>;
}

export function Cifra({ children }: { children: ReactNode }) {
  return <strong className="text-body font-semibold text-ink">{children}</strong>;
}

export function CifraChica({ children }: { children: ReactNode }) {
  return <strong className="text-label font-semibold text-ink">{children}</strong>;
}

export interface LoQuePaso {
  loQuePaso: string;
  probar: string | null;
}

export function CajaPunteada({ loQuePaso, probar }: LoQuePaso) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-panel border border-dashed border-border px-4.5 py-4.5 text-center">
      <p className="text-body font-semibold text-pretty">{loQuePaso}</p>
      {probar !== null && <p className="text-label text-text-2">{probar}</p>}
    </div>
  );
}

export interface SeccionProps {
  numero: NumeroDeSeccion;
  titulo: string;
  ayuda: string;
  frase: ReactNode;
  subtitulo: ReactNode;
  vacio?: LoQuePaso | null;
  children?: ReactNode;
}

export function Seccion({
  numero,
  titulo,
  ayuda,
  frase,
  subtitulo,
  vacio = null,
  children,
}: SeccionProps) {
  const textos = useMensajes().paginaEstadisticas;
  return (
    <section
      id={idDeLaSeccion(numero)}
      aria-labelledby={idDelTitulo(numero)}
      className="flex min-w-0 scroll-mt-4 flex-col gap-3.5 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <Globo numero={numero} className="size-5! border!" />
          <h2
            id={idDelTitulo(numero)}
            tabIndex={-1}
            className="min-w-0 flex-1 text-section leading-tight font-semibold text-balance"
          >
            {titulo}
          </h2>
          <Ayuda que={textos.queEs(titulo)}>{ayuda}</Ayuda>
        </div>
        {frase !== null && <p className="text-body-lg leading-normal text-pretty">{frase}</p>}
        <p className="text-meta leading-snug text-text-3">{subtitulo}</p>
      </header>
      {vacio === null ? children : <CajaPunteada {...vacio} />}
    </section>
  );
}

export function Figura({
  separada = false,
  etiquetadaPor,
  children,
}: {
  separada?: boolean;
  etiquetadaPor?: string;
  children: ReactNode;
}) {
  return (
    <figure
      aria-labelledby={etiquetadaPor}
      className={`m-0 flex min-w-0 flex-col gap-2.5 ${
        separada ? 'border-t border-hairline-soft pt-3.5' : ''
      }`}
    >
      {children}
    </figure>
  );
}

export function TituloDeFigura({
  titulo,
  aparte = null,
  ayuda = null,
  dato = false,
  idDelTitulo,
  idDelAparte,
}: {
  titulo: string;
  aparte?: string | null;
  ayuda?: ReactNode;
  dato?: boolean;
  idDelTitulo?: string;
  idDelAparte?: string;
}) {
  return (
    <figcaption className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
      <span
        translate={dato ? 'no' : undefined}
        className="inline-flex items-center gap-1.5 text-label font-semibold"
      >
        <span id={idDelTitulo}>{titulo}</span>
        {ayuda}
      </span>
      {aparte !== null && (
        <span id={idDelAparte} className="text-meta text-text-3">
          {aparte}
        </span>
      )}
    </figcaption>
  );
}

export function Leyenda({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-meta text-text-2">
      {children}
    </div>
  );
}

export function EnLaLeyenda({ marca, children }: { marca: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {marca}
      {children}
    </span>
  );
}

export function Falta({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-label leading-snug text-text-2">
      <Icono nombre="info" tamano={16} className="mt-px flex-none text-text-3" />
      <span>{children}</span>
    </p>
  );
}

export function Acciones({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-4.5 gap-y-1">{children}</div>;
}

export function IrA({ a, children }: { a: string; children: ReactNode }) {
  return (
    <Ir
      a={a}
      className="inline-flex min-h-tap items-center gap-1 text-label font-semibold text-ink"
    >
      {children}
      <Icono nombre="chevron-right" tamano={16} grosor={2} className="text-text-2" />
    </Ir>
  );
}

export function BotonQueAbre({
  abierto,
  controla,
  alTocar,
  children,
}: {
  abierto: boolean;
  controla: string;
  alTocar: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-expanded={abierto}
      aria-controls={controla}
      onClick={alTocar}
      className="inline-flex min-h-tap items-center gap-1 text-label font-semibold text-ink"
    >
      {children}
      <Icono
        nombre={abierto ? 'chevron-up' : 'chevron-down'}
        tamano={16}
        grosor={2}
        className="text-text-2"
      />
    </button>
  );
}

export function Lista({
  id,
  etiqueta,
  oculta = false,
  children,
}: {
  id?: string;
  etiqueta: string;
  oculta?: boolean;
  children: ReactNode;
}) {
  return (
    <ul id={id} aria-label={etiqueta} hidden={oculta} className="flex list-none flex-col p-0">
      {children}
    </ul>
  );
}

const RENGLON =
  'relative grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5 rounded-field border-t border-hairline-soft py-2.5 first:border-t-0';

export function RenglonConEnlace({
  proyectoId,
  titulo,
  arriba = null,
  detalle = null,
  valor = null,
  valorDebajo = null,
}: {
  proyectoId: string;
  titulo: string;
  arriba?: ReactNode;
  detalle?: ReactNode;
  valor?: ReactNode;
  valorDebajo?: ReactNode;
}) {
  return (
    <li
      className={`${RENGLON} has-[a[data-renglon]:focus-visible]:outline-2 has-[a[data-renglon]:focus-visible]:outline-offset-2 has-[a[data-renglon]:focus-visible]:outline-ink`}
    >
      {arriba !== null && (
        <div className="relative z-10 col-span-2 min-w-0 text-meta text-text-2">{arriba}</div>
      )}
      <Ir
        a={rutaDelProyecto(proyectoId)}
        data-renglon
        translate="no"
        className="col-start-1 min-w-0 text-body-sm font-medium [overflow-wrap:anywhere] after:absolute after:inset-0 after:rounded-field after:content-[''] hover:underline focus-visible:outline-none"
      >
        {titulo}
      </Ir>
      {valor !== null && (
        <span className="col-start-2 text-right text-body-sm font-semibold whitespace-nowrap tabular-nums">
          {valor}
        </span>
      )}
      {detalle !== null && <span className="col-start-1 text-meta text-text-3">{detalle}</span>}
      {valorDebajo !== null && (
        <span className="col-start-2 text-right text-meta whitespace-nowrap text-text-3 tabular-nums">
          {valorDebajo}
        </span>
      )}
    </li>
  );
}

export function RenglonDelTotal({ nombre, valor }: { nombre: string; valor: ReactNode }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 border-t border-hairline py-2.5">
      <span className="text-body-sm font-semibold">{nombre}</span>
      <span className="text-right text-body-sm font-semibold whitespace-nowrap tabular-nums">
        {valor}
      </span>
    </li>
  );
}

import type { ReactNode } from 'react';

import { useMensajes } from '@/shared/idioma';
import { Icono } from '@/shared/ui';

import type { CapturaDeArca } from '../../model/asistente';
import { urlDeLaCaptura } from './capturas';

const PALABRAS_DE_ARCA = /(numa-produccion\.csr|\bnuma\b)/u;

export function TextoDeArca({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(PALABRAS_DE_ARCA).map((parte, indice) =>
        indice % 2 === 1 ? (
          <code
            key={`${String(indice)}-${parte}`}
            translate="no"
            className="rounded-[6px] bg-ink/6 px-1.25 py-px font-mono text-[0.92em] text-ink"
          >
            {parte}
          </code>
        ) : (
          parte
        ),
      )}
    </>
  );
}

export function CapturaDelPaso({ captura }: { captura: CapturaDeArca }) {
  const m = useMensajes().facturacion.asistente;
  const url = urlDeLaCaptura(captura);
  if (url === null) return null;
  return (
    <figure className="m-0 overflow-hidden rounded-lamina border border-hairline bg-paper">
      <a href={url} target="_blank" rel="noopener" className="block">
        <img
          src={url}
          alt={m.capturas[captura]}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full"
        />{' '}
        <span className="sr-only">({m.abreEnOtraPestana})</span>
      </a>
    </figure>
  );
}

export function GuiaDeArca({ url, texto }: { url: string; texto: string }) {
  const m = useMensajes().facturacion.asistente;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-tap items-center gap-1 self-start rounded-field text-label font-semibold text-ink underline underline-offset-3"
    >
      {texto}
      <Icono nombre="external-link" tamano={14} grosor={2} />{' '}
      <span className="sr-only">({m.abreEnOtraPestana})</span>
    </a>
  );
}

export function LineaDeListo({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-body-sm text-ink">
      <Icono nombre="circle-check" tamano={16} className="mt-0.5 flex-none text-hogar" />
      <span>{children}</span>
    </p>
  );
}

export function LineaDeProblema({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-body-sm font-medium text-alerta">
      <Icono nombre="triangle-alert" tamano={16} className="mt-0.5 flex-none" />
      <div className="flex min-w-0 flex-col items-start gap-1">{children}</div>
    </div>
  );
}

export interface PasoDelAsistenteProps {
  numero: number;
  titulo: string;
  enNuma: boolean;
  hecho: boolean;
  primero: boolean;
  nivel?: 'h2' | 'h3';
  children: ReactNode;
}

export function PasoDelAsistente({
  numero,
  titulo,
  enNuma,
  hecho,
  primero,
  nivel: Titulo = 'h2',
  children,
}: PasoDelAsistenteProps) {
  const m = useMensajes().facturacion.asistente;
  return (
    <li
      data-paso={String(numero)}
      data-primero={primero ? '' : undefined}
      tabIndex={primero ? -1 : undefined}
      className={`grid scroll-mt-4 grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 rounded-panel border bg-paper p-4 outline-none md:px-5 md:py-4.5 ${
        enNuma ? 'border-ink' : 'border-hairline'
      }`}
    >
      <span
        aria-hidden
        className={`flex size-8 items-center justify-center rounded-pill border-[1.5px] border-ink text-label font-semibold tabular-nums ${
          hecho ? 'bg-ink text-paper' : 'text-ink'
        }`}
      >
        {hecho ? <Icono nombre="check" tamano={16} grosor={2.5} /> : numero}
      </span>
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        <Titulo className="text-body-lg leading-snug font-semibold">
          <span className="sr-only">{m.paso(numero)}</span> {titulo}
        </Titulo>
        <span
          className={`inline-flex items-center rounded-pill border px-2 py-px text-badge leading-normal font-semibold whitespace-nowrap ${
            enNuma ? 'border-ink bg-ink text-paper' : 'border-border text-text-2'
          }`}
        >
          {enNuma ? m.enNuma : m.enArca}
        </span>
        {hecho && <span className="sr-only">{m.hecho}</span>}
      </div>
      <div className="col-span-2 flex min-w-0 flex-col gap-2.5 text-body-sm leading-relaxed text-text-2 md:col-span-1 md:col-start-2">
        {children}
      </div>
    </li>
  );
}

import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

import { Icono, Tilde, type NombreDeIcono } from '@maun/ui';

export interface TextoQueCreceProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange' | 'rows'
> {
  valor: string;
  alCambiar: (texto: string) => void;
  filasMinimas?: number;
  variante?: 'campo' | 'renglon' | 'en-la-fila';
}

const CAJA_DEL_TEXTO = {
  campo: 'rounded-field border px-3.5 py-2.5 text-body-lg leading-relaxed',
  renglon: 'rounded-field border px-3 py-2 text-body-lg leading-normal',
  'en-la-fila': 'rounded-field border px-1.5 py-2.5 text-body leading-normal',
} as const;

const BORDES_DEL_TEXTO = {
  campo: 'border-border bg-paper',
  renglon: 'border-border bg-paper',
  'en-la-fila':
    'border-transparent bg-transparent hover:border-border focus:border-border focus:bg-paper',
} as const;

export function TextoQueCrece({
  valor,
  alCambiar,
  filasMinimas = 3,
  variante = 'campo',
  className = '',
  ...props
}: TextoQueCreceProps) {
  const caja = CAJA_DEL_TEXTO[variante];
  const alto =
    variante === 'campo'
      ? { minHeight: `calc(${String(filasMinimas)} * 1.5em + 1.25rem + 2px)` }
      : undefined;
  return (
    <div className="grid min-w-0">
      <span
        aria-hidden
        style={alto}
        className={`invisible col-start-1 row-start-1 min-h-11 border-transparent break-words whitespace-pre-wrap ${caja}`}
      >
        {valor}{' '}
      </span>
      <textarea
        {...props}
        rows={1}
        value={valor}
        onChange={(evento) => {
          alCambiar(evento.target.value);
        }}
        className={`col-start-1 row-start-1 min-h-11 min-w-0 resize-none overflow-hidden break-words text-ink placeholder:text-text-3 ${caja} ${BORDES_DEL_TEXTO[variante]} ${className}`}
      />
    </div>
  );
}

export interface CasillaProps {
  tildada: boolean;
  alCambiar: (tildada: boolean) => void;
  etiqueta?: string;
  deshabilitada?: boolean;
  forma?: 'en-el-renglon' | 'suelta' | 'con-etiqueta';
}

export function Casilla({
  tildada,
  alCambiar,
  etiqueta,
  deshabilitada = false,
  forma = 'en-el-renglon',
}: CasillaProps) {
  const [recienTildada, setRecienTildada] = useState(false);
  const caja = (
    <span
      className={`relative flex size-6 flex-none items-center justify-center ${
        forma === 'en-el-renglon' ? 'mt-px' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={tildada}
        disabled={deshabilitada}
        aria-label={forma === 'con-etiqueta' ? undefined : etiqueta}
        onChange={(evento) => {
          setRecienTildada(evento.target.checked);
          alCambiar(evento.target.checked);
        }}
        className="size-5 cursor-pointer appearance-none rounded-[4px] border-[1.5px] border-text-3 bg-paper checked:border-ink checked:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
      />
      {tildada && (
        <Tilde
          dibujar={recienTildada}
          tamano={14}
          grosor={3}
          className="pointer-events-none absolute inset-0 m-auto text-paper"
        />
      )}
    </span>
  );
  if (forma === 'suelta') {
    return (
      <label className="flex size-11 flex-none cursor-pointer items-center justify-center">
        {caja}
      </label>
    );
  }
  if (forma === 'con-etiqueta') {
    return (
      <label className="flex min-h-tap cursor-pointer items-center gap-3 self-start text-body">
        {caja}
        {etiqueta}
      </label>
    );
  }
  return caja;
}

export function DatoFijo({
  clave,
  valor,
  nota,
}: {
  clave: string;
  valor: ReactNode;
  nota?: string;
}) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-x-3 border-t border-hairline-soft py-2.5 text-body first:border-t-0 first:pt-0">
      <dt className="text-text-3">{clave}</dt>
      <dd className="flex min-w-0 flex-col gap-0.5">
        <span className="leading-snug font-medium tabular-nums">{valor}</span>
        {nota !== undefined && <span className="text-meta text-text-3">{nota}</span>}
      </dd>
    </div>
  );
}

export interface CampoConUnidadProps {
  id: string;
  etiqueta: string;
  valor: string;
  alCambiar: (texto: string) => void;
  unidad: string;
  ayuda?: ReactNode;
  cifras?: number;
}

export function CampoConUnidad({
  id,
  etiqueta,
  valor,
  alCambiar,
  unidad,
  ayuda,
  cifras = 3,
}: CampoConUnidadProps) {
  const idDeLaUnidad = `${id}-unidad`;
  const idDeLaAyuda = `${id}-ayuda`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-label text-text-2">
        {etiqueta}
      </label>
      <span className="flex h-field max-w-(--campo-medio) min-w-0 items-center gap-2 rounded-field border border-border bg-paper px-3.5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={cifras}
          value={valor}
          aria-describedby={ayuda === undefined ? idDeLaUnidad : `${idDeLaUnidad} ${idDeLaAyuda}`}
          onChange={(evento) => {
            alCambiar(evento.target.value.replace(/\D/g, ''));
          }}
          className="w-12 min-w-0 flex-none bg-transparent text-body-lg font-semibold text-ink tabular-nums outline-none"
        />
        <span id={idDeLaUnidad} className="text-body text-text-2">
          {unidad}
        </span>
      </span>
      {ayuda !== undefined && (
        <span id={idDeLaAyuda} className="text-meta text-text-3">
          {ayuda}
        </span>
      )}
    </div>
  );
}

export interface BotonDeLaFilaProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'onClick' | 'children' | 'disabled' | 'aria-label' | 'title'
> {
  icono: NombreDeIcono;
  etiqueta: string;
  alTocar: () => void;
  deshabilitado?: boolean;
  peligro?: boolean;
}

export function BotonDeLaFila({
  icono,
  etiqueta,
  alTocar,
  deshabilitado = false,
  peligro = false,
  className = '',
  ...props
}: BotonDeLaFilaProps) {
  return (
    <button
      {...props}
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      disabled={deshabilitado}
      onClick={alTocar}
      className={`flex size-11 flex-none items-center justify-center rounded-pill text-text-3 hover:bg-surface disabled:opacity-35 disabled:hover:bg-transparent ${
        peligro ? 'hover:text-alerta' : 'hover:text-ink'
      } ${className}`}
    >
      <Icono nombre={icono} tamano={18} />
    </button>
  );
}

export const ESPERA_DEL_DESHACER_MS = 7000;

export function BarraDeDeshacer({
  texto,
  alDeshacer,
  alVencer,
}: {
  texto: string;
  alDeshacer: () => void;
  alVencer: () => void;
}) {
  const vencer = useRef(alVencer);
  useEffect(() => {
    vencer.current = alVencer;
  });
  useEffect(() => {
    const reloj = setTimeout(() => {
      vencer.current();
    }, ESPERA_DEL_DESHACER_MS);
    return () => {
      clearTimeout(reloj);
    };
  }, [texto]);

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 rounded-field bg-ink py-1 pr-1 pl-3.5 text-label text-paper"
    >
      <span className="min-w-0 py-1.5 leading-snug">{texto}</span>
      <button
        type="button"
        onClick={alDeshacer}
        className="min-h-tap flex-none px-2.5 font-semibold underline underline-offset-2"
      >
        Deshacer
      </button>
    </div>
  );
}

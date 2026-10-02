import { useMensajes } from '@/shared/idioma';
import { Icono } from '@/shared/ui';

import { deshacerElBorrador, descartarElBorrador, rehacerElBorrador } from '../model/borrador';
import { describirCambios, textoDelProblema } from '../model/textos';
import { tesoroDe, type VistaDeLaFila } from '../model/vista';

export interface BarraDeEdicionProps {
  vista: VistaDeLaFila;
  alGuardar: () => void;
  className?: string;
}

function primerProblema(vista: VistaDeLaFila): string | null {
  const problema = vista.problemas[0];
  if (problema === undefined) return null;
  return textoDelProblema(
    problema.problema,
    problema.tesoro === null ? undefined : tesoroDe(vista, problema.tesoro).nombre,
  );
}

const BOTON_REDONDO =
  'flex size-11 flex-none items-center justify-center rounded-pill text-paper hover:bg-paper/10 disabled:text-paper/35 disabled:hover:bg-transparent';

export function BarraDeEdicion({ vista, alGuardar }: BarraDeEdicionProps) {
  const m = useMensajes().armarLaFila;
  const textos = m.barra;
  const borrador = vista.borrador;
  const problema = primerProblema(vista);
  return (
    <div
      role="region"
      aria-label={textos.editandoLaFila}
      className="relative flex h-18 flex-none items-center justify-between gap-4 bg-ink px-5 text-paper md:px-7"
    >
      <h1 className="sr-only">{textos.tesoros}</h1>
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="flex size-9 flex-none items-center justify-center rounded-field bg-paper/12"
        >
          <Icono nombre="pencil-ruler" tamano={18} />
        </span>
        <div className="min-w-0">
          <p className="text-body-lg leading-snug font-semibold">{textos.editandoLaFila}</p>
          <p aria-live="polite" className="truncate text-label text-paper/70">
            {problema === null
              ? m.cuantosCambiosYCuandoValen(vista.cuantos)
              : m.paraGuardar(problema)}
          </p>
        </div>
      </div>
      <div className="flex flex-none items-center gap-1">
        <button
          type="button"
          aria-label={textos.deshacer}
          title={textos.deshacer}
          disabled={(borrador?.atras.length ?? 0) === 0}
          onClick={deshacerElBorrador}
          className={BOTON_REDONDO}
        >
          <Icono nombre="undo-2" tamano={18} />
        </button>
        <button
          type="button"
          aria-label={textos.rehacer}
          title={textos.rehacer}
          disabled={(borrador?.adelante.length ?? 0) === 0}
          onClick={rehacerElBorrador}
          className={BOTON_REDONDO}
        >
          <Icono nombre="redo-2" tamano={18} />
        </button>
        <button
          type="button"
          onClick={descartarElBorrador}
          className="apretable ml-2 min-h-button rounded-pill border border-paper/30 px-4 text-body font-medium text-paper [--transicion-propia:background-color_var(--dur-fast)_var(--ease-out)] hover:bg-paper/10"
        >
          {textos.descartar}
        </button>
        <button
          type="button"
          disabled={vista.cuantos === 0 || problema !== null}
          onClick={alGuardar}
          className="apretable ml-1 min-h-button rounded-pill bg-paper px-[18px] text-body font-medium text-ink disabled:bg-paper/30 disabled:text-paper/60"
        >
          {textos.guardarLaFila}
        </button>
      </div>
    </div>
  );
}

export function BarraDeEdicionCelular({ vista, alGuardar, className = '' }: BarraDeEdicionProps) {
  const textos = useMensajes().armarLaFila.barra;
  const borrador = vista.borrador;
  const problema = primerProblema(vista);
  return (
    <div
      role="region"
      aria-label={textos.editandoLaFila}
      className={`sticky top-0 z-20 flex items-center gap-2 bg-ink py-2 pr-3 pl-1.5 text-paper ${className}`}
    >
      <h1 className="sr-only">{textos.tesoros}</h1>
      <button
        type="button"
        aria-label={textos.descartarLosCambios}
        onClick={descartarElBorrador}
        className={BOTON_REDONDO}
      >
        <Icono nombre="x" tamano={20} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-body leading-snug font-semibold">{textos.editandoLaFila}</p>
        <p aria-live="polite" className="truncate text-meta text-paper/70">
          {problema ?? describirCambios(vista.cuantos)}
        </p>
      </div>
      <button
        type="button"
        aria-label={textos.deshacer}
        disabled={(borrador?.atras.length ?? 0) === 0}
        onClick={deshacerElBorrador}
        className={BOTON_REDONDO}
      >
        <Icono nombre="undo-2" tamano={19} />
      </button>
      <button
        type="button"
        disabled={vista.cuantos === 0 || problema !== null}
        onClick={alGuardar}
        className="apretable min-h-button flex-none rounded-pill bg-paper px-4 text-body font-medium text-ink disabled:bg-paper/30 disabled:text-paper/60"
      >
        {textos.guardar}
      </button>
    </div>
  );
}

import { TINTA, type TintaDeTesoro } from '@/shared/lib';
import { Globo } from '@/shared/ui';

export { Globo, LineaDePuntos, MarcaDeRevision, RotuloDelPlano } from '@/shared/ui';

export function GloboConGuia({ numero }: { numero: number }) {
  return (
    <span aria-hidden className="absolute top-3 right-full flex items-center">
      <Globo numero={numero} />
      <span className="h-px w-3.5 bg-ink" />
      <span className="-ml-0.5 size-1.25 rounded-pill bg-ink" />
    </span>
  );
}

export function MarcasDeCorte() {
  const esquinas = [
    'left-0 top-0 -translate-x-full -translate-y-full',
    'right-0 top-0 translate-x-full -translate-y-full rotate-90',
    'right-0 bottom-0 translate-x-full translate-y-full rotate-180',
    'left-0 bottom-0 -translate-x-full translate-y-full -rotate-90',
  ];
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {esquinas.map((esquina) => (
        <svg
          key={esquina}
          viewBox="0 0 14 14"
          className={`absolute size-3.5 overflow-visible text-ink ${esquina}`}
        >
          <path d="M0 14 H9 M14 0 V9" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      ))}
    </span>
  );
}

export interface NivelDelMesProps {
  tinta: TintaDeTesoro;
  lleva: number;
  prueba?: number;
  tope: number;
  etiqueta: string;
  texto: string;
}

export function NivelDelMes({ tinta, lleva, prueba = 0, tope, etiqueta, texto }: NivelDelMesProps) {
  const clases = TINTA[tinta];
  const lleno = tope <= 0 ? 0 : Math.min(100, (lleva / tope) * 100);
  const fantasma = tope <= 0 ? 0 : Math.min(100 - lleno, (prueba / tope) * 100);
  return (
    <div
      role="meter"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(lleno)}
      aria-valuetext={texto}
      className="relative flex h-3 items-center"
    >
      <span aria-hidden className="absolute top-0 left-0 h-3 w-px bg-text-3" />
      <span aria-hidden className="absolute top-0 right-0 h-3 w-px bg-text-3" />
      <span
        aria-hidden
        className="relative mx-px h-1.5 flex-1 overflow-hidden rounded-[2px] bg-surface-2"
      >
        <span
          className={`absolute inset-y-0 left-0 ${clases.fondo}`}
          style={{ width: `${String(lleno)}%` }}
        />
        {fantasma > 0 && (
          <span
            data-prueba
            className="absolute inset-y-0"
            style={{
              left: `${String(lleno)}%`,
              width: `${String(fantasma)}%`,
              backgroundImage: `repeating-linear-gradient(135deg, ${clases.color} 0 1.5px, transparent 1.5px 4px)`,
              boxShadow: `inset 0 0 0 1px ${clases.color}`,
            }}
          />
        )}
      </span>
    </div>
  );
}

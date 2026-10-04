import { useMensajes } from '@/shared/idioma';

export function CapsulaDePrueba({ className = '' }: { className?: string }) {
  const m = useMensajes().facturacion;
  return (
    <span
      className={`inline-block flex-none rounded-pill border border-border px-2 py-0.5 align-middle text-badge font-semibold whitespace-nowrap text-text-2 ${className}`}
    >
      {m.prueba}
    </span>
  );
}

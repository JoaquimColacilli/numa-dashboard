import type { LoQueFaltaParaFacturar as CodigoDeLoQueFalta } from '@maun/domain';

import { useMensajes } from '@/shared/idioma';
import {
  frasesDeLoQueFaltaParaFacturar,
  Ir,
  RUTA_DE_LA_FACTURACION,
  type ClaveDeLoQueFalta,
} from '@/shared/lib';
import { Icono } from '@/shared/ui';

const ENLACE =
  'inline-flex min-h-tap items-center gap-1 self-start text-label font-semibold text-ink underline underline-offset-3';

type DelCliente = Extract<
  ClaveDeLoQueFalta,
  'cliente-sin-cuit' | 'cliente-cuit-invalido' | 'cliente-sin-domicilio' | 'cliente-sin-dni'
>;

function esDelCliente(clave: ClaveDeLoQueFalta): clave is DelCliente {
  return (
    clave === 'cliente-sin-cuit' ||
    clave === 'cliente-cuit-invalido' ||
    clave === 'cliente-sin-domicilio' ||
    clave === 'cliente-sin-dni'
  );
}

export interface LoQueFaltaParaFacturarProps {
  faltas: readonly CodigoDeLoQueFalta[];
  cliente: { id: string | null; nombre: string };
  alEditarElCliente?: ((clienteId: string) => void) | undefined;
  soloLaPrimera?: boolean;
}

export function LoQueFaltaParaFacturar({
  faltas,
  cliente,
  alEditarElCliente,
  soloLaPrimera = false,
}: LoQueFaltaParaFacturarProps) {
  const m = useMensajes().facturacion.facturar;
  const accion: Readonly<Record<DelCliente, string>> = {
    'cliente-sin-cuit': m.cargarElCuit,
    'cliente-cuit-invalido': m.revisarElCuit,
    'cliente-sin-domicilio': m.cargarElDomicilio,
    'cliente-sin-dni': m.cargarElDni,
  };
  const todas = frasesDeLoQueFaltaParaFacturar(faltas, cliente.nombre);
  const frases = soloLaPrimera ? todas.slice(0, 1) : todas;
  const clienteId = cliente.id;
  return (
    <ul className="flex list-none flex-col gap-2">
      {frases.map((frase) => (
        <li
          key={frase.clave}
          className={
            soloLaPrimera
              ? 'flex flex-col items-start gap-0.5 text-meta leading-normal text-text-2'
              : 'flex flex-col items-start gap-0.5 rounded-field border border-alerta bg-alerta-tint px-3 py-2.5 text-label leading-normal text-ink'
          }
        >
          <span>{frase.texto}</span>
          {frase.clave === 'taller' && (
            <Ir a={RUTA_DE_LA_FACTURACION} className={ENLACE}>
              {m.completarlos}
              <Icono nombre="arrow-right" tamano={14} grosor={2} />
            </Ir>
          )}
          {esDelCliente(frase.clave) && clienteId !== null && alEditarElCliente !== undefined && (
            <button
              type="button"
              className={ENLACE}
              onClick={() => {
                alEditarElCliente(clienteId);
              }}
            >
              {accion[frase.clave]}
              <Icono nombre="arrow-right" tamano={14} grosor={2} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

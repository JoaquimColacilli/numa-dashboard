import { useEffect, useRef, useState } from 'react';

import { useMensajes } from '@/shared/idioma';
import { copiar, type ComoQuedo } from '@/shared/lib';

import { Icono, Tilde } from '@maun/ui';

export interface DatoCopiableProps {
  etiqueta: string;
  valor: string;
  paraCopiar?: string;
  nombre: string;
  destacado?: boolean;
}

const MUESTRA_MS = 4_000;

export function DatoCopiable({
  etiqueta,
  valor,
  paraCopiar,
  nombre,
  destacado = false,
}: DatoCopiableProps) {
  const { copiar: textos } = useMensajes().ui;
  const [comoQuedo, setComoQuedo] = useState<ComoQuedo | null>(null);
  const [anuncio, setAnuncio] = useState('');
  const elValor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (comoQuedo === null) return;
    const reloj = setTimeout(() => {
      setComoQuedo(null);
      setAnuncio('');
    }, MUESTRA_MS);
    return () => {
      clearTimeout(reloj);
    };
  }, [comoQuedo]);

  function alTocar(): void {
    void copiar(paraCopiar ?? valor, elValor.current).then((resultado) => {
      setComoQuedo(resultado);
      setAnuncio(resultado === 'nada' ? textos.noSePudo : textos[resultado]);
    });
  }

  return (
    <div className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 border-t border-hairline-soft py-2.5 first:border-t-0">
      <span className="min-w-0 flex-1">
        <span className="block text-label text-text-2">{etiqueta}</span>
        <span
          ref={elValor}
          translate="no"
          className={`block font-semibold break-all tabular-nums select-text ${
            destacado ? 'text-money-lg leading-tight' : 'text-body'
          }`}
        >
          {valor}
        </span>
      </span>

      <button
        type="button"
        aria-label={nombre}
        onClick={alTocar}
        className={`flex min-h-tap flex-none items-center gap-1.5 rounded-pill border px-3.5 text-label font-semibold ${
          comoQuedo === 'copiado'
            ? 'border-hogar text-hogar'
            : 'border-border hover:border-ink hover:bg-surface'
        }`}
      >
        {comoQuedo === 'copiado' ? (
          <Tilde dibujar tamano={16} grosor={2} />
        ) : (
          <Icono nombre="copy" tamano={16} />
        )}
        {comoQuedo === 'copiado' ? textos.copiado : textos.copiar}
      </button>

      <span role="status" className="sr-only">
        {anuncio}
      </span>

      {comoQuedo !== null && comoQuedo !== 'copiado' && (
        <span className="w-full text-label leading-normal text-atencion">
          {comoQuedo === 'seleccionado' ? textos.seleccionado : textos.noSePudo}
        </span>
      )}
    </div>
  );
}

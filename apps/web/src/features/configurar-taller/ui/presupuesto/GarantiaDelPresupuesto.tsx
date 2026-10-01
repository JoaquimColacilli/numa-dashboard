import type { Hueco } from '@maun/domain';
import { useCallback, useId, useRef } from 'react';

import { Button, Icono } from '@/shared/ui';

import { datosDelTexto, type Valores } from '../../model/presupuestoDelTaller';
import { EditorConDatos } from './EditorConDatos';
import { LeyendaDeLosDatos, MarcaSinGuardar, SumarUnDato } from './piezas';
import { TextoConDatos } from './TextoConDatos';

const DATOS_DE_LA_GARANTIA: readonly Hueco[] = ['meses'];

export interface GarantiaDelPresupuestoProps {
  texto: string;
  guardado: string;
  valores: Valores;
  abierta: boolean;
  problema: string | undefined;
  alAbrir: () => void;
  alCerrar: () => void;
  alCambiar: (texto: string) => void;
}

export function GarantiaDelPresupuesto({
  texto,
  guardado,
  valores,
  abierta,
  problema,
  alAbrir,
  alCerrar,
  alCambiar,
}: GarantiaDelPresupuestoProps) {
  const id = useId();
  const insertar = useRef<((hueco: Hueco) => void) | null>(null);
  const registrar = useCallback((funcion: ((hueco: Hueco) => void) | null) => {
    insertar.current = funcion;
  }, []);

  if (!abierta) {
    return (
      <button
        type="button"
        aria-expanded={false}
        onClick={alAbrir}
        className="-mt-1 -ml-1.5 grid w-[calc(100%+0.375rem)] min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-field py-2 pr-2 pl-1.5 text-left hover:bg-surface"
      >
        <span className="flex min-w-0 flex-col items-start">
          <span className="max-w-[36rem] text-body leading-relaxed text-pretty text-ink">
            <span className="sr-only">Cambiar el texto de la garantía: </span>
            <TextoConDatos texto={texto} valores={valores} />
          </span>
          {problema !== undefined && (
            <span className="mt-1 text-label font-medium text-alerta">{problema}</span>
          )}
          <MarcaSinGuardar marca={texto === guardado ? null : 'cambiada'} nuevo="Nueva" />
        </span>
        <Icono nombre="pencil-line" tamano={16} className="mt-1 text-text-3" />
      </button>
    );
  }

  return (
    <div
      data-abierta=""
      className="flex flex-col gap-4 rounded-field bg-surface px-3.5 pt-3.5 pb-4 md:px-4"
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-label text-text-2">
          <span id={`${id}-etiqueta`}>Texto de la garantía</span>
          <span className="text-text-3"> · así lo lee tu cliente</span>
        </span>
        <EditorConDatos
          texto={texto}
          valores={valores}
          etiquetadoPor={`${id}-etiqueta`}
          descritoPor={problema === undefined ? undefined : `${id}-error`}
          invalido={problema !== undefined}
          registrar={registrar}
          alCambiar={alCambiar}
        />
        {problema !== undefined && (
          <span id={`${id}-error`} role="alert" className="text-label font-medium text-alerta">
            {problema}
          </span>
        )}
      </div>
      <LeyendaDeLosDatos datos={datosDelTexto(texto)} valores={valores} />
      <SumarUnDato
        datos={DATOS_DE_LA_GARANTIA}
        alSumar={(hueco) => {
          insertar.current?.(hueco);
        }}
      />
      <Button variant="secundario" onClick={alCerrar} className="self-start px-6">
        Listo
      </Button>
    </div>
  );
}

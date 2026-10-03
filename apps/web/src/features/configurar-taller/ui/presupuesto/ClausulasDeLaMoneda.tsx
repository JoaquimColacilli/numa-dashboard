import {
  COMBINACIONES_DE_LA_MONEDA,
  type ClausulasDeLaMoneda as LasClausulas,
  type CombinacionDeLaMoneda,
} from '@maun/domain';
import { useId } from 'react';

import { useMensajes } from '@/shared/idioma';
import { Button, Icono } from '@/shared/ui';

import { datosDelTexto, type Valores } from '../../model/presupuestoDelTaller';
import { EditorConDatos } from './EditorConDatos';
import { LeyendaDeLosDatos, MarcaSinGuardar } from './piezas';
import { TextoConDatos } from './TextoConDatos';

function idDeLaClausula(combinacion: CombinacionDeLaMoneda): string {
  return `clausula:${combinacion}`;
}

interface FilaDeLaClausulaProps {
  combinacion: CombinacionDeLaMoneda;
  texto: string;
  guardado: string;
  valores: Valores;
  abierta: boolean;
  problema: string | undefined;
  alAbrir: () => void;
  alCerrar: () => void;
  alCambiar: (texto: string) => void;
}

function FilaDeLaClausula({
  combinacion,
  texto,
  guardado,
  valores,
  abierta,
  problema,
  alAbrir,
  alCerrar,
  alCambiar,
}: FilaDeLaClausulaProps) {
  const textos = useMensajes().configurarTaller.presupuesto;
  const id = useId();
  const nombre = textos.moneda.combinaciones[combinacion];

  if (!abierta) {
    return (
      <li
        data-clausula={combinacion}
        className="border-t border-hairline-soft py-1 first:border-t-0"
      >
        <button
          type="button"
          aria-expanded={false}
          onClick={alAbrir}
          className="-ml-1.5 grid w-[calc(100%+0.375rem)] min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-field py-2.5 pr-2 pl-1.5 text-left hover:bg-surface"
        >
          <span className="flex min-w-0 flex-col items-start">
            <span className="text-body leading-normal font-semibold text-ink">
              <span className="sr-only">{textos.lista.cambiar} </span>
              {nombre}
            </span>
            <span
              translate="no"
              className="max-w-[36rem] text-body leading-normal text-pretty text-text-2"
            >
              <TextoConDatos texto={texto} valores={valores} />
            </span>
            {problema !== undefined && (
              <span className="mt-1 text-label font-medium text-alerta">{problema}</span>
            )}
            <MarcaSinGuardar
              marca={texto === guardado ? null : 'cambiada'}
              nueva={textos.formas.nuevaSinGuardar}
            />
          </span>
          <Icono nombre="pencil-line" tamano={16} className="mt-0.5 text-text-3" />
        </button>
      </li>
    );
  }

  return (
    <li
      data-clausula={combinacion}
      data-abierta=""
      className="border-t border-hairline-soft py-2 first:border-t-0"
    >
      <div className="rounded-field bg-surface px-3.5 pt-3.5 pb-4 md:px-4">
        <div className="flex max-w-[42rem] flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span id={`${id}-etiqueta`} className="text-label text-text-2">
              <span className="font-semibold text-ink">{nombre}</span>
              <span className="text-text-3"> · {textos.moneda.texto}</span>
            </span>
            <EditorConDatos
              texto={texto}
              valores={valores}
              etiquetadoPor={`${id}-etiqueta`}
              descritoPor={problema === undefined ? undefined : `${id}-error`}
              invalido={problema !== undefined}
              alCambiar={alCambiar}
            />
            {problema !== undefined && (
              <span id={`${id}-error`} role="alert" className="text-label font-medium text-alerta">
                {problema}
              </span>
            )}
          </div>
          <LeyendaDeLosDatos datos={datosDelTexto(texto)} valores={valores} />
          <Button variant="secundario" onClick={alCerrar} className="self-start px-6">
            {textos.lista.listo}
          </Button>
        </div>
      </div>
    </li>
  );
}

export interface ClausulasDeLaMonedaProps {
  clausulas: LasClausulas;
  guardadas: LasClausulas;
  valores: Valores;
  abierta: string | null;
  problemas: Readonly<Record<string, string>>;
  alAbrir: (id: string | null) => void;
  alCambiar: (combinacion: CombinacionDeLaMoneda, texto: string) => void;
}

export function ClausulasDeLaMoneda({
  clausulas,
  guardadas,
  valores,
  abierta,
  problemas,
  alAbrir,
  alCambiar,
}: ClausulasDeLaMonedaProps) {
  const textos = useMensajes().configurarTaller.presupuesto;
  return (
    <ul aria-label={textos.secciones.moneda.titulo} className="-mt-1 flex list-none flex-col">
      {COMBINACIONES_DE_LA_MONEDA.map((combinacion) => (
        <FilaDeLaClausula
          key={combinacion}
          combinacion={combinacion}
          texto={clausulas[combinacion]}
          guardado={guardadas[combinacion]}
          valores={valores}
          abierta={abierta === idDeLaClausula(combinacion)}
          problema={problemas[idDeLaClausula(combinacion)]}
          alAbrir={() => {
            alAbrir(idDeLaClausula(combinacion));
          }}
          alCerrar={() => {
            alAbrir(null);
          }}
          alCambiar={(texto) => {
            alCambiar(combinacion, texto);
          }}
        />
      ))}
    </ul>
  );
}

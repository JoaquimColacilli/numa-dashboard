import { useId, useState, type ReactNode } from 'react';

import { Icono } from '@maun/ui';

export interface ColumnaDeLaTabla {
  clave: string;
  titulo: ReactNode;
  alineacion?: 'inicio' | 'fin';
  enElCelular?: boolean;
}

export interface FilaDeLaTabla {
  clave: string;
  celdas: readonly ReactNode[];
  resaltada?: boolean;
}

export interface TablaGemelaProps {
  titulo: string;
  columnas: readonly ColumnaDeLaTabla[];
  filas: readonly FilaDeLaTabla[];
}

function claseDeLaColumna(columna: ColumnaDeLaTabla | undefined, indice: number): string {
  const alineacion =
    indice === 0 || columna?.alineacion === 'inicio' ? 'pl-0 text-left' : 'pl-2.5 text-right';
  const enElCelular = columna?.enElCelular === false ? 'hidden @min-[30rem]/tabla:table-cell' : '';
  return `${alineacion} ${enElCelular}`;
}

export function TablaGemela({ titulo, columnas, filas }: TablaGemelaProps) {
  return (
    <div className="@container/tabla min-w-0">
      <table className="w-full border-collapse text-label tabular-nums">
        <caption className="pb-1.5 text-left text-meta text-text-3">{titulo}</caption>
        <thead>
          <tr>
            {columnas.map((columna, indice) => (
              <th
                key={columna.clave}
                scope="col"
                className={`py-1 text-meta font-medium text-text-2 ${claseDeLaColumna(columna, indice)}`}
              >
                {columna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.clave} className={fila.resaltada === true ? 'font-semibold' : ''}>
              {fila.celdas.map((celda, indice) => {
                const clase = `border-t border-hairline-soft py-1.5 ${claseDeLaColumna(columnas[indice], indice)}`;
                return indice === 0 ? (
                  <th key={indice} scope="row" className={`font-[inherit] ${clase}`}>
                    {celda}
                  </th>
                ) : (
                  <td key={indice} className={clase}>
                    {celda}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface VerLosNumerosProps {
  textos: { ver: string; ocultar: string };
  tablas: readonly TablaGemelaProps[];
  children?: ReactNode;
}

export function VerLosNumeros({ textos, tablas, children }: VerLosNumerosProps) {
  const [abiertos, setAbiertos] = useState(false);
  const id = useId();
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4.5 gap-y-1">
        <button
          type="button"
          aria-expanded={abiertos}
          aria-controls={id}
          onClick={() => {
            setAbiertos((antes) => !antes);
          }}
          className="inline-flex min-h-tap items-center gap-1.5 text-meta font-semibold text-ink underline underline-offset-3"
        >
          <Icono nombre={abiertos ? 'arrow-up' : 'arrow-down'} tamano={14} grosor={2} />
          {abiertos ? textos.ocultar : textos.ver}
        </button>
        {children}
      </div>
      <div id={id} hidden={!abiertos} className="flex flex-col gap-4">
        {tablas.map((tabla) => (
          <TablaGemela key={tabla.titulo} {...tabla} />
        ))}
      </div>
    </>
  );
}

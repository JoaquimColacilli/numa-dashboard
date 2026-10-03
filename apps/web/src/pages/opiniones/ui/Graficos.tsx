import { PUNTOS_DE_LA_TASA, type Conteo, type PuntoDeLaEvolucion } from '@maun/domain';

import { fondoDelPaso } from '@/entities/opinion';
import { useMensajes } from '@/shared/idioma';
import { diaYMesCorto } from '@/shared/lib';

import { porcentajeConLaCuenta } from '../model/numeros';

export function TablaDeNumeros({ conteos, total }: { conteos: readonly Conteo[]; total: number }) {
  return (
    <table className="mt-3 w-full border-collapse text-label">
      <tbody>
        {conteos.map(({ paso, n }) => (
          <tr key={paso.valor}>
            <th
              scope="row"
              className="border-t border-hairline-soft py-1.5 text-left font-normal text-text-2"
            >
              {paso.etiqueta}
            </th>
            <td className="border-t border-hairline-soft py-1.5 text-right font-medium tabular-nums">
              {porcentajeConLaCuenta(n, total)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PuntosDeLaTasa({
  enviadas,
  contestadas,
}: {
  enviadas: number;
  contestadas: number;
}) {
  return (
    <span aria-hidden className="flex flex-wrap items-center gap-0.75">
      {Array.from({ length: Math.min(enviadas, PUNTOS_DE_LA_TASA) }, (_, indice) => (
        <span
          key={indice}
          className={`size-2.25 flex-none rounded-pill ${
            indice < contestadas ? 'bg-ink' : 'border border-border'
          }`}
        />
      ))}
    </span>
  );
}

const ALTO_CON_EVOLUCION = 92;

const ALTO_SIN_EVOLUCION = 64;

export function TiraEnElTiempo({
  puntos,
  conEvolucion,
}: {
  puntos: readonly PuntoDeLaEvolucion[];
  conEvolucion: boolean;
}) {
  const textos = useMensajes().paginaOpiniones.enElTiempo;
  const alto = conEvolucion ? ALTO_CON_EVOLUCION : ALTO_SIN_EVOLUCION;
  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];
  const descripcion =
    primero && ultimo
      ? textos.tira(puntos.length, diaYMesCorto(primero.dia), diaYMesCorto(ultimo.dia))
      : textos.sinRespuestas;

  return (
    <>
      <div
        role="img"
        aria-label={descripcion}
        style={{ height: `${String(alto)}px` }}
        className={`flex items-end overflow-hidden border-b border-hairline pb-2 ${
          conEvolucion ? 'gap-1' : 'gap-2'
        }`}
      >
        {puntos.map((punto) => (
          <span
            key={punto.respuestaId}
            title={`${punto.cliente}: ${punto.paso.etiqueta}, ${diaYMesCorto(punto.dia)}`}
            style={{
              height: `${String(Math.round(14 + (punto.paso.valor - 1) * ((alto - 22) / 4)))}px`,
            }}
            className={`min-w-1.5 flex-1 rounded-[2px] ${fondoDelPaso(punto.paso)} ${
              conEvolucion ? 'max-w-4' : 'max-w-5.5'
            }`}
          />
        ))}
      </div>
      {primero && ultimo && (
        <div className="mt-1.75 flex justify-between text-meta text-text-3">
          <span translate="no">{diaYMesCorto(primero.dia)}</span>
          <span translate="no">{diaYMesCorto(ultimo.dia)}</span>
        </div>
      )}
    </>
  );
}

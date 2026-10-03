import { MONEDA_DEL_TALLER, type Moneda } from '@maun/domain';
import { useId, useState, type SyntheticEvent } from 'react';

import type { FilaDePago, FormularioDeProyecto } from '@/entities/proyecto';
import { useMensajes } from '@/shared/idioma';
import { formatearPesos } from '@/shared/lib';
import { Button, CampoDelDolar, FilaDeAcciones, Hoja } from '@/shared/ui';

import {
  erroresDelCambio,
  hayErroresEnElCambio,
  hayImportes,
  pagosQuePidenSuDolar,
  type CambioDeMoneda,
  type ErroresDelCambio,
  type QueHacerConLosImportes,
} from '../model/moneda';

export interface HojaDeCambiarLaMonedaProps {
  hacia: Moneda;
  valores: Pick<FormularioDeProyecto, 'presupuesto' | 'opciones' | 'pagos'>;
  dolarDelDia: { valor: number; fecha: string } | null;
  monedaDeLoMandado: Moneda | null;
  alCerrar: () => void;
  alCambiar: (cambio: CambioDeMoneda) => void;
}

function dolarInicial(
  pago: Pick<FilaDePago, 'fecha'>,
  dolarDelDia: HojaDeCambiarLaMonedaProps['dolarDelDia'],
): number | null {
  return dolarDelDia !== null && dolarDelDia.fecha === pago.fecha ? dolarDelDia.valor : null;
}

export function HojaDeCambiarLaMoneda({
  hacia,
  valores,
  dolarDelDia,
  monedaDeLoMandado,
  alCerrar,
  alCambiar,
}: HojaDeCambiarLaMonedaProps) {
  const textos = useMensajes().editarProyecto.cambiarLaMoneda;
  const textosDelPago = useMensajes().proyecto.pago;
  const id = useId();
  const conImportes = hayImportes(valores);
  const pagos = pagosQuePidenSuDolar(valores.pagos, hacia);
  const [conLosImportes, setConLosImportes] = useState<QueHacerConLosImportes>('pasarlos');
  const [dolar, setDolar] = useState<number | null>(dolarDelDia?.valor ?? null);
  const [dolaresDeLosPagos, setDolaresDeLosPagos] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(pagos.map((pago) => [pago.id, dolarInicial(pago, dolarDelDia)])),
  );
  const [errores, setErrores] = useState<ErroresDelCambio>({ pagos: {} });

  function cambiar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();
    const cambio: CambioDeMoneda = { hacia, conLosImportes, dolar, dolaresDeLosPagos };
    const encontrados = erroresDelCambio(valores, cambio);
    setErrores(encontrados);
    if (hayErroresEnElCambio(encontrados)) return;
    alCambiar(cambio);
    alCerrar();
  }

  const otra: Moneda = hacia === MONEDA_DEL_TALLER ? 'USD' : MONEDA_DEL_TALLER;

  return (
    <Hoja titulo={textos.titulo[hacia]} bajada={textos.bajada} alCerrar={alCerrar}>
      <form noValidate onSubmit={cambiar} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
          {conImportes && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-label text-text-2">{textos.losImportes}</legend>
              {(['pasarlos', 'dejarlosEnBlanco'] as const).map((opcion) => (
                <label
                  key={opcion}
                  className={`flex min-h-tap cursor-pointer items-center gap-3 rounded-field border px-3.5 py-2.5 ${
                    conLosImportes === opcion ? 'border-ink ring-1 ring-ink' : 'border-border'
                  }`}
                >
                  <input
                    type="radio"
                    name={`${id}-importes`}
                    checked={conLosImportes === opcion}
                    onChange={() => {
                      setConLosImportes(opcion);
                    }}
                    className="size-5 flex-none accent-ink"
                  />
                  <span className="text-body-lg">
                    {opcion === 'pasarlos' ? textos.pasarlos[hacia] : textos.dejarlosEnBlanco}
                  </span>
                </label>
              ))}
              {conLosImportes === 'pasarlos' && (
                <CampoDelDolar
                  value={dolar}
                  onChange={setDolar}
                  delDia={dolarDelDia === null ? null : { valor: dolarDelDia.valor }}
                  error={errores.dolar}
                />
              )}
            </fieldset>
          )}

          {pagos.length > 0 && (
            <section className="flex flex-col gap-3" aria-label={textos.losPagosEnPesos}>
              <h3 className="text-label text-text-2">{textos.losPagosEnPesos}</h3>
              {pagos.map((pago) => (
                <div key={pago.id} className="flex flex-col gap-1.5">
                  <p className="text-body leading-snug">
                    {textos.pagoEnPesos(
                      pago.detalle.trim() === '' ? textosDelPago.tePago : pago.detalle.trim(),
                      formatearPesos(pago.monto ?? 0),
                    )}
                  </p>
                  <CampoDelDolar
                    etiqueta={textos.aQueDolar}
                    value={dolaresDeLosPagos[pago.id] ?? null}
                    onChange={(valor) => {
                      setDolaresDeLosPagos((previos) => ({ ...previos, [pago.id]: valor }));
                    }}
                    delDia={
                      dolarInicial(pago, dolarDelDia) === null || dolarDelDia === null
                        ? null
                        : { valor: dolarDelDia.valor }
                    }
                    error={errores.pagos[pago.id]}
                  />
                </div>
              ))}
            </section>
          )}

          {monedaDeLoMandado === otra && (
            <p className="rounded-field bg-atencion-tint px-3.5 py-3 text-label leading-relaxed text-atencion">
              {textos.presupuestoEnLaOtraMoneda[otra]}
            </p>
          )}
        </div>
        <FilaDeAcciones className="flex-none border-t border-hairline px-5 py-3 md:px-6">
          <Button type="submit">{textos.cambiar}</Button>
          <Button type="button" variant="secundario" onClick={alCerrar}>
            {textos.cancelar}
          </Button>
        </FilaDeAcciones>
      </form>
    </Hoja>
  );
}

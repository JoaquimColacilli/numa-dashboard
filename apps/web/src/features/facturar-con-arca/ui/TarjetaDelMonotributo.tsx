import { useState } from 'react';

import { useReplicaDelTaller } from '@/entities/replica';
import { useMensajes } from '@/shared/idioma';
import {
  diaYMes,
  enPesosEnteros,
  fechaCortaSinAnio,
  formatearPesos,
  formatearPorcentaje,
  Ir,
  mesCortoConAnio,
  mesDeLaFecha,
  RUTA_DE_LA_FACTURACION,
} from '@/shared/lib';
import { ConSalida, Icono, MontoQueEntra } from '@/shared/ui';

import { datosDelMonotributo } from '../model/monotributo';
import { HojaDeCobrosSinFacturar } from './HojaDeCobrosSinFacturar';
import { HojaDeFacturar } from './HojaDeFacturar';

const ENLACE =
  'inline-flex min-h-8 items-center gap-1 text-label font-semibold text-ink underline underline-offset-3 max-md:min-h-tap';

export interface TarjetaDelMonotributoProps {
  hoy: string;
  alEditarElCliente?: ((clienteId: string) => void) | undefined;
}

export function TarjetaDelMonotributo({ hoy, alEditarElCliente }: TarjetaDelMonotributoProps) {
  const m = useMensajes().facturacion.monotributo;
  const replica = useReplicaDelTaller();
  const [viendoLosCobros, setViendoLosCobros] = useState(false);
  const [facturando, setFacturando] = useState<string | null>(null);
  const datos = datosDelMonotributo(replica, hoy);
  if (datos === null) return null;

  const { categoria, tope, sinFacturar } = datos;
  const desde = datos.facturacionDesde === null ? '' : fechaCortaSinAnio(datos.facturacionDesde);
  const nivel = tope?.nivel ?? 'bien';
  const porcentaje = tope === null ? '' : formatearPorcentaje(tope.porcentaje * 100);
  const color = nivel === 'bien' ? 'bg-ink' : nivel === 'cerca' ? 'bg-atencion' : 'bg-alerta';
  const proxima = datos.proximaRecategorizacion;

  return (
    <section
      aria-label={m.titulo}
      className="@container flex flex-col gap-3 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <div className="flex items-baseline justify-between gap-2.5">
        <h2 className="text-label font-semibold">{m.titulo}</h2>
        {categoria === null ? (
          <span className="text-meta text-text-3">{m.sinCategoria}</span>
        ) : (
          <span className="inline-flex min-w-6 items-center justify-center rounded-pill border border-ink px-2 py-px text-badge font-semibold text-ink">
            <span className="sr-only">{m.categoriaDe(categoria)}</span>
            <span aria-hidden translate="no">
              {categoria}
            </span>
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <MontoQueEntra className="leading-tight font-semibold tabular-nums">
            {formatearPesos(datos.facturado)}
          </MontoQueEntra>
          <span className="text-meta text-text-3">
            {m.facturados}, {m.rango(mesCortoConAnio(mesDeLaFecha(datos.desde)))}
          </span>
        </div>
        {datos.prueba && <p className="text-label leading-normal text-text-2">{m.enPrueba}</p>}
        {categoria !== null && tope !== null ? (
          <>
            <div
              role="img"
              aria-label={m.barra(porcentaje, categoria, formatearPesos(enPesosEnteros(tope.tope)))}
              className="relative h-2.5 overflow-hidden rounded-pill bg-hairline"
            >
              <span
                className={`absolute inset-y-0 left-0 rounded-pill ${color}`}
                style={{ width: `${String(Math.min(100, tope.proporcion * 100))}%` }}
              />
            </div>
            <div className="flex justify-between gap-2 text-label text-text-2 tabular-nums">
              <span>{m.deTope(porcentaje, formatearPesos(enPesosEnteros(tope.tope)))}</span>
              <span>{m.topeDeLa(categoria)}</span>
            </div>
            {nivel !== 'bien' && (
              <p
                className={`flex items-start gap-1.5 text-label font-semibold ${
                  nivel === 'cerca' ? 'text-atencion' : 'text-alerta'
                }`}
              >
                <Icono nombre="triangle-alert" tamano={16} className="mt-px flex-none" />
                {nivel === 'cerca'
                  ? m.cerca(categoria)
                  : nivel === 'pasado'
                    ? m.pasado(categoria)
                    : m.fuera}
              </p>
            )}
          </>
        ) : (
          <p className="flex flex-col items-start gap-0.5 text-label leading-normal text-text-2">
            <span>{m.elegiTuCategoria}</span>
            <Ir a={RUTA_DE_LA_FACTURACION} className={ENLACE}>
              {m.elegirLaCategoria}
              <Icono nombre="arrow-right" tamano={14} grosor={2} />
            </Ir>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-hairline-soft pt-2.5 text-label">
        <div className="flex min-h-8 items-center justify-between gap-2.5">
          <span className="text-text-2">{m.proxima}</span>
          <span className="font-semibold">{m.hasta(diaYMes(proxima, proxima))}</span>
        </div>
        {sinFacturar.length === 0 ? (
          <p className="min-h-8 py-1.5 leading-normal text-text-3">{m.todosConFactura(desde)}</p>
        ) : (
          <div className="flex min-h-8 items-center justify-between gap-2.5">
            <span className="text-text-2">{m.cobrosSinFacturar}</span>
            <button
              type="button"
              aria-label={m.cobrosSinFacturarEnPalabras(sinFacturar.length)}
              className={ENLACE}
              onClick={() => {
                setViendoLosCobros(true);
              }}
            >
              {m.cobros(sinFacturar.length)}
              <Icono nombre="arrow-right" tamano={14} grosor={2} />
            </button>
          </div>
        )}
      </div>
      <p className="text-meta leading-normal text-text-3">{m.pie}</p>

      <ConSalida valor={viendoLosCobros}>
        {() => (
          <HojaDeCobrosSinFacturar
            cobros={sinFacturar}
            desde={desde}
            hoy={hoy}
            alFacturar={setFacturando}
            alCerrar={() => {
              setViendoLosCobros(false);
            }}
          />
        )}
      </ConSalida>
      <ConSalida valor={facturando}>
        {(pagoId) => (
          <HojaDeFacturar
            pagoId={pagoId}
            alCerrar={() => {
              setFacturando(null);
            }}
            alEditarElCliente={alEditarElCliente}
          />
        )}
      </ConSalida>
    </section>
  );
}

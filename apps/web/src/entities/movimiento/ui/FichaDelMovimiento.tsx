import type { ReactNode } from 'react';

import { useMensajes } from '@/shared/idioma';
import {
  fechaLarga,
  formatearLaPlata,
  formatearPesos,
  rutaDelProyecto,
  TINTA,
  Ir,
} from '@/shared/lib';
import { Button, FilaDeAcciones, Hoja, Icono } from '@/shared/ui';

import { categoriaEnPantalla, esCategoriaDelCatalogo } from '../model/clases';
import {
  MOTIVO_DEL_BLOQUEO,
  montoDeLaLinea,
  type LineaDelTaller,
  type TesoroDeLaLinea,
} from '../model/libro';

function Dato({
  etiqueta,
  talCual = false,
  children,
}: {
  etiqueta: string;
  talCual?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-hairline-soft py-2">
      <dt className="text-label text-text-2">{etiqueta}</dt>
      <dd
        translate={talCual ? 'no' : undefined}
        className="text-right text-body font-medium tabular-nums"
      >
        {children}
      </dd>
    </div>
  );
}

function Lado({ tesoro, afuera }: { tesoro: TesoroDeLaLinea | null; afuera: string }) {
  if (tesoro === null) return afuera;
  const tinta = TINTA[tesoro.tinta];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={`size-2 flex-none rounded-pill ${tinta.fondo}`} />
      <span translate="no" className={tinta.texto}>
        {tesoro.nombre}
      </span>
    </span>
  );
}

export interface FichaDelMovimientoProps {
  linea: LineaDelTaller;
  hoy: string;
  alCerrar: () => void;
}

export function FichaDelMovimiento({ linea, hoy, alCerrar }: FichaDelMovimientoProps) {
  const m = useMensajes();
  const textos = m.movimiento.ficha;
  const motivo = linea.bloqueo === null ? null : MOTIVO_DEL_BLOQUEO[linea.bloqueo];

  return (
    <Hoja titulo={linea.etiqueta} alCerrar={alCerrar}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
        <div>
          <span translate="no" className="block text-money-lg font-semibold tabular-nums">
            {formatearLaPlata(montoDeLaLinea(linea))}
          </span>
          {linea.detalle !== '' && (
            <span translate="no" className="mt-0.5 block text-body text-text-2">
              {linea.detalle}
            </span>
          )}
        </div>

        <dl className="flex flex-col">
          <Dato etiqueta={textos.fecha} talCual>
            {fechaLarga(linea.fecha, hoy)}
          </Dato>
          <Dato etiqueta={textos.saleDe}>
            <Lado tesoro={linea.tesoroDesde} afuera={textos.deAfueraDelTaller} />
          </Dato>
          <Dato etiqueta={textos.entraA}>
            <Lado tesoro={linea.tesoroHacia} afuera={textos.seVaDelTaller} />
          </Dato>
          {linea.cotizacionDelPago !== null && (
            <Dato etiqueta={textos.dolar} talCual>
              {formatearPesos(linea.cotizacionDelPago)}
            </Dato>
          )}
          {linea.categoria !== '' && (
            <Dato etiqueta={textos.categoria} talCual={!esCategoriaDelCatalogo(linea.categoria)}>
              {categoriaEnPantalla(linea.categoria)}
            </Dato>
          )}
        </dl>

        {linea.yaEnLaApertura && (
          <div className="flex items-start gap-2.5 rounded-field bg-surface px-3.5 py-3">
            <span aria-hidden className="mt-0.5 flex-none text-text-2">
              <Icono nombre="history" tamano={18} />
            </span>
            <p className="text-label leading-relaxed text-text-2">{textos.yaEnLaApertura}</p>
          </div>
        )}

        {motivo !== null && (
          <div className="flex items-start gap-2.5 rounded-field bg-surface px-3.5 py-3">
            <span aria-hidden className="mt-0.5 flex-none text-text-2">
              <Icono nombre="circle-alert" tamano={18} />
            </span>
            <p className="text-label leading-relaxed text-text-2">{motivo}</p>
          </div>
        )}
      </div>

      <footer className="flex flex-none flex-col gap-2.5 border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
        <FilaDeAcciones>
          <Button variant="secundario" disabled>
            {textos.editar}
          </Button>
          <Button variant="secundario" disabled>
            {textos.borrar}
          </Button>
        </FilaDeAcciones>
        {linea.proyectoId !== null && (
          <Ir
            a={rutaDelProyecto(linea.proyectoId)}
            className="flex h-button items-center justify-center gap-2 rounded-pill bg-ink px-[18px] text-body font-medium text-paper"
          >
            {linea.proyectoTitulo === null
              ? textos.verElTrabajoSinTitulo
              : textos.verElTrabajo(linea.proyectoTitulo)}
          </Ir>
        )}
      </footer>
    </Hoja>
  );
}

import { plata, type Plata } from '@maun/domain';

import { mensajes, useMensajes } from '@/shared/idioma';
import { formatearLaPlata, formatearPesos, TINTA } from '@/shared/lib';
import { Icono } from '@/shared/ui';

import { categoriaEnPantalla, esCategoriaDelCatalogo } from '../model/clases';
import {
  cotizacionDeLaLinea,
  efectoEnSuMoneda,
  esUnCambioDeMoneda,
  montoDeLaLinea,
  montoQueEntra,
  type LineaDelTaller,
  type TesoroDeLaLinea,
} from '../model/libro';

function Lados({ desde, hacia }: { desde: TesoroDeLaLinea; hacia: TesoroDeLaLinea }) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1">
      <span translate="no" className={`font-semibold ${TINTA[desde.tinta].texto}`}>
        {desde.nombre}
      </span>
      <span aria-hidden className="text-text-3">
        →
      </span>
      <span translate="no" className={`font-semibold ${TINTA[hacia.tinta].texto}`}>
        {hacia.nombre}
      </span>
    </span>
  );
}

function conSigno(efecto: Plata): string {
  return `${efecto.importe > 0 ? '+' : '−'}${formatearLaPlata(plata(efecto.moneda, Math.abs(efecto.importe)))}`;
}

function importeDelCambio(linea: LineaDelTaller): string | null {
  const cotizacion = cotizacionDeLaLinea(linea);
  if (cotizacion === null) return null;
  return mensajes().movimiento.cambioEnElLibro(
    `−${formatearLaPlata(montoDeLaLinea(linea))}`,
    `+${formatearLaPlata(montoQueEntra(linea))}`,
    formatearPesos(cotizacion),
  );
}

export interface FilaDelLibroProps {
  linea: LineaDelTaller;
  tesoro: string;
  sinConfirmar: boolean;
  alAbrir: () => void;
}

export function FilaDelLibro({ linea, tesoro, sinConfirmar, alAbrir }: FilaDelLibroProps) {
  const m = useMensajes();
  const mueve = linea.sentido === 'mueve';
  const efecto = efectoEnSuMoneda(linea, tesoro);
  const neutro = (mueve && efecto.importe === 0) || linea.yaEnLaApertura;
  const principal = linea.tesoroPrincipal;
  const tinta = TINTA[principal.tinta];
  const delCambio = neutro && esUnCambioDeMoneda(linea) ? importeDelCambio(linea) : null;

  const importe =
    delCambio ?? (neutro ? formatearLaPlata(montoDeLaLinea(linea)) : conSigno(efecto));

  return (
    <button
      type="button"
      onClick={alAbrir}
      className="flex min-h-[56px] w-full items-center gap-3 py-2 text-left hover:bg-surface-3"
    >
      <span
        aria-hidden
        className={`flex size-7 flex-none items-center justify-center rounded-field ${
          mueve ? 'bg-surface text-text-2' : `${tinta.tinte} ${tinta.texto}`
        }`}
      >
        <Icono nombre={mueve ? 'arrow-left-right' : principal.icono} tamano={15} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          translate={linea.detalle === '' ? undefined : 'no'}
          className="block truncate text-body font-medium"
        >
          {linea.detalle === '' ? linea.etiqueta : linea.detalle}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 text-meta text-text-3">
          {mueve && linea.tesoroDesde !== null && linea.tesoroHacia !== null ? (
            <Lados desde={linea.tesoroDesde} hacia={linea.tesoroHacia} />
          ) : (
            <span>{linea.etiqueta}</span>
          )}
          {linea.categoria !== '' && !mueve && (
            <span translate={esCategoriaDelCatalogo(linea.categoria) ? undefined : 'no'}>
              {categoriaEnPantalla(linea.categoria)}
            </span>
          )}
          {linea.proyectoTitulo !== null && (
            <span
              translate="no"
              className="flex items-center gap-1 rounded-pill border border-hairline px-2 text-badge text-text-2"
            >
              <Icono nombre="folder-kanban" tamano={10} />
              {linea.proyectoTitulo}
            </span>
          )}
          {linea.cotizacionDelPago !== null && (
            <span>{m.movimiento.libro.conElDolarA(formatearPesos(linea.cotizacionDelPago))}</span>
          )}
          {linea.yaEnLaApertura && (
            <span className="text-badge font-semibold text-text-2">
              {m.movimiento.libro.yaEstabaEnTusSaldos}
            </span>
          )}
          {sinConfirmar && (
            <span className="flex items-center gap-1 text-badge font-semibold text-atencion">
              <Icono nombre="cloud-off" tamano={10} />
              {m.movimiento.libro.sinConfirmar}
            </span>
          )}
        </span>
      </span>

      <span
        translate={delCambio === null ? 'no' : undefined}
        className={`flex-none text-body font-semibold tabular-nums ${
          neutro ? 'text-text-2' : efecto.importe > 0 ? 'text-ink' : 'text-text-2'
        }`}
      >
        {importe}
      </span>
      <span aria-hidden className="flex-none text-text-3">
        <Icono nombre="chevron-right" tamano={16} />
      </span>
    </button>
  );
}

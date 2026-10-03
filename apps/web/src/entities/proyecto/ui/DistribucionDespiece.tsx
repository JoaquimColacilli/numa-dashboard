import type { TipoDeTesoro } from '@maun/domain';

import { mensajes, useMensajes } from '@/shared/idioma';
import { etiquetaActual, formatearPesos, TINTA, useAnchoDePantalla } from '@/shared/lib';
import { Lamina, TableroCortado, type PiezaDelTablero } from '@/shared/ui';

import type { Despiece, PiezaDelDespiece } from '../model/despiece';
import { porcentaje } from '../model/porcentaje';

type GrupoDeLaPieza = 'obligacion' | 'compromiso' | 'ahorro' | 'superavit';

const GRUPO_DE_LA_PIEZA: Readonly<Record<TipoDeTesoro, GrupoDeLaPieza>> = {
  obligacion: 'obligacion',
  compromiso: 'compromiso',
  'ahorro-fijo': 'ahorro',
  'ahorro-por-porcentaje': 'ahorro',
  superavit: 'superavit',
};

interface GrupoDelDespiece {
  grupo: GrupoDeLaPieza;
  piezas: PiezaDelDespiece[];
}

function porGrupo(piezas: readonly PiezaDelDespiece[]): GrupoDelDespiece[] {
  const grupos: GrupoDelDespiece[] = [];
  for (const pieza of piezas) {
    const grupo = GRUPO_DE_LA_PIEZA[pieza.tipoDeTesoro];
    const ultimo = grupos.at(-1);
    if (ultimo?.grupo === grupo) ultimo.piezas.push(pieza);
    else grupos.push({ grupo, piezas: [pieza] });
  }
  return grupos;
}

function nombreEnElTablero(pieza: PiezaDelDespiece): string {
  return pieza.tipo === 'resto' ? mensajes().proyecto.distribucion.resto : pieza.nombre;
}

function aQuien(pieza: PiezaDelDespiece): string | null {
  const idioma = etiquetaActual();
  const etiqueta = pieza.etiqueta.toLocaleLowerCase(idioma);
  const nombre = pieza.nombre.toLocaleLowerCase(idioma);
  return etiqueta === nombre || etiqueta.startsWith(`${nombre} `) ? null : pieza.nombre;
}

function detalleDe(pieza: PiezaDelDespiece): string {
  const textos = mensajes().proyecto.distribucion;
  const destino = aQuien(pieza);
  const monto = formatearPesos(pieza.monto);
  return destino === null
    ? textos.detalle(pieza.etiqueta, monto)
    : textos.detalleATesoro(pieza.etiqueta, destino, monto);
}

function RenglonDeLaPieza({ pieza, real }: { pieza: PiezaDelDespiece; real: boolean }) {
  const textos = useMensajes().proyecto.distribucion;
  const tinta = TINTA[pieza.tinta];
  const destino = aQuien(pieza);
  return (
    <li className="flex items-center gap-2.5 border-t border-hairline-soft py-2 text-label first:border-t-0">
      <span
        aria-hidden
        className={`size-3 flex-none rounded-[3px] ${real ? tinta.fondo : tinta.tinte}`}
      />
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
        <span className="font-medium">{pieza.etiqueta}</span>
        {destino !== null && (
          <span className={`text-meta font-semibold ${tinta.texto}`}>
            {textos.aTesoro(destino.toLocaleUpperCase(etiquetaActual()))}
          </span>
        )}
        {pieza.falta > 0 && (
          <span className="text-meta text-alerta">
            {textos.faltan(formatearPesos(pieza.falta))}
          </span>
        )}
        {pieza.cubierto && <span className="text-meta text-text-2">{textos.cubierto}</span>}
        {pieza.conSuSaldo && <span className="text-meta text-text-2">{textos.conSuSaldo}</span>}
        {pieza.llegaALaMeta && <span className="text-meta text-text-2">{textos.llegaALaMeta}</span>}
      </span>
      <span translate="no" className="flex-none text-right font-semibold">
        {formatearPesos(pieza.monto)}
      </span>
      <span translate="no" className="w-10 flex-none text-right text-meta text-text-3">
        {porcentaje(pieza.parte)}
      </span>
    </li>
  );
}

export interface DistribucionDespieceProps {
  despiece: Despiece;
  animar?: boolean;
  provisoria?: boolean;
}

export function DistribucionDespiece({
  despiece,
  animar = false,
  provisoria = false,
}: DistribucionDespieceProps) {
  const textos = useMensajes().proyecto.distribucion;
  const ancho = useAnchoDePantalla();
  const enProyeccion = despiece.modo === 'proyeccion';

  const piezas: PiezaDelTablero[] = despiece.piezas
    .filter((pieza) => pieza.monto > 0)
    .map((pieza) => ({
      id: pieza.id,
      tono: pieza.tinta,
      parte: pieza.parte,
      nombre: nombreEnElTablero(pieza),
      porcentaje: porcentaje(pieza.parte),
      detalle: detalleDe(pieza),
    }));

  return (
    <section
      aria-label={textos.titulo}
      className="flex flex-col gap-3 rounded-panel border border-hairline bg-paper p-1.5 tabular-nums"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 px-3.5 pt-3">
        <div>
          <h2 className="text-section font-semibold">{textos.titulo}</h2>
          <p className="mt-0.5 text-meta text-text-2">
            {textos.cobradosMenosGastos(
              formatearPesos(despiece.cobrado),
              formatearPesos(despiece.gastos),
            )}
          </p>
        </div>
        <div className="text-right">
          <span className="block text-meta text-text-2">{textos.ingreso}</span>
          <span
            translate="no"
            className={`block text-money-lg leading-tight font-semibold ${
              despiece.neta < 0 ? 'text-alerta' : enProyeccion ? 'text-text-2' : 'text-ink'
            }`}
          >
            {formatearPesos(despiece.neta)}
          </span>
        </div>
      </div>

      {despiece.neta <= 0 ? (
        <p className="rounded-lamina border border-dashed border-border px-4 py-5 text-center text-label leading-relaxed text-text-2">
          {despiece.cobrado === 0 ? textos.sinCobrar : textos.sinIngreso}
        </p>
      ) : (
        <>
          <Lamina className="h-[176px] md:h-[216px]">
            <TableroCortado
              piezas={piezas}
              formato={ancho === 'movil' ? 'medio' : 'amplio'}
              proyectado={enProyeccion}
              animar={animar}
            />
          </Lamina>
          <div className="flex flex-col gap-1 px-3.5 pb-1">
            {porGrupo(despiece.piezas).map((grupo, indice) => (
              <div
                key={`${grupo.grupo}-${String(indice)}`}
                role="group"
                aria-label={textos.grupos[grupo.grupo]}
              >
                <p aria-hidden className="pt-1.5 pb-0.5 text-meta font-semibold text-text-3">
                  {textos.grupos[grupo.grupo]}
                </p>
                <ul className="list-none">
                  {grupo.piezas.map((pieza) => (
                    <RenglonDeLaPieza
                      key={pieza.id}
                      pieza={pieza}
                      real={despiece.modo === 'real'}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {enProyeccion && (
        <p className="px-3.5 pb-3 text-meta leading-normal text-text-3">{textos.proyeccion}</p>
      )}

      {provisoria && (
        <p className="mx-2 mb-2 rounded-field bg-atencion-tint px-3 py-2 text-meta leading-normal text-atencion">
          {textos.provisoria}
        </p>
      )}
    </section>
  );
}

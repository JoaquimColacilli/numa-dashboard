import {
  UMBRAL_DE_COMPARACION,
  type ComoLlego,
  type DondeEstaHoy,
  type IndiceDePrecios,
  type LoQueTeDejaron,
  type PeriodoResuelto,
  type ResumenDeDias,
  type ResumenDelPeriodo,
} from '@maun/domain';
import { useId, type ReactNode } from 'react';

import { diasEnPartes } from '@/entities/entrega';
import { useMensajes } from '@/shared/idioma';
import {
  Ayuda,
  ColumnasChicas,
  Globo,
  Icono,
  MontoQueEntra,
  Puntitos,
  type Puntito,
} from '@/shared/ui';

import type { NumeroDeSeccion } from '../model/secciones';
import {
  mesConAnio,
  mesCortoConAnio,
  pesos,
  porcentaje,
  rangoDelAnterior,
  rangoEnElTexto,
} from '../model/textos';
import { Chico, Fuerte } from './piezas';

const PUNTO_DE_LA_ENTREGA: Readonly<Record<Exclude<ComoLlego, 'sin-fecha'>, Puntito>> = {
  'a-tiempo': 'lleno',
  tarde: 'hueco',
};

const PUNTO_DEL_PRESUPUESTO: Readonly<Record<DondeEstaHoy, Puntito>> = {
  trabajo: 'lleno',
  perdida: 'cruz',
  abierta: 'hueco',
};

function Cambio({ dejaron, resuelto }: { dejaron: LoQueTeDejaron; resuelto: PeriodoResuelto }) {
  const textos = useMensajes().paginaEstadisticas.resumen;
  const { cambio } = dejaron;
  const rango = rangoDelAnterior(resuelto);
  if (cambio.modo === 'sin-comparacion') return null;
  if (cambio.modo === 'sin-anterior') {
    return <p className="text-label">{textos.sinCobrarAntes(rango)}</p>;
  }
  if (cambio.modo === 'plata') {
    return (
      <div className="flex flex-col gap-0.5">
        <p className="text-label">
          {textos.teDejaron(rango, pesos(cambio.total), cambio.trabajos)}
        </p>
        {cambio.faltanCasos && (
          <p className="text-meta text-text-3">{textos.conCasosVas(UMBRAL_DE_COMPARACION)}</p>
        )}
      </div>
    );
  }
  const texto =
    cambio.sentido === 'igual'
      ? textos.igual(rango)
      : cambio.sentido === 'mas'
        ? textos.mas(porcentaje(cambio.porcentaje), rango)
        : textos.menos(porcentaje(cambio.porcentaje), rango);
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-label">
      {cambio.sentido !== 'igual' && (
        <span
          aria-hidden
          className="inline-flex size-4.5 flex-none items-center justify-center rounded-pill bg-ink/7"
        >
          <Icono
            nombre={cambio.sentido === 'mas' ? 'arrow-up' : 'arrow-down'}
            tamano={12}
            grosor={2.5}
          />
        </span>
      )}
      <span>{texto}</span>
      <span className="text-meta text-text-3">
        {dejaron.deflactado ? textos.contandoLaInflacion : textos.enPesosDeCadaMes}
      </span>
    </p>
  );
}

function CifraPrincipal({
  dejaron,
  resuelto,
  hoy,
  indice,
}: {
  dejaron: LoQueTeDejaron;
  resuelto: PeriodoResuelto;
  hoy: string;
  indice: IndiceDePrecios;
}) {
  const textos = useMensajes().paginaEstadisticas;
  const id = useId();
  const primera = dejaron.columnas.find((columna) => !columna.sinRegistro);
  const base = textos.resumen.base(dejaron.cobrados, dejaron.perdidos, dejaron.enDolares);
  const frase =
    dejaron.liquidaciones.length === 0
      ? resuelto.largo === 'todo'
        ? textos.dejaron.vacioDeTodo
        : textos.dejaron.vacio(rangoEnElTexto(resuelto, hoy))
      : dejaron.deCada100 === null
        ? textos.resumen.seComieron
        : textos.resumen.deCada100(Fuerte, pesos(10_000), pesos(dejaron.deCada100 * 100));

  return (
    <section
      aria-labelledby={id}
      className="@container flex min-w-0 flex-col gap-1.5 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id={id} className="text-label font-medium text-text-2">
          {textos.resumen.loQueTeDejaron}
        </h2>
        <Ayuda que={textos.queEs(textos.resumen.loQueTeDejaron)}>
          {dejaron.deflactado
            ? textos.ayudas.dejaron(mesConAnio(indice.hasta))
            : textos.ayudas.dejaronConElIndiceViejo(mesConAnio(indice.hasta))}
        </Ayuda>
      </div>
      <MontoQueEntra tamano="destacado" className="leading-tight font-semibold">
        {pesos(dejaron.total)}
      </MontoQueEntra>
      <Cambio dejaron={dejaron} resuelto={resuelto} />
      <div className="mt-1.5">
        <ColumnasChicas
          columnas={dejaron.columnas.map((columna) => ({
            clave: columna.clave,
            valor: columna.enPesosDeHoy,
            enPeriodo: columna.enElPeriodo,
            enCurso: columna.enCurso,
            sinRegistro: columna.sinRegistro,
          }))}
          primerRotulo={
            primera === undefined ? '' : mesCortoConAnio(primera.meses[0] ?? primera.clave)
          }
          rotuloDelPeriodo={resuelto.largo === 'todo' ? null : textos.resumen.elPeriodo}
        />
      </div>
      <p className="text-body leading-snug text-pretty">{frase}</p>
      {base !== '' && <p className="text-meta text-text-3">{base}</p>}
    </section>
  );
}

function ValorDeLaTarjeta({ children }: { children: ReactNode }) {
  return (
    <span className="text-[clamp(1.125rem,calc(100cqi/6.2),1.5rem)] leading-tight font-semibold whitespace-nowrap">
      {children}
    </span>
  );
}

function ValorDeLaEntrega({ demora }: { demora: ResumenDeDias }) {
  const textos = useMensajes().paginaEstadisticas.tarjetas;
  if (demora.modo === 'casos' && demora.valores.length > 1) {
    return (
      <ValorDeLaTarjeta>
        {textos.entrega.entre(
          Chico,
          diasEnPartes(Math.min(...demora.valores)).numero,
          diasEnPartes(Math.max(...demora.valores)).numero,
        )}
      </ValorDeLaTarjeta>
    );
  }
  const partes = diasEnPartes(
    demora.modo === 'mediana' ? demora.mediana : (demora.valores[0] ?? 0),
  );
  return (
    <ValorDeLaTarjeta>
      {textos.entrega.dias(Chico, partes.numero, partes.cantidad)}
    </ValorDeLaTarjeta>
  );
}

function Tarjeta({
  numero,
  etiqueta,
  valor,
  puntos = [],
  debajo,
  alIr,
}: {
  numero: NumeroDeSeccion;
  etiqueta: string;
  valor: ReactNode;
  puntos?: readonly Puntito[];
  debajo: string;
  alIr: (numero: NumeroDeSeccion) => void;
}) {
  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={() => {
          alIr(numero);
        }}
        className="@container flex size-full min-w-0 flex-col gap-1 rounded-panel border border-hairline bg-paper px-3.5 pt-3.5 pb-3.25 text-left"
      >
        <span className="flex w-full items-start justify-between gap-1.5">
          <span className="text-label leading-snug font-medium text-text-2">{etiqueta}</span>
          <Globo
            numero={numero}
            className="size-4.5! border! border-text-3! text-[10px]! text-text-2!"
          />
        </span>
        {valor}
        <Puntitos puntos={puntos} />
        <span className="text-meta leading-snug text-text-3">{debajo}</span>
      </button>
    </li>
  );
}

function LasCifras({
  resumen,
  alIr,
}: {
  resumen: ResumenDelPeriodo;
  alIr: (numero: NumeroDeSeccion) => void;
}) {
  const textos = useMensajes().paginaEstadisticas.tarjetas;
  const { gastaste, entrega, presupuestos, conformes } = resumen;
  const sinDato = <ValorDeLaTarjeta>{textos.sinDato}</ValorDeLaTarjeta>;
  const debajoDeLaEntrega =
    entrega === null
      ? textos.entrega.vacio
      : entrega.demora.modo === 'casos'
        ? textos.entrega.deAUna(entrega.demora.n)
        : entrega.aTiempo.n === 0
          ? textos.entrega.sinPromesas
          : entrega.aTiempo.porcentaje === null
            ? textos.entrega.aTiempo(entrega.aTiempo.k, entrega.aTiempo.n)
            : textos.entrega.aTiempoConPorcentaje(
                porcentaje(entrega.aTiempo.porcentaje),
                entrega.aTiempo.k,
                entrega.aTiempo.n,
              );

  return (
    <nav aria-label={textos.nombre} className="@container">
      <ul className="grid list-none grid-cols-2 gap-3 p-0 md:gap-4 @min-[40rem]:grid-cols-4">
        <Tarjeta
          numero={2}
          etiqueta={textos.gastaste.etiqueta}
          valor={
            gastaste === null ? (
              sinDato
            ) : (
              <MontoQueEntra className="leading-tight font-semibold">
                {pesos(gastaste)}
              </MontoQueEntra>
            )
          }
          debajo={gastaste === null ? textos.gastaste.vacio : textos.gastaste.debajo}
          alIr={alIr}
        />
        <Tarjeta
          numero={3}
          etiqueta={textos.entrega.etiqueta}
          valor={entrega === null ? sinDato : <ValorDeLaEntrega demora={entrega.demora} />}
          puntos={entrega?.puntos.flatMap((como) =>
            como === 'sin-fecha' ? [] : [PUNTO_DE_LA_ENTREGA[como]],
          )}
          debajo={debajoDeLaEntrega}
          alIr={alIr}
        />
        <Tarjeta
          numero={4}
          etiqueta={textos.aprobaron.etiqueta}
          valor={
            presupuestos === null ? (
              sinDato
            ) : presupuestos.aprobadas.porcentaje === null ? (
              <ValorDeLaTarjeta>
                {textos.kDeN(Chico, presupuestos.aprobadas.k, presupuestos.aprobadas.n)}
              </ValorDeLaTarjeta>
            ) : (
              <ValorDeLaTarjeta>
                {textos.porcentaje(porcentaje(presupuestos.aprobadas.porcentaje))}
              </ValorDeLaTarjeta>
            )
          }
          puntos={presupuestos?.puntos.map((donde) => PUNTO_DEL_PRESUPUESTO[donde])}
          debajo={
            presupuestos === null
              ? textos.aprobaron.vacio
              : presupuestos.aprobadas.porcentaje === null
                ? textos.aprobaron.debajo(presupuestos.esperan)
                : textos.aprobaron.debajoConCuenta(
                    presupuestos.aprobadas.k,
                    presupuestos.aprobadas.n,
                    presupuestos.esperan,
                  )
          }
          alIr={alIr}
        />
        <Tarjeta
          numero={5}
          etiqueta={textos.conformes.etiqueta}
          valor={
            conformes === null ? (
              sinDato
            ) : conformes.porcentaje === null ? (
              <ValorDeLaTarjeta>{textos.kDeN(Chico, conformes.k, conformes.n)}</ValorDeLaTarjeta>
            ) : (
              <ValorDeLaTarjeta>
                {textos.porcentaje(porcentaje(conformes.porcentaje))}
              </ValorDeLaTarjeta>
            )
          }
          puntos={
            conformes === null || conformes.porcentaje !== null
              ? []
              : [
                  ...Array.from({ length: conformes.k }, (): Puntito => 'lleno'),
                  ...Array.from({ length: conformes.n - conformes.k }, (): Puntito => 'hueco'),
                ]
          }
          debajo={
            conformes === null
              ? textos.conformes.vacio
              : conformes.porcentaje === null
                ? textos.conformes.debajo
                : textos.conformes.debajoConCuenta(conformes.k, conformes.n)
          }
          alIr={alIr}
        />
      </ul>
    </nav>
  );
}

export interface ResumenProps {
  resumen: ResumenDelPeriodo;
  resuelto: PeriodoResuelto;
  hoy: string;
  indice: IndiceDePrecios;
  alIr: (numero: NumeroDeSeccion) => void;
}

export function Resumen({ resumen, resuelto, hoy, indice, alIr }: ResumenProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 md:gap-4">
      <CifraPrincipal dejaron={resumen.dejaron} resuelto={resuelto} hoy={hoy} indice={indice} />
      <LasCifras resumen={resumen} alIr={alIr} />
    </div>
  );
}

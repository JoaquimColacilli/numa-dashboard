import {
  centavos,
  LARGO_MAXIMO_DEL_RENGLON,
  lugarLibreDelReparto,
  puntosBasicos,
  sumaDelReparto,
  tipoDelPaso,
  ULTIMO_DIA_DE_PAGO,
  type BaseDeLaObligacion,
  type LiquidacionPorLaFila,
  type ModoDePaso,
  type PasoDeLaFila,
  type PasoDelMes,
  type TipoDelPaso,
} from '@maun/domain';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  AyudaDeLaBase,
  AyudaDeLaFila,
  AyudaDeLaMeta,
  AyudaDeLosInsumos,
  AyudaDeQueEs,
  AyudaDelGrupo,
  AyudaDelIngreso,
  AyudaDelLugar,
  AyudaDelModo,
  AyudaDelMonto,
  AyudaDelReparto,
  AyudaDelSuperavit,
  BASE_EN_PALABRAS,
  ETIQUETA_DE_LA_BASE,
  EscalaDelReparto,
  Globo,
  LineaDePuntos,
  lugaresParaSumar,
  modoEnPalabras,
  modosDelPaso,
  NivelDelMes,
  NOMBRE_DEL_GRUPO,
  NOMBRE_DEL_TIPO,
  puedeSerSuperavit,
  tituloDelModo,
} from '@/entities/fila';
import type { PagoParaRegistrar } from '@/entities/movimiento';
import { fraseDeLosInsumos, type InsumosDeLosTrabajos } from '@/entities/proyecto';
import { ChipDelTesoro, type TesoroDelTaller } from '@/entities/tesoro';
import {
  formatearPesos,
  formatearPorcentaje,
  Ir,
  nombreDelMes,
  parsearPorcentaje,
  rutaDelProyecto,
  TINTA,
} from '@/shared/lib';
import { Ayuda, Button, Icono, Interruptor, MoneyInput } from '@/shared/ui';

import { editarLaFila, sePuedeEditar } from '../model/acciones';
import { cortarLaJunta } from '../model/borrador';
import {
  conBase,
  conHastaLaMeta,
  conModo,
  conPorcentaje,
  conPorcentajeDeLaObligacion,
  conRenglones,
  conTipo,
  conTope,
  moverLaObligacion,
  moverUnLugar,
  pasoDe,
  puedeMoverse,
  puedeMoverseLaObligacion,
  puedeSalirDeLaFila,
  renglonNuevo,
  sacar,
  sePuedeSumarUnRenglon,
  sumarEnElLugar,
  tiposPosibles,
} from '../model/edicion';
import {
  FICHA_DE_LOS_INSUMOS,
  FICHA_DEL_DIEZMO,
  FICHA_DEL_REPARTO,
  FICHA_DEL_RESTO,
  fichaDeLaObligacion,
  fichaDeLaParte,
  fichaDelEstante,
  fichaDelPaso,
  fichaEnElLugar,
  queFichaEs,
} from '../model/fichas';
import { mesYAnio, porciento, problemasDe, textoDelProblema } from '../model/textos';
import {
  escalaDe,
  lugarEnLaFila,
  numeroEnLaFila,
  tesoroDe,
  type PruebaEnPantalla,
  type VistaDeLaFila,
} from '../model/vista';
import { BotonEditarTesoro } from './BotonEditarTesoro';
import { Probador } from './Probador';
import { ProblemasDeLaSeccion, Seccion, Segmentado } from './Seccion';

export interface PanelDeDetalleProps {
  vista: VistaDeLaFila;
  elegido: string | null;
  prueba: PruebaEnPantalla;
  resultado: LiquidacionPorLaFila | null;
  alElegir: (id: string | null) => void;
  alProbar: (prueba: PruebaEnPantalla) => void;
  alCubrir: (paso: PasoDelMes) => void;
  alEditarTesoro: (tesoro: string) => void;
  alRegistrarElPago?: (pago: PagoParaRegistrar) => void;
  insumos?: InsumosDeLosTrabajos;
  arriba?: ReactNode;
  enHoja?: boolean;
  conFlechas?: boolean;
}

const SOBRANTE_DE_EJEMPLO = centavos(47_000_000);

const SIN_INSUMOS: InsumosDeLosTrabajos = { total: centavos(0), trabajos: [] };

const ContextoDelFoco = createContext<() => void>(() => undefined);

function textosDe(
  vista: VistaDeLaFila,
  tesoro: string | null,
  lugares: Parameters<typeof problemasDe>[2],
): string[] {
  return problemasDe(vista.problemas, tesoro, lugares).map((problema) =>
    textoDelProblema(
      problema.problema,
      problema.tesoro === null ? undefined : tesoroDe(vista, problema.tesoro).nombre,
    ),
  );
}

function BotonCerrar({ alCerrar }: { alCerrar: () => void }) {
  return (
    <button
      type="button"
      aria-label="Cerrar el detalle"
      onClick={alCerrar}
      className="-mt-1 -mr-2 flex size-11 flex-none items-center justify-center rounded-field text-text-2 hover:bg-surface"
    >
      <Icono nombre="x" tamano={20} />
    </button>
  );
}

function Cabecera({
  tesoro,
  sobre,
  vista,
  alCerrar,
  alEditarTesoro,
}: {
  tesoro: TesoroDelTaller;
  sobre: string;
  vista: VistaDeLaFila;
  alCerrar: () => void;
  alEditarTesoro: (tesoro: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 pb-4">
      <ChipDelTesoro tesoro={tesoro} tamano="grande" />
      <div className="min-w-0 flex-1">
        <span className="rotulo-del-plano block text-badge font-semibold text-text-2 uppercase">
          {sobre}
        </span>
        <h2
          tabIndex={-1}
          data-foco-del-panel
          className={`truncate text-h2 leading-tight font-semibold ${TINTA[tesoro.tinta].texto}`}
        >
          {tesoro.nombre}
        </h2>
        {tesoro.descripcion !== '' && (
          <p className="truncate text-label text-text-2">{tesoro.descripcion}</p>
        )}
      </div>
      {vista.sincronizados && (
        <BotonEditarTesoro tesoro={tesoro} alEditar={alEditarTesoro} className="-mt-1" />
      )}
      <BotonCerrar alCerrar={alCerrar} />
    </div>
  );
}

function CabeceraNeutra({
  icono,
  sobre,
  titulo,
  bajada,
  alCerrar,
}: {
  icono: 'split' | 'hand-coins';
  sobre: string;
  titulo: string;
  bajada: string;
  alCerrar: () => void;
}) {
  return (
    <div className="flex items-start gap-3 pb-4">
      <span
        aria-hidden
        className="flex size-10 flex-none items-center justify-center rounded-field bg-surface-2 text-ink"
      >
        <Icono nombre={icono} tamano={20} />
      </span>
      <div className="min-w-0 flex-1">
        <span className="rotulo-del-plano block text-badge font-semibold text-text-2 uppercase">
          {sobre}
        </span>
        <h2 tabIndex={-1} data-foco-del-panel className="text-h2 leading-tight font-semibold">
          {titulo}
        </h2>
        <p className="text-label text-text-2">{bajada}</p>
      </div>
      <BotonCerrar alCerrar={alCerrar} />
    </div>
  );
}

function BotonesDeLugar({
  puedeSubir,
  puedeBajar,
  alMover,
}: {
  puedeSubir: boolean;
  puedeBajar: boolean;
  alMover: (hacia: -1 | 1) => void;
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant="herramienta"
        size="herramienta"
        disabled={!puedeSubir}
        onClick={() => {
          alMover(-1);
        }}
        className="px-3"
      >
        <Icono nombre="arrow-up" tamano={16} />
        Subir
      </Button>
      <Button
        variant="herramienta"
        size="herramienta"
        disabled={!puedeBajar}
        onClick={() => {
          alMover(1);
        }}
        className="px-3"
      >
        <Icono nombre="arrow-down" tamano={16} />
        Bajar
      </Button>
    </div>
  );
}

type Mover = (fila: VistaDeLaFila['fila'], tesoro: string, hacia: -1 | 1) => VistaDeLaFila['fila'];

type Puede = (fila: VistaDeLaFila['fila'], tesoro: string, hacia: -1 | 1) => boolean;

function SeccionDelLugar({
  vista,
  tesoro,
  mover,
  puede,
  debajo,
}: {
  vista: VistaDeLaFila;
  tesoro: string;
  mover: Mover;
  puede: Puede;
  debajo?: ReactNode;
}) {
  const botones = useRef<HTMLDivElement>(null);
  const alMover = (hacia: -1 | 1) => {
    const despues = mover(vista.fila, tesoro, hacia);
    editarLaFila(vista, (fila) => mover(fila, tesoro, hacia));
    if (puede(despues, tesoro, hacia)) return;
    requestAnimationFrame(() => {
      const lista = Array.from(
        botones.current?.querySelectorAll<HTMLButtonElement>('button') ?? [],
      );
      lista.at(hacia === -1 ? 1 : 0)?.focus();
    });
  };
  return (
    <Seccion titulo="Lugar en la fila" ayuda={<AyudaDelLugar />}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-body">
          <span className="font-semibold tabular-nums">{numeroEnLaFila(vista.fila, tesoro)}</span>{' '}
          de {vista.fila.obligaciones.length + vista.fila.pasos.length}
        </span>
        {vista.armando && (
          <div ref={botones}>
            <BotonesDeLugar
              puedeSubir={puede(vista.fila, tesoro, -1)}
              puedeBajar={puede(vista.fila, tesoro, 1)}
              alMover={alMover}
            />
          </div>
        )}
      </div>
      {debajo}
    </Seccion>
  );
}

function SacarDeLaFila({ texto, alSacar }: { texto: string; alSacar: () => void }) {
  return (
    <div className="border-t border-hairline pt-4">
      <Button variant="terciario" className="-ml-3 min-h-tap" onClick={alSacar}>
        {texto}
      </Button>
      <p className="mt-0.5 text-meta text-text-3">
        Vuelve al estante con lo que tiene. Nada se borra.
      </p>
    </div>
  );
}

function CampoDelPorcentaje({
  etiqueta,
  porcentaje,
  alCambiar,
}: {
  etiqueta: string;
  porcentaje: number;
  alCambiar: (bp: number) => void;
}) {
  const [texto, setTexto] = useState(formatearPorcentaje(porcentaje));
  const [visto, setVisto] = useState(porcentaje);
  if (visto !== porcentaje) {
    setVisto(porcentaje);
    if (parsearPorcentaje(texto, 10_000) !== porcentaje) setTexto(formatearPorcentaje(porcentaje));
  }
  return (
    <span className="relative flex-none">
      <input
        aria-label={etiqueta}
        inputMode="decimal"
        autoComplete="off"
        value={texto}
        onChange={(evento) => {
          const escrito = evento.target.value;
          setTexto(escrito);
          const bp = parsearPorcentaje(escrito, 10_000);
          if (bp === undefined || bp <= 0) return;
          alCambiar(bp);
        }}
        onBlur={() => {
          if (parsearPorcentaje(texto, 10_000) !== porcentaje) {
            setTexto(formatearPorcentaje(porcentaje));
          }
        }}
        className="h-11 w-22 rounded-field border border-border bg-paper pr-7 pl-3 text-right text-body text-ink tabular-nums"
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-body text-text-2">
        %
      </span>
    </span>
  );
}

function BotonDePago({ etiqueta, alTocar }: { etiqueta?: string; alTocar: () => void }) {
  return (
    <Button
      variant="secundario"
      size="chico"
      className="min-h-tap flex-none"
      aria-label={etiqueta}
      onClick={alTocar}
    >
      <Icono nombre="receipt" tamano={16} />
      Registrar el pago
    </Button>
  );
}

function PanelDeLaObligacion({
  vista,
  tesoroId,
  props,
}: {
  vista: VistaDeLaFila;
  tesoroId: string;
  props: PanelDeDetalleProps;
}) {
  const obligacion = vista.fila.obligaciones.find((una) => una.tesoro === tesoroId);
  const moverElFoco = useContext(ContextoDelFoco);
  if (obligacion === undefined) return null;
  const tesoro = tesoroDe(vista, tesoroId);
  const esDiezmo = tesoroId === vista.sistema.diezmo;
  const delMes = vista.delMes.obligaciones.find((una) => una.tesoro === tesoroId);
  const aPagar = delMes?.aPagar ?? 0;
  const mes = nombreDelMes(vista.mes).toLowerCase();
  const cerrar = () => {
    props.alElegir(null);
  };
  return (
    <>
      {props.enHoja !== true && (
        <Cabecera
          tesoro={tesoro}
          sobre={`Obligación · ${lugarEnLaFila(vista.fila, tesoroId)}`}
          vista={vista}
          alCerrar={cerrar}
          alEditarTesoro={props.alEditarTesoro}
        />
      )}
      <ProblemasDeLaSeccion textos={textosDe(vista, tesoroId, ['tesoro'])} />
      <Seccion titulo="Porcentaje" ayuda={<AyudaDelGrupo grupo="obligaciones" />}>
        {vista.armando ? (
          <CampoDelPorcentaje
            etiqueta={`Porcentaje de ${tesoro.nombre}`}
            porcentaje={obligacion.porcentaje}
            alCambiar={(bp) => {
              editarLaFila(
                vista,
                (fila) => conPorcentajeDeLaObligacion(fila, tesoroId, puntosBasicos(bp)),
                `obligacion:${tesoroId}`,
              );
            }}
          />
        ) : (
          <p className="text-money-lg font-semibold tabular-nums">
            {porciento(obligacion.porcentaje)}
          </p>
        )}
        <ProblemasDeLaSeccion textos={textosDe(vista, tesoroId, ['obligacion'])} />
      </Seccion>
      <Seccion titulo="Sobre qué se calcula" ayuda={<AyudaDeLaBase />}>
        {vista.armando ? (
          <Segmentado<BaseDeLaObligacion>
            etiqueta={`Sobre qué se calcula ${tesoro.nombre}`}
            opciones={[
              { id: 'cobrado', etiqueta: ETIQUETA_DE_LA_BASE.cobrado },
              { id: 'ingreso', etiqueta: ETIQUETA_DE_LA_BASE.ingreso },
            ]}
            elegido={obligacion.base}
            alElegir={(base) => {
              editarLaFila(vista, (fila) => conBase(fila, tesoroId, base));
            }}
          />
        ) : (
          <p className="text-body text-ink first-letter:uppercase">
            {BASE_EN_PALABRAS[obligacion.base]}
          </p>
        )}
      </Seccion>
      <Seccion titulo={`En ${mes}`}>
        <LineaDePuntos
          className="text-label"
          izquierda="Apartado"
          derecha={<span className="font-semibold">{formatearPesos(delMes?.apartado ?? 0)}</span>}
        />
      </Seccion>
      <Seccion titulo="A pagar">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-money-lg font-semibold tabular-nums">{formatearPesos(aPagar)}</p>
          {aPagar > 0 && vista.sincronizados && props.alRegistrarElPago !== undefined && (
            <BotonDePago
              alTocar={() => {
                props.alRegistrarElPago?.({
                  tesoro: { id: tesoro.id, clave: tesoro.clave },
                  monto: centavos(aPagar),
                  categoria: null,
                });
              }}
            />
          )}
        </div>
      </Seccion>
      <SeccionDelLugar
        vista={vista}
        tesoro={tesoroId}
        mover={moverLaObligacion}
        puede={puedeMoverseLaObligacion}
        debajo={
          esDiezmo ? (
            <p className="flex items-center gap-1.5 text-meta text-text-3">
              <Icono nombre="lock" tamano={13} />
              El diezmo no se puede sacar de la fila: su porcentaje y su lugar sí se cambian.
            </p>
          ) : undefined
        }
      />
      {vista.armando && puedeSalirDeLaFila(tesoroId, vista.sistema.diezmo) && (
        <SacarDeLaFila
          texto="Sacar de las obligaciones"
          alSacar={() => {
            moverElFoco();
            editarLaFila(vista, (fila) => sacar(fila, tesoroId));
            props.alElegir(fichaDelEstante(tesoroId));
          }}
        />
      )}
    </>
  );
}

function SelectorDelDia({
  nombre,
  dia,
  alCambiar,
}: {
  nombre: string;
  dia: number | null;
  alCambiar: (dia: number | null) => void;
}) {
  return (
    <label className="flex min-w-0 items-center gap-2 text-label text-text-2">
      Vence el
      <select
        aria-label={`Día de pago de ${nombre === '' ? 'este renglón' : nombre}`}
        value={dia === null ? '' : String(dia)}
        onChange={(evento) => {
          const valor = evento.target.value;
          alCambiar(valor === '' ? null : Number(valor));
        }}
        className="h-11 min-w-0 rounded-field border border-border bg-paper px-2 text-body text-ink"
      >
        <option value="">sin día</option>
        {Array.from({ length: ULTIMO_DIA_DE_PAGO }, (_, indice) => indice + 1).map((uno) => (
          <option key={uno} value={String(uno)}>
            {uno}
          </option>
        ))}
      </select>
    </label>
  );
}

function RenglonesDelPaso({ vista, paso }: { vista: VistaDeLaFila; paso: PasoDeLaFila }) {
  const [recienSumado, setRecienSumado] = useState<number | null>(null);
  const nombre = tesoroDe(vista, paso.tesoro).nombre;
  const delMes = vista.delMes.pasos.find((candidato) => candidato.tesoro === paso.tesoro);
  const pagados = new Map(
    (delMes?.vencimientos ?? []).map((vencimiento) => [vencimiento.indice, vencimiento.pagado]),
  );
  const cambiarRenglon = (
    indice: number,
    cambio: { nombre?: string; monto?: number; dia?: number | null },
  ) => {
    const campo =
      cambio.nombre !== undefined ? 'nombre' : cambio.monto !== undefined ? 'monto' : 'dia';
    editarLaFila(
      vista,
      (fila) => {
        const actual = pasoDe(fila, paso.tesoro);
        if (actual === undefined) return fila;
        const renglones = actual.renglones.map((renglon, i) =>
          i === indice
            ? {
                ...renglon,
                nombre: cambio.nombre ?? renglon.nombre,
                monto: cambio.monto === undefined ? renglon.monto : centavos(cambio.monto),
                dia: cambio.dia === undefined ? renglon.dia : cambio.dia,
              }
            : renglon,
        );
        return conRenglones(fila, paso.tesoro, renglones);
      },
      campo === 'dia' ? null : `renglon:${paso.tesoro}:${String(indice)}:${campo}`,
    );
  };

  return (
    <Seccion
      titulo="Renglones"
      ayuda={
        <Ayuda que="Qué son los renglones">
          Cada gasto que se paga todos los meses. El monto del compromiso es la suma: cuando cambia
          un renglón, cambia el monto desde el próximo cobro.
        </Ayuda>
      }
    >
      <ul className="flex flex-col gap-2">
        {paso.renglones.map((renglon, indice) =>
          vista.armando ? (
            <li
              key={`${paso.tesoro}-${String(indice)}`}
              className="flex flex-col gap-2 rounded-field border border-hairline p-2"
            >
              <div className="flex items-center gap-2">
                <input
                  aria-label={`Renglón ${String(indice + 1)} de ${nombre}`}
                  value={renglon.nombre}
                  maxLength={LARGO_MAXIMO_DEL_RENGLON}
                  autoFocus={recienSumado === indice}
                  onChange={(evento) => {
                    cambiarRenglon(indice, { nombre: evento.target.value });
                  }}
                  className="h-11 min-w-0 flex-1 rounded-field border border-border bg-paper px-3 text-body text-ink"
                />
                <button
                  type="button"
                  aria-label={`Sacar el renglón ${renglon.nombre === '' ? String(indice + 1) : renglon.nombre}`}
                  onClick={() => {
                    editarLaFila(vista, (fila) => {
                      const actual = pasoDe(fila, paso.tesoro);
                      if (actual === undefined) return fila;
                      return conRenglones(
                        fila,
                        paso.tesoro,
                        actual.renglones.filter((_, i) => i !== indice),
                      );
                    });
                  }}
                  className="flex size-11 flex-none items-center justify-center rounded-field text-text-2 hover:bg-surface hover:text-ink"
                >
                  <Icono nombre="minus" tamano={18} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <MoneyInput
                  aria-label={`Monto de ${renglon.nombre === '' ? `el renglón ${String(indice + 1)}` : renglon.nombre}`}
                  placeholder="0"
                  value={renglon.monto === 0 ? null : renglon.monto}
                  onChange={(monto) => {
                    cambiarRenglon(indice, { monto: monto ?? 0 });
                  }}
                  className="h-11 w-32 min-w-0 flex-1 rounded-field border border-border bg-paper px-3 text-right text-body text-ink"
                />
                <SelectorDelDia
                  nombre={renglon.nombre}
                  dia={renglon.dia}
                  alCambiar={(dia) => {
                    cambiarRenglon(indice, { dia });
                  }}
                />
              </div>
            </li>
          ) : (
            <li key={`${paso.tesoro}-${String(indice)}`} className="text-body">
              <LineaDePuntos
                izquierda={
                  <span>
                    {renglon.nombre}
                    {renglon.dia !== null && (
                      <span className="text-text-3">
                        {' '}
                        · vence el {renglon.dia}
                        {pagados.get(indice) === true && ' ✓'}
                      </span>
                    )}
                  </span>
                }
                derecha={formatearPesos(renglon.monto)}
              />
            </li>
          ),
        )}
      </ul>
      {vista.armando && sePuedeSumarUnRenglon(paso) && (
        <button
          type="button"
          onClick={() => {
            setRecienSumado(paso.renglones.length);
            editarLaFila(vista, (fila) => {
              const actual = pasoDe(fila, paso.tesoro);
              if (actual === undefined) return fila;
              return conRenglones(fila, paso.tesoro, [...actual.renglones, renglonNuevo()]);
            });
          }}
          className="flex min-h-tap items-center gap-2 self-start rounded-pill px-1 text-label font-medium text-ink underline underline-offset-3"
        >
          <Icono nombre="plus" tamano={16} />
          Sumar un renglón
        </button>
      )}
      <ProblemasDeLaSeccion textos={textosDe(vista, paso.tesoro, ['renglones'])} />
      <div className="flex items-baseline justify-between border-t border-ink pt-2 text-body">
        <span className="text-label text-text-2">Monto, la suma</span>
        <span className="font-semibold tabular-nums">{formatearPesos(paso.tope)}</span>
      </div>
    </Seccion>
  );
}

function rigeDesde(vista: VistaDeLaFila, paso: PasoDeLaFila): string {
  const antes = pasoDe(vista.base, paso.tesoro);
  if (paso.desde === null || antes === undefined || antes.tope !== paso.tope) {
    return 'Rige desde el próximo cobro';
  }
  return `Rige desde ${mesYAnio(paso.desde, nombreDelMes(paso.desde))}`;
}

function MontoDelPaso({ vista, paso }: { vista: VistaDeLaFila; paso: PasoDeLaFila }) {
  return (
    <Seccion titulo="Monto" ayuda={<AyudaDelMonto monto={paso.tope} />}>
      {vista.armando ? (
        <MoneyInput
          aria-label={`Monto de ${tesoroDe(vista, paso.tesoro).nombre}`}
          placeholder="$ 0"
          value={paso.tope}
          onChange={(monto) => {
            editarLaFila(
              vista,
              (fila) => conTope(fila, paso.tesoro, centavos(monto ?? 0)),
              `tope:${paso.tesoro}`,
            );
          }}
          className="h-field w-full rounded-field border border-border bg-paper px-3.5 text-body-lg text-ink"
        />
      ) : (
        <p className="text-money-lg font-semibold tabular-nums">{formatearPesos(paso.tope)}</p>
      )}
      <ProblemasDeLaSeccion textos={textosDe(vista, paso.tesoro, ['tope'])} />
      <p className="text-meta text-text-3">{rigeDesde(vista, paso)}</p>
    </Seccion>
  );
}

function conMayuscula(texto: string): string {
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}`;
}

function ComoSeLlena({
  vista,
  paso,
  tesoro,
  tipo,
}: {
  vista: VistaDeLaFila;
  paso: PasoDeLaFila;
  tesoro: TesoroDelTaller;
  tipo: TipoDelPaso;
}) {
  const modos = modosDelPaso(paso.clase, tesoro.clave);
  return (
    <Seccion titulo={tituloDelModo(tipo)} ayuda={<AyudaDelModo tipo={tipo} />}>
      {vista.armando && modos.length > 1 ? (
        <Segmentado<ModoDePaso>
          etiqueta={`${tituloDelModo(tipo)} ${tesoro.nombre}`}
          opciones={modos}
          elegido={paso.modo}
          alElegir={(modo) => {
            editarLaFila(vista, (fila) => conModo(fila, paso.tesoro, modo));
          }}
        />
      ) : (
        <p className="text-body text-ink">{conMayuscula(modoEnPalabras(paso.modo, tipo))}</p>
      )}
      {paso.clase === 'sueldo' && (
        <p className="text-meta text-text-3">
          El sueldo del Hogar va siempre por mes: el Hogar gasta su saldo todo el mes.
        </p>
      )}
      <ProblemasDeLaSeccion textos={textosDe(vista, paso.tesoro, ['modo'])} />
    </Seccion>
  );
}

function HastaLaMeta({
  vista,
  tesoro,
  hastaLaMeta,
  meta,
}: {
  vista: VistaDeLaFila;
  tesoro: TesoroDelTaller;
  hastaLaMeta: boolean;
  meta: { meta: number; saldo: number; falta: number; llego: boolean } | null;
}) {
  return (
    <Seccion titulo="Hasta la meta" ayuda={<AyudaDeLaMeta />}>
      {vista.armando ? (
        <Interruptor
          activo={hastaLaMeta}
          alCambiar={(activo) => {
            editarLaFila(vista, (fila) => conHastaLaMeta(fila, tesoro.id, activo));
          }}
          className="min-h-tap rounded-pill text-body"
        >
          Hasta la meta
        </Interruptor>
      ) : (
        <p className="text-body text-ink">
          {hastaLaMeta ? 'Junta hasta llegar a su meta.' : 'Junta sin fin.'}
        </p>
      )}
      {meta !== null && (
        <LineaDePuntos
          className="text-label text-text-2"
          izquierda={meta.llego ? 'Llegó a su meta' : `Le faltan ${formatearPesos(meta.falta)}`}
          derecha={
            <span className="font-semibold text-ink">
              {formatearPesos(meta.saldo)} de {formatearPesos(meta.meta)}
            </span>
          }
        />
      )}
      <ProblemasDeLaSeccion textos={textosDe(vista, tesoro.id, ['meta'])} />
    </Seccion>
  );
}

function ElMesDelPaso({
  vista,
  paso,
  tesoro,
  delMes,
  props,
}: {
  vista: VistaDeLaFila;
  paso: PasoDeLaFila;
  tesoro: TesoroDelTaller;
  delMes: PasoDelMes | undefined;
  props: PanelDeDetalleProps;
}) {
  const mes = nombreDelMes(vista.mes).toLowerCase();
  const sinTope = paso.tope <= 0;
  if (paso.modo === 'trabajo') {
    return (
      <Seccion titulo={`En ${mes}`}>
        <LineaDePuntos
          className="text-label"
          izquierda="Recibió"
          derecha={<span className="font-semibold">{formatearPesos(delMes?.recibido ?? 0)}</span>}
        />
        <p className="text-meta text-text-3">
          Recibe {formatearPesos(paso.tope)} en cada cobro, sin mirar el mes.
        </p>
      </Seccion>
    );
  }
  const lleva = delMes?.lleva ?? 0;
  const falta = delMes?.falta ?? paso.tope;
  const enSaldo = paso.modo === 'saldo';
  return (
    <Seccion titulo={enSaldo ? 'Lo apartado' : `En ${mes}`}>
      <NivelDelMes
        tinta={tesoro.tinta}
        lleva={lleva}
        tope={paso.tope}
        etiqueta={enSaldo ? `${tesoro.nombre}, lo apartado` : `${tesoro.nombre} en ${mes}`}
        texto={
          sinTope ? 'Sin monto todavía' : `${formatearPesos(lleva)} de ${formatearPesos(paso.tope)}`
        }
      />
      <div className="flex items-baseline justify-between gap-3 text-label">
        <span className="text-text-2 tabular-nums">
          {formatearPesos(lleva)} de {formatearPesos(paso.tope)}
        </span>
        {sinTope ? (
          <span className="font-medium text-text-3">Poné el monto</span>
        ) : (
          <span className="font-semibold tabular-nums">
            {falta <= 0 ? 'Completo' : `Faltan ${formatearPesos(falta)}`}
          </span>
        )}
      </div>
      {falta > 0 && paso.clase === 'fijos' && delMes !== undefined && vista.sincronizados && (
        <Button
          variant="secundario"
          size="chico"
          className="min-h-tap self-start"
          onClick={() => {
            props.alCubrir(delMes);
          }}
        >
          <Icono nombre="arrow-left-right" tamano={16} />
          Cubrir desde otro tesoro
        </Button>
      )}
    </Seccion>
  );
}

function APagarDelCompromiso({
  vista,
  paso,
  tesoro,
  delMes,
  props,
}: {
  vista: VistaDeLaFila;
  paso: PasoDeLaFila;
  tesoro: TesoroDelTaller;
  delMes: PasoDelMes;
  props: PanelDeDetalleProps;
}) {
  const pagados = new Map(delMes.vencimientos.map((uno) => [uno.indice, uno.pagado]));
  const puedePagar = vista.sincronizados && props.alRegistrarElPago !== undefined;
  return (
    <Seccion titulo="A pagar">
      <p className="text-money-lg font-semibold tabular-nums">
        {formatearPesos(delMes.aPagar ?? 0)}
      </p>
      <ul className="flex flex-col divide-y divide-hairline-soft">
        {paso.renglones.map((renglon, indice) => {
          const pagado = pagados.get(indice) === true;
          return (
            <li
              key={`${renglon.nombre}-${String(indice)}`}
              className="flex min-h-tap items-center justify-between gap-3 py-1.5"
            >
              <span className="min-w-0">
                <span className="block truncate text-body">{renglon.nombre}</span>
                <span className="block text-meta text-text-3 tabular-nums">
                  {formatearPesos(renglon.monto)}
                  {renglon.dia !== null && ` · vence el ${String(renglon.dia)}`}
                </span>
              </span>
              {pagado ? (
                <span className="flex flex-none items-center gap-1 text-label font-semibold">
                  <Icono nombre="check" tamano={15} grosor={2.25} />
                  Pagado
                </span>
              ) : (
                puedePagar && (
                  <BotonDePago
                    etiqueta={`Registrar el pago de ${renglon.nombre === '' ? 'este renglón' : renglon.nombre}`}
                    alTocar={() => {
                      props.alRegistrarElPago?.({
                        tesoro: { id: tesoro.id, clave: tesoro.clave },
                        monto: renglon.monto,
                        categoria: renglon.nombre.trim() === '' ? null : renglon.nombre.trim(),
                      });
                    }}
                  />
                )
              )}
            </li>
          );
        })}
      </ul>
    </Seccion>
  );
}

function PanelDelPaso({
  vista,
  paso,
  props,
}: {
  vista: VistaDeLaFila;
  paso: PasoDeLaFila;
  props: PanelDeDetalleProps;
}) {
  const tesoro = tesoroDe(vista, paso.tesoro);
  const tipo = tipoDelPaso(paso.clase);
  const delMes = vista.delMes.pasos.find((candidato) => candidato.tesoro === paso.tesoro);
  const tipos = tiposPosibles(tesoro.clave);
  const moverElFoco = useContext(ContextoDelFoco);
  const cerrar = () => {
    props.alElegir(null);
  };
  const sobre = `${NOMBRE_DEL_TIPO[tipo]} · ${lugarEnLaFila(vista.fila, paso.tesoro)}${
    paso.clase === 'sueldo' ? ' · Sueldo' : ''
  }`;

  return (
    <>
      {props.enHoja !== true && (
        <Cabecera
          tesoro={tesoro}
          sobre={sobre}
          vista={vista}
          alCerrar={cerrar}
          alEditarTesoro={props.alEditarTesoro}
        />
      )}
      <ProblemasDeLaSeccion textos={textosDe(vista, paso.tesoro, ['tesoro'])} />
      <Seccion titulo="Qué es" ayuda={<AyudaDeQueEs />}>
        {vista.armando && tipos.length > 1 ? (
          <Segmentado<TipoDelPaso>
            etiqueta={`Qué es ${tesoro.nombre}`}
            opciones={tipos.map((uno) => ({ id: uno, etiqueta: NOMBRE_DEL_TIPO[uno] }))}
            elegido={tipo}
            alElegir={(uno) => {
              editarLaFila(vista, (fila) =>
                conTipo(fila, paso.tesoro, uno, tesoro.clave, tesoro.meta),
              );
            }}
          />
        ) : (
          <p className="text-body text-ink">
            {NOMBRE_DEL_TIPO[tipo]}
            {paso.clase === 'sueldo' ? ' · el sueldo del Hogar' : ''}
          </p>
        )}
      </Seccion>

      {paso.clase === 'fijos' ? (
        <RenglonesDelPaso vista={vista} paso={paso} />
      ) : (
        <MontoDelPaso vista={vista} paso={paso} />
      )}

      <ComoSeLlena vista={vista} paso={paso} tesoro={tesoro} tipo={tipo} />

      {tipo === 'ahorro-fijo' && tesoro.meta !== null && tesoro.meta > 0 && (
        <HastaLaMeta
          vista={vista}
          tesoro={tesoro}
          hastaLaMeta={paso.hastaLaMeta}
          meta={delMes?.meta ?? null}
        />
      )}
      {tipo === 'ahorro-fijo' && (tesoro.meta === null || tesoro.meta <= 0) && (
        <ProblemasDeLaSeccion textos={textosDe(vista, paso.tesoro, ['meta'])} />
      )}

      <ElMesDelPaso vista={vista} paso={paso} tesoro={tesoro} delMes={delMes} props={props} />

      {tipo === 'compromiso' &&
        delMes !== undefined &&
        delMes.aPagar !== null &&
        paso.renglones.length > 0 && (
          <APagarDelCompromiso
            vista={vista}
            paso={paso}
            tesoro={tesoro}
            delMes={delMes}
            props={props}
          />
        )}

      <SeccionDelLugar
        vista={vista}
        tesoro={paso.tesoro}
        mover={moverUnLugar}
        puede={puedeMoverse}
      />

      {vista.armando && (
        <SacarDeLaFila
          texto="Sacar de la fila"
          alSacar={() => {
            moverElFoco();
            editarLaFila(vista, (fila) => sacar(fila, paso.tesoro));
            props.alElegir(fichaDelEstante(paso.tesoro));
          }}
        />
      )}
    </>
  );
}

function PanelDelReparto({ vista, props }: { vista: VistaDeLaFila; props: PanelDeDetalleProps }) {
  const libre = lugarLibreDelReparto(vista.fila);
  const suma = sumaDelReparto(vista.fila);
  const superavit = tesoroDe(vista, vista.fila.superavit);
  const sobrante = props.resultado?.sobrante ?? SOBRANTE_DE_EJEMPLO;
  const moverElFoco = useContext(ContextoDelFoco);
  const editar = (tesoro: TesoroDelTaller) =>
    vista.sincronizados ? (
      <BotonEditarTesoro tesoro={tesoro} alEditar={props.alEditarTesoro} />
    ) : null;
  return (
    <>
      {props.enHoja !== true && (
        <CabeceraNeutra
          icono="split"
          sobre="Ahorros por porcentaje"
          titulo="Lo que sobra"
          bajada="Se reparte por porcentaje"
          alCerrar={() => {
            props.alElegir(null);
          }}
        />
      )}
      <Seccion
        titulo="Reparto"
        ayuda={
          <AyudaDelReparto
            porcentaje={vista.fila.reparto[0]?.porcentaje ?? null}
            sobrante={sobrante}
          />
        }
      >
        <EscalaDelReparto partes={escalaDe(vista)} />
        <ul className="flex flex-col gap-2">
          {vista.fila.reparto.map((parte) => {
            const tesoro = tesoroDe(vista, parte.tesoro);
            const conMeta = tesoro.meta !== null && tesoro.meta > 0;
            return (
              <li key={parte.tesoro} className="flex flex-col gap-1">
                <div className="flex min-h-11 items-center gap-2">
                  <ChipDelTesoro tesoro={tesoro} />
                  <span
                    className={`ml-1 min-w-0 flex-1 truncate text-body font-medium ${TINTA[tesoro.tinta].texto}`}
                  >
                    {tesoro.nombre}
                  </span>
                  {editar(tesoro)}
                  {vista.armando ? (
                    <>
                      <CampoDelPorcentaje
                        etiqueta={`Porcentaje de ${tesoro.nombre}`}
                        porcentaje={parte.porcentaje}
                        alCambiar={(bp) => {
                          editarLaFila(
                            vista,
                            (fila) => conPorcentaje(fila, tesoro.id, puntosBasicos(bp)),
                            `porcentaje:${tesoro.id}`,
                          );
                        }}
                      />
                      <button
                        type="button"
                        aria-label={`Sacar a ${tesoro.nombre} del reparto`}
                        onClick={() => {
                          moverElFoco();
                          editarLaFila(vista, (fila) => sacar(fila, parte.tesoro));
                        }}
                        className="-mr-2 flex size-11 flex-none items-center justify-center rounded-field text-text-2 hover:bg-surface hover:text-ink"
                      >
                        <Icono nombre="minus" tamano={18} />
                      </button>
                    </>
                  ) : (
                    <span className="text-body font-semibold tabular-nums">
                      {porciento(parte.porcentaje)}
                    </span>
                  )}
                </div>
                {conMeta && (
                  <div className="flex items-center justify-between gap-2 pl-10">
                    {vista.armando ? (
                      <Interruptor
                        activo={parte.hastaLaMeta}
                        etiqueta={`${tesoro.nombre} hasta la meta`}
                        alCambiar={(activo) => {
                          editarLaFila(vista, (fila) => conHastaLaMeta(fila, tesoro.id, activo));
                        }}
                        className="min-h-tap rounded-pill text-label text-text-2"
                      >
                        <span aria-hidden>Hasta la meta</span>
                      </Interruptor>
                    ) : (
                      <span className="text-meta text-text-2">
                        {parte.hastaLaMeta ? 'Hasta la meta' : 'Junta sin fin'}
                      </span>
                    )}
                    <span className="text-meta text-text-3 tabular-nums">
                      {formatearPesos(tesoro.saldo)} de {formatearPesos(tesoro.meta ?? 0)}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
          <li className="flex min-h-11 items-center gap-2">
            <ChipDelTesoro tesoro={superavit} />
            <span
              className={`ml-1 min-w-0 flex-1 truncate text-body font-medium ${TINTA[superavit.tinta].texto}`}
            >
              {superavit.nombre}, el resto
            </span>
            {editar(superavit)}
            <span className={`text-body font-semibold tabular-nums ${vista.armando ? 'mr-9' : ''}`}>
              {porciento(libre)}
            </span>
          </li>
        </ul>
        <ProblemasDeLaSeccion textos={textosDe(vista, null, ['reparto'])} />
        <ProblemasDeLaSeccion
          textos={vista.fila.reparto.flatMap((parte) => textosDe(vista, parte.tesoro, ['meta']))}
        />
        {suma <= 10_000 && (
          <p className="text-meta text-text-3">
            {suma === 10_000
              ? `El reparto llega al 100%: ${superavit.nombre} se queda solo con los centavos del redondeo.`
              : `Los porcentajes suman ${porciento(suma)}. El ${porciento(libre)} que falta va a ${superavit.nombre}, que recibe lo que sobra.`}
          </p>
        )}
      </Seccion>
    </>
  );
}

function PanelDelSuperavit({ vista, props }: { vista: VistaDeLaFila; props: PanelDeDetalleProps }) {
  const superavit = tesoroDe(vista, vista.fila.superavit);
  const mes = nombreDelMes(vista.mes).toLowerCase();
  const libre = lugarLibreDelReparto(vista.fila);
  const candidatos = vista.tesoros.filter(
    (tesoro) =>
      !tesoro.archivado &&
      (tesoro.id === vista.fila.superavit ||
        puedeSerSuperavit(vista.fila, tesoro.id, tesoro.clave)),
  );
  return (
    <>
      {props.enHoja !== true && (
        <Cabecera
          tesoro={superavit}
          sobre="Superávit · El resto"
          vista={vista}
          alCerrar={() => {
            props.alElegir(null);
          }}
          alEditarTesoro={props.alEditarTesoro}
        />
      )}
      <Seccion titulo="Qué es" ayuda={<AyudaDelGrupo grupo="superavit" />}>
        <p className="text-body leading-relaxed">
          Recibe lo que sobra después de todo: el {porciento(libre)} de lo que se reparte y los
          centavos del redondeo.
        </p>
      </Seccion>
      <Seccion titulo="Dónde cae lo que sobra" ayuda={<AyudaDelSuperavit />}>
        {vista.armando ? (
          <ul role="radiogroup" aria-label="Dónde cae lo que sobra" className="flex flex-col gap-1">
            {candidatos.map((tesoro) => {
              const elegido = tesoro.id === vista.fila.superavit;
              return (
                <li key={tesoro.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={elegido}
                    onClick={() => {
                      if (elegido) return;
                      editarLaFila(vista, (fila) =>
                        sumarEnElLugar(
                          fila,
                          { id: tesoro.id, clave: tesoro.clave, meta: tesoro.meta },
                          'superavit',
                        ),
                      );
                    }}
                    className={`flex min-h-tap w-full items-center gap-3 rounded-field border px-3 text-left ${
                      elegido ? 'border-ink ring-1 ring-ink' : 'border-border hover:bg-surface'
                    }`}
                  >
                    <ChipDelTesoro tesoro={tesoro} />
                    <span className="min-w-0 flex-1 truncate text-body font-medium">
                      {tesoro.nombre}
                    </span>
                    {elegido && <Icono nombre="check" tamano={16} grosor={2.25} />}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-body text-ink">
            Cae en <span className="font-semibold">{superavit.nombre}</span>.
          </p>
        )}
        <ProblemasDeLaSeccion textos={textosDe(vista, null, ['superavit'])} />
        <ProblemasDeLaSeccion textos={textosDe(vista, vista.fila.superavit, ['superavit'])} />
      </Seccion>
      <Seccion titulo={`En ${mes}`}>
        <LineaDePuntos
          className="text-label"
          izquierda="Recibió"
          derecha={
            <span className="font-semibold">{formatearPesos(vista.delMes.superavit.recibido)}</span>
          }
        />
        <LineaDePuntos
          className="text-label"
          izquierda="Tiene"
          derecha={<span className="font-semibold">{formatearPesos(superavit.saldo)}</span>}
        />
      </Seccion>
    </>
  );
}

function PanelDelEstante({
  vista,
  tesoro,
  props,
}: {
  vista: VistaDeLaFila;
  tesoro: TesoroDelTaller;
  props: PanelDeDetalleProps;
}) {
  const puede = sePuedeEditar(vista);
  const lugares = lugaresParaSumar(vista.fila, tesoro.id, tesoro.clave);
  return (
    <>
      {props.enHoja !== true && (
        <Cabecera
          tesoro={tesoro}
          sobre="En el estante"
          vista={vista}
          alCerrar={() => {
            props.alElegir(null);
          }}
          alEditarTesoro={props.alEditarTesoro}
        />
      )}
      <Seccion titulo="Tiene">
        <p className="text-money-lg font-semibold tabular-nums">{formatearPesos(tesoro.saldo)}</p>
        {tesoro.meta !== null && tesoro.meta > 0 && (
          <p className="text-label text-text-2">
            {Math.floor((tesoro.saldo / tesoro.meta) * 100)}% de la meta de{' '}
            {formatearPesos(tesoro.meta)}
          </p>
        )}
      </Seccion>
      <Seccion titulo="Sumarlo a la fila">
        <p className="text-label leading-relaxed text-text-2">
          Ahora no recibe plata de los cobros.{' '}
          {!vista.armando
            ? 'Elegí dónde va: la fila pasa a editarse y nada viaja hasta que la guardes.'
            : props.conFlechas === false
              ? 'Elegí dónde va.'
              : 'Uní una flecha hasta su ficha o elegí dónde va.'}
        </p>
        <div className="flex flex-col gap-2">
          {lugares.map(({ lugar, titulo, sePuede }) => (
            <Button
              key={lugar}
              variant="secundario"
              disabled={!puede || !sePuede}
              onClick={() => {
                editarLaFila(vista, (fila) =>
                  sumarEnElLugar(
                    fila,
                    { id: tesoro.id, clave: tesoro.clave, meta: tesoro.meta },
                    lugar,
                  ),
                );
                props.alElegir(fichaEnElLugar(lugar, tesoro.id, vista.sistema.diezmo));
              }}
            >
              {titulo}
            </Button>
          ))}
        </div>
      </Seccion>
    </>
  );
}

function PanelDeLosInsumos({ props }: { props: PanelDeDetalleProps }) {
  const insumos = props.insumos ?? SIN_INSUMOS;
  const cuantos = insumos.trabajos.length;
  return (
    <>
      {props.enHoja !== true && (
        <CabeceraNeutra
          icono="hand-coins"
          sobre="Insumos"
          titulo="Lo que queda de cada seña"
          bajada="De los trabajos en curso"
          alCerrar={() => {
            props.alElegir(null);
          }}
        />
      )}
      <Seccion titulo="Insumos" ayuda={<AyudaDeLosInsumos />}>
        <p className="text-money-lg font-semibold tabular-nums">{formatearPesos(insumos.total)}</p>
        <p className="text-label text-text-2">
          {cuantos === 0
            ? 'No hay trabajos en curso con plata.'
            : `En ${String(cuantos)} ${cuantos === 1 ? 'trabajo en curso' : 'trabajos en curso'}. Está en Maun hasta que el trabajo se cobra.`}
        </p>
      </Seccion>
      {cuantos > 0 && (
        <Seccion titulo="Por trabajo">
          <ul className="-mx-2 flex flex-col">
            {insumos.trabajos.map((trabajo) => {
              const frase = fraseDeLosInsumos(trabajo);
              return (
                <li key={trabajo.proyectoId}>
                  <Ir
                    a={rutaDelProyecto(trabajo.proyectoId)}
                    className="flex min-h-tap items-center justify-between gap-3 rounded-field px-2 py-1.5 hover:bg-surface"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-body font-medium underline-offset-3 hover:underline">
                        {trabajo.titulo === '' ? 'Un trabajo' : trabajo.titulo}
                      </span>
                      <span className="block text-meta text-text-3 tabular-nums">
                        entró {formatearPesos(trabajo.entro)} · gastado{' '}
                        {formatearPesos(trabajo.gastado)}
                      </span>
                    </span>
                    <span className="flex-none text-right text-body font-semibold tabular-nums">
                      {frase ?? formatearPesos(trabajo.queda)}
                    </span>
                  </Ir>
                </li>
              );
            })}
          </ul>
        </Seccion>
      )}
    </>
  );
}

type GrupoDeLaLista = 'obligaciones' | 'compromisos' | 'ahorros' | 'superavit' | 'estante';

interface RenglonDeLaLista {
  ficha: string;
  tesoro: TesoroDelTaller;
  numero: number | null;
  lugar: string;
  estante: boolean;
}

function renglonesDeLaLista(vista: VistaDeLaFila): [GrupoDeLaLista, RenglonDeLaLista[]][] {
  const grupos = new Map<GrupoDeLaLista, RenglonDeLaLista[]>([
    ['obligaciones', []],
    ['compromisos', []],
    ['ahorros', []],
    ['superavit', []],
    ['estante', []],
  ]);
  const sumar = (grupo: GrupoDeLaLista, renglon: RenglonDeLaLista) => {
    grupos.get(grupo)?.push(renglon);
  };
  const superavitEnUnPaso = vista.fila.pasos.some((paso) => paso.tesoro === vista.fila.superavit);
  vista.fila.obligaciones.forEach((obligacion, indice) => {
    sumar('obligaciones', {
      ficha:
        obligacion.tesoro === vista.sistema.diezmo
          ? FICHA_DEL_DIEZMO
          : fichaDeLaObligacion(obligacion.tesoro),
      tesoro: tesoroDe(vista, obligacion.tesoro),
      numero: indice + 1,
      lugar: `${porciento(obligacion.porcentaje)} ${BASE_EN_PALABRAS[obligacion.base]}`,
      estante: false,
    });
  });
  vista.fila.pasos.forEach((paso, indice) => {
    const tipo = tipoDelPaso(paso.clase);
    const modo = modoEnPalabras(paso.modo, tipo);
    const lugar =
      paso.clase === 'sueldo'
        ? `sueldo, ${modo}`
        : paso.tesoro === vista.fila.superavit
          ? `${modo}, y el resto`
          : modo;
    sumar(tipo === 'compromiso' ? 'compromisos' : 'ahorros', {
      ficha: fichaDelPaso(paso.tesoro),
      tesoro: tesoroDe(vista, paso.tesoro),
      numero: vista.fila.obligaciones.length + indice + 1,
      lugar,
      estante: false,
    });
  });
  for (const parte of vista.fila.reparto) {
    sumar('ahorros', {
      ficha: fichaDeLaParte(parte.tesoro),
      tesoro: tesoroDe(vista, parte.tesoro),
      numero: null,
      lugar: `${porciento(parte.porcentaje)} de lo que sobra${parte.hastaLaMeta ? ', hasta la meta' : ''}`,
      estante: false,
    });
  }
  if (!superavitEnUnPaso) {
    sumar('superavit', {
      ficha: FICHA_DEL_RESTO,
      tesoro: tesoroDe(vista, vista.fila.superavit),
      numero: null,
      lugar: 'el resto',
      estante: false,
    });
  }
  for (const suelto of vista.estante) {
    sumar('estante', {
      ficha: fichaDelEstante(suelto.id),
      tesoro: suelto,
      numero: null,
      lugar: 'estante',
      estante: true,
    });
  }
  return [...grupos.entries()].filter(([, renglones]) => renglones.length > 0);
}

function saldoEnLaLista(tesoro: TesoroDelTaller): string {
  if (tesoro.clave === 'diezmo' && tesoro.saldo < 0) {
    return `${formatearPesos(Math.abs(tesoro.saldo))} de más`;
  }
  return formatearPesos(tesoro.saldo);
}

const TITULO_DEL_GRUPO_DE_LA_LISTA: Readonly<Record<GrupoDeLaLista, string>> = {
  obligaciones: NOMBRE_DEL_GRUPO.obligaciones,
  compromisos: NOMBRE_DEL_GRUPO.compromisos,
  ahorros: NOMBRE_DEL_GRUPO.ahorros,
  superavit: NOMBRE_DEL_GRUPO.superavit,
  estante: 'Estante',
};

function ListaDeTesoros({ vista, props }: { vista: VistaDeLaFila; props: PanelDeDetalleProps }) {
  const grupos = renglonesDeLaLista(vista);
  const total = vista.tesoros
    .filter((tesoro) => !tesoro.archivado)
    .reduce((suma, tesoro) => suma + tesoro.saldo, 0);
  return (
    <Seccion
      titulo="Lista de tesoros"
      ayuda={
        <Ayuda que="Qué es la lista de tesoros">
          Todos los tesoros con lo que tienen hoy, en el orden de la fila. Tocá uno para verlo en el
          plano.
        </Ayuda>
      }
    >
      <div className="-mx-2 flex flex-col gap-2">
        {grupos.map(([grupo, renglones]) => (
          <div key={grupo} role="group" aria-label={TITULO_DEL_GRUPO_DE_LA_LISTA[grupo]}>
            <h4 className="rotulo-del-plano px-2 pb-0.5 text-badge font-semibold text-text-3 uppercase">
              {TITULO_DEL_GRUPO_DE_LA_LISTA[grupo]}
            </h4>
            <ul className="flex flex-col">
              {renglones.map((renglon) => (
                <li key={renglon.ficha}>
                  <button
                    type="button"
                    aria-current={props.elegido === renglon.ficha ? 'true' : undefined}
                    onClick={() => {
                      props.alElegir(renglon.ficha);
                    }}
                    className="relative flex min-h-tap w-full items-center gap-2.5 rounded-field px-2 text-left hover:bg-surface"
                  >
                    <span className="flex w-6 flex-none justify-center">
                      {renglon.numero === null ? (
                        <span
                          aria-hidden
                          className={`size-2 rounded-pill ${
                            renglon.estante
                              ? 'border border-dashed border-text-3'
                              : TINTA[renglon.tesoro.tinta].fondo
                          }`}
                        />
                      ) : (
                        <Globo numero={renglon.numero} className="size-5! text-[10px]!" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body leading-snug font-medium">
                        {renglon.tesoro.nombre}
                      </span>
                      <span className="block truncate text-meta text-text-3">
                        {renglon.numero !== null && (
                          <span className="sr-only">el {renglon.numero} de la fila, </span>
                        )}
                        {renglon.lugar}
                      </span>
                    </span>
                    <span className="flex-none text-body font-semibold tabular-nums">
                      {saldoEnLaLista(renglon.tesoro)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex items-baseline justify-between border-t border-ink pt-2 text-label">
        <span className="rotulo-del-plano text-badge font-semibold text-text-2 uppercase">
          Entre todos
        </span>
        <span className="font-semibold tabular-nums">{formatearPesos(total)}</span>
      </div>
    </Seccion>
  );
}

function PanelDeLaFila({ vista, props }: { vista: VistaDeLaFila; props: PanelDeDetalleProps }) {
  const nombre = nombreDelMes(vista.mes);
  const cobros = vista.delMes.cobros;
  const compromisos = vista.delMes.pasos.filter((paso) => paso.tipo === 'compromiso');
  const falta = compromisos.reduce((suma, paso) => suma + (paso.falta ?? 0), 0);
  const ahorrado =
    vista.delMes.pasos
      .filter((paso) => paso.tipo === 'ahorro-fijo')
      .reduce((suma, paso) => suma + paso.recibido + paso.cubierto, 0) +
    vista.delMes.reparto.reduce((suma, parte) => suma + parte.recibido, 0);
  return (
    <>
      {props.arriba !== undefined && <div className="pb-5">{props.arriba}</div>}
      <div className="pb-4">
        <span className="rotulo-del-plano block text-badge font-semibold text-text-2 uppercase">
          Cómo se reparte cada cobro
        </span>
        <h2 className="flex items-center gap-2 text-h2 leading-tight font-semibold">
          La fila
          <AyudaDeLaFila />
        </h2>
        <p className="mt-1 text-label leading-relaxed text-text-2">
          Tocá una ficha para ver sus reglas, o probá un cobro y mirá por dónde baja la plata.
        </p>
      </div>
      <Seccion titulo="Probar un cobro" className="@container">
        <Probador
          vista={vista}
          prueba={props.prueba}
          resultado={props.resultado}
          alProbar={props.alProbar}
        />
      </Seccion>
      {props.resultado === null && (
        <Seccion titulo={nombre}>
          <ul className="flex flex-col gap-1.5 text-label">
            <li className="flex items-center gap-1">
              <LineaDePuntos
                className="min-w-0 flex-1"
                izquierda={
                  <span className="inline-flex items-center gap-1">
                    Ingreso en {cobros} {cobros === 1 ? 'cobro' : 'cobros'}
                    <AyudaDelIngreso />
                  </span>
                }
                derecha={
                  <span className="font-semibold">{formatearPesos(vista.delMes.ingreso)}</span>
                }
              />
            </li>
            <li>
              <LineaDePuntos
                izquierda="Obligaciones apartadas"
                derecha={
                  <span className="font-semibold">{formatearPesos(vista.delMes.apartado)}</span>
                }
              />
            </li>
            <li>
              <LineaDePuntos
                izquierda={falta <= 0 ? 'Los compromisos' : 'Falta para los compromisos'}
                derecha={
                  <span className="font-semibold">
                    {falta <= 0 ? 'llenos' : formatearPesos(falta)}
                  </span>
                }
              />
            </li>
            <li>
              <LineaDePuntos
                izquierda="Ahorrado"
                derecha={<span className="font-semibold">{formatearPesos(ahorrado)}</span>}
              />
            </li>
            <li>
              <LineaDePuntos
                izquierda="Superávit"
                derecha={
                  <span className="font-semibold">
                    {formatearPesos(vista.delMes.superavit.recibido)}
                  </span>
                }
              />
            </li>
          </ul>
        </Seccion>
      )}
      <ListaDeTesoros vista={vista} props={props} />
    </>
  );
}

export function PanelDeDetalle(props: PanelDeDetalleProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const pedido = useRef(false);
  const moverElFoco = useMemo(
    () => () => {
      pedido.current = true;
    },
    [],
  );

  useEffect(() => {
    if (!pedido.current) return;
    pedido.current = false;
    const destino =
      raiz.current?.querySelector<HTMLElement>('[data-foco-del-panel]') ??
      raiz.current?.querySelector<HTMLElement>('section h3');
    if (destino === null || destino === undefined) return;
    if (!destino.hasAttribute('tabindex')) destino.tabIndex = -1;
    destino.focus();
  });

  return (
    <ContextoDelFoco value={moverElFoco}>
      <div ref={raiz} onBlur={cortarLaJunta}>
        <ContenidoDelPanel {...props} />
      </div>
    </ContextoDelFoco>
  );
}

function ContenidoDelPanel(props: PanelDeDetalleProps) {
  const { vista, elegido } = props;
  const ficha = elegido === null ? null : queFichaEs(elegido);
  if (ficha?.tipo === 'paso') {
    const paso = pasoDe(vista.fila, ficha.tesoro);
    if (paso !== undefined) return <PanelDelPaso vista={vista} paso={paso} props={props} />;
  }
  if (ficha?.tipo === 'obligacion' || elegido === FICHA_DEL_DIEZMO) {
    const tesoro = ficha?.tipo === 'obligacion' ? ficha.tesoro : vista.sistema.diezmo;
    if (vista.fila.obligaciones.some((obligacion) => obligacion.tesoro === tesoro)) {
      return <PanelDeLaObligacion vista={vista} tesoroId={tesoro} props={props} />;
    }
  }
  if (
    elegido === FICHA_DEL_REPARTO ||
    (ficha?.tipo === 'parte' && vista.fila.reparto.some((parte) => parte.tesoro === ficha.tesoro))
  ) {
    return <PanelDelReparto vista={vista} props={props} />;
  }
  if (elegido === FICHA_DEL_RESTO) return <PanelDelSuperavit vista={vista} props={props} />;
  if (ficha?.tipo === 'estante') {
    const tesoro = vista.estante.find((suelto) => suelto.id === ficha.tesoro);
    if (tesoro !== undefined)
      return <PanelDelEstante vista={vista} tesoro={tesoro} props={props} />;
  }
  if (elegido === FICHA_DE_LOS_INSUMOS) return <PanelDeLosInsumos props={props} />;
  return <PanelDeLaFila vista={vista} props={props} />;
}

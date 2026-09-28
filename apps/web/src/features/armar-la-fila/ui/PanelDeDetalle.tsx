import {
  CERO,
  centavos,
  LARGO_MAXIMO_DEL_RENGLON,
  lugarLibreDelReparto,
  puntosBasicos,
  sumaDelReparto,
  type LiquidacionPorLaFila,
  type PasoDeLaFila,
  type PasoDelMes,
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

import { EscalaDelReparto, Globo, LineaDePuntos, NivelDelMes } from '@/entities/fila';
import { ChipDelTesoro, type TesoroDelTaller } from '@/entities/tesoro';
import {
  formatearPesos,
  formatearPorcentaje,
  nombreDelMes,
  parsearPorcentaje,
  TINTA,
} from '@/shared/lib';
import { Ayuda, Button, Icono, MoneyInput } from '@/shared/ui';

import { editarLaFila, sePuedeEditar } from '../model/acciones';
import { cortarLaJunta } from '../model/borrador';
import {
  clasesPosibles,
  conClase,
  conPorcentaje,
  conRenglones,
  conTope,
  lugarDelPaso,
  moverUnLugar,
  NOMBRE_DE_LA_CLASE,
  pasoDe,
  puedeIrAlReparto,
  sacar,
  sePuedeSumarUnRenglon,
  sumarAlFinal,
  sumarAlReparto,
} from '../model/edicion';
import {
  FICHA_DEL_DIEZMO,
  FICHA_DEL_REPARTO,
  FICHA_DEL_RESTO,
  fichaDeLaParte,
  fichaDelEstante,
  fichaDelPaso,
  queFichaEs,
} from '../model/fichas';
import { mesYAnio, porciento, problemasDe, textoDelProblema } from '../model/textos';
import { escalaDe, tesoroDe, type PruebaEnPantalla, type VistaDeLaFila } from '../model/vista';
import { BotonEditarTesoro } from './BotonEditarTesoro';
import { AyudaDelMes, Probador } from './Probador';
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
  arriba?: ReactNode;
  enHoja?: boolean;
  conFlechas?: boolean;
}

const GANANCIA_DE_EJEMPLO = centavos(100_000_000);
const SOBRANTE_DE_EJEMPLO = centavos(47_000_000);

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

function AyudaDeLaClase() {
  return (
    <Ayuda que="Qué es cada clase de paso">
      <p>
        <strong className="font-semibold">Sueldo:</strong> lo que te asignás por mes. Va siempre al
        Hogar.
      </p>
      <p className="mt-1.5">
        <strong className="font-semibold">Gastos fijos:</strong> lo que se paga todos los meses,
        renglón por renglón. El tope es la suma.
      </p>
      <p className="mt-1.5">
        <strong className="font-semibold">Prioridad:</strong> un monto fijo por mes que se llena
        antes de repartir, como los materiales.
      </p>
    </Ayuda>
  );
}

function RenglonesDelPaso({ vista, paso }: { vista: VistaDeLaFila; paso: PasoDeLaFila }) {
  const [recienSumado, setRecienSumado] = useState<number | null>(null);
  const nombre = tesoroDe(vista, paso.tesoro).nombre;
  const cambiarRenglon = (indice: number, cambio: { nombre?: string; monto?: number }) => {
    editarLaFila(
      vista,
      (fila) => {
        const actual = pasoDe(fila, paso.tesoro);
        if (actual === undefined) return fila;
        const renglones = actual.renglones.map((renglon, i) =>
          i === indice
            ? {
                nombre: cambio.nombre ?? renglon.nombre,
                monto: cambio.monto === undefined ? renglon.monto : centavos(cambio.monto),
              }
            : renglon,
        );
        return conRenglones(fila, paso.tesoro, renglones);
      },
      `renglon:${paso.tesoro}:${String(indice)}:${cambio.nombre === undefined ? 'monto' : 'nombre'}`,
    );
  };

  return (
    <Seccion
      titulo="Renglones"
      ayuda={
        <Ayuda que="Qué son los renglones">
          Cada gasto que se paga todos los meses. El tope del paso es la suma: cuando cambia un
          renglón, cambia el tope desde el próximo cobro.
        </Ayuda>
      }
    >
      <ul className="flex flex-col gap-2">
        {paso.renglones.map((renglon, indice) =>
          vista.armando ? (
            <li key={`${paso.tesoro}-${String(indice)}`} className="flex items-center gap-2">
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
              <MoneyInput
                aria-label={`Monto de ${renglon.nombre === '' ? `el renglón ${String(indice + 1)}` : renglon.nombre}`}
                placeholder="0"
                value={renglon.monto === 0 ? null : renglon.monto}
                onChange={(monto) => {
                  cambiarRenglon(indice, { monto: monto ?? 0 });
                }}
                className="h-11 w-32 flex-none rounded-field border border-border bg-paper px-3 text-right text-body text-ink"
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
            </li>
          ) : (
            <li key={`${paso.tesoro}-${String(indice)}`} className="text-body">
              <LineaDePuntos izquierda={renglon.nombre} derecha={formatearPesos(renglon.monto)} />
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
              return conRenglones(fila, paso.tesoro, [
                ...actual.renglones,
                { nombre: '', monto: CERO },
              ]);
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
        <span className="text-label text-text-2">Tope por mes, la suma</span>
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

function TopeDelPaso({ vista, paso }: { vista: VistaDeLaFila; paso: PasoDeLaFila }) {
  const porTrabajo = paso.clase === 'sueldo' && vista.fila.sueldoPorTrabajo;
  return (
    <Seccion
      titulo={porTrabajo ? 'Tope por trabajo' : 'Tope por mes'}
      ayuda={
        <Ayuda que="Qué es el tope por mes">
          Recibe hasta {formatearPesos(paso.tope)} por mes. Lo que pasa de eso sigue abajo, al paso
          que viene.
        </Ayuda>
      }
    >
      {vista.armando ? (
        <MoneyInput
          aria-label={`Tope por mes de ${tesoroDe(vista, paso.tesoro).nombre}`}
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
  const lugar = lugarDelPaso(vista.fila, paso.tesoro);
  const cuantos = vista.fila.pasos.length;
  const delMes = vista.delMes.pasos.find((candidato) => candidato.tesoro === paso.tesoro);
  const lleva = (delMes?.recibido ?? 0) + (delMes?.cubierto ?? 0);
  const falta = delMes?.falta ?? paso.tope;
  const mes = nombreDelMes(vista.mes).toLowerCase();
  const clases = clasesPosibles(tesoro.clave);
  const moverElFoco = useContext(ContextoDelFoco);
  const botones = useRef<HTMLDivElement>(null);
  const sinTope = paso.tope <= 0;
  const cerrar = () => {
    props.alElegir(null);
  };
  const mover = (hacia: -1 | 1) => {
    const llega = hacia === -1 ? lugar + hacia <= 0 : lugar + hacia >= cuantos - 1;
    editarLaFila(vista, (fila) => moverUnLugar(fila, paso.tesoro, hacia));
    if (!llega) return;
    requestAnimationFrame(() => {
      const lista = Array.from(
        botones.current?.querySelectorAll<HTMLButtonElement>('button') ?? [],
      );
      lista.at(hacia === -1 ? 1 : 0)?.focus();
    });
  };

  return (
    <>
      {props.enHoja !== true && (
        <Cabecera
          tesoro={tesoro}
          sobre={`Paso ${String(lugar + 1)} de ${String(cuantos)} · ${NOMBRE_DE_LA_CLASE[paso.clase]}`}
          vista={vista}
          alCerrar={cerrar}
          alEditarTesoro={props.alEditarTesoro}
        />
      )}
      <ProblemasDeLaSeccion textos={textosDe(vista, paso.tesoro, ['tesoro'])} />
      <Seccion titulo="Qué es" ayuda={<AyudaDeLaClase />}>
        {vista.armando && clases.length > 1 ? (
          <Segmentado
            etiqueta={`Qué es ${tesoro.nombre}`}
            opciones={clases.map((clase) => ({ id: clase, etiqueta: NOMBRE_DE_LA_CLASE[clase] }))}
            elegido={paso.clase}
            alElegir={(clase) => {
              editarLaFila(vista, (fila) => conClase(fila, paso.tesoro, clase));
            }}
          />
        ) : (
          <p className="text-body text-ink">{NOMBRE_DE_LA_CLASE[paso.clase]}</p>
        )}
      </Seccion>

      {paso.clase === 'fijos' ? (
        <RenglonesDelPaso vista={vista} paso={paso} />
      ) : (
        <TopeDelPaso vista={vista} paso={paso} />
      )}

      <Seccion titulo={`En ${mes}`}>
        <NivelDelMes
          tinta={tesoro.tinta}
          lleva={lleva}
          tope={paso.tope}
          etiqueta={`${tesoro.nombre} en ${mes}`}
          texto={
            sinTope
              ? 'Sin tope todavía'
              : `${formatearPesos(lleva)} de ${formatearPesos(paso.tope)}`
          }
        />
        <div className="flex items-baseline justify-between gap-3 text-label">
          <span className="text-text-2 tabular-nums">
            {formatearPesos(lleva)} de {formatearPesos(paso.tope)}
          </span>
          {sinTope ? (
            <span className="font-medium text-text-3">Poné el tope</span>
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

      <Seccion
        titulo="Lugar en la fila"
        ayuda={
          <Ayuda que="Cómo funciona el orden">
            La plata llena el paso 1 hasta su tope, después el 2, y así. Lo que llega abajo de todo
            se reparte.
          </Ayuda>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-body">
            Paso <span className="font-semibold tabular-nums">{lugar + 1}</span> de {cuantos}
          </span>
          {vista.armando && (
            <div ref={botones} className="flex gap-2">
              <Button
                variant="herramienta"
                size="herramienta"
                disabled={lugar <= 0}
                onClick={() => {
                  mover(-1);
                }}
                className="px-3"
              >
                <Icono nombre="arrow-up" tamano={16} />
                Subir
              </Button>
              <Button
                variant="herramienta"
                size="herramienta"
                disabled={lugar >= cuantos - 1}
                onClick={() => {
                  mover(1);
                }}
                className="px-3"
              >
                <Icono nombre="arrow-down" tamano={16} />
                Bajar
              </Button>
            </div>
          )}
        </div>
      </Seccion>

      {vista.armando && (
        <div className="border-t border-hairline pt-4">
          <Button
            variant="terciario"
            className="-ml-3 min-h-tap"
            onClick={() => {
              moverElFoco();
              editarLaFila(vista, (fila) => sacar(fila, paso.tesoro));
              props.alElegir(fichaDelEstante(paso.tesoro));
            }}
          >
            Sacar de la fila
          </Button>
          <p className="mt-0.5 text-meta text-text-3">
            Vuelve al estante con lo que tiene. Nada se borra.
          </p>
        </div>
      )}
    </>
  );
}

function CampoDelPorcentaje({
  vista,
  tesoro,
  porcentaje,
}: {
  vista: VistaDeLaFila;
  tesoro: TesoroDelTaller;
  porcentaje: number;
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
        aria-label={`Porcentaje de ${tesoro.nombre}`}
        inputMode="decimal"
        autoComplete="off"
        value={texto}
        onChange={(evento) => {
          const escrito = evento.target.value;
          setTexto(escrito);
          const bp = parsearPorcentaje(escrito, 10_000);
          if (bp === undefined || bp <= 0) return;
          editarLaFila(
            vista,
            (fila) => conPorcentaje(fila, tesoro.id, puntosBasicos(bp)),
            `porcentaje:${tesoro.id}`,
          );
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

function AyudaDelReparto({ vista, sobrante }: { vista: VistaDeLaFila; sobrante: number }) {
  const primera = vista.fila.reparto[0];
  return (
    <Ayuda que="Cómo se reparte lo que sobra">
      Divide lo que sobra después de los topes.
      {primera !== undefined &&
        ` El ${porciento(primera.porcentaje)} de ${formatearPesos(sobrante)} son ${formatearPesos(
          Math.floor((sobrante * primera.porcentaje) / 10_000),
        )}.`}{' '}
      Lo que no se reparte queda en Maun.
    </Ayuda>
  );
}

function PanelDelReparto({ vista, props }: { vista: VistaDeLaFila; props: PanelDeDetalleProps }) {
  const libre = lugarLibreDelReparto(vista.fila);
  const suma = sumaDelReparto(vista.fila);
  const maun = tesoroDe(vista, vista.sistema.maun);
  const sobrante = props.resultado?.sobrante ?? SOBRANTE_DE_EJEMPLO;
  const moverElFoco = useContext(ContextoDelFoco);
  const editar = (tesoro: TesoroDelTaller) =>
    vista.sincronizados ? (
      <BotonEditarTesoro tesoro={tesoro} alEditar={props.alEditarTesoro} />
    ) : null;
  return (
    <>
      {props.enHoja !== true && (
        <div className="flex items-start gap-3 pb-4">
          <span
            aria-hidden
            className="flex size-10 flex-none items-center justify-center rounded-field bg-surface-2 text-ink"
          >
            <Icono nombre="split" tamano={20} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="rotulo-del-plano block text-badge font-semibold text-text-2 uppercase">
              Después de los topes
            </span>
            <h2 tabIndex={-1} data-foco-del-panel className="text-h2 leading-tight font-semibold">
              Lo que sobra
            </h2>
            <p className="text-label text-text-2">Se reparte por porcentaje</p>
          </div>
          <BotonCerrar
            alCerrar={() => {
              props.alElegir(null);
            }}
          />
        </div>
      )}
      <Seccion titulo="Reparto" ayuda={<AyudaDelReparto vista={vista} sobrante={sobrante} />}>
        <EscalaDelReparto partes={escalaDe(vista)} />
        <ul className="flex flex-col gap-2">
          {vista.fila.reparto.map((parte) => {
            const tesoro = tesoroDe(vista, parte.tesoro);
            return (
              <li key={parte.tesoro} className="flex min-h-11 items-center gap-2">
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
                      vista={vista}
                      tesoro={tesoro}
                      porcentaje={parte.porcentaje}
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
              </li>
            );
          })}
          <li className="flex min-h-11 items-center gap-2">
            <ChipDelTesoro tesoro={maun} />
            <span
              className={`ml-1 min-w-0 flex-1 truncate text-body font-medium ${TINTA[maun.tinta].texto}`}
            >
              {maun.nombre}, el resto
            </span>
            {editar(maun)}
            <span className={`text-body font-semibold tabular-nums ${vista.armando ? 'mr-9' : ''}`}>
              {porciento(libre)}
            </span>
          </li>
        </ul>
        <ProblemasDeLaSeccion textos={textosDe(vista, null, ['reparto'])} />
        {suma <= 10_000 && (
          <p className="text-meta text-text-3">
            {suma === 10_000
              ? `El reparto llega al 100%: ${maun.nombre} se queda solo con los centavos del redondeo.`
              : `Los porcentajes suman ${porciento(suma)}. El ${porciento(libre)} que falta queda en ${maun.nombre}.`}
          </p>
        )}
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
  const puedePaso = sePuedeEditar(vista);
  const puedeReparto = puedePaso && puedeIrAlReparto(vista.fila, tesoro.id, tesoro.clave);
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
          <Button
            variant="secundario"
            disabled={!puedePaso}
            onClick={() => {
              editarLaFila(vista, (fila) => sumarAlFinal(fila, tesoro.id, tesoro.clave));
              props.alElegir(fichaDelPaso(tesoro.id));
            }}
          >
            Como paso con tope, al final
          </Button>
          <Button
            variant="secundario"
            disabled={!puedeReparto}
            onClick={() => {
              editarLaFila(vista, (fila) => sumarAlReparto(fila, tesoro.id));
              props.alElegir(fichaDeLaParte(tesoro.id));
            }}
          >
            En el reparto, con un porcentaje
          </Button>
        </div>
      </Seccion>
    </>
  );
}

function PanelDelDiezmo({ vista, props }: { vista: VistaDeLaFila; props: PanelDeDetalleProps }) {
  const diezmo = tesoroDe(vista, vista.sistema.diezmo);
  return (
    <>
      {props.enHoja !== true && (
        <Cabecera
          tesoro={diezmo}
          sobre="Primero, siempre"
          vista={vista}
          alCerrar={() => {
            props.alElegir(null);
          }}
          alEditarTesoro={props.alEditarTesoro}
        />
      )}
      <Seccion titulo="La regla">
        <p className="text-body leading-relaxed">
          Sale antes que nada: el 10% de la ganancia de cada trabajo. De una ganancia de{' '}
          {formatearPesos(GANANCIA_DE_EJEMPLO)} van {formatearPesos(GANANCIA_DE_EJEMPLO / 10)}.
        </p>
        <p className="flex items-center gap-1.5 text-meta text-text-3">
          <Icono nombre="lock" tamano={13} />
          No se mueve ni se cambia desde la fila.
        </p>
      </Seccion>
      <Seccion titulo={`En ${nombreDelMes(vista.mes).toLowerCase()}`}>
        <LineaDePuntos
          className="text-label"
          izquierda="Apartado"
          derecha={<span className="font-semibold">{formatearPesos(vista.delMes.diezmo)}</span>}
        />
      </Seccion>
    </>
  );
}

interface RenglonDeLaLista {
  ficha: string;
  tesoro: TesoroDelTaller;
  numero: number | null;
  lugar: string;
  estante: boolean;
}

function renglonesDeLaLista(vista: VistaDeLaFila): RenglonDeLaLista[] {
  const renglones: RenglonDeLaLista[] = [
    {
      ficha: FICHA_DEL_DIEZMO,
      tesoro: tesoroDe(vista, vista.sistema.diezmo),
      numero: null,
      lugar: 'primero',
      estante: false,
    },
    ...vista.fila.pasos.map((paso, indice) => ({
      ficha: fichaDelPaso(paso.tesoro),
      tesoro: tesoroDe(vista, paso.tesoro),
      numero: indice + 1,
      lugar: NOMBRE_DE_LA_CLASE[paso.clase].toLowerCase(),
      estante: false,
    })),
    ...vista.fila.reparto.map((parte) => ({
      ficha: fichaDeLaParte(parte.tesoro),
      tesoro: tesoroDe(vista, parte.tesoro),
      numero: null,
      lugar: porciento(parte.porcentaje),
      estante: false,
    })),
  ];
  if (!vista.fila.pasos.some((paso) => paso.tesoro === vista.sistema.maun)) {
    renglones.push({
      ficha: FICHA_DEL_RESTO,
      tesoro: tesoroDe(vista, vista.sistema.maun),
      numero: null,
      lugar: 'el resto',
      estante: false,
    });
  }
  for (const suelto of vista.estante) {
    renglones.push({
      ficha: fichaDelEstante(suelto.id),
      tesoro: suelto,
      numero: null,
      lugar: 'estante',
      estante: true,
    });
  }
  return renglones;
}

function saldoEnLaLista(tesoro: TesoroDelTaller): string {
  if (tesoro.clave === 'diezmo' && tesoro.saldo < 0) {
    return `${formatearPesos(Math.abs(tesoro.saldo))} de más`;
  }
  return formatearPesos(tesoro.saldo);
}

function ListaDeTesoros({ vista, props }: { vista: VistaDeLaFila; props: PanelDeDetalleProps }) {
  const renglones = renglonesDeLaLista(vista);
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
      <ul className="-mx-2 flex flex-col">
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
                    <span className="sr-only">paso {renglon.numero}, </span>
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
  const falta = vista.delMes.pasos.reduce((suma, paso) => suma + paso.falta, 0);
  const cobros = vista.delMes.cobros;
  return (
    <>
      {props.arriba !== undefined && <div className="pb-5">{props.arriba}</div>}
      <div className="pb-4">
        <span className="rotulo-del-plano block text-badge font-semibold text-text-2 uppercase">
          Cómo se reparte cada cobro
        </span>
        <h2 className="flex items-center gap-2 text-h2 leading-tight font-semibold">
          La fila
          <Ayuda que="Cómo se lee la fila">
            <ul className="flex list-disc flex-col gap-1.5 pl-4">
              <li>Cada cobro entra arriba y baja por la fila.</li>
              <li>
                Primero sale el diezmo. Después, cada paso se llena hasta su tope del mes, en el
                orden de los números.
              </li>
              <li>Lo que sobra se reparte por porcentaje, y lo que queda es de Maun.</li>
              <li>Una ficha con borde de trazos no recibe nada en la prueba.</li>
            </ul>
          </Ayuda>
        </h2>
        <p className="mt-1 text-label leading-relaxed text-text-2">
          Tocá una ficha para ver sus reglas, o probá un cobro y mirá por dónde baja la plata.
        </p>
      </div>
      <Seccion
        titulo="Probar un cobro"
        className="@container"
        ayuda={
          <span className="flex @min-[20rem]:hidden">
            <AyudaDelMes mes={nombre.toLowerCase()} />
          </span>
        }
      >
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
            <li>
              <LineaDePuntos
                izquierda={`Ganancia en ${String(cobros)} ${cobros === 1 ? 'cobro' : 'cobros'}`}
                derecha={
                  <span className="font-semibold">{formatearPesos(vista.delMes.ganancia)}</span>
                }
              />
            </li>
            <li>
              <LineaDePuntos
                izquierda="Diezmo apartado"
                derecha={
                  <span className="font-semibold">{formatearPesos(vista.delMes.diezmo)}</span>
                }
              />
            </li>
            <li>
              <LineaDePuntos
                izquierda={falta <= 0 ? 'Los topes' : 'Falta para los topes'}
                derecha={
                  <span className="font-semibold">
                    {falta <= 0 ? 'llenos' : formatearPesos(falta)}
                  </span>
                }
              />
            </li>
            <li>
              <LineaDePuntos
                izquierda={`Quedó en ${tesoroDe(vista, vista.sistema.maun).nombre}`}
                derecha={
                  <span className="font-semibold">{formatearPesos(vista.delMes.enElTaller)}</span>
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
  if (
    elegido === FICHA_DEL_REPARTO ||
    elegido === FICHA_DEL_RESTO ||
    (ficha?.tipo === 'parte' && vista.fila.reparto.some((parte) => parte.tesoro === ficha.tesoro))
  ) {
    return <PanelDelReparto vista={vista} props={props} />;
  }
  if (ficha?.tipo === 'estante') {
    const tesoro = vista.estante.find((suelto) => suelto.id === ficha.tesoro);
    if (tesoro !== undefined)
      return <PanelDelEstante vista={vista} tesoro={tesoro} props={props} />;
  }
  if (elegido === FICHA_DEL_DIEZMO) return <PanelDelDiezmo vista={vista} props={props} />;
  return <PanelDeLaFila vista={vista} props={props} />;
}

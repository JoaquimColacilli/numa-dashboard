import {
  MONEDA_DEL_TALLER,
  type BaseDeLaObligacion,
  type Fila,
  type Moneda,
  type QueEsElTesoro,
} from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useId, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';

import { AyudaDeLaBase, AyudaDeLoQueEs, ETIQUETA_DE_LA_BASE } from '@/entities/fila';
import { useReplicaDelTaller } from '@/entities/replica';
import { MUTACION_DE_TESORO_NUEVO, tesoroPorId, tesorosDelTaller } from '@/entities/tesoro';
import { filaDelTaller, type TesoroNuevo } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { hayCambios, metaDeAvisos, uuidv7 } from '@/shared/lib';
import {
  Ayuda,
  Button,
  Campo,
  FilaDeAcciones,
  FondoDelElegido,
  Hoja,
  Interruptor,
  MoneyInput,
} from '@/shared/ui';

import {
  DIA_DE_PAGO_INICIAL,
  dondeEntra,
  fraseDelLibre,
  libreEnElReparto,
  LUGARES_DEL_TIPO,
  lugarDelTipo,
  opcionesDeLugar,
  porcentajeSugerido,
  revisarElLugar,
  SUGERENCIAS_DEL_LUGAR,
  tipoDelLugar,
  tiposPosibles,
  type DondeVa,
  type ErroresDelLugar,
  type LugarDelTesoro,
  type SugerenciaDeNombre,
} from '../model/lugar';
import {
  borradorNuevo,
  conLaMoneda,
  hayErrores,
  ordenAlFinal,
  revisarElTesoro,
  tesoroNuevo,
  type BorradorDelTesoro,
  type ErroresDelTesoro,
} from '../model/tesoro';
import { CamposDelTesoro } from './CamposDelTesoro';

export interface HojaDeTesoroNuevoProps {
  alCerrar: () => void;
  alCrear: (tesoro: TesoroNuevo, dondeVa: DondeVa, despuesDe: string | null | undefined) => void;
  fila?: Fila;
  lugarInicial?: LugarDelTesoro;
  despuesDe?: string | null;
  monedaInicial?: Moneda;
}

const BASES: readonly BaseDeLaObligacion[] = ['cobrado', 'ingreso'];
const BASE_INICIAL: BaseDeLaObligacion = 'ingreso';

function Segmentos<T extends string>({
  etiqueta,
  opciones,
  elegido,
  alElegir,
  extra,
}: {
  etiqueta: string;
  opciones: readonly { valor: T; texto: string }[];
  elegido: T;
  alElegir: (valor: T) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-label text-text-2">
        {etiqueta}
        {extra}
      </span>
      <div
        role="radiogroup"
        aria-label={etiqueta}
        className="relative grid grid-cols-2 gap-0.5 rounded-pill bg-ink/6 p-1"
      >
        <FondoDelElegido elegido={elegido} />
        {opciones.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={elegido === opcion.valor}
            data-opcion={opcion.valor}
            onClick={() => {
              alElegir(opcion.valor);
            }}
            className={`relative min-h-tap rounded-pill px-2 text-label ${
              elegido === opcion.valor ? 'font-semibold text-ink' : 'font-medium text-text-2'
            }`}
          >
            {opcion.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

function Sugerencias({
  sugerencias,
  nombre,
  alElegir,
}: {
  sugerencias: readonly SugerenciaDeNombre[];
  nombre: string;
  alElegir: (sugerencia: SugerenciaDeNombre) => void;
}) {
  const textos = useMensajes().editarTesoro.nuevo;
  if (sugerencias.length === 0) return null;
  return (
    <div role="group" aria-label={textos.nombresSugeridos} className="-mt-1 flex flex-wrap gap-1.5">
      {sugerencias.map((sugerencia) => {
        const elegida = nombre.trim() === sugerencia.nombre;
        return (
          <button
            key={sugerencia.nombre}
            type="button"
            aria-pressed={elegida}
            onClick={() => {
              alElegir(sugerencia);
            }}
            className={`apretable min-h-9 rounded-pill border px-3 text-label ${
              elegida
                ? 'border-ink bg-ink font-semibold text-paper'
                : 'border-hairline bg-paper font-medium text-ink hover:bg-ink/5'
            }`}
          >
            {sugerencia.nombre}
          </button>
        );
      })}
    </div>
  );
}

function ElTipo({
  tipo,
  moneda,
  alElegir,
}: {
  tipo: QueEsElTesoro | null;
  moneda: Moneda;
  alElegir: (tipo: QueEsElTesoro) => void;
}) {
  const textos = useMensajes().editarTesoro.nuevo;
  const id = useId();
  const posibles = tiposPosibles(moneda);
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-label text-text-2">{textos.queEs}</legend>
      {(['caja', 'deuda-destinada', 'deuda-obligatoria', 'meta'] as const).map((uno) => {
        const datos = textos.tipos[uno];
        const sePuede = posibles.includes(uno);
        const elegido = tipo === uno;
        return (
          <div
            key={uno}
            className={`flex items-center gap-2 rounded-field border pr-2 ${
              elegido ? 'border-ink ring-1 ring-ink' : 'border-border'
            }`}
          >
            <label
              className={`flex min-h-tap min-w-0 flex-1 items-center gap-3 px-3.5 py-2.5 ${
                sePuede ? 'cursor-pointer' : 'text-text-3'
              }`}
            >
              <input
                type="radio"
                name={`${id}-tipo`}
                value={uno}
                checked={elegido}
                disabled={!sePuede}
                onChange={() => {
                  alElegir(uno);
                }}
                className="size-5 flex-none accent-ink"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-body font-medium">{datos.titulo}</span>
                <span className="block text-label text-text-2">{datos.ejemplo}</span>
              </span>
            </label>
            <Ayuda que={datos.que}>{datos.ayuda}</Ayuda>
          </div>
        );
      })}
      {moneda !== MONEDA_DEL_TALLER && (
        <p className="text-meta leading-relaxed text-text-3">{textos.enDolares}</p>
      )}
    </fieldset>
  );
}

export function HojaDeTesoroNuevo({
  alCerrar,
  alCrear,
  fila,
  lugarInicial = 'estante',
  despuesDe,
  monedaInicial = MONEDA_DEL_TALLER,
}: HojaDeTesoroNuevoProps) {
  const m = useMensajes().editarTesoro;
  const textos = m.nuevo;
  const replica = useReplicaDelTaller();
  const tesoros = tesorosDelTaller(replica);
  const laFila = fila ?? filaDelTaller(replica).fila;
  const nombreDe = (id: string) => tesoroPorId(tesoros, id)?.nombre ?? m.lugar.elAnterior;
  const libre = libreEnElReparto(laFila);
  const id = useId();

  const [inicial] = useState(() => {
    const posible =
      opcionesDeLugar(laFila, nombreDe(laFila.superavit)).find(
        (opcion) => opcion.id === lugarInicial,
      )?.sePuede ?? false;
    const lugar = posible && monedaInicial === MONEDA_DEL_TALLER ? lugarInicial : 'estante';
    return {
      borrador: borradorNuevo(tesoros, monedaInicial),
      tipo: tipoDelLugar(lugar) ?? (monedaInicial === MONEDA_DEL_TALLER ? null : 'caja'),
      lugar,
      monto: null as number | null,
      porcentaje: '',
      porcentajeDelReparto: porcentajeSugerido(libre),
      base: BASE_INICIAL,
      antesDelDiezmo: false,
      conMontoFijo: false,
      montoFijo: null as number | null,
      dia: DIA_DE_PAGO_INICIAL,
      pagaSola: true,
    };
  });
  const [borrador, setBorrador] = useState<BorradorDelTesoro>(inicial.borrador);
  const [tipo, setTipo] = useState<QueEsElTesoro | null>(inicial.tipo);
  const [lugar, setLugar] = useState<LugarDelTesoro>(inicial.lugar);
  const [monto, setMonto] = useState<number | null>(inicial.monto);
  const [porcentaje, setPorcentaje] = useState(inicial.porcentaje);
  const [porcentajeDelReparto, setPorcentajeDelReparto] = useState(inicial.porcentajeDelReparto);
  const [base, setBase] = useState<BaseDeLaObligacion>(inicial.base);
  const [antesDelDiezmo, setAntesDelDiezmo] = useState(inicial.antesDelDiezmo);
  const [conMontoFijo, setConMontoFijo] = useState(inicial.conMontoFijo);
  const [montoFijo, setMontoFijo] = useState<number | null>(inicial.montoFijo);
  const [dia, setDia] = useState(inicial.dia);
  const [pagaSola, setPagaSola] = useState(inicial.pagaSola);
  const [errores, setErrores] = useState<ErroresDelTesoro>({});
  const [erroresDelLugar, setErroresDelLugar] = useState<ErroresDelLugar>({});
  const campoDelNombre = useRef<HTMLInputElement>(null);

  const crear = useMutation({ ...MUTACION_DE_TESORO_NUEVO, meta: metaDeAvisos('tesoroNuevo') });
  const despuesDelElegido = lugar === inicial.lugar ? despuesDe : undefined;
  const opciones = opcionesDeLugar(laFila, nombreDe(laFila.superavit), borrador.moneda).filter(
    (opcion) => tipo !== null && LUGARES_DEL_TIPO[tipo].includes(opcion.id),
  );
  const esDeuda = tipo === 'deuda-destinada' || tipo === 'deuda-obligatoria';
  const dondeVaLaDeuda = esDeuda ? dondeEntra(lugar, despuesDelElegido, nombreDe) : null;

  function elegirTipo(nuevo: QueEsElTesoro) {
    setTipo(nuevo);
    setLugar(lugarDelTipo(nuevo, inicial.lugar));
    setErroresDelLugar({});
    setErrores({});
    if (nuevo === 'deuda-destinada' || nuevo === 'deuda-obligatoria') {
      setBorrador((previo) =>
        conLaMoneda({ ...previo, meta: null, metaFecha: '' }, MONEDA_DEL_TALLER),
      );
    }
    if (nuevo === 'caja') setBorrador((previo) => ({ ...previo, meta: null, metaFecha: '' }));
  }

  function cambiar(cambios: Partial<BorradorDelTesoro>) {
    setBorrador((previo) => {
      const { moneda, ...resto } = cambios;
      return { ...(moneda === undefined ? previo : conLaMoneda(previo, moneda)), ...resto };
    });
    if ('nombre' in cambios || 'descripcion' in cambios || 'meta' in cambios) setErrores({});
    if ('metaFecha' in cambios) setErrores({});
    if (cambios.moneda !== undefined && cambios.moneda !== MONEDA_DEL_TALLER) {
      setLugar('estante');
      setErroresDelLugar({});
    }
  }

  function sugerir(sugerencia: SugerenciaDeNombre) {
    cambiar({ nombre: sugerencia.nombre, icono: sugerencia.icono });
    if (sugerencia.base !== undefined) setBase(sugerencia.base);
    if (sugerencia.antesDelDiezmo !== undefined) setAntesDelDiezmo(sugerencia.antesDelDiezmo);
  }

  function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (tipo === null) return;
    const encontrados = revisarElTesoro(borrador, { pideMeta: tipo === 'meta' });
    const revisado = revisarElLugar(
      lugar,
      {
        monto,
        porcentaje: lugar === 'reparto' ? porcentajeDelReparto : porcentaje,
        base,
        antesDelDiezmo,
        conMontoFijo,
        montoFijo,
        dia,
        pagaSola,
      },
      laFila,
    );
    setErrores(encontrados);
    setErroresDelLugar(revisado.errores ?? {});
    if (hayErrores(encontrados)) {
      if (encontrados.nombre !== undefined) campoDelNombre.current?.focus();
      return;
    }
    if (revisado.dondeVa === undefined) return;

    const nuevo = tesoroNuevo(borrador, uuidv7(), ordenAlFinal(tesoros));
    crear.mutate(nuevo);
    alCrear(nuevo, revisado.dondeVa, despuesDelElegido);
    alCerrar();
  }

  const conCambios = hayCambios(
    {
      ...inicial.borrador,
      tipo: inicial.tipo,
      lugar: inicial.lugar,
      monto: inicial.monto,
      porcentaje: inicial.porcentaje,
      porcentajeDelReparto: inicial.porcentajeDelReparto,
      base: inicial.base,
      antesDelDiezmo: inicial.antesDelDiezmo,
      conMontoFijo: inicial.conMontoFijo,
      montoFijo: inicial.montoFijo,
      dia: inicial.dia,
      pagaSola: inicial.pagaSola,
    },
    {
      ...borrador,
      tipo,
      lugar,
      monto,
      porcentaje,
      porcentajeDelReparto,
      base,
      antesDelDiezmo,
      conMontoFijo,
      montoFijo,
      dia,
      pagaSola,
    },
  );

  return (
    <Hoja titulo={textos.titulo} bajada={textos.bajada} alCerrar={alCerrar} conCambios={conCambios}>
      <form noValidate onSubmit={enviar} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="@container flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
          {tipo === null ? (
            <ElTipo tipo={tipo} moneda={borrador.moneda} alElegir={elegirTipo} />
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-field bg-surface px-3.5 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-label text-text-2">{textos.queEs}</span>
                  <span className="flex items-center gap-1.5 text-body font-semibold">
                    {textos.tipos[tipo].titulo}
                    <Ayuda que={textos.tipos[tipo].que}>{textos.tipos[tipo].ayuda}</Ayuda>
                  </span>
                </span>
                <Button
                  type="button"
                  variant="terciario"
                  size="chico"
                  onClick={() => {
                    setTipo(null);
                  }}
                >
                  {textos.otroTipo}
                </Button>
              </div>

              <CamposDelTesoro
                borrador={borrador}
                cambiar={cambiar}
                errores={errores}
                tesoros={tesoros}
                excepto={null}
                conMeta={tipo === 'meta'}
                pideMeta={tipo === 'meta'}
                eligeLaMoneda={!esDeuda}
                campoDelNombre={campoDelNombre}
                debajoDelNombre={
                  <Sugerencias
                    sugerencias={SUGERENCIAS_DEL_LUGAR[lugar]}
                    nombre={borrador.nombre}
                    alElegir={sugerir}
                  />
                }
              />

              {tipo === 'deuda-destinada' && (
                <div className="flex flex-col gap-3">
                  <Segmentos
                    etiqueta={textos.seLleva}
                    opciones={[
                      { valor: 'porcentaje', texto: textos.unPorcentaje },
                      { valor: 'monto', texto: textos.unMontoFijo },
                    ]}
                    elegido={conMontoFijo ? 'monto' : 'porcentaje'}
                    alElegir={(valor) => {
                      setConMontoFijo(valor === 'monto');
                      setErroresDelLugar({});
                    }}
                  />
                  {conMontoFijo ? (
                    <MoneyInput
                      etiqueta={textos.montoFijo}
                      ayuda={textos.ayudaDelMontoFijo}
                      value={montoFijo}
                      error={erroresDelLugar.montoFijo}
                      onChange={(nuevo) => {
                        setMontoFijo(nuevo);
                        setErroresDelLugar({});
                      }}
                    />
                  ) : (
                    <>
                      <Campo
                        etiqueta={textos.porcentaje}
                        inputMode="decimal"
                        autoComplete="off"
                        value={porcentaje}
                        error={erroresDelLugar.porcentaje}
                        onChange={(evento) => {
                          setPorcentaje(evento.target.value);
                          setErroresDelLugar({});
                        }}
                      />
                      <Segmentos
                        etiqueta={textos.sobreQueSeCalcula}
                        extra={<AyudaDeLaBase />}
                        opciones={BASES.map((una) => ({
                          valor: una,
                          texto: ETIQUETA_DE_LA_BASE[una],
                        }))}
                        elegido={base}
                        alElegir={setBase}
                      />
                    </>
                  )}
                  <Interruptor
                    activo={antesDelDiezmo}
                    alCambiar={setAntesDelDiezmo}
                    className="min-h-tap rounded-pill text-body"
                  >
                    {textos.antesDelDiezmo}
                  </Interruptor>
                </div>
              )}

              {tipo === 'deuda-obligatoria' && (
                <div className="flex flex-col gap-3">
                  <MoneyInput
                    etiqueta={textos.tope}
                    ayuda={textos.ayudaDelTope}
                    value={monto}
                    error={erroresDelLugar.monto}
                    onChange={(nuevo) => {
                      setMonto(nuevo);
                      setErroresDelLugar({});
                    }}
                  />
                  <Campo
                    etiqueta={textos.diaDePago}
                    inputMode="numeric"
                    autoComplete="off"
                    className="tabular-nums"
                    value={dia}
                    ayuda={textos.ayudaDelDiaDePago}
                    error={erroresDelLugar.dia}
                    onChange={(evento) => {
                      setDia(evento.target.value.replace(/\D/g, '').slice(0, 2));
                      setErroresDelLugar({});
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <Interruptor
                      activo={pagaSola}
                      alCambiar={setPagaSola}
                      className="min-h-tap rounded-pill text-body"
                    >
                      {textos.seLaPaga}
                    </Interruptor>
                    <AyudaDeLoQueEs de="pagaSola" />
                  </div>
                </div>
              )}

              {dondeVaLaDeuda !== null && <p className="text-meta text-text-3">{dondeVaLaDeuda}</p>}

              {(tipo === 'caja' || tipo === 'meta') && (
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1.5 text-label text-text-2">{textos.comoRecibe}</legend>
                  {opciones.map((opcion) => {
                    const elegida = lugar === opcion.id;
                    const donde = elegida
                      ? dondeEntra(opcion.id, despuesDelElegido, nombreDe)
                      : null;
                    return (
                      <div
                        key={opcion.id}
                        className={`rounded-field border ${
                          elegida ? 'border-ink ring-1 ring-ink' : 'border-border'
                        }`}
                      >
                        <label
                          className={`flex min-h-tap items-center gap-3 px-3.5 py-2.5 ${
                            opcion.sePuede ? 'cursor-pointer' : 'text-text-3'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`${id}-lugar`}
                            value={opcion.id}
                            checked={elegida}
                            disabled={!opcion.sePuede}
                            onChange={() => {
                              setLugar(opcion.id);
                              setErroresDelLugar({});
                            }}
                            className="size-5 flex-none accent-ink"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-body font-medium">{opcion.titulo}</span>
                            <span className="block text-label text-text-2">{opcion.detalle}</span>
                          </span>
                        </label>
                        {elegida && opcion.id === 'ahorro-fijo' && (
                          <div className="px-3.5 pb-3">
                            <MoneyInput
                              etiqueta={textos.monto}
                              ayuda={textos.ayudaDelAhorroFijo}
                              value={monto}
                              error={erroresDelLugar.monto}
                              onChange={(nuevo) => {
                                setMonto(nuevo);
                                setErroresDelLugar({});
                              }}
                            />
                          </div>
                        )}
                        {elegida && opcion.id === 'reparto' && (
                          <div className="px-3.5 pb-3">
                            <Campo
                              etiqueta={textos.porcentajeDeLoQueSobra}
                              inputMode="decimal"
                              autoComplete="off"
                              value={porcentajeDelReparto}
                              ayuda={fraseDelLibre(
                                libre,
                                porcentajeDelReparto,
                                nombreDe(laFila.superavit),
                              )}
                              error={erroresDelLugar.porcentaje}
                              onChange={(evento) => {
                                setPorcentajeDelReparto(evento.target.value);
                                setErroresDelLugar({});
                              }}
                            />
                          </div>
                        )}
                        {donde !== null && (
                          <p className="px-3.5 pb-3 text-meta text-text-3">{donde}</p>
                        )}
                      </div>
                    );
                  })}
                </fieldset>
              )}
            </>
          )}
        </div>

        <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
          <FilaDeAcciones>
            <Button type="submit" disabled={tipo === null}>
              {textos.crear}
            </Button>
          </FilaDeAcciones>
        </footer>
      </form>
    </Hoja>
  );
}

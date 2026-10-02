import { asientosDelLibro } from '@maun/domain';
import { useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';

import {
  agruparPorDia,
  FichaDelMovimiento,
  filtrarLineas,
  filtroInicial,
  hayFiltroPuesto,
  lineasDelTaller,
  ListaDelLibro,
  mesesConMovimiento,
  resumenMensual,
  tesorosConMovimientoEn,
  TODOS_LOS_MESES,
  TODOS_LOS_TESOROS,
  useMovimientosEnVuelo,
  type FiltroDelLibro,
  type LineaDelTaller,
  type SentidoDeLinea,
} from '@/entities/movimiento';
import { useLiquidacionesEnVuelo } from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { tesorosDelTaller } from '@/entities/tesoro';
import { datosDelLibro } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import {
  conFondo,
  hoyLocal,
  mesAnterior,
  mesDeLaFecha,
  mesEnUnaFrase,
  nombreDelMes,
  PARAMETRO_DE_TESORO,
  parametroDelTesoro,
  rutaDelMovimiento,
  RUTA_DE_MOVIMIENTO_NUEVO,
  tesoroDelParametro,
  TINTA,
  useIr,
} from '@/shared/lib';
import {
  Button,
  ComparacionMensual,
  ConSalida,
  EstadoVacio,
  Icono,
  Pagina,
  PrincipalYApoyo,
} from '@/shared/ui';

import { tesorosDeLosChips } from '../model/chips';

const SENTIDOS: readonly (SentidoDeLinea | 'todos')[] = ['todos', 'entra', 'sale', 'mueve'];

function Chip({
  activo,
  etiqueta,
  punto,
  talCual = false,
  alElegir,
}: {
  activo: boolean;
  etiqueta: string;
  punto?: string;
  talCual?: boolean;
  alElegir: () => void;
}) {
  return (
    <button
      type="button"
      translate={talCual ? 'no' : undefined}
      aria-pressed={activo}
      onClick={alElegir}
      className={`apretable flex min-h-tap items-center gap-2 rounded-pill border px-3 text-label font-medium ${
        activo ? 'border-ink bg-ink text-paper' : 'border-hairline bg-paper text-ink'
      }`}
    >
      {punto !== undefined && (
        <span aria-hidden className={`size-2 rounded-pill ${activo ? 'bg-paper' : punto}`} />
      )}
      {etiqueta}
    </button>
  );
}

export function FinanzasPage() {
  const m = useMensajes();
  const textos = m.paginaFinanzas;
  const replica = useReplicaDelTaller();
  const ir = useIr();
  const location = useLocation();
  const hoy = hoyLocal();
  const mes = mesDeLaFecha(hoy);

  function abrirHoja(ruta: string) {
    ir(ruta, { state: conFondo(location) });
  }

  const [parametros, setParametros] = useSearchParams();
  const [resto, setResto] = useState<Omit<FiltroDelLibro, 'tesoro'>>(() => {
    const { sentido, mes: mesInicial, texto } = filtroInicial(mes);
    return { sentido, mes: mesInicial, texto };
  });

  const tesoros = useMemo(() => tesorosDelTaller(replica), [replica]);
  const pedido = tesoroDelParametro(parametros.get(PARAMETRO_DE_TESORO));
  const elegido = tesoros.find((tesoro) => tesoro.id === pedido || tesoro.clave === pedido);
  const filtro: FiltroDelLibro = { ...resto, tesoro: elegido?.id ?? TODOS_LOS_TESOROS };
  const [ficha, setFicha] = useState<LineaDelTaller | null>(null);

  const enVuelo = useMovimientosEnVuelo();
  const liquidaciones = useLiquidacionesEnVuelo();

  const lineas = useMemo(() => lineasDelTaller(replica, tesoros), [replica, tesoros]);
  const visibles = filtrarLineas(lineas, filtro);
  const dias = agruparPorDia(visibles, filtro.tesoro);
  const meses = mesesConMovimiento(lineas, mes);
  const chips = tesorosDeLosChips(
    tesoros,
    tesorosConMovimientoEn(lineas, filtro.mes),
    filtro.tesoro,
  );

  const asientos = useMemo(() => asientosDelLibro(datosDelLibro(replica)), [replica]);
  const actual = resumenMensual(asientos, mes);
  const previo = resumenMensual(asientos, mesAnterior(mes));

  const conFiltro = hayFiltroPuesto(filtro, mes);
  const cambiar = ({ tesoro, ...otros }: Partial<FiltroDelLibro>) => {
    if (Object.keys(otros).length > 0) setResto((previo) => ({ ...previo, ...otros }));
    if (tesoro === undefined) return;
    const nuevo = tesoros.find((uno) => uno.id === tesoro);
    setParametros(
      (previos) => {
        const siguientes = new URLSearchParams(previos);
        if (nuevo === undefined) siguientes.delete(PARAMETRO_DE_TESORO);
        else siguientes.set(PARAMETRO_DE_TESORO, parametroDelTesoro(nuevo));
        return siguientes;
      },
      { replace: true },
    );
  };

  function abrir(linea: LineaDelTaller) {
    if (linea.bloqueo === null) {
      abrirHoja(rutaDelMovimiento(linea.asientoId));
      return;
    }
    setFicha(linea);
  }

  function sinConfirmar(linea: LineaDelTaller): boolean {
    if (linea.origen === 'manual') return enVuelo.has(linea.asientoId);
    if (linea.origen !== 'distribucion' && linea.origen !== 'reparto') return false;
    return liquidaciones.some((liquidacion) => liquidacion.proyectoId === linea.proyectoId);
  }

  return (
    <Pagina className="gap-3 md:gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-h1 leading-tight lg:text-h1-lg">{textos.titulo}</h1>
        <Button
          onClick={() => {
            abrirHoja(RUTA_DE_MOVIMIENTO_NUEVO);
          }}
        >
          <Icono nombre="plus" tamano={18} />
          {textos.cargarMovimiento}
        </Button>
      </header>

      <PrincipalYApoyo
        apoyoPrimero
        amplio
        separacion="gap-y-3 @min-[40rem]/apoyo:gap-y-4"
        apoyo={
          <ComparacionMensual
            titulo={textos.contra(nombreDelMes(mes), mesEnUnaFrase(mesAnterior(mes)))}
            etiquetaPrevia={mesEnUnaFrase(mesAnterior(mes))}
            etiquetaActual={mesEnUnaFrase(mes)}
            barras={[
              {
                id: 'entro-hogar',
                etiqueta: m.movimiento.resumenDelMes.entroAlHogar,
                previo: previo.entroHogar,
                actual: actual.entroHogar,
                tono: 'text-hogar',
              },
              {
                id: 'gasto-hogar',
                etiqueta: m.movimiento.resumenDelMes.gastoElHogar,
                previo: previo.gastoHogar,
                actual: actual.gastoHogar,
                tono: 'text-ink',
                mejorSiBaja: true,
              },
              {
                id: 'facturo-taller',
                etiqueta: m.movimiento.resumenDelMes.facturoElTaller,
                previo: previo.facturoTaller,
                actual: actual.facturoTaller,
                tono: 'text-maun',
              },
            ]}
          />
        }
      >
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="contents @min-[52rem]/apoyo:flex @min-[52rem]/apoyo:flex-wrap @min-[52rem]/apoyo:items-center @min-[52rem]/apoyo:gap-2">
                <Chip
                  activo={filtro.tesoro === TODOS_LOS_TESOROS}
                  etiqueta={textos.todos}
                  alElegir={() => {
                    cambiar({ tesoro: TODOS_LOS_TESOROS });
                  }}
                />
                {chips.map((tesoro) => (
                  <Chip
                    key={tesoro.id}
                    activo={filtro.tesoro === tesoro.id}
                    etiqueta={tesoro.nombre}
                    punto={TINTA[tesoro.tinta].fondo}
                    talCual
                    alElegir={() => {
                      cambiar({ tesoro: tesoro.id });
                    }}
                  />
                ))}
              </div>
              <span aria-hidden className="mx-0.5 h-6 w-px bg-hairline @min-[52rem]/apoyo:hidden" />
              <div className="contents @min-[52rem]/apoyo:flex @min-[52rem]/apoyo:flex-wrap @min-[52rem]/apoyo:items-center @min-[52rem]/apoyo:gap-2">
                {SENTIDOS.map((sentido) => (
                  <Chip
                    key={sentido}
                    activo={filtro.sentido === sentido}
                    etiqueta={textos.sentidos[sentido]}
                    alElegir={() => {
                      cambiar({ sentido });
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="flex h-field min-w-0 grow basis-[18rem] items-center gap-2 rounded-pill border border-hairline bg-paper px-3.5">
                <span aria-hidden className="flex-none text-text-2">
                  <Icono nombre="search" tamano={16} />
                </span>
                <input
                  value={filtro.texto}
                  aria-label={textos.buscarEnElLibro}
                  placeholder={textos.buscarPorLoQueAnotaste}
                  onChange={(evento) => {
                    cambiar({ texto: evento.target.value });
                  }}
                  className="min-w-0 flex-1 border-0 bg-transparent text-body text-ink outline-none"
                />
              </label>
              <select
                value={filtro.mes}
                aria-label={textos.mes}
                onChange={(evento) => {
                  cambiar({ mes: evento.target.value });
                }}
                className="h-field max-w-full rounded-pill border border-hairline bg-paper px-4 text-body text-ink"
              >
                {meses.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {textos.mesYAnio(nombreDelMes(opcion), opcion.slice(0, 4))}
                  </option>
                ))}
                <option value={TODOS_LOS_MESES}>{textos.todosLosMeses}</option>
              </select>
            </div>
          </div>

          {visibles.length === 0 ? (
            conFiltro ? (
              <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-border px-5 py-6 text-center">
                <h2 className="text-section font-semibold">{textos.nadaConEsosFiltros}</h2>
                <p className="text-body leading-relaxed text-text-2">{textos.probaConOtroMes}</p>
                <Button
                  variant="secundario"
                  onClick={() => {
                    cambiar(filtroInicial(mes));
                  }}
                >
                  {textos.limpiarLosFiltros}
                </Button>
              </div>
            ) : (
              <EstadoVacio
                ilustracion="sin-movimientos"
                titulo={textos.todaviaNoHayMovimientos}
                detalle={textos.cargaElPrimerGasto}
              >
                <Button
                  onClick={() => {
                    abrirHoja(RUTA_DE_MOVIMIENTO_NUEVO);
                  }}
                >
                  {textos.cargarElPrimero}
                </Button>
              </EstadoVacio>
            )
          ) : (
            <ListaDelLibro
              dias={dias}
              tesoro={filtro.tesoro}
              hoy={hoy}
              sinConfirmar={sinConfirmar}
              alAbrir={abrir}
            />
          )}
        </div>
      </PrincipalYApoyo>

      <ConSalida valor={ficha}>
        {(linea) => (
          <FichaDelMovimiento
            linea={linea}
            hoy={hoy}
            alCerrar={() => {
              setFicha(null);
            }}
          />
        )}
      </ConSalida>
    </Pagina>
  );
}

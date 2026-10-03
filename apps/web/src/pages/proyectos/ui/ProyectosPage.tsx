import { type EstadoProyecto, type Fase } from '@maun/domain';
import { useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';

import { EnlaceACliente } from '@/entities/cliente';
import {
  buscarProyectos,
  CRITERIOS,
  EntregaRelativa,
  ESTADO,
  EstadoBadge,
  MarcaDeLiquidacion,
  MarcaDeListo,
  ETAPAS,
  FILTROS_POR_ETAPA,
  filtrarPorEstado,
  filtrarPorEtapa,
  metricasDeProyectos,
  ordenarProyectos,
  ORDEN_POR_DEFECTO,
  resumenesDeProyectos,
  RUTA_DE_CONTACTO_NUEVO,
  RUTA_DE_PROYECTO_NUEVO,
  rutaDelProyecto,
  TarjetaDeProyecto,
  TarjetasDeProyectos,
  type ResumenDeProyecto,
} from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { useMensajes } from '@/shared/idioma';
import {
  alternar,
  conFondo,
  formatearLaPlata,
  hoyLocal,
  useAnchoDePantalla,
  type Sentido,
  Ir,
  useIr,
} from '@/shared/lib';
import { Button, ConSalida, EstadoVacio, Hoja, Icono, Pagina } from '@/shared/ui';

import { AccesoAlAnalitico } from './AccesoAlAnalitico';
import { ListaDeConsultas } from './ListaDeConsultas';
import { ListaDeSeguimiento } from './ListaDeSeguimiento';

function etapaDeLaRuta(pathname: string, busqueda: URLSearchParams): Fase {
  if (pathname === '/consultas') return 'consultas';
  const pedida = busqueda.get('etapa');
  if (pedida === 'historial' || pedida === 'seguimiento') return pedida;
  return 'activos';
}

function Metricas({ resumenes }: { resumenes: readonly ResumenDeProyecto[] }) {
  const textos = useMensajes().paginaProyectos.lista.metricas;
  const metricas = metricasDeProyectos(resumenes);
  const filas = [
    { clave: 'proyectos', valor: metricas.total, etiqueta: textos.proyectos },
    { clave: 'en-curso', valor: metricas.enCurso, etiqueta: textos.enCurso },
    {
      clave: 'entregados-con-saldo',
      valor: metricas.entregadosConSaldo,
      etiqueta: textos.entregadosConSaldo,
    },
    { clave: 'cobrados', valor: metricas.cobrados, etiqueta: textos.cobrados },
  ];

  return (
    <div className="@container">
      <dl className="grid grid-cols-2 gap-y-3 rounded-panel border border-hairline bg-paper py-3 @min-[22rem]:grid-cols-4 @min-[22rem]:gap-y-0 @min-[22rem]:divide-x @min-[22rem]:divide-hairline-soft">
        {filas.map((fila) => (
          <div key={fila.clave} className="min-w-0 px-3">
            <dd translate="no" className="text-money-lg leading-tight font-semibold tabular-nums">
              {fila.valor}
            </dd>
            <dt className="mt-0.5 text-meta leading-snug text-text-2">{fila.etiqueta}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Tarjeta({ resumen, hoy }: { resumen: ResumenDeProyecto; hoy: string }) {
  const { comun } = useMensajes().paginaProyectos;
  const { proyecto } = resumen;

  return (
    <TarjetaDeProyecto
      resumen={resumen}
      cliente={
        resumen.cliente === undefined ? (
          <span translate="no" className="text-meta text-text-3">
            {resumen.nombreDelCliente}
          </span>
        ) : (
          <EnlaceACliente
            id={resumen.cliente.id}
            nombre={resumen.cliente.nombre}
            className="-my-2 py-2 pr-3 text-meta font-medium text-text-2"
          />
        )
      }
    >
      <div className="@container">
        <dl className="grid grid-cols-2 gap-2 tabular-nums @min-[23rem]:grid-cols-3">
          <div>
            <dt className="text-meta text-text-3">{comun.presupuesto}</dt>
            <dd translate="no" className="text-body font-medium">
              {proyecto.presupuesto_centavos === null ? '—' : formatearLaPlata(resumen.precio)}
            </dd>
          </div>
          <div>
            <dt className="text-meta text-text-3">{comun.cobrado}</dt>
            <dd translate="no" className="text-body font-medium">
              {formatearLaPlata(resumen.cobradoEnSuMoneda)}
            </dd>
          </div>
          <div>
            <dt className="text-meta text-text-3">{comun.saldo}</dt>
            <dd
              translate={resumen.saldo !== null && resumen.saldo.importe <= 0 ? undefined : 'no'}
              className={`text-body font-semibold ${
                resumen.saldo === null
                  ? 'text-text-3'
                  : resumen.saldo.importe > 0
                    ? 'text-ink'
                    : 'text-hogar'
              }`}
            >
              {resumen.saldo === null
                ? '—'
                : resumen.saldo.importe > 0
                  ? formatearLaPlata(resumen.saldo)
                  : comun.sinSaldo}
            </dd>
          </div>
        </dl>
      </div>

      <div className="text-label">
        <EntregaRelativa entrega={resumen.entrega} urgencia={resumen.urgencia} hoy={hoy} />
      </div>
    </TarjetaDeProyecto>
  );
}

function Tabla({
  filas,
  hoy,
  orden,
  sentido,
  alOrdenar,
}: {
  filas: readonly ResumenDeProyecto[];
  hoy: string;
  orden: string;
  sentido: Sentido;
  alOrdenar: (id: string) => void;
}) {
  const { comun } = useMensajes().paginaProyectos;
  return (
    <div className="rounded-panel border border-hairline bg-paper px-1.5">
      <table className="w-full border-collapse text-body">
        <thead>
          <tr>
            {CRITERIOS.map((criterio, indice) => {
              const activo = criterio.id === orden;
              const aLaDerecha = criterio.tipo === 'numero';
              return (
                <th
                  key={criterio.id}
                  scope="col"
                  aria-sort={activo ? (sentido === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className="border-b border-hairline p-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      alOrdenar(criterio.id);
                    }}
                    className={`flex h-10 w-full items-center gap-1.5 px-2.5 text-meta whitespace-nowrap hover:bg-surface ${
                      aLaDerecha ? 'justify-end' : 'justify-start'
                    } ${activo ? 'bg-surface font-semibold text-ink' : 'font-medium text-text-3'} ${
                      indice === 0 ? 'rounded-tl-[14px]' : ''
                    } ${indice === CRITERIOS.length - 1 ? 'rounded-tr-[14px]' : ''}`}
                  >
                    {criterio.etiqueta}
                    <Icono
                      nombre={
                        activo ? (sentido === 'asc' ? 'arrow-up' : 'arrow-down') : 'arrow-up-down'
                      }
                      tamano={14}
                      grosor={activo ? 2.25 : 1.5}
                    />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {filas.map((resumen) => (
            <tr
              key={resumen.proyecto.id}
              className="h-13 border-t border-hairline-soft hover:bg-surface-3"
            >
              <td className="px-2.5 whitespace-nowrap">
                {resumen.cliente === undefined ? (
                  <span translate="no" className="text-text-3">
                    {resumen.nombreDelCliente}
                  </span>
                ) : (
                  <EnlaceACliente id={resumen.cliente.id} nombre={resumen.cliente.nombre} />
                )}
              </td>
              <td className="w-full max-w-0 px-2.5">
                <Ir
                  a={rutaDelProyecto(resumen.proyecto.id)}
                  translate="no"
                  className="block truncate font-medium"
                  title={resumen.proyecto.titulo}
                >
                  {resumen.proyecto.titulo}
                </Ir>
              </td>
              <td translate="no" className="px-2.5 text-right tabular-nums whitespace-nowrap">
                {resumen.proyecto.presupuesto_centavos === null
                  ? '—'
                  : formatearLaPlata(resumen.precio)}
              </td>
              <td translate="no" className="px-2.5 text-right tabular-nums whitespace-nowrap">
                {formatearLaPlata(resumen.cobradoEnSuMoneda)}
              </td>
              <td
                translate={resumen.saldo !== null && resumen.saldo.importe <= 0 ? undefined : 'no'}
                className={`px-2.5 text-right font-semibold tabular-nums whitespace-nowrap ${
                  resumen.saldo === null
                    ? 'text-text-3'
                    : resumen.saldo.importe > 0
                      ? 'text-ink'
                      : 'text-hogar'
                }`}
              >
                {resumen.saldo === null
                  ? '—'
                  : resumen.saldo.importe > 0
                    ? formatearLaPlata(resumen.saldo)
                    : comun.sinSaldo}
              </td>
              <td className="px-2.5 whitespace-nowrap">
                <EntregaRelativa
                  entrega={resumen.entrega}
                  urgencia={resumen.urgencia}
                  hoy={hoy}
                  conFecha
                />
              </td>
              <td className="px-2.5 whitespace-nowrap">
                <span className="flex flex-col items-start gap-1">
                  <span className="flex items-center gap-1.5">
                    <EstadoBadge estado={resumen.proyecto.estado} />
                    <MarcaDeListo proyecto={resumen.proyecto} />
                  </span>
                  <MarcaDeLiquidacion proyectoId={resumen.proyecto.id} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HojaDeOrden({
  orden,
  alElegir,
  alCerrar,
}: {
  orden: string;
  alElegir: (id: string) => void;
  alCerrar: () => void;
}) {
  const textos = useMensajes().paginaProyectos.lista;
  return (
    <Hoja titulo={textos.ordenarPor} desdeAbajo alCerrar={alCerrar}>
      <div className="px-5 pt-1 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {CRITERIOS.map((criterio) => (
          <button
            key={criterio.id}
            type="button"
            onClick={() => {
              alElegir(criterio.id);
            }}
            className={`flex min-h-[48px] w-full items-center justify-between border-b border-hairline-soft text-left text-body-lg ${
              criterio.id === orden ? 'font-semibold' : ''
            }`}
          >
            {criterio.etiqueta}
            {criterio.id === orden && <Icono nombre="check" tamano={18} />}
          </button>
        ))}
      </div>
    </Hoja>
  );
}

function Vacio({ etapa }: { etapa: Exclude<Fase, 'consultas' | 'seguimiento'> }) {
  const ir = useIr();
  const textos = useMensajes().paginaProyectos.lista;
  const texto = textos.vacio[etapa];

  return (
    <EstadoVacio
      ilustracion={etapa === 'activos' ? 'sin-proyectos' : 'sin-historial'}
      titulo={texto.titulo}
      detalle={texto.detalle}
    >
      <Button
        onClick={() => {
          ir(RUTA_DE_PROYECTO_NUEVO);
        }}
      >
        {textos.cargarUnProyecto}
      </Button>
    </EstadoVacio>
  );
}

export function ProyectosPage() {
  const replica = useReplicaDelTaller();
  const ir = useIr();
  const location = useLocation();
  const { pathname } = location;
  const [busqueda] = useSearchParams();
  const ancho = useAnchoDePantalla();
  const { comun, lista: textos } = useMensajes().paginaProyectos;

  const [consulta, setConsulta] = useState('');
  const [filtro, setFiltro] = useState<EstadoProyecto | 'todos'>('todos');
  const [orden, setOrden] = useState(ORDEN_POR_DEFECTO);
  const [sentido, setSentido] = useState<Sentido>('asc');
  const [hojaAbierta, setHojaAbierta] = useState(false);

  const hoy = hoyLocal();
  const etapa = etapaDeLaRuta(pathname, busqueda);
  const resumenes = useMemo(() => resumenesDeProyectos(replica, hoy), [replica, hoy]);
  const deLaEtapa = useMemo(() => filtrarPorEtapa(resumenes, etapa), [resumenes, etapa]);

  const filas = useMemo(
    () =>
      ordenarProyectos(
        buscarProyectos(filtrarPorEstado(deLaEtapa, filtro), consulta),
        orden,
        sentido,
      ),
    [deLaEtapa, filtro, consulta, orden, sentido],
  );

  const buscando = consulta.trim() !== '';
  const enEscritorio = ancho === 'escritorio';

  function ordenarPor(id: string): void {
    if (id === orden) {
      setSentido(alternar(sentido));
      return;
    }
    const criterio = CRITERIOS.find((uno) => uno.id === id);
    setOrden(id);
    setSentido(criterio?.inicial ?? 'asc');
  }

  return (
    <Pagina className="gap-3 md:gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-h1 leading-tight lg:text-h1-lg">{comun.proyectos}</h1>
        {etapa === 'consultas' || etapa === 'seguimiento' ? (
          <Button
            onClick={() => {
              ir(RUTA_DE_CONTACTO_NUEVO, { state: conFondo(location) });
            }}
          >
            <Icono nombre="user-plus" tamano={18} />
            {textos.cargarContacto}
          </Button>
        ) : (
          <Button
            onClick={() => {
              ir(RUTA_DE_PROYECTO_NUEVO);
            }}
          >
            <Icono nombre="plus" tamano={18} />
            {textos.nuevoProyecto}
          </Button>
        )}
      </header>

      <div className="@container max-w-[640px]">
        <div
          role="tablist"
          aria-label={textos.etapa}
          className="grid grid-cols-2 gap-1 rounded-panel bg-ink/6 p-1 @min-[34rem]:grid-cols-4"
        >
          {ETAPAS.map((opcion) => {
            const activa = opcion.id === etapa;
            const cuantos = resumenes.filter((resumen) => resumen.fase === opcion.id).length;
            return (
              <button
                key={opcion.id}
                type="button"
                role="tab"
                aria-selected={activa}
                onClick={() => {
                  ir(opcion.ruta);
                }}
                className={`relative flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-[16px] text-label whitespace-nowrap ${
                  activa ? 'font-semibold text-ink' : 'font-medium text-text-2'
                }`}
              >
                {activa && (
                  <span
                    aria-hidden
                    data-fondo-de-la-pestana
                    className="absolute inset-0 rounded-[16px] bg-elevado shadow-float"
                  />
                )}
                <span data-etiqueta-de-la-pestana className="relative flex items-center gap-1.5">
                  {opcion.etiqueta}
                  <span translate="no" className="text-meta text-text-3 tabular-nums">
                    {cuantos}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div data-bajo-las-pestanas className="flex flex-col gap-3 md:gap-4">
        {etapa === 'historial' && <AccesoAlAnalitico replica={replica} />}

        {etapa === 'consultas' ? (
          <ListaDeConsultas resumenes={deLaEtapa} replica={replica} hoy={hoy} />
        ) : etapa === 'seguimiento' ? (
          <ListaDeSeguimiento resumenes={deLaEtapa} replica={replica} hoy={hoy} />
        ) : deLaEtapa.length === 0 ? (
          <Vacio etapa={etapa} />
        ) : (
          <>
            <Metricas resumenes={resumenes} />

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-9 w-full items-center gap-2 rounded-pill border border-hairline bg-paper px-3.5 md:w-auto md:max-w-[320px] md:min-w-[180px] md:flex-1">
                <Icono nombre="search" tamano={16} className="flex-none text-text-2" />
                <input
                  type="search"
                  value={consulta}
                  onChange={(evento) => {
                    setConsulta(evento.target.value);
                  }}
                  placeholder={textos.buscarPorCliente}
                  aria-label={textos.buscarPorCliente}
                  className="min-w-0 flex-1 bg-transparent text-label outline-none"
                />
              </label>

              {(['todos', ...FILTROS_POR_ETAPA[etapa]] as const).map((estado) => {
                const activo = filtro === estado;
                return (
                  <button
                    key={estado}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => {
                      setFiltro(estado);
                    }}
                    className={`apretable h-9 rounded-pill border px-3.5 text-label font-medium ${
                      activo ? 'border-ink bg-ink text-paper' : 'border-hairline bg-paper text-ink'
                    }`}
                  >
                    {estado === 'todos' ? comun.todos : ESTADO[estado].etiqueta}
                  </button>
                );
              })}

              {!enEscritorio && (
                <button
                  type="button"
                  onClick={() => {
                    setHojaAbierta(true);
                  }}
                  className="ml-auto flex h-9 items-center gap-1.5 rounded-pill border border-hairline bg-paper px-3.5 text-label font-medium"
                >
                  <Icono nombre="arrow-up-down" tamano={14} />
                  {CRITERIOS.find((criterio) => criterio.id === orden)?.etiqueta ?? textos.ordenar}
                </button>
              )}
            </div>

            {filas.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-border px-5 py-6 text-center">
                <p className="text-body-lg text-text-2">
                  {buscando ? textos.ningunoCoincide(consulta) : textos.ningunoEnEseEstado}
                </p>
                <Button
                  variant="secundario"
                  onClick={() => {
                    setConsulta('');
                    setFiltro('todos');
                  }}
                >
                  {comun.limpiarLaBusqueda}
                </Button>
              </div>
            ) : enEscritorio ? (
              <Tabla
                filas={filas}
                hoy={hoy}
                orden={orden}
                sentido={sentido}
                alOrdenar={ordenarPor}
              />
            ) : (
              <TarjetasDeProyectos etiqueta={comun.proyectos}>
                {filas.map((resumen) => (
                  <Tarjeta key={resumen.proyecto.id} resumen={resumen} hoy={hoy} />
                ))}
              </TarjetasDeProyectos>
            )}
          </>
        )}
      </div>

      <ConSalida valor={hojaAbierta}>
        {() => (
          <HojaDeOrden
            orden={orden}
            alElegir={(id) => {
              ordenarPor(id);
              setHojaAbierta(false);
            }}
            alCerrar={() => {
              setHojaAbierta(false);
            }}
          />
        )}
      </ConSalida>
    </Pagina>
  );
}

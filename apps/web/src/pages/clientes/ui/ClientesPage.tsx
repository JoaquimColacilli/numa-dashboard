import { useMemo, useState } from 'react';

import {
  buscarClientes,
  corteDeOrigenes,
  iniciales,
  ordenarClientes,
  ORDENES,
  resumenesDeClientes,
  rutaDelCliente,
  type Orden,
  type ResumenDeCliente,
} from '@/entities/cliente';
import { useReplicaDelTaller } from '@/entities/replica';
import { HojaDeCliente } from '@/features/editar-cliente';
import { useMensajes, type Mensajes } from '@/shared/idioma';
import { formatearPesos, relativa, useIr } from '@/shared/lib';
import { Button, ConSalida, EstadoVacio, FondoDelElegido, Icono, Pagina } from '@/shared/ui';

function detalleDe(m: Mensajes, resumen: ResumenDeCliente, hoy: string): string {
  const partes: string[] = [];
  if (resumen.cliente.zona !== '') partes.push(resumen.cliente.zona);
  if (resumen.ultimo && resumen.fechaDelUltimo !== undefined) {
    partes.push(
      m.paginaClientes.ultimoTrabajo(resumen.ultimo.titulo, relativa(resumen.fechaDelUltimo, hoy)),
    );
  } else if (resumen.proyectos.length === 0) {
    partes.push(m.paginaClientes.sinTrabajosTodavia);
  }
  return partes.join(' · ');
}

function Fila({ resumen, hoy }: { resumen: ResumenDeCliente; hoy: string }) {
  const m = useMensajes();
  const textos = m.paginaClientes;
  const ir = useIr();
  const { cliente } = resumen;

  return (
    <li className="border-t border-hairline-soft first:border-t-0">
      <button
        type="button"
        onClick={() => {
          ir(rutaDelCliente(cliente.id));
        }}
        className="grid min-h-[64px] w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 py-3 text-left hover:bg-surface lg:grid-cols-[40px_minmax(0,2fr)_minmax(0,1.4fr)_140px_120px]"
      >
        <span className="flex size-10 items-center justify-center rounded-pill bg-surface text-meta font-semibold">
          {iniciales(cliente.nombre)}
        </span>
        <span className="min-w-0">
          <span translate="no" className="block truncate text-body-lg font-medium">
            {cliente.nombre}
          </span>
          <span className="block truncate text-meta text-text-2">{detalleDe(m, resumen, hoy)}</span>
        </span>
        <span className="hidden truncate text-meta text-text-2 lg:block">
          {resumen.fechaDelUltimo === undefined
            ? textos.sinTrabajos
            : relativa(resumen.fechaDelUltimo, hoy)}
        </span>
        <span
          translate="no"
          className="hidden text-right text-body font-medium tabular-nums lg:block"
        >
          {resumen.facturado > 0 ? formatearPesos(resumen.facturado) : '—'}
        </span>
        <span className="text-right whitespace-nowrap">
          {resumen.saldo > 0 ? (
            <span className="inline-block rounded-pill bg-atencion-tint px-2 py-0.5 text-badge font-semibold text-atencion tabular-nums">
              {textos.debe(formatearPesos(resumen.saldo))}
            </span>
          ) : (
            <Icono nombre="chevron-right" tamano={18} className="inline text-text-3" />
          )}
        </span>
      </button>
    </li>
  );
}

function DeDondeVienen({ resumenes }: { resumenes: readonly ResumenDeCliente[] }) {
  const textos = useMensajes().paginaClientes;
  const cortes = corteDeOrigenes(resumenes);
  const sinOrigen = resumenes.length - cortes.reduce((suma, corte) => suma + corte.cantidad, 0);
  if (cortes.length === 0) return null;

  return (
    <section
      aria-label={textos.deDondeVienen}
      className="rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-label font-semibold">{textos.deDondeVienen}</span>
        <span className="text-meta text-text-2 tabular-nums">
          {textos.clientes(resumenes.length)}
        </span>
      </div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-control">
        {cortes.map((corte) => (
          <div
            key={corte.id}
            style={{ flex: `${String(corte.cantidad)} 1 0` }}
            className={corte.color}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-meta text-text-2">
        {cortes.map((corte) => (
          <span key={corte.id} className="flex items-center gap-1.5">
            <span aria-hidden className={`size-2 rounded-[2px] ${corte.color}`} />
            {corte.etiqueta} <strong className="text-ink tabular-nums">{corte.cantidad}</strong>
          </span>
        ))}
        {sinOrigen > 0 && <span className="text-text-3">{textos.sinOrigen(sinOrigen)}</span>}
      </div>
    </section>
  );
}

export function ClientesPage() {
  const textos = useMensajes().paginaClientes;
  const replica = useReplicaDelTaller();
  const [consulta, setConsulta] = useState('');
  const [orden, setOrden] = useState<Orden>('nombre');
  const [abierta, setAbierta] = useState(false);

  const hoy = new Date().toISOString().slice(0, 10);
  const resumenes = useMemo(() => resumenesDeClientes(replica), [replica]);
  const filas = useMemo(
    () => ordenarClientes(buscarClientes(resumenes, consulta), orden),
    [resumenes, consulta, orden],
  );

  const buscando = consulta.trim() !== '';

  return (
    <Pagina className="gap-3 md:gap-4">
      <header className="flex items-end justify-between gap-3">
        <h1 className="font-display text-h1 leading-tight lg:text-h1-lg">{textos.titulo}</h1>
        <Button
          onClick={() => {
            setAbierta(true);
          }}
        >
          <Icono nombre="user-plus" tamano={18} />
          {textos.nuevoCliente}
        </Button>
      </header>

      {resumenes.length === 0 ? (
        <EstadoVacio
          ilustracion="sin-clientes"
          titulo={textos.vacioTitulo}
          detalle={textos.vacioDetalle}
        >
          <Button
            onClick={() => {
              setAbierta(true);
            }}
          >
            {textos.cargaTuPrimerCliente}
          </Button>
        </EstadoVacio>
      ) : (
        <>
          <label className="flex h-field max-w-full items-center gap-2 rounded-pill border border-hairline bg-paper px-3.5 md:max-w-[420px]">
            <Icono nombre="search" tamano={18} className="flex-none text-text-2" />
            <input
              type="search"
              value={consulta}
              onChange={(evento) => {
                setConsulta(evento.target.value);
              }}
              placeholder={textos.buscarPlaceholder}
              aria-label={textos.buscarCliente}
              className="min-w-0 flex-1 bg-transparent text-body-lg outline-none"
            />
          </label>

          <DeDondeVienen resumenes={resumenes} />

          <div className="@container">
            <div className="flex flex-col items-stretch gap-1.5 px-1 @min-[22rem]:flex-row @min-[22rem]:items-center @min-[22rem]:justify-between @min-[22rem]:gap-3">
              <span className="text-meta text-text-2 tabular-nums">
                {buscando
                  ? textos.deTantos(filas.length, resumenes.length)
                  : textos.clientes(resumenes.length)}
              </span>
              <div
                role="radiogroup"
                aria-label={textos.ordenarPor}
                className="relative grid grid-cols-3 gap-0.5 rounded-pill bg-ink/6 p-1 @min-[22rem]:flex"
              >
                <FondoDelElegido elegido={orden} />
                {ORDENES.map((opcion) => (
                  <button
                    key={opcion.id}
                    type="button"
                    role="radio"
                    aria-checked={orden === opcion.id}
                    data-opcion={opcion.id}
                    onClick={() => {
                      setOrden(opcion.id);
                    }}
                    className={`relative min-h-tap rounded-pill px-2 text-meta ${
                      orden === opcion.id ? 'font-semibold text-ink' : 'font-medium text-text-2'
                    }`}
                  >
                    {opcion.etiqueta}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filas.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-border px-5 py-6 text-center">
              <span className="text-body-lg text-text-2">{textos.nadieCoincide(consulta)}</span>
              <Button
                onClick={() => {
                  setAbierta(true);
                }}
              >
                {textos.crearComoNuevo(consulta.trim())}
              </Button>
            </div>
          ) : (
            <ul className="list-none rounded-panel border border-hairline bg-paper px-4">
              {filas.map((resumen) => (
                <Fila key={resumen.cliente.id} resumen={resumen} hoy={hoy} />
              ))}
            </ul>
          )}
        </>
      )}

      <ConSalida valor={abierta}>
        {() => (
          <HojaDeCliente
            nombreInicial={filas.length === 0 && buscando ? consulta.trim() : undefined}
            alCerrar={() => {
              setAbierta(false);
            }}
            alGuardar={() => {
              setConsulta('');
            }}
          />
        )}
      </ConSalida>
    </Pagina>
  );
}

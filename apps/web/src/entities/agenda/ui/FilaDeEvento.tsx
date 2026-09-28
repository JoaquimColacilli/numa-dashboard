import type {
  EventoDeLaAgenda,
  EventoDerivado,
  EventoPropio,
  EventoVencimiento,
} from '@maun/domain';

import { rutaDelCliente, rutaDelProyecto, useAnchoDePantalla, Ir } from '@/shared/lib';
import { Button, Icono } from '@/shared/ui';

import {
  detalleDelEvento,
  textoDeLoHecho,
  textoDelEvento,
  urgenciaDelEvento,
} from '../model/calendario';
import {
  CATEGORIA,
  DERIVADA,
  ESTA_COMPROMETIDA,
  FRANJA_DEL_EVENTO,
  VENCIMIENTO,
} from '../model/categorias';
import { sePuedeRegistrarElPago } from '../model/vencimientos';
import { CasillaDeAnotacion, MarcaConAnillo, MarcaDeCategoria } from './MarcaDeCategoria';

export interface AccionesDeLaAgenda {
  alAbrirTrabajo: (evento: EventoDerivado) => void;
  alTildar: (evento: EventoPropio) => void;
  alMarcar: (evento: EventoDeLaAgenda) => void;
  alBorrar: (evento: EventoPropio) => void;
  alRegistrar?: (evento: EventoDerivado) => void;
  alRegistrarElPago?: (evento: EventoVencimiento) => void;
  alAbrirVencimiento?: (evento: EventoVencimiento) => void;
  recienHecha?: string | null;
  alTerminarDeTachar?: () => void;
}

export interface FilaDeEventoProps {
  evento: EventoDeLaAgenda;
  hoy: string;
  acciones: AccionesDeLaAgenda;
  enElDia?: boolean;
  sinBorde?: boolean;
  alAbrirElDia?: (fecha: string) => void;
}

const ENLACE_EN_EL_DETALLE =
  'underline decoration-hairline underline-offset-2 hover:decoration-ink';

function DetalleConEnlaces({ evento }: { evento: EventoDeLaAgenda }) {
  if (evento.clase === 'propia') {
    if (evento.proyectoId === null || evento.proyecto === null) return <>{evento.proyecto ?? ''}</>;
    return (
      <Ir a={rutaDelProyecto(evento.proyectoId)} className={ENLACE_EN_EL_DETALLE}>
        {evento.proyecto}
      </Ir>
    );
  }
  if (evento.clase === 'vencimiento') return <>{detalleDelEvento(evento)}</>;
  const cliente = evento.cliente.trim();
  const lugar = evento.lugar.trim();
  return (
    <>
      {cliente !== '' && (
        <Ir a={rutaDelCliente(evento.clienteId)} className={ENLACE_EN_EL_DETALLE}>
          {cliente}
        </Ir>
      )}
      {cliente !== '' && lugar !== '' && ', '}
      {lugar}
    </>
  );
}

function Contenido({
  evento,
  hoy,
  enElDia,
  tachar = false,
  alTerminarDeTachar,
}: {
  evento: EventoDeLaAgenda;
  hoy: string;
  enElDia: boolean;
  tachar?: boolean;
  alTerminarDeTachar?: () => void;
}) {
  const categoria = CATEGORIA[evento.categoria];
  const urgencia = urgenciaDelEvento(evento, hoy);
  const detalle = detalleDelEvento(evento);
  const { hecha } = evento;
  const accion =
    evento.clase === 'derivada'
      ? DERIVADA[evento.categoria].accion
      : evento.clase === 'vencimiento'
        ? VENCIMIENTO.accion
        : null;

  return (
    <>
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {evento.hora !== null && (
          <span className="text-label font-semibold text-text-2 tabular-nums">{evento.hora}</span>
        )}
        {evento.clase === 'derivada' && evento.franja !== null && (
          <span className="text-label font-semibold text-text-2">
            {FRANJA_DEL_EVENTO[evento.franja]}
          </span>
        )}
        {accion !== null && (
          <span
            className={
              hecha
                ? 'text-label font-semibold text-text-3 line-through'
                : `text-body font-semibold ${categoria.texto}`
            }
          >
            {accion}
          </span>
        )}
        <span
          className={`leading-snug text-pretty ${
            hecha ? 'text-label text-text-3 line-through' : 'text-body text-ink'
          } ${tachar ? 'relative decoration-transparent' : ''}`}
        >
          {textoDelEvento(evento)}
          {tachar && (
            <span
              aria-hidden
              className="tachado-que-corre linea-del-tachado absolute inset-0"
              onAnimationEnd={alTerminarDeTachar}
            >
              {textoDelEvento(evento)}
            </span>
          )}
        </span>
        {hecha && <span className="sr-only">, {textoDeLoHecho(evento)}</span>}
      </span>
      {!hecha &&
        (detalle !== '' || (urgencia !== null && urgencia.tono !== 'normal') || enElDia) && (
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-label text-text-2">
            {detalle !== '' &&
              (enElDia ? (
                <span>
                  <DetalleConEnlaces evento={evento} />
                </span>
              ) : (
                <span className="max-w-full truncate">{detalle}</span>
              ))}
            {urgencia !== null && urgencia.tono !== 'normal' && (
              <span
                className={`font-semibold ${urgencia.tono === 'alerta' ? 'text-alerta' : 'text-atencion'}`}
              >
                {urgencia.texto}
              </span>
            )}
            {evento.clase === 'propia' && enElDia && (
              <span className="inline-flex items-center gap-1.5 text-text-3">
                <MarcaDeCategoria categoria={evento.categoria} tamano="chica" />
                {categoria.etiqueta}
              </span>
            )}
          </span>
        )}
    </>
  );
}

function BotonDeLaMarca({
  evento,
  acciones,
}: {
  evento: EventoDeLaAgenda;
  acciones: AccionesDeLaAgenda;
}) {
  return (
    <button
      type="button"
      aria-label={evento.importante ? 'Sacarle la marca de importante' : 'Marcar como importante'}
      aria-pressed={evento.importante}
      onClick={() => {
        acciones.alMarcar(evento);
      }}
      className={`flex size-9 items-center justify-center rounded-pill hover:bg-surface ${
        evento.importante ? 'text-ag-marca' : 'text-text-3'
      }`}
    >
      <Icono nombre="circle" tamano={16} grosor={2} />
    </button>
  );
}

function FilaDerivada({
  evento,
  hoy,
  acciones,
  enElDia,
  sinBorde,
}: {
  evento: EventoDerivado;
  hoy: string;
  acciones: AccionesDeLaAgenda;
  enElDia: boolean;
  sinBorde: boolean;
}) {
  const derivada = DERIVADA[evento.categoria];
  const conGrilla = useAnchoDePantalla() !== 'movil';
  const abrir = () => {
    acciones.alAbrirTrabajo(evento);
  };
  const registrar =
    evento.categoria === 'seguimiento' && acciones.alRegistrar !== undefined
      ? acciones.alRegistrar
      : undefined;

  return (
    <li
      data-derivada={evento.id}
      data-hecha={String(evento.hecha)}
      className={`flex gap-3 ${sinBorde ? '' : enElDia ? 'border-t' : 'border-t first:border-t-0'} border-hairline-soft ${
        evento.hecha ? 'items-center py-2' : 'items-start py-3'
      }`}
    >
      <MarcaConAnillo categoria={evento.categoria} importante={evento.importante} />
      {!enElDia ? (
        <button
          type="button"
          onClick={abrir}
          className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-field text-left"
        >
          <Contenido evento={evento} hoy={hoy} enElDia={false} />
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Contenido evento={evento} hoy={hoy} enElDia />
          {!evento.hecha && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-field bg-surface px-2.5 py-2 text-meta leading-snug text-text-2">
              <Icono nombre="link-2" tamano={14} />
              <span className="min-w-[10rem] flex-1">
                {evento.comprometida
                  ? ESTA_COMPROMETIDA
                  : `${derivada.origen}. ${
                      evento.categoria === 'seguimiento'
                        ? 'Cuando le escribas, registralo: ahí elegís si vuelve, si sigue con otra fecha o si no va.'
                        : conGrilla
                          ? 'Arrastrala en el mes para moverla, o cambiá la fecha ahí.'
                          : 'Para moverla, cambiá la fecha ahí.'
                    }`}
              </span>
              {registrar !== undefined && (
                <Button
                  size="chico"
                  onClick={() => {
                    registrar(evento);
                  }}
                >
                  Registrar el contacto
                </Button>
              )}
              <Button variant="secundario" size="chico" onClick={abrir}>
                {derivada.abrir}
              </Button>
            </div>
          )}
        </div>
      )}
      {enElDia ? (
        <span className="-my-1 flex flex-none gap-0.5">
          <BotonDeLaMarca evento={evento} acciones={acciones} />
          {evento.hecha && (
            <button
              type="button"
              aria-label={`${derivada.abrir}: ${evento.titulo}`}
              onClick={abrir}
              className="flex size-9 items-center justify-center rounded-pill text-text-3 hover:bg-surface hover:text-ink"
            >
              <Icono nombre="chevron-right" tamano={16} />
            </button>
          )}
        </span>
      ) : (
        <span aria-hidden className="mt-0.5 flex-none text-text-3">
          <Icono nombre="chevron-right" tamano={18} />
        </span>
      )}
    </li>
  );
}

function Pagado() {
  return (
    <span
      aria-hidden
      data-pagado
      className="flex flex-none items-center gap-1 text-meta font-semibold text-text-2"
    >
      <Icono nombre="check" tamano={14} grosor={2.25} />
      {VENCIMIENTO.pagado}
    </span>
  );
}

function FilaDeVencimiento({
  evento,
  hoy,
  acciones,
  enElDia,
  sinBorde,
  alAbrirElDia,
}: {
  evento: EventoVencimiento;
  hoy: string;
  acciones: AccionesDeLaAgenda;
  enElDia: boolean;
  sinBorde: boolean;
  alAbrirElDia?: (fecha: string) => void;
}) {
  const abrir = acciones.alAbrirVencimiento;
  const sePuede = sePuedeRegistrarElPago(evento, hoy);
  const registrar = sePuede ? acciones.alRegistrarElPago : undefined;
  const alTocar =
    abrir !== undefined
      ? () => {
          abrir(evento);
        }
      : alAbrirElDia === undefined
        ? undefined
        : () => {
            alAbrirElDia(evento.fecha);
          };
  const botonDelPago =
    registrar === undefined ? null : (
      <Button
        size="chico"
        variant={enElDia ? 'primario' : 'secundario'}
        onClick={() => {
          registrar(evento);
        }}
      >
        {VENCIMIENTO.registrar}
      </Button>
    );

  return (
    <li
      data-vencimiento={evento.id}
      data-hecha={String(evento.hecha)}
      className={`flex gap-3 ${sinBorde ? '' : enElDia ? 'border-t' : 'border-t first:border-t-0'} border-hairline-soft ${
        evento.hecha ? 'items-center py-2' : 'items-start py-3'
      }`}
    >
      <MarcaConAnillo categoria={evento.categoria} importante={false} />
      {!enElDia && alTocar !== undefined ? (
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <button
            type="button"
            onClick={alTocar}
            className="flex w-full min-w-0 flex-col items-start gap-0.5 rounded-field text-left"
          >
            <Contenido evento={evento} hoy={hoy} enElDia={false} />
          </button>
          {botonDelPago}
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Contenido evento={evento} hoy={hoy} enElDia={enElDia} />
          {enElDia && !evento.hecha && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-field bg-surface px-2.5 py-2 text-meta leading-snug text-text-2">
              <Icono nombre="link-2" tamano={14} />
              <span className="min-w-[10rem] flex-1">
                {VENCIMIENTO.origen}.{sePuede ? '' : ` ${VENCIMIENTO.masAdelante}`}
              </span>
              {botonDelPago}
              {abrir !== undefined && (
                <Button
                  variant="secundario"
                  size="chico"
                  onClick={() => {
                    abrir(evento);
                  }}
                >
                  {VENCIMIENTO.verEnTesoros}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {evento.hecha ? (
        <Pagado />
      ) : (
        !enElDia &&
        abrir !== undefined && (
          <span aria-hidden className="mt-0.5 flex-none text-text-3">
            <Icono nombre="chevron-right" tamano={18} />
          </span>
        )
      )}
    </li>
  );
}

export function FilaDeEvento({
  evento,
  hoy,
  acciones,
  enElDia = false,
  sinBorde = false,
  alAbrirElDia,
}: FilaDeEventoProps) {
  if (evento.clase === 'vencimiento') {
    return (
      <FilaDeVencimiento
        evento={evento}
        hoy={hoy}
        acciones={acciones}
        enElDia={enElDia}
        sinBorde={sinBorde}
        alAbrirElDia={alAbrirElDia}
      />
    );
  }

  if (evento.clase === 'derivada') {
    return (
      <FilaDerivada
        evento={evento}
        hoy={hoy}
        acciones={acciones}
        enElDia={enElDia}
        sinBorde={sinBorde}
      />
    );
  }

  const tachar = evento.hecha && acciones.recienHecha === evento.id;

  return (
    <li
      data-anotacion={evento.id}
      data-hecha={String(evento.hecha)}
      className={`flex gap-3 ${sinBorde ? '' : enElDia ? 'border-t' : 'border-t first:border-t-0'} border-hairline-soft ${
        evento.hecha ? 'items-center py-2' : 'items-start py-3'
      }`}
    >
      <CasillaDeAnotacion
        evento={evento}
        dibujar={tachar}
        alTildar={() => {
          acciones.alTildar(evento);
        }}
      />
      {enElDia || alAbrirElDia === undefined ? (
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Contenido
            evento={evento}
            hoy={hoy}
            enElDia={enElDia}
            tachar={tachar}
            alTerminarDeTachar={acciones.alTerminarDeTachar}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            alAbrirElDia(evento.fecha);
          }}
          className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-field text-left"
        >
          <Contenido
            evento={evento}
            hoy={hoy}
            enElDia={false}
            tachar={tachar}
            alTerminarDeTachar={acciones.alTerminarDeTachar}
          />
        </button>
      )}
      {enElDia && (
        <span className="-my-1 flex flex-none gap-0.5">
          <BotonDeLaMarca evento={evento} acciones={acciones} />
          <button
            type="button"
            aria-label={`Borrar «${evento.texto}»`}
            onClick={() => {
              acciones.alBorrar(evento);
            }}
            className="flex size-9 items-center justify-center rounded-pill text-text-3 hover:bg-surface hover:text-alerta"
          >
            <Icono nombre="trash-2" tamano={16} />
          </button>
        </span>
      )}
    </li>
  );
}

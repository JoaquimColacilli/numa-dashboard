import {
  armarRespuestaDeEntrega,
  ETIQUETAS_DE_IDIOMA,
  FRANJAS_DE_ENTREGA,
  LARGO_MAXIMO_DE_LA_NOTA,
  validarRespuestaDeEntrega,
  type DiaElegido,
  type FranjaDeEntrega,
  type RespuestaDeEntrega,
  type RespuestaDeEntregaParaMandar,
  type RespuestaDelCliente,
} from '@maun/domain';
import { useId, useRef, useState } from 'react';

import { useIdioma, useMensajes } from '@/shared/idioma';
import type { MensajesDelCliente } from '@/shared/idioma-del-cliente';
import { diaDeLaSemana, uuidv7 } from '@/shared/lib';
import { Button, Icono } from '@/shared/ui';

import {
  conElDia,
  conLaFranja,
  diasQueSiguenSirviendo,
  estaElegido,
  llegoAlMaximo,
  mesesDelCalendario,
} from '../model/calendario';
import type { CoordinacionConPedido, MandarLaEntrega, MotivoDelError } from '../model/mandar';
import { anuncioDeLoMandado, fechaConFranja, textoDelDiaElegido } from '../model/textos';
import { useEscritura } from './escritura';

export interface CoordinarLaEntregaProps {
  coordinacion: CoordinacionConPedido;
  hoy: string;
  alMandar?: MandarLaEntrega;
  alAnunciar: (texto: string) => void;
}

type Modo = 'propuesta' | 'calendario' | 'mandados';

type TextosDelCalendario = MensajesDelCliente['vista']['coordinar']['calendario'];

const TARJETA = 'rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5';

function diaParaLeer(fecha: string, calendario: TextosDelCalendario): string {
  return calendario.dia(
    diaDeLaSemana(fecha),
    Number(fecha.slice(8, 10)),
    Number(fecha.slice(5, 7)) - 1,
  );
}

function tituloDelMes(mes: string, calendario: TextosDelCalendario): string {
  return calendario.meses[Number(mes.slice(5, 7)) - 1] ?? '';
}

function modoInicial(coordinacion: CoordinacionConPedido): Modo {
  if (coordinacion.respuesta !== null) return 'mandados';
  return coordinacion.situacion === 'sus-dias' ? 'calendario' : 'propuesta';
}

function enfocar(elemento: HTMLElement | null): void {
  if (elemento === null) return;
  elemento.tabIndex = -1;
  elemento.focus();
}

function useDelDueno(): string {
  return ETIQUETAS_DE_IDIOMA[useIdioma()];
}

function Calendario({
  hoy,
  elegidos,
  alTocar,
}: {
  hoy: string;
  elegidos: readonly DiaElegido[];
  alTocar: (fecha: string) => void;
}) {
  const { calendario } = useEscritura(hoy).t.coordinar;
  const base = useId();
  const lleno = llegoAlMaximo(elegidos);
  return (
    <div className="flex flex-col gap-4">
      {mesesDelCalendario(hoy).map(({ mes, semanas }) => (
        <div key={mes} role="group" aria-labelledby={`${base}-${mes}`}>
          <h3 id={`${base}-${mes}`} className="mb-2 text-body font-semibold">
            {tituloDelMes(mes, calendario)}
          </h3>
          <div aria-hidden className="mb-1 grid grid-cols-7 gap-0.5">
            {calendario.iniciales.map((inicial, puesto) => (
              <span
                key={`${inicial}-${String(puesto)}`}
                className="text-center text-meta font-medium text-text-3 uppercase"
              >
                {inicial}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {semanas.flat().map((celda) => {
              if (celda.fuera) return <span key={celda.fecha} aria-hidden />;
              const numero = String(Number(celda.fecha.slice(8, 10)));
              if (!celda.sePuede) {
                return (
                  <span
                    key={celda.fecha}
                    aria-hidden
                    className="flex h-11 items-center justify-center text-body text-text-3 tabular-nums"
                  >
                    {numero}
                  </span>
                );
              }
              const elegido = estaElegido(elegidos, celda.fecha);
              const apagado = lleno && !elegido;
              return (
                <button
                  key={celda.fecha}
                  type="button"
                  aria-pressed={elegido}
                  aria-label={diaParaLeer(celda.fecha, calendario)}
                  disabled={apagado}
                  onClick={() => {
                    alTocar(celda.fecha);
                  }}
                  className={`flex h-11 w-full min-w-0 items-center justify-center rounded-field text-body tabular-nums transition-colors duration-(--dur-fast) ${
                    elegido
                      ? 'bg-ink font-semibold text-paper'
                      : apagado
                        ? 'cursor-not-allowed border border-hairline-soft text-text-3'
                        : 'border border-hairline bg-paper text-ink hover:border-ink'
                  }`}
                >
                  {numero}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function LosDiasElegidos({
  hoy,
  elegidos,
  alCambiarLaFranja,
  alSacar,
}: {
  hoy: string;
  elegidos: readonly DiaElegido[];
  alCambiarLaFranja: (fecha: string, franja: FranjaDeEntrega) => void;
  alSacar: (fecha: string) => void;
}) {
  const { coordinar } = useEscritura(hoy).t;
  if (elegidos.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-body font-semibold">{coordinar.tusDias}</h3>
      <ul className="list-none">
        {elegidos.map((dia) => {
          const leido = diaParaLeer(dia.fecha, coordinar.calendario);
          return (
            <li
              key={dia.fecha}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-hairline-soft py-2.5"
            >
              <span className="min-w-0 flex-1 basis-40 text-body font-medium first-letter:uppercase">
                {leido}
              </span>
              <span role="group" aria-label={coordinar.horarioDel(leido)} className="flex gap-1.5">
                {FRANJAS_DE_ENTREGA.map((franja) => {
                  const marcada = dia.franjas.includes(franja);
                  return (
                    <button
                      key={franja}
                      type="button"
                      aria-pressed={marcada}
                      onClick={() => {
                        alCambiarLaFranja(dia.fecha, franja);
                      }}
                      className={`min-h-tap rounded-pill border px-3.5 text-label font-medium transition-colors duration-(--dur-fast) ${
                        marcada
                          ? 'border-ink bg-ink text-paper'
                          : 'border-border bg-paper text-ink hover:bg-surface'
                      }`}
                    >
                      {coordinar.franjas[franja]}
                    </button>
                  );
                })}
              </span>
              <Button
                variant="herramienta"
                size="herramienta"
                aria-label={coordinar.sacar(leido)}
                title={coordinar.sacarEsteDia}
                onClick={() => {
                  alSacar(dia.fecha);
                }}
              >
                <Icono nombre="x" tamano={16} />
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LoQueMandaste({
  respuesta,
  hoy,
  enLaPrueba,
}: {
  respuesta: RespuestaDelCliente;
  hoy: string;
  enLaPrueba: string | null;
}) {
  const escritura = useEscritura(hoy);
  const { coordinar } = escritura.t;
  const delDueno = useDelDueno();
  if (respuesta.respuesta === 'me_queda_bien') {
    return enLaPrueba === null ? (
      <p className="mt-1 text-body leading-relaxed text-text-2">{coordinar.quedoConfirmada}</p>
    ) : (
      <p lang={delDueno} className="mt-1 text-body leading-relaxed text-text-2">
        {enLaPrueba}
      </p>
    );
  }
  return (
    <>
      <p className="mt-1 text-body leading-relaxed text-text-2">
        {respuesta.dias.length === 0 ? coordinar.laNotaMandada : coordinar.losDiasMandados}
      </p>
      {respuesta.dias.length > 0 && (
        <ul className="mt-2.5 list-none">
          {respuesta.dias.map((dia) => (
            <li
              key={dia.fecha}
              className="border-t border-hairline-soft py-2 text-body font-medium tabular-nums first-letter:uppercase"
            >
              {textoDelDiaElegido(dia, escritura)}
            </li>
          ))}
        </ul>
      )}
      {respuesta.nota.trim() !== '' && (
        <p
          translate="no"
          className="mt-2.5 rounded-field bg-surface-3 px-3.5 py-2.5 text-body leading-relaxed whitespace-pre-line"
        >
          {respuesta.nota}
        </p>
      )}
    </>
  );
}

export function CoordinarLaEntrega({
  coordinacion,
  hoy,
  alMandar,
  alAnunciar,
}: CoordinarLaEntregaProps) {
  const escritura = useEscritura(hoy);
  const { coordinar } = escritura.t;
  const delDueno = useDelDueno();
  const dueno = useMensajes().vistaCliente;
  const base = useId();
  const titulo = useRef<HTMLHeadingElement>(null);
  const instrucciones = useRef<HTMLParagraphElement>(null);
  const [modo, setModo] = useState<Modo>(() => modoInicial(coordinacion));
  const [elegidos, setElegidos] = useState<DiaElegido[]>(() =>
    diasQueSiguenSirviendo(coordinacion.respuesta?.dias ?? [], hoy),
  );
  const [nota, setNota] = useState(() => coordinacion.respuesta?.nota ?? '');
  const [mandada, setMandada] = useState<RespuestaDelCliente | null>(coordinacion.respuesta);
  const [idDeLaRespuesta, setIdDeLaRespuesta] = useState(uuidv7);
  const [mandando, setMandando] = useState(false);
  const [error, setError] = useState<MotivoDelError | null>(null);
  const { propuesta } = coordinacion;
  const esPrueba = alMandar === undefined;

  function abrirElCalendario(): void {
    setError(null);
    setModo('calendario');
    requestAnimationFrame(() => {
      enfocar(instrucciones.current);
    });
  }

  function volverALaPropuesta(): void {
    setError(null);
    setMandada(coordinacion.respuesta);
    setModo('propuesta');
    requestAnimationFrame(() => {
      enfocar(titulo.current);
    });
  }

  function dejarComoEstaban(anterior: RespuestaDelCliente): void {
    setError(null);
    setElegidos(diasQueSiguenSirviendo(anterior.dias, hoy));
    setNota(anterior.nota);
    setModo('mandados');
    requestAnimationFrame(() => {
      enfocar(titulo.current);
    });
  }

  function quedoMandada(armada: RespuestaDeEntregaParaMandar): void {
    setMandada({ respuesta: armada.respuesta, dias: armada.dias, nota: armada.nota });
    setIdDeLaRespuesta(uuidv7());
    setModo('mandados');
    alAnunciar(anuncioDeLoMandado(armada, propuesta, escritura));
    requestAnimationFrame(() => {
      enfocar(titulo.current);
    });
  }

  async function mandar(respuesta: RespuestaDeEntrega): Promise<void> {
    if (mandando) return;
    setError(null);
    const armada = armarRespuestaDeEntrega(
      idDeLaRespuesta,
      propuesta.id,
      respuesta,
      elegidos,
      nota,
    );
    const motivo = validarRespuestaDeEntrega(armada, propuesta.forma, hoy);
    if (motivo !== null) {
      setError(motivo);
      return;
    }
    if (alMandar === undefined) {
      quedoMandada(armada);
      return;
    }
    setMandando(true);
    const resultado = await alMandar(armada);
    setMandando(false);
    switch (resultado.tipo) {
      case 'guardada':
        quedoMandada(armada);
        return;
      case 'ya-confirmada':
        alAnunciar(coordinar.yaEstabaConfirmada);
        return;
      case 'cambio':
        alAnunciar(coordinar.cambioElPedido);
        return;
      case 'error':
        setError(resultado.motivo);
    }
  }

  const pie = (
    <>
      {error !== null && (
        <p role="alert" className="mt-3 text-body leading-relaxed font-medium text-alerta">
          {coordinar.motivos[error]}
        </p>
      )}
      {esPrueba && (
        <p lang={delDueno} className="mt-3 text-label leading-relaxed text-text-3">
          {dueno.acaNoSeGuardaNada}
        </p>
      )}
    </>
  );

  return (
    <section aria-labelledby={`${base}-titulo`} className={TARJETA}>
      <h2 id={`${base}-titulo`} ref={titulo} className="text-section font-semibold">
        {coordinar.titulo}
      </h2>

      {modo === 'propuesta' && coordinacion.situacion === 'un-dia' && (
        <>
          <p className="mt-1 text-body leading-relaxed text-text-2">{coordinar.teProponemos}</p>
          <p className="mt-2 text-body-lg font-semibold first-letter:uppercase">
            {fechaConFranja(coordinacion.propuesta.fecha, coordinacion.propuesta.franja, escritura)}
          </p>
          <div className="mt-4 flex flex-col gap-2 min-[26rem]:flex-row">
            <Button
              cargando={mandando}
              onClick={() => {
                void mandar('me_queda_bien');
              }}
            >
              {mandando ? coordinar.mandando : coordinar.meQuedaBien}
            </Button>
            <Button variant="secundario" disabled={mandando} onClick={abrirElCalendario}>
              {coordinar.noPuedoEseDia}
            </Button>
          </div>
          {pie}
        </>
      )}

      {modo === 'calendario' && (
        <>
          <p ref={instrucciones} className="mt-1 text-body leading-relaxed text-text-2">
            {coordinar.marcaLosDias[coordinacion.situacion]}
          </p>
          <div className="mt-4 flex flex-col gap-4">
            <Calendario
              hoy={hoy}
              elegidos={elegidos}
              alTocar={(fecha) => {
                setError(null);
                setElegidos((actuales) => conElDia(actuales, fecha));
              }}
            />
            {llegoAlMaximo(elegidos) && (
              <p className="text-label leading-relaxed text-text-2">{coordinar.llegasteAlMaximo}</p>
            )}
            <LosDiasElegidos
              hoy={hoy}
              elegidos={elegidos}
              alCambiarLaFranja={(fecha, franja) => {
                setElegidos((actuales) => conLaFranja(actuales, fecha, franja));
              }}
              alSacar={(fecha) => {
                setElegidos((actuales) => conElDia(actuales, fecha));
              }}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${base}-nota`} className="text-body font-semibold">
                {coordinar.algoQueTengamosQueSaber}
              </label>
              <span id={`${base}-ayuda`} className="text-label leading-relaxed text-text-2">
                {coordinar.porEjemplo}
              </span>
              <textarea
                id={`${base}-nota`}
                aria-describedby={`${base}-ayuda`}
                value={nota}
                rows={3}
                maxLength={LARGO_MAXIMO_DE_LA_NOTA}
                onChange={(evento) => {
                  setError(null);
                  setNota(evento.target.value);
                }}
                className="w-full resize-y rounded-field border-[1.5px] border-border bg-paper px-3.5 py-3 text-body-lg leading-7 text-ink placeholder:text-text-3 focus:border-ink"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 min-[26rem]:flex-row">
            <Button
              cargando={mandando}
              onClick={() => {
                void mandar('mis_dias');
              }}
            >
              {mandando ? coordinar.mandando : coordinar.mandarMisDias}
            </Button>
            {coordinacion.situacion === 'un-dia' && mandada === null && (
              <Button variant="secundario" disabled={mandando} onClick={volverALaPropuesta}>
                {coordinar.volverAlDiaQueTePropusimos}
              </Button>
            )}
            {mandada !== null && (
              <Button
                variant="secundario"
                disabled={mandando}
                onClick={() => {
                  dejarComoEstaban(mandada);
                }}
              >
                {coordinar.dejarlosComoEstaban}
              </Button>
            )}
          </div>
          {pie}
        </>
      )}

      {modo === 'mandados' && mandada !== null && (
        <>
          <LoQueMandaste
            respuesta={mandada}
            hoy={hoy}
            enLaPrueba={
              esPrueba && coordinacion.situacion === 'un-dia'
                ? dueno.loQueVeConElDiaAceptado(
                    coordinar.meQuedaBien,
                    escritura.t.pagina.buenasNoticias(
                      fechaConFranja(
                        coordinacion.propuesta.fecha,
                        coordinacion.propuesta.franja,
                        escritura,
                      ),
                    ),
                  )
                : null
            }
          />
          {mandada.respuesta === 'mis_dias' && (
            <div className="mt-4">
              <Button variant="secundario" onClick={abrirElCalendario}>
                {coordinar.cambiarMisDias}
              </Button>
            </div>
          )}
          {mandada.respuesta === 'me_queda_bien' && esPrueba && (
            <div className="mt-4">
              <Button lang={delDueno} variant="secundario" onClick={volverALaPropuesta}>
                {dueno.volverAEmpezar}
              </Button>
            </div>
          )}
          {esPrueba && pie}
        </>
      )}
    </section>
  );
}

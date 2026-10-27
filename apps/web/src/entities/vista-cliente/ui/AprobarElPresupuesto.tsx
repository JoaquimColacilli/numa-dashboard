import {
  armarAprobacion,
  ETIQUETAS_DE_IDIOMA,
  FRANJAS_DE_LA_VISITA,
  LARGO_MAXIMO_DE_LA_NOTA_DE_LA_VISITA,
  monedaDelDocumento,
  validarAprobacion,
  type CuentaDeUnValor,
  type DiasParaMedir,
  type DocumentoDelPresupuesto,
  type FranjaDeLaVisita,
  type Moneda,
} from '@maun/domain';
import { useId, useState } from 'react';

import { useIdioma, useMensajes } from '@/shared/idioma';
import { useMensajesDelCliente } from '@/shared/idioma-del-cliente';
import { diaDeLaSemana, useAnchoDePantalla, uuidv7 } from '@/shared/lib';
import { Button, FilaDeAcciones, Hoja, Icono } from '@/shared/ui';

import {
  aprobacionHecha,
  type AprobacionHecha,
  type AprobarElPresupuesto,
  type MotivoDeNoAprobar,
} from '../model/aprobar';
import { mesesParaMedir } from '../model/calendario';
import { useEscritura } from './escritura';

function CalendarioParaMedir({
  dias,
  hoy,
  elegido,
  idDeLaPregunta,
  alElegir,
}: {
  dias: DiasParaMedir;
  hoy: string;
  elegido: string | null;
  idDeLaPregunta: string;
  alElegir: (fecha: string) => void;
}) {
  const { calendario } = useEscritura(hoy).t.coordinar;
  const base = useId();
  return (
    <div role="group" aria-labelledby={idDeLaPregunta} className="flex flex-col gap-4">
      {mesesParaMedir(dias, hoy).map(({ mes, semanas }) => (
        <div key={mes} role="group" aria-labelledby={`${base}-${mes}`}>
          <h4 id={`${base}-${mes}`} className="mb-2 text-body font-semibold">
            {calendario.meses[Number(mes.slice(5, 7)) - 1] ?? ''}
          </h4>
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
              const esElElegido = elegido === celda.fecha;
              return (
                <button
                  key={celda.fecha}
                  type="button"
                  aria-pressed={esElElegido}
                  aria-label={calendario.dia(
                    diaDeLaSemana(celda.fecha),
                    Number(celda.fecha.slice(8, 10)),
                    Number(celda.fecha.slice(5, 7)) - 1,
                  )}
                  onClick={() => {
                    alElegir(celda.fecha);
                  }}
                  className={`flex h-11 w-full min-w-0 items-center justify-center rounded-field text-body tabular-nums transition-colors duration-(--dur-fast) ${
                    esElElegido
                      ? 'bg-ink font-semibold text-paper'
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

export interface LoQueSeAprueba {
  cuenta: CuentaDeUnValor<Moneda>;
  conOpciones: boolean;
}

export interface HojaDeAprobarProps {
  aprobada: LoQueSeAprueba;
  documento: DocumentoDelPresupuesto;
  revisionId: string;
  pideFecha: boolean;
  dias: DiasParaMedir;
  hoy: string;
  alAprobar?: AprobarElPresupuesto;
  alAprobado: (hecha: AprobacionHecha) => void;
  alCerrar: () => void;
}

export function HojaDeAprobar({
  aprobada,
  documento,
  revisionId,
  pideFecha,
  dias,
  hoy,
  alAprobar,
  alAprobado,
  alCerrar,
}: HojaDeAprobarProps) {
  const { f } = useEscritura(hoy);
  const m = useMensajesDelCliente().presupuesto;
  const textos = m.aprobar;
  const delDueno = ETIQUETAS_DE_IDIOMA[useIdioma()];
  const dueno = useMensajes().vistaCliente;
  const enCelular = useAnchoDePantalla() === 'movil';
  const base = useId();
  const [id] = useState(uuidv7);
  const [dia, setDia] = useState<string | null>(null);
  const [franja, setFranja] = useState<FranjaDeLaVisita | null>(null);
  const [nota, setNota] = useState('');
  const [mandando, setMandando] = useState(false);
  const [error, setError] = useState<MotivoDeNoAprobar | null>(null);
  const { cuenta, conOpciones } = aprobada;
  const letra = conOpciones ? cuenta.letra : null;
  const titulo =
    letra !== null
      ? textos.tituloDeLaOpcion(letra)
      : documento.estimativo
        ? textos.tituloDelEstimativo
        : textos.tituloDelPresupuesto;
  const taller = documento.taller.nombre;

  async function aprobar(): Promise<void> {
    if (mandando) return;
    setError(null);
    const visita = pideFecha && dia !== null && franja !== null ? { dia, franja } : null;
    const armada = armarAprobacion(id, revisionId, conOpciones ? cuenta.id : null, visita, nota);
    const motivo = validarAprobacion(armada, documento, hoy);
    if (motivo !== null) {
      setError(motivo);
      return;
    }
    if (alAprobar === undefined) {
      alAprobado(aprobacionHecha(armada, letra, hoy));
      return;
    }
    setMandando(true);
    const resultado = await alAprobar(armada);
    setMandando(false);
    if (resultado.tipo === 'guardada') {
      alAprobado(aprobacionHecha(armada, letra, hoy));
      return;
    }
    setError(resultado.motivo);
  }

  return (
    <Hoja titulo={titulo} alCerrar={alCerrar} desdeAbajo={enCelular}>
      {(pedirCierre) => (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
            <section
              aria-labelledby={`${base}-que`}
              className="flex flex-col gap-1 rounded-field bg-surface px-3.5 py-3"
            >
              <h3 id={`${base}-que`} className="text-label font-medium text-text-2">
                {textos.loQueAprobas}
              </h3>
              <p className="flex items-baseline justify-between gap-3 text-body">
                <span className="font-semibold">
                  {letra === null
                    ? documento.estimativo
                      ? m.tituloDelEstimativo
                      : m.titulo
                    : m.valores.opcion(letra)}
                </span>
                <span translate="no" className="text-body-lg font-semibold tabular-nums">
                  {f.plata(cuenta.total, monedaDelDocumento(documento))}
                </span>
              </p>
              {letra !== null && cuenta.descripcion !== '' && (
                <p translate="no" className="text-label leading-relaxed text-pretty text-text-2">
                  {cuenta.descripcion}
                </p>
              )}
            </section>

            {pideFecha && (
              <>
                <section className="flex flex-col gap-3">
                  <h3 id={`${base}-dia`} className="text-body font-semibold">
                    {textos.queDia}
                  </h3>
                  <CalendarioParaMedir
                    dias={dias}
                    hoy={hoy}
                    elegido={dia}
                    idDeLaPregunta={`${base}-dia`}
                    alElegir={(fecha) => {
                      setError(null);
                      setDia(fecha);
                    }}
                  />
                  {dia !== null && (
                    <p className="text-body font-medium first-letter:uppercase">
                      {f.fechaEnUnaFrase(dia, hoy)}
                    </p>
                  )}
                </section>

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-body font-semibold">{textos.queHorario}</legend>
                  <div className="grid grid-cols-1 gap-2 min-[26rem]:grid-cols-3">
                    {FRANJAS_DE_LA_VISITA.map((una) => (
                      <label
                        key={una}
                        className={`flex min-h-tap cursor-pointer items-center gap-2.5 rounded-field border px-3 text-body ${
                          franja === una ? 'border-ink bg-surface font-semibold' : 'border-hairline'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`${base}-franja`}
                          checked={franja === una}
                          onChange={() => {
                            setError(null);
                            setFranja(una);
                          }}
                          className="size-4 accent-ink"
                        />
                        {textos.franjas[una]}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="flex flex-col gap-1.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <label htmlFor={`${base}-nota`} className="text-body font-semibold">
                      {textos.algoQueTengamosQueSaber}{' '}
                      <span className="font-normal text-text-2">{textos.opcional}</span>
                    </label>
                    <span className="text-meta text-text-3 tabular-nums">
                      {textos.contador(nota.length, LARGO_MAXIMO_DE_LA_NOTA_DE_LA_VISITA)}
                    </span>
                  </span>
                  <textarea
                    id={`${base}-nota`}
                    aria-describedby={`${base}-aviso`}
                    value={nota}
                    rows={3}
                    maxLength={LARGO_MAXIMO_DE_LA_NOTA_DE_LA_VISITA}
                    onChange={(evento) => {
                      setError(null);
                      setNota(evento.target.value);
                    }}
                    className="w-full resize-y rounded-field border-[1.5px] border-border bg-paper px-3.5 py-3 text-body-lg leading-7 text-ink placeholder:text-text-3 focus:border-ink"
                  />
                  <span id={`${base}-aviso`} className="text-label leading-relaxed text-text-2">
                    {textos.loLee(taller)}
                  </span>
                </div>
              </>
            )}

            {error !== null && (
              <p role="alert" className="text-body leading-relaxed font-medium text-alerta">
                {textos.motivos[error]}
              </p>
            )}
            {alAprobar === undefined && (
              <p lang={delDueno} className="text-label leading-relaxed text-text-3">
                {dueno.acaNoSeGuardaNada}
              </p>
            )}
          </div>
          <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
            <FilaDeAcciones>
              <Button variant="secundario" disabled={mandando} onClick={pedirCierre}>
                {textos.cancelar}
              </Button>
              <Button
                cargando={mandando}
                onClick={() => {
                  void aprobar();
                }}
              >
                <Icono nombre="check" tamano={16} />
                {mandando ? textos.mandando : textos.aprobar}
              </Button>
            </FilaDeAcciones>
          </footer>
        </div>
      )}
    </Hoja>
  );
}

export interface LoQueAprobasteProps {
  hecha: AprobacionHecha;
  documento: DocumentoDelPresupuesto;
  hoy: string;
  conComoPagar: boolean;
  idDeComoPagar: string;
  escribir: string | null;
}

export function LoQueAprobaste({
  hecha,
  documento,
  hoy,
  conComoPagar,
  idDeComoPagar,
  escribir,
}: LoQueAprobasteProps) {
  const { f } = useEscritura(hoy);
  const textos = useMensajesDelCliente().presupuesto.aprobar;
  const taller = documento.taller.nombre;
  const el = f.diaYMes(hecha.respondidaEl, hoy);
  const { senaAntesDel } = documento;
  return (
    <div role="status" className="mt-3 flex flex-col gap-2 rounded-field bg-hogar-tint px-3.5 py-3">
      <p className="flex items-start gap-2 text-body leading-normal font-semibold">
        <Icono nombre="circle-check" tamano={18} className="mt-[3px] flex-none text-hogar" />
        <span>
          {hecha.letra === null
            ? textos.loAprobaste(el)
            : textos.aprobasteLaOpcion(hecha.letra, el)}
        </span>
      </p>
      {hecha.dia !== null && hecha.franja !== null && (
        <p className="text-body leading-relaxed text-pretty">
          {textos.propusiste[hecha.franja](f.fechaEnUnaFrase(hecha.dia, hoy), taller)}
        </p>
      )}
      {!documento.estimativo && (senaAntesDel !== null || conComoPagar) && (
        <p className="text-body leading-relaxed text-pretty">
          {senaAntesDel !== null && textos.laSenaVaAntesDel(f.fechaEnUnaFrase(senaAntesDel, hoy))}
          {senaAntesDel !== null && conComoPagar && ' '}
          {conComoPagar && (
            <a
              href={`#${idDeComoPagar}`}
              className="font-medium whitespace-nowrap underline underline-offset-3"
            >
              {textos.comoPagar}
            </a>
          )}
        </p>
      )}
      <p className="text-label leading-relaxed text-text-2">
        {documento.estimativo ? textos.estoLeAvisaDelEstimativo : textos.estoLeAvisa}
      </p>
      <p className="text-label leading-relaxed text-text-2">
        {escribir === null ? (
          textos.teEquivocaste(taller)
        ) : (
          <a
            href={escribir}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink underline underline-offset-3"
          >
            {textos.teEquivocaste(taller)}
          </a>
        )}
      </p>
    </div>
  );
}

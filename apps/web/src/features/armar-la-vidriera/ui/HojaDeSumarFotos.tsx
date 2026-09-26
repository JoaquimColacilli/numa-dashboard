import { lugaresLibres, ordenAlFinal } from '@maun/domain';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

import {
  prepararImagen,
  rutaDeLaMiniatura,
  SIN_SENAL_PARA_ARCHIVOS,
  type DependenciasDeLaSubida,
} from '@/entities/archivo';
import { useReplicaDelTaller } from '@/entities/replica';
import {
  copiarEnElBucketDeArchivos,
  householdDe,
  subirAlBucketDeArchivos,
  urlDelArchivo,
} from '@/shared/api';
import { avisarEnPantalla, decodificarImagen, uuidv7 } from '@/shared/lib';
import { Button, FilaDeAcciones, FondoDelElegido, Hoja, Icono, Tilde } from '@/shared/ui';

import { mandarALaCola, sumarLaFoto } from '../model/acciones';
import {
  avisoSinCompartir,
  conLaFotoElegida,
  disponibilidadDeLaFoto,
  fotosDeLosTrabajos,
  LO_QUE_SE_SUBE_A_LA_VIDRIERA,
  subirALaVidriera,
  sumarDeLosTrabajos,
  textoDelBotonDeSumar,
  type Avance,
  type FotoDeUnTrabajo,
  type ResultadoDeSumar,
} from '../model/sumar';
import { filaParaOrdenar, fotosDeLaVidriera } from '../model/vidriera';

export const LAS_VEN_TODOS =
  'Las fotos que sumes las ven todos tus clientes, en la página de cada trabajo.';

type Pestana = 'trabajos' | 'subir';

const PESTANAS: readonly { id: Pestana; etiqueta: string }[] = [
  { id: 'trabajos', etiqueta: 'De tus trabajos' },
  { id: 'subir', etiqueta: 'Subir nuevas' },
];

const DEPENDENCIAS: DependenciasDeLaSubida = {
  subir: subirAlBucketDeArchivos,
  decodificar: decodificarImagen,
  preparar: (imagen) => prepararImagen(imagen),
  nuevoId: uuidv7,
};

function avisarLoSumado(cantidad: number): void {
  avisarEnPantalla({
    clave: 'fotos-sumadas-a-la-vidriera',
    tono: 'hecho',
    texto:
      cantidad === 1
        ? 'Sumaste una foto a tu vidriera.'
        : `Sumaste ${String(cantidad)} fotos a tu vidriera.`,
  });
}

interface FotoParaElegirProps {
  foto: FotoDeUnTrabajo;
  numero: number;
  titulo: string;
  elegida: boolean;
  noEntra: boolean;
  idDelMotivo: string;
  alTocar: () => void;
}

function FotoParaElegir({
  foto,
  numero,
  titulo,
  elegida,
  noEntra,
  idDelMotivo,
  alTocar,
}: FotoParaElegirProps) {
  const apagada = foto.yaEsta || noEntra;
  const idMarca = useId();
  return (
    <li>
      <button
        type="button"
        aria-pressed={elegida}
        aria-disabled={apagada || undefined}
        aria-label={`Foto ${String(numero)} de «${titulo}»`}
        aria-describedby={
          [
            foto.yaEsta ? idMarca : '',
            !foto.yaEsta && !foto.compartida ? idMarca : '',
            noEntra ? idDelMotivo : '',
          ]
            .filter(Boolean)
            .join(' ') || undefined
        }
        onClick={() => {
          if (!apagada) alTocar();
        }}
        className="relative block aspect-square w-full overflow-hidden rounded-field bg-surface outline-offset-2 aria-pressed:outline-3 aria-pressed:outline-ink aria-disabled:cursor-default"
      >
        <img
          src={urlDelArchivo(rutaDeLaMiniatura(foto.archivo))}
          alt=""
          loading="lazy"
          decoding="async"
          className={`size-full object-cover ${apagada && !elegida ? 'opacity-45' : ''}`}
        />
        <span
          aria-hidden
          className={`absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-pill ${
            elegida ? 'bg-ink text-paper' : 'border-2 border-paper-fijo bg-ink/25'
          }`}
        >
          {elegida && <Tilde tamano={14} dibujar />}
        </span>
        {foto.yaEsta ? (
          <span
            id={idMarca}
            className="absolute inset-x-1.5 bottom-1.5 rounded-pill bg-paper px-2 py-0.5 text-center text-badge font-semibold text-ink"
          >
            Ya está en tu vidriera
          </span>
        ) : (
          !foto.compartida && (
            <span
              id={idMarca}
              className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-pill bg-paper px-2 py-0.5 text-badge font-medium text-ink"
            >
              <Icono nombre="eye-off" tamano={12} />
              Sin compartir
            </span>
          )
        )}
      </button>
    </li>
  );
}

export interface HojaDeSumarFotosProps {
  alCerrar: () => void;
}

export function HojaDeSumarFotos({ alCerrar }: HojaDeSumarFotosProps) {
  const replica = useReplicaDelTaller();
  const cliente = useQueryClient();
  const base = useId();
  const selector = useRef<HTMLInputElement>(null);
  const pestanas = useRef<HTMLDivElement>(null);
  const aviso = useRef<HTMLDivElement>(null);
  const [pestana, setPestana] = useState<Pestana>('trabajos');
  const [elegidas, setElegidas] = useState<readonly string[]>([]);
  const [avisando, setAvisando] = useState(false);
  const [avance, setAvance] = useState<Avance | null>(null);
  const [problemas, setProblemas] = useState<string[]>([]);

  const household = householdDe(replica);
  const enLaVidriera = fotosDeLaVidriera(replica);
  const libres = lugaresLibres(enLaVidriera.length);
  const siguiente = ordenAlFinal(enLaVidriera.map(filaParaOrdenar));
  const trabajos = fotosDeLosTrabajos(replica);
  const todas = trabajos.flatMap((trabajo) => trabajo.fotos);
  const elegidasEnOrden = elegidas.flatMap((id) => {
    const foto = todas.find((una) => una.archivo.id === id);
    return foto ? [foto] : [];
  });
  const sinCompartir = elegidasEnOrden.filter((foto) => !foto.compartida).length;
  const trabajando = avance !== null;
  const idDelMotivo = `${base}-no-entra`;

  useEffect(() => {
    if (avisando) aviso.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [avisando]);

  function terminar(resultado: ResultadoDeSumar): void {
    setAvance(null);
    setElegidas([]);
    setAvisando(false);
    if (resultado.hechas > 0) avisarLoSumado(resultado.hechas);
    if (resultado.problemas.length === 0) {
      alCerrar();
      return;
    }
    setProblemas(resultado.problemas);
  }

  function sinSenal(): boolean {
    if (onlineManager.isOnline()) return false;
    setProblemas([SIN_SENAL_PARA_ARCHIVOS]);
    return true;
  }

  async function sumarLasElegidas(): Promise<void> {
    if (household === undefined || sinSenal()) return;
    setAvisando(false);
    setProblemas([]);
    const resultado = await sumarDeLosTrabajos(
      elegidasEnOrden.map((foto) => foto.archivo),
      household.id,
      siguiente,
      {
        copiar: copiarEnElBucketDeArchivos,
        nuevoId: uuidv7,
        sumar: (nueva) => {
          sumarLaFoto(mandarALaCola(cliente), nueva);
        },
      },
      setAvance,
    );
    terminar(resultado);
  }

  function pedirSumar(): void {
    if (elegidasEnOrden.length === 0) return;
    if (sinCompartir > 0 && !avisando) {
      setAvisando(true);
      return;
    }
    void sumarLasElegidas();
  }

  function elegirArchivos(): void {
    if (sinSenal()) return;
    setProblemas([]);
    selector.current?.click();
  }

  async function alElegir(evento: ChangeEvent<HTMLInputElement>): Promise<void> {
    const elegidos = [...(evento.target.files ?? [])];
    evento.target.value = '';
    if (elegidos.length === 0 || household === undefined || sinSenal()) return;
    setProblemas([]);
    const resultado = await subirALaVidriera(
      elegidos,
      household.id,
      siguiente,
      libres,
      {
        ...DEPENDENCIAS,
        sumar: (nueva) => {
          sumarLaFoto(mandarALaCola(cliente), nueva);
        },
      },
      setAvance,
    );
    terminar(resultado);
  }

  function alTeclear(evento: KeyboardEvent<HTMLDivElement>): void {
    const indice = PESTANAS.findIndex((una) => una.id === pestana);
    const destino =
      evento.key === 'ArrowRight'
        ? (indice + 1) % PESTANAS.length
        : evento.key === 'ArrowLeft'
          ? (indice - 1 + PESTANAS.length) % PESTANAS.length
          : evento.key === 'Home'
            ? 0
            : evento.key === 'End'
              ? PESTANAS.length - 1
              : null;
    if (destino === null) return;
    evento.preventDefault();
    const elegida = PESTANAS[destino];
    if (!elegida) return;
    setPestana(elegida.id);
    pestanas.current?.querySelector<HTMLElement>(`[data-opcion="${elegida.id}"]`)?.focus();
  }

  return (
    <Hoja
      titulo="Sumar fotos a la vidriera"
      ancho="amplio"
      alCerrar={alCerrar}
      conCambios={elegidas.length > 0 && !trabajando}
      bajada={libres === 1 ? 'Entra 1 foto más.' : `Entran ${String(libres)} fotos más.`}
    >
      {(pedirCierre) => (
        <>
          <div className="flex-none px-5 pt-3 md:px-6">
            <div
              ref={pestanas}
              role="tablist"
              aria-label="De dónde salen las fotos"
              onKeyDown={alTeclear}
              className="relative grid grid-cols-2 gap-0.5 rounded-pill bg-ink/6 p-1"
            >
              <FondoDelElegido elegido={pestana} />
              {PESTANAS.map((una) => (
                <button
                  key={una.id}
                  type="button"
                  role="tab"
                  id={`${base}-pestana-${una.id}`}
                  data-opcion={una.id}
                  aria-selected={pestana === una.id}
                  aria-controls={`${base}-panel-${una.id}`}
                  tabIndex={pestana === una.id ? 0 : -1}
                  onClick={() => {
                    setPestana(una.id);
                  }}
                  className="relative flex min-h-tap items-center justify-center rounded-pill px-2 text-label font-medium text-text-2 aria-selected:font-semibold aria-selected:text-ink"
                >
                  {una.etiqueta}
                </button>
              ))}
            </div>
          </div>

          <div
            role="tabpanel"
            id={`${base}-panel-trabajos`}
            aria-labelledby={`${base}-pestana-trabajos`}
            hidden={pestana !== 'trabajos'}
            tabIndex={0}
            className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6"
          >
            <p className="mb-3 text-label leading-relaxed text-text-2">{LAS_VEN_TODOS}</p>
            {trabajos.length === 0 ? (
              <p className="text-body leading-relaxed text-text-2">
                Todavía no hay fotos en tus trabajos. Podés subir fotos nuevas en «Subir nuevas».
              </p>
            ) : (
              <div className="@container flex flex-col gap-4">
                {trabajos.map((trabajo) => (
                  <section key={trabajo.id} aria-labelledby={`${base}-trabajo-${trabajo.id}`}>
                    <h3
                      id={`${base}-trabajo-${trabajo.id}`}
                      className="mb-2 truncate text-body font-semibold"
                    >
                      {trabajo.titulo}
                    </h3>
                    <ul className="grid grid-cols-3 gap-2 @md:grid-cols-4 @xl:grid-cols-5">
                      {trabajo.fotos.map((foto, indice) => {
                        const disponibilidad = disponibilidadDeLaFoto(foto, elegidas, libres);
                        return (
                          <FotoParaElegir
                            key={foto.archivo.id}
                            foto={foto}
                            numero={indice + 1}
                            titulo={trabajo.titulo}
                            elegida={elegidas.includes(foto.archivo.id)}
                            noEntra={disponibilidad === 'no-entra'}
                            idDelMotivo={idDelMotivo}
                            alTocar={() => {
                              setAvisando(false);
                              setElegidas((previas) => conLaFotoElegida(previas, foto, libres));
                            }}
                          />
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>

          <div
            role="tabpanel"
            id={`${base}-panel-subir`}
            aria-labelledby={`${base}-pestana-subir`}
            hidden={pestana !== 'subir'}
            tabIndex={0}
            className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6"
          >
            <p className="mb-3 text-label leading-relaxed text-text-2">{LAS_VEN_TODOS}</p>
            <div className="flex flex-col items-start gap-3">
              <p className="text-body leading-relaxed text-text-2">
                Fotos o capturas del celular o de la compu. Se achican antes de subirse, como las de
                los trabajos.
              </p>
              <Button
                variant="secundario"
                cargando={trabajando}
                disabled={libres === 0}
                onClick={elegirArchivos}
              >
                <Icono nombre="image" tamano={16} />
                Elegir fotos
              </Button>
              <input
                ref={selector}
                type="file"
                multiple
                accept={LO_QUE_SE_SUBE_A_LA_VIDRIERA.acepta}
                tabIndex={-1}
                aria-hidden
                className="sr-only"
                onChange={(evento) => {
                  void alElegir(evento);
                }}
              />
            </div>
          </div>

          <div className="flex flex-none flex-col gap-3 border-t border-hairline px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-4">
            {avance !== null && (
              <p role="status" className="text-label text-text-2 tabular-nums">
                {pestana === 'trabajos' ? 'Sumando' : 'Subiendo'} {avance.actual} de {avance.total}…
              </p>
            )}
            {problemas.map((problema) => (
              <p
                key={problema}
                role="alert"
                className="text-label leading-relaxed font-medium text-alerta"
              >
                {problema}
              </p>
            ))}
            {pestana === 'trabajos' && (
              <>
                <p id={idDelMotivo} className="text-label text-text-2 tabular-nums">
                  {elegidas.length >= libres && libres > 0
                    ? `Elegiste ${String(elegidas.length)}: es lo que entra en tu vidriera.`
                    : `Elegiste ${String(elegidas.length)} de ${String(libres)} que entran.`}
                </p>
                {avisando ? (
                  <div
                    ref={aviso}
                    className="flex flex-col gap-3 rounded-field bg-atencion-tint px-3.5 py-3"
                  >
                    <p className="text-label leading-relaxed text-ink">
                      {avisoSinCompartir(sinCompartir)}
                    </p>
                    <FilaDeAcciones>
                      <Button
                        onClick={() => {
                          void sumarLasElegidas();
                        }}
                      >
                        Sumar igual
                      </Button>
                      <Button
                        variant="secundario"
                        onClick={() => {
                          setAvisando(false);
                        }}
                      >
                        Revisar
                      </Button>
                    </FilaDeAcciones>
                  </div>
                ) : (
                  <FilaDeAcciones>
                    <Button
                      disabled={elegidas.length === 0}
                      cargando={trabajando}
                      onClick={pedirSumar}
                    >
                      {textoDelBotonDeSumar(elegidas.length)}
                    </Button>
                    <Button variant="secundario" onClick={pedirCierre}>
                      Cancelar
                    </Button>
                  </FilaDeAcciones>
                )}
              </>
            )}
          </div>
        </>
      )}
    </Hoja>
  );
}

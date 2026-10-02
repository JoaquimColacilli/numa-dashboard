import {
  ETIQUETAS_DE_IDIOMA,
  IDIOMA_BASE,
  idiomaDeLaEtiqueta,
  lineasDeLaRespuesta,
  type Idioma,
  type RespuestaDelFormulario,
} from '@maun/domain';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router';

import {
  FormularioDeLaEncuesta,
  GraciasPorContestar,
  laEncuestaNoSirve,
  LoQueContestaste,
  useEncuestaCompartida,
  type ResultadoDeLaEncuesta,
} from '@/entities/opinion';
import { contestarEncuesta, esFalloDeRed, motivoDelRechazo } from '@/shared/api';
import {
  ConElIdiomaDelCliente,
  useMensajesDelCliente,
  type MensajesDelCliente,
} from '@/shared/idioma-del-cliente';
import { hoyLocal, TALLER_DE_RESPALDO, uuidv7 } from '@/shared/lib';
import {
  Button,
  ESCENA_EN_LA_LAMINA,
  Ilustracion,
  TarjetaConLamina,
  TITULO_DE_LAMINA,
  type NombreDeIlustracion,
} from '@/shared/ui';

type TextosAlMandar = MensajesDelCliente['encuesta']['alMandar'];

function idiomaDeLaPagina(): Idioma {
  return idiomaDeLaEtiqueta(document.documentElement.lang) ?? IDIOMA_BASE;
}

function Aviso({
  titulo,
  texto,
  ilustracion,
  accion,
}: {
  titulo: string;
  texto: string;
  ilustracion: NombreDeIlustracion;
  accion?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[520px] flex-col justify-center gap-3 px-(--page-pad-mobile) py-10">
      <span translate="no" className="px-1 font-display text-firma text-text-2">
        {TALLER_DE_RESPALDO}
      </span>
      <TarjetaConLamina
        como="div"
        dibujo={<Ilustracion nombre={ilustracion} />}
        lamina={ESCENA_EN_LA_LAMINA}
      >
        <h1 className={TITULO_DE_LAMINA}>{titulo}</h1>
        <p className="text-body leading-relaxed text-text-2">{texto}</p>
        {accion !== undefined && <div className="w-full pt-2">{accion}</div>}
      </TarjetaConLamina>
    </div>
  );
}

function Esqueleto() {
  const { abriendo } = useMensajesDelCliente().encuesta;
  return (
    <div aria-busy="true" className="mx-auto flex max-w-[520px] flex-col gap-6.5 px-5 pt-5.5 pb-11">
      <span className="sr-only" role="status">
        {abriendo}
      </span>
      <div className="h-4 w-30 rounded-control bg-ink/6" />
      <div className="h-7.5 w-4/5 rounded-field bg-ink/6" />
      {[0, 1].map((bloque) => (
        <div key={bloque} className="flex flex-col gap-2.5">
          <div className="h-4 w-2/3 rounded-control bg-ink/6" />
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((paso) => (
              <div key={paso} className="h-18.5 flex-1 rounded-field bg-ink/6" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Pestana({ taller }: { taller: string }) {
  const { pestana, pestanaDe } = useMensajesDelCliente().encuesta;

  useEffect(() => {
    document.title = taller === '' ? pestana : pestanaDe(taller);
  }, [pestana, pestanaDe, taller]);

  return null;
}

function motivoParaMostrar(error: unknown, textos: TextosAlMandar): string {
  if (esFalloDeRed(error)) return textos.sinSenal;
  const motivo = motivoDelRechazo(error);
  return motivo === null ? textos.noSeGuardo : textos.motivos[motivo];
}

interface ContenidoProps {
  token: string;
  resultado: ResultadoDeLaEncuesta;
  idDeLaRespuesta: string;
  enviada: boolean;
  murio: boolean;
  alEnviar: () => void;
  alMorir: () => void;
}

function Contenido({
  token,
  resultado,
  idDeLaRespuesta,
  enviada,
  murio,
  alEnviar,
  alMorir,
}: ContenidoProps) {
  const textos = useMensajesDelCliente().encuesta;
  const hoy = hoyLocal();
  const taller = resultado.estado === 'lista' ? resultado.encuesta.taller : '';

  let contenido: ReactNode;
  if (murio || resultado.estado === 'muerto') {
    contenido = (
      <Aviso titulo={textos.muerto.titulo} texto={textos.muerto.texto} ilustracion="anulado" />
    );
  } else if (resultado.estado === 'sin-senal') {
    contenido = (
      <Aviso
        titulo={textos.sinSenal.titulo}
        texto={textos.sinSenal.texto}
        ilustracion="sin-senal"
      />
    );
  } else if (resultado.estado === 'error') {
    contenido = (
      <Aviso
        titulo={textos.error.titulo}
        texto={textos.error.texto}
        ilustracion="se-corto"
        accion={<Button onClick={resultado.reintentar}>{textos.error.reintentar}</Button>}
      />
    );
  } else if (resultado.estado === 'cargando') {
    contenido = <Esqueleto />;
  } else {
    const { encuesta, releer } = resultado;
    if (enviada) {
      contenido = (
        <GraciasPorContestar
          taller={encuesta.taller}
          cliente={encuesta.cliente}
          resena={encuesta.resena}
        />
      );
    } else if (encuesta.contestada !== null) {
      contenido = (
        <LoQueContestaste
          taller={encuesta.taller}
          fecha={encuesta.contestada.fecha}
          hoy={hoy}
          lineas={lineasDeLaRespuesta(
            encuesta.preguntas,
            encuesta.contestada.renglones,
            textos.escalas,
          )}
        />
      );
    } else {
      const mandar = async (respuesta: RespuestaDelFormulario): Promise<string | null> => {
        try {
          const estado = await contestarEncuesta(token, respuesta);
          if (estado === 'ya_contestada') {
            releer();
            return null;
          }
          alEnviar();
          return null;
        } catch (error) {
          if (laEncuestaNoSirve(error)) {
            alMorir();
            return null;
          }
          if (motivoDelRechazo(error) === 'ajena') {
            releer();
            return textos.alMandar.cambioLaEncuesta;
          }
          return motivoParaMostrar(error, textos.alMandar);
        }
      };
      contenido = (
        <FormularioDeLaEncuesta
          taller={encuesta.taller}
          trabajo={encuesta.trabajo}
          preguntas={encuesta.preguntas}
          idDeLaRespuesta={idDeLaRespuesta}
          alMandar={mandar}
        />
      );
    }
  }

  return (
    <>
      <Pestana taller={taller} />
      {contenido}
    </>
  );
}

export function EncuestaPublicaPage() {
  const { token = '' } = useParams();
  const resultado = useEncuestaCompartida(token);
  const [idDeLaRespuesta] = useState(uuidv7);
  const [enviada, setEnviada] = useState(false);
  const [murio, setMurio] = useState(false);
  const [deEspera] = useState(idiomaDeLaPagina);
  const principal = useRef<HTMLElement>(null);
  const idioma = resultado.estado === 'lista' ? resultado.encuesta.idioma : deEspera;

  useEffect(() => {
    document.documentElement.lang = ETIQUETAS_DE_IDIOMA[idioma];
  }, [idioma]);

  useLayoutEffect(() => {
    if (!enviada) return;
    globalThis.scrollTo({ top: 0 });
    const titulo = principal.current?.querySelector('h1');
    if (!titulo) return;
    titulo.tabIndex = -1;
    titulo.focus();
  }, [enviada]);

  return (
    <main ref={principal} className="min-h-dvh bg-mesa text-ink">
      <ConElIdiomaDelCliente
        idioma={idioma}
        mientrasCarga={
          <ConElIdiomaDelCliente idioma={deEspera}>
            <Pestana taller="" />
            <Esqueleto />
          </ConElIdiomaDelCliente>
        }
      >
        <Contenido
          token={token}
          resultado={resultado}
          idDeLaRespuesta={idDeLaRespuesta}
          enviada={enviada}
          murio={murio}
          alEnviar={() => {
            setEnviada(true);
          }}
          alMorir={() => {
            setMurio(true);
          }}
        />
      </ConElIdiomaDelCliente>
    </main>
  );
}

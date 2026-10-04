import { useEffect, useRef, useState, type ReactNode } from 'react';

import {
  bajarElPedidoDelCertificadoDeArca,
  conectarElTallerConArca,
  estadoDeLaFacturacion,
  subirElCertificadoDeArca,
  type EstadoDeLaFacturacion,
  type FilaDe,
} from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { Ir, RUTA_DE_LA_FACTURACION, useHaySenal, useVolver } from '@/shared/lib';
import { BloquePlegable, Icono, Pagina, Recuadro } from '@/shared/ui';

import {
  avanceDelAsistente,
  pasosALaVista,
  type ClaveDelPaso,
  type PasoDelAsistente as Paso,
} from '../../model/asistente';
import { conexionDelTaller } from '../../model/facturacion';
import { CapturaDelPaso, GuiaDeArca, PasoDelAsistente, TextoDeArca } from './PasoDelAsistente';
import {
  BajarElPedido,
  ConectarElTaller,
  SubirElCertificado,
  type ServiciosDeArca,
} from './PasosDeNuma';

const SERVICIOS: ServiciosDeArca = {
  estado: estadoDeLaFacturacion,
  bajarElPedido: bajarElPedidoDelCertificadoDeArca,
  subirElCertificado: subirElCertificadoDeArca,
  conectar: conectarElTallerConArca,
};

type PasoDeArca = Exclude<ClaveDelPaso, 'pedido' | 'subir' | 'conectar'>;

function TextosDelPaso({ clave }: { clave: PasoDeArca }) {
  const m = useMensajes().facturacion.asistente;
  switch (clave) {
    case 'certificados':
      return (
        <>
          <p>{m.certificados.texto}</p>
          <p>{m.certificados.siNoLoEncontras}</p>
        </>
      );
    case 'puntoDeVenta':
      return (
        <>
          <p>{m.puntoDeVenta.texto}</p>
          <ul className="m-0 flex list-disc flex-col gap-1 pl-4.5">
            {m.puntoDeVenta.campos.map((campo) => (
              <li key={campo.termino}>
                <b className="font-semibold text-ink">{campo.termino}:</b> {campo.texto}
              </li>
            ))}
          </ul>
          <p>{m.puntoDeVenta.despues}</p>
        </>
      );
    default:
      return (
        <p>
          <TextoDeArca texto={m[clave].texto} />
        </p>
      );
  }
}

export interface AsistenteDeArcaProps {
  ajustes: FilaDe<'ajustes'>;
  servicios?: ServiciosDeArca;
}

export function AsistenteDeArca({ ajustes, servicios = SERVICIOS }: AsistenteDeArcaProps) {
  const m = useMensajes().facturacion.asistente;
  const vuelta = useVolver(RUTA_DE_LA_FACTURACION, m.volver);
  const haySenal = useHaySenal();
  const [estado, setEstado] = useState<EstadoDeLaFacturacion | null>(null);
  const [apagada, setApagada] = useState(false);
  const [conectadoAhora, setConectadoAhora] = useState(false);
  const [plegadosAbiertos, setPlegadosAbiertos] = useState(false);
  const actualizado = useRef(false);
  const abierto = useRef(false);
  const lista = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!haySenal) return;
    let vigente = true;
    servicios.estado().then(
      (leido) => {
        if (vigente && !actualizado.current) setEstado(leido);
      },
      () => undefined,
    );
    return () => {
      vigente = false;
    };
  }, [haySenal, servicios]);

  const conexion = conexionDelTaller(ajustes);
  const avance = avanceDelAsistente(estado);
  const renovando = estado === null ? conexion.ambiente === 'produccion' : avance.renovando;
  const { enLaLista, plegados } = pasosALaVista(renovando);
  const deNuma = {
    prendido: avance.prendido && !apagada,
    haySenal,
    alSaberQueEstaApagada: () => {
      setApagada(true);
    },
  };

  useEffect(() => {
    if (estado === null || abierto.current) return;
    abierto.current = true;
    if (avance.primero === 1) return;
    const paso = lista.current?.querySelector<HTMLElement>(
      `[data-paso="${String(avance.primero)}"]`,
    );
    paso?.scrollIntoView({ block: 'start' });
    paso?.focus({ preventScroll: true });
  }, [estado, avance.primero]);

  function conEstado(nuevo: EstadoDeLaFacturacion): void {
    actualizado.current = true;
    setEstado(nuevo);
  }

  function hechoEl(clave: ClaveDelPaso): boolean {
    if (clave === 'pedido') return conectadoAhora || avance.pedidoBajado;
    if (clave === 'subir') return conectadoAhora || avance.certificadoSubido;
    if (clave === 'conectar') return conectadoAhora;
    return false;
  }

  function cuerpoDelPaso(paso: Paso): ReactNode {
    switch (paso.clave) {
      case 'pedido':
        return (
          <BajarElPedido
            {...deNuma}
            avance={avance}
            bajarElPedido={servicios.bajarElPedido}
            alBajar={() => {
              actualizado.current = true;
              setEstado((previo) =>
                previo === null
                  ? previo
                  : { ...previo, certificado: { estado: 'pedido', vence: null } },
              );
            }}
          />
        );
      case 'subir':
        return (
          <SubirElCertificado
            {...deNuma}
            avance={avance}
            subirElCertificado={servicios.subirElCertificado}
            alSubir={conEstado}
          />
        );
      case 'conectar':
        return (
          <ConectarElTaller
            {...deNuma}
            renovando={renovando}
            puntoDeVentaFijo={renovando ? conexion.puntoDeVenta : null}
            conectar={servicios.conectar}
            alConectar={() => {
              actualizado.current = true;
              setConectadoAhora(true);
            }}
            alRechazarElLogin={() => {
              setPlegadosAbiertos(true);
            }}
          />
        );
      default:
        return (
          <>
            <TextosDelPaso clave={paso.clave} />
            {paso.captura !== null && <CapturaDelPaso captura={paso.captura} />}
            {paso.guia !== null && (
              <GuiaDeArca
                url={paso.guia}
                texto={paso.clave === 'descargar' ? m.descargar.guia : m.representante.guia}
              />
            )}
          </>
        );
    }
  }

  function unPaso(paso: Paso, nivel: 'h2' | 'h3' = 'h2'): ReactNode {
    return (
      <PasoDelAsistente
        key={paso.clave}
        numero={paso.numero}
        titulo={m[paso.clave].titulo}
        enNuma={paso.enNuma}
        hecho={hechoEl(paso.clave)}
        primero={estado !== null && paso.numero === avance.primero}
        nivel={nivel}
      >
        {cuerpoDelPaso(paso)}
      </PasoDelAsistente>
    );
  }

  const antesDelPlegado = enLaLista.filter((paso) => paso.numero < 7);
  const despuesDelPlegado = enLaLista.filter((paso) => paso.numero >= 7);

  return (
    <Pagina className="gap-3 md:gap-4">
      <div className="mx-auto flex w-full max-w-[44rem] flex-col gap-3.5">
        <header className="flex flex-col items-start gap-1.5">
          <Ir
            a={RUTA_DE_LA_FACTURACION}
            alTocar={vuelta.volver}
            className="-ml-1 flex min-h-tap items-center gap-1 rounded-pill pr-3 pl-1 text-body font-medium text-text-2 hover:bg-ink/5"
          >
            <Icono nombre="chevron-left" tamano={20} />
            {vuelta.etiqueta}
          </Ir>
          <h1 className="font-display text-h1 leading-tight lg:text-h1-lg">{m.titulo}</h1>
        </header>
        <p className="text-body leading-relaxed text-pretty text-text-2">{m.bajada}</p>
        <Recuadro titulo={m.antesDeEmpezar}>
          <p className="text-text-2">{m.loQueNecesitas}</p>
        </Recuadro>
        <ol ref={lista} className="m-0 flex list-none flex-col gap-3 p-0">
          {antesDelPlegado.map((paso) => unPaso(paso))}
          {plegados.length > 0 && (
            <li>
              <BloquePlegable
                titulo={m.renovacion.siNoDejaEntrar}
                abiertoAlPrincipio={plegadosAbiertos}
                claseDelTitulo="text-body-lg font-semibold"
              >
                <ol className="m-0 flex list-none flex-col gap-3 p-0">
                  {plegados.map((paso) => unPaso(paso, 'h3'))}
                </ol>
              </BloquePlegable>
            </li>
          )}
          {despuesDelPlegado.map((paso) => unPaso(paso))}
        </ol>
      </div>
    </Pagina>
  );
}

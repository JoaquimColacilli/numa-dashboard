import { vistaDelCliente, type Idioma, type TrabajoDelCliente } from '@maun/domain';
import { useMemo, type ReactNode } from 'react';

import { ConElIdiomaDelCliente, useMensajesDelCliente } from '@/shared/idioma-del-cliente';
import { TALLER_DE_RESPALDO } from '@/shared/lib';
import {
  Button,
  ESCENA_EN_LA_LAMINA,
  Ilustracion,
  Pagina,
  TarjetaConLamina,
  TITULO_DE_LAMINA,
  type NombreDeIlustracion,
} from '@/shared/ui';

import type { ResultadoDeLaVista } from '../api/consulta';
import type { MandarLaEntrega } from '../model/mandar';
import { VistaDelCliente } from './VistaDelCliente';

export type ElQueNoEsta = 'enlace' | 'trabajo';

export interface PantallaDeLaVistaProps {
  resultado: ResultadoDeLaVista;
  idiomaDeEspera: Idioma;
  elQueNoEsta: ElQueNoEsta;
  alMandar?: MandarLaEntrega;
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
    <Pagina>
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[520px] flex-col justify-center gap-3">
        <span translate="no" className="px-1 font-display text-lema text-text-2">
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
    </Pagina>
  );
}

function Esqueleto() {
  const m = useMensajesDelCliente();
  return (
    <Pagina>
      <div aria-busy="true" className="flex flex-col gap-3 md:gap-4">
        <span className="sr-only" role="status">
          {m.vista.pantalla.abriendo}
        </span>
        <div className="mx-1 h-4 w-30 rounded-control bg-ink/6" />
        <div className="flex flex-col gap-5 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5">
          <div className="flex flex-col gap-2.5">
            <div className="h-5.5 w-3/4 rounded-field bg-ink/6" />
            <div className="h-13 w-1/2 rounded-field bg-ink/6" />
            <div className="h-3.5 w-2/5 rounded-control bg-ink/6" />
          </div>
          <div className="flex gap-2.5 pt-2">
            {[1, 2, 3, 4, 5].map((puesto) => (
              <div key={puesto} className="flex flex-1 flex-col gap-2">
                <div className="size-3.5 rounded-pill bg-ink/6" />
                <div className="h-2.5 rounded-control bg-ink/6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Pagina>
  );
}

function LaVista({
  trabajo,
  hoy,
  alMandar,
}: {
  trabajo: TrabajoDelCliente;
  hoy: string;
  alMandar?: MandarLaEntrega;
}) {
  const m = useMensajesDelCliente();
  const vista = useMemo(() => vistaDelCliente(trabajo, hoy, m.vista.delDominio), [trabajo, hoy, m]);
  return <VistaDelCliente vista={vista} hoy={hoy} alMandar={alMandar} />;
}

function MientrasNoEsta({
  resultado,
  elQueNoEsta,
}: {
  resultado: Exclude<ResultadoDeLaVista, { estado: 'lista' }>;
  elQueNoEsta: ElQueNoEsta;
}) {
  const { pantalla } = useMensajesDelCliente().vista;

  if (resultado.estado === 'muerto') {
    const muerto = pantalla.muerto[elQueNoEsta];
    return <Aviso titulo={muerto.titulo} texto={muerto.texto} ilustracion="anulado" />;
  }

  if (resultado.estado === 'sin-senal') {
    return (
      <Aviso
        titulo={pantalla.sinSenal.titulo}
        texto={pantalla.sinSenal.texto}
        ilustracion="sin-senal"
      />
    );
  }

  if (resultado.estado === 'error') {
    const reintentar = resultado.reintentar;
    return (
      <Aviso
        titulo={pantalla.error.titulo}
        texto={pantalla.error.texto}
        ilustracion="se-corto"
        accion={<Button onClick={reintentar}>{pantalla.error.reintentar}</Button>}
      />
    );
  }

  return <Esqueleto />;
}

export function PantallaDeLaVista({
  resultado,
  idiomaDeEspera,
  elQueNoEsta,
  alMandar,
}: PantallaDeLaVistaProps) {
  if (resultado.estado === 'lista') {
    return (
      <ConElIdiomaDelCliente
        idioma={resultado.trabajo.idioma}
        mientrasCarga={
          <ConElIdiomaDelCliente idioma={idiomaDeEspera}>
            <Esqueleto />
          </ConElIdiomaDelCliente>
        }
      >
        <LaVista trabajo={resultado.trabajo} hoy={resultado.hoy} alMandar={alMandar} />
      </ConElIdiomaDelCliente>
    );
  }

  return (
    <ConElIdiomaDelCliente idioma={idiomaDeEspera}>
      <MientrasNoEsta resultado={resultado} elQueNoEsta={elQueNoEsta} />
    </ConElIdiomaDelCliente>
  );
}

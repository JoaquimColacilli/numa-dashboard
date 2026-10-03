import type { Idioma } from '@maun/domain';
import { useMutationState } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import {
  ESPACIO_DEL_PLAN_BYTES,
  ESPACIO_PARA_AVISAR_BYTES,
  espacioUsado,
  pesoLegible,
} from '@/entities/archivo';
import {
  describirDesenlace,
  useReplicaDelTaller,
  useSincronizarAhora,
  type DesenlaceDeLaSincronizacion,
} from '@/entities/replica';
import { useSesionActiva } from '@/entities/sesion';
import { AjusteDeHuella } from '@/features/activar-huella';
import { AjusteDeCocos } from '@/features/ajustar-cocos';
import { FotosDeLaVidriera } from '@/features/armar-la-vidriera';
import { BotonSalir } from '@/features/cerrar-sesion';
import {
  FormularioDeCobro,
  FormularioDeConfiguracion,
  FormularioDeRedes,
  FormularioDeResena,
  hayRedesCargadas,
  IdiomaDeLosClientes,
  ResumenDelPresupuesto,
  type ParteDeLaConfiguracion,
} from '@/features/configurar-taller';
import { FormularioDePerfil } from '@/features/editar-perfil';
import { SelectorDeIdioma } from '@/features/elegir-idioma';
import { SelectorDeTema } from '@/features/elegir-tema';
import { VersionDeLaApp } from '@/features/ver-novedades';
import {
  ajustesDe,
  filaDelTaller,
  householdDe,
  mensajeDeSincronizacion,
  saldosDeLaReplica,
} from '@/shared/api';
import { useMensajes, type Mensajes } from '@/shared/idioma';
import {
  describirEstadoSync,
  esCelular,
  etiquetaActual,
  idiomaActual,
  RUTA_DE_AVISOS,
  RUTA_DE_TESOROS,
  useAvisos,
  useEstadoSync,
  Ir,
} from '@/shared/lib';
import { Button, Icono, Pagina, PanelDeAvisos, SeccionEnFila, SeccionesEnFilas } from '@/shared/ui';

const MUESTRA_DEL_DESENLACE_MS = 6000;

const SOLO_EL_REPARTO: readonly ParteDeLaConfiguracion[] = ['reparto'];

const SOLO_EL_TALLER: readonly ParteDeLaConfiguracion[] = ['taller'];

const FORMATO_DE_LA_SINCRONIZACION: Readonly<Record<Idioma, Intl.DateTimeFormatOptions>> = {
  es: { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h12' },
  en: { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hourCycle: 'h12' },
  'pt-BR': { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
};

function ultimaSincronizacion(valor: string, m: Mensajes): string {
  const marca = Date.parse(valor);
  if (Number.isNaN(marca)) return m.paginaAjustes.nuncaSeSincronizo;
  const cuando = new Intl.DateTimeFormat(
    etiquetaActual(),
    FORMATO_DE_LA_SINCRONIZACION[idiomaActual()],
  ).format(new Date(marca));
  return m.paginaAjustes.ultimaSincronizacion({ cuando: cuando.replace(/\.$/u, '') });
}

function Junto({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap">{children}</span>;
}

function SincronizarAhora() {
  const m = useMensajes();
  const { usuarioId } = useSesionActiva();
  const sincronizarAhora = useSincronizarAhora(usuarioId);
  const [sincronizando, setSincronizando] = useState(false);
  const [desenlace, setDesenlace] = useState<DesenlaceDeLaSincronizacion | null>(null);

  useEffect(() => {
    if (desenlace === null) return;
    const reloj = setTimeout(() => {
      setDesenlace(null);
    }, MUESTRA_DEL_DESENLACE_MS);
    return () => {
      clearTimeout(reloj);
    };
  }, [desenlace]);

  const descripcion = desenlace === null ? null : describirDesenlace(desenlace);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="secundario"
        size="chico"
        disabled={sincronizando}
        onClick={() => {
          setSincronizando(true);
          setDesenlace(null);
          void sincronizarAhora().then((resultado) => {
            setDesenlace(resultado);
            setSincronizando(false);
          });
        }}
      >
        <Icono
          nombre="refresh-cw"
          tamano={16}
          className={sincronizando ? 'motion-safe:animate-maun-spin' : undefined}
        />
        {sincronizando ? m.paginaAjustes.sincronizando : m.paginaAjustes.sincronizarAhora}
      </Button>
      <p aria-live="polite" className="flex items-start gap-1.5 text-label text-text-2">
        {descripcion && (
          <>
            <Icono nombre={descripcion.icono} tamano={15} className="mt-px flex-none" />
            {descripcion.texto}
          </>
        )}
      </p>
    </div>
  );
}

function RechazosDeLaCola() {
  const rechazos = useMutationState({
    filters: { status: 'error' },
    select: (mutacion) => ({ id: mutacion.mutationId, error: mutacion.state.error }),
  });

  if (rechazos.length === 0) return null;

  return (
    <ul className="flex flex-col">
      {rechazos.map((rechazo) => (
        <li
          key={rechazo.id}
          className="border-t border-hairline-soft py-2.5 text-body leading-relaxed text-alerta"
        >
          {mensajeDeSincronizacion(rechazo.error)}
        </li>
      ))}
    </ul>
  );
}

function Avisos() {
  const m = useMensajes();
  const avisos = useAvisos();
  const rechazos = useMutationState({ filters: { status: 'error' }, select: () => true });

  if (avisos.length === 0 && rechazos.length === 0) {
    return <p className="text-body text-text-2">{m.paginaAjustes.nadaRechazado}</p>;
  }

  return (
    <>
      <PanelDeAvisos avisos={avisos} anidado>
        {(aviso) =>
          aviso.ruta === null ? null : (
            <Ir
              a={aviso.ruta}
              className="mt-1 inline-block text-label font-semibold underline underline-offset-3"
            >
              {m.paginaAjustes.verElSujeto({ sujeto: aviso.sujeto })}
            </Ir>
          )
        }
      </PanelDeAvisos>
      <RechazosDeLaCola />
    </>
  );
}

export function AjustesPage() {
  const m = useMensajes();
  const replica = useReplicaDelTaller();
  const estadoSync = useEstadoSync();
  const household = householdDe(replica);
  const ajustes = ajustesDe(replica);
  const filaGuardada = filaDelTaller(replica).guardada;
  const usado = espacioUsado(replica);

  return (
    <Pagina className="gap-3 md:gap-4">
      <header className="flex min-h-button flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-h1 leading-tight lg:text-h1-lg">
          {m.paginaAjustes.titulo}
        </h1>
      </header>

      <SeccionesEnFilas>
        <SeccionEnFila id="titulo-perfil" titulo={m.paginaAjustes.tuPerfil}>
          <FormularioDePerfil />
        </SeccionEnFila>

        <SeccionEnFila id="titulo-apariencia" titulo={m.paginaAjustes.apariencia}>
          <SelectorDeTema />
        </SeccionEnFila>

        <SeccionEnFila id="titulo-idioma" titulo={m.paginaAjustes.idioma}>
          <SelectorDeIdioma />
        </SeccionEnFila>

        <SeccionEnFila id="titulo-dispositivo" titulo={m.paginaAjustes.esteDispositivo}>
          <p className="text-body text-text-2">{describirEstadoSync(estadoSync)}</p>
          <p className="text-label text-text-3 tabular-nums">
            {ultimaSincronizacion(replica.cursor, m)}
          </p>
          <SincronizarAhora />
        </SeccionEnFila>

        <SeccionEnFila id="titulo-avisos-de-la-agenda" titulo={m.paginaAjustes.avisosDeLaAgenda}>
          <p className="max-w-[42rem] text-body leading-relaxed text-text-2">
            {m.paginaAjustes.unRecordatorioALaManana}
          </p>
          <Ir
            a={RUTA_DE_AVISOS}
            className="inline-flex min-h-tap items-center gap-1.5 self-start rounded-field text-body font-semibold underline underline-offset-3"
          >
            <Icono nombre="bell" tamano={18} />
            {m.paginaAjustes.configurarLosAvisos}
          </Ir>
        </SeccionEnFila>

        {esCelular() && (
          <SeccionEnFila id="titulo-huella" titulo={m.paginaAjustes.entrarConLaHuella}>
            <AjusteDeHuella />
          </SeccionEnFila>
        )}

        <SeccionEnFila
          id="titulo-rechazos"
          titulo={m.paginaAjustes.loQueLaBaseRechazo}
          bajada={
            <p className="text-label leading-relaxed text-text-2">
              {m.paginaAjustes.quedaAcaHastaQueLoDescartes}
            </p>
          }
        >
          <Avisos />
        </SeccionEnFila>

        {household && ajustes && (
          <SeccionEnFila
            id="titulo-reparto"
            titulo={m.paginaAjustes.sueldoYCostosFijos}
            bajada={
              filaGuardada ? undefined : (
                <p className="text-label leading-relaxed text-text-2">
                  {m.paginaAjustes.conEstoSeArmaLaFila}
                </p>
              )
            }
          >
            {filaGuardada ? (
              <p className="max-w-[42rem] text-body leading-relaxed text-text-2">
                {m.paginaAjustes.seArmanEnLaFila}
              </p>
            ) : (
              <FormularioDeConfiguracion
                household={household}
                ajustes={ajustes}
                partes={SOLO_EL_REPARTO}
              />
            )}
            <Ir
              a={RUTA_DE_TESOROS}
              className="inline-flex min-h-tap items-center gap-1.5 self-start rounded-field text-body font-semibold underline underline-offset-3"
            >
              <Icono nombre="gem" tamano={18} />
              {m.paginaAjustes.verLaFila}
            </Ir>
          </SeccionEnFila>
        )}

        {household && ajustes && (
          <SeccionEnFila id="titulo-taller" titulo={m.paginaAjustes.tuTaller}>
            <FormularioDeConfiguracion
              household={household}
              ajustes={ajustes}
              partes={SOLO_EL_TALLER}
            />
            <IdiomaDeLosClientes ajustes={ajustes} />
          </SeccionEnFila>
        )}

        {household && ajustes && (
          <SeccionEnFila
            id="titulo-presupuesto"
            titulo={m.paginaAjustes.tuPresupuesto}
            bajada={
              <p className="text-label leading-relaxed text-text-2">
                {m.paginaAjustes.loQueVaEnCadaPresupuesto}
              </p>
            }
          >
            <ResumenDelPresupuesto household={household} ajustes={ajustes} />
          </SeccionEnFila>
        )}

        {ajustes && (
          <SeccionEnFila id="titulo-cobro" titulo={m.paginaAjustes.comoTePagan}>
            <p className="max-w-[42rem] text-body leading-relaxed text-text-2">
              {m.paginaAjustes.laCuentaALaQueTeTransfieren}
            </p>
            <p className="max-w-[42rem] text-body leading-relaxed text-text-2">
              {m.paginaAjustes.elLinkDeMercadoPago}
            </p>
            <FormularioDeCobro ajustes={ajustes} />
          </SeccionEnFila>
        )}

        {ajustes && (
          <SeccionEnFila id="titulo-resenas" titulo={m.paginaAjustes.resenasEnGoogle}>
            <p className="max-w-[42rem] text-body leading-relaxed text-text-2">
              {m.paginaAjustes.lePedimosLaResena}
            </p>
            <FormularioDeResena ajustes={ajustes} />
          </SeccionEnFila>
        )}

        {ajustes && (
          <SeccionEnFila
            id="titulo-vidriera"
            titulo={m.paginaAjustes.tuVidriera}
            bajada={
              <p className="text-label leading-relaxed text-text-2">
                {m.paginaAjustes.loQueVenTusClientes}
              </p>
            }
          >
            <FotosDeLaVidriera hayRedes={hayRedesCargadas(ajustes)} />
            <div className="flex flex-col gap-2 border-t border-hairline-soft pt-3.5">
              <h3 className="text-body font-semibold">{m.paginaAjustes.redes}</h3>
              <FormularioDeRedes ajustes={ajustes} />
            </div>
          </SeccionEnFila>
        )}

        <SeccionEnFila id="titulo-cocos" titulo={m.paginaAjustes.corregirElSaldoDeCocos}>
          <AjusteDeCocos saldo={saldosDeLaReplica(replica).cocos} />
        </SeccionEnFila>

        <SeccionEnFila id="titulo-espacio" titulo={m.paginaAjustes.espacioParaArchivos}>
          <p className="text-body leading-relaxed text-text-2 tabular-nums">
            {m.paginaAjustes.espacioUsado({
              usado: pesoLegible(usado),
              total: pesoLegible(ESPACIO_DEL_PLAN_BYTES),
              Junto,
            })}
          </p>
          {usado >= ESPACIO_PARA_AVISAR_BYTES && (
            <p className="text-label leading-relaxed font-medium text-atencion">
              {m.paginaAjustes.seEstaLlenando}
            </p>
          )}
        </SeccionEnFila>

        <SeccionEnFila id="titulo-cuenta" titulo={m.paginaAjustes.cuenta} cuerpo="items-start">
          <BotonSalir />
        </SeccionEnFila>

        <SeccionEnFila
          id="titulo-version"
          titulo={m.paginaAjustes.versionDeLaApp}
          cuerpo="items-start"
        >
          <VersionDeLaApp
            conInvitacion
            className="flex min-h-tap flex-col items-start justify-center gap-0.5 rounded-field text-left text-body text-text-2"
          />
        </SeccionEnFila>
      </SeccionesEnFilas>
    </Pagina>
  );
}

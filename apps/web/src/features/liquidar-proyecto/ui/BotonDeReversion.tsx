import { ESTADOS_DE_CONSULTA, type EstadoProyecto } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import {
  ESTADO,
  filaRevertida,
  loQueVuelveAlReabrir,
  MUTACION_DE_REVERSION,
  pedidoDeReversion,
  type Proyecto,
} from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { elTallerVaPorMes, mensajeDeSincronizacion, repartosDelProyecto } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { fechaLarga, formatearPesos, hoyEnElTaller, TINTA } from '@/shared/lib';
import { Button, FilaDeAcciones, Icono } from '@/shared/ui';

const POR_DEFECTO: EstadoProyecto = 'presupuesto_enviado';

function Negrita({ children }: { children: ReactNode }) {
  return <strong>{children}</strong>;
}

export interface BotonDeReversionProps {
  proyecto: Proyecto;
}

export function BotonDeReversion({ proyecto }: BotonDeReversionProps) {
  const textos = useMensajes().liquidarProyecto.reversion;
  const replica = useReplicaDelTaller();
  const revertir = useMutation(MUTACION_DE_REVERSION);
  const [abierto, setAbierto] = useState(false);
  const [hacia, setHacia] = useState<EstadoProyecto>(POR_DEFECTO);

  const esCobro = proyecto.estado === 'cobrado';
  const destino = esCobro ? 'entregado' : hacia;
  const vuelve = loQueVuelveAlReabrir(replica, proyecto);
  const cual = esCobro ? textos.cobro : textos.presupuesto;

  function confirmar(): void {
    revertir.mutate({
      pedido: pedidoDeReversion(proyecto, destino),
      optimista: filaRevertida(proyecto, destino, new Date().toISOString()),
      previo: proyecto,
      titulo: proyecto.titulo,
      repartos: repartosDelProyecto(replica, proyecto.id),
    });
    setAbierto(false);
  }

  if (!abierto) {
    return (
      <div>
        <Button
          variant="secundario"
          className="w-full"
          onClick={() => {
            setAbierto(true);
          }}
        >
          <Icono nombre="arrow-left-right" tamano={16} />
          {cual.abrir}
        </Button>
        {revertir.isError && (
          <p role="alert" className="mt-1.5 text-label font-medium text-alerta">
            {mensajeDeSincronizacion(revertir.error, {
              operacion: esCobro ? 'reapertura' : 'reactivacion',
              sujeto: proyecto.titulo,
              estado: esCobro ? 'cobrado' : 'perdido',
            })}
          </p>
        )}
      </div>
    );
  }

  return (
    <section
      aria-label={cual.abrir}
      className="rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <h3 className="text-section font-semibold">{cual.pregunta}</h3>

      {proyecto.reparto_ya_en_la_apertura && vuelve.length > 0 ? (
        <p className="mt-1.5 text-label leading-relaxed text-text-2">{textos.yaEnLaApertura}</p>
      ) : vuelve.length > 0 ? (
        <>
          <p className="mt-1.5 text-label leading-relaxed text-text-2">
            {textos.seDeshaceElReparto}
          </p>
          <ul aria-label={textos.loQueVuelve} className="mt-1.5 list-none">
            {vuelve.map((tesoro) => (
              <li
                key={tesoro.tesoro}
                className="flex items-center gap-2.5 border-t border-hairline-soft py-2 text-label first:border-t-0"
              >
                <span
                  aria-hidden
                  className={`size-3 flex-none rounded-[3px] ${TINTA[tesoro.tinta].fondo}`}
                />
                <span
                  translate="no"
                  className={`min-w-0 flex-1 font-medium ${TINTA[tesoro.tinta].texto}`}
                >
                  {tesoro.nombre}
                </span>
                <span translate="no" className="flex-none font-semibold tabular-nums">
                  {formatearPesos(tesoro.monto)}
                </span>
              </li>
            ))}
          </ul>
          {proyecto.fecha_cobro !== null && (
            <p className="mt-1.5 text-label leading-relaxed text-text-2">
              {textos.elMesDe(fechaLarga(proyecto.fecha_cobro, hoyEnElTaller()))}
            </p>
          )}
        </>
      ) : (
        <p className="mt-1.5 text-label leading-relaxed text-text-2">{textos.sinTesoros}</p>
      )}

      {esCobro ? (
        <p className="mt-2 text-meta leading-relaxed text-text-3">
          {proyecto.fecha_cobro === null
            ? textos.vuelveAEntregadoSinFecha(Negrita)
            : textos.vuelveAEntregado(Negrita, fechaLarga(proyecto.fecha_cobro, hoyEnElTaller()))}
          {elTallerVaPorMes(replica) && ` ${textos.loQueSiMira}`}
        </p>
      ) : (
        <>
          <label className="mt-3 block text-label text-text-2" htmlFor="estado-al-reactivar">
            {textos.vuelveALasConsultas}
          </label>
          <select
            id="estado-al-reactivar"
            value={hacia}
            onChange={(evento) => {
              setHacia(evento.target.value as EstadoProyecto);
            }}
            className="mt-1 h-field w-full rounded-field border border-border bg-paper px-3.5 text-body-lg"
          >
            {ESTADOS_DE_CONSULTA.map((estado) => (
              <option key={estado} value={estado}>
                {ESTADO[estado].etiqueta}
              </option>
            ))}
          </select>
          <p className="mt-2 text-meta leading-relaxed text-text-3">
            {textos.noGuardaLaFecha(Negrita)}
          </p>
        </>
      )}

      <FilaDeAcciones className="mt-3.5">
        <Button onClick={confirmar}>{cual.confirmar}</Button>
        <Button
          variant="secundario"
          onClick={() => {
            setAbierto(false);
          }}
        >
          {textos.dejarloComoEsta}
        </Button>
      </FilaDeAcciones>
    </section>
  );
}

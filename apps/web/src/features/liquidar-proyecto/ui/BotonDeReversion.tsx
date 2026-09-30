import { ESTADOS_DE_CONSULTA, type EstadoProyecto } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

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
import { fechaLarga, formatearPesos, hoyEnElTaller, TINTA } from '@/shared/lib';
import { Button, FilaDeAcciones, Icono } from '@/shared/ui';

const POR_DEFECTO: EstadoProyecto = 'presupuesto_enviado';

export interface BotonDeReversionProps {
  proyecto: Proyecto;
}

export function BotonDeReversion({ proyecto }: BotonDeReversionProps) {
  const replica = useReplicaDelTaller();
  const revertir = useMutation(MUTACION_DE_REVERSION);
  const [abierto, setAbierto] = useState(false);
  const [hacia, setHacia] = useState<EstadoProyecto>(POR_DEFECTO);

  const esCobro = proyecto.estado === 'cobrado';
  const destino = esCobro ? 'entregado' : hacia;
  const vuelve = loQueVuelveAlReabrir(replica, proyecto);

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
          {esCobro ? 'Reabrir el cobro' : 'Reactivar el presupuesto'}
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
      aria-label={esCobro ? 'Reabrir el cobro' : 'Reactivar el presupuesto'}
      className="rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <h3 className="text-section font-semibold">
        {esCobro ? '¿Reabrís el cobro?' : '¿Reactivás el presupuesto?'}
      </h3>

      {proyecto.reparto_ya_en_la_apertura && vuelve.length > 0 ? (
        <p className="mt-1.5 text-label leading-relaxed text-text-2">
          Este reparto ya estaba en tus saldos cuando empezaste con la app, así que deshacerlo no
          mueve plata de los tesoros. Los pagos y los gastos vuelven a poder editarse.
        </p>
      ) : vuelve.length > 0 ? (
        <>
          <p className="mt-1.5 text-label leading-relaxed text-text-2">
            Se deshace el reparto. Esto vuelve de cada tesoro a la caja del taller:
          </p>
          <ul aria-label="Lo que vuelve a la caja del taller" className="mt-1.5 list-none">
            {vuelve.map((tesoro) => (
              <li
                key={tesoro.tesoro}
                className="flex items-center gap-2.5 border-t border-hairline-soft py-2 text-label first:border-t-0"
              >
                <span
                  aria-hidden
                  className={`size-3 flex-none rounded-[3px] ${TINTA[tesoro.tinta].fondo}`}
                />
                <span className={`min-w-0 flex-1 font-medium ${TINTA[tesoro.tinta].texto}`}>
                  {tesoro.nombre}
                </span>
                <span className="flex-none font-semibold tabular-nums">
                  {formatearPesos(tesoro.monto)}
                </span>
              </li>
            ))}
          </ul>
          {proyecto.fecha_cobro !== null && (
            <p className="mt-1.5 text-label leading-relaxed text-text-2">
              El mes de {fechaLarga(proyecto.fecha_cobro, hoyEnElTaller())} deja de contar esta
              liquidación, y lo que les falte a los topes de la fila queda a la vista.
            </p>
          )}
        </>
      ) : (
        <p className="mt-1.5 text-label leading-relaxed text-text-2">
          Este reparto no movió ningún tesoro, así que deshacerlo tampoco mueve plata. Los pagos y
          los gastos vuelven a poder editarse.
        </p>
      )}

      {esCobro ? (
        <p className="mt-2 text-meta leading-relaxed text-text-3">
          Vuelve a <strong>Entregado</strong>. Cuando lo vuelvas a cobrar, el día de este cobro
          {proyecto.fecha_cobro !== null
            ? ` (${fechaLarga(proyecto.fecha_cobro, hoyEnElTaller())})`
            : ''}{' '}
          viene puesto y lo podés corregir. Se vuelve a cobrar con la misma fila de este cobro:
          corregir un gasto no te reescribe los topes ni el reparto con la fila de hoy.
          {elTallerVaPorMes(replica) &&
            ' Lo que sí mira es lo que tu sueldo ya recibió ese mes, como en un cobro nuevo.'}
        </p>
      ) : (
        <>
          <label className="mt-3 block text-label text-text-2" htmlFor="estado-al-reactivar">
            Vuelve a las consultas, en
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
            A diferencia de reabrir un cobro, esto <strong>no guarda la fecha</strong>: un
            presupuesto que revive está vivo otra vez, y si más adelante lo volvés a dar por perdido
            es un cierre nuevo, con el día que elijas y la fila de ese momento.
          </p>
        </>
      )}

      <FilaDeAcciones className="mt-3.5">
        <Button onClick={confirmar}>
          {esCobro ? 'Reabrir y deshacer el reparto' : 'Reactivar y deshacer el reparto'}
        </Button>
        <Button
          variant="secundario"
          onClick={() => {
            setAbierto(false);
          }}
        >
          Dejarlo como está
        </Button>
      </FilaDeAcciones>
    </section>
  );
}

import { centavos, type Money } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useState, type ReactNode, type SyntheticEvent } from 'react';

import { MUTACION_DE_MOVIMIENTO } from '@/entities/movimiento';
import { mensajeDeSincronizacion } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { formatearPesos, hoyLocal, useEstadoSync, uuidv7 } from '@/shared/lib';
import { Button, MoneyInput } from '@/shared/ui';

import { ajusteDeCocos } from '../model/ajuste';

export interface AjusteDeCocosProps {
  saldo: Money;
}

function LaResta({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}

function ElAsiento({ children }: { children: ReactNode }) {
  return (
    <strong translate="no" className="font-semibold">
      {children}
    </strong>
  );
}

function conSigno(diferencia: Money, monto: Money): string {
  return `${diferencia > 0 ? '+' : '−'}${formatearPesos(monto)}`;
}

export function AjusteDeCocos({ saldo }: AjusteDeCocosProps) {
  const textos = useMensajes().ajustarCocos;
  const [leido, setLeido] = useState<number | null>(saldo);
  const [error, setError] = useState<string | undefined>(undefined);
  const [hecho, setHecho] = useState<string | undefined>(undefined);

  const mutacion = useMutation(MUTACION_DE_MOVIMIENTO);
  const estadoSync = useEstadoSync();

  const ajuste = leido === null ? null : ajusteDeCocos(saldo, centavos(leido));

  function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (leido === null) {
      setError(textos.faltaElSaldo);
      return;
    }
    setError(undefined);
    if (!ajuste) {
      setHecho(textos.sinDiferencia);
      return;
    }

    mutacion.mutate({
      id: uuidv7(),
      fecha: hoyLocal(),
      tipo: 'ajuste',
      tesoro_origen: ajuste.origen,
      tesoro_destino: ajuste.destino,
      monto_centavos: ajuste.monto,
      categoria: 'Ajuste',
      descripcion: ajuste.concepto,
    });
    setHecho(
      textos.anotado(conSigno(ajuste.diferencia, ajuste.monto), formatearPesos(centavos(leido))),
    );
  }

  return (
    <form noValidate className="flex flex-col gap-3" onSubmit={enviar}>
      <p className="max-w-[42rem] text-label leading-relaxed text-text-2">
        {textos.explicacion(LaResta)}
      </p>

      <dl className="flex max-w-(--campo-largo) items-baseline justify-between gap-4 border-y border-hairline-soft py-2">
        <dt className="text-label text-text-2">{textos.calculado}</dt>
        <dd translate="no" className="text-body font-semibold tabular-nums">
          {formatearPesos(saldo)}
        </dd>
      </dl>

      <MoneyInput
        etiqueta={textos.saldoReal}
        className="max-w-(--campo-medio)"
        value={leido}
        error={error}
        onChange={(centavos) => {
          setLeido(centavos);
          setError(undefined);
          setHecho(undefined);
        }}
      />

      {ajuste !== null && hecho === undefined && (
        <p className="rounded-field bg-cocos-tint px-3.5 py-2.5 text-label leading-relaxed text-ink">
          {textos.vaAAnotar(ElAsiento, conSigno(ajuste.diferencia, ajuste.monto), ajuste.concepto)}
        </p>
      )}

      {hecho !== undefined && (
        <p role="status" className="text-label leading-relaxed text-hogar">
          {hecho}
        </p>
      )}
      {mutacion.isError && (
        <p role="alert" className="text-label font-medium text-alerta">
          {mensajeDeSincronizacion(mutacion.error)}
        </p>
      )}
      {mutacion.isPending && estadoSync.tipo === 'sin-conexion' && (
        <p className="text-label text-atencion">{textos.enLaCola}</p>
      )}

      <Button type="submit" cargando={mutacion.isPending} className="self-start">
        {textos.ajustar}
      </Button>
    </form>
  );
}

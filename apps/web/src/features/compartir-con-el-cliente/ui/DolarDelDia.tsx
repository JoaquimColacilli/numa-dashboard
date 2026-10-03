import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { dolarDelDiaDelTaller } from '@/entities/proyecto';
import { MUTACION_DE_AJUSTES, useReplicaDelTaller } from '@/entities/replica';
import { ajustesDe, mensajeDeSincronizacion } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { diaYMes, hoyEnElTaller, useAlgoEnCurso } from '@/shared/lib';
import { CampoDelDolar, errorDelDolar, EstadoDeGuardado } from '@/shared/ui';

const DEMORA_DEL_DOLAR_MS = 900;

interface Escrito {
  valor: number | null;
}

export function DolarDelDia() {
  const t = useMensajes().compartirConElCliente.comoTePaga;
  const replica = useReplicaDelTaller();
  const ajustes = ajustesDe(replica);
  const guardado = dolarDelDiaDelTaller(replica);
  const hoy = hoyEnElTaller();
  const guardar = useMutation(MUTACION_DE_AJUSTES);
  const [escrito, setEscrito] = useState<Escrito | null>(null);
  const [sinGuardar, setSinGuardar] = useState(false);
  const reloj = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useAlgoEnCurso(sinGuardar);

  useEffect(
    () => () => {
      clearTimeout(reloj.current);
    },
    [],
  );

  if (ajustes === undefined) return null;
  const { id } = ajustes;

  const valor = escrito === null ? (guardado?.valor ?? null) : escrito.valor;
  const fecha = escrito === null ? (guardado?.fecha ?? null) : valor === null ? null : hoy;
  const error = errorDelDolar(valor, false);
  const vigencia =
    fecha === null ? [] : [fecha === hoy ? t.valeParaHoy : t.valeParaElDia(diaYMes(fecha, hoy))];

  function alEscribir(nuevo: number | null): void {
    setEscrito({ valor: nuevo });
    clearTimeout(reloj.current);
    const sePuedeGuardar = errorDelDolar(nuevo, false) === undefined;
    setSinGuardar(sePuedeGuardar);
    if (!sePuedeGuardar) return;
    const previos = {
      dolar_del_dia_centavos: guardado?.valor ?? null,
      dolar_del_dia_el: guardado?.fecha ?? null,
    };
    reloj.current = setTimeout(() => {
      setSinGuardar(false);
      guardar.mutate({
        id,
        cambios: { dolar_del_dia_centavos: nuevo, dolar_del_dia_el: nuevo === null ? null : hoy },
        previos,
      });
    }, DEMORA_DEL_DOLAR_MS);
  }

  return (
    <div className="flex flex-col gap-1.5 pb-3">
      <CampoDelDolar
        etiqueta={t.dolarDelDia}
        value={valor}
        onChange={alEscribir}
        error={error}
        ayuda={error === undefined ? [...vigencia, t.ayudaDelDolarDelDia].join(' ') : undefined}
      />
      <EstadoDeGuardado
        sinGuardar={sinGuardar}
        enPausa={guardar.isPaused}
        enVuelo={guardar.isPending && !guardar.isPaused}
        conError={guardar.isError}
        guardado={guardar.isSuccess}
      />
      {guardar.isError && (
        <p role="alert" className="text-label font-medium text-alerta">
          {mensajeDeSincronizacion(guardar.error)}
        </p>
      )}
    </div>
  );
}

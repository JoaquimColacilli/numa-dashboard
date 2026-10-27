import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';

import { MUTACION_DE_LA_FECHA_DEL_CONTACTO, type ProximoContacto } from '@/entities/proyecto';
import { mensajeDeSincronizacion, traducirRechazo } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { fechaLarga, hoyEnElTaller, metaDeAvisos } from '@/shared/lib';
import { Button, FilaDeAcciones, Hoja } from '@/shared/ui';

import { errorDelProximoContacto } from '../model/seguimiento';
import { CuandoLeEscribis } from './CuandoLeEscribis';

export interface HojaDeCambiarLaFechaProps {
  pendiente: ProximoContacto;
  nombre: string;
  titulo: string;
  alCerrar: () => void;
}

export function HojaDeCambiarLaFecha({
  pendiente,
  nombre,
  titulo,
  alCerrar,
}: HojaDeCambiarLaFechaProps) {
  const m = useMensajes().hacerElSeguimiento.cambiarLaFecha;
  const hoy = hoyEnElTaller();
  const [fecha, setFecha] = useState(pendiente.fecha < hoy ? '' : pendiente.fecha);
  const [error, setError] = useState<string | undefined>(undefined);
  const yaTermino = useRef(false);
  const guardar = useMutation({
    ...MUTACION_DE_LA_FECHA_DEL_CONTACTO,
    meta: metaDeAvisos('fechaDelContacto', { errorEnPantalla: true, sujeto: titulo }),
  });

  useEffect(() => {
    if (!guardar.isPaused || yaTermino.current) return;
    yaTermino.current = true;
    alCerrar();
  }, [guardar.isPaused, alCerrar]);

  function terminar(): void {
    if (yaTermino.current) return;
    yaTermino.current = true;
    alCerrar();
  }

  function enviar(evento: SyntheticEvent<HTMLFormElement>): void {
    evento.preventDefault();
    const encontrado = errorDelProximoContacto(fecha, hoy);
    setError(encontrado);
    if (encontrado !== undefined) return;
    if (fecha === pendiente.fecha) {
      terminar();
      return;
    }
    guardar.mutate(
      { contacto: pendiente, fecha, momento: new Date().toISOString() },
      { onSuccess: terminar },
    );
  }

  const rechazo = guardar.isError
    ? (traducirRechazo(guardar.error, { operacion: 'proyecto', sujeto: titulo }) ?? {
        titulo: m.noSeCambio,
        queHacer: mensajeDeSincronizacion(guardar.error),
      })
    : null;

  return (
    <Hoja
      titulo={m.titulo}
      bajada={
        <span translate="no" className="truncate text-label text-text-2">
          {`${nombre} · ${titulo}`}
        </span>
      }
      alCerrar={alCerrar}
      conCambios={fecha !== pendiente.fecha}
    >
      {(pedirCierre) => (
        <form noValidate onSubmit={enviar} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
            <p className="text-body leading-relaxed text-text-2">
              {m.leTocaba(fechaLarga(pendiente.fecha, hoy))}
            </p>
            <CuandoLeEscribis
              hoy={hoy}
              fecha={fecha}
              error={error}
              leyenda={m.queDia}
              alCambiar={(nueva) => {
                setFecha(nueva);
                setError(undefined);
              }}
            />
            <p className="text-meta leading-relaxed text-text-3">{m.noQuedaRegistrado}</p>
            {rechazo !== null && (
              <p role="alert" className="text-body leading-relaxed text-alerta">
                <span className="block font-semibold">{rechazo.titulo}</span>
                {rechazo.queHacer}
              </p>
            )}
          </div>
          <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
            <FilaDeAcciones>
              <Button variant="secundario" onClick={pedirCierre}>
                {m.cancelar}
              </Button>
              <Button type="submit" cargando={guardar.isPending && !guardar.isPaused}>
                {m.cambiar}
              </Button>
            </FilaDeAcciones>
          </footer>
        </form>
      )}
    </Hoja>
  );
}

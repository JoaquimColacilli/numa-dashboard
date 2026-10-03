import { useId, useRef, useState } from 'react';

import { MarcaDeCategoria } from '@/entities/agenda';
import { useMensajes } from '@/shared/idioma';
import { pedirPermisoDeAvisos } from '@/shared/lib';
import { Button } from '@/shared/ui';

import { horaEnPantalla } from '../model/textos';
import { OpcionesDeZona } from './OpcionesDeZona';

export interface ActivarLosAvisosProps {
  hora: string;
  zonaGuardada: string | null;
  activando: boolean;
  mensaje: string | null;
  alActivar: (permiso: Promise<NotificationPermission>, zona: string) => void;
}

export function ActivarLosAvisos({
  hora,
  zonaGuardada,
  activando,
  mensaje,
  alActivar,
}: ActivarLosAvisosProps) {
  const m = useMensajes();
  const id = useId();
  const idTitulo = `${id}-titulo`;
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const selector = useRef<HTMLSelectElement>(null);
  const [zona, setZona] = useState(zonaGuardada ?? '');
  const [faltaLaZona, setFaltaLaZona] = useState(false);

  function activar(): void {
    if (zona === '') {
      setFaltaLaZona(true);
      selector.current?.focus();
      return;
    }
    alActivar(pedirPermisoDeAvisos(), zona);
  }

  return (
    <section
      aria-labelledby={idTitulo}
      className="flex flex-col gap-4 rounded-panel border border-ink bg-paper px-4 py-4 md:px-5"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="flex flex-none flex-col items-center gap-1.5 pt-1">
          <MarcaDeCategoria categoria="entrega" />
          <MarcaDeCategoria categoria="presupuesto" />
          <MarcaDeCategoria categoria="visita" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={idTitulo} className="text-section leading-tight font-semibold">
            {m.recibirAvisos.queTeAviseALaManana}
          </h2>
          <p className="mt-1.5 text-body leading-relaxed text-text-2">
            {m.recibirAvisos.aLasTeLlega({ hora: horaEnPantalla(hora) })}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-body font-semibold">
          {m.recibirAvisos.dondeVivis}
        </label>
        <p id={idAyuda} className="text-label leading-relaxed text-text-2">
          {m.recibirAvisos.elAvisoLoMandaUnServidor}
        </p>
        <select
          ref={selector}
          id={id}
          value={zona}
          aria-invalid={faltaLaZona || undefined}
          aria-describedby={faltaLaZona ? `${idAyuda} ${idError}` : idAyuda}
          onChange={(evento) => {
            setZona(evento.target.value);
            setFaltaLaZona(false);
          }}
          className={`h-field w-full max-w-[320px] min-w-0 rounded-field border bg-paper px-3 text-body text-ink ${
            faltaLaZona ? 'border-alerta' : 'border-border'
          }`}
        >
          {zona === '' && (
            <option value="" disabled>
              {m.recibirAvisos.eligeTuZonaHoraria}
            </option>
          )}
          <OpcionesDeZona guardada={zonaGuardada} />
        </select>
        {faltaLaZona && (
          <span id={idError} role="alert" className="text-label font-medium text-alerta">
            {m.recibirAvisos.eligeDondeVivis}
          </span>
        )}
      </div>

      <div className="flex flex-col items-start gap-2">
        <Button size="grande" cargando={activando} onClick={activar}>
          {activando ? m.recibirAvisos.activando : m.recibirAvisos.activarLosAvisos}
        </Button>
        <p className="max-w-[320px] text-label leading-relaxed text-text-3">
          {m.recibirAvisos.elSistemaTeVaAPreguntar}
        </p>
      </div>

      {mensaje !== null && (
        <p role="alert" className="text-label leading-relaxed font-medium text-alerta">
          {mensaje}
        </p>
      )}
    </section>
  );
}

import { useId } from 'react';

import { useMensajes } from '@/shared/idioma';
import { Button, Icono } from '@/shared/ui';

import { pasosEnElIphone, pasosParaDesbloquear } from '../model/textos';

const TARJETA =
  'flex flex-col gap-2.5 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5';
const TITULO = 'flex items-center gap-2.5 text-section leading-tight font-semibold';
const TEXTO = 'text-body leading-relaxed text-text-2';
const PASOS = 'flex list-decimal flex-col gap-1.5 pl-5 text-body leading-relaxed';
const FILAS_DEL_ESQUELETO = ['entregas', 'visitas', 'presupuestos', 'seguimientos', 'anotaciones'];

export function EsqueletoDeLosAvisos() {
  const m = useMensajes();
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3 md:gap-4">
      <span className="sr-only">{m.recibirAvisos.leyendoTusAvisos}</span>
      <div aria-hidden className="h-[92px] rounded-panel border border-hairline bg-paper" />
      <div aria-hidden className="rounded-panel border border-hairline bg-paper px-4 md:px-5">
        {FILAS_DEL_ESQUELETO.map((fila) => (
          <div
            key={fila}
            className="flex items-center gap-3.5 border-t border-hairline-soft py-3.5 first:border-t-0"
          >
            <div className="size-[22px] rounded-control bg-ink/6" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3.5 w-2/5 rounded-control bg-ink/6" />
              <div className="h-3 w-[70%] rounded-control bg-ink/6" />
            </div>
            <div className="h-9 w-[120px] rounded-field bg-ink/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorDeLosAvisos({
  sinSenal,
  alReintentar,
}: {
  sinSenal: boolean;
  alReintentar: () => void;
}) {
  const m = useMensajes();
  return (
    <div role="alert" className={TARJETA}>
      <p className={TITULO}>
        <Icono nombre="triangle-alert" tamano={20} className="flex-none" />
        {sinSenal
          ? m.recibirAvisos.sinSenalNoPodemosLeer
          : m.recibirAvisos.noPudimosLeerTuConfiguracion}
      </p>
      <p className={TEXTO}>{m.recibirAvisos.losActivosSiguenAndando}</p>
      <div>
        <Button onClick={alReintentar}>{m.recibirAvisos.reintentar}</Button>
      </div>
    </div>
  );
}

export function SinClaves() {
  const m = useMensajes();
  const id = useId();
  return (
    <section aria-labelledby={id} className={TARJETA}>
      <h2 id={id} className={TITULO}>
        <Icono nombre="bell-off" tamano={20} className="flex-none" />
        {m.recibirAvisos.todaviaNoEstanListos}
      </h2>
      <p className={TEXTO}>{m.recibirAvisos.faltanLasClaves}</p>
      <p className="text-label text-text-3">{m.recibirAvisos.mientrasTanto}</p>
    </section>
  );
}

export function InstalarEnElIphone() {
  const m = useMensajes();
  const id = useId();
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <section
        aria-labelledby={id}
        className="overflow-hidden rounded-panel border border-hairline bg-paper"
      >
        <div className="flex flex-col gap-2.5 border-b border-hairline px-4 py-4 md:px-5">
          <h2 id={id} className={TITULO}>
            <Icono nombre="smartphone" tamano={20} className="flex-none" />
            {m.recibirAvisos.primeroAgregaNuma}
          </h2>
          <p className={TEXTO}>{m.recibirAvisos.enElIphoneSoloLlegan}</p>
        </div>
        <div className="flex flex-col gap-2 px-4 py-4 md:px-5">
          <h3 className="text-body font-semibold">{m.recibirAvisos.iphoneEnSafari}</h3>
          <ol className={`${PASOS} text-text-2`}>
            {pasosEnElIphone().map((paso) => (
              <li key={paso}>{paso}</li>
            ))}
          </ol>
        </div>
      </section>
      <p className="text-label leading-relaxed text-text-3">{m.recibirAvisos.cuandoLaAbras}</p>
    </div>
  );
}

export function SinSoporte() {
  const m = useMensajes();
  const id = useId();
  return (
    <section aria-labelledby={id} className={TARJETA}>
      <h2 id={id} className={TITULO}>
        <Icono nombre="bell-off" tamano={20} className="flex-none" />
        {m.recibirAvisos.esteNavegadorNoPuede}
      </h2>
      <p className={TEXTO}>{m.recibirAvisos.paraRecibirlos}</p>
    </section>
  );
}

export function AvisosBloqueados({
  comoApp,
  mensaje,
  alRevisar,
}: {
  comoApp: boolean;
  mensaje: string | null;
  alRevisar: () => void;
}) {
  const m = useMensajes();
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-3 rounded-panel border border-alerta bg-alerta-tint px-4 py-4 md:px-5"
    >
      <h2 id={id} className={TITULO}>
        <Icono nombre="bell-off" tamano={20} className="flex-none" />
        {m.recibirAvisos.estanBloqueados}
      </h2>
      <p className={TEXTO}>{m.recibirAvisos.leDijisteQueNo}</p>
      <ol className={PASOS}>
        {pasosParaDesbloquear(comoApp).map((paso) => (
          <li key={paso}>{paso}</li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-2.5">
        <Button onClick={alRevisar}>{m.recibirAvisos.yaLoHabilite}</Button>
        <span className="text-label text-text-3">{m.recibirAvisos.mientrasTanto}</span>
      </div>
      {mensaje !== null && (
        <p role="alert" className="text-label leading-relaxed font-medium text-alerta">
          {mensaje}
        </p>
      )}
    </section>
  );
}

export function MejorEsfuerzo() {
  const m = useMensajes();
  return (
    <p className="max-w-[560px] border-l-2 border-border py-3.5 pl-4 text-body leading-relaxed text-text-2">
      {m.recibirAvisos.esUnRecordatorio}
    </p>
  );
}

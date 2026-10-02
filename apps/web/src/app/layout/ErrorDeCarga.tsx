import { BotonSalir } from '@/features/cerrar-sesion';
import { mensajeDeSincronizacion } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { Aviso, Button, FilaDeAcciones } from '@/shared/ui';

export function CargaQueTarda({ reintentar }: { reintentar: () => void }) {
  const m = useMensajes();
  return (
    <div className="flex flex-col items-start gap-3 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5">
      <p role="status" className="text-body leading-relaxed text-text-2">
        {m.appLayout.tardaMasDeLoNormal}
      </p>
      <FilaDeAcciones className="w-full max-w-[520px]">
        <Button onClick={reintentar}>{m.appLayout.reintentar}</Button>
        <BotonSalir size="normal" className="w-full" />
      </FilaDeAcciones>
    </div>
  );
}

export function ErrorDeCarga({
  error,
  reintentar,
  detalle,
}: {
  error: unknown;
  reintentar: () => void;
  detalle?: string;
}) {
  const m = useMensajes();
  return (
    <Aviso
      titulo={m.appLayout.noPudimosLeerTusDatos}
      mensaje={mensajeDeSincronizacion(error)}
      detalle={detalle ?? m.appLayout.sinNadaGuardado}
    >
      <Button onClick={reintentar}>{m.appLayout.reintentar}</Button>
      <BotonSalir size="normal" className="w-full" />
    </Aviso>
  );
}

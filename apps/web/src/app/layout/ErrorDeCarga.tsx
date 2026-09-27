import { BotonSalir } from '@/features/cerrar-sesion';
import { mensajeDeSincronizacion } from '@/shared/api';
import { Aviso, Button, FilaDeAcciones } from '@/shared/ui';

export function CargaQueTarda({ reintentar }: { reintentar: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5">
      <p role="status" className="text-body leading-relaxed text-text-2">
        Está tardando más de lo normal. Sigue intentando solo; si no avanza, reintentá o cerrá
        sesión.
      </p>
      <FilaDeAcciones className="w-full max-w-[520px]">
        <Button onClick={reintentar}>Reintentar</Button>
        <BotonSalir size="normal" className="w-full" />
      </FilaDeAcciones>
    </div>
  );
}

const SIN_NADA_GUARDADO =
  'En este dispositivo todavía no hay nada guardado para mostrarte mientras tanto.';

export function ErrorDeCarga({
  error,
  reintentar,
  detalle = SIN_NADA_GUARDADO,
}: {
  error: unknown;
  reintentar: () => void;
  detalle?: string;
}) {
  return (
    <Aviso
      titulo="No pudimos leer tus datos"
      mensaje={mensajeDeSincronizacion(error)}
      detalle={detalle}
    >
      <Button onClick={reintentar}>Reintentar</Button>
      <BotonSalir size="normal" className="w-full" />
    </Aviso>
  );
}

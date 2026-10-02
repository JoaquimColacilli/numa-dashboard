import { lazy, Suspense, useState } from 'react';

import { useMensajes } from '@/shared/idioma';
import { copiar, usePantallaDespierta } from '@/shared/lib';
import { Button, FilaDeAcciones, Hoja, Icono, Tilde } from '@/shared/ui';

const DibujoDelQr = lazy(async () => import('./DibujoDelQr'));

export interface HojaDelQrProps {
  trabajo: string;
  url: string;
  alCerrar: () => void;
}

const COPIADO_MS = 2_200;

export function HojaDelQr({ trabajo, url, alCerrar }: HojaDelQrProps) {
  const t = useMensajes().compartirConElCliente.qr;
  const [copiado, setCopiado] = useState(false);
  usePantallaDespierta(true);

  function alCopiar(): void {
    void copiar(url).then((resultado) => {
      if (resultado !== 'copiado') return;
      setCopiado(true);
      setTimeout(() => {
        setCopiado(false);
      }, COPIADO_MS);
    });
  }

  return (
    <Hoja titulo={t.titulo} ancho="angosto" alCerrar={alCerrar}>
      <div className="flex flex-col gap-3.5 px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-6 md:pb-5">
        <div className="flex flex-col gap-1">
          <span translate="no" className="text-body-lg leading-tight font-semibold text-pretty">
            {trabajo}
          </span>
          <span className="text-label text-text-2">{t.escanealo}</span>
        </div>

        <div className="rounded-panel border border-hairline bg-paper-fijo p-4">
          <Suspense
            fallback={
              <div
                aria-busy="true"
                className="aspect-square w-full rounded-field bg-surface-2 motion-safe:animate-maun-shimmer"
              >
                <span className="sr-only" role="status">
                  {t.dibujando}
                </span>
              </div>
            }
          >
            <DibujoDelQr texto={url} etiqueta={t.codigoDelEnlace(trabajo)} />
          </Suspense>
        </div>

        <p translate="no" className="text-label leading-normal break-all text-text-2 select-text">
          {url}
        </p>

        <FilaDeAcciones>
          <Button variant="secundario" onClick={alCopiar}>
            {copiado ? (
              <Tilde dibujar tamano={18} grosor={2} />
            ) : (
              <Icono nombre="copy" tamano={18} />
            )}
            {copiado ? t.copiado : t.copiarElEnlace}
          </Button>
          <Button onClick={alCerrar}>{t.listo}</Button>
        </FilaDeAcciones>

        <p className="text-meta leading-normal text-text-3">{t.esElMismoEnlace}</p>
      </div>
    </Hoja>
  );
}

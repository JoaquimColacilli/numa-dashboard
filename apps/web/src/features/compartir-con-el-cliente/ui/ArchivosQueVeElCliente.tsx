import { useMutation } from '@tanstack/react-query';

import {
  esImagen,
  MUTACION_DE_ARCHIVO_COMPARTIDO,
  pesoLegible,
  loQueVeElCliente,
  type Archivo,
} from '@/entities/archivo';
import { useMensajes } from '@/shared/idioma';
import { fechaLarga, hoyLocal } from '@/shared/lib';
import { Icono, Interruptor } from '@/shared/ui';

import { cuantosVeElCliente } from '../model/compartir';

export interface ArchivosQueVeElClienteProps {
  archivos: readonly Archivo[];
}

export function ArchivosQueVeElCliente({ archivos }: ArchivosQueVeElClienteProps) {
  const t = useMensajes().compartirConElCliente.archivos;
  const compartir = useMutation(MUTACION_DE_ARCHIVO_COMPARTIDO);
  const vistos = loQueVeElCliente(archivos);
  const hoy = hoyLocal();

  return (
    <section
      aria-label={t.titulo}
      className="rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2.5">
        <h2 className="text-section font-semibold">{t.titulo}</h2>
        <span className="text-label text-text-2">{cuantosVeElCliente(archivos)}</span>
      </div>
      <p className="mt-1.5 mb-2.5 text-body leading-normal text-text-2">{t.marcaUnoPorUno}</p>

      {vistos.ninguno && (
        <p
          role="alert"
          className="mb-2.5 flex items-baseline gap-2 rounded-field bg-surface px-3.5 py-3 text-body leading-normal"
        >
          <Icono nombre="eye-off" tamano={16} className="flex-none translate-y-0.5 text-text-2" />
          <span>
            <span className="font-semibold">{t.noVeNinguno(vistos.total)}</span> {t.prendeAbajo}
          </span>
        </p>
      )}

      {archivos.length === 0 ? (
        <p className="border-t border-hairline py-3.5 text-body text-text-2">{t.sinArchivos}</p>
      ) : (
        <ul className="list-none">
          {archivos.map((archivo) => (
            <li
              key={archivo.id}
              className="flex min-h-15 items-center gap-3 border-t border-hairline-soft py-2.5"
            >
              <span
                aria-hidden
                className={`flex size-10 flex-none items-center justify-center rounded-field bg-surface ${
                  archivo.visible_para_cliente ? 'text-ink' : 'text-text-3'
                }`}
              >
                <Icono nombre={esImagen(archivo) ? 'image' : 'file-text'} tamano={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  translate="no"
                  className={`block truncate text-body leading-normal font-medium ${
                    archivo.visible_para_cliente ? '' : 'text-text-2'
                  }`}
                >
                  {archivo.nombre}
                </span>
                <span translate="no" className="block text-label text-text-3">
                  {pesoLegible(archivo.bytes)} · {fechaLarga(archivo.created_at.slice(0, 10), hoy)}
                </span>
              </span>
              <Interruptor
                etiqueta={t.compartir(archivo.nombre)}
                activo={archivo.visible_para_cliente}
                alCambiar={(visible) => {
                  compartir.mutate({ id: archivo.id, visible });
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

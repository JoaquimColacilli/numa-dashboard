import type { CapturaDeArca } from '../../model/asistente';

const ARCHIVOS = import.meta.glob<string>('/src/assets/arca/*.{png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const PREFERIDA = /\.webp$/;

export function urlDeLaCaptura(
  nombre: CapturaDeArca,
  archivos: Readonly<Record<string, string>> = ARCHIVOS,
): string | null {
  const deEsaCaptura = Object.entries(archivos)
    .filter(
      ([ruta]) => ruta.slice(ruta.lastIndexOf('/') + 1).replace(/\.(png|webp)$/, '') === nombre,
    )
    .sort(([una], [otra]) => Number(PREFERIDA.test(otra)) - Number(PREFERIDA.test(una)));
  return deEsaCaptura[0]?.[1] ?? null;
}

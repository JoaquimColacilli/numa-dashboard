import type { Page } from '@playwright/test';

export type TipoDeImagenDePrueba = 'image/webp' | 'image/jpeg';

export async function fotoDePrueba(
  page: Page,
  numero: number,
  tipo: TipoDeImagenDePrueba = 'image/webp',
): Promise<Buffer> {
  const base64 = await page.evaluate(
    async ({ numero: cual, tipo: formato }) => {
      const lienzo = document.createElement('canvas');
      lienzo.width = 900;
      lienzo.height = 1200;
      const contexto = lienzo.getContext('2d');
      if (!contexto) throw new Error('Sin canvas');
      const tono = (cual * 47) % 360;
      const degradado = contexto.createLinearGradient(0, 0, 900, 1200);
      degradado.addColorStop(0, `hsl(${String(tono)} 30% 38%)`);
      degradado.addColorStop(1, `hsl(${String((tono + 40) % 360)} 35% 72%)`);
      contexto.fillStyle = degradado;
      contexto.fillRect(0, 0, 900, 1200);
      contexto.fillStyle = 'rgba(255, 255, 255, 0.85)';
      contexto.font = 'bold 320px sans-serif';
      contexto.textAlign = 'center';
      contexto.fillText(String(cual), 450, 700);
      const blob = await new Promise<Blob | null>((resolver) => {
        lienzo.toBlob(resolver, formato, 0.8);
      });
      if (!blob) throw new Error('Sin imagen');
      return new Promise<string>((resolver) => {
        const lector = new FileReader();
        lector.onload = () => {
          const resultado = typeof lector.result === 'string' ? lector.result : '';
          resolver(resultado.split(',')[1] ?? '');
        };
        lector.readAsDataURL(blob);
      });
    },
    { numero, tipo },
  );
  return Buffer.from(base64, 'base64');
}

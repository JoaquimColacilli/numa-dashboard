import { encode } from 'uqr';

export interface TrazoDelQr {
  d: string;
  lado: number;
}

export function trazoDelQr(texto: string): TrazoDelQr {
  const { data, size } = encode(texto, { ecc: 'M', border: 0 });
  const trazos: string[] = [];
  data.forEach((fila, y) => {
    fila.forEach((negro, x) => {
      if (negro) trazos.push(`M${String(x)} ${String(y)}h1v1h-1z`);
    });
  });
  return { d: trazos.join(''), lado: size };
}

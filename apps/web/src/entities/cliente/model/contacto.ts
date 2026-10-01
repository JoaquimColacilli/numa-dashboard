import { telefonoParaWhatsapp } from '@/shared/lib';

export { telefonoParaWhatsapp };

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const primera = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return `${primera}${ultima}`.toUpperCase();
}

export function nombreCorto(nombre: string): string {
  const limpio = nombre.trim();
  const primera = limpio.split(/\s+/)[0] ?? limpio;
  return primera === 'Familia' || primera === 'Estudio' ? limpio : primera;
}

export function enlaceDeLlamada(telefono: string): string | null {
  const numero = telefono.replace(/[^\d+]/g, '');
  return numero === '' ? null : `tel:${numero}`;
}

export function enlaceDeWhatsapp(telefono: string): string | null {
  const numero = telefonoParaWhatsapp(telefono);
  return numero === null ? null : `https://wa.me/${numero}`;
}

export function enlaceDeMapa(direccion: string, zona: string): string | null {
  const partes = [direccion, zona].map((parte) => parte.trim()).filter(Boolean);
  if (partes.length === 0) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partes.join(', '))}`;
}

export function enlaceDeEmail(email: string): string | null {
  const limpio = email.trim();
  return limpio === '' ? null : `mailto:${limpio}`;
}

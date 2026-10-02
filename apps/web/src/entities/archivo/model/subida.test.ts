import { describe, expect, it, vi } from 'vitest';

import type { ImagenDecodificada } from '@/shared/lib';

import { losVideosNoEntran } from './eleccion';
import type { ImagenPreparada } from './preparacion';
import {
  ArchivoRechazado,
  destinoDelTrabajo,
  subirUnArchivo,
  type DependenciasDeLaSubida,
  type DestinoDeLaSubida,
} from './subida';

const DESTINO = destinoDelTrabajo('h', 'p');

const SOLO_FOTOS: DestinoDeLaSubida = {
  loQueSeSube: {
    acepta: 'image/*',
    conPdf: false,
    videos: 'Los videos no van.',
    queSeSube: 'fotos y capturas',
  },
  ruta: (id, tipo, miniatura) =>
    `h/otra-carpeta/${id}${miniatura ? '.mini' : ''}.${tipo === 'image/webp' ? 'webp' : 'jpg'}`,
};

function dependencias(extra: Partial<DependenciasDeLaSubida> = {}) {
  const subidas: { ruta: string; bytes: number; tipo: string }[] = [];
  const liberar = vi.fn();
  const base: DependenciasDeLaSubida = {
    subir: (ruta, contenido) => {
      subidas.push({ ruta, bytes: contenido.size, tipo: contenido.type });
      return Promise.resolve();
    },
    decodificar: () =>
      Promise.resolve({
        fuente: {} as CanvasImageSource,
        tamano: { ancho: 4032, alto: 3024 },
        url: 'blob:x',
        liberar,
      } satisfies ImagenDecodificada),
    preparar: () =>
      Promise.resolve({
        completa: new Blob([new Uint8Array(250_000)], { type: 'image/webp' }),
        miniatura: new Blob([new Uint8Array(20_000)], { type: 'image/webp' }),
        ancho: 2000,
        alto: 1500,
        tipo: 'image/webp',
      } satisfies ImagenPreparada),
    nuevoId: () => 'a1',
    ...extra,
  };
  return { base, subidas, liberar };
}

function archivo(nombre: string, tipo: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], nombre, { type: tipo });
}

describe('subirUnArchivo', () => {
  it('una foto sube achicada, con su miniatura, y la fila dice lo que ocupa', async () => {
    const { base, subidas, liberar } = dependencias();
    const resultado = await subirUnArchivo(
      archivo('relevamiento.jpg', 'image/jpeg', 3_400_000),
      DESTINO,
      base,
    );

    expect(subidas).toEqual([
      { ruta: 'h/p/a1.webp', bytes: 250_000, tipo: 'image/webp' },
      { ruta: 'h/p/a1.mini.webp', bytes: 20_000, tipo: 'image/webp' },
    ]);
    expect(resultado).toEqual({
      id: 'a1',
      nombre: 'relevamiento.jpg',
      tipo: 'image/webp',
      bytes: 270_000,
      ancho: 2000,
      alto: 1500,
      original: 3_400_000,
      subido: 270_000,
    });
    expect(liberar).toHaveBeenCalledOnce();
  });

  it('un PDF sube tal cual, con su tipo aunque el sistema no lo haya dicho', async () => {
    const { base, subidas } = dependencias();
    const resultado = await subirUnArchivo(archivo('despiece.pdf', '', 800_000), DESTINO, base);

    expect(subidas).toEqual([{ ruta: 'h/p/a1.pdf', bytes: 800_000, tipo: 'application/pdf' }]);
    expect(resultado).toMatchObject({
      tipo: 'application/pdf',
      bytes: 800_000,
      ancho: null,
      alto: null,
    });
    expect(resultado.original).toBe(resultado.subido);
  });

  it('a un destino de solo fotos, la foto sube a su ruta y un PDF o un video no suben', async () => {
    const { base, subidas } = dependencias();
    const resultado = await subirUnArchivo(
      archivo('mesa.jpg', 'image/jpeg', 900),
      SOLO_FOTOS,
      base,
    );
    expect(subidas.map((subida) => subida.ruta)).toEqual([
      'h/otra-carpeta/a1.webp',
      'h/otra-carpeta/a1.mini.webp',
    ]);
    expect(resultado.tipo).toBe('image/webp');

    await expect(
      subirUnArchivo(archivo('despiece.pdf', 'application/pdf', 10), SOLO_FOTOS, base),
    ).rejects.toEqual(
      new ArchivoRechazado('«despiece.pdf» no se puede subir: se pueden subir fotos y capturas.'),
    );
    await expect(
      subirUnArchivo(archivo('visita.mp4', 'video/mp4', 10), SOLO_FOTOS, base),
    ).rejects.toEqual(new ArchivoRechazado('Los videos no van.'));
    expect(subidas).toHaveLength(2);
  });

  it('un video se rechaza antes de subir nada', async () => {
    const { base, subidas } = dependencias();
    await expect(
      subirUnArchivo(archivo('visita.mp4', 'video/mp4', 1000), DESTINO, base),
    ).rejects.toEqual(new ArchivoRechazado(losVideosNoEntran()));
    expect(subidas).toEqual([]);
  });

  it('si la subida se corta, libera la imagen igual', async () => {
    const { base, liberar } = dependencias({
      subir: () => Promise.reject(new TypeError('Failed to fetch')),
    });
    await expect(subirUnArchivo(archivo('a.png', 'image/png', 10), DESTINO, base)).rejects.toThrow(
      'Failed to fetch',
    );
    expect(liberar).toHaveBeenCalledOnce();
  });
});

import { describe, expect, it } from 'vitest';

import {
  eleccionDelArchivo,
  LO_QUE_SE_SUBE_A_UN_TRABAJO,
  losVideosNoEntran,
  medidasAchicadas,
  nombreParaGuardar,
  TIPOS_QUE_SE_ELIGEN,
  TOPE_DE_UN_PDF_BYTES,
} from './eleccion';

describe('qué se puede subir', () => {
  it('un video no entra, se lo reconozca por el tipo o por la extensión, y dice qué sí se puede', () => {
    expect(eleccionDelArchivo({ name: 'visita.mp4', type: 'video/mp4', size: 90_000_000 })).toEqual(
      {
        clase: 'rechazado',
        motivo: losVideosNoEntran(),
      },
    );
    expect(eleccionDelArchivo({ name: 'VID_2026.MOV', type: '', size: 10 })).toMatchObject({
      clase: 'rechazado',
      motivo: losVideosNoEntran(),
    });
    expect(losVideosNoEntran()).toMatch(/fotos o capturas/);
  });

  it('una foto, una captura o un render son imágenes, aunque el navegador no diga el tipo', () => {
    expect(eleccionDelArchivo({ name: 'a.jpg', type: 'image/jpeg', size: 1 })).toEqual({
      clase: 'imagen',
    });
    expect(eleccionDelArchivo({ name: 'render.png', type: 'image/png', size: 1 })).toEqual({
      clase: 'imagen',
    });
    expect(eleccionDelArchivo({ name: 'IMG_0001.HEIC', type: '', size: 1 })).toEqual({
      clase: 'imagen',
    });
  });

  it('un PDF entra hasta 10 MB, y si pesa más lo dice con su peso', () => {
    expect(
      eleccionDelArchivo({
        name: 'despiece.pdf',
        type: 'application/pdf',
        size: TOPE_DE_UN_PDF_BYTES,
      }),
    ).toEqual({ clase: 'pdf' });
    expect(eleccionDelArchivo({ name: 'presupuesto.PDF', type: '', size: 1 })).toEqual({
      clase: 'pdf',
    });

    const grande = eleccionDelArchivo({
      name: 'escaneo.pdf',
      type: 'application/pdf',
      size: 14 * 1024 * 1024,
    });
    expect(grande).toMatchObject({ clase: 'rechazado' });
    expect(grande.clase === 'rechazado' ? grande.motivo : '').toMatch(/«escaneo\.pdf» pesa 14 MB/);
  });

  it('lo demás no entra, y dice qué sí', () => {
    expect(
      eleccionDelArchivo({ name: 'planilla.xlsx', type: 'application/vnd.ms-excel', size: 1 }),
    ).toEqual({
      clase: 'rechazado',
      motivo: '«planilla.xlsx» no se puede subir: se pueden subir fotos, capturas y PDF.',
    });
  });

  it('a los archivos de un trabajo van los de siempre, y se eligen con el mismo filtro', () => {
    expect(LO_QUE_SE_SUBE_A_UN_TRABAJO).toEqual({
      acepta: TIPOS_QUE_SE_ELIGEN,
      conPdf: true,
      videos: losVideosNoEntran(),
      queSeSube: 'fotos, capturas y PDF',
    });
  });

  it('donde van solo fotos, un PDF no entra y lo que se dice es lo de ese lugar', () => {
    const soloFotos = {
      acepta: 'image/*',
      conPdf: false,
      videos: 'Los videos no van.',
      queSeSube: 'fotos y capturas',
    };
    expect(
      eleccionDelArchivo({ name: 'despiece.pdf', type: 'application/pdf', size: 1 }, soloFotos),
    ).toEqual({
      clase: 'rechazado',
      motivo: '«despiece.pdf» no se puede subir: se pueden subir fotos y capturas.',
    });
    expect(eleccionDelArchivo({ name: 'visita.mp4', type: '', size: 1 }, soloFotos)).toEqual({
      clase: 'rechazado',
      motivo: 'Los videos no van.',
    });
    expect(
      eleccionDelArchivo({ name: 'mesa.jpg', type: 'image/jpeg', size: 1 }, soloFotos),
    ).toEqual({ clase: 'imagen' });
  });
});

describe('medidasAchicadas', () => {
  it('lleva el lado más largo al máximo y conserva la proporción', () => {
    expect(medidasAchicadas(4032, 3024, 2000)).toEqual({ ancho: 2000, alto: 1500 });
    expect(medidasAchicadas(3024, 4032, 480)).toEqual({ ancho: 360, alto: 480 });
  });

  it('una imagen más chica que el máximo no se agranda', () => {
    expect(medidasAchicadas(800, 600, 2000)).toEqual({ ancho: 800, alto: 600 });
  });

  it('una tira muy finita no queda en cero', () => {
    expect(medidasAchicadas(10_000, 2, 480)).toEqual({ ancho: 480, alto: 1 });
  });
});

describe('nombreParaGuardar', () => {
  it('limpia los espacios, corta a 200 caracteres y no queda vacío', () => {
    expect(nombreParaGuardar('  despiece.pdf ')).toBe('despiece.pdf');
    expect(nombreParaGuardar('x'.repeat(250))).toHaveLength(200);
    expect(nombreParaGuardar('   ')).toBe('Archivo');
  });
});

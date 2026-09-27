import { describe, expect, it, vi } from 'vitest';

import {
  ArchivoRechazado,
  SIN_SENAL_PARA_ARCHIVOS,
  type Archivo,
  type DependenciasDeLaSubida,
} from '@/entities/archivo';
import {
  TABLAS_REPLICADAS,
  type FotoDeLaVidrieraNueva,
  type Replica,
  type TablaReplicada,
} from '@/shared/api';

import {
  avisoDelCorte,
  avisoDelExceso,
  avisoSinCompartir,
  conLaFotoElegida,
  destinoDeLaVidriera,
  disponibilidadDeLaFoto,
  fotosDeLosTrabajos,
  LOS_VIDEOS_NO_VAN_A_LA_VIDRIERA,
  subirALaVidriera,
  sumarDeLosTrabajos,
  textoDelBotonDeSumar,
  type FotoDeUnTrabajo,
  type ImagenDeUnTrabajo,
} from './sumar';

function archivo(id: string, extra: Partial<Archivo> = {}): Archivo {
  return {
    id,
    household_id: 'h',
    proyecto_id: 'p1',
    nombre: `${id}.jpg`,
    tipo: 'image/webp',
    bytes: 250_000,
    ancho: 2000,
    alto: 1500,
    visible_para_cliente: true,
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-09-20T10:00:00Z',
    deleted_at: null,
    version: 1,
    ...extra,
  };
}

function imagen(id: string, extra: Partial<Archivo> = {}): ImagenDeUnTrabajo {
  return { ...archivo(id, extra), ancho: 2000, alto: 1500 };
}

function replicaCon(tablas: Partial<Record<TablaReplicada, Record<string, unknown>>>): Replica {
  const todas = {} as Record<TablaReplicada, Record<string, unknown>>;
  for (const tabla of TABLAS_REPLICADAS) todas[tabla] = tablas[tabla] ?? {};
  return { usuarioId: 'u', cursor: '', reconciliadoEn: '', tablas: todas } as unknown as Replica;
}

function porId<T extends { id: string }>(filas: T[]): Record<string, T> {
  return Object.fromEntries(filas.map((fila) => [fila.id, fila]));
}

function elegible(id: string, extra: Partial<FotoDeUnTrabajo> = {}): FotoDeUnTrabajo {
  return { archivo: imagen(id), compartida: true, yaEsta: false, ...extra };
}

describe('las fotos de los trabajos para elegir', () => {
  it('son las imágenes de los trabajos vivos, agrupadas por trabajo y lo más nuevo primero', () => {
    const replica = replicaCon({
      proyectos: porId([
        { id: 'p1', titulo: 'Placard' },
        { id: 'p2', titulo: 'Vestidor' },
      ]),
      archivos: porId([
        archivo('vieja', { created_at: '2026-09-01T10:00:00Z' }),
        archivo('nueva', { proyecto_id: 'p2', created_at: '2026-09-25T10:00:00Z' }),
        archivo('media', { created_at: '2026-09-10T10:00:00Z', visible_para_cliente: false }),
        archivo('plano', { tipo: 'application/pdf', ancho: null, alto: null }),
        archivo('de-uno-borrado', { proyecto_id: 'no-esta' }),
        archivo('en-la-vidriera', { proyecto_id: 'p2', created_at: '2026-09-05T10:00:00Z' }),
      ]),
      fotos_de_la_vidriera: { f1: { id: 'f1', archivo_de_origen: 'en-la-vidriera' } },
    });

    const trabajos = fotosDeLosTrabajos(replica);
    expect(trabajos.map((trabajo) => trabajo.titulo)).toEqual(['Vestidor', 'Placard']);
    expect(trabajos[0]?.fotos.map((foto) => [foto.archivo.id, foto.yaEsta])).toEqual([
      ['nueva', false],
      ['en-la-vidriera', true],
    ]);
    expect(trabajos[1]?.fotos.map((foto) => [foto.archivo.id, foto.compartida])).toEqual([
      ['media', false],
      ['vieja', true],
    ]);
  });
});

describe('elegir las fotos', () => {
  it('se eligen en el orden en que se tocan, y tocar otra vez la saca', () => {
    let elegidas = conLaFotoElegida([], elegible('a'), 3);
    elegidas = conLaFotoElegida(elegidas, elegible('b'), 3);
    expect(elegidas).toEqual(['a', 'b']);
    expect(conLaFotoElegida(elegidas, elegible('a'), 3)).toEqual(['b']);
  });

  it('una que ya está no se elige, y con los lugares llenos las demás no entran', () => {
    const yaEsta = elegible('y', { yaEsta: true });
    expect(disponibilidadDeLaFoto(yaEsta, [], 3)).toBe('ya-esta');
    expect(conLaFotoElegida([], yaEsta, 3)).toEqual([]);

    expect(disponibilidadDeLaFoto(elegible('c'), ['a', 'b'], 2)).toBe('no-entra');
    expect(disponibilidadDeLaFoto(elegible('a'), ['a', 'b'], 2)).toBe('elegible');
    expect(conLaFotoElegida(['a', 'b'], elegible('c'), 2)).toEqual(['a', 'b']);
    expect(conLaFotoElegida(['a', 'b'], elegible('b'), 2)).toEqual(['a']);
  });

  it('los textos dicen cuántas', () => {
    expect(textoDelBotonDeSumar(0)).toBe('Sumar fotos');
    expect(textoDelBotonDeSumar(1)).toBe('Sumar 1 foto');
    expect(textoDelBotonDeSumar(4)).toBe('Sumar 4 fotos');
    expect(avisoSinCompartir(1)).toMatch(/^Una de las fotos que elegiste está sin compartir/);
    expect(avisoSinCompartir(2)).toMatch(/^2 de las fotos que elegiste están sin compartir/);
    expect(avisoSinCompartir(2)).toMatch(/las ven todos tus clientes/);
    expect(avisoDelExceso(3, 3)).toBeNull();
    expect(avisoDelExceso(5, 3)).toBe(
      'Elegiste 5 fotos y en tu vidriera entran 3 más: se suben las primeras 3.',
    );
    expect(avisoDelExceso(2, 1)).toBe(
      'Elegiste 2 fotos y en tu vidriera entra 1 más: se suben la primera.',
    );
    expect(avisoDelCorte(0, 3, 'sumaron')).toBe(
      'No se sumó ninguna: se cortó la señal. Probá con las demás cuando vuelva.',
    );
    expect(avisoDelCorte(1, 3, 'subieron')).toBe(
      'Se subieron la primera de las 3: se cortó la señal. Probá con las demás cuando vuelva.',
    );
    expect(avisoDelCorte(2, 3, 'sumaron')).toMatch(/^Se sumaron las primeras 2 de las 3/);
  });
});

function falloDeRed(): Error {
  return Object.assign(new TypeError('Failed to fetch'), { name: 'StorageUnknownError' });
}

describe('sumar las elegidas', () => {
  it('copia la foto y su miniatura a la vidriera y las suma al final, en el orden elegido', async () => {
    const copias: [string, string][] = [];
    const sumadas: FotoDeLaVidrieraNueva[] = [];
    let siguienteId = 0;
    const avances: string[] = [];

    const resultado = await sumarDeLosTrabajos(
      [imagen('b', { tipo: 'image/jpeg' }), imagen('a')],
      'h',
      7,
      {
        copiar: (desde, hacia) => {
          copias.push([desde, hacia]);
          return Promise.resolve();
        },
        nuevoId: () => `n${String((siguienteId += 1))}`,
        sumar: (nueva) => {
          sumadas.push(nueva);
        },
      },
      ({ actual, total }) => {
        avances.push(`${String(actual)} de ${String(total)}`);
      },
    );

    expect(resultado).toEqual({ hechas: 2, problemas: [] });
    expect(avances).toEqual(['1 de 2', '2 de 2']);
    expect(copias).toEqual([
      ['h/p1/b.jpg', 'h/vidriera/n1.jpg'],
      ['h/p1/b.mini.jpg', 'h/vidriera/n1.mini.jpg'],
      ['h/p1/a.webp', 'h/vidriera/n2.webp'],
      ['h/p1/a.mini.webp', 'h/vidriera/n2.mini.webp'],
    ]);
    expect(sumadas).toEqual([
      {
        id: 'n1',
        orden: 7,
        tipo: 'image/jpeg',
        bytes: 250_000,
        ancho: 2000,
        alto: 1500,
        archivo_de_origen: 'b',
      },
      {
        id: 'n2',
        orden: 8,
        tipo: 'image/webp',
        bytes: 250_000,
        ancho: 2000,
        alto: 1500,
        archivo_de_origen: 'a',
      },
    ]);
  });

  it('si se corta la señal, para ahí y dice cuántas entraron', async () => {
    const sumar = vi.fn();
    let copias = 0;
    const resultado = await sumarDeLosTrabajos(
      [imagen('a'), imagen('b'), imagen('c')],
      'h',
      0,
      {
        copiar: () => {
          copias += 1;
          return copias > 2 ? Promise.reject(falloDeRed()) : Promise.resolve();
        },
        nuevoId: () => 'n',
        sumar,
      },
      () => undefined,
    );
    expect(sumar).toHaveBeenCalledOnce();
    expect(resultado).toEqual({ hechas: 1, problemas: [avisoDelCorte(1, 3, 'sumaron')] });
  });

  it('una que no se puede copiar se saltea y las demás siguen', async () => {
    const sumar = vi.fn();
    const resultado = await sumarDeLosTrabajos(
      [imagen('borrada'), imagen('b')],
      'h',
      0,
      {
        copiar: (desde) =>
          desde.includes('borrada')
            ? Promise.reject(new Error('Object not found'))
            : Promise.resolve(),
        nuevoId: () => 'n',
        sumar,
      },
      () => undefined,
    );
    expect(sumar).toHaveBeenCalledOnce();
    expect(resultado.hechas).toBe(1);
    expect(resultado.problemas[0]).toMatch(/^Una de las fotos no se pudo copiar/);
  });
});

describe('subir fotos nuevas a la vidriera', () => {
  function dependencias(extra: Partial<DependenciasDeLaSubida> = {}) {
    const subidas: string[] = [];
    const sumadas: FotoDeLaVidrieraNueva[] = [];
    let siguienteId = 0;
    return {
      subidas,
      sumadas,
      base: {
        subir: (ruta: string) => {
          subidas.push(ruta);
          return Promise.resolve();
        },
        decodificar: () =>
          Promise.resolve({
            fuente: {} as CanvasImageSource,
            tamano: { ancho: 3000, alto: 4000 },
            url: 'blob:x',
            liberar: () => undefined,
          }),
        preparar: () =>
          Promise.resolve({
            completa: new Blob([new Uint8Array(200_000)], { type: 'image/webp' }),
            miniatura: new Blob([new Uint8Array(20_000)], { type: 'image/webp' }),
            ancho: 1500,
            alto: 2000,
            tipo: 'image/webp' as const,
          }),
        nuevoId: () => `s${String((siguienteId += 1))}`,
        sumar: (nueva: FotoDeLaVidrieraNueva) => {
          sumadas.push(nueva);
        },
        ...extra,
      },
    };
  }

  function elegido(nombre: string, tipo = 'image/jpeg'): File {
    return new File([new Uint8Array(10)], nombre, { type: tipo });
  }

  it('suben a la carpeta de la vidriera y se suman al final, sin trabajo de origen', async () => {
    const { base, subidas, sumadas } = dependencias();
    const resultado = await subirALaVidriera(
      [elegido('mesa.jpg')],
      'h',
      4,
      12,
      base,
      () => undefined,
    );
    expect(resultado).toEqual({ hechas: 1, problemas: [] });
    expect(subidas).toEqual(['h/vidriera/s1.webp', 'h/vidriera/s1.mini.webp']);
    expect(sumadas).toEqual([
      {
        id: 's1',
        orden: 4,
        tipo: 'image/webp',
        bytes: 220_000,
        ancho: 1500,
        alto: 2000,
        archivo_de_origen: null,
      },
    ]);
  });

  it('un PDF o un video no suben y dicen por qué; lo que no entra se dice', async () => {
    const { base, subidas } = dependencias();
    const resultado = await subirALaVidriera(
      [
        elegido('despiece.pdf', 'application/pdf'),
        elegido('visita.mp4', 'video/mp4'),
        elegido('no-entra.jpg'),
      ],
      'h',
      0,
      2,
      base,
      () => undefined,
    );
    expect(subidas).toEqual([]);
    expect(resultado.hechas).toBe(0);
    expect(resultado.problemas).toEqual([
      avisoDelExceso(3, 2),
      new ArchivoRechazado('«despiece.pdf» no se puede subir: se pueden subir fotos y capturas.')
        .message,
      LOS_VIDEOS_NO_VAN_A_LA_VIDRIERA,
    ]);
  });

  it('si se corta la señal, para ahí', async () => {
    const { base, sumadas } = dependencias({ subir: () => Promise.reject(falloDeRed()) });
    const resultado = await subirALaVidriera(
      [elegido('a.jpg'), elegido('b.jpg')],
      'h',
      0,
      12,
      base,
      () => undefined,
    );
    expect(sumadas).toEqual([]);
    expect(resultado.problemas).toEqual([avisoDelCorte(0, 2, 'subieron')]);
  });

  it('el destino de la vidriera arma la ruta de la vidriera', () => {
    expect(destinoDeLaVidriera('h').ruta('f', 'image/jpeg', true)).toBe('h/vidriera/f.mini.jpg');
    expect(SIN_SENAL_PARA_ARCHIVOS).toMatch(/^Sin señal/);
  });
});

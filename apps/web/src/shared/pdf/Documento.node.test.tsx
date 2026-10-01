import { createRequire } from 'node:module';

import {
  borradorNuevo,
  centavos,
  documentoDelPresupuesto,
  PLANTILLA_DE_SIEMPRE,
  puntosBasicos,
  soloLaAceptada,
  valoresDelTrabajo,
  type BorradorDelPresupuesto,
  type DatosDelTaller,
  type DocumentoDelPresupuesto,
  type Formatos,
  type OpcionDelTrabajo,
} from '@maun/domain';
import { renderToBuffer } from '@react-pdf/renderer';
import { beforeAll, describe, expect, it } from 'vitest';

import { formatearPesos, formatearPorcentaje } from '@/shared/lib';

import { PresupuestoPdf } from './Documento';
import { ESTILOS } from './estilos';
import { registrarLasFuentes } from './fuentes';
import {
  ANCHO_DE_LA_HOJA,
  ANCHO_DEL_CENTRO,
  ANCHO_DEL_ROTULO,
  INTERLETRADO_MAXIMO_EM,
  LETRA_MAS_CHICA,
  MARGEN,
} from './medidas';
import type { PresupuestoEnPdf } from './tipos';

const requerir = createRequire(import.meta.url);

const FORMATOS: Formatos = { pesos: formatearPesos, porcentaje: formatearPorcentaje };

const TALLER: DatosDelTaller = {
  nombre: 'Taller MAUN',
  titular: 'Julián Ferro',
  cuit: '20-12345678-6',
  condicionFiscal: 'monotributo',
  domicilio: 'Pasaje Los Aromos 120, Haedo',
  telefono: '11 4088-2210',
  email: 'taller@ejemplo.com',
};

const SIN_DATOS: DatosDelTaller = {
  nombre: 'Taller MAUN',
  titular: '',
  cuit: '',
  condicionFiscal: null,
  domicilio: '',
  telefono: '',
  email: '',
};

const OPCIONES: readonly OpcionDelTrabajo[] = [
  { id: 'opcion-a', descripcion: 'Frentes en melamina Blanco.', monto: centavos(218_100_000) },
  { id: 'opcion-b', descripcion: 'Frentes laqueados blanco mate.', monto: centavos(274_000_000) },
];

function borrador(muebles = 2): BorradorDelPresupuesto {
  const base = borradorNuevo({
    titulo: 'Cocina',
    obra: 'Cramer 2140, Belgrano',
    plantilla: PLANTILLA_DE_SIEMPRE,
    validezDias: 15,
    idNuevo: () => 'm0',
  });
  return {
    ...base,
    descripcion: 'Cocina en L con bajomesada y alacena, en melamina Blanco y Gris Grafito.',
    muebles: Array.from({ length: muebles }, (_, indice) => ({
      id: `m${String(indice)}`,
      nombre: `Mueble ${String(indice + 1)}`,
      descripcion:
        'Cuerpos y estantes en melamina de 18 mm, cantos de ABS de 2 mm al tono y frentes lisos con perfil gola de aluminio. Cajonera de tres cajones con correderas telescópicas.',
    })),
    herrajes: {
      mostrar: true,
      lista: [
        { id: 'h1', texto: 'Correderas telescópicas de 500 mm con cierre suave.' },
        { id: 'h2', texto: 'Bisagras cazoleta de 35 mm con cierre suave.' },
      ],
    },
  };
}

function documento(
  opciones: readonly OpcionDelTrabajo[] = [],
  taller = TALLER,
  muebles = 2,
): DocumentoDelPresupuesto {
  return documentoDelPresupuesto(
    {
      borrador: borrador(muebles),
      plantilla: PLANTILLA_DE_SIEMPRE,
      taller,
      cliente: 'Florencia Sosa',
      valores: valoresDelTrabajo(centavos(218_100_000), opciones),
      senaBp: puntosBasicos(5_000),
      abonado: centavos(12_000_000),
    },
    FORMATOS,
  );
}

const MANDADO: PresupuestoEnPdf = {
  documento: documento(),
  numero: '20260826-01',
  revision: 2,
  mandadoEl: '2026-09-02',
  valeHasta: '2026-09-17',
  queCambio: 'Pasamos la alacena a Gris Grafito.',
  aceptado: null,
  borrador: false,
};

const VARIANTES: Readonly<Record<string, PresupuestoEnPdf>> = {
  'mandado con total': MANDADO,
  'mandado con opciones': {
    ...MANDADO,
    documento: documento(OPCIONES),
    revision: 1,
    mandadoEl: '2026-08-26',
    valeHasta: '2026-09-10',
    queCambio: null,
  },
  borrador: {
    ...MANDADO,
    documento: documento(OPCIONES),
    numero: null,
    revision: 1,
    mandadoEl: null,
    valeHasta: null,
    queCambio: null,
    borrador: true,
  },
  aceptado: {
    ...MANDADO,
    documento: soloLaAceptada(documento(OPCIONES), 'opcion-a'),
    valeHasta: null,
    queCambio: null,
    aceptado: { el: '2026-09-04', letra: 'A', acordado: centavos(210_000_000) },
  },
  largo: { ...MANDADO, documento: documento([], TALLER, 16) },
  'sin datos del taller': { ...MANDADO, documento: documento([], SIN_DATOS) },
};

beforeAll(() => {
  registrarLasFuentes({
    plex400: requerir.resolve(
      '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff',
    ),
    plex600: requerir.resolve(
      '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff',
    ),
    youngSerif: requerir.resolve('@fontsource/young-serif/files/young-serif-latin-400-normal.woff'),
  });
});

function generar(presupuesto: PresupuestoEnPdf): Promise<Buffer> {
  return renderToBuffer(PresupuestoPdf(presupuesto));
}

function hojas(pdf: Buffer): number {
  return (pdf.toString('latin1').match(/\/Type \/Page\b(?!s)/g) ?? []).length;
}

function cuentaDeLasHojas(pdf: Buffer): number | null {
  const encontrada = /\/Type \/Pages[^>]*\/Count (\d+)/.exec(pdf.toString('latin1'));
  return encontrada?.[1] === undefined ? null : Number(encontrada[1]);
}

const ESCAPES: Readonly<Record<string, string>> = {
  n: '\n',
  r: '\r',
  t: '\t',
  b: '\b',
  f: '\f',
  '(': '(',
  ')': ')',
  '\\': '\\',
};

function sinEscapes(literal: string): string {
  return literal.replace(/\\([0-7]{1,3}|.)/gs, (_, cual: string) =>
    /^[0-7]+$/.test(cual) ? String.fromCharCode(Number.parseInt(cual, 8)) : (ESCAPES[cual] ?? cual),
  );
}

function decodificar(literal: string): string {
  const bytes = Buffer.from(sinEscapes(literal), 'latin1');
  if (bytes[0] !== 0xfe || bytes[1] !== 0xff) return bytes.toString('latin1');
  const alReves = Buffer.alloc(bytes.length - 2);
  for (let i = 2; i + 1 < bytes.length; i += 2) {
    alReves[i - 2] = bytes[i + 1] ?? 0;
    alReves[i - 1] = bytes[i] ?? 0;
  }
  return alReves.toString('utf16le');
}

function textoDeLaInfo(pdf: Buffer, clave: string): string | null {
  const crudo = pdf.toString('latin1');
  const referencia = new RegExp(`/${clave} (\\d+) 0 R`).exec(crudo)?.[1];
  if (referencia === undefined) return null;
  const objeto = new RegExp(`(?:^|\\n)${referencia} 0 obj\\n\\((.*?)\\)\\nendobj`, 's').exec(
    crudo,
  )?.[1];
  return objeto === undefined ? null : decodificar(objeto);
}

describe('el presupuesto en PDF', () => {
  it.each(Object.entries(VARIANTES))('%s da un PDF válido, con sus hojas', async (_, variante) => {
    const pdf = await generar(variante);

    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(pdf.toString('latin1').trimEnd().endsWith('%%EOF')).toBe(true);
    expect(hojas(pdf)).toBeGreaterThanOrEqual(2);
    expect(cuentaDeLasHojas(pdf)).toBe(hojas(pdf));
  });

  it('el caso largo ocupa más hojas que el de siempre', async () => {
    const [deSiempre, largo] = await Promise.all([
      generar(MANDADO),
      generar(VARIANTES.largo as PresupuestoEnPdf),
    ]);
    expect(hojas(largo)).toBeGreaterThan(hojas(deSiempre));
  });

  it('la misma revisión da el mismo archivo, byte por byte', async () => {
    const [una, otra] = await Promise.all([generar(MANDADO), generar(MANDADO)]);
    expect(una.equals(otra)).toBe(true);
  });

  it('los metadatos: el título con la revisión, el taller, de quién es y el idioma', async () => {
    const pdf = await generar(MANDADO);

    expect(textoDeLaInfo(pdf, 'Title')).toBe('Presupuesto 20260826-01 · Rev. 2');
    expect(textoDeLaInfo(pdf, 'Author')).toBe('Taller MAUN');
    expect(textoDeLaInfo(pdf, 'Creator')).toBe('Taller MAUN');
    expect(textoDeLaInfo(pdf, 'Subject')).toBe('Florencia Sosa · Cocina');
    expect(pdf.toString('latin1')).toContain('/Lang (es-AR)');
  });

  it('la fecha de creación es el mediodía del día del envío en el taller', async () => {
    const pdf = await generar(MANDADO);
    expect(textoDeLaInfo(pdf, 'CreationDate')).toBe('D:20260902150000Z');
  });

  it('el borrador se titula como borrador', async () => {
    const pdf = await generar(VARIANTES.borrador as PresupuestoEnPdf);
    expect(textoDeLaInfo(pdf, 'Title')).toBe('Presupuesto (borrador)');
  });

  it('incrusta las tres fuentes y no otra', async () => {
    const crudo = (await generar(MANDADO)).toString('latin1');
    const fuentes = new Set(
      [...crudo.matchAll(/\/BaseFont \/[A-Z]{6}\+([A-Za-z-]+)/g)].map(([, nombre]) => nombre),
    );
    expect([...fuentes].sort()).toEqual([
      'IBMPlexSans-Regular',
      'IBMPlexSans-SemiBold',
      'YoungSerif-Regular',
    ]);
  });
});

describe('las reglas de los estilos del PDF', () => {
  const estilos = Object.entries(ESTILOS) as [string, Record<string, unknown>][];

  it('ni la hoja ni el pie llevan lineHeight: con eso el «Página n de m» desaparece', () => {
    expect(ESTILOS.pagina).not.toHaveProperty('lineHeight');
    expect(ESTILOS.pie).not.toHaveProperty('lineHeight');
    expect(ESTILOS.pieTexto).not.toHaveProperty('lineHeight');
  });

  it('todo lineHeight va con su fontSize', () => {
    const sinTamano = estilos
      .filter(([, estilo]) => 'lineHeight' in estilo && !('fontSize' in estilo))
      .map(([nombre]) => nombre);
    expect(sinTamano).toEqual([]);
  });

  it('ningún texto queda por debajo de 7,5 pt', () => {
    const chicos = estilos
      .filter(
        ([, estilo]) => typeof estilo.fontSize === 'number' && estilo.fontSize < LETRA_MAS_CHICA,
      )
      .map(([nombre]) => nombre);
    expect(chicos).toEqual([]);
  });

  it('el interletrado no pasa de 0,06 em, o el buscador del lector no encuentra la palabra', () => {
    const anchos = estilos
      .filter(
        ([, estilo]) =>
          typeof estilo.letterSpacing === 'number' &&
          typeof estilo.fontSize === 'number' &&
          estilo.letterSpacing / estilo.fontSize > INTERLETRADO_MAXIMO_EM + 1e-9,
      )
      .map(([nombre]) => nombre);
    expect(anchos).toEqual([]);
  });

  it('el rótulo entra en la columna de la derecha del encabezado', () => {
    expect(ANCHO_DEL_ROTULO).toBeLessThanOrEqual(
      (ANCHO_DE_LA_HOJA - 2 * MARGEN - ANCHO_DEL_CENTRO) / 2,
    );
  });
});

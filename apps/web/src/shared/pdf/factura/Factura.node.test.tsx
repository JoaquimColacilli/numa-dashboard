import { createRequire } from 'node:module';
import { inflateSync } from 'node:zlib';

import { centavos, enlaceDelQr } from '@maun/domain';
import { renderToBuffer } from '@react-pdf/renderer';
import { beforeAll, describe, expect, it } from 'vitest';

import { registrarLasFuentes } from '../fuentes';
import { INTERLETRADO_MAXIMO_EM, LETRA_MAS_CHICA } from '../medidas';
import type { FacturaEnPdf } from '../tipos';
import { documentoDelReceptorEnPdf, fechaDeLaFactura, pesosDeLaFactura } from './armado';
import { ESTILOS_DE_LA_FACTURA } from './estilos';
import { FacturaPdf } from './Factura';
import { trazoDelQr } from './qr';

const requerir = createRequire(import.meta.url);

const FACTURA: FacturaEnPdf = {
  tipo: 'factura_c',
  prueba: false,
  puntoDeVenta: 3,
  numero: 42,
  fecha: '2026-10-03',
  cae: '76398765432109',
  caeVence: '2026-10-13',
  importe: centavos(45_000_000),
  detalle: 'Seña — Vanitory Chico',
  emisor: {
    nombreDelTaller: 'Taller MAUN',
    razonSocial: 'Julián Ferro',
    domicilio: 'Pasaje Los Aromos 120, Haedo',
    cuit: '20-30123456-3',
    ingresosBrutos: '901-123456-7',
    inicioDeActividades: '2019-03-01',
  },
  receptor: {
    nombre: 'Lucía Gómez',
    condicion: 'consumidor_final',
    docTipo: 99,
    docNro: '0',
    domicilio: '',
  },
  anulaA: null,
};

const NOTA: FacturaEnPdf = {
  ...FACTURA,
  tipo: 'nota_de_credito_c',
  numero: 7,
  fecha: '2026-10-04',
  cae: '76398765432110',
  caeVence: '2026-10-14',
  detalle: 'Anula la factura C 00003-00000042',
  anulaA: { puntoDeVenta: 3, numero: 42, fecha: '2026-10-03' },
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

function generar(factura: FacturaEnPdf): Promise<Buffer> {
  return renderToBuffer(FacturaPdf(factura));
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

function objeto(pdf: Buffer, numero: string): string {
  const crudo = pdf.toString('latin1');
  const desde = crudo.indexOf(`\n${numero} 0 obj`);
  return crudo.slice(desde, crudo.indexOf('endobj', desde));
}

function flujo(pdf: Buffer, numero: string): string {
  const desde = pdf.indexOf(`\n${numero} 0 obj`);
  const inicio = pdf.indexOf('stream\n', desde) + 'stream\n'.length;
  const fin = pdf.indexOf('\nendstream', inicio);
  return inflateSync(pdf.subarray(inicio, fin)).toString('latin1');
}

function deUtf16(conEspacios: string): string {
  const hexa = conEspacios.replace(/\s/g, '');
  const unidades: number[] = [];
  for (let i = 0; i + 4 <= hexa.length; i += 4)
    unidades.push(Number.parseInt(hexa.slice(i, i + 4), 16));
  return String.fromCharCode(...unidades);
}

function mapaDeLaFuente(pdf: Buffer, fuente: string): Map<number, string> {
  const mapa = new Map<number, string>();
  const unicode = /\/ToUnicode\s+(\d+) 0 R/.exec(objeto(pdf, fuente))?.[1];
  if (unicode === undefined) return mapa;
  const cmap = flujo(pdf, unicode);
  for (const [, bloque = ''] of cmap.matchAll(/beginbfrange\n([\s\S]*?)endbfrange/g)) {
    for (const [, desde = '0', hasta = '0', destino = ''] of bloque.matchAll(
      /<([0-9a-f]+)> <([0-9a-f]+)> (\[[^\]]*\]|<[0-9a-f]+>)/gi,
    )) {
      const primero = Number.parseInt(desde, 16);
      const ultimo = Number.parseInt(hasta, 16);
      if (destino.startsWith('[')) {
        [...destino.matchAll(/<([0-9a-f\s]+)>/gi)].forEach(([, hexa = ''], indice) => {
          mapa.set(primero + indice, deUtf16(hexa));
        });
      } else {
        const base = Number.parseInt(destino.slice(1, -1), 16);
        for (let codigo = primero; codigo <= ultimo; codigo += 1) {
          mapa.set(codigo, String.fromCharCode(base + codigo - primero));
        }
      }
    }
  }
  for (const [, bloque = ''] of cmap.matchAll(/beginbfchar\n([\s\S]*?)endbfchar/g)) {
    for (const [, codigo = '0', hexa = ''] of bloque.matchAll(/<([0-9a-f]+)> <([0-9a-f]+)>/gi)) {
      mapa.set(Number.parseInt(codigo, 16), deUtf16(hexa));
    }
  }
  return mapa;
}

function textoDelPdf(pdf: Buffer): string {
  const crudo = pdf.toString('latin1');
  const renglones: string[] = [];
  for (const [, contenidos = '', recursos = ''] of crudo.matchAll(
    /\/Type\s*\/Page\s*\/Parent\s+\d+ 0 R\s*\/MediaBox\s*\[[^\]]*\]\s*\/Contents\s+(\d+) 0 R\s*\/Resources\s+(\d+) 0 R/g,
  )) {
    const fuentes = new Map<string, Map<number, string>>();
    const deLaHoja = /\/Font\s*<<([^>]*)>>/.exec(objeto(pdf, recursos))?.[1] ?? '';
    for (const [, nombre = '', numero = ''] of deLaHoja.matchAll(/\/(\w+)\s+(\d+) 0 R/g)) {
      fuentes.set(nombre, mapaDeLaFuente(pdf, numero));
    }
    let actual = new Map<number, string>();
    for (const [, nombre, textos] of flujo(pdf, contenidos).matchAll(
      /\/(\w+) [\d.]+ Tf|\[((?:<[0-9a-f]*>|[-\d.\s])*)\] TJ/gi,
    )) {
      if (nombre !== undefined) {
        actual = fuentes.get(nombre) ?? new Map<number, string>();
        continue;
      }
      const glifos = [...(textos ?? '').matchAll(/<([0-9a-f]*)>/gi)].map(([, hexa = '']) => hexa);
      let renglon = '';
      for (const hexa of glifos) {
        for (let i = 0; i + 4 <= hexa.length; i += 4) {
          renglon += actual.get(Number.parseInt(hexa.slice(i, i + 4), 16)) ?? '�';
        }
      }
      renglones.push(renglon);
    }
  }
  return renglones.join('\n');
}

function enUnRenglon(texto: string): string {
  return texto.replace(/-\n/g, '').replace(/\s+/g, ' ');
}

function hojas(pdf: Buffer): number {
  return (pdf.toString('latin1').match(/\/Type \/Page\b(?!s)/g) ?? []).length;
}

describe('la factura en PDF', () => {
  it('es un PDF válido de una hoja', async () => {
    const pdf = await generar(FACTURA);
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(hojas(pdf)).toBe(1);
  });

  it('el mismo comprobante da el mismo archivo, byte por byte', async () => {
    const [una, otra] = await Promise.all([generar(FACTURA), generar(FACTURA)]);
    expect(una.equals(otra)).toBe(true);
  });

  it('los metadatos: el comprobante, la razón social, es-AR y el mediodía de su fecha', async () => {
    const pdf = await generar(FACTURA);
    expect(textoDeLaInfo(pdf, 'Title')).toBe('Factura C 00003-00000042');
    expect(textoDeLaInfo(pdf, 'Author')).toBe('Julián Ferro');
    expect(pdf.toString('latin1')).toContain('/Lang (es-AR)');
    expect(textoDeLaInfo(pdf, 'CreationDate')).toBe('D:20261003150000Z');
  });

  it('incrusta las tres fuentes y no otra', async () => {
    const crudo = (await generar(FACTURA)).toString('latin1');
    const fuentes = new Set(
      [...crudo.matchAll(/\/BaseFont \/[A-Z]{6}\+([A-Za-z-]+)/g)].map(([, nombre]) => nombre),
    );
    expect([...fuentes].sort()).toEqual([
      'IBMPlexSans-Regular',
      'IBMPlexSans-SemiBold',
      'YoungSerif-Regular',
    ]);
  });

  it('dice la letra, el código, el número, el emisor, el receptor, el importe, el CAE y su vencimiento', async () => {
    const texto = enUnRenglon(textoDelPdf(await generar(FACTURA)));
    for (const dicho of [
      'Taller MAUN',
      'Julián Ferro',
      'Pasaje Los Aromos 120, Haedo',
      'Responsable Monotributo',
      'C',
      'COD. 011',
      'FACTURA',
      'Nº 00003-00000042',
      'Fecha de emisión 03/10/2026',
      'CUIT 20-30123456-3',
      'Ingresos Brutos 901-123456-7',
      'Inicio de actividades 01/03/2019',
      'Lucía Gómez',
      'Consumidor Final',
      'Seña — Vanitory Chico',
      'Importe total $ 450.000,00',
      'CAE Nº 76398765432109',
      'Vencimiento del CAE 13/10/2026',
      'Comprobante autorizado por ARCA',
    ]) {
      expect(texto, dicho).toContain(dicho);
    }
    expect(texto).not.toContain('PRUEBA');
    expect(texto).not.toContain('Anula');
  });

  it('en homologación lleva de fondo «PRUEBA · SIN VALIDEZ FISCAL»', async () => {
    const texto = enUnRenglon(textoDelPdf(await generar({ ...FACTURA, prueba: true })));
    expect(texto).toContain('PRUEBA · SIN VALIDEZ FISCAL');
  });

  it('la nota de crédito: su tipo, su código y la factura que anula', async () => {
    const pdf = await generar(NOTA);
    const texto = enUnRenglon(textoDelPdf(pdf));
    expect(texto).toContain('NOTA DE CRÉDITO');
    expect(texto).toContain('COD. 013');
    expect(texto).toContain('Nº 00003-00000007');
    expect(texto).toContain('Anula la factura C 00003-00000042 del 03/10/2026.');
    expect(textoDeLaInfo(pdf, 'Title')).toBe('Nota de crédito C 00003-00000007');
  });

  it('el documento del receptor: CUIT con guiones, DNI, o una raya', () => {
    expect(
      documentoDelReceptorEnPdf({ ...FACTURA.receptor, docTipo: 80, docNro: '30712345671' }),
    ).toBe('CUIT 30-71234567-1');
    expect(
      documentoDelReceptorEnPdf({ ...FACTURA.receptor, docTipo: 96, docNro: '28456789' }),
    ).toBe('DNI 28456789');
    expect(documentoDelReceptorEnPdf(FACTURA.receptor)).toBe('—');
  });

  it('las fechas y los pesos como en una factura argentina', () => {
    expect(fechaDeLaFactura('2026-10-03')).toBe('03/10/2026');
    expect(pesosDeLaFactura(centavos(123_456_789))).toBe('$ 1.234.567,89');
    expect(pesosDeLaFactura(centavos(100))).toBe('$ 1,00');
  });

  it('el QR es el del enlace de ARCA de este comprobante', () => {
    const enlace = enlaceDelQr({
      tipo: FACTURA.tipo,
      cuitEmisor: FACTURA.emisor.cuit,
      puntoDeVenta: FACTURA.puntoDeVenta,
      numero: FACTURA.numero,
      fecha: FACTURA.fecha,
      importe: FACTURA.importe,
      docTipo: FACTURA.receptor.docTipo,
      docNro: FACTURA.receptor.docNro,
      cae: FACTURA.cae,
    });
    expect(enlace.startsWith('https://www.arca.gob.ar/fe/qr/?p=')).toBe(true);
    const trazo = trazoDelQr(enlace);
    expect(trazo.lado).toBeGreaterThan(20);
    expect(trazo.d).toMatch(/^M\d+ \d+h1v1h-1z/);
  });
});

describe('las reglas de los estilos de la factura', () => {
  const estilos = Object.entries(ESTILOS_DE_LA_FACTURA) as [string, Record<string, unknown>][];

  it('todo lineHeight va con su fontSize', () => {
    expect(
      estilos
        .filter(([, estilo]) => 'lineHeight' in estilo && !('fontSize' in estilo))
        .map(([nombre]) => nombre),
    ).toEqual([]);
  });

  it('ningún texto queda por debajo de 7,5 pt', () => {
    expect(
      estilos
        .filter(
          ([, estilo]) => typeof estilo.fontSize === 'number' && estilo.fontSize < LETRA_MAS_CHICA,
        )
        .map(([nombre]) => nombre),
    ).toEqual([]);
  });

  it('el interletrado no pasa de 0,06 em', () => {
    expect(
      estilos
        .filter(
          ([, estilo]) =>
            typeof estilo.letterSpacing === 'number' &&
            typeof estilo.fontSize === 'number' &&
            estilo.letterSpacing / estilo.fontSize > INTERLETRADO_MAXIMO_EM + 1e-9,
        )
        .map(([nombre]) => nombre),
    ).toEqual([]);
  });

  it('la hoja y el pie de la autorización no llevan lineHeight', () => {
    expect(ESTILOS_DE_LA_FACTURA.pagina).not.toHaveProperty('lineHeight');
    expect(ESTILOS_DE_LA_FACTURA.autorizacion).not.toHaveProperty('lineHeight');
  });
});

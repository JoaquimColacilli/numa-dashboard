import { createRequire } from 'node:module';
import { inflateSync } from 'node:zlib';

import {
  borradorNuevo,
  centavos,
  centavosEn,
  cotizacion,
  documentoDelPresupuesto,
  plantillaDeSiempre,
  puntosBasicos,
  soloLaAceptada,
  valoresDelTrabajo,
  type BorradorDelPresupuesto,
  type DatosDelTaller,
  type DocumentoDelPresupuesto,
  type Idioma,
  type Moneda,
  type OpcionDelTrabajo,
} from '@maun/domain';
import { Font, renderToBuffer } from '@react-pdf/renderer';
import { beforeAll, describe, expect, it } from 'vitest';

import { cargarMensajesDelCliente, formatosDelDocumento } from '@/shared/idioma-del-cliente';

import { casillasDelRotuloDelPdf } from './armado';
import { presupuestoEnSuIdioma } from './enSuIdioma';
import { ESTILOS } from './estilos';
import { FAMILIA_SANS, registrarLasFuentes } from './fuentes';
import { lenguaDelPdf } from './lengua';
import {
  ANCHO_DE_LA_HOJA,
  ANCHO_DEL_CENTRO,
  ANCHO_DEL_ROTULO,
  HILO,
  INTERLETRADO_MAXIMO_EM,
  LETRA_MAS_CHICA,
  MARGEN,
} from './medidas';
import type { PresupuestoEnPdf } from './tipos';

const requerir = createRequire(import.meta.url);

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

function borrador(muebles = 2, idioma: Idioma = 'es'): BorradorDelPresupuesto {
  const base = borradorNuevo({
    titulo: 'Cocina',
    obra: 'Cramer 2140, Belgrano',
    plantilla: plantillaDeSiempre(idioma),
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
  idioma: Idioma = 'es',
): DocumentoDelPresupuesto {
  return documentoDelPresupuesto(
    {
      borrador: borrador(muebles, idioma),
      plantilla: plantillaDeSiempre(idioma),
      taller,
      cliente: 'Florencia Sosa',
      moneda: 'ARS',
      cobraEn: null,
      valores: valoresDelTrabajo(centavos(218_100_000), opciones),
      senaBp: puntosBasicos(5_000),
      abonado: centavos(12_000_000),
    },
    formatosDelDocumento(idioma),
  );
}

function documentoEnDolares(
  opciones: readonly OpcionDelTrabajo<'USD'>[] = [],
  idioma: Idioma = 'es',
  monedaDeLoAbonado: Moneda = 'USD',
): DocumentoDelPresupuesto {
  return documentoDelPresupuesto(
    {
      borrador: {
        ...borrador(2, idioma),
        modificacion: { importe: centavosEn('USD', 4_000), moneda: 'USD' },
        monedaDeLoAbonado,
      },
      plantilla: plantillaDeSiempre(idioma),
      taller: TALLER,
      cliente: 'Florencia Sosa',
      moneda: 'USD',
      cobraEn: null,
      valores: valoresDelTrabajo(centavosEn('USD', 240_000), opciones),
      senaBp: puntosBasicos(5_000),
      abonado:
        monedaDeLoAbonado === 'USD' ? centavosEn('USD', 8_276) : centavosEn('ARS', 12_000_000),
      referencia: { cotizacion: cotizacion(154_000), fecha: '2026-10-01' },
    },
    formatosDelDocumento(idioma),
  );
}

const MANDADO: PresupuestoEnPdf = {
  documento: documento(),
  idioma: 'es',
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

function enSuIdioma(variante: PresupuestoEnPdf, idioma: Idioma): PresupuestoEnPdf {
  const opciones = variante.documento.valores?.tipo === 'opciones' ? OPCIONES : [];
  const traducido = documento(
    opciones,
    variante.documento.taller,
    variante.documento.muebles.length,
    idioma,
  );
  return {
    ...variante,
    idioma,
    documento: variante.aceptado === null ? traducido : soloLaAceptada(traducido, 'opcion-a'),
  };
}

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

async function generar(presupuesto: PresupuestoEnPdf): Promise<Buffer> {
  return renderToBuffer(await presupuestoEnSuIdioma(presupuesto));
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

  it('en castellano dice lo de siempre, con la leyenda de ARCA sin aclarar', async () => {
    const texto = enUnRenglon(textoDelPdf(await generar(MANDADO)));
    for (const dicho of [
      'Muebles a medida',
      'DOCUMENTO NO VÁLIDO COMO FACTURA',
      'PRESUPUESTO',
      'Nº 20260826-01',
      'EMITIDO',
      '02/09/26',
      'VALE HASTA',
      'Qué cambió en la revisión 2',
      'DETALLE',
      'HERRAJES',
      'INCLUYE',
      'VALORES',
      'Seña (50%)',
      'Relevamiento técnico y diseño 3D ya abonado',
      'Hasta el 17 de septiembre de 2026.',
      'GARANTÍA',
      'Página 1 de',
    ]) {
      expect(texto).toContain(dicho);
    }
    expect(texto).not.toContain('Not valid');
  });
});

describe('el presupuesto en PDF, en inglés y en portugués', () => {
  const CASOS = {
    en: {
      titulo: 'Quote 20260826-01 · Rev. 2',
      borrador: 'Quote (draft)',
      lang: '/Lang (en-US)',
      dice: [
        'Custom furniture',
        'DOCUMENTO NO VÁLIDO COMO FACTURA',
        'Not valid as an invoice.',
        'QUOTE',
        'No. 20260826-01',
        'ISSUED',
        'Sep 2, 2026',
        'VALID UNTIL',
        'What changed in revision 2',
        'CLIENT',
        'JOB SITE',
        'DETAILS',
        'HARDWARE',
        "WHAT'S INCLUDED",
        'PRICES',
        'Deposit (50%)',
        'Site measure and 3D design already paid',
        'PAYMENT TERMS',
        'LEAD TIME',
        '30 business days from the deposit.',
        'VALIDITY',
        'Until September 17, 2026.',
        'NOTICES',
        'CONDITIONS',
        'WARRANTY',
        'Warranty for 6 months',
        'up to 2 modifications',
        'ARS 50,000',
        'Page 1 of',
      ],
    },
    'pt-BR': {
      titulo: 'Orçamento 20260826-01 · Rev. 2',
      borrador: 'Orçamento (rascunho)',
      lang: '/Lang (pt-BR)',
      dice: [
        'Móveis sob medida',
        'DOCUMENTO NO VÁLIDO COMO FACTURA',
        'Não é válido como nota fiscal.',
        'ORÇAMENTO',
        'Nº 20260826-01',
        'EMITIDO',
        '2 set. 2026',
        'VÁLIDO ATÉ',
        'O que mudou na revisão 2',
        'CLIENTE',
        'PROJETO',
        'DETALHES',
        'FERRAGENS',
        'INCLUSO',
        'VALORES',
        'Sinal (50%)',
        'Visita técnica e projeto 3D já pagos',
        'FORMA DE PAGAMENTO',
        'PRAZO DE FABRICAÇÃO',
        '30 dias úteis a partir do sinal.',
        'VALIDADE',
        'Até 17 de setembro de 2026.',
        'AVISOS',
        'CONDIÇÕES',
        'GARANTIA',
        'Garantia de 6 meses',
        'até 2 modificações',
        'ARS 50.000',
        'Página 1 de',
      ],
    },
  } as const;

  const EN_CASTELLANO = [
    'Muebles a medida',
    'PRESUPUESTO',
    'VALE HASTA',
    'Qué cambió',
    'DETALLE',
    'HERRAJES',
    'INCLUYE',
    'Seña',
    'Relevamiento',
    'abonado',
    'Forma de pago',
    'FORMA DE PAGO',
    'PLAZO DE FABRICACIÓN',
    'Validez',
    'VALIDEZ',
    'Hasta el',
    'GARANTÍA',
    'Garantía de',
    'modificaciones',
    'días hábiles',
    'BORRADOR',
    'Aceptado',
    'Opción',
    ' ',
  ];

  it.each(Object.entries(CASOS))(
    'en %s, los metadatos, el idioma y todo lo que escribe la app',
    async (idioma, caso) => {
      const pdf = await generar(enSuIdioma(MANDADO, idioma as Idioma));
      expect(textoDeLaInfo(pdf, 'Title')).toBe(caso.titulo);
      expect(textoDeLaInfo(pdf, 'Author')).toBe('Taller MAUN');
      expect(pdf.toString('latin1')).toContain(caso.lang);
      const texto = enUnRenglon(textoDelPdf(pdf));
      for (const dicho of caso.dice) expect(texto).toContain(dicho);
      for (const enCastellano of EN_CASTELLANO) expect(texto).not.toContain(enCastellano);
      expect(texto).not.toContain('�');
    },
  );

  it.each(Object.entries(CASOS))('en %s, el borrador y el aceptado', async (idioma, caso) => {
    const borrador = await generar(
      enSuIdioma(VARIANTES.borrador as PresupuestoEnPdf, idioma as Idioma),
    );
    expect(textoDeLaInfo(borrador, 'Title')).toBe(caso.borrador);
    const deLaMarca = enUnRenglon(textoDelPdf(borrador));
    expect(deLaMarca).toContain(idioma === 'en' ? 'DRAFT' : 'RASCUNHO');
    expect(deLaMarca).not.toContain('BORRADOR');

    const aceptado = enUnRenglon(
      textoDelPdf(
        await generar(enSuIdioma(VARIANTES.aceptado as PresupuestoEnPdf, idioma as Idioma)),
      ),
    );
    expect(aceptado).toContain(
      idioma === 'en'
        ? 'Accepted on September 4, 2026 · Option A'
        : 'Aceito em 4 de setembro de 2026 · Opção A',
    );
    expect(aceptado).toContain(idioma === 'en' ? 'Agreed on approval:' : 'Acordado na aprovação:');
  });

  it('un pedido en otro idioma no le cambia la partición al que sigue', async () => {
    const enIngles = await generar(enSuIdioma(VARIANTES.largo as PresupuestoEnPdf, 'en'));
    const despues = await generar(VARIANTES.largo as PresupuestoEnPdf);
    const deNuevo = await generar(VARIANTES.largo as PresupuestoEnPdf);
    expect(despues.equals(deNuevo)).toBe(true);
    expect(enIngles.equals(despues)).toBe(false);
  });
});

describe('el presupuesto en dólares, en PDF', () => {
  const EN_DOLARES: PresupuestoEnPdf = { ...MANDADO, documento: documentoEnDolares() };

  const OPCIONES_EN_DOLARES: readonly OpcionDelTrabajo<'USD'>[] = [
    {
      id: 'opcion-a',
      descripcion: 'Frentes en melamina Blanco.',
      monto: centavosEn('USD', 240_000),
    },
    { id: 'opcion-b', descripcion: 'Frentes laqueados.', monto: centavosEn('USD', 300_000) },
  ];

  function pesosSueltos(texto: string): string[] {
    return texto.match(/(?<!US)\$ [\d.,]+\d/g) ?? [];
  }

  it('cada importe va en dólares, y el total y la seña llevan debajo sus pesos con el dólar y su día', async () => {
    const texto = enUnRenglon(textoDelPdf(await generar(EN_DOLARES)));
    for (const dicho of [
      'US$ 2.400',
      'Son $ 3.696.000 con el dólar a $ 1.540, el que vale para pagos del 1 de octubre de 2026.',
      'Seña (50%)',
      'US$ 1.200',
      'Son $ 1.848.000 con el dólar a $ 1.540, el que vale para pagos del 1 de octubre de 2026.',
      '− US$ 82,76',
      'US$ 1.117,24',
      '(US$ 82,76)',
      'US$ 40 c/u',
    ]) {
      expect(texto).toContain(dicho);
    }
    expect(pesosSueltos(texto)).toEqual(['$ 3.696.000', '$ 1.540', '$ 1.848.000', '$ 1.540']);
  });

  it('la cláusula de la moneda va debajo de la forma de pago', async () => {
    const texto = enUnRenglon(textoDelPdf(await generar(EN_DOLARES)));
    const forma = texto.indexOf('FORMA DE PAGO');
    const moneda = texto.indexOf('MONEDA');
    const plazo = texto.indexOf('PLAZO DE FABRICACIÓN');
    expect(forma).toBeGreaterThan(-1);
    expect(moneda).toBeGreaterThan(forma);
    expect(plazo).toBeGreaterThan(moneda);
    expect(texto).toContain(
      'Se paga en pesos. Cada pago se convierte al tipo de cambio vendedor del dólar billete del Banco de la Nación Argentina',
    );
  });

  it('con lo abonado en pesos, el aviso lo dice en pesos y la caja no lo resta de la seña en dólares', async () => {
    const texto = enUnRenglon(
      textoDelPdf(await generar({ ...MANDADO, documento: documentoEnDolares([], 'es', 'ARS') })),
    );
    expect(texto).toContain('($ 120.000)');
    expect(texto).not.toContain('Relevamiento técnico y diseño 3D ya abonado');
    expect(texto).not.toContain('Seña a abonar');
  });

  it('con opciones, cada una lleva sus pesos y los de su seña', async () => {
    const texto = enUnRenglon(
      textoDelPdf(
        await generar({
          ...MANDADO,
          revision: 1,
          queCambio: null,
          documento: documentoEnDolares(OPCIONES_EN_DOLARES),
        }),
      ),
    );
    expect(texto).toContain(
      'Son $ 3.696.000, y la seña $ 1.848.000, con el dólar a $ 1.540, el que vale para pagos del 1 de octubre de 2026.',
    );
    expect(texto).toContain(
      'Son $ 4.620.000, y la seña $ 2.310.000, con el dólar a $ 1.540, el que vale para pagos del 1 de octubre de 2026.',
    );
    expect(texto).toContain('US$ 3.000');
  });

  it.each([
    [
      'en',
      [
        'US$2,400',
        "That's ARS 3,696,000 at ARS 1,540 per dollar, the rate for payments made on October 1, 2026.",
        'CURRENCY',
        'Payment is made in pesos.',
      ],
    ],
    [
      'pt-BR',
      [
        'US$ 2.400',
        'São ARS 3.696.000 com o dólar a ARS 1.540, a cotação válida para pagamentos feitos em 1º de outubro de 2026.',
        'MOEDA',
        'O pagamento é feito em pesos.',
      ],
    ],
  ] as const)(
    'en %s, la referencia y la moneda en su idioma, sin «$» suelto',
    async (idioma, dice) => {
      const texto = enUnRenglon(
        textoDelPdf(
          await generar({ ...MANDADO, idioma, documento: documentoEnDolares([], idioma) }),
        ),
      );
      for (const dicho of dice) expect(texto).toContain(dicho);
      expect(texto.match(/(?<!US)\$/g)).toBeNull();
      expect(texto).not.toContain('�');
    },
  );

  it('un presupuesto en pesos no lleva referencia ni moneda', async () => {
    const texto = enUnRenglon(textoDelPdf(await generar(MANDADO)));
    expect(texto).not.toContain('con el dólar a');
    expect(texto).not.toContain('MONEDA');
    expect(texto).not.toContain('US$');
  });
});

interface FuenteMedible {
  unitsPerEm: number;
  layout: (texto: string) => { advanceWidth: number };
}

function esMedible(valor: unknown): valor is FuenteMedible {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    typeof Reflect.get(valor, 'unitsPerEm') === 'number' &&
    typeof Reflect.get(valor, 'layout') === 'function'
  );
}

describe('las medidas del rótulo en los tres idiomas', () => {
  const PADDING = 2 * ESTILOS.casilla.paddingHorizontal;
  const ANCHO_POR_DENTRO = ANCHO_DEL_ROTULO - 2 * HILO;

  async function medir(): Promise<(texto: string, tamano: number, espaciado?: number) => number> {
    await Font.load({ fontFamily: FAMILIA_SANS, fontWeight: 600 });
    const fuente: unknown = Font.getFont({ fontFamily: FAMILIA_SANS, fontWeight: 600 }).data;
    if (!esMedible(fuente)) throw new Error('No se pudo leer la letra del PDF.');
    return (texto, tamano, espaciado = 0) =>
      (fuente.layout(texto).advanceWidth / fuente.unitsPerEm) * tamano +
      espaciado * Array.from(texto).length;
  }

  const DISPOSICIONES: readonly PresupuestoEnPdf[] = [
    MANDADO,
    { ...MANDADO, valeHasta: null },
    VARIANTES.borrador as PresupuestoEnPdf,
    VARIANTES.aceptado as PresupuestoEnPdf,
  ];

  it.each(['es', 'en', 'pt-BR'] as const)(
    'en %s, cada título entra en su casilla, y cada valor en un renglón o partido entre palabras',
    async (idioma) => {
      const ancho = await medir();
      const lengua = lenguaDelPdf(idioma, await cargarMensajesDelCliente(idioma));
      const { casillaTitulo, casillaValor } = ESTILOS;
      for (const disposicion of DISPOSICIONES) {
        const casillas = casillasDelRotuloDelPdf({ ...disposicion, idioma }, lengua);
        const fijo = casillas.reduce((suma, casilla) => suma + (casilla.ancho ?? 0), 0);
        const flexibles = casillas.filter((casilla) => casilla.ancho === undefined).length;
        casillas.forEach((casilla, indice) => {
          const exterior = casilla.ancho ?? (ANCHO_POR_DENTRO - fijo) / flexibles;
          const adentro = exterior - PADDING - (indice > 0 ? HILO : 0);
          const titulo = ancho(
            casilla.titulo.toLocaleUpperCase(),
            casillaTitulo.fontSize,
            casillaTitulo.letterSpacing,
          );
          expect(titulo, `${idioma} ${casilla.titulo}`).toBeLessThanOrEqual(adentro);
          const valor = ancho(casilla.valor, casillaValor.fontSize);
          if (idioma === 'es') {
            expect(valor, `${idioma} ${casilla.valor}`).toBeLessThanOrEqual(adentro);
          }
          for (const palabra of casilla.valor.split(' ')) {
            expect(
              ancho(palabra, casillaValor.fontSize),
              `${idioma} ${casilla.valor}`,
            ).toBeLessThanOrEqual(adentro);
          }
        });
      }
    },
  );
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

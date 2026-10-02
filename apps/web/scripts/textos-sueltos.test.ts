import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { textosSueltosDe } from './textos-sueltos.ts';

const WEB = path.resolve(process.cwd());

const CATALOGOS = /^src\/shared\/idioma\/(es|en|pt-BR)\//u;

interface Excepcion {
  archivo: string;
  texto: string | RegExp;
  motivo: string;
}

const EXCEPCIONES: readonly Excepcion[] = [
  {
    archivo: 'src/app/arranque/esqueleto.ts',
    texto:
      /^(Abriendo la app|Trayendo los datos del taller|Abriendo la pantalla|Opening the app|Loading your shop's data|Opening the screen|Abrindo o app|Carregando os dados da marcenaria|Abrindo a tela)$/u,
    motivo:
      'El primer cuadro va en el HTML que arma el build, antes de que haya catálogo: es su propia tabla en los tres idiomas, atada por esqueleto.test.tsx.',
  },
  {
    archivo: 'src/app/arranque/esqueleto.ts',
    texto: 'El index.html no tiene : no hay dónde poner el esqueleto.',
    motivo: 'Corta el build: solo lo ve quien arma la app.',
  },
  {
    archivo: 'src/shared/idioma/nombres.ts',
    texto: /^(Español|English|Português)$/u,
    motivo: 'Cada idioma se nombra en su propio idioma, y es igual en los tres catálogos.',
  },
  {
    archivo: 'src/main.ts',
    texto: 'Falta el elemento #root en index.html.',
    motivo: 'Solo lo ve quien arma la app, no quien la usa.',
  },
];

function zonasQueFaltan(): readonly string[] {
  const crudo = JSON.parse(readFileSync(path.join(WEB, 'zonas-de-texto.json'), 'utf8')) as {
    faltan: string[];
  };
  return crudo.faltan;
}

function fuentes(carpeta: string): string[] {
  const salida: string[] = [];
  for (const nombre of readdirSync(carpeta)) {
    const ruta = path.join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...fuentes(ruta));
    else if (/\.tsx?$/u.test(nombre) && !/\.(test|d)\.tsx?$/u.test(nombre)) salida.push(ruta);
  }
  return salida;
}

function relativo(ruta: string): string {
  return path.relative(WEB, ruta).split(path.sep).join('/');
}

function excepcionDe(archivo: string, texto: string): Excepcion | undefined {
  return EXCEPCIONES.find(
    (excepcion) =>
      excepcion.archivo === archivo &&
      (typeof excepcion.texto === 'string'
        ? excepcion.texto === texto
        : excepcion.texto.test(texto)),
  );
}

describe('los textos sueltos', () => {
  const faltan = zonasQueFaltan();

  it('fuera de las zonas que faltan, todo texto para una persona sale del catálogo', () => {
    const sueltos: string[] = [];
    for (const ruta of fuentes(path.join(WEB, 'src'))) {
      const archivo = relativo(ruta);
      if (CATALOGOS.test(archivo) || faltan.some((zona) => archivo.startsWith(zona))) continue;
      for (const suelto of textosSueltosDe(archivo, readFileSync(ruta, 'utf8'))) {
        if (excepcionDe(archivo, suelto.texto) !== undefined) continue;
        sueltos.push(`${archivo}:${String(suelto.linea)} «${suelto.texto}» (${suelto.contexto})`);
      }
    }
    expect(sueltos).toEqual([]);
  });

  it('cada zona que falta existe, y cada excepción sigue haciendo falta', () => {
    for (const zona of faltan) expect(existsSync(path.join(WEB, zona)), zona).toBe(true);
    for (const excepcion of EXCEPCIONES) {
      const usada = textosSueltosDe(
        excepcion.archivo,
        readFileSync(path.join(WEB, excepcion.archivo), 'utf8'),
      ).some((suelto) => excepcionDe(excepcion.archivo, suelto.texto) === excepcion);
      expect(usada, `${excepcion.archivo}: ${String(excepcion.texto)}`).toBe(true);
    }
  });

  it('encuentra lo que una persona lee, y deja pasar las clases, las claves y las rutas', () => {
    const codigo = [
      "const ERROR = 'No se pudo guardar.';",
      "const CLAVE = 'maun:tema';",
      "const RUTA = '/proyectos';",
      'export function Boton({ abierto }: { abierto: boolean }) {',
      '  return (',
      '    <button type="button" className="flex gap-2 text-text-3" title="Cerrar la hoja">',
      "      {abierto ? 'Listo' : null}",
      '      Guardar cambios',
      '    </button>',
      '  );',
      '}',
    ].join('\n');
    expect(textosSueltosDe('prueba.tsx', codigo).map((suelto) => suelto.texto)).toEqual([
      'No se pudo guardar.',
      'Cerrar la hoja',
      'Listo',
      'Guardar cambios',
    ]);
  });
});

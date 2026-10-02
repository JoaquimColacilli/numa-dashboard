import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { textosSueltosDe } from './textos-sueltos.ts';

const WEB = path.resolve(process.cwd());

const CATALOGOS = /^src\/shared\/idioma\/(es|en|pt-BR|centinelas)\//u;

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
    archivo: 'src/shared/config/env.ts',
    texto:
      /^(falta definirla|tiene que ser una URL completa, por ejemplo http:\/\/127\.0\.0\.1:54321|es una clave secreta \(sb_secret_\); en el cliente va la publishable|La app no puede arrancar: faltan o son inválidas variables de entorno\. Copiá apps\/web\/\.env\.example a apps\/web\/\.env y completalas\.)$/u,
    motivo:
      'Solo lo ve quien arma la app con el .env mal puesto, antes de que arranque y de que haya idioma: no quien la usa.',
  },
  {
    archivo: 'src/shared/lib/fechas.ts',
    texto:
      /^(mié|sáb|Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre|de de|hace días|año|años|mañana|en días|en meses)$/u,
    motivo:
      'Las fechas en castellano conservan sus formatos tal cual (glosario, Fechas); en inglés y en portugués salen de Intl.',
  },
  {
    archivo: 'src/shared/lib/push.ts',
    texto:
      /^(La suscripción del navegador no trae sus claves\.|La app no tiene su service worker activo\.)$/u,
    motivo:
      'Errores internos de la suscripción: recibir-avisos los cambia por su propio mensaje, el dueño no los lee.',
  },
  {
    archivo: 'src/shared/lib/rutas.ts',
    texto: /^\/proyectos\/ \/(editar|cobrar|cerrar|aprobar|compartir|presupuesto)$/u,
    motivo: 'Son rutas de la app con el id en el medio: no las lee nadie.',
  },
  {
    archivo: 'src/shared/lib/seudo.tsx',
    texto: /^\p{L}$/u,
    motivo: 'La tabla de letras acentuadas con que se arma el seudoidioma, no un texto.',
  },
  {
    archivo: 'src/shared/lib/taller.ts',
    texto: 'Taller MAUN',
    motivo: 'Una marca: «Taller MAUN» no se traduce (glosario).',
  },
  {
    archivo: 'src/shared/lib/tesoros.ts',
    texto:
      /^(Hogar|Maun|Diezmo|Cocos|La plata de la familia|La caja del taller|Lo apartado de cada ingreso|Ahorro para la casa propia)$/u,
    motivo:
      'Los nombres y las descripciones que la base sembró para los cuatro tesoros de siempre: son datos y no se traducen (glosario).',
  },
  {
    archivo: 'src/shared/ui/LogoDeMercadoPago.tsx',
    texto: 'Mercado Pago',
    motivo: 'Una marca: no se traduce (glosario).',
  },
  {
    archivo: 'src/shared/ui/PantallaDeAcceso.tsx',
    texto: 'translateY( px)',
    motivo: 'Es CSS: sube la pantalla con el teclado del celular.',
  },
  {
    archivo: 'src/main.ts',
    texto: 'Falta el elemento #root en index.html.',
    motivo: 'Solo lo ve quien arma la app, no quien la usa.',
  },
  {
    archivo: 'src/entities/movimiento/model/clases.ts',
    texto:
      /^(Docencia|Changas|Regalos|Venta personal|Otro|Cobro suelto|Venta de sobrantes|Supermercado|Servicios|Salud|Educación|Transporte|Ropa|Recreación|Iglesia|Materiales|Herramientas|Costos fijos|Flete|Servicios del taller|Publicidad|Compra|Imprevisto|Regalo|Compra del inmueble|Escritura y sellos|Mudanza|Oficial|Blue|Cripto|Ahorro previo)$/u,
    motivo:
      'Las categorías que se ofrecen se guardan en castellano en cada movimiento: son claves de movimiento.categorias, que las muestra en el idioma de quien mira con categoriaEnPantalla.',
  },
  {
    archivo: 'src/entities/replica/model/contexto.ts',
    texto: 'Falta ProveedorDeReplica: las pantallas del taller se montan adentro suyo.',
    motivo:
      'Corta la app si una pantalla del taller se monta sin su proveedor: solo lo ve quien la arma.',
  },
  {
    archivo: 'src/features/editar-proyecto/ui/FilasDeOpciones.tsx',
    texto: 'opciones. .detalle',
    motivo: 'Es la ruta del campo en react-hook-form (opciones.N.detalle), no un texto.',
  },
  {
    archivo: 'src/entities/agenda/ui/GrillaDelMes.tsx',
    texto: 'repeat( , minmax(var(--celda-min), auto))',
    motivo: 'Es CSS: las filas de la grilla del mes, una por semana.',
  },
  {
    archivo: 'src/features/llevar-la-agenda/ui/HojaDeAnotacion.tsx',
    texto: 'repeating-linear-gradient(transparent 0 27px, var(--paper-notas-line) 27px 28px)',
    motivo: 'Es CSS: los renglones del cuaderno detrás del texto de la anotación.',
  },
  {
    archivo: 'src/entities/sesion/model/contexto.ts',
    texto: 'useSesionActiva solo se usa adentro de una ruta con sesión.',
    motivo: 'Es un error de programación: salta si el hook se usa fuera de una ruta con sesión.',
  },
  {
    archivo: 'src/app/layout/TirarParaActualizar.tsx',
    texto: 'translateY( px)',
    motivo: 'Es el valor del transform del estilo, no un texto.',
  },
  {
    archivo: 'src/features/editar-perfil/ui/RecortadorDeFoto.tsx',
    texto: 'translate( px, px)',
    motivo: 'Es el valor del transform del estilo, no un texto.',
  },
  {
    archivo: 'src/features/armar-la-fila/model/edicion.ts',
    texto: /^(Gasto fijo|Costos fijos)$/u,
    motivo:
      'Nombre del renglón que la app guarda en la fila, en castellano como la fila de siempre; se traduce al mostrarlo, con categoriaEnPantalla.',
  },
  {
    archivo: 'src/features/editar-tesoro/model/archivo.ts',
    texto: 'Archivo de un tesoro',
    motivo: 'Categoría que se guarda en el libro, en castellano; se traduce al mostrarla.',
  },
  {
    archivo: 'src/features/cubrir-el-faltante/model/cubrir.ts',
    texto: 'Cubrir el mes',
    motivo: 'Categoría que se guarda en el libro, en castellano; se traduce al mostrarla.',
  },
  {
    archivo: 'src/features/ajustar-cocos/ui/AjusteDeCocos.tsx',
    texto: 'Ajuste',
    motivo: 'Categoría que se guarda en el libro, en castellano; se traduce al mostrarla.',
  },
  {
    archivo: 'src/entities/fila/ui/EscalaDelReparto.tsx',
    texto: /^repeating-linear-gradient\(/u,
    motivo: 'Es CSS: el rayado de la parte del reparto que va al superávit.',
  },
  {
    archivo: 'src/entities/fila/ui/piezas.tsx',
    texto: /^(repeating-linear-gradient\(.*|inset 0 0 0 1px)$/u,
    motivo: 'Es CSS: el rayado y el borde de lo que suma la prueba en el nivel del mes.',
  },
  {
    archivo: 'src/pages/tesoros/ui/Fichas.tsx',
    texto: 'pointer-events-auto nodrag nopan',
    motivo: 'Son clases: las de React Flow que dejan tocar adentro de una ficha del lienzo.',
  },
  {
    archivo: 'src/pages/tesoros/ui/lienzo/Aristas.tsx',
    texto: /^(-50%, calc\(-100% - \d+px\)|translate\(.*)$/u,
    motivo: 'Es CSS: dónde se dibuja el rótulo y el botón de cada flecha.',
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

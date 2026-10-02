import atributos from '@maun/config/eslint/atributos-de-codigo.json' with { type: 'json' };
import ts from 'typescript';

export interface TextoSuelto {
  linea: number;
  texto: string;
  contexto: string;
}

interface Contexto {
  tipo: string;
  nombre: string;
  elemento?: string;
  marcas: string[];
}

const ATRIBUTOS_POR_ELEMENTO: Readonly<Record<string, Readonly<Record<string, string>>>> =
  atributos.porElemento;

function esAtributoDeCodigo(nombre: string, elemento: string): boolean {
  return (
    Object.hasOwn(atributos.todos, nombre) ||
    Object.hasOwn(ATRIBUTOS_POR_ELEMENTO[elemento] ?? {}, nombre) ||
    /^(data-|on[A-Z])/u.test(nombre)
  );
}

function elementoDe(atributo: ts.JsxAttribute): string {
  const abre = atributo.parent.parent;
  const nombre = abre.tagName.getText();
  return nombre.slice(nombre.lastIndexOf('.') + 1);
}

const LETRA = /[A-Za-zÀ-ÖØ-öø-ÿ]/u;
const NO_ASCII = /[À-ÖØ-öø-ÿ¿¡…«»—–·ºª]/u;
const PALABRA_DE_CLASE = /^[!@a-z0-9\-[\]():/.%_&>*=,#'"~+|^$]+$/u;
const MARCA_DE_CLASE = /^[!@[]|[a-z0-9\])%][-:/][a-z0-9[(@!-]|\[.*\]|^-?[a-z]+(-[a-z0-9.]+)+$/u;
const CLASE_SIMPLE =
  /^(flex|grid|block|inline|hidden|contents|relative|absolute|fixed|sticky|truncate|italic|underline|uppercase|lowercase|capitalize|grow|shrink|border|rounded|shadow|transition|isolate|invisible|visible|static|table|container|antialiased|lamina)$/u;

const PALABRAS_DE_CODIGO = new Set(
  `Enter Escape Tab Backspace Delete Home End Space Spacebar PageUp PageDown Shift Control Alt Meta
  Bearer Authorization Accept Promise Error TypeError RangeError Date Object Number String Boolean
  Array Map Set Infinity NaN Chrome Safari Firefox Android Windows Linux Webkit React Edge Inter
  Helvetica Arial GET POST PATCH PUT DELETE HEAD OPTIONS JSON HTML CSS UTF ES256 JWT SHA PKCE
  WebP JPEG PNG SVG URL URI API DOM IDB CDP UUID ISO UTC NFD NFC Intl`.split(/\s+/u),
);

const LLAMADAS_DE_CODIGO =
  /(^|\.)(addEventListener|removeEventListener|querySelector|querySelectorAll|closest|matches|getItem|setItem|removeItem|matchMedia|getAttribute|setAttribute|hasAttribute|removeAttribute|createElement|rpc|from|select|eq|neq|in|is|order|update|insert|upsert|delete|channel|on|get|set|has|startsWith|endsWith|includes|split|join|replace|replaceAll|padStart|padEnd|normalize|localeCompare|toLocaleString|DateTimeFormat|NumberFormat|ListFormat|PluralRules|RelativeTimeFormat|postMessage|test|exec|match|fetch|defineProperty)$/u;

function nombreDe(nodo: ts.Node | undefined, archivo: ts.SourceFile): string {
  if (nodo === undefined) return '';
  if (ts.isIdentifier(nodo) || ts.isPrivateIdentifier(nodo)) return nodo.text;
  if (ts.isStringLiteral(nodo) || ts.isNumericLiteral(nodo)) return nodo.text;
  return nodo.getText(archivo);
}

function contextoDe(nodo: ts.Node, archivo: ts.SourceFile): Contexto {
  let hijo: ts.Node = nodo;
  let padre: ts.Node = nodo.parent;
  const marcas: string[] = [];
  for (;;) {
    if (ts.isSourceFile(padre)) return { tipo: 'suelto', nombre: '', marcas };
    if (
      ts.isParenthesizedExpression(padre) ||
      ts.isAsExpression(padre) ||
      ts.isSatisfiesExpression(padre) ||
      ts.isNonNullExpression(padre)
    ) {
      hijo = padre;
      padre = padre.parent;
      continue;
    }
    if (ts.isConditionalExpression(padre)) {
      if (hijo === padre.condition) return { tipo: 'condicion', nombre: '', marcas };
      marcas.push('condicional');
      hijo = padre;
      padre = padre.parent;
      continue;
    }
    if (ts.isBinaryExpression(padre)) {
      const operador = padre.operatorToken.kind;
      if (
        operador === ts.SyntaxKind.BarBarToken ||
        operador === ts.SyntaxKind.QuestionQuestionToken ||
        operador === ts.SyntaxKind.AmpersandAmpersandToken ||
        operador === ts.SyntaxKind.PlusToken
      ) {
        hijo = padre;
        padre = padre.parent;
        continue;
      }
      if (
        operador === ts.SyntaxKind.EqualsEqualsEqualsToken ||
        operador === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
        operador === ts.SyntaxKind.InKeyword
      ) {
        return { tipo: 'comparacion', nombre: '', marcas };
      }
      return { tipo: 'binaria', nombre: nombreDe(padre.left, archivo), marcas };
    }
    if (ts.isTemplateSpan(padre)) {
      hijo = padre.parent;
      padre = padre.parent.parent;
      continue;
    }
    if (ts.isArrayLiteralExpression(padre) || ts.isSpreadElement(padre)) {
      hijo = padre;
      padre = padre.parent;
      continue;
    }
    if (ts.isJsxExpression(padre)) {
      const arriba = padre.parent;
      if (ts.isJsxAttribute(arriba)) {
        return {
          tipo: 'atributo',
          nombre: nombreDe(arriba.name, archivo),
          elemento: elementoDe(arriba),
          marcas,
        };
      }
      return { tipo: 'jsx-hijo', nombre: '', marcas };
    }
    if (ts.isJsxAttribute(padre)) {
      return {
        tipo: 'atributo',
        nombre: nombreDe(padre.name, archivo),
        elemento: elementoDe(padre),
        marcas,
      };
    }
    if (ts.isPropertyAssignment(padre)) {
      if (hijo === padre.name) return { tipo: 'clave', nombre: '', marcas };
      return { tipo: 'propiedad', nombre: nombreDe(padre.name, archivo), marcas };
    }
    if (ts.isVariableDeclaration(padre) || ts.isPropertyDeclaration(padre)) {
      return { tipo: 'variable', nombre: nombreDe(padre.name, archivo), marcas };
    }
    if (ts.isParameter(padre) || ts.isBindingElement(padre)) {
      return { tipo: 'parametro', nombre: nombreDe(padre.name, archivo), marcas };
    }
    if (ts.isCallExpression(padre)) {
      if (padre.expression.kind === ts.SyntaxKind.ImportKeyword) {
        return { tipo: 'import', nombre: '', marcas };
      }
      return {
        tipo: 'llamada',
        nombre: nombreDe(padre.expression, archivo).replace(/\s+/gu, ''),
        marcas,
      };
    }
    if (ts.isNewExpression(padre)) {
      return { tipo: 'new', nombre: nombreDe(padre.expression, archivo), marcas };
    }
    if (ts.isCaseClause(padre)) return { tipo: 'case', nombre: '', marcas };
    if (ts.isElementAccessExpression(padre)) return { tipo: 'indice', nombre: '', marcas };
    if (ts.isLiteralTypeNode(padre) || ts.isTypeNode(padre))
      return { tipo: 'tipo', nombre: '', marcas };
    if (
      ts.isImportDeclaration(padre) ||
      ts.isExportDeclaration(padre) ||
      ts.isExternalModuleReference(padre) ||
      ts.isModuleDeclaration(padre)
    ) {
      return { tipo: 'import', nombre: '', marcas };
    }
    if (ts.isReturnStatement(padre) || ts.isArrowFunction(padre)) {
      return { tipo: 'retorno', nombre: '', marcas };
    }
    if (ts.isTaggedTemplateExpression(padre)) {
      return { tipo: 'etiquetada', nombre: nombreDe(padre.tag, archivo), marcas };
    }
    return { tipo: ts.SyntaxKind[padre.kind], nombre: '', marcas };
  }
}

function pareceClase(texto: string): boolean {
  const fichas = texto.trim().split(/\s+/u).filter(Boolean);
  if (fichas.length === 0) return false;
  if (!fichas.every((ficha) => PALABRA_DE_CLASE.test(ficha))) return false;
  if (fichas.some((ficha) => /[,.;]$/u.test(ficha) || /^[a-z]+:$/u.test(ficha))) return false;
  return (
    fichas.every((ficha) => MARCA_DE_CLASE.test(ficha) || CLASE_SIMPLE.test(ficha)) ||
    fichas.filter((ficha) => MARCA_DE_CLASE.test(ficha)).length >= Math.ceil(fichas.length / 2)
  );
}

function pareceDatoTecnico(texto: string): boolean {
  const limpio = texto.trim();
  if (/^[/#.?]/u.test(limpio) && !/\s/u.test(limpio)) return true;
  if (!/\s/u.test(limpio) && /^(https?:|mailto:|tel:)|:\/\//u.test(limpio)) return true;
  if (/^\[.*\]$/u.test(limpio)) return true;
  if (/^(var|calc|color-mix|min|max|clamp|url|linear|cubic-bezier)\(/u.test(limpio)) return true;
  if (/^#[0-9a-fA-F]{3,8}$/u.test(limpio)) return true;
  if (/^[\d\s.,%:x+-]+(px|rem|em|ms|s|%|deg|dvh|vh|vw)?$/u.test(limpio)) return true;
  if (/^\w+(\.\w+)+$/u.test(limpio)) return true;
  return false;
}

function esPalabraDeCodigo(palabra: string): boolean {
  if (/^[a-z][a-z0-9]*([A-Z][a-z0-9]*)+$/u.test(palabra)) return true;
  if (/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/u.test(palabra)) return true;
  if (/_/u.test(palabra)) return true;
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/u.test(palabra)) return true;
  if (/^[a-z]+\/[a-z0-9.+-]+$/u.test(palabra)) return true;
  if (/^(maun|numa)[.:]/u.test(palabra)) return true;
  return false;
}

function esParaUnaPersona(texto: string, contexto: Contexto): boolean {
  const limpio = texto.replace(/\s+/gu, ' ').trim();
  if (!LETRA.test(limpio)) return false;
  const { tipo, nombre } = contexto;
  if (['import', 'tipo', 'clave', 'indice', 'case', 'comparacion', 'condicion'].includes(tipo)) {
    return false;
  }
  if (tipo === 'llamada' && /^console\./u.test(nombre)) return false;
  if (tipo === 'atributo' && esAtributoDeCodigo(nombre, contexto.elemento ?? '')) return false;
  if (/^(className|class|clases?|claseDe\w*)$/u.test(nombre)) return false;
  if (/^<\/?[a-z]/u.test(limpio)) return false;
  if (/[;{}]$/u.test(limpio) && /[=()]/u.test(limpio)) return false;
  if (pareceClase(limpio) || pareceDatoTecnico(limpio)) return false;

  const palabras = limpio.split(' ').filter((palabra) => LETRA.test(palabra));
  const deCodigo = tipo === 'llamada' && LLAMADAS_DE_CODIGO.test(nombre);
  if (palabras.length >= 2) {
    if (deCodigo && !NO_ASCII.test(limpio) && !/[.:,;?!]$/u.test(limpio)) return false;
    return !palabras.every((palabra) => esPalabraDeCodigo(palabra.replace(/[,;]$/u, '')));
  }
  const palabra = (palabras[0] ?? '').replace(/^[¿¡«(]+|[.,:;!?…»)]+$/gu, '');
  if (esPalabraDeCodigo(palabra) || PALABRAS_DE_CODIGO.has(palabra) || deCodigo) return false;
  if (NO_ASCII.test(limpio)) return true;
  if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+$/u.test(palabra)) return true;
  return tipo === 'jsx-hijo' || tipo === 'atributo';
}

function textoDePlantilla(nodo: ts.TemplateExpression): string {
  return [nodo.head.text, ...nodo.templateSpans.map((parte) => parte.literal.text)].join(' ');
}

export function textosSueltosDe(nombreDelArchivo: string, codigo: string): TextoSuelto[] {
  const archivo = ts.createSourceFile(
    nombreDelArchivo,
    codigo,
    ts.ScriptTarget.Latest,
    true,
    nombreDelArchivo.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const sueltos: TextoSuelto[] = [];
  const anotar = (nodo: ts.Node, texto: string, contexto: string) => {
    const { line } = archivo.getLineAndCharacterOfPosition(nodo.getStart(archivo));
    sueltos.push({ linea: line + 1, texto: texto.replace(/\s+/gu, ' ').trim(), contexto });
  };

  const visitar = (nodo: ts.Node): void => {
    if (ts.isJsxText(nodo)) {
      const texto = nodo.text.replace(/\s+/gu, ' ').trim();
      if (texto !== '' && LETRA.test(texto)) anotar(nodo, texto, 'jsx');
      return;
    }
    if (
      ts.isStringLiteral(nodo) ||
      ts.isNoSubstitutionTemplateLiteral(nodo) ||
      ts.isTemplateExpression(nodo)
    ) {
      if (ts.isTaggedTemplateExpression(nodo.parent)) return;
      const texto = ts.isTemplateExpression(nodo) ? textoDePlantilla(nodo) : nodo.text;
      const contexto = contextoDe(nodo, archivo);
      if (esParaUnaPersona(texto, contexto)) {
        anotar(
          nodo,
          texto,
          `${contexto.tipo}${contexto.nombre === '' ? '' : `:${contexto.nombre}`}`,
        );
      }
      if (ts.isTemplateExpression(nodo)) {
        for (const parte of nodo.templateSpans) visitar(parte.expression);
      }
      return;
    }
    ts.forEachChild(nodo, visitar);
  };
  visitar(archivo);
  return sueltos;
}

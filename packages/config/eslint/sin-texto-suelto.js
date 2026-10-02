import atributos from './atributos-de-codigo.json' with { type: 'json' };

const LETRA = /\p{L}/u;

const ATRIBUTOS_DE_CODIGO = new Map(Object.entries(atributos.todos));

const ATRIBUTOS_DE_CODIGO_POR_ELEMENTO = new Map(
  Object.entries(atributos.porElemento).map(([elemento, propios]) => [
    elemento,
    new Map(Object.entries(propios)),
  ]),
);

const PREFIJOS_DE_CODIGO = [/^data-/u, /^on[A-Z]/u];

function esAtributoDeCodigo(nombre, elemento) {
  return (
    ATRIBUTOS_DE_CODIGO.has(nombre) ||
    (ATRIBUTOS_DE_CODIGO_POR_ELEMENTO.get(elemento)?.has(nombre) ?? false) ||
    PREFIJOS_DE_CODIGO.some((prefijo) => prefijo.test(nombre))
  );
}

function nombreDelElemento(abre) {
  const nombre = abre?.name;
  if (nombre?.type === 'JSXIdentifier') return nombre.name;
  if (nombre?.type === 'JSXMemberExpression') return nombre.property.name;
  return '';
}

function conLetras(valor) {
  return typeof valor === 'string' && LETRA.test(valor);
}

function textosDeLaExpresion(expresion) {
  if (expresion === null || expresion === undefined) return [];
  switch (expresion.type) {
    case 'Literal':
      return typeof expresion.value === 'string'
        ? [{ nodo: expresion, texto: expresion.value }]
        : [];
    case 'TemplateLiteral':
      return [
        {
          nodo: expresion,
          texto: expresion.quasis.map((parte) => parte.value.cooked ?? '').join(''),
        },
      ];
    case 'ConditionalExpression':
      return [
        ...textosDeLaExpresion(expresion.consequent),
        ...textosDeLaExpresion(expresion.alternate),
      ];
    case 'LogicalExpression':
      return [...textosDeLaExpresion(expresion.left), ...textosDeLaExpresion(expresion.right)];
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
      return textosDeLaExpresion(expresion.expression);
    default:
      return [];
  }
}

export const sinTextoSuelto = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Todo texto que lee una persona sale del catálogo de mensajes, en los tres idiomas (ADR 0082).',
    },
    messages: {
      suelto: 'Texto sin traducir: «{{texto}}». Pasalo al catálogo, con sus tres idiomas.',
    },
    schema: [],
  },
  create(context) {
    const avisar = (nodo, texto) =>
      context.report({
        node: nodo,
        messageId: 'suelto',
        data: { texto: texto.replace(/\s+/gu, ' ').trim().slice(0, 50) },
      });
    return {
      JSXText(nodo) {
        if (conLetras(nodo.value)) avisar(nodo, nodo.value);
      },
      JSXExpressionContainer(nodo) {
        if (nodo.parent?.type === 'JSXAttribute') return;
        for (const { nodo: hallado, texto } of textosDeLaExpresion(nodo.expression)) {
          if (conLetras(texto)) avisar(hallado, texto);
        }
      },
      JSXAttribute(nodo) {
        const nombre =
          nodo.name.type === 'JSXIdentifier'
            ? nodo.name.name
            : `${nodo.name.namespace.name}:${nodo.name.name.name}`;
        if (esAtributoDeCodigo(nombre, nombreDelElemento(nodo.parent)) || nodo.value === null) {
          return;
        }
        const textos =
          nodo.value.type === 'Literal'
            ? [{ nodo: nodo.value, texto: nodo.value.value }]
            : nodo.value.type === 'JSXExpressionContainer'
              ? textosDeLaExpresion(nodo.value.expression)
              : [];
        for (const { nodo: hallado, texto } of textos) {
          if (conLetras(texto)) avisar(hallado, texto);
        }
      },
    };
  },
};

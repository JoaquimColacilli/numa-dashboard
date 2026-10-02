const LETRA = /\p{L}/u;

const ATRIBUTOS_DE_CODIGO = new Map([
  ['className', 'clases de Tailwind'],
  ['class', 'clases'],
  ['id', 'identificador del elemento'],
  ['key', 'clave de React'],
  ['type', 'tipo del elemento'],
  ['role', 'rol de accesibilidad'],
  ['href', 'dirección'],
  ['to', 'ruta de la app'],
  ['name', 'nombre del campo para el formulario'],
  ['htmlFor', 'id del campo'],
  ['form', 'id del formulario'],
  ['inputMode', 'teclado del celular'],
  ['autoComplete', 'autocompletar del navegador'],
  ['autoCapitalize', 'mayúsculas del teclado'],
  ['autoCorrect', 'corrector del teclado'],
  ['enterKeyHint', 'tecla de enviar'],
  ['target', 'destino del enlace'],
  ['rel', 'relación del enlace'],
  ['lang', 'etiqueta del idioma'],
  ['translate', 'si el traductor del navegador lo toca'],
  ['dir', 'dirección del texto'],
  ['src', 'archivo'],
  ['srcSet', 'archivos'],
  ['sizes', 'medidas de las imágenes'],
  ['accept', 'tipos de archivo'],
  ['capture', 'cámara'],
  ['pattern', 'expresión regular'],
  ['method', 'método del formulario'],
  ['action', 'destino del formulario'],
  ['loading', 'carga de la imagen'],
  ['decoding', 'decodificación de la imagen'],
  ['popover', 'modo del popover'],
  ['popoverTarget', 'id del popover'],
  ['popoverTargetAction', 'acción del popover'],
  ['aria-hidden', 'verdadero o falso'],
  ['aria-live', 'cortesía del lector de pantalla'],
  ['aria-current', 'estado'],
  ['aria-labelledby', 'ids'],
  ['aria-describedby', 'ids'],
  ['aria-controls', 'ids'],
  ['aria-owns', 'ids'],
  ['aria-haspopup', 'tipo'],
  ['aria-sort', 'sentido'],
  ['aria-autocomplete', 'modo'],
  ['aria-orientation', 'orientación'],
  ['d', 'trazo SVG'],
  ['viewBox', 'caja SVG'],
  ['xmlns', 'espacio de nombres SVG'],
  ['fill', 'color SVG'],
  ['stroke', 'color SVG'],
  ['transform', 'transformación SVG'],
  ['points', 'puntos SVG'],
  ['strokeLinecap', 'trazo SVG'],
  ['strokeLinejoin', 'trazo SVG'],
  ['fillRule', 'relleno SVG'],
  ['clipRule', 'recorte SVG'],
  ['textAnchor', 'alineado SVG'],
  ['shapeRendering', 'dibujo SVG'],
  ['vectorEffect', 'trazo SVG'],
  ['preserveAspectRatio', 'proporción SVG'],
]);

const PREFIJOS_DE_CODIGO = [/^data-/u, /^on[A-Z]/u];

function esAtributoDeCodigo(nombre) {
  return (
    ATRIBUTOS_DE_CODIGO.has(nombre) || PREFIJOS_DE_CODIGO.some((prefijo) => prefijo.test(nombre))
  );
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
        if (esAtributoDeCodigo(nombre) || nodo.value === null) return;
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

import type { Hueco } from '@maun/domain';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';

import { partesDelTexto, type Valores } from '../../model/presupuestoDelTaller';
import { DATO_EN_EL_TEXTO } from './TextoConDatos';

function unDato(hueco: Hueco, valores: Valores): HTMLSpanElement {
  const dato = document.createElement('span');
  dato.contentEditable = 'false';
  dato.dataset.hueco = hueco;
  dato.className = DATO_EN_EL_TEXTO;
  dato.textContent = valores[hueco];
  return dato;
}

function pintar(caja: HTMLElement, texto: string, valores: Valores): void {
  caja.replaceChildren(
    ...partesDelTexto(texto).map((parte) =>
      parte.tipo === 'texto' ? document.createTextNode(parte.texto) : unDato(parte.hueco, valores),
    ),
  );
}

function leer(caja: HTMLElement): string {
  let texto = '';
  for (const nodo of caja.childNodes) {
    if (nodo instanceof HTMLElement && nodo.dataset.hueco !== undefined) {
      texto += `{${nodo.dataset.hueco}}`;
    } else if (nodo instanceof HTMLBRElement) {
      texto += ' ';
    } else {
      texto += nodo.textContent ?? '';
    }
  }
  return texto.replace(/\u00a0/g, ' ');
}

function caracterAntes(rango: Range): string {
  const { startContainer, startOffset } = rango;
  if (startContainer.nodeType === Node.TEXT_NODE && startOffset > 0) {
    return (startContainer.textContent ?? '').charAt(startOffset - 1);
  }
  const anterior = startContainer.childNodes[startOffset - 1];
  return anterior === undefined ? '' : (anterior.textContent ?? '').slice(-1);
}

export interface EditorConDatosProps {
  texto: string;
  valores: Valores;
  etiquetadoPor: string;
  descritoPor?: string;
  invalido?: boolean;
  enfocarAlAbrir?: boolean;
  placeholder?: string;
  alCambiar: (texto: string) => void;
  registrar?: (insertar: ((hueco: Hueco) => void) | null) => void;
}

export function EditorConDatos({
  texto,
  valores,
  etiquetadoPor,
  descritoPor,
  invalido = false,
  enfocarAlAbrir = false,
  placeholder = '',
  alCambiar,
  registrar,
}: EditorConDatosProps) {
  const caja = useRef<HTMLDivElement>(null);
  const rango = useRef<Range | null>(null);
  const alAbrir = useRef({ texto, enfocar: enfocarAlAbrir });
  const alCambiarVigente = useRef(alCambiar);
  const valoresVigentes = useRef(valores);
  const [vacio, setVacio] = useState(texto.trim() === '');

  useLayoutEffect(() => {
    alCambiarVigente.current = alCambiar;
    valoresVigentes.current = valores;
  });

  useLayoutEffect(() => {
    const elemento = caja.current;
    if (elemento === null) return;
    pintar(elemento, alAbrir.current.texto, valoresVigentes.current);
    if (!alAbrir.current.enfocar) return;
    elemento.focus();
    const alFinal = document.createRange();
    alFinal.selectNodeContents(elemento);
    alFinal.collapse(false);
    const seleccion = window.getSelection();
    seleccion?.removeAllRanges();
    seleccion?.addRange(alFinal);
  }, []);

  useEffect(() => {
    const elemento = caja.current;
    if (elemento === null) return;
    for (const dato of elemento.querySelectorAll<HTMLElement>('[data-hueco]')) {
      const hueco = dato.dataset.hueco as Hueco;
      if (dato.textContent !== valores[hueco]) dato.textContent = valores[hueco];
    }
  }, [valores]);

  useEffect(() => {
    const guardar = () => {
      const elemento = caja.current;
      const seleccion = window.getSelection();
      if (elemento === null || seleccion === null || seleccion.rangeCount === 0) return;
      const actual = seleccion.getRangeAt(0);
      if (elemento.contains(actual.startContainer)) rango.current = actual.cloneRange();
    };
    document.addEventListener('selectionchange', guardar);
    return () => {
      document.removeEventListener('selectionchange', guardar);
    };
  }, []);

  useEffect(() => {
    if (registrar === undefined) return;
    registrar((hueco) => {
      const elemento = caja.current;
      if (elemento === null) return;
      elemento.focus();
      let donde = rango.current;
      if (donde === null || !elemento.contains(donde.startContainer)) {
        donde = document.createRange();
        donde.selectNodeContents(elemento);
        donde.collapse(false);
      }
      donde.deleteContents();
      const antes = caracterAntes(donde);
      const dato = unDato(hueco, valoresVigentes.current);
      donde.insertNode(dato);
      if (antes !== '' && !/\s/.test(antes)) dato.before(document.createTextNode(' '));
      const espacio = document.createTextNode(' ');
      dato.after(espacio);
      const despues = document.createRange();
      despues.setStart(espacio, 1);
      despues.collapse(true);
      const seleccion = window.getSelection();
      seleccion?.removeAllRanges();
      seleccion?.addRange(despues);
      rango.current = despues.cloneRange();
      const leido = leer(elemento);
      setVacio(leido.trim() === '');
      alCambiarVigente.current(leido);
    });
    return () => {
      registrar(null);
    };
  }, [registrar]);

  return (
    <div
      ref={caja}
      role="textbox"
      aria-multiline="true"
      aria-labelledby={etiquetadoPor}
      aria-describedby={descritoPor}
      aria-invalid={invalido || undefined}
      contentEditable
      spellCheck
      data-vacio={vacio ? '' : undefined}
      data-placeholder={placeholder}
      onInput={(evento) => {
        const leido = leer(evento.currentTarget);
        setVacio(leido.trim() === '');
        alCambiar(leido);
      }}
      onKeyDown={(evento: KeyboardEvent<HTMLDivElement>) => {
        if (evento.key === 'Enter') evento.preventDefault();
      }}
      onPaste={(evento: ClipboardEvent<HTMLDivElement>) => {
        evento.preventDefault();
        const pegado = evento.clipboardData.getData('text/plain').replace(/\s+/g, ' ');
        const seleccion = window.getSelection();
        if (seleccion === null || seleccion.rangeCount === 0) return;
        const donde = seleccion.getRangeAt(0);
        donde.deleteContents();
        const nodo = document.createTextNode(pegado);
        donde.insertNode(nodo);
        donde.setStartAfter(nodo);
        donde.collapse(true);
        seleccion.removeAllRanges();
        seleccion.addRange(donde);
        const leido = leer(evento.currentTarget);
        setVacio(leido.trim() === '');
        alCambiar(leido);
      }}
      className={`relative min-h-22 w-full rounded-field border bg-paper px-3.5 py-2.5 text-body-lg leading-relaxed break-words whitespace-pre-wrap text-ink data-vacio:before:pointer-events-none data-vacio:before:absolute data-vacio:before:text-text-3 data-vacio:before:content-[attr(data-placeholder)] ${
        invalido ? 'border-alerta' : 'border-border'
      }`}
    />
  );
}

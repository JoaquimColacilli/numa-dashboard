import type { Page } from '@playwright/test';

export function textosFueraDelCatalogo(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const conLetras = /\p{L}/u;
    const marcado = /[⟦⟧]/u;
    const deTerceros = '.react-flow__attribution';
    const afuera = `[translate="no"], [data-seudo], ${deTerceros}, option, textarea, script, style, noscript, [hidden]`;
    const sueltos: string[] = [];
    const caminante = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let nodo = caminante.nextNode(); nodo !== null; nodo = caminante.nextNode()) {
      const texto = nodo.textContent ?? '';
      if (!conLetras.test(texto) || marcado.test(texto)) continue;
      const padre = nodo.parentElement;
      if (padre === null || padre.closest(afuera) !== null) continue;
      sueltos.push(texto.trim());
    }
    for (const elemento of document.body.querySelectorAll(
      '[aria-label], [title], [placeholder], [alt]',
    )) {
      if (elemento.closest(`[translate="no"], ${deTerceros}`) !== null) continue;
      for (const atributo of ['aria-label', 'title', 'placeholder', 'alt']) {
        const valor = elemento.getAttribute(atributo);
        if (valor !== null && conLetras.test(valor) && !marcado.test(valor)) {
          sueltos.push(`${atributo}=${valor}`);
        }
      }
    }
    return [...new Set(sueltos)];
  });
}

export function textosCortados(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, a, h1, h2, h3, label, [role="tab"]')]
      .filter((elemento) => {
        if (elemento.getBoundingClientRect().width <= 1) return false;
        const estilo = getComputedStyle(elemento);
        if (estilo.textOverflow !== 'ellipsis' && estilo.overflow !== 'hidden') return false;
        return elemento.scrollWidth > elemento.clientWidth + 1;
      })
      .map((elemento) => elemento.textContent.trim())
      .filter((texto) => /[⟦⟧]/u.test(texto)),
  );
}

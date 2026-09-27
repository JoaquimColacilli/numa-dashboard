import { render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import HTML from '../../../index.html?raw';
import CONFIGURACION from '../../../vite.config.ts?raw';
import { EsqueletoDeArranque } from './EsqueletoDeArranque';
import {
  ABRIENDO_LA_APP,
  conElEsqueleto,
  htmlDelEsqueleto,
  RAIZ_VACIA,
  TRAYENDO_LOS_DATOS,
} from './esqueleto';

afterEach(() => {
  delete document.documentElement.dataset.arranque;
});

function esqueleto(): HTMLElement {
  const raiz = document.querySelector<HTMLElement>('[data-esqueleto-de-arranque]');
  if (raiz === null) throw new Error('no se dibujó el esqueleto');
  return raiz;
}

describe('una sola fuente para el primer cuadro y para React', () => {
  it('el HTML que el build pone en #root es el mismo que React dibuja al arrancar, en las tres formas', () => {
    for (const forma of ['marco', 'acceso', 'bloqueo'] as const) {
      expect(
        renderToStaticMarkup(<EsqueletoDeArranque que={ABRIENDO_LA_APP} forma={forma} />),
      ).toBe(htmlDelEsqueleto());
    }
  });

  it('el build lo inyecta en #root del index.html, y el vite.config lo usa', () => {
    expect(HTML).toContain(RAIZ_VACIA);
    expect(conElEsqueleto(HTML)).toContain(`<div id="root">${htmlDelEsqueleto()}</div>`);
    expect(CONFIGURACION).toContain('transformIndexHtml: conElEsqueleto');
  });

  it('sin la raíz vacía el build se corta en vez de salir sin esqueleto', () => {
    expect(() => conElEsqueleto('<div id="app"></div>')).toThrow(RAIZ_VACIA);
  });

  it('el index.html armado no nombra al service worker, que el arnés del aviso busca', () => {
    expect(conElEsqueleto(HTML)).not.toContain('serviceWorker');
  });

  it('está quieto: nada anima ni hace transiciones', () => {
    expect(htmlDelEsqueleto()).not.toMatch(/animate-|transition|motion-/);
  });
});

describe('lo que se lee y lo que no', () => {
  it('lo dibujado no se lee y no tiene main, nav, h1 ni #contenido, que los e2e buscan en la app', () => {
    render(<EsqueletoDeArranque que={ABRIENDO_LA_APP} forma="marco" />);
    const raiz = esqueleto();

    expect(
      raiz.querySelectorAll('main, nav, h1, h2, #contenido, [role="navigation"]'),
    ).toHaveLength(0);
    const conTexto = [...raiz.querySelectorAll('*')].filter(
      (elemento) =>
        elemento.closest('[aria-hidden="true"]') === null &&
        [...elemento.childNodes].some(
          (hijo) => hijo.nodeType === Node.TEXT_NODE && (hijo.textContent ?? '').trim() !== '',
        ),
    );
    expect(conTexto).toHaveLength(1);
    expect(conTexto[0]).toHaveAttribute('role', 'status');
  });

  it('el estado es un solo nodo con role="status", escondido mientras abre', () => {
    render(<EsqueletoDeArranque que={ABRIENDO_LA_APP} />);

    const estados = within(esqueleto()).getAllByRole('status');
    expect(estados).toHaveLength(1);
    expect(estados[0]).toHaveTextContent(ABRIENDO_LA_APP);
    expect(estados[0]).toHaveClass('sr-only');
  });

  it('cuando falta la réplica entera, el mismo nodo se ve en letra chica, en el renglón de la fecha', () => {
    render(<EsqueletoDeArranque que={TRAYENDO_LOS_DATOS} visible forma="marco" />);

    const estado = within(esqueleto()).getByRole('status');
    expect(estado).toHaveTextContent(TRAYENDO_LOS_DATOS);
    expect(estado).not.toHaveClass('sr-only');
    expect(estado).toHaveClass('text-label', 'text-text-2');
    expect(estado.nextElementSibling).toHaveClass('text-h1');
  });

  it('lo que tarda aparece adentro del mismo esqueleto, debajo del encabezado', () => {
    render(
      <EsqueletoDeArranque que={TRAYENDO_LOS_DATOS} visible forma="marco">
        <button type="button">Reintentar</button>
      </EsqueletoDeArranque>,
    );

    expect(esqueleto()).toContainElement(screen.getByRole('button', { name: 'Reintentar' }));
    expect(screen.getByRole('button', { name: 'Reintentar' }).closest('[aria-hidden]')).toBeNull();
  });
});

describe('la forma', () => {
  it('queda en el html, que es de donde cuelga cuál de las tres se ve', () => {
    const { rerender } = render(<EsqueletoDeArranque que={ABRIENDO_LA_APP} forma="bloqueo" />);
    expect(document.documentElement.dataset.arranque).toBe('bloqueo');

    rerender(<EsqueletoDeArranque que={TRAYENDO_LOS_DATOS} visible forma="marco" />);
    expect(document.documentElement.dataset.arranque).toBe('marco');
  });

  it('cada forma se ve solo con su marca, y en /v/ y /o/, sin marca, no se ve ninguna', () => {
    const html = htmlDelEsqueleto();
    expect(html).toContain('hidden min-h-0 flex-1 [[data-arranque]_&amp;]:flex');
    expect(html).toContain('[[data-arranque=acceso]_&amp;]:block');
    expect(html).toContain('[[data-arranque=bloqueo]_&amp;]:block');
  });
});

import { centavos, ETIQUETAS_DE_IDIOMA, IDIOMAS } from '@maun/domain';
import { render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Panorama } from '@/pages/inicio';
import { PantallaDeAcceso } from '@/shared/ui';

import HTML from '../../../index.html?raw';
import CONFIGURACION from '../../../vite.config.ts?raw';
import { EsqueletoDeArranque } from './EsqueletoDeArranque';
import {
  ABRIENDO_LA_APP,
  CIFRA_DEL_PANORAMA,
  CIFRAS_DEL_PANORAMA,
  conElEsqueleto,
  ETIQUETAS_DEL_ARRANQUE,
  htmlDelEsqueleto,
  RAIZ_VACIA,
  scriptDelEstadoDelArranque,
  SECCION_DEL_PANORAMA,
  TEXTOS_DEL_ARRANQUE,
  TITULO_DEL_PANORAMA,
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

describe('el dibujo del panel del acceso', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('la forma del acceso reserva el hueco y la placa con las clases de la pantalla, vacía y sin data-lamina', () => {
    vi.stubGlobal('matchMedia', (consulta: string) => ({
      matches: false,
      media: consulta,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    const pantalla = render(
      <PantallaDeAcceso titulo="Entrá al taller" pose="trabajando">
        <p>Formulario</p>
      </PantallaDeAcceso>,
    );
    const hueco = pantalla.container.querySelector('[data-pose]');
    const lamina = pantalla.container.querySelector('[data-lamina]');
    const envoltorio = hueco?.parentElement;
    const clasesDe = (nodo: Element | null | undefined) => [...(nodo?.classList ?? [])];
    const esperado = {
      envoltorio: clasesDe(envoltorio),
      hueco: clasesDe(hueco),
      lamina: clasesDe(lamina),
    };
    pantalla.unmount();

    render(<EsqueletoDeArranque que={ABRIENDO_LA_APP} forma="acceso" />);
    const acceso = esqueleto().querySelector('[data-forma="acceso"]');
    const placa = acceso?.querySelector('.lamina-de-la-marca');

    expect(placa).not.toBeNull();
    expect(placa).not.toHaveAttribute('data-lamina');
    expect(acceso?.querySelector('svg')).toBeNull();
    expect(clasesDe(placa?.parentElement)).toEqual(esperado.hueco);
    expect(clasesDe(placa?.parentElement?.parentElement)).toEqual(esperado.envoltorio);
    expect(esperado.lamina).toEqual(expect.arrayContaining(clasesDe(placa)));
  });
});

describe('el lugar del panorama de Inicio', () => {
  const clases = (texto: string) => texto.split(' ');
  const clasesDe = (nodo: Element | null | undefined) => [...(nodo?.classList ?? [])];

  it('va entre la portada y los tesoros, con cuatro cifras', () => {
    render(<EsqueletoDeArranque que={ABRIENDO_LA_APP} forma="marco" />);
    const seccion = [...esqueleto().querySelectorAll('div')].find(
      (nodo) => nodo.className === SECCION_DEL_PANORAMA,
    );

    expect(seccion).toHaveAttribute('aria-hidden', 'true');
    expect(seccion?.previousElementSibling?.querySelector('.lamina')).not.toBeNull();
    expect(seccion?.nextElementSibling?.querySelector('.bg-hogar')).not.toBeNull();
    expect(
      [...(seccion?.querySelectorAll('div') ?? [])].filter(
        (nodo) => nodo.className === CIFRA_DEL_PANORAMA,
      ),
    ).toHaveLength(4);
  });

  it('mide lo mismo porque lleva las clases del panorama de verdad', () => {
    render(
      <Panorama
        panorama={{
          paraPagar: centavos(132_700_000),
          ahorros: centavos(413_100_000),
          superavit: centavos(36_500_000),
          insumos: centavos(82_000_000),
          compromisoDeMaun: centavos(0),
          tesorosParaPagar: 3,
          tesorosDeAhorro: 4,
          tesoroDelSuperavit: 's',
          trabajosConInsumos: 2,
        }}
        nombreDelSuperavit="Maun"
      />,
    );
    const seccion = screen.getByRole('region', { name: 'Panorama' });
    const cifra = seccion.querySelector('[data-cifra-del-panorama]');

    expect(clasesDe(seccion)).toEqual(expect.arrayContaining(clases(SECCION_DEL_PANORAMA)));
    expect(clasesDe(seccion.querySelector('h2'))).toEqual(
      expect.arrayContaining(clases(TITULO_DEL_PANORAMA)),
    );
    expect(clasesDe(seccion.querySelector('dl'))).toEqual(clases(CIFRAS_DEL_PANORAMA));
    expect(clasesDe(cifra)).toEqual(clases(CIFRA_DEL_PANORAMA));
    expect(clasesDe(cifra?.querySelector('dt'))).toEqual(
      expect.arrayContaining(['self-end', 'text-meta', 'leading-tight']),
    );
    expect(clasesDe(cifra?.querySelector('[data-monto]'))).toEqual(
      expect.arrayContaining(['text-monto-que-entra', 'leading-tight']),
    );
    expect(cifra?.querySelector('[data-monto]')?.parentElement).toHaveClass(
      'flex',
      'min-w-0',
      'flex-col',
    );
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

describe('el primer cuadro en el idioma de quien abre', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.lang = 'es-AR';
  });

  it('los textos del arranque están en los tres idiomas, con las etiquetas de la app', () => {
    expect(Object.keys(TEXTOS_DEL_ARRANQUE).sort()).toEqual([...IDIOMAS].sort());
    expect(ETIQUETAS_DEL_ARRANQUE).toEqual(ETIQUETAS_DE_IDIOMA);
    for (const textos of Object.values(TEXTOS_DEL_ARRANQUE)) {
      for (const texto of Object.values(textos)) expect(texto.trim()).not.toBe('');
    }
  });

  it('el build pone el script del estado justo después de la raíz, que React reemplaza al dibujar', () => {
    expect(conElEsqueleto(HTML)).toContain(
      `<div id="root">${htmlDelEsqueleto()}</div>${scriptDelEstadoDelArranque()}`,
    );
  });

  it.each(IDIOMAS)(
    'en %s, el script deja el mismo DOM que React dibuja al arrancar, con un solo estado',
    (idioma) => {
      document.body.innerHTML = `<div id="root">${htmlDelEsqueleto()}</div>`;
      document.documentElement.lang = ETIQUETAS_DE_IDIOMA[idioma];
      const delBuild = document.createElement('script');
      delBuild.textContent =
        /<script>([\s\S]*?)<\/script>/u.exec(scriptDelEstadoDelArranque())?.[1] ?? '';
      document.body.append(delBuild);
      delBuild.remove();

      const raiz = document.getElementById('root');
      expect(raiz?.querySelectorAll('[role="status"]')).toHaveLength(1);
      for (const forma of ['marco', 'acceso', 'bloqueo'] as const) {
        const deReact = document.createElement('div');
        deReact.innerHTML = renderToStaticMarkup(
          <EsqueletoDeArranque que={TEXTOS_DEL_ARRANQUE[idioma].abriendoLaApp} forma={forma} />,
        );
        expect(raiz?.innerHTML).toBe(deReact.innerHTML);
      }
    },
  );
});

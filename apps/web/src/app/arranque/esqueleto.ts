export interface Elemento {
  readonly etiqueta: string;
  readonly atributos: Readonly<Record<string, string>>;
  readonly hijos: readonly Nodo[];
}

export interface Ranura {
  readonly ranura: true;
}

export type Nodo = Elemento | Ranura | string;

export const ABRIENDO_LA_APP = 'Abriendo la app';
export const TRAYENDO_LOS_DATOS = 'Trayendo los datos del taller';
export const ABRIENDO_LA_PANTALLA = 'Abriendo la pantalla';

export const RAIZ_VACIA = '<div id="root"></div>';

const RANURA: Ranura = { ranura: true };

const TITULO = 'bg-ink/14';
const TEXTO = 'bg-ink/10';
const TENUE = 'bg-ink/7';
const ICONO = 'bg-ink/14';

const PAGINA =
  'mx-auto flex w-full max-w-content flex-col gap-3 px-(--page-pad-mobile) py-4 md:gap-4 md:px-(--page-pad-tablet) md:py-6 lg:px-(--page-pad-desktop) lg:py-7';

const TARJETA = 'rounded-panel border border-hairline bg-paper';

function elemento(
  etiqueta: string,
  atributos: Readonly<Record<string, string>>,
  ...hijos: Nodo[]
): Elemento {
  return { etiqueta, atributos, hijos };
}

function caja(clase: string, ...hijos: Nodo[]): Elemento {
  return elemento('div', { class: clase }, ...hijos);
}

function dibujo(clase: string, ...hijos: Nodo[]): Elemento {
  return elemento('div', { 'aria-hidden': 'true', class: clase }, ...hijos);
}

function raya(clase: string): Elemento {
  return elemento('span', { class: clase });
}

function renglon(texto: string, ancho: string, tono = TEXTO): Elemento {
  return elemento(
    'span',
    { class: `flex h-[1lh] items-center ${texto}` },
    raya(`h-[0.7em] rounded-pill ${ancho} ${tono}`),
  );
}

function renglonGrande(texto: string, ancho: string, tono = TITULO): Elemento {
  return elemento(
    'span',
    { class: `flex h-[1lh] items-center ${texto}` },
    raya(`h-[0.5em] rounded-pill ${ancho} ${tono}`),
  );
}

function mas(lado: string): Elemento {
  return elemento(
    'span',
    { class: `relative block ${lado}` },
    raya('absolute inset-x-0 top-1/2 h-[2.5px] -translate-y-1/2 rounded-pill bg-paper'),
    raya('absolute inset-y-0 left-1/2 w-[2.5px] -translate-x-1/2 rounded-pill bg-paper'),
  );
}

const DESTINOS_DE_LA_BARRA_LATERAL = [
  'w-9',
  'w-13',
  'w-17',
  'w-16',
  'w-14',
  'w-15',
  'w-14',
  'w-17',
  'w-13',
  'w-13',
];

function destinoDeLaBarraLateral(ancho: string, indice: number): Elemento {
  return caja(
    `flex h-10 items-center gap-3 rounded-pill border px-2.5 ${
      indice === 0 ? 'border-hairline bg-paper' : 'border-transparent'
    }`,
    raya(`size-5 flex-none rounded-[6px] ${ICONO}`),
    raya(`h-[9px] rounded-pill ${ancho} ${indice === 0 ? TITULO : TEXTO}`),
  );
}

function barraLateral(): Elemento {
  return dibujo(
    'hidden w-[232px] flex-none flex-col gap-0.5 px-3.5 pt-5.5 pb-4.5 min-[1280px]:flex',
    caja(
      'flex items-center justify-between pb-4.5',
      caja(
        'flex min-h-tap items-center px-2.5',
        raya(`h-[27px] w-[100px] rounded-[6px] ${TITULO}`),
      ),
      renglon('text-meta', 'w-9', TENUE),
    ),
    caja(
      'mb-4 flex h-10 items-center justify-center gap-2 rounded-pill bg-ink shadow-fab',
      mas('size-3.5'),
      raya('h-[9px] w-28 rounded-pill bg-paper/45'),
    ),
    ...DESTINOS_DE_LA_BARRA_LATERAL.map(destinoDeLaBarraLateral),
    caja('flex-1'),
    caja(
      'flex items-start gap-2.5 border-t border-hairline px-2.5 pt-3',
      raya(`mt-0.5 size-9 flex-none rounded-pill ${TEXTO}`),
      caja(
        'flex min-w-0 flex-1 flex-col',
        renglon('text-label', 'w-28', TITULO),
        renglon('text-meta', 'w-36', TENUE),
        renglon('text-meta', 'w-24', TENUE),
      ),
    ),
  );
}

function destinoDelRiel(indice: number): Elemento {
  return caja(
    `flex h-12 w-13 items-center justify-center rounded-pill border ${
      indice === 0 ? 'border-hairline bg-paper' : 'border-transparent'
    }`,
    raya(`size-[22px] rounded-[7px] ${ICONO}`),
  );
}

function riel(): Elemento {
  return dibujo(
    'hidden w-[76px] flex-none flex-col items-center gap-1.5 py-4.5 min-[768px]:flex min-[1280px]:hidden',
    caja(
      'mb-3.5 flex size-tap items-center justify-center',
      raya(`h-[23px] w-[18px] rounded-[5px] ${TITULO}`),
    ),
    caja(
      'mb-4.5 flex size-tap items-center justify-center rounded-pill bg-ink shadow-fab',
      mas('size-5'),
    ),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(destinoDelRiel),
    caja('flex-1'),
    destinoDelRiel(-1),
  );
}

function destinoDeLaBarraInferior(lugar: string, ancho: string, activo: boolean): Elemento {
  return caja(
    `flex h-[50px] min-w-tap flex-col items-center justify-center gap-[5px] rounded-pill ${lugar} ${
      activo ? 'bg-ink/7' : ''
    }`,
    raya(`size-[22px] rounded-[7px] ${ICONO}`),
    raya(`h-[7px] rounded-pill ${ancho} ${activo ? TITULO : TEXTO}`),
  );
}

function barraInferior(): Elemento {
  return dibujo(
    'fixed inset-x-0 bottom-0 z-30 flex flex-col items-center px-4 pb-[calc(14px+env(safe-area-inset-bottom))] min-[768px]:hidden',
    caja(
      'grid w-full grid-cols-1',
      caja(
        'col-start-1 row-start-1 mt-3.75 h-bottom-nav rounded-pill border border-ink/8 bg-paper shadow-float',
      ),
      caja(
        'relative col-start-1 row-start-1 mt-3.75 grid h-bottom-nav grid-cols-[1fr_1fr_76px_1fr_1fr] items-center',
        destinoDeLaBarraInferior('col-start-1 ml-1.5', 'w-9', true),
        destinoDeLaBarraInferior('col-start-2', 'w-14', false),
        destinoDeLaBarraInferior('col-start-4', 'w-12', false),
        destinoDeLaBarraInferior('col-start-5 mr-1.5', 'w-12', false),
      ),
      caja(
        'relative col-start-1 row-start-1 flex size-fab items-center justify-center self-start justify-self-center rounded-pill bg-ink shadow-fab',
        mas('size-[22px]'),
      ),
    ),
  );
}

function estado(que: string, visible: boolean): Elemento {
  return elemento(
    'p',
    {
      role: 'status',
      class: visible
        ? 'flex h-[1lh] items-center text-label text-text-2'
        : 'sr-only [font-family:system-ui]',
    },
    que,
  );
}

function encabezado(que: string, visible: boolean): Elemento {
  return caja(
    'flex items-center justify-between gap-3',
    caja(
      'flex min-w-0 flex-col gap-0.5',
      estado(que, visible),
      ...(visible
        ? []
        : [
            elemento(
              'span',
              { 'aria-hidden': 'true', class: 'flex h-[1lh] items-center text-label' },
              raya(`h-[0.7em] w-20 rounded-pill ${TEXTO}`),
            ),
          ]),
      elemento(
        'span',
        {
          'aria-hidden': 'true',
          class: 'flex h-[1lh] items-center font-display text-h1 leading-tight lg:text-h1-lg',
        },
        raya(`h-[0.5em] w-28 rounded-pill ${TITULO}`),
      ),
    ),
    dibujo(
      'flex flex-none items-center gap-2 min-[768px]:hidden',
      raya(`size-11 rounded-pill ${TARJETA}`),
      raya(`size-11 rounded-pill ${TEXTO}`),
    ),
  );
}

function portada(): Elemento {
  return dibujo(
    `@container/con-lamina ${TARJETA} p-1.5`,
    caja(
      'grid grid-cols-1 gap-1.5 @min-[40rem]/con-lamina:grid-cols-2',
      caja('lamina h-49 @min-[40rem]/con-lamina:h-auto @min-[40rem]/con-lamina:min-h-70'),
      caja(
        'flex min-w-0 flex-col items-stretch gap-2 px-3.5 pt-4 pb-3.5 @min-[40rem]/con-lamina:justify-center @min-[40rem]/con-lamina:px-8 @min-[40rem]/con-lamina:py-8',
        renglon('text-label', 'w-40'),
        caja(
          'flex flex-col',
          renglonGrande(
            'font-display text-lema leading-tight @min-[40rem]/con-lamina:text-portada',
            'w-[94%]',
            TITULO,
          ),
          renglonGrande(
            'font-display text-lema leading-tight @min-[40rem]/con-lamina:text-portada',
            'w-[86%]',
            TITULO,
          ),
          renglonGrande(
            'font-display text-lema leading-tight @min-[40rem]/con-lamina:text-portada',
            'w-[58%]',
            TITULO,
          ),
        ),
      ),
    ),
  );
}

export const SECCION_DEL_PANORAMA = `@container ${TARJETA} px-4 py-4 md:px-5`;
export const TITULO_DEL_PANORAMA = 'flex items-center gap-1.5 text-label';
export const CIFRAS_DEL_PANORAMA =
  'mt-3 grid grid-cols-2 gap-x-3 gap-y-4 @min-[34rem]:grid-cols-4 @min-[34rem]:gap-x-4';
export const CIFRA_DEL_PANORAMA = '@container row-span-3 grid min-w-0 grid-rows-subgrid gap-y-0.5';

const ETIQUETA_DE_LA_CIFRA = 'self-end text-meta leading-tight';

function etiquetaDeLaCifra(ancho: string): Elemento {
  return renglon(ETIQUETA_DE_LA_CIFRA, ancho);
}

function etiquetaQueSeParte(ancho: string, anchoDelSegundo: string): Elemento {
  return caja(
    `flex flex-col ${ETIQUETA_DE_LA_CIFRA}`,
    elemento(
      'span',
      { class: 'flex h-[1lh] items-center' },
      raya(`h-[0.7em] rounded-pill ${ancho} ${TEXTO}`),
    ),
    elemento(
      'span',
      { class: 'hidden h-[1lh] items-center @max-[8.1rem]:flex' },
      raya(`h-[0.7em] rounded-pill ${anchoDelSegundo} ${TEXTO}`),
    ),
  );
}

function cifraDelPanorama(etiqueta: Elemento, monto: string, detalle: string): Elemento {
  return caja(
    CIFRA_DEL_PANORAMA,
    etiqueta,
    caja(
      'flex min-w-0 flex-col',
      renglon('text-monto-que-entra leading-tight [--caracteres:11]', monto, TITULO),
    ),
    renglon('text-meta', detalle, TENUE),
  );
}

function panorama(): Elemento {
  return dibujo(
    SECCION_DEL_PANORAMA,
    caja(
      TITULO_DEL_PANORAMA,
      renglon('text-label', 'w-18', TITULO),
      caja(
        'flex size-5 flex-none items-center justify-center',
        raya(`size-4 rounded-pill ${TENUE}`),
      ),
    ),
    caja(
      CIFRAS_DEL_PANORAMA,
      cifraDelPanorama(etiquetaDeLaCifra('w-16'), 'w-[74%]', 'w-[58%]'),
      cifraDelPanorama(etiquetaDeLaCifra('w-13'), 'w-[82%]', 'w-[62%]'),
      cifraDelPanorama(etiquetaDeLaCifra('w-15'), 'w-[66%]', 'w-[48%]'),
      cifraDelPanorama(etiquetaQueSeParte('w-[88%]', 'w-[44%]'), 'w-[70%]', 'w-[64%]'),
    ),
  );
}

function tesoro(canto: string): Elemento {
  return caja(
    `relative flex min-h-[118px] min-w-0 flex-col justify-between gap-3 overflow-hidden p-3 pb-4 ${TARJETA}`,
    caja(
      'flex items-center gap-2',
      raya(`size-[18px] flex-none rounded-[6px] ${ICONO}`),
      renglon('text-label', 'w-14'),
    ),
    caja(
      'flex flex-col gap-0.5',
      renglon('text-money-lg font-semibold', 'w-[64%]', TITULO),
      renglon('text-meta', 'w-[78%]', TENUE),
    ),
    raya(`absolute inset-x-0 bottom-0 h-[5px] ${canto}`),
  );
}

function tesoros(): Elemento {
  return dibujo(
    'min-w-0 md:@container/tablero',
    caja(
      '@container grid grid-cols-2 gap-3 md:gap-4 @min-[54rem]/tablero:grid-flow-col @min-[54rem]/tablero:grid-cols-none @min-[54rem]/tablero:auto-cols-fr',
      tesoro('bg-hogar'),
      tesoro('bg-maun'),
      tesoro('bg-diezmo'),
      tesoro('bg-cocos'),
    ),
  );
}

function acceso(ancho: string): Elemento {
  return caja(
    'flex min-h-17 items-center gap-3.5 border-t border-hairline-soft py-3 first:border-t-0',
    raya(`size-9 flex-none rounded-field ${TENUE}`),
    caja(
      'flex min-w-0 flex-1 flex-col',
      renglon('text-meta', 'w-24', TENUE),
      renglon('text-body', ancho, TITULO),
    ),
  );
}

function elMes(): Elemento {
  return dibujo(
    'min-w-0 md:@container/apoyo',
    caja(
      'grid grid-cols-1 items-start gap-y-3 @min-[40rem]/apoyo:gap-y-4 @min-[52rem]/apoyo:grid-cols-[minmax(0,1fr)_22.5rem] @min-[52rem]/apoyo:gap-x-4 @min-[64rem]/apoyo:grid-cols-[minmax(0,1fr)_26rem]',
      caja(
        'flex min-w-0 flex-col gap-3 md:gap-4',
        caja(
          `flex items-start gap-2.5 px-4 py-4 md:px-5 ${TARJETA}`,
          raya(`mt-2 size-2 flex-none rounded-pill ${TITULO}`),
          caja(
            'flex min-w-0 flex-1 flex-col',
            renglon('text-body-lg leading-normal', 'w-[92%]'),
            renglon('text-body-lg leading-normal', 'w-[64%]'),
          ),
        ),
        caja(
          `flex flex-col gap-3 px-4 py-4 md:px-5 ${TARJETA}`,
          caja(
            'flex items-center justify-between',
            renglon('text-label', 'w-20', TITULO),
            renglon('text-meta', 'w-16', TENUE),
          ),
          caja(
            'grid grid-cols-3 gap-3',
            renglon('text-money-lg font-semibold', 'w-[70%]', TITULO),
            renglon('text-money-lg font-semibold', 'w-[60%]', TITULO),
            renglon('text-money-lg font-semibold', 'w-[80%]', TITULO),
          ),
        ),
      ),
      caja(`px-4 ${TARJETA}`, acceso('w-[70%]'), acceso('w-[56%]'), acceso('w-[40%]')),
    ),
  );
}

function marco(que: string, visible: boolean): Elemento {
  return elemento(
    'div',
    { 'data-forma': 'marco', class: 'hidden min-h-0 flex-1 [[data-arranque]_&]:flex' },
    barraLateral(),
    riel(),
    caja(
      'min-h-0 flex-1 overflow-hidden [scrollbar-gutter:stable_both-edges]',
      caja(PAGINA, encabezado(que, visible), RANURA, portada(), panorama(), tesoros(), elMes()),
    ),
    barraInferior(),
  );
}

function canto(): Elemento {
  return caja(
    'absolute inset-x-0 bottom-0 flex h-1.5 gap-0.5',
    raya('flex-[26_1_0] bg-hogar'),
    raya('flex-[46_1_0] bg-maun'),
    raya('flex-[14_1_0] bg-diezmo'),
    raya('flex-[34_1_0] bg-cocos'),
  );
}

function dibujoDeLaMarca(): Elemento {
  return caja(
    'mt-auto flex min-h-0 flex-1 flex-col justify-end pt-4 md:justify-center lg:row-start-2 lg:mt-0 lg:flex-none lg:gap-8 lg:self-center lg:pt-0',
    caja(
      'flex max-h-50 min-h-0 flex-1 items-end @container-size md:max-h-74 md:justify-center lg:max-h-none lg:flex-none lg:justify-start lg:@container-normal',
      caja(
        'lamina lamina-de-la-marca h-full w-full md:max-w-[30rem] lg:h-auto',
        raya('hidden aspect-[4/3] w-full lg:block lg:max-h-[40dvh]'),
      ),
    ),
    caja(
      'hidden max-w-[24ch] flex-col lg:flex lg:max-w-[420px]',
      renglonGrande('text-lema leading-snug', 'w-[96%]', 'bg-sobre-marca/25'),
      renglonGrande('text-lema leading-snug', 'w-[90%]', 'bg-sobre-marca/25'),
      renglonGrande('text-lema leading-snug', 'w-[62%]', 'bg-sobre-marca/25'),
    ),
  );
}

function persona(): Elemento {
  return caja(
    'mt-auto flex min-w-0 items-center gap-3.5 pt-8 lg:row-start-2 lg:mt-0 lg:self-center lg:pt-0',
    raya('size-14 flex-none rounded-pill bg-sobre-marca/20'),
    caja(
      'flex min-w-0 flex-1 flex-col',
      renglon('text-body-lg', 'w-40', 'bg-sobre-marca/30'),
      renglon('text-label', 'w-52', 'bg-sobre-marca/18'),
    ),
  );
}

function boton(ancho: string, lugar = ''): Elemento {
  return caja(
    `flex min-h-12 items-center justify-center gap-2 rounded-pill bg-ink ${lugar}`.trim(),
    raya(`h-[9px] rounded-pill bg-paper/45 ${ancho}`),
  );
}

function campo(ancho: string): Elemento {
  return caja(
    'flex flex-col gap-1.5',
    renglon('text-label', ancho),
    caja('h-field rounded-field border border-border bg-paper'),
  );
}

function formularioDeAcceso(): Nodo[] {
  return [
    renglonGrande('font-display text-h1 leading-tight lg:text-h1-lg', 'w-56', TITULO),
    caja('flex flex-col gap-4', campo('w-12'), campo('w-20'), boton('w-14', 'mt-1')),
    caja(
      '-mt-2 flex min-h-tap items-center text-label',
      raya(`h-[0.7em] w-44 rounded-pill ${TENUE}`),
    ),
  ];
}

function notaDelAcceso(): Elemento {
  return caja(
    'mt-5 flex w-full max-w-[400px] flex-col md:mx-auto lg:row-start-3 lg:mx-0 lg:mt-0 lg:self-end',
    renglon('text-meta leading-relaxed', 'w-72', TENUE),
  );
}

function formularioDelBloqueo(): Nodo[] {
  return [
    caja(
      'flex flex-col gap-2',
      renglonGrande('font-display text-h1 leading-tight lg:text-h1-lg', 'w-52', TITULO),
      renglon('text-body leading-relaxed', 'w-[82%]', TENUE),
    ),
    caja(
      'flex flex-col gap-3',
      caja(
        'flex min-h-tap items-center gap-3',
        raya(`size-[26px] flex-none rounded-[8px] ${ICONO}`),
        renglon('text-body', 'w-36', TENUE),
      ),
      boton('w-28'),
      renglon('text-body', 'w-44'),
    ),
  ];
}

function pantallaDeAcceso(
  forma: 'acceso' | 'bloqueo',
  cuandoSeVe: string,
  abajo: Elemento,
  cuerpo: Nodo[],
  ...despues: Elemento[]
): Elemento {
  return elemento(
    'div',
    {
      'aria-hidden': 'true',
      'data-forma': forma,
      class: `fixed inset-0 z-40 hidden bg-mesa ${cuandoSeVe}`,
    },
    caja(
      'grid h-full min-h-0 grid-rows-[1fr_auto] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-[auto_1fr_auto]',
      caja(
        'relative flex min-h-[calc(env(safe-area-inset-top)+64px)] flex-col gap-1 overflow-hidden bg-marca px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-7 md:px-(--page-pad-tablet) lg:row-span-3 lg:grid lg:min-h-0 lg:grid-rows-subgrid lg:gap-0 lg:p-12',
        caja(
          'flex h-[30px] items-start lg:row-start-1',
          raya('mt-0.5 h-[23px] w-[85px] rounded-[5px] bg-sobre-marca/25'),
        ),
        renglon('text-label lg:row-start-3 lg:self-end', 'w-44', 'bg-sobre-marca/18'),
        abajo,
        canto(),
      ),
      caja(
        'flex flex-none flex-col px-(--page-pad-mobile) pt-7 pb-[calc(env(safe-area-inset-bottom)+20px)] md:px-(--page-pad-tablet) lg:row-span-3 lg:grid lg:grid-rows-subgrid lg:px-16 lg:py-12 xl:px-24',
        caja(
          'flex w-full max-w-[400px] flex-col gap-6 md:mx-auto lg:row-start-2 lg:mx-0 lg:self-center',
          ...cuerpo,
        ),
        ...despues,
      ),
    ),
  );
}

export interface OpcionesDelEsqueleto {
  que: string;
  visible: boolean;
}

export function esqueletoDeArranque({ que, visible }: OpcionesDelEsqueleto): Elemento {
  return elemento(
    'div',
    { 'data-esqueleto-de-arranque': '', class: 'relative flex min-h-0 flex-1' },
    marco(que, visible),
    pantallaDeAcceso(
      'acceso',
      '[[data-arranque=acceso]_&]:block',
      dibujoDeLaMarca(),
      formularioDeAcceso(),
      notaDelAcceso(),
    ),
    pantallaDeAcceso(
      'bloqueo',
      '[[data-arranque=bloqueo]_&]:block',
      persona(),
      formularioDelBloqueo(),
    ),
  );
}

const ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (caracter) => ESCAPES[caracter] ?? caracter);
}

export function aHtml(nodo: Nodo): string {
  if (typeof nodo === 'string') return escapar(nodo);
  if ('ranura' in nodo) return '';
  const atributos = Object.entries(nodo.atributos)
    .map(([nombre, valor]) => ` ${nombre}="${escapar(valor)}"`)
    .join('');
  return `<${nodo.etiqueta}${atributos}>${nodo.hijos.map(aHtml).join('')}</${nodo.etiqueta}>`;
}

export function htmlDelEsqueleto(): string {
  return aHtml(esqueletoDeArranque({ que: ABRIENDO_LA_APP, visible: false }));
}

export function conElEsqueleto(html: string): string {
  if (!html.includes(RAIZ_VACIA)) {
    throw new Error(`El index.html no tiene ${RAIZ_VACIA}: no hay dónde poner el esqueleto.`);
  }
  return html.replace(RAIZ_VACIA, `<div id="root">${htmlDelEsqueleto()}</div>`);
}

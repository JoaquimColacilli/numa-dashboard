# 0075. La app abre sin pantalla en blanco

- Estado: aceptada
- Fecha: 2026-09-26
- Completa al [0009](0009-velocidad.md) (qué se ve mientras la app arranca y qué sale a la red en
  paralelo), al [0028](0028-la-huella-se-pide-cada-vez-que-se-sale.md) (el primer cuadro con el
  bloqueo puesto) y al [0031](0031-ninguna-pantalla-de-sesion-encierra.md) (dónde se ven «Abriendo la
  app», «Trayendo los datos del taller» y lo que aparece a los 15 s).
- Enmendada el 2026-09-28 por el [ADR 0078](0078-los-tesoros-configurables-y-la-fila.md): la forma de
  Inicio suma el panorama entre la portada y los tesoros, con las clases de `Panorama`.
- Enmendado el 2026-10-02 por el [ADR 0082](0082-la-app-en-tres-idiomas.md): el esqueleto sale en el idioma de
  quien abre desde el primer cuadro: el build lleva sus textos en los tres idiomas y el script del `head`
  escribe el del idioma en el único elemento con texto, antes de pintar, con la misma regla que React. En otro
  idioma que el castellano, el esqueleto queda hasta que llega el primer catálogo.

## Contexto

Joaquim, después de mudar la app a `numa-dashboard.netlify.app` (0073):

> Cuando entro a Inicio con la cuenta ya logueada y sin caché, la pantalla queda en blanco 2 o 3
> segundos, hasta que carga todo. Con maun no pasaba.

Lo que ya había descartado él: las variables de Netlify (la app y la función de borde leen las mismas
dos) y el peso (el JS de entrada pasó de unos 445 a unos 464 KB comprimidos entre `f0b4e24` y
`a7c27bb`). Su hipótesis: con la dirección nueva, todo lo que vive por origen arrancó vacío (la réplica
en IndexedDB, el service worker con su precache y el caché HTTP), así que lo que ve es el arranque en
frío, que con `maun-dashboard` casi no pasaba porque siempre había réplica; y en frío la app no
muestra nada que se parezca a la app: `index.html` trae `#root` vacío, y después cada guarda dibuja
`Cargando`, dos barras al 6 % y una caja, sin el marco.

## Lo que se midió antes de tocar nada

`apps/web/scripts/medir-el-arranque.ts` (`pnpm --filter @maun/web medir-el-arranque`, fuera de
`verify`) levanta con `vite preview` el `dist` de cada build y lo abre con Playwright contra la base de
producción, con la cuenta de prueba guardada en `localStorage` como hace `entrarConLaSesion`. Los
hitos se toman desde afuera, porque el build viejo no tiene marcas: `first-paint` y
`first-contentful-paint` de la Paint Timing API, un `MutationObserver` sobre `#root` puesto con
`addInitScript` (el primer render de React es el primer cambio de `#root` después de que terminó de
parsearse el documento; «se ve Inicio» es el cuadro en que aparece `main#contenido h1` con «Inicio»), y
los tiempos de `rpc/bootstrap`, `rpc/delta`, el JWKS y el refresco del token con la Resource Timing
API, más su peso por Playwright. Tres escenarios:

- **frío**: contexto nuevo, sin service worker, sin caché HTTP y sin IndexedDB;
- **tibio**: con la réplica en IndexedDB, sin service worker ni caché HTTP, como una recarga forzada;
- **caliente**: todo guardado y el service worker controlando la página.

Dos perfiles: la compu sin freno (1440 × 900), y el celular (390 × 844, ×3) con la CPU ×4 y la red
como el «Slow 4G» de Lighthouse, frenada por CDP en la página: 150 ms de latencia por pedido,
1,6 Mbps de bajada y 750 kbps de subida. Diez corridas por celda; en las tablas van las medianas, en
milisegundos desde que arranca la navegación.

Cuatro cosas que conviene saber de la medición:

- **El freno de red es de la página.** Lo que baja el service worker al instalarse (el precache, 1,8 MB)
  no pasa por él. En el celular de verdad, la primera vez, compite con todo lo demás.
- **La compu va contra `localhost`.** El JS no viaja por internet: los 0,3 a 0,4 s en frío de la compu son
  mucho menos que lo que se ve contra Netlify. Los 2 o 3 segundos del reporte no salen en la mediana de
  la compu (sí en las puntas, más abajo); el perfil del celular reproduce la espera, y más larga.
- **La cuenta de prueba tiene pocos datos**: su `bootstrap()` pesa 2,8 KB comprimido.
- **El Chromium de la medición es el headless nuevo** (canal `chromium`), que respeta la pantalla de
  «Desktop Chrome» (1920 × 1080) aunque la ventana sea de celular: el script le fija la pantalla del
  teléfono, o `esCelular()` daba falso. El `chromium-headless-shell` del e2e toma la pantalla del
  viewport. Y el puerto por defecto es el 4191: el 4190 (sieve) está en la lista de puertos
  prohibidos de Fetch, y ni Node ni Chromium se conectan ahí.

### `main` contra `f0b4e24`: no hay regresión

| Build     | Escenario | Perfil     | Primer pintado | Primer contenido | Render de React | Inicio |
| --------- | --------- | ---------- | -------------: | ---------------: | --------------: | -----: |
| `f0b4e24` | frío      | escritorio |             44 |              406 |             112 |    343 |
| `main`    | frío      | escritorio |             44 |              404 |             114 |    339 |
| `f0b4e24` | tibio     | escritorio |             38 |              214 |             107 |    145 |
| `main`    | tibio     | escritorio |             34 |              202 |             101 |    138 |
| `f0b4e24` | caliente  | escritorio |             32 |              190 |              90 |    123 |
| `main`    | caliente  | escritorio |             32 |              202 |              96 |    129 |
| `f0b4e24` | frío      | celular    |            810 |            3.782 |           2.968 |  3.478 |
| `main`    | frío      | celular    |            836 |            3.896 |           3.105 |  3.597 |
| `f0b4e24` | tibio     | celular    |            818 |            3.606 |           3.039 |  3.224 |
| `main`    | tibio     | celular    |            824 |            3.706 |           3.153 |  3.341 |
| `f0b4e24` | caliente  | celular    |            104 |              846 |             364 |    538 |
| `main`    | caliente  | celular    |            106 |              830 |             368 |    539 |

La regla era: si tibio o caliente tarda en `main` más que en `f0b4e24` por más de 150 ms o del 10 %
(lo que sea mayor), hay una regresión. Tibio y caliente dieron −8 y +6 ms en la compu, y +116 (con
una tolerancia de 322) y +1 ms en el celular: **no hay regresión, y no hubo nada que buscar con
`git bisect`**. Los 116 ms del tibio del celular son los 19 KB comprimidos de más de `main` a
1,6 Mbps, que eran esperables.

### Lo que se ve: la mesa vacía

Con eso, la hipótesis se confirma por el lado de lo que se ve, no del tiempo. En frío, en el celular,
el primer pintado a los 0,84 s es la mesa sin nada, porque `#root` está vacío y el JS (464 KB
comprimidos) tarda en bajar; el primer render de React, a los 3,1 s, es `Cargando`, que se ve igual de
vacío; e Inicio aparece a los 3,6 s. En la tira de cuadros de los primeros tres segundos en frío en el
celular, los doce de `main` son la mesa vacía. En la compu pasa lo mismo, más corto: la mesa hasta que
React dibuja Inicio.

La cadena que había detrás, medida con los estados de carga en frío en el celular: el primer render a
los 3.098 ms, la réplica que no estaba se sabe a los 3.198 (lo que tarda IndexedDB en restaurar), la
sesión se da por activa a los 3.224, y el `bootstrap` sale a los 3.237: 39 ms después de saber que
faltaba. La validación de la sesión (`getClaims`, que baja el JWKS) arrancaba con el primer
`useSesion`, 30 a 470 ms después del primer render según el escenario. En caliente, Inicio ya aparecía
antes de que saliera a la red nada de lo que valida la sesión.

### Contra la dirección publicada

Para tener un número de verdad de la compu, el mismo script abrió `numa-dashboard.netlify.app` (que es
`main`) diez veces en frío y diez en caliente desde la compu de Joaquim, sin freno: en frío, el primer
pintado (la mesa vacía) a los 382 ms, el primer render a los 471 e Inicio a los 703; en caliente,
Inicio a los 121. Con esa conexión, la mediana son 0,3 s de mesa vacía, no 2 o 3.

Lo que sí da 2 o 3 s está en las puntas. De las 638 aperturas medidas en total, en cuatro el
`bootstrap()` tardó más de un segundo en volver, y las cuatro fueron la primera de su tanda, en frío en
la compu: 4,2 s dos veces (Inicio a los 4,4 y 4,5 s), 2,2 s contra la dirección publicada (Inicio a
los 2,7 s) y 1,1 s. Las demás volvieron en unos cientos de milisegundos. La hipótesis, sin verificar:
el primer pedido después de un rato sin pedidos paga algo del lado de Supabase (la conexión del pooler o
el plan de la función), y en frío no hay réplica que mostrar mientras tanto. Con la dirección nueva,
cada aparato pasó por un arranque en frío. No lo investigué más allá de esto.

### `bootstrap()` al volumen del taller de Eliseo

Contado de solo lectura, en una transacción `read only` que terminó en `rollback`: el taller tiene 288
filas vivas entre todas las tablas de la réplica (57 del libro: pagos, gastos y movimientos) y 14 MB
en archivos. `pnpm --filter @maun/db db:medir 288` siembra su propia mezcla en una transacción que se
revierte (500 clientes fijos, 12 trabajos con 5 pagos y 5 gastos cada uno, y 168 movimientos: 800
filas, más que las de él) y da **37 ms en la base, 373 KB y 24 KB comprimido** (46,9, 37,1, 36,6 y 36,7
ms en cuatro mediciones). Es una cota por arriba, lejos de los umbrales del 0009 (500 ms y 1 MB
comprimido): el `bootstrap` no es lo que se espera.

### Con el token vencido

En caliente, con la sesión guardada vencida (el script la vence con `--token-vencido`), la apertura
espera el refresco antes de dar la sesión por activa: Inicio a los 192 ms en la compu (131 con el token
vigente) y a los 667 en el celular (538). Son 60 y 130 ms acá; con la señal del taller, lo que tarde el
refresco, hasta el tope de 10 s del 0031. **No se cambia en este ADR** (ver «Alternativas
descartadas»).

## Decisión

### 1. Nunca más una pantalla vacía: el esqueleto de arranque

Los cinco `Cargando` del arranque y del acceso (`EsperandoElCache`, `RutaConSesion`, `RutaConAcceso`,
`RutaPublica` y el `Suspense` de `Shell`) son ahora `EsqueletoDeArranque`, y `Cargando` se fue.

- **Tiene la forma de la pantalla que viene.** El marco en su ancho, donde lo pone `Navegacion`: la
  barra de abajo con el «+» por debajo de 768 px, el riel entre 768 y 1279, la barra lateral desde
  1280, con los mismos cortes en píxeles que `Navegacion`. Adentro, la forma de Inicio: la fecha y el
  título, la portada con su lámina (la grilla de puntos, sin dibujo), el panorama con sus cuatro cifras
  (ADR 0078), los cuatro tesoros con su canto de color, y el mes con los accesos. Sin sesión guardada, la forma del acceso; con el bloqueo puesto en
  un celular, la de la pantalla de bloqueo.
- **Tiene el contraste de una pantalla de verdad**: tarjetas de papel con su borde sobre la mesa, el
  canto de los tesoros, los botones en tinta, y rayas en tinta al 7, 10 y 14 % donde va el texto. Está
  quieto: ni brillos que corren ni transiciones (0074).
- **Lo dibujado va con `aria-hidden`, y sin `main`, `nav`, `h1` ni `#contenido`**, que los e2e buscan
  en la app de verdad.
- **El estado es un solo nodo con `role="status"`** y los textos de siempre, «Abriendo la app» y
  «Trayendo los datos del taller», porque los ayudantes de los e2e esperan que desaparezca. Vive en el
  renglón de la fecha del marco, siempre en el DOM: escondido mientras abre, y a la vista en letra chica
  cuando lo que falta es la réplica entera (en ese caso la raya de la fecha no se dibuja, así el renglón
  no cambia de alto). Las formas del acceso y del bloqueo tapan el marco, sin sacarlo del árbol de
  accesibilidad.
- **`CargaQueTarda`, a los 15 s, aparece adentro del mismo esqueleto**, en una tarjeta debajo del
  encabezado, con «Reintentar» y «Cerrar sesión».

### 2. El mismo esqueleto sale en el HTML

- **Una sola fuente.** `app/arranque/esqueleto.ts` describe el esqueleto como un árbol de datos, sin
  React ni imports. El build lo pasa a HTML y lo inyecta en `#root` (`conElEsqueleto`, un plugin de
  `transformIndexHtml` en `vite.config.ts`); React lo pasa a elementos (`EsqueletoDeArranque`). Como
  React al arrancar dibuja el mismo árbol con las mismas clases, el primer cuadro y el primer render son
  el mismo DOM: `createRoot` limpia `#root` y pone uno igual, sin salto. `esqueleto.test.tsx` falla si el
  HTML del build y `renderToStaticMarkup` del componente se separan, en las tres formas.
- **Las clases viven en `src`**, porque Tailwind no lee `index.html` (`@source` apunta a `src`).
- **Las tres formas van en el HTML y el CSS elige la que se ve**, por `html[data-arranque]`: el
  script del `head` la pone antes de que se parsee el `body`, así el primer cuadro ya tiene la forma que
  corresponde, sin JS. React escribe la suya en el mismo atributo, con las mismas reglas: una guarda que
  ya sabe más (la réplica, cuando la sesión está activa y sin bloqueo) pasa `forma="marco"`, y el
  `Suspense` de las pantallas de acceso, `forma="acceso"`.
- **Las reglas del script y las de React son las mismas** (`app/arranque/forma.ts`): en `/v/` y `/o/`
  ninguna (las páginas del cliente siguen como estaban); sin sesión guardada (`CLAVE_DE_SESION`), el
  acceso; con sesión y el bloqueo del mismo usuario (`CLAVE_DEL_BLOQUEO`) en un celular
  (`CORTE_DE_CELULAR` sobre el lado corto de la pantalla, como `esCelular`), el bloqueo; si no, el
  marco. `forma.test.ts` ata cada clave que lee el script con su constante, como `vista-publica.test.ts`
  ata los prefijos, y además corre el script del `head` en jsdom y compara lo que elige con
  `formaDelArranque` en 700 combinaciones de ruta, sesión, bloqueo y pantalla.
- **La recarga corta que abre sin huella (`abreSinHuella`) queda afuera del script**: es un salto raro
  (una recarga de verdad a menos de 15 s de la última vez adentro), y en ese caso el primer cuadro tiene
  la forma del bloqueo y pasa a la app.
- **En oscuro se ve oscuro desde el primer cuadro**: el tema lo pone el mismo script, antes, y el
  esqueleto es todo tokens.
- El `index.html` armado no dice `serviceWorker`, que es lo que busca
  `el-aviso-que-ya-estaba.spec.ts`. `bloqueo.spec.ts` suma que, con el bloqueo puesto y el JS
  bloqueado, el primer cuadro ya tiene la forma del bloqueo.

### 3. Lo que pasó a ir en paralelo

- **La validación de la sesión arranca con la app** (`empezarLaSesion()` en `arrancar()`, salvo en
  `/v/` y `/o/`), y no con el primer `useSesion`. Eso crea el cliente de Supabase y empieza el
  refresco del token si venció antes del primer render, y baja el JWKS 70 a 470 ms antes.
- **El `bootstrap` sale apenas se sabe que no hay réplica para el usuario de la sesión guardada**:
  cuando termina de restaurarse IndexedDB (`traerLaReplicaDeLaSesionGuardada`, en el `onSuccess` del
  proveedor), con las mismas opciones y la misma clave de `useReplica` (`opcionesDeLaReplica`), así
  `useReplica` se engancha al pedido en vuelo y no sale otro. En `/acceso` no sale, porque ahí la
  sesión puede estar cambiando por el enlace de un correo.
- **No cambia qué valida la sesión** ni lo que garantizan el 0031 y el 0044: el store sigue siendo el
  único que decide, con el mismo tope y la misma marca de cierre. Con el bloqueo puesto, el `bootstrap`
  puede traer la réplica mientras se ve la pantalla de bloqueo: no se dibuja nada detrás, que es lo que
  cuida el 0023.

### 4. En caliente no se espera a la red

Ya era así: con la réplica guardada y el token vigente, el evento inicial de supabase-js, que es local,
da la sesión por activa, y `getClaims` valida atrás. Lo que faltaba era dejarlo probado.
`abrir-sin-que-conteste-la-red.spec.ts` guarda la réplica, retiene sin contestar todo lo que va a
Supabase (los pedidos y el WebSocket de Realtime: retener y no abortar, porque abortar es falta de red,
que ya tiene su camino y su test) y recarga: Inicio tiene que aparecer igual, desde lo guardado, en
menos de 5 s. Para ver que el test agarra el caso, se rompió a propósito el store para que ignore el
evento inicial y espere a `getClaims`: el test falló con Inicio sin aparecer a los 5 s.

### 5. Lo que encontró la medición del después

La primera versión del esqueleto hacía más lento el tibio del celular (+104 ms) y el de la compu
(+30). Era la letra: el estado escondido, aunque sea `sr-only`, es texto dibujado, y hacía bajar la
IBM Plex (22 KB) mientras bajaba el JS, compartiendo los 1,6 Mbps. Ahora ese texto escondido va en la
letra del sistema (`[font-family:system-ui]`); a la vista, con la de la app.

## Antes y después

`main` contra la rama, en la misma corrida, diez por celda:

| Build  | Escenario | Perfil     | Primer pintado | Primer contenido | Render de React | Inicio | `bootstrap` sale → vuelve | JWKS sale |
| ------ | --------- | ---------- | -------------: | ---------------: | --------------: | -----: | ------------------------- | --------: |
| `main` | frío      | escritorio |             56 |              472 |             145 |    392 | 184 → 376                 |       184 |
| rama   | frío      | escritorio |             60 |              158 |             125 |    312 | 134 → 300                 |       113 |
| `main` | tibio     | escritorio |             40 |              208 |             107 |    139 | —                         |       182 |
| rama   | tibio     | escritorio |             50 |              214 |             112 |    132 | —                         |       104 |
| `main` | caliente  | escritorio |             32 |              200 |              96 |    131 | —                         |       172 |
| rama   | caliente  | escritorio |             36 |              200 |             101 |    122 | —                         |        92 |
| `main` | frío      | celular    |            836 |            3.904 |           3.098 |  3.621 | 3.237 → 3.543             |     3.235 |
| rama   | frío      | celular    |            872 |            3.284 |           3.161 |  3.503 | 3.207 → 3.420             |     3.099 |
| `main` | tibio     | celular    |            836 |            3.694 |           3.140 |  3.336 | —                         |     3.617 |
| rama   | tibio     | celular    |            876 |            3.654 |           3.196 |  3.333 | —                         |     3.145 |
| `main` | caliente  | celular    |            104 |              836 |             363 |    538 | —                         |       745 |
| rama   | caliente  | celular    |            108 |              896 |             436 |    569 | —                         |       394 |

- **Lo que cambia es lo que se ve**: en la rama, el primer pintado ya es el esqueleto (a los 0,87 s en
  frío en el celular, donde `main` mostraba la mesa vacía hasta los 3,1 s), y en la compu, a los 60 ms.
  El «primer contenido» baja porque la grilla de puntos de la lámina es una imagen de fondo, que la Paint
  Timing API cuenta como contenido.
- **Inicio**: 80 ms antes en frío en la compu y 118 en el celular; tibio y caliente, iguales (−7 y −9
  en la compu, −3 en el tibio del celular). En el caliente del celular, +31 en esta corrida y −62 en una
  anterior de seis: el esqueleto cuesta unos 70 ms de CPU (a ×4) antes del primer render de React, y la
  sesión que ya arrancó se ahorra una vuelta de render. Está dentro del ruido y de la tolerancia.
- Con el token vencido, en caliente: la compu 192 → 172 ms y el celular 667 → 700.
- La tira de los primeros tres segundos en frío en el celular: en `main`, doce cuadros de mesa vacía;
  en la rama, el esqueleto desde el cuadro de 1 s.

El peso: `index.html` de 2,85 a 24,90 KB (1,08 a 3,77 KB comprimido), el JS de entrada de 706,53 a
716,97 KB (195,01 a 197,82 comprimido, el árbol del esqueleto) y el CSS de 106,06 a 109,29 KB (20,93 a
21,49 comprimido). Sin dependencias nuevas.

## Alternativas descartadas

- **Partir el bundle por rutas**, que el 0009 había previsto y el 0013 sacó para las pantallas del
  taller. Ensayado en un worktree aparte, con todas las pantallas en `lazy` menos Inicio: el JS de
  entrada baja de 466 a 351 KB comprimidos (el `index`, de 198 a 83), y el precache pasa de 37 a 68
  archivos. Medido contra la rama, diez por celda: en el celular emulado, Inicio a los 3.106 ms en frío
  (3.551 en la rama, −445) y a los 2.973 en tibio (3.367, −394); en la compu, 304 contra 312 y 126
  contra 124, lo mismo. El primer cuadro, en cambio, sale más tarde (1.108 contra 882 ms en frío en el
  celular). **Es lo que más le bajaría al arranque en frío con mala señal, y queda como propuesta**: el
  pedido lo dejaba afuera, y cuesta volver a tener pantallas del taller que se cargan por la red la
  primera vez que se abren, con su espera y su error propios (el 0013 las sacó por eso), en una app que
  se usa sin señal.
- **Abrir con la sesión guardada sin validar cuando el token venció**, sin esperar el refresco:
  ahorraría lo medido arriba (unos 60 ms en la compu, 130 en el celular emulado, y hasta los 10 s del
  tope con la señal del taller), a cambio de mostrar la réplica de una sesión que el servidor todavía no
  aceptó, que es justo lo que el 0031 y el 0044 acotan. Cambia qué valida la sesión al abrir, así que no
  entra en este pedido; queda como propuesta.
- **Un esqueleto que brilla o late**: nada se mueve por su cuenta (0074).
- **Que React dibuje solo la forma elegida**: le ahorraría crear los nodos de las otras dos, pero el
  HTML y el primer render dejarían de ser el mismo árbol, que es lo que el test ata.

## Consecuencias

- Una forma nueva, o un cambio en la de Inicio, se toca en `esqueleto.ts`, y el test compara el HTML
  con React solo.
- Una regla nueva para elegir la forma va en `forma.ts` y en el script del `head` a la vez;
  `forma.test.ts` falla si eligen distinto.
- El esqueleto tiene siempre la forma de Inicio, aunque la app se abra en otra pantalla (una ficha
  desde un aviso): ahí el salto es del esqueleto a esa pantalla.

## Objeciones

- **En el celular, el primer cuadro todavía espera el CSS** (21,5 KB comprimido, que baja junto con el
  JS): con la red del celular emulado, el primer pintado es a los 0,87 s, y antes el navegador muestra
  blanco. Meter el CSS entero en el HTML lo adelantaría, a costa de repetir en cada navegación lo que hoy
  se cachea aparte. No se midió.
- **Nada de esto se probó en un teléfono.** Los números son de Chromium en esta compu, con la red y la
  CPU frenadas por CDP; el Samsung puede ser más rápido o más lento que la CPU ×4.

## Verificación

- `esqueleto.test.tsx` (el HTML del build contra React en las tres formas, la inyección, el estado único,
  lo que no se lee, la ranura de lo que tarda, la marca en el `html`) y `forma.test.ts` (las claves y las
  700 combinaciones del script contra React).
- `replica-al-abrir.test.tsx`: el pedido sale con la clave de `useReplica` y `useReplica` se engancha
  sin hacer otro; con réplica, sin sesión o en `/acceso`, no sale.
- e2e: `abrir-sin-que-conteste-la-red.spec.ts` (en las dos anchuras), el caso nuevo de
  `bloqueo.spec.ts`, y `callejones-de-sesion.spec.ts`, `offline.spec.ts` y `cambios-en-vivo.spec.ts` sin
  tocarlos.
- Las capturas del primer cuadro, con sesión, sin sesión y con el bloqueo, en claro y en oscuro, y de
  «Trayendo los datos del taller» y lo de los 15 s a 390, 1024 y 1440, miradas una por una.

## Fuentes

- W3C, Paint Timing: qué cuenta como «contentful» (texto, imágenes, también las de fondo, SVG y canvas
  no blanco). <https://w3c.github.io/paint-timing/>
- WHATWG Fetch, «bad port» (el 4190 está en la lista). <https://fetch.spec.whatwg.org/#bad-port>
- Lighthouse, las constantes del perfil «Slow 4G» del celular (150 ms, 1,6 Mbps, 750 kbps y CPU ×4).
  <https://github.com/GoogleChrome/lighthouse/blob/main/core/config/constants.js>
- React, `createRoot`: el primer render reemplaza lo que haya adentro del contenedor.
  <https://react.dev/reference/react-dom/client/createRoot>

# 0078. Los tesoros configurables y la fila

- Estado: aceptada
- Fecha: 2026-09-28
- Enmienda al [0003](0003-distribucion-congelada.md) (los repartos, `dist_fila` y la foto de la
  reapertura son parte de lo congelado, y el libro lleva la cuenta por id de tesoro), al
  [0010](0010-sincronizacion-replica-completa.md) (`MN023` a `MN025`, las dos tablas en la réplica y
  dos esperas más en los locks), al [0011](0011-dominio-cascada-estados-y-cobro.md) (la cascada es la
  fila de siempre, las cinco gemelas nuevas y lo que suma el mes en cada camino), al
  [0016](0016-el-cobro-y-el-rechazo-que-encuentra-al-usuario.md) (el pedido con la fila y el ajuste por
  `dist_previo`), al [0018](0018-finanzas-el-diezmo-y-los-movimientos-a-mano.md) (la novena clase,
  «Entre tesoros»), al [0062](0062-el-reparto-en-la-compu.md) (`/tesoros` es la única pantalla del
  marco sin `Pagina` en la tablet y en la compu), al [0068](0068-la-mesa-y-el-plano.md) (la cuadrícula
  del plano, las cuatro tintas y la lámina de la primera vez) y al
  [0072](0072-el-sueldo-se-topea-por-mes.md) (una fila guardada cuenta el sueldo por mes).
- Sigue al [0074](0074-lo-que-responde-al-tocar.md) (el lienzo no anima nada y los botones usan
  `apretable`) y al [0075](0075-la-app-abre-sin-pantalla-en-blanco.md) (el esqueleto sigue con cuatro
  tarjetas).

## Contexto

Es de Eliseo, contado por Joaquim:

> Quiere tesoros configurables: un lugar general donde entran los gastos fijos (el sueldo, el
> alquiler), que salen del mismo ingreso y, como son fijos, tienen un tope. Pasado ese tope, el
> excedente lo quiere mandar él a los tesoros que quiera, que puede crear, editar y manejar. Antes del
> reparto van tesoros con prioridad, con un fijo mensual (por ejemplo $ 300.000 para materiales del
> taller), y recién cuando se llega a ese tope el resto se divide por porcentaje entre los otros tesoros
> (inversiones, inmuebles). El «monto fijo» del excedente es eso: un paso de prioridad con su tope.

Sus respuestas:

1. el tope es por mes;
2. el orden lo decide él, desde el manejo de los tesoros;
3. si un mes no alcanza para los gastos fijos, él decide de qué tesoro sale la plata.

Y lo visual, con las palabras de Joaquim cuando lo pidió: «una pantalla nueva de tesoros, con todas
estas configs, donde será una grilla (grilla de cuadraditos), de estas tipo Miro, donde él podrá armar
y unir con flechas los tesoros, elegir el monto, si es gasto fijo, prioridad, orden, y unirlo todo con
flechas como si fuera un diagrama. Que tenga sentido y sea excesivamente hermoso, en desktop, tablet y
mobile. Lo primordial es que se entienda todo, así que si hay que agregar tooltips (i) con hover
explicando, hagámoslo. Que eso también impacte en la pantalla de inicio. Y meter cosas nuevas del
sistema de ilustración.»

Hasta hoy la app tenía cuatro tesoros fijos, un enum (`public.tesoro`), y una cascada fija: el diezmo,
el sueldo a Hogar con su tope, los costos fijos con el suyo y el remanente en Maun (ADR 0011 y 0072).
Todo lo que sigue sale de cambiar eso sin tocar un dato que exista: hay una sola base, es producción, y
tiene los cobros de Eliseo.

## Lo investigado

Las fuentes se leyeron el 2026-09-27. Las citas van en el idioma de la página.

**Cómo reparten otros el ingreso, y por qué una fila.**

- _Actual Budget, las plantillas de metas_
  ([docs](https://actualbudget.org/docs/experimental/goal-templates/)), es lo más parecido a lo que
  pidió Eliseo: prioridades («Lower priority values get run first»), un tope que por defecto es del mes
  («the limit … is based per month») y un «resto» que corre al final repartido por pesos. Dos
  diferencias nuestras, a propósito: Actual reparte el centavo que sobra entre las categorías, y acá ese
  centavo queda en Maun; y en Actual el orden es el de la base y no el de la vista («based on the
  database order, not the view order»), y acá el orden de la fila es el que se ve.
- _Monzo, Salary Sorter y Bills Pots_
  ([blog](https://monzo.com/blog/2019/09/26/introducing-salary-sorter-and-bills-pots)): cada ingreso se
  divide entre potes («divide up that incoming payment however you like»), con un pote de cuentas fijas;
  si al pote le falta, Monzo «make[s] up the difference from your main account». Acá, en vez de sacar de
  un lugar fijo, Eliseo elige de dónde, como pidió en su tercera respuesta.
- _Goodbudget, llenar desde el ingreso_
  ([ayuda](https://goodbudget.com/help/budgeting-with-goodbudget/fill-from-income/)): un sobre que se
  queda con «extras or deficits». Es el papel de Maun: el resto y la pérdida.
- _YNAB, cubrir el faltante_
  ([novedad](https://www.ynab.com/whats-new/use-future-funds-to-cover-overspending)): el usuario elige de
  qué categorías sale la plata para cubrir, y el monto se propone hasta lo que falta o hasta lo que tiene
  la de origen. Es la hoja de cubrir. YNAB no marca el movimiento con el mes que cubre; acá sí, porque esa
  plata tiene que contar para el tope y el próximo cobro no la puede volver a llenar.
- _Monarch, presupuesto flexible_
  ([ayuda](https://help.monarch.com/hc/en-us/articles/32125337244052-Using-Flex-Budgeting)): los fijos
  son «predictable, recurring expenses that don't change much month to month», un bloque aparte; los
  gastos fijos de la fila son un paso con sus renglones.
- _Soman y Cheema, apartar en sobres_
  ([JMR, 2011](https://www-2.rotman.utoronto.ca/facbios/file/earmarking-jmrPP.pdf)): la gente ahorra más
  cuando la plata apartada se parte en cuentas con nombre (en el estudio de campo, 241 rupias sin partir
  contra 414 partidas), y lo apartado queda protegido porque gastarlo es «break additional partitions».
  Citan un hogar de 1923 con latas rotuladas, entre ellas una para el diezmo. Es la razón de que cada
  tesoro tenga nombre, tinta y su tarjeta.
- _Sussman y O'Brien, no tocar lo ahorrado_
  ([ScienceDaily, 2015](https://www.sciencedaily.com/releases/2015/11/151102131208.htm)): el riesgo
  contrario, que un fondo apartado se vuelva intocable y la gente se endeude antes que usarlo («they will
  leave those savings untouched … and incur high-interest credit card debt instead»). Por eso cubrir el
  faltante desde otro tesoro es un camino a la vista, desde Inicio, y la hoja dice qué cuesta sacar de
  Cocos en vez de prohibirlo.

**Cómo se edita un flujo en un lienzo.**

- _Stripe Workflows_ ([docs](https://docs.stripe.com/workflows/define-workflows)): «a trigger and a
  series of steps that run in order», armados en un editor visual, con versiones numeradas cada vez que
  se activa. La revisión del rótulo es la misma idea: cada guardado es una revisión, y un cobro armado con
  otra rebota con MN006.
- _Make, el router_ ([ayuda](https://help.make.com/router)): las rutas corren en orden, el orden se
  cambia con flechas y no arrastrando («Click arrows and move routes»), la disposición sale del orden
  («Auto-align arranges with set order»), y hay una ruta de resto al final. Es lo mismo que acá: Subir y
  Bajar, la disposición calculada, y el reparto como resto.
- _n8n, atajos de teclado_ ([docs](https://docs.n8n.io/build/keyboard-shortcuts)): «0: reset zoom
  level» y «1: zoom to fit workflow». Se usaron los mismos.
- _Miro en el celular_
  ([ayuda](https://help.miro.com/hc/en-us/articles/360017572834-Mobile-app)): el tablero abre «in
  view-only mode by default», para moverse sin mover nada, y editar es explícito. En el celular el plano
  completo es para mirar y se edita en el plano vertical.

**React Flow y las otras librerías.**

- _La API_ ([`<ReactFlow />`](https://reactflow.dev/api-reference/react-flow)): los valores por defecto
  que se cambian son `panOnScroll` (`false`), `zoomOnScroll` y `zoomOnDoubleClick` (`true`),
  `deleteKeyCode` (`'Backspace'`), `selectionKeyCode` (`'Shift'`), `multiSelectionKeyCode`,
  `nodeDragThreshold` (`1`), `connectionRadius` (`20`), `minZoom` y `maxZoom` (`0.5` y `2`),
  `defaultMarkerColor` (`'#b1b1b7'`; con `null` usa `--xy-edge-stroke`) y `attributionPosition`
  (`'bottom-right'`). Los atajos se apagan con `null` («pass in null to the prop you want to disable»).
  La atribución se deja, en el borde de abajo a la izquierda: la página aclara que cualquiera la puede
  sacar, pero no hace falta.
- _La accesibilidad_ ([guía](https://reactflow.dev/learn/advanced-use/accessibility)): Tab recorre las
  fichas, Enter o espacio elige, Escape suelta; `aria-roledescription` va por `domAttributes`; los textos
  se traducen con `ariaLabelConfig` («ensure screen readers announce messages in the user's language»).
  En la tabla de la guía, el texto de `keyboardDisabled` es el que habla de las flechas y viceversa: están
  invertidos, y se escriben al derecho. El anuncio de mover dice coordenadas («New position, x: {x}, y:
  {y}»), que a Eliseo no le dicen nada: se reemplaza por el lugar en la fila.
- _Los dos errores que se evitan_
  ([errores comunes](https://reactflow.dev/learn/troubleshooting/common-errors), y el código de
  `@xyflow/system` 0.0.83, que es el de 12.12.0). El 008, «Couldn't create edge for source/target handle
  id», sale cuando una flecha apunta a una manija que React Flow no midió: por eso toda ficha de paso tiene
  siempre su manija de la derecha, aunque solo la use el último. El 015, «It seems that you are trying to
  drag a node that is not initialized», sale al arrastrar un nodo sin `measured.width` y
  `measured.height`: por eso la disposición calculada pone `width`, `height` y `measured` en cada ficha.
- _El peso_: según bundlephobia, `@xyflow/react` 12.12.0 pesa 187.883 bytes minificado y 59.980 con
  gzip, sin React. Lo medido en el build está en «Verificación».
- _tldraw_ ([licencia](https://tldraw.dev/community/license)): «The tldraw SDK will not work in
  production without a valid license key», y la licencia gratuita es para proyectos no comerciales y
  exige la marca «made with tldraw» en el lienzo.
- _GoJS_ ([despliegue](https://gojs.net/latest/intro/deployment.html)): no es de código abierto; para
  uso comercial hay que comprar una licencia y pedir la clave, y sin ella el diagrama lleva una marca de
  agua.
- _JointJS_ ([licencia](https://www.jointjs.com/license) y
  [funciones](https://www.jointjs.com/features)): el núcleo es MPL 2.0, pero el deshacer y rehacer
  («Command Manager»), los atajos de teclado, la selección, el minimapa y las disposiciones automáticas
  son de JointJS+, que es comercial.

**Accesibilidad.**

- _WCAG 2.2, arrastre (2.5.7, AA)_
  ([Understanding](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)): todo lo que se
  hace arrastrando se tiene que poder hacer con un solo puntero sin arrastrar, y el teclado no alcanza
  («keyboard equivalence … does not automatically meet this success criterion»). Los ejemplos son los
  nuestros: unir tocando un elemento y después otro, y una lista con controles para subir y bajar. Por eso
  el «+» de cada tramo, los botones del panel y Subir y Bajar en el celular.
- _WCAG 2.2, gestos (2.5.1, A)_
  ([Understanding](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html)): el pellizco
  necesita su alternativa de un puntero, como «plus/minus buttons to zoom in and out». Son Alejar y
  Acercar del rótulo.
- _WCAG 2.2, contenido al pasar (1.4.13, AA)_
  ([Understanding](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)): lo que
  aparece al pasar el mouse se tiene que poder cerrar (con Escape), se tiene que poder pasar el mouse
  encima y tiene que quedarse. Las ayudas lo cumplen: con el mouse abren a los 350 ms, se puede pasar al
  globo sin que se cierre y Escape lo cierra.
- _WCAG 2.2, foco no tapado (2.4.11, AA)_
  ([Understanding](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)): los
  paneles no modales están entre lo que suele tapar el foco. En la tablet vertical el lienzo se corre para
  que la ficha elegida quede entera arriba del panel.
- _Inclusive Components, toggletips_
  ([artículo](https://inclusive-components.design/tooltips-toggletips/)): «toggletips are revealed by
  click rather than by hover and focus», se cierran con Escape o tocando afuera, y adentro no van botones
  ni enlaces («Don't put interactive content … in tooltips or toggletips»).
- _MDN, Popover API_ ([docs](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)): es Baseline
  desde enero de 2025, siempre no modal, y `popovertarget` convierte un botón en su control. Las ayudas la
  usan con `popover="auto"`, en un portal al cuerpo del documento.

**El plano.**

- _ISO 128-2, tipos de línea_
  ([muestra](https://cdn.standards.iteh.ai/samples/83355/10bb39d36fc34caeb80ecd25347ddb0c/ISO-128-2-2022.pdf)):
  la línea continua (01), la de trazos (02) y la de trazo largo y punto (04), y los anchos en la razón
  4:2:1. Son el vocabulario del lienzo: continua para los contornos, fina para las guías, de trazos para
  lo que no recibe y de trazo y punto para la línea que se está uniendo.
- _ISO 129-1, cotas_
  ([muestra](https://cdn.standards.iteh.ai/samples/64007/426c238f9dbe454eb17901d1d32bfc90/ISO-129-1-2018.pdf)):
  la cota es una línea continua fina, el valor va arriba de la línea, con coma decimal, y fuera del
  contorno de la pieza cuando se puede. El nivel del mes es una cota: una barra con dos marcas en los
  extremos y el valor escrito abajo.
- _NN/g, barras y atención_
  ([artículo](https://www.nngroup.com/articles/dashboards-preattentive/)): «2D position and length are
  the two preattentive attributes that can be naturally mapped onto quantity», y el color no tiene que
  decir cantidades. Los topes y lo del mes van en largo (las cotas, las barras de Inicio, las bandas de la
  prueba); la tinta solo nombra el tesoro, y nunca va sola.
- _El método del resto mayor, por qué no_
  ([Wikipedia](https://en.wikipedia.org/wiki/Largest_remainders_method)): repartir los centavos que
  sobran a los restos más grandes hace que la parte de uno dependa de las demás, con paradojas conocidas
  (la de Alabama, la de un estado nuevo que le saca una banca a otro que no cambió). Acá cada parte se
  redondea hacia abajo por su cuenta y el centavo queda en Maun: agregar un tesoro al reparto no le cambia
  el centavo a los demás.

## Decisión

### 1. Las reglas de la fila

- **Cada cobro baja por la fila.** Entra la ganancia del trabajo (lo cobrado menos los gastos, como
  siempre: nunca el presupuesto). Sale primero el diezmo, 10% fijo. Después cada paso recibe hasta lo que
  le falta de su tope del mes, en el orden que puso Eliseo. Lo que sobra se reparte por porcentaje entre
  los tesoros del reparto, cada parte redondeada hacia abajo al centavo. El resto, con los centavos de
  ese redondeo, queda en Maun.
- **Tres clases de paso.** _Sueldo_: siempre Hogar, y Hogar solo puede ser sueldo. _Gastos fijos_: con
  renglones (el alquiler, la luz, el ayudante), y el tope es la suma de los renglones. _Prioridad_: un
  monto fijo por mes que se llena antes de repartir, como los materiales. Maun, si está en la fila, solo
  puede ser un paso de gastos fijos, que es lo que pasa en la fila de siempre.
- **Un tesoro va una sola vez**, como paso o como parte del reparto. El diezmo no está en la fila: es el
  primer paso y no se mueve. Maun y Hogar no van en el reparto.
- **El tope es del mes calendario de la fecha del cobro.** Cuenta lo que el tesoro ya recibió en el mes
  por la fila, en cualquier lugar de la fila, y lo que se le pasó para cubrirlo.
- **Los porcentajes suman hasta 100%.** Cada parte se redondea hacia abajo al centavo; el resto y los
  centavos van a Maun. No se usa el método del resto mayor (ver «Lo investigado»): con él, el monto de
  una parte dependería de las demás, y el centavo que sobra ya tiene dueño.
- **Cubrir el faltante.** Si a un paso de gastos fijos le falta plata en el mes, Eliseo elige de qué
  tesoros sale, uno o varios y cuánto de cada uno. Cada elección es una transferencia marcada con el mes
  que cubre (`cubre_el_mes`), y esa plata cuenta para el tope: el próximo cobro no la vuelve a llenar.
  No se cubre con el diezmo, y la base lo exige con un `check`.
- **Los cambios valen desde el próximo cobro.** Guardar la fila no toca ninguna liquidación hecha
  ([ADR 0003](0003-distribucion-congelada.md)), y un cobro reabierto se vuelve a cobrar con la fila con la
  que se había cobrado. Cada paso guarda desde qué mes rige su tope (`desde`), para ver cuándo se
  actualizó por la inflación.
- **Perdido.** Como hoy: el diezmo según `perdido_con_diezmo` y el sueldo en cero salvo
  `perdido_con_sueldo`. Los demás pasos, iguales.
- **El sueldo por trabajo** (el modo del seed, [ADR 0072](0072-el-sueldo-se-topea-por-mes.md)) existe
  solo en la fila de siempre. Una fila guardada cuenta el sueldo por mes: al empezar a editar, el
  borrador lo pasa a mensual, y la hoja de guardar lo dice.
- **El estante.** Los tesoros que no están en la fila no reciben de los cobros. Siguen teniendo su saldo
  y se mueven con movimientos.
- **Archivar.** Un tesoro con saldo pasa primero su plata a otro (Maun, sugerido). Deja de recibir y
  sigue apareciendo con su nombre en los repartos que ya hizo. Hogar, Maun, Diezmo y Cocos no se
  archivan. Uno que está en la fila guardada, o en la foto de un cobro reabierto, tampoco: primero sale
  de la fila, o se cobra ese trabajo.

La cuenta vive en dos lugares que no pueden divergir ([ADR 0011](0011-dominio-cascada-estados-y-cobro.md)):
`packages/domain/src/fila.ts` y sus cinco gemelas de SQL, `private.entero_de_json`,
`private.repartir_por_la_fila`, `private.fila_de_siempre`, `private.problema_de_la_fila` y
`private.plan_del_reparto`. Rechazan con 22004, 22023 y 22003 donde el dominio tira `RangeError`. El
comparador (`compararFila`) las ata con casos con semilla y con los vectores de redondeo: 5 centavos al
70/30 dan 3 y 1 con 1 de resto; 100 al 33,33/33,33/33,34 dan 33, 33 y 33 con 1; 101 al 50/50 dan 50 y
50 con 1.

### 2. La fila de siempre, y por qué no hay tabla de acumulados

Un taller que nunca guardó su fila reparte con la de siempre: `filaDeSiempre` la arma con el sueldo y los
costos fijos de Ajustes (el sueldo a Hogar, los costos fijos a un paso de Maun con un renglón «Costos
fijos») y da lo mismo que la cascada de antes. `fila.test.ts` lo prueba con 4.000 casos contra
`calcularDistribucion` y `topesDeLaLiquidacion`. Así el día de la migración no cambia nada para Eliseo:
la app nueva cobra «por la fila» desde el primer cobro, con la fila de siempre, y el reparto es el mismo.

El mes en que una fila guardada saca los gastos fijos de Maun a otro tesoro, ese paso arranca de cero: lo
que la fila de siempre apartó en Maun ese mes cuenta para Maun, no para el tesoro nuevo. Es lo que pasa
con la plata: estaba en Maun. Si ese mes ya estaban cubiertos, la hoja de cubrir los pasa desde Maun con
el mes marcado, y el próximo cobro no los vuelve a llenar.

Lo que el mes ya lleva no se guarda en ningún lado. Lo suma la base al liquidar, con el candado de
`ajustes` puesto, desde tres lugares: el sueldo y los fijos de las liquidaciones de antes (`dist_sueldo`
para Hogar, `dist_fijos` para Maun), las filas vivas de `repartos` de los cobros por la fila del mes, y
las transferencias con `cubre_el_mes`. Es lo que ya hacía `liquidar` con el sueldo y los fijos
([ADR 0011](0011-dominio-cascada-estados-y-cobro.md)): una tabla de acumulados sería un segundo lugar
donde el mes puede quedar mal, y reabrir un cobro tendría que acordarse de restarlo. Sumando, reabrir lo
saca del mes por el solo hecho de borrar sus repartos.

### 3. Los datos

Ningún dato que exista se borra ni se cambia. Lo nuevo convive con las columnas de siempre, las
liquidaciones viejas quedan como están, y una app que todavía no se actualizó sigue cobrando igual
mientras el taller no guarde su fila. Las migraciones llegan a la base antes del merge, así que todo
tiene que convivir con el bundle de producción de hoy. Son siete, una por tema:

1. **`20260927120000_los_tesoros`.** `public.tesoros`, replicada: `id` (UUIDv7 de la app; en los cuatro
   del sistema, `private.uuidv7()`), `household_id`, `clave` (`public.tesoro` o null; sin grant), `nombre`
   (1 a 24 sin los blancos de los bordes), `descripcion` (hasta 80), `tinta` (una de las ocho), `icono`
   (`^[a-z0-9-]{1,40}$`; la app cae a `vault`), `meta_centavos` y `rinde_anual_bp` (solo en los del dueño:
   un `check` los deja en null en los cuatro del sistema, porque la meta y el rinde de Cocos siguen en
   `ajustes`), `orden`, `archivado_at` (un `check` no deja archivar los de clave) y la metadata. Únicos
   `(household_id, id)`, para las foreign keys compuestas, y `(household_id, clave) where clave is not
null`. Empieza con `revoke all … from anon, authenticated`, como la vidriera; `select`, y `insert` y
   `update` de las columnas del dueño; sin `delete`. `private.sembrar_los_tesoros(household)` escribe las
   cuatro filas del sistema si no están (los nombres, las tintas y los íconos de `shared/lib/tesoros.ts`);
   la usan la migración (para todos los talleres, borrados incluidos, porque los movimientos de todos
   van a apuntar a ellas), `private.crear_household` en el alta y `seed.sql`. `bootstrap()` y `delta()`
   suman la clave.
2. **`…120100_los_movimientos_por_tesoro`.** `movimientos.desde_id`, `hacia_id` (foreign keys
   compuestas a `tesoros`, con su índice) y `cubre_el_mes` (primer día del mes, solo en transferencias,
   nunca desde el diezmo), con sus grants de `insert` y `update`. `private.completar_los_tesoros()`, un
   trigger `before insert or update` que corre antes que `metadatos`, completa el id desde la clave y la
   clave desde el id: una app vieja manda el enum y una nueva los ids. En una edición sigue al lado que
   cambió, porque una app vieja edita mandando solo la clave; si cambian los dos y no dicen lo mismo,
   rechaza con 23514. Con `cubre_el_mes` toma `ajustes` `for no key update` antes de escribir, para que
   una liquidación del mismo taller vea la cobertura entera o no la vea. Después, el rito de los checks
   (abajo).
3. **`…120200_la_fila`.** `ajustes.fila` (jsonb, null es la fila de siempre), `fila_version` (entero, 0) y
   `fila_guardada_at`, sin grant de `update`. `private.contar_la_revision_de_la_fila()`, un trigger en
   `ajustes` que suma una revisión cuando cambia algo que cambia el reparto: sin fila guardada, el sueldo,
   los costos fijos o `sueldo_tope_mensual`; con o sin fila, `perdido_con_sueldo` o `perdido_con_diezmo`.
   Así un cobro armado con los ajustes de antes rebota con MN006, como hoy, y no con MN008. Las cinco
   gemelas, tal como vinieron. Y `public.guardar_la_fila(p_version, p_fila)`, invoker, sobre
   `private.guardar_la_fila`, definer: bloquea `ajustes` `for no key update`, reconoce el reenvío idéntico
   (la misma fila con la revisión siguiente), compara la revisión (MN006, «La fila cambió desde que la
   abriste.»), valida con `private.problema_de_la_fila` contra los tesoros del taller (MN023, «La fila no
   se pudo guardar.», con el código del problema en el `detail`, que la app no lee), guarda, suma una
   revisión y anota la fecha. Con `p_fila` null vuelve a la fila de siempre: la pantalla no lo ofrece; lo
   usan los e2e para dejar sin fila el taller de prueba.
4. **`…120300_los_repartos`.** `public.repartos`, replicada y de solo lectura para la app: una fila por
   paso y por parte de cada liquidación por la fila, con el `id` que manda la app (así la fila optimista
   y la de la base son la misma), `proyecto_id` y `tesoro_id` (compuestas), `posicion` desde 1 (pasos
   primero), `nombre` (el del tesoro al cobrar), `tipo` (`paso` o `parte`), `clase`, `objetivo`, `previo`
   y `tope` del paso, `por_mes`, `porcentaje_bp` de la parte, `monto_centavos`, `fecha` y
   `ya_en_la_apertura`. Un `check` por forma (un paso no recibe más que su tope; una parte lleva solo su
   porcentaje), único `(proyecto_id, posicion) where deleted_at is null`, un índice por cada foreign key y
   uno `(household_id, fecha) where deleted_at is null` para lo del mes. `proyectos` suma
   `dist_fila_version`, `dist_fila` (la fila con la que se liquidó: la guardada o la de siempre armada en
   ese momento), `dist_previo` (lo que cada tesoro de un paso llevaba del mes según la base,
   `{tesoro_id: centavos}`) y `reapertura_fila` (`{version, fila}` del cobro por la fila que se reabrió),
   con dos `check` que miran solo las columnas nuevas. `bootstrap()` y `delta()` suman la clave.
5. **`…120400_el_libro_por_tesoro`.** `libro_mayor`, recreada con `with (security_invoker = true)` porque
   el `or replace` borra las opciones, suma al final `tesoro_id` y `contrapartida_id`; `tesoro` y
   `contrapartida` siguen con la clave. Los dos bloques de movimientos filtran por `hacia_id` y `desde_id`
   (si no, lo que va entre tesoros del dueño no llega al libro y el saldo que mira MN024 sale mal), y un
   bloque nuevo, de origen `reparto`, pone cada reparto vivo de un proyecto vivo liquidado: `+monto` al
   tesoro y `−monto` a Maun, con la categoría «Distribución», la fecha y la marca de la apertura del
   reparto, salvo cuando el tesoro es Maun (no se mueve a sí mismo) o el monto es cero.
6. **`…120500_el_cobro_por_la_fila`.** Ver la sección 4.
7. **`…120600_el_archivo_de_los_tesoros`.** `private.cuidar_el_archivo_del_tesoro()`, `before update of
archivado_at`: toma `ajustes` `for no key update` y no deja archivar un tesoro que está en
   `ajustes.fila`, en la `reapertura_fila` de un proyecto vivo o que tiene saldo distinto de cero en
   `libro_mayor` (MN024, «Ese tesoro todavía está en la fila, en un cobro reabierto o tiene plata.»).

**Los checks de movimientos.** `movimientos_lados_distintos` y `movimientos_forma_segun_tipo` pasan a
mirar los ids, así una transferencia entre dos tesoros del dueño (sin clave) es válida. El rito, que
queda escrito en `packages/db/CLAUDE.md`: los nuevos se agregan `not valid` y con nombre propio (`…_por_id`)
mientras conviven con los viejos, se rellenan los ids, se validan, se sacan los viejos y se renombran los
nuevos a los nombres de siempre. `pago_diezmo` y `aporte_cocos` siguen mirando además la clave: un check
no puede leer `tesoros`, y el trigger garantiza que el id y la clave dicen lo mismo. El relleno va en una
sola sentencia para los dos lados: los checks nuevos ya miran cada fila que se escribe, y una
transferencia con un solo id no los pasa.

**Lo que se autorizó aunque la regla de `packages/db/CLAUDE.md` lo cuente como destructivo**, porque no
borra ni cambia un dato que exista: (1) rellenar `desde_id` y `hacia_id` desde el enum, solo donde están
en null (sube la versión de cada movimiento y el próximo delta se los lleva a la app); (2) cambiar los dos
checks por los que miran los ids, con el rito de arriba; (3) insertar las cuatro filas de `tesoros` de
cada taller; (4) `create or replace view libro_mayor` con columnas al final; (5) drop y create de
`liquidar`, `cobrar_proyecto` y `cerrar_perdido`. Antes de empujar se contaron los talleres, los
movimientos y los proyectos liquidados, y después se comprobó que cada taller tiene sus cuatro tesoros,
que ningún movimiento quedó sin ids y que los saldos de `libro_mayor` por clave son los mismos de antes
(«Verificación»).

**Los códigos nuevos** (tabla del [ADR 0010](0010-sincronizacion-replica-completa.md)):

| Código  | Cuándo                                                                                                | Mensaje del `raise`                                                      |
| ------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `MN023` | `guardar_la_fila` con una fila que no se puede guardar; el código del problema va en el `detail`.     | La fila no se pudo guardar.                                              |
| `MN024` | Archivar un tesoro que está en la fila guardada, en la foto de un cobro reabierto, o que tiene saldo. | Ese tesoro todavía está en la fila, en un cobro reabierto o tiene plata. |
| `MN025` | Liquidar sin `p_fila_version` con una fila guardada, o volver a cobrar un reabierto por la fila.      | Actualizá la app para cobrar con tu fila.                                |

Una app sin actualizar muestra el mensaje del `raise` tal cual, así que ninguno dice «versión».
`rechazoDeLaBase` no lee el `detail`: MN023 va con un texto general, porque la pantalla ya frena antes con
`problemasDeLaFila`, que es la misma cuenta.

### 4. Liquidar por la fila

`private.liquidar`, `public.cobrar_proyecto` y `public.cerrar_perdido` suman tres parámetros al final,
todos `default null`: `p_fila_version`, `p_repartos` (`[{id, posicion, tesoro_id, monto_centavos}]`) y
`p_previo` (`{tesoro_id: centavos}`, lo que la app vio del mes para cada paso). Cambiar la firma es drop
y create, con sus revokes y grants; con default, un bundle viejo sigue llamando con los de antes.
`private.revertir_liquidacion` no cambia de firma: `or replace`.

**El orden de las cerraduras no cambia**: el proyecto `for update` y después `ajustes` `for no key
update`, como toda liquidación, reversión, guardado de la fila y cobertura de un mes.

**Antes de elegir el camino se reconoce el reenvío**, porque un pedido que ya se aplicó no puede rebotar:
el estricto de siempre y el de la liquidación de antes que volvió ajustada (los dos solo contra una
liquidación de antes), y el de un cobro por la fila, ajustado o no (la misma revisión, las mismas
entradas y los mismos ids de repartos en el mismo lugar; los montos tienen que ser los mismos salvo que
lo del mes congelado no sea lo que mandó la app). Así un cobro de antes que se reenvía después de guardar
la fila no sale MN025.

Después, tres caminos:

- **El de antes**: sin `p_fila_version` y sin fila guardada, salvo al cobrar un reabierto con
  `reapertura_fila`. Es lo que manda una app sin actualizar, y hace lo de hoy con un solo cambio: lo del
  mes suma también los repartos vivos del mes de los cobros por la fila (los de los pasos de sueldo para
  el sueldo; los de los pasos de gastos fijos de Maun para los fijos). Sin eso, una app vieja que cobra
  después de una nueva en el mismo mes paga el sueldo dos veces. Un reabierto sin `reapertura_fila` sigue
  con sus `reapertura_objetivo_*`, como hoy.
- **MN025**: sin `p_fila_version`, y con la fila guardada (al cobrar o al cerrar como perdido) o al
  cobrar un reabierto con `reapertura_fila`. Una app nueva siempre manda la revisión y nunca lo recibe
  por esto.
- **Por la fila**, en todos los demás casos. La fila y la revisión esperada: al cobrar un reabierto, las
  de su `reapertura_fila`, o, si se había cobrado por el camino de antes, la fila de siempre armada con
  sus `reapertura_objetivo_*` y `reapertura_sueldo_mensual`, en la revisión 0; en los demás casos, y
  siempre en un perdido (que nunca usa la foto de una reapertura), `ajustes.fila` (o la de siempre con los
  ajustes de hoy) y `ajustes.fila_version`. `p_fila_version` tiene que ser esa: si no, MN006, «La fila
  cambió desde que la abriste.». El plan sale de `private.plan_del_reparto`, lo del mes lo suma la base
  (sección 2) y el reparto sale de `private.repartir_por_la_fila`. Igual que con
  `p_sueldo_previo_centavos` ([ADR 0016](0016-el-cobro-y-el-rechazo-que-encuentra-al-usuario.md)): si lo
  que vio la app no es lo que suma la base, se ajusta sin rechazar, pero la cuenta de la app con lo que
  vio tiene que dar lo que mandó (MN008); sin ajuste, `p_repartos` tiene que coincidir con la cuenta de la
  base (MN008). Los parámetros de siempre viajan con lo que da `columnasDeSiempre` (topes, sueldo, fijos y
  previos en cero, el diezmo, y el remanente con lo que pasa por Maun antes del reparto, neta − diezmo),
  así los cuatro checks de `proyectos` siguen valiendo sin tocarlos y el reenvío estricto se sigue
  reconociendo por las mismas columnas. Escribe el proyecto con esas columnas, `dist_fila_version`,
  `dist_fila` y `dist_previo` (lo de la base), y una fila de `repartos` por paso y por parte con los ids de
  la app y los montos de la base.

Por cualquiera de los dos caminos, liquidar deja `reapertura_fila` en null, como hoy los `reapertura_*`.
**Revertir** borra lógicamente los repartos del proyecto y, desde un cobrado por la fila, guarda
`reapertura_fila` con `dist_fila_version` y `dist_fila` (además de la foto de siempre, que es la que usa
la app para proponer la fecha). Desde un cobrado por el camino de antes hace lo de hoy y la deja en null;
desde un perdido también.

La app elige la misma fila con las mismas reglas (`filaParaLiquidar` de `@maun/db`), calcula con
`calcularPorLaFila`, arma los ids con `uuidv7()` y manda `p_fila_version`, `p_repartos` y `p_previo`,
más los parámetros de siempre con `columnasDeSiempre`. La liquidación optimista escribe también sus
filas de `repartos`, así lo del mes que suma la app ya las cuenta, y reabrir las saca. El ajuste se
detecta comparando `dist_previo` con lo que se mandó, y `anotarElAjuste` avisa como hoy, tesoro por
tesoro.

### 5. La réplica y la cola

- `TABLAS_REPLICADAS` suma `tesoros` y `repartos`. Una réplica guardada sin esas claves se reconcilia
  sola (`necesitaReconcile` pide `bootstrap()`): no se subió `VERSION_CACHE`, que tiraría la cola.
  Mientras llega, `tesorosDelTaller` muestra los cuatro de siempre del catálogo, con la clave como id, y
  el cobro se frena con un mensaje hasta que estén: sin ids de verdad, el pedido no puede viajar.
- Lo que sale de la réplica y usan varias entidades va en `packages/db/src/vistas.ts`, junto a
  `liquidacionesDeLaReplica`, porque una entidad no importa a otra: `tesorosDeLaReplica` (los cuatro de
  siempre primero y los del dueño por `orden`; la meta y el rinde de Cocos salen de `ajustes`),
  `idDeLaClave`, `filaDelTaller` (`ajustes.fila ?? filaDeSiempre`, con su revisión y su fecha),
  `filaParaLiquidar` (las reglas de la sección 4, reabiertos incluidos), `liquidacionesDelMesDeLaReplica`
  (las `LiquidacionDelMes` de antes y por la fila: en un cobro por la fila el `remanente` es neta −
  diezmo − la suma de sus repartos, no `dist_remanente`, que es lo que pasa por Maun antes del reparto),
  `coberturasDeLaReplica`, `repartosDelProyecto`, `porLaFila` y `saldosPorIdDeLaReplica`. Las filas de la
  réplica se leen tolerando que les falten las columnas nuevas.
- Mutaciones nuevas, con su clave, su registro en `mutaciones-persistibles.ts`, `scope: COLA_DE_SALIDA` y
  `guardarCacheAhora` en `onMutate`: `['tesoros','crear']`, `['tesoros','editar']`,
  `['tesoros','archivar']` (en `entities/tesoro`) y `['ajustes','guardar-la-fila']` (en
  `features/armar-la-fila`). Los dos slices entran en `MODULOS_CON_MUTACIONES`. Cubrir el faltante y pasar
  el saldo al archivar usan la mutación de movimientos, que suma `desde_id`, `hacia_id` y
  `cubre_el_mes`. La meta y el rinde de Cocos usan la de ajustes.
- La fila optimista de `ajustes` sube `fila_version` con la misma regla que el trigger, y el `onError` la
  devuelve, como ya hace la de `proyectos` con su versión: un cobro que queda en la cola detrás de una
  edición de Ajustes sin señal manda la revisión que la base va a tener cuando drene.
- `rechazos.ts` suma las operaciones `fila` y `tesoro` y traduce MN023, MN024 (con el nombre del
  tesoro), MN025 y el MN006 de la fila; el MN006 del cobro suma «o cambió la fila».

### 6. El dominio

- `fila.ts` es la fuente: tipos, validación (`problemasDeLaFila`, con sus 24 códigos), el plan, el
  reparto, lo del mes (`previoDelMes`, `filaDelMes`), `columnasDeSiempre`, las funciones de edición y
  `cambiosDeLaFila`. Vino hecha y va tal cual.
- `libroMayor.ts` lleva la cuenta por id de tesoro: `DatosDelLibro` suma los tesoros y los repartos, y
  cada línea y cada asiento llevan el id además de la clave (null para los tesoros del dueño). El lado
  que falta se completa desde el otro, como en la base: un movimiento de una réplica vieja trae solo la
  clave. `saldosPorTesoro` sigue devolviendo las cuatro claves, porque lo usa la migración del sistema
  viejo (`scripts/migracion/escritura.ts`), que se queda con las claves; `saldosPorId` y
  `saldosDelLibroPorId` devuelven el mapa por id, y `entradasYSalidasPorId` las cifras del mes de
  cualquier tesoro. `Tesoro` sigue siendo el tipo de las cuatro claves. `estadoDelDiezmo` y
  `proyeccionCocos` no cambian.
- `comparacion.ts` suma `compararFila` (las cinco gemelas contra el dominio, con casos con semilla y los
  vectores de redondeo), escenarios por la fila en `ESCENARIOS_DE_LIQUIDACION` y `compararLibroMayor` por
  `tesoro_id`. `compararSeed` y `compararLibroDelSeed` siguen dando igual: el seed reparte con la fila de
  siempre y el sueldo por proyecto.

### 7. La pantalla Tesoros (`/tesoros`)

**La navegación.** Tesoros es un destino propio después de Finanzas en la barra lateral y en el riel (ícono `gem`). En el celular la barra sigue con sus cuatro destinos y el «+»: Tesoros entra por la hoja del perfil (arriba de Diezmo, con «Cómo se reparte cada cobro»), por «Ver la fila» de Inicio y por el faltante, y resalta Inicio, como Diezmo y Opiniones. En el catálogo de navegación cuelga de Inicio (`profundidad: 1`, forma `pantalla`), y está en `LEEN_DE_LA_REPLICA`: tirar para actualizar anda en el plano vertical.

**En la compu** va una barra de 72 px («Cómo se reparte lo que deja cada trabajo», el `h1` y «Nuevo tesoro» y «Editar la fila»), y abajo el lienzo con todo el alto que queda y el panel de detalle de 380 px a la derecha. La página no scrollea: scrollean el panel y el lienzo. **Es la única pantalla del marco sin `Pagina` en la tablet y la compu**, porque el plano usa todo el ancho que deja el menú (`esUnPlanoATodoElAncho`, que le saca al `<main>` el `scrollbar-gutter`); en el celular va en `Pagina`, como todas. Al pie del lienzo va **el rótulo del plano**, `PLANO La fila de los tesoros · REV. n · RIGE dd/mm/aa · ESC. 1:1,2`, con Alejar, Acercar y Ver toda la fila: la revisión es `fila_version`, «Rige» la fecha del último guardado, y sin fila guardada dice `RIGE de Ajustes`.

**El lienzo es un plano de taller sobre papel milimetrado** (una línea cada 16 px y otra cada 80), con las fichas en papel opaco: ningún texto queda sobre la grilla y los montos van siempre horizontales.

- **La disposición la calcula la app** (`pages/tesoros/model/disposicion.ts`); no hay posiciones guardadas. Una columna de 272 con «Cada cobro», el diezmo y los pasos; el reparto a la derecha del último paso; las partes colgando en abanico, con Maun al final como «El resto»; el estante arriba a la derecha, o en una tercera columna si no entra.
- **Las fichas** llevan el canto de 5 px en su tinta, el chip del ícono, el nombre en su tinta, la cifra de la regla, la clase y la unidad en mayúsculas chicas. **Los pasos llevan su globo** afuera, como la lista de piezas de un plano. Los gastos fijos listan sus renglones con líneas de puntos hasta el monto (tres y «y N más» si son más de cuatro). **El nivel del mes es una cota**: una barra con dos marcas en los extremos, «lleva» y «faltan» o «✓ Completo». El reparto muestra su **escala gráfica** partida en los porcentajes, con el resto de Maun rayado.
- **Las flechas** son ortogonales, en `text-3` y 1,5 px, con una punta dibujada a mano; las del abanico llevan su porcentaje. Ninguna se elige: son la consecuencia del orden.
- **Elegir** marca la ficha con el contorno en tinta y **cuatro marcas de corte** afuera de las esquinas, como en un pliego de imprenta, y abre su detalle.
- **La prueba**: con un monto en «Probá un cobro», cada flecha pasa a tinta con una banda de ancho proporcional a lo que baja y una etiqueta con el monto; cada ficha dice cuánto recibe y si completa su tope, y lo que recibe $ 0 pasa a trazos. La cuenta es `calcularPorLaFila`, la misma que liquida.
- **Editar** cambia la barra por una en tinta («Editando la fila», los cambios sin guardar, Deshacer, Rehacer, Descartar y «Guardar la fila»). Todo es un borrador en memoria con su pila de deshacer, que sobrevive a salir de la pantalla mientras la app está abierta; con cambios, la pantalla se anota con `useAlgoEnCurso(true)`. **Cada ficha que cambió lleva el triángulo de revisión** con el número que va a ser, y la unidad dice «ANTES» con el valor tachado. **Unir con flechas**: la manija de salida de la ficha elegida se arrastra hasta un tesoro del estante (entra como paso), hasta el reparto (entra con lo libre, hasta 10%), hasta otro paso (lo mueve) o hasta «Nuevo tesoro» (abre la hoja), con **la línea fantasma** de trazo y punto y una etiqueta que dice qué va a pasar al soltar. **Mover** arrastrando en vertical corre los otros pasos en vivo. **El «+» de cada tramo** abre un menú oscuro con los tesoros del estante y «Un tesoro nuevo».
- **Sin arrastre también se puede todo** (WCAG 2.5.7): Subir y Bajar en el panel, los botones del panel para sumar un tesoro del estante, el menú del «+».
- **El teclado**: Tab recorre las fichas, Enter o espacio elige, Escape suelta (y el foco sigue en la ficha), Alt+↑/↓ mueve el paso, Supr lo saca, Ctrl/⌘+Z y con Shift deshacen y rehacen, `1` encuadra y `0` vuelve a 1:1. Cada ficha lleva su `ariaLabel` («Paso 2 de 3: Gastos fijos, gastos fijos, hasta $ 900.000 por mes; lleva $ 630.000») y su `aria-roledescription`.
- **El encuadre lo calcula la app** (`model/encuadre.ts`) y no el `fitView` de React Flow: al montar, con «Ver toda la fila» y con `1`, y cuando algo queda afuera porque cambió la forma de la fila, salvo durante un arrastre o una conexión.

**El panel de detalle.** Sin nada elegido: «La fila» con su (i); «Probá un cobro» con tres atajos y el segmentado «Con lo de septiembre» / «Mes en cero», y con un monto, la tabla de cómo baja el cobro con su suma; el mes (ganancia, diezmo apartado, lo que falta para los topes, lo que quedó en Maun); y la lista de todos los tesoros en el orden de la fila, que es también la vista accesible del plano. Con un paso elegido: qué es (gastos fijos o prioridad; Hogar y Maun no eligen), los renglones o el tope por mes con «Rige desde», cómo va el mes (con «Cubrir desde otro tesoro» en gastos fijos con faltante), el lugar en la fila con Subir y Bajar, y «Sacar de la fila». El reparto elegido muestra cada parte con su porcentaje; un tesoro del estante, lo que tiene y cómo sumarlo; el diezmo, la regla con el candado. Los problemas de `problemasDeLaFila` salen en su sección, con los textos del LEEME, y bloquean guardar.

**Guardar** es una hoja: «Pasa a ser la revisión n», un renglón por cada `CambioDeLaFila` con su ícono y el nombre en su tinta, la tabla Tesoro / Hoy / Con los cambios para el cobro de la prueba (o $ 2.000.000), solo con los que cambian, y la nota de que vale desde el próximo cobro. Si un paso queda con tope $ 0, una línea lo avisa sin bloquear.

**En la tablet** el lienzo va a todo el ancho y «Probá un cobro» flota abajo a la izquierda. En vertical el detalle es **un panel no modal** abajo, al 52% del alto más la holgura, como una hoja sin velo: una región con el nombre del tesoro, con su X y «Listo»; Escape lo cierra y el foco vuelve a la ficha; el lienzo sigue tocable y se corre para que la ficha elegida quede entera arriba del panel (WCAG 2.4.11). `Hoja` no sirve: siempre abre modal. Desde 1024 de ancho, el panel va a la derecha, de 340.

**En el celular no se carga React Flow.** El mismo plano es un documento vertical (`PlanoVertical`) en `Pagina`, con el scroll del `<main>`: la fila en una placa con la cuadrícula, las fichas a todo el ancho unidas por flechas cortas que en la prueba llevan el monto, las partes colgando como un árbol, y el estante. Editando, la barra en tinta queda fija arriba, cada paso tiene «Subir · Bajar · Editar» y cada flecha «Sumar un paso»; «Editar» abre la hoja del paso con las secciones del panel. **El plano completo** carga React Flow recién ahí, a pantalla completa y solo para mirar (pellizco, arrastre, Alejar, Acercar y Ver toda), en un `<dialog>` modal que tapa la barra y se anota con `useAlgoEnCurso(true)`.

**La primera vez** (mientras `ajustes.fila` sea null y no se tocó «Entendido», que es estado del dispositivo): una tarjeta con la lámina `la-fila`, «Cada cobro baja por la fila», el texto de la fila de siempre y «Editar la fila» y «Entendido». Es la única lámina de la pantalla.

**Las hojas**: Nuevo tesoro (la vista previa, el nombre, para qué es, las ocho tintas con «También la usa…», los 16 íconos, la meta y «Dónde va»: al estante, como paso con tope o en el reparto con su porcentaje; crear y guardar la fila son dos operaciones en la cola, en ese orden), Editar tesoro (lo mismo sin «Dónde va», con Archivar y, para Cocos, el rinde por año, que se guarda en `ajustes`), Archivar (con saldo pide a dónde pasar la plata; sin saldo no pregunta) y Cubrir (Maun elegido con todo el faltante, lo que tiene cada tesoro, las notas de Hogar y de Cocos, sin pasarse del faltante ni del saldo de cada uno).

**Las ayudas (i)** son `Ayuda` de `@/shared/ui`: un botón de 20 px con área de 44 que controla un `popover="auto"` en un portal al `body`, ubicado abajo o arriba según entre. Con el mouse abren a los 350 ms y cierran a los 200 de salir, se puede pasar el mouse al globo y Escape las cierra sin cerrar lo de atrás (WCAG 1.4.13); con el dedo o el teclado, un toque o Enter. Adentro no hay nada que se toque. Los textos son los de la tabla del LEEME, en los nueve lugares.

### 8. React Flow

- **La versión**: `@xyflow/react` 12.12.0, MIT, en el catálogo de `pnpm-workspace.yaml`. Es la única dependencia nueva del PR.
- **El chunk**: todo lo que importa valores de `@xyflow/react` (el lienzo, los nodos con sus `Handle`, las flechas y los controles del zoom) vive detrás de un solo `import()` con `lazy`, `LienzoPerezoso`, como `DibujoDelQr`; lo demás hace `import type`. Por eso las fichas se parten en dos: el cuerpo, sin React Flow, que usa también el plano vertical, y el nodo del lienzo, que lo envuelve con sus manijas. Mientras llega el chunk se ve la cuadrícula quieta con el rótulo, sin spinner. `SOLO_EN_SU_PANTALLA` de `vite.config.ts` saca del `vendor` a `@xyflow`, `d3-*`, `zustand`, `classcat` y `use-sync-external-store`. Es la única excepción a «sin `lazy`» de las pantallas del taller, y la página igual se importa directo. El chunk entra en el precache como todo el JS.
- **Las props** que cambian de su valor por defecto: `panOnScroll` (la rueda desplaza; Ctrl+rueda y el pellizco acercan), `zoomOnScroll={false}`, `zoomOnDoubleClick={false}`, `deleteKeyCode`, `selectionKeyCode` y `multiSelectionKeyCode` en `null`, `defaultMarkerColor={null}`, `nodeDragThreshold={8}`, `minZoom={0.3}`, `maxZoom={1.75}`, `connectionRadius={36}` y `attributionPosition="bottom-left"`. Los textos van en castellano con `ariaLabelConfig`, con las dos claves que la librería trae invertidas escritas al derecho y el anuncio de mover diciendo el lugar en la fila en vez de coordenadas.
- **Los dos errores que se evitan**: el 015 (arrastrar un nodo sin medir) con `width`, `height` y `measured` en cada ficha, y el 008 (una flecha a una manija que no se midió) con la manija de la derecha siempre presente en toda ficha de paso. La manija de salida solo empieza una conexión con la ficha elegida (`isConnectableStart`), su área de toque es un `::before` de 44 px compensado con el zoom, y tocar el fondo cancela una conexión empezada.

### 9. Inicio y el resto de la app

- **La portada** corta el tablero por tesoro con su tinta. El corte del mes sale de las liquidaciones del mes: las de antes (el sueldo a Hogar, el diezmo, lo demás a Maun) y las de la fila (cada reparto a su tesoro y lo que queda a Maun), más los gastos. En un cobro por la fila lo que queda en Maun es neta − diezmo − la suma de sus repartos, no `dist_remanente`. La frase nombra al hogar, al taller y al diezmo como antes, y a los demás por su nombre: «2 trabajos cerrados en septiembre: 67% al hogar, 23% a Gastos fijos y 10% al diezmo.»
- **Las tarjetas** son una por tesoro vivo, con el mismo diseño: Hogar, Maun, Diezmo, Cocos y los del dueño por `orden`. Con los cuatro de siempre, `Tablero enUnaFila` como antes; con más, `Tablero` con `tarjetaMinima="13.25rem"` y `completar` (4 columnas en la compu, 3 en la tablet), y dos en el celular. Los montos de una fila quedan a la misma altura (`subgrid`). La del diezmo sigue con la frase de la deuda; las que tienen meta dicen el porcentaje; las demás, su descripción en un renglón.
- **El faltante**: si a un paso de gastos fijos del mes le falta, arriba va «Faltan $ 270.000 para gastos fijos de septiembre.», con cuántos días quedan del mes y «Elegir de qué tesoro sacar», que abre la hoja de cubrir. Reemplaza al mensaje del mes. Con más de un paso incompleto, un aviso por paso.
- **«La fila de septiembre»** reemplaza a «Progreso» (la barra del sueldo del mes y la de Cocos): la ganancia del mes, el diezmo apartado y una barra por paso en el orden de la fila, con su globo, lo que lleva de su tope y su estado, una raya fina en el día del mes, y «Lo que sobra». **«Metas»** tiene una barra por tesoro con meta y «Diezmo pagado»; la meta de Cocos sale de `ajustes`. «Cocos en un año» sigue igual.
- **Finanzas**: el filtro `?tesoro=` acepta cualquier tesoro (los cuatro de siempre por su clave, los del dueño por su id), y el formulario suma la novena clase, «Entre tesoros».
- **Ajustes**: sin fila guardada, el sueldo y los costos fijos siguen ahí (arman la fila de siempre) con «Ver la fila en Tesoros»; con fila, la sección dice que se arman en Tesoros. La meta y la tasa de Cocos se editan en la hoja de Cocos. `faltaConfigurar` es falso con fila.
- **Cobrar**: el despiece es el de la fila, una línea por paso y por parte con su tesoro, más el diezmo y lo que queda en Maun; reabrir dice qué vuelve de cada tesoro, sacado de sus repartos.
- **Diezmo, la pantalla de acceso y el esqueleto de arranque** no cambian: «Un taller, cuatro tesoros.» es el lema, y el esqueleto sigue con cuatro tarjetas.

### 10. El diseño

- **Las tintas son ocho**, del mismo peso: las cuatro de siempre y grana, mostaza, petróleo y ciruela, con sus tintes, en claro y en oscuro. Medido con la fórmula de WCAG 2.2, la más baja como texto es mostaza sobre su tinte en claro, 4,63:1; sobre el papel van de 5,28:1 (mostaza, claro) a 9,67:1 (mostaza, oscuro). El color nunca va solo: cada tesoro lleva su nombre y su ícono, y dos pueden compartir tinta.
- **La cuadrícula** del plano es decoración y queda casi invisible. Es la única trama que no es la grilla de puntos de las láminas, y siempre queda debajo de papel opaco.
- **Las líneas del plano** son las de ISO 128-2: continua de 1,5 para los contornos, fina para las guías de los globos, de trazos para lo que no recibe, trazo y punto para la línea que se está uniendo, y marca a mano para el triángulo de revisión. Una sola tinta: el acento es la elección.
- **La ilustración** suma `Globo` y la escena `la-fila`, y `TableroCortado` corta con las ocho tintas.
- **El movimiento**: en reposo nada se mueve, los botones usan `apretable` y las hojas su transición de siempre. El lienzo no anima nada.

## Alternativas descartadas

- **Un grafo libre con posiciones guardadas.** Es lo que sugiere «tipo Miro»: fichas donde uno las deja
  y flechas de cualquiera a cualquiera. Deja dibujar lo que la plata no puede hacer (un ciclo, un tesoro
  con dos padres, una bifurcación sin porcentajes), y habría que validar el dibujo en vez de la fila. Las
  posiciones serían otro dato que viaja por la cola y choca entre dos aparatos. Acá se ve como Miro y se
  comporta como una lista ordenada: el lugar de cada ficha es su lugar en la fila, como en el router de
  Make.
- **Editar en el lienzo del celular.** Pelear con el pellizco, el tirar para actualizar y el scroll del
  navegador en un Samsung, con fichas a escala 0,5 y manijas de 14 px, para hacer lo mismo que hace una
  lista con Subir y Bajar. Miro abre el tablero del celular para mirar. El plano vertical cumple 2.5.7
  sin arrastre.
- **Montos fijos adentro del reparto.** Mezclar pesos y porcentajes en el mismo reparto deja sin decir
  en qué orden se paga cada fijo y hace que un porcentaje dependa de si los fijos se cubrieron. El «monto
  fijo del excedente» de Eliseo es un paso de prioridad con su tope: tiene lugar en la fila y se llena
  antes de repartir.
- **Una tabla de acumulados del mes.** Ver la sección 2: sería un segundo lugar donde el mes puede
  quedar mal, reabrir tendría que restar, y dos cobros sin señal pelearían por la misma fila del
  contador.
- **Convertir el enum en tabla con migración de datos.** Reemplazar `tesoro_origen` y `tesoro_destino`
  por ids y sacar el enum reescribe cada movimiento, cambia las columnas de `libro_mayor` que leen las
  apps de hoy y rompe a la vez todas las que no se actualizaron, que mandan el enum. Con las dos columnas
  y el trigger que completa una desde la otra, no cambia ningún dato y una app vieja sigue escribiendo.
- **La meta de Cocos en dos lugares.** Llevar a `tesoros.meta_centavos` la meta de Cocos, además de
  `ajustes.meta_cocos_centavos`, sería el mismo dato en dos lugares, y `faltaConfigurar`, la primera
  configuración y las apps sin actualizar leen el de `ajustes`. El `check`
  `tesoros_meta_solo_de_los_propios` lo impide.
- **tldraw, JointJS y GoJS.** tldraw es una pizarra para dibujar libre y no anda en producción sin una
  clave de licencia; la gratuita es para proyectos no comerciales y exige su marca en el lienzo. GoJS no
  es de código abierto: el uso comercial lleva licencia paga y, sin clave, marca de agua. JointJS tiene
  el núcleo abierto, pero el deshacer, los atajos de teclado, la selección y el minimapa son de JointJS+,
  que es comercial. React Flow es MIT, es de React, trae el teclado y la accesibilidad, y pesa unos 60 kB
  con gzip en su propio chunk.

## Consecuencias

- **Dos caminos de liquidación mientras quede una app sin actualizar.** Las apps nuevas siempre cobran
  por la fila, también con la fila de siempre. El camino de antes queda para los bundles viejos, y deja
  de servir cuando el taller guarda su fila: ahí rebotan con MN025 y el texto les pide actualizar.
- **Una app vieja ve el saldo de Maun de más, y el de Hogar de menos**, desde el primer cobro que hace
  una app nueva, aunque sea con la fila de siempre: un cobro por la fila congela `dist_sueldo` en cero
  (`columnasDeSiempre`) y el sueldo viaja en `repartos`, que la app vieja no conoce. Tampoco ve los
  tesoros del dueño, y una transferencia entre ellos le aparece sin sus lados. Se arregla al actualizar.
  La plata no se equivoca: si esa app vieja cobra en el mismo mes, la base suma los repartos a lo del mes
  y la liquidación vuelve ajustada, no con el sueldo dos veces.
- **El mes en que los gastos fijos salen de Maun, ese paso se llena de nuevo.** Lo que la fila de
  siempre apartó en Maun ese mes no cuenta para el tesoro nuevo. Si Eliseo ya los había cubierto, los
  pasa desde Maun con la hoja de cubrir, y eso sí cuenta.
- **Cambiar el sueldo o los costos fijos sin fila guardada suma una revisión.** El rótulo del plano
  puede decir `REV. 3` en un taller que nunca abrió Tesoros. Es lo que hace que un cobro viejo en la cola
  rebote con MN006 y no con MN008.
- **El esqueleto de arranque sigue con cuatro tarjetas** ([ADR 0075](0075-la-app-abre-sin-pantalla-en-blanco.md)).
  Con más tesoros, las demás aparecen cuando llega la réplica: el script del `head` no lee IndexedDB, y
  un marcador más en `forma.ts` no vale lo que cuesta.
- **El libro guarda los nombres de antes.** Un reparto lleva el nombre del tesoro del día del cobro, y
  un tesoro archivado sigue apareciendo con ese nombre en lo que ya recibió.
- **El taller de prueba de los e2e se deja sin fila.** `vaciarTaller` vuelve a la fila de siempre con
  `guardar_la_fila` en null y archiva los tesoros del dueño que queden vivos.

## Objeciones

Lo pedido está hecho tal cual. Estas son las objeciones, fundamentadas:

1. **Una app nueva cobra por la fila aunque el taller no haya guardado la suya, y eso deja mal parados los saldos de una app vieja.** Con la fila de siempre el reparto es el mismo, pero va a `repartos` y no a `dist_sueldo`, así que otro aparato sin actualizar ve el sueldo en Maun hasta que se actualiza. La plata no se equivoca (la base suma los repartos y ajusta), pero lo que se ve sí. La alternativa era que la app nueva usara el camino de antes mientras no hubiera fila guardada: dos caminos vivos en la app nueva, y el comparador tendría que cubrir los dos para siempre. Se aceptó porque Eliseo usa dos aparatos y el aviso de versión nueva los pone al día en la primera apertura.
2. **El mes en que los gastos fijos salen de Maun a un tesoro propio, ese paso vuelve a llenarse**, y la hoja de guardar no lo dice. Lo que la fila de siempre apartó en Maun ese mes no cuenta para el tesoro nuevo. Si ya estaban cubiertos, la salida es pasarlos desde Maun con «Cubrir», que sí cuenta para el tope. Una línea en la hoja de guardar lo evitaría.
3. **`index` creció 150 kB (42 kB con gzip)**: la página Tesoros, el borrador, el panel y las hojas, sin React Flow, van en el chunk de la app, y los baja todo el mundo al arrancar aunque no abra Tesoros. La regla del repo es no partir las pantallas del taller (ADR 0013), y se respetó; si el arranque en frío del celular empeora (`medir-el-arranque`), la página entera es la primera candidata a su propio chunk.
4. **`guardar_la_fila` con `p_fila` null es API que la pantalla no ofrece.** La usa `vaciarTaller` para dejar el taller de prueba sin fila. Cualquier dueño puede llamarla sobre su propio taller y volver a la fila de siempre; no toca a nadie más, y la revisión nueva hace rebotar un cobro armado antes.
5. **Las gemelas difieren en un número que la app nunca manda**: `private.entero_de_json` rechaza el texto JSON `1.0000000000000001`, que JavaScript lee como 1. La base es la más estricta de las dos y la app escribe con `JSON.stringify`, así que no se arregla; queda fuera del comparador, anotado acá. La otra diferencia que encontró el comparador sí se arregló antes de subir la migración: `private.fila_de_siempre` aceptaba un sueldo o unos fijos por encima de `Number.MAX_SAFE_INTEGER`, y ahora rechaza con 22003, como el dominio.

## Desvíos del LEEME y de las maquetas

- **El encuadre lo calcula la app, no `fitView`.** El LEEME pedía `fitView` con `maxZoom: 1` y padding. `fitView` encuadra al montar y no cuando cambia la forma de la fila (un paso más dejaba una ficha afuera), y en el primer render el `transform` quedaba en 0,0. `model/encuadre.ts` hace la misma cuenta y la repite cuando algo queda afuera.
- **El plano completo del celular es un `<dialog>` modal**, no una capa suelta: así Tab no sale del plano y lo de atrás queda inerte.
- **La tarjeta de la primera vez en la tablet flota a lo ancho del lienzo**, con la lámina al costado, y esconde «Probá un cobro» hasta «Entendido». Como franja fija entre la barra y el lienzo achicaba el plano a una escala de 0,5.
- **Un paso con más de cuatro renglones muestra tres y «y N más»**; el alto de la ficha sigue la regla del LEEME.
- **Los controles chicos miden 44 px** (el zoom del rótulo, los atajos de la prueba, «Cubrir desde otro tesoro», los renglones de cubrir, los colores y los íconos de la hoja del tesoro): las maquetas los dibujan de 32 a 40, y `--tap-min` pide 44.
- **«Editar ‹tesoro›»** va en la cabecera del panel y en el pie de la hoja del paso, y cada parte del reparto tiene su lápiz: las maquetas no dan un camino para editar un tesoro que ya está en la fila.
- **En Inicio**: `tarjetaMinima` es 13.25rem y no 13.5 (con barras de desplazamiento clásicas, 13.5 daba dos columnas en la tablet); la descripción de una tarjeta va en un renglón con su texto completo en `title`; la tarjeta del diezmo sigue diciendo «Debés…» (LEEME §3) y no «Para dar este mes»; el faltante nombra a Maun como «los costos fijos» con la fila de siempre, y sale un aviso por cada paso incompleto; el porcentaje de una meta se redondea hacia abajo; el mensaje del mes lee el paso de sueldo de la fila, porque un cobro por la fila congela `dist_sueldo` en cero.
- **Textos que el LEEME no daba**: los de «Lo que sobra» cuando ya se repartió, cuando los topes están llenos y cuando no hubo cobros; «sin tope todavía» y «Poné el tope» para un paso con tope $ 0; el botón del arranque pasa a «Cargar sueldo y costos fijos», y la bajada de Ajustes en la hoja del perfil, a «Tu taller, cómo te pagan y la vidriera».
- **«Nuevo tesoro» del estante abre la hoja con «Al estante»**; el «+» de un tramo la abre con ese lugar.
- **En la prueba del celular pasa a tinta todo el árbol del reparto**, no solo el tramo vertical: el LEEME dice que en la prueba cada flecha pasa a tinta.
- **Lo que las maquetas dibujan simplificado y `main` ya hacía distinto** queda como estaba: la fecha de Inicio («dom 27 sep»), «Entrega más próxima» sin el cliente, «Hoy en la agenda» en el celular, el pie «Todo sincronizado.» de la barra lateral, las hojas sin agarradera y el `scrollbar-gutter` del `<main>` en la tablet.
- **En la base, además de lo pedido**: `private.lo_del_mes_es_otro` (si lo que vio la app es otro que lo que suma la base), el rechazo con 23514 de una edición que saca el id de un lado y pone otra clave, y el tope de 22003 en `private.fila_de_siempre`.

## Lo que falta confirmar con Eliseo

- Si «Gastos fijos» es un tesoro aparte, como en las maquetas, o prefiere que los gastos fijos sigan en Maun, como la fila de siempre. Las dos cosas funcionan.
- Si el sueldo tiene que ir siempre primero o puede ir después de los gastos fijos. Hoy puede ir en cualquier lugar.
- Qué tesoros quiere de entrada (las maquetas usan Materiales, Inmuebles y Herramientas) y con qué metas.
- Si cubrir el faltante desde Cocos tiene que pedir una confirmación más. Hoy la hoja dice qué cuesta y deja hacerlo.
- Si la hoja de guardar tiene que avisar que, el mes en que los gastos fijos salen de Maun, ese paso se vuelve a llenar (objeción 2).

## Verificación

Todo lo de esta sección se corrió; lo que no se pudo probar está al final.

**La base.** Antes de empujar, dos veces (a la mañana y justo antes): 4 talleres, 16.991 movimientos (27 vivos), 13 proyectos liquidados y 4 filas de ajustes, y los saldos de `libro_mayor` por clave de cada taller. `db:ensayo -- --seed` en verde: los 38 archivos de pgTAP (36, 37 y 38 nuevos, con 44, 49 y 85 tests; 07, 10, 11, 14, 29 y 35 sin tocar) y el comparador del dominio contra SQL con el seed. `sb db push` aplicó las siete migraciones. Después:

- cada taller tiene sus cuatro tesoros (16 en total) y ningún movimiento quedó sin ids ni con el id y la clave diciendo otra cosa;
- los dos checks reemplazados quedaron validados con sus nombres de siempre;
- los saldos por clave son los mismos de antes, centavo por centavo, en los tres talleres con movimientos, el de Eliseo incluido, y el saldo por id coincide con el saldo por clave en todos;
- los advisors dan los mismos ocho avisos de antes (las cinco funciones públicas de `anon`, dos de ellas también de `authenticated`, y la protección de contraseñas filtradas); ninguno es de este PR;
- la suite de `@maun/db` contra la base migrada: 18 archivos y 255 tests, con los dos de concurrencia nuevos.

**Un cobro de punta a punta** en el taller de la cuenta de prueba, desde la pantalla de cobro del build, con una fila guardada (Hogar sueldo $ 500.000, Maun gastos fijos $ 200.000, Herramientas prioridad $ 300.000 y Cocos 50%) y un trabajo con $ 1.500.000 cobrados:

- el pedido llevó `p_fila_version` 81, cuatro repartos con sus ids, `p_previo` con cero para los tres pasos y las columnas de siempre (diezmo $ 150.000, remanente $ 1.350.000, topes, sueldo y fijos en cero);
- la fila de `proyectos` quedó con `dist_fila_version` 81, `dist_previo` en cero y esas columnas;
- `repartos`: Hogar $ 500.000, Maun $ 200.000 y Herramientas $ 300.000 como pasos, y Cocos $ 175.000 como parte;
- `libro_mayor`: el pago de $ 1.500.000 a Maun, el diezmo de Maun a Diezmo, y de Maun a Hogar, Herramientas y Cocos lo de cada reparto; el paso de Maun no mueve nada y los $ 175.000 que sobran quedan en Maun.

Después se reabrió, se borraron el trabajo y el cliente, se volvió a la fila de siempre y se archivó Herramientas: el taller quedó sin fila, con los cuatro de siempre y sin repartos vivos.

**El peso** (`vite build`, en bytes y con gzip):

| Chunk         | `main` (b9e210a)    | Con este PR         |
| ------------- | ------------------- | ------------------- |
| `index-*.js`  | 749.187 (208,55 kB) | 899.740 (250,53 kB) |
| `vendor-*.js` | 754.257             | 761.192 (223,05 kB) |
| `ui-*.js`     | 172.953             | 179.690 (57,38 kB)  |
| `Lienzo-*.js` | —                   | 195.350 (63,15 kB)  |
| Total de JS   | 1.696.117           | 2.056.070           |

`vendor` cambió solo por los íconos nuevos de `lucide-react` que trae el parche (761.180 con el parche solo, 761.192 al final): React Flow está únicamente en `Lienzo-*.js`. `la-fila.spec.ts` comprueba en el celular que abrir `/tesoros` no pide ese chunk y que «Ver el plano completo» sí.

**Las pantallas.** Las 40 maquetas se reprodujeron con un arnés que sirve a la app los datos de la maqueta sin escribir en la base, al mismo tamaño, escala y tema, y se compararon una por una: 6 iguales y 34 casi iguales. Las diferencias de las casi iguales son la cuenta de prueba en la barra lateral, lo que `main` ya hacía distinto de las maquetas, los 44 px y el encuadre de arriba, y el lápiz de editar. Ninguna quedó sin explicar.

**Los tests.** `@maun/domain` con 100% de cobertura; la web con 1.611 tests unitarios; los e2e, con `la-fila.spec.ts` nuevo (la compu, el celular, un cobro, cubrir, archivar y la tablet) y `/tesoros` en el reparto, en lo que flota abajo y en el rediseño. Los resultados de `pnpm verify` y `pnpm e2e` están en el PR.

**Lo que no se probó**: con un lector de pantalla real, en el Samsung de Eliseo y en una tablet de verdad.

## Fuentes

Consultadas el 2026-09-27. Van citadas en «Lo investigado».

- React Flow, API y accesibilidad: https://reactflow.dev/api-reference/react-flow y https://reactflow.dev/learn/advanced-use/accessibility; errores comunes: https://reactflow.dev/learn/troubleshooting/common-errors
- Stripe Workflows: https://docs.stripe.com/workflows/define-workflows
- Make, el router: https://help.make.com/router
- Actual Budget, las plantillas de metas: https://actualbudget.org/docs/experimental/goal-templates/
- n8n, atajos de teclado: https://docs.n8n.io/build/keyboard-shortcuts
- Miro en el celular: https://help.miro.com/hc/en-us/articles/360017572834-Mobile-app
- YNAB, cubrir el faltante: https://www.ynab.com/whats-new/use-future-funds-to-cover-overspending
- Monzo, el reparto del sueldo: https://monzo.com/blog/2019/09/26/introducing-salary-sorter-and-bills-pots
- Goodbudget, llenar desde el ingreso: https://goodbudget.com/help/budgeting-with-goodbudget/fill-from-income/
- Soman y Cheema, apartar en sobres: https://www-2.rotman.utoronto.ca/facbios/file/earmarking-jmrPP.pdf
- Sussman y O'Brien, no tocar lo ahorrado: https://www.sciencedaily.com/releases/2015/11/151102131208.htm
- Monarch, presupuesto flexible: https://help.monarch.com/hc/en-us/articles/32125337244052-Using-Flex-Budgeting
- NN/g, barras y atención: https://www.nngroup.com/articles/dashboards-preattentive/
- WCAG 2.2, arrastre (2.5.7): https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- WCAG 2.2, gestos (2.5.1): https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html
- WCAG 2.2, contenido al pasar (1.4.13): https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html
- WCAG 2.2, foco no tapado (2.4.11): https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- Inclusive Components, toggletips: https://inclusive-components.design/tooltips-toggletips/
- MDN, Popover API: https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
- ISO 128-2, tipos de línea: https://cdn.standards.iteh.ai/samples/83355/10bb39d36fc34caeb80ecd25347ddb0c/ISO-128-2-2022.pdf
- ISO 129-1, cotas: https://cdn.standards.iteh.ai/samples/64007/426c238f9dbe454eb17901d1d32bfc90/ISO-129-1-2018.pdf
- El método del resto mayor: https://en.wikipedia.org/wiki/Largest_remainders_method
- tldraw, la licencia: https://tldraw.dev/community/license
- GoJS, el despliegue: https://gojs.net/latest/intro/deployment.html
- JointJS, la licencia y las funciones: https://www.jointjs.com/license y https://www.jointjs.com/features

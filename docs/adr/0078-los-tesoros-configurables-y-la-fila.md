# 0078. Los tesoros configurables y la fila

- Estado: aceptada
- Fecha: 2026-09-28
- Enmienda al [0003](0003-distribucion-congelada.md) (los repartos, `dist_fila` y la foto de la
  reapertura son parte de lo congelado, y el libro lleva la cuenta por id de tesoro), al
  [0010](0010-sincronizacion-replica-completa.md) (`MN023` a `MN025`, las dos tablas en la réplica, los
  tipos nuevos de `repartos` y las esperas nuevas en los locks), al
  [0011](0011-dominio-cascada-estados-y-cobro.md) (la cascada es la fila de siempre, las siete gemelas
  con las obligaciones, los modos y las metas, y lo que suma el mes en cada camino), al
  [0016](0016-el-cobro-y-el-rechazo-que-encuentra-al-usuario.md) (el pedido con la fila y el ajuste por
  `dist_previo`), al [0018](0018-finanzas-el-diezmo-y-los-movimientos-a-mano.md) (la novena clase,
  «Entre tesoros», y la décima, «Gasto de un tesoro»), al
  [0034](0034-la-agenda-calcula-lo-que-sale-de-los-trabajos.md) (el vencimiento de un compromiso, una
  tercera clase de evento que sale de la fila, y el resumen del mes y del día, que cuenta citas,
  vencimientos y anotaciones), al
  [0036](0036-avisos-por-dispositivo-fuera-de-la-replica.md) (el aviso de los vencimientos), al
  [0062](0062-el-reparto-en-la-compu.md) (`/tesoros` es la única pantalla del marco sin `Pagina` en la
  tablet y en la compu), al [0068](0068-la-mesa-y-el-plano.md) (la cuadrícula del plano, las cuatro
  tintas y la lámina de la primera vez) y al [0072](0072-el-sueldo-se-topea-por-mes.md) (una fila
  guardada cuenta el sueldo por mes).
- Sigue al [0074](0074-lo-que-responde-al-tocar.md) (el lienzo no anima nada y los botones usan
  `apretable`) y al [0075](0075-la-app-abre-sin-pantalla-en-blanco.md) (el esqueleto sigue con cuatro
  tarjetas y le guarda lugar al panorama de Inicio).
- Suma, el mismo día, «Los tipos de tesoro de Eliseo»: la fila se ordena por los tipos de tesoro que
  él dibujó en un tablero de Miro.
- Corregido el 2026-09-30 por el [0079](0079-las-correcciones-del-tablero.md):
  - el reparto, los insumos y el estante de arriba se corren a `AL_REPARTO` (128) de la cadena, para
    que el rótulo del tramo al reparto entre en el hueco; el monto de la prueba va en su propia píldora;
  - la (i) (`Ayuda`) se cierra con cualquier scroll de afuera o cuando su botón se mueve;
  - un reabierto por trabajo en un taller por mes vuelve a cobrar el sueldo por mes (ver la nota en
    «4. Liquidar por la fila»);
  - el plano quedó hasta un 6 % más chico donde lo limita el ancho (ver la objeción 7).

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

Mientras se armaba, Eliseo mostró cómo lo pensó él: la misma fila, ordenada por tipos de tesoro, con
cosas que no habían entrado. Está en «Los tipos de tesoro de Eliseo», y las secciones de la decisión
ya lo cuentan.

## Lo investigado

Las fuentes se leyeron el 2026-09-27. Las citas van en el idioma de la página.

**Cómo reparten otros el ingreso, y por qué una fila.**

- _Actual Budget, las plantillas de metas_
  ([docs](https://actualbudget.org/docs/experimental/goal-templates/)), es lo más parecido a lo que
  pidió Eliseo: prioridades («Lower priority values get run first»), un tope que por defecto es del mes
  («the limit … is based per month») y un «resto» que corre al final repartido por pesos. Dos
  diferencias nuestras, a propósito: Actual reparte el centavo que sobra entre las categorías, y acá ese
  centavo queda en el superávit (Maun, si no se eligió otro); y en Actual el orden es el de la base y
  no el de la vista («based on the
  database order, not the view order»), y acá el orden de la fila es el que se ve.
- _Monzo, Salary Sorter y Bills Pots_
  ([blog](https://monzo.com/blog/2019/09/26/introducing-salary-sorter-and-bills-pots)): cada ingreso se
  divide entre potes («divide up that incoming payment however you like»), con un pote de cuentas fijas;
  si al pote le falta, Monzo «make[s] up the difference from your main account». Acá, en vez de sacar de
  un lugar fijo, Eliseo elige de dónde, como pidió en su tercera respuesta.
- _Goodbudget, llenar desde el ingreso_
  ([ayuda](https://goodbudget.com/help/budgeting-with-goodbudget/fill-from-income/)): un sobre que se
  queda con «extras or deficits». Es el papel del superávit con el resto, y el de Maun con la pérdida,
  que queda en la caja del taller.
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
  redondea hacia abajo por su cuenta y el centavo queda en el superávit: agregar un tesoro al reparto no
  le cambia el centavo a los demás.

## Decisión

### 1. Las reglas de la fila

- **Cada cobro baja por la fila.** Entra el ingreso del trabajo (lo cobrado menos los gastos, como
  siempre: nunca el presupuesto). Salen primero las obligaciones, en su orden: el diezmo, 10% sobre el
  ingreso si no se cambia, y las que sume el dueño, como Ingresos Brutos. Después cada compromiso y
  cada ahorro fijo recibe hasta lo que le falta según cómo se llena, en el orden que puso Eliseo. Lo
  que sobra se reparte por porcentaje entre los ahorros del reparto, cada parte redondeada hacia abajo
  al centavo. El resto, con los centavos de ese redondeo, va al superávit: Maun, si no se eligió otro.
  Los tipos, sus palabras y el porqué están en «Los tipos de tesoro de Eliseo».
- **Tres clases de paso.** _Sueldo_: siempre Hogar, y Hogar solo puede ser sueldo. _Gastos fijos_: con
  renglones (el alquiler, la luz, el ayudante), y el tope es la suma de los renglones. _Prioridad_: un
  monto fijo que se llena antes de repartir, como los materiales. Las dos primeras son compromisos y la
  tercera es un ahorro fijo, que va siempre después de los compromisos. Maun, si está en la fila, solo
  puede ser un paso de gastos fijos, que es lo que pasa en la fila de siempre.
- **Un tesoro va una sola vez**, como obligación, como paso o como parte del reparto. El diezmo va
  siempre entre las obligaciones, y nunca como paso ni como parte. Maun y Hogar no son obligación ni van
  en el reparto. El superávit no puede ser un tesoro que ya esté en la fila, salvo Maun.
- **El tope de un paso por mes es del mes calendario de la fecha del cobro.** Cuenta lo que el tesoro
  ya recibió en el mes por la fila, en cualquier lugar de la fila, y lo que se le pasó para cubrirlo. Un
  paso que se renueva al pagar o se repone al usarlo mira el saldo de su tesoro, y uno por trabajo
  arranca siempre de cero.
- **Los porcentajes suman hasta 100%.** Cada parte se redondea hacia abajo al centavo; el resto y los
  centavos van al superávit. No se usa el método del resto mayor (ver «Lo investigado»): con él, el
  monto de una parte dependería de las demás, y el centavo que sobra ya tiene dueño.
- **Cubrir el faltante.** Si a un paso de gastos fijos le falta plata en el mes, Eliseo elige de qué
  tesoros sale, uno o varios y cuánto de cada uno. Cada elección es una transferencia marcada con el mes
  que cubre (`cubre_el_mes`), y esa plata cuenta para el tope: el próximo cobro no la vuelve a llenar.
  No se cubre con el diezmo, y la base lo exige con un `check`. En un compromiso que se renueva al
  pagar, la plata que se le pasa cuenta porque sube su saldo.
- **Los cambios valen desde el próximo cobro.** Guardar la fila no toca ninguna liquidación hecha
  ([ADR 0003](0003-distribucion-congelada.md)), y un cobro reabierto se vuelve a cobrar con la fila con la
  que se había cobrado. Cada paso guarda desde qué mes rige su tope (`desde`), para ver cuándo se
  actualizó por la inflación.
- **Perdido.** Como hoy: el diezmo según `perdido_con_diezmo` y el sueldo en cero salvo
  `perdido_con_sueldo`. Las demás obligaciones y los demás pasos, iguales.
- **El sueldo por trabajo** (el modo del seed, [ADR 0072](0072-el-sueldo-se-topea-por-mes.md)) existe
  solo en la fila de siempre. Una fila guardada cuenta el sueldo por mes: al empezar a editar, el
  borrador lo pasa a mensual, y la hoja de guardar lo dice.
- **El estante.** Los tesoros que no están en la fila no reciben de los cobros. Siguen teniendo su saldo
  y se mueven con movimientos.
- **Archivar.** Un tesoro con saldo pasa primero su plata a otro (Maun, sugerido). Deja de recibir y
  sigue apareciendo con su nombre en los repartos que ya hizo. Hogar, Maun, Diezmo y Cocos no se
  archivan. Uno que está en la fila guardada (como obligación, paso, parte o superávit), o en la foto de
  un cobro reabierto, tampoco: primero sale de la fila, o se cobra ese trabajo.

La cuenta vive en dos lugares que no pueden divergir ([ADR 0011](0011-dominio-cascada-estados-y-cobro.md)):
`packages/domain/src/fila.ts` y sus siete gemelas de SQL, `private.entero_de_json`,
`private.repartir_por_la_fila`, `private.fila_de_siempre`, `private.problema_de_la_fila`,
`private.plan_del_reparto`, `private.previo_del_mes` y `private.lo_del_mes_es_otro`. Rechazan con
22004, 22023 y 22003 donde el dominio tira `RangeError`. El comparador (`compararFila`) las ata con
casos con semilla, con la cuenta entera de un cobro (el plan, el previo y el reparto, uno detrás del
otro) y con dos tandas de vectores fijos. Los de redondeo: 5 centavos al 70/30 dan 3 y 1 con 1 de
resto; 100 al 33,33/33,33/33,34 dan 33, 33 y 33 con 1; 101 al 50/50 dan 50 y 50 con 1. Los de los
tipos están en «Los tipos de tesoro de Eliseo».

### 2. La fila de siempre, y por qué no hay tabla de acumulados

Un taller que nunca guardó su fila reparte con la de siempre: `filaDeSiempre` la arma con el sueldo y los
costos fijos de Ajustes (el diezmo al 10% sobre el ingreso como única obligación, el sueldo a Hogar y
los costos fijos a un paso de Maun con un renglón «Costos fijos», los dos por mes, y el superávit en
Maun) y da lo mismo que la cascada de antes. `fila.test.ts` lo prueba con 4.000 casos contra
`calcularDistribucion` y `topesDeLaLiquidacion`. Así el día de la migración no cambia nada para Eliseo:
la app nueva cobra «por la fila» desde el primer cobro, con la fila de siempre, y el reparto es el mismo.

El mes en que una fila guardada saca los gastos fijos de Maun a otro tesoro, ese paso arranca de cero: lo
que la fila de siempre apartó en Maun ese mes cuenta para Maun, no para el tesoro nuevo. Es lo que pasa
con la plata: estaba en Maun. Si ese mes ya estaban cubiertos, la hoja de cubrir los pasa desde Maun con
el mes marcado, y el próximo cobro no los vuelve a llenar.

Lo que el mes ya lleva no se guarda en ningún lado. Lo suma la base al liquidar, con el candado de
`ajustes` puesto, desde tres lugares: el sueldo y los fijos de las liquidaciones de antes (`dist_sueldo`
para Hogar, `dist_fijos` para Maun), las filas vivas de `repartos` de los cobros por la fila del mes, de
cualquier tipo, y las transferencias con `cubre_el_mes`. Es lo que ya hacía `liquidar` con el sueldo y
los fijos ([ADR 0011](0011-dominio-cascada-estados-y-cobro.md)): una tabla de acumulados sería un
segundo lugar donde el mes puede quedar mal, y reabrir un cobro tendría que acordarse de restarlo.
Sumando, reabrir lo saca del mes por el solo hecho de borrar sus repartos. Lo mismo el saldo que mira un
paso que se renueva o se repone, y el de un ahorro con meta: la base lo lee de `libro_mayor`, bajo el
mismo candado, que desde los tipos de tesoro toma también todo movimiento.

### 3. Los datos

Ningún dato que exista se borra ni se cambia. Lo nuevo convive con las columnas de siempre, las
liquidaciones viejas quedan como están, y una app que todavía no se actualizó sigue cobrando igual
mientras el taller no guarde su fila. Las migraciones llegan a la base antes del merge, así que todo
tiene que convivir con el bundle de producción de hoy. Son siete, una por tema, y los tipos de tesoro
sumaron seis más (al final de esta sección):

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
   con dos `check` que miran solo las columnas nuevas. `bootstrap()` y `delta()` suman la clave. Los
   tipos de tesoro le sumaron a `repartos` dos tipos y dos columnas, y a `dist_previo`, los topes de las
   metas (abajo y en la sección 4).
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

**Con los tipos de tesoro se sumaron seis migraciones**, con la misma regla: ninguna borra ni cambia un
dato que exista.

1. **`20260928120000_el_candado_de_los_movimientos`.** `private.completar_los_tesoros()`, con
   `or replace`: todo movimiento toma `ajustes` `for no key update` antes de escribir, no solo el que
   cubre un mes, porque un gasto desde un compromiso que se renueva al pagar cambia el saldo que mira la
   liquidación. Si trae `proyecto_id`, antes toma ese proyecto `for key share`: es el orden de la
   liquidación y de la reversión, y al revés la foreign key pediría el proyecto con `ajustes` ya tomado
   y se trabaría con el cobro de ese trabajo.
2. **`…120100_los_tipos_de_los_repartos`.** `repartos` suma `modo` y `base` (`text`, en null, así el
   `alter` no reescribe ninguna fila) y dos tipos, `obligacion` y `superavit`. El check de forma pasa a
   su versión nueva con el rito de los checks de movimientos, sin rellenar nada: un paso con `modo` null
   es por mes y una parte sin tope junta sin fin. Una obligación lleva su porcentaje, de 0,01% a 100%, y
   su base; un paso, un modo que su clase admite; una parte que va hasta la meta, su tope; y un
   superávit, solo el monto.
3. **`…120200_las_gemelas_por_tipos`.** `private.repartir_por_la_fila`, `private.plan_del_reparto` y
   `private.fila_de_siempre` cambian de firma (drop y create, con su `revoke`);
   `private.problema_de_la_fila`, con `or replace`, suma los problemas nuevos; y llegan dos gemelas,
   `private.previo_del_mes` y `private.lo_del_mes_es_otro(uuid[], uuid[], jsonb, jsonb)`. Todas leen la
   forma del primer pedido completando lo que falta con lo de siempre.
4. **`…120300_el_cobro_por_tipos`.** `private.liquidar`, con `or replace`, porque la firma no cambia
   (sección 4). Después saca la versión vieja de `lo_del_mes_es_otro(jsonb, jsonb)`, que `liquidar`
   usaba en cada llamada: antes de reemplazarla no se podía.
5. **`…120400_el_archivo_y_la_fila_por_tipos`.** La guarda de `MN024` mira también las obligaciones y
   el superávit de la fila guardada y de la foto de cada reabierto vivo, y `private.guardar_la_fila` le
   pasa a `private.problema_de_la_fila` la meta de cada tesoro (la de Cocos, de `ajustes`).
6. **`…120500_el_aviso_de_los_vencimientos`.** La clave `vencimientos` de los avisos y lo que necesita
   la función para armarlos ([ADR 0036](0036-avisos-por-dispositivo-fuera-de-la-replica.md)).

Lo que se autorizó con los tipos aunque la regla lo cuente como destructivo, porque no borra ni cambia
un dato: (1) drop y create de las gemelas que cambian de firma, que eran de este mismo PR; (2) cambiar el
check de forma de `repartos` con el mismo rito; (3) `create or replace` de `liquidar`, de las funciones
de los avisos y de las de los triggers, y el default nuevo de `preferencias_de_avisos.avisos`; y (4)
desplegar la función de avisos después de sus tests. `guardar_la_fila` también se reemplazó, sin estar
en la lista («Desvíos»). Antes de empujar se contó que ningún taller tenía `ajustes.fila` y que no había
filas vivas de `repartos` fuera del taller de prueba («Verificación»). No hay códigos nuevos: `MN023`
cubre también una fila con una obligación, un modo, una meta, un día o un superávit que no van.

### 4. Liquidar por la fila

`private.liquidar`, `public.cobrar_proyecto` y `public.cerrar_perdido` suman tres parámetros al final,
todos `default null`: `p_fila_version`, `p_repartos` (`[{id, posicion, tesoro_id, monto_centavos}]`) y
`p_previo` (`{tesoro_id: centavos}`: el previo que la app vio para cada paso y el tope de cada parte que
va hasta la meta, abajo). Cambiar la firma es drop y create, con sus revokes y grants; con default, un
bundle viejo sigue llamando con los de antes. `private.revertir_liquidacion` no cambia de firma:
`or replace`.

**El orden de las cerraduras no cambia**: el proyecto `for update` y después `ajustes` `for no key
update`, como toda liquidación, reversión, guardado de la fila y cobertura de un mes. Desde los tipos de
tesoro, todo movimiento toma también `ajustes`, y si es de un trabajo, antes ese trabajo `for key share`:
el mismo orden.

**Antes de elegir el camino se reconoce el reenvío**, porque un pedido que ya se aplicó no puede rebotar:
el estricto de siempre y el de la liquidación de antes que volvió ajustada (los dos solo contra una
liquidación de antes), y el de un cobro por la fila, ajustado o no (la misma revisión, las mismas
entradas y los mismos ids de repartos en el mismo lugar; los montos tienen que ser los mismos salvo que
lo que vio la app no sea lo congelado, comparado en los pasos y las partes de los repartos ya guardados
de ese cobro). Así un cobro de antes que se reenvía después de guardar la fila no sale MN025.

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
  cambió desde que la abriste.». El plan sale de `private.plan_del_reparto` con los ids del diezmo y de
  Maun: las obligaciones (el diezmo es la primera con el tesoro del diezmo), los pasos con su modo, lo
  que va hasta la meta y el superávit. Lo del mes lo suma la base (sección 2), y los saldos de los
  tesoros de los pasos y de las partes (de `libro_mayor` por `tesoro_id`, sin lo que ya estaba en la
  apertura) y sus metas (la de Cocos, de `ajustes`) los lee después del candado. `private.previo_del_mes` da el previo de cada
  paso según su modo, con el piso de su meta, y el tope de cada parte que va hasta la meta, y el reparto
  sale de `private.repartir_por_la_fila`. Igual que con `p_sueldo_previo_centavos`
  ([ADR 0016](0016-el-cobro-y-el-rechazo-que-encuentra-al-usuario.md)): si lo que vio la app no es lo que
  calcula la base (`private.lo_del_mes_es_otro`), se ajusta sin rechazar, pero la cuenta de la app con lo
  que vio tiene que dar lo que mandó (MN008); sin ajuste, `p_repartos` tiene que coincidir con la cuenta
  de la base (MN008). Los parámetros de siempre viajan con lo que da `columnasDeSiempre` (topes, sueldo,
  fijos y previos en cero, el diezmo, que es el de la obligación del diezmo, y el remanente con lo que
  pasa por Maun antes del reparto, neta − diezmo), así los cuatro checks de `proyectos` siguen valiendo
  sin tocarlos y el reenvío estricto se sigue reconociendo por las mismas columnas. En un perdido,
  `p_diezmo_bp` se compara con el porcentaje del diezmo en la fila, o con cero sin `perdido_con_diezmo`.
  Escribe el proyecto con esas columnas, `dist_fila_version`, `dist_fila` y `dist_previo` (lo de la
  base, con la forma de `p_previo`), y los repartos con los ids de la app y los montos de la base: una
  fila por cada obligación que no es el diezmo, por paso, por parte y por el superávit si no es Maun, en
  ese orden.

**Enmendado el 2026-09-30 por el [ADR 0079](0079-las-correcciones-del-tablero.md):** al cobrar un
reabierto, si la foto va por trabajo y el taller va por mes (`sueldo_tope_mensual` o la fila guardada),
el sueldo va por mes. `private.liquidar` pone `sueldoPorTrabajo` en false en la fila de la foto, y arma
la fila de siempre del camino de antes con el modo mensual; `filaParaLiquidar` hace lo mismo. Por
trabajo, solo si los dos lo son.

Por cualquiera de los dos caminos, liquidar deja `reapertura_fila` en null, como hoy los `reapertura_*`.
**Revertir** borra lógicamente los repartos del proyecto, de cualquier tipo, y, desde un cobrado por la
fila, guarda `reapertura_fila` con `dist_fila_version` y `dist_fila` (además de la foto de siempre, que
es la que usa la app para proponer la fecha). Desde un cobrado por el camino de antes hace lo de hoy y la
deja en null; desde un perdido también.

La app arma la entrada con `entradaDeLaLiquidacion` de `@maun/db`: la misma fila con las mismas reglas
(`filaParaLiquidar`), y lo del mes, los saldos por id y las metas de la réplica. Calcula con
`calcularPorLaFila`, arma un id con `uuidv7()` por cada fila de `repartosDelCobro` y manda, con
`pedidoDeLaFila`, `p_fila_version`, `p_repartos` y `p_previo` (`previoQueVio`), más los parámetros de
siempre con `columnasDeSiempre`. La liquidación optimista escribe también sus filas de `repartos`, así
lo del mes que suma la app ya las cuenta, y reabrir las saca. El ajuste se detecta con `loVistoEsOtro`,
comparando `dist_previo` con lo que se mandó, y `anotarElAjuste` avisa como hoy, tesoro por tesoro.

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
- **Con los tipos de tesoro**, `repartos` trae `modo` y `base`, que la réplica lee tolerando que falten
  (`modoDelReparto` y `baseDelReparto`: un paso sin modo es por mes), sin subir `VERSION_CACHE`.
  `vistas.ts` suma `sistemaDeLaReplica` (los ids de Hogar, Maun y el diezmo), `metasDeLaReplica` (la de
  Cocos, de `ajustes`), `gastosDeLosTesorosDeLaReplica` (los gastos desde un tesoro, para saber qué
  renglón se pagó), `datosDelMesDeLaReplica` (lo que pide `filaDelMes`), `entradaDeLaLiquidacion` (lo
  que pide `calcularPorLaFila`, como lo va a mirar la base), `reaperturaDeLaFila`, `filaDelCobro` y los
  insumos (`insumosPorTrabajo`, `insumosDelTrabajo` e `insumosDelTaller`); `sincronizacion.ts`,
  `pedidoDeLaFila`; y `agenda.ts`, los vencimientos, con el rango que `datosDeLaAgenda` pasa a pedir
  ([ADR 0034](0034-la-agenda-calcula-lo-que-sale-de-los-trabajos.md)). Los tipos no traen códigos
  nuevos.

### 6. El dominio

- `fila.ts` es la fuente: los tipos, la lectura que completa lo que falta (`leerLaFila`), la validación
  (`problemasDeLaFila`, con sus 35 códigos), el plan, el reparto, lo del mes (`loDelMes`,
  `previoDelMes` y `filaDelMes`), lo que se congela y lo que viaja (`columnasDeSiempre`,
  `repartosDelCobro`, `previoQueVio`, `previoDeLoVisto` y `loVistoEsOtro`), los vencimientos de cada
  paso, las funciones de edición y `cambiosDeLaFila`. En el primer pedido vino hecha y fue tal cual; con
  los tipos de tesoro se reescribió.
- `agenda.ts` suma la tercera clase de evento, el vencimiento, y `vencimientosDeLaFila`
  ([ADR 0034](0034-la-agenda-calcula-lo-que-sale-de-los-trabajos.md)); `fechas.ts`, `esMes`,
  `mesesDelRango` y `diaDelMes`.
- `libroMayor.ts` lleva la cuenta por id de tesoro: `DatosDelLibro` suma los tesoros y los repartos, y
  cada línea y cada asiento llevan el id además de la clave (null para los tesoros del dueño). El lado
  que falta se completa desde el otro, como en la base: un movimiento de una réplica vieja trae solo la
  clave. `saldosPorTesoro` sigue devolviendo las cuatro claves, porque lo usa la migración del sistema
  viejo (`scripts/migracion/escritura.ts`), que se queda con las claves; `saldosPorId` y
  `saldosDelLibroPorId` devuelven el mapa por id, y `entradasYSalidasPorId` las cifras del mes de
  cualquier tesoro. `Tesoro` sigue siendo el tipo de las cuatro claves. `estadoDelDiezmo` y
  `proyeccionCocos` no cambian.
- `comparacion.ts` suma `compararFila` (las siete gemelas contra el dominio y la cuenta entera de un
  cobro, con casos con semilla y los vectores fijos), escenarios por la fila en
  `ESCENARIOS_DE_LIQUIDACION` (con los tipos: obligaciones, modos, metas, el superávit aparte y
  perdidos) y `compararLibroMayor` por `tesoro_id`. `compararSeed` y `compararLibroDelSeed` siguen
  dando igual: el seed reparte con la fila de siempre y el sueldo por proyecto.

### 7. La pantalla Tesoros (`/tesoros`)

> Con los tipos de tesoro (sección «Los tipos de tesoro de Eliseo») el plano sigue el diagrama de
> Eliseo:
>
> - **La forma del plano.** Arriba, la fila de la seña, con la ficha Insumos de trazos que abre la lista
>   por trabajo; «Se cobra el trabajo» baja a la píldora «Ingreso». Después, las obligaciones, los
>   compromisos, los ahorros fijos y el reparto, con los globos numerados seguido. Entre los grupos van
>   «Ingreso libre» y «Ganancia», y a la izquierda la columna de los tipos, con su llave y su (i).
> - **Las fichas** dicen su tipo («Obligación», «Compromiso», «Ahorro fijo», «Ahorro», «Superávit»),
>   su modo, «a pagar», «vence el» y su meta. Su `ariaLabel` es «Compromiso 3 de 4: …» y ya no
>   «Paso N de M».
> - **El panel** va por tipo. «Nuevo tesoro» ofrece los seis lugares con sus sugerencias.
> - **La prueba** suma «Se cobró» y «Con lo de hoy» / «Todo en cero».
> - **«Nuevo tesoro» del estante** es un botón de verdad, `focusable: false` en el nodo.
> - **`/tesoros?tesoro=<id>`** elige ese tesoro.
>
> Lo que sigue describe el primer pedido; donde choca, vale esta nota.

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

> Con los tipos de tesoro:
>
> - **Inicio**
>   - suma el panorama («Para pagar», «Ahorros», «Superávit», «Insumos de los trabajos»), y el
>     esqueleto de arranque le guarda su lugar;
>   - pone el tipo en cada tarjeta y los insumos en la de Maun;
>   - muestra el faltante de los compromisos que se renuevan, con el vencimiento de los próximos 7 días;
>   - arma «La fila de septiembre» por tipo;
>   - suma los vencimientos del día a «Hoy en la agenda».
> - **La Agenda** muestra cada vencimiento en su día, con la séptima marca (un reloj de arena) y la
>   tinta `--ag-vencimiento` (7,66:1 en claro, 8,16:1 en oscuro), «Pagado» o «Registrar el pago», y
>   «Ver en Tesoros». El resumen del mes y del día ya no dice «compromisos», que ahora es un tipo de
>   tesoro: cuenta las citas (lo que sale de los trabajos), los vencimientos, si hay, y las anotaciones
>   («2 citas · 1 vencimiento · 3 anotaciones»).
> - **Avisos** suma «Vencimientos».
> - **La ficha del trabajo** muestra sus insumos.
> - **El despiece** va por tipo, en «Distribución del ingreso».
> - **Diezmo** lee el porcentaje y la base de la fila.
> - **Finanzas** suma la décima clase, «Gasto de un tesoro».

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

## Los tipos de tesoro de Eliseo

Mientras se armaba la fila, Eliseo le mostró a Joaquim cómo la pensó él, en un tablero de Miro. Es la
misma fila, pero él la ordena por tipos de tesoro, y había cosas que no habían entrado. Esta sección es
lo que hace que la app quede como lo escribió él. Lo que no cambia sigue como dicen las secciones de
arriba, que ya están al día con esto.

### El tablero

El texto, con sus palabras. Solo se corrigieron tildes y errores de tipeo:

> La idea es establecer diferentes TIPOS de tesoro y establecer la función de cada uno de ellos. El
> razonamiento que me lleva a pensar en la utilidad de esto es que cada negocio tiene una estructura de
> finanzas diferente y puede tener necesidades diferentes a lo largo de su desarrollo.. ejemplos de
> distintas OBLIGACIONES que deben ser cubiertas y a modo organizativo cada una de ellas puede ser
> separada en cajas o "tesoros", a fin de organizar visualmente dónde está el dinero y qué es REALMENTE
> ganancia.. LO NORMAL, en pymes y negocios unipersonales es que tengan toda la plata en la misma
> billetera.. el hecho de que la aplicación lo separe en tesoros diferentes (aunque esté todo en la
> misma cuenta de banco en la realidad) proporciona la tranquilidad de saber que el dinero para pagar el
> alquiler, la cuota del auto, el colegio del hijo, lo que fuera que sabe que tiene que cubrir, esté
> ahí.. y al mismo tiempo, si se propone una meta de ahorro para un propósito específico (o varios)
> pueda separar de su ganancia ese dinero... TAMBIÉN entendiendo que las cosas no salen siempre del modo
> que queremos, que exista la posibilidad de un movimiento interno entre tesoros, nos permite que si un
> mes no entró suficiente dinero para pagar los sueldos (por ejemplo) pueda sacar del tesoro general (o
> de algún ahorro particular) para cubrir las obligaciones.. este es un poco el corazón de la idea.. una
> especie de MAPA VISUAL, un PANORAMA de dónde está la plata y para qué la puedo usar.. en función de
> los propósitos que tengo..

El diagrama baja así: SEÑA → SE CONCRETA UN PROYECTO → INGRESO → INGRESO LIBRE → GANANCIA, y de cada
escalón sale una flecha a un tipo de tesoro, en una columna que dice «TIPOS DE TESORO»:

- SEÑA → INSUMOS: «Tesoro interno y particular de cada proyecto. Puede haber un visor externo en el
  sector "tesoros" que reúna el total del dinero disponible entre todos los proyectos activos.»
- INGRESO → OBLIGACIONES: «Tesoro que reúne valores siempre. Vuelven a cero cuando se registra el pago
  de las obligaciones y figuran como "deuda" mientras tanto. Pueden establecerse órdenes de prioridad
  diferente entre ellos.»
- INGRESO LIBRE → COMPROMISO: «Tesoro que reúne valores hasta alcanzar un monto. Vuelven a cero cuando
  se registra el pago de dichas obligaciones y figuran como "deuda" mientras tanto. Pueden asignarse
  fechas de pago para los compromisos a modo de alerta en la agenda.»
- GANANCIA → AHORROS: «Tesoro que reúne valores de una parte de la ganancia, puede ser de modo
  indefinido o hasta alcanzar un monto estipulado, puede ser porcentual o un monto fijo (mensual o por
  operación). Muestran una barra de progreso en caso de tener un valor estipulado.»
- GANANCIA → SUPERÁVIT: «Tesoro que reúne ganancia resultante.»

Y sus notas:

- «SEÑA (el dinero que entra al iniciar un proyecto). INSUMOS (para cada proyecto).»
- «EL INGRESO: se define, proyecto a proyecto, en función de la diferencia entre costos y beneficios.»
- «OBLIGACIONES SOBRE EL INGRESO (DIEZMO / Ingresos Brutos). Ingresos brutos tal vez se podría definir
  antes que diezmos.»
- «INGRESO LIBRE (no sé cómo llamarlo, es el resultante entre INGRESO y la OBLIGACIÓN A).»
- «OBLIGACIONES FIJAS (sueldos, alquileres, cuotas, luz, gas, teléfono, etc). COMPROMISOS es un buen
  nombre también.»
- «GANANCIA (el resultante entre INGRESOS y OBLIGACIONES).»
- «AHORROS DE INVERSIÓN (compra inmueble, compra vehículo, compra maquinaria).»
- «AHORROS DE STOCK (herrajes, madera, insumos (hotmelt, cementos, cola)) --> aquellos costos
  fantasmas que no se pueden cargar trabajo a trabajo, porque es necesario tenerlos previamente como
  parte del día a día del taller.»
- «SUPERÁVIT (aquí cae el excedente): de aquí pueden salir todos los gastos extras, inesperados o
  especiales (regalos empresariales, pago de algún imprevisto, compras cajas navideñas, etc).»

Después vio capturas de la pantalla Tesoros tal como estaba. Le marcó el tipo a cada ficha (Diezmo,
obligación; Hogar y Gastos fijos, compromiso; Materiales y Cocos, ahorros; Maun, el resto, superávit) y
anotó:

- «Esto se vería cada vez que cerrás un Proyecto.. ?? pregunto porque veo que se ve el paso a paso de un
  monto determinado..»
- «creo que lo más relevante ahora es que quede claro cada "categoría" de tesoro... por ejemplo hasta
  hoy llamamos "COCOS" a lo que sería mi ahorro para inmueble.. pero es de la misma categoría que
  "Materiales" (que veo que como está marcado como prioridad, recibe antes de repartir el restante). Al
  parecer sí nos estamos entendiendo VAMOOOOO!!!»

### Cómo cae cada tipo en la fila

Es la misma fila de la sección 1, con cada lugar nombrado por su tipo. La plata baja en este orden, y
cada escalón del diagrama es un número de la cuenta:

| Tipo                   | En la fila                                   | Cómo recibe                                                                                                    | Ejemplos                              |
| ---------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Insumos                | No está: es un visor, no un tesoro           | No recibe. Es lo que entró de cada trabajo en curso menos lo que se gastó en él, y está en Maun                | La seña de una cocina                 |
| Obligaciones           | `obligaciones`, antes que todo, hasta seis   | Su porcentaje de lo que cobrás o del ingreso que les llega. Quedan a pagar hasta que se registra el pago       | El diezmo, Ingresos Brutos            |
| Compromisos            | Los pasos de sueldo y de gastos fijos        | Hasta su monto, por mes o renovándose al pagar; el sueldo, siempre por mes. Quedan a pagar, salvo Hogar y Maun | El sueldo, el alquiler, la luz        |
| Ahorros fijos          | Los pasos de prioridad, tras los compromisos | Hasta su monto: por mes, reponiéndose al usarlo o en cada cobro, sin fin o hasta la meta                       | El stock del taller, la maquinaria    |
| Ahorros por porcentaje | Las partes del reparto                       | Su porcentaje de lo que sobra, hacia abajo al centavo, sin fin o hasta la meta                                 | El inmueble (hoy, Cocos), el vehículo |
| Superávit              | `superavit`, un tesoro                       | Lo que queda, con los centavos del redondeo                                                                    | Maun, o un tesoro «Superávit»         |

Las palabras del medio también son las suyas, y cada una es un número del reparto (`Reparto` en
`fila.ts`): el **ingreso** es lo cobrado menos los gastos (`neta`); el **ingreso libre**, el ingreso
menos las obligaciones (`libre`); la **ganancia**, lo que queda después de los compromisos
(`ganancia`); lo que se reparte por porcentaje es lo que queda después de los ahorros fijos
(`sobrante`); y el **superávit**, lo que queda después de los ahorros (`remanente`; con un ingreso que no
es positivo, es la pérdida, y queda en Maun).

**La cuenta de un cobro** (`repartir` y `private.repartir_por_la_fila`):

1. El ingreso es lo cobrado menos los gastos. Si no es positivo, no se reparte nada, como siempre.
2. Las obligaciones, en su orden. Cada una es su porcentaje de lo cobrado o de lo que le llega,
   redondeado como el diezmo (mitad hacia arriba), y nunca más que lo que llega. En un perdido, el
   diezmo sigue a `perdido_con_diezmo` y las demás se aplican igual.
3. Los compromisos y después los ahorros fijos, cada uno hasta lo que le falta. Lo que ya tiene depende
   de cómo se llena: por mes, lo del mes; si se renueva o se repone, el saldo del tesoro, nunca menos de
   cero; por trabajo, cero.
4. Los ahorros por porcentaje, sobre lo que sobra, cada uno hacia abajo al centavo.
5. Lo que queda, con los centavos, es del superávit.

**La meta.** A un ahorro le falta, para su meta, la meta menos su saldo, nunca menos de cero. Un ahorro
por porcentaje que va hasta la meta no recibe más que eso. En un ahorro fijo, lo que ya tiene nunca se
cuenta como menos que su monto menos lo que le falta para la meta: así recibe lo menor entre lo que le
falta según cómo se llena y lo que le falta para la meta, y la cuenta de los pasos no cambia. Ese número
sirve solo para el tope: `calcularPorLaFila` devuelve también lo que el paso lleva según cómo se llena
(`lleva`) y si lo frenó la meta (`llegaALaMeta`), que es lo que se muestra.

**El diezmo de un cobro por la fila es su obligación**: `columnasDeSiempre` escribe ese monto y ese
porcentaje en `dist_diezmo_centavos` y `dist_diezmo_bp`, y `dist_remanente` sigue siendo el ingreso
menos el diezmo. Las otras obligaciones y el superávit que no es Maun van a `repartos`.

Los vectores fijos, en `fila.test.ts` y en el comparador contra SQL:

- se cobran $ 2.500.000 y hay $ 500.000 de gastos: el ingreso es $ 2.000.000. Con Ingresos Brutos al
  3,5% sobre lo cobrado antes del diezmo, salen $ 87.500 de Ingresos Brutos y $ 191.250 de diezmo, y el
  ingreso libre es $ 1.721.250. Con el diezmo primero, salen $ 200.000 de diezmo y $ 87.500 de Ingresos
  Brutos, y quedan $ 1.712.500;
- un ahorro del 20% hasta la meta de $ 300.000 que ya tiene $ 250.000, con $ 1.000.000 de lo que sobra:
  recibe $ 50.000, y los $ 150.000 que no recibe van al superávit;
- un compromiso que se renueva al pagar, de $ 900.000 y con $ 630.000 de saldo, recibe como mucho
  $ 270.000;
- con $ 1.000.000 cobrados y $ 990.000 de gastos, Ingresos Brutos antes del diezmo aparta $ 10.000, todo
  lo que llega, y el diezmo queda en cero;
- un ingreso de 15 centavos aparta 2 de diezmo, mitad hacia arriba.

### Lo que se decidió, y por qué

Lo que ya estaba hecho es su cascada: el diezmo primero, pasos con tope en el orden que él elige, el
reparto por porcentaje, el resto en Maun y cubrir el faltante desde otro tesoro. Lo que cambia es esto,
y todo lo que se puede elegir se elige desde Tesoros:

1. **Cinco tipos, en un orden fijo: obligaciones, compromisos, ahorros fijos, ahorros por porcentaje y
   superávit.** Adentro de cada tipo, el orden lo elige él. Un ahorro no puede ir antes de un compromiso
   (`ahorro-antes-de-compromiso`): así «ingreso libre» y «ganancia» quedan cada una en un solo lugar de
   la fila y dicen siempre lo mismo. Con un ahorro entre dos compromisos, la ganancia sería un número
   distinto según dónde se la mire.
2. **Las palabras son las suyas.** Ingreso es lo que deja cada trabajo, lo cobrado menos los gastos;
   ingreso libre, el ingreso menos las obligaciones; ganancia, lo que queda después de los compromisos;
   superávit, lo que queda después de los ahorros. Los pasos de sueldo y de gastos fijos pasan a
   llamarse compromisos, los de prioridad ahorros fijos, y las partes del reparto ahorros por
   porcentaje. Los identificadores del código (`sueldo`, `fijos`, `prioridad`) no cambian: no se
   renombra por un cambio de texto ([ADR 0064](0064-el-seguimiento-de-verdad-y-las-consultas.md)).
3. **Las obligaciones se configuran**: una lista ordenada de hasta seis, cada una con su tesoro, su
   porcentaje (de 0,01% a 100%) y sobre qué se calcula: «lo que cobrás» (`cobrado`, todo lo que entró
   del trabajo) o «el ingreso» (`ingreso`, lo que llega después de las obligaciones de arriba). Es su
   dibujo: «OBLIGACIONES SOBRE EL INGRESO (DIEZMO / Ingresos Brutos)», que «reúne valores siempre», con
   «órdenes de prioridad diferente entre ellos».
   - **El diezmo es una obligación más, y va siempre**: es la regla del taller desde el sistema viejo, y
     la pantalla Diezmo y su deuda cuentan con él. Arranca en 10% sobre el ingreso, lo de siempre, y su
     porcentaje y su lugar se pueden cambiar.
   - **Hogar y Maun no pueden ser obligación.** Hogar recibe solo el sueldo, con su tope por mes
     ([ADR 0072](0072-el-sueldo-se-topea-por-mes.md)): una obligación en Hogar sería un sueldo sin tope.
     Maun es la caja donde entra cada cobro: lo que se le apartara no se separaría de nada, ni sería
     deuda.
   - **Ingresos Brutos no viene cargado**, porque no todos lo pagan igual. Si lo suma, entra antes del
     diezmo, porque así lo escribió él («Ingresos brutos tal vez se podría definir antes que diezmos»), y
     el diezmo pasa a calcularse sobre lo que queda. Va sobre lo cobrado, porque en el régimen general
     se liquida sobre lo facturado, no sobre lo que deja el trabajo. Eliseo confirmó las dos cosas el
     2026-09-28.
   - **Si paga Ingresos Brutos adentro del monotributo, va como compromiso.** En la Provincia de Buenos
     Aires, el monotributo unificado cobra junto con el nacional «El impuesto sobre los Ingresos Brutos
     provincial», con «una cuota fija mensual de acuerdo con la categoría del Monotributo»
     (iProfesional, en «Fuentes»). Una cuota fija por mes no es un porcentaje de cada cobro: es un
     compromiso, y la ayuda de «Sobre qué se calcula» lo dice.
4. **Cómo se llena cada paso**, a elegir en cada uno:
   - «por mes» (`mes`): recibe hasta su monto en cada mes del calendario, que es lo que hacía la fila;
   - «se renueva al pagar» en un compromiso, o «se repone al usarlo» en un ahorro fijo (`saldo`): junta
     hasta tener su monto de saldo, y cuando se registra un pago o un gasto desde ese tesoro, vuelve a
     juntar;
   - «por trabajo» (`trabajo`), solo en los ahorros fijos: recibe su monto en cada cobro, sin mirar el
     mes.

   Un compromiso nuevo arranca en «se renueva al pagar», porque es lo que escribió Eliseo: «Vuelven a
   cero cuando se registra el pago de dichas obligaciones y figuran como "deuda" mientras tanto». Un
   ahorro fijo nuevo arranca por mes, como el fijo mensual para los materiales que pidió de entrada; «por
   trabajo» es su monto fijo «por operación». **El sueldo del Hogar va siempre por mes**: el Hogar gasta
   su saldo todo el mes, y renovarlo al pagar pagaría el sueldo varias veces. **Un paso de Maun tampoco se
   renueva al pagar**: el saldo de Maun es toda la caja del taller, con los cobros y los insumos, y el
   paso la vería siempre llena, así que los costos fijos dejarían de apartarse antes de los ahorros.
   `modosPosibles` y `modoInicial` son esas reglas, y `modo-invalido` las cuida al guardar.

5. **Hasta la meta, solo en los ahorros.** Un ahorro fijo o por porcentaje cuyo tesoro tiene meta puede
   juntar sin fin o «hasta la meta», como escribió él: «puede ser de modo indefinido o hasta alcanzar un
   monto estipulado». Arranca en «hasta la meta» cuando el tesoro tiene meta, porque para eso se la puso.
   Cuando llega, deja de recibir, y lo que le tocaba sigue hacia abajo hasta el superávit: no se pierde,
   y lo de los demás no cambia. Si el tesoro se queda sin meta, junta sin fin. La meta de Cocos sigue en
   `ajustes` («La meta de Cocos en dos lugares», en las alternativas). Los compromisos no la necesitan:
   su monto ya es su tope.
6. **Los ahorros por porcentaje, sobre lo que sobra.** Sus porcentajes se calculan sobre lo que queda
   después de los ahorros fijos, no sobre la ganancia, para que nunca sumen más de lo que hay. Sobre la
   ganancia, un ahorro fijo de $ 300.000 y otro del 50% pedirían $ 500.000 de una ganancia de
   $ 400.000, y habría que decidir a cuál se le corta. Con el orden de la fila no hay nada que decidir.
7. **El superávit se elige**: es el tesoro que recibe lo que sobra y los centavos del redondeo, y es
   Maun si no se elige otro, que es lo de siempre. Es el lugar donde, según él, «cae el excedente», y
   del que «pueden salir todos los gastos extras, inesperados o especiales». Si es otro, Maun queda con
   los insumos de los trabajos en curso y con lo que se cargue a mano. No puede ser Hogar, que recibiría
   más que su sueldo, ni el diezmo, que es una deuda, ni un tesoro que ya esté en la fila, que recibiría
   por dos reglas a la vez. Maun sí puede, aunque sea un paso de gastos fijos: es lo que pasa en la fila
   de siempre.
8. **Los compromisos tienen día de pago**, opcional, en cada renglón: «Pueden asignarse fechas de pago
   para los compromisos a modo de alerta en la agenda». El vencimiento aparece en la Agenda y en Inicio,
   y avisa al teléfono como los demás eventos de la agenda, con su propio aviso, «Vencimientos»
   ([ADR 0034](0034-la-agenda-calcula-lo-que-sale-de-los-trabajos.md) y
   [0036](0036-avisos-por-dispositivo-fuera-de-la-replica.md)). No se guarda: sale de la fila. Registrar
   el pago es un gasto desde ese tesoro con el nombre del renglón como categoría (desde Maun, con «Gasto
   del taller»): con eso el vencimiento de ese mes queda pagado, sin una tabla de pagos.
9. **Lo que tienen las obligaciones y los compromisos es deuda**, y se muestra como «a pagar», como ya
   hacía el diezmo con `estadoDelDiezmo`, porque así lo escribió él: «figuran como "deuda" mientras
   tanto». Registrar el pago lo baja, y un compromiso que se renueva al pagar vuelve a juntar. Hogar y
   Maun no: el saldo del Hogar es la plata de la casa y el de Maun es la caja del taller, y ninguno de
   los dos se le debe a nadie.
10. **Los insumos son un visor, no un tesoro.** Por cada trabajo vivo que no está cobrado ni perdido,
    son todo lo que entró (la seña y los pagos, también los de antes de la apertura) menos todo lo que se
    gastó en ese trabajo. No mueven plata: esa plata está en Maun hasta que el trabajo se cobra. Es el
    «visor externo en el sector "tesoros"» que él mismo propuso. Pueden dar negativo, si el taller puso
    plata, y el total cuenta los negativos: así Maun sin los insumos es exacto. Se ven en la ficha del
    trabajo, en Tesoros y en Inicio.
11. **La flecha dice «Se cobra el trabajo», no «Se concreta un proyecto».** El ingreso se reparte al
    cobrar: mientras el trabajo puede caerse, la seña es un anticipo y no un ingreso
    ([ADR 0011](0011-dominio-cascada-estados-y-cobro.md), «El perdido se liquida al pasar a perdido»), y
    lo cobrado menos los gastos se sabe al final. Hasta entonces la seña está en los insumos. Es también
    la respuesta a su pregunta: lo que baja por la fila es cada cobro.

### Alternativas descartadas

- **Los compromisos solo por mes**, como hacía la fila. Un paso por mes recibe hasta su monto en cada
  mes, se haya pagado o no: un alquiler que no se pagó en septiembre se vuelve a llenar en octubre, el
  tesoro junta dos, y esa plata no llega a los ahorros. Eliseo escribió otra cosa: el compromiso «reúne
  valores hasta alcanzar un monto» y vuelve a cero cuando se registra el pago. Por mes queda como opción,
  y es la del sueldo.
- **Mover la seña a un tesoro de cada trabajo, con asientos propios**, como dice su dibujo («Tesoro
  interno y particular de cada proyecto»). Cada pago y cada gasto del trabajo tendría que mover plata
  entre Maun y ese tesoro, el cobro lo tendría que vaciar y reabrirlo, volver a llenarlo: asientos nuevos
  en el libro y en lo congelado ([ADR 0003](0003-distribucion-congelada.md)) para una plata que no cambia
  de lugar, porque ya está en Maun. El visor la cuenta con lo que ya está en la réplica, sin escribir
  nada.
- **Los porcentajes sobre la ganancia, antes de los ahorros fijos.** Los fijos y los porcentajes
  podrían pedir más de lo que hay, y habría que decidir a cuál se le corta (punto 6).
- **Un tipo fijo guardado en cada tesoro.** Una columna `tipo` en `tesoros` diría lo mismo que su lugar
  en la fila, y los dos se podrían contradecir: un tesoro marcado como ahorro puesto como compromiso.
  Cambiarle el tipo serían dos escrituras en la cola, el tesoro y la fila. Además, un tesoro del estante
  no tiene tipo, porque no recibe, y Maun puede ser compromiso y superávit a la vez. El tipo sale de su
  lugar en la fila (`tipoDelTesoro`).

### Consecuencias

- **Finanzas suma la décima clase, «Gasto de un tesoro»**
  ([ADR 0018](0018-finanzas-el-diezmo-y-los-movimientos-a-mano.md)): un gasto desde cualquier tesoro del
  dueño. Es como se registra el pago de una obligación o de un compromiso que no es Hogar, Maun, Cocos
  ni el diezmo, que siguen con sus clases. No necesitó migración: el `check` de movimientos ya mira los
  ids.
- **Todo movimiento toma el candado de `ajustes`**, y antes su trabajo, si es de uno. Un gasto desde un
  tesoro que se renueva o se repone cambia lo que el próximo cobro le da, así que una liquidación del
  mismo taller tiene que ver cada movimiento entero o no verlo. Cuesta que un movimiento espere a un
  cobro del mismo taller que esté en curso. Un update masivo sobre movimientos de trabajos distintos,
  como `vaciarMovimientos` de los e2e, puede trabarse con un cobro en curso (`40P01`); la app escribe de
  a uno.
- **Un trabajo a pérdida no aparta Ingresos Brutos, aunque se deba.** Si lo cobrado menos los gastos no
  es positivo, no se reparte nada, como siempre, pero en el régimen general Ingresos Brutos se debe igual
  sobre lo facturado: esa plata la tiene que pasar él, «Entre tesoros». Y como una obligación nunca
  aparta más que lo que llega, con un ingreso chico se aparta a medias: con $ 1.000.000 cobrados y
  $ 990.000 de gastos, $ 10.000 de los $ 35.000.
- **El reparto de un cobro depende también de los saldos.** Un paso que se renueva o se repone mira el
  saldo de su tesoro, y un ahorro con meta, el suyo. Si otro aparato registró un pago que la app todavía
  no vio, la base cuenta con el saldo de verdad y el cobro sale ajustado, no rechazado, como con lo del
  mes ([ADR 0016](0016-el-cobro-y-el-rechazo-que-encuentra-al-usuario.md)).
- **Cambiar una meta no suma una revisión de la fila.** La meta es un dato del tesoro (la de Cocos, de
  `ajustes`), como su saldo, y `contar_la_revision_de_la_fila` no la mira: un cobro armado con la meta
  de antes sale ajustado, no rechazado con MN006. Un tesoro que se queda sin meta sigue en la fila y
  junta sin fin; recién al guardar la fila otra vez, «hasta la meta» sin meta es un problema.
- **Las filas guardadas antes se leen sin reescribirlas.** `leerLaFila` y las gemelas completan lo que
  falta con lo de siempre, y un paso de `repartos` con `modo` null es por mes. No hubo nada que rellenar:
  ningún taller tenía la fila guardada.
- **`diezmo-en-la-fila` nunca es el primer problema que devuelve la base.** El diezmo como paso sale
  antes como repetido, si también es obligación, o como `sin-diezmo`, si no lo es. En la lista completa
  sigue apareciendo.
- **La agenda pide un rango para armar sus datos.** Los vencimientos se repiten cada mes:
  `datosDeLaAgenda` arma los meses del rango que recibe, que tiene que ser el mismo que después mira
  `eventosDeLaAgenda`.
- **La función de avisos repite dos reglas del dominio**: la ventana de `eventosParaAvisar`
  (`rangoDelAviso`) y las preferencias iniciales para lo que falte (`preferenciasCompletas`). Si cambia
  una, cambia la otra.
- **Sin la zona, la función leería en UTC el mes en que se guardó la fila.** La base la manda en cada
  aviso. Sin ella, una fila guardada en las últimas tres horas del último día de un mes haría aparecer
  desde el mes siguiente los vencimientos de los pasos sin `desde`.

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
- **El esqueleto de arranque le guarda lugar al panorama**, entre la portada y las tarjetas, con las
  clases de `Panorama` (`esqueleto.test.tsx` las ata). Con montos de largo común (once caracteres, como
  «$ 1.327.000») mide lo mismo que el panorama de verdad, a 0,1 px, de 320 a 1440 de ancho: el
  renglón de más de «Insumos de los trabajos», que se parte en las celdas de menos de 129 px, lo pone
  una consulta de contenedor. Con montos más largos la letra se achica y el panorama queda hasta 14 px
  más bajo que su lugar.
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

Con los tipos de tesoro:

6. **«Pagado» se decide por el texto.** Un vencimiento queda pagado si hay un gasto desde ese tesoro
   con el nombre del renglón como categoría en el mes. Si Eliseo paga desde otro tesoro, con otra
   categoría, o renombra el renglón después de pagar, figura sin pagar y la Agenda le ofrece registrar
   el pago otra vez. Un renglón con id propio sería más firme, pero los renglones viven en el jsonb de
   la fila y no tienen id.
7. **La escala del plano en la compu.** Con la fila típica de Eliseo el plano entra a 1:1,6: la letra
   chica de las fichas queda en unos 7 px en una pantalla común. Se eligió ver la fila entera, que es el
   panorama que él pidió; si le cuesta leer, se compacta o se pone un piso de 0,8 con desplazamiento.
   Eliseo confirmó el 2026-09-28 que lo lee bien en la PC del taller. **El 0079 lo achicó un poco
   más** donde lo limita el ancho: el hueco del reparto pasó de 64 a 128 px para que «Ganancia» no
   quede tapada. Con un paso alto y cuatro partes, a 1440, de 0,733 a 0,690; con la fila de siempre
   manda el alto y casi no cambia.
8. **El candado de `ajustes` en cada movimiento** serializa todas las escrituras del taller detrás de
   cada liquidación, para una garantía que solo necesitan los tesoros que se renuevan o se reponen, y un
   update masivo sobre movimientos de trabajos distintos puede cortarse con 40P01. Para un solo usuario
   no se nota.
9. **`index-*.js` volvió a crecer**: 959.328 B (264.574 con gzip), 59.588 más que en el primer pedido,
   porque las pantallas del taller no se parten. El lienzo sigue aparte (194.887 B).

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

**Con los tipos de tesoro**, del pedido, en el dominio y en la base:

- **`p_previo` y `dist_previo` llevan un número por paso, no dos.** El pedido decía el previo según su
  modo y, aparte, lo que le faltaba para la meta. Van plegados: el previo con el piso de la meta,
  `max(lo del modo, monto − lo que le falta para la meta)`, que es el único número que entra a la
  cuenta, y en cada parte que va hasta la meta, su tope. Con eso la base rehace la cuenta de la app y
  detecta el ajuste; el segundo número no cambiaba nada de lo que se congela.
- **`private.lo_del_mes_es_otro` tiene una versión nueva, que mira las partes por presencia**: una parte
  con tope de un lado y sin tope del otro ya es otra cosa. La de antes contaba como cero una clave que
  faltaba, y con las partes haría saltar mal el MN008. Se sacó recién después de reemplazar `liquidar`,
  que la usaba en cada llamada. En el reenvío, los pasos y las partes que compara salen de los repartos ya
  guardados de ese cobro.
- **`guardar_la_fila` se reemplazó con `create or replace`**, con la misma firma, aunque no estaba en la
  lista de lo autorizado: es la única forma de pasarle las metas a `problema_de_la_fila`, y no toca
  ningún dato.
- **El check de `repartos` exige de 0,01% a 100% en las obligaciones.** El diezmo, el único que puede ir
  en cero (en un perdido sin diezmo), nunca lleva fila. El modo va según la clase, pero que un paso de
  Maun vaya solo por mes no entra en el check, porque necesita la clave del tesoro: lo cuida
  `problema_de_la_fila` al guardar.
- **`leerLaFila` completa solo lo que falta.** Una clave que está en null no se lee, salvo `dia`, donde
  null es sin día de pago.
- **`filaDelMes` devuelve las listas en el orden de la fila, con el `tipo` en cada paso**, y no un objeto
  agrupado por tipo: el orden de la fila ya es por tipo.
- **`datosDeLaAgenda` pide el rango, y cada aviso de la mañana lleva la zona de la persona**, que el
  pedido no decía: los vencimientos se repiten cada mes, y el mes en que se guardó la fila depende de la
  zona. La función completa además las preferencias que no traen `vencimientos` (`preferenciasCompletas`),
  así no importa si llega antes el deploy o la migración.
- **El renglón del aviso suma «(hoy)» o «(en N días)»**, como los demás: «Vence: Alquiler, $ 500.000
  (hoy)». La función escribe los pesos por su cuenta, con espacio duro y coma decimal, porque no importa
  nada de la app.
- **Los insumos de un trabajo pueden dar negativo** y el total los cuenta, como está en el punto 10 de
  «Lo que se decidió».

Con los tipos de tesoro, en la web:

- **La escala.** El LEEME pedía que la fila entera entrara en la compu a 0,8–1. Con la seña, las
  obligaciones y las etiquetas del flujo, la fila de Eliseo entra a 1:1,6 (zoom 0,63), y no llega a 0,8
  sin romper el diagrama vertical del pedido. Se ve entera y se agranda con Acercar.
- **La tablet vertical**: la tarjeta flotante de la prueba muestra «Se cobró» sin su línea de ayuda,
  para no tapar el plano. En el panel y en el celular la ayuda está.
- **`?tesoro=` con una parte del reparto** la marca en el plano y abre el panel del reparto, que es el
  de las partes.
- **El despiece de un trabajo ya cobrado**: solo las partes guardan su tope, así que ahí «llegó a la
  meta» se ve en las partes y no en los pasos.
- **La hoja de cubrir**, con un compromiso que se renueva, dice «Faltan $ … para completar su monto» y
  no nombra el mes.
- **Quedan dos «ganancia»** que no quieren decir lo cobrado menos los gastos: «el corte de la ganancia»
  de los rechazos y «tu ganancia» de la hoja de compartir. Las ayudas de Tesoros usan «ganancia» como
  Eliseo: lo que queda después de los compromisos.

## Lo que falta confirmar con Eliseo

- Si «Gastos fijos» es un tesoro aparte, como en las maquetas, o prefiere que los gastos fijos sigan en Maun, como la fila de siempre. Las dos cosas funcionan.
- Si el sueldo tiene que ir siempre primero o puede ir después de los gastos fijos. Hoy puede ir en cualquier lugar entre los compromisos.
- Qué tesoros quiere de entrada (las maquetas usan Materiales, Inmuebles y Herramientas) y con qué metas.
- Si cubrir el faltante desde Cocos tiene que pedir una confirmación más. Hoy la hoja dice qué cuesta y deja hacerlo.
- Si la hoja de guardar tiene que avisar que, el mes en que los gastos fijos salen de Maun, ese paso se vuelve a llenar (objeción 2).
- Si le sirve que «Pagado» salga de la categoría del gasto.
- La descripción del diezmo que se ve en Tesoros sale de la base y todavía dice «Lo apartado de cada
  ganancia». Cambiarla en los talleres que existen es un update de datos de producción y no se hizo.

## Lo que confirmó Eliseo

El 2026-09-28:

- Ingresos Brutos va sobre lo cobrado y antes del diezmo, como quedó: antes del diezmo porque así lo
  escribió él, y sobre lo cobrado porque así se liquida en el régimen general. Si lo paga adentro del
  monotributo, es una cuota fija por mes y va como compromiso. Ingresos Brutos sigue sin venir cargado.
- Lee bien el plano a 1:1,6 en la PC del taller (objeción 7).

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

**Los tipos de tesoro** (2026-09-28): la base, el dominio y la función de avisos.

- **Antes y después de empujar**, las mismas cifras: 4 talleres, 18.740 movimientos (27 vivos), 13
  proyectos liquidados, 4 filas de ajustes y ninguna con la fila guardada, 107 tesoros (16 sin
  archivar), 672 repartos y ninguno vivo, y la misma huella md5 de los saldos por tesoro. Ningún taller
  tenía la fila guardada ni repartos vivos fuera del de prueba, que era la condición para cambiar el
  check de `repartos`.
- **`db:ensayo -- --seed`** en verde: 40 archivos y 1.461 tests de pgTAP, con
  `39_los_tipos_de_tesoro.sql` nuevo (83) y 03, 17, 19, 36, 37 y 38 al día (82, 33, 21, 44, 49 y 86), y
  el dominio contra SQL con el seed. `sb db push` aplicó las seis migraciones. Después, el check de
  `repartos` quedó validado con su nombre de siempre, las dos columnas nuevas y el default de los avisos
  estaban, y `authenticated` no puede ejecutar ninguna de las gemelas. Los advisors dan los mismos ocho
  avisos de antes.
- **La suite de `@maun/db` contra la base migrada**: 18 archivos y 283 tests, con los dos casos de
  concurrencia nuevos.
- **El comparador**, con 21.295 casos de la fila (escala 2), las liquidaciones y el libro: ninguna
  diferencia. Para ver que detecta, se probaron 14 mutantes de las gemelas (una obligación redondeada
  hacia abajo o sin el tope de lo que llega, la base `cobrado` leída como `ingreso`, una parte sin su
  tope, el previo sin el piso de la meta, un saldo negativo como previo, el diezmo de un perdido sin
  mirar `perdido_con_diezmo`, lo que vio la app sin mirar las partes, entre otros) y 4 de `liquidar`
  (congelar lo que vio la app sin ajustar, no leer los saldos del libro, la meta de Cocos sin `ajustes` y
  el diezmo del perdido sin su porcentaje de la fila): los detectó a todos.
- **`@maun/domain`**: 830 tests, 100% de cobertura, los vectores fijos y los 4.000 casos de la fila de
  siempre contra `calcularDistribucion`.
- **La función de avisos**: 21 tests de Deno, 7 nuevos, y desplegada el 2026-09-28.

**Un cobro de punta a punta** en el taller de la cuenta de prueba, con un script que arma el pedido con
las mismas funciones que la app (`entradaDeLaLiquidacion`, `calcularPorLaFila` y `pedidoDeLaFila`) y lo
manda como ese usuario. La fila: Ingresos Brutos al 3,5% sobre lo cobrado, antes del diezmo al 10% sobre
el ingreso; Gastos fijos, un compromiso que se renueva al pagar, con el alquiler de $ 500.000, que vence
el 10, y la luz de $ 400.000; Inmueble, un ahorro del 20% hasta su meta de $ 300.000, que ya tenía
$ 250.000; y el superávit en un tesoro «Superávit».

- El primer cobro, $ 2.500.000 con $ 500.000 de gastos: Ingresos Brutos $ 87.500, diezmo $ 191.250,
  Gastos fijos $ 900.000, Inmueble $ 50.000 (le tocaban $ 164.250) y el superávit $ 771.250. `p_previo`
  llevó Gastos fijos en cero e Inmueble con su tope de $ 50.000, y `dist_previo` quedó igual. `repartos`
  quedó con cuatro filas, en este orden: la obligación (`base` `cobrado`), el paso (`modo` `saldo`), la
  parte (tope $ 50.000) y el superávit. En `libro_mayor`, el cobro entra a Maun, el gasto sale de Maun,
  el diezmo pasa de Maun al Diezmo y cada reparto, de Maun a su tesoro.
- El pago del alquiler, un gasto de $ 500.000 desde Gastos fijos con la categoría «Alquiler», lo bajó a
  $ 400.000.
- El segundo cobro, $ 1.000.000 sin gastos: Ingresos Brutos $ 35.000, diezmo $ 96.500, Gastos fijos se
  renovó con $ 500.000 (volvió a $ 900.000), Inmueble $ 0 (ya estaba en su meta) y el superávit
  $ 368.500.

Después se reabrieron y se borraron los dos trabajos, el taller volvió a la fila de siempre y se
archivaron los cuatro tesoros de la prueba: quedó sin fila, con los cuatro de siempre y sin repartos ni
movimientos vivos de la prueba.

**Razonado y no probado**: que el caso de concurrencia del movimiento con su trabajo falla si el
trigger toma los locks al revés, y que ningún cobro real cayó entre una migración y la siguiente (el
bundle de producción cobra por el camino de antes, que no usa las gemelas, y ningún taller tenía fila).

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
- ARBA y el monotributo unificado (iProfesional, «ARBA publicó los nuevos montos del monotributo
  unificado desde agosto 2026», 6 de agosto de 2026), consultada el 2026-09-28 y citada en «Los tipos de
  tesoro de Eliseo»:
  https://www.iprofesional.com/impuestos/461356-monotributo-unificado-buenos-aires-cuanto-pagas-con-los-nuevos-importes-de-arba

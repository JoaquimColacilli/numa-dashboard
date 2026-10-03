# 0084. Las estadísticas del taller

- Estado: aceptada
- Fecha: 2026-10-03
- Completa al [0009](0009-velocidad.md) (`cambios_de_estado` entra a la réplica, medido), al
  [0018](0018-finanzas-el-diezmo-y-los-movimientos-a-mano.md) (el gris de contexto en la comparación del
  mes), al [0045](0045-los-costos-estimados-lo-que-hace-falta-y-mover-en-la-agenda.md) (los gastos reales
  con las categorías de los costos estimados), al
  [0046](0046-la-vista-del-cliente-una-lista-blanca-en-la-base.md) (los cambios de etapa viajan y avisan),
  al [0057](0057-las-opiniones-de-los-clientes.md) (`PuntosPorPersona` y la barra repartida en
  `entities`), al [0062](0062-el-reparto-en-la-compu.md) (los gráficos son contenedores en todos los
  anchos), al [0068](0068-la-mesa-y-el-plano.md) (la escena `sin-estadisticas`) y al
  [0071](0071-la-entrega-y-sus-fechas.md) (la tarjeta del analítico arma su frase con el catálogo).
- Los textos van en los tres idiomas del [0082](0082-la-app-en-tres-idiomas.md), y la plata respeta las
  monedas del [0081](0081-los-tesoros-en-dolares.md) y el [0083](0083-los-trabajos-en-dolares.md): nunca
  se suman pesos con dólares.

## Contexto

En el tablero de Miro, Eliseo escribió:

> pagina de estadisticas interna (tiempo promedio de entrega, dinero gastado, ganancias, materiales mas
> usados... etc)

Joaquim sumó mezclar lo que opinan los clientes con lo interno. La especificación y la maqueta se armaron
sobre `main` en `44ae686` con una investigación de los datos del taller, de lo que miden los productos de
oficios y de manufactura, de cómo se diseñan los tableros y de once formas de dibujar los gráficos.

Hasta acá la app contaba un mes por vez (Inicio, Finanzas) o una cosa por vez (el analítico de entregas,
Resultados). No había un lugar que dijera cómo viene el taller, ni dos datos que hacen falta para contarlo:
qué fue una consulta y cuándo se mandó su presupuesto (`cambios_de_estado` existía en la base desde el
2026-09-18, pero no viajaba al aparato), y en qué se gastó la plata de un trabajo (los gastos tenían solo
una descripción libre).

## Decisión

### Seis preguntas, con un resumen arriba

Una página, `/estadisticas`, de primer nivel, que responde seis preguntas del dueño, numeradas como las
piezas de un plano. Cada sección dice su respuesta en una frase y después la muestra.

|     | Pregunta                           | Lo que pidió                          | Responde con                                                                |
| --- | ---------------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| —   | Resumen                            | ganancias, y la puerta a lo demás     | «Lo que te dejaron los trabajos» y cuatro tarjetas que llevan a su sección  |
| ①   | ¿Cuánto me dejaron los trabajos?   | ganancias                             | mes por mes, y lo que estimaste contra lo que te quedó                      |
| ②   | ¿En qué se me va la plata?         | dinero gastado, materiales más usados | lo gastado por categoría, en los trabajos y en el taller, y lo que más usás |
| ③   | ¿Llego a tiempo?                   | tiempo promedio de entrega            | cuántos días tardó cada trabajo, cuántos a tiempo, por tipo                 |
| ④   | ¿Cuántos presupuestos me aprueban? | (de los productos de oficios)         | de la consulta al presupuesto y al trabajo, y cuánto tarda cada paso        |
| ⑤   | ¿Qué opinan mis clientes?          | opiniones                             | conformes con el mueble, con los tiempos y con el trato                     |
| ⑥   | ¿Qué viene?                        | (de los productos de oficios)         | lo que está en curso contra lo que tarda normalmente, y lo que le deben     |

**Por qué esas palabras.** «Ganancias» no se usa: en la fila, ganancia es lo que queda después de los
compromisos, e ingreso es lo cobrado menos los gastos de un trabajo. Lo que pidió es el ingreso, y la página
lo dice como él: «Lo que te dejaron los trabajos». «Promedio» tampoco: el tiempo de entrega va como mediana,
dicha en palabras («la mitad de los trabajos tarda menos»), porque un trabajo que se estiró mueve el
promedio y no la mediana. Las preguntas van en primera persona porque son las suyas.

### La fecha de cada pregunta

Un trabajo aprobado en agosto, entregado en septiembre y cobrado en octubre cae en un mes distinto según la
pregunta. Cada sección usa una y la dice en su subtítulo:

| Sección             | Qué cuenta                                               | Por qué fecha                                            |
| ------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| Resumen y ①         | las liquidaciones: cobrados y perdidos con seña retenida | `proyectos.fecha_cobro`                                  |
| ②                   | los gastos de los trabajos y los del taller              | `gastos.fecha` y la del movimiento                       |
| ② «Lo que más usás» | lo anotado en «Lo que hace falta»                        | el alta de la necesidad, en el día del taller            |
| ③                   | los entregados                                           | `proyectos.fecha_entrega`                                |
| ④                   | las consultas que entraron                               | el día del alta en `cambios_de_estado` (`desde` en null) |
| ⑤                   | las encuestas mandadas                                   | `encuestas_enviadas.enviada_at`, en el día del taller    |
| ⑥                   | lo que está en curso y lo que te deben                   | hoy; no depende del período                              |

Los instantes pasan al día con `diaLocal`; las fechas quedan como texto y los meses como `AAAA-MM`.

### Las definiciones y sus ataduras

- **Lo que te dejaron**: por liquidación, `dist_cobrado − dist_gastos`, lo mismo que `filaDelMes` llama
  `ingreso`. **Atadura**: la cifra de un período es la suma de los `ingreso` de sus meses (test del dominio).
  Los perdidos entran por su seña y se cuentan aparte; los trabajos en dólares, por sus pesos.
- **De cada $ 100**: `Σ neta / Σ cobrado`, ponderado, nunca el promedio de los porcentajes.
- **Lo que estimaste y lo que te quedó**: solo los cobrados con las cuatro categorías estimadas; con una
  sola, `calcularMargen` toma las demás como cero y el margen sale inflado.
- **Gastaste**: en los trabajos, las filas de `gastos` por su fecha y su categoría; en el taller, los gastos
  desde Maun por su categoría. **Atadura**: lo de los trabajos es la suma de `gastos` del período.
- **Lo que más usás**: las necesidades de tipo material y herraje de los trabajos aprobados, por nombre
  normalizado: en cuántos trabajos aparece. Cuenta veces, no plata.
- **Tiempo de entrega y a tiempo**: `analisisDeEntregas` de `analitico.ts` sobre los entregados del período.
  **Atadura**: en «Todo», ③ da lo mismo que el analítico.
- **Las consultas**: la cohorte de proyectos cuya alta en `cambios_de_estado` es un estado de consulta;
  llegó al presupuesto si tuvo un cambio que cumple `seMandaElPresupuesto` o llegó a `en_curso`; dónde está
  hoy, por su estado. Cada tiempo dice su base («mediana de 12»).
- **Conformes**: los dos pasos de arriba de la escala de cinco, con los datos de Resultados
  (`datosDeLasOpiniones`).
- **Lo que viene**: los en curso con su estado (Listo, Atrasado N días, Pasó los N días) y lo que te deben,
  por moneda, nunca sumadas.
- **Cada lista suma lo mismo que su cifra** (test). El dominio no escribe frases: devuelve números, modos y
  códigos, y la página las arma con el catálogo.

### Los umbrales

La pantalla no compara contra un número: lee el modo que devuelve el dominio. Los que existían se importan
de `analitico.ts` y `opiniones.ts`; los nuevos viven en `estadisticas.ts`.

| Qué se muestra                       | Desde                           | Antes                               | Umbral                                   |
| ------------------------------------ | ------------------------------- | ----------------------------------- | ---------------------------------------- |
| Mediana con mínimo y máximo          | 5 casos                         | los casos de a uno                  | `UMBRAL_MEDIANA`                         |
| El embudo con barras                 | 10 consultas                    | solo los puntos de los presupuestos | `UMBRAL_DEL_EMBUDO` (= `UMBRAL_CUENTAS`) |
| Porcentaje, siempre con su «k de n»  | 20 casos                        | «k de n» con los puntos             | `UMBRAL_PORCENTAJE`                      |
| Opiniones con la barra de Resultados | 12 respuestas                   | un punto por persona                | `UMBRAL_BARRAS`                          |
| Cambio en % de lo que te dejaron     | 5 liquidaciones en cada período | la cifra del anterior, en plata     | `UMBRAL_DE_COMPARACION`                  |
| Un punto por presupuesto en ④        | hasta 40                        | una barra de tres tramos            | `PUNTOS_DE_LA_TASA`                      |
| Lo que tarda normalmente, en ⑥       | 5 entregas en 12 meses          | sin «Pasó los N días»               | `UMBRAL_MEDIANA`                         |

### La inflación, y el índice en el código

**Lo que pasó en un período va como pasó; todo lo que compara meses va en pesos de hoy.** Como pasó: la
cifra, lo gastado, las listas y sus sumas, así coinciden con Inicio, Finanzas y la ficha. En pesos de hoy:
el cambio contra el período anterior (un porcentaje), las columnas mes por mes de ① y del resumen, y la
columna «En pesos de hoy» de su tabla. La cuenta: `monto × IPC[base] / IPC[mes]`, redondeado al peso, con
la base en el último mes publicado; los meses posteriores a la base (a lo sumo dos) van como están. **Con
el índice viejo** (su último mes, anterior al mes en curso menos dos) no se deflacta nada, las columnas
dicen «en pesos de cada mes» y la (i) lo dice: un índice a medias es peor que ninguno.

**El índice va con el código**: es igual para todos los talleres, cambia una vez por mes y la página tiene
que andar sin señal. `packages/domain/src/ipc.ts` lo genera `pnpm --filter @maun/db db:ipc` desde el CSV del
INDEC (`serie_ipc_divisiones.csv`, región Nacional, «Nivel general», base diciembre 2016 = 100), con la API
de datos.gob.ar de respaldo. No corre en `pnpm verify` (usa la red); su lector se prueba sin red con un CSV
de muestra y falla en voz alta si cambia la forma.

- **Hoy**: el CSV respondió el 2026-10-03 (`;`, coma decimal, `Periodo` AAAAMM, latin-1): 117 meses, de
  2016-12 a **2026-08** (12.276,766).
- **Contra la serie de control del pedido** (la API, leída hasta marzo de 2025): coinciden, salvo que el CSV
  publica mayo a noviembre de 2024 con tres decimales (mayo, 6.073,717 contra 6.073,7). El control va con
  tolerancia. La API no se corta en marzo de 2025: devuelve cien filas por defecto, y con `limit=1000` trae
  las 117.
- **Cómo se actualiza**: el INDEC publica el IPC de un mes a mediados del siguiente. Quien prepare un PR
  después de esa fecha corre `db:ipc` y, si cambió, lo commitea solo («el ipc suma septiembre»). Está en
  `AGENTS.md`.

### `cambios_de_estado` en la réplica

Es la única fuente de qué fue una consulta, a qué etapa llegó un perdido y cuándo se mandó un presupuesto
antes del 2026-10-01. La migración `las_etapas_en_la_replica` le cuelga `avisar_los_cambios`, la suma a
`bootstrap()` y a `delta()`, y corrige los `comment on table` de ella y de `cambios_de_fecha`.

- **Apartamiento del «mismo molde»: `bootstrap()` manda solo las filas de trabajos vivos.** La tabla no tiene
  borrado lógico (su `deleted_at` no se usa). Contado en producción, en solo lectura: la cuenta de prueba
  tenía 51.663 filas, 51.656 de trabajos borrados por los e2e; con el molde literal cada `bootstrap()` suyo
  llevaría unas cincuenta mil filas de trabajos que la réplica no tiene. El taller de Eliseo tenía 38 filas
  de 14 trabajos, todos vivos. `delta()` queda con el molde de siempre: una fila nueva solo nace de un
  trabajo vivo.
- **Un delta no crea una tabla que la réplica guardada no tenía.** Con cambios en la cola, la sincronización
  pide un delta; si ese delta creara `cambios_de_estado`, la tabla quedaría con lo de los últimos minutos y
  `necesitaReconcile` ya no la vería faltar hasta el reconcile de las 24 horas. En modo delta, `aplicarLote`
  saltea las tablas que la réplica previa no tenía, y el próximo sync sin cola pide `bootstrap()`. No se
  subió `VERSION_CACHE`: tiraría la réplica guardada y, sin señal, la app quedaría sin datos.
- **El tamaño**, con `db:medir` (que siembra cada trabajo con cinco cambios de etapa) antes y después, en
  milisegundos de la base y en bytes:

  | Filas  | `bootstrap()` antes        | después                    | gzip antes | gzip después     |
  | ------ | -------------------------- | -------------------------- | ---------- | ---------------- |
  | 288    | 48–61 ms, 404 KB           | 48,5 ms, 433 KB            | 25 KB      | 27 KB            |
  | 2.400  | 115–175 ms, 1.607 KB       | 110–142 ms, 1.840 KB       | 104 KB     | 120 KB (+15 %)   |
  | 24.000 | 6.063–11.543 ms, 13.915 KB | 9.208–11.453 ms, 16.255 KB | 860 KB     | 1.025 KB (+19 %) |

  Contra los umbrales del 0009: a diez años (24.000 filas) el gzip cruza el de 1 MB por poco; el de 500 ms en
  la base ya estaba cruzado a esa escala antes de este cambio (el 0009 midió 785 ms el 11/9; hoy da 6 a 11 s,
  sin investigar). Al volumen real no cambia nada que se note: el `bootstrap()` de Eliseo pasó de 182.064 B a
  195.889 B, con sus 38 filas nuevas.

- **La medición de 100.000 filas reinició el Postgres de producción** el 2026-10-03 (01:37:59), y una
  lectura de siete días de `delta()` de la cuenta de prueba, otra vez (02:22:56). Ninguna fila quedó y los
  datos de Eliseo siguieron intactos. Desde acá `db:medir` se corre con escalas explícitas y de a una
  (288, 2.400, 24.000), y un `delta()` a mano, con la ventana de minutos que pide la app.
- **El orden del deploy**: las dos migraciones se aplicaron el 2026-10-03 a las 02:15:22, antes que el
  bundle que las lee. La app de `main` contra la base migrada se verificó en solo lectura: deja pasar la
  clave nueva y no pide reconcile.

### La categoría de los gastos

La migración `la_categoria_de_los_gastos` suma `gastos.categoria`, nullable, con un `check` de cinco
valores: las cuatro de los costos estimados (madera, herrajes, flete, ayudante) y `otro`, para poder comparar
lo estimado con lo gastado más adelante. Null es «sin categoría»: todo lo cargado antes y lo que se cargue
sin elegir. `guardar_proyecto` la lee solo si el pedido trae la clave, con el molde de `p_pagos`: un bundle
viejo no la manda y no puede borrar la que eligió uno nuevo. «Sin elegir» viaja como null, y la función igual
lee `nullif(btrim(categoria), '')`, porque un `''` rechazado por el `check` sería un rechazo definitivo que
tapa la cola. El formulario del trabajo suma un `select` nativo por renglón, sin nada elegido de antemano, y
la ficha la muestra. El libro de Finanzas y `libro_mayor` no cambian.

### La página

- **El reparto** es el de Finanzas: `PrincipalYApoyo` con `apoyoPrimero` y `amplio`, el resumen en el apoyo
  (corto, fijo y pegado) y las seis secciones en el principal, una debajo de otra. **La primera pantalla del
  celular** (390 × 844, con la barra de abajo) muestra el título, el período, la cifra y las cuatro tarjetas:
  medido en el e2e, quedan 40,2 px entre la última tarjeta y la barra.
- **El período vive en la dirección** (`?meses=3|6|12|todo&hasta=AAAA-MM`): cambiarlo reemplaza la entrada
  del historial (atrás vuelve a donde venías) y no mueve el scroll, y volver de un trabajo devuelve el mismo
  período. Un parámetro que no se entiende se ignora.
- **Los gráficos son SVG y HTML a mano** en `shared/ui/graficos`, dibujados al ancho que mide
  `ResizeObserver`, sin un `viewBox` que escale el texto. **Cada gráfico decide por su ancho, con su propio
  `@container`, en todos los anchos**: no es un reparto sino un dibujo que se adapta, como `con-lamina`.
  Debajo de 20 rem de contenedor el ranking de ② pone el monto al lado del nombre y la barra abajo, y el
  primer mes de las columnas chicas termina en el borde del dibujo. El eje de las columnas de ① mide 38 px o
  lo que pida su rótulo más largo («ARS 2 M», en inglés y en portugués, no entra en 38), y el valor de la
  columna más alta se corre para no meterse en él.
- **Explorar sin hover**: cada gráfico que se explora es un `listbox` con una parada de Tab, flechas, Inicio,
  Fin, Enter y Escape; la columna entera toma el toque (24 px de banda como mínimo), `touch-action: pan-y`, y
  `pointerleave` solo borra con el mouse. Cada figura lleva su `figcaption` y su tabla gemela detrás de «Ver
  los números».
- **El gris de contexto**, `--color-contexto`: `#8f8f8f` en claro y `#707070` en oscuro, para lo que
  acompaña a lo que importa (los meses de antes del período). El validador de paletas de la casa, sobre el
  papel: claro `#8f8f8f,#141414 --ordinal --mode light --surface #ffffff` → «ALL CHECKS PASS», 3,23:1; oscuro
  `#707070,#ededed --ordinal --mode dark --surface #171717` → «ALL CHECKS PASS», 3,62:1. Lo usa también la
  comparación del mes de Finanzas, cuyo gris de borde daba 1,41:1.
- **Nada se mueve al montarse** ni al cambiar de período, y no hay esqueleto: la página sale de la réplica.
- **Los textos** van en `paginaEstadisticas` de los tres idiomas, con sus centinelas y las palabras nuevas
  del glosario. `plataCompacta` («$ 1,1 M») marca lo que escribe cuando el seudoidioma está prendido, como
  los formateadores de fechas, y el dibujo de las pesas, que lleva títulos de trabajos, va dentro de un
  `translate="no"`: en SVG el atributo no vale y se hereda del HTML de arriba.
- **Decisiones de la página que la especificación no tomaba**: lo que se abre en el lugar lleva
  `chevron-down` y `chevron-up` con `aria-expanded` (la flecha de la maqueta queda para lo que lleva a otra
  pantalla); ③ tiene su lectura arriba de los puntos, como pide el toque; «Probá con 6 o 12 meses» sale solo
  si esa sección tiene datos antes del período; si el rótulo de la cota de ③ no entra entre sus flechas, va
  debajo; los grupos de los presupuestos alinean su cuenta aunque uno esté vacío; la columna de los montos de
  ② crece con el más largo; el embudo usa los aprobados y la frase, los que hoy son trabajo; «Ver los
  números» de ④ son dos tablas; las tarjetas de ④ y ⑤ desde 20 casos dicen el porcentaje arriba y la cuenta
  abajo («16 de 20 presupuestos · 4 esperan»); la figura «Lo que más usás» se nombra por su título, sin el
  botón de su ayuda; y la página recibe el índice por prop, para que los tests lo fijen.
- **El vacío** es `EstadoVacio` con la escena `sin-estadisticas`: tres columnas de trazos con su cota, sin
  número.
- **La navegación**: en la compu, entre Diezmo y Ajustes; en la tablet, el noveno del riel (a 1024 × 768
  quedan 72 px entre Estadísticas y Ajustes); en el celular, el segundo renglón de la hoja del perfil; y dos
  accesos quietos, en Inicio («Cómo viene el taller») y debajo de la comparación de Finanzas.

### El cálculo y el peso

**En el hilo principal, con selectores puros memoizados por la réplica**; cambiar el período solo recorta y
suma. Medido el 2026-10-03 en Chromium 153 con un bundle de las funciones de la página tal cual, con la CPU
a 1× y frenada 4×. «Fría» es la primera pasada en una página nueva; «mediana», de nueve:

| Réplica                                | Filas  | 1× fría  | 1× mediana | 4× fría    | 4× mediana | 4×: cambiar a 6, 12 o Todo |
| -------------------------------------- | ------ | -------- | ---------- | ---------- | ---------- | -------------------------- |
| un año (sintética de la investigación) | 2.910  | 12–13 ms | 4 ms       | 51–55 ms   | 18 ms      | 1,4 / 2,0 / 6,8 ms         |
| diez años (la misma semilla)           | 26.551 | 75–86 ms | 48–60 ms   | 303–477 ms | 209–236 ms | 6,5 / 13 / 75–78 ms        |
| el taller de prueba, con muchos datos  | 1.073  | 9 ms     | 1,5 ms     | 36–47 ms   | 7,5–7,9 ms | 1,2 ms                     |

De la primera pasada de un año a 4×, 38 ms son armar la base (`baseDeLaReplica`) y 14 el período. Ver la
objeción sobre los 50 ms.

**El peso**: `index` pasa de 1.116.925 B (293.902 B con gzip) a 1.179.678 B (311.080 B): +17,2 KB
comprimido, la página entra sin `lazy` como pide la especificación. `vendor` crece 213 B. No se sumó ninguna
dependencia: ni una librería de gráficos, ni de fechas, ni de estadística.

### La calidad de los datos

| Trampa                                                                                                                    | Qué hace la página                                                                |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Lo del sistema viejo no tiene `fecha_entrega` ni fila de alta en `cambios_de_estado`                                      | no entra en ③ ni en ④; sí en ① y ②, y la (i) de ③ y de ④ dice desde cuándo cuenta |
| Lo migrado pudo entrar con los gastos incompletos (ADR 0017)                                                              | se muestra como está                                                              |
| `listo_el` y `fecha_entrega` son el día del toque; `ocurrio_el` y el alta de una necesidad, el día en que llegó a la base | se usa como está: lo que esperó sin señal queda con el día del sync               |
| `fecha_inicio` es editable y heredada                                                                                     | como en el analítico                                                              |
| Pagos anteriores a la apertura cargados después (ADR 0063)                                                                | no afectan: se cuentan liquidaciones por `fecha_cobro`, no pagos                  |
| Trabajos borrados                                                                                                         | no existen para la réplica ni para la página                                      |
| La encuesta no es anónima y las notas salen altas (ADR 0057)                                                              | la (i) de ⑤ lo dice                                                               |
| Meses sin registro                                                                                                        | no se dibujan como cero: «sin registro»                                           |

## Lo descartado

- **Pestañas en Finanzas, Proyectos y Opiniones** en vez de una página: no dejan ver cómo viene el taller de
  un vistazo. El analítico queda como el detalle de ③ y no se muda.
- **Un tablero de tarjetas sueltas, o uno personalizable**: cada gráfico responde una pregunta y la frase dice
  la respuesta; Eliseo no es analista.
- **Un panel de detalle a la derecha, o las secciones en dos columnas**: más estado para poco, y alturas
  dispares que el test del reparto marca como hueco.
- **Ventanas móviles en días** y **mes contra mes como titular**: no se nombran, y mes contra mes es ruido y
  mezcla la inflación.
- **Inferir el embudo del estado de hoy** (no distingue un trabajo creado aprobado de una consulta aprobada
  directo), **las revisiones del presupuesto solas** (existen desde el 2026-10-01 y solo lo armado en la app)
  y **un RPC** (la pantalla dejaría de salir de la réplica y tendría estado de carga).
- **Adivinar la categoría por la descripción** (depende del idioma y de cómo escribe cada uno) y **hacerla
  obligatoria** (frena la carga).
- **Una tabla del índice en la base con una función programada** (la primera tabla de la réplica que no es de
  un taller, y más piezas en producción), **el dólar como vara** (no es neutral) y **no ajustar** (un año de
  inflación se lee como crecimiento).
- **Recharts, ECharts, Nivo, MUI X** (peso, animaciones al montarse que el ADR 0074 no deja, accesibilidad),
  **canvas** (pinta negro con `var()`) y **un Worker** (copiarle la réplica bloquea más que calcular).
- **Promedios, porcentajes con pocos casos, cajas y bigotes, histogramas con menos de 30.**
- **Una paleta de series** (la página no la necesita) y **los colores de los tesoros** (son para la plata, y
  solo por el canto).
- **Días hábiles**: los días corridos se verifican con un almanaque y no dependen de una lista que cambia por
  decreto.

## Lo que queda para después

| Qué                                                            | Por qué no ahora                                         | Qué haría falta                                             |
| -------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| Por qué se pierden los trabajos                                | pide un dato nuevo al cerrar el perdido                  | un motivo corto al cerrarlo                                 |
| De dónde vienen las consultas                                  | `clientes.origen_contacto` nace vacío y es del cliente   | preguntarlo al crear la consulta y guardarlo en el trabajo  |
| El mismo período del año anterior                              | hace falta un año de historia propia                     | habilitarlo con 13 meses, en pesos de hoy                   |
| Cambios en las tarjetas y banda de lo normal                   | con un par de entregas por mes es casi siempre ruido     | 10 casos por período para la flecha y 6 meses para la banda |
| Lo estimado contra lo gastado por categoría                    | las categorías nacen con este cambio                     | trabajos cobrados con gastos categorizados                  |
| Proveedores, cantidades y precios                              | `gastos` y `necesidades` no los tienen                   | columnas nuevas y otra captura                              |
| Lo pagado desde los tesoros de la fila en ②                    | no se sabe qué tesoro es del taller                      | marcar los tesoros del taller                               |
| Una vista en dólares                                           | casi no hay trabajos en dólares y el dólar no es neutral | una vista aparte, con la cotización de cada pago            |
| Días hábiles con feriados                                      | la lista cambia por decreto y pesa                       | una lista por año, a mano, en el dominio                    |
| Exportar, metas, semáforos, rankings de clientes, proyecciones | no llevan a una decisión o exponen datos personales      | —                                                           |

## Objeciones

Se implementó lo pedido. Quedan anotadas:

1. **El cambio en % de ① desde 5 liquidaciones por período.** La misma especificación deja las flechas de
   las tarjetas para después porque «con un par de entregas por mes, un trimestre contra otro es casi siempre
   ruido» y pide 10 casos por período. El porcentaje de ① es el número más grande de la página y con 5 casos
   un solo trabajo grande lo mueve mucho. Usaría 10, o el porcentaje con su base al lado.
2. **Los 50 ms del 0009, con un año a 4×.** La mediana queda en un tercio (18 ms), pero la primera pasada en
   una página en blanco da 51 a 55 ms. La especificación dice que si pasa, primero se parta el cálculo por
   sección; no lo partí: el resumen de arriba usa las cinco secciones a la vez, así que el primer render las
   calcula igual, y lo que pesa es armar la base, que es común. En la app la primera pasada debería ser más
   corta (Inicio y Proyectos ya calentaron `filasDe`, los totales y el analítico). Si se mide en el celular y
   pasa, lo que sirve es armar la base en un momento ocioso o memoizarla junto a la réplica.
3. **Los meses del período, «siempre», a 320–390 px.** Con «sept» en el período, los rótulos en negrita
   quedan a uno o dos píxeles a 360 y 390, como «abr may jun*» en la maqueta, y a 320 se tocan
   («septoct*»). Esconder uno cuando no entra con aire dejaría «sept» sin nombre a 390, y la especificación
   pide los tres; mostrar menos meses de antes cuando los del período no entran los dejaría a todos, pero a
   390 cambiaría los doce meses de la maqueta. Quedó como la maqueta.

## Consecuencias

- La réplica suma unas seis filas chicas por trabajo en toda su vida.
- Una pantalla nueva que compare meses usa pesos de hoy con `IPC` y su regla del índice viejo, y alguien
  tiene que correr `db:ipc` una vez por mes.
- Los gráficos nuevos van en `shared/ui/graficos`, reciben datos y textos ya armados y deciden por su ancho;
  la geometría vive en `shared/lib/graficos.ts`, con sus tests.
- `e2e/reparto/pantallas.ts` suma una excepción con su motivo: en un ranking angosto la barra, que es un
  dibujo `aria-hidden`, baja a su propio renglón debajo del nombre y del monto.

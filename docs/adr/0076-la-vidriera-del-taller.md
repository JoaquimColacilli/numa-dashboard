# 0076. La vidriera del taller

- Estado: aceptada
- Fecha: 2026-09-26
- Completa al [0046](0046-la-vista-del-cliente-una-lista-blanca-en-la-base.md) (la lista blanca suma la
  vidriera, que viaja en todas las etapas), al [0039](0039-archivos-de-los-trabajos.md) (una carpeta más
  en el bucket `archivos`, y el espacio que comparten) y al
  [0010](0010-sincronizacion-replica-completa.md) (`MN022`, y la tabla de rechazos puesta al día).
- Enmienda al [0068](0068-la-mesa-y-el-plano.md): «Tu mueble» va apilada en todos los anchos (§5 y su
  objeción).
- Sigue al [0074](0074-lo-que-responde-al-tocar.md): el carrusel no se mueve solo ni se arrastra, y la
  página del cliente sigue quieta.

## Contexto

Joaquim, sobre la página que ve el cliente, en el mismo pedido que el
[0075](0075-la-app-abre-sin-pantalla-en-blanco.md):

> En lo que ve el cliente me encanta la parte de arriba, el dibujo y el texto. Pero cuando el texto es
> muy largo, al dibujo le queda demasiado margen arriba y abajo. Pensé en filas en vez de columnas: el
> dibujo arriba y el texto abajo.

> En la página de seguimiento del cliente, mostrar «publicidad» de otros trabajos (la palabra es mía).

Eliseo lo había escrito así:

> Link a IG (o a carrusel de fotos de IG…), iconitos de redes en algún sitio, botón compartir para que
> desde el seguimiento puedan compartir mi insta.

La landing con trabajos de muestra y el código para entrar desde afuera quedaron para después. Lo que
entra es un carrusel en la página del cliente, con las redes y las fotos que el dueño arma en Ajustes:
fotos nuevas o de las que ya subió a sus trabajos. En la compu, en la columna de la derecha, abajo de lo
que ya hay; en el celular, abajo de todo.

## Decisión

### 1. «Tu mueble», apilada

Desde 40rem de tarjeta, `TarjetaConLamina` pone la lámina al lado del texto, estirada al alto de la
columna de texto (`h-auto` con `min-h-70`), con el dibujo centrado y de ancho fijo. En `/v/` a 1440 la
tarjeta mide 676 px, y con un título de dos renglones y la entrega comprometida el texto quedaba en una
columna angosta: el título en seis renglones, el titular en seis y los tres montos partidos en dos filas,
con el dibujo flotando en una lámina estirada a los 824 px de la tarjeta. Era la objeción que el 0068
había dejado anotada.

- **`TarjetaConLamina` suma `apilada`**, en `false` por defecto: los otros quince lugares que la usan no
  cambian. Con `apilada` la grilla es de una columna en todos los anchos: la lámina arriba, de 196 px
  (`h-49`) por debajo de 40rem de tarjeta y 240 px (`h-60`) desde 40rem, sin `h-auto` ni `min-h-70`; el
  texto abajo, arrancando arriba, sin `justify-center` y con el relleno del celular en todos los anchos,
  que lo alinea con las otras tarjetas de la página.
- **«Tu mueble» la usa.** El dibujo sigue en `w-56` y `w-72`: en 240 px de lámina, con sus 12 px de
  relleno, entra justo. El texto, su orden, la región, el `h1` y los montos no cambian, y la vista de
  adentro de la app es el mismo componente.
- **Medido** (el alto de la tarjeta, con un texto corto y con el largo de verdad): a 390 y a 1024 no
  cambia nada, porque ahí la tarjeta mide menos de 40rem (358 y 576 px) y ya iba apilada. A 1440, el
  largo pasa de 824 a 710 px, con el título y el titular en tres renglones cada uno y los montos en una
  fila; el corto pasa de 428 a 543 px, porque la lámina ahora va arriba y no al lado (ver «Objeciones»).

### 2. La base

Una migración aditiva, `20260926120000_la_vidriera_del_taller.sql`.

- **Tres columnas en `ajustes`**: `instagram_link`, `facebook_link` y `tiktok_link`,
  `text not null default ''`, con su `check`, su `comment` y su `grant update`, como el link de cobro. El
  `check` acepta vacío o la forma canónica y nada más, porque el texto se vuelve un enlace en una página
  pública:
  - Instagram: `https://www.instagram.com/<usuario>/`, con `[a-z0-9._]{1,30}`, y el primer segmento que
    no sea `p`, `reel`, `reels`, `stories`, `explore`, `accounts`, `direct` ni `tv`;
  - TikTok: `https://www.tiktok.com/@<usuario>`, con `[a-z0-9._]{2,24}`;
  - Facebook: `https://www.facebook.com/profile.php?id=<5 a 20 dígitos>`, o
    `https://www.facebook.com/<nombre>` con `[a-z0-9.]{5,50}` que no sea `share`, `sharer.php`,
    `people`, `story.php`, `photo.php`, `permalink.php`, `groups`, `events`, `watch`, `marketplace`,
    `login` ni `profile.php`. El último no estaba en el pedido: sin él, `profile.php` a secas pasaba
    como el nombre de una página.
- **`archivos` suma la clave única `(household_id, id)`**, que pide la foreign key compuesta de abajo.
  No puede fallar, porque `id` ya es único; antes del `db push` se contó de solo lectura que no había
  repetidos.
- **La tabla `fotos_de_la_vidriera`**, sincronizable: `id` (uuidv7), `household_id`, `orden` (entero
  desde cero), `tipo` (`image/webp` o `image/jpeg`), `bytes` (la foto y su miniatura, hasta 20 MiB, dos
  veces el tope por archivo del 0039), `ancho`, `alto`, `archivo_de_origen` (la foto del trabajo de la
  que salió, o null si se subió para la vidriera, con una foreign key compuesta a un archivo del mismo
  household) y los metadatos. RLS de pertenencia; `select`, y `insert` y `update` de todo lo que manda
  el alta, que es un upsert, nunca de `household_id`; los índices `(household_id, updated_at)` y
  `(household_id, archivo_de_origen)`, `mantener_metadatos` y `avisar_los_cambios`. Entra en
  `bootstrap()`, en `delta()`, en `TABLAS_REPLICADAS` y en los tests de estructura, `anon`, aislamiento y
  sincronización. Una réplica guardada antes de la tabla se lee sin ella, como las de antes de las
  tablas de la entrega.
- **El tope.** `private.cuidar_el_tope_de_la_vidriera` corre antes del alta y antes de un cambio de
  `deleted_at`: si la fila queda viva (un alta o una restauración), bloquea la fila del household
  (`for no key update`) antes de contar, cuenta las vivas sin contarse a sí misma, y con doce rechaza
  con `MN022` («Sacá una foto de la vidriera antes de sumar otra.»). `concurrencia.test.ts` prueba que
  una segunda alta espera a la primera. La app lo frena antes, porque un rechazo definitivo tapa la cola:
  con doce fotos no ofrece sumar y la hoja cuenta los lugares libres. Si igual llega (dos aparatos a la
  vez), `rechazos.ts` lo dice: «Tu vidriera ya tiene 12 fotos».
- **`private.ruta_de_la_vidriera(household, id, tipo, miniatura)`**, gemela de `rutaEnLaVidriera` de la
  app y hecha como `private.ruta_del_archivo`: `{household}/vidriera/{id}.webp` y `{id}.mini.webp`, o
  `.jpg` y `.mini.jpg`.
- **`vista_del_cliente` suma la clave `vidriera`**, con la misma firma y los mismos grants:
  `{ redes: { instagram, facebook, tiktok }, fotos: [{ id, ruta, ruta_mini, ancho, alto }] }`. Las redes
  van en null si están vacías. Las fotos son las vivas, por `orden, created_at, id`, hasta doce, con un
  filtro explícito por el household del trabajo: por el enlace la función corre elevada y la RLS no
  filtra nada, como en las otras subconsultas. Viaja en todas las etapas, porque es del taller y vale
  siempre. `25_vista_del_cliente.sql` clasifica las tres columnas y todas las de la tabla nueva como que
  viajan, y prueba las claves, el orden, el tope, que nunca aparece una borrada y que la foto de otro
  taller no aparece por `vista_compartida` como `anon`. `27_encuesta_publica.sql` las clasifica como que
  no viajan en la encuesta.
- **Los comparadores de los tres links** (`compararLinksDeLasRedes`, en `compararDominioYSql` y en
  `dominio-vs-sql.test.ts`) fueron en el mismo commit que la migración, antes del `db push`: arreglar un
  `check` ya subido sería una migración destructiva.

Lo que le cambió a la base del taller de Eliseo, contado de solo lectura antes y después: su fila de
`ajustes` sumó tres columnas vacías, sus 50 archivos no cambiaron (la clave nueva los cubre), la tabla
nueva nació vacía, y el payload de sus 5 enlaces vivos suma una `vidriera` vacía, que la app publicada
ignora: `leerLote` recorre solo sus tablas y `leerVistaDelCliente` lee solo sus claves. Eso se leyó en el
código antes del `db push`.

### 3. Los binarios

- **Van al mismo bucket, `archivos`, en `{household}/vidriera/`.** Las políticas de `storage.objects` de
  ese bucket solo miran que la primera carpeta sea la del household, así que ya la cubren: no hay bucket
  ni política nueva, y `15_fotos_de_perfil.sql` no cambió.
- **Subir es el camino de los archivos de los trabajos**, que bajó a `entities/archivo` en dos commits:
  primero el movimiento, sin cambiar nada, y después la parametrización (qué se acepta, el mensaje y la
  ruta), porque una feature no importa a otra. La foto se achica a 2000 px con su miniatura de 480, en
  WebP o en JPEG, y se sube con `upsert` y el año de caché. Solo fotos: un PDF se rechaza con su mensaje
  y un video dice por qué no, como en los trabajos.
- **Una foto de un trabajo se copia**, con `copy()` de storage-js, la completa y la miniatura, a las
  rutas del id nuevo (`copiarEnElBucketDeArchivos`). La copia hereda el tipo y el caché. Un «ya existe»
  (o un 409) es el reintento de una copia que ya había entrado, y se da por hecha.
- **Sacar una foto es la baja lógica por la cola, con «Deshacer»**, y el binario se quita del bucket a
  los 6 s, con la misma espera que los archivos de los trabajos (`ESPERA_ANTES_DE_QUITAR_DEL_BUCKET_MS`,
  que ahora vive en `entities/archivo` y usan los dos).
- **El espacio es uno solo**: `espacioUsado` suma las dos tablas, y «Espacio para archivos» dice «Las
  fotos y los PDF de los trabajos, y las fotos de tu vidriera, ocupan…».

### 4. El dominio

`packages/domain/src/vidriera.ts`, con el patrón de `cobro.ts`:

- **Por red, revisar, normalizar y `esLinkDe…`.** `revisarLaRed` devuelve válido (con el link canónico),
  vacío o inválido con su motivo (`otra-red`, `no-es-un-perfil` o `usuario`), y la app tiene un mensaje
  por red y por motivo. Acepta `@usuario`, `usuario` y el link, con o sin `https` y `www` (en Facebook,
  también `m.` y `web.`), con barra final, parámetros y ancla; devuelve la forma canónica en minúscula.
  `esLinkDeInstagram`, `esLinkDeFacebook` y `esLinkDeTiktok` son las gemelas de los `check`.
- **Lo que decidí donde el pedido no alcanzaba**: un link al perfil con una pestaña
  (`instagram.com/taller.maun/reels/`) es el perfil, porque el primer segmento es el usuario; en TikTok,
  un link sin la `@` o un enlace corto (`vm.tiktok.com`, `vt.tiktok.com`) no es un perfil, porque el
  corto es una redirección que no se puede resolver sin red y suele llevar a un video; en Facebook, un
  número solo es `profile.php?id=` con ese número.
- **Cómo se ve cada red**: `@usuario` en Instagram y TikTok, «Facebook» en Facebook
  (`comoSeMuestraLaRed`), y en Ajustes la forma corta (`formaCortaDeLaRed`).
- **El tope y el orden**: `TOPE_DE_LA_VIDRIERA` (12), `lugaresLibres`, `enOrden` (por `orden`, alta e
  id), `ordenAlFinal`, y `moverEnLaVidriera`, que devuelve solo las filas que cambian de `orden`; con
  `orden` repetidos (dos aparatos sumando a la vez) renumera la lista entera. Cobertura del 100 %.

### 5. «Tu vidriera», en Ajustes

- **Después de «Reseñas en Google»**, con la bajada «Lo que ven tus clientes en su página: fotos de otros
  trabajos y tus redes.». Arriba las fotos (el slice nuevo `features/armar-la-vidriera`, sumado a
  `MODULOS_CON_MUTACIONES`) y abajo «Redes» (`FormularioDeRedes`, en `features/configurar-taller`, con
  los de cobro y reseña). La página junta las dos.
- **Las fotos**: arriba, «N de 12»; abajo, una lista en el orden en que las ve el cliente. Cada fila
  tiene la miniatura en 3:4, «Foto N de M», de dónde salió («De «título del trabajo»», «De un trabajo» si
  ese trabajo ya no está, o «Subida para la vidriera», que baja de renglón en vez de cortarse) y tres
  botones de ícono con nombre, «Mover antes», «Mover después» y «Sacar», con `aria-disabled` en las
  puntas y descritos por su fila. Mover cambia el `orden` de las filas que cambian, por la cola y
  optimista, y el foco vuelve al mismo botón de la foto movida. Nada se arrastra. «Sumar fotos» abre la
  hoja; con doce, queda deshabilitado con la razón a la vista. Sin fotos, una línea dice qué ven los
  clientes: nada todavía, o solo las redes.
- **Las redes**: tres campos en `CamposJuntos`, con el patrón de `FormularioDeCobro`: estado por campo,
  el dominio valida, `MUTACION_DE_AJUSTES` manda solo lo que cambió, y cada motivo tiene su mensaje (un
  enlace a una publicación, un reel, una historia, un grupo, un video o un enlace corto dice qué es). Al
  guardar, Instagram y TikTok muestran `@usuario`. La app las lee con `?? ''`.

### 6. La hoja «Sumar fotos a la vidriera»

- **`Hoja` `amplio`**, que en el celular sale desde abajo, con la bajada «Entran N fotos más.». Arriba,
  dos pestañas en un segmentado de un renglón (`FondoDelElegido`), con su semántica: `tablist`, `tab` con
  `aria-selected` y `aria-controls` a un `tabpanel` que existe (el que no se ve va con `hidden`), las
  flechas, Inicio y Fin.
- **«De tus trabajos»**, la elegida al abrir: todas las fotos de los trabajos vivos, desde la réplica, de
  la más nueva a la más vieja, agrupadas por trabajo con su título, cuadradas, en la grilla de la ficha.
  Solo las imágenes con medidas, que la tabla nueva exige; la app se las guarda a toda imagen que sube.
  Cada foto es un `button` con `aria-pressed` y la `Tilde`. Las que ya están dicen «Ya está en tu
  vidriera» y no se eligen (el pedido decía «Ya está»: sobre una foto, solo, no decía dónde). Las que
  nunca se compartieron con su cliente llevan «Sin compartir» con el ojo tachado. El tope son los
  lugares libres: al llenarlos, las demás quedan con `aria-disabled` y la razón a la vista («Elegiste N:
  es lo que entra en tu vidriera.»). Una línea avisa que las ven todos los clientes. Abajo, «Sumar N
  fotos» y «Cancelar».
- **Si entre las elegidas hay alguna «Sin compartir»**, antes de sumar la hoja lo dice una vez, con la
  consecuencia («…el cliente de ese trabajo todavía no la vio. En tu vidriera la ven todos tus clientes,
  también él.»), «Sumar igual» y «Revisar», y el foco va al primero.
- **Sumar copia y encola de a una**, con «Sumando N de M…», y las pone al final en el orden en que las
  eligió. Si se corta la red, para y dice cuántas entraron («Se sumaron las primeras N de las M: se
  cortó la señal. Probá con las demás cuando vuelva.»). Al terminar, un aviso: «Sumaste N fotos a tu
  vidriera.».
- **«Subir nuevas»**: «Elegir fotos», con el camino de arriba. Entran hasta los lugares libres, y lo que
  sobra se dice («…se suben las primeras N»). Esta pestaña no tiene pie: aparece solo con el avance o con
  un problema.
- **Sin señal, ninguna de las dos arranca**, y lo dice con el mensaje de los archivos.

### 7. En la página del cliente

`VidrieraDelTaller`, en `entities/vista-cliente/ui`. Sin fotos ni redes no se dibuja nada. Se llama «Más
trabajos del taller», o «El taller en las redes» si no hay fotos.

- **Dónde**: en la columna de apoyo, después de `ApoyoDeLaVista` y antes de la nota final, que sigue
  cerrando la página; en el celular, abajo de todo, justo antes de esa nota. Es una tarjeta más, de papel
  y de alto fijo: una sola fila de fotos, que no crece con ellas.
- **El carrusel**: el título, con el estilo del de «Cómo pagar», y a su derecha, solo si las fotos no
  entran, «Fotos anteriores» y «Fotos siguientes». Abajo, una `ul` con `role="list"` que se desliza de
  costado con scroll-snap (x mandatory, al inicio, con su scroll-padding) y sin barra. Las fotos van en
  3:4, de 96 × 128 px, con 8 px entre ellas, el radio de la lámina y `bg-surface` mientras cargan; entran
  las que entren y un pedazo de la siguiente, y con pocas no se estiran. Cada una es un enlace a la foto
  completa en otra pestaña, «Foto N de M», con la miniatura adentro (`width` y `height`,
  `loading="lazy"`, `decoding="async"` y `alt` vacío).
- **Los botones** corren un ancho visible de golpe (`scrollBy` con `behavior: 'instant'`), llevan
  `aria-controls` a la lista y `aria-disabled` en las puntas, para que el foco no se pierda. Su estado se
  mide con `scrollend`, con el respaldo de `scroll` más 120 ms, y con `ResizeObserver`: Safari tiene
  `scrollend` recién desde la 26.2. Con el dedo, el deslizamiento es el nativo. Sin autoplay, sin
  `aria-live` y sin `inert`.
- **Con el teclado, una foto que no se ve entera se corre al principio de la tira.** Chromium no corre
  un elemento que se ve en parte al enfocarlo: con seis fotos a 390, Tab dejaba «Foto 4 de 6» con 28 de
  sus 96 px a la vista, y el anillo de foco cortado. No rompía 2.4.11 de WCAG 2.2, que pide que el foco
  no quede tapado entero, pero 2.4.12 (de nivel AAA) pide verlo entero, y a quien usa el teclado le
  costaba ver dónde estaba. La lista escucha el foco y, si la foto enfocada no entra entera,
  `scrollIntoView({ inline: 'start' })`, que respeta el scroll-padding y cae en una posición del
  snap. **Solo con `:focus-visible`**: tocar o hacer click en una foto a medio ver también la enfoca, y si
  la tira se corriera ahí, el toque terminaría en otra foto y no abriría nada. Medido con mouse y con
  toque: abre la foto y la tira no se mueve.
- **Las redes** van abajo, separadas por una línea `border-hairline-soft`. Cada una con su glifo de
  `IconoDeRed` (`@maun/ui`): los trazos de Simple Icons 16.32.0 (CC0), copiados sin tocar, solo el
  `path`, porque sus SVG traen `role="img"` y `<title>`. De 30 px, con 44 para tocar, `aria-hidden` y sin
  la clase `ilustracion`. Instagram y TikTok en tinta; Facebook, el círculo azul (`--color-facebook`,
  `#0866FF`) con la «f» blanca, que sale de un círculo de `--color-paper-fijo` debajo, en los dos temas.
  El de Instagram lleva el glifo y el `@usuario`, y se llama «@usuario en Instagram»; los otros dos, solo
  el glifo, «Facebook del taller» y «TikTok del taller». Todos con `target="_blank"` y
  `rel="noopener noreferrer"`. La fila se parte en dos renglones si no entra.
- **«Compartir»** va al final de las redes, si hay alguna, y comparte la primera (Instagram, después
  Facebook, después TikTok) con `navigator.share({ title: nombre del taller, url })`, si existen `share`
  y `canShare` y `canShare` dice que sí. Un `AbortError` es que no quiso: no pasa nada. Sin `share`, copia
  el link y dice «Copiado» por 4 s. Si `share` falla de otra forma o no se puede copiar, muestra el link
  con «Copiar el enlace». **Nunca comparte `location.href`**: la dirección de la página lleva la llave del
  cliente. El `Referrer-Policy: no-referrer` de `netlify.toml` no se tocó.
- **Quieta**: nada se mueve al pasar el mouse ni al apretar, por las guardas del 0074, y el e2e de la
  página quieta suma apretar «Fotos siguientes» y «Compartir».
- La vista de adentro de la app es el mismo componente. La ayuda «Cómo lo ve tu cliente» suma «Tu
  vidriera», y sus filas de las fotos que no marcaste y de otro trabajo la nombran.
- `e2e/reparto/sembrar.ts` siembra las redes en los ajustes completos, 3 fotos en «pocos» y 12 en
  «muchos», así `hueco` y `rediseno` la miden.

### 8. El lector y el tipo

`leerVistaDelCliente` lee `vidriera` y tolera que falte: un payload viejo da una vidriera vacía. Relee
cada link con `esLinkDeLaRed` y tira el que no pase, tira la foto que no tenga forma y corta en doce.
`TrabajoDelCliente` y lo común de la vista suman `vidriera`, y el dominio la lee con `?? VIDRIERA_VACIA`.

## Los links: lo que se escribe, lo que se guarda y lo que se ve

Salida de las funciones del dominio. En Ajustes, Facebook muestra el link entero; el cliente ve solo el
glifo de Facebook y de TikTok, y el de Instagram con el `@usuario`.

| Red       | Se escribe                                                         | Se guarda                                              | En Ajustes     |
| --------- | ------------------------------------------------------------------ | ------------------------------------------------------ | -------------- |
| Instagram | `@taller.maun`, `Taller.Maun`                                      | `https://www.instagram.com/taller.maun/`               | `@taller.maun` |
| Instagram | `https://www.instagram.com/Taller.Maun/?igsh=MWx0dm`               | `https://www.instagram.com/taller.maun/`               | `@taller.maun` |
| Instagram | `http://instagram.com/taller.maun/reels/`                          | `https://www.instagram.com/taller.maun/`               | `@taller.maun` |
| Instagram | `https://www.instagram.com/p/C1a2b3c4d5/`, `/reel/…`               | no se guarda: no es un perfil                          | —              |
| Instagram | `https://www.instagram.com/stories/taller.maun/3312/`              | no se guarda: no es un perfil                          | —              |
| Instagram | `https://www.facebook.com/tallermaun`                              | no se guarda: es de otra red                           | —              |
| Instagram | `@taller maun`, `taller-maun`                                      | no se guarda: no es un usuario                         | —              |
| Facebook  | `tallermaun`                                                       | `https://www.facebook.com/tallermaun`                  | el link        |
| Facebook  | `https://m.facebook.com/TallerMaun/?mibextid=abc`                  | `https://www.facebook.com/tallermaun`                  | el link        |
| Facebook  | `web.facebook.com/taller.maun`                                     | `https://www.facebook.com/taller.maun`                 | el link        |
| Facebook  | `…/profile.php?id=100012345678&sk=about`, `100012345678`           | `https://www.facebook.com/profile.php?id=100012345678` | el link        |
| Facebook  | `…/share/p/1AbCdEf/`, `…/tallermaun/posts/123`, `…/groups/muebles` | no se guarda: no es un perfil                          | —              |
| Facebook  | `https://fb.me/tallermaun`                                         | no se guarda: es de otra red                           | —              |
| Facebook  | `maun`                                                             | no se guarda: no es un nombre                          | —              |
| TikTok    | `@Taller.Maun`, `…/@Taller.Maun?lang=es`                           | `https://www.tiktok.com/@taller.maun`                  | `@taller.maun` |
| TikTok    | `tiktok.com/@taller_maun`                                          | `https://www.tiktok.com/@taller_maun`                  | `@taller_maun` |
| TikTok    | `…/@taller.maun/video/7212345678901234567`                         | no se guarda: no es un perfil                          | —              |
| TikTok    | `https://vm.tiktok.com/ZMabc123/`, `…/taller.maun`                 | no se guarda: no es un perfil                          | —              |
| TikTok    | `@a`                                                               | no se guarda: no es un usuario                         | —              |

`fb.me` es el acortador de Facebook, y sale como «no es de Facebook»: no se puede resolver sin red, y
el mensaje igual pide el link de la página. Es el único caso donde el motivo no es exacto.

## Lo que se midió

### La columna de apoyo

`data-pegado` de la columna de apoyo en `/v/`, con el «Cómo pagar» más largo (alias, CBU, titular, CUIT y
link de cobro) y un título de dos renglones, con el build de `main` y con el de la rama, que suma la
vidriera con doce fotos y las tres redes:

| Ventana    | Antes                 | Después                 |
| ---------- | --------------------- | ----------------------- |
| 1440 × 900 | `abajo`, apoyo 892 px | `abajo`, apoyo 1.193 px |
| 1280 × 800 | `abajo`, apoyo 892 px | `abajo`, apoyo 1.193 px |

La columna ya no entraba antes en ninguna de las dos, y se pegaba por abajo. La vidriera le suma 301 px:
con la página bajando, «Cómo pagar» se va para arriba 301 px antes. Es el costo que el pedido aceptó de
ponerla ahí.

### El peso

`vite build` de `main` (`a7c27bb`), de la rama después de «Tu mueble» (`bef1590`) y de la rama entera,
con la misma configuración, en KB comprimidos:

| Build                | `index.html` | JS de entrada |   CSS |     Precache |
| -------------------- | -----------: | ------------: | ----: | -----------: |
| `main`               |         1,08 |        464,26 | 20,93 | 1.843,23 KiB |
| antes de la vidriera |         3,77 |        466,89 | 21,49 | 1.877,85 KiB |
| rama                 |         3,77 |        479,55 | 21,79 | 1.917,33 KiB |

La vidriera suma 12,96 KB comprimidos a lo que baja al abrir: 10,40 en el `index` (de 197,82 a 208,22),
2,15 en `ui` (los trazos de las redes), 0,30 en el CSS y 0,11 en `vendor`. Sin dependencias nuevas.
Todo va en el chunk de entrada porque la app no parte por rutas (0013); partirla es la propuesta del 0075.

### La lista blanca

`vista_compartida` de un enlace de prueba, con una foto copiada de otro trabajo y una subida: las rutas
son `{household}/vidriera/{id}.webp` y `.mini.webp`, y en el JSON entero no aparece el id del trabajo del
que salió la foto ni el del archivo de origen.

### El teclado

Con seis fotos a 390, Tab recorre «Fotos anteriores» (no disponible), «Fotos siguientes», las seis
fotos, las tres redes y «Compartir». Enter en «Fotos siguientes» corre la tira hasta el final, apaga
«Fotos siguientes» y prende «Fotos anteriores», sin perder el foco; Shift+Tab y Enter en «Fotos
anteriores» la vuelve al principio. En la hoja, Enter la abre, las flechas cambian de pestaña y Tab entra
al panel.

## Alternativas descartadas

- **Apuntar a las fotos de los trabajos** en vez de copiarlas. La ruta de una foto de un trabajo lleva
  el id de ese trabajo (`{household}/{proyecto}/{id}`, 0039), y el cliente vería ids de trabajos de otra
  gente; la lista blanca existe para que no viaje nada de otro trabajo (0046). Y las dos vidas quedarían
  atadas: borrar la foto del trabajo, o el trabajo, rompería la vidriera. La copia cuesta el espacio de
  una foto achicada.
- **Un bucket nuevo.** Las políticas de `archivos` ya atan todo a la carpeta del household, y un bucket
  suma cuatro políticas, su lista en `15_fotos_de_perfil.sql` y otra cuenta de espacio, sin cuidar nada
  más.
- **Un visor adentro de la página.** El 0046 cambió el visor del diseño por abrir el archivo en otra
  pestaña: un modal menos en una página pública, y en el celular es lo que la gente espera.
- **El autoplay.** WCAG 2.2, 2.2.2 (Pausar, detener, ocultar): lo que se mueve solo más de cinco
  segundos, al lado de otro contenido, necesita cómo pararlo. Y en la app nada se mueve por su cuenta
  (0074).
- **Arrastrar.** WCAG 2.2, 2.5.7 (Movimientos de arrastre): lo que se hace arrastrando necesita otra
  forma con un solo toque. Acá el deslizamiento con el dedo es el scroll nativo del navegador y los
  botones hacen lo mismo sin arrastrar, así que no es el «Carousel» de arrastrar que el 0074 dejó afuera.
- **`::scroll-button()` y `::scroll-marker`**, los botones y los puntos del carrusel en CSS: los tiene
  Chrome desde la 135, y ni Firefox ni Safari (los datos de compatibilidad de MDN). En el iPhone de un
  cliente no habría botones.

## Consecuencias

- **El giga del plan lo comparten los trabajos y la vidriera.** Doce fotos achicadas son unos 5 MB, con
  la cuenta del 0039 (0,4 MB por foto), y una copiada ocupa lo mismo otra vez. Ajustes las suma y avisa
  desde los 800 MB, como antes.
- **Los huérfanos del 0039 valen acá**, con uno más: si la copia o la subida entra y la fila rebota (dos
  aparatos que suman la foto número trece a la vez, con `MN022`), el binario queda en
  `{household}/vidriera/` sin fila. La baja tiene los mismos que la de los archivos: la app cerrada
  antes de los 6 s, o sin señal.
- **La columna de apoyo mide 301 px más** en la compu, con las medidas de arriba.
- **La encuesta (`/o/`) todavía no la muestra.** Si se suma, `27_encuesta_publica.sql` es el que obliga a
  decidirlo columna por columna.
- Una red nueva es un valor más de `REDES_DEL_TALLER`, su columna con su `check`, su gemela en el
  comparador, su trazo en `IconoDeRed` y su clasificación en 25 y 27.

## Objeciones

- **Una foto «Sin compartir» sumada igual queda pública para siempre para quien la vio.** El aviso lo
  dice antes de sumar, pero sacarla después no la despublica: la URL es pública y se cachea un año
  (0039), así que el navegador de un cliente que ya la abrió la sigue teniendo. Razonado, no probado.
- **«Tu mueble» con un texto corto quedó 115 px más alta a 1440**, porque la lámina de 240 px va arriba en
  vez de al lado. Con el texto largo es al revés, y ese era el pedido.
- **El peso va contra lo que más le importa a Eliseo**, que abra rápido: 13 KB comprimidos de código de
  Ajustes, de la hoja y de la vidriera bajan en cada apertura aunque no los use. Partir por rutas, que el
  0075 deja como propuesta, los sacaría del arranque. No se midió cuánto tarda de más en el celular.
- **La guía de TikTok no la leí**: el glifo va en tinta como el de Instagram. De Instagram, que admite
  cualquier color sólido y pide 29 px como mínimo, lo sé por el pedido, no por la guía. El azul de
  Facebook es el que registra Simple Icons con la guía de Meta como fuente; la guía tampoco la leí.
- **Nada de esto se probó en un teléfono**: deslizar la tira con el dedo, la hoja de compartir de
  Android, subir fotos desde el celular, ni el navegador de adentro de Instagram o de Facebook, que
  según MDN no tiene `navigator.share` (es un WebView de Android) y va a copiar.

## Verificación

- `db:ensayo` en verde antes del `db push` (entre ellos `25_vista_del_cliente.sql`, 145 tests, y el
  comparador de los links), y los advisors sin nada de esta migración: los ocho avisos son de las cinco
  funciones que `anon` ejecuta a propósito, de dos que ejecuta `authenticated` y de la protección de
  contraseñas filtradas de Auth.
- `concurrencia.test.ts`: dos altas en la vidriera se esperan en el lock del household.
- Dominio al 100 %; los tests del lector, de la hoja, de la lista, de las acciones (mover, sacar con
  deshacer y el binario a los 6 s), de compartir y de la tira, incluido el foco del teclado.
- e2e: `vidriera.spec.ts` (de punta a punta: las redes, sumar desde un trabajo y subiendo, el orden,
  sacar y deshacer, y verla por el enlace y adentro de la app; y el tope de doce), la página quieta con
  la vidriera, y el reparto con la vidriera sembrada (9 de 9).
- Capturas de la vidriera en `/v/` y adentro de la app a 320, 390, 1024 y 1440, en claro y en oscuro, con
  0, 1, 2, 5 y 12 fotos, con redes y sin redes; de «Tu vidriera» y de la hoja con sus dos pestañas a 390
  y a 1440, con fotos «Sin compartir»; y de «Tu mueble» a 390, 1024 y 1440, corta y larga. Miradas una
  por una: dos detalles que aparecieron (el origen cortado y un pie vacío en «Subir nuevas») se
  arreglaron en su propio commit.

## Fuentes

- W3C, Understanding WCAG 2.2, 2.2.2 Pause, Stop, Hide.
  <https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html>
- W3C, Understanding WCAG 2.2, 2.5.7 Dragging Movements: no cubre lo que opera el navegador, como el
  scroll. <https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html>
- W3C, Understanding WCAG 2.2, 2.4.11 Focus Not Obscured (Minimum), y 2.4.12, que pide ver el foco
  entero. <https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html>
- MDN, browser-compat-data: `css/selectors/scroll-button.json` y `scroll-marker.json` (Chrome 135, sin
  Firefox ni Safari), `api/Element.json` (`scrollend`: Safari 26.2) y `api/Navigator.json` (`share`:
  Firefox de escritorio detrás de `dom.webshare.enabled`, sin WebView de Android).
  <https://github.com/mdn/browser-compat-data>
- W3C, Web Share API: cancelar rechaza con `AbortError`. <https://w3c.github.io/web-share/>
- Supabase, `storage.from().copy()`. <https://supabase.com/docs/reference/javascript/storage-from-copy>
- Simple Icons 16.32.0, licencia CC0-1.0, y su `data/simple-icons.json` (el azul de Facebook, `0866FF`).
  <https://github.com/simple-icons/simple-icons>

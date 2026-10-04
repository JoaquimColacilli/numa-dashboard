# 0080. El presupuesto adentro de la ficha

- Estado: aceptada
- Fecha: 2026-10-01
- Completa al [0010](0010-sincronizacion-replica-completa.md) (dos tablas más en la réplica y los rechazos
  `MN026` a `MN033`), al [0043](0043-las-opciones-de-presupuesto-y-la-sena.md) (las opciones se ven antes de
  aprobar, adentro del presupuesto), al [0046](0046-la-vista-del-cliente-una-lista-blanca-en-la-base.md) (la
  clave `presupuesto` de la lista blanca), al [0057](0057-las-opiniones-de-los-clientes.md) (lo que se manda
  lleva su foto, también el presupuesto), al [0078](0078-los-tesoros-configurables-y-la-fila.md) (la
  plantilla del presupuesto va en `ajustes` con el molde de la fila, y las piezas del plano pasan a
  `shared/ui`) y al [0071](0071-la-entrega-y-sus-fechas.md) (la entrega estimada del pasaje sale del plazo
  del presupuesto).
- Corrige al [0067](0067-la-vista-antes-de-aprobar.md) y al [0070](0070-el-camino-tilda-lo-que-paso.md) (un
  presupuesto vencido deja de pedir la seña, la obra viaja adentro del presupuesto antes de aprobar y «Para
  cuándo» cuenta el plazo del presupuesto) y al [0011](0011-dominio-cascada-estados-y-cobro.md) (el día en
  que se aceptó lo anota el trigger de los cambios de estado).
- Enmendado el 2026-10-02 por el [ADR 0082](0082-la-app-en-tres-idiomas.md): cada revisión guarda el idioma
  con que se armó su contenido (`mandar_el_presupuesto` lo recibe y, si no viene, toma el de los clientes), y
  el presupuesto en `/v/` y su PDF van en ese idioma, con `<Document language>`, la partición en sílabas de su
  idioma y la leyenda de ARCA en castellano con su traducción debajo. La plantilla de siempre tiene una
  versión por idioma, y `null` en `ajustes.plantilla_del_presupuesto` quiere decir la de siempre en el idioma
  de los clientes.
- Enmendado el 2026-10-02 por el [ADR 0083](0083-los-trabajos-en-dolares.md): un documento en dólares es
  `forma: 2`, con su referencia en pesos (la cotización y su fecha, congeladas al mandar); la plantilla suma
  las cláusulas de la moneda (cinco, editables) y la moneda del valor de una modificación, y el borrador la
  cláusula retocable y la moneda de lo abonado. `mandar_el_presupuesto` compara la moneda con la del trabajo y
  calcula lo abonado con lo que descuenta cada pago.
- Enmendado el 2026-10-04 por el [ADR 0085](0085-la-factura-con-arca.md): el PDF de la factura es un documento más del mismo Worker,
  con las mismas fuentes, estilos y medidas, siempre en castellano y con el QR de ARCA dibujado con `uqr`;
  nada fuera del Worker importa `@react-pdf/*`. El mismo comprobante da los mismos bytes (`creationDate` al
  mediodía de su fecha) y en homologación lleva de fondo «PRUEBA · SIN VALIDEZ FISCAL», como el borrador.

## Contexto

Eliseo dejó el pedido en el tablero de Miro, en la columna «Propuestas». Lo armó a partir de un audio suyo y
lo retocó; esto es el pedido, tal cual:

> Feature: Presupuesto integrado dentro de la ficha del proyecto
>
> 1. Problema actual:
>    Hoy haces el presupuesto en un PDF por fuera de la app. Queda descolgado del seguimiento del proyecto.
>
> 2. Idea nueva:
>    Que cada proyecto tenga adentro, en la misma página donde el cliente ve su avance, una sección / solapa /
>    desplegable que sea "Presupuesto". No es un PDF suelto. Es parte de la página, con la estética de la web.
>
> 3. Qué debe tener esa sección:
>
> A) Cabecera automática: Nombre del cliente, Fecha, Número de presupuesto autogenerado (con formato
> YYYYMMDD que hablamos), Título del proyecto
>
> B) Cuerpo editable por vos: Descripción detallada del proyecto (campo de texto largo), Listado de ítems
> del mueble
>
> C) Secciones tildables / destildables:
> Un checklist de lo que ya pones siempre, para no escribirlo a mano cada vez:
> Traslados, Instalación, Herrajes de buena calidad, Garantía, Forma de pago, Otras aclaraciones estándar.
> Vos tildás las que van para ese presupuesto.
>
> D) Valores:
> Valor total, Opciones de presupuesto con discriminaciones (Opción A, Opción B, etc.)
>
> E) Disclamers:
> Tiempo de demora estimado. Responsabilidades del Cliente (líneas de agua, luz, gas). Cuestiones con el
> color y diseños de las placas (que a veces se ven de un modo en las pantallas y/o muestras y en la
> realidad pueden variar).
>
> 4. Acción para el cliente:
>    Botón: "Descargar presupuesto en PDF". Ese botón genera un PDF prolijo al instante, tomando SOLO los
>    datos de esa sección de presupuesto, con encabezado, datos del cliente, detalle, aclaraciones tildadas y
>    valor. Sin fotos de avance, solo lo comercial.

Y en las notas del tablero: «creo que le falta una vueltita de rosca aún». Después armó la planilla
«ESTRUCTURA PRESUPUESTO - NUMA», que es lo más reciente y lo que manda: el número «20260826-01 (puede ser el
que más te guste a vos)» que «contempla versiones (si el cliente pide alguna modificación)»; la fecha, el
cliente y la obra que se toman del proyecto; la descripción técnica con materiales, medidas, color y marca
de la placa; los herrajes («puede haber un listado de materiales como en "hace falta"»); el aviso de
instalaciones («No incluye mesada»); cinco cosas que incluye, tildadas, con «posibilidad de ingresar
otros»; el método de pago con plantillas (A por defecto); la validez de 15 días, editable; cuatro avisos
con sus textos (el plazo de 30 días hábiles, editable en cada presupuesto, con «acá tengo que agregar una
salvedad de reservas de fecha de producción en función de la agenda del taller»; la aceptación con la
seña; el diseño 3D con dos modificaciones y $ 50.000 cada una de más; el relevamiento que se descuenta de
la seña); dos condiciones (el espacio de instalación y las cañerías y los cables) y el total, con la seña y
el descuento del relevamiento «que creo que ya lo hace el sistema». El ejemplo de la obra de la planilla es
de un cliente de verdad: no se copia acá, ni en los tests, el seed o los e2e.

El diseño completo, con las maquetas, el PDF de referencia y la investigación (la ley, cómo lo hacen otras
herramientas y el prototipo de react-pdf medido), quedó afuera del repo, en el material de consulta.

## Decisión

### Tres piezas: la plantilla del taller, el borrador de cada trabajo y lo que se mandó

- **La plantilla** vive en `ajustes`, una por taller: los textos de siempre y los números que llevan
  adentro. `null` es «la de siempre», `PLANTILLA_DE_SIEMPRE` del dominio, con los textos de Eliseo: no hace
  falta migrar datos, como la fila (0078). Se guarda con `guardar_la_plantilla_del_presupuesto`, con el
  molde de `guardar_la_fila`: revisión propia (`MN030` si otro aparato la cambió), gemela de la forma
  (`problema_de_la_plantilla`) y reenvío idéntico. Con la plantilla en `null` vuelve a la de siempre.
- **El borrador** es uno por trabajo, en su propia tabla (`presupuestos`) y con su propia mutación, fuera del
  agregado del proyecto. Se guarda solo, con 900 ms de demora, como las notas, y lleva su propia revisión
  (`borrador_version`, `MN026`).
- **Cada envío es una revisión congelada** (`revisiones_del_presupuesto`): la base guarda la foto completa
  del documento (los textos con los datos completados, los importes, los datos del taller y del cliente), con
  número, revisión, fecha y vigencia, y nadie la edita después. Es la regla del 0057: el cliente ve lo que se
  le mandó aunque Eliseo siga armando, cambiar la plantilla no toca lo mandado y el PDF de una revisión sale
  siempre igual. ARCA pide conservar dos años lo emitido: las revisiones no se editan ni se borran a mano;
  la baja del trabajo las marca como borradas, como al resto de sus hijos.

**Por qué tres.** La plantilla es del taller, el borrador cambia todo el tiempo y lo mandado no cambia nunca.
En un solo lugar, cada guardado del borrador chocaría con la ficha del otro aparato (`MN006`), y un cambio en
los textos de siempre reescribiría presupuestos que el cliente ya tiene.

### El número

`AAAAMMDD-NN`: el día del primer envío y su orden ese día en el taller. Lo pone la base en la transacción
que congela la primera revisión, con los ajustes del taller bloqueados y contando también lo borrado, así un
número no se repite. Las revisiones mantienen el número: «Nº 20260826-01» y, desde la segunda, «Nº
20260826-01 · Rev. 2». Un borrador que no se manda no gasta número. Mandado sin señal, se numera al llegar a
la base, y la ficha dice «Se numera cuando vuelva la señal».

**Por qué en la base.** Dos aparatos sin señal sacarían el mismo número, y el choque de un índice único
(`23505`) tapa la cola (0010). Mandar toma el candado del trabajo y después el de los ajustes, en el orden
del cobro, y recién ahí mira las revisiones. Las dos pruebas de concurrencia de `packages/db` lo muestran:
un envío de otro trabajo espera en los ajustes sin haber contado, y el reintento del mismo envío espera en
el trabajo y no congela dos veces. Con copias de la función sin cada candado, las dos fallan.

### Qué se manda y cuándo

- «Mandar el presupuesto» congela la revisión 1 y hace lo que hoy hace «Mandé el presupuesto»: si el trabajo
  está antes de «Presupuesto enviado», o en seguimiento, pasa a esa etapa, con la vigencia, el último
  contacto y la tarea «Armar el presupuesto» tildada, todo en la misma transacción.
- Cada cambio posterior es otra revisión, con un «Qué cambió» obligatorio (hasta 280 caracteres) que el
  cliente lee arriba del presupuesto. Cada revisión renueva la vigencia: es una oferta nueva.
- Después de aprobado no hay revisiones (`MN028`): un cambio después de la seña es un adicional y se arregla
  aparte. «Volvió a presupuesto» habilita otra revisión. Un trabajo perdido no manda (`MN032`).
- «Mandé el presupuesto» sigue, para cuando Eliseo lo manda por fuera de la app. La tarea «Armar el PDF» se
  llama «Armar el presupuesto».
- En «Qué falta», con el trabajo en «A presupuestar» y ninguna revisión mandada, el primario es «Armar el
  presupuesto» (o «Seguir armándolo», con borrador); «Mandé el presupuesto» y «Ya lo aprobó» quedan detrás.
  Los botones de la tarjeta del presupuesto son secundarios: una pantalla, un primario.

### Los valores

- **Una sola fuente de la plata.** El total es `presupuesto_centavos`, o las opciones del trabajo (0043). El
  editor los muestra y los guarda con las piezas y la mutación de siempre (`guardar_proyecto`), con la misma
  demora que el borrador; el borrador no guarda importes. Una opción vacía se guarda en 0, y lo que falta
  para mandar lo dice.
- Al mandar, la app arma el documento con lo que ve y la base lo compara con lo vivo: las opciones (ids,
  importes y orden) o el total, el porcentaje de seña y lo pagado. Si algo no coincide, rechaza sin congelar
  nada (`MN029`), como el control de «lo que vio la app» del cobro.
- **Las opciones se ven antes de aprobar**, adentro del presupuesto, cada una con su total y su seña. Después
  de aprobar, solo la elegida.
- **Lo pagado tiene dos lecturas.** La foto guarda `abonado`, lo pagado el día del envío: completa el aviso
  del relevamiento y el PDF muestra la seña a abonar, fija, como un papel con fecha. La página del cliente,
  que es viva, muestra los pagos de hoy, igual que «Tu mueble» y «Cómo pagar».
- **Lo acordado al aprobar.** Si se aprueba otro importe que el de la última revisión (escrito en el pasaje,
  o con cambios sin mandar), el pasaje lo avisa antes de confirmar y la tarjeta del aprobado, en la página,
  en la ficha y en el PDF, suma «Acordado al aprobar: $ …». La foto no se toca.
- Las opciones van en el orden de sus ids (UUIDv7), con letra A, B, C… En el editor también: `uuidv7` no es
  monótono adentro del mismo milisegundo, y «Ofrecerle más de una opción» crea dos ids juntos; sin
  ordenarlas, la A del editor podía ser la B del documento.

### La forma de pago

Tres plantillas de texto en Ajustes: A «Seña y contra entrega», B «Seña y cuotas» y C «Todo al confirmar».
En cada presupuesto se elige una y su texto se retoca para ese trabajo, o no se muestra. `{sena}` es el
porcentaje del trabajo. **No es un plan de pagos**: no cambia «Cómo pagar», que sigue pidiendo la seña y el
saldo. El plan en tramos sigue siendo la hija del agregado que dejó anotada el 0043.

### Plazos y vigencia

- **El plazo del presupuesto manda.** «Para cuándo» del cliente y la entrega estimada del pasaje cuentan el
  plazo de la última revisión en vez de los 21 días hábiles fijos, así la página no promete dos plazos.
  Sin presupuesto mandado, siguen los 21. El pasaje lo dice: «Calculada a 30 días hábiles del inicio, el
  plazo del presupuesto.».
- La vigencia es la de hoy: al mandar, el día de envío más los días elegidos (corridos), o sin vencimiento.
  La página y el PDF muestran siempre la fecha viva del trabajo.
- **Vencido no se esconde.** El presupuesto queda a la vista con «Venció el …», «Cómo pagar» deja de pedir la
  seña y pide escribirle al taller, «Para cuándo» no sale y «Tu mueble» lo dice. Vale también para un
  presupuesto mandado por fuera de la app, con su fecha de vigencia vencida.

### El relevamiento en el aviso

«El valor abonado en concepto de relevamiento técnico y diseño 3D ({relevamiento})…» se completa con lo que
el cliente pagó hasta el envío. Ningún pago es «el relevamiento» (0067), pero antes del presupuesto lo único
que se cobra es la visita. Si no pagó nada, el aviso no sale, y en el editor queda gris con su porqué.

### Los datos del taller

El PDF y la sección llevan los datos de quien presupuesta, como piden el art. 21 de la Ley 24.240 (el
presupuesto dice quién lo hace y cómo ubicarlo) y la RG 1415 de ARCA (arriba, la «X» con «DOCUMENTO NO
VÁLIDO COMO FACTURA»). `ajustes` suma seis columnas: titular, CUIT, condición fiscal, domicilio, teléfono y
email, con su `check` y su grant por columna. Viajan al cliente solo adentro de la foto de cada revisión. La
marca es el nombre del taller en Young Serif, el de `households.nombre`, con «Taller MAUN» de respaldo; no
hay logo y NUMA no aparece (0073). Con el teléfono, la página ofrece «Escribirle al taller».

### La garantía y los textos que suma el diseño

- Un bloque de garantía que no se destilda, con los meses en Ajustes: 6 por defecto y como mínimo, el
  mínimo del art. 11 de la Ley 24.240 para cosas nuevas.
- El aviso de los colores de las placas, tildado, con las palabras del pedido.
- Los textos de Eliseo van textuales. Donde la investigación sugiere otra redacción, la app no cambia nada:
  se le pasan como sugerencias, para que las cambie él en Ajustes si quiere.

### El PDF

- Lo genera el aparato con react-pdf 4.9.0, el mismo documento para el dueño y para el cliente, sin
  servidor ni Storage. En la app del dueño anda sin señal.
- Corre en un Web Worker de módulo, en su propio chunk, que se pide recién cuando hace falta. La guarda
  del build (`scripts/motor-del-pdf.ts`) falla si `pdfkit`, `fontkit` o `yoga` entran a otro chunk.
- En desarrollo, `shared/pdf` y `shared/lib` quedan afuera de Fast Refresh (el `exclude` del plugin de
  React). El runtime de Fast Refresh toca `window` al cargarse, y el Worker lo traía por `Documento.tsx` y
  por `Ir.tsx`, que entra con el barril de `shared/lib`: con `pnpm dev` el Worker se caía y «Ver el PDF» no
  bajaba nada. El build no lo tiene, porque no lleva Fast Refresh. Editar `Ir.tsx` en desarrollo recarga a
  quien lo usa en vez de refrescarlo solo.
- La fecha de creación es el mediodía del día de envío en el taller: la misma revisión da el mismo archivo,
  byte por byte, y eso sirve de firma para guardar el `Blob`.
- «Descargar el PDF» baja el archivo con su nombre («Presupuesto 20260826-01 - cliente.pdf»); en un iPhone
  con la app instalada lo comparte, porque ahí bajar no funciona. «Compartir» usa la Web Share API con el
  archivo, si el aparato puede.
- El borrador también tiene PDF, con «BORRADOR» cruzado y «Sin número todavía».
- Ningún texto baja de 7,5 pt (la Res. 906/98 pide caracteres de 1,8 mm), y los rótulos en mayúsculas no
  pasan de 0,06 em de interletrado, para que el buscador del lector los encuentre.

### La obra antes de aprobar

El 0067 no manda la dirección antes de aprobar. La obra que Eliseo escribe en el presupuesto es parte del
documento que él decidió mandar, así que viaja adentro de la foto. La columna `direccion` de la vista no
cambia.

### El lenguaje del plano

El presupuesto usa las piezas del plano de Tesoros, que pasan de `entities/fila` a `shared/ui`: el rótulo
(número, revisión, emitido y vigencia, en casillas), los renglones con puntos hasta el importe, el
triángulo de la revisión al lado de «Qué cambió» y el globo numerado de cada mueble.

### Dónde vive cada cosa en la app

- **La ficha**: la tarjeta «El presupuesto» en sus cuatro estados (sin borrador, borrador, mandado y
  aceptado), con «Revisiones anteriores» plegadas, cada una con su PDF. En el contacto y en el seguimiento va
  primera en el principal; en la obra, entre «Opciones de presupuesto» y «Pagos recibidos».
- **El editor** (`/proyectos/:id/presupuesto`): una capa a pantalla completa, como editar el proyecto, con
  sus diez secciones, la barra de abajo («Ver el PDF» y el primario) y la pestaña «Ver cómo lo ve tu
  cliente», que dibuja la sección de la página del cliente con el documento de hoy, marcada «Borrador». Abre
  solo con el trabajo en una consulta o en seguimiento.
- **La hoja de mandar**: qué pasa al mandarlo, lo que falta (cada renglón lleva a su campo), «Qué cambió»
  desde la segunda, y al terminar «Listo» con el rótulo, el link por WhatsApp y el PDF. «Mandar» espera a que
  la réplica tenga lo que se ve en la pantalla («Guardando…»). Sin señal dice «Se numera cuando vuelva la
  señal.» y no ofrece el link hasta que la base lo confirma. Si el trabajo no tiene enlace, el link de
  WhatsApp lo crea al tocarlo.
- **Ajustes**: la sección «Tu presupuesto» entre «Tu taller» y «Cómo te pagan», con el resumen y el aviso de
  lo que falta de lo que pide la ley, y la pantalla `/ajustes/presupuesto`, con los datos, los números y los
  textos de siempre editados en el lugar, los datos que se completan solos como fichas (nunca llaves) y una
  sola barra que guarda los datos y los textos juntos. La mutación de la plantilla vive en
  `configurar-taller`, al lado de la de los ajustes: una sola barra manda las dos sin cruzar slices.

### Los rechazos nuevos

| Código  | Cuándo                                                                               |
| ------- | ------------------------------------------------------------------------------------ |
| `MN026` | El borrador cambió en otro aparato, o se arrancó otro borrador del trabajo           |
| `MN027` | Falta algo para mandarlo (el `detail` dice qué)                                      |
| `MN028` | El trabajo ya está aprobado (mandar o guardar el borrador)                           |
| `MN029` | Los importes no coinciden con los vivos (el `detail` dice cuáles)                    |
| `MN030` | La plantilla cambió en otro aparato                                                  |
| `MN031` | La forma no sirve: del borrador, la plantilla o el documento (código en el `detail`) |
| `MN032` | El trabajo está perdido                                                              |
| `MN033` | El día de envío todavía no llegó                                                     |

## Alternativas descartadas

- **El borrador como columnas de `proyectos`, o como una hija del agregado del proyecto.** Cada letra que
  escribe Eliseo subiría la `version` del trabajo y chocaría con un guardado del otro aparato (`MN006`).
- **El número en el aparato**, con el día y un contador local. Dos aparatos sin señal sacan el mismo, y el
  choque de índice tapa la cola.
- **El PDF en el servidor (una función de borde), o guardado en Storage.** No anda sin señal, suma la
  espera del arranque en frío y archivos que hay que cuidar, y no hace nada que el aparato no haga: el PDF
  se rehace igual en cada aparato desde la foto. Queda para cuando se quiera mandarlo por mail.
- **Typst compilado a WebAssembly**: el mejor motor tipográfico de los probados y el único con el PDF
  etiquetado sin hacer nada, pero el compilador pesa 27 MiB (6,9 MiB en brotli), trece veces la app de hoy,
  y no entra en el precache de una app que se usa con datos móviles.
- **`window.print()`**: no da un archivo, así que no se comparte por WhatsApp ni lleva su nombre; en Android
  abre el diálogo de impresión, en el iPhone la hoja de impresión, y el resultado cambia con cada navegador.
- **Un plan de pagos que cobre la app**: es la hija del 0043, para después. La forma de pago es un texto.
- **La firma o la aceptación del cliente en línea**: la aprobación sigue siendo de Eliseo («Ya lo aprobó»).
- **Un logo por taller**: hay un taller, y la marca es el nombre en Young Serif.
- **Un número nuevo para cada revisión**: con el sufijo del día como versión, dos presupuestos del mismo día
  tendrían el mismo número.
- **Preguntar «¿Cerrar sin guardar?» ante cualquier salida de Ajustes** con el `useBlocker` del router: la
  puerta (0066) arranca la transición y anota su pila antes de navegar, y bloquear desde la página la deja
  desfasada. Pregunta la salida de la pantalla («‹ Ajustes») y avisa el navegador al cerrar o recargar.

## Objeciones

- **«Armar el presupuesto» primero, aunque ya esté armado.** Con las cuatro tareas tildadas a mano, «Qué
  falta» dice «Ya está armado: falta mandar el presupuesto» y el primario sigue siendo «Armar el
  presupuesto». Es lo pedido; con un presupuesto hecho por fuera, el primario lógico sería «Mandé el
  presupuesto».
- **El aviso del relevamiento cuenta todo lo pagado hasta el envío.** Si el cliente pagó algo más que la
  visita antes del presupuesto, el aviso le llama relevamiento a todo.
- **Salir de Ajustes con cambios.** La barra de abajo, el gesto de atrás y los enlaces del costado salen sin
  preguntar y lo cambiado se pierde.
- **El pasaje no completa la dirección de entrega con la obra del presupuesto**: Eliseo la vuelve a escribir.
- **El arranque pesa más.** El chunk `index` pasa de 963.245 B a 1.102.255 B (+14 %; en gzip, de 265.776 B
  a 301.936 B): el editor, la pantalla de Ajustes, el modelo del dominio y la sección del cliente van en el
  chunk de siempre, que baja también la página del cliente. `vendor` casi no cambia (+363 B) y el motor del
  PDF (1,24 MB) va solo en el Worker: la página del cliente no registra el service worker, así que lo baja
  recién si toca «Descargar el PDF» o «Compartir». Cargar el editor y la pantalla de
  Ajustes aparte, como el lienzo de Tesoros, pide cuidar la subida de la capa (0066), que dibujaría el
  `Suspense` vacío: queda para otro PR.
- **El comentario de `proyectos.presupuesto_pdf`** sigue diciendo «el PDF del presupuesto está armado». Se
  corrige con la próxima migración que toque esa tabla.
- **Para confirmar con Eliseo**: que las revisiones mantengan el número; el texto de la garantía; las
  palabras del aviso de los colores; los textos de las tres formas de pago (él dio ejemplos, «50% Seña / 50%
  Entrega», las cuotas y el total con o sin descuento, y pidió la A por defecto, pero no los textos); las
  tres aclaraciones de «A tener en cuenta» que no escribió él («No incluye bacha ni grifería.», «No incluye
  conexiones de agua, gas ni electricidad.» y «No incluye la colocación de electrodomésticos.»), y
  «Descargar el PDF» en lugar de «Descargar presupuesto en PDF».
- **Entre el `db push` y el merge** la app publicada es la de antes, contra la base nueva. Se probó en una
  transacción con rollback: las vistas de sus trabajos son las mismas más `presupuesto: null`, la réplica
  suma dos tablas vacías y los ajustes, seis columnas vacías. Eliseo no ve nada distinto.
- **Afuera de este trabajo**: el plan en tramos, los adicionales después de la seña, la firma del cliente, un
  logo por taller, mandar el PDF por mail o guardarlo, los feriados en los días hábiles, las revisiones en
  «Lo que fue pasando» y el PDF etiquetado para lectores de pantalla.

## Consecuencias

- **Cinco migraciones**: `20261001120000_los_datos_del_taller.sql`,
  `20261001120100_la_plantilla_del_presupuesto.sql`,
  `20261001120200_el_presupuesto_y_sus_revisiones.sql`, `20261001120300_el_dia_que_se_acepto.sql` y
  `20261001120400_el_presupuesto_en_la_vista_del_cliente.sql`. Aditivas: tablas, columnas y funciones
  nuevas, y `create or replace` de la vista, `bootstrap`, `delta`, `borrar_hijos_de_proyecto` y el trigger de
  los cambios de estado, que no tocan datos.
- **pgTAP**: `41_el_presupuesto.sql` es nuevo; `00`, `02`, `04`, `25`, `27`, `31` y `32` suman las tablas y
  las columnas nuevas, y el preludio, sus ayudas.
- **El comparador** suma cuatro gemelas: `problema_de_la_plantilla`, `problema_del_presupuesto`,
  `problema_del_documento` y `lo_que_falta_para_mandar`.
- **El dominio** suma `presupuesto.ts`, y `entregaEstimada` recibe el plazo.
- **La app**: `features/armar-el-presupuesto` (la tarjeta, el editor y la hoja de mandar),
  `entities/presupuesto` (la réplica y las dos mutaciones), `shared/pdf` (el documento, el Worker y el
  hook), las piezas del plano y las listas que se editan en el lugar en `shared/ui`, y la pantalla de
  Ajustes en `configurar-taller`.
- **Dependencias nuevas**: `@react-pdf/renderer` y `@react-pdf/hyphenate`, y las dos fuentes que ya estaban
  en el catálogo.
- **e2e**: `el-presupuesto.spec.ts` (de punta a punta en el celular y en la compu, y Ajustes); el reparto,
  `montos-en-las-tarjetas` y `lo-que-flota-abajo` suman las pantallas nuevas.
- **Lo que hay que probar en aparatos de verdad**: un Samsung de gama media y un iPhone, en el navegador y
  con la app instalada, y mandar el PDF por WhatsApp en los dos. Nada de eso se probó todavía en un
  teléfono.

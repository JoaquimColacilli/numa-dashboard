# 0086. El estimativo, la respuesta del cliente y las fechas del presupuesto

- Estado: aceptada
- Fecha: 2026-10-26
- Enmienda al [0010](0010-sincronizacion-replica-completa.md) (`MN044` a `MN050` y
  `respuestas_al_presupuesto` en la réplica), al [0011](0011-dominio-cascada-estados-y-cobro.md) (las gemelas
  nuevas), al [0019](0019-seguimiento-el-contacto-es-la-misma-fila.md) y al
  [0064](0064-el-seguimiento-de-verdad-y-las-consultas.md) (la fecha del pendiente se cambia sin registrar), al
  [0034](0034-la-agenda-calcula-lo-que-sale-de-los-trabajos.md) y al
  [0045](0045-los-costos-estimados-lo-que-hace-falta-y-mover-en-la-agenda.md) (el seguimiento se arrastra), al
  [0036](0036-avisos-por-dispositivo-fuera-de-la-replica.md) (la categoría «Respuestas de tus clientes»), al
  [0046](0046-la-vista-del-cliente-una-lista-blanca-en-la-base.md) y al
  [0067](0067-la-vista-antes-de-aprobar.md) (lo que viaja en la vista y la respuesta del cliente),
  al [0071](0071-la-entrega-y-sus-fechas.md) (la entrega con la fecha del presupuesto) y al
  [0080](0080-el-presupuesto-adentro-de-la-ficha.md) (el tilde, las fechas y la dirección).
- Va con el [0087](0087-los-tipos-de-tesoro-de-eliseo.md), del mismo PR: los puntos 7 a 9 del documento.

## Contexto

Eliseo anotó en su documento «NUMA – Detalles a mejorar», en la pestaña «Funcionamiento», lo que sigue. Con
sus palabras; solo se corrigieron tildes y errores de tipeo. Arriba de todo pegó una captura de la tarjeta
«El presupuesto» de una consulta, con una opción que él llamó «Estimativo», de $ 1.280.000, con su «La
aprobó», y debajo «Seña para confirmar: Todavía no hay presupuesto, así que no hay seña que calcular…».

> DETALLES DE FUNCIONAMIENTO:
>
> - Cuando un proyecto está en "seguimiento" no tengo opción de editar la fecha para la nueva llamada
>   (tampoco me permite arrastrarla en la agenda).
> - Cuando estoy en la ficha del proyecto hay elementos de edición que aparecen solo cuando pongo "cargar
>   un pago" y no cuando pongo "editar" (ej: dirección de entrega).
> - Cuando cargo una "consulta" nueva, una persona me escribe por WhatsApp y me cuenta lo que quiere
>   hacer.. Debería tener en esa etapa alguna estética que pueda ayudarme a guiar la conversación con los
>   detalles que puedo llegar a necesitar para hacer un presupuesto estimativo.. (prudente) por ejemplo:
>   domicilio, acceso al lugar (escaleras, tamaño ascensor), urgencia del proyecto, y las que se me vayan
>   ocurriendo.
> - Cuando estoy editando el presupuesto no me sugiere cargar la dirección desde la original del cliente,
>   y en un caso que la dirección no es la del cliente no me levantó tampoco la del proyecto.
> - Cuando hago el presupuesto, que haya un tilde para marcar si es presupuesto estimativo o no?.. capaz
>   es más visual que tener 2 modos distintos de cargarlo.
>   - El cliente lo puede ver en su página, si hay opciones que le aparezca la opción de "aprobar" en cada
>     uno y al hacerlo que le solicite sugerir fecha de relevamiento técnico (en caso que desde el backend
>     yo tilde que hace falta, por default hace falta).
>   - Ahí para escribir el estimativo tengo que ponerlo como "opción de presupuesto" y como no lo considera
>     presupuesto tampoco muestra al cliente en su página que hay un presupuesto estimativo de X valor, y
>     si hago un presupuesto va a aparecer como presupuestado en la app, le va a mostrar la seña que debe
>     pagar.. pero la idea del estimativo es (en la mayoría de los casos) que apruebe el relevamiento
>     técnico.
> - Cuando hago el presupuesto para asignar el plazo de fabricación.. algo que podríamos establecer en ese
>   cuadro es "puede estar listo para X fecha" (seleccionable de un calendario) "concretando la seña antes
>   de X fecha" (default 2 días desde la creación del presupuesto, editable).
>   - En vez de aparecer X días de fabricación que aparezca algo como "debido a la agenda del taller y
>     plazos de fabricación la fecha estimada de entrega es el XFECHA, a fin de poder confirmar estos
>     plazos se deberá concretar la SEÑA ACORDADA (acá también se puede levantar la info de qué seña se
>     está solicitando, ej 50%) antes de XFECHA".

## Decisión

### 1. El próximo contacto cambia de fecha en su lugar

- «Cambiar la fecha» en la ficha de Seguimiento y en el detalle del evento de la Agenda (la forma sin
  arrastre que pide WCAG 2.5.7), y el arrastre del evento en la Agenda, como lo que ya se arrastraba.
- Cambiar el día no es registrar un contacto: `public.cambiar_la_fecha_del_contacto(id, version, fecha)`
  cambia la fecha del pendiente sin cerrarlo y sin sumar historia, que es de los contactos que pasaron. Sigue
  habiendo uno solo pendiente por trabajo (el índice `proximos_contactos_un_pendiente`). Concurrencia por
  versión (`MN006`); un día que ya pasó en el día del taller rebota con `MN048`, y un contacto ya hecho con
  `MN049`. La app no deja soltar ni elegir un día que pasó.
- Anda sin señal: `MUTACION_DE_LA_FECHA_DEL_CONTACTO` va por la cola y está registrada en
  `mutaciones-persistibles.ts`. El aviso de la mañana lee la fecha del pendiente, así que usa la nueva.

### 2. «Editar» muestra todos los datos del trabajo

- La causa: la ficha de una consulta y la de seguimiento abrían en «Editar» la hoja rápida del contacto
  (`HojaDeContacto`), que no tiene la dirección, el tipo, el comprobante ni la forma de pago; «Cargar un
  pago» abría el editor completo (`PantallaDeProyecto`), que no tenía la visita, su hora, «Ya fui», el
  vencimiento ni «vale hasta». Cada camino había crecido por su lado.
- Ahora «Editar» abre el editor completo en las tres fichas, y el editor suma los campos de la consulta
  mientras el trabajo es una consulta (o está en seguimiento). La lista de campos sale de un solo lugar,
  `entities/proyecto/model/campos.ts` (`CAMPOS_DEL_TRABAJO` y `camposDelTrabajo(estado)`), cada campo marcado
  con `data-campo-del-trabajo`, y un test compara los dos caminos: la hoja rápida no tiene ningún campo que
  «Editar» no tenga.
- El teléfono es del cliente, pero mientras el trabajo es una consulta «Editar» lo muestra y lo guarda en el
  cliente, como hacía la hoja rápida: es el que usan Llamar y WhatsApp. En una obra se cambia en la ficha del
  cliente, como siempre. Guardar una consulta desde el editor dice «Contacto guardado.», como antes.

### 3. Lo que conviene preguntar en una consulta

- Las preguntas son del taller, en `ajustes.preguntas_de_la_consulta`: `null` son las de siempre, que la app
  arma en el idioma del dueño («Domicilio», «Acceso al lugar» con «Escaleras, piso, tamaño del ascensor.» y
  «Urgencia» con «Para cuándo lo necesita.»). Hasta 12, «Domicilio» primero y sin borrar. Se editan en Ajustes,
  en «Lo que preguntás en una consulta», al lado de «Tu presupuesto»: sumar, cambiar el rótulo y la ayuda,
  Subir y Bajar, borrar con «Deshacer». Se guardan solas con demora por la mutación de los ajustes, con
  `grant update` de esa sola columna y un check de forma (`private.problema_de_las_preguntas`, gemela de
  `problemaDeLasPreguntas`).
- Las respuestas son del trabajo, en `proyectos.respuestas_de_la_consulta`: por id de pregunta y con la
  pregunta como estaba al contestarla, así cambiar o borrar una pregunta no pierde lo contestado. El domicilio
  no va ahí: es `direccion_entrega`, el mismo campo de «Editar». Check de forma
  (`private.problema_de_las_respuestas`), `grant update` de la columna sola, y no viajan a la página del
  cliente.
- «Para el estimativo» en «Nueva consulta», en la ficha de la consulta (todas sus etapas) y en la de
  Seguimiento, con «2 de 3» arriba; en la ficha de la obra, cerrado, si hay algo contestado. Las respuestas se
  guardan solas con demora y sin señal, en el molde de las notas
  (`MUTACION_DE_RESPUESTAS_DE_LA_CONSULTA`), y el estado nunca dice «Guardado» de algo que está en la cola.
  En «Nueva consulta» viajan con el alta en la misma mutación del trabajo: el optimista ya las tiene y la
  mutación las guarda después de crear la fila. Si la base las rechaza para siempre, el trabajo, que ya se
  creó, queda sin ellas y la réplica toma la fila de la base; si lo que falla es la señal, se reintenta todo:
  `guardar_proyecto` trata el alta repetida como una edición sin cambios.

### 4. La dirección vive en el trabajo

- La causa: el editor del presupuesto tenía su propio campo de texto, `obra`, guardado en el borrador, que
  arrancaba vacío y no miraba ni la dirección del trabajo ni la del cliente.
- Ahora el presupuesto muestra la del trabajo; si el trabajo no tiene, la del cliente; si las dos existen y
  son distintas, la del trabajo con «Usar la del cliente» (`direccionDelPresupuesto` del dominio). El campo
  del editor edita `direccion_entrega` con la misma mutación que «Editar», y la revisión mandada la congela
  como siempre. La `obra` de un borrador viejo se lee y se vacía al editar.
- Con la dirección en el trabajo, el editor guarda dos cosas del mismo trabajo (la dirección y los valores), y
  «Mandar» manda juntas las dos que estén pendientes. La segunda sale de la fila que deja la primera
  (`useFilaEnCamino`), con su versión y su cambio, hasta que la cola la confirme: armada con la réplica de
  antes, la base la rechazaba por versión vieja (MN006) y además volvía la dirección para atrás. Lo mismo
  hacen las respuestas y el domicilio de «Para el estimativo».

### 5. El estimativo es un tilde, y el cliente lo aprueba

- «Es un estimativo» en el editor, con su ayuda, y «Pedirle una fecha para medir», que arranca prendido
  cuando el trabajo no tiene relevamiento (el default de Eliseo) y vale para un presupuesto también. El
  estimativo no pide seña ni forma de pago; sus cláusulas que hablan de fechas se apagan; el PDF, el título y
  el archivo dicen «Presupuesto estimativo».
- Mandar un estimativo desde «contacto» lo pasa a «estimativo enviado»; desde otra etapa de la consulta no la
  mueve. Mandar un presupuesto lo pasa a «presupuesto enviado» como siempre. La base y la app hacen la misma
  cuenta (`estadoAlMandar`).
- En la página del cliente, el estimativo se ve antes del presupuesto, con el número estimado y sin seña, y
  cada opción tiene «Aprobar esta opción» (o «Aprobar», si es un solo total). Si la revisión pide fecha, la
  hoja pide un día de pasado mañana a dentro de 60 en el día del taller, la franja (mañana, tarde o le da
  igual) y una nota de hasta 300 caracteres. Lo aprobado queda a la vista, con «¿Te equivocaste?» que lo
  manda a escribirle al taller, y la página deja de pedirle que le avise al taller cuál opción prefiere (esas
  dos líneas son de cuando no se podía aprobar desde la página).
- La escritura de afuera sigue el molde de la encuesta y de la nota de la entrega: `respuestas_al_presupuesto`
  la escribe solo `public.responder_el_presupuesto()`, `security definer`, que anon puede ejecutar y nada más,
  sin grants sobre ninguna tabla; valida todo en la base con `private.validar_aprobacion`, gemela de
  `validarAprobacion` (`MN050` con el motivo en el detalle); una respuesta por revisión, la última mandada y
  que siga esperando; el reenvío idéntico se reconoce y uno distinto rebota. El dueño solo puede marcarla
  atendida (`atendida_at`, por la cola). No es una firma: el presupuesto queda confirmado con la seña.
- El dueño la ve en la ficha de la consulta y en la de seguimiento: «Lucía aprobó la opción A», con el día y
  la franja si propuso, y «Agendar el relevamiento», «Aprobar el trabajo» (con la opción marcada), «Escribirle»
  y «Listo, ya lo hablé»; en seguimiento, «Reactivar» con «vuelve». La opción dice «La eligió tu cliente» y
  Consultas, «Tu cliente aprobó». El aviso suma la categoría «Respuestas de tus clientes», prendida, que avisa
  en el momento (la base le pide a la función de avisos por pg_net, con el secreto de Vault de siempre) y se
  repite a la mañana mientras no se atiende.

### 6. Las dos fechas del presupuesto

- «Puede estar listo para» y «Si la seña entra antes del», con calendario. La segunda arranca en hoy más los
  días para la seña de Ajustes («Días para la seña», 2 por defecto, en «Tu presupuesto»); la primera, sugerida
  con el plazo de siempre, hasta que se toca. `problemaDeLasFechas` (y su gemela) rechaza una fecha que ya
  pasó, una entrega antes de la seña y una fecha que no existe (`MN044` a `MN047`).
- La frase de Eliseo reemplaza a los días de fabricación, con la seña del presupuesto adentro: «Debido a la
  agenda del taller y a los plazos de fabricación, la fecha estimada de entrega es el {entrega}. A fin de
  poder confirmar estos plazos, se deberá concretar la seña acordada {sena_acordada} antes del
  {sena_antes}.» Va en el aviso de la plantilla (los huecos `entrega`, `sena_acordada` y `sena_antes`), en el PDF y en «Para cuándo» de
  la página del cliente. Pasado el día de la seña sin seña, la página dice que la fecha dependía de la seña, y
  la ficha lo marca. La plantilla guardada con el texto de siempre del plazo se lee con la frase nueva sin
  tocar la fila.
- La entrega estimada del trabajo sale de la fecha del presupuesto aprobado, y aprobar la propone.

## Lo que este PR decidió por su cuenta

- La hoja «Cómo se usan tus datos» no existe en el código, y la entrega que coordina el cliente no tiene aviso
  de datos: no se inventó un texto de privacidad. La hoja de aprobar lleva la frase del aviso, sin enlace.
- «Pedirle una fecha para medir» es independiente del tilde del estimativo: un presupuesto también puede
  pedirla. La segunda oración de «Esto le avisa…» va solo con el presupuesto.
- En «Cómo lo ve tu cliente», aprobar se simula sin guardar.
- La respuesta queda atendida al agendar, al aprobar, al reactivar o con «Listo»; mientras no, el aviso de la
  mañana la repite.
- El PDF muestra las dos fechas en dos renglones donde iba el plazo; la frase entera va en el aviso de la
  plantilla, para que no se repita.
- «Editar» abre el editor completo, que suma los campos de la consulta, en lugar de sumarle al editor rápido
  los de la obra: es el camino que ya tenía todo lo demás.
- Las respuestas de la consulta no van en el editor completo: viven en su bloque, que siempre está en la
  ficha y se guarda solo.
- Las preguntas nuevas llevan un id `p-` más un uuidv7, que respeta la forma del check.

## Diferencias con lo pedido

- Ninguna que cambie lo que Eliseo puede hacer.

## Alternativas descartadas

- **Dos caminos para el estimativo** (una opción «Estimativo» al lado de las del presupuesto, o un modo
  aparte del editor). Es lo que Eliseo tenía y lo que pidió sacar: el estimativo es el mismo documento con un
  tilde, y así se ve en su página.
- **Que la respuesta del cliente mueva la etapa.** Aprobar desde la página no es confirmar: el trabajo sigue
  en la consulta hasta que Eliseo lo apruebe con la seña. La respuesta es un aviso con acciones, no un cambio
  de estado hecho por alguien sin cuenta.
- **Que el cliente cambie su respuesta desde la página.** Una por revisión: si se equivocó, le escribe al
  taller, y una revisión nueva vuelve a abrir la respuesta.
- **Una firma.** El sí sigue siendo la seña; una firma pediría identidad y validez que la app no da.
- **La seña en días hábiles.** Eliseo pidió «2 días desde la creación»; los días corridos son los del
  calendario que elige, y la app no tiene feriados.

## Consecuencias

- Hay una tercera escritura de alguien sin cuenta. Cada una vive en su función elevada, con su gemela y su
  tope de una por cosa; ninguna tabla tiene grants para anon.
- La plantilla del presupuesto suma tres huecos y los días para la seña; una plantilla guardada antes se lee
  igual.
- La réplica suma `respuestas_al_presupuesto`; un bundle viejo la ignora.

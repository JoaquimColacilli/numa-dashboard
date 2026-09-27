# 0077. El dibujo de Eliseo en las pantallas de sesión

- Estado: aceptada
- Fecha: 2026-09-26
- Enmienda al [0068](0068-la-mesa-y-el-plano.md): el panel de la marca es la excepción a «adentro de
  una tarjeta y pegada a su título», la tabla de escenas suma las pantallas de sesión, la tilde de
  `pulgar` se traza una vez y una pose nueva tiene su receta.
- Enmienda al [0023](0023-sesion-bloqueo-con-huella-y-passkeys.md): el panel de la marca lleva el
  dibujo en entrar, crear la cuenta, recuperar el acceso y la contraseña nueva. El bloqueo no.
- Sigue al [0069](0069-el-dibujo-del-trabajo-del-cliente.md) (lo que ve el cliente no dibuja un
  mueble: Eliseo no va en `/v/` ni en `/o/`), al [0074](0074-lo-que-responde-al-tocar.md) (nada se
  mueve por su cuenta) y al [0075](0075-la-app-abre-sin-pantalla-en-blanco.md) (el esqueleto reserva
  el lugar del dibujo).

## Contexto

Joaquim:

> Quiero sumar al sistema de ilustración a mi hermano, para las pantallas de entrar, crear la cuenta
> y las demás de la sesión: pelado, con barba medio-larga (la típica, no muy larga) y con los lentes
> de obra que usa un carpintero. Haciendo varias cosas: armando un mueble, sonriendo con el pulgar
> arriba. Tiene que parecer de la misma familia que los dibujos que ya están en la app, los de las
> entregas y las pantallas vacías.

La investigación, el personaje y las poses los hizo él y llegaron armados: `Eliseo.tsx`, el caso de
`Ilustracion.test.tsx` y, en `design-reference/eliseo/`, la hoja de modelo, las poses, lo que se suma a
`theme.css`, el marcado del panel y 20 maquetas de las pantallas. Este ADR cuenta cómo se puso en las
pantallas de sesión. El dibujo entró sin tocar una línea.

La estructura de las pantallas no cambia: el panel de la marca y el formulario siguen en el mismo
orden, con los mismos textos y el mismo recorrido de foco. Lo único que cambia de lugar es el lema, que
en el celular y la tablet le deja su lugar al dibujo.

## Lo investigado

Las fuentes las eligió Joaquim. Las volví a leer enteras el 26 de septiembre de 2026 para citar lo que
dicen y no lo que se les supone. Donde una matiza la decisión o va en contra, también está dicho.

### El personaje: una hoja de modelo, la silueta y las formas

- **La hoja de modelo** es el documento que estandariza «the appearance, poses, and gestures of a
  character», para que el trabajo se vea dibujado por una sola mano (_on model_). La entrada de
  Wikipedia está marcada como falta de citas: sirve como definición. Además, deja que la dirección
  permita desvíos. Que la cara no se redibuje nunca es una regla más estricta que la hoja en sí, y es
  nuestra.
- **La ONS** arma sus personajes desde una referencia real, simplificada «en formas simples y
  suaves», con una biblioteca de cabezas ya dibujadas que se pegan sobre cada cuerpo nuevo: «their
  personality is portrayed through their hairstyle, clothing and interactions». Es el método de
  `Cabeza`: una sola pieza para la cara, reconocible por lo que la rodea. Su estilo es el opuesto
  (planos de color, «Avoid using line strokes»), así que se cita por el método y no por el estilo.
- **Valve** diseñó los nueve personajes de TF2 para que se reconozcan en silueta: «Even when viewed
  only in silhouette with no internal shading at all, the characters are readily identifiable», y
  omitió el detalle fino «where possible». Es un juego de acción en 3D, sin contornos; llevarlo a un
  dibujo decorativo de línea es una extensión nuestra. De ahí salen los tres rasgos que se leen en la
  silueta: el cráneo pelado, la barba como mancha y los lentes.
- **Tom Richmond**, caricaturista: el parecido «starts with getting the SHAPES right», no con el
  acabado. Pero son las formas de esa persona, no una cara genérica, y verlas lleva práctica. Es la
  opinión de un oficio, no un estudio.
- **McDonnell, Breidt y Bülthoff** (SIGGRAPH 2012) aplicaron once estilos a la misma cabeza animada: el
  de solo líneas negras (ToonPencil) quedó entre los más atractivos y los toon, entre los más
  amistosos; lo menos atractivo estuvo en el medio, entre lo abstracto y lo realista. No dicen que lo
  simple gane siempre: un estilo toon cayó mal, y el realismo «is not as risky as often discussed».
- **Open Peeps**, de Pablo Stanley, respalda un solo punto: «a face changes completely with the right
  whiskers», la barba cambia a la persona. En lo demás va al revés: el trazo es tembloroso a
  propósito y es un sistema para variar, donde cada combinación es otra persona.

### La línea

- **IBM**, el estilo de línea: «a very limited set of line weights, a 4px grid and simple color rules»,
  no más de cuatro grosores y bien distintos entre sí. Es lo que ya hace el 0068 (1,5 la silueta, 0,75
  lo de adentro, 1 los trazos y 1,75 la marca de la mano). IBM no pide una sola tinta: admite
  degradés.
- **El dibujo técnico** (LibreTexts, NWTC): la línea de otra posición («phantom line») sirve «to show
  alternate positions for moving parts». Es la mano de antes en «saludando». La convención la dibuja
  fina y de trazo largo con dos cortos; los trazos cortos parejos, que son los `trazos` de la
  gramática, en esa convención son la línea oculta. Ver las objeciones.

### La cara y el gesto

- **La sonrisa de Duchenne** suma el músculo de alrededor del ojo, que sube los pómulos: «smiling
  with the eyes». La que mueve solo la boca se lee de cortesía. Por eso, cuando `Cabeza` sonríe, los
  ojos se vuelven arcos y aparecen las mejillas, a la vista a través de los lentes. Es una analogía
  nuestra: la fuente habla de caras reales.
- **El pulgar arriba** (La Nación, columna de opinión del 28/9/2024) no respalda el gesto sin
  reservas: para los adultos es «un “sí” entusiasta», pero la generación Z lo lee con sarcasmo en el
  chat. Habla del emoji, no del dibujo. Ver las objeciones.

### El taller

- **El taladro atornillador** es «Tu herramienta más usada» del carpintero en Buenos Aires, según la
  guía de Servidos (2026), que también lista la cinta métrica. Es el blog de una plataforma comercial,
  y no nombra ningún elemento de seguridad.
- **Los lentes con el taladro**: el primer consejo del CCOHS canadiense es «Wear safety glasses or a
  face shield (with safety glasses or goggles)». También dice «Never drill with one hand while holding
  the material with the other»: en «trabajando», la otra mano de Eliseo cuelga suelta.

### La pantalla

- **WCAG 2.2, 1.1.1**: lo que es pura decoración va «in a way that it can be ignored by assistive
  technology». Es decoración solo si no da información: lo que dice el pulgar, «Listo, ya entraste»,
  ya lo dicen el `h1` y la bajada.
- **WCAG 2.2, 2.3.3** (AAA): la animación que dispara una interacción se tiene que poder apagar, y
  `prefers-reduced-motion` es la técnica suficiente (C39). La tilde llega después de mandar el
  formulario, así que cae acá, y con menos movimiento dura cero.
- **Apple, movimiento**: «In apps, generally avoid adding motion to UI interactions that occur
  frequently», y que nadie tenga que esperar a que termine una animación. La pantalla que más se ve
  («Entrá al taller») no se mueve; la que se mueve se ve muy de vez en cuando, y su botón funciona
  desde el primer cuadro.
- **PostHog** usa su mascota «thoughtfully, not just to fill space», no modifica sus dibujos sin
  aprobación, y la anima al entrar y la deja quieta. En su lista de lo que no hace está la
  «isometric 3D» de moda en SaaS, que apunta a escenas decorativas de volúmenes y no a un plano de
  taller, y la ilustración generada.
- **Atlassian** deja la ilustración de un estado vacío como opcional: se saca si compite con otras
  imágenes o si el espacio no alcanza, y no se achica una grande para meterla en un lugar chico. Es la
  guía del estado vacío, no de una pantalla de entrar. Ver las objeciones.
- **Vance y otros** (CHI 2017, resonancia y seguimiento de la mirada durante cinco días): la atención a
  una advertencia que se ve igual cae a lo largo de la semana, y la que cambia de aspecto la sostiene.
  Es sobre advertencias de seguridad y mide atención, no preferencia; para una pantalla que se abre
  todos los días, que la vista se acostumbre al dibujo es lo que queremos.
- **Chrome y el teclado**: desde Chrome 108, en Android, el teclado achica solo la ventana visible,
  no la del diseño, y `vh`, `dvh` y las consultas por alto no se enteran. Por eso el hueco del celular
  sale del alto de `visualViewport` (el que ya usa `PantallaDeAcceso`), y el tope de 40 dvh es solo
  de la compu.
- **CCyC, art. 53**: «Para captar o reproducir la imagen o la voz de una persona, de cualquier modo que
  se haga, es necesario su consentimiento». El art. 55 agrega que ese consentimiento «no se presume,
  es de interpretación restrictiva, y libremente revocable». El artículo no nombra dibujos; que un
  dibujo reconocible entra es la lectura razonable de «de cualquier modo». Ver las consecuencias.

## Decisión

### 1. El personaje

- **Tres rasgos que se leen en la silueta**: el cráneo pelado de un solo contorno, la barba como una
  mancha con el borde de abajo marcado, y los lentes de obra, una banda envolvente sin marco con la
  muesca de la nariz. Lo demás (el delantal, la remera, los borceguíes) es genérico a propósito.
- **La cara es una sola pieza** (`Cabeza`), con un juego cerrado de cuatro gestos: seria mirando al
  frente (la hoja de modelo), seria mirando abajo (el trabajo), seria mirando arriba (pensar) y
  sonriendo (el pulgar y el saludo). No se redibuja por pose.
- **Un solo encuadre** (`ENCUADRE`): la caja de lo que se ve en las seis poses juntas. Eliseo tiene los
  pies en el mismo lugar y el mismo tamaño en todas, el mueble siempre a su derecha, y mira a la
  derecha, que en la compu es hacia el formulario. De una pantalla a otra cambia lo que hace, no dónde
  está.
- **Las seis poses** son `parado` (la neutra de la hoja de modelo, que no va en ninguna pantalla),
  `trabajando`, `midiendo`, `pensando`, `pulgar` y `saludando`. Cada una es un lienzo de 160 × 120, con
  `aria-hidden`, sin texto, con el `Mueble` de `objetos.tsx` (entero o de trazos) y las marcas de la
  mano del sistema, `TILDE` y `PATA_DE_GALLO`.

### 2. La gramática suma `pelo`

Un solo relleno nuevo, para la barba: `--color-pelo`, un gris medio (`#8a8782` en claro, `#4d4d4d` en
oscuro) que en claro se lee oscuro y en oscuro no se vuelve blanco. `Ilustracion.test.tsx` lo suma a
`GRAMATICA` y exige que sea la única mancha de pelo en cada pose.

### 3. La lámina de la marca

El panel es oscuro en los dos temas (`bg-marca`). Una lámina común ahí no sirve (ver las alternativas),
así que hay una placa propia, `.lamina-de-la-marca` (`Lamina` con `deLaMarca`): `--color-lamina-de-la-marca`
(`#1f1f1f` en claro, `#262626` en oscuro), apenas más clara que el panel, con su grilla en
`--punto-de-la-lamina-de-la-marca`. Adentro, el dibujo cambia de tinta: la tinta pasa a
`--color-sobre-marca`, el papel al gris de la placa, y el costado y el pelo a `--costado-de-la-marca` y
`--pelo-de-la-marca`. En oscuro, `--color-sobre-marca` es la misma tinta que `--color-ink`, que es lo
que mide `rediseno.spec.ts`.

Medido con la fórmula de WCAG 2.2:

| Qué                                             | Claro | Oscuro |
| ----------------------------------------------- | ----: | -----: |
| La placa contra el panel (su borde)             |  1,12 |   1,13 |
| La tinta sobre la placa                         | 16,48 |  12,93 |
| La tinta sobre el pelo (las líneas de la barba) |  8,86 |   6,89 |
| El pelo contra la placa                         |  1,86 |   1,88 |
| El costado contra la placa                      |  1,30 |   1,33 |

`Lamina` sigue siendo el único lugar de un dibujo: `aria-hidden`, `data-lamina` y un solo
`svg.ilustracion`.

### 4. Qué pose va en cada pantalla

`PantallaDeAcceso` suma `pose` y `animarElDibujo`, y cada página pasa la suya.

| Página y estado                                                                                           | Pose         | Se traza | Por qué                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------- | ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrá al taller                                                                                           | `trabajando` | no       | Entrás a su taller y está trabajando, atornillando la tapa de un mueble. Es la que más se ve: la pose es tranquila y la cara mira el trabajo.                         |
| Creá tu cuenta                                                                                            | `midiendo`   | no       | Tomar la medida es el primer paso de un mueble a medida, como crear la cuenta es el primero en la app.                                                                |
| Recuperá el acceso                                                                                        | `pensando`   | no       | Neutra, con el puño bajo la barba y el `Mueble` de trazos de Proyectos vacío.                                                                                         |
| La contraseña nueva: Un segundo, Sin señal, Este enlace no sirve, Se abre desde el correo, Poné una nueva | `pensando`   | no       | Sirve igual para el error del enlace. «Un segundo» dura menos de un segundo: lleva la pose que viene después, así el dibujo no cambia en el medio.                    |
| Revisá tu correo (después del alta y del pedido)                                                          | `saludando`  | no       | Un «hasta ahora» mientras vas al correo, con la mano de antes en trazos. El 0023 dice que es «un registro, no un festejo», y el saludo lo respeta sin trazar nada.    |
| Listo, ya entraste                                                                                        | `pulgar`     | sí       | El mueble terminado y el pulgar arriba, con la tilde que se traza una vez al llegar. Es el final del recorrido y el único festejo.                                    |
| El bloqueo (`PantallaDeBloqueo` y `BloqueoAlVolver`)                                                      | ninguna      | —        | Se ve cada vez que se abre la app: lo que ayuda es que no cambie nada y el ojo vaya a la huella. Y la cuenta puede no ser la de Eliseo: lo que identifica es la foto. |

«Listo, ya entraste» se abre siempre desde el formulario de la contraseña nueva, en la misma
`PantallaDeAcceso`: React conserva el panel y el hueco (el test de la página lo mide con el mismo nodo),
y lo único que se monta es la escena del pulgar, así que la tilde se traza al llegar. No hay `key` ni
nada que remonte el panel.

### 5. Dónde va y de qué tamaño

Un solo DOM y una sola lámina en todos los anchos: `rediseno.spec.ts` cuenta todos los `[data-lamina]`,
también los escondidos. Un envoltorio lleva el hueco y el lema, en ese orden; el hueco lleva
`data-pose`, y el lema va con `hidden lg:block` cuando hay dibujo.

- **En la compu** (desde `lg`), en la fila del medio del panel, donde estaba el lema: la placa arriba,
  alineada a la izquierda como el logo, hasta 480 px de ancho, y el lema abajo, a 32 px. El `svg` ocupa
  el ancho de la placa, con un tope de 40 dvh de alto.
- **En la tablet** (de `md` a `lg`), el hueco llega a 296 px y la placa a 480 de ancho, centrada en lo
  que sobra del panel, arriba del formulario.
- **En el celular**, el dibujo va donde estaba el lema, abajo del panel y a su ancho. El hueco toma el
  alto que sobra, hasta 200 px, la placa lo llena y el `svg` va a su alto, centrado. Si el hueco no
  llega a 120 px, la placa no se muestra; con `compacto` (la ventana visible de menos de 620 px, el
  teclado abierto) no se monta, igual que antes el lema. El hueco es un contenedor de tamaño y no suma
  alto: el formulario queda donde está, con dibujo o sin él.
- Sin `pose` y sin `persona` la pantalla queda como antes, con el lema. Con `persona`, la foto.

Medido en la app, con el build de la rama:

| Ventana                | Hueco       | Placa               | Dibujo (`svg`) |
| ---------------------- | ----------- | ------------------- | -------------- |
| 390 × 844              | 350 × 200   | 350 × 200           | 234,7 × 176    |
| 360 × 700              | 320 × 146,5 | 320 × 146,5         | 163,3 × 122,5  |
| 360 × 640              | 320 × 86,5  | escondida           | —              |
| 390 × 460, con teclado | no se monta | —                   | —              |
| 834 × 1112             | 778 × 296   | 480 × 296, centrada | 362,7 × 272    |
| 1024 × 700             | en la fila  | 369,5 × 283,1       | 345,5 × 259,1  |
| 1440 × 900             | en la fila  | 480 × 366           | 456 × 342      |

En el celular, la placa aparece a partir de unos 674 px de alto visible, en 360 y en 390 de ancho. Por
debajo de 620 el hueco ni se monta.

### 6. El hueco del celular, con CSS

La placa se esconde con `@container (height < 7.5rem)` sobre `.lamina-de-la-marca`, en el mismo
`@layer components`. El hueco es contenedor de tamaño por debajo de `lg` (`@container-size`) y deja de
serlo desde `lg` (`lg:@container-normal`): si siguiera siéndolo en la fila del medio, mediría solo su
relleno y la consulta escondería la placa en la compu. La `Lamina` no lleva utilidades de `display`,
que le ganarían a la consulta. El build minifica la consulta como `@container not (height>=7.5rem)`,
que es lo mismo.

**Chromium evalúa mal la consulta si el hueco está en un flex en columna cuyo alto sale de un
`min-height`**, que era el envoltorio de afuera: calcula con un alto intermedio y deja la placa
escondida aunque el hueco mida 200 px. Por eso, por debajo de `lg`, el envoltorio pasa de
`flex flex-col` a `grid grid-rows-[1fr_auto]` y el panel deja el `flex-1`. Va `1fr` y no
`minmax(0,1fr)`, para que el panel no mida menos que antes.

Probado con una página mínima (el mismo panel, el hueco de 200 px como máximo y un formulario de
440 px, en 390 de ancho), en cada Chromium que hay en esta máquina:

| Navegador                                            | Versión       | Flex con `min-height` (844 / 700 / 640) | Grilla (844 / 700 / 640) |
| ---------------------------------------------------- | ------------- | --------------------------------------- | ------------------------ |
| `chromium-headless-shell` de Playwright 1.63 (e2e)   | 153.0.8010.12 | escondida con 200 y 140 px; bien con 80 | bien en los tres         |
| Chromium de Playwright 1.63                          | 153.0.8010.12 | igual                                   | bien en los tres         |
| Chrome                                               | 153.0.8010.53 | igual                                   | bien en los tres         |
| Edge                                                 | 154.0.4258.37 | igual                                   | bien en los tres         |
| Chromium de Playwright (versiones viejas instaladas) | 151, 147, 145 | igual                                   | bien en los tres         |

No hay un Chromium 141 en esta máquina, así que ahí no lo probé; el error que el pedido describe en el
141 aparece igual en todas las que hay, de la 145 a la 154. En la app, con la grilla, la placa sigue al alto también en vivo: en el `headless-shell`
y en Chrome 153, pasar por 844, 640, 844, 700, 600, 844, 660 y 720 de alto, abrir y cerrar el teclado,
pasar al oscuro y navegar entre pantallas la deja siempre donde corresponde. Queda con CSS, sin
`ResizeObserver`.

### 7. El esqueleto del arranque

La forma del acceso de `EsqueletoDeArranque` (0075) reserva el hueco y la placa con las mismas clases
(`@container-size`, `lamina lamina-de-la-marca`), vacía, sin `data-lamina` ni `svg`: la consulta la
esconde igual. Desde `lg` la placa vacía lleva adentro una caja de 4 × 3 con el mismo tope de 40 dvh,
que le da el alto del dibujo, y abajo las rayas del lema. El envoltorio de afuera pasa a la misma grilla
que la pantalla.

Con eso solo, la placa se corría 58,5 px al pintar React en el celular y la tablet: el formulario del
esqueleto era más bajo que el de «Entrá al taller», así que el panel del esqueleto era más alto y la
placa, que va abajo del panel, subía. Le faltaban el `mt-1` del botón (4 px), el pie de 44 px con su
`-mt-2` en lugar de un renglón de 19,5 (16,5 px) y la nota de abajo (38 px). Con esas tres cosas, en
`/acceso`, el esqueleto y la pantalla coinciden al píxel en 390 × 844, 360 × 700, 834 × 1112,
1024 × 700 y 1440 × 900, en claro y en oscuro: el panel, el hueco, la placa, el formulario y el
título. `esqueleto.test.tsx` ata las clases del hueco y de la placa a las de `PantallaDeAcceso`.

### 8. Lo que se mueve y lo que no

Se mueve solo la tilde de `pulgar`, una vez, en «Listo, ya entraste», con `mano trazar`,
`pathLength="1"` y `maun-trazo`, como la firma de Gracias. `trazar` va con `vector-effect: none`, así
que la tilde trazada queda más gruesa que la quieta y crece con el dibujo, unos 4 px en la compu.
Medido en el build: arranca a los 220 ms (`--dur-medium`), dura 600 (`--dur-trazo`), una sola vuelta,
termina a los 820 ms y a los 3 s sigue terminada y no corre nada en la página. Con
`prefers-reduced-motion`, 0,01 ms y sin demora: aparece hecha. El canto ya se cortó en esa carga.

Nada en loop, al pasar el mouse ni al scrollear, y nada al montar salvo esa tilde. Las otras poses
ignoran `animar`.

### 9. La accesibilidad

El dibujo es decoración: va en la `Lamina`, con `aria-hidden`, sin `<title>` y sin nada enfocable. El
`h1` y la bajada dicen todo, y ningún texto de la pantalla nombra a Eliseo ni cuenta lo que hace el
dibujo. El foco sigue yendo al `h1` cuando cambia el título. El motivo de la excepción de
`[data-pantalla-de-acceso] aside` en `reparto/pantallas.ts` pasa a decir que la marca lleva textos
fijos y, si la pantalla lo lleva, un dibujo `aria-hidden`.

## Alternativas descartadas

- **Una lámina común en el panel.** En claro es una caja casi blanca sobre el panel negro (17,04 de
  contraste): encandila y le gana al formulario. En oscuro, `--color-lamina` (`#111111`) es más oscura
  que el panel (`#1c1c1c`): un pozo. Y con la tinta de siempre, en claro el dibujo desaparece.
- **El dibujo sin placa, sobre el panel.** Es lo que el 0068 vino a corregir: un dibujo suelto flota.
  Las caras del mueble en papel serían del color del panel, y el dibujo perdería su lugar.
- **Llevarlo a la columna del formulario en las pantallas de mensaje** («Revisá tu correo», «Listo»).
  Cambia la estructura y el recorrido del foco, que el pedido deja fijos, y compite con el texto que
  hay que leer. Atlassian lo diría así: se saca el dibujo si compite.
- **La barba de tinta.** En claro sería la mancha más pesada de todo el sistema de dibujos; en oscuro,
  una barba blanca.
- **El pulgar en «Revisá tu correo».** Esa pantalla es un registro, no un festejo (0023): todavía falta
  que abras el mail. El pulgar queda para cuando de verdad terminó.
- **Una pose que cambie en cada visita.** Lo que cambia de aspecto se sigue mirando (Vance y otros); en
  una pantalla que se abre todos los días, lo que tiene que mirar es el formulario. El dibujo de cada
  pantalla es siempre el mismo.
- **Animar el saludo o el taladro.** Sería un loop o un movimiento al montar en las pantallas que más
  se ven: nada se mueve por su cuenta (0074), Apple pide no animar lo que se usa seguido y PostHog, que
  la animación termine quieta.

## Consecuencias

- **El peso.** El dibujo entra por `PantallaDeAcceso`, que está en el chunk `ui` con `@maun/ui`, y el
  `index.html` precarga ese chunk: baja al arrancar, sin otro pedido en serie. El esqueleto va en
  `index`. Medido sobre el build de la 44 (`68d8130`) y de esta rama con la novedad, con gzip -9 y
  brotli de Node:

  | Archivo             | La 44                                  | Esta rama                              | Diferencia                           |
  | ------------------- | -------------------------------------- | -------------------------------------- | ------------------------------------ |
  | `ui-*.js`           | 158,79 kB (50,01 gzip, 43,57 brotli)   | 172,95 kB (54,91 gzip, 47,45 brotli)   | +14,16 kB (+4,90 gzip, +3,87 brotli) |
  | `index-*.js`        | 748,24 kB (206,29 gzip, 158,31 brotli) | 749,19 kB (206,61 gzip, 158,60 brotli) | +0,95 kB (+0,31 gzip, +0,28 brotli)  |
  | CSS (`index-*.css`) | 110,97 kB (21,50 gzip)                 | 112,77 kB (21,82 gzip)                 | +1,80 kB (+0,33 gzip)                |
  | `index.html`        | 24,90 kB (3,73 gzip)                   | 25,59 kB (3,90 gzip)                   | +0,69 kB (+0,18 gzip)                |
  | `vendor-*.js`       | 754,26 kB (218,02 gzip)                | el mismo, con el mismo hash            | —                                    |
  | Todo el JS y el CSS | 1.791,81 kB (504,36 gzip, 413,20 br.)  | 1.808,89 kB (509,96 gzip, 417,72 br.)  | +17,07 kB (+5,60 gzip, +4,52 brotli) |

  Las pantallas lazy de la sesión suman lo de su `pose`: `crear-cuenta` 2,71 → 2,74 kB,
  `nueva-contrasena` 2,23 → 2,33 kB y `recuperar` 0,90 → 0,93 kB.

- **`/v/` y `/o/` bajan el dibujo y no lo muestran**: son el mismo `index.html` y el mismo chunk `ui`.
  El cliente baja 5,8 kB comprimidos más entre el HTML, el CSS, `index` y `ui`, y 4,9 de esos son el
  chunk `ui`, casi todo el dibujo.
- **El acceso es una página abierta.** Cualquiera con el link ve el dibujo de Eliseo. Por el art. 53
  del CCyC hace falta su consentimiento, y por el 55 no se presume y se puede revocar. Eso lo habla
  Joaquim con él. Si cambia de idea, sacar la `pose` de las cuatro páginas deja el lema, como antes.
- **Una pose nueva** se arma con las piezas de `Eliseo.tsx`, en el mismo `ENCUADRE` y sin tocar
  `Cabeza`, con su caso en `Ilustracion.test.tsx`, y va a la tabla del §9 del 0068.

## Objeciones

- **El pulgar arriba no es un gesto sin riesgo.** La fuente del pedido para el pulgar en la Argentina
  es una columna que dice lo contrario de lo que se le atribuye: para los adultos es un «sí»
  entusiasta, pero la generación Z lo lee con sarcasmo. Habla del emoji en el chat, no de un dibujo,
  y se apoya en un posteo, no en un estudio. En «Listo, ya entraste» va con la sonrisa, la tilde y el
  mueble terminado, y lo ve el dueño, que es un adulto: lo implementé como se pidió y dejo el riesgo
  anotado.
- **La mano de antes en «saludando» usa la línea oculta, no la de otra posición.** En el dibujo
  técnico, la línea de otra posición es un trazo largo y dos cortos; los trazos cortos parejos
  (`trazos`, `4 3`) son la línea oculta, y así la usa el 0068 para lo proyectado. Leído con el
  vocabulario del sistema, es «la mano proyectada», no «la mano de antes». No toqué el dibujo; si se
  quisiera la convención exacta, sería una clase nueva en la gramática.
- **En el celular el dibujo se achica antes de irse.** Atlassian pide no achicar una ilustración
  grande para meterla en un lugar chico, y acá la placa va de 200 a 120 px de alto antes de
  esconderse (a 360 × 700 el dibujo queda en el 70 % de su tamaño de 390 × 844). El trazo no escala,
  así que la línea sigue igual, pero el dibujo es más chico. Se implementó lo pedido.
- **El primer cuadro de las otras rutas sin sesión todavía se corre por debajo de `lg`.** El esqueleto
  tiene una sola forma de acceso, la de «Entrá al taller». Abrir en frío «Creá tu cuenta» o «Recuperá
  el acceso» corre la placa 77 y 74,5 px al pintar React en el celular (en la compu, 0). Pasaba igual
  con el lema; con el dibujo se nota más. Arreglarlo es una forma por ruta en `forma.ts` y en el script
  del `head`, que cambia el contrato del 0075, así que queda como propuesta.
- **Nada de esto se probó en un teléfono de verdad.** El umbral de 674 px de alto visible y el de 620
  del teclado salen de Chromium con la ventana achicada, no del Samsung con su barra y su teclado.

## Verificación

- **Unitarias.** `Ilustracion.test.tsx` del zip recorre las seis poses. `Lamina.test.tsx` suma el caso
  de `deLaMarca`. `PantallaDeAcceso.test.tsx` suma ocho: una sola lámina de la marca con un solo dibujo
  y la pose en el hueco, el lema solo para la compu con pose, la foto con `persona`, el lema sin pose ni
  persona, sin dibujo con la ventana visible baja y con dibujo con la alta, la tilde solo con
  `animarElDibujo`, y el foco en el `h1`. Cada página tiene su test con sus poses, y el de la
  contraseña nueva mide que «Listo» traza la tilde en el mismo hueco, sin remontarlo.
  `esqueleto.test.tsx` ata el hueco y la placa del esqueleto a los de la pantalla.
- **E2E.** `acceso.spec.ts`: la lámina de la marca visible con `trabajando` en el celular (390 × 844) y
  en la compu (1440 × 900); a 360 × 700 se ve, a 360 × 640 (hueco de 86,5 px) no, y en los dos casos el
  formulario queda apoyado abajo sin scroll; «Revisá tu correo» con `saludando` y sin `.trazar`, y al
  volver con «Cambiar», `midiendo`. `recuperacion.spec.ts`: el formulario con `pensando`, y al
  guardar, con el `PUT` de `/auth/v1/user` interceptado, «Listo» con `pulgar` y la tilde con una sola
  `maun-trazo` que termina y no vuelve a correr; con `reducedMotion: 'reduce'`, 0,01 ms o menos.
  `teclado.spec.ts`: con el teclado abierto (390 × 460) no hay lámina visible, y el campo y el botón
  siguen a la vista. `rediseno.spec.ts` y `hueco.spec.ts`, sin tocarlos.
- **Las capturas** de las ocho pantallas a 390 × 844 y a 1440 × 900 en claro y en oscuro, y de «Entrá
  al taller» a 360 × 700, 360 × 640, 390 × 460 con el teclado, 834 × 1112 y 1024 × 700, comparadas una
  por una con las 20 maquetas, con un mapa de las diferencias píxel a píxel. La placa y el dibujo
  coinciden en todas; lo que cambia es texto: los mails y el reloj del reenvío, que en las maquetas son
  de mentira, el suavizado de subpíxel de la letra, la bajada de «Recuperá el acceso», que en la maqueta
  de la compu en oscuro rompe en dos renglones y acá en uno, y el anillo de foco del mail en la del
  teclado, que acá está enfocado para abrirlo.

- **`pnpm verify`** en verde con todo esto adentro: 19 de 19 tareas en 12 min 51 s. El dominio, 714
  tests; `@maun/ui`, 171; la app, 1365; la base, 231; el arnés del aviso de versión, 29 (17 salteados
  por proyecto); el del reparto, 9, con `rediseno.spec.ts` y `hueco.spec.ts` sin tocar; el de las
  transiciones, 15 (3 salteados). Antes de empezar, el `verify` de `main` con los dos archivos del zip
  adentro también dio 19 de 19.
- **`pnpm e2e`** completo contra la cuenta de prueba: 586 pasaron y 95 se saltearon por proyecto, en
  39,4 min, sin fallas ni reintentos. Entre ellos, `acceso`, `recuperacion`, `teclado`, `bloqueo`
  (con el primer cuadro del bloqueo) y `abrir-sin-que-conteste-la-red`.

## Desvíos del pedido

- **El formulario del esqueleto** suma el `mt-1` del botón, el pie de 44 px y la nota, además del hueco
  y la placa (§7): sin eso la placa se corría 58,5 px al pintar React.
- **El lema sin pose lleva `lg:pt-0`**, que el marcado de la maqueta no tenía: sin él, la pantalla sin
  dibujo bajaba el lema 8 px en la compu respecto de antes.
- **Los tests de las páginas son uno por página**, con las features reemplazadas por dobles.

## Fuentes

Leídas el 26 de septiembre de 2026.

- IBM Design Language, estilo de línea:
  <https://www.ibm.com/design/language/illustration/line-style/design/>
- ONS, cómo se crean personajes:
  <https://service-manual.ons.gov.uk/brand-guidelines/illustration/creating-characters>
- Hoja de modelo: <https://en.wikipedia.org/wiki/Model_sheet>
- PostHog, identidad visual y la mascota: <https://posthog.com/handbook/brand/visual-identity>
- Mitchell, Francke y Eng (Valve), «Illustrative Rendering in Team Fortress 2», NPAR 2007:
  <https://steamcdn-a.akamaihd.net/apps/valve/2007/NPAR07_IllustrativeRenderingInTeamFortress2.pdf>
- Tom Richmond, el parecido está en las formas:
  <https://www.tomrichmond.com/sunday-mailbag-getting-a-likeness/16/12/2018/>
- McDonnell, Breidt y Bülthoff, «Render me Real?», SIGGRAPH 2012:
  <https://www.scss.tcd.ie/rachel.mcdonnell/papers/Siggraph2012a.pdf>
- Pablo Stanley, Open Peeps: <https://pablostanley.com/work/open-peeps>
- La sonrisa de Duchenne: <https://en.wikipedia.org/wiki/Duchenne_smile>
- Líneas de otra posición en el dibujo técnico (NWTC):
  <https://workforce.libretexts.org/Courses/Northeast_Wisconsin_Technical_College/Technical_Sketching_(NWTC)/03:_Lines_Styles_and_Types/3.01:_Line_styles_and_types>
- El taladro atornillador en Buenos Aires: <https://servidos.ar/blog/como-ser-carpintero-en-buenos-aires>
- CCOHS, taladros y anteojos de seguridad:
  <https://www.ccohs.ca/oshanswers/safety_haz/power_tools/drills.html>
- Mariano Donadío, «La agresión del pulgar hacia arriba», La Nación, 28/9/2024:
  <https://www.lanacion.com.ar/opinion/la-agresion-del-pulgar-hacia-arriba-nid28092024/>
- WCAG 2.2, contenido no textual (1.1.1):
  <https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html>
- WCAG 2.2, animación por interacción (2.3.3):
  <https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html>
- Apple HIG, movimiento: <https://developer.apple.com/design/human-interface-guidelines/motion>
- Vance y otros, la costumbre y las advertencias que cambian, CHI 2017:
  <https://scholarsarchive.byu.edu/facpub/9293/> (solo el resumen: el PDF no abrió)
- Chrome, el teclado y la ventana visible: <https://developer.chrome.com/blog/viewport-resize-behavior>
- Atlassian, el estado vacío: <https://atlassian.design/components/empty-state/usage>
- Código Civil y Comercial de la Nación, arts. 52, 53 y 55:
  <http://servicios.infoleg.gob.ar/infolegInternet/anexos/235000-239999/235975/norma.htm>

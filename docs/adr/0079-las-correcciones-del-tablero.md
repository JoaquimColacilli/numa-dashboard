# 0079. Las correcciones del tablero

- Estado: aceptada
- Fecha: 2026-09-30
- Corrige al [0046](0046-la-vista-del-cliente-una-lista-blanca-en-la-base.md) y al
  [0076](0076-la-vidriera-del-taller.md) (las fotos de la página del cliente se abren en el visor, no en
  otra pestaña), al [0011](0011-dominio-cascada-estados-y-cobro.md) y al
  [0072](0072-el-sueldo-se-topea-por-mes.md) (un cobro reabierto cuenta el sueldo por mes si el taller va
  por mes) y al [0078](0078-los-tesoros-configurables-y-la-fila.md) (el hueco del reparto, la (i) que se
  cierra al moverse y la regla del reabierto en la fila).
- Completa al [0039](0039-archivos-de-los-trabajos.md) (el visor pasa a `shared/ui`), al
  [0050](0050-la-vista-publica-no-depende-del-armazon-de-la-app.md) (con un diálogo abierto, `/v/` no
  scrollea), al [0058](0058-el-estimativo-y-el-relevamiento-en-el-camino-del-cliente.md) y al
  [0067](0067-la-vista-antes-de-aprobar.md) (el bloque del relevamiento técnico y su valor, antes de
  mandar el presupuesto) y al 0046 (la lista blanca suma `relevamiento_centavos`).
- Enmendado el 2026-10-02 por el [ADR 0083](0083-los-trabajos-en-dolares.md): el valor del relevamiento sigue
  en pesos, en `ajustes`; en un trabajo en dólares, el pago de la visita lleva su dólar (el del día si es de
  la fecha del pago).

## Contexto

Joaquim y Eliseo anotaron cuatro cosas en un tablero de Miro, con capturas. Las notas, tal cual:

1. Error o mejora, visto en la compu y en el celular: «En la vista del cliente cuando cliqueás una
   imagen se abre una pestaña nueva cada vez... (En el backend anda bien, se abre el pop up normal con
   la x y la navegación..)»
2. Sobre el camino de «Cocina - Quilmes»: «Relevamiento Técnico. Acá iría también el disclaimer de lo
   que es y cuánto vale.. yo te pongo acá el escrito que iría: El siguiente paso es el relevamiento
   técnico en obra. Es una visita donde relevamos medidas exactas, revisamos instalaciones y definimos
   detalles constructivos para poder proyectar tu mueble al milímetro. A partir de ese relevamiento te
   entrego el diseño 3D y el presupuesto final y definitivo. El valor del relevamiento es de $120.000 y,
   si decidís avanzar, se toma a cuenta como parte de la seña del proyecto.»
3. Sobre la pantalla de cobro de un trabajo («Sueldo a SALARIO $ 1.328.264,58, faltan $ 471.735,42»,
   «El resto a MAUN $ 0»), al lado de la tarjeta «Salario $ 1.467.934» de Inicio. Joaquim: «asumo que
   "sueldo" por trabajo no está teniendo en cuenta el salario del inicio.» Eliseo: «CREO QUE ENCONTRÉ EL
   PROBLEMA. LOS PROYECTOS MÁS NUEVOS MUESTRAN LA DISTRIBUCIÓN CORRECTAMENTE.. LOS QUE INICIÉ EN LA
   VERSIÓN ANTERIOR NO..»
4. Las notas de Joaquim sobre Tesoros: en la compu, «Ganancia» con su (i) queda detrás de la ficha de
   Maun. En el celular, si tocás una (i) y bajás, la leyenda queda abierta, flotando en el medio de la
   nada y siguiendo el scroll.

## 1. Las fotos de la página del cliente

**Qué se vio.** En `/v/`, tocar una foto de «Fotos y planos» o de la vidriera abría otra pestaña con la
foto sola. En la ficha del trabajo la misma foto se abre en un visor, con la X y las flechas.

**La causa.** No era un error: cada miniatura era un `<a target="_blank">` a la foto completa. Lo había
decidido el 0046 («un modal menos en una página pública») y el 0076 lo repitió para la vidriera.

**Decisión.**

- El visor de la ficha pasa a `shared/ui` como `VisorDeImagenes`, genérico: la X, «Anterior» y
  «Siguiente», «N de M» y «Abrir en otra pestaña». Lo del dueño entra por props: `detalle` (el peso) y
  `acciones` («Borrar»). La página del cliente no las pasa, así que ahí no hay nada del dueño.
- En «Fotos y planos» y en la vidriera, las miniaturas son botones («Ver …» y «Foto N de M») que abren
  el visor. El de la vidriera se titula «Más trabajos del taller», y sus direcciones siguen sin llevar
  nada del trabajo del que salió la foto. Los PDF siguen abriéndose aparte.
- Las flechas del teclado van en el `<dialog>` (`alTeclear` de `Hoja`), así andan apenas se abre el
  visor. En la ficha no andaban hasta hacer un clic adentro, y eso también queda arreglado.
- `useVisor` devuelve el foco a la miniatura al cerrar, a mano, porque Safari no lo devuelve solo.
- Con un `dialog` modal abierto, el documento de `/v/` no scrollea
  (`html[data-vista='publica']:has(dialog:modal)` con `overflow: hidden`). Para que la página no salte
  de ancho cuando se va la barra, `useVisor` anota el ancho de la barra al abrir
  (`--barra-del-documento`), y mientras el visor está abierto ese mismo relleno va a la derecha.

**Por qué.** Lo pidió el dueño, que ya usa el visor en la ficha. Una pestaña por foto saca al cliente de
su página, y volver le pide encontrarla.

**Descartado.**

- **Seguir con la pestaña**, como decidió el 0046: es lo que se reportó.
- **Un visor aparte para la página pública:** el de la ficha ya hacía lo mismo, y dos visores divergen.
- **Cerrar el visor con «atrás»**, con una entrada en el historial: pide coordinar con la pila del
  celular ([0066](0066-las-transiciones-del-celular.md)) y con el router. Queda afuera.
- **Un visor de PDF:** los PDF se abren aparte, como hasta ahora.
- **`scrollbar-gutter: stable`**, que era lo pedido para que no salte el ancho. Siempre puesto, reserva
  15 px a la derecha aunque la página no scrollee (o con las barras ocultas) y la corre de su centro:
  lo frenó el test del reparto a 768 px. Y Chrome no guarda ese lugar cuando el documento pasa a
  `overflow: hidden`, así que tampoco evitaba el salto: con barras de verdad, el ancho útil pasaba de
  1425 a 1440 px al abrir el visor, con la reserva siempre puesta o solo con el visor abierto.

## 2. El relevamiento técnico

**Qué se vio.** Mientras falta ir a medir, el cliente leía «Si seguimos adelante, lo próximo es ir a
medir para pasarte el presupuesto.», sin qué es esa visita ni cuánto sale.

**Decisión.**

- **Dónde.** En la tarjeta «El camino de tu mueble», abajo de los pasos, un bloque con el título
  «Relevamiento técnico» y el texto de Eliseo en tres líneas. Aparece en las mismas etapas en que salía
  «lo próximo es ir a medir» (antes del presupuesto y con la visita pendiente, `relevamientoPorHacer`
  del dominio), y mientras se ve reemplaza esa línea. No va en la tarjeta de arriba ni en la (i).
- **El valor.** La última frase lleva `ajustes.relevamiento_centavos`, que arranca en $ 120.000 y se
  cambia en Ajustes, en «Tu taller», al lado de «Seña que pedís (%)». Vacío o en 0 se guarda `null`, y
  el bloque sale sin esa frase. Una fila de la réplica guardada antes de la columna se lee con los
  $ 120.000 de siempre, sin subir `VERSION_CACHE`.
- **Cómo viaja.** Por `vista_del_cliente`, solo antes de mandar el presupuesto (0067). La vista pública
  (`vista_compartida`) y los permisos de `anon` no cambian.
- **La plata no cambia.** El valor no crea un pago. Lo que el cliente paga por la visita se sigue
  cargando como un pago del trabajo, que queda a cuenta de la seña, así que lo que promete el texto ya
  es cierto.
- **La ayuda.** «Cómo lo ve tu cliente» cuenta el bloque.
- **Los tests de los importes.** Los dos que prohibían importes antes del presupuesto se acotaron a lo
  de afuera del bloque, y con el precio puesto: afuera sigue sin haber ningún importe, y adentro, solo
  el de la visita.

**Los retoques al texto de Eliseo**, para confirmar con él:

- «Relevamiento técnico» en minúscula, como los demás títulos de la página.
- «te entregamos» en vez de «te entrego»: el resto del párrafo y de la página hablan en plural.
- «$ 120.000» con el formato de la app, y el valor sale de Ajustes.

**Descartado.**

- **Un paso del camino:** el relevamiento no es un paso (0058 y
  [0059](0059-la-nota-del-relevamiento-reemplaza-al-casillero.md)), y un paso más diría que el trabajo
  avanzó.
- **En la (i) del relevamiento:** solo existe con el estimativo mandado, así que un contacto sin
  estimativo no lo vería.
- **En la tarjeta de arriba**, cerca de «Te pasamos un número estimado»: el importe se leería como el
  estimado.
- **Un valor por trabajo, o proponer el valor en «Ya fui a relevar»:** no se pidió, y el
  [0047](0047-la-sena-se-carga-al-aprobar.md) dejó anotado que proponer un importe crea un pago si se
  confirma sin mirar.

## 3. El sueldo de un cobro reabierto

**Qué se vio.** La pantalla de cobro de un trabajo mandaba al Salario todo lo que quedaba después del
diezmo, $ 1.328.264,58, y decía que faltaban $ 471.735,42, con septiembre ya pasado del sueldo. Los
trabajos nuevos, en cambio, descontaban lo que el Salario ya había recibido en el mes.

**La causa.** Las consultas de solo lectura del 2026-09-30 la confirmaron:

- El trabajo es «Varios Proyectos», el cobro del 25/9 del 0072: se cobró por trabajo, antes de que el
  sueldo pasara a ser por mes.
- Reabierto, la foto de la reapertura guarda ese modo. El cobro siguiente arma la fila con el sueldo por
  trabajo: el tope es el sueldo entero, y lo que el Salario ya recibió en septiembre ($ 1.093.804,20) se
  calcula pero no se descuenta.
- Es la regla del 0011, «se vuelve a cobrar con el modo con el que se cobró». El 0072 la mantuvo a
  propósito («Reabrirlo no lo arregla»), y el 0078 la llevó a la fila.
- Los trabajos nuevos se veían bien porque usan la fila del taller, que va por mes.
- La base hace la misma cuenta que la app, así que ningún control la frenaba. El 2026-09-30 a las 02:05
  (UTC) se volvió a cobrar así, y quedó congelado con $ 1.328.264,58 al Salario.

**Decisión.** Un reabierto se vuelve a cobrar con la fecha, los objetivos y la fila de su foto, como
hasta ahora, pero **el sueldo va por mes si la foto o el taller van por mes**. El taller va por mes con
`sueldo_tope_mensual` o con su fila guardada. Por trabajo, solo si los dos lo son, como el seed. Vale
también para un reabierto de un mes anterior, que cuenta lo que su mes ya recibió.

- Cambian juntas las gemelas: `filaParaLiquidar` de `@maun/db` (por la fila), `planDeLiquidacion` de
  `@maun/domain` (el camino de antes) y `private.liquidar` en los dos caminos
  (`20260930120100_el_reabierto_cobra_por_mes.sql`, con el cuerpo vivo y tres cambios).
- La hoja de «Reabrir el cobro», en un taller por mes, suma: «Lo que sí mira es lo que tu sueldo ya
  recibió ese mes, como en un cobro nuevo.»

**Por qué.** Es la decisión del 0072, «el dueño no piensa su sueldo así. Lo piensa como … un sueldo por
mes», llevada a lo reabierto. Lo demás de la foto se queda: corregir un gasto no reescribe el reparto con
la fila de hoy (0011).

**Lo congelado no se mueve** ([0003](0003-distribucion-congelada.md)). El cobro del 30/9 de «Varios
Proyectos» queda como está. Para corregirlo, Eliseo lo reabre y lo vuelve a cobrar con esta versión. Con
los datos de hoy, la pantalla va a mostrar:

| Renglón           | Monto          | Lo que dice                                         |
| ----------------- | -------------- | --------------------------------------------------- |
| Ingreso           | $ 1.475.849,53 | $ 2.616.000 cobrados menos $ 1.140.150,47 de gastos |
| Diezmo 10%        | $ 147.584,95   |                                                     |
| Sueldo, a SALARIO | $ 706.195,80   | lo que le falta a septiembre; ya no dice «faltan»   |
| El resto, a MAUN  | $ 622.068,78   |                                                     |

Como MAUN tiene su fila guardada, ese trabajo se reparte con la fila de siempre de su foto (el diezmo, el
sueldo al Salario y el resto a MAUN), sin las partes de la fila de hoy.

**Descartado.**

- **Volver a cobrar un reabierto con todos los ajustes de hoy**, con la fila de hoy y sus partes:
  reescribe el reparto al corregir un gasto, que es lo que el 0011 quiso evitar.
- **Reescribir el cobro congelado del 30/9 en la migración:** es un `update` de plata sobre lo congelado
  (0003), y depende de algo que la base no sabe, si esa plata ya salió de la cuenta.

## 4. Tesoros

**Qué se vio.**

- En la compu y en la tablet, «Ganancia» y su (i) quedaban detrás de la ficha de Maun y de «Lo que
  sobra», y la (i) no se podía tocar.
- En el celular, una (i) abierta quedaba flotando en su lugar de la pantalla cuando se deslizaba.

**La causa.**

- **El rótulo no entraba en el hueco.** Mide unos 101 px, y el hueco entre la ficha y «Lo que sobra» era
  de 64 (`AL_COSTADO`). Centrado en el medio del camino, que termina 4 px antes por la punta, pisaba
  22 px de una ficha y 14 de la otra; con el monto de «Probá un cobro» adentro, hasta 68 y 60.
- **La ficha lo tapaba.** En React Flow 12 la capa de los rótulos va siempre debajo de las fichas.
- **La burbuja no se enteraba del scroll.** `Ayuda` es un `popover` fijo en la capa de arriba, ubicado
  una sola vez al abrirse. El scroll de la app es el del `<main>`, o el de un panel o una hoja. Cuando
  el dedo arrastra, el navegador manda `pointercancel`, no un toque afuera, así que el cierre liviano del
  popover no salta.

**Decisión.**

- **El hueco.** El reparto, los insumos y el estante de arriba se corren 64 px: `AL_REPARTO = 128` entre
  la cadena y la columna derecha. `AL_COSTADO` sigue para la tercera columna del estante.
- **El rótulo.** Va centrado en el hueco entre las fichas, y el «+» en el mismo lugar. En ese tramo, el
  monto de la prueba va en su propia píldora debajo de la línea, así el ancho del rótulo no depende del
  monto.
- **La burbuja.** `Ayuda` se cierra con cualquier scroll de afuera de ella (`scroll` en `document`, en
  captura) y cuando su botón se mueve (el plano que se corre o se acerca, mirado cuadro a cuadro
  mientras está abierta). Si cambia el alto de lo que se ve (el teclado, girar el celular), se reubica
  en vez de cerrarse. Si no entra ni abajo ni arriba, queda adentro del `visualViewport`, y si ni
  siquiera entra, lo ocupa con su propio scroll y `overscroll-behavior: contain`.
- **Cinco arreglos chicos**, que salieron al medir:
  - **La franja de color.** La última línea de varias fichas quedaba sobre la franja de 5 px (a 3,4 px
    del borde en el paso de Maun de la fila de siempre y a 4,9 en las partes). `altoDelPaso` suma lo que
    de verdad ocupan los renglones (15 px arriba, no 10) y la línea de deuda o de meta (20, no 18), y
    `ALTO.parte` pasa de 100 a 104. Ahora todas quedan a 8,4 px o más.
  - **El abanico.** Con un último paso alto y las partes corridas debajo de él, la bajada del abanico
    pasaba por detrás de ese paso. Ahora corre 16 px por debajo de la ficha (`centro` en los datos de la
    arista) y las partes bajan lo que haga falta. Si no pasa por debajo, no cambia nada.
  - **«Lo que sobra».** Con un monto largo en la prueba, el nombre se cortaba. La cifra baja a 14 px
    desde los 15 caracteres y a 13 desde los 16.
  - **«vence el 10».** Un renglón con nombre largo y día de vencimiento perdía el «0». Ahora se corta el
    nombre.
  - **El celular de costado.** Con «Probá un cobro», el rótulo del flujo con el monto sacaba la pantalla
    de costado: 57 px a 320, 37 a 360 y 22 a 390 (80, 60 y 45 con $ 12.345.678). El monto va en su propia
    píldora, del otro lado de la línea. Ya no hay scroll de costado en ninguno de los tres anchos.

**Descartado.**

- **Arreglarlo con `z-index`**, poniendo la capa de los rótulos arriba de las fichas o usando
  `ViewportPortal`: la píldora taparía el texto de las fichas («POR MES», «SE REPARTE»), y una ficha
  elegida (z 1000) la seguiría tapando. Que no se pisen lo tiene que garantizar la geometría.
- **Dejar el monto adentro del rótulo horizontal:** pediría un hueco de unos 210 px.
- **Que la burbuja siga anclada a su (i) mientras se desliza**, reubicándola cada cuadro o con anchor
  positioning de CSS. Cerrarla es lo que ya hace la capa del día de la Agenda, y anclarla cuesta:
  - en la capa de arriba quedaría encima de las barras fijas mientras la (i) pasa por debajo;
  - pide detectar el recorte en los scrolls anidados;
  - el plano se mueve con transform;
  - Firefox todavía no tiene anchor positioning.

## Objeciones

- **El plano quedó más chico donde lo limita el ancho.** Toca la objeción 7 del 0078.
  - Medido a 1440 con el panel abierto: con la fila de siempre, de 0,903 a 0,896, porque ahí manda el
    alto; con un paso alto y cuatro partes, de 0,733 a 0,690, un 6 % más chico.
  - La investigación midió, con la fila de siempre, 0,770 → 0,722 a 1440, 0,641 → 0,607 a 1280, 0,543 →
    0,510 a 1024 × 768 y 0,638 → 0,598 a 768 × 1024, sin cambio donde manda el alto.
- **Las del relevamiento, que siguen en pie:**
  - un trabajo que no va a necesitar medir muestra el bloque, con el precio, hasta que se lo pasa a «A
    presupuestar» sin visita (la misma objeción del 0058 con «Falta ir a medir»);
  - hay un solo valor para todo el taller, sin uno por trabajo ni un interruptor para no mostrarlo;
  - el valor por defecto lo reciben también los talleres nuevos, que verían $ 120.000 en las páginas de
    sus clientes;
  - un cliente que ya pagó la visita sigue viendo el valor mientras la visita figura pendiente, porque
    el bloque no mira los pagos. Arriba ve también lo que pagó, a cuenta de la seña.
- **Entre el `db push` y el merge** la app publicada es la de antes. Si Eliseo vuelve a cobrar un
  reabierto por trabajo con esa app, la base cuenta el sueldo por mes y la app por trabajo: rebota con
  `MN008`, «Esta app quedó vieja…». No se mueve plata, y cerrar y abrir la app no lo arregla hasta que se
  publica esta versión.
- **Es un cambio de regla sobre la plata.** Lo pidió Joaquim, sobre la nota de Eliseo del tablero. Falta
  que Eliseo confirme que un reabierto de antes del 0072 se vuelve a cobrar por mes.
- **La cifra de «Lo que sobra» se achica por la cantidad de caracteres**, medida con IBM Plex. Con otra
  letra hay que volver a medirla.

## Consecuencias

- **Dos migraciones:**
  - `20260930120000_el_valor_del_relevamiento.sql`: la columna, su `check`, el grant y
    `vista_del_cliente`;
  - `20260930120100_el_reabierto_cobra_por_mes.sql`: `private.liquidar`.
- **pgTAP:** `40_el_reabierto_cobra_por_mes.sql` es nuevo, y `25`, `27` y `32` suman la columna.
- **El comparador** suma cinco escenarios del reabierto: por trabajo con el taller por mes, por el camino
  de antes, la foto por la fila, el taller que sigue por trabajo y la fila guardada con
  `sueldo_tope_mensual` apagado.
- **`COLUMNAS_DE_AJUSTES`** suma `relevamiento_centavos`, y `elTallerVaPorMes` sale de `@maun/db`.
- **Los e2e nuevos:** `el-plano-de-tesoros.spec.ts` (los rótulos a 1440, 1280, 1024 y 768, mirando,
  probando y editando; la (i) con la rueda y con el dedo; el celular de costado) y
  `el-valor-del-relevamiento.spec.ts`.

# 0081. Los tesoros en dólares

- Estado: aceptada
- Fecha: 2026-10-02
- Completa al [0002](0002-importes-en-centavos.md) (el `Money` genérico en la moneda, `Plata` y el formateo
  desde un string), al [0003](0003-distribucion-congelada.md) (un asiento del libro con dos importes), al
  [0010](0010-sincronizacion-replica-completa.md) (MN034 y MN035), al
  [0018](0018-finanzas-el-diezmo-y-los-movimientos-a-mano.md) (el grupo «Dólares» y sus tres clases) y al
  [0078](0078-los-tesoros-configurables-y-la-fila.md) (la fila reparte la moneda del taller y el estante
  guarda las otras).
- Los trabajos en dólares, que usan estos tesoros, están en el [0083](0083-los-trabajos-en-dolares.md). La
  app en tres idiomas, que escribe esta plata en cada uno, en el [0082](0082-la-app-en-tres-idiomas.md).

## Contexto

En el tablero quedó esto, tal cual:

> Joaco: ¿dolares? (agregar moneda dolar en la app, además de pesos argentinos)
>
> Eliseo: Dolar de una.. (puede tener variantes en los tesoros.)
> Opciones a Crear tesoros y en que moneda estan, y de que modo operan
> Que sean configurables.. (esto puede ser un distintivo cuando lancemos la version "pro" para que accedan a
> X cantidad de Tesoros disponibles.. ( y por default sean 3 ponele)
> a futuro.. posibilidad de agregar todas las monedas.

Hasta acá toda la plata de la app era de una moneda, sin decirlo: `Money` era un entero en centavos de peso,
el libro mayor abría cada movimiento en dos asientos del mismo importe y la fila (ADR 0078) repartía cada
cobro entre tesoros que se suman entre sí. Un dólar guardado se cargaba como pesos, o no se cargaba.

Se midieron dos modelos contra el código:

- **M1.** Un tesoro tiene una sola moneda. La fila reparte la moneda del taller. Los dólares entran por una
  compra con sus dos importes (los pesos que salieron, los dólares que entraron).
- **M2.** Un tesoro en dólares puede estar en la fila y recibe «pesos para pasar a dólares»: un saldo en
  pesos adentro de un tesoro en dólares, que se convierte después.

M2 parte el saldo de un tesoro en dos monedas, y eso toca todo lo que hoy lee un saldo: `saldosPorId`,
`libro_mayor`, `cuidar_el_archivo_del_tesoro` y cada pantalla. Para convertir adentro del mismo tesoro hay
que romper `movimientos_lados_distintos`, y la fila tendría que guardar una cotización adentro de
`previo_del_mes`, que queda congelada en `dist_previo`. Sin señal la app no tiene ninguna cotización. Las
apps de sobres que se revisaron tampoco dejan un sobre en otra moneda que el ingreso.

## Decisión

### Un tesoro, una moneda (M1)

- `tesoros.moneda`, `'ARS'` o `'USD'`, con una lista y no un formato: una moneda nueva es una decisión con
  su migración. Los cuatro de siempre son de la moneda del taller (`tesoros_los_de_siempre_en_la_moneda_del_taller`).
  Las filas de antes la tienen por el default, y el `count` del ensayo dio cero filas que violen los dos
  checks.
- **La moneda no cambia nunca.** El alta de un tesoro es un upsert, y Postgres pide `UPDATE` sobre las
  columnas del `on conflict do update`, así que el grant de `update` de `moneda` tiene que existir. Por eso
  la inmutabilidad la da un trigger, `private.cuidar_la_moneda_del_tesoro()`, con **MN034** si la moneda
  cambia. El reenvío del alta con la misma moneda pasa.
- **La fila reparte la moneda del taller.** `private.problema_de_la_fila` suma el código
  `tesoro-en-otra-moneda` para una obligación, un paso, una parte o el superávit en un tesoro de otra
  moneda; el rechazo sigue siendo MN023 con el código en el `detail`. `guardar_la_fila` le pasa la moneda de
  cada tesoro, leída de la tabla. `repartir_por_la_fila`, `plan_del_reparto`, `previo_del_mes`,
  `lo_del_mes_es_otro` y `fila_de_siempre` no cambian: con la fila validada y la moneda inmutable, ningún
  tesoro en otra moneda llega al plan. Un tesoro en dólares vive en el estante: el menú de sumar y el
  arrastre no lo dejan entrar, y dicen por qué («La fila reparte pesos…»).
- Lo que M2 le daba a Eliseo, que la fila aparte plata para dólares, se tiene con M1 sin mezclar monedas: un
  tesoro en pesos en la fila (por ejemplo «Para dólares») y uno en dólares en el estante. El panel de un
  tesoro en pesos ofrece «Comprar dólares», con ese tesoro de origen y su saldo puestos.
- El código habla de «la moneda del taller» y de «otra moneda» (`MONEDA_DEL_TALLER` es el único lugar que
  dice que el taller reparte en pesos, y `MONEDAS` es una constante). Las etiquetas dicen «dólares» porque
  hoy es la única otra.

### El cambio: una fila con dos importes

Un pase ya era una sola fila de `movimientos` que `libro_mayor` abre en dos asientos. El cambio es lo mismo
con el segundo importe:

- Un valor nuevo del enum, `cambio`, en su propia migración (`20261001120500_el_cambio_de_moneda`, sola en
  la primera tanda): un valor nuevo de un enum no se puede usar en la transacción que lo agrega, y el ensayo
  corre todo en una, como en el ADR 0060.
- `movimientos.monto_destino_centavos`, nulo. `movimientos_forma_segun_tipo` pasa a su versión nueva con el
  rito del ADR 0078: un `cambio` lleva los dos lados y `monto_destino_centavos > 0`; todos los demás tipos lo
  llevan nulo. Las filas de hoy cumplen la nueva sin relleno.
- La regla de monedas va al final de `private.completar_los_tesoros()`, con los dos lados ya completos: un
  movimiento con los dos lados va entre tesoros de la misma moneda, salvo un `cambio`, que va entre monedas
  distintas. Si no, **MN035**. Se mira en toda alta y en toda edición que toque el tipo, un lado o el segundo
  importe, y lee la moneda de los dos tesoros aunque no hayan cambiado: el trigger de antes leía `tesoros`
  solo cuando cambiaba un lado, y un pase en pesos editado a `cambio` sin tocar los lados crearía o borraría
  plata en el libro.
- MN035 tiene dos mensajes con el mismo código, distinguidos por el `detail` (el tipo y las dos monedas): un
  pase entre monedas («Entre pesos y dólares es una compra o una venta», con el `hint` «Actualizá la app y
  cargalo como compra o venta de dólares.», que es lo que le puede pasar a una app sin actualizar) y un
  cambio entre dos tesoros de la misma moneda, que solo arma una app con un error.
- `libro_mayor`: el asiento del destino usa `coalesce(m.monto_destino_centavos, m.monto_centavos)`. La vista
  no suma columnas: la moneda la da el tesoro.
- No hay RPC ni tabla de transferencias: el alta es el upsert de siempre por el UUID del cliente, atómico e
  idempotente.

En la app, el grupo «Dólares» de la hoja de cargar, que sale solo con un tesoro vivo en dólares: «Compra de
dólares» y «Venta de dólares» (tipo `cambio`, de pesos a dólares o al revés) e «Ingreso en dólares» (tipo
`ingreso`, a un tesoro en dólares que se elige, también para los dólares que ya tenía guardados). «Qué
dólar» (Oficial, MEP, Blue, Cripto, Otro) va en `categoria` con su valor en castellano y se traduce al
mostrarlo. «Entre tesoros» ofrece de destino solo tesoros de la moneda del origen. La clase de un
movimiento de tipo `cambio` sale de la moneda de su origen.

### La cotización de un cambio se deriva

La compra y la venta se cargan con los dos importes, que es lo que muestra el banco o el broker; la
cotización no se tipea ni se guarda. Sale de los dos importes, en centavos de peso por dólar, con
aritmética entera y redondeo a la mitad hacia arriba: con $ 725.000 y US$ 500 da $ 1.450. Es el tipo
`Cotizacion` del dominio, el mismo que guardan los pagos de los trabajos (ADR 0083), donde la regla es la
contraria, por lo que se acuerda en cada caso. La cotización de un cambio no se limita al rango de las
guardadas: es para mostrar, y un centavo de dólar mueve la cotización un 0,1 % en una compra de US$ 10.

### Cómo se escribe la plata

- `Money<M extends Moneda = 'ARS'>`: lo que decía `Money` sigue siendo pesos sin tocarlo. `centavos()`
  devuelve pesos; para otra moneda, `centavosEn(moneda, valor)`, con la moneda explícita (un constructor
  genérico con default infiere la moneda del lado izquierdo, y eso es un cast). `sumar`, `restar`, `minimo` y
  `maximo` llevan `NoInfer`, y `sumarTodos` el guarda de uniones: sin eso, pesos más dólares compila e
  infiere la unión.
- `Plata<M>`, un objeto `{ importe, moneda }`, solo donde conviven monedas: el saldo y la meta de un tesoro,
  una línea del libro con dos importes y lo que se formatea de un tesoro. Con `TesoroDelTaller.saldo` como
  `Plata`, el compilador marcó cada lugar que usaba un saldo, también los silenciosos, porque un objeto no se
  suma ni se pasa donde va un `number`. Las cinco sumas que juntaban tesoros distintos («Ahorros» de Inicio
  con su «en N tesoros», «Entre todos», el neto del día con «Todos», archivar y cubrir) quedaron por moneda,
  cada una con un test que fallaba contra el código de antes.
- Un solo formateador, `formatearPlata(centavos, moneda, idioma)`, desde un string decimal exacto y no
  dividiendo por 100: «$» quiere decir pesos y solo en español; el dólar es siempre «US$»; en inglés y en
  portugués el peso es «ARS». Nunca `narrowSymbol`, que da «$» para las dos monedas en los tres idiomas.
  `formatearPesos` queda para la moneda del taller en la app del dueño. `montoParaPegar` no cambia de formato
  nunca: es lo que el cliente pega en su banco.
- Una suma de plata de dos monedas se escribe por moneda, pesos primero. Donde el texto puede bajar de
  renglón van unidas con « · » («$ 2.350.000 · US$ 1.250»: «Entre todos», el neto del día); en una columna de
  montos, en una píldora o al lado de un título van una debajo de la otra (lo pendiente de Inicio, el «Debe» y
  los totales de Clientes), porque juntas no entran a 320 px (`formatearCadaMoneda`).

### Lo que se ve

- «Nuevo tesoro» pregunta «¿En qué moneda?»; con dólares, «Dónde va» ofrece solo el estante y la meta se
  escribe en dólares. Editar un tesoro muestra la moneda y no la deja tocar.
- Un tesoro nuevo en dólares arranca con el ícono de los billetes, que se suma a los de siempre; uno en pesos,
  con la caja fuerte, como antes. Si ya se eligió otro ícono, cambiar la moneda no lo toca.
- Inicio: «Ahorros» cuenta solo pesos; si hay tesoros en dólares, la línea «En dólares» con su suma y,
  debajo, el equivalente en pesos marcado, solo con al menos un cambio cargado: «≈ $ 1.812.500 a $ 1.450, tu
  última compra (28 sep)». La cotización es la del cambio más reciente en fecha; el equivalente nunca se suma
  con pesos reales ni recalcula el pasado.
- Finanzas: el renglón de un cambio con sus dos importes y su cotización, «−$ 725.000 → +US$ 500 · a
  $ 1.450», y el neto de cada día por moneda.
- Archivar un tesoro con plata pide un destino de su misma moneda. Uno en dólares sin otro en dólares vivo no
  se archiva con plata: «Vender dólares» abre la venta con su saldo; si debe, «Comprar dólares» hacia él.
- Cubrir el faltante ofrece solo tesoros en pesos.

## Por qué no hace falta otro candado

Las guardas nuevas leen una sola cosa que no estaba antes: la moneda de un tesoro. Esa columna no cambia
nunca después del alta (el trigger de MN034), así que ninguna operación concurrente puede cambiarla entre
que una guarda la lee y su transacción commitea. Leído contra los candados de hoy:

- `completar_los_tesoros` ya toma `ajustes` `for no key update` (y antes el proyecto `for key share`, si el
  movimiento trae uno) para que una liquidación del mismo taller lo vea entero o no lo vea. Sumarle la
  lectura de dos monedas no cambia el orden ni el alcance.
- `cuidar_el_archivo_del_tesoro` (MN024) lee el saldo con el candado de `ajustes`; archivar un tesoro en
  dólares y cargarle un movimiento se esperan ahí, como cualquier otro tesoro.
- `guardar_la_fila` lee la moneda de cada tesoro para validar; un tesoro que se crea a la vez entra o no a
  la fila según su propia validación, y su moneda ya está fija desde el alta.

Por eso `concurrencia.test.ts` no suma un caso para los tesoros. Los dos que suman los trabajos (un pago a un
tesoro contra archivarlo, y un pago en pesos sin dólar contra pasar el trabajo a dólares) están en el
ADR 0083.

## Lo que ve una app sin actualizar

Entre el push y el merge, y después hasta que el aparato se actualiza:

- Ve el saldo de un tesoro en dólares como pesos.
- Lee `monto_centavos` para los dos lados de un cambio: después de una compra, el tesoro en dólares le
  muestra los pesos pagados, y después de una venta, el tesoro en pesos suma los centavos de dólar como si
  fueran pesos. No escribe nada por verlo.
- Si intenta un pase entre un tesoro en pesos y uno en dólares, la base lo rechaza con MN035, que es
  definitivo y tapa la cola hasta descartarlo. Un cobro de esa app sale ajustado por la base, no rechazado.

Se acepta: Eliseo actualiza al abrir, y el caso es el mismo que el ADR 0078 aceptó para la fila.
`VERSION_CACHE` no se sube: las columnas nuevas viajan solas en `bootstrap()` y `delta()`, y quien lee una
fila de la réplica tolera que le falte la columna (`?? 'ARS'`, `?? null`).

## Alternativas descartadas

- **M2**, por lo de arriba. Queda como el paso siguiente si Eliseo lo pide: la pregunta es si quiere que la
  fila aparte pesos para dólares sin tener que mover la plata a mano.
- **El saldo por moneda adentro de un tesoro.** Es M2 sin la conversión, con el mismo costo en cada lector de
  saldos.
- **El cambio como dos filas, o como una RPC.** Dos filas son dos upserts que pueden quedar a medias sin
  señal, y una RPC rompe el patrón de escritura de los movimientos (un upsert por el UUID del cliente,
  idempotente); la fila con dos importes es atómica y el libro ya sabía abrir una fila en dos asientos.
- **Una cotización de internet para la compra y la venta.** El banco muestra los dos importes; una
  cotización de afuera sería otra que la de la operación, y sin señal no habría ninguna.
- **Una regla de lint con tipos que prohíba la aritmética cruda sobre `Money`.** Los 38 lugares que la
  hacían eran de pesos, y `Plata` cubre los saldos, que es donde conviven monedas. Una regla con información
  de tipos encarece el lint de todo el repo por un riesgo que el tipo ya cierra.

## Consecuencias

- Una suma de plata de tesoros distintos tiene que pasar por la moneda: el tipo lo marca donde hay `Plata`,
  y donde hay `Money<Moneda>` (el importe de un asiento, que toma la moneda de su tesoro) la única afirmación
  con nombre es `importeDelTaller()`, usada solo donde la fila o la clave garantizan pesos.
- El diezmo, el sueldo del mes, la fila y su cuenta, el corte del mes, los gastos de los trabajos y Cocos
  siguen en pesos. Cocos sigue en pesos porque su meta y su tasa viven en `ajustes` y las leen apps sin
  actualizar: una inversión en dólares es un tesoro nuevo del dueño.
- Lo probado: los tipos con `@ts-expect-error`, la cotización con montos chicos, el código nuevo de la fila,
  el libro con un cambio (dominio, al 100 %); `42_los_tesoros_en_dolares.sql` con los checks, MN034 (también
  el reenvío del alta), la forma del cambio, MN035 (también el pase editado a `cambio` sin tocar los lados),
  la fila rechazada, el libro de cada lado, los grants y otro taller; el comparador con el código de la fila
  y un escenario del libro con un cambio.

## Preguntas abiertas

- **La versión pro y su límite de tesoros** («por default sean 3 ponele»): ¿cuentan los cuatro de siempre?,
  ¿un tesoro archivado libera su lugar?, ¿qué pasa con un taller que ya tiene más cuando se publique el
  límite? Queda afuera de este PR.
- **Otras monedas.** El modelo las admite con una migración que sume la moneda a la lista; falta saber cómo
  se escribe cada una y si la sugerencia de cotización tiene una fuente para ellas.

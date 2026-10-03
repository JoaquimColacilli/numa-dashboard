# 0083. Los trabajos en dólares

- Estado: aceptada
- Fecha: 2026-10-02
- Completa al [0003](0003-distribucion-congelada.md) y al [0011](0011-dominio-cascada-estados-y-cobro.md) (lo
  cobrado se reparte en pesos, el libro abre cada pago en su tesoro y un perdido retiene la seña por su valor
  en pesos), al [0010](0010-sincronizacion-replica-completa.md) (MN036 a MN039), al
  [0015](0015-proyectos-el-agregado-que-se-guarda-entero.md) (las claves nuevas del agregado), al
  [0043](0043-las-opciones-de-presupuesto-y-la-sena.md) y al
  [0045](0045-los-costos-estimados-lo-que-hace-falta-y-mover-en-la-agenda.md) (las opciones y la seña en la
  moneda del trabajo; los costos en pesos, con su dólar), al
  [0046](0046-la-vista-del-cliente-una-lista-blanca-en-la-base.md) y al
  [0067](0067-la-vista-antes-de-aprobar.md) (las claves de un trabajo en dólares en la vista del cliente), al
  [0053](0053-como-te-paga-cada-trabajo-y-el-qr-del-enlace.md) («Te paga en» y la cuenta en dólares), al
  [0078](0078-los-tesoros-configurables-y-la-fila.md) (Maun en negativo por dólares guardados), al
  [0079](0079-las-correcciones-del-tablero.md) (el relevamiento de un trabajo en dólares) y al
  [0080](0080-el-presupuesto-adentro-de-la-ficha.md) (`forma: 2` y las cláusulas de la moneda).
- Usa los tesoros en dólares del [0081](0081-los-tesoros-en-dolares.md); los textos van en los tres idiomas
  del [0082](0082-la-app-en-tres-idiomas.md).

## Contexto

El pedido del tablero es el del [0081](0081-los-tesoros-en-dolares.md) («Dolar de una..»). Joaquim decidió
llevar el dólar también a los trabajos: en cada uno Eliseo elige si el cliente ve el precio en pesos o en
dólares, y si le paga en pesos, en dólares o en las dos, en todas las combinaciones. Eliseo contestó las
preguntas del diseño: el dólar lo escribe él, con el MEP y el blue como sugerencia; lo que le pagan en dólares
entra a su tesoro en dólares; los costos de materiales van en pesos, con su dólar; en el presupuesto elige si
el valor de una modificación y lo abonado van en pesos o en dólares, y Maun en negativo solo se avisa.

Hasta acá todo trabajo era en pesos. Cada suma de pagos era cruda (`sum(monto_centavos)`): en `liquidar`, en
`mandar_el_presupuesto`, en la vista del cliente, en `totalesPorProyecto`, en la seña, en el saldo, en
«Facturó el taller» y en los insumos.

## Decisión

### Dos elecciones por trabajo

- **«Precio en»**, `proyectos.moneda`, pesos por defecto: la moneda del presupuesto, las opciones, la seña,
  el saldo y todo lo que el trabajo le cobra al cliente. Se elige mientras el trabajo es una consulta (los
  cinco primeros estados y `en_seguimiento`); después se ve y no se toca (**MN036**). Un trabajo aprobado
  puede volver a «presupuesto enviado», así que la puerta para corregir queda abierta.
- **«Te paga en»**, `proyectos.cobra_en`: pesos, dólares o las dos; null quiere decir la moneda del taller, así
  los trabajos de antes quedan como estaban y uno que pasa a dólares arranca cobrando en pesos. Va en «Cómo te
  paga», con las formas de cada instancia y en su misma mutación, y se cambia cuando quiera: dice qué se le
  ofrece al cliente. La base no lo exige sobre los pagos: un pago registra lo que pasó, y si el cliente trae
  dólares a un trabajo que solo ofrecía pesos, el dueño lo tiene que poder cargar.

Las seis combinaciones: pesos en pesos (lo de antes, sin un carácter distinto en castellano); dólares en
pesos (cada pago en pesos se toma con el dólar de su día y descuenta dólares); dólares en dólares; dólares en
pesos o dólares; pesos en dólares (cada pago se toma al dólar que se acuerde ese día y descuenta pesos); pesos
en pesos o dólares. Un precio en pesos «ajustado por el dólar» no se ofrece: se parece a la indexación que la
Ley 23.928 sigue prohibiendo.

Cambiar la moneda de una consulta con importes ofrece «Pasarlos a dólares con el dólar a $ …» (el campo del
dólar, con el dólar del día puesto) o «Dejarlos en blanco»; los costos no se tocan, y cada pago en pesos pide
su dólar en la misma hoja. Si ya se mandó un presupuesto en la otra moneda, la hoja lo dice.

### Cada pago guarda su moneda, su cotización y adónde entró

`pagos.moneda` (pesos por defecto), `pagos.cotizacion_centavos` (a cuántos pesos se tomó cada dólar, en
centavos de peso) y `pagos.tesoro_id` (el tesoro en dólares al que entró un pago en dólares; uno en pesos no
tiene y entra a Maun, como antes). La cotización la lleva todo pago en dólares y todo pago de un trabajo en
dólares; un pago en pesos de un trabajo en pesos no la necesita.

**Se guarda la cotización y no el equivalente**, al revés que en un cambio entre tesoros (ADR 0081), donde se
guardan los dos importes y la cotización se deriva. Manda lo que se acuerda en cada caso: en un cambio, el
banco muestra los dos importes; en un pago, la cláusula del presupuesto fija una cotización, y cuando un
cliente paga en dólares un trabajo en pesos se acuerda a cuánto se toma cada dólar. La cotización además
quiere decir siempre lo mismo (el equivalente serían pesos en un pago en dólares y dólares en uno en pesos, y
cambiaría de sentido si el trabajo cambia de moneda), y se muestra tal cual se acordó («con el dólar a
$ 1.560») y no sacada de dos importes redondeados ($ 1.559,99).

Una cotización va de $ 1 a $ 100.000 por dólar: un check en los pagos y en el dólar del día, una regla de la
referencia de `forma: 2` y lo que deja cargar el campo.

### Un pago tiene dos cuentas, y nada más

- **El valor en pesos**: el importe si es en pesos y, si es en dólares, sus pesos a su cotización. Es lo que
  se reparte al cobrar, lo que cuenta «Facturó el taller» y lo que mira un perdido para la seña retenida.
- **Lo que descuenta**, en la moneda del trabajo: el importe si es de la misma moneda y, si no, convertido a
  su cotización. Es lo que se resta del precio: la seña, el saldo, lo pagado por delante y «Lo que pagaste».

Toda suma de pagos pasó a ser una de esas dos, en el dominio (`valorEnPesos`, `loQueDescuenta`) con su gemela
en SQL (`private.valor_en_pesos`, `private.lo_que_descuenta`), atadas por el comparador. El compilador no marca
una suma cruda, así que cada una cambió con su test.

Las dos conversiones usan aritmética entera con redondeo a la mitad hacia arriba, el de la cotización de un
cambio, cuidando el entero seguro. Con esa regla, los pesos que la página pide para un saldo en dólares,
cargados con la misma cotización, lo cancelan exacto: `dolaresDePesos(pesosDeDolares(d, c), c) === d` para
toda cotización desde un peso, y un test lo recorre. Redondeando siempre a favor del cliente, como sugería la
nota legal, un saldo pagado justo podía quedar en −US$ 0,01. Al revés no hay exactitud: un pago en dólares de
un trabajo en pesos casi nunca cancela justo un saldo en pesos (queda hasta medio centavo de dólar a su
cotización); lo que queda es saldo, como después de un pago parcial, y por eso en un trabajo en pesos la página
no calcula dólares.

**Cambiar una conversión cambia pagos viejos**: el valor en pesos y lo que descuenta se calculan siempre con
las funciones, desde la cotización guardada, y los leen el libro, «Facturó el taller», los insumos y la vista.
Una regla nueva de redondeo no se cambia sin una migración que congele lo de antes.

### El pago en la app

La fila de un pago es la misma en el formulario del trabajo, la hoja del contacto, el paso del relevamiento,
el pase a aprobado y el cobro (`CamposDelPago`):

1. «Te pagó», con el adorno de su moneda como botón: arranca en la moneda en que paga el cliente si «Te paga
   en» tiene una sola y, si tiene las dos, en la del trabajo. En un trabajo en pesos que cobra en pesos se ve
   como antes, y cargar dólares queda a un toque.
2. Si el pago o el trabajo es en dólares, «Dólar»: para un pago en pesos de un trabajo en dólares viene el
   dólar del día si es de la fecha del pago; si no, vacío. Lo escribe el dueño; nunca se completa solo.
3. Debajo, lo que hace: «Descuenta US$ 1.200 del precio.», «Descuenta $ 1.540.000 del precio.» o «Para el
   reparto vale $ 1.540.000.».
4. Un pago en dólares entra a un tesoro en dólares: con uno solo, va ahí sin preguntar; con varios, «Entra a»;
   sin ninguno, la fila no deja guardarlo y ofrece «Crear un tesoro en dólares».

La cotización y adónde entró se corrigen mientras el trabajo no está cobrado, como el importe.

Un trabajo sin «Te paga en» elegido cobra en pesos, porque null es la moneda del taller: un pago nuevo
arranca en pesos aunque el precio sea en dólares. El pago final del cobro se propone por el saldo: en su
moneda, o en pesos con el dólar del día si es de hoy, que son los pesos que lo cancelan exacto; sin el dólar
de hoy no se propone un importe. «Mandé el presupuesto» sin documento, en un trabajo en dólares, lleva al
armado del presupuesto, porque un precio en dólares sale siempre con su referencia y su cláusula. El selector
«Etapa» de la consulta sigue pudiendo marcar «Presupuesto enviado»: solo cambia el estado y no pone un precio.

### El cobro sigue en pesos, y Maun puede quedar en negativo

`liquidar` suma los valores en pesos. Nada más de la cuenta cambia: la fila, los topes, el previo del mes y
los repartos reciben lo cobrado en pesos, y `dist_cobrado_centavos` es lo cobrado en pesos. Revertir no lee los
pagos. `totalesPorProyecto` devuelve dos números con nombres distintos, `cobradoEnPesos` (el cobro y la neta) y
`cobradoEnSuMoneda` (el saldo y la seña), así el compilador marcó cada lugar que usaba el de antes.

Un pago en dólares está en su tesoro en dólares y no en Maun, pero al cobrar su valor en pesos se reparte desde
Maun. Con la seña de US$ 1.000 en «Dólares», Maun termina el cobro del ejemplo de la investigación en
−$ 901.000; si vende esos dólares a la misma cotización vuelve a $ 549.000, y la liquidación es la misma. La
base no lo impide y la app ya mostraba un tesoro en negativo. La pantalla del cobro calcula cómo queda Maun
(su saldo de hoy, más lo que entra a Maun del pago final, menos lo que el reparto manda a los otros tesoros)
y, si queda en negativo y parte de lo cobrado está en dólares, lo dice antes de cobrar: «Después de cobrar,
Maun queda en −$ 901.000: parte de lo cobrado está en «Dólares».», con «Vender dólares», que abre la venta
con ese tesoro de origen, Maun de destino y los dólares de este trabajo. No frena el cobro. Un reparto que
queda en la apertura no mueve saldos y no avisa.

El libro abre un pago en dólares en su tesoro, con su importe en dólares, y Finanzas lo muestra con su dólar;
uno en pesos entra a Maun, como antes. Los insumos cuentan solo lo que entró a Maun: si contaran lo que está en
«Dólares», el superávit de Inicio restaría plata que Maun no tiene. La ficha muestra lo otro aparte: «y
US$ 1.000 de este trabajo en «Dólares»».

### El dólar del día, uno por taller

`ajustes.dolar_del_dia_centavos` y `ajustes.dolar_del_dia_el`, la fecha para la que vale. Se carga en Ajustes
(«Cómo te pagan») y en «Cómo te paga» de un trabajo en dólares, y lo pide la hoja de mandar un presupuesto en
dólares si no es de hoy. La página del cliente lo usa solo si es de hoy: el dominio lo decide con el `hoy` que
ya recibe. Con un dólar por trabajo, cada uno tendría su cotización vieja; con uno por taller, cargarlo una vez
al día alcanza para todos.

### El presupuesto en dólares

- **`forma: 2`** solo para los documentos en dólares, con `moneda: 'USD'`, `referencia` (la cotización y su
  fecha) y la moneda de lo abonado. `forma: 1` sigue siendo pesos y suma dos claves opcionales, la cláusula de
  la moneda y la combinación con que se armó (`cobraEn`), que una app sin actualizar ignora. Una app sin
  actualizar lee como siempre un presupuesto en pesos, y para uno en dólares `leerDocumento` devuelve null en
  lugar de mostrar dólares como pesos.
- **La referencia en pesos.** Un presupuesto en dólares lleva siempre los pesos: debajo de cada total (el de
  cada opción y el de la seña), «Son $ 3.696.000 con el dólar a $ 1.540, el que vale para pagos del 1 de
  octubre de 2026.». El diseño decía «≈ $ 3.696.000 … del 01/10/2026»: la letra del PDF (IBM Plex Sans, el
  subconjunto latino que trae la app) no tiene el «≈» (U+2248 queda afuera de su `unicode-range`), y una fecha
  solo en números se lee distinto en cada idioma, así que va en letras, como pide el 0082. La página del
  cliente dice lo mismo que el PDF. Al mandarlo, la referencia es el dólar del día si es de hoy; si no, la hoja
  de mandar lo pide, lo guarda como dólar del día y lo congela en el documento. No se recalcula nunca. La vista
  previa del borrador, sin dólar del día, sale sin referencia; un documento mandado sin ella no se lee.
- **Lo abonado en la otra moneda.** En un presupuesto en dólares con lo abonado en pesos (lo que pagó, por su
  valor en pesos), el PDF no lo resta de la seña en dólares para no mezclar monedas: lo dice el aviso del
  relevamiento.
- **La cláusula de la moneda.** La plantilla suma `clausulasDeLaMoneda`, un texto por cada combinación que no
  es pesos en pesos (cinco, no vacíos, de hasta 2000 caracteres), editables en «Tu presupuesto». El borrador
  suma `clausulaDeLaMoneda`, retocable en cada trabajo (null es la de la plantilla). El documento la guarda
  (hasta 4000) y la muestra debajo de la forma de pago. Un trabajo en pesos que cobra en pesos no lleva ninguna.
- **Los huecos, en la moneda que elige el dueño**: `{valor_modificacion}` con la moneda de la modificación
  (pesos por defecto), y `{relevamiento}` en un presupuesto en dólares, en la moneda de lo abonado (dólares por
  defecto: lo que descontó; en pesos, lo que pagó por su valor en pesos).
- `mandar_el_presupuesto` compara la moneda con la del trabajo (MN029 con `moneda` en el `detail`), calcula lo
  abonado con lo que descuenta cada pago, y rechaza un documento `forma: 1` de un trabajo en dólares con MN038,
  antes de comparar los importes.
- «Acordado al aprobar» y los cambios sin mandar comparan solo dentro de una moneda y una combinación de «Te
  paga en»: un cambio de moneda es un cambio sin mandar, y un dólar del día nuevo no lo es.

### Las cláusulas son borradores para un abogado

Las de fábrica en castellano salen de los borradores de la investigación y no se cambiaron. Lo que razona esa
investigación, que no es asesoramiento legal:

- Un precio en dólares que se paga en pesos es el modo más fácil de sostener con un consumidor si la cláusula
  cierra la cotización sin margen: la fuente (Banco de la Nación Argentina), el tipo (dólar billete,
  vendedor) y el momento (el cierre del día hábil anterior al pago). Lo apoya «Racca» (Corte Suprema,
  11/11/2025), que hizo cumplir al pie de la letra una conversión «según cotización del Banco de la Nación
  Argentina».
- La Resolución SIC 4/2025 obliga a exhibir los precios en pesos. Un presupuesto no es una exhibición, pero se
  muestran siempre los pesos (art. 4 de la Ley 24.240). Que el taller no elija la cotización por su cuenta es
  la lectura de la Disposición 377/2026 sobre cláusulas abusivas.
- Cobrar solo en dólares tiene un riesgo de más: el DNU 70/2023 que respalda el art. 765 puede caer (hay
  sesión pedida en Diputados para el 15/10/2026), y en consumo la renuncia a pagar en pesos puede tenerse por no
  convenida. Por eso su cláusula trae la regla de los pesos como salida.

Preguntas para el abogado: ¿billete o divisa, y vendedor o comprador? ¿Qué cotización supletoria si el BNA no
publica o hay un cepo nuevo? ¿Sirve la renuncia del cliente a pagar en pesos? ¿Qué pasa con los presupuestos
en dólares aceptados si cae el DNU? ¿Alcanza «a cuenta del precio» para una seña en pesos de un precio en
dólares? ¿Qué riesgo real tienen los cobros en efectivo en dólares por la Ley 25.345? Para el contador: si un
trabajo en dólares se cobra en pesos, ¿se factura en pesos por cada cobro o en dólares con notas de débito o
crédito? Para Eliseo: qué cotización quiere usar en la cláusula. Si toma el MEP o el blue, cambia la cláusula
en «Tu presupuesto»; la ayuda del dólar del día se lo recuerda.

### La página del cliente

La vista suma `moneda`, `cobra_en`, `dolar_del_dia` (solo en un trabajo en dólares y desde que se mandó el
presupuesto), `cobro_en_dolares` (la cuenta en dólares, solo si el pago que toca se ofrece en dólares por
transferencia; el titular y el CUIT son los de la cuenta en pesos), las formas en dólares del pago que toca y
del siguiente, y en cada pago la moneda, lo pagado en su moneda y la cotización. `pagos[].monto_centavos` pasa
a ser lo que descuenta, así la suma del dominio sigue dando lo pagado en la moneda del precio y un lector viejo
ve números coherentes.

«Cómo pagar» muestra un bloque por cada moneda de «Te paga en»: en la del trabajo, el importe y sus formas; en
pesos de un trabajo en dólares, con el dólar del día de hoy, los pesos de hoy y de dónde salen («Hoy son
$ 1.329.998, con el dólar a $ 1.450 de hoy.») o, sin él, «El importe en pesos te lo pasa el taller el día que
pagás.»; en dólares de un trabajo en pesos, «El importe en dólares lo acordás con el taller el día que
pagás.»: la página nunca inventa una cotización. El precio en dólares lleva siempre su referencia en pesos,
con su cotización y su fecha, y «Lo que pagaste» dice de cada pago lo que descontó y, si fue en la otra moneda,
lo que se pagó y a qué dólar.

### Los costos en pesos, con su dólar

Los costos estimados y los gastos van siempre en pesos: es lo que se paga por los materiales. En un trabajo en
dólares, «Dólar para los costos» (`proyectos.costos_cotizacion_centavos`, por la misma mutación que los costos)
los muestra también en dólares, y cada costo se escribe en pesos o en dólares: el que se escribe en dólares se
guarda en pesos con ese dólar, y la ida y vuelta se lo devuelve exacto. Lo que te queda se calcula en dólares
con ese dólar; sin él, no se muestra y la ficha lo pide. Una app sin actualizar escribe los costos bien, porque
siempre fueron pesos.

### La sugerencia del MEP y el blue

El dólar lo escribe el dueño en todos los campos donde va uno: el dólar del día, el de cada pago, el del cambio
de moneda, el de los costos y el que pide la hoja de mandar. Hay un solo campo (`CampoDelDolar`). Debajo
aparecen como sugerencia el MEP y el blue de DolarApi (`https://dolarapi.com/v1/dolares/bolsa` y `…/blue`, sin
clave; responden `compra`, `venta` y `fechaActualizacion`, con `Access-Control-Allow-Origin: *`, comprobado el
2 de octubre): «MEP $ 1.548 / $ 1.560 · Blue $ 1.535 / $ 1.555 · 18:05». Un toque pone el valor; nunca se
completa ni se guarda solo. Se pide cuando el campo está a la vista, con 4 segundos de espera y como mucho una
vez cada 5 minutos (queda en memoria, también la falla), y no pasa por la cola, la réplica, la base ni el
service worker. Sin señal o sin respuesta la sugerencia no aparece, sin aviso de error, y el campo anda igual.
El cliente no la ve nunca: su página usa solo el dólar del día que cargó el dueño.

## Lo que ve una app sin actualizar

Entre el push y el merge, con la app de `main`, un pago nuevo nace en pesos, sin cotización ni tesoro, y
`guardar_proyecto` resuelve los pedidos sin las claves nuevas con la clave presente. El libro, `liquidar` y la
vista dan lo mismo que antes, porque con todo en pesos la suma en pesos es la cruda y lo que descuenta un pago
es su importe. Se comprobó con la app de `main` contra la base migrada: un cobro, un presupuesto mandado y las
páginas de cuatro trabajos en pesos dieron lo mismo antes y después, y el arnés del reparto pasó entero.

Después del merge, hasta que el aparato se actualiza, la app vieja ve los dólares con «$» y suma crudo, sin
escribir nada por verlo. Guardar el trabajo sin tocar un pago en dólares lo conserva. Lo que no puede hacer
bien lo rechaza la base:

| Código | Mensaje de la base (lo que ve una app vieja)                                                                                       | En la app nueva                                                                                                                   |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| MN036  | La moneda de un trabajo se elige mientras es una consulta (hint: Si hace falta cambiarla, volvé el trabajo a presupuesto enviado.) | La moneda ya no se cambia / Un trabajo elige su moneda mientras es una consulta.                                                  |
| MN037  | Ese tesoro no puede recibir este pago                                                                                              | Ese tesoro no recibe este pago / Elegí un tesoro en dólares que no esté archivado.                                                |
| MN038  | Este trabajo tiene plata en dólares (hint: Actualizá la app y volvé a hacerlo.)                                                    | Esto se armó con la app sin actualizar / Volvé a cargarlo.                                                                        |
| MN039  | A un pago en pesos de este trabajo en dólares le falta su dólar (hint: Actualizá la app y volvé a cargarlo.)                       | Falta el dólar de un pago / Un pago en pesos de un trabajo en dólares necesita a qué dólar se tomó. Abrí el trabajo y completalo. |

MN038 cubre el pedido sin la clave `moneda` que cambia el presupuesto o una opción de un trabajo en dólares o
el importe de un pago en dólares, el cobro de un trabajo con pagos en dólares (si lo cobrado que manda es la
suma cruda y no la suma en pesos; sin eso rebotaría con MN006 en cada reintento) y el documento `forma: 1` de
un trabajo en dólares. Un MN no se reintenta y el cobro optimista se deshace. Guardar «Tu presupuesto» o un
borrador desde una app vieja vuelve las cláusulas a las de fábrica, porque borra lo que no conoce: se acepta,
como el [0081](0081-los-tesoros-en-dolares.md) aceptó su caso, porque Eliseo actualiza al abrir. La página
pública corre siempre el bundle nuevo.

## Lo que cuidan la base y la concurrencia

- El tesoro de un pago lo cuida `private.validar_el_tesoro_del_pago()`: todo pago en dólares tiene tesoro y uno
  en pesos no (check), y ese tesoro es en dólares, vivo y sin archivar; si no, MN037. Lo mira cuando el pago
  entra a un tesoro (un alta de verdad, o un cambio de tesoro o de moneda); en el upsert de
  `guardar_proyecto`, si ya hay un pago con ese id deja pasar y decide el de `UPDATE`, como
  `validar_proyecto_abierto`, así el reenvío de un pago cuyo tesoro se archivó después pasa. Toma primero el
  proyecto y después `ajustes` `for no key update`, el candado con que `cuidar_el_archivo_del_tesoro` lee el
  saldo: archivar un tesoro y cargarle un pago se esperan.
- El dólar de un pago en pesos de un trabajo en dólares lo exige un trigger de constraint diferido (MN039),
  porque `guardar_proyecto` escribe el trabajo antes que sus pagos: sobre `pagos` en el alta y la edición de un
  pago vivo en pesos sin su dólar, y sobre `proyectos` solo con un cambio real de moneda (con `when`, porque
  `guardar_proyecto` nombra `moneda` en cada update y un `update of` se dispara aunque no cambie).
- `concurrencia.test.ts` suma los dos casos: un pago a un tesoro contra archivarlo (el pago espera y termina en
  MN037) y un pago en pesos sin dólar contra pasar el trabajo a dólares.

## Alternativas descartadas

- **Guardar el equivalente** (el importe en la otra moneda) y derivar la cotización: por lo de arriba.
- **Que un pago en dólares entre a Maun en pesos.** Los dólares no son pesos hasta que se venden; Maun mostraría
  plata que no tiene. Entran a su tesoro en dólares, y venderlos es una venta (ADR 0081).
- **Valorar los dólares al cobrar.** Cambiaría la neta según el día en que se cobra, y la cotización de cada
  pago ya es la que se acordó.
- **Un pago en dólares como un pago más un cambio.** Serían dos escrituras por pago, y el cambio no lo hizo el
  dueño.
- **Una tabla aparte para los pagos en dólares, o una columna por moneda.** Cada suma tendría dos fuentes, y una
  columna por moneda deja de andar con la tercera.
- **El dólar del día por trabajo.** Con varios trabajos en dólares, cargarlo una vez al día alcanza; queda
  afuera de este cambio.
- **La moneda por instancia de pago** (la seña en una y el saldo en otra): «Te paga en» con las dos lo cubre.
- **Que la app use sola una cotización de internet.** El MEP y el blue solo se sugieren: la cotización es la que
  se acuerda o la que dice la cláusula.

## Consecuencias

- Lo probado: las conversiones con la ida y vuelta exacta y los empates, el valor en pesos y lo que descuenta en
  las seis combinaciones, la seña y lo pagado por delante en dólares, el libro con un pago en dólares y uno en
  pesos, el margen con los costos en pesos y su dólar, la vista con el dólar del día de hoy, con el de ayer y sin
  él, el documento `forma: 2` y sus gemelas, y los tipos (dominio, al 100 %); `44_los_trabajos_en_dolares.sql`
  con los defaults, los checks y los grants, MN036 a MN039 (también al pasar a dólares un trabajo con un pago en
  pesos, con `set constraints all immediate` para verlo fallar y diferido para verlo pasar), el tesoro del pago,
  el pedido viejo que conserva un pago en dólares, `libro_mayor`, `liquidar`, `mandar_el_presupuesto`, la vista y
  otro taller; el comparador con las conversiones, los pagos en dólares en los totales, el libro, un pedido viejo
  y el documento `forma: 2`. En e2e, `trabajos-en-dolares.spec.ts`: un trabajo en dólares de la visita pagada en
  pesos al cobro, con el presupuesto y su referencia, la página del cliente con y sin el dólar de hoy, dos
  revisiones con los clientes en inglés y en portugués y su PDF, la seña en dólares a su tesoro y el aviso de Maun
  con «Vender dólares»; un trabajo en pesos con un pago en dólares; la sugerencia del MEP y el blue con
  `page.route`, y sin respuesta. `PANTALLAS` y `montos-en-las-tarjetas.spec.ts` suman un trabajo en dólares.
- Fuera de este cambio: un recibo para el cliente, la factura, el medio de cada pago, los gastos en dólares y un
  dólar del día por trabajo.

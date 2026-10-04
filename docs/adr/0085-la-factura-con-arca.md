# 0085. La factura con ARCA

- Estado: aceptada
- Fecha: 2026-10-04
- Completa al [0010](0010-sincronizacion-replica-completa.md) (`comprobantes` en la réplica y los rechazos
  MN040 a MN043), al [0036](0036-avisos-por-dispositivo-fuera-de-la-replica.md) (una segunda función de borde
  con pg_cron, pg_net y Vault), al [0046](0046-la-vista-del-cliente-una-lista-blanca-en-la-base.md) (la vista
  suma `facturas`, con los datos del receptor), al [0051](0051-cobrar-con-mercado-pago.md) y al
  [0054](0054-el-link-de-cobro-de-mercado-pago.md) (la primera escritura de la réplica que no hace el dueño
  desde la app) y al [0080](0080-el-presupuesto-adentro-de-la-ficha.md) (el PDF de la factura sigue al del
  presupuesto).
- Usa los pesos y los dólares del [0083](0083-los-trabajos-en-dolares.md) (se factura solo lo que es en
  pesos) y los tres idiomas del [0082](0082-la-app-en-tres-idiomas.md).

## Contexto

El pedido del tablero, tal cual:

> Facturar en ARCA/AFIP cuando te pagan

Eliseo preguntó si en algún momento se podía integrar AFIP. Joaquim eligió el camino de las apps como
Facturitas: NUMA le pide el CAE a ARCA por web service, con un certificado. Una Factura C por cada pago en
pesos, su anulación con una Nota de Crédito C entera, el PDF con el QR de ARCA, lo facturado contra el tope
del monotributo en Finanzas, y cada taller que se conecta solo desde Ajustes, con un asistente. Todo el
desarrollo, contra homologación; la producción la prende Joaquim una sola vez, después del merge
([`docs/referencia/prender-la-facturacion.md`](../referencia/prender-la-facturacion.md)).

## Decisión

### Qué se factura

- **Una Factura C por pago en pesos, y su anulación con una Nota de Crédito C entera.** Cada cobro tiene su
  factura, como pide la RG 1415 a quien cobra seña y saldo. Un pago en dólares, uno de la apertura o uno
  borrado no se facturan: se dice en el renglón. Se factura con un toque desde el pago y desde el cobro
  (la casilla del pago final), nunca solo.
- **La fecha es la del día del pedido a ARCA**, que siempre cae en la ventana y nunca antes de la última.
- **El receptor según su condición.** El consumidor final sin documento, salvo que el trabajo llegue a
  $ 10.000.000 (`UMBRAL_DE_IDENTIFICACION_CENTAVOS`, mirado por trabajo y no por factura): ahí pide el DNI o
  el CUIT. El responsable inscripto, el monotributista y el exento, con CUIT válido y domicilio.
  `CondicionIVAReceptorId` va siempre (1, 4, 5 y 6 para la clase C, confirmados en el ensayo).
- **El concepto lo elige el dueño en Ajustes** (Productos por defecto), porque lo define su contador.
- **Lo que falta para facturar se dice antes de tocar** y el botón queda apagado. Las mismas reglas viven en
  el dominio y en la base (`loQueFaltaParaFacturar` y su gemela), atadas por el comparador.

### La cola pide, el servidor emite

El dueño pide la factura como guarda cualquier cosa, con o sin señal: `MUTACION_DE_LA_FACTURA` y
`MUTACION_DE_LA_NOTA_DE_CREDITO` van por la cola de salida con un id que se genera al tocar, y
`pedir_la_factura` es idempotente por ese id. La base arma la fila con los datos que lee ella (el importe,
el emisor, el receptor, el ambiente, el punto de venta) y quedan congelados: el PDF de dentro de diez años es
el mismo. Un trigger con pg_net despierta a la función `facturar`, que es la única que habla con ARCA, y un
trabajo de pg_cron cada cinco minutos levanta lo que quedó esperando. Otro, una vez por día, controla los
talleres conectados: el certificado por vencer, lo hecho fuera de NUMA y lo que quedó a revisar.

**La toma es una fecha, no una transacción** (la función habla con ARCA entre llamadas a la base): un
número en vuelo por secuencia (taller, ambiente y tipo), la toma que se extiende al reservar el número, y
nunca se vuelve a pedir un número que pudo quedar autorizado sin consultarlo antes con
`FECompConsultar`. Lo que no se puede saber queda `a_revisar` y traba el pago, no la secuencia. El login
del WSAA se guarda, uno por certificado, tal como llega, y se pide uno por vez: ARCA no da otro mientras el
anterior sigue vigente (`coe.alreadyAuthenticated`), y la espera de diez minutos se confirmó en homologación.

### Lo de verdad no se toca; lo de prueba no ata nada

Una factura de producción autorizada no se borra, ni con la clave del servidor, y traba su pago y su
trabajo: el pago no cambia de importe, fecha ni moneda y el trabajo no se borra (MN043). Para cambiar algo,
se anula. Lo de homologación no traba nada y se borra con su trabajo, porque los e2e vacían el taller de
prueba en cada corrida.

### Los dos ambientes y las trabas

Homologación es para probar y no tiene efecto fiscal; producción factura de verdad. Cada comprobante lleva
su ambiente congelado, y hay cinco trabas para que la regla no dependa de la memoria de nadie:

1. **Sin secretos no hay producción.** Prendida solo si `ARCA_PRODUCCION_HABILITADA` vale exactamente `si`
   (leída sin recortar) y `ARCA_PRODUCCION_LLAVE` es una clave AES-GCM de 32 bytes. Si no, el certificado,
   la subida y la conexión contestan `apagada` antes que cualquier otro motivo, y lo de producción espera
   sin que se llame a nadie.
2. **El ambiente de un taller no se cambia desde una pantalla.** La conexión (ambiente, CUIT, punto de venta
   y desde cuándo) no tiene grant de escritura: la escriben `facturacion_conectar` (producción, después de
   que ARCA aceptó el certificado del taller y encontró su punto de venta, y con el diálogo confirmado) y
   `db:facturacion` (solo homologación y solo el taller de la cuenta de los e2e).
3. **Cada comprobante lleva su ambiente, su CUIT y su punto de venta congelados.**
4. **Cada ambiente habla solo con sus dos hosts**, que viven en un solo archivo (`red.ts`); ninguna variable
   de entorno los cambia.
5. **ARCA mismo:** un certificado de homologación no entra a producción.

**En homologación, NUMA guarda un CUIT inventado** (`20-11111111-2`) y a ARCA le llega el del certificado de
prueba, que la función lee en memoria. Así el CUIT de Joaquim no queda en las filas, los PDF, los QR ni las
capturas. Los intercambios se guardan sin el bloque `Auth`, sin ningún `<Cuit>` y sin el CMS, y del login
solo el resultado y el tiempo.

### La conexión de cada taller, desde la app

Cada taller hace su certificado desde Ajustes › Facturación › «Conectar con ARCA», un asistente de once
pasos. NUMA genera la clave en el servidor (WebCrypto), le da al dueño el pedido del certificado
(`node-forge`) y guarda la clave cifrada con AES-GCM y la llave del proyecto en `private.arca_certificados`;
la clave nunca sale de la función. El dueño lo firma en ARCA con su clave fiscal, sube el certificado, lo
autoriza a facturar, crea el punto de venta y conecta. NUMA conecta recién después de entrar a ARCA con ese
certificado y de encontrar el punto de venta, y con «¿Conectás la facturación de verdad?» confirmado.
Joaquim solo prende la producción, una vez.

Los pasos de ARCA llevan las capturas que saca Joaquim con los datos inventados (`apps/web/src/assets/arca/`,
en WebP, fuera del precache) y los enlaces a las guías oficiales. Un paso sin captura sale igual. Entraron
la 01, la 02, la 03, la 05 y la 07; faltan la 04, la 06 y la 08, que necesitan el trámite hecho.

### La primera escritura de la réplica que no hace el dueño

Hasta acá todo lo que la app replica lo escribía el dueño, por la cola. El [0051](0051-cobrar-con-mercado-pago.md)
descartó un webhook de Mercado Pago justamente por ser «la primera escritura de esta app que no hace el
dueño desde la app». Acá sí hace falta: el CAE lo consigue solo un servidor que tiene el certificado. La
función escribe con la clave del servidor, pero **solo por funciones elevadas** (`facturacion_tomar`,
`facturacion_anotar` con cada paso —reservar, autorizada, rechazada, a revisar, pedida o soltar— y las del
certificado y la conexión), que exigen la toma y dejan cada cambio con su versión. `mantener_metadatos` y `avisar_los_cambios` corren igual con esas
escrituras (probado en el pgTAP 51), así que la app se entera por el delta como de cualquier otro cambio.
A `service_role` se le sacan los grants directos sobre `comprobantes` (un `delete` con la clave del servidor
borraría una factura); sobre `ajustes`, no: una fila de producción sale solo con un certificado activo que
ARCA tiene que aceptar, y sacarlos de una tabla que usa todo el mundo es otro cambio.

### Lo demás

- **El PDF** se arma en el Worker del presupuesto, siempre en castellano, con el QR de ARCA dibujado con
  `uqr`, y no se guarda: la fila congela todo y el mismo comprobante da los mismos bytes. En homologación
  lleva de fondo «PRUEBA · SIN VALIDEZ FISCAL».
- **El tope del monotributo** va en Finanzas, con la escala en el dominio (`monotributo.ts`). Cuenta solo
  lo de producción; en modo prueba la tarjeta lo dice. La escala se lee de la página oficial de ARCA,
  <https://www.afip.gob.ar/monotributo/categorias.asp>, «Valores de aplicación desde el 1/08/2026»
  (consultada el 2026-10-03): de la A, $ 12.009.410,45, a la K, $ 126.610.838,75, con el precio unitario
  máximo de $ 716.840,77. Cambia cada febrero y agosto (`AGENTS.md`).
- **La página del cliente** suma «Tus facturas»: las autorizadas o anuladas y las notas autorizadas, desde
  cualquier etapa (la de la seña existe antes de aprobar); las de producción siempre y las de prueba solo
  mientras el taller siga en homologación. Viajan los datos del receptor, que son del propio cliente y el
  PDF los necesita.
- **Sin avisos push:** los estados se ven en la ficha, en Inicio y en Ajustes.
- **Las dependencias nuevas son dos, solo en la función:** `npm:node-forge@1.4.0` y
  `npm:fast-xml-parser@5.11.2`, con `deno.lock`. Las librerías de ARCA para Node arreglan el TLS con
  OpenSSL, que Deno no tiene.
- **Los e2e no llegan a ARCA.** Todo spec con sesión toma `test` de `e2e/apoyo/prueba`, que lleva una
  traba: un `route` sobre las rutas de la facturación que hace fallar el spec si un pedido sale sin que el
  spec lo responda (ESLint lo exige). En los contextos que abren los arneses, la traba contesta solo el
  `GET /estado` del asistente, como la función real para la cuenta de prueba.

### La etapa 0

Antes de escribir nada, una función temporal desde São Paulo (`supabase-edge-runtime-1.77.0`, Deno 2.1.4),
borrada al terminar. Todos los apretones TLS anduvieron sin ninguna perilla:

| Ambiente     | Pedido                                  | HTTP | ms  | Resultado                 |
| ------------ | --------------------------------------- | ---- | --- | ------------------------- |
| homologación | WSDL del WSAA                           | 200  | 166 | 3222 bytes                |
| homologación | WSDL del WSFEv1                         | 200  | 232 | 77294 bytes               |
| homologación | FEDummy                                 | 200  | 61  | los tres servidores en OK |
| homologación | loginCms con el certificado de prueba   | 200  | 109 | ticket (no se mostró)     |
| homologación | FECompUltimoAutorizado, Factura C, PV 1 | 200  | 51  | 0                         |
| producción   | WSDL del WSAA                           | 200  | 157 | 3198 bytes                |
| producción   | WSDL del WSFEv1                         | 200  | 183 | 77300 bytes               |
| producción   | FEDummy                                 | 200  | 157 | los tres servidores en OK |

A producción fueron solo esos tres pedidos, sin certificado, CUIT ni datos.

## Lo que este PR decidió por su cuenta

- **`apps/web`:** el aviso del modo prueba y «Antes de empezar» van en un `Recuadro` de `shared/ui` (el
  `.panel` de la maqueta); `Hoja` suma `marca`, para la cápsula «Prueba» al lado del título; la primera
  respuesta `apagada` apaga los tres pasos de NUMA del asistente, que no vuelven a llamar; al conectar por
  primera vez, el asistente no cambia a «renovar»; la nota del precio máximo de un mueble sale con
  «Productos» y con «Productos y servicios»; la casilla del cobro y la hoja de facturar abren la ficha del
  cliente para cargar lo que falta; la tarjeta del monotributo se nombra con `aria-label`, como las demás
  tarjetas de plata.
- **El asistente es una columna angosta y centrada, como lo dibuja la maqueta,** y en `PANTALLAS` lleva
  `sinMarco` con ese motivo, como la encuesta del cliente: es una guía para leer de corrido, no una página
  con secciones o con principal y apoyo. El número de cada paso va en el renglón de su título y el
  contenido debajo, con sangría, sin una columna al lado que quede vacía junto a una captura alta (el arnés
  del reparto lo marcaba como hueco).
- **La página del cliente** escribe la fecha de cada factura como «Lo que pagaste» (la maqueta la escribe
  larga) y `leerVistaDelCliente` deja afuera una factura que no puede leer, en vez de romper la página.
- **La base:** `pedir_la_factura` recorta el detalle a 200 y los blancos de las puntas en vez de
  rechazarlo; `MN041` lleva los códigos en el `hint`; la forma de las alertas está en el comentario de
  `descartar_la_alerta_de_facturacion`; `claseDelRechazo` reconoce como del documento solo el 10015, el único
  confirmado.
- **Los puntos de venta de homologación** con el CUIT inventado: el 1 para los pgTAP, el 2 para el taller de
  la cuenta de los e2e y el 3 para el ensayo con `--emitir`.

## Diferencias con lo pedido

- **La limpieza de los intercambios de más de dos años no se escribió.** El control diario no la puede hacer
  sin una función de la base (la tabla no tiene grants para `service_role`) y ninguna de las siete
  migraciones autorizadas la trae. Lo primero que se podría borrar es de 2028. La propuesta, para otro PR:
  `public.facturacion_limpiar_los_intercambios()`, solo para `service_role`, que borra lo de homologación de
  más de dos años y lo de producción de más de dos años cuyo comprobante no quedó autorizado ni anulado, y
  que `control.ts` llama al final.
- **`44_*.sql` también fija las claves de la vista del cliente**, y no estaba en la lista de las que pone en
  rojo la migración de la vista: se sumó.

## Objeciones

- **Los backups.** Con este PR la base guarda comprobantes fiscales y el plan Free no tiene backups (ADR
  0008). ARCA conserva lo autorizado, pero no qué pago y qué trabajo es cada factura. Se implementó igual,
  como pide el pedido, y es lo primero que conviene resolver después.
- **Una factura de prueba viva traba la de producción del mismo pago,** porque el único de un pago facturado
  no mira el ambiente (LEEME 4.1). Solo pasaría si el taller de prueba pasara a producción, que no está
  previsto; si alguna vez hiciera falta, el único tendría que sumar el ambiente.

## Alternativas descartadas

- **Una factura por trabajo al final** (llega tarde para la seña), **facturar solo al cargar el pago**
  (factura lo que se cargó para probar, y una factura no se borra) y **la nota de crédito parcial** (casi
  no se usa y suma casos).
- **Probar en producción con una factura de $ 1** (es real, con un CUIT real) y **un proyecto de Supabase
  aparte** (homologación ya es el ambiente aparte).
- **Que la app espere el CAE** (necesita señal, y un reintento a ciegas duplica), **emitir desde el
  navegador** (la clave no puede estar en el aparato) y **el CAEA** (desde la RG 5782 es contingencia).
- **Confiar en lo que manda la app** (una app vieja en la cola mandaría otro importe) y **leer al cliente al
  emitir** (la factura saldría con datos que el dueño no vio).
- **Trabar igual lo de prueba** (rompe `vaciarTaller`) y **no trabar nada** (el libro y la factura dirían
  cosas distintas).
- **La fecha del pago** (fuera de la ventana si el pago es viejo) e **identificar siempre al consumidor
  final** (DNI de más a quien no lo da).
- **El concepto fijo en 3** (cambia la ventana y la categoría sin que nadie lo decida).
- **Armar el PDF en la función**, **guardarlo** o **traducirlo** (es un documento fiscal argentino).
- **Leer el Monitor de Facturación** (no tiene web service) y **el tope en Estadísticas** (mira hacia atrás).
- **Una tabla de configuración aparte** y **el ambiente editable en Ajustes** (un toque equivocado y se
  factura de verdad).
- **El PEM con saltos de línea en los secretos**, **un secreto por taller**, **las claves sin cifrar en la
  base o en Vault** y **una sola variable para los dos ambientes**.
- **Una librería de ARCA entera**, **el paquete `soap`** y **el CMS a mano con WebCrypto**.
- **E2e contra homologación** (dependen de ARCA y chocan con el ticket) y **no probar contra ARCA hasta
  producción** (se probó a mano: el ensayo y la pasada).
- **Sumarlo a la función de los avisos** (otra responsabilidad, otros secretos y otro ritmo de deploy).
- **`pg_advisory_lock`** (no sobrevive entre llamadas) y **una tabla de secuencias** (`ajustes` ya es una
  fila por taller).
- **Que Joaquim genere y cargue el certificado de cada taller**, **un solo certificado suyo con delegación**
  (la responsabilidad pasaría por su CUIT) y **que el dueño genere la clave en su compu**.
- **Guardar el CUIT del certificado de prueba** (quedaría en la base y en todo lo que sale de ella) y
  **taparlo en cada salida** (depende de que nadie se olvide).
- **Dejar los grants de la plataforma en `comprobantes`** y **sacarlos también de `ajustes`**.
- **Las imágenes de las guías de otras apps**, **dibujar las pantallas de ARCA** y **los pasos solo en
  `docs/`**.
- **Conectar producción con el script** (cada taller dependería de Joaquim).

## Consecuencias

- **Entre el `db push` y el merge,** Eliseo no ve nada distinto: la app de `main` ignora la tabla nueva del
  `bootstrap()` y la clave nueva de la vista.
- **Después del merge y hasta que se prenda la producción,** Eliseo ve Ajustes › Facturación («Todavía no
  está conectada»), sus datos para las facturas, el DNI y el CUIT en la ficha del cliente, y el asistente,
  que en su primer pedido le dice «La facturación de verdad todavía no está prendida. Avisale a Joaco.». Ni
  un botón «Facturar»: sin conexión no se ve nada más.
- **Cada febrero y agosto,** la escala del monotributo. **Los certificados vencen:** cada taller renueva el
  suyo desde Ajustes, e Inicio le avisa 30 días antes. El de prueba vence el 2028-10-02.
- **Ningún test ni `seed.sql` commitea filas de `comprobantes`:** todo lo que las crea termina en rollback.

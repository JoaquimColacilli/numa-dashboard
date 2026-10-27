# 0087. Los tipos de tesoro de Eliseo

- Estado: aceptada
- Fecha: 2026-10-26
- Enmienda al [0078](0078-los-tesoros-configurables-y-la-fila.md) (los tipos, el ciclo y el pago solo), al
  [0011](0011-dominio-cascada-estados-y-cobro.md) (las gemelas nuevas), al
  [0010](0010-sincronizacion-replica-completa.md) (`pagos_de_vencimientos` en la réplica), al
  [0018](0018-finanzas-el-diezmo-y-los-movimientos-a-mano.md) (las clases que salen y las que entran), al
  [0036](0036-avisos-por-dispositivo-fuera-de-la-replica.md) (el aviso de un vencimiento pagado solo), al
  [0072](0072-el-sueldo-se-topea-por-mes.md) (el sueldo del hogar deja de ser siempre por mes) y al
  [0075](0075-la-app-abre-sin-pantalla-en-blanco.md) (el esqueleto dibuja tres tesoros).
- Va con el [0086](0086-el-estimativo-la-respuesta-del-cliente-y-las-fechas-del-presupuesto.md), del mismo PR:
  los puntos 1 a 6 del documento.

## Contexto

Eliseo anotó en su documento «NUMA – Detalles a mejorar», en la pestaña «Finanzas, tesoros y números», lo que
sigue. Con sus palabras; solo se corrigieron tildes y errores de tipeo.

> FINANZAS, TESOROS Y NÚMEROS
>
> - La distribución a los tesoros desde los proyectos parece que está tomando la fecha de generación del
>   proyecto como referencia..
> - El tesoro definido COCOS con el cálculo de intereses ya no hace falta (habría que eliminarlo).
> - El sistema de finanzas familiar, y "consumos" familiares no hacen falta..
>   - Tal vez en su lugar (no sé si es la misma estructura) se puede dejar un sistema de "adelanto de
>     sueldos" por si en algún caso hay un retiro anticipado del pago.. (que quede registrado y no pida
>     pagarlo el día 10).
> - En la parte de TESOROS.. que haya facilidad para cambiar el importe de una caja (sin dar muchas
>   explicaciones). Pienso en casos como que se vendió una maquinaria o me dio intereses una billetera,
>   entonces que se genere un asiento de ajuste y listo.
> - Flasheo un acceso limitado a finanzas para un contador (en teoría, recibos y facturaciones de compra y
>   venta podrían ir cargados aquí, por ende.. en un futuro siendo RI podría un contador simplemente
>   acceder a mi cuenta y ver los ingresos y egresos con las facturas asociadas).
>
> NUMA - Sistema de Tesoros - Especificación v1
>
> Concepto base: los Tesoros son cajas virtuales de dinero. Todo ingreso se reparte entre tesoros por % o
> monto fijo. El movimiento de dinero entre tesoros es libre.
>
> Necesitamos 3 tipos de Tesoros con comportamientos distintos:
>
> 1. TIPO CAJA (Acumulación libre). Es una caja sin compromiso. Acumula sin tope.
>    - Ej: Excedente, Ganancia Neta, Fondo general.
>    - Lógica: solo suma. Nunca tiene fecha límite ni se resetea solo.
>    - Props: nombre, saldo.
> 2. TIPO DEUDA (Compromisos). Este es el más importante. Es dinero que ya NO es ganancia. Está reservado
>    para pagar. Tiene 2 subtipos:
>
>    A) Deuda Destinada (sin tope, de entrega progresiva). Para cosas que separó % de cada cobro pero no
>    tienen un monto mensual fijo.
>    - Ej: Ingresos Brutos (5%), Diezmo (10%).
>    - Lógica: cada vez que entra plata, se le destina X%. Queda visualmente acumulado como "para
>      entregar". Cuando pago/entrego, registro la salida y baja el saldo. Nunca llega a 0 por obligación,
>      solo cuando yo lo entrego.
>    - Props: nombre, %, monto_fijo_opcional, saldo.
>
>    B) Deuda Obligatoria (con tope y fecha límite). Para pagos fijos que vencen.
>    - Ej: Sueldos, Alquiler.
>    - Lógica: tiene tope (ej: $1.000.000) y fecha_limite de pago (ej: día 10 de cada mes).
>    - Ciclo de acumulación: del 10 al 10. [configurable]
>    - Va acumulando con cada cobro hasta llegar al tope. Una vez que llega al tope, deja de recibir.
>    - Al llegar la fecha límite: se debe ejecutar el PAGO. El tesoro se pone en 0 y empieza a juntar para
>      el mes siguiente.
>    - Si llega la fecha y NO alcanzó el tope: el faltante se retira automáticamente del Tesoro General /
>      MAUN para cubrir el pago, se registra como deuda interna, y el tesoro igual se pone en 0 para el
>      ciclo siguiente.
>    - Props: nombre, tope, fecha_limite, ciclo, saldo, reset_automatico_en_fecha = true.
>
>    Caso SUELDOS es el ejemplo perfecto de Deuda Obligatoria B. Es el que valida todo COMPROMISOS.
>
> 3. TIPO META (Proyecto en positivo). Es ahorro para un objetivo, en tono positivo. No es deuda.
>    - Ej: compra inmueble, máquina, refacción.
>    - Lógica: tiene objetivo (ej: $20.000.000) y fecha_estimada opcional. Acumula hasta llegar al
>      objetivo. No se resetea por fecha, solo cuando se completa o se decide usar el dinero.
>    - Props: nombre, objetivo, fecha_estimada_opcional, saldo.
>
> Reglas generales para el dev:
>
> - Todos los tesoros pueden recibir dinero de cualquier origen (por reglas de reparto).
> - Todo el módulo COMPROMISOS debe funcionar con lógica de Tipo 2B.
> - Visualmente, Tipo 2 y 3 deben mostrar barra de progreso hacia el tope/objetivo. Tipo 1 solo muestra
>   saldo.
> - El Tesoro General / MAUN es el que cubre los faltantes de Tipo 2B.

El acceso para un contador queda afuera de este PR.

La especificación se apoya en la fila que ya existe ([0078](0078-los-tesoros-configurables-y-la-fila.md)):
obligaciones, compromisos, ahorros fijos, ahorros por porcentaje y superávit, en ese orden. El reparto no
cambia de forma; cambian cómo se llaman y se ven los tesoros y cómo se comportan los compromisos.

## Decisión

### 1. La fecha del reparto es la del cobro

- La causa estaba en la app: `fechaDelCobroPropuesta` (`entities/proyecto/model/despiece.ts`) proponía el día
  del último pago aunque el trabajo no estuviera saldado. Para un trabajo en curso con la seña cobrada cerca del
  alta, la proyección de la ficha y la pantalla de cobro tomaban ese día viejo, y con él los topes y el ciclo
  de ese mes; por eso parecía la fecha de generación del proyecto.
- Ahora: una reapertura, su día; con un pago final, ese día (nunca después de hoy); saldado con sus pagos, el
  día del último pago; si no, hoy. La base no tenía la causa (`private.liquidar` usa la fecha que le manda la
  app) y lo congelado no se reescribe.

### 2. Los tipos

El tipo sale de dónde está el tesoro en la fila y de si tiene objetivo, como antes salía su grupo; no se
guarda aparte (el 0078 descartó guardarlo y sigue valiendo). `queEsElTesoro` del dominio.

| Tipo              | En la fila                                                                                                                                                          | Se ve                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Caja              | el superávit, una parte del reparto o un ahorro fijo sin objetivo, o afuera de la fila. Maun es siempre caja, aunque tenga un paso en la fila: es el tesoro general | solo el saldo                                                                      |
| Deuda destinada   | una obligación (el diezmo, Ingresos Brutos)                                                                                                                         | «Para entregar $ …», sin barra, porque no tiene tope                               |
| Deuda obligatoria | un compromiso                                                                                                                                                       | la barra de lo que juntó en el ciclo contra su tope, «vence el 10» y lo adelantado |
| Meta              | un ahorro fijo o por porcentaje con objetivo, o afuera de la fila con objetivo                                                                                      | la barra del saldo contra el objetivo y, si tiene, «para marzo de 2027»            |

Las tarjetas de Inicio, las fichas y el panel de Tesoros, el estante y «Nuevo tesoro» llevan el tipo con esas
palabras. «Nuevo tesoro» pregunta primero el tipo y después lo que pide cada uno. El panorama de Inicio agrupa
por tipo: para pagar (las deudas), las metas, las cajas (sin los insumos) y los insumos.

### 3. Deuda destinada

Lo de las obligaciones, con «para entregar» donde decía «a pagar», y en lugar del porcentaje puede llevarse un
monto fijo de cada cobro (`montoFijo`), nunca más de lo que llega. El diezmo sigue por porcentaje, porque su
lugar en `proyectos` es un porcentaje. Sus códigos en `problemasDeLaFila` (`monto-fijo-invalido`,
`diezmo-por-monto`), sus textos y sus casos en el comparador. Registrar el pago baja lo que hay para entregar;
nunca vuelve a cero sola.

### 4. Deuda obligatoria

- Tiene tope (la suma de sus renglones, si los tiene), un día de pago del 1 al 31 (si el mes no lo tiene, el
  último) y «Se paga sola», prendido al crearlo.
- El ciclo va de un vencimiento al siguiente: el que vence el día V es [vencimiento anterior, V). Con el día 10
  es el «del 10 al 10». Se configura con el día y no aparte: un ciclo que cortara otro día que el pago haría que
  el pago se llevara lo juntado para el ciclo que viene. Con el día 1, el ciclo es el mes del calendario, lo
  mismo que «por mes».
- Junta hasta su tope en cada ciclo, con lo que recibe por la fila y las coberturas a mano del ciclo
  (`cubre_el_mes` pasa a ser el inicio del ciclo que cubre). Llegado el tope, deja de recibir.
- Los renglones quedan con nombre y monto. El vencimiento es uno por compromiso, el día de pago, en la Agenda,
  en Inicio y en el aviso.
- «Registrar un adelanto» es un gasto desde ese tesoro, con monto, fecha (hoy) y una nota opcional. Cada gasto
  desde una deuda obligatoria cuenta para un vencimiento: el que se registra desde un vencimiento, para ese,
  aunque se registre después (`movimientos.vencimiento`); los demás, para el del ciclo de su fecha. Si el que le
  toca ya se pagó, la base lo corre al siguiente sin pagar (`private.fijar_el_vencimiento`), así uno que llega
  tarde por la cola no hace pagar dos veces.
- El día V, con «Se paga sola», la base hace el pago, una sola vez por tesoro y vencimiento:
  - lo que falta pagar es el tope menos lo pagado para ese vencimiento, nunca menos de 0;
  - el saldo es el de lo fechado antes de V;
  - si el saldo no alcanza, Maun pone la diferencia con un pase que dice «Deuda interna»; Maun puede quedar en
    negativo, y se ve;
  - el pago es un gasto desde el tesoro por lo que falta pagar;
  - si sobra, vuelve a Maun;
  - el tesoro queda en 0 y el ciclo nuevo arranca.

  Todo fechado V aunque la base lo escriba después. Estos movimientos no cuentan como recibido ni como pagado de
  ningún otro ciclo, se distinguen en Finanzas («Pago del día de pago», «Deuda interna», «Sobrante del día de
  pago», sin editar) y se ven en el panel: «El 10 se pagaron $ 900.000 · Maun puso $ 270.000».

- Sin «Se paga sola», el día V no se mueve nada: el vencimiento pide «Registrar el pago» por lo que falta pagar.
- Maun puede seguir siendo un compromiso, como en la fila de siempre, pero nunca se paga sola ni se cubre a sí
  misma (`paga-sola-en-maun`).
- La deuda interna queda anotada y a la vista. No se devuelve sola.

### 5. Cómo lo hace la base

- `public.pagos_de_vencimientos`: la foto de cada pago (el tope, lo pagado antes, el saldo antes de V, lo pagado,
  lo que puso Maun y lo que volvió), única por tesoro y vencimiento. `libro_mayor` la cuenta como hasta tres
  líneas fechadas el vencimiento. Va a la réplica; el dueño solo puede borrarla.
- `private.pagar_los_vencimientos()` la corre cada hora el job `pagar-los-vencimientos` de pg_cron, como el
  aviso de la mañana. Paga los vencimientos que ya llegaron en el día del taller (`private.hoy_del_taller`, con
  la zona horaria de los avisos), también los que se perdió si un día no corrió, y nunca uno anterior a que ese
  compromiso se guardó con «Se paga sola» (`pagaSolaDesde`, que pone la base al guardar). Cada taller en su
  bloque: el que falla queda anotado y no frena a los demás. Toma los ajustes del taller `for no key update`,
  como una liquidación y todo movimiento, y escribe sin sesión respetando los triggers de metadatos; el aviso de
  cambios sale para que la app lo vea.
- La cuenta del pago es dominio (`pagosQueCorresponden`, `pagoDelVencimiento`, `cuentaDelVencimiento`) con su
  gemela en el comparador, y la app la usa para mostrar el ciclo y lo que va a pasar el día V.
- En Inicio, el faltante dice «El 10 se paga el alquiler y faltan $ 270.000. Si no entra más plata, los pone
  Maun.», con «Cubrir desde otro tesoro» como antes. «La fila de octubre» muestra cada compromiso con su ciclo.
  El aviso de la mañana de un vencimiento pagado solo dice cuánto se pagó y cuánto puso Maun.

### 6. Meta

Un tesoro con objetivo, que suma una fecha estimada opcional (`tesoros.meta_fecha`, solo con meta). Junta hasta
llegar al objetivo: la pantalla ya no ofrece «sin fin» para un tesoro con objetivo, y lo guardado así se respeta
hasta que lo edite. Si usa la plata (un gasto desde la meta), el saldo baja y vuelve a juntar hasta el objetivo,
salvo que la archive. Sin objetivo, es una caja. Un tesoro en dólares con su objetivo en dólares también es una
meta, aunque la fila, que reparte pesos, no lo vea.

### 7. Nada se mueve solo hasta que Eliseo guarde

- Una fila guardada con la forma de antes se lee como siempre: los compromisos «por mes» son un ciclo con el día
  1 sin «Se paga sola», con los vencimientos de sus renglones; los que «se renuevan al pagar» siguen así; las
  metas «sin fin», también. La fila de siempre, igual. Con la fila de MAUN de producción y tres cobros de
  ejemplo, el dominio de `main`, el de la rama, el SQL de antes y el migrado reparten exactamente lo mismo.
- La primera vez que entra a Tesoros después del PR, el borrador le propone la forma nueva con los triángulos de
  revisión (`conLaFormaNueva`): cada compromiso menos el de Maun con «Se paga sola», con el día del primer renglón
  que tenía día (o el 10, el de Eliseo) y sin días en los renglones.
- La hoja de guardar lo explica, y por cada compromiso que pasa a pagarse solo con plata de antes de su ciclo (el
  saldo, menos lo que juntó en el ciclo, más lo que ya pagó en él), pregunta qué hacer con esa plata, sin nada
  marcado: pasarla a Maun, pasarla a otro tesoro o «Ya no está», un ajuste que la saca. Sin esa respuesta no se
  guarda. Es lo que va a pasar con el Salario de MAUN, que tiene plata de cuando era el tesoro de la casa.
- Desde que guarda, la forma nueva vale para los cobros que vengan, y el primer pago solo es el del primer
  vencimiento después de guardar.

### 8. Cocos

- Sale todo lo del rinde: `proyeccionCocos` y sus tests, la tasa en Ajustes, la proyección de Inicio y la hoja
  «Corregir el saldo de Cocos» (la reemplaza «Ajustar el saldo», en cualquier tesoro). El formulario de
  movimientos ya no ofrece el aporte, el retiro ni el gasto de Cocos; los movimientos viejos se siguen viendo como
  están. `faltaConfigurar` no miraba Cocos.
- Cocos se archiva como cualquier tesoro, por el camino de siempre: si tiene saldo, la hoja pasa la plata al
  tesoro que él elija, y si está en la fila, hay que sacarlo antes. Lo archiva él desde la app.
- Un taller nuevo nace con el hogar, Maun y el diezmo (`private.sembrar_los_tesoros`). El esqueleto de arranque
  dibuja tres tesoros, y el pgTAP del alta y los e2e cuentan tres.
- `ajustes.tasa_cocos_anual_bp` queda sin uso y `ajustes.meta_cocos_centavos` solo como respaldo: mientras Cocos no
  tenga su meta en `tesoros`, `liquidar` y `guardar_la_fila` leen la de `ajustes` (la de MAUN reparte el 75 % al
  GALPON hasta esa meta). Editar la meta la escribe en `tesoros`; vaciarla escribe 0, que es «sin meta», porque
  un null volvería a la de `ajustes`. Guardar Cocos sin tocar la meta no escribe nada. No se borran.

### 9. La casa

- El formulario de movimientos ya no ofrece «Ingreso al hogar» ni «Gasto del hogar», ni sus categorías; Inicio y
  Finanzas ya no muestran «Gastó el hogar». Lo viejo se sigue viendo en Finanzas. Un pago o un adelanto desde el
  hogar va por «Gasto de un tesoro», como desde Cocos.
- El tesoro de la casa (en MAUN se llama Salario) es la deuda obligatoria del sueldo: con «Se paga sola», el día
  del pago su plata sale. La regla de «siempre por mes» del sueldo del hogar se va; lo que antes resolvía gastar de
  ahí durante el mes, ahora lo resuelve el adelanto.

### 10. Ajustar el saldo

- En la hoja de cada tesoro (la que abre «Editar» en el panel de Tesoros en la compu y la tablet, y en el
  celular), al lado de «Archivar»: «Ajustar el saldo».
- La hoja: «Tiene ahora», con el saldo de hoy; debajo, en vivo, «Se suman $ 50.000» o «Se restan $ 20.000»;
  «Por qué», opcional, con «Intereses», «Venta» y «Corrección» para tocar, o texto libre; y la fecha, hoy. Un
  primario, «Ajustar», sin diálogo de confirmación.
- Es un movimiento `ajuste` por la diferencia, con el motivo como categoría. La apertura es un ajuste con la
  categoría «Apertura», que no se acepta como motivo, así se distinguen. No pasa por la fila, no cuenta para ningún
  tope ni ciclo, y las Estadísticas lo siguen dejando afuera. Anda en cualquier tesoro, no en los insumos, que no
  son un tesoro.

### 11. Las ayudas (i)

| Dónde                 | Texto                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Caja                  | Junta sin tope. No vence ni vuelve a cero sola. Maun es la caja general del taller.                                                                |
| Deuda destinada       | Se lleva una parte de cada cobro, en porcentaje o un monto fijo. Queda para entregar hasta que registrás el pago.                                  |
| Deuda obligatoria     | Junta hasta su tope entre un vencimiento y el siguiente. El día de pago se paga y arranca de cero. Si no llegó al tope, lo que falta lo pone Maun. |
| Meta                  | Junta hasta llegar al objetivo. Cuando llega, deja de recibir y lo que le tocaba sigue hacia abajo.                                                |
| Se paga sola          | El día de pago, NUMA anota el pago. Si no juntó el tope, lo pone Maun y queda anotado como deuda interna.                                          |
| Registrar un adelanto | Si sacás una parte antes del día de pago, anotala acá: ese día se descuenta.                                                                       |
| Deuda interna         | Lo que Maun puso para cubrir un pago que no llegó a su tope.                                                                                       |

## Lo que este PR decidió por su cuenta

- El rinde sale para todos los tesoros, no solo para Cocos: `tesoros.rinde_anual_bp` queda sin escribir.
- La propuesta de la forma nueva sale una vez por aparato (una marca en el navegador, como la lámina de la
  primera vez) y solo con una fila guardada: un taller con la fila de siempre no tiene nada que revisar hasta
  que la guarde.
- «Registrar un adelanto» abre la hoja de movimientos de siempre, con el gasto desde ese tesoro, la categoría
  «Adelanto» y la fecha de hoy. «Registrar el pago» desde un vencimiento lleva ese vencimiento.
- Las categorías que escribe la app («Adelanto», «Plata de antes de su ciclo», «Ya no está», «Intereses»,
  «Venta», «Corrección», «Deuda interna») se guardan en castellano y se traducen al mostrarlas, como las demás.
- «Ya no está» es un ajuste con esa categoría, fechado hoy.
- El panorama cuenta al hogar en «para pagar», porque es la deuda obligatoria del sueldo.
- Los gastos nuevos desde el hogar se siguen mostrando con la etiqueta de siempre del hogar: lo viejo no cambia
  y la clase del renglón sale de sus lados.
- El faltante de Inicio de una deuda que se paga sola aparece en la semana de su vencimiento, por lo que va a
  poner Maun.
- «Qué es» del panel de un paso dice el tipo con estas palabras, con la ayuda de ese tipo, y editando ofrece en
  qué se convierte el tesoro («Deuda obligatoria» o «Caja», o «Meta» si tiene objetivo): por dentro sigue
  eligiendo entre compromiso y ahorro fijo. La ayuda de «cada tipo de paso» se fue con eso.
- El nombre accesible de cada ficha de la fila sigue empezando por su lugar («Compromiso 3 de 3: Gastos fijos…»),
  como los grupos de la fila (Obligaciones, Compromisos, Ahorros), y lo que se ve arriba del nombre dice el tipo.
  Pasarlo a las palabras de los tipos cambia los textos de la fila en tres idiomas y los tests que la recorren:
  queda para otro PR.

## Diferencias con lo pedido

- El pedido suponía que la hoja de archivar saca de la fila al tesoro que está en ella. El camino de hoy no lo
  hace: con la fila guardada, pide sacarlo de la fila primero («Sacalo de la fila… Después archivalo»). Cocos
  sigue ese camino tal cual, así que el GALPON de MAUN, que está en el reparto, se archiva después de sacarlo.

## Objeciones

- **Maun en negativo.** Eliseo lo pidió así, y la deuda interna no se devuelve sola: si los cobros no alcanzan
  varios ciclos seguidos, el negativo de Maun crece sin que nada lo frene. Se ve en Maun y en cada pago, pero
  convendría que algún día la app le proponga devolverla.

- **La novedad con siete líneas.** El pedido trae seis líneas para la novedad, tal cual, y pide una más si el punto
  7 cambió algo que Eliseo ve (lo cambia: la ficha y el cobro ya no toman el día de la seña). La regla de
  `AGENTS.md` (que controla `novedades.test.ts`) dice tres o cuatro, de hasta 200 caracteres, y la sexta pasa de 200
  en los tres idiomas. Van así, con una excepción para esta versión en el test (`PEDIDAS_TAL_CUAL`), y la regla
  sigue igual para las que vengan. Siete cosas en un aviso que sale solo es mucho para leer de una vez.

## Alternativas descartadas

- **Guardar el tipo del tesoro aparte.** El 0078 ya lo descartó: el tipo sale del lugar en la fila y del
  objetivo, y guardarlo dos veces permitiría que no coincidan.
- **Un ciclo configurable aparte del día de pago.** Un ciclo que corta otro día que el pago hace que el pago se
  lleve lo juntado para el ciclo que viene.
- **Que el pago lo haga la app.** Sin la app abierta el día V, no se pagaría; y dos aparatos podrían pagar dos
  veces. Lo hace la base, una vez por tesoro y vencimiento.
- **Mover por migración la fila, los tesoros o la plata de Eliseo.** Lo nuevo lo activa él al guardar la fila,
  con la hoja que le pregunta.
- **Devolver la deuda interna sola.** No lo pidió.

## Consecuencias

- La primera escritura periódica de la base sobre la plata del dueño: un job de pg_cron que mueve tesoros. Cada
  pago queda como foto en su tabla, idempotente y con su gemela en el comparador.
- La fila suma campos (`montoFijo`, `dia`, `pagaSola`, `pagaSolaDesde`) que una fila de antes no tiene; la base no
  escribe las claves nuevas con su valor por defecto, y el comparador compara la fila de siempre leída.
- Cocos deja de ser especial en la app; su lugar entre los tesoros de siempre queda solo en la base, para los
  talleres que ya lo tienen.

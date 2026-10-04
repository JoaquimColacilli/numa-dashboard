# @maun/domain

Lógica de negocio pura: la plata (`money.ts`), la cascada de distribución (`cascada.ts`), los topes y la liquidación (`liquidacion.ts`), la seña esperada (`sena.ts`), el margen contra los costos estimados (`costos.ts`), el catálogo de lo que hace falta (`necesidades.ts`), la máquina de estados del proyecto (`estados.ts`), las fechas (`fechas.ts`), el libro mayor (`libroMayor.ts`), el CUIT (`cuit.ts`), los datos para cobrar (`cobro.ts`), la agenda con lo que se avisa (`agenda.ts`), la vista del cliente (`vistaCliente.ts`), hasta cuándo vale un presupuesto (`vigencia.ts`), las opiniones de los clientes (`opiniones.ts` y `encuesta.ts`), la respuesta del cliente sobre la entrega (`entrega.ts`), el analítico de entregas (`analitico.ts`), la vidriera del taller con sus redes (`vidriera.ts`), la fila de los tesoros (`fila.ts`), los períodos (`periodos.ts`), la inflación con el índice del INDEC (`inflacion.ts` e `ipc.ts`) las cuentas de Estadísticas (`estadisticas.ts`) y la factura con ARCA y el tope del monotributo (`facturacion.ts` y `monotributo.ts`). Las decisiones están en el ADR 0011, las de la agenda en el 0034, las de la seña en el 0043, las de los costos, lo que hace falta y el día por horas en el 0045, las de la vista del cliente en el 0046 y el 0067, las de los datos para transferir en el 0048, las de las opiniones en el 0057, las de la vidriera en el 0076, las de la fila en el 0078 las de las estadísticas en el 0084 y las de la factura y el monotributo en el 0085.

## Pureza (la aplican las herramientas)

- ESLint rechaza cualquier import que no sea relativo. Los tests solo pueden importar además `vitest`.
- El tsconfig compila con `lib: ES2023` y `types: []`: no existen `window`, `document`, `fetch` ni los globals de Node.
- Nada de I/O, relojes ni aleatoriedad dentro de un cálculo: la fecha de hoy, el mes en curso, los ajustes, los feriados y los montos entran por parámetro. `new Date(numero)` y `Date.UTC` son cuentas; `Date.now()` y `new Date()` sin argumentos, no.
- Imports relativos con extensión `.ts` (`NodeNext` + `rewriteRelativeImportExtensions`), para que `dist` corra en Node y el código fuente pueda leerlo Deno.

## Plata

- `Money` es un `number` entero de centavos con brand (ADR 0002). Nada de decimales ni de `BigInt` de JavaScript. Toda operación corta con `RangeError` si el resultado deja de ser un entero seguro.
- Los porcentajes son `PuntosBasicos` enteros (1000 = 10%). `aplicarPorcentaje` redondea al centavo mitad hacia arriba: `floor((importe × bp + 5000) / 10000)`, la misma cuenta que SQL.
- Dividir por 100 pasa una sola vez, al formatear, y el formateo no vive acá.
- `Money<M>` es genérico en la moneda (pesos por defecto; otra con `centavosEn`), y donde conviven monedas va `Plata`: pesos más dólares no compila (ADR 0081). Un pago tiene dos cuentas, `valorEnPesos` y `loQueDescuenta`, con redondeo a la mitad hacia arriba y gemela en SQL (ADR 0083).
- El dominio no escribe frases: devuelve datos y códigos, o recibe los textos inyectados (`Formatos`, `TextosDeLaVista`), así sirve en los tres idiomas (ADR 0082).

## La cascada

`neta = cobrado − gastos` (lo cobrado, nunca el presupuesto). Si la neta es cero o negativa, todo en cero y la pérdida en el remanente. Si no: diezmo a DIEZMO, sueldo a HOGAR topeado por lo que queda, costos fijos a MAUN topeados por lo que queda, remanente en MAUN. La cascada no sabe de meses: recibe los topes.

No se replican los errores del sistema viejo: el sueldo que suma a HOGAR sin restar de MAUN, el pago de diezmo que no sale de ningún tesoro y la ganancia calculada sobre el presupuesto en vez de lo cobrado. `design-reference/src/lib/format.ts` (`despiece`) todavía calcula sobre el presupuesto: no se porta.

## La liquidación

`calcularLiquidacion` es lo que la app llama antes de cobrar o cerrar como perdido, y lo que la base tiene que congelar:

- `planDeLiquidacion` elige la fecha, el diezmo y los objetivos: los ajustes, la foto de una reapertura, o los parámetros del perdido (sin sueldo y con diezmo, por defecto).
- **Una reapertura toma su fecha y sus objetivos, pero el sueldo va por mes si la foto o los ajustes van por mes** (ADR 0079): por proyecto, solo si los dos lo son. Es la regla de `filaParaLiquidar` y de `private.liquidar`.
- `liquidadoDelMes` suma lo que ya liquidaron los otros proyectos en el mes calendario de la fecha.
- `topesDeLaLiquidacion` saca los topes: los fijos, por lo que falta del mes; el sueldo, por mes o por proyecto según `sueldoTopeMensual`. Desde el ADR 0072 los talleres reparten por mes; por proyecto quedan el seed y lo ya congelado.
- La app le pasa las liquidaciones que tiene replicadas, **incluidas las que todavía están en la cola**, sin el proyecto que se liquida.

`resumenDelMes` es lo que se muestra por mes: objetivo, liquidado y lo que falta, de sueldo y de fijos.

`sueldoDelMes` es lo que mide la barra «Sueldo del mes» de Inicio: el sueldo que pagaron los cobros del mes contra **un** sueldo, el del mes según `resumenDelMes` (el de los ajustes para el mes en curso; el objetivo del último cobro para un mes cerrado). **No suma un sueldo por cobro**: el sueldo que se asigna el dueño es lo que el hogar necesita por mes, y desde el ADR 0072 el reparto también lo topea por mes. Un mes con cobros por proyecto (el seed, o lo congelado antes del cambio) puede pagar de más. Si los cobros pagan más, lo pagado pasa lo esperado y la pantalla lo nombra (ADR 0056, que corrige al 0011). `cobros` cuenta los cobros del mes que pagaron sueldo, no los que tenían objetivo. Ni `resumenDelMes` ni `sueldoDelMes` tienen gemela en SQL: nada en la base los consume.

## La fila (ADR 0078)

`fila.ts` es cómo reparte cada cobro desde que el dueño arma sus tesoros, ordenado por los tipos de tesoro de Eliseo: las obligaciones (el diezmo entre ellas), los compromisos, los ahorros fijos, los ahorros por porcentaje y el superávit. La cascada y los topes de arriba siguen: los usa una app sin actualizar, y la fila de siempre da lo mismo que ellos.

- **La forma**: `obligaciones` (`{ tesoro, porcentaje, base: 'cobrado' | 'ingreso' }`, hasta `TOPE_DE_OBLIGACIONES`), `pasos` (`clase`, `tope`, `renglones` con su `dia`, `desde`, `modo: 'mes' | 'saldo' | 'trabajo'` y `hastaLaMeta`), `reparto` (partes con su `porcentaje` y `hastaLaMeta`), `superavit` (el id del tesoro que recibe lo que sobra) y `sueldoPorTrabajo`.
- **El tipo sale del lugar en la fila y no se guarda**: `sueldo` y `fijos` son compromisos, `prioridad` es ahorro fijo y una parte es ahorro por porcentaje (`tipoDelPaso`, `tipoDelTesoro`; Maun compromiso y superávit a la vez da compromiso: para saber si recibe lo que sobra, `fila.superavit`). Las palabras de la pantalla son las de Eliseo, pero los identificadores (`sueldo`, `fijos`, `prioridad`) no cambian.
- **La fila nombra los tesoros por id**, nunca por clave. `leerLaFila(valor, { diezmo, maun })` completa la clave que falta con lo de siempre (el diezmo al 10% sobre el ingreso, `modo 'mes'`, sin meta, sin día y el superávit en Maun): así se leen las filas guardadas antes de los tipos. Una clave que está con otro tipo, o en null salvo `dia`, no se lee. `filaDeSiempre(ajustes, { hogar, maun, diezmo })` la arma con el diezmo, el sueldo a Hogar y los costos fijos a un paso de Maun con un renglón. `fila.test.ts` la compara en 4.000 casos contra `calcularDistribucion` con `topesDeLaLiquidacion`: si cambia una de las dos, ese test lo dice. No hay fila vacía: toda fila lleva ids.
- **Las reglas viven en `problemasDeLaFila(fila, tesoros)`**, con sus 35 códigos: Hogar solo sueldo y el sueldo solo Hogar, Maun solo gastos fijos, ni Hogar ni Maun como obligación ni en el reparto, el diezmo siempre entre las obligaciones, cada tesoro una vez, los gastos fijos con renglones cuya suma es el tope, un ahorro nunca antes de un compromiso, el modo que admite cada clase, «hasta la meta» solo en un ahorro con meta, los porcentajes del reparto hasta 100%, el superávit que no sea Hogar, el diezmo ni otro tesoro de la fila (Maun sí), y los topes (`TOPE_DE_OBLIGACIONES`, `TOPE_DE_PASOS`, `TOPE_DE_PARTES`, `TOPE_DE_RENGLONES`, `LARGO_MAXIMO_DEL_RENGLON`, `ULTIMO_DIA_DE_PAGO`, `MONTO_MAXIMO_DE_LA_FILA`). A lo sumo un problema por elemento, en este orden: los topes de la fila, cada obligación, `sin-diezmo`, cada paso, cada parte, el reparto, el superávit y el sueldo por trabajo. `TesoroDeLaFila` trae la `meta` (la de Cocos sale de `ajustes`), porque «hasta la meta» pide un tesoro con meta. `modosPosibles` y `admiteLaMeta` son las reglas de `modo-invalido` y `meta-fuera-de-ahorro`: usalas para ofrecer solo lo que se puede guardar. `modoInicial` dice cómo arranca un paso nuevo: un compromiso de gastos fijos, «se renueva al pagar» (salvo Maun); lo demás, por mes. Una fila guardada no puede ser `sueldoPorTrabajo`: ese modo existe solo en la fila de siempre (ADR 0072). La pantalla muestra los textos y la base rechaza con `MN023`.
- **La cuenta es `repartir`**: si lo cobrado menos los gastos no es positivo, no reparte nada. Cada obligación es su porcentaje de lo cobrado o de lo que le llega, redondeado mitad hacia arriba como el diezmo (`aplicarPorcentaje`) y nunca más que lo que llega; el diezmo es la primera con el id del diezmo (`diezmo: true` en el plan). Cada paso recibe hasta lo que le falta. Cada parte del reparto se redondea hacia abajo al centavo, sin pasar su tope, y el resto con esos centavos es del superávit: así la parte de un tesoro no depende de las demás. `libre`, `ganancia` y `sobrante` son el ingreso libre, lo que queda después de los compromisos y lo que se reparte por porcentaje.
- **Lo que un paso ya tiene depende de su modo** (`previoDelMes(plan, delMes, saldos, metas)`): por mes, lo del mes (`loDelMes` suma las liquidaciones del mes, con sus `aportes`, y las coberturas); si se renueva o se repone, el saldo del tesoro, nunca menos de cero; por trabajo, cero. **La meta** entra por ahí: un paso nunca arranca con menos que su monto menos lo que le falta para la meta, así `repartir` no cambia para los pasos, y una parte lleva de tope lo que le falta. Un tesoro sin meta mayor que cero junta sin fin.
- **`calcularPorLaFila`** es lo que la app llama antes de cobrar y lo que la base congela; recibe `sistema`, los saldos por id y las metas. Cada paso trae `lleva` (lo que tiene según su modo, que es lo que se muestra) y `llegaALaMeta`. `columnasDeSiempre` llena las columnas de siempre de `proyectos` (el diezmo es el de su obligación). `repartosDelCobro` son las filas de `repartos` en su orden: las obligaciones que no son el diezmo, los pasos, las partes y el superávit si no es Maun. `previoQueVio` es `p_previo` y `dist_previo` (un número por paso, ya con el piso de la meta, y uno por parte con tope), `previoDeLoVisto` lo lee y `loVistoEsOtro` dice si el cobro salió ajustado.
- **El mes es `filaDelMes(fila, sistema, datos, mes)`**, en el orden de la fila: cada obligación con lo apartado y lo que tiene a pagar; cada paso con su `tipo`, lo que lleva según su modo, lo que le falta (null por trabajo), lo que tiene a pagar (null en Hogar, Maun y los ahorros), sus vencimientos y su meta; cada parte con su meta, y el superávit. `vencimientosDelPaso` da un vencimiento por renglón con día: el último del mes si el mes no tiene ese día, y pagado si hay un gasto desde ese tesoro en ese mes con el renglón como categoría (`claveDelNombre`).
- **Editar devuelve una fila nueva**: `ponerObligacion`, `moverObligacion`, `cambiarLaObligacion`, `ponerPaso`, `moverPaso`, `ponerDespues`, `cambiarElPaso`, `cambiarLaClase`, `ponerEnElReparto`, `cambiarLaParte`, `ponerElSuperavit`, `sacarDeLaFila` y `conDesde`. Un paso queda siempre adentro de su tipo: los compromisos van antes que los ahorros fijos, y uno que cae entre los del otro tipo va al borde del suyo. `cambiosDeLaFila(antes, despues)` es la lista de lo que cambió (obligaciones, pasos, reparto y superávit), la que muestra la hoja de guardar.
- **Sus gemelas son siete** (abajo, en «Gemelos en SQL»), y el comparador las ata con casos con semilla, la cuenta entera de un cobro y los vectores fijos, los de redondeo y los de los tipos.

## El libro por tesoro (ADR 0078)

- **`libroMayor.ts` lleva la cuenta por id de tesoro.** `DatosDelLibro` suma `tesoros` (`{ id, clave }`) y `repartos`, cada movimiento trae `desdeId` y `haciaId`, y cada línea y cada asiento llevan el id además de la clave, que es null en los tesoros del dueño. Si a un movimiento le falta el id, sale de la clave, como en la base: una réplica guardada antes de las columnas trae solo la clave.
- **Los repartos de un cobro por la fila son líneas de origen `reparto`**, de Maun a su tesoro, salvo Maun y los ceros, como en la vista.
- **`saldosPorTesoro` sigue devolviendo las cuatro claves**, porque lo usa la migración del sistema viejo; `saldosPorId`, `saldosDelLibroPorId` y `entradasYSalidasPorId` son los de cualquier tesoro. `Tesoro` sigue siendo el tipo de las cuatro claves.

## La seña

`calcularSena` es la resta que el dueño pidió: cuánto es la seña, cuánto cobró y cuánto falta. La seña es un porcentaje del presupuesto (`ajustes.sena_bp`, la mitad por defecto) y se puede pisar por trabajo (`proyectos.sena_bp`); `porcentajeDeLaSena` dice cuál manda. Devuelve una unión con tres situaciones, no números sueltos: **sin presupuesto no hay seña** y lo dice, y cuando ya la cubrió dice cuánto de más en vez de un negativo. Lo cobrado que recibe incluye la plata de la visita del relevamiento, porque el contacto y el trabajo son la misma fila (ADR 0019).

**Su gemela en SQL es `private.sena_esperada`** (ADR 0067): la vista del cliente manda la seña en pesos y el pago que toca, y los dos salen de esa función. El comparador la ata con `calcularSena().esperada`; si cambiás una, cambiás la otra en el mismo PR. La base guarda los dos porcentajes, con su `check` de rango.

**La seña es un importe, no un pago.** Ningún pago es «la seña», ni por su nombre ni por su orden: lo pagado antes de aprobar, el relevamiento incluido, queda a cuenta de ella.

## El margen y lo que hace falta (ADR 0045)

- `calcularMargen` es la otra resta que pidió el dueño: el presupuesto menos lo que calcula gastar. Las cuatro categorías son fijas (`CATEGORIAS_DE_COSTO`: madera, herrajes, flete, ayudante) y **null no es cero**: null es «todavía no lo estimé» y cero es «este trabajo no lleva flete». Devuelve una unión de tres situaciones, no números sueltos, y **el margen puede ser negativo**: eso es justamente lo que hay que ver. **No hay ninguna función que vaya del costo al presupuesto**, y no la agregues: el presupuesto incluye la ganancia, que la decide él.
- `catalogoDeNecesidades` arma el catálogo de nombres desde las filas que ya existen: no hay tabla de catálogo. Ordena por lo más usado, después por lo más reciente y después alfabético, para que la lista no baile. `claveDelNombre` compara sin acentos ni mayúsculas, y `sugerenciasDeNecesidad` pone adelante lo que **empieza** con lo escrito y descarta lo que ya está escrito igual. El catálogo es **de un tipo**: un material no se sugiere en las herramientas.
- **El orden de los segmentos es `TIPOS_DE_NECESIDAD` y en ningún otro lado** (ADR 0060): material, herraje, herramienta. `segmentosDeLoQueHaceFalta` los arma en ese orden, siempre los tres, y `cuentaDeLoQueHaceFalta` es la suma de los segmentos. Un tipo nuevo va acá y en el enum de la base (`packages/db/src/necesidades.test.ts` ata los dos), no en el orden del enum.
- **Editar un ítem**: `cantidadEditada` (entero mayor que cero; vacía o en cero vuelve a la anterior) y `nombreEditado` (recortado y cortado en `LARGO_MAXIMO_DEL_NOMBRE`; en blanco vuelve al anterior). El alta usa `cantidadEscrita` y `nombreEscrito`, las mismas cuentas. `esNombreDeNecesidad` es **gemela del `check` `necesidades_nombre_valido`**, y cuenta caracteres, no unidades de UTF-16, como `char_length`.

## La vista del cliente (ADR 0046)

`vistaDelCliente(trabajo, hoy)` es el único cálculo de la pantalla que ve el cliente: el camino de
hitos, el relevamiento, la línea de tiempo curada, qué sigue, y **qué se lee primero**.
Recibe el payload que armó la base y no puede filtrar nada, porque lo que no puede ver no le llega.
**Es el único lugar donde una etapa interna se traduce a lo que ve el cliente** (ADR 0058): la base
manda el dato crudo y la pantalla dibuja. El test «qué ve el cliente en cada etapa del trabajo» lo
fija caso por caso; una etapa o una variante nueva entra ahí.

- **La vista es una unión por etapa** (ADR 0067): `VistaAntesDelPresupuesto`, `VistaEsperandoLaSena`
  o `VistaAprobada`. Lo que no es cierto en una etapa no está en su tipo: esperando la seña no hay
  tarjeta ni entrega. La pantalla hace `switch` por `etapa`, y `estaAprobada` estrecha el tipo.
- **Un hito o un evento existe si hay un registro con fecha de que pasó**, no un campo cargado
  (ADR 0067): la aprobación sale de `fechas.aprobado` y solo aprobado; «Empezamos», aprobado y con el
  inicio ya llegado; «Lo llevamos», entregado. Cada pago es «Recibimos tu pago», salvo el que salda.
  `senaDelTrabajo` dice si la seña falta o está cubierta con `sena` y `pago.instancia`.
- **La proyección de la entrega es `proyeccionDeLaEntrega` y no se calcula en otro lado** (ADR 0067):
  `entregaEstimada` contada desde la fecha límite (`fechas.valeHasta`), no desde hoy. El día que haya
  una cola del taller, cambia esa función.
- **El camino tiene cinco hitos, o seis con el estimativo adelante** (ADR 0058): solo en los trabajos
  que lo tuvieron (`tuvoEstimativo`: la etapa actual o `fechas.estimativo`). **Compará por paso, nunca
  por posición**: `llegoAl(vista, 'aprobado')`, no un índice, porque con el estimativo el índice se
  corre uno.
- **El camino tilda lo que pasó y deja en curso lo que falta** (ADR 0070): `pasado` es un hecho, con
  la fecha del hecho; `actual` es el paso que se está haciendo o esperando (`pasoEnCurso`, por etapa y
  seña), sin fecha salvo la fabricación ya arrancada; `futuro`, lo que viene. **El paso en curso no es
  `hitoActual`**: con el presupuesto mandado, `hitoActual` sigue siendo el presupuesto (el titular, lo
  próximo, la nota y el dibujo salen de ahí) y el amarillo es la aprobación. El titular es
  `vista.titular`, no el texto de un paso.
- **Al llegar al último paso, el camino queda completo** (corrección del ADR 0046): todos los hitos
  van `pasado` y ninguno `actual`, y el titular es «Listo, está saldado». No dejes el último en
  `actual`: la pantalla pinta el actual en ámbar, como algo en curso, y un trabajo terminado parecía a
  medio camino.
- **La seña cubierta antes de aprobar no se vuelve a pedir**: el paso en curso dice «Cuando lo
  apruebes», lo próximo «Lo próximo es que lo apruebes.» y `textoDeLaProyeccion` recibe la situación
  de la seña. Con la seña en falta o sin presupuesto, los textos del dueño quedan palabra por palabra.
- **Si la visita está pendiente o hecha lo decide `relevamientoDelTrabajo`** con la etapa, el día y
  la marca de la visita, y no existe donde no hace falta medir. La tabla de cada caso está en el ADR 0058. Nunca promete un día que ya pasó, y la visita de hoy no se da por hecha sin la marca.
- **La nota de la (i) la arma `notaDelRelevamiento(vista, formatos)`** (ADR 0059): solo en los pasos
  del presupuesto, y con el texto, las líneas y el resumen del titular ya escritos. Dice de qué paso
  cuelga (`hito`, que es `hitoActual`: el mismo paso de siempre, que ahora puede estar ya tildado,
  ADR 0070). Las fechas llegan
  formateadas por `formatos`, porque el formateo no vive acá. Sin estimativo y sin medir no hay nota:
  no hay número que pueda cambiar.
- **El bloque «Relevamiento técnico» es `relevamientoPorHacer`**, solo en la vista antes del
  presupuesto (ADR 0079): sale con la visita pendiente, deja `sigue` vacío mientras se ve y lleva el
  valor del trabajo (`valorDelRelevamiento`) o `null`. El importe lo formatea la pantalla.
- **El foco se invierte solo y no es configurable**: hasta la entrega manda la etapa y el saldo va
  completo en la fila de abajo; desde la entrega con saldo pendiente, manda el saldo. Es
  `foco: 'saldo' | 'estado'` y sale de haber llegado a la entrega con `saldo > 0`.
- **Los hitos que faltan no llevan fecha**: prometer un día de «pagado» sería inventarlo.
- **Los eventos no llevan el importe adentro del texto**: va en `monto`, y el formateo no vive acá.
- **Sin porcentajes de avance**: nadie sabe si un mueble está al 60%.
- **La vista del cliente no dice nunca cuánto hace que pasó algo** (corrección del ADR 0046). Ni «Hace N días», ni «hace N días que no hay novedades»: el cliente ve la fecha y qué sigue. Los «hace N días» son de la app del dueño, que los usa para su lista de pendientes. `vistaCliente.test.ts` lo exige sobre el JSON entero de `vistaDelCliente`, y exige que «lo próximo» no tenga ni un dígito en ninguna etapa.
- **Lo que agregue una versión nueva al payload, leelo tolerando que falte** (`trabajo.fechas as Partial<…>`, `trabajo.visita as … | undefined`): el objeto puede venir de la versión anterior.
- **`cobro` son los datos para transferirle al taller** (alias, CBU o CVU, titular y CUIT, ADR 0048): llegan del payload, y `hayComoTransferir` dice si alcanza para mostrar el bloque. El titular y el CUIT solos no alcanzan: con eso no se transfiere.
- **No tiene gemela en SQL**: la base arma el payload, no la presentación.

## La entrega (ADR 0071)

- **Listo no es un estado**: es `fechas.listo`, y la vista tiene una etapa más, `listo` (en curso y listo). El titular es «Tu mueble está listo», el paso 4 dice «Listo para entregar» y el camino **no suma un paso**.
- **`vista.titular` es un texto o `{ comprometida }`**: con una comprometida que no pasó, la pantalla arma la buena noticia con su fecha y su franja. El formateo no vive acá.
- **Ninguna fecha que ya pasó llega al cliente**: una comprometida vencida no es titular ni tarjeta («Entrega» «A confirmar») y un día propuesto que pasó no es un pedido. `vista.coordinacion` existe solo con el mueble listo y sin comprometida: `sin-pedido`, `un-dia` o `sus-dias`, con la última respuesta.
- **`validarRespuestaDeEntrega` (`entrega.ts`) es gemela de `private.validar_respuesta_de_entrega`**, con el mismo orden de revisiones. Los días van de pasado mañana a 30 días (`DESDE_CUANTOS_DIAS`, `HASTA_CUANTOS_DIAS`), sin domingos (`sePuedeElegir`), hasta diez, con la mañana, la tarde o las dos; la nota hasta 500 caracteres contados como en la encuesta. `armarRespuestaDeEntrega` deja la respuesta como la guarda la base: los días en orden y las franjas en el orden del enum.
- **La agenda pone la entrega en la comprometida si la hay**, con su franja y sin hora, y esa **no se arrastra** (`puedeArrastrarse`): se cambia desde la ficha.

## La vidriera y las redes del taller (ADR 0076)

- **Cada red tiene una sola forma guardada, la canónica, y el `check` de la base exige esa o vacío**: `https://www.instagram.com/<usuario>/`, `https://www.tiktok.com/@<usuario>`, y `https://www.facebook.com/<nombre>` o `.../profile.php?id=<número>`, en minúscula. `revisarLaRed` lee lo que escribió el dueño (`@usuario`, `usuario` o el link, con o sin `https` y `www`, en Facebook también `m.` y `web.`, con barra, parámetros o ancla) y devuelve válido con el link, vacío, o inválido con su motivo: `otra-red`, `no-es-un-perfil` o `usuario`. Cada motivo tiene su mensaje en la app: no los juntes.
- **`esLinkDe…` son las gemelas de los `check`**, y `SEGMENTOS_QUE_NO_SON_UN_PERFIL` es la lista de los arreglos del SQL (en Instagram, `p`, `reel`, `stories`…; en Facebook, `share`, `groups`, `watch`…, más `profile.php` sin id). Si cambiás una, cambiás la otra con una migración nueva, en el mismo PR y antes del `db push`: arreglar un `check` ya subido es destructivo.
- **Lo que decide la lectura** está en el ADR: un link al perfil con una pestaña es el perfil; en TikTok, sin la `@` o un enlace corto (`vm.`, `vt.`) no es un perfil; en Facebook, un número solo es `profile.php?id=`.
- **Cómo se ve cada una** (`comoSeMuestraLaRed`, `formaCortaDeLaRed`): `@usuario` en Instagram y TikTok, «Facebook» en Facebook. `redesALaVista` y `redParaCompartir` las recorren en el orden de `REDES_DEL_TALLER`: Instagram, Facebook y TikTok.
- **El tope y el orden**: `TOPE_DE_LA_VIDRIERA` (12, el mismo del trigger de `MN022`), `lugaresLibres`, `enOrden` (por `orden`, la fecha de alta y el id), `ordenAlFinal` y `moverEnLaVidriera`, que devuelve solo las filas que cambian de `orden` y, si hay `orden` repetidos, renumera la lista.
- La vista del cliente lee la `vidriera` con `?? VIDRIERA_VACIA`: un payload de antes no la trae.

## El analítico de entregas (ADR 0071)

- **Los umbrales viven en `analitico.ts` y en ningún otro lado**: `UMBRAL_MEDIANA` (5: por debajo, los casos uno por uno), `UMBRAL_CUENTAS` (10: «k de n»), `UMBRAL_PORCENTAJE` (20: recién ahí el %), y `DIAS_DE_ACIERTO` (3). Una pantalla lee `resumen.modo` y si la cuenta es `null`, no compara contra 5.
- `analisisDeEntregas(trabajos, cambios)` toma **la primera estimada** de la historia de cada trabajo entregado y la compara con el día en que se entregó; `importada` dice si esa primera es la que tenía cargada al empezar la historia. Agrupa por tipo sin acentos ni mayúsculas (`claveDelNombre`) y los sin tipo aparte (`SIN_TIPO`).
- No tiene gemela en SQL: la base guarda la historia y no la resume.

## Las estadísticas (ADR 0084)

- **Los umbrales nuevos viven en `estadisticas.ts`** (`UMBRAL_DE_COMPARACION`, `UMBRAL_DEL_EMBUDO`, `PRIMEROS_DE_LO_QUE_MAS_USAS`, `RENGLONES_DE_LO_ESTIMADO`, `MESES_DE_LO_NORMAL`, `PASO_CONFORME`); los de antes se importan de `analitico.ts` y `opiniones.ts`. La pantalla lee el modo que devuelven las cuentas, nunca compara contra un número.
- **Las ataduras son tests y no se aflojan**: la cifra de un período es la suma de `filaDelMes(...).ingreso` de sus meses, ③ en «Todo» da lo mismo que `analisisDeEntregas`, cada lista suma su cifra y lo gastado en los trabajos es la suma de los gastos del período.
- **`ipc.ts` es generado** por `pnpm --filter @maun/db db:ipc`: no se edita a mano. La regla de los pesos de hoy está en `inflacion.ts`: los meses posteriores a la base van como están (`MESES_SIN_PUBLICAR`), y con el índice viejo no se deflacta nada.

## Hasta cuándo vale un presupuesto (ADR 0067)

- `DIAS_QUE_VALE_UN_PRESUPUESTO` es 15, el mismo default de `ajustes.presupuesto_vale_dias`: la app lo usa solo si la fila de ajustes es de antes de la columna.
- `seMandaElPresupuesto(desde, hacia)`: entrar a «presupuesto enviado» desde una etapa anterior, o nacer ahí. Volver de seguimiento, de perdido o de un trabajo aprobado **no** es mandarlo, y no renueva la fecha.
- `vencioElPresupuesto(valeHasta, hoy)` es el único criterio de vencido: el día mismo todavía vale. Lo usan la proyección del cliente y el aviso de la app del dueño.
- No tiene gemela en SQL: la base guarda la fecha y no la calcula.

## Las opiniones (ADR 0057)

- **Los umbrales viven en `opiniones.ts` y en ningún otro lado**: `UMBRAL_BARRAS` (12: hasta 11, un punto por persona), `UMBRAL_EVOLUCION` y `UMBRAL_MESES` (12 respuestas **y** medio año para mostrar la evolución), `TOPE_PREGUNTAS` y `TOPE_PROPIAS`. Lo que se muestra lo decide `modoDeMostrar`, y la barra repartida es solo para las preguntas con polos. **Una pantalla no compara contra 12**: lee `resultado.modo` y `evolucion.conEvolucion`.
- **`resumenDeOpiniones(datos, hoy, escalas)` es todo Resultados**, calculado en el aparato desde la réplica: la titular con su promedio y su cuenta, lo enviado y lo contestado, la distribución de cada pregunta, sus versiones anteriores aparte, las archivadas aparte, los comentarios, la evolución y lo que no se leyó. **Las propias de un trabajo no entran en ningún número general.**
- **El dominio no escribe frases** (ADR 0082): las etiquetas de cada escala llegan en `TextosDeLasEscalas`, que reciben `resumenDeOpiniones`, `pasosDe`, `pasoDe` y `lineasDeLaRespuesta`; el dueño las inyecta de su catálogo y el cliente del suyo. `promedio` devuelve `{ decimas, n }`, `queTieneLaEncuesta` devuelve números y `menosDeMinutos` los minutos: la pantalla arma la frase y nunca muestra un porcentaje solo («53% (9 de 17)»).
- **`comoGuardar` decide qué es una versión nueva**: en el lugar si nadie la vio; se pregunta si ya la contestaron y cambió el texto; versión nueva sin preguntar si cambió cómo se contesta y ya salió. La base sostiene lo mismo (`MN013`, `MN014`). `sePuedeBorrar` repite la regla de borrado del trigger para que la pantalla no mande un borrado que la base rechazaría; **no la ata el comparador**: si cambia una, se cambia la otra a mano, y `26_opiniones.sql` y sus tests las cubren por separado.
- **`validarRespuesta` (`encuesta.ts`) es gemela de `private.validar_respuesta`**, y el orden de las revisiones es parte de la regla: el motivo que devuelve tiene que ser el mismo que el de la base, caso por caso. Los largos se cuentan en puntos de código (`Array.from`), no en unidades de UTF-16, y los blancos que se recortan son los de ASCII, como en SQL.
- `esLinkDeResena` es gemela del `check` de `ajustes.resena_link`.

## El CUIT

`revisarCuit` **avisa, no bloquea** (ADR 0014). Devuelve cuatro estados y no un booleano, porque el caso del módulo 11 que da 10 no tiene una convención única: `verificadorDeCuit` devuelve `null` ahí en vez de elegir entre "inválido" y "mapearlo a 9", y `revisarCuit` lo llama `ambiguo`. El prefijo y el verificador que no cierra también son advertencias. Lo único que la app frena es el largo, y no por el checksum: es el `check` de formato de la base, y un rechazo definitivo tapa la cola.

## Gemelos en SQL

- `private.cascada` y `private.transicion_valida`, en la migración `20260911200100_cascada_estados_y_cobro.sql`.
- `private.topes_de_la_liquidacion`, `private.liquidacion_valida`, `private.reversion_valida` y el bloque de objetivos y la suma del mes de `private.liquidar`, en `20260911210000_topes_mensuales_y_perdido.sql`.
- **`asientosDelLibro` y `saldosPorTesoro` contra la vista `public.libro_mayor`**, que es el estado vivo del esquema (`supabase/esquema.sql`), no el archivo de la migración: los dos difieren y el archivo está desactualizado (ADR 0013 y 0014).
- **`validarRespuesta` contra `private.validar_respuesta` y `esLinkDeResena` contra el `check` de `ajustes.resena_link`**, en `20260921180000_opiniones_de_los_clientes.sql` (ADR 0057).
- **`esNombreDeNecesidad` contra el `check` `necesidades_nombre_valido`** (`compararNombreDeNecesidad`, ADR 0060).
- **`validarRespuestaDeEntrega` contra `private.validar_respuesta_de_entrega`** (`compararValidacionDeRespuestasDeEntrega`, ADR 0071), en `20260925120100_la_puerta_de_la_entrega.sql`.
- **`esLinkDeInstagram`, `esLinkDeFacebook` y `esLinkDeTiktok` contra los `check` de `ajustes`** (`compararLinksDeLasRedes`, ADR 0076), en `20260926120000_la_vidriera_del_taller.sql`.
- **`fila.ts` contra `private.entero_de_json`, `private.repartir_por_la_fila`, `private.fila_de_siempre`, `private.problema_de_la_fila`, `private.plan_del_reparto`, `private.previo_del_mes` (`previoDelMes`) y `private.lo_del_mes_es_otro` (`loVistoEsOtro`)** (`compararFila`, con la cuenta entera de un cobro, y las liquidaciones por la fila de `ESCENARIOS_DE_LIQUIDACION`, ADR 0078), en `20260927120200_la_fila.sql` y `20260928120200_las_gemelas_por_tipos.sql`. La suma del mes y los saldos de `private.liquidar` son la otra mitad de `loDelMes` y de `previoDelMes`, y los escenarios las atan. Rechazan con 22004, 22023 y 22003 donde el dominio tira `RangeError`.
- **`asientosDelLibro` por id contra `libro_mayor.tesoro_id`** (`compararLibroMayor`, ADR 0078): los saldos se comparan por id de tesoro.
- **`condicionIvaDelReceptor`, `cuitValido`, `documentoDelReceptor` y `loQueFaltaParaFacturar` contra `private.condicion_iva_del_receptor`, `private.cuit_valido`, `private.documento_del_receptor` y `private.lo_que_falta_para_facturar`** (`compararFacturacion`, ADR 0085), en `20261003130200_pedir_la_factura.sql`.

`lineasDelLibro` **no tiene gemela en SQL y no la necesita**: es la forma sin partir de lo mismo, y
`asientosDelLibro` es literalmente `lineasDelLibro(...).flatMap(asientosDeLaLinea)`. Nada en la base
consume una línea —la vista existe para sacar saldos, y los saldos siguen saliendo de los asientos—,
así que la comparación contra `libro_mayor` la cubre por construcción: si una línea estuviera mal, sus
asientos estarían mal. Una línea es una operación (una transferencia es **una**, con origen y
destino); un asiento es un lado (ADR 0018).

**Todo cambio acá lleva el cambio en SQL, con una migración nueva, en el mismo PR.** `packages/db/tests/dominio-vs-sql.test.ts` los compara contra la base y falla si divergen en un solo caso.

## La factura con ARCA y el monotributo (ADR 0085)

- **`facturacion.ts` son las reglas de la Factura C que no dependen de ARCA:** a quién se le factura y con qué documento (`documentoDelReceptor`, `nombreDelReceptor`, `domicilioDelReceptor`), el umbral del DNI mirado por trabajo (`UMBRAL_DE_IDENTIFICACION_CENTAVOS` contra `operacionDelTrabajo`), lo que falta para facturar en el orden de la base (`loQueFaltaParaFacturar`), los números con ceros (`nombreDelComprobante` dice «Factura C 00003-00000042» igual en los tres idiomas), el importe y las fechas como los quiere ARCA, el QR y lo facturado en los últimos 12 meses contra el tope (`estadoDelTope`, con su `porcentaje` truncado).
- **El QR va con un base64 propio** (`enlaceDelQr`): el dominio no tiene `btoa`.
- **`NOMBRE_DE_LA_CONDICION_DEL_RECEPTOR` va en castellano y no se inyecta**: es lo que dice el PDF fiscal, que va siempre en castellano.
- **`monotributo.ts` guarda la escala de ARCA en `ESCALAS_DEL_MONOTRIBUTO`**, una por vigencia, y `escalaVigente(hoy)` elige la de hoy. Cada febrero y agosto se suma la nueva, sin pisar la anterior (`AGENTS.md`).

## Estados

`TRANSICIONES` lista solo lo que el usuario cambia a mano: 38 transiciones, ninguna hacia ni desde un estado liquidado. Dentro de las consultas (`ESTADOS_DE_CONSULTA`: cinco etapas desde el ADR 0038, con `presupuesto_estimativo` entre contacto y relevamiento) se va y viene, y desde cualquiera se aprueba. **`en_seguimiento`** (ADR 0064) es el «por ahora no»: se entra desde cualquier consulta y se vuelve a cualquier consulta, las diez transiciones que se sumaron, pero **no se aprueba desde ahí**: hay una sola puerta para aprobar, la de las consultas, donde se carga la seña. `Fase` agrupa los estados en las cuatro pestañas: consultas, seguimiento, activos e historial. Llegar a `cobrado` o a `perdido` y salir de ahí son operaciones de la base, no transiciones (perder también desde `en_seguimiento`; revertir un perdido vuelve solo a una consulta):

- `puedeLiquidar` (`puedeCobrar`, `puedeCerrarPerdido`) dice desde dónde se llega.
- `puedeRevertir` (`puedeReabrir`, `puedeReactivar`) dice a dónde se vuelve.

## La agenda (ADR 0034)

- **`eventosDeLaAgenda(datos, rango)` calcula lo que sale de los trabajos; nada de eso se guarda.** Entrega con `entregaEstimada`: pendiente si la obra está `en_curso`, hecha si está `entregado` o `cobrado`. Visita con `fechaVisita`: pendiente mientras el trabajo está en seguimiento, hecha con `visitaHecha`, en cualquier estado. Presupuesto si está en seguimiento, ni en `presupuesto_enviado` ni en `presupuesto_estimativo` (los dos esperan al cliente), con `vencimientoPresupuesto`. Suma los vencimientos y las anotaciones del rango y ordena por fecha, lo que tiene hora primero, la hora, el peso de la categoría y el texto.
- **Todo evento lleva `hecha` e `importante`, propio o derivado** (ADR 0042). **`hecha` sale de un hecho, nunca de la posición en el embudo**: la entrega, del estado, porque entregar y volver al taller mueven el estado de verdad; la visita, de `visitaHecha`, que cambiar de etapa no toca. Si agregás un derivado, decidí primero de qué hecho sale su `hecha`.
- **Todo evento lleva `hora`, propio o derivado** (ADR 0045). La entrega y la visita salen de `proyectos.entrega_hora` y `proyectos.visita_hora`; el vencimiento del presupuesto es un plazo y nunca lleva. El orden ya ponía lo que tiene hora antes de lo que no.
- **`diaPorHoras(eventos, rango)` parte un día en la franja de todo el día y los renglones por hora.** El rango por defecto es `HORARIO_DEL_TALLER` (07 a 20) y **se estira solo para que nada quede escondido**: si hay algo a las cinco, la grilla empieza a las cinco. `TODO_EL_RELOJ` es el reloj entero.
- **Volver a escribirle es el cuarto derivado** (`seguimiento`, ADR 0064): sale de cada próximo contacto de un trabajo `en_seguimiento`. Pendiente en su fecha; hecho con `hechoEl`, **en el día en que se le escribió**, no en el previsto. El título es el nombre del cliente y el lugar, el trabajo con la nota. Mientras el trabajo está en seguimiento no sale el vencimiento del presupuesto. Se avisa a la mañana con su propia preferencia, `seguimientos`.
- **El vencimiento es la tercera clase de evento** (`clase: 'vencimiento'`, `EventoVencimiento`, ADR 0078): el renglón con día de pago de un compromiso de la fila, en su día de cada mes, con el tesoro, su nombre, el renglón y el monto. **No es un derivado**: `EventoDerivado` pide un trabajo y un cliente, así que su categoría está en `CategoriaDeAgenda` y no en `CategoriaDerivada`. No tiene hora ni trabajo, `importante` va siempre en false, `hecha` es que se pagó, y en el día va después de volver a escribirle. Todo `switch` sobre `evento.clase` tiene tres ramas.
- **Los vencimientos no se guardan: los arma quien arma los datos** con `vencimientosDeLaFila(entrada, meses)`, desde la fila, los nombres de los tesoros, el mes en que se guardó la fila (`AAAA-MM`, no el timestamp) y los gastos de los tesoros. Cada paso aparece desde su `desde`, o desde el mes del guardado, nunca antes; si el mes no tiene el día, va el último. `DatosDeLaAgenda.vencimientos` es obligatoria, y se avisa con su preferencia, `vencimientos`.
- **`puedeArrastrarse(evento)` es `!evento.hecha`, salvo el seguimiento, la entrega comprometida y el vencimiento, que nunca se arrastran.** Lo hecho figura en el día en que estaba prometido y moverlo sería reescribir lo que pasó; cambiar el día de un contacto es registrarlo, y eso deja historia; el día de un vencimiento sale de la fila.
- **`eventosParaAvisar(datos, hoy, preferencias)` usa la misma función.** La anticipación es una ventana, de hoy a N días, no un día exacto. Salen lo inactivo y lo hecho.
- `vencimientoDelPresupuesto` son `DIAS_HABILES_PARA_PRESUPUESTAR` (5, una semana de trabajo) días hábiles (ADR 0038). `sumarDias` y `diasEntre` cuentan en UTC sobre fechas `AAAA-MM-DD`: sin librería de fechas y sin `Temporal`. Los meses van como `AAAA-MM`: `esMes`, `mesesDelRango` (los dos incluidos) y `diaDelMes` (el día, o el último del mes).
- **No tiene gemela en SQL: la base no calcula eventos.** La función de borde de los avisos importa este código fuente con Deno, que es otra razón para los imports relativos con `.ts`.

## Tests

Vitest, al lado del archivo (`*.test.ts`), con **cobertura del 100%** exigida por `vitest.config.ts`: código sin test rompe `pnpm verify`. Para propiedades sobre muchas entradas se usa un generador determinístico con semilla fija dentro del test (no hay dependencias de testing más allá de Vitest).

## Los datos para transferir (ADR 0048)

`cobro.ts` revisa lo que el dueño carga en Ajustes para que su cliente le transfiera.

- **`revisarCbu` valida los dos dígitos verificadores**, con el algoritmo del BCRA («clave 10 con el ponderador 9713», t.o. SNP): el primero sobre las siete posiciones del banco y la sucursal, el segundo sobre las trece de la cuenta. El `(10 - resto) % 10` del final importa: cuando el resto da cero el verificador es **0, no 10**, y hay un caso de test que lo ejercita.
- **Un CVU se valida igual que un CBU**: la norma dice que tiene el mismo formato. Lo que cambia es el prefijo, `000`, que es lo único que los distingue (`esClaveVirtual`).
- **Los verificadores no dicen que la cuenta exista**: una entidad inventada como `999` pasa el algoritmo. Lo que agarran es el error de tipeo, que es para lo que están.
- **`revisarAlias` es la lista del BCRA y nada más**: 6 a 20 caracteres, letras, números, punto y guion medio. El guion bajo **no** entra, aunque medio internet diga que sí. Lo que la norma no dice —si puede empezar con un separador, si admite dos seguidos— sale como `aviso`, no como error: acá no se frena por una regla que no está escrita.
- **Los números de los tests son sintéticos**, construidos aplicando el algoritmo. Ninguno es la cuenta de nadie.
